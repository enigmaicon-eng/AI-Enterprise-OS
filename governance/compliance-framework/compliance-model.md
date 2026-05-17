# Compliance Model

## Purpose
Defines the canonical data model for all enterprise compliance artifacts — obligations, controls, evidence, risks, and findings. The compliance model is the schema layer that makes all other compliance systems interoperable. Every regulation, policy, control test, audit finding, and risk record conforms to this model, enabling cross-domain compliance analysis, automated evidence mapping, and unified reporting.

---

## Model Architecture

```
External World                    Internal Enterprise
├── Regulations                   ├── Policies
│   ├── Requirements              │   ├── Policy Statements
│   └── Obligations               │   └── Procedures
└── Standards                     └── Controls
        ↓                                 ↓
[Obligation]  ─── mapped to ───  [Control]
     ↓                                 ↓
[Risk]        ─── mitigated by ─ [Control]
     ↓                                 ↓
[Evidence]    ─── demonstrates ─ [Control Effectiveness]
     ↓                                 ↓
[Finding]     ─── triggers ─────  [Remediation]
```

---

## Core Entity Schemas

### Obligation

```yaml
obligation:
  obligation_id: "OBL-{regulation_id}-{seq}"
  
  source:
    regulation_id: string           # references regulatory-registry.md
    requirement_ref: string         # e.g., "GDPR Article 32(1)(a)"
    requirement_text: string        # verbatim text of the requirement
    effective_date: ISO-8601
    last_confirmed: ISO-8601        # when was this mapping last verified against current regulation?
  
  classification:
    domain: DATA_PRIVACY | DATA_SECURITY | AI_GOVERNANCE | FINANCIAL | OPERATIONAL | CONTRACTUAL | EMPLOYMENT | ENVIRONMENTAL
    obligation_type: MANDATORY | CONDITIONAL | BEST_PRACTICE
    applicability: [org_unit | agent_type | capability | all]
    jurisdictions: [string]         # which geographies this applies to
  
  control_mapping:
    mapped_controls: [control_id]   # which controls satisfy this obligation
    coverage_assessment: FULLY_COVERED | PARTIALLY_COVERED | GAP
    coverage_last_assessed: ISO-8601
    gap_description: string | null
  
  status:
    compliance_state: COMPLIANT | NON_COMPLIANT | AT_RISK | UNDER_REVIEW | EXEMPT
    last_tested: ISO-8601 | null
    next_review: ISO-8601
  
  governance:
    owner: agent_id | human_id     # who is responsible for this obligation
    reviewer: agent_id | human_id
    created_at: ISO-8601
    updated_at: ISO-8601
```

### Control

```yaml
control:
  control_id: "CTL-{domain}-{seq}"
  
  identity:
    name: string
    description: string
    control_type: PREVENTIVE | DETECTIVE | CORRECTIVE | DETERRENT | COMPENSATING
    control_method: AUTOMATED | MANUAL | HYBRID
    frequency: CONTINUOUS | DAILY | WEEKLY | MONTHLY | QUARTERLY | ANNUAL | ON_DEMAND
  
  scope:
    domain: string (from compliance-taxonomy.md)
    applies_to: [agent_type | capability | system | process]
    geographic_scope: [jurisdiction | all]
  
  implementation:
    implementation_description: string
    system_reference: string | null   # what system implements this control?
    owner: agent_id | human_id
    backup_owner: agent_id | human_id
    implementation_status: IMPLEMENTED | PARTIAL | PLANNED | DEPRECATED
    implemented_date: ISO-8601 | null
  
  obligation_mapping:
    satisfies_obligations: [obligation_id]
    framework_mappings: [
      {framework: "SOC2" | "ISO27001" | "GDPR" | "NIST" | ..., control_ref: string}
    ]
  
  testing:
    test_procedure: string
    test_evidence_required: [string]  # what evidence must be collected to demonstrate effectiveness?
    test_frequency: string (same options as frequency)
    last_tested: ISO-8601 | null
    next_test_due: ISO-8601
    effectiveness_rating: EFFECTIVE | PARTIALLY_EFFECTIVE | INEFFECTIVE | NOT_TESTED
    effectiveness_confidence: float  # how confident are we in the rating?
  
  risk_linkage:
    mitigates_risks: [risk_id]
    residual_risk_level: LOW | MEDIUM | HIGH | CRITICAL (after this control is applied)
  
  status:
    active: boolean
    exceptions: [exception_id]
    open_findings: [finding_id]
  
  governance:
    audit_level: STANDARD | ENHANCED
    change_history: [timestamp, changed_by, what_changed]
    created_at: ISO-8601
    updated_at: ISO-8601
```

### Evidence

```yaml
evidence:
  evidence_id: "EVD-{control_id}-{seq}"
  
  source:
    control_id: string
    obligation_id: string | null
    collected_by: AUTOMATED | agent_id | human_id
    collection_method: SYSTEM_EXTRACT | LOG_QUERY | SCREENSHOT | DOCUMENT | INTERVIEW | OBSERVATION | ATTESTATION
    collected_at: ISO-8601
  
  content:
    artifact_type: LOG | REPORT | SCREENSHOT | DOCUMENT | CONFIGURATION | ATTESTATION | TEST_RESULT
    artifact_reference: string      # where the evidence artifact is stored
    artifact_hash: string           # SHA-256 of evidence artifact (integrity)
    description: string
    coverage_period: {from: ISO-8601, to: ISO-8601}
  
  quality:
    reliability: HIGH | MEDIUM | LOW  # based on collection method and source
    completeness: COMPLETE | PARTIAL
    reviewer_approved: boolean
    reviewer_id: agent_id | human_id | null
    reviewed_at: ISO-8601 | null
    rejection_reason: string | null
  
  retention:
    retain_until: ISO-8601
    retention_basis: string         # the regulation or policy requiring this retention period
    legal_hold: boolean
  
  integrity:
    hash_chain_position: int        # position in evidence integrity chain
    prior_evidence_hash: string     # enables chain verification
    digital_signature: string       # Ed25519 signature of evidence record
```

