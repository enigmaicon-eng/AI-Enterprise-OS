# Runtime Decision Engine

## Purpose
Evaluates decision models at workflow execution time. This is the hot-path engine that Business Rule Tasks call — it must be fast, deterministic, and auditable. Every evaluation is logged with the full input snapshot and result, enabling replay and forensics.

---

## Engine Architecture

```
[BPMN Business Rule Task]
    ↓ evaluate(model_id, inputs, context)
[Runtime Decision Engine]
    ├── [Model Cache] ← loads from decision-model-standard.md catalog
    ├── [Input Validator] — validates against model input schema
    ├── [CEL Evaluator] — evaluates conditions and expressions
    ├── [Result Validator] — validates output against output schema
    ├── [Audit Logger] → process-governance/workflow-auditability-system.md
    └── [Telemetry] → enterprise-telemetry/
```

---

## Evaluation API

```
evaluate(
  model_id: string,
  inputs: object,
  context: ExecutionContext,
  options: {
    bypass_cache: boolean = false,
    strict_validation: boolean = true,
    audit_level: NONE | STANDARD | ENHANCED = inherited from model
  }
) → DecisionResult
```

```yaml
DecisionResult:
  evaluation_id: uuid
  model_id: string
  model_version: string
  
  inputs_received: {}         # what was passed in
  inputs_validated: {}        # after validation + defaults applied
  
  outputs: {}                 # the decision outputs
  
  evaluation_metadata:
    evaluated_at: ISO-8601
    evaluation_ms: integer    # performance tracking
    cache_hit: boolean
    rules_evaluated: integer   # for TABLE type
    path_taken: string         # for TREE type
    criteria_scores: {}        # for SCORING type
  
  confidence: 0.0–1.0         # model's confidence in the result
  flags: [string]             # any warning flags from hard rules
  
  audit_record_id: string     # reference to audit log entry
```

---

## Evaluation Algorithms

### TABLE Evaluation

```
evaluate_table(model, inputs):
  matched_rules = []
  
  for rule in model.definition.rules ordered by priority:
    matches = true
    for field, condition in rule.conditions:
      if not eval_condition(inputs[field], condition):
        matches = false
        break
    if matches:
      matched_rules.append(rule)
  
  # Apply hit policy
  match model.hit_policy:
    case UNIQUE:
      assert len(matched_rules) <= 1
      return matched_rules[0].outputs if matched_rules else default_outputs
    
    case FIRST:
      return matched_rules[0].outputs if matched_rules else default_outputs
    
    case COLLECT:
      return [r.outputs for r in matched_rules]
    
    case SUM:
      return sum_outputs(matched_rules)   # numeric outputs only
    
    case MIN:
      return min_outputs(matched_rules)
    
    case MAX:
      return max_outputs(matched_rules)
    
    case RULE_ORDER:
      return [r.outputs for r in matched_rules sorted by rule priority]
```

### TREE Evaluation

```
evaluate_tree(model, inputs):
  node = model.definition.root
  path = []
  
  while not node.is_leaf:
    condition_result = eval_cel(node.condition, inputs)
    path.append({node: node.id, condition: node.condition, result: condition_result})
    
    if condition_result:
      node = node.true_branch
    else:
      node = node.false_branch
  
  return {outputs: node.return, path_taken: path}
```

### SCORING Evaluation

```
evaluate_scoring(model, inputs):
  score = model.definition.base_score
  criterion_scores = {}
  flags = []
  
  for criterion in model.definition.criteria:
    raw_value = eval_cel(criterion.formula, inputs)
    contribution = raw_value * criterion.weight
    score += contribution
    criterion_scores[criterion.name] = {raw: raw_value, weighted: contribution}
  
  score = clamp(score, 0.0, 1.0)
  
  # Apply hard rules
  for hard_rule in model.definition.hard_rules:
    if eval_cel(hard_rule.condition, inputs):
      if hard_rule.action starts with "cap_score_at":
        cap = extract_cap_value(hard_rule.action)
        score = min(score, cap)
      flags.append(hard_rule.flag)
  
  # Map score to tier/category
  outputs = {score: score}
  for mapping in model.definition.score_to_tier:
    if eval_range_condition(score, mapping.condition):
      outputs.tier = mapping.value
      break
  
  return {outputs: outputs, criterion_scores: criterion_scores, flags: flags}
```

---

## Model Cache

```yaml
cache:
  strategy: in_memory_lru
  max_entries: 200
  ttl_ms: 300000        # 5 minutes
  
  invalidation_triggers:
    - model status changes (DRAFT/ACTIVE/DEPRECATED)
    - model version bumped
    - explicit flush via admin API
  
  bypass_conditions:
    - options.bypass_cache == true
    - model.governance.audit_level == ENHANCED   # always fresh eval
    - model contains temporal inputs (e.g., current time)
  
  cache_key: "{model_id}:{model_version}:{sha256(canonical_json(inputs))}"
```

---

## Performance Targets

| Decision Type | p50 | p99 | Timeout |
|---|---|---|---|
| TABLE (< 50 rules) | < 2ms | < 10ms | 100ms |
| TABLE (50–500 rules) | < 10ms | < 50ms | 500ms |
| TREE (depth ≤ 10) | < 1ms | < 5ms | 50ms |
| SCORING (< 20 criteria) | < 2ms | < 10ms | 100ms |
| ENSEMBLE | < 20ms | < 100ms | 1000ms |
| Cache hit (any type) | < 0.5ms | < 2ms | 10ms |

Evaluations exceeding p99 targets emit `decision_engine.slow_evaluation` metric.

---

## Input Validation

```
validate_inputs(model, raw_inputs):
  validated = {}
  errors = []
  
  for field, spec in model.inputs:
    value = raw_inputs.get(field)
    
    if value is None:
      if spec.required:
        errors.append(f"Required field '{field}' missing")
      elif spec.default:
        validated[field] = spec.default
      continue
    
    if not type_check(value, spec.type):
      errors.append(f"Field '{field}' expected {spec.type}, got {type(value)}")
      continue
    
    if spec.validation:
      if not eval_cel(spec.validation, {field: value}):
        errors.append(f"Field '{field}' failed validation: {spec.validation}")
        continue
    
    validated[field] = value
  
  if errors:
    raise DecisionInputValidationError(errors)
  
  return validated
```

---

## Ensemble Evaluation

For ENSEMBLE models (multiple sub-models combined):

```yaml
ensemble_definition:
  strategy: WEIGHTED_VOTE | FIRST_ABOVE_THRESHOLD | VETO
  members:
    - model_id: DM-HEALTH-001
      weight: 0.40
    - model_id: DM-HEALTH-002
      weight: 0.60
  
  output_aggregation:
    numeric: weighted_average
    categorical: weighted_majority_vote
    boolean: all_agree | any_agree

# VETO strategy: any member can block regardless of others
veto_threshold: 0.20   # if any member outputs score < 0.20, overall is REJECTED
```

---

## Audit Record Schema

```yaml
decision_audit_record:
  audit_id: uuid
  evaluation_id: uuid
  model_id: string
  model_version: string
  
  caller:
    workflow_instance_id: string
    node_id: string
    agent_id: string
  
  inputs_hash: "sha256:..."   # hash of inputs for replay
  inputs: {}                  # full inputs for ENHANCED audit level
  outputs: {}
  metadata: {}                # evaluation metadata
  
  recorded_at: ISO-8601
  tamper_proof_hash: "sha256 of entire record"   # signed by engine
```
