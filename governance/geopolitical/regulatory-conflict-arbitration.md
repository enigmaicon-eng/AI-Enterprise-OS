# Regulatory Conflict Arbitration
**ID:** GPG-RCA-001 | **Tier:** T4 | **Class:** ELEVATED
**Owner:** Legal Org + Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Resolves conflicts that arise when two or more sovereign jurisdictions impose incompatible legal requirements on the same Enterprise AI OS operation. When an agent, workflow, or data element simultaneously falls under the authority of multiple legal regimes that issue contradictory mandates — one requiring disclosure, another prohibiting it; one mandating retention, another ordering deletion — the regulatory conflict arbitration system provides a structured decision framework, escalates to human legal authority, and documents the resolution for regulatory defensibility.

**Core principle:** When jurisdictions conflict, the OS never silently chooses one over the other. Every conflict is surfaced, documented, and resolved with human legal authority.

---

## Conflict Taxonomy

```yaml
conflict_types:

  RETENTION_vs_ERASURE:
    description: One jurisdiction requires retention (e.g., SOX 7 years), another requires deletion (e.g., GDPR Art.17)
    example: US financial record vs. EU customer's right to erasure
    frequency: HIGH
    default_resolution: LEGAL_HOLD_WITH_ACCESS_RESTRICTION
    
  DISCLOSURE_vs_CONFIDENTIALITY:
    description: One jurisdiction requires disclosure to authorities, another prohibits it
    example: US CLOUD Act government order vs. GDPR cross-border transfer restrictions
    frequency: MEDIUM
    default_resolution: LEGAL_COUNSEL_REQUIRED; no automatic resolution
    
  DATA_LOCALIZATION_vs_TRANSFER_MANDATE:
    description: One jurisdiction requires data to stay local, another requires it to be shared
    example: CN data localization vs. US regulator demanding CN-resident records
    frequency: MEDIUM
    default_resolution: SOVEREIGN_PRIORITY_RULE; data subject's primary jurisdiction prevails
    
  CONSENT_vs_LEGAL_OBLIGATION:
    description: Processing requires consent in one jurisdiction but is mandated by law in another
    example: GDPR consent requirement vs. AML mandatory reporting obligation
    frequency: HIGH
    default_resolution: LEGAL_OBLIGATION_PREVAILS (Art.6(1)(c) GDPR)
    
  AI_PROHIBITION_vs_AI_MANDATE:
    description: One jurisdiction prohibits an AI practice, another mandates it
    example: EU AI Act prohibited practice vs. national security mandate in another jurisdiction
    frequency: LOW
    default_resolution: PROHIBITION_PREVAILS; constitutional principles always applied
    
  ALGORITHMIC_TRANSPARENCY_vs_TRADE_SECRET:
    description: Transparency regulation requires explanation of algorithm; IP law protects it
    example: EU AI Act explanation requirements vs. proprietary model protection
    frequency: MEDIUM
    default_resolution: FUNCTIONAL_EXPLANATION (explain effect without revealing method)
    
  DELETION_IRRECONCILABLE:
    description: Both jurisdictions require opposite actions and neither can be satisfied simultaneously
    frequency: LOW
    default_resolution: ESCALATE_T5 + EXTERNAL_LEGAL; no automated resolution
```

---

## Conflict Detection Engine

```
detect_regulatory_conflict(operation, jurisdictions_applicable):

  conflicts = []
  
  for each pair (jur_a, jur_b) in combinations(jurisdictions_applicable, 2):
    
    # Get policies for this operation from each jurisdiction
    policies_a = policy_catalog.get_applicable(jur_a, operation)
    policies_b = policy_catalog.get_applicable(jur_b, operation)
    
    # Check for direct contradictions
    for pol_a in policies_a:
      for pol_b in policies_b:
        if contradicts(pol_a, pol_b):
          conflict = RegulatoryConflict {
            conflict_id: CONF-{NNN},
            conflict_type: classify_conflict_type(pol_a, pol_b),
            jurisdiction_a: jur_a,
            policy_a: pol_a,
            jurisdiction_b: jur_b,
            policy_b: pol_b,
            operation: operation,
            detected_at: ISO8601
          }
          conflicts.append(conflict)
          
  if len(conflicts) > 0:
    BLOCK operation pending conflict resolution
    route_to_arbitration(conflicts)
    
  Return: conflicts (empty = no conflict detected; proceed)
```

