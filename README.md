# svelte-fastapi-polyglot-otel-rfc-schema-designer

A **code-along example** for pairing **SvelteKit remote functions** with a **FastAPI** backend — without hand-writing API wrapper routes.

This repo is the companion to a blog series that walks through the same pipeline twice: once with **Valibot**, once with **Zod**. Each approach lives on its own git branch so you can code along without manual file surgery.

> **You are on `valibot`** — the Valibot-only track (blog Part 1). For Zod (Part 2), run `git checkout zod`.

## Code-along branches

| Branch | Blog track | What you get |
|--------|------------|--------------|
| **`valibot`** (you are here) | Part 1 — Valibot | Valibot generator, Valibot `generated/`, Valibot `backend-fetch` |
| [`zod`](../../tree/zod) | Part 2 — Zod | Both generators; Zod canonical in `generated/`; `generated-zod/` for comparison |
| `main` | Latest hub | Tracks `zod` after publish |

```bash
git checkout valibot   # Part 1 — Valibot (this branch)
git checkout zod       # Part 2 — Zod
```

> **On `zod`:** canonical FastAPI SvelteKit Schema Generation and Form Design/generated/` uses **Zod**. The Valibot generator is still present for side-by-side comparison. Switch to `valibot` for the Valibot-only track.

## What you'll build

The contract pipeline:

```
FastAPI / Pydantic  →  openapi.json  →  runtime schemas  →  .remote.ts  →  handcrafted UI
```

Generated code is **infrastructure, not product UI**. The generator gives you:

- Valibot schemas (Standard Schema compatible with SvelteKit remotes)
- TypeScript types inferred from those schemas
- SvelteKit remote functions (`query`, `form`, `command`)
- endpoint metadata for tooling and exploration

The demo app is a small **Agent Orchestrator**: entity CRUD on the API, a live **`/status`** page (`query.live`), and an **`/admin/api-explorer`** page to try generated remotes.

## Valibot on this branch

| | Valibot (`valibot` branch) | Zod (`zod` branch) |
|---|---------------------------|-------------------|
| Generator | [`ui/scripts/generate-api.mjs`](ui/scripts/generate-api.mjs) | `generate-api-zod.mjs` (on `zod` only) |
| Output | `ui/src/lib/generated/` | `generated/` + `generated-zod/` |
| Generate | `pnpm generate:api` | `pnpm generate:api:zod:canonical` |
| Drift check | `pnpm check:generated` | `pnpm check:generated:zod` |

On **`valibot`**, regenerate with:

```bash
cd ui
pnpm generate:api
pnpm check
```

[`backend-fetch.ts`](ui/src/lib/server/backend-fetch.ts) on this branch validates responses with **Valibot** `safeParse`.

## Quick start

```bash
make setup
make dev
```

Open **`http://localhost:5173`** (not `127.0.0.1` — SvelteKit remote POSTs enforce origin matching).

Production compose: `make up` (UI :3000, API :8000).

## Code-along workflow

### 1. Export OpenAPI

```bash
make export-openapi    # writes api/openapi.json
```

### 2. Generate the frontend contract

```bash
cd ui
pnpm generate:api
pnpm check
```

### 3. Explore generated remotes

- [`ui/src/lib/generated/metadata/endpoints.ts`](ui/src/lib/generated/metadata/endpoints.ts)
- [`ui/src/lib/generated/remotes/agents.remote.ts`](ui/src/lib/generated/remotes/agents.remote.ts)
- http://localhost:5173/admin/api-explorer

### 4. Use remotes in handcrafted UI

Remotes call FastAPI **server-side** via `backend-fetch` — no custom `+server.ts` API routes.

| HTTP | Remote kind |
|------|-------------|
| GET | `query` |
| POST / PATCH with body | `form` |
| DELETE | `command` |

## Stack

| Layer | Tech |
|-------|------|
| UI | Svelte 5, SvelteKit 3 (remote functions), shadcn-svelte, Tailwind 4 |
| Schemas | **Valibot** (this branch) |
| API | FastAPI, SQLAlchemy, SQLite, Pydantic |

## What else is in the repo

- **Live status** — [`ui/src/routes/status/`](ui/src/routes/status/) (`query.live`)
- **FastAPI** — [`api/app/routers/`](api/app/routers/), docs at http://localhost:8000/docs
- **Remote functions** — [`ui/vite.config.ts`](ui/vite.config.ts); `/_app/remote/...` is SvelteKit plumbing, not your API

## Project layout (`valibot` branch)

```
api/openapi.json
ui/scripts/generate-api.mjs     Valibot generator
ui/src/lib/generated/           Valibot schemas, types, remotes
ui/src/lib/server/backend-fetch.ts
ui/src/routes/admin/api-explorer/
```

## Environment

| Variable | Purpose |
|----------|---------|
| `API_BASE_URL` | Server-side FastAPI URL |
| `PUBLIC_API_URL` | Fallback (`http://localhost:8000`) |
| `ORIGIN` | Match browse host (`http://localhost:5173`) |

See [`ui/.env.example`](ui/.env.example).

## Further reading

- **[ui/README.md](ui/README.md)** — UI generation commands
- **[AGENTS.md](AGENTS.md)** — repo conventions
- [SvelteKit remote functions](https://svelte.dev/docs/kit/remote-functions)
- **`zod` branch** — same pipeline with Zod (`git checkout zod`)

## Contributing

- **Commits** — [Conventional Commits](https://www.conventionalcommits.org/)
- **Hooks** — `make install-hooks`
- **Releases** — `make bump-api`, `make bump-ui`
