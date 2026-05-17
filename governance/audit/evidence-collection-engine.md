# Evidence Collection Engine

## Purpose
Automates and governs the collection of compliance evidence across all enterprise systems. Evidence is the foundation of every compliance claim — without current, reliable, independently verifiable evidence, compliance assertions are unsubstantiated. The evidence collection engine transforms compliance from a manual, point-in-time documentation exercise into a continuous, automated process where evidence is always current, correctly attributed, and audit-ready.

---

## Collection Architecture

```
Evidence Sources
├── Enterprise Systems (automated)
│   ├── Audit logs (zero-trust architecture)
│   ├── Configuration management databases
│   ├── Access control systems
│   ├── Encryption validation systems
│   ├── Agent registry and performance systems
│   └── Monitoring dashboards
├── Agent-Generated Evidence (automated)
│   ├── Control execution logs from agent operations
│   ├── AI governance oversight records
│   ├── Constitutional evaluation records
│   └── Human review gate logs
├── Human-Generated Evidence (manual)
│   ├── Attestations and sign-offs
│   ├── Meeting records and approvals
│   ├── Interview records
│   └── Physical observation records
└── Third-Party Evidence
    ├── Vendor certifications (SOC2, ISO27001)
    ├── Penetration test reports
    └── External audit opinions

        ↓

[Evidence Collection Engine]
├── [Collection Scheduling]      → what must be collected and when?
├── [Automated Collection]       → system queries, API extracts, log pulls
├── [Manual Collection Prompts]  → assign manual evidence collection tasks
├── [Evidence Validation]        → is collected evidence sufficient and reliable?
├── [Evidence Storage]           → store with hash-protection and retention tagging
└── [Evidence Index]             → make evidence findable by control, obligation, audit
```

---

## Automated Evidence Collection

```yaml
automated_collection:
  collection_methods:
    SYSTEM_QUERY:
      description: Direct database or API query returning a data extract
      examples:
        - SQL query on data store returning classification label coverage statistics
        - API call to access management system returning user access list
        - Query to encryption system verifying encryption status of all data records
      automation_level: FULLY_AUTOMATED
      evidence_format: structured report with timestamp, query_hash, result_count, anomalies
      frequency: per control test_frequency (continuous for CONTINUOUS controls)
    
    LOG_EXTRACT:
      description: Extract from system audit logs covering a specified time period
      examples:
        - extract access_denial events for time period
        - extract change management approval records
        - extract AI human review gate activations
      automation_level: FULLY_AUTOMATED
      evidence_format: log file with timestamp range, record count, hash of complete log extract
      frequency: per control; daily minimum for security logs
    
    CONFIGURATION_SNAPSHOT:
      description: Snapshot of system configuration settings demonstrating control implementation
      examples:
        - encryption configuration settings
        - firewall rule export
        - TLS version configuration
        - AI model deployment configuration with oversight settings
      automation_level: FULLY_AUTOMATED
      frequency: on change + weekly verification
      evidence_format: configuration dump with timestamp + comparison to prior snapshot
    
    MONITORING_DASHBOARD_CAPTURE:
      description: Automated capture of compliance monitoring dashboard states
      examples:
        - daily screenshot of orchestration-operations-dashboard metrics
        - compliance posture score time-series export
        - KRI status export
      automation_level: FULLY_AUTOMATED
      frequency: daily
    
    PERFORMANCE_METRIC_EXTRACT:
      description: Extract from agent-performance-tracker relevant to compliance controls
      examples:
        - constitutional evaluation completion rate (CTL-AI-004)
        - human review gate override rate (CTL-AI-004)
        - calibration error rate for GOVERNANCE agents (compliance indicator)
      automation_level: FULLY_AUTOMATED
      source: agent-performance-tracker.md metrics API
  
  collection_schedule:
    CONTINUOUS_CONTROLS: evidence collected hourly (summarized daily)
    DAILY_CONTROLS: evidence collected at 06:00 UTC
    WEEKLY_CONTROLS: evidence collected Sunday 06:00 UTC
    MONTHLY_CONTROLS: evidence collected first business day of month
    EVENT_TRIGGERED: evidence collected within 1 hour of triggering event
  
  collection_failure_handling:
    if_source_unavailable: retry 3× (5min, 15min, 45min); if all fail → alert compliance lead
    if_query_returns_anomalous_result: flag for human review; do not auto-suppress
    if_evidence_format_wrong: reject and re-collect; if persistent → escalate to control owner
```

