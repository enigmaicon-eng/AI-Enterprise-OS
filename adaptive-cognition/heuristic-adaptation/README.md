# Heuristic Adaptation
**ID:** AC-HA-000 | **Subsystem:** heuristic-adaptation/ | **Version:** 1.0.0
**Updated:** 2026-05-17

---

## Purpose

The Heuristic Adaptation subsystem is the core runtime intelligence layer — evolving the operational heuristics that govern routing, orchestration, execution confidence, and runtime behavior. All adaptations are bounded, auditable, and reversible per governance.md.

## Subsystem Files

| File | ID | Purpose |
|------|----|---------|
| adaptive-decision-heuristics.md | AC-HA-001 | Core heuristic engine + lifecycle |
| orchestration-optimization.md | AC-HA-002 | Orchestration pattern improvement |
| routing-refinement.md | AC-HA-003 | Routing decision learning |
| execution-confidence-learning.md | AC-HA-004 | Confidence calibration over time |
| runtime-tuning.md | AC-HA-005 | Runtime parameter self-calibration |

## Heuristic Registry

All active heuristics are tracked in `adaptive-cognition/store/heuristic-registry.jsonl`.
Heuristic history (all past values) in `adaptive-cognition/store/heuristic-rollback.jsonl`.
Registered heuristics defined in `governance.md` — unregistered heuristics cannot be adapted.

## Adaptation Rate Constraints

No heuristic can change by more than its `adaptation_rate_max` in any single 30-day window.
Cumulative drift is monitored per governance.md drift detection protocol.
