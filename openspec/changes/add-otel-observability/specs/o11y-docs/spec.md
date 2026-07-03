## ADDED Requirements

### Requirement: Local o11y runbook

The repo SHALL include `o11y/docs/local-o11y.md` with copy-paste commands to start: app only, collector only, Grafana profile, and Elastic profile; plus verification steps for API and UI telemetry.

#### Scenario: Collector-only smoke test

- **WHEN** a developer follows the collector-only section
- **THEN** they can confirm spans in collector debug output within 5 minutes of starting services

#### Scenario: Grafana validation path

- **WHEN** a developer follows the Grafana profile section
- **THEN** they can find traces/logs in the Grafana/LGTM UI after hitting API and UI endpoints

#### Scenario: Elastic validation path

- **WHEN** a developer follows the Elastic profile section
- **THEN** they can find indexed telemetry in Kibana after hitting API and UI endpoints

### Requirement: Telemetry conventions document

The repo SHALL include `o11y/docs/telemetry-conventions.md` defining a minimal cross-stack schema for log fields and span attributes, plus privacy rules.

#### Scenario: Required log fields documented

- **WHEN** a developer reads the conventions doc
- **THEN** they find standardized fields including `service.name`, `trace.id`, `span.id`, `http.method`, `http.route`, `http.status_code`, `error.type`, and `duration_ms`

#### Scenario: Privacy deny-list documented

- **WHEN** a developer reads the conventions doc
- **THEN** they find an explicit list of fields that MUST NOT be logged (auth headers, cookies, tokens, passwords, raw bodies, sensitive query params)

### Requirement: Production path documented without implementing secrets

Documentation SHALL describe the production seam (`api/ui → collector → backend`) and env vars (`OTEL_EXPORTER_OTLP_HEADERS`, sampler settings) without committing real credentials.

#### Scenario: Production env reference

- **WHEN** a developer reads the production section
- **THEN** they see required env vars and a note that secrets come from the deploy platform or secrets manager

### Requirement: Troubleshooting guide

Local docs SHALL cover common failures: collector receives nothing, OTLP gRPC vs HTTP mismatch, Docker hostname issues, SvelteKit instrumentation not running, missing trace IDs in logs, Elastic memory issues, Kibana startup delays, Grafana datasource gaps.

#### Scenario: OTLP protocol mismatch

- **WHEN** a developer sees collector receiving nothing from UI
- **THEN** the troubleshooting section explains checking HTTP vs gRPC endpoint ports

### Requirement: Makefile or compose discoverability

Root `makefile` SHALL expose targets such as `o11y`, `o11y-grafana`, and `o11y-elastic` (or equivalent) documented in the local runbook.

#### Scenario: Discoverable commands

- **WHEN** a developer runs `make` or reads the runbook
- **THEN** they find how to start o11y stacks without memorizing long compose command lines

### Requirement: Environment example file

The repo SHALL provide `.env.example` (or `o11y/.env.example`) listing OTel and backend variables with safe placeholder values, never real secrets.

#### Scenario: Safe defaults documented

- **WHEN** a developer copies `.env.example` to `.env`
- **THEN** they can enable local OTel without guessing variable names
