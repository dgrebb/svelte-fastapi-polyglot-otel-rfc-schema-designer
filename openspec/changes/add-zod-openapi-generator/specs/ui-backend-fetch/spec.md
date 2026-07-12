## MODIFIED Requirements

### Requirement: Runtime response validation matches generated schema backend
The backend fetch helper SHALL validate responses using the same schema backend used by generated remotes.

#### Scenario: Zod-validated generated remote response
- **WHEN** a generated remote provides a Zod response schema to backend fetch
- **THEN** backend fetch validates the payload via Zod parsing
- **AND** it returns typed validated output on success
- **AND** throws normalized validation errors on parse failure

### Requirement: Error normalization remains stable through migration
Changing schema backend SHALL NOT regress backend error normalization semantics.

#### Scenario: Backend returns structured error detail
- **WHEN** backend fetch receives a non-2xx response with FastAPI `detail` payload
- **THEN** normalized error messages are produced consistently regardless of schema backend
