## ADDED Requirements

### Requirement: Observability is env-gated

FastAPI observability initialization SHALL occur only when `OTEL_ENABLED=true`. When disabled, the API SHALL behave as it does today with no OTel overhead.

#### Scenario: OTel disabled

- **WHEN** `OTEL_ENABLED` is unset or `false`
- **THEN** no OpenTelemetry providers are registered and `/health` still returns `{"status":"ok"}`

#### Scenario: OTel enabled

- **WHEN** `OTEL_ENABLED=true` and a reachable collector endpoint is configured
- **THEN** FastAPI request spans are exported via OTLP gRPC to the collector

### Requirement: Minimal centralized setup module

API observability setup SHALL live in a small module (e.g. `api/app/observability.py`) called from app startup, not scattered across routers.

#### Scenario: Startup initialization

- **WHEN** the FastAPI app starts with OTel enabled
- **THEN** `observability.setup()` (or equivalent) configures tracing, metrics, and log correlation before request handling

### Requirement: FastAPI auto-instrumentation

The API SHALL use official `opentelemetry-instrumentation-fastapi` for HTTP span creation.

#### Scenario: Entity request traced

- **WHEN** a client calls a CRUD endpoint on `/entities`
- **THEN** a server span is created with `http.method`, `http.route`, and `http.status_code` attributes

### Requirement: SQLAlchemy instrumentation

Because the API uses SQLAlchemy (`api/app/db/database.py`), the API SHALL enable `opentelemetry-instrumentation-sqlalchemy` when OTel is enabled.

#### Scenario: Database operation attributed

- **WHEN** a request triggers a SQLAlchemy query
- **THEN** a child span or attributes include `db.system=sqlite` and `db.operation` where available

### Requirement: Noisy routes excluded

Health and status endpoints SHALL be excluded from trace creation to avoid polluting backends.

#### Scenario: Health check excluded

- **WHEN** a probe hits `GET /health`
- **THEN** no trace span is created for that request

### Requirement: Structured JSON logging with trace correlation

When `LOG_FORMAT=json`, API logs SHALL be structured JSON and SHALL include `trace.id` and `span.id` when a trace context is active.

#### Scenario: Error log carries trace IDs

- **WHEN** a handled exception occurs during an instrumented request
- **THEN** the JSON log line includes `trace.id` and `span.id` matching the active span

### Requirement: Service version in telemetry

API telemetry resource attributes SHALL include `service.version` sourced from `api/pyproject.toml` project version (or `OTEL_RESOURCE_ATTRIBUTES` override).

#### Scenario: Version attribute present

- **WHEN** a span is exported from the API
- **THEN** `service.version` matches the API package version (e.g. `0.1.0`)

### Requirement: No secrets in telemetry

The API SHALL NOT log or attach auth headers, cookies, tokens, passwords, or raw request bodies to spans or structured logs.

#### Scenario: Authorization header not logged

- **WHEN** a request includes an `Authorization` header
- **THEN** neither logs nor span attributes contain the header value
