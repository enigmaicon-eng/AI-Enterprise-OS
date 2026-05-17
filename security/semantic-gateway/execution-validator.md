# Execution Validator

**System ID:** `execution-validator`
**Role:** Pre-execution and post-execution validation gate — validates that workflow node outputs are semantically correct, structurally conformant, factually consistent with input context, and policy-compliant before they are committed to the result store or propagated to downstream nodes
**Storage:** `memory/semantic-gateway/validation-log.jsonl`

---

## Purpose

A workflow node that produces a malformed output, a factually inconsistent conclusion, or a response that violates schema can corrupt every downstream node that depends on it. By the time the error surfaces — three nodes later, when a tool call fails on bad input — the causal trail is obscured. The execution validator is the gate between every node's output and the result store. Nothing is committed until it passes. Failures here are cheap; failures three nodes downstream are expensive.

---

## Validation Layers

```
LAYER 1: STRUCTURAL (always run — cheap)
  - Output conforms to declared output schema
  - Required fields are present and correctly typed
  - No forbidden fields present
  - Size within declared bounds

LAYER 2: SEMANTIC (run at commit — moderate cost)
  - Output is responsive to the input (addresses what was asked)
  - Output does not contradict established facts in workflow context
  - Claims are traceable to input data (no unexplained information)
  - Reasoning is internally consistent

LAYER 3: POLICY (run at commit — governance)
  - Output does not violate data classification policy
  - Output does not contain unauthorized recommendations
  - Output respects declared authority constraints
  - Output matches required format for downstream consumers

LAYER 4: CRYPTOGRAPHIC (for signed outputs)
  - Signing key is valid and unexpired
  - Signature verifies against declared signer identity
  - Timestamp is within acceptable clock skew
```

---

## Pre-Execution Validation

```
validate_pre_execution(node_id, run_id, resolved_input) → PreExecValidationResult:
  
  node_decl = workflow_registry.get_node_declaration(run_id, node_id)
  
  errors = []
  
  # Validate resolved input against node's input schema
  IF node_decl.input_schema:
    schema_errors = validate_jsonschema(resolved_input, node_decl.input_schema)
    errors.extend([ValidationError("INPUT_SCHEMA_VIOLATION", e) for e in schema_errors])
  
  # Validate that all required input fields are populated
  FOR required_field in node_decl.required_inputs:
    IF required_field NOT IN resolved_input OR resolved_input[required_field] is null:
      errors.append(ValidationError("MISSING_REQUIRED_INPUT", f"Required input '{required_field}' is missing or null"))
  
  # Validate input data classification
  input_classification = classify_data(resolved_input)
  IF data_classification_exceeds(input_classification, node_decl.max_input_classification):
    errors.append(ValidationError("INPUT_CLASSIFICATION_EXCEEDED",
      f"Input classification {input_classification} exceeds node maximum {node_decl.max_input_classification}"))
  
  # Validate executor is available
  worker_available = worker_orchestration.check_executor_availability(node_decl.executor_type)
  IF NOT worker_available:
    errors.append(ValidationError("EXECUTOR_UNAVAILABLE", f"Executor type '{node_decl.executor_type}' has no available workers"))
  
  RETURN PreExecValidationResult(
    valid = (len(errors) == 0),
    errors = errors,
    input_hash = sha256(json_serialize(resolved_input))
  )
```

---

## Post-Execution Validation

