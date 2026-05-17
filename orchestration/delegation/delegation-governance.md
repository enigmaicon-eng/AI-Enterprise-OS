# Delegation Governance

## Purpose
Governs the delegation and trust system at an enterprise level — defining the policies, audit framework, compliance requirements, and oversight mechanisms that keep the delegation system aligned with enterprise governance principles. While `delegation-model.md` defines how delegation works, and `authority-transfer-protocol.md` defines how authority moves, this document defines who watches the watchers and how the system self-corrects.

---

## Governance Scope

```yaml
governance_scope:
  covers:
    - all delegation records across the enterprise
    - all authority transfer records
    - all inter-agent contracts
    - trust score integrity and manipulation prevention
    - delegation pattern analysis (detecting systemic abuse or failure)
    - governance roles and responsibilities in the delegation system
  
  does_not_cover:
    - individual task execution (governed by orchestration patterns)
    - capability authorization (governed by agent-capability-governance.md)
    - learning and adaptation (governed by agent-learning-governance.md)
```

---

## Governance Roles

```yaml
governance_roles:
  DELEGATION_GOVERNANCE_LEAD:
    responsibilities:
      - maintain delegation policy catalog
      - conduct monthly delegation audits
      - investigate delegation violations
      - manage trust score appeals and disputes
      - report delegation health to Tier-4+ leadership
    authority:
      - can revoke any delegation for governance cause
      - can freeze a specific agent's delegation privileges
      - can override trust scores temporarily pending investigation
    tier: 3+
  
  SUPERVISING_AGENTS:
    responsibilities:
      - approve delegations from their supervised agents (as required by tier rules)
      - review delegation exercise logs for their supervised agents
      - escalate delegation anomalies to governance lead
    authority:
      - can revoke delegations made by supervised agents
      - cannot approve delegation beyond their own authority level
  
  REGISTRY_GOVERNANCE_SYSTEM (automated):
    responsibilities:
      - continuous delegation compliance monitoring
      - automatic detection of policy violations
      - real-time trust score anomaly detection
      - audit trail integrity verification
    action_authority:
      - flag violations (automated)
      - initiate investigation records (automated)
      - alert humans (automated)
      - cannot independently revoke delegations (requires human confirmation for T2+ agents)
```

---

## Delegation Policy Catalog

```yaml
delegation_policies:
  POLICY-DG-001:
    name: delegation_requires_trust_floor
    statement: Delegatee must meet minimum trust score in the relevant domain before delegation is active.
    thresholds:
      TASK_DELEGATION: >= 0.40 (LIMITED_TRUST or above)
      DOMAIN_DELEGATION: >= 0.60 (MODERATE_TRUST or above)
      REPRESENTATION_DELEGATION: >= 0.80 (HIGH_TRUST)
      EMERGENCY_DELEGATION: >= 0.60
    enforcement: automatic check at delegation creation; rejected if trust insufficient
    exception: governance lead can override for exceptional circumstances (must document reason)
  
  POLICY-DG-002:
    name: delegation_chain_traceability
    statement: Every delegation must be traceable to an originating human authority within a maximum of 4 hops.
    enforcement: chain depth check at delegation creation; chain audit monthly
    violation: if chain cannot be traced to human → delegation suspended pending investigation
  
  POLICY-DG-003:
    name: no_governance_delegation_without_human
    statement: Authority over GOVERNANCE capabilities cannot be fully delegated to an AI agent without human in the chain.
    enforcement: any delegation including GOVERNANCE capabilities requires human as grantor or explicit review gate
    non_bypassable: even with Tier-5 AI authority; constitutional constraint
  
  POLICY-DG-004:
    name: trust_manipulation_prohibition
    statement: No agent may take actions specifically intended to manipulate trust scores in the trust graph.
    examples_of_violation:
      - generating fake positive feedback to boost own or another's trust score
      - issuing trust warnings without evidence to damage another agent's trust
      - coordinating to endorse each other in a circular trust scheme
    detection: statistical anomaly detection on feedback patterns; circular endorsement detection
    consequence: IMMEDIATE trust freeze; governance investigation; potential suspension
  
  POLICY-DG-005:
    name: delegation_authority_is_never_permanent
    statement: All delegations must have an explicit expiry; no standing unlimited authority.
    maximum_durations:
      TASK_DELEGATION: task completion or 7 days (whichever first)
      DOMAIN_DELEGATION: 30 days (renewable with review)
      REPRESENTATION_DELEGATION: 7 days (renewable with human confirmation)
      SERVICE_CONTRACT: 30 days (renewable)
      EMERGENCY_DELEGATION: 4 hours (cannot be extended; must create new delegation)
    enforcement: automatic expiry enforcement; expired delegations treated as revoked
  
  POLICY-DG-006:
    name: delegation_audit_completeness
    statement: 100% of delegation events must be logged with full provenance.
    non_bypassable: no mechanism exists to create an "unlogged" delegation
    audit_trail: append-only, hash-chained; 3-year retention for STANDARD; 7-year for GOVERNANCE
  
  POLICY-DG-007:
    name: trust_score_transparency_for_self
    statement: Every agent has the right to understand why their trust score is what it is.
    implementation: trust score explanation available to agent and supervisor on request
    prohibition: trust scores cannot be updated without a traceable signal (no opaque adjustments)
```

