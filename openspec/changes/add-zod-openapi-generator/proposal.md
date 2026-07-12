## Why

The current OpenAPI generator and generated remote-function contract are Valibot-based, but we want to standardize on Zod for future projects and reuse. We need a migration path that preserves the existing generator as a fallback while introducing a clean, parallel Zod-first generation pipeline.

## What Changes

- Add a Zod-specific OpenAPI generator script (`ui/scripts/generate-api-zod.mjs`) that traverses FastAPI `openapi.json` and emits Zod-based artifacts.
- Keep the existing Valibot generator (`ui/scripts/generate-api.mjs`) unchanged as a baseline.
- Add a clean-slate generation strategy: emit into a temporary parallel output namespace first, validate, then cut over to canonical generated paths.
- Update generated remote functions to use Zod schemas and Zod parsing/validation flows.
- Update server-side fetch validation utility to support Zod schema validation for generated remotes.
- Update package dependencies and generation scripts for Zod workflow.
- Preserve endpoint metadata generation and remote-kind mapping heuristics.
- **BREAKING**: generated schema/type/remotes contract under `ui/src/lib/generated/**` shifts from Valibot-based exports to Zod-based exports after cutover.

## Capabilities

### New Capabilities

- `ui-zod-api-generator`: Generate Zod schemas, types, remotes, and endpoint metadata from OpenAPI with deterministic output.
- `ui-zod-migration-workflow`: Provide a clean-slate, staged migration process that supports side-by-side generation and safe cutover.

### Modified Capabilities

- `ui-api-generator`: Existing generation behavior is modified to support a dual-generator model and a Zod-first output contract.
- `ui-backend-fetch`: Runtime response validation behavior changes from Valibot parsing to Zod parsing for generated remotes.

## Impact

- **UI scripts**: add `ui/scripts/generate-api-zod.mjs`, update `package.json` scripts for Zod generation/checking.
- **Generated contract**: `ui/src/lib/generated/{schemas,types,remotes,metadata}` regenerated with Zod-based code.
- **Server runtime**: `ui/src/lib/server/backend-fetch.ts` validation integration updated for Zod schemas.
- **Dependencies**: add `zod`, remove/retire Valibot usage from generated contract path.
- **Docs**: update UI README generation instructions for Zod workflow and migration notes.
