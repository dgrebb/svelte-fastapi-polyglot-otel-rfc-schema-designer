# UI

SvelteKit frontend for **svelte-fastapi-remote-functions**. See the [root README](../README.md) for setup and architecture.

```bash
pnpm install
pnpm dev
pnpm check
pnpm generate:api
```

## OpenAPI code generation

Generated agents remotes live under `src/lib/generated/`. Regenerate after API OpenAPI export changes:

```bash
pnpm generate:api          # reads ../api/openapi.json
pnpm check:generated       # fail if generated output drifts
```

Requires `api/openapi.json` from the API export script (`make export-openapi`). Set `API_BASE_URL` (or `PUBLIC_API_URL`) for server-side `backendFetch`.

## Highlights

`src/routes/status/` (`query.live` live stream), `src/lib/server/status-stream.ts`.

## OpenSpec & agent tooling

- **Subagents** — [`.cursor/agents/`](.cursor/agents/README.md)
- **OpenSpec** — `openspec/` (slash commands: `/opsx:apply`, etc.)