---

## Delegation Audit Framework

```yaml
audit_framework:
  continuous_automated_monitoring:
    scope: real-time delegation event stream
    checks:
      - authority_inflation_detection: transfer > grantor authority → immediate alert
      - chain_depth_violation: depth > 4 → alert
      - trust_floor_violation: delegation to agent below trust floor → alert
      - expired_delegation_exercise: agent exercises expired delegation → CRITICAL alert
      - escalation_trigger_bypass: agent bypasses defined escalation trigger → CRITICAL alert
      - anomalous_endorsement_patterns: circular or spike endorsements → investigation flag
    
    alert_routing:
      CRITICAL: immediate Tier-4+ + delegation governance lead notification
      HIGH: delegation governance lead within 15 minutes
      MEDIUM: daily digest to governance lead
  
  weekly_audit:
    scope: all delegation events in the week
    checks:
      - delegation chain integrity (all chains trace to human)
      - all expired delegations properly closed
      - all breach records have remedies applied
      - trust score changes with unusual velocity (> 0.15 change in one week)
    output: weekly delegation summary → governance lead
  
  monthly_deep_audit:
    scope: full delegation graph
    checks:
      - all policy compliance (POLICY-DG-001 through 007)
      - delegation pattern analysis (are certain agents consistently over-delegated?)
      - trust manipulation detection (statistical analysis of feedback patterns)
      - authority chain completeness (every delegation traceable to human)
      - breach-to-performance correlation (are breaching agents being corrected?)
    output: monthly delegation governance report → Tier-4+ leadership
  
  quarterly_governance_review:
    scope: policy effectiveness review
    questions:
      - are current delegation policies achieving their governance goals?
      - have any novel delegation abuse patterns emerged?
      - are trust scores correlating with actual agent reliability? (calibration audit)
      - should any policies be updated given observed patterns?
    output: quarterly policy review recommendation → Tier-5 for approval
```

---

## Delegation Violation Investigation

```yaml
violation_investigation:
  triggers:
    - any CRITICAL or HIGH automated alert
    - manual report from any agent or human
    - anomaly detected in monthly audit
  
  investigation_steps:
    step_1_containment: if active violation → suspend relevant delegations pending investigation
    step_2_evidence_collection: gather all delegation records, exercise logs, trust signals in scope
    step_3_root_cause_analysis: determine if violation was intentional, accidental, or systemic
    step_4_impact_assessment: what decisions were made under improper authority? are they valid?
    step_5_consequence_determination: per violation type and root cause
    step_6_remediation: correct invalid decisions; apply consequences; update governance if systemic
    step_7_report: full investigation report retained for 7 years
  
  consequence_matrix:
    ACCIDENTAL_VIOLATION (first occurrence): warning; mandatory training; no delegation privilege restriction
    ACCIDENTAL_VIOLATION (repeat): formal performance note; 30-day enhanced monitoring
    INTENTIONAL_POLICY_VIOLATION: suspension; Tier-4+ review for reinstatement
    TRUST_MANIPULATION (confirmed): immediate suspension; escalation to board for reinstatement decision
    SYSTEMIC_FAILURE (protocol design issue): policy update; re-audit all affected delegations
  
  invalid_decision_handling:
    decisions_made_under_invalid_authority:
      REVERSIBLE: immediately reversed; affected parties notified
      HARD_TO_REVERSE: escalated to Tier-4+ for remediation decision
      IRREVERSIBLE: documented; board notified; long-term remediation plan
```

---

## Delegation Health Metrics

```yaml
delegation_health_metrics:
  active_delegations_count: total active delegation records
  delegation_chain_depth_distribution: histogram of current chain depths
  average_trust_score_at_delegation: are we delegating to appropriately trusted agents?
  delegation_completion_rate: fraction of TASK delegations reaching COMPLETED (target > 0.90)
  breach_rate: fraction of contracts with breach events (target < 0.05)
  authority_inflation_attempts: count of detected inflation attempts (target: 0)
  expired_delegation_exercise_attempts: count of attempts to exercise expired authority (target: 0)
  trust_score_health:
    fraction_agents_high_trust: (target > 0.60)
    fraction_agents_low_trust: (alert if > 0.15)
  
  health_dashboard:
    update_frequency: hourly
    displayed_in: coordination-operations/orchestration-operations-dashboard.md
    recipients: delegation governance lead; Tier-4+ on request
```

---

## Integration Points

| System | Role |
|---|---|
| `delegation-and-trust/delegation-model.md` | Policy enforcement for delegation creation |
| `delegation-and-trust/trust-propagation-engine.md` | Trust manipulation detection; score integrity governance |
| `delegation-and-trust/authority-transfer-protocol.md` | Authority transfer compliance monitoring |
| `delegation-and-trust/inter-agent-contracts.md` | Contract breach governance and escalation |
| `agent-capabilities/agent-capability-governance.md` | Delegation policies align with capability authorization rules |
| `docs/governance/principles.md` | Delegation governance operates within the five enterprise principles |
| `coordination-operations/orchestration-operations-dashboard.md` | Delegation health metrics displayed here |
