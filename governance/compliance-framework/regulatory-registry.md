# Regulatory Registry

## Purpose
The authoritative catalog of all regulations, standards, and frameworks applicable to the enterprise. The regulatory registry maps external requirements to internal obligations, tracks which regulatory bodies govern the enterprise, maintains awareness of regulatory change, and provides the authoritative source for all compliance obligation mapping.

---

## Registry Architecture

```
External Sources (regulatory bodies, standards bodies, legal counsel)
        ↓
[Regulatory Intake]      → new regulation or standard identified
[Applicability Analysis] → does this apply to this enterprise?
[Obligation Extraction]  → parse requirements into obligation records
[Control Gap Analysis]   → which obligations have no mapped control?
[Register Entry]         → write to regulatory registry
        ↓
[Regulatory Registry]    → authoritative source for all compliance work
[Obligation Index]       → regulation → obligation → control chain
[Change Alert System]    → notifies when regulations are updated
```

---

## Regulation Record Schema

```yaml
regulation_record:
  regulation_id: "REG-{jurisdiction}-{name}-{version}"
  
  identity:
    short_name: string              # e.g., "GDPR", "SOC2-Type2", "ISO27001:2022"
    full_name: string
    version: string
    effective_date: ISO-8601
    jurisdiction: [string]          # geographic applicability
    issuing_body: string            # e.g., "European Parliament", "AICPA", "ISO"
    regulation_type: LAW | STANDARD | FRAMEWORK | CONTRACTUAL | VOLUNTARY
  
  applicability:
    applies_to_this_enterprise: boolean
    applicability_basis: string     # why this applies (e.g., "processes EU resident data")
    applicability_confirmed_at: ISO-8601
    applicability_confirmed_by: agent_id | human_id
    applicable_org_units: [string | all]
    applicable_domains: [string]
    exemptions: [string | null]
  
  requirements:
    total_requirement_count: int
    mapped_obligation_count: int    # how many obligations have been extracted?
    coverage_percentage: float      # mapped/total
    unmapped_requirements: [string] # requirement refs not yet mapped to obligations
  
  obligations: [obligation_id]      # all obligations derived from this regulation
  
  enforcement:
    regulatory_body: string
    enforcement_mechanism: string
    penalty_framework: {
      max_fine: string | null
      penalty_basis: string        # e.g., "4% of global annual turnover"
      criminal_exposure: boolean
    }
    examination_frequency: ANNUAL | BI_ANNUAL | CONTINUOUS | COMPLAINT_DRIVEN | null
    last_examination: ISO-8601 | null
    next_examination: ISO-8601 | null
  
  change_tracking:
    current_version: string
    version_history: [{version, effective_date, summary_of_changes, impact_assessed: boolean}]
    pending_changes: [{change_description, expected_effective_date, impact_assessment: string | null}]
    last_verified_current: ISO-8601  # when was this confirmed to be the current version?
  
  governance:
    owner: agent_id | human_id     # who monitors this regulation for the enterprise
    legal_counsel_contact: string | null
    last_reviewed: ISO-8601
    next_review: ISO-8601
    notes: string
```

---

## Active Regulation Catalog

```yaml
active_regulations:
  DATA_PRIVACY:
    REG-EU-GDPR-2016/679:
      short_name: GDPR
      full_name: General Data Protection Regulation
      jurisdiction: [EU, EEA, and any org processing EU resident data]
      regulation_type: LAW
      key_obligations_count: 42
      penalty_framework: max(€20M, 4% global annual turnover)
      enforcement: Data Protection Authorities (per member state)
    
    REG-US-CCPA-2018:
      short_name: CCPA
      full_name: California Consumer Privacy Act
      jurisdiction: [California, US orgs processing CA resident data]
      regulation_type: LAW
      key_obligations_count: 18
      penalty_framework: $2,500–$7,500 per intentional violation
    
    REG-US-HIPAA-1996:
      short_name: HIPAA
      full_name: Health Insurance Portability and Accountability Act
      jurisdiction: [US, applies if handling Protected Health Information]
      regulation_type: LAW
      applicability: conditional (PHI handling required)
  
  INFORMATION_SECURITY:
    REG-INTL-ISO27001-2022:
      short_name: ISO27001:2022
      full_name: Information Security Management Systems
      jurisdiction: [global voluntary standard]
      regulation_type: STANDARD
      key_controls: 93 (Annex A)
      certification_body: Accredited Certification Bodies
    
    REG-US-SOC2-TYPE2:
      short_name: SOC2 Type II
      full_name: Service Organization Control 2 (Trust Service Criteria)
      jurisdiction: [US, widely accepted globally for SaaS/cloud]
      regulation_type: STANDARD
      trust_criteria: [Security, Availability, Processing Integrity, Confidentiality, Privacy]
      examination: Annual (independent auditor)
    
    REG-US-NIST-CSF-2:
      short_name: NIST CSF 2.0
      full_name: NIST Cybersecurity Framework 2.0
      jurisdiction: [US Federal, widely adopted voluntary]
      regulation_type: FRAMEWORK
      functions: [GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER]
  
  AI_GOVERNANCE:
    REG-EU-AIACT-2024:
      short_name: EU AI Act
      full_name: EU Artificial Intelligence Act
      effective_date: "2024-08-01"
      full_enforcement: "2026-08-02"
      jurisdiction: [EU, global orgs deploying AI to EU market]
      regulation_type: LAW
      risk_categories: [UNACCEPTABLE | HIGH | LIMITED | MINIMAL]
      key_obligations_count: 31
      penalty_framework: max(€35M, 7% global annual turnover) for unacceptable risk violations
      highest_priority: true  # enterprise AI systems are directly subject to this
    
    REG-INTL-ISO42001-2023:
      short_name: ISO42001:2023
      full_name: Artificial Intelligence Management System
      jurisdiction: [global voluntary standard]
      regulation_type: STANDARD
      focus: AI management system, responsible AI, risk-based approach
  
  FINANCIAL:
    REG-INTL-IFRS-VARIOUS:
      short_name: IFRS
      full_name: International Financial Reporting Standards
      jurisdiction: [150+ countries]
      regulation_type: STANDARD
      applicability: conditional (if publicly listed or required by jurisdiction)
    
    REG-US-SOX-2002:
      short_name: SOX
      full_name: Sarbanes-Oxley Act
      jurisdiction: [US-listed companies]
      regulation_type: LAW
      applicability: conditional (public company or public company subsidiary)
  
  OPERATIONAL:
    REG-INTL-ISO9001-2015:
      short_name: ISO9001:2015
      full_name: Quality Management Systems
      jurisdiction: [global voluntary standard]
      regulation_type: STANDARD
    
    REG-INTL-BCBS-239:
      short_name: BCBS 239
      full_name: Principles for Effective Risk Data Aggregation (Banking)
      jurisdiction: [global banking institutions]
      regulation_type: STANDARD
      applicability: conditional (banking sector only)
```

