# Adaptive Decision Heuristics
**ID:** AC-HA-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org + Architecture Org | **Updated:** 2026-05-17

---

## Purpose

Defines the core heuristic adaptation engine — the system that takes validated learning records and reflection events and translates them into updates to operational heuristics. This is where observational intelligence becomes executable behavior.

---

## Heuristic Adaptation Engine

```
ADAPTATION ENGINE LIFECYCLE

  INPUT:
    - learning_record (status = VALIDATED, actionable = true)
    - affected_heuristics field from learning_record
    - Current heuristic values from heuristic-registry.jsonl
    - Governance bounds from governance.md

  STEP 1: SIGNAL COMPUTATION
    For each affected heuristic:
      Compute adaptation_signal:
        direction: INCREASE | DECREASE | NO_CHANGE
        magnitude: how much to change (raw, before bounds check)
        confidence: signal confidence [0.0, 1.0]
        evidence_quality: learning_record confidence × pattern_strength

  STEP 2: BOUNDS VALIDATION
    Proposed new value = current_value ± (direction × magnitude)
    Check: is proposed value within [min_bound, max_bound]?
    Check: does proposed change exceed adaptation_rate_max in current 30-day window?
    Check: does cumulative change since last reset approach drift limits?
    If ANY check fails: BLOCK adaptation; log BLOCKED_ATTEMPT; no partial adaptation

  STEP 3: HUMAN APPROVAL CHECK
    Does this heuristic have a human_required_above/below threshold?
    If proposed value crosses that threshold: route to T3 approval queue
    If no approval needed: proceed to digital twin validation

  STEP 4: DIGITAL TWIN VALIDATION (if confidence 0.60–0.80)
    Request: HeuristicSimulationRequest to digital-twins/
    Await result (timeout: 60 minutes operational; 4 hours strategic)
    Apply simulation result:
      POSITIVE: confidence += 0.10
      NEGATIVE: BLOCK proposal; flag for review
      INCONCLUSIVE: proceed with caution note

  STEP 5: CONFIDENCE THRESHOLD CHECK
    Final confidence must exceed 0.65 to activate
    If confidence < 0.65: archive as low-confidence proposal; revisit on next learning cycle

  STEP 6: ACTIVATION
    Write new heuristic_record to heuristic-registry.jsonl
    Previous value written to heuristic-rollback.jsonl
    Cognitive lineage record created
    Event published: cognition.heuristic.changed
    Monitoring window started (7 days default)

  STEP 7: POST-ACTIVATION MONITORING
    Monitor: execution outcomes involving this heuristic for 7 days
    Compare: pre- vs. post-activation outcomes (same workflow types)
    If post-activation outcomes significantly worse (> 20% decline): auto-rollback proposal
    Auto-rollback requires T3 confirmation (never truly autonomous)
```

---

## Heuristic Quality Criteria

A well-formed heuristic is:

```yaml
qualities:
  SPECIFIC: applies to a defined context class, not all situations
  BOUNDED: has explicit min/max values preventing extreme behavior
  MEASURABLE: its effectiveness can be empirically assessed
  REVERSIBLE: a prior value is always preserved for rollback
  EXPLAINABLE: the reasoning behind the current value is documented
  GOVERNED: any change above threshold requires human review
```

---

## Multi-Heuristic Interactions

Some heuristics interact — changing one affects the behavior of others. These interactions are tracked:

```yaml
heuristic_interaction_map:
  routing_confidence_floor × execution_confidence_learning:
    interaction: confidence learning feeds the routing floor value
    constraint: routing_confidence_floor cannot exceed execution confidence accuracy rate
    
  escalation_delay_seconds × orchestration_retry_depth:
    interaction: retry depth and delay together define total resolution window
    constraint: (retry_depth × avg_execution_time) + escalation_delay should not exceed SLA
    
  reflection_pattern_threshold × learning rate:
    interaction: higher threshold → fewer learning records → slower adaptation
    design_intent: conservative learning preferred; threshold should not be set too low
```

When a proposed heuristic change would affect an interacting heuristic, both are validated together before either is activated.

---

## Heuristic Documentation Standard

Every heuristic must have a documentation entry:

```markdown
### {heuristic_id}
**Current Value:** {value}
**Bounds:** [{min}, {max}]
**Rationale:** Why this value was set
**History:** Changes + outcomes
**Last Updated:** {date}
**Effectiveness Score:** {score}/1.0
```

---

## Governance

- Heuristic adaptation is the only component of adaptive cognition that can modify runtime behavior
- All heuristic changes are logged before they take effect (INV-AC-02)
- All heuristic values at any point in time can be reconstructed from the JSONL log
- Heuristic adaptation is paused during FREEZE_ALL emergency control
- Quarterly review of heuristic portfolio health is mandatory (T4)
