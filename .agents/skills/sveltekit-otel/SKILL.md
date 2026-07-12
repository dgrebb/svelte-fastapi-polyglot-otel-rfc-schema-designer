---
name: sveltekit-otel
description: Design, implement, audit, and verify SvelteKit-native OpenTelemetry tracing for a browser-to-CRUD-API-to-database application, including the response path back to browser state and rendering.
---

# SvelteKit OpenTelemetry Skill

## Use this skill when

- adding or reviewing SvelteKit observability;
- diagnosing incomplete or fragmented traces;
- connecting browser actions to server/API work;
- reviewing `instrumentation.server.ts`, hooks, loads, actions, remote functions, endpoints, or browser instrumentation;
- resolving duplicate `@opentelemetry/*` dependencies or overlapping instrumentations;
- designing application-readiness, auth, permissions, or post-hydration spans;
- integrating OTLP, Grafana Tempo, Jaeger, Honeycomb, Sentry, Datadog, New Relic, Azure Monitor, or another OTel-compatible backend.

## Canonical facts to verify against installed versions

- SvelteKit integrated observability is available from 2.31.
- Server tracing and server instrumentation are opt-in experimental features in the current documented API.
- Built-in server spans cover handle hooks, server/universal loads executed on the server, form actions, and remote functions.
- `src/instrumentation.server.ts` is the framework-supported early initialization point when the adapter supports it.
- `event.tracing.root` is the SvelteKit root-handle span, not necessarily the outer HTTP transport span created by Node HTTP instrumentation.
- SvelteKit uses `@opentelemetry/api`; an SDK or vendor distribution often supplies it transitively. Add it directly only when needed and keep one compatible resolution.
- Browser OTel remains less mature and more weakly specified than Node instrumentation. Require stronger validation and narrower scope.

Always consult current official SvelteKit and OpenTelemetry documentation before changing an implementation.

## Project conventions are discovered, not invented

Before introducing or changing custom span names, attribute namespaces, event names, service names, or resource conventions:

1. inspect repository documentation, existing telemetry, dashboards, collector transforms, and backend queries;
2. identify whether a convention already exists and whether it is internally consistent;
3. preserve a coherent existing convention unless the task explicitly includes migration;
4. ask the user or project owner when the intended convention is missing, conflicting, or materially ambiguous.

Do not silently establish a permanent naming scheme. A colon-delimited pattern such as `frontend:service-name:service-method` may be a project candidate, but it is not a default or an OpenTelemetry requirement. Treat any example naming pattern as provisional until the project defines it.

When work must proceed before clarification, make the uncertainty visible, isolate names behind constants/helpers where practical, and avoid a broad irreversible rename.

### Naming constraints that still apply

Whatever project convention is selected, names must remain:

- stable across executions;
- low-cardinality;
- operation-oriented rather than instance-oriented;
- free of raw IDs, URLs, query strings, user text, and secrets;
- distinguishable across browser, the SvelteKit application API, and database spans without relying on accidental backend presentation.

Prefer established OpenTelemetry semantic-convention span names for standardized protocols such as HTTP, database, RPC, and messaging. Apply project naming conventions primarily to custom application/domain spans. Do not rename auto-instrumented protocol spans merely to make every span visually match a custom namespace.

## Workflow

### 1. Inventory the runtime

Collect:

- SvelteKit and adapter versions;
- Svelte/Vite/Node versions;
- deployment target and process lifetime;
- package manager and workspace layout;
- telemetry backend and collector path;
- current environment variables;
- all `@opentelemetry/*`, vendor observability, logging, and tracing packages;
- all instrumentation entrypoints and hooks;
- relevant CORS and CSP configuration.

Useful commands, adapted to the package manager:

```sh
pnpm why @opentelemetry/api
pnpm list -r --depth Infinity | grep -E '@opentelemetry|sentry|datadog|newrelic|azure-monitor'
rg -n "instrumentation\.server|NodeSDK|WebTracerProvider|registerInstrumentations|getNodeAutoInstrumentations|traceparent|tracestate|baggage|startActiveSpan|startSpan|event\.tracing" .
```

Inspect the lockfile. Record multiple versions, peer warnings, and packages that bundle or pin OTel components.

### 2. Draw the actual lifecycle

Do not start with code. Map the application’s real phases:

