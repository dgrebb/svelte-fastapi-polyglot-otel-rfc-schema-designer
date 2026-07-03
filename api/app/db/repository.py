from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.db.orm import (
    AgentRow,
    ComputeProfileRow,
    TaskRow,
    ToolkitRow,
    WorkflowRow,
    WorkflowStepRow,
)
from app.models.entities import ENTITY_REGISTRY, EntityName


def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


def _row_to_dict(row: Any) -> dict[str, Any]:
    data = {col.name: getattr(row, col.name) for col in row.__table__.columns}
    if "created_at" in data:
        data["created_at"] = _iso(data["created_at"])
    if "updated_at" in data:
        data["updated_at"] = _iso(data["updated_at"])
    return data


ENTITY_TABLE_MAP: dict[EntityName, type] = {
    EntityName.COMPUTE_PROFILES: ComputeProfileRow,
    EntityName.TOOLKITS: ToolkitRow,
    EntityName.AGENTS: AgentRow,
    EntityName.TASKS: TaskRow,
    EntityName.WORKFLOWS: WorkflowRow,
    EntityName.WORKFLOW_STEPS: WorkflowStepRow,
}

FOREIGN_KEYS: dict[EntityName, dict[str, EntityName]] = {
    EntityName.AGENTS: {
        "toolkit_id": EntityName.TOOLKITS,
        "compute_profile_id": EntityName.COMPUTE_PROFILES,
    },
    EntityName.TASKS: {"agent_id": EntityName.AGENTS},
    EntityName.WORKFLOW_STEPS: {
        "workflow_id": EntityName.WORKFLOWS,
        "agent_id": EntityName.AGENTS,
        "task_id": EntityName.TASKS,
    },
}


class EntityNotFoundError(Exception):
    pass


class ForeignKeyError(Exception):
    def __init__(self, field: str, value: str):
        self.field = field
        self.value = value
        super().__init__(f"Referenced {field}={value} not found")


def _validate_foreign_keys(db: Session, entity: EntityName, payload: dict[str, Any]) -> None:
    for field, ref_entity in FOREIGN_KEYS.get(entity, {}).items():
        ref_id = payload.get(field)
        if ref_id is None:
            continue
        table = ENTITY_TABLE_MAP[ref_entity]
        if db.get(table, ref_id) is None:
            raise ForeignKeyError(field, ref_id)


def list_entities(db: Session, entity: EntityName) -> list[dict[str, Any]]:
    table = ENTITY_TABLE_MAP[entity]
    rows = db.query(table).order_by(table.created_at.desc()).all()
    return [_row_to_dict(row) for row in rows]


def get_entity(db: Session, entity: EntityName, entity_id: str) -> dict[str, Any]:
    table = ENTITY_TABLE_MAP[entity]
    row = db.get(table, entity_id)
    if row is None:
        raise EntityNotFoundError(entity_id)
    return _row_to_dict(row)


