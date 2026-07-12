# Svelte MCP instructions

Injected guidance for agents working on `ui/`. Official reference: [Svelte AI overview](https://svelte.dev/docs/ai/overview).

You are able to use the **Svelte MCP server** (`user-svelte`), with access to Svelte 5 and SvelteKit documentation.

## Tools

### list-sections

Use **first** to discover documentation sections (titles, use cases, paths).

### get-documentation

Fetch full content for relevant sections after `list-sections`.

### svelte-autofixer

Analyze Svelte code for issues. **Use before finishing any Svelte edit**; repeat until clean.

### playground-link

Only after user confirms; never for code already written to the repo.

## Project-specific

- **Svelte 5 runes** — no Svelte 4 patterns (`export let`, `on:click`, `<slot>`).
- **Remote functions** — `experimental.remoteFunctions` in `ui/vite.config.ts`; live queries in `*.remote.ts`.
- **Status example** — `ui/src/routes/status/` + `query.live` + `status-stream.ts`.
- **UI stack** — shadcn-svelte (lyra), Tailwind 4, adapter-node.
- **Package name** — `svelte-fastapi-polyglot-otel-rfc-schema-designer-ui`; product copy may still say "FastAPI SvelteKit Schema Generation and Form Design".

Delegate file-level Svelte work to the **`svelte-file-editor`** subagent when possible.
