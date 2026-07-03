from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repository import EntityNotFoundError, get_workflow_graph

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("/{workflow_id}/graph")
def workflow_graph(workflow_id: str, db: Session = Depends(get_db)) -> dict:
    try:
        return get_workflow_graph(db, workflow_id)
    except EntityNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
