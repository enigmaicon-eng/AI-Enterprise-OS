# Agent Capability Governance

## Purpose
Controls which agents have access to which capabilities, ensures that high-risk capabilities are only deployed by appropriately qualified agents, audits capability usage, and detects misuse or drift. Capability governance is the authorization layer of the agent intelligence system — proficiency without authorization is insufficient for high-stakes capabilities.

---

## Capability Authorization Model

```yaml
authorization_model:
  two_factor_requirement:
    for_any_capability: agent must have BOTH
      1. proficiency: assessed_level >= tier_required minimum
      2. authorization: explicit grant OR automatic authorization (low-tier capabilities)
  
  automatic_authorization:
    applies_to: capabilities with tier_required <= 1 (RETRIEVAL, ANALYSIS basics)
    condition: agent type has this capability in inherited_capabilities list
    no_explicit_grant_needed: true
  
  explicit_authorization:
    applies_to: capabilities with tier_required >= 2
    grant_process: see authorization workflow below
    revocation: can be revoked independently of proficiency
    audit: all grants and revocations logged with authority and reason
  
  combination_locks:
    some capabilities require multiple conditions:
      GOVERNANCE category:
        requires: assessed_level >= CAPABLE AND explicit_grant AND Tier-3+ authorization
      constitutional_evaluation:
        requires: assessed_level >= PROFICIENT AND explicit_grant AND Tier-4+ sign-off AND quarterly re-certification
      override_assessment:
        requires: assessed_level >= PROFICIENT AND explicit_grant AND Tier-4+ dual-approval
```

---

## Authorization Workflow

```yaml
authorization_workflow:
  step_1_assessment_gate:
    check: is assessed_level >= required_minimum for the capability?
    on_fail: route to capability development; cannot proceed to authorization
  
  step_2_authorization_request:
    requester: agent supervisor OR agent self-nomination (if tier >= required - 1)
    request_contents: {agent_id, capability_id, justification, evidence_of_proficiency, intended_use_contexts}
  
  step_3_review:
    reviewer: determined by capability tier_required
      tier_2: domain steward
      tier_3: Tier-3 governance agent
      tier_4: Tier-4+ + human review
      tier_5: Tier-5 (board level) for capability classes with highest impact
    sla: 5 business days for tier_2–3; 10 business days for tier_4+
  
  step_4_grant_or_deny:
    grant: add to agent's authorized_capabilities; set grant_expiry if time-limited
    deny: deny with reason; agent may appeal via challenge process
    conditional_grant: grant with conditions (e.g., must have mentor review for first 3 uses)
  
  authorization_record:
    agent_id: string
    capability_id: string
    granted_by: agent-id
    granted_at: ISO-8601
    expires_at: ISO-8601 | null         # some grants are time-limited
    conditions: [string]
    grant_basis: {proficiency_level, evidence, justification_summary}
    revocation_date: ISO-8601 | null
    revocation_reason: string | null
```

---

## Authorization Policies

```yaml
authorization_policies:
  POLICY-CAPGOV-001:
    name: No Self-Authorization
    rule: An agent cannot authorize their own capability grants
    enforcement: hard constraint in authorization workflow
    exception: tier_1 automatic grants (low risk)
  
  POLICY-CAPGOV-002:
    name: Authorizer Must Exceed Authorized Level
    rule: The granting agent must have a higher capability tier_required than the capability being granted
    example: SKILL-GOV-001 (tier_required: 3) must be granted by a Tier-4+ agent
    enforcement: tier check at step 3
  
  POLICY-CAPGOV-003:
    name: GOVERNANCE Capabilities Expire
    rule: All GOVERNANCE category capability authorizations expire after 12 months and require renewal
    renewal: full re-assessment + authorization review
    rationale: governance landscape changes; stale authorizations create risk
  
  POLICY-CAPGOV-004:
    name: EXPERT-Level Requires Human Endorsement
    rule: Granting EXPERT capability authorization requires at least one human endorsement
    applies_to: any capability where proficiency_level being granted = EXPERT
    enforcement: authorization review requires human signature
  
  POLICY-CAPGOV-005:
    name: High-Impact Capabilities Under Continuous Monitoring
    rule: Agents with authorization for constitutional_evaluation, override_assessment, or policy_interpretation
          are subject to continuous usage monitoring; anomalies trigger immediate review
    monitoring: see capability usage monitoring below
  
  POLICY-CAPGOV-006:
    name: Capability Revocation on Performance Breach
    rule: If agent's success_rate for a capability falls below 0.50 for 30 consecutive days,
          authorization is suspended pending remediation
    process: suspension → remediation plan → re-assessment → re-authorization
```

