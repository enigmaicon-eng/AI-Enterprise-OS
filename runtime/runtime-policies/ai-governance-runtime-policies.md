# AI Governance Runtime Policies

## Purpose
Enforces EU AI Act compliance, constitutional AI principles, human oversight requirements, transparency obligations, and AI-specific risk controls at runtime. These are the highest-priority domain-specific policies in the operating system — EU AI Act prohibited practices are HARD_DENY at the constitutional level, and human oversight requirements for high-risk AI decisions cannot be waived by any authority. These policies translate the AI governance framework from documentation into automatic, auditable enforcement.

---

## Policy Catalog — AI Governance Domain

```yaml
ai_governance_runtime_policies:
  POL-AI-001:
    policy_name: eu_ai_act_prohibited_practices_absolute_ban
    description: "EU AI Act Article 5 prohibited AI practices are unconditionally forbidden. No exception, approval, or authority level can override this policy."
    obligation_ids: [OBL-EUAIACT-005]
    control_ids: [CTL-AI-001]
    regulation_ids: [REG-EUAIACT-2024]
    priority: 1
    classification:
      category: CONSTITUTIONAL
      is_hard_deny_capable: true
    
    rules:
      RULE-AI-001-01:
        name: subliminal_manipulation_prohibited
        description: "AI systems deploying subliminal techniques to manipulate behavior are prohibited without exception."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "AI_SYSTEM_DECISION"}
            - {function: "ai_system_uses_subliminal_technique", args: ["resource.resource_id"], op: eq, value: true}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "EU AI Act Article 5(1)(a) — subliminal manipulation is a prohibited AI practice. Hard deny; non-overrideable."
      
      RULE-AI-001-02:
        name: social_scoring_prohibited
        description: "AI systems for general-purpose social scoring of individuals by public authorities are prohibited."
        condition:
          all_of:
            - {function: "ai_system_category", args: ["resource.resource_id"], op: eq, value: "SOCIAL_SCORING"}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "EU AI Act Article 5(1)(c) — social scoring AI is a prohibited practice. Hard deny; non-overrideable."
      
      RULE-AI-001-03:
        name: realtime_biometric_surveillance_prohibited
        description: "Real-time remote biometric identification systems in publicly accessible spaces are prohibited."
        condition:
          all_of:
            - {function: "ai_system_category", args: ["resource.resource_id"], op: eq, value: "REALTIME_BIOMETRIC_PUBLIC_SPACE"}
            - {function: "is_law_enforcement_exception_documented", args: ["resource.resource_id"], op: eq, value: false}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "EU AI Act Article 5(1)(d) — real-time remote biometric identification in public spaces is prohibited. Hard deny."
      
      RULE-AI-001-04:
        name: predictive_policing_individual_prohibited
        description: "AI for predictive policing based on profiling of individuals without factual basis is prohibited."
        condition:
          all_of:
            - {function: "ai_system_category", args: ["resource.resource_id"], op: eq, value: "PREDICTIVE_POLICING_INDIVIDUAL"}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "EU AI Act Article 5(1)(d) prohibited practice. Hard deny; non-overrideable."
  
  POL-AI-002:
    policy_name: high_risk_ai_system_conformity_required
    description: "High-risk AI systems (EU AI Act Annex III) may not be deployed or operated without a completed conformity assessment."
    obligation_ids: [OBL-EUAIACT-016, OBL-EUAIACT-043]
    control_ids: [CTL-AI-002]
    priority: 3
    
    rules:
      RULE-AI-002-01:
        name: no_deployment_without_conformity_assessment
        description: "High-risk AI system deployment requires a current conformity assessment on record."
        condition:
          all_of:
            - {field: "action.action_type", op: in, value: ["AI_SYSTEM_DEPLOYED", "AI_SYSTEM_ACTIVATED"]}
            - {function: "ai_system_risk_class", args: ["resource.resource_id"], op: eq, value: "HIGH_RISK"}
            - {function: "conformity_assessment_current", args: ["resource.resource_id"], op: eq, value: false}
        effect:
          type: DENY
          hard_deny: false
          reason_template: "High-risk AI system {resource.resource_id} cannot be deployed without a current conformity assessment. EU AI Act Article 43."
      
      RULE-AI-002-02:
        name: post_market_monitoring_required
        description: "Once deployed, high-risk AI systems must have post-market monitoring active."
        condition:
          all_of:
            - {function: "ai_system_risk_class", args: ["resource.resource_id"], op: eq, value: "HIGH_RISK"}
            - {field: "action.action_category", op: eq, value: "EXECUTE"}
            - {function: "post_market_monitoring_active", args: ["resource.resource_id"], op: eq, value: false}
        effect:
          type: DENY
          reason_template: "High-risk AI system operation requires active post-market monitoring per EU AI Act Article 72. Monitoring not active for {resource.resource_id}."
  
  POL-AI-003:
    policy_name: human_oversight_enforcement
    description: "High-risk AI decisions must have human oversight available and active. Override or bypass of human review is prohibited."
    obligation_ids: [OBL-EUAIACT-014, OBL-EUAIACT-029]
    control_ids: [CTL-AI-004]
    priority: 3
    
    rules:
      RULE-AI-003-01:
        name: critical_ai_decision_human_review_mandatory
        description: "Decisions by high-risk AI systems on matters affecting individuals must pass through an active human review gate."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "AI_SYSTEM_DECISION"}
            - {function: "ai_system_risk_class", args: ["resource.resource_id"], op: eq, value: "HIGH_RISK"}
            - {function: "human_review_gate_active", args: ["resource.resource_id"], op: eq, value: false}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "High-risk AI decisions require an active human review gate. No human review gate is active for {resource.resource_id}. Decision blocked. EU AI Act Article 14."
      
      RULE-AI-003-02:
        name: human_review_bypass_rate_zero_for_critical
        description: "Human review bypass rate for critical AI decisions must be 0%. Any bypass attempt is denied and logged."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "HUMAN_REVIEW_BYPASSED"}
            - {function: "ai_decision_is_critical", args: ["resource.resource_id"], op: eq, value: true}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "Human review bypass for critical AI decisions is prohibited. Bypass attempt logged as potential governance violation."
      
      RULE-AI-003-03:
        name: human_override_must_be_documented
        description: "When a human overrides an AI recommendation, the override must be documented with rationale before the action proceeds."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "HUMAN_OVERRIDE_APPLIED"}
            - {function: "override_has_documented_rationale", args: ["context.session_id"], op: eq, value: false}
        effect:
          type: ALLOW_WITH_CONDITIONS
          conditions:
            - condition_id: COND-OVERRIDE-DOC
              description: "Override rationale must be entered before action proceeds."
              check: "override_rationale_captured(context.session_id)"
          violation_action: REVOKE
  
  POL-AI-004:
    policy_name: ai_transparency_and_disclosure
    description: "AI systems interacting with individuals must disclose their AI nature. AI-generated content must be labeled."
    obligation_ids: [OBL-EUAIACT-050, OBL-EUAIACT-052]
    control_ids: [CTL-AI-003]
    priority: 20
    
    rules:
      RULE-AI-004-01:
        name: natural_person_interaction_must_disclose_ai
        description: "Any AI system that interacts with a natural person must inform them they are interacting with an AI."
        condition:
          all_of:
            - {function: "interaction_with_natural_person", args: ["resource.resource_id", "action.intended_effect"], op: eq, value: true}
            - {function: "ai_disclosure_included", args: ["action.intended_effect"], op: eq, value: false}
        effect:
          type: DENY
          reason_template: "AI interaction with natural persons must include disclosure of AI nature per EU AI Act Article 50. Disclosure not found in output."
      
      RULE-AI-004-02:
        name: synthetic_media_must_be_labeled
        description: "AI-generated synthetic media (deepfakes, synthetic voice, generated images) must be labeled."
        condition:
          all_of:
            - {function: "output_is_synthetic_media", args: ["action.intended_effect"], op: eq, value: true}
            - {function: "synthetic_media_labeled", args: ["action.intended_effect"], op: eq, value: false}
        effect:
          type: DENY
          reason_template: "AI-generated synthetic media must be labeled per EU AI Act Article 50(4). Label not present."
  
  POL-AI-005:
    policy_name: ai_system_risk_reclassification_governance
    description: "Changes to AI system risk classification require appropriate governance approval."
    obligation_ids: [OBL-EUAIACT-009]
    control_ids: [CTL-AI-001]
    priority: 15
    
    rules:
      RULE-AI-005-01:
        name: risk_downgrade_requires_tier4
        description: "Downgrading an AI system from HIGH_RISK to MEDIUM_RISK or LOWER requires Tier-4+ approval."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "AI_SYSTEM_RISK_RECLASSIFIED"}
            - {function: "is_risk_downgrade", args: ["resource.resource_id", "action.intended_effect"], op: eq, value: true}
            - {field: "subject.actor_tier", op: lt, value: 4}
        effect:
          type: DENY
          reason_template: "Downgrading AI system risk classification requires Tier-4+ approval. Risk downgrades carry significant compliance implications."
  
  POL-AI-006:
    policy_name: ai_calibration_threshold_enforcement
    description: "Agents with high calibration error are restricted from performing governance-sensitive tasks."
    obligation_ids: [OBL-GOV-AI-001]
    control_ids: [CTL-AI-005]
    priority: 20
    
    rules:
      RULE-AI-006-01:
        name: high_calibration_error_governance_restriction
        description: "AI agents with calibration error > 0.20 may not perform GOVERNANCE domain tasks."
        condition:
          all_of:
            - {field: "resource.resource_domain", op: eq, value: "GOVERNANCE"}
            - {function: "agent_calibration_error", args: ["subject.actor_id"], op: "numeric_gt", value: 0.20}
        effect:
          type: DENY
          reason_template: "Agent {subject.actor_id} has calibration error > 0.20 ({agent_calibration_error(subject.actor_id)}). GOVERNANCE domain tasks require calibration error <= 0.20. Agent restricted pending recalibration."
```

