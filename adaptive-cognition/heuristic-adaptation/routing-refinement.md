# Routing Refinement
**ID:** AC-HA-003 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Continuously refines the routing heuristics that determine which agent handles which task. Routing quality is foundational — poor routing cascades into poor execution, unnecessary escalation, and wasted organizational capacity.

---

## Routing Quality Model

```
A routing decision is correct when:
  1. The selected agent has domain strength ≥ 0.70 for the task domain
  2. The selected agent's behavioral traits match the task requirements
  3. The outcome quality is ≥ the expected baseline for that workflow type
  4. No better-suited agent was available and not selected

A routing decision is incorrect when:
  1. A domain mismatch (task outside agent's domain strengths)
  2. Agent rejected or escalated the task within the first execution step
  3. Outcome quality significantly below baseline
  4. Post-execution analysis identifies a better-suited agent that was available
```

---

## Routing Signal Collection

```yaml
routing_signals:
  per_execution:
    - agent_id selected
    - task_type
    - domain_tags (from task specification)
    - outcome_quality
    - time_to_first_delegation (if agent delegated)
    - agent_domain_strength_at_time (what was the agent's strength when selected)
    
  computed_rolling:
    - routing_accuracy_rate: % correct routing decisions (30-day)
    - domain_mismatch_rate: % where agent domain_strength < 0.60
    - unnecessary_delegation_rate: % where agent immediately re-delegated
    - outcome_by_agent_by_domain: quality matrix (agent × domain → avg outcome)
```

---

## Routing Intelligence Matrix

```
The routing intelligence matrix is the primary routing decision aid:

           │ Domain A │ Domain B │ Domain C │ Domain D │
───────────┼──────────┼──────────┼──────────┼──────────┤
Agent-001  │   0.85   │   0.72   │   0.45   │   0.60   │
Agent-002  │   0.68   │   0.91   │   0.80   │   0.40   │
Agent-003  │   0.42   │   0.65   │   0.88   │   0.71   │
Agent-004  │   0.77   │   0.55   │   0.62   │   0.94   │

Values: routing_quality_score (0.0–1.0; derived from outcome history, not self-reported)
Updated: after every execution

Selection rule:
  1. Route to agent with highest routing_quality_score for the task domain
  2. If top agent unavailable: next highest, if score ≥ routing_confidence_floor
  3. If no agent meets floor: escalate to supervisor with routing recommendation
  4. Never route to agent with score < 0.40 for critical tasks
```

---

## Routing Refinement Process

```
STEP 1: SIGNAL AGGREGATION (weekly)
  Collect all routing decisions from previous week
  Compute outcome_quality for each routing decision
  Update routing_intelligence_matrix

STEP 2: MISMATCH ANALYSIS
  Identify: routing decisions where outcome quality < 0.60
  For each mismatch:
    - Was a better-suited agent available?
    - What was the domain_strength difference between selected and best-available?
    - Was this a systematic mismatch (same agent/domain pattern) or isolated?

STEP 3: ROUTING RULE PROPOSAL
  For systematic mismatches (≥ 3 instances):
    Propose: routing rule adjustment
    Options:
      a) Lower priority for agent A in domain X (not exclude; just lower weight)
      b) Raise threshold for routing_confidence_floor for domain X specifically
      c) Add domain-specific routing pre-check for edge cases

STEP 4: VALIDATION AND ACTIVATION
  Standard heuristic adaptation process (AC-HA-001)
  Routing rule changes with quality_score < 0.60 require T3 sign-off
```

---

## Routing Failure Classes

```yaml
routing_failure_classes:
  RF-01: DOMAIN_MISMATCH
    description: Agent lacked domain strength for the assigned task
    mitigation: Matrix update; lower agent priority for that domain

  RF-02: CAPACITY_OVERLOAD
    description: Agent was correct choice but over-capacity
    mitigation: Capacity monitoring; workload balancing improvements

  RF-03: PREFERENCE_CONFLICT
    description: Task requirements conflicted with agent's execution preferences
    mitigation: Preference vector enrichment; routing pre-checks

  RF-04: COLLABORATION_INCOMPATIBILITY
    description: Selected agent has low trust weight with other agents in workflow
    mitigation: Collaboration-aware routing (consult collaboration graph)

  RF-05: KNOWLEDGE_GAP
    description: Agent lacked institutional knowledge needed for this domain
    mitigation: Pre-execution memory brief; knowledge base coverage improvement

  RF-06: AUTHORITY_SCOPE_MISMATCH
    description: Task required authority level the selected agent does not have
    mitigation: Authority-aware routing check; pre-routing authority validation
```

---

## Routing Metrics Dashboard

```
╔══════════════════════════════════════════════════════════╗
║           ROUTING QUALITY MONITOR — 2026-05-17           ║
╠══════════════════════════════════════════════════════════╣
║ Overall routing accuracy (30d):    —     Target: > 85%   ║
║ Domain mismatch rate (30d):        —     Target: < 10%   ║
║ Unnecessary delegation rate:       —     Target: < 8%    ║
║ Agents at routing_conf_floor:      —     Target: < 5%    ║
║ Routing intelligence matrix:    NOT YET POPULATED        ║
║ Last matrix update:                —                      ║
╚══════════════════════════════════════════════════════════╝
(Matrix populates after first 30 days of execution history)
```

---

## Governance

- Routing rules are advisory to the orchestration system, not mandatory overrides
- routing_confidence_floor changes require governance.md bounds check (max 0.85)
- Any routing rule that affects T4/T5 escalation routing requires T4 approval (FORBIDDEN-AC-06 prevents downgrade)