```text
initial request
  -> adapter/runtime transport
  -> SvelteKit handle sequence
  -> auth/session lookup
  -> layout/page server loads
  -> SSR render
  -> HTML received
  -> browser document timing
  -> SvelteKit client initialization/hydration
  -> client auth/session reconciliation
  -> permissions/entitlements
  -> critical page data/UI ready
  -> user interaction
  -> client navigation/fetch/action/remote call
  -> SvelteKit server operation
  -> application database operation
  -> API response serialization/return
  -> browser response handling
  -> state/store update
  -> resulting UI render or interaction completion
```

Mark which phases are server-only, browser-only, repeated on navigation, optional, parallel, or background.

### 3. Assign instrumentation ownership

Use this precedence:

1. SvelteKit built-in spans for SvelteKit framework operations.
2. Runtime/library auto-instrumentation for HTTP, Undici, database clients, Redis, etc.
3. Vendor integrations only where they add backend-specific value without duplicating 1 or 2.
4. Manual instrumentation for domain semantics, browser completion milestones, and missing lifecycle phases.

Never manually wrap every `load`, action, or hook merely because an older example did so.

### 4. Initialize the server correctly

Prefer `src/instrumentation.server.ts`.

A generic Node shape is:

```ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { createAddHookMessageChannel } from 'import-in-the-middle';
import { register } from 'node:module';

const { registerOptions } = createAddHookMessageChannel();
register('import-in-the-middle/hook.mjs', import.meta.url, registerOptions);

const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME ?? 'sveltekit-app',
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();
```

Treat this as a shape, not blindly reusable production code. Adapt exporter protocol, resource detection, sampling, metrics/logs, exclusions, and runtime shutdown behavior.

Do not initialize a second provider if a vendor distro already owns the provider.

### 5. Enable and enrich SvelteKit spans

Enable the documented flags for the installed version.

Use `event.tracing.current` or `event.tracing.root` to add safe, bounded attributes to existing framework spans.

Good enrichment:

- auth result category;
- tenant tier or feature cohort from a bounded enum;
- cache hit/miss;
- rendering mode;
- stable route ID/template;
- permission decision outcome;
- internal operation version.

Bad enrichment:

- raw tokens;
- email/name/address;
- complete request or response bodies;
- arbitrary query strings;
- database statements containing values;
- user-generated text;
- raw unique IDs as span names.

### 6. Model browser telemetry deliberately

Separate four concerns:

#### A. Navigation/document performance

`DocumentLoadInstrumentation` can represent browser document timing for the initial document. It does not prove hydration, auth, permissions, or application readiness.

Use it only when those browser timing spans answer a real question.

#### B. SvelteKit application readiness

Create explicit domain telemetry around the app’s readiness coordinator. Example conceptual span:

```text
app.bootstrap
  event: client_runtime_ready
  child: session.resolve
  child: permissions.load
  child: critical_data.settle
  event: critical_ui_interactive
```

End the span at a deterministic product-defined milestone. Put later optional/background work in separate traces or linked spans.

Avoid keeping a span open for the whole tab lifetime.

#### C. User intent

Instrument high-value interactions, not every click.

Prefer semantic operations such as:

- `ui.search.submit`;
- `ui.checkout.confirm`;
- `ui.project.open`;
- `ui.report.generate`.

Use low-cardinality attributes for component/interaction type. Never use button text or arbitrary DOM content without sanitization.

#### D. Browser network calls

Use fetch/XHR instrumentation selectively. Configure propagation allowlists/regexes for first-party origins. Verify:

- context is active when the call begins;
- `traceparent` reaches the server;
- CORS allows the trace headers for cross-origin calls;
- OPTIONS requests are not misinterpreted as business requests;
- third-party calls do not receive internal trace context;
- duplicate fetch spans are not emitted by both vendor and OTel instrumentation.

### 7. Connect initial SSR and browser traces carefully

The server’s initial HTTP trace and the browser’s document timing occur in different runtimes. To correlate them, consider injecting a valid `traceparent` into the generated HTML for document-load instrumentation.

Before doing so, answer:

- Which server span should be the parent?
- Is the backend able to display a browser child whose parent has already ended?
- Is sampling consistent?
- Does HTML caching make injected context unsafe or incorrect?
- Could one user receive another request’s trace metadata?
- Are CSP, templating, and streaming compatible?

Never cache per-request trace context in shared HTML.