---

## Capability Usage Monitoring

```yaml
capability_usage_monitoring:
  monitored_signals:
    usage_frequency:
      anomaly: usage > 3× historical average in 24-hour period
      action: alert to supervisor + audit log review
    
    error_rate:
      anomaly: capability error rate > 0.30 over 7 days (vs. baseline)
      action: alert to supervisor; possible temporary suspension
    
    scope_drift:
      detection: agent using capability in domains outside their authorized scope
      examples: governance agent using constitutional_evaluation for personal benefit
      action: immediate flag; ENHANCED audit; supervisor review
    
    cascading_authorization:
      detection: agent authorizing capabilities to other agents at the same tier
      rule: violates POLICY-CAPGOV-002
      action: revoke cascaded grants; audit trail review
    
    output_quality_decline:
      detection: artifact quality score for capability outputs trending downward
      threshold: > 0.15 drop in quality over 30 days
      action: supervisor notification; possible re-assessment trigger
  
  monitoring_infrastructure:
    event: every capability invocation emits cap.used event to enterprise event bus
    payload: {agent_id, capability_id, task_id, context, outcome}
    latency: events processed within 30 seconds
    storage: 2-year retention for GOVERNANCE capabilities; 1-year for others
```

---

## Capability Governance Dashboard

```yaml
capability_governance_dashboard:
  panels:
    authorization_health:
      - total grants active by capability tier
      - grants expiring within 30 days
      - pending authorization requests (with age)
      - revocations this month
    
    usage_compliance:
      - usage anomalies detected (last 7 days)
      - scope drift incidents (last 30 days)
      - error rate trends by capability
    
    proficiency_coverage:
      - capabilities with < 5 PROFICIENT+ authorized agents (risk: key-person dependency)
      - capabilities with no authorized agents at EXPERT level (organizational gap)
      - capability gaps by domain (domains where key capabilities are under-authorized)
    
    audit_summary:
      - authorization actions this week
      - ENHANCED audit events this week
      - pending capability challenges
  
  alerts:
    SINGLE_POINT_OF_FAILURE: only 1 agent authorized for a GOVERNANCE capability → HIGH alert
    MASS_REVOCATION: > 5 revocations in 24h → alert to capability governance lead
    POLICY_VIOLATION: any POLICY-CAPGOV-00X breach → immediate alert + auto-action
```

---

## Capability Compliance Reporting

```yaml
compliance_reporting:
  monthly_authorization_audit:
    content: all active grants; expiry review; usage vs. authorization analysis
    flagged_items: unused grants (granted but never used in 60 days); expired grants not renewed
    recipient: capability governance lead
  
  quarterly_portfolio_review:
    content: full capability coverage analysis by domain; development gaps; governance risk
    outcome: may trigger new development plans, mentorship programs, or recruitment
    recipient: Tier-3+ leadership
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-capabilities/agent-capability-model.md` | Capability definitions and tier requirements |
| `agent-capabilities/agent-skill-registry.md` | Skill grant linked to capability authorization |
| `agent-capabilities/agent-capability-assessment.md` | Proficiency gate for authorization |
| `governance-queues/confidence-threshold-system.md` | High-capability agents have different thresholds |
| `approval-operations/override-governance-system.md` | Override capabilities have strictest governance |
| `enterprise-telemetry/enterprise-event-bus.md` | Capability usage event stream |
