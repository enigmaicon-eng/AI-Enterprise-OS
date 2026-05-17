# Bottleneck Detector

**Component:** RSI-HE-003 | **Owner:** Meta-Org | **Tier:** T3 | **Class:** CRITICAL

## Role
Identifies throughput constraints — single points of slowdown that limit the entire system's output capacity — across all OS layers. Uses queuing theory, critical path analysis, and flow variance analysis to find and classify bottlenecks in real-time and at scale, producing prioritized bottleneck records for the self-improvement engine.

---

## Bottleneck Theory

```
BOTTLENECK DEFINITION (Theory of Constraints):
  A bottleneck is the resource (agent, gate, queue, team, or process step)
  whose capacity constrains the total throughput of the system.
  Fixing a non-bottleneck does not improve system throughput.
  Only fixing the bottleneck improves throughput.

BOTTLENECK DETECTION PRINCIPLE:
  The bottleneck is where:
    - Queue depth is highest (items accumulating faster than departing)
    - Wait time variance is highest (unpredictable; items pile up)
    - Utilization is highest (busy all the time)
    - Flow rate downstream < flow rate upstream (intake > departure)
```

---

## Bottleneck Classes

```
CLASS               SIGNATURE                               DETECTION METHOD
──────────────────────────────────────────────────────────────────────────────────────────────
APPROVAL_GATE       Approval queue depth > 20; wait > 2×SLA  Queue depth + wait time analysis
AGENT_CAPACITY      Agent utilization > 0.90 for > 1hr;      Utilization + arrival rate
                    task queue building upstream
KNOWLEDGE           Same question/escalation sent to one      Escalation destination clustering
                    person > 5x/week; bus_factor = 1
INTEGRATION         External call latency > 3× baseline;      P99 latency + timeout rate
                    timeout rate > 5%
DEPENDENCY          Team blocking > 3 downstream teams;       Dependency register analysis
                    dependency wait_time > 5 days
CONTEXT_SWITCH      Agent switching between task types >       Task_type transition rate
                    3x/hr; performance degrades on transitions per agent
DATA_PIPELINE       Data pipeline lag > 2×SLA;               Pipeline lag + consumer queue
                    consumers blocked waiting for data
HUMAN_DECISION      Human-in-loop step with queue > 10;       HITL queue depth + aging
                    items aging > 48hr
```

---

## Real-Time Bottleneck Detection

```
DETECTION CADENCE: Every 5 minutes for APPROVAL_GATE and AGENT_CAPACITY
                   Every 15 minutes for all other classes
                   Continuous event-driven for queue depth alerts

DETECTION ALGORITHM:
  For each resource R:
    1. Compute: arrival_rate(R) = items entering per unit time
    2. Compute: departure_rate(R) = items completing per unit time
    3. Compute: utilization(R) = busy_time / total_time
    4. Compute: queue_depth(R) = items waiting for R
    5. Compute: wait_time(R) = avg time items spend waiting for R

  BOTTLENECK SCORE(R) = 
    (utilization > 0.85 ? 0.35 : 0) +
    (queue_depth > 10 ? 0.25 : queue_depth > 5 ? 0.15 : 0) +
    (arrival_rate > departure_rate ? 0.25 : 0) +
    (wait_time > 2×SLA ? 0.15 : wait_time > SLA ? 0.10 : 0)

  BOTTLENECK_SCORE >= 0.50: classified as BOTTLENECK; enter register
  BOTTLENECK_SCORE >= 0.75: CRITICAL BOTTLENECK; immediate alert + P1 proposal
```

---

## Bottleneck Register Schema

