# Governance Replay Engine

**System ID:** `governance-replay-engine`
**Role:** Replays governance decisions from the immutable audit log to verify their correctness against current policy, detect policy drift, reconstruct decision rationale for forensic investigation, and enable governance auditors to independently verify that decisions were made correctly without relying on agent memory or trust
**Storage:** `memory/audit-replay/replay-state.yaml`

---

## Purpose

A governance decision made six months ago — a gate verdict, an approval, a constitutional evaluation — may need to be re-evaluated: Was it correct at the time? Was the policy in effect applied correctly? Did the evidence actually support the outcome? The governance replay engine reconstructs the decision context from the audit trail and re-runs the same evaluation logic against the same evidence, producing an independent second opinion that doesn't rely on the original evaluator's memory, doesn't trust the original actor, and detects any gap between what was decided and what should have been decided.

---

## Replay Protocol

```
replay_governance_decision(audit_record_id, replay_options) → ReplayResult:
  
  # Step 1: Load the original audit record
  original_record = immutable_audit_log.get_record(audit_record_id)
  IF NOT original_record:
    RAISE AuditRecordNotFound(audit_record_id)
  
  IF original_record.event_category not in ["GOVERNANCE", "CONSTITUTIONAL", "SECURITY", "TRUST"]:
    RAISE NotAGovernanceDecision(audit_record_id)
  
  # Step 2: Verify chain integrity up to this record
  chain_valid = immutable_audit_log.verify_chain(end_sequence=original_record.sequence_number)
  IF NOT chain_valid.verified:
    RETURN ReplayResult(
      replay_possible = False,
      reason = "Audit chain is compromised up to this record — replay cannot be trusted"
    )
  
  # Step 3: Reconstruct the decision context at the time of the original decision
  decision_context = reconstruct_decision_context(original_record, replay_options)
  
  # Step 4: Determine which evaluation system was responsible
  evaluator = identify_evaluator_system(original_record.event_type)
  
  # Step 5: Re-run the evaluation with reconstructed context
  replay_verdict = re_evaluate(evaluator, decision_context, original_record)
  
  # Step 6: Compare original decision to replay verdict
  comparison = compare_decision_to_replay(original_record, replay_verdict)
  
  # Step 7: Build replay result
  result = ReplayResult(
    replay_id = generate_uuid(),
    original_record_id = audit_record_id,
    original_decision = {
      outcome: original_record.outcome,
      outcome_reason: original_record.outcome_reason,
      decided_at: original_record.recorded_at,
      actor_id: original_record.actor.actor_id
    },
    replay_verdict = replay_verdict,
    comparison = comparison,
    replayed_at = now()
  )
  
  log_replay(result)
  RETURN result

reconstruct_decision_context(record, options) → DecisionContext:
  
  run_id = record.subject.run_id
  recorded_at = record.recorded_at
  
  # Reconstruct what was known at decision time
  context = DecisionContext(
    decision_timestamp = recorded_at,
    run_id = run_id
  )
  
  # Load the workflow state as it existed at decision time
  IF run_id:
    context.workflow_state = load_workflow_state_at_time(run_id, recorded_at)
    context.node_output = load_node_output_at_time(run_id, record.subject.node_id, recorded_at)
  
  # Load policy configuration as it existed at decision time
  context.policy_version = get_policy_version_at_time(recorded_at)
  context.capability_manifest = get_capability_manifest_at_time(record.actor.actor_id, recorded_at)
  context.constitutional_principles = get_constitution_at_time(recorded_at)
  
  # If evidence was hashed in the record, try to recover the original evidence
  IF record.evidence_hash:
    original_evidence = evidence_store.get_by_hash(record.evidence_hash)
    IF original_evidence:
      context.original_evidence = original_evidence
    ELSE:
      context.evidence_missing = True
      # Can still replay policy logic even without original evidence
  
  RETURN context

identify_evaluator_system(event_type) → str:
  
  EVALUATOR_MAP = {
    "GATE_VERDICT_ISSUED":             "gate-check-system",
    "FIREWALL_DECISION":               "semantic-firewall",
    "INJECTION_DETECTED":              "prompt-injection-detector",
    "CONSTITUTIONAL_MANDATORY_VIOLATION": "constitutional-ai-governor",
    "CONSTITUTIONAL_ABSOLUTE_VIOLATION":  "constitutional-ai-governor",
    "BOUNDARY_CROSSING_ALLOWED":       "trust-boundary-registry",
    "BOUNDARY_CROSSING_DENIED":        "trust-boundary-registry",
    "PERMISSION_CHECK_DENIED":         "least-privilege-engine",
    "SCOPE_VIOLATION":                 "capability-scope-controller"
  }
  
  RETURN EVALUATOR_MAP.get(event_type, "unknown-evaluator")

re_evaluate(evaluator_id, context, original_record) → ReplayVerdict:
  
  MATCH evaluator_id:
    
    CASE "constitutional-ai-governor":
      # Re-run constitutional evaluation against original subject
      verdict = constitutional_ai_governor.evaluate_constitutional_compliance(
        context.node_output or context.original_evidence,
        evaluation_context = {
          agent_id: original_record.actor.actor_id,
          policy_version: context.policy_version
        }
      )
      RETURN ReplayVerdict(
        verdict = verdict.verdict,
        action = verdict.action,
        violations = verdict.violations
      )
    
    CASE "trust-boundary-registry":
      boundary_decision = trust_boundary_registry.evaluate_boundary_crossing({
        source_agent_id: original_record.actor.actor_id,
        target_agent_id: original_record.subject.subject_id,
        direction: "A_TO_B",
        payload_classification: context.workflow_state.classification
      })
      RETURN ReplayVerdict(
        verdict = "ALLOWED" if boundary_decision.allowed else "DENIED",
        violations = boundary_decision.violations
      )
    
    CASE "semantic-firewall":
      IF context.original_evidence:
        firewall_decision = semantic_firewall.inspect(context.original_evidence, {
          agent_id: original_record.actor.actor_id,
          run_id: context.run_id
        })
        RETURN ReplayVerdict(verdict=firewall_decision.decision, violations=firewall_decision.violations)
      ELSE:
        RETURN ReplayVerdict(verdict="CANNOT_REPLAY", reason="Original evidence not recoverable")
```

