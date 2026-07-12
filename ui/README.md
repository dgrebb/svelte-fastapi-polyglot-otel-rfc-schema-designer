# UI

SvelteKit frontend for **svelte-fastapi-polyglot-otel-rfc-schema-designer** — OpenAPI-driven remote functions against the FastAPI backend.

See the [root README](../README.md) for the full pipeline and why both Valibot and Zod generators exist.

```bash
pnpm install
pnpm dev
pnpm check
```

## Schema libraries

Both generators emit the same remote-function layout from `api/openapi.json`. Pick one as canonical for `src/lib/generated/`:

| Library | Generate command | Drift check |
|---------|------------------|-------------|
| Valibot | `pnpm generate:api` | `pnpm check:generated` |
| Zod | `pnpm generate:api:zod:canonical` | `pnpm check:generated:zod` |

On **`zod` / `main`**, compare outputs without overwriting canonical `generated/`:

```bash
pnpm generate:api                  # Valibot → overwrites generated/ (comparison only)
pnpm generate:api:zod              # Zod → generated-zod/
pnpm generate:api:zod:canonical    # Zod → generated/ (canonical)
```

[`backend-fetch.ts`](src/lib/server/backend-fetch.ts) and [`env.ts`](src/env.ts) use whichever library is canonical on your branch (`safeParse` with Zod on `zod` / `main`).

## Generated contract

After `make export-openapi` from the repo root:

```bash
pnpm generate:api:zod:canonical   # or generate:api on valibot branch
```

Key paths:

- `src/lib/generated/metadata/endpoints.ts` — operation index
- `src/lib/generated/schemas/` — request/response schemas
- `src/lib/generated/remotes/` — `query`, `form`, `command` exports

## Routes

With `make dev` running (use **`http://localhost:5173`**, not `127.0.0.1`):

| Route | Purpose |
|-------|---------|
| `/status` | Hand-written `query.live` status stream |
| `/admin/api-explorer` | Try generated remotes |
| `/form-design` | Schema introspection and remote-function form panels |
| `/form-design/shadcn` | shadcn-svelte + Superforms widget playground |
