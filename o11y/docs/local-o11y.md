# Local o11y runbook

Collector-first dev telemetry for `api` + `ui`. Applications speak OTLP only to **otel-collector**; Grafana and Elastic are optional backends configured in collector YAML — never in app code.

## Prerequisites

- Docker Desktop (4 GB+ RAM recommended; Elastic profile wants more — see `elastic/README.md`)
- `make dev` or the o11y targets below

## Quick reference

| Target | What starts |
|--------|-------------|
| `make dev` | api + ui only — **no** telemetry |
| `make o11y` | api + ui + collector (debug exporter) |
| `make o11y-grafana` | above + Grafana LGTM → http://localhost:3001 |
| `make o11y-elastic` | above + Elasticsearch + Kibana → http://localhost:5601 |

Copy env template: `cp o11y/.env.example o11y/.env` (optional tweaks).

## 1. App only (baseline)

```bash
make dev
```

- API: http://localhost:8000/health
- UI: http://localhost:5173

`OTEL_ENABLED` is off — no collector required.

## 2. Collector only (debug exporter)

```bash
make o11y
```

Generates traffic:

```bash
curl -fsS http://localhost:8000/health
curl -fsS http://localhost:8000/entities
curl -fsS http://localhost:5173/
curl -fsS 'http://localhost:5173/status?format=json'
```

Watch collector output:

```bash
docker compose -f compose.yaml -f compose.dev.yaml -f o11y/compose.yaml logs -f otel-collector
```

Expect `Traces` / `Metrics` debug lines with `service.name` = `api` or `ui`.

## 3. Grafana LGTM profile

```bash
make o11y-grafana
```

1. Open http://localhost:3001 (Grafana — default anonymous admin in LGTM image)
2. **Explore → Tempo** — search for `service.name=api` or `service.name=ui`
3. Generate traffic (curl commands above)

Collector config: `o11y/otel/collector.grafana.yml` forwards OTLP HTTP to `http://lgtm:4318`.

## 4. Elastic + Kibana profile

```bash
make o11y-elastic
```

1. Wait for Elasticsearch healthy (`docker compose … ps`)
2. Kibana: http://localhost:5601
3. **Discover** — index patterns `traces-otel*`, `logs-otel*` (may take a minute after first spans)
4. Generate traffic

See `o11y/elastic/README.md` for memory troubleshooting.

## Manual compose (without make)

```bash
# Collector debug (config file relative to repo root via o11y/compose.yaml)
docker compose -f compose.yaml -f compose.dev.yaml -f o11y/compose.yaml --profile o11y up --build

# Grafana
OTEL_COLLECTOR_CONFIG_FILE=collector.grafana.yml \
  docker compose -f compose.yaml -f compose.dev.yaml -f o11y/compose.yaml \
  --profile o11y --profile o11y-grafana up --build
```

## Verify FastAPI telemetry

With o11y overlay active (`make o11y`):

```bash
curl -fsS http://localhost:8000/entities | head -c 200
docker compose -f compose.yaml -f compose.dev.yaml -f o11y/compose.yaml logs otel-collector --tail 30
```

API logs (JSON when `LOG_FORMAT=json`):

```bash
docker compose -f compose.yaml -f compose.dev.yaml -f o11y/compose.yaml logs api --tail 20
```

Look for `trace.id` / `span.id` on non-health requests.

## Verify SvelteKit server telemetry

```bash
curl -fsS http://localhost:5173/ -o /dev/null -w '%{http_code}\n'
docker compose -f compose.yaml -f compose.dev.yaml -f o11y/compose.yaml logs otel-collector --tail 30
```

`/status` health probes are excluded from HTTP auto-instrumentation to reduce noise.

## Production path (documented only)

```
api / ui  →  OTel Collector (sidecar or shared)  →  vendor backend
```

Environment seams (set in deploy platform — **never commit real values**):

| Variable | Purpose |
|----------|---------|
| `OTEL_ENABLED` | `true` to export |
| `OTEL_SERVICE_NAME` | `api` / `ui` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Collector URL |
| `OTEL_EXPORTER_OTLP_HEADERS` | Auth, e.g. `Authorization=Bearer <token>` |
| `OTEL_RESOURCE_ATTRIBUTES` | `deployment.environment=production,...` |
| `OTEL_TRACES_SAMPLER` | e.g. `parentbased_traceidratio` |
| `OTEL_TRACES_SAMPLER_ARG` | e.g. `0.1` |

Secrets belong in a secrets manager or platform env — not git.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Collector receives nothing | `OTEL_ENABLED=true`? Hostname `otel-collector` inside compose network? |
| UI spans missing, API OK | UI uses **HTTP** `:4318`; API uses **gRPC** `:4317` |
| Spans in collector, empty Grafana | LGTM profile running? `collector.grafana.yml` active? |
| Elastic won't start | RAM / `vm.max_map_count` — see `elastic/README.md` |
| Kibana stuck loading | Wait for ES green/yellow; check `docker compose logs elasticsearch` |
| SvelteKit OTel not running | `experimental.instrumentation.server` in `vite.config.ts`; `OTEL_ENABLED=true` |
| FastAPI too noisy | Adjust `OTEL_PYTHON_FASTAPI_EXCLUDED_URLS` |
| Logs missing trace IDs | `LOG_FORMAT=json` on API; ensure request runs inside an instrumented span |

## Browser telemetry

Deferred — see `ui/src/lib/telemetry/client.ts`. Server-side only in v1.
