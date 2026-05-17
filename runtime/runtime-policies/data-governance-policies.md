# Data Governance Runtime Policies

## Purpose
Enforces data classification, handling, retention, transfer, and access policies at the point of data interaction — ensuring that data-related obligations under GDPR, CCPA, and other privacy regulations are not merely documented in the control catalog but are automatically enforced at runtime. These policies prevent unauthorized access, ensure proper data labeling, enforce cross-border transfer restrictions, and trigger data subject rights fulfillment processes without requiring manual intervention.

---

## Policy Catalog — Data Privacy Domain

```yaml
data_governance_policies:
  POL-DATA-001:
    policy_name: data_classification_mandatory
    description: "All data written to persistent storage must have a classification label. Unlabeled data writes are denied."
    obligation_ids: [OBL-GDPR-005, OBL-ISO27001-014]
    control_ids: [CTL-PRIV-001]
    priority: 20
    
    rules:
      RULE-DATA-001-01:
        name: personal_data_must_be_classified
        description: "Any write operation involving personal data must include a classification label specifying the data category."
        condition:
          all_of:
            - {field: "action.action_category", op: eq, value: "WRITE"}
            - {function: "write_contains_personal_data", args: ["resource.resource_id", "action.intended_effect"], op: eq, value: true}
            - {function: "write_has_classification_label", args: ["action.intended_effect"], op: eq, value: false}
        effect:
          type: DENY
          reason_template: "Write containing personal data must include a classification label. Data without classification cannot be persisted."
      
      RULE-DATA-001-02:
        name: special_category_data_explicit_labeling
        description: "Special category data (health, biometric, political opinion, religion) requires explicit SPECIAL_CATEGORY label."
        condition:
          all_of:
            - {field: "action.action_category", op: eq, value: "WRITE"}
            - {function: "write_contains_special_category_data", args: ["action.intended_effect"], op: eq, value: true}
            - {function: "write_has_label", args: ["action.intended_effect", "SPECIAL_CATEGORY"], op: eq, value: false}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "Special category personal data requires explicit SPECIAL_CATEGORY label. This is a GDPR Article 9 requirement and cannot be bypassed."
  
  POL-DATA-002:
    policy_name: personal_data_access_purpose_limitation
    description: "Personal data may only be accessed for purposes compatible with the original collection purpose."
    obligation_ids: [OBL-GDPR-005, OBL-GDPR-006, OBL-CCPA-002]
    control_ids: [CTL-PRIV-001, CTL-PRIV-004]
    priority: 20
    
    rules:
      RULE-DATA-002-01:
        name: incompatible_purpose_denied
        description: "Access to personal data for a purpose incompatible with collection purpose is denied."
        condition:
          all_of:
            - {field: "action.action_category", op: in, value: ["READ", "WRITE", "EXECUTE"]}
            - {function: "resource_contains_personal_data", args: ["resource.resource_id"], op: eq, value: true}
            - {function: "purpose_compatible", args: ["resource.resource_id", "context.triggering_obligation_ids"], op: eq, value: false}
        effect:
          type: DENY
          hard_deny: false
          reason_template: "Access purpose is not compatible with data collection purpose. GDPR Article 5(1)(b) purpose limitation."
      
      RULE-DATA-002-02:
        name: research_purpose_exemption_requires_safeguards
        description: "Research purpose exemption from purpose limitation requires documented safeguards."
        condition:
          all_of:
            - {function: "purpose_is_research", args: ["context.triggering_obligation_ids"], op: eq, value: true}
            - {function: "research_safeguards_documented", args: ["context.workflow_id"], op: eq, value: false}
        effect:
          type: REQUIRE_APPROVAL
          approvers: [{role: "DATA_PROTECTION_OFFICER"}]
          quorum: 1
          timeout: "48h"
  
  POL-DATA-003:
    policy_name: cross_border_data_transfer_restriction
    description: "Transfer of personal data to jurisdictions without adequate data protection is restricted pending transfer mechanism verification."
    obligation_ids: [OBL-GDPR-046, OBL-GDPR-049]
    control_ids: [CTL-PRIV-001]
    priority: 15
    
    rules:
      RULE-DATA-003-01:
        name: transfer_to_non_adequate_jurisdiction_requires_mechanism
        description: "Personal data transfer to non-adequate third countries requires an approved transfer mechanism (SCCs, BCRs, or adequacy decision)."
        condition:
          all_of:
            - {function: "action_is_cross_border_transfer", args: ["action.action_type", "resource.resource_id"], op: eq, value: true}
            - {function: "destination_jurisdiction_adequate", args: ["action.intended_effect"], op: eq, value: false}
            - {function: "valid_transfer_mechanism_exists", args: ["resource.resource_id", "action.intended_effect"], op: eq, value: false}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "Cross-border transfer of personal data to non-adequate jurisdiction without a valid transfer mechanism is prohibited under GDPR Article 46. Transfer blocked."
      
      RULE-DATA-003-02:
        name: transfer_mechanism_must_be_current
        description: "Expired or invalidated transfer mechanisms do not authorize data transfers."
        condition:
          all_of:
            - {function: "action_is_cross_border_transfer", args: ["action.action_type", "resource.resource_id"], op: eq, value: true}
            - {function: "transfer_mechanism_is_expired", args: ["resource.resource_id", "action.intended_effect"], op: eq, value: true}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "Transfer mechanism has expired or been invalidated. Personal data transfer blocked pending renewal of transfer mechanism."
  
  POL-DATA-004:
    policy_name: data_retention_enforcement
    description: "Data past its retention deadline must not be accessed; deletion must be executed at expiry."
    obligation_ids: [OBL-GDPR-005, OBL-CCPA-003]
    control_ids: [CTL-PRIV-002]
    priority: 25
    
    rules:
      RULE-DATA-004-01:
        name: expired_data_read_denied
        description: "Reading personal data past its retention deadline is denied. Data should have been deleted."
        condition:
          all_of:
            - {field: "action.action_category", op: eq, value: "READ"}
            - {function: "resource_past_retention_date", args: ["resource.resource_id"], op: eq, value: true}
            - {function: "is_deletion_workflow", args: ["context.workflow_id"], op: eq, value: false}
        effect:
          type: DENY
          reason_template: "Data {resource.resource_id} has passed its retention deadline. Access denied. Data should be deleted per retention schedule."
      
      RULE-DATA-004-02:
        name: retention_override_requires_legal_hold
        description: "Retaining personal data past its retention deadline is only permitted under an active legal hold."
        condition:
          all_of:
            - {function: "resource_past_retention_date", args: ["resource.resource_id"], op: eq, value: true}
            - {field: "action.action_type", op: eq, value: "RETENTION_EXTENDED"}
            - {function: "is_under_legal_hold", args: ["resource.resource_id"], op: eq, value: false}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "Retention extension beyond scheduled date requires an active legal hold. No legal hold found for {resource.resource_id}."
  
  POL-DATA-005:
    policy_name: dsr_fulfillment_policy
    description: "Data Subject Requests must be fulfilled within statutory deadlines. Policies enforce automatic routing and escalation."
    obligation_ids: [OBL-GDPR-012, OBL-GDPR-017, OBL-CCPA-004]
    control_ids: [CTL-PRIV-003]
    priority: 15
    
    rules:
      RULE-DATA-005-01:
        name: dsr_at_90_percent_sla_requires_escalation
        description: "DSR requests at 90% of statutory SLA without resolution must be automatically escalated."
        condition:
          all_of:
            - {function: "dsr_sla_percentage_elapsed", args: ["resource.resource_id"], op: "numeric_gte", value: 0.90}
            - {function: "dsr_is_unresolved", args: ["resource.resource_id"], op: eq, value: true}
        effect:
          type: AUDIT_ONLY
          log_level: ALERT
          alert_recipients: ["COMPLIANCE_GOVERNANCE_LEAD", "DATA_PROTECTION_OFFICER"]
          note: "Triggers automatic escalation notification — does not block the underlying DSR workflow."
      
      RULE-DATA-005-02:
        name: dsr_past_deadline_is_compliance_incident
        description: "Any DSR past its statutory deadline triggers automatic compliance incident creation."
        condition:
          all_of:
            - {function: "dsr_past_statutory_deadline", args: ["resource.resource_id"], op: eq, value: true}
        effect:
          type: AUDIT_ONLY
          log_level: ALERT
          alert_recipients: ["COMPLIANCE_GOVERNANCE_LEAD", "DATA_PROTECTION_OFFICER"]
          note: "Triggers incident creation in compliance-incident-management.md. Finding generated in finding-management.md."
  
  POL-DATA-006:
    policy_name: consent_required_for_processing
    description: "Processing requiring consent may not proceed without a valid, current consent record."
    obligation_ids: [OBL-GDPR-006, OBL-CCPA-001]
    control_ids: [CTL-PRIV-004]
    priority: 20
    
    rules:
      RULE-DATA-006-01:
        name: consent_based_processing_requires_valid_consent
        description: "Processing activities relying on consent as the legal basis must verify consent is current and not withdrawn."
        condition:
          all_of:
            - {function: "processing_legal_basis", args: ["resource.resource_id", "action.intended_effect"], op: eq, value: "CONSENT"}
            - {function: "valid_consent_exists", args: ["resource.resource_id", "action.intended_effect"], op: eq, value: false}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "Processing relies on consent as legal basis, but no valid consent record exists or consent has been withdrawn."
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/control-catalog.md` | CTL-PRIV-001 through CTL-PRIV-005 operationalized here |
| `compliance-framework/regulatory-registry.md` | GDPR/CCPA obligations referenced throughout |
| `governance-operations/compliance-incident-management.md` | DSR breaches trigger incident creation |
| `audit-and-evidence/finding-management.md` | Retention violations, consent failures generate findings |
| `risk-and-controls/enterprise-risk-register.md` | RSK-PRIV-001, RSK-PRIV-002, RSK-PRIV-003 |
| `governance-operations/third-party-risk-management.md` | Cross-border transfer mechanism verification |
