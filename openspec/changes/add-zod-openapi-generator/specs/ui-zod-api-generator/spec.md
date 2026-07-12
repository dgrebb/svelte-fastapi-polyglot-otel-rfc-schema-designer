## ADDED Requirements

### Requirement: Zod generator script emits OpenAPI-derived artifacts
The system SHALL provide a script at `ui/scripts/generate-api-zod.mjs` that reads OpenAPI JSON and emits Zod-based generated artifacts for schemas, types, remotes, and endpoint metadata.

#### Scenario: Generate Zod artifacts from OpenAPI input
- **WHEN** a developer runs the Zod generation script with a valid OpenAPI input file
- **THEN** the script writes Zod-based files to the configured output directories
- **AND** generated files include deterministic ordering and a generated-file banner

### Requirement: Remote function mapping remains consistent
The generator SHALL preserve remote-kind mapping semantics used by the existing generator.

#### Scenario: HTTP method maps to expected remote function type
- **WHEN** OpenAPI operations are traversed
- **THEN** GET operations are emitted as `query` remotes
- **AND** POST/PATCH operations with object body are emitted as `form` remotes
- **AND** DELETE operations are emitted as `command` remotes

### Requirement: Unsupported OpenAPI constructs fail loudly
The generator SHALL stop generation for unsupported schema constructs with actionable diagnostics.

#### Scenario: Unsupported schema is encountered
- **WHEN** the script encounters an unsupported OpenAPI pattern
- **THEN** generation exits non-zero
- **AND** output includes endpoint/schema context and a clear remediation hint
