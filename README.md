# svelte-fastapi-polyglot-otel-rfc-schema-designer

A **code-along example** for pairing **SvelteKit remote functions** with a **FastAPI** backend — without hand-writing API wrapper routes.

This repo is the companion to a blog series that walks through the same pipeline twice: once with **Valibot**, once with **Zod**. Each approach lives on its own git branch so you can code along without manual file surgery.

## Code-along branches

| Branch | Blog track | What you get |
|--------|------------|--------------|
| [`valibot`](../../tree/valibot) | Part 1 — Valibot | Valibot generator, Valibot `generated/`, Valibot `backend-fetch` |
| [`zod`](../../tree/zod) | Part 2 — Zod | Both generators; Zod canonical in `generated/`; `generated-zod/` for comparison |
| `main` | Latest hub | Tracks `zod` after publish; use for ongoing development |

```bash
git checkout valibot   # Part 1 — Valibot
git checkout zod       # Part 2 — Zod
```

> **On `zod`:** canonical FastAPI SvelteKit Schema Generation and Form Design/generated/` uses **Zod**. The Valibot generator is still present for side-by-side comparison. Switch to `valibot` for the Valibot-only track.

## What you'll build

The contract pipeline:

```
FastAPI / Pydantic  →  openapi.json  →  runtime schemas  →  .remote.ts  →  handcrafted UI
```

Generated code is **infrastructure, not product UI**. Humans still own pages, forms, copy, and UX. The generator gives you typed, validated primitives:

- runtime schemas (Valibot or Zod, depending on branch)
- TypeScript types inferred from those schemas
- SvelteKit remote functions (`query`, `form`, `command`)
- endpoint metadata for tooling and exploration

The demo app is a small **Agent Orchestrator**: entity CRUD on the API, a live **`/status`** page (`query.live`), and an **`/admin/api-explorer`** page to try generated remotes.

## Valibot vs Zod (on the `zod` branch)

Both approaches share the same OpenAPI input and remote-function mapping. Only the schema emitter and runtime validation library differ.

| | Valibot | Zod |
|---|---------|-----|
| Generator | [`ui/scripts/generate-api.mjs`](ui/scripts/generate-api.mjs) | [`ui/scripts/generate-api-zod.mjs`](ui/scripts/generate-api-zod.mjs) |
| Canonical output | `ui/src/lib/generated/` (on `valibot` branch) | `ui/src/lib/generated/` (on `zod` branch) |
| Side-by-side staging | — | `ui/src/lib/generated-zod/` |
| Generate | `pnpm generate:api` | `pnpm generate:api:zod` |
| Drift check | `pnpm check:generated` | `pnpm check:generated:zod` |

On **`zod`**, regenerate canonical output with:

```bash
cd ui
pnpm generate:api:zod:canonical
pnpm check
```

Compare both generators without overwriting canonical output:

```bash
cd ui
pnpm generate:api:zod      # writes src/lib/generated-zod/
pnpm check:generated:zod
```

## Quick start

**One-time bootstrap** (Node, pnpm, Python, Docker, deps, hooks):

```bash
make setup
```

**Development** (hot reload — UI :5173, API :8000):

```bash
make dev
```

Open the app at **`http://localhost:5173`** (not `127.0.0.1` — SvelteKit remote POSTs enforce origin matching).

**Production compose** (UI :3000, API :8000):

```bash
make up
```

## Code-along workflow

### 1. Pick your branch

```bash
git checkout valibot   # or: git checkout zod
```

### 2. Export OpenAPI from FastAPI

```bash
make export-openapi    # writes api/openapi.json
```

### 3. Generate the frontend contract

```bash
cd ui
pnpm generate:api                  # Valibot (valibot branch, or comparison on zod)
pnpm generate:api:zod:canonical    # Zod canonical (zod branch only)
pnpm check
```

### 4. Explore generated remotes

- **Metadata:** [`ui/src/lib/generated/metadata/endpoints.ts`](ui/src/lib/generated/metadata/endpoints.ts)
- **Remotes:** [`ui/src/lib/generated/remotes/agents.remote.ts`](ui/src/lib/generated/remotes/agents.remote.ts)
- **Try it out:** http://localhost:5173/admin/api-explorer (with `make dev` running)

### 5. Use remotes in handcrafted UI

Import generated remotes and schemas directly in Svelte pages — no `+server.ts` API routes for backend calls. Remotes call FastAPI **server-side** via [`backend-fetch.ts`](ui/src/lib/server/backend-fetch.ts).

Remote kind mapping (both generators):

| HTTP | Remote kind |
|------|-------------|
| GET | `query` |
| POST / PATCH with body | `form` |
| DELETE | `command` |

## Stack

| Layer | Tech |
|-------|------|
| UI | Svelte 5, SvelteKit 3 (remote functions), shadcn-svelte, Tailwind 4, adapter-node |
| Schemas | Valibot (`valibot` branch) or Zod (`zod` branch) |
| API | FastAPI, SQLAlchemy, SQLite, Pydantic |
| Runtime | Docker Compose, Node 24, Python 3.12 |

## What else is in the repo

### Live status stream (`query.live`)

Hand-written, not generated:

- [`ui/src/routes/status/status.remote.ts`](ui/src/routes/status/status.remote.ts)
- [`ui/src/lib/server/status-stream.ts`](ui/src/lib/server/status-stream.ts)
- [`ui/src/routes/status/+page.svelte`](ui/src/routes/status/+page.svelte)

### FastAPI backend

- [`api/app/main.py`](api/app/main.py) — `/health`
- [`api/app/routers/`](api/app/routers/) — entity CRUD + workflows
- OpenAPI docs: http://localhost:8000/docs

### Remote functions config

Enabled in [`ui/vite.config.ts`](ui/vite.config.ts). Internal URLs (`/_app/remote/...`) are **SvelteKit plumbing** — the browser talks to SvelteKit; SvelteKit calls FastAPI on the server.

## Project layout (`zod` branch)

```
api/openapi.json              exported contract (make export-openapi)
ui/scripts/
  generate-api.mjs            Valibot generator
  generate-api-zod.mjs        Zod generator
ui/src/lib/
  generated/                  canonical contract (Zod on this branch)
  generated-zod/              parallel Zod output for comparison
  server/backend-fetch.ts
ui/src/routes/admin/api-explorer/
```

## Environment

| Variable | Purpose |
|----------|---------|
| `API_BASE_URL` | Server-side FastAPI URL (`http://api:8000` in Docker) |
| `PUBLIC_API_URL` | Fallback (`http://localhost:8000` in dev) |
| `ORIGIN` | Must match browse host (`http://localhost:5173` in dev) |

See [`ui/.env.example`](ui/.env.example). Never commit real `.env` files.

## Further reading

- **[ui/README.md](ui/README.md)** — UI generation scripts
- **[AGENTS.md](AGENTS.md)** — repo conventions
- [SvelteKit remote functions](https://svelte.dev/docs/kit/remote-functions)

## Contributing

- **Commits** — [Conventional Commits](https://www.conventionalcommits.org/); detail in PR descriptions
- **Hooks** — `make install-hooks`
- **Releases** — `make bump-api` → `api-X.Y.Z`, `make bump-ui` → `ui-X.Y.Z`
