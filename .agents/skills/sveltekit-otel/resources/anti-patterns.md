# Anti-patterns

## Duplicate framework lifecycle

### ❌ BAD

Wrap an entire `handle`, load, action, endpoint, or remote function in a new manual span.

### ✅ GOOD

Enrich the existing framework span and add children only for distinct domain work.

## Duplicate protocol telemetry

### ❌ BAD

Create manual HTTP or database spans when supported instrumentation already emits them.

### ✅ GOOD

Configure and verify the instrumentation owner; add application semantics on surrounding domain/framework spans.

## False readiness

### ❌ BAD

Rename document-load or fetch completion as application readiness.

### ✅ GOOD

Track explicit hydration, auth, permission, data, state, and UI milestones as required.

## Indefinite active span

### ❌ BAD

Keep one span active for a subscription or browser session so later work appears connected.

### ✅ GOOD

End setup promptly; create new spans or links for later events.

## Ceremonial telemetry

### ❌ BAD

Add success events, duration attributes, and `OK` status to every span.

### ✅ GOOD

Use inherent span duration, default success status, and events only for meaningful timestamped milestones.

## Data dumping

### ❌ BAD

Attach raw users, forms, query strings, bodies, URLs, IDs, or serialized objects.

### ✅ GOOD

Use bounded, approved attributes that answer a diagnostic question.
