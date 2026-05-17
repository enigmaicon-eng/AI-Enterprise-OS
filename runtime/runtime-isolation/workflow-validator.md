# Workflow Validator (Runtime)

**System ID:** `workflow-validator-runtime`
**Role:** Validates workflow execution correctness at runtime — distinct from the DAG structural validator, this system validates that workflow execution is proceeding correctly against security, constitutional, and semantic constraints; detects execution anomalies, validates result chains, and produces a running validity assessment of the live workflow
**Storage:** `memory/runtime-isolation/workflow-validity-log.jsonl`

---

## Purpose

The DAG validator checks structure before execution. The runtime workflow validator checks behavior during execution. A structurally valid workflow can execute incorrectly: an agent can produce outputs inconsistent with its inputs, a confidence chain can degrade from HIGH to VERY_LOW across nodes without detection, a sequence of individually-valid nodes can produce a collectively invalid result, or an execution path can deviate from the intended operational flow. The runtime validator provides continuous validity monitoring throughout workflow execution.

---

## Validation Dimensions

```yaml
RuntimeValidationDimension:
  
  RESULT_CHAIN_INTEGRITY:
    description: "Results flowing from node to node maintain logical consistency"
    check: "Each node's output is semantically compatible with downstream inputs"
    signals:
      - confidence_score_trend: "Is confidence degrading across the chain?"
      - semantic_compatibility: "Are outputs compatible with declared input schemas?"
      - fact_consistency: "Facts established in earlier nodes not contradicted in later ones"
  
  EXECUTION_PATH_COMPLIANCE:
    description: "Actual execution path matches declared workflow intent"
    check: "Nodes execute in declared order; no skipped required steps"
    signals:
      - node_skip_justification: "Skipped nodes have valid conditional skip reasons"
      - required_node_completion: "All nodes marked required actually executed"
      - parallel_branch_integrity: "Parallel branches don't share state improperly"
  
  SECURITY_POSTURE_MAINTENANCE:
    description: "Security controls remain active throughout execution"
    check: "No security bypass detected; all verdicts consistent"
    signals:
      - firewall_decision_consistency: "No node received BLOCK then later PASS for same content"
      - permission_grant_coverage: "All node executions had valid permission grants"
      - constitutional_clean_run: "No constitutional violations in any node"
  
  CONFIDENCE_FLOOR_MAINTENANCE:
    description: "Workflow confidence doesn't fall below operational threshold"
    check: "Aggregate confidence trend across nodes stays above configured floor"
    signals:
      - running_confidence_average: "Rolling average of node confidence scores"
      - confidence_collapse_detection: "Sudden multi-node confidence drop"
      - low_confidence_node_density: "% of completed nodes with LOW or VERY_LOW confidence"
  
  ANOMALY_DETECTION:
    description: "Unusual execution patterns that may indicate compromise or malfunction"
    signals:
      - unexpected_retry_burst: "Node retrying far more than historical baseline"
      - tool_call_pattern_deviation: "Agent using tools in patterns different from baseline"
      - timing_anomaly: "Node taking 10× longer or faster than historical baseline"
      - output_structure_deviation: "Output structure significantly different from baseline"
```

---

## Continuous Validity Assessment

