# Telemetry archeology

When reviewing manual spans, first identify the lifecycle the author was trying to observe.

The implementation may be wrong while the intended observability boundary is valuable.

## Review method

1. Name the intended user or system operation.
2. Identify its true start and end.
3. Separate framework, transport, domain, state, render, and long-lived callback lifecycles.
4. Determine which parts are already instrumented.
5. Preserve missing business milestones with the smallest truthful manual telemetry.
6. Remove duplicate or misleading wrappers.

## Example

### ❌ BAD

```text
component mount
  → manual fetch/store span
  → long-lived subscription span
```

This asks component mount to own route loading, auth, network, state, readiness, subscription setup, and future notifications.

### ✅ GOOD

```text
SvelteKit navigation/load → API → database → response
browser operation → state update → meaningful UI completion
subscription setup → established
later notification → processing operation → refresh/mutation → UI completion
```
