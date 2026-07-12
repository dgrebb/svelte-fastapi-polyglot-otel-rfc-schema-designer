# UI

SvelteKit frontend for **svelte-fastapi-polyglot-otel-rfc-schema-designer** — code-along repo for OpenAPI → SvelteKit remote functions.

> **On `valibot`:** this branch uses **Valibot** only. For Zod, run `git checkout zod`.

See the [root README](../README.md) for the full pipeline and branch overview.

```bash
pnpm install
pnpm dev
pnpm check
```

## Generate (Valibot)

Reads [`../api/openapi.json`](../api/openapi.json) from `make export-openapi`:

```bash
pnpm generate:api
pnpm check:generated
```

Output: `src/lib/generated/` — Valibot schemas, types, and remotes.

[`backend-fetch.ts`](src/lib/server/backend-fetch.ts) uses Valibot `safeParse`.

## Zod track

The `zod` branch adds `generate-api-zod.mjs`, `generated-zod/`, and Zod runtime validation. Switch branches instead of editing files by hand:

```bash
git checkout zod
```

## Try generated remotes

With `make dev` running: **http://localhost:5173/admin/api-explorer** (use `localhost`, not `127.0.0.1`).

## Highlights

- `src/routes/status/` — `query.live` live stream
- `src/lib/generated/remotes/agents.remote.ts` — generated agents CRUD remotes
