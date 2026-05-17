# Constitutional Alignment System

## Role
Monitors, measures, and enforces alignment between all OS actions and the enterprise constitutional principles. Provides continuous constitutional health assessment, alignment drift detection, and the authoritative alignment report for executive governance.

## Constitutional Principles (Summary)

From `constitution/enterprise-constitution.md` — 12 principles (C-001–C-012):

```
C-001  Human oversight non-negotiable for consequential decisions
C-002  Transparency: every AI decision must be explainable
C-003  No deception of human principals
C-004  Constitutional principles cannot be modified by AI systems
C-005  Least privilege: agents operate within minimum required scope
C-006  Fail safe: uncertain situations escalate, never auto-resolve
C-007  Privacy: personal data handled per regulatory minimums
C-008  Reversibility: prefer reversible actions; flag irreversible ones
C-009  No self-replication or unauthorized capability expansion
C-010  Accuracy before speed: do not sacrifice truth for throughput
C-011  Preserve human agency: do not create dependency or lock-in
C-012  Organizational learning: decisions must build institutional knowledge
```

## Alignment Measurement

### Per-Principle Compliance Rate
```
FOR each principle C-001–C-012:
  compliance_rate = (executions compliant) / (executions evaluated)
  computed from: audit trail + constitutional-ai-governor verdicts

TARGET: all principles >= 0.99 compliance rate
ALERT_THRESHOLD: < 0.98 for ANY principle
CRITICAL_THRESHOLD: < 0.95 → immediate T5 escalation
```

### Constitutional Health Score
```
constitutional_health = min(all_principle_compliance_rates)
# bounded by weakest principle — a system is only as aligned as its most violated principle

HEALTHY:  >= 0.99
DEGRADED: 0.97-0.98  → WARN
IMPAIRED: 0.95-0.96  → HIGH alert + governance review
CRITICAL: < 0.95     → T5 escalation + OS intake pause
```

## Alignment Drift Detection

```
DRIFT_SIGNAL: compliance_rate for any principle declining trend over 7d
DRIFT_THRESHOLD: > 0.01 decline per week

ON DRIFT DETECTED:
  1. identify: which workflows / agents contributing to decline
  2. classify: inadvertent drift vs. intentional bypass vs. edge case gap
  3. route to: governance-evolution/adaptive-governance-controller.md
  4. generate: constitutional alignment improvement proposal
  5. notify: T4/T5 immediately if drift is in C-001, C-003, C-004, C-009
```

## Constitutional Violation Types

| Type | Severity | Response |
|------|----------|----------|
| C-001 oversight bypass | CRITICAL | Block + T5 alert |
| C-003 deception attempt | CRITICAL | Block + T5 alert + security investigation |
| C-004 self-modification of constitution | CRITICAL | Hard block; log; automatic incident |
| C-009 unauthorized capability expansion | CRITICAL | Block + T5 + security review |
| C-002 transparency failure | HIGH | Flag output + require explanation |
| C-006 failure to escalate uncertain | HIGH | Override agent decision + escalate |
| C-005 privilege scope exceeded | HIGH | Revoke session + T3 alert |
| C-008 irreversible action unannounced | MEDIUM | Pause + request human confirmation |
| C-010 accuracy compromised | MEDIUM | Regenerate with accuracy constraint |

## Constitutional Alignment Report (Monthly)
```
Generated: 1st of each month
Audience: T5 executive + board
Contents:
  - per-principle compliance rates and trends
  - violations by type and count
  - near-misses (escalated before violation)
  - governance improvements applied
  - alignment forecast for next 30 days
```

## Persistence
`memory/trust/constitutional-alignment.yaml`
`memory/trust/violation-log.jsonl`