```yaml
bottleneck_record:
  bottleneck_id: BN-{YYYY-MM-DD}-{NNN}
  class: APPROVAL_GATE | AGENT_CAPACITY | KNOWLEDGE | INTEGRATION | DEPENDENCY | CONTEXT_SWITCH | DATA_PIPELINE | HUMAN_DECISION
  resource_id: string (agent ID, gate ID, person, team, integration name)
  severity: LOW | MEDIUM | HIGH | CRITICAL
  bottleneck_score: float (0.0–1.0)
  detection_timestamp: ISO8601
  metrics:
    arrival_rate: float
    departure_rate: float
    utilization: float
    queue_depth: integer
    wait_time_p99_min: float
  downstream_impact:
    workflows_blocked: integer
    teams_affected: list
    throughput_loss_estimate: percentage
  proposed_resolution: string
  status: OPEN | IN_PROGRESS | RESOLVED | CHRONIC
  recurrence_count: integer
  last_occurrence: ISO8601 | null
```

---

## Bottleneck Impact Assessment

```
THROUGHPUT LOSS ESTIMATION (Little's Law):
  L = λ × W (queue depth = arrival rate × wait time)
  throughput_at_bottleneck = 1 / service_time_per_item
  throughput_loss = (theoretical_max - actual_throughput) / theoretical_max

DOWNSTREAM CASCADE ANALYSIS:
  For bottleneck R blocking downstream flows:
    affected_workflows = workflows with R on critical path
    teams_affected = teams running those workflows
    cascade_depth = max hops downstream from R to terminal workflow step
    cascade_loss = Σ(downstream_throughput × cascade_prob) for depth <= 3

CRITICAL BOTTLENECK THRESHOLD:
  throughput_loss > 0.20: CRITICAL (losing > 20% of theoretical throughput)
  downstream workflows blocked > 10: CRITICAL (system-wide impact)
  Either condition alone triggers P1 improvement proposal
```

---

## Bottleneck Resolution Patterns

```
RESOLUTION BY CLASS:

APPROVAL_GATE:
  Short-term: add approvers; delegate; batch approvals
  Medium-term: recalibrate gate threshold; pre-approve recurring patterns
  Long-term: structural governance change (T4 required)

AGENT_CAPACITY:
  Short-term: scale out worker pool; redirect overflow to backup agents
  Medium-term: optimize task assignment; reduce task size
  Long-term: capability development; agent specialization

KNOWLEDGE:
  Short-term: document knowledge; pair with expert
  Medium-term: cross-training program (2 months minimum)
  Long-term: eliminate single points via team-level knowledge distribution

INTEGRATION:
  Short-term: circuit breaker; degrade gracefully; add timeout
  Medium-term: optimize integration call (caching, batching)
  Long-term: replace slow integration; add alternative provider

DEPENDENCY:
  Short-term: accelerate blocking team; add parallel workaround
  Medium-term: restructure to reduce dependency (Conway's Law)
  Long-term: decouple systems; add async interface

HUMAN_DECISION:
  Short-term: redistribute across decision-makers; add backup decision authority
  Medium-term: automate decision for low-risk cases; reduce decision scope
  Long-term: build confidence model; automate with human spot-check
```

---

## Chronic Bottleneck Protocol

```
CHRONIC BOTTLENECK: Same resource class bottleneck recurring >= 3 times

RESPONSE:
  1. Escalate to CRITICAL regardless of current score
  2. Trigger: org-adaptation-engine.md structural review
  3. Flag in improvement-memory.md as STRUCTURAL_ISSUE (not tactical fix)
  4. Assign: dedicated T3 Engineering Director attention
  5. Timeline: structural resolution plan within 30 days
  6. Monitor: 90-day post-fix monitoring to confirm resolution

IF NOT RESOLVED STRUCTURALLY: escalate to T4; consider architectural redesign
```

---

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
CRITICAL bottlenecks open               = 0 at any time (P1 triggers immediate action)
MEDIUM+ bottlenecks resolved within 7d >= 0.80
Chronic bottlenecks (3+ recurrences)   = 0 (structural resolution required)
Bottleneck detection latency            < 10 minutes from onset
False positive rate                     < 0.15
Throughput loss (system-wide avg)       < 0.10 (< 10% below theoretical max)
```
