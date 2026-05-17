# Workflow Confidence Scorer

**System ID:** `workflow-confidence-scorer`
**Role:** Computes a multi-dimensional confidence score for every workflow output — quantifying the reliability of the result based on model confidence signals, semantic coherence, factual grounding, validation results, execution provenance, and historical accuracy of the producing agent; scores gate downstream decisions about whether to trust, escalate, or reject a workflow result
**Storage:** `memory/trust-boundaries/confidence-scores.jsonl`

---

## Purpose

Not all workflow outputs deserve equal trust. An output produced by a well-validated agent with high model confidence, strong factual grounding, clean semantic coherence, and no validation warnings is trustworthy. The same output from a new agent with no validation baseline, produced under memory pressure, with unprovenanced claims and marginal semantic responsiveness — is not. The confidence scorer makes this distinction explicit, quantitative, and auditable, so downstream gates and human reviewers can calibrate their response to the actual reliability of what they're receiving.

---

## Confidence Dimensions

```yaml
ConfidenceDimension:
  
  MODEL_CONFIDENCE:
    weight: 0.20
    description: "Internal model confidence signals where available"
    signals:
      - self_reported_confidence: "Agent's own confidence estimate (if asked)"
      - hedge_language_density: "Frequency of uncertainty language (perhaps, might, possibly)"
      - claim_specificity: "Specific claims vs vague generalizations"
    score_range: [0.0, 1.0]
  
  SEMANTIC_COHERENCE:
    weight: 0.20
    description: "Internal consistency and logical structure of the output"
    signals:
      - internal_contradiction_count: "Self-contradictions within the output"
      - logical_flow_score: "Reasoning steps connect correctly"
      - conclusion_support: "Conclusions are supported by stated premises"
    score_range: [0.0, 1.0]
  
  FACTUAL_GROUNDING:
    weight: 0.25
    description: "Fraction of factual claims traceable to input data"
    signals:
      - grounded_claim_ratio: "Claims traceable to input / total claims"
      - source_citation_rate: "Claims with explicit source citations"
      - external_fact_unverified_count: "External facts introduced without source"
    score_range: [0.0, 1.0]
  
  VALIDATION_RESULT:
    weight: 0.20
    description: "Score from post-execution validation (execution-validator)"
    signals:
      - schema_compliance: "0.0 if schema errors; 1.0 if fully compliant"
      - semantic_responsiveness: "From execution-validator responsiveness check"
      - policy_compliance: "0.0 if policy violations; 1.0 if clean"
    score_range: [0.0, 1.0]
  
  EXECUTION_PROVENANCE:
    weight: 0.10
    description: "Quality of the execution process that produced this output"
    signals:
      - retry_count_penalty: "Higher retries → lower score (each retry -0.05)"
      - timeout_fraction_used: "% of timeout used (near-timeout → lower score)"
      - injection_detection_clean: "0.0 if injection detected; 1.0 if clean"
    score_range: [0.0, 1.0]
  
  AGENT_HISTORICAL_ACCURACY:
    weight: 0.05
    description: "Historical calibration of this agent's accuracy on similar tasks"
    signals:
      - gate_pass_rate_30d: "Fraction of this agent's outputs that passed quality gates"
      - human_approval_rate_30d: "Fraction approved by human reviewers"
      - correction_frequency: "How often this agent's outputs were corrected"
    score_range: [0.0, 1.0]
```

---

## Scoring Algorithm

```
compute_confidence_score(workflow_output, scoring_context) → ConfidenceScore:
  
  agent_id = scoring_context.agent_id
  run_id = scoring_context.run_id
  node_id = scoring_context.node_id
  
  dimension_scores = {}
  
  # Dimension 1: Model confidence
  model_conf = compute_model_confidence(workflow_output, scoring_context)
  dimension_scores["MODEL_CONFIDENCE"] = model_conf
  
  # Dimension 2: Semantic coherence
  coherence = compute_semantic_coherence(workflow_output)
  dimension_scores["SEMANTIC_COHERENCE"] = coherence
  
  # Dimension 3: Factual grounding
  grounding = compute_factual_grounding(workflow_output, scoring_context.input_data)
  dimension_scores["FACTUAL_GROUNDING"] = grounding
  
  # Dimension 4: Validation result (from execution-validator)
  validation = scoring_context.validation_result
  validation_score = compute_validation_dimension_score(validation)
  dimension_scores["VALIDATION_RESULT"] = validation_score
  
  # Dimension 5: Execution provenance
  provenance = compute_provenance_score(scoring_context)
  dimension_scores["EXECUTION_PROVENANCE"] = provenance
  
  # Dimension 6: Historical accuracy
  historical = get_agent_historical_accuracy(agent_id, scoring_context.task_type)
  dimension_scores["AGENT_HISTORICAL_ACCURACY"] = historical
  
  # Weighted composite score
  weights = {
    "MODEL_CONFIDENCE": 0.20,
    "SEMANTIC_COHERENCE": 0.20,
    "FACTUAL_GROUNDING": 0.25,
    "VALIDATION_RESULT": 0.20,
    "EXECUTION_PROVENANCE": 0.10,
    "AGENT_HISTORICAL_ACCURACY": 0.05
  }
  
  composite = SUM(dimension_scores[d] × weights[d] for d in weights)
  
  # Apply disqualifying conditions (override composite)
  disqualifiers = check_disqualifiers(workflow_output, scoring_context, validation)
  
  IF disqualifiers:
    composite = MIN(composite, 0.20)  # Hard cap at 0.20 if disqualified
  
  # Classify confidence tier
  tier = classify_confidence_tier(composite)
  
  score = ConfidenceScore(
    score_id = generate_uuid(),
    composite_score = composite,
    confidence_tier = tier,
    dimension_scores = dimension_scores,
    disqualifiers = disqualifiers,
    scored_at = now()
  )
  
  persist_score(score, run_id, node_id)
  RETURN score

check_disqualifiers(output, context, validation):
  disqualifiers = []
  
  # Any validation ERROR (not warning) → disqualify
  IF validation.errors:
    disqualifiers.append(Disqualifier(
      reason = "Validation errors present",
      impact = "HARD_CAP"
    ))
  
  # Injection detected in the content
  IF context.injection_detection_result and context.injection_detection_result.injection_detected:
    disqualifiers.append(Disqualifier(
      reason = "Prompt injection detected in producing context",
      impact = "HARD_CAP"
    ))
  
  # Agent's ephemeral token was revoked during execution
  IF context.token_revoked_during_execution:
    disqualifiers.append(Disqualifier(
      reason = "Permission token revoked during execution",
      impact = "HARD_CAP"
    ))
  
  # Output contains credential patterns (should have been blocked, but belt-and-suspenders)
  IF contains_credential_patterns(output):
    disqualifiers.append(Disqualifier(
      reason = "Output contains credential patterns",
      impact = "HARD_CAP"
    ))
  
  RETURN disqualifiers
```

