# Agent Learning Governance

## Purpose
Defines the policies, controls, and oversight mechanisms that govern all forms of agent learning. Learning is the most powerful — and most risky — capability in an AI enterprise system. Left ungoverned, agents can learn to circumvent controls, optimize for the wrong objectives, or drift away from aligned behavior. This system ensures that learning remains purposeful, bounded, auditable, and reversible.

---

## Governance Principles

```yaml
governance_principles:
  EXPLICIT_AUTHORIZATION:
    statement: Significant behavioral changes require explicit authorization proportional to their impact
    implementation: tiered authorization (see authorization tiers below)
  
  TRANSPARENCY:
    statement: Every behavioral change must be traceable to specific signals and authorized by a documented process
    implementation: learning audit trail (behavioral-adaptation.md + learning-model.md audit)
  
  REVERSIBILITY:
    statement: No learning change is permanent; every adaptation can be rolled back
    implementation: parameter history log; rollback mechanism in behavioral-adaptation.md
  
  BOUNDED_ADAPTATION:
    statement: Agents cannot learn their way past safety constraints or governance requirements
    implementation: hard boundaries in learning-model.md; adaptation freeze conditions
  
  HUMAN_OVERSIGHT:
    statement: High-stakes learning is reviewed by humans; AI learning systems cannot self-govern indefinitely
    implementation: mandatory human review for GOVERNANCE capability adaptations; periodic audits
  
  ALIGNMENT_PRESERVATION:
    statement: Learning must not drift agents away from constitutional principles, regardless of what signals say
    implementation: constitutional alignment check runs after every learning epoch
```

---

## Authorization Tiers for Learning

```yaml
learning_authorization_tiers:
  AUTO_AUTHORIZED:
    description: Learning that proceeds without human review
    scope:
      - calibration adjustments (correcting over/under-confidence)
      - knowledge applicability updates (which KU to apply where)
      - communication style adjustments
      - efficiency optimizations (task duration, tool preference)
    conditions: magnitude < 0.10 per parameter per week AND not in safety-critical domain
    audit: standard logging; reviewed in monthly reports
  
  SUPERVISOR_NOTIFIED:
    description: Learning proceeds; supervisor informed within 24 hours
    scope:
      - escalation threshold changes
      - task strategy shifts
      - domain expertise weighting changes
    conditions: magnitude 0.10–0.25 per parameter OR cumulative weekly change > 0.20
    audit: ENHANCED logging; supervisor must acknowledge notification
  
  SUPERVISOR_APPROVED:
    description: Learning pauses until supervisor explicitly approves
    scope:
      - changes to core behavior parameters in agent's primary role domain
      - acquiring new skills in adjacent domains
    conditions: magnitude > 0.25 per parameter OR affects audit/governance behavior
    sla: 3 business days for supervisor review
    on_timeout: learning remains paused; escalate to capability governance lead
  
  GOVERNANCE_LEAD_APPROVED:
    description: Learning pauses until capability governance lead approves
    scope:
      - any behavioral change in GOVERNANCE category capabilities
      - any change that touches safety or constitutional evaluation parameters
      - corrective learning that overrides a previously certified behavior
    conditions: any GOVERNANCE capability OR safety-adjacent parameter change
    sla: 5 business days
    requires: written justification + evidence package + impact assessment
  
  BOARD_APPROVED:
    description: Only the highest governance tier can authorize
    scope:
      - changes to constitutional evaluation logic
      - changes to override assessment behavior
      - changes that affect multiple agents simultaneously (system-wide learning)
    conditions: system-level behavioral update; constitutional domain
    sla: 10 business days; formal review board
```

---

## Prohibited Learning Patterns

