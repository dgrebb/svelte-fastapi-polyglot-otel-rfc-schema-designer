## ADDED Requirements

### Requirement: Server-side backend fetch helper

The UI SHALL provide a handwritten `backendFetch` function at `$lib/server/backend-fetch` for server-side HTTP calls to the FastAPI backend.

#### Scenario: Successful GET with response validation

- **WHEN** `backendFetch` is called with a GET path and a Valibot response schema
- **AND** the backend returns valid JSON matching the schema
- **THEN** the function returns the parsed and validated output

#### Scenario: Backend error normalization

- **WHEN** the backend returns a non-2xx response with a FastAPI `detail` field
- **THEN** `backendFetch` throws an error that includes the status code and normalized detail message

#### Scenario: Configurable API base URL

- **WHEN** the SvelteKit server runs with `API_BASE_URL` (or equivalent env) set
- **THEN** `backendFetch` prefixes request paths with that base URL
