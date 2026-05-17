# Knowledge Compliance System

## Purpose
Ensures the knowledge management system operates within governance, regulatory, and policy constraints. Governs who can create, modify, access, and delete knowledge; enforces retention and audit requirements; validates that knowledge used in decisions meets quality and provenance standards; and detects when the knowledge system itself is out of compliance.

---

## Compliance Domains

```yaml
compliance_domains:
  ACCESS_COMPLIANCE:
    description: Knowledge is only accessible to authorized principals
    rules:
      - CONFIDENTIAL units must never appear in standard search indexes
      - RESTRICTED units must be encrypted at rest
      - Access-level changes require Tier-3+ authorization
      - All CONFIDENTIAL unit accesses must be logged with ENHANCED audit
  
  PROVENANCE_COMPLIANCE:
    description: All knowledge has documented, verifiable origin
    rules:
      - All ACTIVE units must have provenance.origin_type set
      - All ACTIVE units must have at least one origin_ref or contributing_agent
      - POLICY_KNOWLEDGE units must reference a governing policy_id
      - Synthesized units must have DERIVED_FROM relationships to all source units
  
  QUALITY_COMPLIANCE:
    description: Published knowledge meets minimum quality standards
    rules:
      - No unit may enter ACTIVE status with overall_quality < 0.50
      - Units with accuracy_score < 0.40 must be in REVIEW or CONTESTED (not ACTIVE)
      - All ACTIVE POLICY_KNOWLEDGE must have evidence_strength >= VALIDATED
      - Poor-quality units (< 0.35) not improved within 60 days must be DEPRECATED or ARCHIVED
  
  OWNERSHIP_COMPLIANCE:
    description: All knowledge has accountable owners
    rules:
      - All ACTIVE units must have governance.owner assigned
      - Orphaned units (no owner > 14 days) trigger compliance breach
      - All ACTIVE units with quality >= 0.70 must have review_schedule set
      - Units overdue_for_review > 90 days trigger compliance breach
  
  RETENTION_COMPLIANCE:
    description: Knowledge is retained as required by regulation and policy
    rules:
      - Knowledge units may never be physically deleted (archive only)
      - INCIDENT_KNOWLEDGE units must be retained for minimum 7 years
      - GOVERNANCE and POLICY_KNOWLEDGE must be retained for minimum 10 years
      - Version archive is immutable; no version may be altered or deleted
      - Audit logs for all knowledge operations must be retained for 3 years
  
  CITATION_COMPLIANCE:
    description: Decisions and workflows cite the knowledge they relied on
    rules:
      - All Tier-3+ approval decisions must cite at least one KU if relevant knowledge exists
      - Constitutional evaluations must cite the applicable policy KU
      - Incident postmortems must cite prevention KUs used in action planning
      - Uncited knowledge application is a compliance gap (not a breach, but tracked)
```

---

## Compliance Rule Engine

```yaml
rule_engine:
  evaluation_schedule:
    real_time: access_compliance rules evaluated on every retrieval request
    continuous: provenance_compliance checked on every KU create/update
    daily: quality_compliance and ownership_compliance full scan
    weekly: retention_compliance check and citation_compliance analysis
    monthly: full compliance report generation
  
  rule_schema:
    rule_id: "KC-{domain}-{seq}"       # e.g., KC-ACCESS-001
    name: string
    domain: [compliance_domains]
    description: string
    CEL_expression: string             # evaluates against KU or system state
    severity: CRITICAL | HIGH | MEDIUM | LOW
    
    on_breach:
      CRITICAL: immediate alert to knowledge-governance-lead + auto-protective-action
      HIGH: alert within 1 hour to domain_steward; remediation within 7 days
      MEDIUM: daily digest to knowledge-governance-lead; remediation within 30 days
      LOW: weekly report; tracked but not escalated
  
  rule_catalog:
    KC-ACCESS-001:
      name: CONFIDENTIAL Unit in Standard Index
      CEL: unit.status == 'ACTIVE' && unit.governance.access_level == 'CONFIDENTIAL' && unit.in_standard_index
      severity: CRITICAL
      auto_action: remove from index immediately; alert
    
    KC-PROV-001:
      name: ACTIVE Unit Missing Provenance
      CEL: unit.status == 'ACTIVE' && unit.provenance.origin_type == null
      severity: HIGH
    
    KC-QUAL-001:
      name: ACTIVE Unit Below Quality Gate
      CEL: unit.status == 'ACTIVE' && unit.quality.overall_quality < 0.50
      severity: HIGH
    
    KC-OWN-001:
      name: Orphaned Active Unit
      CEL: unit.status == 'ACTIVE' && unit.governance.owner == null && age_days(unit.created_at) > 14
      severity: HIGH
    
    KC-RET-001:
      name: Version Archive Modification Detected
      CEL: version_archive.mutation_detected == true
      severity: CRITICAL
      auto_action: halt; alert; forensic investigation
    
    KC-OWN-002:
      name: Overdue Review — Compliance Threshold
      CEL: unit.status == 'ACTIVE' && days_overdue(unit.lifecycle.next_review) > 90
      severity: MEDIUM
    
    KC-QUAL-002:
      name: Poor Quality Unit Not Remediated
      CEL: unit.status == 'ACTIVE' && unit.quality.overall_quality < 0.35 && age_since_poor(unit) > 60
      severity: HIGH
    
    KC-PROV-002:
      name: Policy KU Without Policy Reference
      CEL: unit.knowledge_type == 'POLICY_KNOWLEDGE' && unit.status == 'ACTIVE' && unit.provenance.origin_refs == []
      severity: MEDIUM
```

