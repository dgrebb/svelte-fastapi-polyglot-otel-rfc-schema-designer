## Context

The repository currently generates remote-function artifacts from OpenAPI using `ui/scripts/generate-api.mjs`, producing Valibot schemas and Valibot-based validation in generated remotes/runtime helpers. We want to migrate the generated contract layer to Zod while preserving a reversible path and avoiding immediate destructive regeneration.

The migration needs to balance two constraints:

1. Keep delivery velocity by reusing existing traversal/mapping logic.
2. Avoid risky big-bang replacement where generated imports and runtime parsing all change at once.

## Goals / Non-Goals

**Goals:**
- Introduce a dedicated Zod generator (`generate-api-zod.mjs`) tailored to FastAPI OpenAPI shapes.
- Preserve existing generator as a baseline and fallback.
- Execute a staged migration: parallel generation, verification, then cutover.
- Maintain remote-kind mapping semantics (GET/query, POST+PATCH/form, DELETE/command).
- Keep generated output deterministic and disposable.

**Non-Goals:**
- Universal OpenAPI support for every schema edge case in v1.
- Rewriting backend API/OpenAPI modeling beyond what is needed for current generation.
- Replacing handwritten UI/UX logic with generated pages.
- Removing the original Valibot generator immediately.

## Decisions

### 1) Keep two generators during migration
We will keep `generate-api.mjs` (Valibot) and add `generate-api-zod.mjs` (Zod).

**Rationale:** supports side-by-side diffing and rollback.
**Alternative:** edit existing generator in-place; rejected due to high regression risk.

### 2) Use clean-slate staging output before canonical overwrite
The Zod generator will first emit to `ui/src/lib/generated-zod/**` (or configurable equivalent). After checks pass, we cut over to `ui/src/lib/generated/**`.

**Rationale:** minimizes breakage in existing imports and enables direct artifact comparison.
**Alternative:** immediate overwrite; rejected due to poor debuggability.

### 3) Reuse traversal/mapping, swap schema emission + validation backend
Endpoint discovery, operation grouping, and naming pipelines remain mostly unchanged; schema backend changes from Valibot emitters/parsers to Zod emitters/parsers.

**Rationale:** reduces migration scope and implementation time.
**Alternative:** rewrite generator architecture completely; deferred.

### 4) Zod-first backend-fetch parsing contract
`backend-fetch.ts` will parse/validate responses using Zod schema APIs for generated remotes.

**Rationale:** keeps runtime validation aligned with generated schema library.
**Alternative:** dual runtime parser abstraction in v1; deferred unless needed.

### 5) Explicit unsupported-feature reporting
Generator will fail loudly with actionable messages on unsupported OpenAPI constructs (e.g. unresolved discriminators/complex combinators not implemented).

**Rationale:** prevent silent bad generation.
**Alternative:** best-effort partial emit; rejected for correctness concerns.

## Risks / Trade-offs

- [Schema parity gaps between Valibot and Zod emitters] → Mitigation: side-by-side generation and targeted fixture tests.
- [Import churn during cutover] → Mitigation: temporary parallel output namespace and single cutover commit.
- [Incomplete OpenAPI coverage in v1] → Mitigation: explicit unsupported warnings and scoped initial resource coverage.
- [Dual-generator maintenance burden] → Mitigation: define deprecation criteria for Valibot generator after stabilization.

## Migration Plan

1. Add Zod dependency and introduce `generate-api-zod.mjs`.
2. Emit parallel artifacts to `generated-zod` and run checks.
3. Update runtime validation helper for Zod compatibility.
4. Compare endpoint/schema coverage against existing generator outputs.
5. Cut over canonical generated output to Zod artifacts.
6. Update scripts/docs and run full `pnpm check` validation.
7. Keep old generator for one stabilization cycle; remove later via follow-up change.

Rollback strategy: switch scripts/imports back to Valibot generator artifacts and rerun original generation.

## Open Questions

- Should `backend-fetch.ts` support dual validators during transition or be switched directly to Zod?
- Should generated type exports use `z.infer` only, or preserve compatibility aliases matching prior Valibot export names?
- How long should the parallel-generator period remain before removing Valibot generation?
