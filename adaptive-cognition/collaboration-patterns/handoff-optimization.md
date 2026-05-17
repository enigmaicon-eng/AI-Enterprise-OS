# Handoff Optimization
**ID:** AC-CP-004 | **Tier:** T2 | **Class:** STANDARD
**Owner:** Architecture Org + Delivery Org | **Updated:** 2026-05-17

---

## Purpose

Learns how to improve artifact handoffs between agents — ensuring that the receiving agent has everything it needs to continue effectively, reducing rework, re-clarification requests, and handoff-induced quality loss. Handoff optimization focuses on the *interface* between agents rather than the internal quality of any single agent's work.

---

## Handoff Quality Model

```
HANDOFF QUALITY DIMENSIONS:

  COMPLETENESS [0.0, 1.0]:
    Does the handoff artifact contain all information the receiver needs?
    Measured by: receiver rework rate, re-clarification requests, missing data flags

  STRUCTURE [0.0, 1.0]:
    Is the artifact structured in a way the receiver can directly consume?
    Measured by: receiver parse time, structural errors flagged by receiver

  CONTEXT FIDELITY [0.0, 1.0]:
    Is the decision context (why, not just what) preserved in the handoff?
    Measured by: governance questions raised by receiver, escalations due to context gaps

  TIMING [0.0, 1.0]:
    Does the handoff arrive when the receiver is ready to process it?
    Measured by: receiver wait time, blocking duration, queue depth at handoff

  COMPOSITE HANDOFF QUALITY SCORE:
    HQ = 0.35 × completeness + 0.25 × structure + 0.25 × context_fidelity + 0.15 × timing
```

---

## Handoff Record Schema

```yaml
handoff_record:
  record_id: HR-{ISO8601}-{hash6}
  source_agent: agent_id
  receiver_agent: agent_id
  artifact_type: string         # SPEC | ADR | BRIEF | REPORT | CODE | DATA | PLAN
  workflow_id: WF-*
  workflow_step: string
  completeness_score: float
  structure_score: float
  context_fidelity_score: float
  timing_score: float
  composite_hq_score: float
  receiver_rework_detected: boolean
  reclarification_count: integer
  escalations_triggered: integer
  timestamp: ISO8601
```

---

## Handoff Pattern Learning

```
LEARNING TARGETS:

  FOR EACH (source_agent, receiver_agent, artifact_type) COMBINATION:
    After ≥ 8 samples:
      Compute: avg_hq, std_hq, worst_dimension
      If avg_hq < 0.70 AND sample_count ≥ 8:
        → Propose handoff improvement intervention

  COMMON FAILURE PATTERNS:

    CONTEXT_STRIPPING:
      Source agent produces correct output but strips reasoning context
      Symptom: context_fidelity_score consistently < 0.60
      Fix: Require context block in artifact template for this source+receiver pair

    SCHEMA_MISMATCH:
      Artifact type produced by source doesn't match schema expected by receiver
      Symptom: structure_score consistently < 0.65
      Fix: Update artifact template; add schema validation at handoff point

    PREMATURE_HANDOFF:
      Source hands off before artifact is ready for receiver to action
      Symptom: timing_score high but completeness_score low; receiver rework > 30%
      Fix: Add completion gate before handoff in workflow DAG

    OVER_SPECIFICATION:
      Source agent over-engineers the artifact, creating processing overhead
      Symptom: timing_score low; receiver parse time high; no quality benefit
      Fix: Simplify artifact template; remove non-essential fields for this pair
```

---

## Handoff Template Evolution

```
TEMPLATE IMPROVEMENT CYCLE:

  When a handoff pattern shows avg_hq < 0.70 over ≥ 8 samples:

  STEP 1: ROOT CAUSE ANALYSIS
    Identify worst_dimension
    Review last 5 handoff_records for that (source, receiver, artifact_type)
    Classify failure pattern (from above taxonomy)

  STEP 2: TEMPLATE CHANGE PROPOSAL
    Draft updated artifact template addressing root cause
    Changes must be backward-compatible (existing workflows not broken)
    Proposal requires review by Architecture Org

  STEP 3: VALIDATION
    Apply updated template to 5 test workflow runs (sandbox or pilot)
    Measure HQ improvement vs. prior baseline
    Required: avg_hq improvement ≥ 0.10 to adopt

  STEP 4: ROLLOUT
    T3 Architecture Org approves template update
    Updated template deployed to artifact template registry
    Prior template archived (not deleted) with supersession note

  ITERATION CADENCE:
    No more than one template update per (source, receiver, artifact_type) per 30 days
    Prevents thrashing and allows quality signal to stabilize
```

---

## Handoff Quality Targets

```
ORGANIZATIONAL TARGETS:
  avg composite HQ across all pairs:      ≥ 0.75 (current: building baseline)
  pct handoffs with rework detected:      < 20%
  avg reclarification_count per handoff:  < 0.5 (< 1 in 2 handoffs needs clarification)
  escalations due to handoff quality:     < 5% of total escalations
```

---

## Governance

- Handoff template changes require T3 Architecture Org approval
- Handoff records retained for minimum 12 months (audit and learning)
- Receiver agents may flag handoff quality issues directly (logged as feedback signal)
- Quarterly handoff quality review included in Delivery Org operations review