---

## Decision Comparison

```
compare_decision_to_replay(original_record, replay_verdict) → DecisionComparison:
  
  original_outcome = original_record.outcome
  replay_outcome = replay_verdict.verdict
  
  # Normalize outcomes for comparison
  original_normalized = normalize_outcome(original_outcome)
  replay_normalized = normalize_outcome(replay_outcome)
  
  IF original_normalized == replay_normalized:
    match_status = "CONSISTENT"
    severity = "INFO"
  ELSE:
    # Outcomes differ — determine severity
    IF original_normalized == "ALLOWED" AND replay_normalized == "DENIED":
      # Original allowed something that should have been denied — potentially serious
      match_status = "ORIGINAL_PERMISSIVE_ERROR"
      severity = "HIGH"
    ELIF original_normalized == "DENIED" AND replay_normalized == "ALLOWED":
      # Original was overly restrictive — less severe but still an error
      match_status = "ORIGINAL_RESTRICTIVE_ERROR"
      severity = "MEDIUM"
    ELSE:
      match_status = "OUTCOME_MISMATCH"
      severity = "HIGH"
  
  RETURN DecisionComparison(
    match_status = match_status,
    original_outcome = original_outcome,
    replay_outcome = replay_outcome,
    severity = severity,
    requires_investigation = (severity in ["HIGH", "CRITICAL"]),
    notes = generate_comparison_notes(original_record, replay_verdict, match_status)
  )
```

---

## Batch Replay for Compliance Audit

```
replay_for_compliance_window(start_time, end_time, event_categories=["GOVERNANCE", "CONSTITUTIONAL"]) → ComplianceAuditReport:
  
  records = immutable_audit_log.query_audit_log({
    start_time: start_time,
    end_time: end_time,
    event_category: event_categories
  })
  
  replay_results = []
  issues = []
  
  FOR record in records:
    TRY:
      result = replay_governance_decision(record.record_id, {})
      replay_results.append(result)
      
      IF result.comparison.requires_investigation:
        issues.append(ComplianceIssue(
          record_id = record.record_id,
          severity = result.comparison.severity,
          original_outcome = result.original_decision.outcome,
          replay_outcome = result.replay_verdict.verdict,
          match_status = result.comparison.match_status
        ))
    EXCEPT Exception as e:
      replay_results.append(ReplayResult(
        replay_possible = False,
        reason = str(e),
        original_record_id = record.record_id
      ))
  
  consistent_count = len([r for r in replay_results if r.comparison.match_status == "CONSISTENT"])
  replay_possible_count = len([r for r in replay_results if r.replay_possible])
  
  RETURN ComplianceAuditReport(
    report_id = generate_uuid(),
    audit_window = {start: start_time, end: end_time},
    total_decisions_audited = len(records),
    replay_possible = replay_possible_count,
    consistent_decisions = consistent_count,
    consistency_rate = consistent_count / max(replay_possible_count, 1),
    issues = issues,
    generated_at = now()
  )
```

---

## Replay Result Schema

```yaml
ReplayResult:
  replay_id: string
  original_record_id: string
  replay_possible: boolean
  
  original_decision:
    outcome: string
    outcome_reason: string
    decided_at: datetime
    actor_id: string
  
  replay_verdict:
    verdict: string
    violations: [object] | null
    reason: string | null
  
  comparison:
    match_status: "CONSISTENT | ORIGINAL_PERMISSIVE_ERROR | ORIGINAL_RESTRICTIVE_ERROR | OUTCOME_MISMATCH | CANNOT_REPLAY"
    original_outcome: string
    replay_outcome: string
    severity: string
    requires_investigation: boolean
  
  replayed_at: datetime
```

---

## Integration

**Called by:**
- Compliance auditors — on-demand and scheduled
- `governance-attestation/approval-chain-verifier.md` — verifies approval decisions are replayable
- `audit-replay/audit-query-engine.md` — provides replay capability for investigation queries

**Calls:**
- `audit-replay/immutable-audit-log.md` — loads original records and verifies chain
- `trust-boundaries/constitutional-ai-governor.md` — re-runs constitutional evaluations
- `trust-boundaries/trust-boundary-registry.md` — re-runs boundary decisions
- `semantic-gateway/semantic-firewall.md` — re-runs firewall decisions

**Reads from:** `memory/audit-replay/replay-state.yaml`
**Writes to:** `memory/audit-replay/replay-state.yaml`