### Risk

```yaml
risk:
  risk_id: "RSK-{domain}-{seq}"
  
  identity:
    name: string
    description: string
    domain: string (from compliance-taxonomy.md)
    risk_category: REGULATORY | OPERATIONAL | REPUTATIONAL | FINANCIAL | SECURITY | AI_SPECIFIC
  
  assessment:
    likelihood: 1 | 2 | 3 | 4 | 5  # 1=rare to 5=almost certain
    impact: 1 | 2 | 3 | 4 | 5       # 1=negligible to 5=catastrophic
    inherent_risk_score: likelihood × impact  # 1–25
    control_ids: [control_id]        # controls mitigating this risk
    residual_risk_score: float       # after controls applied
    residual_risk_level: LOW | MEDIUM | HIGH | CRITICAL
    risk_tolerance: ACCEPT | MITIGATE | TRANSFER | AVOID
  
  treatment:
    treatment_plan: string
    treatment_owner: agent_id | human_id
    target_residual_risk: float
    treatment_deadline: ISO-8601
    treatment_status: NOT_STARTED | IN_PROGRESS | COMPLETED | ACCEPTED
  
  monitoring:
    key_risk_indicators: [{indicator_name, threshold, current_value, status}]
    review_frequency: MONTHLY | QUARTERLY | ANNUAL
    last_reviewed: ISO-8601
    next_review: ISO-8601
  
  governance:
    approved_by: agent_id | human_id
    risk_owner: agent_id | human_id
    created_at: ISO-8601
    updated_at: ISO-8601
```

### Finding

```yaml
finding:
  finding_id: "FND-{source}-{seq}"
  
  source:
    source_type: AUDIT | SELF_ASSESSMENT | REGULATORY_EXAM | MONITORING | INCIDENT | TESTING
    audit_id: string | null
    control_id: string | null
    obligation_id: string | null
    discovered_at: ISO-8601
    discovered_by: agent_id | human_id
  
  classification:
    finding_type: DEFICIENCY | MATERIAL_WEAKNESS | OBSERVATION | ENHANCEMENT
    severity: CRITICAL | HIGH | MEDIUM | LOW | INFORMATIONAL
    domain: string
    regulatory_implication: boolean
    potential_fine_exposure: float | null
  
  description:
    title: string
    detail: string
    root_cause: string
    evidence_refs: [evidence_id]
    affected_systems: [string]
    affected_obligations: [obligation_id]
  
  remediation:
    status: OPEN | IN_PROGRESS | RESOLVED | ACCEPTED_RISK | DISPUTED
    remediation_plan: string
    owner: agent_id | human_id
    due_date: ISO-8601
    resolution_date: ISO-8601 | null
    resolution_description: string | null
    verified_by: agent_id | human_id | null
    verified_at: ISO-8601 | null
  
  escalation:
    escalated: boolean
    escalated_to: agent_id | human_id | null
    escalation_reason: string | null
    sla:
      CRITICAL: 24 hours to resolution plan
      HIGH: 7 days to resolution plan
      MEDIUM: 30 days to resolution plan
      LOW: 90 days to resolution plan
  
  governance:
    management_response: string | null
    regulator_notified: boolean
    notification_date: ISO-8601 | null
    audit_trail: [event]
    created_at: ISO-8601
    updated_at: ISO-8601
```

---

## Model Relationships

```yaml
entity_relationships:
  obligation → control: many-to-many (one obligation satisfied by many controls; one control satisfies many obligations)
  control → evidence: one-to-many (each control has many evidence records over time)
  control → risk: many-to-many (controls mitigate risks; risks may require multiple controls)
  control → finding: one-to-many (failures in a control generate findings)
  finding → obligation: many-to-many (a finding may implicate multiple obligations)
  evidence → finding: evidence cited in findings or evidence that closes findings
  risk → obligation: risks arising from obligation gaps
  
  primary_indexes:
    by_domain: all entities indexed by compliance domain
    by_owner: obligations, controls, risks indexed by owner
    by_status: all entities indexed by current status
    by_due_date: findings, controls indexed by due dates (for SLA management)
  
  integrity_chain:
    evidence chain: each evidence record hashed and chained (append-only; tamper-evident)
    finding chain: all finding status changes hashed and chained
    control change log: all control modifications chained
```

---

## Model Versioning

```yaml
model_versioning:
  current_version: "1.0.0"
  schema_migrations: supported (new fields are additive; no field removals)
  backward_compatibility: maintained for 2 major versions
  
  entity_versioning:
    obligations: versioned when regulation changes; prior version retained
    controls: versioned on material changes; test history preserved across versions
    evidence: immutable after creation (hash-protected)
    risks: re-assessed creates new version; prior assessment retained for trend analysis
    findings: append-only status updates; original finding text immutable
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/regulatory-registry.md` | Source of regulations mapped to obligations |
| `compliance-framework/control-catalog.md` | Full control library using control schema |
| `risk-and-controls/enterprise-risk-register.md` | Risk entity instances |
| `audit-and-evidence/evidence-collection-engine.md` | Populates evidence records |
| `audit-and-evidence/finding-management.md` | Finding entity lifecycle |
| `governance-operations/compliance-operations-dashboard.md` | Aggregates model status for reporting |
