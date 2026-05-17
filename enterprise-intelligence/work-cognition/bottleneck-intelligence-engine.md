# Bottleneck Intelligence Engine

## Role
Continuously identifies, characterizes, and predicts bottlenecks in the organization's work system. Distinguishes between transient bottlenecks (resolving on their own) and structural bottlenecks (requiring process or capacity change). Integrates with the self-optimization system to propose and track resolutions.

## Bottleneck Taxonomy

```
CLASS               SUBTYPE                 SIGNATURE                           RESOLUTION APPROACH
────────────────────────────────────────────────────────────────────────────────────────────────────
QUEUE               INTAKE_OVERLOAD         WIP >> WIP_limit; queue growing     Reduce intake or increase capacity
QUEUE               PRIORITY_INVERSION      High-priority items behind low      Triage process fix
AGENT               AGENT_SATURATION        Single agent on critical path       Redistribute or parallelize
AGENT               SKILL_GAP               Consistently routed to wrong agent  Training or capability declaration update
GATE                APPROVAL_QUEUE          Gate queue depth > 5; SLA breaching Capacity or delegation review
GATE                REPEATED_GATE_FAIL      Same artifact fails same gate 3×    Quality coaching; gate criteria review
HANDOFF             HANDOFF_LATENCY         Avg handoff > 4hr for same step     Protocol or ownership clarification
HANDOFF             PICKUP_FAILURE          Artifacts left unaccepted > 24hr    Notification or assignment fix
RESOURCE            CONTEXT_CONTENTION      Multiple workflows competing         Scheduling or priority rules
DEPENDENCY          PROVIDER_BOTTLENECK     One team is dependency for 4+ teams Capacity or ownership restructure
```

## Bottleneck Detection

```
REAL-TIME DETECTION (every 5 min for CRITICAL, 15 min for HIGH):
  QUEUE: queue_depth > WIP_limit × 1.5 for > 30 min
  AGENT: single agent handling > 60% of active workflows in category
  GATE: gate queue depth > 5 AND oldest item age > SLA
  HANDOFF: handoff latency > 4hr AND count > 3 in past 24hr

TREND-BASED DETECTION (hourly):
  Any bottleneck metric trending 10%+ worse over 3 consecutive hours
  Velocity declining alongside queue growth (Little's Law violation)

AI SYNTHESIS (daily):
  Pattern miner output → AI identifies structural bottleneck candidates
  Distinguishes: TRANSIENT (likely self-resolving) vs. STRUCTURAL (intervention needed)
```

## Bottleneck Record Schema

```yaml
bottleneck_record:
  bottleneck_id: string
  detected_at: ISO8601
  class: BOTTLENECK_CLASS
  subtype: BOTTLENECK_SUBTYPE
  
  location:
    entity_type: WORKFLOW | AGENT | GATE | HANDOFF | TEAM | DEPENDENCY
    entity_id: string
    team_id: string
  
  severity: MINOR | MODERATE | MAJOR | CRITICAL
  
  metrics:
    queue_depth: number           # if QUEUE type
    wait_time_p50_min: number
    wait_time_p95_min: number
    throughput_reduction_pct: number
  
  classification:
    type: TRANSIENT | STRUCTURAL | UNKNOWN
    confidence: number
    evidence: string
  
  resolution:
    status: OPEN | INVESTIGATING | IN_PROGRESS | RESOLVED | ACCEPTED_RISK
    proposed_action: string
    owner_team: string
    resolution_deadline: ISO8601
    resolved_at: ISO8601
    resolution_type: PROCESS_CHANGE | CAPACITY | DELEGATION | TOOLING | OTHER
  
  recurrence_count: number        # times this pattern has been seen before
```

## Bottleneck Impact Quantification

```
THROUGHPUT_IMPACT:
  estimated_workflows_blocked = queue_depth × avg_throughput_per_hour
  daily_delay_hours = wait_time_p50 × blocked_workflow_count
  
COST_IMPACT:
  estimated_cost = daily_delay_hours × avg_token_cost_per_workflow_hour
  
DOWNSTREAM_IMPACT:
  cascade_blocked_count: dependency graph traversal
  sprint_risk: N downstream sprint deliverables at risk

IMPACT_SEVERITY:
  throughput_impact > 20% → MAJOR
  cascade_blocked > 5 downstream items → CRITICAL
  sprint_deliverable at risk → CRITICAL regardless of throughput impact
```

## Resolution Playbooks

```
PLAYBOOK: APPROVAL_QUEUE_BOTTLENECK
  1. Alert T3 approval queue owner
  2. Check: can any approvals be delegated (per workflow-permission-system.md)?
  3. If YES: propose delegation to governance-bottleneck-resolver
  4. If NO: alert T4 for capacity decision
  5. Track: SLA breaches per hour until resolved

PLAYBOOK: AGENT_SATURATION
  1. Identify: which agent is saturated
  2. Check: are there other capable agents (agent-assignment-optimizer)?
  3. If YES: trigger routing rebalance (routing-optimizer)
  4. If NO: alert T3; capacity discussion required
  5. Track: saturation % per hour until resolved

PLAYBOOK: STRUCTURAL_QUEUE_OVERLOAD
  1. Identify: which intake path is creating excess
  2. Compute: required capacity increase or required intake reduction
  3. Generate proposal: routing-optimizer OR improvement-proposal-engine
  4. Submit for T3 authorization
  5. After fix: monitor for 5 business days to confirm resolution
```

## Persistence
`memory/work-cognition/active-bottlenecks.yaml`
`memory/work-cognition/bottleneck-history.jsonl`
`memory/work-cognition/resolution-playbooks.yaml`
`memory/work-cognition/recurrence-tracking.yaml`
