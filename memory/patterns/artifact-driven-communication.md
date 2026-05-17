---
type: pattern
domain: architecture
importance: critical
created: 2026-05-08
project: organizational
expires: never
---

# Pattern: Artifact-Driven Communication

## The Pattern

Agents do not communicate through free-form conversation. All inter-agent communication uses:
1. **Handoff envelopes** (`templates/handoff-template.md`) — structured YAML with decisions, constraints, artifacts
2. **Named artifacts at defined paths** — PRDs, ADRs, specs, reports at their canonical locations
3. **Wiki as shared knowledge** — persistent facts go to `wiki/`; session facts go to `memory/workflow-state/`

**When to apply:** Every agent transition, every workflow step, every output.

## Why This Pattern Exists

Without structured handoffs:
- Agents re-litigate settled decisions
- Context gets lost when conversation resets
- There's no audit trail for why decisions were made
- Future agents have no basis for consistent behavior

## How to Apply

When completing any step:
1. Write the artifact to its canonical path
2. Fill out the handoff template for the next agent
3. Include: decisions made, constraints established, open questions, explicitly out-of-scope

When starting any step:
1. Read the handoff envelope
2. Load referenced wiki pages (summarized)
3. Load relevant memory entries
4. Do NOT ask for context that should be in the handoff
