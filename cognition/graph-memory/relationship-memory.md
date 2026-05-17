# Relationship Memory

## Purpose
Maintains the enterprise's persistent memory of who relates to whom, how, with what history, and with what quality — across agents, humans, teams, systems, and external entities. Relationship memory is not just an adjacency list; it is a rich, evolving record of collaboration quality, trust trajectories, delegation history, conflict patterns, and interaction outcomes. This memory enables the routing, orchestration, and governance systems to make relationship-aware decisions: assigning tasks to agents with proven collaboration histories, routing escalations through trusted paths, and detecting relationship patterns that signal risk.

---

## Relationship Memory Architecture

```
Interaction Events (task collaborations, messages, approvals, conflicts)
        ↓
[Relationship Signal Extractor]     → extract relationship signals from events
        ↓
[Relationship Memory Updater]       → update edge properties (weight, confidence, interaction_count)
        ↓
[Trajectory Analyzer]               → compute weight_trend, trust_trajectory
        ↓
[Pattern Detector]                  → detect relationship health patterns
        ↓
[Relationship Memory Graph]         → persistent relationship state
        ↓
[Retrieval Interface]               → serve relationship context to routing and reasoning
```

---

## Relationship Memory Record

```yaml
relationship_memory_record:
  relationship_id: "RELM-{source_type}-{target_type}-{random_8char}"

  entities:
    source_node_id: node_id
    source_node_type: AGENT | ENTITY | TEAM
    target_node_id: node_id
    target_node_type: AGENT | ENTITY | TEAM
    relationship_type: COLLABORATES_WITH | DELEGATES_TO | REPORTS_TO | INTEGRATES_WITH | COMPETES_WITH

  current_state:
    edge_id: edge_id                         # current active edge in graph
    weight: float (0.0–1.0)                  # current relationship strength
    confidence: float (0.0–1.0)             # confidence in weight estimate
    is_active: boolean
    valid_from: ISO-8601

  interaction_history:
    total_interactions: int
    successful_collaborations: int
    failed_collaborations: int
    conflict_count: int
    resolution_count: int                    # conflicts successfully resolved
    last_interaction_at: ISO-8601
    first_interaction_at: ISO-8601
    interaction_frequency: float             # interactions per week (rolling 30-day)

  trust_metrics:
    trust_score: float (0.0–1.0)            # composite trust in this relationship
    reliability_score: float                 # fraction of commitments honored
    communication_quality: float             # assessed from interaction outcomes
    alignment_score: float                   # value/goal alignment between parties
    trust_trajectory: INCREASING | STABLE | DECREASING | VOLATILE | RECOVERING

  performance_metrics:
    avg_task_completion_rate: float          # fraction of joint tasks successfully completed
    avg_collaboration_quality: float         # quality of outputs from joint work
    escalation_rate: float                   # fraction of interactions requiring escalation
    avg_response_time_hours: float           # how quickly the relationship responds

  risk_signals:
    open_conflicts: int
    unresolved_tension_score: float (0.0–1.0)
    recent_failure_count: int               # failures in last 30 days
    reliability_degradation: boolean        # reliability has dropped > 0.15 in 30 days

  temporal_dynamics:
    weight_history: [{timestamp: ISO-8601, weight: float, trigger: string}]
    trust_trajectory_history: [{timestamp: ISO-8601, trust_score: float}]
    gap_periods: [{from: ISO-8601, until: ISO-8601, duration_days: float}]  # inactive periods

  metadata:
    last_updated_at: ISO-8601
    update_count: int
    classification: INTERNAL | CONFIDENTIAL
```

---

## Relationship Signal Extraction

```yaml
signal_extraction:
  TASK_COLLABORATION_SIGNAL:
    trigger: task completed where multiple agents contributed
    signals:
      success_signal: all_agents get +0.02 weight increase on COLLABORATES_WITH edge
      failure_signal: all_agents get -0.03 weight on COLLABORATES_WITH edge
      quality_signal: output quality score → update avg_collaboration_quality
    attribution: weight change distributed proportionally to contribution_fraction

  DELEGATION_OUTCOME_SIGNAL:
    trigger: delegated task completed (or failed)
    signals:
      success: DELEGATES_TO edge weight +0.03; delegatee reliability +0.02
      failure: DELEGATES_TO edge weight -0.05; delegatee reliability -0.04
      refusal: DELEGATES_TO edge weight -0.02 (delegation less viable)
    weight_floor: 0.20 (DELEGATES_TO never drops below — relationship still exists)

  APPROVAL_SIGNAL:
    trigger: approval requested and granted/rejected by specific approver
    signals:
      granted_quickly: COLLABORATES_WITH weight +0.01; communication_quality +0.01
      granted_late: no weight change; SLA_AT_RISK flag if pattern repeats
      rejected: neutral (rejection can be appropriate); but rejection_reason analyzed
      conflict_of_interest_detected: COMPETES_WITH edge strengthened

  CONFLICT_SIGNAL:
    trigger: conflict detected between two agents in same workflow
    signals:
      conflict_opened: open_conflicts +1; unresolved_tension +0.10
      conflict_resolved_quickly: open_conflicts -1; unresolved_tension -0.15; resolution_count +1
      conflict_escalated: COLLABORATES_WITH weight -0.05; escalation_rate updated

  COMMUNICATION_SIGNAL:
    trigger: inter-agent message exchanged
    signals:
      prompt_response: avg_response_time_hours updated (exponential moving average)
      no_response: reliability -0.01; open_conflicts signal if expected response
      high_quality_message: communication_quality +0.01

  TRUST_VERIFICATION_SIGNAL:
    trigger: agent trust_score recalibrated by governance system
    signals: update trust_score on all COLLABORATES_WITH and DELEGATES_TO edges for this agent
```

