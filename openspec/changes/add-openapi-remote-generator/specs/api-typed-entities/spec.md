## ADDED Requirements

### Requirement: Agents routes use Pydantic models

Agents entity HTTP routes SHALL use `AgentCreate` and `Agent` Pydantic models for request and response bodies instead of `dict[str, Any]`.

#### Scenario: Create agent request validated

- **WHEN** a client POSTs invalid data to `/agents/create` (e.g. missing required `name`)
- **THEN** FastAPI returns HTTP 422 with a validation error detail

#### Scenario: Create agent response typed in OpenAPI

- **WHEN** OpenAPI schema is exported
- **THEN** the POST `/agents/create` operation request body schema references agent create fields (name, model, etc.)
- **AND** the success response schema references agent fields including `id`

### Requirement: Agents CRUD paths unchanged

Typed agents routes SHALL preserve existing URL paths (`/agents`, `/agents/{id}`, `/agents/create`, `/agents/{id}/update`, `/agents/{id}/delete`).

#### Scenario: List agents

- **WHEN** a client GETs `/agents`
- **THEN** the response is a JSON array of agent objects

#### Scenario: Get single agent

- **WHEN** a client GETs `/agents/{entity_id}` with a valid id
- **THEN** the response is a single agent object
