# Collaboration History
**ID:** AC-IE-005 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Maintains persistent records of collaboration relationships between agent pairs. Collaboration history enables the orchestration system to prefer agent pairs with proven track records, identify persistent friction patterns, and improve handoff quality through relationship-aware context preparation.

---

## Collaboration Relationship Model

```
COLLABORATION RELATIONSHIP: Agent A ↔ Agent B

  DIMENSIONS:
    1. collaboration_count    (how many times they have worked together)
    2. trust_weight           (accumulated trust score; bounded)
    3. quality_trend          (is collaboration quality improving, stable, or declining?)
    4. friction_map           (what types of friction have been observed)
    5. handoff_quality_avg    (average quality of handoffs between this pair)
    6. last_collaboration     (recency; relationships decay if not maintained)
    7. successful_patterns    (what workflows has this pair executed well?)
    8. friction_patterns      (what workflow types have produced friction?)
```

---

## Trust Weight Evolution

```
INITIAL STATE:
  New collaboration pair: trust_weight = agent_collaboration_trust_initial (heuristic; default 0.50)

UPDATES:
  After every collaboration_record:
    trust_delta = f(quality_score, interaction_type, friction_detected)
    
    quality_score → trust_delta mapping:
      quality_score > 0.85: +0.03
      quality_score 0.70–0.85: +0.01
      quality_score 0.55–0.70: 0.00
      quality_score 0.40–0.55: -0.02
      quality_score < 0.40: -0.05
    
    friction modifier:
      friction_detected = false: no change
      friction_detected = true, resolved: -0.01
      friction_detected = true, unresolved: -0.03
    
    Bounds: trust_weight always in [0.20, 0.90]
    Hard cap at 0.90 without human milestone review (governance.md)

MILESTONE REVIEWS:
  Trust weight reaching 0.75: T3 milestone review required
  Trust weight reaching 0.85: T3 milestone review required
  Trust weight reaching 0.90: T4 milestone review required
  Review question: "Is this trust level empirically warranted? Are there any hidden risks?"
```

---

## Collaboration Graph

```
The collaboration history for all agent pairs forms a collaboration graph:

  Nodes: agents
  Edges: collaboration relationships
  Edge weight: trust_weight
  Edge attributes: quality_trend, friction_map, interaction_count

This graph is used by:
  - Orchestration routing: prefer high-trust pairs for critical workflows
  - Team formation: assemble workflows with compatible agent pairs
  - Friction analysis: identify structural gaps in the collaboration network
  - Trust evolution: identify cluster formation and diversity

Graph maintenance:
  - Inactive edges (no collaboration in > 90 days): weight decays by 0.01/week
  - Edges with trust_weight < 0.25: flagged for pair review
  - Graph is exported weekly to memory/organizational/ for archival
```

---

## Handoff Optimization via Collaboration History

```
HANDOFF PREPARATION:
  When agent A prepares a handoff for agent B, consultation of collaboration history enables:

  1. CONTEXT CALIBRATION
     If prior collaboration shows B frequently requests clarification on domain X:
     → A provides extra context on domain X proactively

  2. FORMAT ADAPTATION
     If prior collaboration shows B produces better outputs when given structured inputs:
     → A formats output in structured rather than narrative form

  3. TRUST SIGNALING
     If trust_weight(A,B) > 0.75:
     → Less hedging language in handoff; direct statements
     If trust_weight(A,B) < 0.45:
     → Additional verification checkpoints included; more explicit constraints

  4. FRICTION PREVENTION
     If friction_map includes CONTEXT_GAP:
     → Explicit context completeness checklist in handoff
     If friction_map includes AUTHORITY_CONFLICT:
     → Authority boundaries explicitly stated in handoff
```

---

## Collaboration Health Monitoring

```
PAIR-LEVEL HEALTH:
  STRONG:   trust_weight > 0.70, quality_trend = IMPROVING, friction_rate < 0.10
  STABLE:   trust_weight 0.50–0.70, quality_trend = STABLE, friction_rate < 0.20
  WATCH:    trust_weight 0.40–0.50, OR quality_trend = DECLINING, OR friction_rate > 0.20
  REVIEW:   trust_weight < 0.40, OR 3+ unresolved friction events
    → T3 review: is this pair routing appropriate? Does workflow design need adjustment?

NETWORK-LEVEL HEALTH:
  Avg trust_weight across all active pairs: target > 0.60
  Network diameter (max hops between any two agents): target ≤ 4
  Isolated agents (< 2 collaboration relationships): investigate routing patterns
```

---

## Governance

- Trust weights are auditable and explainable (full collaboration_record history available)
- Trust weight > 0.90 is constitutionally blocked without human milestone review
- Collaboration history cannot be used to bypass governance authority structures
- Collaboration history is retained for 3 years (organizational memory)
