# svelte-fastapi-remote-functions

Polyglot monorepo pairing **SvelteKit remote functions** with a **FastAPI** backend — without hand-writing API wrapper routes.

The UI consumes a generated contract from the API’s OpenAPI spec: runtime schemas, inferred TypeScript types, and SvelteKit remotes (`query`, `form`, `command`). Generated code is infrastructure; pages, forms, and UX remain handcrafted.

## Contract pipeline

```
FastAPI / Pydantic  →  openapi.json  →  runtime schemas  →  .remote.ts  →  handcrafted UI
```

The generator produces:

- runtime schemas (Valibot or Zod)
- TypeScript types inferred from those schemas
- SvelteKit remote functions mapped from HTTP verbs
- endpoint metadata for tooling and exploration

The demo app is a small **Agent Orchestrator**: entity CRUD on the API, a live **`/status`** page (`query.live`), **`/admin/api-explorer`** to try generated remotes, and **`/form-design`** to work through schema-driven form layout and interaction.

## Valibot and Zod

Both generators read the same **`api/openapi.json`** and emit the same remote-function shape. Only the schema library and validation calls differ. The pattern is identical either way:

1. Export OpenAPI from FastAPI (`make export-openapi`)
2. Run the generator for your chosen library
3. Import from `ui/src/lib/generated/` in Svelte — remotes call FastAPI **server-side** via [`backend-fetch.ts`](ui/src/lib/server/backend-fetch.ts)

**Why both?** Valibot and Zod are both common in SvelteKit ecosystems. This repo ships two emitters so you can compare bundle size, ergonomics, and JSON Schema output without changing the OpenAPI → remote mapping. On `main` / `zod`, **Zod is canonical** in `generated/`; the Valibot generator remains for side-by-side comparison.

| | Valibot | Zod |
|---|---------|-----|
| Generator | [`ui/scripts/generate-api.mjs`](ui/scripts/generate-api.mjs) | [`ui/scripts/generate-api-zod.mjs`](ui/scripts/generate-api-zod.mjs) |
| Canonical output | `ui/src/lib/generated/` on `valibot` branch | `ui/src/lib/generated/` on `zod` / `main` |
| Side-by-side staging | — | `ui/src/lib/generated-zod/` |
| Generate | `pnpm generate:api` | `pnpm generate:api:zod` |
| Drift check | `pnpm check:generated` | `pnpm check:generated:zod` |

Remote kind mapping (both generators):

| HTTP | Remote kind |
|------|-------------|
| GET | `query` |
| POST / PATCH with body | `form` |
| DELETE | `command` |

### Branches

| Branch | Role |
|--------|------|
| [`valibot`](../../tree/valibot) | Valibot-only track — `generated/` uses Valibot |
| [`zod`](../../tree/zod) | Both generators; Zod canonical in `generated/` |
| `main` | Ongoing development; tracks the Zod setup |

```bash
git checkout valibot   # Valibot canonical output
git checkout zod       # Zod canonical output + Valibot generator for comparison
```

On **`zod` / `main`**, regenerate canonical Zod output:

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

## Regenerating the contract

### 1. Export OpenAPI from FastAPI

```bash
make export-openapi    # writes api/openapi.json
```

### 2. Generate the frontend contract

```bash
cd ui
pnpm generate:api                  # Valibot
pnpm generate:api:zod:canonical    # Zod (canonical on zod / main)
pnpm check
```

### 3. Explore generated remotes

- **Metadata:** [`ui/src/lib/generated/metadata/endpoints.ts`](ui/src/lib/generated/metadata/endpoints.ts)
- **Remotes:** [`ui/src/lib/generated/remotes/agents.remote.ts`](ui/src/lib/generated/remotes/agents.remote.ts)
- **Try it out:** http://localhost:5173/admin/api-explorer
- **Form design:** http://localhost:5173/form-design

### 4. Use remotes in UI

Import generated remotes and schemas in Svelte pages — no `+server.ts` routes for backend calls.

## Stack

| Layer | Tech |
|-------|------|
| UI | Svelte 5, SvelteKit 3 (remote functions), shadcn-svelte, Tailwind 4, adapter-node |
| Schemas | Valibot or Zod (your choice) |
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

## Project layout

```
api/openapi.json              exported contract (make export-openapi)
ui/scripts/
  generate-api.mjs            Valibot generator
  generate-api-zod.mjs        Zod generator
ui/src/lib/
  generated/                  canonical contract (library depends on branch)
  generated-zod/              parallel Zod output for comparison (zod branch)
  server/backend-fetch.ts
ui/src/routes/
  admin/api-explorer/
  form-design/
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
