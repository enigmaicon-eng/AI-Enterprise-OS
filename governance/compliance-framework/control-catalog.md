# Control Catalog

## Purpose
The authoritative library of all enterprise compliance controls. Every control that the enterprise uses to satisfy regulatory obligations, implement policies, and mitigate risks is defined, owned, tested, and tracked here. The control catalog is the operational layer of the compliance framework — it turns obligations and policies into specific, testable, evidence-generating activities.

---

## Control Classification System

```yaml
control_classification:
  by_type:
    PREVENTIVE: stops a compliance failure from occurring
      examples: access controls, encryption, pre-deployment review gates
    DETECTIVE: identifies when a compliance failure has occurred
      examples: monitoring alerts, audit log reviews, anomaly detection
    CORRECTIVE: remediates a compliance failure after it is detected
      examples: incident response, rollback procedures, patch management
    DETERRENT: discourages compliance failures (psychological/structural)
      examples: visible audit trails, signed acknowledgments, consequence communication
    COMPENSATING: substitutes for a primary control that cannot be implemented
      examples: enhanced monitoring in lieu of technical control; manual review in lieu of automation
  
  by_method:
    AUTOMATED: executed by a system without human intervention
      testing: can be continuously tested; evidence auto-generated
    MANUAL: executed by a human or agent following a procedure
      testing: requires active testing; evidence is attestation or observation
    HYBRID: automated execution with manual oversight or approval
      testing: partial automation; manual review required for evidence acceptance
  
  by_frequency:
    CONTINUOUS: runs without interruption (monitoring, access control enforcement)
    EVENT_TRIGGERED: runs when a specific event occurs (data access logging)
    DAILY: scheduled daily execution (log review, backup verification)
    WEEKLY: scheduled weekly
    MONTHLY: scheduled monthly (access recertification, key rotation)
    QUARTERLY: scheduled quarterly (vendor risk review, policy compliance attestation)
    ANNUAL: scheduled annually (full audit, DR test, policy review)
    ON_DEMAND: run when needed (incident investigation, new system onboarding)
  
  by_domain:
    DATA_PRIVACY: controls satisfying privacy regulations (GDPR, CCPA, HIPAA)
    INFORMATION_SECURITY: controls satisfying security standards (ISO27001, SOC2, NIST CSF)
    AI_GOVERNANCE: controls satisfying AI regulations (EU AI Act, ISO42001)
    OPERATIONAL: process and procedure controls
    FINANCIAL: financial reporting and internal controls
    THIRD_PARTY: vendor and partner compliance controls
```

---

## Core Control Library

