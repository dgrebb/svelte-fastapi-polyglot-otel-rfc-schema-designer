# Project standards

## Framework first

- Prefer SvelteKit-owned spans for SvelteKit lifecycles.
- Enrich existing framework spans before creating parallel wrappers.
- Prefer runtime/library spans for HTTP and database protocols.
- Add manual spans only for meaningful application-owned operations or missing browser milestones.

## Truthful lifetimes

- A span must end when the represented operation actually ends.
- Network completion is not automatically user-operation completion.
- Subscription establishment and later notification processing are separate lifetimes.
- Do not hold spans open solely to make a trace look continuous.

## Naming

- Do not invent or freeze project naming conventions.
- Preserve semantic-convention names for standardized protocol spans.
- Discover repository conventions and ask when custom operation, event, attribute, service, or resource naming is unclear.
- Use stable, low-cardinality names.

## Data

- Prefer bounded enums, booleans, counts, route templates, and operation categories.
- Avoid raw IDs, emails, tokens, bodies, query strings, arbitrary URLs, DOM text, and serialized objects unless explicitly approved.

## Status and errors

- Leave successful spans `UNSET` unless project policy requires otherwise.
- Set `ERROR` only when the represented operation failed.
- Record escaping exceptions once at the correct ownership layer.
- Treat expected business outcomes separately from system failures.

## Version drift

- Verify installed versions, generated/configuration types, adapter support, and current official docs.
- Do not preserve deprecated flags or remove required flags based on memory or publication date.
