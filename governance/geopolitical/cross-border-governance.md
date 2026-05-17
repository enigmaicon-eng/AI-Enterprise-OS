# Cross-Border Governance
**ID:** GPG-CBG-001 | **Tier:** T4 | **Class:** ELEVATED
**Owner:** Legal Org + Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Defines the governance framework for all operations that cross national or jurisdictional boundaries within the Enterprise AI OS. Cross-border governance establishes which data may flow between jurisdictions, what legal mechanisms must be in place, what authorization is required, how conflicts between jurisdictions are resolved, and how the OS maintains audit evidence of legal compliance for every cross-border operation. No agent, workflow, or data transfer may cross a sovereign boundary without passing through this framework.

---

## Cross-Border Operation Taxonomy

```yaml
cross_border_operation_types:

  DATA_TRANSFER:
    description: Moving personal or regulated data from one jurisdiction to another
    examples: [customer record replication, audit log export, model training data]
    risk_tier: HIGH
    default_authorization: T4
    legal_mechanism_required: true
    
  COGNITIVE_DELEGATION:
    description: Delegating reasoning or computation to an agent in a different jurisdiction
    examples: [EU agent delegating analysis task to US agent, CN agent calling global orchestrator]
    risk_tier: MEDIUM
    default_authorization: T3
    legal_mechanism_required: true  # data passed in delegation payload may be personal
    
  REGULATORY_REPORTING:
    description: Producing reports for regulators in a different jurisdiction from where data resides
    examples: [EU regulator requesting CN-resident data, SEC audit of EU-hosted financial data]
    risk_tier: HIGH
    default_authorization: T4 + Legal Org
    legal_mechanism_required: true
    
  FEDERATED_INFERENCE:
    description: Running inference across data that remains in multiple jurisdictions
    examples: [global churn model trained on region-resident data without centralizing it]
    risk_tier: MEDIUM
    default_authorization: T3
    legal_mechanism_required: true
    
  ORCHESTRATION_COMMAND:
    description: Sending workflow orchestration signals across jurisdictions
    examples: [global orchestrator triggering CN-region agent, EU orchestrator receiving US webhook]
    risk_tier: LOW  # commands contain no personal data
    default_authorization: T2
    legal_mechanism_required: false  # if no personal data in payload
    
  EMERGENCY_ACCESS:
    description: Cross-border access required for incident response
    examples: [CN region outage requiring US agents to serve CN customers temporarily]
    risk_tier: HIGH
    default_authorization: T4 + Legal Org (expedited)
    legal_mechanism_required: true  # emergency SCCs or consent
    ttl: 24 hours maximum
```

---

## Legal Transfer Mechanism Registry

```yaml
transfer_mechanism_registry:

  ADEQUACY_DECISION:
    applicable_pairs:
      - [JUR-EU, JUR-GB]              # UK adequacy (post-Brexit)
      - [JUR-EU, JUR-SG]              # if future adequacy granted
    verification: daily (adequacy decisions can be revoked)
    no_additional_authorization_needed: true
    monitoring: automated adequacy status check every 24h
    on_revocation: IMMEDIATE_SUSPEND all transfers; alert T4 + Legal
    
  STANDARD_CONTRACTUAL_CLAUSES:
    name: SCCs (EU) / IDTAs (UK)
    applicable_pairs:
      - [JUR-EU, JUR-US]
      - [JUR-EU, JUR-IN]
      - [JUR-GB, JUR-US]
      - [JUR-GB, JUR-IN]
    authorization_required: T3 (initial setup); T2 (subsequent transfers under active SCCs)
    review_frequency: annual
    transfer_impact_assessment_required: true
    
  BINDING_CORPORATE_RULES:
    name: BCRs
    applicable: intra-enterprise transfers only
    authorization_required: T4 (BCR approval is a one-time enterprise-level authorization)
    coverage: all EU→non-EU transfers within approved enterprise scope
    review_frequency: annual
    
  CAC_SECURITY_ASSESSMENT:
    name: China CAC Cross-Border Security Assessment
    applicable_pairs: [[JUR-CN, any]]
    triggers:
      - personal data of > 1 million individuals
      - important data export
      - critical information infrastructure data
    authorization_required: T4 + Legal + CAC filing
    processing_time: 45–90 days
    validity: 2 years
    
  CAC_STANDARD_CONTRACT:
    name: China Standard Contract (PIPL Art.38)
    applicable_pairs: [[JUR-CN, any]]  # when CAC assessment not triggered
    authorization_required: T3 + Legal
    filing_required: true (file with CAC within 10 days of execution)
    validity: per contract term
    
  CONSENT_MECHANISM:
    applicable: when data subject gives explicit consent to cross-border transfer
    authorization_required: T2 (consent verified)
    limitations: cannot use consent for systematic/bulk transfers; individual basis only
    withdrawal_handling: immediate cessation of transfer; data recall where feasible
```

---

## Cross-Border Authorization Workflow

