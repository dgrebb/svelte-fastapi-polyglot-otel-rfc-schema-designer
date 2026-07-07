## 1. o11y infrastructure

- [x] 1.1 Create `o11y/` directory layout (`otel/`, `grafana/`, `elastic/`, `docs/`)
- [x] 1.2 Add `o11y/otel/collector.dev.yml` — OTLP receivers (4317/4318), batch, memory_limiter, debug exporter
- [x] 1.3 Add `o11y/otel/collector.grafana.yml` — forward traces/logs/metrics to LGTM endpoints
- [x] 1.4 Add `o11y/otel/collector.elastic.yml` — forward to Elasticsearch
- [x] 1.5 Add `o11y/compose.yaml` with profiles: `o11y` (collector), `o11y-grafana`, `o11y-elastic`
- [x] 1.6 Add `o11y/.env.example` with OTel + backend placeholder vars (no secrets)
- [x] 1.7 Add `o11y/elastic/README.md` — memory requirements, startup troubleshooting

## 2. Makefile & compose wiring

- [x] 2.1 Add `COMPOSE_O11Y` variable and targets: `o11y`, `o11y-grafana`, `o11y-elastic` to root `makefile`
- [x] 2.2 Pass `OTEL_*` env vars to `api` and `ui` services when o11y profile is active
- [x] 2.3 Verify `make dev` still works unchanged without o11y profiles

## 3. API instrumentation

- [x] 3.1 Add OTel dependencies to `api/pyproject.toml`
- [x] 3.2 Create `api/app/observability.py` with env-gated `setup()` / `shutdown()`
- [x] 3.3 Wire observability into `api/app/main.py` lifespan
- [x] 3.4 Instrument FastAPI, logging, SQLAlchemy; exclude `/health`
- [x] 3.5 Add structured JSON logging with trace/span ID correlation (`LOG_FORMAT=json`)
- [x] 3.6 Set `service.version` from pyproject version

## 4. UI server instrumentation

- [x] 4.1 Add OTel dependencies to `ui/package.json`
- [x] 4.2 Create `ui/src/instrumentation.server.ts` — env-gated Node SDK init, OTLP HTTP export
- [x] 4.3 Extend `ui/src/hooks.server.ts` with safe request span attributes (preserve status JSON behavior)
- [x] 4.4 Add optional lightweight span in status collection (`app.feature=status`)
- [x] 4.5 Create `ui/src/lib/telemetry/client.ts` no-op placeholder with privacy/deferral comments
- [x] 4.6 Verify `pnpm dev`, `pnpm build`, and adapter-node production start with `OTEL_ENABLED` on/off

## 5. Documentation & verification

- [x] 5.1 Write `o11y/docs/local-o11y.md` — runbooks for collector-only, Grafana, Elastic paths
- [x] 5.2 Write `o11y/docs/telemetry-conventions.md` — log fields, span attributes, privacy deny-list
- [x] 5.3 Document production env seams (`OTEL_EXPORTER_OTLP_HEADERS`, sampler) without real secrets
- [x] 5.4 Smoke-test: API endpoint → collector debug output
- [x] 5.5 Smoke-test: UI page load → collector debug output
- [x] 5.6 Smoke-test: `make o11y-grafana` — traces visible in LGTM UI
- [x] 5.7 Smoke-test: `make o11y-elastic` — telemetry visible in Kibana
