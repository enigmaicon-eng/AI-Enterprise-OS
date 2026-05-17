# Hallucination Containment

**System ID:** `hallucination-containment`
**Role:** Detects, scores, and contains AI hallucinations before they propagate through the workflow — distinguishes hallucinations from legitimate claims, applies graduated containment based on severity, quarantines contaminated outputs, and provides the detection signal used by the confidence scorer and workflow validator
**Storage:** `memory/runtime-isolation/hallucination-log.jsonl`

---

## Purpose

A hallucination that goes undetected in node 3 becomes the input for nodes 4, 5, and 6. By the time a human reviewer sees the final output, the hallucinated fact has been cited three times, appears in three artifacts, and has influenced three downstream decisions. Hallucination containment applies at the point of production — before the output leaves the node — catching fabricated facts, invented citations, false confident claims, and synthetic data before they propagate.

---

## Hallucination Taxonomy

```yaml
HallucinationType:
  
  FACTUAL_FABRICATION:
    description: "Stating false facts with unwarranted confidence"
    examples:
      - "The sprint velocity was 47 points" (when no sprint data was provided)
      - "Agent X approved this on Monday" (no such approval record exists)
    detection: cross_reference_with_input_and_context
    severity_base: HIGH
  
  CITATION_FABRICATION:
    description: "Inventing sources, references, or evidence that don't exist"
    examples:
      - "According to the Q3 report..." (no Q3 report in context)
      - "The architecture decision ADR-047 states..." (ADR-047 doesn't exist)
    detection: verify_cited_sources_exist
    severity_base: HIGH
  
  ENTITY_CONFABULATION:
    description: "Inventing people, systems, or objects that don't exist in context"
    examples:
      - "The DevOps lead Sarah confirmed..." (no such person in context)
      - "The system called FastRouter handles..." (FastRouter doesn't exist)
    detection: entity_verification_against_context
    severity_base: MEDIUM
  
  METRIC_FABRICATION:
    description: "Inventing specific numbers, percentages, or measurements"
    examples:
      - "The error rate is 2.3%" (no error rate data provided)
      - "This typically takes 4.7 days" (no timing data in context)
    detection: verify_numeric_claims_against_input_data
    severity_base: HIGH
  
  TEMPORAL_CONFABULATION:
    description: "Fabricating dates, sequences, or timelines"
    examples:
      - "This was decided last Tuesday" (no such decision recorded)
      - "After the March release..." (no March release in context)
    detection: verify_temporal_claims_against_event_log
    severity_base: MEDIUM
  
  CAPABILITY_CONFABULATION:
    description: "Incorrectly asserting capabilities, permissions, or system properties"
    examples:
      - "I can access the database directly" (capability not in manifest)
      - "The approval was automatically granted" (no such automation)
    detection: verify_capability_claims_against_manifest
    severity_base: HIGH
```

---

## Detection Pipeline

```
detect_hallucinations(output, detection_context) → HallucinationAssessment:
  
  text = extract_text(output)
  input_data = detection_context.input_data
  workflow_context = detection_context.workflow_context  # All established facts
  
  detections = []
  
  # Extract all factual claims from output
  factual_claims = extract_factual_claims(text)
  
  FOR each claim in factual_claims:
    
    # Step 1: Check if claim references something not in input/context
    supported = is_claim_supported(claim, input_data, workflow_context)
    
    IF NOT supported.supported:
      
      # Step 2: Classify hallucination type
      h_type = classify_hallucination_type(claim, supported)
      
      # Step 3: Estimate severity
      severity = estimate_severity(claim, h_type, detection_context)
      
      detections.append(HallucinationDetection(
        claim = claim,
        hallucination_type = h_type,
        severity = severity,
        evidence = supported.gap_description,
        confidence_in_detection = supported.confidence
      ))
  
  # Citation verification pass
  cited_sources = extract_citations(text)
  FOR each citation in cited_sources:
    IF NOT verify_source_exists(citation, workflow_context):
      detections.append(HallucinationDetection(
        claim = f"Citation: {citation}",
        hallucination_type = "CITATION_FABRICATION",
        severity = "HIGH",
        evidence = f"Source '{citation}' not found in workflow context"
      ))
  
  # Metric fabrication pass
  numeric_claims = extract_numeric_claims(text)
  FOR each numeric_claim in numeric_claims:
    IF NOT has_numeric_basis(numeric_claim, input_data):
      detections.append(HallucinationDetection(
        claim = numeric_claim.text,
        hallucination_type = "METRIC_FABRICATION",
        severity = "HIGH",
        evidence = f"Numeric value '{numeric_claim.value}' has no basis in provided data"
      ))
  
  # Capability claim verification
  capability_claims = extract_capability_claims(text, detection_context.agent_id)
  FOR each cap_claim in capability_claims:
    manifest = capability_scope_controller.load_manifest(detection_context.agent_id)
    IF NOT manifest_supports_claim(cap_claim, manifest):
      detections.append(HallucinationDetection(
        claim = cap_claim,
        hallucination_type = "CAPABILITY_CONFABULATION",
        severity = "HIGH",
        evidence = "Claimed capability not in agent's manifest"
      ))
  
  # Compute overall hallucination score
  IF NOT detections:
    hallucination_score = 0.0
    contamination_level = "CLEAN"
  ELSE:
    # Score based on count, severity, and specificity of claims
    high_sev_count = len([d for d in detections if d.severity == "HIGH"])
    medium_sev_count = len([d for d in detections if d.severity == "MEDIUM"])
    total_claims = max(len(factual_claims), 1)
    
    hallucination_score = MIN(1.0,
      (high_sev_count × 0.20 + medium_sev_count × 0.08) / total_claims × 5
    )
    contamination_level = classify_contamination_level(hallucination_score)
  
  assessment = HallucinationAssessment(
    hallucination_score = hallucination_score,
    contamination_level = contamination_level,
    detections = detections,
    total_claims_evaluated = len(factual_claims),
    recommended_action = compute_containment_action(contamination_level)
  )
  
  log_assessment(assessment, detection_context)
  RETURN assessment
```

