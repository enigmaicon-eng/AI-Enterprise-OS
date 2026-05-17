# Reliability Scoring System

## Role
Tracks and scores the reliability of every agent and workflow type over time. Reliability scores combine task success rates, output quality consistency, escalation rates, and calibration accuracy into a durable trust signal used by routing, confidence scoring, and governance.

## Reliability Score Model

### Agent Reliability Score
```
agent_reliability = (
  success_rate_90d         × 0.35
  + quality_consistency    × 0.25    # std dev of quality scores (lower = more consistent)
  + escalation_avoidance   × 0.20    # 1 - escalation_rate
  + calibration_accuracy   × 0.15    # from agent-confidence-calibration.md
  + sla_adherence_rate     × 0.05
)

RELIABILITY_BANDS:
  EXEMPLARY:    >= 0.90
  TRUSTED:      0.75-0.89
  ACCEPTABLE:   0.60-0.74
  UNRELIABLE:   < 0.60 → reduced routing share + coaching trigger
```

### Workflow Type Reliability Score
```
workflow_reliability = (
  completion_rate_90d      × 0.40
  + output_quality_avg     × 0.35
  + human_override_rate    × 0.25    # 1 - override_rate
)
```

## Reliability Record Schema
```yaml
reliability_record:
  subject_id: string              # agent_id or workflow_type
  subject_type: AGENT | WORKFLOW
  
  metrics_90d:
    success_rate: number
    quality_avg: number
    quality_std: number
    escalation_rate: number
    sla_adherence_rate: number
    calibration_error: number
    human_override_rate: number
  
  composite_score: number
  band: EXEMPLARY | TRUSTED | ACCEPTABLE | UNRELIABLE
  
  trend_30d: IMPROVING | STABLE | DECLINING
  trend_delta: number
  
  last_computed: ISO8601
  
  flags:
    sudden_decline: boolean        # > 0.10 drop in 7d
    persistent_low: boolean        # < 0.60 for > 14d
    improving_from_coached: boolean
```

## Reliability Monitoring

### Reliability Decline Alerts
```
sudden_decline (> 0.10 drop in 7d):
  → alert: agent-performance-coach + routing-optimizer
  → action: reduce routing share by 30% pending investigation

persistent_unreliable (< 0.60 for > 14d):
  → alert: T3 agent management
  → action: remove from routing pool pending remediation plan

EXEMPLARY agent sudden_decline:
  → CRITICAL alert (high-value asset at risk)
  → immediate T3+ investigation
```

## Reliability Trust Propagation

Reliability scores feed into:
- `trust/workflow-confidence-framework.md` → historical_calibration dimension
- `optimization-engine/routing-optimizer.md` → agent fit score (reliability component)
- `delegation-and-trust/trust-propagation-engine.md` → trust graph node weights
- `governance-queues/confidence-threshold-system.md` → routing to review queues

## Persistence
`memory/trust/reliability-scores.yaml`
`memory/trust/reliability-history.jsonl`
