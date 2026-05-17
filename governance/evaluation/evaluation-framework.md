# Evaluation Framework

## Role
Master evaluation system for the Enterprise AI OS. Defines universal evaluation dimensions, protocols, quality gates, and the evaluation chain that runs on every significant workflow output, agent action, and governance decision.

## Universal Evaluation Dimensions

```
DIMENSION               DESCRIPTION                                 APPLIES_TO
────────────────────────────────────────────────────────────────────────────────────
ACCURACY                Factual correctness; claims match reality   All outputs
COMPLETENESS            Required elements present; no omissions     All outputs
RELEVANCE               Output addresses the stated task            All outputs
REASONING_QUALITY       Logic is sound, coherent, non-circular      Decisions/analysis
ACTIONABILITY           Outputs can be acted upon as written        Recommendations
COMPLIANCE_ADHERENCE    Follows applicable policies and regulations Governance decisions
CONSTITUTIONAL_ALIGNMENT Consistent with constitutional principles  All consequential outputs
EXPLAINABILITY          Human reviewer can understand the output    High-stakes outputs
EFFICIENCY              Output quality per resource unit consumed   All outputs (optimization)
SAFETY                  No harmful, deceptive, or irreversible risk High-stakes outputs
```

## Evaluation Protocol

### Standard Evaluation (runs on all non-trivial outputs)
```
STEP 1: AUTOMATED DIMENSION SCORING (< 500ms)
  - accuracy:       hallucination-detection-system score (inverted)
  - completeness:   template-based completeness check
  - relevance:      semantic similarity to task definition
  - reasoning:      coherence check (contradiction detector)

STEP 2: CONFIDENCE CHECK
  - link: workflow-confidence-framework confidence record
  - IF score < 0.60: trigger deeper evaluation

STEP 3: QUALITY GATE
  - compare composite_score vs. workflow_type threshold
  - IF below threshold: FAIL gate → retry with targeted correction prompt
  - IF above threshold: PASS → continue
```

### Deep Evaluation (consequential outputs + governance decisions)
```
All standard checks, plus:
  - reasoning_quality:     full chain-of-thought coherence analysis
  - constitutional_alignment: constitutional-alignment-system scan
  - explainability:        explainability-engine generates explanation
  - safety:                sensitive-workflow-controls scan
  - human_review_flag:     set if score 0.55-0.75 AND consequential
```

## Quality Gate Thresholds by Workflow Class

```
CLASS                   PASS_THRESHOLD  RETRY_BUDGET  FAIL_ACTION
STANDARD                0.70            2 retries     Block + flag
ELEVATED                0.80            1 retry       Block + human review
COMPLIANCE              0.85            1 retry       Block + compliance officer
EXECUTIVE               0.90            0 retries     Block + T4 review required
CONSTITUTIONAL          0.95            0 retries     Block + T5 mandatory review
```

## Evaluation Record Schema
```yaml
evaluation_record:
  evaluation_id: string
  output_id: string
  workflow_id: string
  workflow_class: string
  evaluation_depth: STANDARD | DEEP
  
  dimension_scores: {dimension: score}
  composite_score: number
  gate_verdict: PASS | FAIL | HUMAN_REVIEW
  
  retry_count: number
  final_disposition: APPROVED | HUMAN_APPROVED | BLOCKED
  
  evaluated_at: ISO8601
  evaluation_duration_ms: number
```

## Evaluation Coverage Target
```
ALL outputs from COMPLIANCE/EXECUTIVE/CONSTITUTIONAL workflows: 100% deep evaluation
ALL outputs from ELEVATED workflows: 100% standard + deep if confidence < 0.80
STANDARD workflow outputs: 100% standard; deep if flagged
```

## Persistence
`memory/evaluation/evaluation-records.yaml`
`memory/evaluation/gate-verdicts.jsonl`
