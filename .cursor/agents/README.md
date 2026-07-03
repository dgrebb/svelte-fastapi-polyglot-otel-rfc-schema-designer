# Project subagents

Specialized agents for **svelte-fastapi-remote-functions**. Cursor loads definitions from `.cursor/agents/*.md` ([subagent format](https://cursor.com/docs/agent/subagents)).

The **main thread** (orchestrator) delegates atomic work here. Subagents run in isolated context; they must **report back** with summaries, blockers, and handoff notes.

## Roster

| Agent | When to delegate |
|-------|------------------|
| [`openspec-pm`](openspec-pm.md) | OpenSpec changes, proposals, tasks, multi-stream planning |
| [`svelte-file-editor`](svelte-file-editor.md) | Any `.svelte` / SvelteKit / remote functions work in `ui/` |
| [`fastapi-backend`](fastapi-backend.md) | FastAPI routes, models, SQLAlchemy, API tests in `api/` |
| [`unit-test`](unit-test.md) | Pytest (`api/`) or Vitest (`ui/`) unit tests |
| [`e2e-test`](e2e-test.md) | Playwright browser tests for `ui/` |
| [`docker-compose`](docker-compose.md) | Dockerfiles, `compose.yaml`, Makefile targets |

## Delegation rules

1. **One concern per subagent** — don't ask `svelte-file-editor` to redesign the API.
2. **Scope by directory** — `api/` vs `ui/` vs root compose/tooling.
3. **OpenSpec PM may spawn others** — it breaks down `openspec/changes/*` tasks and delegates implementation to specialists.
4. **Main thread stays informed** — every subagent ends with: status, files touched, next step, questions for the user.
5. **Commits** — follow [AGENTS.md](../../AGENTS.md): one-line conventional commits, `cz check`, scopes `api` / `ui` / etc. No bodies unless you need notes for branch review only.

## Svelte AI tooling

This project uses the official [Svelte MCP server](https://svelte.dev/docs/ai/overview) (`user-svelte` in Cursor). The `svelte-file-editor` subagent must use it. See also [`.cursor/instructions/svelte.md`](../instructions/svelte.md).

## OpenSpec

Specs live under `openspec/`. Skills and slash commands:

- `.cursor/skills/openspec-*`
- `/opsx:apply`, `/opsx:propose`, `/opsx:explore`, etc.
