from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repository import (
    EntityNotFoundError,
    ForeignKeyError,
    create_entity,
    delete_entity,
    get_entity,
    list_entities,
    update_entity,
)
from app.models.entities import (
    ENTITY_REGISTRY,
    Agent,
    AgentCreate,
    AgentUpdate,
    EntityName,
)

router = APIRouter(tags=["entities"])


def _resolve_entity(entity: str) -> EntityName:
    try:
        return EntityName(entity)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown entity: {entity}") from exc


def _to_agent(data: dict[str, Any]) -> Agent:
    return Agent.model_validate(data)


@router.get("/entities")
def list_entity_types() -> list[dict[str, Any]]:
    return [
        {
            "name": definition.name.value,
            "label": definition.label,
            "description": definition.description,
            "relations": definition.relations,
        }
        for definition in ENTITY_REGISTRY.values()
    ]


@router.get("/{entity}/properties")
def get_entity_properties(entity: str) -> dict[str, Any]:
    resolved = _resolve_entity(entity)
    definition = ENTITY_REGISTRY[resolved]
    return {
        "entity": resolved.value,
        "label": definition.label,
        "schema": definition.json_schema,
        "relations": definition.relations,
    }


# --- Typed agents routes (POC for OpenAPI export) ---


@router.get("/agents", response_model=list[Agent])
def list_agents(db: Session = Depends(get_db)) -> list[Agent]:
    return [_to_agent(record) for record in list_entities(db, EntityName.AGENTS)]


@router.get("/agents/{entity_id}", response_model=Agent)
def get_agent(entity_id: str, db: Session = Depends(get_db)) -> Agent:
    try:
        return _to_agent(get_entity(db, EntityName.AGENTS, entity_id))
    except EntityNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/agents/create", status_code=201, response_model=Agent)
def create_agent(payload: AgentCreate, db: Session = Depends(get_db)) -> Agent:
    try:
        return _to_agent(create_entity(db, EntityName.AGENTS, payload.model_dump()))
    except ForeignKeyError as exc:
        raise HTTPException(
            status_code=422,
            detail={"field": exc.field, "message": str(exc)},
        ) from exc


@router.patch("/agents/{entity_id}/update", response_model=Agent)
def update_agent(
    entity_id: str,
    payload: AgentUpdate,
    db: Session = Depends(get_db),
) -> Agent:
    try:
        return _to_agent(
            update_entity(
                db,
                EntityName.AGENTS,
                entity_id,
                payload.model_dump(exclude_unset=True),
            )
        )
    except EntityNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ForeignKeyError as exc:
        raise HTTPException(
            status_code=422,
            detail={"field": exc.field, "message": str(exc)},
        ) from exc


@router.delete("/agents/{entity_id}/delete", response_model=Agent)
def delete_agent(entity_id: str, db: Session = Depends(get_db)) -> Agent:
    try:
        return _to_agent(delete_entity(db, EntityName.AGENTS, entity_id))
    except EntityNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


# --- Generic entity routes ---


@router.get("/{entity}")
def list_entity_records(entity: str, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    resolved = _resolve_entity(entity)
    return list_entities(db, resolved)


@router.get("/{entity}/{entity_id}")
def get_entity_record(
    entity: str, entity_id: str, db: Session = Depends(get_db)
) -> dict[str, Any]:
    resolved = _resolve_entity(entity)
    try:
        return get_entity(db, resolved, entity_id)
    except EntityNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{entity}/create", status_code=201)
def create_entity_record(
    entity: str, payload: dict[str, Any], db: Session = Depends(get_db)
) -> dict[str, Any]:
    resolved = _resolve_entity(entity)
    try:
        return create_entity(db, resolved, payload)
    except ForeignKeyError as exc:
        raise HTTPException(
            status_code=422,
            detail={"field": exc.field, "message": str(exc)},
        ) from exc


@router.patch("/{entity}/{entity_id}/update")
def update_entity_record(
    entity: str,
    entity_id: str,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    resolved = _resolve_entity(entity)
    try:
        return update_entity(db, resolved, entity_id, payload)
    except EntityNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ForeignKeyError as exc:
        raise HTTPException(
            status_code=422,
            detail={"field": exc.field, "message": str(exc)},
        ) from exc


@router.delete("/{entity}/{entity_id}/delete")
def delete_entity_record(
    entity: str, entity_id: str, db: Session = Depends(get_db)
) -> dict[str, Any]:
    resolved = _resolve_entity(entity)
    try:
        return delete_entity(db, resolved, entity_id)
    except EntityNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