```
validate_post_execution(node_id, run_id, node_output, execution_context) → PostExecValidationResult:
  
  node_decl = workflow_registry.get_node_declaration(run_id, node_id)
  original_input = execution_context.input_snapshot
  
  errors = []
  warnings = []
  
  # LAYER 1: Structural validation
  IF node_decl.output_schema:
    schema_errors = validate_jsonschema(node_output, node_decl.output_schema)
    errors.extend([ValidationError("OUTPUT_SCHEMA_VIOLATION", e) for e in schema_errors])
  
  FOR required_field in node_decl.required_outputs:
    IF required_field NOT IN node_output:
      errors.append(ValidationError("MISSING_REQUIRED_OUTPUT", f"Required output '{required_field}' absent"))
  
  output_size = estimate_bytes(node_output)
  IF node_decl.max_output_size_bytes AND output_size > node_decl.max_output_size_bytes:
    errors.append(ValidationError("OUTPUT_SIZE_EXCEEDED",
      f"Output size {output_size} bytes exceeds limit {node_decl.max_output_size_bytes}"))
  
  # LAYER 2: Semantic validation
  IF node_decl.enable_semantic_validation:
    
    # Responsiveness check: does output address the task?
    responsiveness = check_semantic_responsiveness(node_output, original_input, node_decl.task_description)
    IF responsiveness.score < 0.60:
      errors.append(ValidationError("LOW_SEMANTIC_RESPONSIVENESS",
        f"Output score {responsiveness.score:.2f} — output does not appear to address the task"))
    ELIF responsiveness.score < 0.75:
      warnings.append(ValidationWarning("MARGINAL_SEMANTIC_RESPONSIVENESS",
        f"Output score {responsiveness.score:.2f} — output may only partially address the task"))
    
    # Factual consistency check: output should not contradict established context
    context_facts = execution_context.established_facts
    IF context_facts:
      contradictions = detect_factual_contradictions(node_output, context_facts)
      FOR contradiction in contradictions:
        errors.append(ValidationError("FACTUAL_CONTRADICTION",
          f"Output contradicts established fact: {contradiction.summary}"))
    
    # Provenance check: unexplained new facts
    new_facts = extract_new_factual_claims(node_output, original_input)
    unprovenienced = [f for f in new_facts IF NOT can_trace_to_input(f, original_input, context_facts)]
    IF len(unprovenienced) > MAX_UNPROVENANCED_CLAIMS:
      warnings.append(ValidationWarning("UNPROVENANCED_CLAIMS",
        f"{len(unprovenienced)} factual claims in output cannot be traced to input data"))
  
  # LAYER 3: Policy validation
  
  # Data classification of output
  output_classification = classify_data(node_output)
  IF data_classification_exceeds(output_classification, node_decl.max_output_classification):
    errors.append(ValidationError("OUTPUT_CLASSIFICATION_EXCEEDED",
      f"Output classification {output_classification} exceeds allowed maximum"))
  
  # Authority constraint check
  IF node_decl.authority_constraints:
    FOR constraint in node_decl.authority_constraints:
      IF violates_authority_constraint(node_output, constraint):
        errors.append(ValidationError("AUTHORITY_CONSTRAINT_VIOLATION",
          f"Output violates authority constraint: {constraint.description}"))
  
  # LAYER 4: Cryptographic validation (if output is signed)
  IF has_signature(node_output):
    sig_valid = verify_execution_signature(node_output)
    IF NOT sig_valid:
      errors.append(ValidationError("INVALID_SIGNATURE", "Output signature verification failed"))
  
  result = PostExecValidationResult(
    valid = (len(errors) == 0),
    errors = errors,
    warnings = warnings,
    output_hash = sha256(json_serialize(node_output)),
    validated_at = now()
  )
  
  log_validation(node_id, run_id, result)
  RETURN result
```

---

## Semantic Responsiveness Check

```
check_semantic_responsiveness(output, input, task_description) → ResponsivenessScore:
  
  # Key term overlap between task description and output
  task_terms = extract_key_terms(task_description)
  output_terms = extract_key_terms(output)
  input_terms = extract_key_terms(input)
  
  task_coverage = len(task_terms & output_terms) / max(len(task_terms), 1)
  
  # Check if output references input entities
  input_entities = extract_entities(input)
  output_entities = extract_entities(output)
  entity_coverage = len(input_entities & output_entities) / max(len(input_entities), 1)
  
  # Length reasonableness
  expected_min_tokens = task_description_complexity_estimate(task_description) × 50
  actual_tokens = estimate_tokens(output)
  length_score = MIN(actual_tokens / expected_min_tokens, 1.0)
  
  score = (task_coverage × 0.50) + (entity_coverage × 0.30) + (length_score × 0.20)
  
  RETURN ResponsivenessScore(
    score = score,
    task_coverage = task_coverage,
    entity_coverage = entity_coverage,
    length_score = length_score
  )
```

---

## Validation Result Schema

```yaml
PostExecValidationResult:
  valid: boolean
  validated_at: datetime
  
  node_id: string
  run_id: string
  
  output_hash: string                  # SHA-256 of output
  output_size_bytes: integer
  
  errors:
    - code: string
      message: string
      severity: "ERROR"
  
  warnings:
    - code: string
      message: string
      severity: "WARNING"
  
  semantic_scores:
    responsiveness: float | null
    factual_consistency: float | null
    provenance_coverage: float | null
  
  validation_hash: string              # SHA-256 of (output_hash + errors + validated_at)
```

---

## Integration

**Called by:**
- `workflow-engine/dag-engine.md` — called before node dispatch (pre) and after result arrives (post)
- `execution-runtime/durable-execution.md` — validates before committing to journal

**Calls:**
- `audit-replay/immutable-audit-log.md` — records all validation decisions
- `semantic-gateway/semantic-firewall.md` — delegates output data scan

**Writes to:** `memory/semantic-gateway/validation-log.jsonl`
