# svelte-fastapi-remote-functions

A full-stack example pairing **SvelteKit remote functions** (`query.live` + SSE) with a **FastAPI** backend.

The UI is a small “Agent Orchestrator” demo app. The backend exposes generic entity CRUD and workflow APIs. The standout piece is the **`/status`** page: live frontend telemetry streamed from the server with a shared poll-and-broadcast hub — no custom SSE routes, no API status endpoints.

## Stack

| Layer | Tech |
|-------|------|
| UI | Svelte 5, SvelteKit 3 (remote functions), shadcn-svelte, Tailwind 4, adapter-node |
| API | FastAPI, SQLAlchemy, SQLite, Pydantic |
| Runtime | Docker Compose, Node 24, Python 3.12 |

## Quick start

**New here?** One-time bootstrap (Node, pnpm, Python, Docker checks, deps, Playwright, git hooks):

```bash
make setup
```

**Development** (hot reload, UI on :5173, API on :8000):

```bash
make dev
```

**Production compose** (UI on :3000, API on :8000):

```bash
make up
```

Other targets: `make build-prod`, `make down`, `make logs`.

## What to look at

### Live status stream (`query.live`)

- [`ui/src/routes/status/status.remote.ts`](ui/src/routes/status/status.remote.ts) — `query.live` remote function
- [`ui/src/lib/server/status-stream.ts`](ui/src/lib/server/status-stream.ts) — server-side polling, `listeners` `Set`, `Promise.withResolvers`, fan-out to all clients
- [`ui/src/routes/status/+page.svelte`](ui/src/routes/status/+page.svelte) — consumes the live query (`status.current`, `status.connected`)

Kubernetes / Docker readiness probe (one-shot JSON, not SSE):

```bash
curl -fsS 'http://localhost:3000/status?format=json'
```

### FastAPI backend

- [`api/app/main.py`](api/app/main.py) — app entry, `/health`
- [`api/app/routers/`](api/app/routers/) — entity CRUD + workflow graph
- OpenAPI docs: http://localhost:8000/docs

### Remote functions config

Remote functions are enabled in [`ui/vite.config.ts`](ui/vite.config.ts) (`experimental.remoteFunctions` + Svelte `async`).

## Project layout

```
api/          FastAPI service
ui/           SvelteKit frontend
compose.yaml  Production stack
compose.dev.yaml  Dev overrides (bind mounts, hot reload)
Makefile      dev | up | down | build-prod
```

## Local development (without Docker)

**API:**

```bash
cd api
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
make dev
```

**UI:**

```bash
cd ui
pnpm install
pnpm dev
```

Set `PUBLIC_API_URL=http://localhost:8000` if the UI runs outside Compose.

## Contributing

- **[AGENTS.md](AGENTS.md)** — conventions for humans and LLM agents (worktrees, scopes, releases).
- **Commits** — one-line [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) + `wip`; scope optional. Rules in [`.cz.toml`](.cz.toml). **No commit bodies** — put detail in PR descriptions.
- **PRs** — squash-merged; **PR title** (one line) is the canonical commit on `main`.
- **Hooks** — `make setup` or `make install-hooks` (Python Commitizen in `api/.venv`, `.githooks/commit-msg`).
- **Releases** — independent per package: `make bump-api` → tag `api-X.Y.Z`, `make bump-ui` → tag `ui-X.Y.Z` (no `v` prefix).
