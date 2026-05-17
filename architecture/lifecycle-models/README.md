---
layer: lifecycle-models
version: 1.0.0
created: 2026-05-09
status: active
owner: architect-agent
---

# Lifecycle Models

Lifecycle models define the full end-to-end journey of a feature, artifact, or organizational initiative — from inception through retirement. They are higher-level than state models (which define valid states) and provide the temporal and organizational context.

---

## Why Lifecycle Models Matter

State models answer "what state is this in right now?"
Lifecycle models answer "where is this in its overall journey?"

An artifact can be APPROVED (state) but still be in the GROWTH phase of its lifecycle (the feature it documents is scaling to more users). Lifecycle models help:

- PM agents understand what phase a feature is in for prioritization decisions
- Delivery agents know what gates and reviews are appropriate for each phase
- Analytics agents know what metrics matter at each phase
- Docs agents know when to create, maintain, and retire artifacts

---

## Directory Structure

```
lifecycle-models/
├── README.md              ← This file
├── feature-lifecycle.md   ← Feature from idea to retirement
└── artifact-lifecycle.md  ← Artifact from creation to archival
```

---

## Relationship to Other Layers

| Layer | What It Models | Granularity |
|-------|---------------|-------------|
| `state-models/` | Instant state of workflow or artifact | Point-in-time |
| `lifecycle-models/` | Journey of feature or artifact over time | Temporal |
| `workflows/` | Process for executing a phase transition | Procedural |
| `observability/` | Measuring health within a phase | Continuous |

---

## Governance

Lifecycle models are maintained by architect-agent. Changes to lifecycle phase definitions require an RFC. Phase additions that create new governance requirements require an ADR.