```yaml
core_controls:
  DATA_PRIVACY_CONTROLS:
    CTL-PRIV-001:
      name: data_classification_enforcement
      description: All data is classified at creation; classification label stored with data record
      type: PREVENTIVE | AUTOMATED
      frequency: CONTINUOUS
      obligation_coverage: [GDPR Art.5(1)(f), CCPA §1798.100]
      test_procedure: Sample 100 data records; verify all have valid classification labels
      evidence_required: [classification_label_report, sample_audit_log]
    
    CTL-PRIV-002:
      name: data_retention_enforcement
      description: Data is automatically deleted or archived when retention period expires
      type: PREVENTIVE | AUTOMATED
      frequency: DAILY
      obligation_coverage: [GDPR Art.5(1)(e), CCPA §1798.105]
      test_procedure: Verify retention policy applied; confirm no data beyond retention window
      evidence_required: [retention_execution_log, sample_deletion_confirmation]
    
    CTL-PRIV-003:
      name: data_subject_rights_fulfillment
      description: Process for handling data subject requests (access, deletion, portability) within regulatory deadlines
      type: CORRECTIVE | HYBRID
      frequency: EVENT_TRIGGERED
      SLA: GDPR 30 days; CCPA 45 days
      obligation_coverage: [GDPR Art.15-22, CCPA §1798.110-1798.125]
      test_procedure: Review all DSR requests in last quarter; verify all completed within SLA
      evidence_required: [dsr_request_log, completion_timestamps, fulfillment_records]
    
    CTL-PRIV-004:
      name: consent_management
      description: Valid consent obtained and recorded before processing personal data for consent-dependent purposes
      type: PREVENTIVE | HYBRID
      frequency: EVENT_TRIGGERED
      obligation_coverage: [GDPR Art.6(1)(a), GDPR Art.7]
      test_procedure: Verify consent records exist for sampled data processing activities
      evidence_required: [consent_records, processing_activity_log]
    
    CTL-PRIV-005:
      name: privacy_impact_assessment
      description: DPIA conducted before implementing new high-risk processing activities
      type: PREVENTIVE | MANUAL
      frequency: EVENT_TRIGGERED (before new processing)
      obligation_coverage: [GDPR Art.35]
      test_procedure: Review all new processing activities in last 6 months; verify DPIA exists for high-risk ones
      evidence_required: [dpia_records, processing_activity_register, risk_assessments]
  
  INFORMATION_SECURITY_CONTROLS:
    CTL-SEC-001:
      name: access_control_enforcement
      description: Access to systems and data restricted to authorized principals with minimum necessary privileges
      type: PREVENTIVE | AUTOMATED
      frequency: CONTINUOUS
      obligation_coverage: [ISO27001 A.5.15, SOC2 CC6.1, NIST CSF PR.AC]
      test_procedure: Review access control configuration; verify least privilege; test access denial
      evidence_required: [access_control_configuration, access_log_sample, denied_access_log]
    
    CTL-SEC-002:
      name: encryption_at_rest
      description: All CONFIDENTIAL and above data encrypted at rest using approved algorithms (AES-256 minimum)
      type: PREVENTIVE | AUTOMATED
      frequency: CONTINUOUS
      obligation_coverage: [GDPR Art.32(1)(a), ISO27001 A.8.24, SOC2 CC6.1]
      test_procedure: Verify encryption configuration on all data stores; sample verify encrypted storage
      evidence_required: [encryption_configuration_report, encryption_validation_log]
    
    CTL-SEC-003:
      name: encryption_in_transit
      description: All data in transit encrypted using TLS 1.2+ or equivalent
      type: PREVENTIVE | AUTOMATED
      frequency: CONTINUOUS
      obligation_coverage: [GDPR Art.32(1)(a), ISO27001 A.8.24, SOC2 CC6.7]
      test_procedure: Network scan verifying all communication channels use approved encryption
      evidence_required: [network_scan_report, TLS_configuration_report]
    
    CTL-SEC-004:
      name: vulnerability_management
      description: Regular vulnerability scanning; critical vulnerabilities remediated within SLA
      type: DETECTIVE | HYBRID
      frequency: WEEKLY (scan); SLA-based (remediation)
      remediation_SLA: CRITICAL 24h; HIGH 7d; MEDIUM 30d; LOW 90d
      obligation_coverage: [ISO27001 A.8.8, SOC2 CC7.1, NIST CSF ID.RA]
      evidence_required: [vulnerability_scan_report, remediation_tracking_log]
    
    CTL-SEC-005:
      name: security_incident_response
      description: Documented incident response procedure; incidents detected, contained, and reported within required timeframes
      type: CORRECTIVE | HYBRID
      frequency: EVENT_TRIGGERED
      reporting_SLA: GDPR 72 hours to supervisory authority
      obligation_coverage: [GDPR Art.33-34, ISO27001 A.5.26, SOC2 CC7.3]
      evidence_required: [incident_log, response_timeline, regulatory_notifications]
    
    CTL-SEC-006:
      name: audit_log_integrity
      description: All security-relevant events logged; logs protected from tampering; retained per policy
      type: DETECTIVE | AUTOMATED
      frequency: CONTINUOUS
      obligation_coverage: [ISO27001 A.8.15, SOC2 CC7.2, GDPR Art.5(2)]
      test_procedure: Verify log collection completeness; verify log integrity (hash chain); verify retention compliance
      evidence_required: [log_completeness_report, hash_chain_verification, retention_compliance_report]
  
  AI_GOVERNANCE_CONTROLS:
    CTL-AI-001:
      name: ai_system_risk_classification
      description: All AI systems classified by risk level (EU AI Act categories) before deployment
      type: PREVENTIVE | MANUAL
      frequency: EVENT_TRIGGERED (before deployment)
      obligation_coverage: [EU AI Act Art.6, ISO42001 Clause 6.1]
      test_procedure: Review AI system inventory; verify risk classification exists and is current for all systems
      evidence_required: [ai_system_inventory, risk_classification_records, classification_approval_records]
    
    CTL-AI-002:
      name: high_risk_ai_conformity_assessment
      description: High-risk AI systems undergo conformity assessment before deployment and after significant changes
      type: PREVENTIVE | MANUAL
      frequency: EVENT_TRIGGERED
      obligation_coverage: [EU AI Act Art.43, ISO42001 Clause 9.1]
      evidence_required: [conformity_assessment_records, technical_documentation, notified_body_certificate_if_applicable]
    
    CTL-AI-003:
      name: ai_transparency_disclosure
      description: Users informed when interacting with AI systems; AI nature not concealed
      type: PREVENTIVE | AUTOMATED
      frequency: CONTINUOUS
      obligation_coverage: [EU AI Act Art.50, ISO42001 Clause 8.4]
      evidence_required: [transparency_disclosure_samples, disclosure_log]
    
    CTL-AI-004:
      name: ai_human_oversight
      description: Meaningful human oversight maintained for all high-risk AI decisions; override capability preserved
      type: PREVENTIVE | HYBRID
      frequency: CONTINUOUS
      obligation_coverage: [EU AI Act Art.14, EU AI Act Art.26, constitution/human-approval-constitution.md]
      test_procedure: Verify human review gates are active; test override capability; review bypass attempt logs
      evidence_required: [human_review_gate_logs, override_exercise_records, bypass_attempt_log]
    
    CTL-AI-005:
      name: ai_system_monitoring_post_deployment
      description: High-risk AI systems monitored for performance degradation, bias drift, and unexpected behavior
      type: DETECTIVE | AUTOMATED
      frequency: CONTINUOUS
      obligation_coverage: [EU AI Act Art.72, ISO42001 Clause 9.1]
      evidence_required: [monitoring_dashboard_screenshots, alert_log, incident_log]
    
    CTL-AI-006:
      name: ai_data_governance
      description: Training and validation data for AI systems governed: quality checks, bias assessment, documentation
      type: PREVENTIVE | HYBRID
      frequency: EVENT_TRIGGERED (at training/retraining)
      obligation_coverage: [EU AI Act Art.10, ISO42001 Clause 8.3]
      evidence_required: [data_quality_assessment, bias_assessment_report, data_governance_documentation]
  
  OPERATIONAL_CONTROLS:
    CTL-OPS-001:
      name: change_management
      description: All changes to systems and processes follow documented change management procedure; changes approved before implementation
      type: PREVENTIVE | HYBRID
      frequency: EVENT_TRIGGERED
      obligation_coverage: [ISO27001 A.8.32, SOC2 CC8.1]
      evidence_required: [change_request_records, approval_records, post-implementation_review]
    
    CTL-OPS-002:
      name: business_continuity_testing
      description: Business continuity and disaster recovery plans tested annually; results documented
      type: DETECTIVE | MANUAL
      frequency: ANNUAL
      obligation_coverage: [ISO27001 A.5.30, SOC2 A1.2]
      evidence_required: [bc_dr_test_plan, test_results, gap_remediation_plan]
    
    CTL-OPS-003:
      name: vendor_due_diligence
      description: Third-party vendors assessed for compliance risk before engagement; monitored annually
      type: PREVENTIVE | HYBRID
      frequency: EVENT_TRIGGERED + ANNUAL
      obligation_coverage: [GDPR Art.28, ISO27001 A.5.19-5.22]
      evidence_required: [vendor_assessment_records, contract_compliance_clauses, monitoring_records]
```

