## Context

Polyglot monorepo: FastAPI (`api/`) + SvelteKit adapter-node (`ui/`), started via `make dev` (`compose.yaml` + `compose.dev.yaml`). No logging, tracing, or metrics today — Python uses no structured logger; UI has a minimal `hooks.server.ts` status shortcut only. SQLAlchemy is in use (SQLite). SvelteKit is on `next` with experimental remote functions.

The prompt in `tmp/cursor-otel-observability-prompt.md` scopes a dev-first OTel foundation. **Key constraint from the user:** OTel Collector is first-class in infrastructure; Grafana and Elastic are swappable dev backends wired **only through collector config** — never in application code.

## Goals / Non-Goals

**Goals:**

- Collector-first telemetry seam with OTLP from `api` and `ui` server
- Opt-in dev stacks under repo-root `o11y/` (numeronym — keeps root tidy)
- Env-gated instrumentation (`OTEL_ENABLED`) — zero overhead when off
- Structured JSON logs on API with trace/span correlation
- Makefile targets: `o11y`, `o11y-grafana`, `o11y-elastic`
- Docs, conventions, `.env.example` seams for production later

**Non-Goals:**

- Kubernetes, SaaS vendor SDKs in apps, browser RUM in v1
- Renaming `api/` or `ui/`, monorepo restructure
- Production secrets or full prod deploy
- Dual first-class Grafana + Elastic code paths in `api`/`ui`

## Decisions

### 1. Root directory: `o11y/` not `observability/`

**Choice:** `o11y/` at repo root for collector configs, compose overlay, docs, and backend-specific subdirs.

**Rationale:** Shorter root tree; numeronym matches team preference. App modules keep descriptive names (`api/app/observability.py`) — only infra lives under `o11y/`.

**Layout:**

```txt
o11y/
  compose.yaml              # overlay — profiles for collector, grafana, elastic
  otel/
    collector.dev.yml       # debug exporter (default)
    collector.grafana.yml   # export to LGTM stack
    collector.elastic.yml   # export to Elastic
  grafana/
    provisioning/datasources/
    dashboards/
  elastic/
    README.md               # memory notes, troubleshooting
  docs/
    local-o11y.md
    telemetry-conventions.md
  .env.example
```

### 2. Collector-first; backends are compose profiles only

**Choice:** Apps → OTLP → `otel-collector`. Backend selection = which collector config file + compose profile is active.

```
┌─────────┐     OTLP gRPC      ┌──────────────────┐     ┌─────────────┐
│   api   │ ──────────────────▶│                  │────▶│ debug (dev) │
└─────────┘     :4317            │  otel-collector  │     └─────────────┘
┌─────────┐     OTLP HTTP        │                  │────▶│ Grafana/LGTM  │  profile: grafana
│   ui    │ ──────────────────▶│                  │     └─────────────┘
└─────────┘     :4318            │                  │────▶│ ES + Kibana │  profile: elastic
                                 └──────────────────┘     └─────────────┘
```

**Alternatives rejected:**

- App-level Grafana Faro / Elastic APM agents — couples code to vendor
- Running LGTM + Elastic always — heavy; profiles keep `make dev` lean

### 3. Grafana path: `grafana/otel-lgtm` single container

**Choice:** Use `grafana/otel-lgtm` for fastest local traces/logs/metrics validation.

**Alternative:** Separate Tempo + Loki + Prometheus + Grafana — more explicit but more compose YAML and wiring. Revisit if LGTM is too opaque.

### 4. Compose integration: separate overlay file

**Choice:**

```bash
docker compose -f compose.yaml -f compose.dev.yaml -f o11y/compose.yaml --profile o11y up
```

Profiles: `o11y` (collector), `o11y-grafana`, `o11y-elastic`. Makefile wraps these as `make o11y`, etc.

**Rationale:** Does not touch base `compose.yaml` services; `make dev` unchanged.

### 5. API: OTLP gRPC; UI: OTLP HTTP

**Choice:** API → `http://otel-collector:4317` (grpc). UI Node SDK → `http://otel-collector:4318` (http/protobuf).

**Rationale:** Python gRPC exporter is mature; Node HTTP avoids extra gRPC deps in Vite/SvelteKit dev. Document port mismatch in troubleshooting.

### 6. API module: `api/app/observability.py`

Small `setup()` / `shutdown()` called from `main.py` lifespan. Instrument: FastAPI, logging, SQLAlchemy. Exclude `/health` (and UI `/status` on UI side).

### 7. UI: `instrumentation.server.ts` + hooks wrapper

Use SvelteKit server instrumentation if supported by installed Kit `next`. Gate on `OTEL_ENABLED`. Placeholder `ui/src/lib/telemetry/client.ts` — no-op, documented deferral.

### 8. Resource attributes

| Attribute | api | ui |
|-----------|-----|-----|
| `service.name` | `api` | `ui` |
| `service.version` | pyproject | package.json / env |
| `deployment.environment` | `local` (dev) | `local` |
| `app.component` | `api` | `ui` |
| `runtime.name` | `python` | `nodejs` |

Versions align with existing `ui/src/lib/server/versions.ts` pattern; API reads pyproject.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| SvelteKit `next` instrumentation API unstable | Feature-flag via `OTEL_ENABLED`; test `pnpm dev` + `pnpm build` in CI |
| Elastic dev stack RAM-hungry | Document in `o11y/elastic/README.md`; elastic profile opt-in only |
| Collector config drift between backends | Shared base in `collector.dev.yml`; backend files only differ in exporters |
| Docker dev UI container can't read `api/pyproject.toml` | Pass `API_VERSION` via compose when o11y profile active |
| Over-instrumentation noise | Exclude health/status; conventions doc sets boundaries |
| LGTM black-box | Document URLs/ports; allow swap to explicit stack later |

## Migration Plan

1. Land `o11y/` infra + docs (no app changes) — validate collector-only with debug exporter
2. Add API instrumentation behind `OTEL_ENABLED=false` default
3. Add UI instrumentation behind same flag
4. Wire compose env for o11y profile; add makefile targets
5. Verify Grafana profile, then Elastic profile independently

**Rollback:** Set `OTEL_ENABLED=false` or omit o11y compose overlay. Remove `o11y/` directory if abandoning entirely — apps have no vendor coupling.

## Open Questions

- Does SvelteKit `3.0.0-next` expose stable `instrumentation.server.ts`? Spike during apply.
- Log export via OTLP from Python/Node in v1, or stdout JSON + collector filelog receiver? Start with stdout JSON + trace IDs; OTLP logs if low-friction.
- Single `.env.example` at repo root vs `o11y/.env.example`? Prefer `o11y/.env.example` for backend creds + root note in README.
