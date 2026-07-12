## 1. OpenSpec and migration scaffolding

- [x] 1.1 Confirm existing Valibot generator output remains the baseline reference
- [x] 1.2 Add Zod migration scripts in `ui/package.json` (`generate:api:zod`, `check:generated:zod`)
- [x] 1.3 Document side-by-side generation workflow in `ui/README.md`

## 2. Zod generator implementation

- [x] 2.1 Create `ui/scripts/generate-api-zod.mjs` by reusing traversal/mapping flow from existing generator
- [x] 2.2 Implement OpenAPI schema-to-Zod emitters for current FastAPI shapes (objects, arrays, enums, nullable, defaults)
- [x] 2.3 Emit Zod-based schemas, types, remotes, and endpoint metadata with deterministic ordering
- [x] 2.4 Add explicit unsupported-feature diagnostics with non-zero exit behavior

## 3. Clean-slate parallel generation

- [x] 3.1 Configure temporary parallel output namespace (e.g. `ui/src/lib/generated-zod/**`)
- [x] 3.2 Run legacy and Zod generators side-by-side and compare operation coverage
- [x] 3.3 Resolve naming/import conflicts discovered during parallel generation

## 4. Runtime validation cutover

- [x] 4.1 Update `ui/src/lib/server/backend-fetch.ts` to validate generated responses with Zod schemas
- [x] 4.2 Ensure error normalization behavior remains unchanged for backend failures
- [x] 4.3 Update generated remotes to import/use Zod-backed schemas

## 5. Canonical output cutover

- [x] 5.1 Replace canonical generated artifacts under `ui/src/lib/generated/**` with Zod outputs
- [x] 5.2 Remove Valibot dependency usage from generated contract path
- [x] 5.3 Run `pnpm check`, generator checks, and targeted runtime verification

## 6. Stabilization and rollback readiness

- [x] 6.1 Keep legacy generator script intact for one stabilization cycle
- [x] 6.2 Document rollback steps to restore Valibot generation if regressions occur
- [x] 6.3 Finalize migration notes and mark follow-up for legacy generator deprecation