---

## Obligation Extraction Protocol

```yaml
obligation_extraction:
  trigger: new regulation added OR regulation version updated
  
  step_1_document_review:
    action: parse regulation text into discrete requirement statements
    method: structured clause-by-clause extraction
    output: raw_requirement_list with source_ref per item
  
  step_2_obligation_creation:
    action: for each discrete requirement, create obligation record
    determination: is this MANDATORY | CONDITIONAL | BEST_PRACTICE?
    determination: what org units, domains, capabilities does this apply to?
    determination: is there an existing control that may satisfy this?
  
  step_3_gap_analysis:
    action: for each obligation, check control_catalog for mapped controls
    output: FULLY_COVERED | PARTIALLY_COVERED | GAP
    gap_report: list of new obligations with no covering controls → risk register entry
  
  step_4_owner_assignment:
    action: assign obligation owner (responsible compliance domain lead)
    SLA: owner assignment within 5 business days of new obligation creation
  
  step_5_review_and_approval:
    reviewer: compliance governance lead
    action: verify extraction is complete and accurate
    approval: marks obligation extraction COMPLETE for this regulation version
```

---

## Framework Cross-Mapping

```yaml
framework_crosswalk:
  purpose: map controls that satisfy multiple frameworks simultaneously
  
  example_crosswalk:
    control_id: CTL-SEC-047 (encryption at rest)
    satisfies:
      - GDPR Article 32(1)(a): appropriate technical measures
      - ISO27001:2022 A.8.24: use of cryptography
      - SOC2 CC6.1: logical access controls
      - NIST CSF PR.DS-1: data-at-rest protection
      - EU AI Act Article 15(3): technical robustness
  
  crosswalk_value:
    avoids duplicate controls for same requirement
    enables single evidence record to satisfy multiple frameworks
    identifies controls with high regulatory leverage (one control → many obligations)
    enables impact analysis when a control fails (which obligations are now at risk?)
```

---

## Regulatory Change Alert System

```yaml
change_alert_system:
  monitoring_sources:
    - regulatory body official publications
    - legal counsel notifications
    - industry association alerts
    - AI governance tracking services (for EU AI Act, ISO42001)
  
  alert_types:
    NEW_REGULATION: new applicable regulation identified
    MAJOR_VERSION_CHANGE: substantial update to existing regulation
    ENFORCEMENT_GUIDANCE_UPDATE: regulatory body clarifies interpretation
    PENALTY_CHANGE: enforcement or penalty framework changed
    EXAMINATION_SCHEDULED: upcoming regulatory examination
  
  alert_routing:
    all_alerts: compliance governance lead
    AI_GOVERNANCE alerts: also to AI governance lead and Tier-4+
    FINANCIAL alerts: also to CFO function
    HIGH_SEVERITY alerts: Tier-4+ notification within 24 hours
  
  change_response_SLA:
    NEW_REGULATION: impact assessment within 30 days; obligations extracted within 60 days
    MAJOR_VERSION_CHANGE: impact assessment within 15 days; obligations updated within 30 days
    ENFORCEMENT_GUIDANCE: review and update obligations within 21 days
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/compliance-model.md` | Obligation schema used for all extracted obligations |
| `compliance-framework/control-catalog.md` | Controls mapped to obligations via framework crosswalk |
| `risk-and-controls/enterprise-risk-register.md` | Obligation gaps become risk entries |
| `governance-operations/regulatory-change-management.md` | Change alert system feeds into change management |
| `audit-and-evidence/compliance-reporting-engine.md` | Regulation records used in regulatory reports |
| `governance-operations/governance-executive-reporting.md` | Regulatory landscape summary for board |
