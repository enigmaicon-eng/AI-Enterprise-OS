# Third-Party Risk Management

## Purpose
Governs compliance and risk obligations arising from the enterprise's relationships with third parties — vendors, suppliers, processors, sub-processors, and service providers. Third parties that access, process, or store enterprise data or systems create compliance exposure that cannot be managed inside the enterprise perimeter alone. This system ensures every third-party relationship is assessed, contracted, monitored, and terminated in ways that preserve the enterprise's compliance posture and satisfy regulatory requirements for processor oversight.

---

## Third-Party Risk Taxonomy

```yaml
third_party_taxonomy:
  CRITICAL_VENDOR:
    definition: third party with access to sensitive personal data, AI system components, or critical infrastructure
    examples: cloud infrastructure providers, AI model providers, data processors handling personal data
    assessment_frequency: ANNUAL comprehensive; CONTINUOUS monitoring
    contract_requirements: DPA (if personal data), security addendum, right to audit, breach notification SLA
    inherent_risk: HIGH minimum
  
  HIGH_RISK_VENDOR:
    definition: third party with access to internal systems or non-sensitive business data
    examples: SaaS tools, professional services with system access, managed security services
    assessment_frequency: ANNUAL
    contract_requirements: security requirements, incident notification, data handling terms
  
  MEDIUM_RISK_VENDOR:
    definition: third party providing services without system access but with some data interaction
    examples: analytics providers receiving aggregated data, research partners, cloud-based productivity tools
    assessment_frequency: BIENNIAL
    contract_requirements: standard vendor terms with data handling provisions
  
  LOW_RISK_VENDOR:
    definition: third party with no access to enterprise systems or data
    examples: office suppliers, facilities services, non-data processing contractors
    assessment_frequency: ON_CHANGE (no periodic assessment required)
    contract_requirements: standard commercial terms only
  
  DATA_PROCESSOR:
    definition: under GDPR Art.28 — any third party that processes personal data on behalf of the enterprise
    special_requirement: MANDATORY Data Processing Agreement (DPA) before processing begins
    additional_requirement: processor must bind sub-processors with equivalent obligations
    regulatory_basis: GDPR Art.28; CCPA equivalent; applies regardless of other risk tier
  
  AI_PROVIDER:
    definition: third party providing AI models, AI infrastructure, or AI services integrated into enterprise operations
    special_requirement: EU AI Act conformity obligations; transparency requirements; model card review
    assessment_dimension: transparency, bias testing results, incident history, compliance declarations
    monitoring: AI system performance monitoring per CTL-AI-005 applies to AI provider outputs
```

---

## Vendor Record Schema

```yaml
vendor_record:
  vendor_id: "VND-{seq}"
  vendor_name: string
  vendor_type: [string]              # from taxonomy above (may be multiple)
  
  risk_profile:
    inherent_risk_tier: CRITICAL | HIGH | MEDIUM | LOW
    inherent_risk_rationale: string
    assessed_risk: CRITICAL | HIGH | MEDIUM | LOW | null  # after assessment
    last_assessed: ISO-8601 | null
    assessment_due: ISO-8601
    is_data_processor: boolean       # GDPR/CCPA processor status
    is_ai_provider: boolean
    jurisdictions: [string]          # where is vendor data processed?
    data_transfer_mechanism: string | null  # SCCs, adequacy, binding corporate rules
  
  data_categories:
    personal_data_processed: boolean
    data_categories: [string]        # types of personal data (if applicable)
    special_category_data: boolean   # GDPR Art.9 sensitive categories
    estimated_data_subject_count: int | null
    processing_purposes: [string]
  
  contractual:
    contract_ids: [string]           # references to executed contracts
    dpa_executed: boolean
    dpa_review_date: ISO-8601 | null
    security_addendum_executed: boolean
    right_to_audit: boolean
    subprocessors_listed: boolean    # has vendor disclosed sub-processors?
    subprocessors: [string] | null
    breach_notification_sla: int     # hours vendor must notify enterprise of breach
    contract_expiry: ISO-8601 | null
  
  certifications:
    held_certifications: [{certification, scope, valid_until, document_ref}]
    certification_covers_in_scope_services: boolean | null
  
  monitoring:
    continuous_monitoring_active: boolean
    last_incident: ISO-8601 | null
    incidents_12m: int
    open_findings: [finding_id]
    kris: [{kri_name, threshold, current, status}]
  
  status: ACTIVE | ONBOARDING | OFFBOARDING | INACTIVE | SUSPENDED
  
  metadata:
    created_at: ISO-8601
    last_updated: ISO-8601
    relationship_owner: agent_id | human_id   # business owner of the vendor relationship
    compliance_contact: agent_id | human_id
```

