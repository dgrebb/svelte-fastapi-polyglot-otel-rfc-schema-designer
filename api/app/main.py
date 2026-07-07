import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import SessionLocal, engine, init_db
from app.db.repository import seed_demo_data
from app.observability import setup as setup_observability
from app.observability import shutdown as shutdown_observability
from app.routers.entities import router as entities_router
from app.routers.workflows import router as workflows_router


@asynccontextmanager
async def lifespan(fastapi_app: FastAPI):
    setup_observability(fastapi_app, engine=engine)
    init_db()
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield
    shutdown_observability()


app = FastAPI(
    title="svelte-fastapi-remote-functions API",
    description=(
        "FastAPI backend for the svelte-fastapi-remote-functions example — "
        "entity CRUD, workflows, and OpenAPI docs."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

_cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in _cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(entities_router)
app.include_router(workflows_router)
