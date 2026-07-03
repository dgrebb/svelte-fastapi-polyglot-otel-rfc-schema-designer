## ADDED Requirements

### Requirement: Collector is the sole application telemetry destination

Applications SHALL export traces, metrics, and logs only to an OpenTelemetry Collector via OTLP. Applications SHALL NOT import or configure Grafana, Elastic, Loki, Tempo, Prometheus, or SaaS vendor SDKs directly.

#### Scenario: API exports telemetry

- **WHEN** `OTEL_ENABLED=true` on the API service
- **THEN** the API sends OTLP telemetry only to the configured `OTEL_EXPORTER_OTLP_ENDPOINT` (collector)

#### Scenario: UI exports telemetry

- **WHEN** `OTEL_ENABLED=true` on the UI service
- **THEN** the UI server sends OTLP telemetry only to the configured collector endpoint

### Requirement: Collector exposes standard OTLP receivers

The collector configuration SHALL accept OTLP gRPC on port `4317` and OTLP HTTP on port `4318`.

#### Scenario: gRPC receiver available

- **WHEN** the collector container is running
- **THEN** OTLP gRPC clients can reach `otel-collector:4317` on the compose network

#### Scenario: HTTP receiver available

- **WHEN** the collector container is running
- **THEN** OTLP HTTP clients can reach `otel-collector:4318` on the compose network

### Requirement: Collector includes baseline processors

The collector configuration SHALL include batch processing and memory limiting. It MAY include a resource processor for consistent attributes.

#### Scenario: High-volume burst handling

- **WHEN** multiple services emit spans concurrently during local dev
- **THEN** the collector batches and limits memory without crashing the collector process

### Requirement: Debug exporter for local sanity checks

The default dev collector config SHALL include a debug exporter so telemetry can be validated without any backend stack running.

#### Scenario: Collector-only validation

- **WHEN** only the collector profile is started and traffic is generated
- **THEN** trace/log/metric records appear in collector debug output

### Requirement: Swappable backend export via collector config files

Backend forwarding (Grafana/LGTM, Elastic) SHALL be configured only in collector YAML variants (`collector.grafana.yml`, `collector.elastic.yml`), selected by compose profile or make target — not by application code changes.

#### Scenario: Switch from Grafana to Elastic backend

- **WHEN** the operator starts the Elastic o11y profile instead of Grafana
- **THEN** applications continue using the same OTLP endpoint and no app env vars change except collector-internal routing

### Requirement: Consistent resource attributes

The collector and applications SHALL use these minimum resource attributes where applicable: `service.name`, `service.version`, `deployment.environment`, `app.component`, `runtime.name`.

#### Scenario: API resource attributes

- **WHEN** the API emits a span
- **THEN** the span resource includes `service.name=api`, `app.component=api`, and `deployment.environment` from env

#### Scenario: UI resource attributes

- **WHEN** the UI server emits a span
- **THEN** the span resource includes `service.name=ui`, `app.component=ui`, and `deployment.environment` from env

### Requirement: Observability stack is opt-in

Starting the default dev workflow (`make dev`) SHALL NOT require or start o11y services.

#### Scenario: Dev without o11y

- **WHEN** the operator runs `make dev` with no o11y profile
- **THEN** api and ui start normally with `OTEL_ENABLED` defaulting to off or no collector dependency
