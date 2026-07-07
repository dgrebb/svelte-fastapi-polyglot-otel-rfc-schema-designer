# Telemetry conventions

Cross-stack field names for logs and spans in `api` and `ui`. Aligns with OpenTelemetry semantic conventions where practical.

## Resource attributes (required minimum)

| Attribute | api | ui |
|-----------|-----|-----|
| `service.name` | `api` | `ui` |
| `service.version` | pyproject / package metadata | `UI_VERSION` env |
| `deployment.environment` | `local` (dev) | `local` |
| `app.component` | `api` | `ui` |
| `runtime.name` | `python` | `nodejs` |

## Log fields (JSON)

| Field | Description |
|-------|-------------|
| `timestamp` | ISO-8601 UTC |
| `level` | `INFO`, `WARN`, `ERROR`, … |
| `message` | Human-readable summary |
| `logger` | Logger name (API) |
| `service.name` | Service identifier |
| `service.version` | Release version |
| `trace.id` | Hex trace ID when in active span |
| `span.id` | Hex span ID when in active span |
| `error.type` | Exception class on errors |
| `error.message` | Exception message on errors |

Optional when relevant:

| Field | Description |
|-------|-------------|
| `app.feature` | e.g. `status` |
| `http.method` | HTTP verb |
| `http.route` | Route template or sanitized pathname |
| `http.status_code` | Response status |
| `db.system` | e.g. `sqlite` |
| `db.operation` | SQL operation name |
| `duration_ms` | Span or operation duration |

## Span attributes

Use on server spans:

- `http.method`, `http.route`, `http.status_code`
- `app.component`, `app.feature`
- `error.type` on failures (via `recordException`)

## Privacy — never log or attach

- Authorization headers, cookies, session tokens
- Passwords, API keys, secrets
- Raw request/response bodies
- Full form submissions
- PII (SSN, payment, medical, email unless explicitly approved)
- Full URLs with sensitive query parameters — use pathname / sanitized route only

## Sanitization

v1 relies on convention + instrumentation defaults (no body logging). A shared sanitizer helper may be added later.

## Release tags vs display

- Git tags: `api-0.1.0`, `ui-0.0.1` (Commitizen hyphen format)
- Status page display: `api@0.1.0 | ui@0.0.1`

## Collector routing

Applications export OTLP to the collector only. Backend selection (debug, Grafana LGTM, Elastic) is **collector config** in `o11y/otel/` — not application env.