---

## Control Ownership and Accountability

```yaml
control_ownership:
  owner_responsibilities:
    - ensure control is implemented and operating effectively
    - maintain control documentation current
    - ensure evidence is collected on schedule
    - respond to control findings within SLA
    - request exceptions through proper process when control cannot be met
    - notify compliance governance lead of any material changes to control implementation
  
  backup_owner: required for all T3-rated (CRITICAL) controls
  
  owner_assignment_matrix:
    DATA_PRIVACY controls: Privacy Officer | Data Protection Officer
    INFORMATION_SECURITY controls: Information Security Officer | CISO function
    AI_GOVERNANCE controls: AI Governance Lead | CAIO function
    OPERATIONAL controls: Process Owner | COO function
    FINANCIAL controls: Financial Controller | CFO function
  
  accountability_review:
    frequency: quarterly
    action: verify all controls have active owner; review owner capacity (max 20 owned controls per owner)
    escalation: controls without owner > 7 days → compliance governance lead immediate alert
```

---

## Control Testing Schedule

```yaml
control_testing_schedule:
  automated_controls:
    continuous_evidence_collection: always on
    effectiveness_check: automated daily (based on evidence quality and completeness)
    formal_test: quarterly (verifies automation is functioning correctly)
  
  manual_controls:
    test_execution: per control.frequency field
    test_documentation: required within 5 business days of test completion
    test_reviewer: independent reviewer (not the control owner)
    escalation: test overdue by > 7 days → control status → AT_RISK; alert compliance lead
  
  annual_comprehensive_test:
    scope: all controls (automated + manual full-cycle test)
    timing: aligned with annual audit cycle
    output: annual control effectiveness report → audit-and-evidence/compliance-reporting-engine.md
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/compliance-model.md` | Control schema definition |
| `compliance-framework/regulatory-registry.md` | obligation_coverage cited in control records |
| `compliance-framework/policy-management-system.md` | Controls implement policy statements |
| `risk-and-controls/control-testing-engine.md` | Executes control tests against this catalog |
| `risk-and-controls/control-effectiveness-monitor.md` | Monitors effectiveness of all catalog controls |
| `audit-and-evidence/evidence-collection-engine.md` | Collects evidence for each control per catalog spec |
