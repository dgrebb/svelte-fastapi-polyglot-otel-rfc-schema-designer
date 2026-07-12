## MODIFIED Requirements

### Requirement: Generator supports staged backend-specific contracts
The API generation capability SHALL support backend-specific generation modes that can be executed in parallel during migration periods.

#### Scenario: Existing and new generator coexist
- **WHEN** the repository is migrating schema libraries
- **THEN** the existing generator remains runnable without modification
- **AND** a new generator variant can run against the same OpenAPI source
- **AND** both runs produce deterministic outputs for comparison

### Requirement: Generator scripts expose clear entrypoints
Generation workflows SHALL provide explicit scripts for default generation and migration generation.

#### Scenario: Script invocation clarity
- **WHEN** a developer views UI package scripts
- **THEN** they can identify which script runs the legacy generator and which runs the migration generator
- **AND** script names indicate the target schema backend
