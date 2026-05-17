# Policy Replay Engine

## Purpose
Reconstructs the exact policy environment that existed at any point in the past and replays decisions to verify they were made correctly given the policies active at that time. Policy replay is essential for compliance audits (did we enforce the right policy?), incident investigations (would current policies have prevented this?), regulatory examination (were our decisions consistent with stated policies?), and policy change impact analysis (what decisions would have been different under the new policy?). The replay engine makes the policy audit trail falsifiable — past decisions can be independently verified.

---

## Replay Architecture

```
Replay Request
        ↓
[1. Policy State Reconstruction] → retrieve all policy versions active at target timestamp
        ↓
[2. Context Reconstruction]      → reconstruct evaluation context (actor state, system state, risk state)
        ↓
[3. Request Reconstruction]      → retrieve original evaluation_request from audit log
        ↓
[4. Replay Evaluation]           → evaluate reconstructed request against reconstructed policies
        ↓
[5. Result Comparison]           → compare replayed decision to original decision
        ↓
[6. Discrepancy Analysis]        → if different: why? was the original correct? what changed?
        ↓
[7. Replay Report]               → structured report with findings and verification status
        ↓
[8. Replay Record]               → immutable record of replay run stored in audit trail
```

---

## Replay Request Schema

```yaml
replay_request:
  replay_id: "REPLAY-{timestamp_ms}-{random_6char}"
  
  replay_type: SINGLE_DECISION | DECISION_RANGE | INCIDENT_INVESTIGATION | POLICY_CHANGE_IMPACT | COMPLIANCE_WINDOW
  
  scope:
    if SINGLE_DECISION:
      policy_decision_id: string       # the specific POLDEC-* to replay
    
    if DECISION_RANGE:
      from_timestamp: ISO-8601
      to_timestamp: ISO-8601
      filter_policy_id: string | null  # limit to decisions driven by specific policy
      filter_actor_id: string | null   # limit to decisions for specific actor
      filter_action_type: string | null
      max_decisions: int               # cap for large ranges
    
    if INCIDENT_INVESTIGATION:
      incident_id: string              # replay all decisions related to this incident
      extended_window_hours: int       # hours before incident to include
    
    if POLICY_CHANGE_IMPACT:
      new_policy_id: string            # policy being evaluated
      baseline_policy_id: string       # policy being replaced
      sample_decisions: [policy_decision_id]   # decisions to re-evaluate under new policy
      time_window_for_sample: duration | null  # auto-sample from this period if no explicit list
    
    if COMPLIANCE_WINDOW:
      compliance_period: {from: ISO-8601, to: ISO-8601}
      regulation_id: string | null     # limit to decisions relevant to specific regulation
      obligation_id: string | null
  
  replay_options:
    strict_reconstruction: boolean     # if true, fail rather than approximate missing context
    include_would_have_been: boolean   # include "what would current policies decide" comparison
    explain_mode: boolean              # include explanation for replayed decisions
    auditor_id: agent_id | human_id   # who is requesting this replay
    purpose: string                    # documented purpose (regulatory examination, incident, etc.)
```

---

## Policy State Reconstruction

```yaml
policy_state_reconstruction:
  objective: |
    Reconstruct exactly which policies were ACTIVE at the target_timestamp,
    and what version of each policy was active. This is the set of policies
    that would have been evaluated for a request at that moment.
  
  reconstruction_process:
    step_1: query policy_registry activation_log for all status transitions
    step_2: for each policy, find the version that was ACTIVE at target_timestamp
            (i.e., activated_at <= target_timestamp AND deprecated_at > target_timestamp OR null)
    step_3: retrieve that specific policy version's PDL document
    step_4: reconstruct compiled policy tree for that version
    step_5: verify reconstruction by checking policy_hash against registry record
  
  reconstruction_integrity:
    every_version_stored: policy registry stores all historical versions permanently
    policy_hash_verification: retrieved historical version must hash to stored hash
    chain_verification: version hash chain must be intact (prior_version_hash links)
    if_integrity_fails: replay cannot proceed for that policy; flag as VERIFICATION_FAILURE
  
  policy_state_snapshot:
    snapshot_id: "SNAP-{replay_id}-{target_timestamp}"
    active_policies: [{policy_id, version, policy_hash, activation_timestamp}]
    total_policies_active: int
    snapshot_integrity_verified: boolean
    snapshot_created_at: ISO-8601 (replay time, not original time)
```

---

## Context Reconstruction

```yaml
context_reconstruction:
  objective: |
    Reconstruct the evaluation context that existed when the original decision was made.
    This includes the actor's trust scores, capabilities, and tier at that time,
    not their current state. Using current state would produce different (incorrect) replay results.
  
  reconstructible_context:
    actor_trust_scores_at_time: from trust-propagation-engine historical state (if retained)
    actor_tier_at_time: from agent-registry historical records
    actor_capabilities_at_time: from agent-capability-assessment historical records
    system_risk_level_at_time: from enterprise-risk-register historical snapshots
    active_exceptions_at_time: from exception-management historical records
    delegation_chain_at_time: from delegation audit trail
  
  reconstruction_limitations:
    some_context_ephemeral: certain live function calls (lookup_risk_score at time T) cannot be perfectly reconstructed
    approximation_strategy: for ephemeral context, use closest available historical snapshot
    approximation_disclosure: all approximations documented in replay report with impact assessment
  
  context_retention_requirements:
    trust_scores: retained for 7 years (historical snapshots taken weekly)
    agent_tier_history: retained for 7 years (every change logged in audit trail)
    risk_register_history: retained for 7 years (daily snapshots)
    exception_history: retained per exception-management retention (7 years)
    
    if_context_unavailable:
      for_STRICT_reconstruction: replay FAILS for that decision; report as UNVERIFIABLE
      for_APPROXIMATE_reconstruction: proceed with best available context; flag as APPROXIMATED
```

