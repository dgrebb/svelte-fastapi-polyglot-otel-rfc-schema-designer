## Why

The repo has no shared observability layer today — no structured logging, tracing, or metrics, and no way to correlate requests across the FastAPI API and SvelteKit UI. We need a dev-first, vendor-neutral foundation that lets us experiment with Grafana, Elastic, or SaaS backends without rewriting application instrumentation each time.

## What Changes

- Add an `o11y/` directory with OTel Collector configs and optional dev backend stacks (Grafana/LGTM, Elastic/Kibana) wired **only through the collector** — not in app code.
- Instrument FastAPI (`api`) with official OpenTelemetry Python packages, gated by `OTEL_ENABLED`, exporting OTLP to the collector.
- Instrument SvelteKit server (`ui`) with official OpenTelemetry Node packages, gated by `OTEL_ENABLED`, exporting OTLP HTTP to the collector.
- Add structured JSON logging with trace/span correlation on the API; document conventions for both stacks.
- Extend Compose/Makefile with optional o11y profiles that do not break `make dev`.
- Add `.env.example` seams for OTLP endpoints, resource attributes, and backend credentials (no committed secrets).
- Defer browser/client telemetry to a documented placeholder; server-side only in v1.
- Add local verification docs and telemetry conventions.

## Capabilities

### New Capabilities

- `otel-collector`: Collector-first telemetry seam — OTLP receivers, processors, debug exporter, and swappable backend export paths (Grafana, Elastic) configured in collector YAML only.
- `api-observability`: FastAPI tracing, metrics, structured logging, SQLAlchemy instrumentation, health-route exclusions, env-controlled initialization.
- `ui-observability`: SvelteKit server tracing via `instrumentation.server.ts` / hooks, env-controlled initialization, minimal status-route spans.
- `o11y-docs`: Conventions, local runbooks, production env seams, privacy rules, troubleshooting.

### Modified Capabilities

- _(none — no existing OpenSpec capability specs in `openspec/specs/`)_

## Impact

- **New directory**: `o11y/` (collector configs, compose overlay, docs).
- **API**: `api/app/observability.py` (new), `api/app/main.py`, `api/pyproject.toml` dependencies.
- **UI**: `ui/src/instrumentation.server.ts` (new), `ui/src/hooks.server.ts`, optional `ui/src/lib/telemetry/client.ts` placeholder, `ui/package.json` dependencies.
- **Root**: `makefile` targets, `.env.example`, optional compose env passthrough — no changes to `api/`/`ui/` layout or naming.
- **Dev workflow**: `make dev` unchanged; o11y is opt-in via `make o11y` / compose profiles.
- **Dependencies**: OpenTelemetry SDK + instrumentations for Python and Node; no Grafana/Elastic SDKs in application code.
