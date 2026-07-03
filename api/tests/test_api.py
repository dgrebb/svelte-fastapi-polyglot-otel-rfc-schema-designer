from fastapi.testclient import TestClient

from app.db.database import SessionLocal, init_db
from app.db.repository import seed_demo_data
from app.main import app

client = TestClient(app)


def setup_module() -> None:
    init_db()
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_entity_types() -> None:
    response = client.get("/entities")
    assert response.status_code == 200
    names = {item["name"] for item in response.json()}
    assert "agents" in names
    assert "workflows" in names


def test_agent_properties_schema() -> None:
    response = client.get("/agents/properties")
    assert response.status_code == 200
    body = response.json()
    assert body["entity"] == "agents"
    assert "model" in body["schema"]["properties"]


def test_list_and_create_agent() -> None:
    list_response = client.get("/agents")
    assert list_response.status_code == 200
    initial_count = len(list_response.json())

    create_response = client.post(
        "/agents/create",
        json={
            "name": "Test Agent",
            "model": "claude-sonnet-4",
            "system_prompt": "Test prompt",
        },
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["name"] == "Test Agent"

    updated = client.patch(
        f"/agents/{created['id']}/update",
        json={"description": "Updated"},
    )
    assert updated.status_code == 200
    assert updated.json()["description"] == "Updated"

    deleted = client.delete(f"/agents/{created['id']}/delete")
    assert deleted.status_code == 200

    final_list = client.get("/agents")
    assert len(final_list.json()) == initial_count


def test_workflow_graph() -> None:
    workflows = client.get("/workflows").json()
    assert workflows
    workflow_id = workflows[0]["id"]
    graph = client.get(f"/workflows/{workflow_id}/graph")
    assert graph.status_code == 200
    body = graph.json()
    assert "nodes" in body
    assert "edges" in body
    assert len(body["nodes"]) >= 2
