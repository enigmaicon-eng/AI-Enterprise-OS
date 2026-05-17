# Post-Execution Reflection Engine
**ID:** AC-RE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Runs automatically after every workflow execution that reaches a terminal state (COMPLETED, FAILED, TIMED_OUT, ESCALATED). Produces a structured reflection_event record that captures what happened, how it compared to expectations, and whether it warrants deeper analysis.

This is the primary data-generation engine for the Adaptive Cognition Layer. Without consistent post-execution reflection, all downstream adaptation is blind.

---

## Execution Protocol

```
STEP 1: EVENT RECEIPT
  Trigger: workflow.completed | workflow.failed | workflow.timed_out | escalation.triggered
  Input: workflow_id from execution-ledger.jsonl
  Retrieve: workflow definition, expected outcomes, actual outcomes, agent invocations

STEP 2: OUTCOME COMPARISON
  Compare actual_outcome to expected_outcome from workflow definition
  Compute deviation_score:
    +1.0 = outcome significantly exceeded expectations
     0.0 = outcome matched expectations exactly
    -1.0 = complete failure or governance breach

  Deviation scoring rubric:
    SUCCESS with all gates passed         → +0.1 to +0.3
    SUCCESS but with unexpected friction  → 0.0 to -0.1
    PARTIAL (some deliverables missing)   → -0.2 to -0.5
    FAILURE (all deliverables missing)    → -0.6 to -0.9
    GOVERNANCE BREACH                     → -1.0 (always, regardless of outcome)
    TIMEOUT                               → -0.3 to -0.6

STEP 3: SCOPE CLASSIFICATION
  Classify governance_scope:
    OPERATIONAL  → routing, timing, resource allocation, agent selection
    STRATEGIC    → multi-project patterns, long-horizon implications
    GOVERNANCE   → escalation, authority interpretation, gate logic
    CONSTITUTIONAL → invariant-related, trust tier changes, T4/T5 involvement

STEP 4: DEPTH SELECTION
  Select reflection_depth based on deviation_score and scope:
    deviation_score > -0.1 AND scope = OPERATIONAL  → SURFACE (fast, low compute)
    deviation_score < -0.2 OR scope = STRATEGIC      → MODERATE
    deviation_score < -0.5 OR scope = GOVERNANCE     → DEEP
    scope = CONSTITUTIONAL                            → DEEP + immediate T3 flag

STEP 5: COMPARABLE EVENT LOOKUP
  Query reflection-log.jsonl for prior events with:
    - same workflow_type
    - similar deviation_class
    - overlapping agent_ids
  Attach up to 5 most-similar prior events as comparable_events

STEP 6: LESSON CANDIDATE DETERMINATION
  lesson_candidate = true if:
    - deviation_score < -0.3 (significant failure)
    - 3+ comparable events with similar deviation_class exist (pattern)
    - governance_scope = GOVERNANCE or CONSTITUTIONAL

STEP 7: RECORD WRITE
  Write reflection_event to adaptive-cognition/store/reflection-log.jsonl
  Hash chain verified before write
  If lesson_candidate = true → trigger organizational-learning/cross-project-learning.md
```

---

## Reflection Depth Behaviors

### SURFACE
- Outcome comparison only
- Deviation score computed
- No root cause analysis
- Comparable events lookup (fast index query)
- Total time: < 5 seconds

### MODERATE
- Outcome comparison + deviation
- Root cause analysis (up to 3 contributing factors)
- Comparable events analysis
- Collaboration quality assessment (if multiple agents)
- Total time: < 30 seconds

### DEEP
- Full outcome analysis
- Root cause analysis (up to 8 contributing factors)
- Causal chain reconstruction (what sequence of decisions led here)
- Comparable events with pattern scoring
- Heuristic correlation (which active heuristics were applied during execution)
- Human notification at T3 (for GOVERNANCE/CONSTITUTIONAL scope)
- Total time: < 5 minutes

---

## Reflection Record Format

All outputs conform to `reflection_event` schema in schemas.yaml.

```yaml
example_reflection_event:
  event_id: RE-20260517-0042
  timestamp: 2026-05-17T14:23:11Z
  trigger_type: workflow_completion
  workflow_id: WF-EXEC-20260517-0019
  agent_ids: [arch-agent-001, eng-agent-003, qa-agent-002]
  outcome_class: PARTIAL
  expected_outcome: "Full feature delivery: PRD, ADR, implementation, test plan"
  actual_outcome: "PRD and ADR complete; implementation blocked at security gate"
  deviation_score: -0.35
  deviation_class: NEGATIVE
  reflection_depth: MODERATE
  governance_scope: OPERATIONAL
  root_causes:
    - "Security gate triggered on auth implementation pattern"
    - "No prior ADR for this auth approach; precedent gap"
  comparable_events: [RE-20260502-0031, RE-20260415-0018]
  lesson_candidate: true
  analyst_agent: adaptive-cognition-reflection-agent
  hash: [ed25519_hash]
```

---

## Performance SLOs

```
SURFACE reflections:   < 5 seconds     99th percentile
MODERATE reflections:  < 30 seconds    99th percentile
DEEP reflections:      < 5 minutes     99th percentile
Reflection backlog:    < 10 events     at any time
Reflection coverage:   > 98% of terminal workflow events get a reflection
```

---

## Governance

- Reflection records are immutable once written (append-only JSONL)
- Reflection records for GOVERNANCE scope flagged to T3 within 15 minutes
- Reflection records for CONSTITUTIONAL scope flagged to T4 immediately
- Reflection engine itself cannot be modified by adaptive processes (INV-AC-04)
- SURFACE reflections do not require human review
- DEEP reflections for GOVERNANCE/CONSTITUTIONAL scope require T3 sign-off before lesson_candidate flag is activated