```
assess_workflow_validity(run_id) → WorkflowValidityAssessment:
  
  # Load current runtime graph state
  graph = dag_runtime.get_execution_status(run_id)
  trace = execution_tracer.get_trace(run_id)
  
  assessment = WorkflowValidityAssessment(
    run_id = run_id,
    assessed_at = now()
  )
  
  # 1. Result chain integrity
  chain_result = assess_result_chain_integrity(run_id, graph, trace)
  assessment.dimensions["RESULT_CHAIN_INTEGRITY"] = chain_result
  
  # 2. Execution path compliance
  path_result = assess_execution_path_compliance(run_id, graph)
  assessment.dimensions["EXECUTION_PATH_COMPLIANCE"] = path_result
  
  # 3. Security posture maintenance
  security_result = assess_security_posture(run_id, graph)
  assessment.dimensions["SECURITY_POSTURE_MAINTENANCE"] = security_result
  
  # 4. Confidence floor maintenance
  confidence_result = assess_confidence_floor(run_id, trace)
  assessment.dimensions["CONFIDENCE_FLOOR_MAINTENANCE"] = confidence_result
  
  # 5. Anomaly detection
  anomaly_result = detect_execution_anomalies(run_id, graph, trace)
  assessment.dimensions["ANOMALY_DETECTION"] = anomaly_result
  
  # Aggregate validity score
  dimension_scores = [d.score for d in assessment.dimensions.values()]
  assessment.composite_validity_score = MEAN(dimension_scores)
  
  # Classify validity state
  critical_failures = [d for d in assessment.dimensions.values() if d.severity == "CRITICAL"]
  
  IF critical_failures:
    assessment.validity_state = "INVALID"
    assessment.recommended_action = "SUSPEND_AND_ESCALATE"
  ELIF assessment.composite_validity_score < 0.60:
    assessment.validity_state = "DEGRADED"
    assessment.recommended_action = "FLAG_FOR_REVIEW"
  ELSE:
    assessment.validity_state = "VALID"
    assessment.recommended_action = "CONTINUE"
  
  persist_assessment(assessment)
  RETURN assessment

assess_result_chain_integrity(run_id, graph, trace):
  
  issues = []
  
  # Check confidence trend across completed nodes (topological order)
  completed_nodes_in_order = get_completed_nodes_in_topological_order(run_id, graph)
  confidence_scores = [get_node_confidence_score(run_id, n) for n in completed_nodes_in_order]
  
  # Detect confidence collapse: 3+ consecutive nodes with declining confidence
  for i in range(2, len(confidence_scores)):
    if confidence_scores[i] < confidence_scores[i-1] < confidence_scores[i-2]:
      if confidence_scores[i] < 0.50:
        issues.append(ValidationIssue(
          issue_type = "CONFIDENCE_CHAIN_COLLAPSE",
          severity = "HIGH",
          message = f"Confidence declining across 3 consecutive nodes: {[round(c,2) for c in confidence_scores[i-2:i+1]]}"
        ))
  
  # Check fact consistency across nodes
  established_facts = {}
  for node_id in completed_nodes_in_order:
    node_output = dag_runtime.get_result(run_id, node_id)
    node_facts = extract_factual_claims(extract_text(node_output))
    
    for fact in node_facts:
      for prev_fact_id, prev_fact in established_facts.items():
        if facts_contradict(fact, prev_fact):
          issues.append(ValidationIssue(
            issue_type = "CROSS_NODE_FACT_CONTRADICTION",
            severity = "HIGH",
            message = f"Node {node_id} output contradicts fact established by earlier node: '{fact.text[:100]}'"
          ))
    
    for fact in node_facts:
      established_facts[generate_fact_id(fact)] = fact
  
  score = 1.0 - (len(issues) × 0.15)
  RETURN DimensionResult(score=MAX(0.0, score), issues=issues, severity=max_severity(issues))

detect_execution_anomalies(run_id, graph, trace):
  
  issues = []
  definition_id = graph.definition_id
  
  # Load baseline from historical runs of same definition
  baseline = load_execution_baseline(definition_id)
  
  IF NOT baseline:
    RETURN DimensionResult(score=0.80, issues=[], note="No baseline available — anomaly detection skipped")
  
  # Timing anomaly detection
  for node_id, node in graph.nodes.items():
    if node.state == "SUCCEEDED" and node.completed_at and node.started_at:
      actual_duration = (node.completed_at - node.started_at).total_seconds()
      baseline_median = baseline.node_duration_median.get(node_id)
      
      if baseline_median:
        deviation_factor = actual_duration / baseline_median
        if deviation_factor > 10:  # 10× baseline
          issues.append(ValidationIssue(
            issue_type = "TIMING_ANOMALY",
            severity = "WARNING",
            message = f"Node {node_id} took {actual_duration:.1f}s vs baseline {baseline_median:.1f}s ({deviation_factor:.1f}×)"
          ))
  
  # Retry burst anomaly
  for node_id, node in graph.nodes.items():
    if node.attempts > baseline.node_median_retries.get(node_id, 0) × 3:
      issues.append(ValidationIssue(
        issue_type = "UNEXPECTED_RETRY_BURST",
        severity = "WARNING",
        message = f"Node {node_id}: {node.attempts} attempts vs baseline median {baseline.node_median_retries.get(node_id, 0)}"
      ))
  
  score = 1.0 - (len([i for i in issues if i.severity == "WARNING"]) × 0.05)
  RETURN DimensionResult(score=MAX(0.0, score), issues=issues)
```

---

## Validity Assessment Schema

```yaml
WorkflowValidityAssessment:
  assessment_id: string
  run_id: string
  assessed_at: datetime
  
  validity_state: "VALID | DEGRADED | INVALID"
  composite_validity_score: float      # 0.0 - 1.0
  recommended_action: "CONTINUE | FLAG_FOR_REVIEW | SUSPEND_AND_ESCALATE"
  
  dimensions:
    [dimension_name]:
      score: float
      severity: "INFO | WARNING | HIGH | CRITICAL"
      issues: [ValidationIssue]
  
  assessment_hash: string
```

---

## Integration

**Called by:**
- `execution-observability/orchestration-monitor.md` — runs validity assessment as part of monitor refresh
- `workflow-engine/dag-engine.md` — triggered after each node completion for continuous monitoring

**Calls:**
- `orchestration-dags/dag-runtime.md` — reads current execution state
- `execution-observability/execution-tracer.md` — reads trace for timing and span data
- `trust-boundaries/workflow-confidence-scorer.md` — reads node confidence scores
- `runtime-clusters/runtime-signals.md` — sends SUSPEND signal if validity state == INVALID
- `audit-replay/immutable-audit-log.md` — records all validity assessments

**Writes to:** `memory/runtime-isolation/workflow-validity-log.jsonl`