---

## Dimension Score Computations

```
compute_semantic_coherence(output) → float:
  
  text = extract_text(output)
  
  # Internal contradiction check
  claims = extract_factual_claims(text)
  contradictions = find_contradictions(claims)
  contradiction_penalty = MIN(len(contradictions) × 0.10, 0.50)
  
  # Logical flow: premises → reasoning → conclusion structure
  has_reasoning_structure = detect_reasoning_structure(text)
  reasoning_score = 0.80 if has_reasoning_structure else 0.50
  
  # Conclusion support: does conclusion follow from stated reasoning?
  if has_reasoning_structure:
    conclusion_support = evaluate_conclusion_support(text)
  else:
    conclusion_support = 0.50
  
  coherence = (reasoning_score × 0.50 + conclusion_support × 0.50) - contradiction_penalty
  RETURN MAX(0.0, MIN(1.0, coherence))

compute_factual_grounding(output, input_data) → float:
  
  output_claims = extract_factual_claims(extract_text(output))
  input_facts = extract_facts(input_data)
  
  IF NOT output_claims:
    RETURN 1.0  # No claims = fully grounded (vacuously)
  
  grounded_count = 0
  FOR claim in output_claims:
    IF is_traceable_to(claim, input_facts):
      grounded_count += 1
  
  grounding_ratio = grounded_count / len(output_claims)
  RETURN grounding_ratio

compute_provenance_score(context) → float:
  score = 1.0
  
  # Retry penalty
  retry_penalty = MIN(context.retry_count × 0.05, 0.30)
  score -= retry_penalty
  
  # Timeout pressure penalty
  if context.timeout_seconds:
    fraction_used = context.actual_duration_seconds / context.timeout_seconds
    IF fraction_used > 0.90:
      score -= 0.15  # Very tight on time → lower quality likely
    ELIF fraction_used > 0.75:
      score -= 0.05
  
  # Injection detection
  IF context.injection_detection_result and context.injection_detection_result.injection_detected:
    score -= 0.40
  
  RETURN MAX(0.0, score)
```

---

## Confidence Tier Classification

```yaml
ConfidenceTier:
  VERY_HIGH:
    range: [0.90, 1.00]
    label: "VERY_HIGH"
    description: "Output is highly reliable; can be used without human review"
    downstream_action: "PROCEED_AUTOMATICALLY"
  
  HIGH:
    range: [0.75, 0.90)
    label: "HIGH"
    description: "Output is reliable; standard gate checks apply"
    downstream_action: "STANDARD_GATE_CHECK"
  
  MEDIUM:
    range: [0.55, 0.75)
    label: "MEDIUM"
    description: "Output has notable uncertainty; enhanced review recommended"
    downstream_action: "ENHANCED_REVIEW"
  
  LOW:
    range: [0.35, 0.55)
    label: "LOW"
    description: "Output is unreliable; human review required before use"
    downstream_action: "REQUIRE_HUMAN_REVIEW"
  
  VERY_LOW:
    range: [0.00, 0.35)
    label: "VERY_LOW"
    description: "Output should not be used; consider re-running or escalating"
    downstream_action: "REJECT_OR_ESCALATE"
```

---

## Confidence Score Schema

```yaml
ConfidenceScore:
  score_id: string
  composite_score: float               # 0.0 - 1.0
  confidence_tier: string
  
  dimension_scores:
    MODEL_CONFIDENCE: float
    SEMANTIC_COHERENCE: float
    FACTUAL_GROUNDING: float
    VALIDATION_RESULT: float
    EXECUTION_PROVENANCE: float
    AGENT_HISTORICAL_ACCURACY: float
  
  disqualifiers: [Disqualifier] | []
  
  context:
    agent_id: string
    run_id: string
    node_id: string
    task_type: string
    
  scored_at: datetime
  score_hash: string                   # SHA-256 for integrity
```

---

## Integration

**Called by:**
- `workflow-engine/dag-engine.md` — scores every node output before committing to result store
- `trust-boundaries/trust-boundary-registry.md` — evaluates scores against boundary thresholds
- `runtime-isolation/workflow-validator.md` — incorporates confidence into validation decision

**Calls:**
- `semantic-gateway/execution-validator.md` — reads validation results
- `semantic-gateway/prompt-injection-detector.md` — reads injection detection results
- `audit-replay/immutable-audit-log.md` — records all confidence scores

**Writes to:** `memory/trust-boundaries/confidence-scores.jsonl`
