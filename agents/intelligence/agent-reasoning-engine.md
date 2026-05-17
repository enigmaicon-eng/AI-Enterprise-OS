# Agent Reasoning Engine

## Purpose
Provides structured reasoning frameworks that agents apply when solving complex problems, making decisions, and generating outputs. Raw language model capability produces outputs — the reasoning engine produces *trustworthy* outputs by enforcing deliberate, structured thinking processes that are observable, auditable, and improvable.

---

## Reasoning Architecture

```yaml
reasoning_architecture:
  premise: |
    Intelligence without structure produces unpredictable outputs.
    The reasoning engine wraps cognitive tasks in structured protocols that:
    - make reasoning steps explicit and auditable
    - detect reasoning failures before they propagate
    - enable post-hoc analysis of why a conclusion was reached
    - allow targeted coaching on specific reasoning steps
  
  layers:
    PLANNING_LAYER: decide which reasoning approach to use for this task
    EXECUTION_LAYER: step through the chosen reasoning protocol
    VERIFICATION_LAYER: check reasoning for errors before committing output
    EXPLANATION_LAYER: produce human-readable trace of the reasoning
```

---

## Reasoning Protocols

```yaml
reasoning_protocols:
  CHAIN_OF_THOUGHT:
    use_case: factual questions, analysis, explanation
    difficulty: STANDARD
    protocol:
      step_1: restate what is being asked (prevents misunderstanding the question)
      step_2: identify what information is available and relevant
      step_3: identify what information is missing
      step_4: reason through the answer step by step
      step_5: state the conclusion
      step_6: check the conclusion against the original question
    output: {answer, reasoning_trace, confidence, missing_information}
    failure_modes: [question_drift, false_premise, missing_step]
  
  STRUCTURED_DELIBERATION:
    use_case: decisions with multiple options, trade-offs, uncertainty
    difficulty: COMPLEX
    protocol:
      step_1: clearly state the decision to be made
      step_2: enumerate all relevant options (minimum 2; prefer 3)
      step_3: identify evaluation criteria (from policy/knowledge base where available)
      step_4: score each option against each criterion
      step_5: identify dominant option AND acknowledge trade-offs
      step_6: check against governance constraints (does the chosen option comply?)
      step_7: state final recommendation with confidence and key assumptions
    output: {recommendation, options_considered, evaluation_matrix, key_assumptions, governance_check}
    failure_modes: [anchoring on first option, ignoring disconfirming evidence, false dichotomy]
  
  CAUSAL_DECOMPOSITION:
    use_case: root cause analysis, incident diagnosis, debugging
    difficulty: COMPLEX
    protocol:
      step_1: describe the symptom precisely (what is observed)
      step_2: identify immediate causes (what directly caused the symptom)
      step_3: for each immediate cause: ask WHY (5-whys iteration; max 5 layers)
      step_4: identify contributing factors (systemic, environmental, coincidental)
      step_5: validate root cause by asking "would fixing this have prevented the symptom?"
      step_6: identify other possible root causes (do not anchor on first plausible one)
    output: {root_cause, contributing_factors, causal_chain, validation_question, alternatives}
    failure_modes: [tunnel vision, confusing correlation with causation, stopping too early]
  
  RISK_ASSESSMENT_PROTOCOL:
    use_case: evaluating proposed actions, changes, deployments
    difficulty: STANDARD
    protocol:
      step_1: identify all stakeholders affected by this action
      step_2: identify all potential outcomes (positive and negative)
      step_3: for each negative outcome: estimate probability and severity
      step_4: compute risk_score = probability × severity
      step_5: identify mitigations for high-risk outcomes
      step_6: check reversibility (can the action be undone if outcome is negative?)
      step_7: check blast_radius (how many systems/agents/people are affected?)
      step_8: compute net risk and compare to organizational risk threshold
    output: {risk_score, blast_radius, reversibility, top_risks, mitigations, proceed_recommendation}
    failure_modes: [optimism bias, overlooking tail risks, ignoring reversibility]
  
  EVIDENCE_INTEGRATION:
    use_case: synthesizing from multiple sources; producing grounded conclusions
    difficulty: COMPLEX
    protocol:
      step_1: enumerate all available evidence items with source and credibility
      step_2: assess consistency: do items agree or contradict?
      step_3: for contradictions: try to resolve; if unresolvable, weight by credibility
      step_4: compute confidence: high agreement + strong evidence = high confidence
      step_5: state conclusion and explicitly list what would change the conclusion
      step_6: identify evidence gaps (what additional information would be most valuable?)
    output: {conclusion, evidence_basis, confidence, contradictions_noted, gap_list}
    failure_modes: [cherry-picking, overweighting recent evidence, not updating on new evidence]
  
  CONSTITUTIONAL_EVALUATION_PROTOCOL:
    use_case: evaluating whether an action complies with constitutional principles
    difficulty: EXPERT
    protocol:
      step_1: identify which constitutional dimensions this action implicates
      step_2: for each implicated dimension: evaluate compliance (PASS/FAIL/UNCERTAIN)
      step_3: for UNCERTAIN: check if this is a novel domain (triggers CONST-03)
      step_4: check for conditional compliance patterns (triggers CONST-01 if conditional)
      step_5: check for repeated near-miss patterns (triggers CONST-02 if found)
      step_6: produce overall evaluation with dimension breakdown and confidence
      step_7: mandatory escalation if any dimension is FAIL or evaluation confidence < 0.75
    output: {evaluation: PASS | CONDITIONAL | FAIL, dimension_results, confidence, triggers_found, escalation_required}
    failure_modes: [scope minimization, false PASS on novel situation, skipping dimensions]
    governed_by: this protocol is locked; cannot be modified by agent learning
```