---

## Vendor Assessment Protocol

```yaml
vendor_assessment:
  assessment_trigger:
    SCHEDULED: per risk tier assessment frequency
    NEW_VENDOR: before any data sharing or system access begins
    MATERIAL_CHANGE: vendor changes scope, ownership, or certifications
    INCIDENT: vendor reports or causes a compliance incident
    REGULATORY_CHANGE: regulation changes requirements for this vendor category
  
  assessment_dimensions:
    SECURITY_POSTURE:
      method: questionnaire + certification review + penetration test review (if available)
      evidence: SOC2 Type II report; ISO27001 certificate; penetration test executive summary
      questions: [encryption at rest/transit, access control, incident response, patch management, employee security training]
    
    DATA_PRIVACY_COMPLIANCE:
      method: DPA review + sub-processor disclosure review + data transfer mechanism verification
      evidence: executed DPA; sub-processor list; adequacy/SCC documentation
      questions: [data retention practices, data subject rights fulfilment, breach history, privacy by design evidence]
    
    AI_COMPLIANCE (if AI_PROVIDER):
      method: model card review + transparency documentation + bias testing results
      evidence: EU AI Act conformity declaration (if applicable); model documentation; incident history
      questions: [prohibited practices absence, bias testing, human oversight provisions, explainability support]
    
    OPERATIONAL_RELIABILITY:
      method: uptime history review + business continuity plan review
      evidence: uptime SLA compliance history; BCP test results; financial stability indicators
    
    REGULATORY_STANDING:
      method: public record search + vendor self-declaration
      evidence: no active regulatory sanctions; relevant certifications current
  
  assessment_rating:
    SATISFACTORY: all dimensions rated acceptable; continue relationship
    CONDITIONAL: one or more dimensions have gaps; remediation plan required; monitoring enhanced
    UNSATISFACTORY: material gaps in critical dimensions; relationship suspension pending remediation; Tier-3+ notified
    DISQUALIFYING: fundamental compliance breach; relationship termination required
  
  assessment_record:
    assessment_id: "VNDASM-{vendor_id}-{seq}"
    vendor_id: string
    assessment_type: INITIAL | PERIODIC | TRIGGERED
    dimensions_assessed: [string]
    findings: [string]
    rating: SATISFACTORY | CONDITIONAL | UNSATISFACTORY | DISQUALIFYING
    assessor: agent_id | human_id
    assessed_at: ISO-8601
    next_assessment_due: ISO-8601
    action_items: [{item, owner, due_date}]
```

---

## Data Processing Agreement Requirements

