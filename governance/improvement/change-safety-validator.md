# Change Safety Validator

## Role
Validates that proposed optimizations and improvement changes are safe to apply without breaking existing behavior, violating governance constraints, or creating unpredictable system state. The last defense before any optimization reaches production.

## Validation Pipeline

```
PROPOSAL RECEIVED
      ↓
[1] CONSTITUTIONAL CHECK         → blocks if touches C-001–C-012
      ↓
[2] REGULATORY COMPLIANCE CHECK  → blocks if could violate active obligations
      ↓
[3] BLAST RADIUS ANALYSIS        → classifies scope of impact
      ↓
[4] DEPENDENCY CONFLICT CHECK    → detects if other active optimizations touch same targets
      ↓
[5] ROLLBACK FEASIBILITY CHECK   → confirms change can be reverted
      ↓
[6] STABILITY WINDOW CHECK       → blocks if system recently destabilized
      ↓
VERDICT: SAFE | CAUTION | BLOCK
```

## Validation Rules

### [1] Constitutional Check
```
READ: constitution/enterprise-constitution.md
IF proposal modifies any element tagged as constitutional_protection: true
  VERDICT: BLOCK
  REASON: "Constitutional principle [C-XXX] — not modifiable by optimization system"
```

### [2] Regulatory Compliance Check
```
READ: compliance-framework/regulatory-registry.md
IF proposal could affect:
  - data retention periods
  - consent mechanisms
  - human oversight triggers
  - EU AI Act conformity obligations
  VERDICT: BLOCK unless T4+ approval explicitly granted
```

### [3] Blast Radius Analysis
```
blast_radius = count of workflows/agents/policies directly affected

SINGLE_WORKFLOW:   SAFE (low risk)
WORKFLOW_TYPE:     CAUTION if > 20% of daily volume
ALL_WORKFLOWS:     REQUIRES_REVIEW always
SYSTEM_WIDE:       BLOCK without explicit T5 authorization
```

### [4] Dependency Conflict Check
```
ACTIVE_OPTIMIZATIONS = all optimizations with status IN (APPROVED, IMPLEMENTING)
FOR each active_optimization:
  IF overlapping_target(proposal, active_optimization):
    IF compatible: note interaction, CAUTION
    IF conflicting: BLOCK until existing optimization completes or is withdrawn
```

### [5] Rollback Feasibility Check
```
REQUIRED: every optimization must have a rollback_point created before application
VERIFY:
  - state snapshot can be captured for proposed change target
  - rollback_time_estimate < rollback_sla[domain]
  - rollback does not cascade to unintended components
IF rollback not feasible: classify as HIGH_RISK → require explicit authorization
```

### [6] Stability Window Check
```
CHECK: any optimization rollback in last 2hr for same domain?
CHECK: any CRITICAL alert active in affected components?
CHECK: any degradation trend (> 5% decline) in affected metrics?
IF any check positive: CAUTION + required monitoring period before apply
```

## Verdict Record
```yaml
validation_id: VAL-{proposal_id}
proposal_id: string
validated_at: ISO8601
verdict: SAFE | CAUTION | BLOCK
rules_triggered: [string]
blocking_reason: string     # if BLOCK
caution_notes: [string]     # if CAUTION
rollback_feasible: boolean
recommended_monitoring_period_min: number
```

## Persistence
`memory/improvement-governance/validation-records.yaml`
