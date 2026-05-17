# Execution Confidence Learning
**ID:** AC-HA-004 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Calibrates the confidence scores that agents and orchestration systems express during execution. Well-calibrated confidence is essential for routing decisions, escalation timing, and human trust in AI outputs. This system learns the gap between expressed confidence and actual outcomes, then adjusts confidence generation accordingly.

---

## Confidence Calibration Problem

```
THE CALIBRATION GAP:
  An agent says: "I'm 90% confident in this routing decision"
  Actual accuracy at expressed 90% confidence: 67%
  Calibration gap: +23% overconfidence

  An agent says: "I'm 50% confident in this analysis"  
  Actual accuracy at expressed 50% confidence: 74%
  Calibration gap: -24% underconfidence

Both are problematic:
  Overconfidence: escalations don't trigger when they should; quality gates passed incorrectly
  Underconfidence: unnecessary escalations; human attention wasted; execution slowed
```

---

## Confidence Measurement Protocol

```
After every execution with a confidence-tagged output:
  Record:
    - agent_id
    - task_type
    - expressed_confidence (what the agent stated)
    - outcome_quality (what actually resulted)
    - confidence_domain (routing, analysis, specification, code, etc.)

Compute rolling calibration metrics:
  For each (agent, confidence_domain) pair:
    expected_reliability_curve: expressed_confidence → avg_outcome_quality mapping
    calibration_error: mean(|expressed_confidence - actual_accuracy|)
    direction_bias: positive = overconfident; negative = underconfident
    
  Target: expected_reliability_curve approaches y = x (perfect calibration)
```

---

## Calibration Correction Model

```
CORRECTION APPROACH: Confidence offset per agent per domain

  corrected_confidence = expressed_confidence + calibration_offset(agent, domain)
  
  calibration_offset examples:
    routing decisions, Agent-003: -0.08  (agent over-expresses routing confidence)
    analysis tasks, Agent-001: +0.05     (agent under-expresses analysis confidence)
    default (no history): 0.00           (no correction until calibration data exists)
  
  Calibration offset bounds (per governance.md):
    bounded: [-0.15, +0.15]
    adaptation rate: ≤ 0.02 per 30 days (slow; confidence calibration should be stable)

CALIBRATION QUALITY METRICS:
  After applying correction:
    Post-correction calibration_error: target < 0.10
    Calibration improvement rate: % reduction in calibration_error over 90 days
    Domains with acceptable calibration (error < 0.10): track coverage
```

---

## Confidence Threshold Learning

Beyond per-agent calibration, the system learns which confidence thresholds produce good outcomes in different contexts:

```yaml
threshold_learning:

  routing_confidence_floor:
    question: What minimum confidence produces acceptable routing accuracy?
    current_floor: routing_confidence_floor heuristic (default 0.65)
    learning: track outcomes at different confidence levels
    signal: accuracy at 0.60 vs 0.65 vs 0.70 thresholds
    adaptation: adjust floor if data shows floor_too_high (unnecessary blocks) 
                or floor_too_low (bad routing at floor level)

  escalation_confidence_trigger:
    question: At what confidence level should agent escalate vs. proceed?
    default: escalate when confidence < 0.45 for consequential decisions
    learning: track outcomes when proceeding at confidence 0.40–0.55
    adaptation: adjust trigger based on actual outcome quality at borderline confidence
```

---

## Confidence Lineage

For full explainability, the confidence correction applied to any output is traceable:

```yaml
confidence_lineage_record:
  output_id: ID of the output (decision, routing, analysis)
  agent_id: producing agent
  expressed_confidence: 0.82
  calibration_offset_applied: -0.07
  corrected_confidence: 0.75
  calibration_data_source: last 90 days, 47 routing decisions, Agent-003
  calibration_accuracy: ±0.06 (margin of error on the offset itself)
```

This means any human reviewer can see not just what confidence was expressed but how it was adjusted and on what basis.

---

## Governance

- Confidence corrections are applied transparently and are logged
- No calibration correction may exceed bounds [-0.15, +0.15]
- Confidence calibration history is retained for 2 years
- If a calibration correction produces worse outcomes than uncorrected: T3 review + potential reversion
