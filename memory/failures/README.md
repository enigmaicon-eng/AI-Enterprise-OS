# Failure Mode Registry

Documents failure modes encountered in this system. Each entry is a pattern to avoid.

**Format for new entries:**

```markdown
---
type: failure
domain: <domain>
importance: high | critical
created: YYYY-MM-DD
incident-ref: <wiki/incidents/slug> or null
---

# Failure: <Title>

## What Happened
<Description of the failure mode>

## Root Cause
<Why this happened>

## Prevention
<Specific rule or check that prevents recurrence>

## Detection Signal
<How to recognize this failure mode early>
```

---

## Index

_(No failures documented yet — system initialized 2026-05-08)_

---

## Adding Entries

Add a failure entry after any incident post-mortem, any gate that failed due to a pattern (not a one-off), or any recurring problem that creates rework.

The goal: future agents encounter this file and avoid repeating the same failures.
