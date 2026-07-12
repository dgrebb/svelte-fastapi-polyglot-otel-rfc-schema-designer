# Reviewing and using a `withSpan` helper

A span helper can be useful, but only for finite application-owned operations. It must not make manual instrumentation so easy that developers recreate SvelteKit and library auto-instrumentation.

## What the original helper gets right

- uses `startActiveSpan`, allowing nested work to inherit the active context;
- returns the wrapped result;
- records an escaping `Error`;
- marks failure and rethrows it;
- ends the span in `finally`;
- filters nullish attributes rather than exporting accidental `undefined` values.

## What should change

### Do not gate every span with a public environment variable

The OpenTelemetry API is designed to be a no-op when no provider is registered. Prefer controlling telemetry through provider initialization, sampling, exporter configuration, and build/deployment policy.

A wrapper-level flag can be justified for an explicit product policy, but it creates two execution/context paths and should not be the default mechanism.

### Do not force `SpanStatusCode.OK`

Successful spans normally remain `UNSET`; many semantic conventions explicitly leave successful protocol spans unset. A generic helper should set only `ERROR` when the represented operation fails.

### Pass the span to the callback

The operation may need a meaningful event, late-bound attribute, or link. Reaching for `trace.getActiveSpan()` inside the callback hides dependencies and makes tests less explicit.

### Use OpenTelemetry attribute types

Use `Attributes` rather than a custom scalar record. OTel attributes can include supported arrays, and using the official type keeps the helper aligned with the API.

### Identify the instrumentation scope deliberately

A module-level tracer is good. Its scope name should identify the instrumentation producer, not default to an unexplained `sveltekit` string that could be confused with framework-owned instrumentation. Do not set a convention here; inspect or ask.

### Preserve options rather than hiding every capability

A useful helper may accept `SpanOptions` and, only when needed, an explicit parent `Context`. Avoid growing it into a telemetry framework. If links, kinds, start times, or parent selection become common, domain-specific instrumentation may be clearer.

### Verify the context manager

`startActiveSpan` only provides useful child parentage when the server/browser SDK and context manager are initialized correctly. Add tests proving nested spans have the expected parent.

## Safer baseline

This is a shape, not a mandatory project convention:

```ts
import {
  SpanStatusCode,
  trace,
  type Attributes,
  type Span,
  type SpanOptions
} from '@opentelemetry/api';

// Ask for or discover the repository's instrumentation-scope convention.
const tracer = trace.getTracer('PROJECT_INSTRUMENTATION_SCOPE');

export async function withActiveSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options: SpanOptions = {},
  attributes?: Attributes
): Promise<T> {
  return tracer.startActiveSpan(
    name,
    {
      ...options,
      attributes: {
        ...options.attributes,
        ...attributes
      }
    },
    async (span) => {
      try {
        return await fn(span);
      } catch (error) {
        if (error instanceof Error) {
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
          });
        } else {
          span.setStatus({ code: SpanStatusCode.ERROR });
        }
        throw error;
      } finally {
        span.end();
      }
    }
  );
}
```

Before adopting it, answer:

1. Which operations may use this helper?
2. Which SvelteKit/framework operations are forbidden because they already emit spans?
3. What instrumentation-scope name/version convention does the repository use?
4. What span naming and custom attribute policy applies?
5. Is exception text allowed in status descriptions?
6. Are browser and server implementations both expected to use it?
7. Do tests prove nested HTTP/database spans are parented correctly?

## BAD / GOOD examples

### BAD: wrapping framework-owned work

```ts
export const load = async (event) =>
  withActiveSpan('load contacts', async () => {
    return getContacts(event.locals.user.id);
  });
```

SvelteKit already owns the `load` lifecycle. Enrich `event.tracing.current` and rely on HTTP/database instrumentation. Add a child span only for a distinct domain operation the framework cannot know.

### GOOD: a finite browser operation extending past fetch

```ts
await withActiveSpan('PROJECT_DEFINED_CONTACT_REFRESH_OPERATION', async (span) => {
  const nextContacts = await contactsRepository.list();
  contacts.set(nextContacts);
  span.addEvent('PROJECT_DEFINED_CONTACT_STATE_UPDATED');
  await waitForMeaningfulContactsUiCompletion();
});
```

This can be appropriate when the product-defined operation is explicitly “refresh contacts and make the result usable,” not merely “perform fetch.” The names and completion mechanism remain project decisions.

### BAD: one span for an indefinite subscription

```ts
await withActiveSpan('setup live contacts', async () => {
  await db.live('users', handleEveryFutureNotification);
});
```

The callback lifetime and subscription lifetime are not the same operation.

### GOOD: separate establishment from delivery

```text
subscription establishment span -> ends when established
later notification -> new processing span, optionally linked to subscription metadata/context
processing -> refresh/state mutation -> meaningful UI completion
```
