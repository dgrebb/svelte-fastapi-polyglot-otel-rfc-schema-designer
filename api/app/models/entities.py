from __future__ import annotations

from enum import StrEnum
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field


class EntityName(StrEnum):
    COMPUTE_PROFILES = "compute-profiles"
    TOOLKITS = "toolkits"
    AGENTS = "agents"
    TASKS = "tasks"
    WORKFLOWS = "workflows"
    WORKFLOW_STEPS = "workflow-steps"


# --- Shared ---


class Timestamped(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(default_factory=lambda: str(uuid4()))
    created_at: str | None = None
    updated_at: str | None = None


# --- Compute Profiles ---


class ComputeProfileCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    tier: Literal["edge", "standard", "performance", "gpu-small", "gpu-large"] = "standard"
    vcpus: int = Field(default=2, ge=1, le=128)
    memory_gb: int = Field(default=4, ge=1, le=512)
    gpu_count: int = Field(default=0, ge=0, le=8)
    timeout_seconds: int = Field(default=300, ge=30, le=86_400)
    max_concurrency: int = Field(default=4, ge=1, le=256)


class ComputeProfile(ComputeProfileCreate, Timestamped):
    pass


COMPUTE_PROFILE_SCHEMA: dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Compute Profile",
    "type": "object",
    "required": ["name", "tier", "vcpus", "memory_gb"],
    "properties": {
        "name": {"type": "string", "minLength": 1, "maxLength": 120, "title": "Name"},
        "description": {"type": "string", "title": "Description"},
        "tier": {
            "type": "string",
            "title": "Tier",
            "enum": ["edge", "standard", "performance", "gpu-small", "gpu-large"],
            "default": "standard",
        },
        "vcpus": {"type": "integer", "minimum": 1, "maximum": 128, "default": 2, "title": "vCPUs"},
        "memory_gb": {
            "type": "integer",
            "minimum": 1,
            "maximum": 512,
            "default": 4,
            "title": "Memory (GB)",
        },
        "gpu_count": {
            "type": "integer",
            "minimum": 0,
            "maximum": 8,
            "default": 0,
            "title": "GPU Count",
        },
        "timeout_seconds": {
            "type": "integer",
            "minimum": 30,
            "maximum": 86400,
            "default": 300,
            "title": "Timeout (seconds)",
        },
        "max_concurrency": {
            "type": "integer",
            "minimum": 1,
            "maximum": 256,
            "default": 4,
            "title": "Max Concurrency",
        },
    },
}


# --- Toolkits ---


class ToolkitCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    tools: list[str] = Field(default_factory=list, description="Tool identifiers (e.g. mcp:github)")
    mcp_servers: list[str] = Field(default_factory=list)
    allowed_domains: list[str] = Field(default_factory=list)


class Toolkit(ToolkitCreate, Timestamped):
    pass


TOOLKIT_SCHEMA: dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Toolkit",
    "type": "object",
    "required": ["name"],
    "properties": {
        "name": {"type": "string", "minLength": 1, "maxLength": 120, "title": "Name"},
        "description": {"type": "string", "title": "Description"},
        "tools": {
            "type": "array",
            "title": "Tools",
            "items": {"type": "string"},
            "default": [],
        },
        "mcp_servers": {
            "type": "array",
            "title": "MCP Servers",
            "items": {"type": "string"},
            "default": [],
        },
        "allowed_domains": {
            "type": "array",
            "title": "Allowed Domains",
            "items": {"type": "string"},
            "default": [],
        },
    },
}


# --- Agents ---


class AgentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    model: str = Field(default="claude-sonnet-4", min_length=1)
    system_prompt: str = Field(default="You are a helpful AI agent.")
    toolkit_id: str | None = None
    compute_profile_id: str | None = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, ge=256, le=200_000)
    tags: list[str] = Field(default_factory=list)


class Agent(AgentCreate, Timestamped):
    pass


class AgentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    model: str | None = Field(default=None, min_length=1)
    system_prompt: str | None = None
    toolkit_id: str | None = None
    compute_profile_id: str | None = None
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=None, ge=256, le=200_000)
    tags: list[str] | None = None


AGENT_SCHEMA: dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Agent",
    "type": "object",
    "required": ["name", "model"],
    "properties": {
        "name": {"type": "string", "minLength": 1, "maxLength": 120, "title": "Name"},
        "description": {"type": "string", "title": "Description"},
        "model": {"type": "string", "minLength": 1, "default": "claude-sonnet-4", "title": "Model"},
        "system_prompt": {
            "type": "string",
            "default": "You are a helpful AI agent.",
            "title": "System Prompt",
        },
        "toolkit_id": {
            "type": ["string", "null"],
            "title": "Toolkit",
            "x-entity-ref": "toolkits",
        },
        "compute_profile_id": {
            "type": ["string", "null"],
            "title": "Compute Profile",
            "x-entity-ref": "compute-profiles",
        },
        "temperature": {
            "type": "number",
            "minimum": 0,
            "maximum": 2,
            "default": 0.7,
            "title": "Temperature",
        },
        "max_tokens": {
            "type": "integer",
            "minimum": 256,
            "maximum": 200000,
            "default": 4096,
            "title": "Max Tokens",
        },
        "tags": {
            "type": "array",
            "title": "Tags",
            "items": {"type": "string"},
            "default": [],
        },
    },
}


# --- Tasks ---


class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    prompt: str = Field(min_length=1)
    agent_id: str | None = None
    priority: Literal["low", "normal", "high", "critical"] = "normal"
    status: Literal["queued", "running", "blocked", "completed", "failed"] = "queued"
    input_payload: dict[str, Any] = Field(default_factory=dict)
    output_payload: dict[str, Any] = Field(default_factory=dict)


class Task(TaskCreate, Timestamped):
    pass


TASK_SCHEMA: dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Task",
    "type": "object",
    "required": ["title", "prompt"],
    "properties": {
        "title": {"type": "string", "minLength": 1, "maxLength": 200, "title": "Title"},
        "prompt": {"type": "string", "minLength": 1, "title": "Prompt"},
        "agent_id": {"type": ["string", "null"], "title": "Agent", "x-entity-ref": "agents"},
        "priority": {
            "type": "string",
            "enum": ["low", "normal", "high", "critical"],
            "default": "normal",
            "title": "Priority",
        },
        "status": {
            "type": "string",
            "enum": ["queued", "running", "blocked", "completed", "failed"],
            "default": "queued",
            "title": "Status",
        },
        "input_payload": {
            "type": "object",
            "title": "Input Payload",
            "additionalProperties": True,
            "default": {},
        },
        "output_payload": {
            "type": "object",
            "title": "Output Payload",
            "additionalProperties": True,
            "default": {},
        },
    },
}


# --- Workflows ---


class WorkflowCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    status: Literal["draft", "active", "paused", "archived"] = "draft"
    trigger: Literal["manual", "webhook", "schedule", "event"] = "manual"
    schedule_cron: str | None = None


class Workflow(WorkflowCreate, Timestamped):
    pass


WORKFLOW_SCHEMA: dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Workflow",
    "type": "object",
    "required": ["name"],
    "properties": {
        "name": {"type": "string", "minLength": 1, "maxLength": 120, "title": "Name"},
        "description": {"type": "string", "title": "Description"},
        "status": {
            "type": "string",
            "enum": ["draft", "active", "paused", "archived"],
            "default": "draft",
            "title": "Status",
        },
        "trigger": {
            "type": "string",
            "enum": ["manual", "webhook", "schedule", "event"],
            "default": "manual",
            "title": "Trigger",
        },
        "schedule_cron": {"type": ["string", "null"], "title": "Schedule (cron)"},
    },
}


# --- Workflow Steps ---


class WorkflowStepCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    workflow_id: str
    name: str = Field(min_length=1, max_length=120)
    step_type: Literal["agent", "task", "branch", "merge", "human-review"] = "agent"
    agent_id: str | None = None
    task_id: str | None = None
    depends_on: list[str] = Field(default_factory=list, description="Step IDs this step waits on")
    position_x: float = 0
    position_y: float = 0
    config: dict[str, Any] = Field(default_factory=dict)


class WorkflowStep(WorkflowStepCreate, Timestamped):
    pass


WORKFLOW_STEP_SCHEMA: dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Workflow Step",
    "type": "object",
    "required": ["workflow_id", "name", "step_type"],
    "properties": {
        "workflow_id": {
            "type": "string",
            "title": "Workflow",
            "x-entity-ref": "workflows",
        },
        "name": {"type": "string", "minLength": 1, "maxLength": 120, "title": "Name"},
        "step_type": {
            "type": "string",
            "enum": ["agent", "task", "branch", "merge", "human-review"],
            "default": "agent",
            "title": "Step Type",
        },
        "agent_id": {"type": ["string", "null"], "title": "Agent", "x-entity-ref": "agents"},
        "task_id": {"type": ["string", "null"], "title": "Task", "x-entity-ref": "tasks"},
        "depends_on": {
            "type": "array",
            "title": "Depends On (step IDs)",
            "items": {"type": "string"},
            "default": [],
        },
        "position_x": {"type": "number", "default": 0, "title": "Position X"},
        "position_y": {"type": "number", "default": 0, "title": "Position Y"},
        "config": {
            "type": "object",
            "title": "Config",
            "additionalProperties": True,
            "default": {},
        },
    },
}


# --- Registry ---


class EntityDefinition(BaseModel):
    name: EntityName
    label: str
    description: str
    json_schema: dict[str, Any]
    create_model: type[BaseModel]
    entity_model: type[BaseModel]
    relations: list[str] = Field(default_factory=list)


ENTITY_REGISTRY: dict[EntityName, EntityDefinition] = {
    EntityName.COMPUTE_PROFILES: EntityDefinition(
        name=EntityName.COMPUTE_PROFILES,
        label="Compute Profiles",
        description="Hardware tiers and runtime limits for agent execution.",
        json_schema=COMPUTE_PROFILE_SCHEMA,
        create_model=ComputeProfileCreate,
        entity_model=ComputeProfile,
        relations=[],
    ),
    EntityName.TOOLKITS: EntityDefinition(
        name=EntityName.TOOLKITS,
        label="Toolkits",
        description="MCP servers and callable tools available to agents.",
        json_schema=TOOLKIT_SCHEMA,
        create_model=ToolkitCreate,
        entity_model=Toolkit,
        relations=[],
    ),
    EntityName.AGENTS: EntityDefinition(
        name=EntityName.AGENTS,
        label="Agents",
        description="LLM agents with model config, prompts, and attached toolkits.",
        json_schema=AGENT_SCHEMA,
        create_model=AgentCreate,
        entity_model=Agent,
        relations=["toolkits", "compute-profiles"],
    ),
    EntityName.TASKS: EntityDefinition(
        name=EntityName.TASKS,
        label="Tasks",
        description="Units of work with prompts, priority, and assigned agents.",
        json_schema=TASK_SCHEMA,
        create_model=TaskCreate,
        entity_model=Task,
        relations=["agents"],
    ),
    EntityName.WORKFLOWS: EntityDefinition(
        name=EntityName.WORKFLOWS,
        label="Workflows",
        description="Orchestrated pipelines that chain agents and tasks.",
        json_schema=WORKFLOW_SCHEMA,
        create_model=WorkflowCreate,
        entity_model=Workflow,
        relations=["workflow-steps"],
    ),
    EntityName.WORKFLOW_STEPS: EntityDefinition(
        name=EntityName.WORKFLOW_STEPS,
        label="Workflow Steps",
        description="Nodes in a workflow graph — agents, tasks, branches, and merges.",
        json_schema=WORKFLOW_STEP_SCHEMA,
        create_model=WorkflowStepCreate,
        entity_model=WorkflowStep,
        relations=["workflows", "agents", "tasks"],
    ),
}
