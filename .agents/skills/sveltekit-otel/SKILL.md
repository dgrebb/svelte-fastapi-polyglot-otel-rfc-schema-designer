---
name: sveltekit-otel
description: Design, implement, audit, and verify SvelteKit-native OpenTelemetry tracing across browser, application API, database, and browser completion.
---

# SvelteKit OpenTelemetry Skill

## Goal

Build truthful, low-noise causal traces for a CRUD application:

`user intent → browser operation → HTTP request → SvelteKit/application API → domain work → database → response → browser state update → meaningful UI completion`

Do not manufacture a distributed-system architecture that the application does not have.

## Before editing

1. Inspect installed SvelteKit, adapter, runtime, and `@opentelemetry/*` versions.
2. Inspect current official SvelteKit and OpenTelemetry documentation.
3. Inventory providers, exporters, processors, context managers, propagators, auto-instrumentations, vendor SDKs, and entrypoints.
4. Draw one representative user operation and assign ownership to every expected span.
5. Discover project naming, attributes, privacy, sampling, propagation, and service/resource conventions. Ask when material decisions are absent or ambiguous.

## Ownership precedence

1. SvelteKit built-in spans for framework lifecycles.
2. Runtime/library instrumentation for HTTP and database clients.
3. Vendor integration only where it adds value without duplication.
4. Manual spans for finite application-owned work or missing browser milestones.

Prefer enriching existing SvelteKit spans through `event.tracing.current` or `event.tracing.root` over wrapping framework operations.

## Browser model

Keep these distinct:

- document/navigation performance;
- SvelteKit client initialization and hydration;
- session/auth resolution;
- permissions/entitlements;
- critical data readiness;
- user intent;
- network request/response;
- store/state mutation;
- meaningful UI completion.

A fetch span ends when transport work ends. A surrounding user-operation span may continue through response handling, state mutation, and a deterministic UI milestone.

Do not keep spans open for a tab lifetime. Model subscription establishment separately from each later notification and its resulting work.

## Server model

Use `src/instrumentation.server.ts` when supported by the installed version and adapter. Verify current configuration requirements rather than copying old experimental flags.

Do not manually recreate spans for `handle`, load functions, actions, endpoints, or remote functions when current SvelteKit instrumentation already owns them.

Add manual children only for domain work the framework cannot know, such as authorization evaluation, orchestration, report assembly, policy calculation, or cache rebuild.

## Error and status policy

- Record an exception when it causes the represented operation to fail.
- Set `ERROR` when that operation failed.
- Rethrow unless the operation intentionally handles the failure.
- Do not force `OK` for every successful span; leave success `UNSET` unless project policy requires otherwise.
- Do not classify every expected 4xx or validation outcome as an unexpected system failure.
- Establish one clear owner for exception recording and correlated logging.

## Package and duplication audit

Check for:

- multiple `@opentelemetry/api` resolutions;
- mixed incompatible SDK package families;
- duplicate providers;
- aggregate and explicit instrumentations patching the same library;
- vendor and native instrumentation emitting the same lifecycle spans;
- browser fetch and XHR instrumentation duplicating one call path;
- manual HTTP/database spans duplicating protocol instrumentation.

## Verification

Use deterministic in-memory exporters and `SimpleSpanProcessor` in tests when appropriate. Verify:

- expected parent-child relationships;
- propagated `traceparent` reaches the API;
- database spans descend from the request/application operation;
- browser completion is represented separately from network completion;
- long-lived callbacks do not inherit stale active context;
- expected spans exist;
- duplicate or forbidden spans do not exist;
- sensitive/high-cardinality data is absent.

## Communication artifacts

Use Mermaid when it shortens or clarifies reasoning in:

- PR descriptions;
- OpenSpec proposals and changes;
- ADRs;
- architecture and repository documentation;
- user/developer documentation;
- trace lifecycle and propagation explanations.

Prefer the simplest useful diagram. Do not add diagrams that merely restate adjacent prose.

## Resources

Load only what the task needs:

- `resources/project-standards.md`
- `resources/preferred-otel-methods.md`
- `resources/tracing-boundaries.md`
- `resources/lifecycle-models.md`
- `resources/browser-to-api-tracing.md`
- `resources/telemetry-archeology.md`
- `resources/anti-patterns.md`
- `resources/with-span-helper.md`
- `resources/visual-communication.md`
