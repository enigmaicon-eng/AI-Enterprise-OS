# Regulatory Change Detector
**ID:** RAD-RCD-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Legal Org + Governance Org | **Updated:** 2026-05-16

---

## Purpose

Converts incoming regulatory intelligence units (RIUs) from the Regulatory Intelligence System into structured change records that describe precisely what changed, what the OS must do in response, and by when. Where the intelligence system handles signal acquisition and classification, the Regulatory Change Detector handles change definition: decomposing a regulatory change into its actionable components, mapping it to affected policies and controls, estimating implementation complexity, and triggering the appropriate downstream response chain.

---

## Change Classification

```yaml
change_classification:

  BINDING_NEW_REQUIREMENT:
    definition: A new obligation that did not previously exist in the regulation
    examples: [New GDPR Art. requirement, New PIPL data category rule, New EU AI Act prohibited use]
    response: draft new compliance policy; update control catalog; implementation mandatory
    default_urgency: HIGH (standard effective date) | CRITICAL (immediate effective date)
    
  BINDING_AMENDMENT:
    definition: A change to an existing obligation — scope, threshold, procedure, or penalty
    examples: [GDPR SCC template update, PIPL cross-border threshold change]
    response: update affected policies; verify controls still adequate
    default_urgency: HIGH
    
  TRANSFER_MECHANISM_CHANGE:
    definition: A change affecting a legal basis for cross-border data transfer
    examples: [Adequacy decision revoked, New SCCs required, CAC new Standard Contract template]
    response: IMMEDIATE — suspend affected transfers; re-establish mechanism
    default_urgency: CRITICAL (adequacy revocation) | HIGH (mechanism update)
    special_handling: triggers cross-border-governance.md emergency protocol if adequacy revoked
    
  ENFORCEMENT_SIGNAL:
    definition: Enforcement action against another entity revealing how regulator interprets rule
    examples: [GDPR fine for consent dark pattern, FTC AI enforcement action]
    response: assess whether OS practices match punished behavior; adjust if needed
    default_urgency: MEDIUM (educational) | HIGH (if OS has same practice)
    
  SOFT_GUIDANCE:
    definition: Non-binding guidance, opinion, or best-practice recommendation
    examples: [EDPB opinion on AI, ICO guidance on cookie consent]
    response: assess gap against current practice; plan voluntary alignment if risk warrants
    default_urgency: LOW (STANDARD review cycle)
    
  DRAFT_REGULATION:
    definition: Regulation not yet in force; consultation paper or legislative proposal
    examples: [Draft EU AI Liability Directive, Draft DPDP rules]
    response: monitor; plan ahead; do not implement until final text
    default_urgency: PLANNED (> 90 days)
```

---

## Change Record Schema

```yaml
regulatory_change_record:
  change_id: CHG-{NNN}
  riu_id: RIU-{NNN}               # links to regulatory intelligence unit
  detected_at: ISO8601
  
  change_classification: string
  urgency: CRITICAL | HIGH | MEDIUM | LOW | PLANNED
  
  regulatory_reference:
    regulation: string             # e.g., "GDPR"
    article: string                # e.g., "Art.46"
    jurisdiction: JUR-{XX}
    effective_date: ISO8601
    compliance_deadline: ISO8601   # may differ from effective_date (transition period)
    
  impact_mapping:
    affected_policies: [POL-{NNN}]
    affected_controls: [CTL-{NNN}]
    affected_workflows: [WF-{NNN}]
    affected_jurisdictions: [JUR-{XX}]
    affected_transfer_mechanisms: [mechanism_id]
    
  change_summary:
    what_changed: string (max 500 chars)
    what_must_change_in_OS: string (max 500 chars)
    
  implementation:
    complexity: TRIVIAL | SIMPLE | MODERATE | COMPLEX | ARCHITECTURAL
    estimated_effort_days: integer
    implementation_plan_id: string | null  # links to adaptation workflow
    
  legal_review:
    required: boolean
    reviewed_by: string | null
    reviewed_at: ISO8601 | null
    legal_opinion: string | null
    
  status: DETECTED | ASSESSED | IN_ADAPTATION | IMPLEMENTED | MONITORING | CLOSED
```

---

## Detection Algorithm

