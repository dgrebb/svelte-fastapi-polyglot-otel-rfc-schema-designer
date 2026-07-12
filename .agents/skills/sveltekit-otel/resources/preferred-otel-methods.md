# Preferred OpenTelemetry methods for SvelteKit

This is the default API vocabulary for the agent. It is not a naming standard. Discover repository conventions first and ask when span names, instrumentation-scope names, attribute names, or service identities are unclear.

## First choice: enrich work that already exists

### `event.tracing.current.setAttribute(...)`

Use inside SvelteKit request handling when the current framework span already represents the operation. This is usually preferable to creating a parallel manual span around a `load`, action, remote function, or hook.

### `event.tracing.root.setAttribute(...)`

Use for bounded request-wide facts that belong on SvelteKit's root `handle` span. Do not assume this is the outer Node HTTP transport root.

### `trace.getActiveSpan()`

Use sparingly to inspect or enrich the active span when dependency injection is impractical. Prefer an explicit `Span` argument in reusable helpers and domain instrumentation because hidden active-context assumptions are harder to test.

## Creating finite application-owned work

### `trace.getTracer(scopeName, scopeVersion?)`

Obtain a tracer for the module/library that owns the manual instrumentation. The scope name identifies the instrumentation producer; it is not the service name and should not be casually set to `default` or made identical to a framework instrumentation scope. Ask what convention the repository uses when unclear.

### `tracer.startActiveSpan(name, options?, context?, callback)`

Preferred for a finite application-owned operation when nested HTTP/database/manual spans should become children automatically.

Use when all of these are true:

- SvelteKit or auto-instrumentation does not already own the same operation;
- the operation has a deterministic end;
- child work executes within the callback;
- the runtime has a functioning context manager;
- the callback returns/awaits all work that belongs to the operation.

Always end the span in `finally`. Return the callback result. Rethrow failures unless the operation genuinely handles them.

Do not use it to keep a span open for a page, tab, subscription, listener, or other indefinite lifetime.

### `tracer.startSpan(name, options?, context?)`

Use only when callback-scoped active context is inappropriate or the lifetime must be managed elsewhere. Starting a span does not automatically make it active.

Typical legitimate cases:

- creating a short span that will have no nested child instrumentation;
- explicit lifecycle ownership across an API that cannot use a callback;
- creating a span from a deliberately chosen parent context;
- tests that need direct span control.

The code that starts the span must have an obvious owner responsible for ending it. If nested work should be parented to it, explicitly activate its context with `trace.setSpan(...)` plus `context.with(...)`, or redesign around `startActiveSpan`.

## Describing an operation

### `span.setAttribute(key, value)` / `span.setAttributes(attributes)`

Use attributes for facts describing the operation as a whole, especially facts known near span creation or useful for filtering/sampling.

Prefer OpenTelemetry semantic-convention attributes for standardized HTTP/database/protocol work. Use project attributes only for application semantics not covered by a standard. Keep values bounded, non-sensitive, and stable.

Do not put user IDs, emails, tokens, raw bodies, arbitrary URLs, button text, or unbounded values into span names or attributes without an explicit approved policy.

### `span.addEvent(name, attributes?)`

Use for a meaningful occurrence within an operation that needs its own timestamp or may occur zero or more times.

Good candidates:

- application readiness milestone reached;
- state/store update committed;
- live subscription established;
- retry scheduled;
- fallback path selected.

Do not add celebratory noise such as `fetched successfully` when the span end itself already communicates completion and no timestamped milestone is needed.

### `span.updateName(name)`

Use rarely. Prefer selecting a stable operation name at span creation. Do not rename auto-instrumented protocol spans merely to force a custom namespace. Any route-template correction must be applied through the instrumentation owner and verified for cardinality.

## Failures and completion

### `span.recordException(error)`

Use when an exception escapes the instrumented operation and causes it to fail. Do not record the same exception repeatedly on nested spans unless each span independently fails because of it.

Normalize unknown thrown values carefully. Avoid recording sensitive exception messages or payloads.

### `span.setStatus({ code: SpanStatusCode.ERROR, message? })`

Set `ERROR` when the operation represented by the span failed. A handled business outcome is not automatically a tracing error.

The optional message is a status description, not a dumping ground for raw exceptions or user data.

### Success status

Prefer leaving successful spans at the default `UNSET` status unless the project has a deliberate reason to assert `OK`. Standard protocol semantic conventions commonly require or recommend leaving successful status unset. Generic helpers must not force `OK` on every successful span.

### `span.end(endTime?)`

End each manually created span exactly once at the true end of the represented operation. Ending a fetch span does not necessarily end the surrounding user operation; browser state update and meaningful UI completion may belong to a surrounding application span.

## Context and trace boundaries

### `context.active()`

Read the current context only when the context manager has been initialized early enough and verified in the target runtime. Browser and server context propagation must be tested separately.

### `trace.setSpan(context, span)` and `context.with(context, callback)`

Use together when manual activation is truly necessary. Do not pass active contexts around indefinitely or reuse a context from a completed request as the parent of unrelated later work.

### `propagation.inject(...)` / `propagation.extract(...)`

Prefer library auto-instrumentation for the normal browser-to-API HTTP path. Use explicit inject/extract only for unsupported/custom boundaries. Restrict browser propagation to approved first-party origins.

### `span.addLink(...)` or span creation `links`

Use links when work is causally related but should not be a strict child: later subscription notifications, deferred processing, fan-in/fan-out, or work resumed after the initiating span ended. Do not use links as decoration or to conceal broken propagation.

## APIs to challenge during review

Challenge these usages unless evidence justifies them:

- `trace.getTracer('default')` scattered through components;
- `startActiveSpan` around framework-owned `load`, action, hook, or remote-function work;
- `startSpan` without an obvious `end()` owner;
- a span held open for a subscription's entire lifetime;
- `setStatus(OK)` in every helper;
- `recordException` plus duplicate logging/vendor capture at every layer;
- `addEvent('success')` on every successful operation;
- `updateName` used to impose project naming on HTTP/database spans;
- manual `propagation.inject` on ordinary fetch calls already covered by instrumentation;
- `trace.getActiveSpan()` used as invisible global state throughout business code.