---

## Arbitration Decision Framework

```
arbitrate_conflict(conflict) → ArbitrationDecision:

  # Step 1: Apply pre-registered resolutions (known conflicts)
  known_resolution = lookup_known_resolution(
    conflict.jurisdiction_a, conflict.jurisdiction_b, conflict.conflict_type
  )
  if known_resolution.status == ACTIVE:
    log KNOWN_RESOLUTION_APPLIED
    return known_resolution.decision
    
  # Step 2: Apply conflict resolution rules (hierarchy)
  resolution = apply_resolution_rules(conflict):
  
    Rule 1 — Constitutional Override:
      if either policy is OS constitutional (C001-C012): constitutional principle prevails
      if conflict is AI_PROHIBITION: prohibition prevails universally
      
    Rule 2 — Prohibition Over Permission:
      if one jurisdiction prohibits, the other merely permits (not mandates):
        prohibition prevails
        
    Rule 3 — Legal Obligation Over Consent:
      if one jurisdiction imposes legal obligation, other requires consent:
        legal obligation prevails (GDPR Art.6(1)(c) basis)
        document: consent-based jurisdiction is notified of legal obligation override
        
    Rule 4 — Data Subject Primary Jurisdiction:
      for personal data conflicts: data subject's home jurisdiction prevails
      
    Rule 5 — Minimum Disclosure Principle:
      when both jurisdictions require action but scope differs:
        execute minimum action that satisfies both
        
    Rule 6 — Time-Sensitive Obligation:
      if one policy has a hard legal deadline (e.g., 72-hour breach notification):
        time-critical obligation takes precedence; satisfy it; address other afterwards
        
    Rule 7 — No Rule Applies:
      if none of the above resolve:
        ESCALATE to Human Legal Authority
        
  # Step 3: Human Legal Authority Escalation (if needed)
  if resolution.status == REQUIRES_HUMAN:
    escalate_to_legal(conflict, resolution.reason)
    BLOCK operation until human resolution received
    SLA: 24 hours for CRITICAL conflicts; 72 hours for HIGH; 7 days for MEDIUM
    
  # Step 4: Register resolution
  register_known_resolution(conflict.conflict_type, conflict.jurisdiction_a, conflict.jurisdiction_b, resolution)
  
  Return: ArbitrationDecision
```

---

## Known Conflict Resolution Registry

Pre-registered resolutions for frequently occurring conflicts:

```yaml
known_resolutions:

  RES-001:
    conflict_type: RETENTION_vs_ERASURE
    jurisdiction_a: JUR-US (SOX)
    jurisdiction_b: JUR-EU (GDPR)
    resolution: LEGAL_HOLD_WITH_ACCESS_RESTRICTION
    detail: >
      Retain data under legal hold to satisfy SOX. Apply GDPR access restriction:
      data subject's data held but inaccessible for marketing/profiling purposes.
      Financial function retains for 7 years; all other uses stopped immediately.
      Legal hold documented; data subject notified of legal obligation limitation on erasure.
    authority: T4 + Legal Org
    valid_from: 2026-01-01
    
  RES-002:
    conflict_type: CONSENT_vs_LEGAL_OBLIGATION
    jurisdiction_a: JUR-EU (GDPR consent required)
    jurisdiction_b: JUR-US (AML/KYC mandatory reporting)
    resolution: LEGAL_OBLIGATION_PREVAILS
    detail: >
      AML/KYC mandatory reporting is a legal obligation under Art.6(1)(c) GDPR.
      Consent not required when legal obligation exists. Document legal basis.
      Notify data subject that processing occurs under legal obligation (Art.13/14 GDPR).
    authority: T3
    valid_from: 2026-01-01
    
  RES-003:
    conflict_type: ALGORITHMIC_TRANSPARENCY_vs_TRADE_SECRET
    jurisdiction_a: JUR-EU (EU AI Act explanation requirements)
    jurisdiction_b: ALL (IP protection)
    resolution: FUNCTIONAL_EXPLANATION
    detail: >
      Provide explanation of: inputs used, factors considered, effect of decision,
      means to contest. Do not expose: model weights, training data, proprietary logic.
      EU AI Act satisfied by functional explanation (Art.13); trade secret protected.
    authority: T3
    valid_from: 2026-01-01
    
  RES-004:
    conflict_type: DATA_LOCALIZATION_vs_TRANSFER_MANDATE
    jurisdiction_a: JUR-CN (PIPL/DSL data localization)
    jurisdiction_b: JUR-US (CLOUD Act / regulatory subpoena)
    resolution: LEGAL_COUNSEL_REQUIRED
    detail: >
      No automatic resolution. CN data localization and US government access demands
      create irreconcilable conflict. Requires external legal counsel + T5 decision.
      During arbitration: preserve CN-resident data in place; DO NOT transfer;
      respond to US authority that legal proceedings are underway.
    authority: T5 + External Legal Counsel
    valid_from: 2026-01-01
```

