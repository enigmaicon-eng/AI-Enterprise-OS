# Success/Failure Analysis Engine
**ID:** AC-RE-002 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Performs structured decomposition of workflow outcomes to identify the specific factors that drove success or failure. Operates as a deeper analysis layer triggered by post-execution-reflection when deviation_score exceeds significance thresholds.

---

## Decomposition Framework

```
OUTCOME DECOMPOSITION MODEL

  Any workflow outcome is a product of:

  1. EXECUTION FACTORS        (what the agents did)
     ├── Decision quality      Was the routing decision correct?
     ├── Handoff quality       Did context transfer cleanly between agents?
     ├── Tool use              Were the right tools called in the right order?
     └── Resource adequacy     Was context window / token budget sufficient?

  2. INPUT FACTORS            (what was provided to agents)
     ├── Specification clarity Was the task well-defined?
     ├── Context completeness  Was all necessary context provided?
     └── Dependency readiness  Were dependencies (artifacts, gates, approvals) ready?

  3. CONSTRAINT FACTORS       (what limits were encountered)
     ├── Governance gates      Did any governance check block or slow execution?
     ├── Authority scope       Did agents stay within their authority boundaries?
     └── Resource limits       Were compute/token limits a binding constraint?

  4. ENVIRONMENTAL FACTORS    (what was true about the execution environment)
     ├── System state          Were all required systems available?
     ├── Concurrent conflicts  Did other workflows contend for same resources?
     └── Precedent gap         Was this a novel situation without prior precedent?
```

---

## Analysis Protocol

### For FAILURE outcomes (outcome_class = FAILURE)

```
1. IMMEDIATE CAUSE IDENTIFICATION
   → What was the proximate cause of failure?
   → Was it a hard stop (governance gate, exception, timeout) or soft failure (degraded output)?

2. ROOT CAUSE CHAIN
   → Trace backward from immediate cause
   → Maximum 5 causal steps (avoids infinite regression)
   → Classify each cause: EXECUTION | INPUT | CONSTRAINT | ENVIRONMENTAL

3. COUNTERFACTUAL ASSESSMENT
   → For each root cause: "If this factor had been different, would the outcome change?"
   → Assign: HIGH (failure would likely have been averted) / MEDIUM / LOW counterfactual impact
   → Focus learning on HIGH-impact counterfactual causes

4. PATTERN MATCHING
   → Compare root cause chain against known failure modes (memory/failures/)
   → If ≥ 70% structural similarity to known failure → classify as known_failure_class
   → If novel structure → classify as potential_new_failure_class; flag for human review

5. LEARNING RECORD PROPOSAL
   → If pattern_strength ≥ reflection_pattern_threshold (default 3):
     propose learning_record with learning_type = FAILURE_CLASS
   → Include: failure class, trigger conditions, early warning signs, mitigation pattern
```

### For SUCCESS outcomes (outcome_class = SUCCESS with deviation_score > +0.2)

```
1. SUCCESS FACTOR IDENTIFICATION
   → What drove the above-expected outcome?
   → Agent selection quality? Handoff quality? Routing efficiency? Novel approach?

2. REPLICABILITY ASSESSMENT
   → Were the success factors within our control (replicable) or circumstantial?
   → REPLICABLE: strong handoff preparation, right agent selected, clear spec
   → CIRCUMSTANTIAL: favorable timing, low system load, simple task

3. PATTERN EXTRACTION
   → If success factors are replicable AND pattern_strength ≥ 3:
     propose learning_record with learning_type = PATTERN
   → Include: success conditions, replicable factors, recommended heuristic adjustment
```

---

## Failure Classification Taxonomy

```yaml
failure_classes:

  FC-01: CONTEXT_LOSS
    description: Agent received insufficient context to complete task
    indicators: [agent_context_incomplete, handoff_quality < 0.5, excessive_clarification_requests]
    mitigation: improve handoff template completion; increase context verification

  FC-02: AUTHORITY_BOUNDARY
    description: Agent attempted action outside its authority scope
    indicators: [governance_gate_fired, unauthorized_action_blocked]
    mitigation: routing correction; authority scope documentation

  FC-03: DEPENDENCY_RACE
    description: Required artifact/approval not ready when agent needed it
    indicators: [wait_time > 2x expected, dependency_not_found_errors]
    mitigation: dependency ordering; parallel execution where safe

  FC-04: SPECIFICATION_AMBIGUITY
    description: Task specification was underspecified; agent made incorrect assumptions
    indicators: [multiple_clarification_cycles, output_mismatch, rework_triggered]
    mitigation: spec quality gates; pre-execution specification review

  FC-05: ROUTING_MISMATCH
    description: Task routed to suboptimal agent for the domain
    indicators: [agent_performance_below_domain_average, excessive_delegation_cycles]
    mitigation: routing heuristic adjustment; domain strength profile update

  FC-06: GOVERNANCE_DEADLOCK
    description: Multiple governance constraints created a situation with no valid path
    indicators: [all_options_blocked, circular_gate_dependency]
    mitigation: governance exception process; human resolution; T4 escalation

  FC-07: MEMORY_GAP
    description: Agent lacked access to required institutional knowledge
    indicators: [repeated_solving_of_known_problem, no_precedent_found, pattern_ignored]
    mitigation: knowledge base coverage; memory retrieval improvement

  FC-08: ORCHESTRATION_DEPTH
    description: Task required deeper orchestration than retry depth allowed
    indicators: [max_retry_depth_reached, escalation_before_resolution]
    mitigation: orchestration_retry_depth heuristic increase (bounded)

  FC-09: TEMPORAL_DRIFT
    description: Task assumptions became stale during extended execution
    indicators: [context_freshness_degraded, external_state_changed_mid_execution]
    mitigation: context freshness checks; execution segmentation
```

---

## Output

Produces enhanced reflection_event records with:
- `root_causes`: structured list of identified causes (using FC taxonomy)
- `counterfactual_impact`: map of cause → impact level
- `failure_class`: FC-NN classification if applicable
- `learning_record_proposed`: bool + proposed learning_record draft

---

## Governance

- Failure analysis outputs are append-only; prior analyses cannot be retroactively modified
- Novel failure class proposals (not matching FC-01 to FC-09) require T3 review before activation
- Analysis that implicates a governance gate as a failure cause requires T4 notification
  (governance constraints are not errors; this is for calibration awareness only)
