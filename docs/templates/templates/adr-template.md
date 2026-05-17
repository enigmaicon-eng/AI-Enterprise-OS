---
type: adr
id: ADR-<NNN>
status: proposed | accepted | deprecated | superseded
created: <YYYY-MM-DD>
author: architect-agent
deciders: []
supersedes: <ADR-NNN or null>
superseded-by: <ADR-NNN or null>
---

# ADR-<NNN>: <Decision Title>

## Status

`proposed` | `accepted` | `deprecated` | `superseded by ADR-NNN`

---

## Context

What is the situation that requires a decision? What forces are at play — technical, business, operational? What constraints exist?

Write in the past/present tense ("we are building X", "the current system does Y"), not in terms of the decision itself.

---

## Decision

What is the decision that was made?

Start with: "We will..." or "We have decided to..."

Be specific. This should be unambiguous enough that a future engineer can understand exactly what was decided without additional context.

---

## Options Considered

### Option A: `<name>` ← Selected
**Description:** `<what this involves>`

**Pros:**
- `<advantage>`

**Cons:**
- `<disadvantage>`

---

### Option B: `<name>`
**Description:** `<what this involves>`

**Pros:**
- `<advantage>`

**Cons:**
- `<disadvantage>`

---

### Option C: Do Nothing / Status Quo
**Description:** Continue with current approach

**Pros:**
- No migration cost

**Cons:**
- `<why this is insufficient>`

---

## Rationale

Why was Option A selected over the alternatives? What were the decisive factors?

Reference: `<PRD, user research, performance data, team capability, cost>` that drove the decision.

---

## Consequences

### Positive
- `<expected benefit>`
- `<expected benefit>`

### Negative
- `<known tradeoff>`
- `<known limitation>`

### Neutral / What We're Accepting
- `<thing we've consciously accepted as a tradeoff>`

---

## Implementation Notes

- **When to implement:** `<timeline or trigger>`
- **Migration required:** yes/no — `<if yes, brief description>`
- **Teams affected:** `<list of teams that need to change behavior>`
- **Reversibility:** easy | hard | irreversible

---

## Validation

How will we know this decision was the right one?
- `<metric or observation that validates the decision>`
- Review after: `<date or milestone>`

---

## Related Decisions

- `architecture/decisions/ADR-NNN.md` — `<relationship>`
