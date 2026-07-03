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
from app.models.entities import ENTITY_REGISTRY, EntityName

router = APIRouter(tags=["entities"])


def _resolve_entity(entity: str) -> EntityName:
    try:
        return EntityName(entity)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown entity: {entity}") from exc


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
