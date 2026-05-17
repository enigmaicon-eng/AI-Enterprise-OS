# Governance Bottleneck Resolver

## Role
Detects, diagnoses, and resolves bottlenecks in the governance pipeline — approval queue saturation, policy evaluation latency, escalation chain delays, and review capacity gaps — to maintain governance throughput without compromising protection.

## Bottleneck Detection Signals

```
BOTTLENECK_TYPE             SIGNAL                                  THRESHOLD
─────────────────────────────────────────────────────────────────────────────────────
APPROVAL_QUEUE_SATURATION   queue_depth > 30 items sustained 2hr   WARN; > 50 = HIGH
TIER_CAPACITY_GAP           single tier handling > 70% of volume   WARN (unbalanced load)
SLA_BREACH_RATE             > 15% of decisions exceeding SLA        HIGH
ESCALATION_CHAIN_DEPTH      avg escalation depth > 3 hops           WARN
POLICY_EVAL_LATENCY         p95 policy eval > 200ms                 WARN
REVIEWER_OVERLOAD           reviewer handling > 20 decisions/day    WARN
SEQUENTIAL_DEPENDENCY_LOCK  workflow blocked by approval > 4hr      HIGH
```

## Resolution Strategies

### Strategy 1: Load Redistribution
```
TRIGGER: tier_capacity_gap (one tier overloaded)
ACTION:
  1. identify cases within overloaded tier eligible for lower-tier handling
  2. generate temporary delegation authorization (improvement-authorization.md)
  3. redistribute up to 30% of eligible cases to adjacent tier
  4. monitor: quality of redistributed decisions vs. original tier baseline
  5. revert: when queue_depth < 15 items for 1hr
CONSTRAINT: never redistributes CONSTITUTIONAL or EXECUTIVE cases
```

### Strategy 2: Pre-Approval Batching
```
TRIGGER: high volume of structurally similar approval requests
ACTION:
  1. detect: same decision type, same workflow class, similar risk profile
  2. batch into group review (single reviewer reviews batch of 10 similar cases)
  3. common elements reviewed once; individual differentiators flagged
CONSTRAINT: each individual case still gets an approval record
```

### Strategy 3: Review Process Simplification
```
TRIGGER: reviewer_overload + evaluation/governance-decision-evaluator shows consistently EXCELLENT quality
ACTION:
  1. identify: checklist items that are redundant given quality signal
  2. propose: simplified review checklist for HIGH-QUALITY case types
  3. route proposal to: policy-evolution-engine for formal change
CONSTRAINT: simplification is a permanent policy change (not a workaround)
```

### Strategy 4: Capacity Alert
```
TRIGGER: bottleneck persists > 4hr despite strategies 1-3
ACTION:
  1. generate: capacity_gap_alert → governance operations
  2. include: volume forecast, resolution time estimate, impact if unresolved
  3. escalate: to T4 for human staffing or priority decision
CONSTRAINT: this is an escalation to human, not an automated override
```

## Bottleneck Root Cause Analysis
```
POST-RESOLUTION (within 24hr):
  1. identify: what triggered the bottleneck
  2. classify: VOLUME_SPIKE | CAPACITY_GAP | PROCESS_INEFFICIENCY | POLICY_OVER_TRIGGER
  3. generate: root cause finding → governance-optimizer for long-term fix
  4. track: recurrence_rate for same bottleneck type
  IF recurrence_rate > 2 in 30d: escalate to structural policy change
```

## Bottleneck Event Record
```yaml
bottleneck_event:
  event_id: string
  bottleneck_type: string
  detected_at: ISO8601
  resolved_at: ISO8601
  resolution_strategy_used: string
  peak_queue_depth: number
  sla_breaches_during: number
  root_cause_classification: string
  long_term_fix_proposed: boolean
```

## Persistence
`memory/governance-evolution/bottleneck-events.jsonl`
`memory/governance-evolution/resolution-playbooks.yaml`
