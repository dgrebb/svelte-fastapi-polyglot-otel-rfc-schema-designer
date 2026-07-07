## ADDED Requirements

### Requirement: Generated output directory

The generator SHALL write disposable artifacts under `ui/src/lib/generated/` with a `@generated — do not edit` banner in each file.

#### Scenario: Generated directory structure

- **WHEN** `pnpm generate:api` completes successfully
- **THEN** files exist at minimum under:
  - `src/lib/generated/schemas/agents.ts`
  - `src/lib/generated/remotes/agents.remote.ts`
  - `src/lib/generated/metadata/endpoints.ts`

### Requirement: Valibot schemas from OpenAPI

The generator SHALL produce Standard Schema compatible Valibot schemas for agents request bodies, path parameters, and responses.

#### Scenario: Agent create schema

- **WHEN** the generator runs against the exported OpenAPI document
- **THEN** `CreateAgentSchema` (or equivalent) validates required fields `name` and `model`

### Requirement: Remote functions from OpenAPI operations

The generator SHALL emit SvelteKit remote functions using `query`, `form`, and `command` from `$app/server` mapped from HTTP methods.

#### Scenario: List agents remote

- **WHEN** generated remotes are imported
- **THEN** a `query` remote exists for listing agents (GET `/agents`)

#### Scenario: Create agent remote

- **WHEN** generated remotes are imported
- **THEN** a `form` remote exists for creating an agent (POST `/agents/create`)

#### Scenario: Delete agent remote

- **WHEN** generated remotes are imported
- **THEN** a `command` remote exists for deleting an agent (DELETE `/agents/{id}/delete`)

### Requirement: Endpoint metadata generation

The generator SHALL emit a typed `endpoints` array with operationId, method, path, remote import path, remote export name, remote kind, and schema names.

#### Scenario: Metadata lists agents operations

- **WHEN** metadata is imported
- **THEN** at least one entry describes the create-agent operation with `remoteKind: 'form'`

### Requirement: Regeneration scripts

The UI package.json SHALL include `generate:api` and `check:generated` scripts.

#### Scenario: Check detects drift

- **WHEN** generated files differ from what the generator would produce
- **THEN** `pnpm check:generated` exits with non-zero status
