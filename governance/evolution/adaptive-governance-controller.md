# Adaptive Governance Controller

## Role
Dynamically adjusts governance intensity — gate strictness, approval thresholds, review depth, and monitoring frequency — in response to current risk signals, organizational health, and operational context. Makes governance proportionate without ever falling below constitutional minimums.

## Governance Intensity Levels

```
LEVEL           DESCRIPTION                         TRIGGERS
────────────────────────────────────────────────────────────────────────────────────
RELAXED         Reduced friction for stable orgs     org_health >= 0.90 + 30d stable
STANDARD        Default governance operating mode    normal conditions
HEIGHTENED      Increased scrutiny for risk signals  risk signal OR org stress
STRICT          Maximum automation-only controls     CRITICAL signal or incident active
EMERGENCY       All consequential actions halted     constitutional threat OR breach
```

## Adaptive Triggers

### Escalation Triggers (Standard → Heightened → Strict)
```
org_health < 0.70:                      Standard → Heightened
constitutional_clearance_rate < 0.98:   Standard → Strict (any level)
active_critical_finding overdue:        Standard → Heightened
eu_ai_act_enforcement approaching < 14d: Standard → Strict
production_incident ACTIVE:             current level → Strict
hallucination_events > 10 in 24hr:     Standard → Heightened
approval_regret_rate > 0.20:           Standard → Heightened
```

### De-escalation Triggers (Strict → Standard → Relaxed)
```
STRICT → STANDARD:
  all_critical_signals_cleared for 48hr
  human T4+ explicit de-escalation approval

STANDARD → RELAXED:
  org_health >= 0.90 sustained 30d
  constitutional_clearance_rate >= 0.995 sustained 30d
  zero governance incidents last 90d
  T5 explicit approval required for RELAXED

EMERGENCY → STRICT:
  T5 + board sign-off only
  full incident review complete
```

## Per-Level Control Configuration

### RELAXED
```
approval_thresholds:        raised 10% (more auto-approved)
monitoring_frequency:       50% (half as frequent checks)
gate_pass_threshold:        lowered 5% for STANDARD workflow class only
human_review_required:      only for COMPLIANCE+ workflow classes
```

### HEIGHTENED
```
approval_thresholds:        lowered 10% (more requires approval)
monitoring_frequency:       2× (double the normal check rate)
gate_pass_threshold:        raised 5% for all workflow classes
human_review_required:      all ELEVATED+ AND any output confidence < 0.80
deep_evaluation:            triggered at confidence < 0.85 (vs normal 0.75)
```

### STRICT
```
approval_thresholds:        lowered 20%
monitoring_frequency:       5× real-time
gate_pass_threshold:        raised 10% for all classes
human_review_required:      all outputs except STANDARD routine
production_deployments:     suspended until Strict resolved
new_capability_deployment:  suspended
exception_grants:           suspended (no new exceptions)
```

### EMERGENCY
```
all_consequential_actions:  SUSPENDED
human_only_decisions:       required for anything beyond READ operations
ai_actions_permitted:       monitoring and alerting only
escalation:                 immediate board notification
```

## Governance Intensity State Record
```yaml
current_level: STANDARD
entered_at: ISO8601
trigger_reason: string
approving_agent: string
next_review_at: ISO8601
transition_history: [{from, to, at, reason}]
```

## Proportionality Guarantee
The adaptive controller NEVER:
- reduces constitutional protections regardless of level
- disables audit logging at any level
- removes human oversight from EXECUTIVE/CONSTITUTIONAL class
- auto-de-escalates from EMERGENCY (always requires human decision)

## Persistence
`memory/governance-evolution/governance-intensity.yaml`
`memory/governance-evolution/intensity-transitions.jsonl`
