# Workflow Confidence Framework

## Role
Unified confidence scoring system for all workflow outputs. Combines evidence quality, source reliability, reasoning coherence, and historical accuracy into a single confidence signal that drives routing, escalation, and human review decisions.

## Confidence Dimensions

```
DIMENSION               WEIGHT  DESCRIPTION
────────────────────────────────────────────────────────────────────────
EVIDENCE_QUALITY        0.30    Are claims grounded in verifiable sources?
REASONING_COHERENCE     0.25    Is the logic internally consistent?
SOURCE_RELIABILITY      0.20    How reliable are the information sources used?
HISTORICAL_CALIBRATION  0.15    Has this agent/workflow type been accurate before?
TASK_COMPLEXITY_MATCH   0.10    Is the task within the agent's proven capability range?
```

## Confidence Score Formula

```
confidence_score = Σ(dimension_weight × dimension_score)

DISQUALIFIERS (hard-cap to 0.20 regardless of other scores):
  - factual_claim with zero supporting evidence
  - internal logical contradiction detected
  - agent operating outside declared capability zone
  - hallucination_risk_score > 0.70 (from trust/hallucination-detection-system.md)
  - source classified as UNRELIABLE by source-validator
```

## Confidence Decision Tiers

| Score | Tier | Action |
|-------|------|--------|
| 0.90+ | VERY_HIGH | Proceed autonomously |
| 0.75-0.89 | HIGH | Proceed with standard monitoring |
| 0.60-0.74 | MEDIUM | Flag for optional review; surface to human if consequential |
| 0.45-0.59 | LOW | Route to human review before action |
| < 0.45 | VERY_LOW | Block action; require human override to proceed |

## Per-Output Confidence Record

```yaml
confidence_record:
  output_id: string
  workflow_id: string
  agent_id: string
  
  dimension_scores:
    evidence_quality: number
    reasoning_coherence: number
    source_reliability: number
    historical_calibration: number
    task_complexity_match: number
  
  composite_score: number
  tier: VERY_HIGH | HIGH | MEDIUM | LOW | VERY_LOW
  disqualifiers_triggered: [string]
  
  routing_decision: PROCEED | MONITOR | FLAG | BLOCK
  review_required: boolean
  review_rationale: string
  
  computed_at: ISO8601
```

## Integration Points
- `governance-queues/confidence-threshold-system.md` — routes LOW/VERY_LOW outputs
- `trust/hallucination-detection-system.md` — hallucination score feeds dimension
- `trust/reliability-scoring-system.md` — historical calibration feeds dimension
- `trust/explainability-engine.md` — explains confidence rationale to reviewers

## Calibration Tracking
Weekly calibration check:
- compare predicted_confidence vs. actual_quality for past 7 days
- IF calibration_error > 0.10: re-weight dimensions
- IF systematic over-confidence (predicted >> actual): reduce historical_calibration weight

## Persistence
`memory/trust/confidence-records.yaml`