def create_entity(
    db: Session, entity: EntityName, payload: dict[str, Any]
) -> dict[str, Any]:
    definition = ENTITY_REGISTRY[entity]
    validated = definition.create_model.model_validate(payload)
    data = validated.model_dump()
    _validate_foreign_keys(db, entity, data)
    table = ENTITY_TABLE_MAP[entity]
    row = table(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _row_to_dict(row)


def update_entity(
    db: Session, entity: EntityName, entity_id: str, payload: dict[str, Any]
) -> dict[str, Any]:
    table = ENTITY_TABLE_MAP[entity]
    row = db.get(table, entity_id)
    if row is None:
        raise EntityNotFoundError(entity_id)

    definition = ENTITY_REGISTRY[entity]
    merged = {col.name: getattr(row, col.name) for col in row.__table__.columns}
    merged.update(payload)
    merged.pop("id", None)
    merged.pop("created_at", None)
    merged.pop("updated_at", None)

    validated = definition.create_model.model_validate(merged)
    data = validated.model_dump()
    _validate_foreign_keys(db, entity, data)

    for key, value in data.items():
        setattr(row, key, value)

    db.commit()
    db.refresh(row)
    return _row_to_dict(row)


def delete_entity(db: Session, entity: EntityName, entity_id: str) -> dict[str, Any]:
    table = ENTITY_TABLE_MAP[entity]
    row = db.get(table, entity_id)
    if row is None:
        raise EntityNotFoundError(entity_id)
    data = _row_to_dict(row)
    db.delete(row)
    db.commit()
    return data


def get_workflow_graph(db: Session, workflow_id: str) -> dict[str, Any]:
    workflow = db.get(WorkflowRow, workflow_id)
    if workflow is None:
        raise EntityNotFoundError(workflow_id)

    steps = (
        db.query(WorkflowStepRow)
        .filter(WorkflowStepRow.workflow_id == workflow_id)
        .order_by(WorkflowStepRow.created_at)
        .all()
    )

    nodes = [
        {
            "id": step.id,
            "type": step.step_type,
            "position": {"x": step.position_x, "y": step.position_y},
            "data": {
                "label": step.name,
                "agent_id": step.agent_id,
                "task_id": step.task_id,
                "config": step.config,
            },
        }
        for step in steps
    ]

    edges = [
        {
            "id": f"{dep}->{step.id}",
            "source": dep,
            "target": step.id,
            "type": "smoothstep",
        }
        for step in steps
        for dep in step.depends_on
    ]

    return {
        "workflow": _row_to_dict(workflow),
        "nodes": nodes,
        "edges": edges,
    }


def seed_demo_data(db: Session) -> None:
    if db.query(ComputeProfileRow).count() > 0:
        return

    edge = ComputeProfileRow(
        name="Edge Scout",
        description="Lightweight profile for quick classification and routing.",
        tier="edge",
        vcpus=1,
        memory_gb=2,
        timeout_seconds=60,
    )
    gpu = ComputeProfileRow(
        name="GPU Reasoner",
        description="Heavy reasoning with tool-use loops.",
        tier="gpu-large",
        vcpus=8,
        memory_gb=32,
        gpu_count=1,
        timeout_seconds=1800,
        max_concurrency=2,
    )
    db.add_all([edge, gpu])
    db.flush()

    research_kit = ToolkitRow(
        name="Research Swarm",
        description="Web search, docs, and code execution.",
        tools=["web_search", "read_url", "python_repl"],
        mcp_servers=["brave-search", "filesystem"],
    )
    db.add(research_kit)
    db.flush()

    planner = AgentRow(
        name="Planner",
        description="Breaks goals into orchestrated sub-tasks.",
        model="claude-sonnet-4",
        system_prompt="You decompose complex goals into ordered, delegatable tasks.",
        toolkit_id=research_kit.id,
        compute_profile_id=edge.id,
        tags=["orchestration", "planning"],
    )
    coder = AgentRow(
        name="Coder",
        description="Writes and reviews code changes.",
        model="claude-sonnet-4",
        system_prompt="You write clean, tested code and explain trade-offs.",
        toolkit_id=research_kit.id,
        compute_profile_id=gpu.id,
        tags=["engineering"],
    )
    db.add_all([planner, coder])
    db.flush()

    task = TaskRow(
        title="Summarize competitor launch",
        prompt="Research Acme's new agent platform and produce a 1-page brief.",
        agent_id=planner.id,
        priority="high",
    )
    db.add(task)
    db.flush()

    workflow = WorkflowRow(
        name="Launch Intel Pipeline",
        description="Plan → research → code spike for competitive intel.",
        status="active",
        trigger="manual",
    )
    db.add(workflow)
    db.flush()

    step_plan = WorkflowStepRow(
        workflow_id=workflow.id,
        name="Plan research",
        step_type="agent",
        agent_id=planner.id,
        position_x=0,
        position_y=100,
    )
    db.add(step_plan)
    db.flush()

    step_task = WorkflowStepRow(
        workflow_id=workflow.id,
        name="Run research task",
        step_type="task",
        task_id=task.id,
        depends_on=[step_plan.id],
        position_x=250,
        position_y=100,
    )
    step_code = WorkflowStepRow(
        workflow_id=workflow.id,
        name="Prototype counter-feature",
        step_type="agent",
        agent_id=coder.id,
        depends_on=[step_task.id],
        position_x=500,
        position_y=100,
        config={"output_format": "pull_request"},
    )
    db.add_all([step_task, step_code])
    db.commit()
