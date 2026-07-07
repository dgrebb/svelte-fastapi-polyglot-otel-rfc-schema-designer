## ADDED Requirements

### Requirement: OpenAPI JSON export script

The API SHALL provide a script that exports the FastAPI application OpenAPI schema to a deterministic JSON file at `api/openapi.json`.

#### Scenario: Local export succeeds

- **WHEN** a developer runs the export script from the `api/` directory
- **THEN** `api/openapi.json` is written containing valid OpenAPI 3.x JSON
- **AND** the document includes paths for `/agents` entity operations

#### Scenario: Export is repeatable

- **WHEN** the export script is run twice without code changes
- **THEN** the resulting `openapi.json` content is identical

### Requirement: Makefile or documented invocation

The repo SHALL document or provide a Makefile target to run OpenAPI export without starting the server.

#### Scenario: Export via make

- **WHEN** a developer runs the documented make target
- **THEN** `api/openapi.json` is regenerated