---

## AI Policy Emergency Protocols

```yaml
emergency_protocols:
  prohibited_practice_detected_in_production:
    trigger: POL-AI-001 HARD_DENY fires on a live production system
    immediate_actions:
      - AI system suspended immediately (no grace period)
      - CRITICAL compliance incident created
      - Tier-4+ notified within 30 minutes
      - Regulatory authority notification assessment within 4 hours
    investigation_SLA: root cause within 24 hours
    reactivation: Tier-4+ + legal counsel sign-off required; new conformity assessment required
  
  human_review_gate_failure:
    trigger: POL-AI-003 fires because human review gate is not active
    immediate_actions:
      - affected AI decision queue paused
      - human review gate restoration tasked immediately
      - DEGRADED finding generated for CTL-AI-004
    restoration_SLA: human review gate must be restored within 1 hour; if not, Tier-3+ escalation
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/control-catalog.md` | CTL-AI-001 through CTL-AI-006 operationalized here |
| `compliance-framework/regulatory-registry.md` | EU AI Act obligations (OBL-EUAIACT-*) enforced here |
| `risk-and-controls/enterprise-risk-register.md` | RSK-AIGOV-001 (score=20) treatment enforced at runtime |
| `risk-and-controls/control-effectiveness-monitor.md` | Policy violations update control effectiveness states |
| `agent-intelligence/agent-confidence-calibration.md` | Calibration error consumed by POL-AI-006 |
| `governance-policies/immutable-policy-audit.md` | All AI governance policy decisions logged immutably |
| `governance-operations/compliance-incident-management.md` | Prohibited practice violations trigger CRITICAL incidents |