```
authorize_cross_border_operation(operation_type, source_jurisdiction, target_jurisdiction, payload_description):

  1. Check if operation type requires legal mechanism:
     if not required: proceed with standard T2 authorization
     
  2. Identify applicable transfer mechanism:
     mechanisms = lookup_mechanisms(source_jurisdiction, target_jurisdiction)
     if NO mechanisms: BLOCK; notify Legal — no legal pathway exists
     
  3. Verify mechanism is active and valid:
     for each mechanism in mechanisms:
       status = verify_mechanism_status(mechanism)
       if status == ACTIVE: selected_mechanism = mechanism; break
       if status == REVOKED: log MECHANISM_REVOKED; skip
     if no ACTIVE mechanism: BLOCK; alert T4 + Legal
     
  4. Authorization:
     required_authority = max(
       operation_type.default_authorization,
       selected_mechanism.authorization_required
     )
     verify requester has required_authority
     
  5. Document operation:
     operation_record = {
       operation_id: CBX-{NNN},
       operation_type, source_jurisdiction, target_jurisdiction,
       payload_description, selected_mechanism,
       authorized_by, authorized_at,
       transfer_impact_assessment_ref: string | null,
       valid_until: ISO8601
     }
     register in cross-border operations log
     
  6. Issue cross-border permit:
     permit = cross_border_permit(
       operation_record,
       authorized_scope = payload_description,
       expires_at = now() + operation_type_ttl
     )
     
  Return: permit_id (required for every operation under this authorization)
```

---

## Transfer Impact Assessment (TIA)

Required for SCCs and where transfer mechanism requires adequacy verification:

```yaml
transfer_impact_assessment:
  tia_id: TIA-{NNN}
  
  transfer_context:
    source_jurisdiction: JUR-{XX}
    target_jurisdiction: JUR-{XX}
    data_categories: [string]
    estimated_data_subjects: number
    transfer_frequency: ONE_TIME | RECURRING
    
  legal_analysis:
    target_country_law_assessment: string  # can third-party access override the mechanism?
    surveillance_risk: LOW | MEDIUM | HIGH | CRITICAL
    legal_redress_availability: boolean   # can data subjects exercise rights?
    
  supplementary_measures:
    technical: [string]                   # encryption, pseudonymization, etc.
    contractual: [string]                 # additional contractual protections
    organizational: [string]              # access controls, training, etc.
    
  conclusion: TRANSFER_SAFE | TRANSFER_WITH_MEASURES | TRANSFER_NOT_SAFE
  
  approved_by: Legal Org + T4
  valid_until: ISO8601 (annual review)
```

---

## Emergency Cross-Border Access Protocol

```
emergency_cross_border_access(incident_id, source_jurisdiction, target_jurisdiction, justification):

  1. Verify incident severity: P0 or P1 required for emergency cross-border
  2. T4 + Legal Org on-call approval (expedited; target: 30-minute decision)
  3. Issue emergency permit (TTL: 24 hours maximum)
  4. Scope: minimum necessary data for incident resolution
  5. Continuous monitoring: every 4 hours of active emergency access
  6. Post-emergency: within 48 hours
     - full data recall where feasible
     - TIA for any personal data accessed
     - Legal Org files required notifications to supervisory authorities
  7. Audit: permanent record of all emergency cross-border events
```

---

## Cross-Border Governance Dashboard

```
CROSS-BORDER GOVERNANCE STATUS
────────────────────────────────────────────────────────────
Active Transfer Mechanisms:    {count}
  ADEQUACY:                    {count}  [{EU-GB: ACTIVE | SUSPENDED}]
  SCCs:                        {count}
  BCRs:                        {count}
  CAC ASSESSMENTS:             {count}
  
Active Cross-Border Permits:   {count}
  Expiring in < 24h:           {count}  ← renew
  
Pending TIAs:                  {count}  ← Legal action required
Mechanism Renewals Due:        {count}
  
Recent Operations (7 days):
  DATA_TRANSFER:               {count}
  COGNITIVE_DELEGATION:        {count}
  REGULATORY_REPORTING:        {count}
  EMERGENCY_ACCESS:            {count}  ← flag for review if > 0
  BLOCKED (no mechanism):      {count}  ← investigate
────────────────────────────────────────────────────────────
```

---

## Integration

```
Feeds into:
  regulatory-conflict-arbitration.md — conflict resolution mechanisms registered here
  jurisdiction-aware-orchestration.md — cross-border permits checked at orchestration time
  cross-region-federation-controls.md — federation operations require cross-border permits

Receives from:
  regional-policy-enforcement.md — policy changes may affect mechanism validity
  sovereign-execution-zones.md — zone boundaries define what is cross-border
  legal-memory-partitioning.md — partition gateway invokes cross-border authorization
```

---

## Governance

**No cross-border without mechanism:** Any cross-border data transfer without an active legal mechanism is a CRITICAL compliance event; immediate T4 + Legal alert  
**Adequacy daily check:** Automated; adequacy revocation triggers immediate suspension of all transfers relying on it  
**TIA currency:** TIAs expire annually; cross-border permits auto-suspend if their TIA expires  
**Emergency access:** Hard 24-hour TTL; no extension; new authorization required after expiry  
**Audit:** All cross-border operations to `memory/geopolitical-governance/cross-border-log.jsonl`; permanent retention; jurisdiction-scoped copies
