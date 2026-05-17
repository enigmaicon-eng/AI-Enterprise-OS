# Reflection Engine
**ID:** AC-RE-000 | **Subsystem:** reflection-engine/ | **Version:** 1.0.0
**Updated:** 2026-05-17

---

## Purpose

The Reflection Engine is the primary learning trigger for the Adaptive Cognition Layer. It activates after significant execution events — workflow completions, failures, escalations, governance breaches — and produces structured reflection records that feed downstream adaptation.

## Subsystem Files

| File | ID | Purpose |
|------|----|---------|
| post-execution-reflection.md | AC-RE-001 | Core engine; runs after every workflow |
| success-failure-analysis.md  | AC-RE-002 | Structured decomposition of outcomes |
| governance-breach-reflection.md | AC-RE-003 | Special handling for governance failures |
| execution-hindsight-reviews.md | AC-RE-004 | Retrospective quality improvement |
| strategy-retrospectives.md   | AC-RE-005 | Strategy-level reflection sessions |

## Trigger Map

```
workflow_complete    → post-execution-reflection (always)
workflow_failed      → post-execution-reflection + success-failure-analysis
governance_breach    → governance-breach-reflection (always, regardless of outcome)
escalation_triggered → post-execution-reflection (STRATEGIC scope)
sprint_close         → execution-hindsight-reviews (weekly)
quarterly_close      → strategy-retrospectives (quarterly)
```

## Output

All outputs are reflection_event records per schemas.yaml.
High-significance events (deviation_score < -0.3 or = BREACH) are automatically
flagged for organizational-learning processing.
