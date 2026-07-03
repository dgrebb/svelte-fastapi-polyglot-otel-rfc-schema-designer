from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(UTC)


class TimestampMixin:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )


class ComputeProfileRow(TimestampMixin, Base):
    __tablename__ = "compute_profiles"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    tier: Mapped[str] = mapped_column(String(32), default="standard")
    vcpus: Mapped[int] = mapped_column(Integer, default=2)
    memory_gb: Mapped[int] = mapped_column(Integer, default=4)
    gpu_count: Mapped[int] = mapped_column(Integer, default=0)
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=300)
    max_concurrency: Mapped[int] = mapped_column(Integer, default=4)

    agents: Mapped[list[AgentRow]] = relationship(back_populates="compute_profile")


class ToolkitRow(TimestampMixin, Base):
    __tablename__ = "toolkits"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    tools: Mapped[list[str]] = mapped_column(JSON, default=list)
    mcp_servers: Mapped[list[str]] = mapped_column(JSON, default=list)
    allowed_domains: Mapped[list[str]] = mapped_column(JSON, default=list)

    agents: Mapped[list[AgentRow]] = relationship(back_populates="toolkit")


class AgentRow(TimestampMixin, Base):
    __tablename__ = "agents"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    model: Mapped[str] = mapped_column(String(120), default="claude-sonnet-4")
    system_prompt: Mapped[str] = mapped_column(Text, default="You are a helpful AI agent.")
    toolkit_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("toolkits.id", ondelete="SET NULL"), nullable=True
    )
    compute_profile_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("compute_profiles.id", ondelete="SET NULL"), nullable=True
    )
    temperature: Mapped[float] = mapped_column(Float, default=0.7)
    max_tokens: Mapped[int] = mapped_column(Integer, default=4096)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)

    toolkit: Mapped[ToolkitRow | None] = relationship(back_populates="agents")
    compute_profile: Mapped[ComputeProfileRow | None] = relationship(back_populates="agents")
    tasks: Mapped[list[TaskRow]] = relationship(back_populates="agent")
    workflow_steps: Mapped[list[WorkflowStepRow]] = relationship(back_populates="agent")


class TaskRow(TimestampMixin, Base):
    __tablename__ = "tasks"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    agent_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True
    )
    priority: Mapped[str] = mapped_column(String(16), default="normal")
    status: Mapped[str] = mapped_column(String(16), default="queued")
    input_payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    output_payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    agent: Mapped[AgentRow | None] = relationship(back_populates="tasks")
    workflow_steps: Mapped[list[WorkflowStepRow]] = relationship(back_populates="task")


class WorkflowRow(TimestampMixin, Base):
    __tablename__ = "workflows"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(16), default="draft")
    trigger: Mapped[str] = mapped_column(String(16), default="manual")
    schedule_cron: Mapped[str | None] = mapped_column(String(120), nullable=True)

    steps: Mapped[list[WorkflowStepRow]] = relationship(
        back_populates="workflow", cascade="all, delete-orphan"
    )


class WorkflowStepRow(TimestampMixin, Base):
    __tablename__ = "workflow_steps"

    workflow_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    step_type: Mapped[str] = mapped_column(String(32), default="agent")
    agent_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True
    )
    task_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True
    )
    depends_on: Mapped[list[str]] = mapped_column(JSON, default=list)
    position_x: Mapped[float] = mapped_column(Float, default=0.0)
    position_y: Mapped[float] = mapped_column(Float, default=0.0)
    config: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    workflow: Mapped[WorkflowRow] = relationship(back_populates="steps")
    agent: Mapped[AgentRow | None] = relationship(back_populates="workflow_steps")
    task: Mapped[TaskRow | None] = relationship(back_populates="workflow_steps")