---

## Relationship Health Assessment

```yaml
relationship_health:
  health_score_formula:
    score = (
      weight × 0.30 +
      reliability_score × 0.25 +
      trust_score × 0.25 +
      (1 - escalation_rate) × 0.10 +
      (1 - unresolved_tension_score) × 0.10
    )

  health_bands:
    EXCELLENT: score >= 0.85 — high-trust, reliable, low-conflict relationship
    HEALTHY: score >= 0.70 — working well; minor issues
    DEGRADED: score >= 0.55 — some friction; monitor and support
    AT_RISK: score >= 0.40 — significant issues; intervention may be needed
    CRITICAL: score < 0.40 — relationship failing; avoid for high-stakes tasks

  automatic_alerts:
    DEGRADED_to_AT_RISK: emit RELATIONSHIP_HEALTH_DEGRADED event to governance dashboard
    trust_trajectory_DECREASING for > 14 days: emit RELATIONSHIP_TRUST_DECLINING alert
    open_conflicts > 2 for same pair: emit PERSISTENT_CONFLICT_ALERT
    reliability_degradation = true: notify orchestration system (avoid for critical tasks)

  relationship_health_actions:
    EXCELLENT: prefer this pair for complex collaborative tasks
    HEALTHY: standard assignment; no special handling
    DEGRADED: prefer simpler tasks; monitor interactions; consider alternative
    AT_RISK: avoid for CRITICAL/HIGH blast-radius tasks; flag for governance review
    CRITICAL: do not assign jointly; notify governance; investigate root cause
```

---

## Relationship Memory Retrieval

```gql
# Find all agents Alpha collaborates with, ranked by relationship health
MATCH (a:AGENT {agent_id: "agent-alpha"})-[r:COLLABORATES_WITH]->(b:AGENT)
WHERE r.is_active = true
RETURN b, relationship_health_score(r) AS health, r.trust_score, r.weight
ORDER BY health DESC

# Find trusted delegation paths from agent to a domain capability
MATCH path = (a:AGENT {agent_id: "agent-alpha"})-[:DELEGATES_TO*1..3]->(b:AGENT)
WHERE ALL(r IN relationships(path) WHERE r.weight > 0.65)
MATCH (b)-[:MEMBER_OF]->(c:COMMUNITY {domain: "DATA_GOVERNANCE"})
RETURN path, b, path_weight(path) ORDER BY path_weight(path) DESC

# Find relationship pairs with open conflicts
MATCH (a:AGENT)-[r:COLLABORATES_WITH]->(b:AGENT)
WHERE r.open_conflicts > 0 AND r.is_active = true
RETURN a, b, r.open_conflicts, r.unresolved_tension_score
ORDER BY r.open_conflicts DESC

# Identify agents with strong governance expertise relationships
MATCH (a:AGENT)-[r:COLLABORATES_WITH]->(b:AGENT)
WHERE r.trust_score > 0.80 AND r.successful_collaborations > 10
MATCH (b)-[:MEMBER_OF]->(c:COMMUNITY {domain: "GOVERNANCE"})
RETURN a, b, r.trust_score, r.successful_collaborations

# Relationship history for audit
MATCH ALL_VERSIONS (a:AGENT {agent_id: "agent-alpha"})-[r:DELEGATES_TO]->(b:AGENT {agent_id: "agent-beta"})
ORDER BY r.valid_from
RETURN r.valid_from, r.valid_until, r.weight, r.confidence
```

---

## Relationship Memory Decay

```yaml
relationship_decay:
  decay_trigger: RELATIONSHIP_MEMORY decays when no interaction for > 30 days
  decay_rate: weight decreases by 0.02 per week of inactivity (after 30-day grace)
  floor: 0.10 (relationship memory preserved at low weight; not deleted)
  reactivation: any new interaction restores weight toward prior level (exponential recovery)
  recovery_formula: new_weight = old_weight + (prior_peak_weight - old_weight) × 0.20 per interaction

  special_cases:
    CONFLICT_memory: never decays (conflicts remain warning-relevant)
    DELEGATION_history: decays to floor slowly (delegation history has long governance relevance)
    CRITICAL_incident_involved: no decay (parties involved in critical incident tracked indefinitely)
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-memory/graph-memory-model.md` | Relationship memory is a layer within the overall memory model |
| `graph-cognition/graph-schema.md` | COLLABORATES_WITH, DELEGATES_TO, REPORTS_TO edges |
| `temporal-knowledge-graphs/relationship-evolution.md` | Evolution events feed relationship memory signals |
| `graph-routing/delegation-graph-router.md` | Relationship memory guides delegation routing |
| `orchestration-dags/graph-native-delegation.md` | Trust scores from relationship memory inform delegation |
| `graph-reasoning/organizational-intelligence.md` | Relationship patterns feed org intelligence |
| `agent-intelligence/agent-performance-tracker.md` | Performance signals feed relationship memory updates |