```
process_change_from_riu(riu):

  # Step 1: Map to change classification
  change_class = classify_change(riu.signal_type, riu.impact, riu.domains)
  
  # Step 2: Map to existing regulations and policies
  affected_regulations = regulatory_registry.match(riu.affected_regulations)
  affected_policies = policy_catalog.find_by_regulation(affected_regulations)
  affected_controls = control_catalog.find_by_policy(affected_policies)
  affected_workflows = workflow_registry.find_by_control(affected_controls)
  
  # Step 3: Transfer mechanism impact (critical path)
  if change_class == TRANSFER_MECHANISM_CHANGE:
    affected_mechanisms = transfer_mechanism_registry.find_affected(riu)
    if riu.urgency == CRITICAL:
      # Adequacy revocation or equivalent — immediate
      cross_border_governance.trigger_emergency_protocol(affected_mechanisms)
      suspend_transfers(affected_mechanisms)
      
  # Step 4: Estimate complexity
  complexity = estimate_complexity(
    policy_count=len(affected_policies),
    control_count=len(affected_controls),
    workflow_count=len(affected_workflows),
    jurisdictions_affected=len(riu.jurisdictions),
    change_class=change_class
  )
  
  # Step 5: Create change record
  change = RegulatoryChangeRecord {
    change_class, urgency=riu.urgency, regulatory_reference=extract_ref(riu),
    impact_mapping={affected_policies, affected_controls, affected_workflows},
    complexity, estimated_effort_days=estimate_effort(complexity)
  }
  
  # Step 6: Legal review gate for HIGH+
  if riu.urgency in [CRITICAL, HIGH]:
    require_legal_review(change)
    
  # Step 7: Route to adaptation workflow
  route_change(change)
  
  Return: change
```

---

## Urgency Response Matrix

```yaml
urgency_response_matrix:

  CRITICAL:
    detection_to_alert: < 30 minutes
    alert_recipients: [T4, Legal_Org, Governance_Org, all_affected_entity_T4s]
    legal_review_SLA: 2 hours
    implementation_start: within 24 hours of legal review
    parallel_actions:
      - suspend affected transfers if TRANSFER_MECHANISM_CHANGE
      - activate compensating controls for affected domains
      - create EXCEPTION_GRANTED for unavoidable compliance gaps during transition
      
  HIGH:
    detection_to_alert: < 4 hours
    alert_recipients: [T3_Governance, Legal_Org, affected_entity_T4]
    legal_review_SLA: 24 hours
    implementation_start: within 7 days of legal review
    parallel_actions:
      - flag affected policies for priority review
      - assess control gaps
      
  MEDIUM:
    detection_to_alert: < 24 hours
    alert_recipients: [Governance_Org]
    legal_review_SLA: 7 days
    implementation_start: next sprint cycle
    
  LOW:
    detection_to_alert: weekly digest
    alert_recipients: [Governance_Org quarterly review queue]
    implementation_start: next quarterly review cycle
    
  PLANNED:
    tracking: added to regulatory-calendar.md
    alert: generated when deadline is within 90 days
```

---

## Regulation Registry

```yaml
regulation_registry:
  entries:
    - regulation_id: REG-GDPR
      short_name: GDPR
      jurisdiction: JUR-EU
      current_version: "2018-05-25"
      monitoring_source: [EUR_LEX, EDPB]
      last_change: {change_id: CHG-{NNN}, date: ISO8601}
      
    - regulation_id: REG-PIPL
      short_name: PIPL
      jurisdiction: JUR-CN
      current_version: "2021-11-01"
      monitoring_source: [CAC]
      
    - regulation_id: REG-EU_AI_ACT
      short_name: EU_AI_Act
      jurisdiction: JUR-EU
      current_version: "2024-08-01"
      monitoring_source: [EUR_LEX, EU_AI_OFFICE]
      
    # [additional entries for DPDP, UK GDPR, PDPA, CCPA, SOX, HIPAA, etc.]
    
  registry_maintenance:
    cadence: updated on every CHG-{NNN} that affects a regulation
    new_regulation_addition: Governance Org + Legal Org approval
    obsolete_regulation: DEPRECATED status retained (historical audit evidence)
```

---

## Integration

```
Feeds into:
  impact-assessment-engine.md — change records are the primary input
  adaptation-workflow-orchestrator.md — change records trigger adaptation workflows
  regulatory-calendar.md — compliance deadlines extracted and logged
  policy-adaptation-engine.md — HIGH/CRITICAL changes trigger policy drafts

Receives from:
  regulatory-intelligence-system.md — RIUs are the primary input
  cross-border-governance.md — transfer mechanism status changes
  Legal Org — manual change submissions (enforcement actions; court rulings)
```

---

## Governance

**Legal review for HIGH+:** No CRITICAL or HIGH change record proceeds to adaptation without Legal Org review  
**Adequacy revocation is always CRITICAL:** Any adequacy decision revocation triggers immediate CRITICAL change record and transfer suspension; no exceptions  
**Change record immutability:** Once created, change record ID and regulatory reference are immutable; status updates are appended, not modified  
**Coverage verification:** Quarterly sweep confirms all active regulations in active jurisdictions are covered by at least one monitoring source  
**Audit:** All change records to `memory/regulatory-adaptation/change-records.jsonl`; permanent retention