---

## Claim Support Verification

```
is_claim_supported(claim, input_data, workflow_context) → SupportAssessment:
  
  claim_text = claim.text
  claim_type = claim.type  # "factual | numeric | entity | temporal | citation"
  
  # Try to find textual evidence in inputs
  input_text = extract_all_text(input_data)
  context_text = extract_all_text(workflow_context)
  
  # Semantic similarity search — is this claim's content present in inputs?
  input_similarity = semantic_similarity(claim_text, input_text)
  context_similarity = semantic_similarity(claim_text, context_text)
  
  best_match_score = MAX(input_similarity, context_similarity)
  
  # Entity check: are the entities in the claim present in inputs?
  claim_entities = extract_entities(claim_text)
  available_entities = extract_entities(input_text + " " + context_text)
  entity_coverage = len(claim_entities & available_entities) / max(len(claim_entities), 1)
  
  # Numeric check: are the specific numbers traceable?
  IF claim_type == "numeric":
    claim_numbers = extract_numbers(claim_text)
    input_numbers = extract_numbers(input_text + context_text)
    numeric_coverage = len(set(claim_numbers) & set(input_numbers)) / max(len(claim_numbers), 1)
  ELSE:
    numeric_coverage = 1.0  # Not applicable
  
  # Combined support score
  support_score = (
    best_match_score × 0.40 +
    entity_coverage × 0.35 +
    numeric_coverage × 0.25
  )
  
  supported = support_score >= 0.60  # 60% support threshold
  
  RETURN SupportAssessment(
    supported = supported,
    support_score = support_score,
    confidence = MIN(0.95, support_score + 0.20),
    gap_description = f"Support score {support_score:.2f}; entities found: {entity_coverage:.0%}; text match: {best_match_score:.2f}"
  )
```

---

## Containment Actions

```yaml
ContaminationLevel:
  
  CLEAN:
    hallucination_score: [0.0, 0.10)
    action: PASS
    description: "No significant hallucinations detected"
  
  LOW:
    hallucination_score: [0.10, 0.25)
    action: WARN_AND_ANNOTATE
    description: "Minor hallucinations; annotate output with uncertainty flags"
    annotation: "Some claims may not be fully grounded in provided data"
  
  MODERATE:
    hallucination_score: [0.25, 0.50)
    action: QUARANTINE_PENDING_REVIEW
    description: "Significant hallucinations; output quarantined until reviewed"
    required_review: PEER_REVIEW
  
  HIGH:
    hallucination_score: [0.50, 0.75)
    action: BLOCK_AND_FLAG
    description: "High hallucination density; output blocked; node re-run recommended"
    required_review: HUMAN_REVIEW
  
  CRITICAL:
    hallucination_score: [0.75, 1.00]
    action: BLOCK_AND_ALERT
    description: "Critical hallucination contamination; escalate immediately"
    required_review: IMMEDIATE_HUMAN_ESCALATION

apply_containment(assessment, output) → ContainedOutput:
  
  MATCH assessment.recommended_action:
    
    CASE "PASS":
      RETURN ContainedOutput(output=output, containment_applied=False)
    
    CASE "WARN_AND_ANNOTATE":
      annotated = annotate_uncertain_claims(output, assessment.detections)
      RETURN ContainedOutput(
        output = annotated,
        containment_applied = True,
        annotation_added = True,
        uncertainty_note = "Some claims flagged for uncertainty — review noted detections"
      )
    
    CASE "QUARANTINE_PENDING_REVIEW":
      quarantine_id = quarantine_output(output, assessment)
      RETURN ContainedOutput(
        output = None,
        containment_applied = True,
        quarantined = True,
        quarantine_id = quarantine_id,
        release_condition = "PEER_REVIEW_APPROVED"
      )
    
    CASE "BLOCK_AND_FLAG" | "BLOCK_AND_ALERT":
      emit_hallucination_alert(assessment, severity="HIGH" if action == "BLOCK_AND_FLAG" else "CRITICAL")
      RETURN ContainedOutput(
        output = None,
        containment_applied = True,
        blocked = True,
        reason = f"Hallucination contamination level: {assessment.contamination_level}"
      )
```

---

## Integration

**Called by:**
- `semantic-gateway/execution-validator.md` — runs hallucination check as part of post-execution validation
- `trust-boundaries/workflow-confidence-scorer.md` — uses hallucination score for factual grounding dimension

**Calls:**
- `execution-security/capability-scope-controller.md` — verifies capability claims
- `audit-replay/immutable-audit-log.md` — records all hallucination assessments

**Writes to:** `memory/runtime-isolation/hallucination-log.jsonl`