---

## Replay Comparison and Discrepancy Analysis

```yaml
discrepancy_analysis:
  comparison:
    original_decision: retrieved from policy audit trail (POLDEC-* record)
    replayed_decision: result of policy evaluation with reconstructed context and policies
    
    comparison_dimensions:
      verdict: did the replay produce the same ALLOW/DENY/REQUIRE_APPROVAL verdict?
      determining_rule: did the same rule drive the decision?
      conditions: were the same conditions applied?
      hard_deny_status: does hard_deny status match?
  
  discrepancy_classification:
    EXACT_MATCH:
      definition: original and replay produce identical decision on all dimensions
      meaning: original decision was correct at the time given active policies
      action: record as VERIFIED; no further investigation
    
    VERDICT_MATCH_RULE_DIFFERENT:
      definition: same final verdict but different rule drove it
      meaning: policy logic may have overlap; original decision still correct
      action: document; investigate if different rules have different conditions (may indicate policy conflict)
    
    VERDICT_DIFFERENT_POLICY_CHANGE:
      definition: different verdict because policy was updated between original decision and replay
      meaning: original decision was correct under OLD policies; new policy would decide differently
      action: expected if replaying past decision under old policies for different-verdict POLICY_CHANGE_IMPACT replay
      audit_note: "Original decision was correct at time. Policy has since changed."
    
    VERDICT_DIFFERENT_SAME_POLICY:
      definition: different verdict using same policy version — should not happen (deterministic engine)
      meaning: context reconstruction is incomplete/inaccurate; or policy engine has non-determinism bug
      action: CRITICAL alert; investigate policy engine determinism; pause replay pending investigation
      severity: CRITICAL (implies audit trail cannot be relied upon for this decision class)
    
    ORIGINAL_NOT_AUDITED:
      definition: the original decision has no audit trail record
      meaning: decision was made without going through policy engine (governance violation)
      action: generate CRITICAL finding; security investigation; may indicate policy bypass
      severity: CRITICAL
```

---

## Compliance Window Replay

```yaml
compliance_window_replay:
  purpose: |
    Demonstrate to a regulatory examiner that all decisions in a compliance window
    were made correctly under active policies. This is the policy-replay equivalent
    of the evidence collection engine's evidence packages.
  
  compliance_window_report:
    report_id: "CWRPT-{regulation_id}-{period}"
    period: {from: ISO-8601, to: ISO-8601}
    regulation_id: string
    
    per_obligation:
      obligation_id: string
      covering_policies: [policy_id]
      decisions_in_period: int
      decisions_verified: int         # how many were exactly replayed
      decisions_approximated: int     # how many used approximated context
      decisions_unverifiable: int     # how many could not be reconstructed
      discrepancies_found: int
      discrepancy_details: [{decision_id, discrepancy_type, analysis}]
    
    overall_verification_rate: float  # (verified + approximated) / total decisions
    overall_exact_match_rate: float   # verified / total decisions
    hard_deny_violations: int         # decisions where hard_deny should have fired but did not
    
    examiner_statement: string        # auto-generated statement for regulatory submission
    legal_review_required: boolean    # true if any UNVERIFIABLE or hard_deny_violation found
  
  verification_thresholds:
    target: >= 99.5% exact match rate for CONSTITUTIONAL and REGULATORY decisions
    acceptable: >= 97% for SECURITY and AI_GOVERNANCE decisions
    unacceptable: < 95% for any category (triggers investigation and escalation)
```

---

## Replay Audit Trail

```yaml
replay_audit:
  every_replay_run:
    logged_as: audit event POLICY_REPLAY_EXECUTED
    contents: [replay_id, requested_by, purpose, scope, decisions_replayed, discrepancies, completion_status]
    integrity: replay record is part of the audit trail hash chain
  
  replay_immutability:
    replay_results: stored immutably; cannot be modified after completion
    purpose: replay records must themselves be trustworthy for regulatory examination
  
  access_control:
    who_can_request_replay: compliance governance lead; auditors; regulatory examiners (via examination protocol)
    who_can_see_results: requester + compliance governance lead + legal counsel
    external_access: all externally shared replay reports reviewed by legal counsel first
  
  replay_retention: 7 years (or duration of any associated regulatory matter, whichever is longer)
```

---

## Integration Points

| System | Role |
|---|---|
| `policy-as-code/policy-registry.md` | Historical policy versions retrieved for reconstruction |
| `policy-as-code/policy-compiler.md` | Historical policies compiled for replay evaluation |
| `policy-as-code/policy-engine.md` | Replay uses an isolated instance of the policy engine |
| `governance-policies/immutable-policy-audit.md` | Original decisions retrieved from immutable audit |
| `governance-policies/policy-lineage-tracker.md` | Policy-to-obligation linkage verified during replay |
| `audit-and-evidence/audit-trail-governance.md` | Context reconstruction uses audit trail history |
| `audit-and-evidence/audit-management-system.md` | Compliance window replay produces audit evidence packages |