### 8. Apply semantic conventions and error semantics

Use current OpenTelemetry semantic-convention attribute names for standardized concepts before creating application-specific attributes. Verify the names against the installed semantic-conventions package and the current stability level; do not rely on stale examples.

Examples of standardized concerns include:

- HTTP request method, route template, response status, server address, and URL components;
- database system, namespace, operation, collection/table, and sanitized statements where permitted;
- RPC system/service/method;
- messaging destination and operation;
- exception and error type;
- resource identity such as `service.name`, `service.namespace`, `service.version`, and deployment environment attributes.

Application-specific attributes are allowed when no semantic convention exists. Namespace them according to the project’s documented convention, keep values bounded, and ask when that convention is not defined. Do not manufacture look-alike `http.*`, `db.*`, `rpc.*`, or other reserved-style attributes.

For span status:

- leave successful spans unset unless the chosen instrumentation/library has a documented reason to do otherwise;
- record an exception and set error status when the operation represented by the span fails;
- do not mark a span failed merely because a handled child operation returned an expected business/validation outcome;
- follow current HTTP semantic-convention guidance for client/server status behavior rather than applying one blanket rule to every span kind;
- avoid recording the same exception independently in framework instrumentation, a manual span, a logger, and a vendor SDK without a deduplication strategy.

Use span events for meaningful milestones inside an operation. Keep structured logs for durable diagnostic records, cross-trace operational events, and information that must remain queryable independently. “Use an event” is not a reason to discard logs; decide ownership and avoid duplicate noise.

### 9. Preserve the primary CRUD trace

The main trace target for this application is:

```text
browser intent
  -> browser operation span
  -> HTTP client span
  -> API server/SvelteKit span
  -> authorization and application operation
  -> database client span
  -> response serialization and return
  -> browser response handling
  -> state update
  -> resulting render or interaction-complete milestone
```

The network request normally provides direct parentage through the API and database portion. The browser work after the response is not automatically represented merely because the HTTP client span ended. Model that completion deliberately with a surrounding browser operation span, child spans, or milestone events whose lifetime matches the real user operation.

Do not keep a span open indefinitely just to force a visually continuous trace. End it at a deterministic milestone such as data committed to the store, target view rendered, mutation confirmation visible, or another product-defined completion point.

The API is the backend of the application, not a generic “downstream API.” Use “external service” only for actual outside boundaries such as SSO, Microsoft Graph, or infrastructure the project calls but does not own. When an external call supports W3C propagation, verify it explicitly; when it does not, retain the client span as the observable boundary without inventing remote spans.

For SSO redirects or other flows that cannot remain one strict parent-child trace, use correlation attributes or links only when technically valid and safe. Never claim end-to-end trace continuity through a system that does not propagate or expose trace context.

### 10. Correlate logs

A logging strategy must answer:

- where logs are produced;
- whether trace ID and span ID are injected automatically or manually;
- whether browser logs are exported, sampled, redacted, or intentionally local;
- whether server logs use structured fields;
- whether exceptions are recorded once rather than duplicated by logger, span, and vendor SDK;
- whether the backend joins logs and traces by IDs and resource attributes.

Test log correlation from inside an active SvelteKit load/action and inside an active database or approved external-client span.

### 11. Audit duplicate packages and overlapping behavior

Build two graphs.

#### Version graph

Look for multiple copies of:

- `@opentelemetry/api`;
- SDK/provider packages;
- semantic conventions;
- instrumentation base packages;
- exporter/core packages.

A duplicate `@opentelemetry/api` can break global registration or context expectations. A duplicate SDK package can also signal incompatible package families even when the API is deduped.

#### Responsibility graph

Flag overlaps such as:

- SvelteKit built-in load spans plus custom load wrappers;
- Node auto-instrumentations plus explicit HTTP/Undici/database instrumentation;
- vendor SvelteKit request spans plus SvelteKit built-in spans;
- OTel fetch instrumentation plus vendor browser network tracing;
- document-load instrumentation plus custom `document.read`/`page.load` spans covering the same timing;
- two exporters or processors unintentionally sending every span twice;
- both browser and server service names set to the same indistinguishable resource identity.

Do not remove a package solely because names overlap. Prove duplicated responsibility from configuration and emitted traces.

## Trace tests

Prefer deterministic tests over screenshots of a trace UI. For unit and integration tests:

- use an in-memory exporter with a `SimpleSpanProcessor` so assertions do not depend on batch timing;
- create and shut down providers inside test boundaries so global registration does not leak between tests;
- assert span name, kind, parent/span context, selected attributes, events, status, and exception data;
- assert absence as well as presence: no duplicate SvelteKit load span, no second fetch span, no propagation to an unapproved origin;
- normalize or predicate-match generated IDs and timestamps rather than snapshotting unstable fields;
- test sampled and unsampled behavior when custom sampling decisions matter;
- use a local collector or backend integration test for exporter/transport configuration, but keep core trace-shape tests backend-independent.

Do not mock the tracing API when an in-memory exporter can validate the real provider and processor behavior. Do not use `SimpleSpanProcessor` as a production recommendation merely because it is preferred in tests.

## Instrumentation boundary heuristic

Create spans primarily around work that crosses a meaningful boundary or has independent latency/failure semantics:

- network calls and server request handling;
- database, cache, filesystem, and other I/O;
- SSO redirects, external calls, and asynchronous continuations when present;
- domain operations whose timing or failure is useful on its own;
- readiness phases whose completion changes what the user can do.

Do not span every function. For short milestones within one operation, prefer events or bounded attributes.

## Anti-pattern catalog

### “React cargo cult”

Symptoms:

- route-change instrumentation based on React Router conventions;
- component render spans around ordinary Svelte updates;
- assumptions about effect timing copied from `useEffect`;
- one root provider mounted in a component after important module initialization;
- wrappers around every server handler despite SvelteKit built-ins.

Correction: redesign around SvelteKit SSR, universal/server loads, hydration, `$app/navigation`, invalidation, form enhancement, actions, and remote functions.

### “Document loaded, app ready”

Symptoms:

- `documentLoad` or `window.load` renamed to `app.ready`;
- auth/permissions/data work occurs after the span ends;
- dashboards claim startup success while users still see skeletons or blocked UI.

Correction: preserve document timing as document timing and add explicit readiness telemetry.

### “Span confetti”

Symptoms:

- spans around setters, mapping loops, and trivial helpers;
- thousands of click spans;
- span names include IDs or URLs;
- trace views become slower than debugging from logs.

Correction: retain operations with latency, failure, boundary, or business meaning; use events for milestones.

### “False root”

Symptoms:

- code treats `event.tracing.root` as the Node HTTP root;
- route naming changes are applied to the SvelteKit root while the outer HTTP span remains generic;
- duplicate root-looking spans appear.

Correction: distinguish transport instrumentation from SvelteKit root-handle instrumentation and configure/enrich each through its actual owner.

### “Late SDK”

Symptoms:

- NodeSDK starts in `hooks.server.ts`;
- database/http modules import before SDK startup;
- traces appear inconsistently in dev versus build.

Correction: initialize via `instrumentation.server.ts` and verify import order in the built adapter output.

### “Traceparent everywhere”

Symptoms:

- browser propagation targets match all URLs;
- third-party analytics/CDNs receive trace headers;
- CORS failures appear after enabling tracing.

Correction: use explicit first-party propagation targets and test preflight behavior.

## Verification protocol

Capture at least these journeys when applicable:

1. initial SSR page load with auth and permissions;
2. client-side navigation with universal/client load behavior;
3. enhanced form action or remote function;
4. browser call to a separate API service;
5. server call to database/cache/external API;
6. handled validation error;
7. unhandled server exception;
8. cancelled navigation or aborted fetch;
9. sampled-out request;
10. cold start and graceful shutdown/serverless completion behavior.

For each, verify:

- one trace or intentionally linked traces;
- correct parent-child ordering;
- no duplicate framework/network spans;
- meaningful stable names;
- expected route and service attributes;
- readiness milestone accuracy;
- trace/log correlation;
- no sensitive payloads;
- exporter success and bounded overhead.

## Expected review language

Be direct:

- “This duplicates SvelteKit’s built-in load span.”
- “This measures browser document timing, not application readiness.”
- “The SDK starts after the module it is intended to patch.”
- “This injects trace context into every origin and must be restricted.”
- “These two packages both register HTTP instrumentation.”
- “This span name has unbounded cardinality.”
- “This is a SvelteKit lifecycle problem being solved with a React lifecycle assumption.”

Then provide the smallest safe correction and a trace-based verification step.
