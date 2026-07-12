# UI

SvelteKit frontend for **svelte-fastapi-polyglot-otel-rfc-schema-designer** — OpenAPI-driven remote functions generation and form designer.

See the [root README](../README.md) for branch setup (`valibot` vs `zod`) and the full pipeline.

```bash
pnpm install
pnpm dev
pnpm check
```

## Branches

| Branch | Generate command | Runtime validation |
|--------|------------------|-------------------|
| `valibot` | `pnpm generate:api` | Valibot (`backend-fetch` + `env.ts`) |
| `zod` | `pnpm generate:api:zod:canonical` | Zod (`backend-fetch` + `env.ts`) |

On **`zod`**, both generators are available:

```bash
pnpm generate:api                  # Valibot → overwrites generated/ (comparison)
pnpm generate:api:zod              # Zod → generated-zod/ (side-by-side)
pnpm generate:api:zod:canonical    # Zod → generated/ (canonical)
pnpm check:generated:zod
```

## Try generated remotes

With `make dev` running: **http://localhost:5173/admin/api-explorer** (use `localhost`, not `127.0.0.1`).

## Highlights

- `src/routes/status/` — `query.live` live stream
- `src/lib/generated/remotes/agents.remote.ts` — generated agents CRUD remotes