```yaml
dpa_requirements:
  trigger: any vendor that processes personal data on enterprise behalf → DPA mandatory before processing
  regulatory_basis: GDPR Art.28; CCPA; LGPD; equivalent in applicable jurisdictions
  
  mandatory_dpa_provisions:
    PROCESSING_SCOPE: process data only on documented instructions from enterprise
    PURPOSE_LIMITATION: process only for specified purposes; no unauthorized use
    CONFIDENTIALITY: processor personnel bound to confidentiality
    SECURITY_MEASURES: implement appropriate technical and organizational measures (Art.32)
    SUBPROCESSORS: obtain enterprise authorization before engaging sub-processors; bind with equivalent terms
    DATA_SUBJECT_RIGHTS: assist enterprise in responding to data subject requests
    DELETION_OR_RETURN: delete or return data at end of processing relationship
    AUDIT_COOPERATION: allow audits and inspections; provide information demonstrating compliance
    BREACH_NOTIFICATION: notify enterprise within defined SLA of any personal data breach
    INTERNATIONAL_TRANSFERS: comply with data transfer requirements; implement SCCs if required
  
  dpa_review_cycle: annually; upon material contract change; upon regulatory change affecting processor obligations
  
  sub_processor_management:
    enterprise_right: right to object to new sub-processors
    notification_SLA: vendor must notify enterprise minimum 30 days before adding sub-processor
    enterprise_response: approve | object (if objection, vendor must either not engage sub-processor or give enterprise right to terminate)
    sub_processor_register: maintained by vendor; shared with enterprise on request; reviewed annually
```

---

## Continuous Monitoring

```yaml
continuous_monitoring:
  monitoring_scope: all CRITICAL vendors; all data processors; all AI providers
  
  monitoring_signals:
    CERTIFICATION_EXPIRY: automated alert 90 days before certificate expiry; 30 days; 7 days
    BREACH_NOTIFICATION_RECEIVED: vendor notifies enterprise of incident → trigger incident response
    REGULATORY_ACTION_DETECTED: vendor under regulatory investigation or sanction (public record monitoring)
    CONTRACTUAL_CHANGE: vendor changes terms; DPA amendment required
    SUBPROCESSOR_CHANGE: vendor adds or removes sub-processor (requires enterprise review)
    PERFORMANCE_DEGRADATION: uptime or SLA breaches that affect compliance controls
    AI_SYSTEM_DRIFT: AI provider outputs show drift that could indicate model change (per CTL-AI-005)
  
  kri_examples:
    vendor_with_critical_certifications_current: target 100%; alert if any CRITICAL vendor cert expires
    vendor_dpa_review_rate: % of active processor DPAs reviewed within 12 months; target 100%
    open_vendor_findings: count of unresolved findings from vendor assessments
    sub_processor_disclosure_complete: % of processors with complete disclosed sub-processor list
  
  monitoring_outputs:
    vendor_health_dashboard: per-vendor status and signal state
    monthly_vendor_risk_digest: summary to compliance governance lead
    annual_vendor_portfolio_review: full portfolio re-rated; Tier-3+ approval
```

---

## Vendor Offboarding

```yaml
offboarding:
  trigger: contract expiry; vendor disqualification; enterprise-initiated termination; vendor-initiated exit
  
  offboarding_steps:
    step_1: identify all data and access held by vendor
    step_2: confirm contractual data return/deletion obligation
    step_3: request data return or certified deletion (per DPA terms)
    step_4: revoke all system access
    step_5: obtain deletion confirmation (written; hash of deleted data manifest if available)
    step_6: update sub-processor list if this vendor was a sub-processor
    step_7: conduct offboarding risk assessment (residual data risk; continuity risk)
    step_8: close vendor record; update status to INACTIVE
    step_9: retain vendor assessment records 5 years from offboarding date
  
  failure_to_confirm_deletion:
    consequence: compliance finding; potential data breach investigation (unauthorized retention of personal data)
    escalation: legal counsel engagement; potential supervisory authority notification
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/regulatory-registry.md` | GDPR, EU AI Act, CCPA obligations for processor management |
| `risk-and-controls/control-catalog.md` | CTL-OPS-003 vendor due diligence control; AI provider controls |
| `risk-and-controls/enterprise-risk-register.md` | Vendor risk added to enterprise risk register |
| `audit-and-evidence/finding-management.md` | Unsatisfactory assessments generate findings |
| `governance-operations/compliance-incident-management.md` | Vendor breaches trigger enterprise incident process |
| `governance-operations/compliance-operations-dashboard.md` | Vendor risk summary in Panel 7 |
| `audit-and-evidence/audit-management-system.md` | Vendor certifications reviewed in audits (SOC2, ISO27001) |
| `governance-operations/governance-executive-reporting.md` | Third-party risk summary in board reports |
