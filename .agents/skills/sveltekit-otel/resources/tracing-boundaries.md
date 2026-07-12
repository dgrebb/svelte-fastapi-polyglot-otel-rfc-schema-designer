# Tracing boundaries

## Primary application path

```text
browser intent
  → browser operation
  → application API request
  → SvelteKit/application work
  → database operation
  → API response
  → browser response handling
  → state/store update
  → meaningful UI completion
```

The backend is the application API. The database is its primary child boundary.

## Occasional external boundaries

SSO, Microsoft Graph, and other external services are traced as client boundaries when used. Propagate context only to approved origins and only when the receiver supports it.

When a remote system cannot be traced, retain the local client span. Do not invent remote spans or claim unsupported end-to-end continuity.

## Initial document versus client operation

Initial SSR, browser document timing, hydration, and post-hydration readiness are separate phases. Correlating the server request with browser document telemetry is an explicit design choice with caching, sampling, privacy, and adapter implications.

Client-side CRUD operations normally propagate context through first-party fetch/XHR calls and continue in the browser through state/render completion when the product operation requires it.
