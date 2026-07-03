## ADDED Requirements

### Requirement: Server-side observability only in v1

The first implementation SHALL instrument the SvelteKit **server** only. Browser/client telemetry SHALL NOT send data by default.

#### Scenario: No client beacons

- **WHEN** a user loads the UI in a browser with default config
- **THEN** no telemetry is sent directly from the browser to the collector or any backend

### Requirement: Observability is env-gated

SvelteKit server observability SHALL initialize only when `OTEL_ENABLED=true`.

#### Scenario: Dev server without OTel

- **WHEN** `pnpm dev` runs with OTel disabled
- **THEN** the dev server starts with no OTel SDK initialization and existing hooks behavior is unchanged

#### Scenario: Dev server with OTel

- **WHEN** `OTEL_ENABLED=true` and collector HTTP endpoint is reachable
- **THEN** server request handling creates spans exported via OTLP HTTP/protobuf

### Requirement: Adapter-node compatibility

Instrumentation SHALL work with `@sveltejs/adapter-node` production builds without breaking `pnpm build` or `node build`.

#### Scenario: Production build succeeds

- **WHEN** `pnpm build` runs with OTel dependencies installed
- **THEN** the build completes and the server entry can initialize OTel when enabled at runtime

### Requirement: SvelteKit instrumentation entry point

Server telemetry setup SHALL use SvelteKit's `instrumentation.server.ts` hook when supported by the installed Kit version, with `hooks.server.ts` wrapping request handling for span attributes as needed.

#### Scenario: Request span attributes

- **WHEN** a page request is handled by the UI server with OTel enabled
- **THEN** the root span includes `http.method`, `http.route` (or pathname), and `app.component=ui`

### Requirement: Status route low-risk spans

The status subsystem (`status.remote.ts`, `collectStatus`, `status-stream`) MAY receive minimal spans (e.g. `app.feature=status`) but SHALL NOT be over-instrumented.

#### Scenario: Status JSON healthcheck

- **WHEN** `/status?format=json` is requested with OTel enabled
- **THEN** at most one lightweight span is created for status aggregation, excluded from high-cardinality attributes

### Requirement: OTLP HTTP to collector

The UI server SHALL default to OTLP HTTP on port `4318` (`OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`) unless overridden by env.

#### Scenario: HTTP export to collector

- **WHEN** UI OTel is enabled in Docker Compose
- **THEN** spans are sent to `http://otel-collector:4318` without gRPC client dependencies

### Requirement: Client telemetry placeholder

A placeholder module (e.g. `ui/src/lib/telemetry/client.ts`) SHALL exist documenting deferred browser telemetry options and privacy constraints, exporting a no-op by default.

#### Scenario: Placeholder is inert

- **WHEN** client code imports the placeholder
- **THEN** no network calls are made unless explicitly enabled in a future change

### Requirement: No PII in spans or logs

The UI server SHALL NOT attach cookies, tokens, full URLs with sensitive query params, or request bodies to spans or logs.

#### Scenario: Query string sanitization

- **WHEN** a request URL contains sensitive query parameters
- **THEN** span attributes use a sanitized route or pathname without sensitive values
