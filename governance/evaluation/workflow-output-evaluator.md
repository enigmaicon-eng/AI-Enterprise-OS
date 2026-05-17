# Workflow Output Evaluator

## Role
Automated evaluator that scores workflow outputs against task-specific quality rubrics. Combines dimension scoring, output structure validation, completeness checking, and relevance assessment into actionable quality verdicts.

## Evaluation Rubrics by Workflow Type

### PRD / Requirements Output
```
DIMENSION           WEIGHT  CRITERIA
completeness        0.30    All required sections present; acceptance criteria defined
specificity         0.25    Requirements are testable and unambiguous
alignment           0.25    Requirements align with stated user problem
technical_feasibility 0.20  Engineering team can implement as written
```

### Architecture Decision Record (ADR)
```
DIMENSION           WEIGHT  CRITERIA
problem_clarity     0.25    Problem statement is precise and bounded
option_coverage     0.25    At least 3 options evaluated; no obvious option missing
consequence_analysis 0.30   Consequences section covers risk + tradeoff + mitigation
decision_rationale  0.20    Decision follows from analysis; not asserted without reasoning
```

### Compliance Report
```
DIMENSION           WEIGHT  CRITERIA
accuracy            0.35    Compliance claims traceable to evidence
completeness        0.30    All obligations in scope addressed
risk_coverage       0.20    Risk items have treatment plans
regulatory_mapping  0.15    Every finding maps to a specific regulatory article
```

### Incident Report
```
DIMENSION           WEIGHT  CRITERIA
timeline_accuracy   0.25    Events in correct chronological order with timestamps
root_cause_depth    0.30    Root cause identified (not just symptoms)
action_items        0.25    Preventive actions are specific, assigned, time-bounded
learning_capture    0.20    Generalizable lesson extracted for wiki
```

## Automated Scoring Protocol

```
STEP 1: CLASSIFY output type → select rubric
STEP 2: STRUCTURE CHECK → required sections present?
STEP 3: DIMENSION SCORING → per rubric weights
STEP 4: COMPUTE composite_quality_score = Σ(weight × dimension_score)
STEP 5: COMPARE vs. workflow_class threshold (from evaluation-framework.md)
STEP 6: EMIT evaluation_record
```

## Retry Improvement Instructions

When output fails gate:
```
GENERATE targeted_correction_prompt:
  - identify: which dimension(s) below threshold
  - generate: specific instruction to improve that dimension
  - attach: dimension score + what was missing
  - constraint: maximum specificity — no generic "improve quality" prompts

FORMAT: "Your [output_type] scored {N} on [dimension]. To pass, you must [specific action]."
```

## Evaluation Feedback Loop
Outputs that fail evaluation → performance-learning/performance-feedback-loop.md:
```
signal_type: GATE_VERDICT
verdict: FAIL
dimension_breakdown: {dimension: score}
improvement_prompt_sent: true/false
retry_outcome: PASS | FAIL_AGAIN
```

This feeds agent-assignment-optimizer and routing-optimizer for improved future routing.

## Persistence
`memory/evaluation/workflow-evaluations.yaml`