---

## Compliance Scoring

```yaml
compliance_scoring:
  portfolio_compliance_score: 0.0–1.0
  
  calculation:
    access_compliance_score:     weight 0.30 (highest weight; access failures are most severe)
    provenance_compliance_score: weight 0.20
    quality_compliance_score:    weight 0.20
    ownership_compliance_score:  weight 0.20
    retention_compliance_score:  weight 0.10
  
  per_dimension_score:
    formula: 1.0 - (breach_count_weighted / total_active_units)
    breach_weights: {CRITICAL: 10, HIGH: 5, MEDIUM: 2, LOW: 1}
  
  hard_caps:
    any_CRITICAL_access_breach_unresolved: portfolio_score capped at 0.20
    version_archive_mutation: portfolio_score capped at 0.10 (forensic mode)
  
  thresholds:
    GREEN: >= 0.90
    YELLOW: >= 0.75
    ORANGE: >= 0.60
    RED: < 0.60 → immediate escalation to Tier-4+
```

---

## Compliance Audit Trail

```yaml
compliance_audit:
  audit_events:
    KU_ACCESSED:
      log: {caller_id, unit_id, access_level, timestamp, access_granted}
      retention: 3 years
      enhanced: for CONFIDENTIAL units → include full request context
    
    KU_CREATED:
      log: {creator, unit_id, initial_access_level, provenance_type}
    
    KU_ACCESS_LEVEL_CHANGED:
      log: {changed_by, unit_id, old_level, new_level, authorization}
      requires: Tier-3+ authorization + audit record
    
    KU_DEPRECATED:
      log: {deprecated_by, unit_id, reason, superseded_by}
    
    KU_ARCHIVED:
      log: {archived_by, unit_id, reason, tier_authorization}
    
    COMPLIANCE_BREACH_DETECTED:
      log: {rule_id, unit_id, detected_at, severity, auto_action_taken}
    
    COMPLIANCE_BREACH_RESOLVED:
      log: {rule_id, unit_id, resolved_at, resolved_by, resolution_method}
  
  audit_integrity:
    hash_chain: all audit events are hash-chained (SHA-256)
    tampering_detection: daily integrity verification run
    immutability: audit logs may not be deleted or altered; append-only store
```

---

## Compliance Reporting

```yaml
compliance_reporting:
  daily_alert: CRITICAL and HIGH breaches → immediate notification to knowledge-governance-lead
  
  weekly_compliance_digest:
    content:
      - new breaches detected (by severity)
      - breaches resolved this week
      - overdue remediation items
      - compliance score trend
    recipient: knowledge-governance-lead + domain_stewards
  
  monthly_compliance_report:
    content:
      - portfolio compliance score by dimension
      - breach inventory (open + resolved)
      - retention compliance status (all categories)
      - audit trail integrity check result
      - exception log (authorized deviations)
    recipient: Tier-3+ leadership
  
  quarterly_regulatory_report:
    content:
      - full compliance posture for regulated knowledge categories
      - retention coverage (which KU categories meet regulatory retention requirements)
      - access audit summary for RESTRICTED and CONFIDENTIAL units
    recipient: compliance team + Tier-4+
    format: structured JSON + PDF summary
```

---

## Compliance Exceptions

```yaml
compliance_exceptions:
  exception_types:
    TEMPORARY_QUALITY_WAIVER:
      allows: ACTIVE unit below quality gate for defined period
      requires: Tier-3+ approval + remediation plan + expiry date (max 60 days)
    
    RETENTION_WAIVER:
      allows: shorter retention period for specific unit category
      requires: Tier-4+ approval + legal review + max 1 year
    
    ACCESS_LEVEL_ESCALATION:
      allows: temporary broader access to RESTRICTED/CONFIDENTIAL units
      requires: Tier-4+ dual approval + 24h expiry maximum + ENHANCED audit
  
  exception_record:
    granted_by: agent-id (tier requirement per type)
    granted_at: ISO-8601
    expires_at: ISO-8601
    unit_ids: [unit_id]
    justification: string
    compliance_rule_waived: rule_id
  
  exception_audit: all exceptions logged; included in monthly compliance report
  automatic_revocation: exceptions expire automatically; cannot be renewed without new approval
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-base/knowledge-repository.md` | Access control enforcement |
| `knowledge-base/knowledge-model.md` | Schema compliance (field requirements) |
| `knowledge-governance/knowledge-accuracy-monitor.md` | Accuracy compliance signals |
| `knowledge-governance/knowledge-ownership-system.md` | Ownership compliance |
| `knowledge-governance/knowledge-operations-dashboard.md` | Compliance health display |
| `process-governance/workflow-compliance-system.md` | Citation compliance (decisions citing KUs) |
| `decision-models/decision-audit-trail.md` | Compliance audit trail integrity |
