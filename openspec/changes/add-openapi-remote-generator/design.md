## Context

The repo pairs SvelteKit (with experimental remote functions enabled in `vite.config.ts`) and FastAPI. Today the only remote function is a hand-written `query.live` status stream. Entity CRUD exists at `/agents`, `/compute-profiles`, etc., but routes accept `dict[str, Any]` — OpenAPI schemas are generic objects, not the rich Pydantic models defined in `api/app/models/entities.py`.

The goal (from `tmp/generating-types-for-remote-functions.md`) is a contract pipeline:

```
FastAPI/Pydantic → OpenAPI JSON → Valibot schemas → .remote.ts → handcrafted UI
```

This change delivers a POC on the **agents** resource only.

## Goals / Non-Goals

**Goals:**

- Export OpenAPI JSON from FastAPI deterministically.
- Type agents entity routes with Pydantic models so OpenAPI is machine-convertible.
- Generate disposable frontend artifacts under `ui/src/lib/generated/`.
- Provide `backendFetch` as handwritten server infrastructure.
- Map HTTP verbs to remote kinds: GET→`query`, POST/PATCH body→`form`, DELETE→`command`.
- Ship a minimal `/admin/api-explorer` page listing endpoints and submitting one form remote.
- Add `pnpm generate:api` and `pnpm check:generated` scripts.

**Non-Goals:**

- Full CRUD UI generator, polished admin console, auth/roles.
- Generating all entity types (only agents in POC).
- Monorepo CI automation beyond local scripts.
- Client-side fetch to FastAPI (remotes call backend server-side only).
- Visual form builder or schema overlay DSL.

## Decisions

### 1. POC resource: `agents` (not `/users`)

The doc suggests `/users`, but this repo's domain is agent orchestration. Agents already have rich Pydantic models (`AgentCreate`, `Agent`) and relations. Using agents avoids inventing a parallel resource and proves the pipeline against real product data.

**Alternative considered:** Add a throwaway `/users` router — rejected as scope creep unrelated to the demo app.

### 2. Scoped OpenAPI generation (agents tag only)

The generator reads a committed or freshly-exported `openapi.json` but **filters operations** to the POC scope initially: paths under `/agents` and `/entities` (for entity type listing if needed). This keeps generated output small and reviewable.

**Alternative considered:** Generate all routes — deferred until mapping rules are proven.

### 3. Custom lightweight generator (not Hey API client)

For POC, a focused Node script (`ui/scripts/generate-api.mjs`) converts OpenAPI component schemas to Valibot and emits remotes. Hey API / openapi-typescript are useful references but full client generation produces fetch wrappers, not SvelteKit remotes.

**Stage 1:** Hand-roll OpenAPI JSON Schema → Valibot for agents schemas (strings, numbers, enums, arrays, nullable, nested objects).
**Stage 2 (future):** Evaluate `@hey-api/openapi-ts` or `@openapi-contrib/openapi-schema-to-json-schema` for broader coverage.

### 4. Valibot + Standard Schema

Add `valibot` to UI dependencies. Generated schemas MUST be Standard Schema compatible for SvelteKit remote function validators (`query`, `form`, `command`).

Confirm against current SvelteKit remote functions API (SvelteKit 3 / `$app/server`).

### 5. Generated file layout

```
ui/src/lib/generated/
├── metadata/endpoints.ts
├── remotes/agents.remote.ts
├── schemas/agents.ts
└── types/agents.ts          # re-exports v.InferOutput where helpful
```

Each generated file starts with `// @generated — do not edit`.

Remote files import `backendFetch` from `$lib/server/backend-fetch`.

### 6. `backendFetch` helper

Handwritten at `ui/src/lib/server/backend-fetch.ts`:

- Reads `API_BASE_URL` from env (existing pattern or new `ui/src/env.ts` extension).
- Server-side `fetch` only.
- Optional Valibot `responseSchema` validation.
- Normalizes FastAPI error JSON (`detail` string or object) into thrown `BackendError`.
- No auth headers in POC (placeholder comment for future session forwarding).

### 7. Endpoint → remote kind mapping

| HTTP | Default remote kind |
|------|---------------------|
| GET | `query` |
| POST with JSON body | `form` |
| PATCH/PUT with JSON body | `form` |
| DELETE | `command` |

Agents create uses `POST /agents/create` → `form`. Delete uses `DELETE /agents/{id}/delete` → `command`.

Future override via OpenAPI extension `x-svelte-remote-kind` — not implemented in POC but reserved in metadata type.

### 8. API typing strategy for agents

Refactor agents-specific paths in `entities.py` to use `AgentCreate`, `Agent`, and path params typed as `str`. Keep generic `dict[str, Any]` for other entities unchanged.

Use `response_model=` on route decorators for OpenAPI response schemas.

**Alternative considered:** Separate `/agents` router — cleaner OpenAPI paths but duplicates generic entity pattern; typed generic routes with entity path param are harder to schema. POC adds explicit agents routes or overloads with typed responses when `entity == "agents"`.

**Chosen approach:** Add dedicated typed route functions for agents CRUD that delegate to existing repository functions, mounted at the same paths FastAPI already exposes (e.g. `GET /agents`, `POST /agents/create`). Replace generic handlers for agents paths only via router ordering or explicit agents sub-router with prefix.

### 9. OpenAPI export

Add `api/scripts/export_openapi.py` (or Makefile target) that writes `api/openapi.json` from `app.openapi()`. UI generator reads `../api/openapi.json` relative to monorepo root.

### 10. Admin API explorer

Route: `ui/src/routes/admin/api-explorer/+page.svelte`

Minimal POC:

- Import `endpoints` from generated metadata.
- List agents endpoints (method, path, remote export name).
- Select one `form` remote (e.g. `createAgent`) with basic inputs driven by schema fields (name, model at minimum).
- Submit via generated remote; show JSON result or validation/backend error.

Uses shadcn-svelte primitives already in the project. No role gating in POC.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| SvelteKit remote function API still experimental | Verify against installed `@sveltejs/kit` version; match existing `status.remote.ts` patterns |
| OpenAPI from generic `dict` routes is useless | POC only types agents; document requirement for Pydantic models on future resources |
| Custom schema converter incomplete | Scope to agents schemas only; add tests comparing sample payloads |
| Generated remotes in `src/lib/generated/remotes/` may need SvelteKit config | Confirm remote functions work from `$lib` path; fallback to `src/routes` proxy re-exports if needed |
| Regeneration drift | `check:generated` fails CI on diff; generated header banner |

## Migration Plan

1. Land API typing + OpenAPI export (backward compatible — same paths, stricter validation).
2. Add UI infrastructure (`backendFetch`, generator, generated files).
3. Add explorer page (dev-only route, no prod impact).
4. Document `make generate-api` or `pnpm generate:api` in UI README.

Rollback: delete generated dir and explorer route; revert agents typing to `dict` if needed.

## Open Questions

- Whether SvelteKit requires `.remote.ts` under `src/routes/` vs `$lib/generated/remotes/` — verify during implementation.
- Best OpenAPI→Valibot library for phase 2 — evaluate after POC.
- Whether `form` remotes need separate input vs path param schemas for PATCH updates.
