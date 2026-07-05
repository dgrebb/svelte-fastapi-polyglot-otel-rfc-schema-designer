## 1. API — OpenAPI export

- [x] 1.1 Add `api/scripts/export_openapi.py` that writes `api/openapi.json` from `app.openapi()`
- [x] 1.2 Add Makefile target `export-openapi` (or document in api Makefile)
- [x] 1.3 Run export and commit initial `api/openapi.json` with agents paths present

## 2. API — Typed agents routes

- [x] 2.1 Refactor agents CRUD in `entities.py` to use `AgentCreate` / `Agent` with `response_model`
- [x] 2.2 Preserve existing URL paths for agents operations
- [x] 2.3 Re-export OpenAPI and verify agents schemas are rich (not generic object)
- [x] 2.4 Add or update API tests for agents validation (422 on bad payload)

## 3. UI — Infrastructure

- [ ] 3.1 Add `valibot` dependency to `ui/package.json`
- [ ] 3.2 Add `API_BASE_URL` to env handling (e.g. `$env/static/private` or existing pattern)
- [ ] 3.3 Implement `$lib/server/backend-fetch.ts` with response validation and error normalization

## 4. UI — Generator

- [ ] 4.1 Create `ui/scripts/generate-api.mjs` reading `../api/openapi.json`
- [ ] 4.2 Implement OpenAPI schema → Valibot conversion for agents (strings, numbers, enums, arrays, nullable)
- [ ] 4.3 Emit `src/lib/generated/schemas/agents.ts`
- [ ] 4.4 Emit `src/lib/generated/types/agents.ts` (InferOutput re-exports)
- [ ] 4.5 Emit `src/lib/generated/remotes/agents.remote.ts` (query/form/command mapping)
- [ ] 4.6 Emit `src/lib/generated/metadata/endpoints.ts`
- [ ] 4.7 Add `generate:api` and `check:generated` scripts to `package.json`
- [ ] 4.8 Run generator and verify `pnpm check` passes

## 5. UI — API explorer

- [ ] 5.1 Create `src/routes/admin/api-explorer/+page.svelte`
- [ ] 5.2 List generated endpoints from metadata (method, path, remote name)
- [ ] 5.3 Implement try-it-out for create-agent form remote with result/error display
- [ ] 5.4 Verify end-to-end: explorer submit → FastAPI → validated response in UI

## 6. Verification & docs

- [ ] 6.1 Add brief note to `ui/README.md` on `pnpm generate:api` workflow
- [ ] 6.2 Confirm regeneration is deterministic (`pnpm check:generated` clean after generate)
- [ ] 6.3 Mark OpenSpec tasks complete in `openspec/changes/add-openapi-remote-generator/tasks.md`
