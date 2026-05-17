# Optimization Registry

## Role
Authoritative catalog of all optimizations proposed, approved, active, and historical. Provides fast lookup, impact tracking, and rollback index.

## Registry Schema

```yaml
optimization_record:
  optimization_id: string          # OPT-{domain}-{seq}
  domain: ROUTING | WORKFLOW | POLICY | RESOURCE | AGENT_ASSIGNMENT | BOTTLENECK
  type: QUICK_WIN | STRUCTURAL | EXPERIMENTAL
  description: string
  proposed_by: string              # optimizer subsystem
  proposed_at: ISO8601
  status: PROPOSED | UNDER_REVIEW | APPROVED | ACTIVE | COMPLETED | ROLLED_BACK | REJECTED
  
  safety_check:
    verdict: SAFE | CAUTION | BLOCK
    checked_at: ISO8601
    notes: string
  
  authorization:
    required: boolean
    approver: string
    approved_at: ISO8601
  
  activation:
    activated_at: ISO8601
    rollback_point_id: string      # snapshot key for rollback
  
  impact:
    estimated_improvement_pct: number
    actual_improvement_pct: number
    measured_at: ISO8601
    metrics_improved: [string]
    metrics_degraded: [string]
  
  rollback:
    triggered: boolean
    triggered_at: ISO8601
    trigger_reason: string
```

## Indexes (fast lookup)
- `by_domain`: map domain → [optimization_id]
- `by_status`: map status → [optimization_id]
- `by_target`: map policy/workflow/agent → [optimization_id]
- `active_rollback_points`: map optimization_id → snapshot_key

## Aggregate Statistics (computed nightly)
```yaml
total_optimizations_applied_30d: number
avg_improvement_pct: number
rollback_rate_30d: number            # target: < 5%
total_latency_saved_ms_30d: number
total_cost_saved_tokens_30d: number
top_impact_domains: [domain]
```

## Rollback Protocol
```
TRIGGER: auto-rollback from self-optimization-controller OR manual request

STEPS:
  1. look up rollback_point_id from registry
  2. restore snapshot atomically
  3. update record: status → ROLLED_BACK, rollback.triggered = true
  4. emit rollback_event to enterprise-event-bus topic: os.optimization.rollback
  5. freeze domain for min_interval_after_rollback = 2hr
  6. generate rollback_report → improvement-impact-tracker
```

## Persistence
`memory/optimization-engine/optimization-registry.yaml`
`memory/optimization-engine/optimization-history.jsonl` (append-only; never deleted)
