# Browser-to-API tracing

## User operations

Instrument high-value product operations, not every click. A user operation may surround the network request when success includes browser-side response handling and visible state completion.

## Propagation

- Prefer supported fetch/XHR instrumentation for ordinary first-party calls.
- Restrict propagation to approved origins.
- Verify CORS allows required trace headers.
- Do not send internal context to arbitrary third parties.
- Avoid duplicate network spans from multiple browser SDKs.

## Completion

Choose a deterministic completion signal appropriate to the operation:

- store mutation committed;
- expected route/data settled;
- target UI state rendered;
- confirmation state visible;
- accessibility announcement completed when relevant.

Do not use arbitrary delays as readiness signals.

## Browser logs

Export browser logs only with an explicit privacy, sampling, and correlation policy. Verify trace/span IDs are present when logs claim trace correlation.