---

## Arbitration Decision Schema

```yaml
arbitration_decision:
  decision_id: ARB-{NNN}
  conflict_id: CONF-{NNN}
  
  conflict_summary:
    conflict_type: string
    jurisdictions_involved: [JUR-{XX}]
    operation_affected: string
    
  resolution:
    resolution_type: KNOWN_RESOLUTION | RULE_APPLIED | HUMAN_DECISION
    resolution_summary: string
    action_required: [string]
    action_prohibited: [string]
    
  authority:
    decided_by: string
    authority_level: T3 | T4 | T5
    legal_counsel_consulted: boolean
    
  defensibility:
    legal_basis: [string]
    documentation_ref: [string]
    
  notifications_required: [string]     # regulators, data subjects to notify
  monitoring_required: string          # how to verify resolution remains valid
  
  valid_from: ISO8601
  review_due: ISO8601                  # annual review; resolutions are not permanent
  
  registered_as_known_resolution: boolean
```

---

## Regulatory Authority Notification

Some conflict resolutions require notifying supervisory authorities:

```yaml
notification_requirements:
  DISCLOSURE_vs_CONFIDENTIALITY_resolved:
    notify: EDPB_contact (if EU data), ICO (if GB data)
    timeline: within 72 hours
    format: standard supervisory authority communication
    authority: Legal Org + T4
    
  RETENTION_vs_ERASURE_legal_hold:
    notify: data_subject (that erasure is limited by legal obligation)
    timeline: within 30 days
    format: Art.19 GDPR notification template
    
  IRRECONCILABLE_conflict:
    notify: relevant supervisory authorities proactively
    timeline: within 72 hours of conflict detection
    format: voluntary disclosure of conflict; request guidance
```

---

## Integration

```
Feeds into:
  regional-policy-enforcement.md — known resolutions registered as policy precedents
  cross-border-governance.md — conflict resolutions affect which mechanisms are valid
  jurisdiction-aware-orchestration.md — routing adjustments based on conflict resolutions
  legal-memory-partitioning.md — partition-level policy updates from conflict resolutions

Receives from:
  regional-policy-enforcement.md — conflicting policies detected and sent here
  jurisdiction-aware-memory.md — multi-jurisdiction records trigger conflict checks
  cross-border-governance.md — cross-border operations with multi-jurisdictional data
```

---

## Governance

**No silent resolution:** Every regulatory conflict must be documented and resolved with human authority; no algorithmic resolution without legal review for novel conflicts  
**Known resolution registry:** Reviewed annually; outdated resolutions removed; regulatory changes trigger immediate review  
**T5 conflicts:** IRRECONCILABLE and DISCLOSURE_vs_CONFIDENTIALITY conflicts requiring sovereign government engagement are T5 + external counsel; cannot be decided below that level  
**Audit:** All conflict detections, arbitration decisions, and notifications to `memory/geopolitical-governance/arbitration-log.jsonl`; permanent retention
