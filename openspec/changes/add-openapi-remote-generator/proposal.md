## Why

The UI currently has no typed contract layer between SvelteKit and FastAPI — API calls would be hand-written wrappers with duplicated types and validation. A generator that turns FastAPI's OpenAPI schema into Valibot schemas, TypeScript types, and SvelteKit remote functions eliminates that boilerplate and gives humans stable primitives to build UX on top of.

## What Changes

- Add an OpenAPI → generated frontend pipeline: types, Valibot schemas, `.remote.ts` functions, and endpoint metadata under `ui/src/lib/generated/`.
- Add a handwritten `backendFetch` server helper for typed, validated server-side calls to FastAPI.
- Add a Node-based generator script (`ui/scripts/generate-api.mjs`) runnable via `pnpm generate:api` and `pnpm check:generated`.
- Add a minimal admin API explorer page that lists generated endpoints and can submit at least one generated form remote.
- **POC scope**: one resource — `agents` entity CRUD — proving the full loop from OpenAPI to validated UI response.
- Improve FastAPI entity routes for the POC resource to use typed Pydantic request/response models so OpenAPI carries rich schemas (replacing `dict[str, Any]` for agents endpoints).
- Add an OpenAPI export script/target on the API side for CI and local regeneration.
- Do **not** generate product UI, CRUD screens, or auth/role systems in this change.

## Capabilities

### New Capabilities

- `api-openapi-export`: Export FastAPI OpenAPI JSON as a deterministic artifact for the generator and CI.
- `api-typed-entities`: Typed Pydantic request/response models on entity routes (POC: agents) so OpenAPI schemas are machine-convertible.
- `ui-backend-fetch`: Shared server-side fetch helper with Valibot response validation and normalized backend errors.
- `ui-api-generator`: OpenAPI → Valibot schemas, types, remote functions, and endpoint metadata generator.
- `ui-api-explorer`: Minimal admin/debug page consuming generated metadata and remotes for try-it-out.

### Modified Capabilities

- _(none — no existing OpenSpec capability specs in `openspec/specs/`)_

## Impact

- **API**: `api/app/routers/entities.py` (typed agents routes), new OpenAPI export script, optional `openapi.json` artifact path.
- **UI**: new `ui/scripts/generate-api.mjs`, `ui/src/lib/generated/**`, `ui/src/lib/server/backend-fetch.ts`, `ui/src/routes/admin/api-explorer/`, `ui/package.json` scripts and `valibot` dependency.
- **Root**: Makefile target or doc note for regeneration workflow.
- **Dev workflow**: `pnpm generate:api` after API schema changes; `pnpm check` validates generated output compiles.
- **Non-goals**: full CRUD UI generator, polished admin console, monorepo CI automation, visual form builder, backend code generator.
