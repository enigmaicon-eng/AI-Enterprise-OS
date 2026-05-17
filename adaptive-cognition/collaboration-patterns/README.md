# Collaboration Patterns
**ID:** AC-CP-000 | **Subsystem:** collaboration-patterns/ | **Version:** 1.0.0
**Updated:** 2026-05-17

---

## Purpose

Tracks how inter-agent collaboration evolves over time — which coordination patterns produce the best outcomes, how trust weights between agents change with evidence, where orchestration synergies have been discovered, and how handoff quality can be improved through accumulated experience.

Collaboration pattern learning is distinct from identity evolution (AC-IE): it focuses on the *relationship between agents*, not the internal state of a single agent.

## Subsystem Files

| File | ID | Purpose |
|------|----|---------|
| inter-agent-coordination-evolution.md | AC-CP-001 | How coordination patterns adapt over time |
| trust-weight-evolution.md | AC-CP-002 | Evidence-based trust weight adjustments |
| orchestration-synergy-learning.md | AC-CP-003 | Agent pairing and team composition learning |
| handoff-optimization.md | AC-CP-004 | Artifact handoff quality improvement |

## Key Constraints

- Trust weights are bounded: `[0.20, 0.90]` — no agent pair can dominate or be excluded entirely
- Trust weight cap at 0.90 requires human milestone review before crossing
- Collaboration data is anonymized in cross-agent summaries; full detail T3+ only
- All trust weight changes are append-only and auditable
