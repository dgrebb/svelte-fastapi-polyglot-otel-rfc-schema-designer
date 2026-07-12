## ADDED Requirements

### Requirement: Migration supports side-by-side generation
The migration workflow SHALL support generating Zod artifacts into a parallel namespace before canonical cutover.

#### Scenario: Parallel output generation
- **WHEN** a developer runs the Zod generator in migration mode
- **THEN** output is written to a non-canonical generated directory
- **AND** existing Valibot-generated artifacts remain unchanged

### Requirement: Cutover is deterministic and reversible
The migration workflow SHALL define deterministic cutover steps and rollback guidance.

#### Scenario: Canonical cutover
- **WHEN** coverage and type checks pass in side-by-side mode
- **THEN** canonical generated outputs are replaced by Zod artifacts in one controlled step
- **AND** documented rollback steps allow restoration to Valibot-generated artifacts