---

## Manual Evidence Collection

```yaml
manual_collection:
  assignment_protocol:
    who_assigns: evidence collection engine (automated scheduling) or auditor
    who_collects: control owner or designated evidence collector (not the same person who will review)
    assignment_format: TASK_ASSIGNMENT message (inter-agent-messaging.md) with:
      - control_id and evidence required specification
      - collection deadline
      - evidence format requirements
      - submission instructions
  
  evidence_types_requiring_manual_collection:
    ATTESTATION:
      description: Formal declaration by responsible party that a requirement has been met
      format: structured attestation form with: date, attester ID, statement, signature
      use_when: certain controls where automated evidence is not available
      limitation: lowest reliability; must be corroborated by other evidence where possible
    
    INTERVIEW_RECORD:
      description: Record of structured interview with control owner or subject matter expert
      format: question-response document; interviewer and interviewee IDs; date; topics covered
      use_when: understanding control design; corroborating automated evidence
      limitation: inquiry alone insufficient per control-testing-engine.md RULE-ET-001
    
    OBSERVATION_RECORD:
      description: Record of direct observation of control execution
      format: observer ID, date/time, location, what was observed, outcome
      use_when: manual controls (approval meetings, physical reviews, access recertifications)
      independence: observer must not be the control operator
    
    DOCUMENT_COPY:
      description: Signed copies of approved policies, procedures, agreements, or decisions
      format: document + metadata (approved_by, approved_at, version, document_hash)
      use_when: policy approval evidence; contractual compliance evidence
    
    VENDOR_CERTIFICATION:
      description: Third-party certifications (SOC2 reports, ISO27001 certificates, pen test reports)
      format: certification document + validity period + relevant scope sections
      collection_SLA: collect from vendor within 30 days of certification renewal
      validity_check: confirm certification covers the period in question and relevant scope
  
  submission_standards:
    deadline_compliance: evidence submitted within assigned deadline (SLA: 5 business days for standard; 24h for urgent)
    format_compliance: matches the format specified in control catalog evidence_required
    completeness: covers the entire required period (no unexplained gaps)
    reviewer_assignment: evidence reviewer assigned at submission (must be independent of submitter)
  
  late_evidence_handling:
    7_days_overdue: reminder to control owner
    14_days_overdue: escalate to compliance governance lead; control marked AT_RISK
    30_days_overdue: MEDIUM finding generated; evidence collection SLA breach recorded
```

---

## Evidence Validation

```yaml
evidence_validation:
  automated_validation_checks:
    SCHEMA_CHECK: evidence format matches control catalog specification?
    PERIOD_CHECK: evidence covers required time period (no gaps > 20%)?
    HASH_CHECK: automated evidence hash matches expected hash (integrity)?
    COMPLETENESS_CHECK: population count within expected range?
    ANOMALY_CHECK: any unexpected values that indicate collection error?
  
  manual_validation_review:
    reviewer_assignment: all non-automated evidence requires independent reviewer
    reviewer_independence: enforced (cannot be submitter or control owner)
    review_SLA: 5 business days from evidence submission
    review_outcome:
      APPROVED: evidence meets all quality standards; marked APPROVED
      APPROVED_WITH_NOTES: evidence approved but reviewer notes limitations
      REJECTED: evidence does not meet standards; specific deficiency noted; re-collection required
      ESCALATED: reviewer has concerns requiring compliance lead review
  
  rejection_handling:
    rejection_reason_required: always; specific and actionable
    re_collection_window: 5 business days for manual evidence; 24 hours for automated
    repeat_rejection: if evidence rejected twice → finding generated; control owner notified
  
  evidence_quality_scoring:
    HIGH_reliability: automated + hash-protected + covers full period
    MEDIUM_reliability: manual + reviewer-approved + no anomalies + corroborated
    LOW_reliability: inquiry only; self-attestation uncorroborated; partial period coverage
    REJECTED: does not meet minimum standards; cannot be used for compliance assertion
```

