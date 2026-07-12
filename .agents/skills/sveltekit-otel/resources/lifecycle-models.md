# Lifecycle models

## CRUD operation

```text
user action
  → browser operation span
  → fetch span
  → server transport/framework spans
  → domain span when needed
  → database client span
  → response
  → state mutation milestone
  → meaningful UI completion
```

## Application readiness

Do not equate readiness with `document.load`.

Possible milestones:

- client runtime initialized;
- hydration complete;
- session resolved;
- permissions loaded;
- critical data settled;
- critical UI interactive.

Use a short-lived readiness operation only when the application defines a deterministic end condition.

## Live subscription

```text
subscription setup
  → established
  → setup span ends

later notification
  → new processing span or linked operation
  → refresh/local mutation
  → state update
  → meaningful UI completion
```

Do not parent every future notification to a span kept active since setup.
