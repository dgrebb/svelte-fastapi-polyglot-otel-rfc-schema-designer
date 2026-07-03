## 1. o11y infrastructure

- [ ] 1.1 Create `o11y/` directory layout (`otel/`, `grafana/`, `elastic/`, `docs/`)
- [ ] 1.2 Add `o11y/otel/collector.dev.yml` — OTLP receivers (4317/4318), batch, memory_limiter, debug exporter
- [ ] 1.3 Add `o11y/otel/collector.grafana.yml` — forward traces/logs/metrics to LGTM endpoints
- [ ] 1.4 Add `o11y/otel/collector.elastic.yml` — forward to Elasticsearch
- [ ] 1.5 Add `o11y/compose.yaml` with profiles: `o11y` (collector), `o11y-grafana`, `o11y-elastic`
- [ ] 1.6 Add `o11y/.env.example` with OTel + backend placeholder vars (no secrets)
- [ ] 1.7 Add `o11y/elastic/README.md` — memory requirements, startup troubleshooting

## 2. Makefile & compose wiring

- [ ] 2.1 Add `COMPOSE_O11Y` variable and targets: `o11y`, `o11y-grafana`, `o11y-elastic` to root `makefile`
- [ ] 2.2 Pass `OTEL_*` env vars to `api` and `ui` services when o11y profile is active
- [ ] 2.3 Verify `make dev` still works unchanged without o11y profiles

## 3. API instrumentation

- [ ] 3.1 Add OTel dependencies to `api/pyproject.toml`
- [ ] 3.2 Create `api/app/observability.py` with env-gated `setup()` / `shutdown()`
- [ ] 3.3 Wire observability into `api/app/main.py` lifespan
- [ ] 3.4 Instrument FastAPI, logging, SQLAlchemy; exclude `/health`
- [ ] 3.5 Add structured JSON logging with trace/span ID correlation (`LOG_FORMAT=json`)
- [ ] 3.6 Set `service.version` from pyproject version

## 4. UI server instrumentation

- [ ] 4.1 Add OTel dependencies to `ui/package.json`
- [ ] 4.2 Create `ui/src/instrumentation.server.ts` — env-gated Node SDK init, OTLP HTTP export
- [ ] 4.3 Extend `ui/src/hooks.server.ts` with safe request span attributes (preserve status JSON behavior)
- [ ] 4.4 Add optional lightweight span in status collection (`app.feature=status`)
- [ ] 4.5 Create `ui/src/lib/telemetry/client.ts` no-op placeholder with privacy/deferral comments
- [ ] 4.6 Verify `pnpm dev`, `pnpm build`, and adapter-node production start with `OTEL_ENABLED` on/off

## 5. Documentation & verification

- [ ] 5.1 Write `o11y/docs/local-o11y.md` — runbooks for collector-only, Grafana, Elastic paths
- [ ] 5.2 Write `o11y/docs/telemetry-conventions.md` — log fields, span attributes, privacy deny-list
- [ ] 5.3 Document production env seams (`OTEL_EXPORTER_OTLP_HEADERS`, sampler) without real secrets
- [ ] 5.4 Smoke-test: API endpoint → collector debug output
- [ ] 5.5 Smoke-test: UI page load → collector debug output
- [ ] 5.6 Smoke-test: `make o11y-grafana` — traces visible in LGTM UI
- [ ] 5.7 Smoke-test: `make o11y-elastic` — telemetry visible in Kibana