---

## Protocol Selection

```yaml
protocol_selection:
  task_to_protocol_mapping:
    question_or_explanation: CHAIN_OF_THOUGHT
    multi_option_decision: STRUCTURED_DELIBERATION
    root_cause_or_diagnosis: CAUSAL_DECOMPOSITION
    risk_or_impact_assessment: RISK_ASSESSMENT_PROTOCOL
    evidence_synthesis: EVIDENCE_INTEGRATION
    constitutional_check: CONSTITUTIONAL_EVALUATION_PROTOCOL
    novel_or_ambiguous: STRUCTURED_DELIBERATION (safest for uncertainty)
  
  complexity_escalation:
    if_chain_of_thought_yields_uncertain: upgrade to EVIDENCE_INTEGRATION
    if_decision_touches_governance: always run CONSTITUTIONAL_EVALUATION_PROTOCOL additionally
    if_risk_score > 0.60: always run full RISK_ASSESSMENT_PROTOCOL
  
  parallel_reasoning:
    allowed: two protocols may run in parallel (e.g., CAUSAL_DECOMPOSITION + RISK_ASSESSMENT)
    not_allowed: CONSTITUTIONAL_EVALUATION_PROTOCOL must always run sequentially and completely
```

---

## Reasoning Verification

```yaml
reasoning_verification:
  pre_output_checks:
    consistency_check: does the conclusion follow from the reasoning steps?
    completeness_check: were all required protocol steps completed?
    governance_check: does the output comply with applicable policies?
    confidence_check: is stated confidence calibrated to evidence quality?
  
  failure_detection:
    INCOMPLETE_REASONING: protocol steps skipped → flag output as PROVISIONAL; require completion
    CIRCULAR_REASONING: conclusion present in premises → stop; flag; request human review
    FALSE_DICHOTOMY: only 2 options considered for STRUCTURED_DELIBERATION → require expansion
    CONFIDENCE_WITHOUT_BASIS: high confidence but thin evidence → force calibration adjustment
    CONSTITUTIONAL_MISS: evaluation did not identify a known trigger → flag as UNCERTAIN; escalate
  
  verification_outcome:
    PASS: all checks passed; proceed to output delivery
    PASS_WITH_NOTE: minor issues noted; output delivered with caveat
    REQUIRE_REVISION: significant issues; re-run affected steps
    ESCALATE: verification failed on constitutional or safety check; human review required
```

---

## Reasoning Audit Trail

```yaml
reasoning_audit:
  stored_per_reasoning_event:
    reasoning_id: string
    agent_id: string
    task_id: string
    protocol_used: string
    steps_executed: [{step, input, output, duration_ms}]
    verification_result: string
    final_confidence: float
    output_ref: ref
    duration_total_ms: int
  
  retention: 2 years for GOVERNANCE protocols; 1 year for others
  
  use_cases:
    - replay how the agent reached this conclusion (transparency)
    - identify which reasoning step was weak (coaching target)
    - verify constitutional protocol was fully executed (compliance)
    - compare reasoning quality before and after coaching (improvement measurement)
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-intelligence/agent-confidence-calibration.md` | Confidence output from reasoning |
| `agent-intelligence/agent-memory-system.md` | Memory provides context to reasoning steps |
| `agent-learning/agent-behavioral-adaptation.md` | Reasoning protocol selection adapts with learning |
| `decision-models/runtime-decision-engine.md` | Decision protocols interact with decision models |
| `process-governance/workflow-compliance-system.md` | Constitutional evaluation protocol output |
| `agent-capabilities/agent-capability-assessment.md` | Reasoning quality is an assessed capability |