---

## Evidence Storage and Retention

```yaml
evidence_storage:
  storage_principles:
    IMMUTABILITY: evidence cannot be modified after submission (hash-protected; append-only)
    INTEGRITY: hash chain linking evidence records (tamper detection)
    ACCESSIBILITY: retrievable within 24 hours for any audit or regulatory request
    RETENTION_TAGGING: every evidence record tagged with mandatory retention period
  
  evidence_record_components:
    evidence_id: "EVD-{control_id}-{seq}"
    control_id: string
    collection_timestamp: ISO-8601
    collection_method: string
    period_covered: {from, to}
    artifact_reference: URI to evidence artifact (stored separately)
    artifact_hash: SHA-256 of artifact
    collector_id: agent_id | system_id | human_id
    reviewer_id: agent_id | human_id | null
    quality_rating: HIGH | MEDIUM | LOW
    approved: boolean
    retention_until: ISO-8601
    legal_hold: boolean
  
  retention_periods:
    data_privacy_evidence (GDPR/CCPA): 7 years from collection
    security_evidence (ISO27001/SOC2): 7 years from collection
    AI_governance_evidence (EU_AI_Act): 10 years from system decommission
    financial_evidence (SOX): 7 years
    general_compliance_evidence: 5 years
    evidence_under_legal_hold: indefinite until hold lifted
  
  evidence_index:
    by_control_id: all evidence for a specific control
    by_obligation_id: all evidence demonstrating satisfaction of an obligation
    by_period: all evidence covering a specific time period
    by_audit_id: all evidence collected for a specific audit engagement
    by_regulatory_framework: all evidence for a specific framework (GDPR, SOC2, etc.)
```

---

## Evidence Request Management

```yaml
evidence_requests:
  internal_requests:
    source: audit-management-system.md (auditors); compliance-reporting-engine.md (reporting)
    SLA: standard evidence package available within 24 hours of request
    format: pre-organized package by control, obligation, or time period
  
  external_requests:
    source: external auditors; regulatory examiners
    SLA: 24-hour response to examiner requests (configured per pre-examination-preparation protocol)
    review: all evidence packages reviewed by legal counsel before delivery to regulators
    privilege_assessment: is any requested evidence covered by attorney-client privilege?
    logging: all external evidence requests and deliveries logged with timestamps
  
  evidence_package_assembly:
    inputs: [list of control_ids or obligation_ids, time period, requesting_entity]
    process:
      1. query evidence index for all matching evidence in period
      2. verify each piece of evidence is APPROVED quality
      3. organize by control/obligation/chronology per requester preference
      4. generate evidence manifest (table of contents with evidence_ids and hashes)
      5. compute package hash (integrity of the entire delivery package)
    output: evidence package with manifest + all evidence artifacts + package hash
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/control-catalog.md` | Evidence requirements per control |
| `risk-and-controls/control-testing-engine.md` | Evidence collected per test execution |
| `risk-and-controls/control-effectiveness-monitor.md` | Continuous evidence feeds effectiveness monitoring |
| `audit-and-evidence/audit-management-system.md` | Evidence collected per audit scope |
| `audit-and-evidence/audit-trail-governance.md` | Evidence integrity governed by audit trail policies |
| `coordination-operations/inter-agent-messaging.md` | TASK_ASSIGNMENT messages for manual evidence collection |
| `zero-trust architecture (enterprise-telemetry/)` | Primary source for automated log evidence |