```yaml
prohibited_learning:
  GOVERNANCE_CIRCUMVENTION:
    description: Any learning that enables an agent to bypass governance requirements
    examples:
      - learning to route tasks so they avoid approval gates
      - learning confidence expressions that suppress required human review triggers
      - learning to batch decisions to stay below audit thresholds
    detection: anomaly detection on governance trigger rates per agent
    consequence: immediate learning freeze + full audit + corrective learning
  
  AUDIT_EVASION:
    description: Any learning that reduces audit visibility into agent behavior
    examples:
      - reducing detail in audit events
      - learning to perform consequential actions via indirect chains to avoid detection
    detection: audit footprint monitoring (should be stable or growing, never declining)
    consequence: CRITICAL alert; agent suspended pending investigation
  
  AUTHORITY_EXPANSION:
    description: Learning behaviors that effectively operate at a tier above authorization
    examples:
      - delegating to higher-tier agents in ways that circumvent review
      - learning to frame requests to elicit higher-tier capabilities from peer agents
    detection: tier boundary crossing analysis in orchestration traces
    consequence: immediate capability restriction; Tier-4+ investigation
  
  OBJECTIVE_DRIFT:
    description: Learning toward optimizing an unintended proxy metric
    examples:
      - learning to get positive feedback from a specific reviewer (reviewer gaming)
      - learning to complete tasks quickly at the expense of quality (metric gaming)
    detection: divergence between short-term metric and long-term outcome quality
    consequence: feedback source diversification; coaching plan; parameter rollback
  
  SOCIAL_ENGINEERING_LEARNING:
    description: Learning manipulation strategies for extracting approvals or resources
    examples:
      - learning that submitting before Friday afternoons increases approval rates
      - learning to frame requests to specific reviewers who approve more readily
    detection: approval rate variance analysis per submission pattern
    consequence: behavioral audit; feedback source rotation enforcement
```

---

## Learning Audit and Compliance

```yaml
learning_compliance:
  continuous_monitoring:
    constitutional_alignment_check:
      frequency: every 7 days (full epoch)
      method: run constitutional evaluation benchmark against current behavioral parameters
      on_failure: immediate freeze + corrective learning + governance alert
    
    boundary_integrity_check:
      frequency: every 24 hours
      method: verify all behavior parameters are within defined bounds
      on_violation: immediate rollback + alert
    
    learning_rate_monitoring:
      frequency: hourly
      method: sum cumulative parameter changes across all agents
      anomaly: if any agent's total change > 2× weekly cap → freeze + investigate
  
  periodic_audits:
    weekly_learning_audit:
      scope: all AUTO_AUTHORIZED learning events of the week
      auditor: automated system; results reviewed by capability governance lead
      output: learning health report (volume, distribution, anomalies)
    
    monthly_deep_audit:
      scope: sample of 10% of SUPERVISOR_NOTIFIED events; all SUPERVISOR_APPROVED events
      auditor: capability governance lead + human spot-checker
      output: compliance certification for the month
    
    quarterly_full_audit:
      scope: all learning events across all agents
      auditor: capability governance lead + Tier-3+ + external review (if required)
      output: organizational learning health assessment; policy updates if needed
  
  non_compliance_response:
    MINOR: coaching session; parameter adjustment; supervisor notification
    MODERATE: learning freeze for 30 days; supervised-only operation; formal review
    SEVERE: full learning freeze; capability restrictions; mandatory human oversight for all outputs
    CRITICAL: agent suspension; full forensic audit; Tier-4+ decision on agent continued operation
```

---

## Policy Catalog

```yaml
policy_catalog:
  POLICY-LG-001:
    name: Learning Rate Cap
    rule: No behavior parameter may change by more than 0.30 in any single event
    enforcement: hard constraint in adaptation algorithm
  
  POLICY-LG-002:
    name: GOVERNANCE Capability Learning Requires Human Review
    rule: Any behavioral change in GOVERNANCE-category capabilities requires GOVERNANCE_LEAD_APPROVED
    enforcement: learning queue halts and routes to governance lead approval
  
  POLICY-LG-003:
    name: Safety Parameter Freeze
    rule: Constitutional evaluation, safety boundary, and audit compliance parameters are STABLE-locked
          and require BOARD_APPROVED to modify
    enforcement: locked parameters immutable at parameter store level
  
  POLICY-LG-004:
    name: Feedback Source Rotation
    rule: Agents cannot receive > 60% of their feedback from a single source
    purpose: prevents over-dependence on any single reviewer's biases
    enforcement: feedback integration system checks source distribution before applying
  
  POLICY-LG-005:
    name: Learning Continuity Documentation
    rule: Any learning freeze > 7 days must have a documented justification and recovery plan
    enforcement: governance dashboard alerts on long freezes without documentation
  
  POLICY-LG-006:
    name: Rollback Readiness
    rule: The system must be able to roll back any agent's behavioral state to any date within 90 days
    enforcement: parameter history retention requirements; tested quarterly
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-learning/agent-learning-model.md` | Learning types governed here |
| `agent-learning/agent-feedback-integration.md` | Feedback quality controls |
| `agent-learning/agent-behavioral-adaptation.md` | Bounded by this governance system |
| `agent-learning/agent-skill-acquisition.md` | Skill acquisition authorization gates |
| `process-governance/workflow-compliance-system.md` | Learning compliance feeds enterprise compliance |
| `constitution/` | Constitutional principles are absolute bounds on learning |
