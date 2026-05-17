# Regulatory Calendar
**ID:** RAD-RCL-001 | **Tier:** T2 | **Class:** STANDARD
**Owner:** Legal Org + Governance Org | **Updated:** 2026-05-16

---

## Purpose

Maintains the proactive calendar of all known regulatory deadlines, review cycles, renewal obligations, enforcement windows, and predicted future requirements across all active jurisdictions. The Regulatory Calendar transforms compliance from a reactive discipline (respond when something changes) into a proactive one (know what is coming and prepare). It integrates with the adaptation workflow orchestrator to trigger preparation work at the right lead time, and with the compliance predictor to identify when current velocity is insufficient to meet upcoming deadlines.

---

## Calendar Entry Schema

```yaml
calendar_entry:
  entry_id: RCL-{NNN}
  
  entry_type:
    HARD_DEADLINE:        # regulatory deadline with legal consequence for missing it
    REVIEW_CYCLE:         # required periodic review (e.g., annual TIA refresh, SCC review)
    RENEWAL_OBLIGATION:   # mechanism or certification that expires and must be renewed
    ENFORCEMENT_WINDOW:   # period when regulatory body typically conducts enforcement sweeps
    PREDICTED_CHANGE:     # anticipated regulatory change based on legislative pipeline
    INTERNAL_MILESTONE:   # OS-internal compliance milestone (e.g., annual policy review)
    
  regulation:
    regulation_id: string
    jurisdiction: JUR-{XX}
    article: string | null
    
  deadline:
    date: ISO8601
    flexibility: HARD | SOFT                # SOFT = grace period may exist
    grace_period_days: integer | null
    consequence_of_miss: string
    
  preparation:
    lead_time_required_days: integer        # estimated implementation effort
    trigger_adaptation_at_days_before: integer  # when to start AWF
    triggered: boolean
    awf_id: AWF-{NNN} | null
    
  status: UPCOMING | PREPARATION_STARTED | ON_TRACK | AT_RISK | COMPLETE | MISSED
  
  source: string                           # RIU-{NNN} | manual | periodic_review_system
  created_at: ISO8601
  last_verified: ISO8601                   # when deadline was last confirmed with source
```

---

## Standing Calendar Entries

```yaml
standing_calendar:
  # These entries recur annually or on fixed cycles

  GDPR_DPA_ANNUAL_REVIEW:
    regulation: GDPR Art.37-39
    jurisdiction: JUR-EU
    entry_type: REVIEW_CYCLE
    cadence: ANNUAL
    description: Annual DPO review of processing activities; ROPA update
    lead_time_required_days: 30
    trigger_at_days_before: 45
    
  SCC_ANNUAL_REVIEW:
    regulation: GDPR Chapter V SCCs
    jurisdiction: JUR-EU
    entry_type: REVIEW_CYCLE
    cadence: ANNUAL
    description: Annual Standard Contractual Clauses review + TIA refresh
    lead_time_required_days: 21
    trigger_at_days_before: 30
    
  GDPR_ADEQUACY_DAILY_VERIFICATION:
    regulation: GDPR Art.45
    jurisdiction: JUR-EU
    entry_type: REVIEW_CYCLE
    cadence: DAILY
    description: Verify all adequacy-based transfers still valid (EU↔GB)
    automated: true                       # automated via legal-memory-partitioning
    
  PIPL_ANNUAL_COMPLIANCE_REVIEW:
    regulation: PIPL Art.54
    jurisdiction: JUR-CN
    entry_type: REVIEW_CYCLE
    cadence: ANNUAL
    description: PIPL personal information protection audit (internal)
    lead_time_required_days: 45
    trigger_at_days_before: 60
    
  CAC_SECURITY_ASSESSMENT_RENEWAL:
    regulation: PIPL Art.38; DSL
    jurisdiction: JUR-CN
    entry_type: RENEWAL_OBLIGATION
    cadence: PER_MECHANISM                # each CAC assessment has its own expiry
    description: Renew CAC security assessments for outbound transfers
    lead_time_required_days: 60
    trigger_at_days_before: 90
    
  CCPA_ANNUAL_PRIVACY_NOTICE_REVIEW:
    regulation: CCPA
    jurisdiction: JUR-US
    entry_type: REVIEW_CYCLE
    cadence: ANNUAL
    description: Annual review of consumer privacy notices for accuracy
    lead_time_required_days: 14
    trigger_at_days_before: 30
    
  SOX_SECTION_302_QUARTERLY_CERTIFICATION:
    regulation: SOX Sec.302
    jurisdiction: JUR-US
    entry_type: REVIEW_CYCLE
    cadence: QUARTERLY
    description: Quarterly certification of internal controls over financial reporting
    lead_time_required_days: 14
    trigger_at_days_before: 21
    
  DPDP_SIGNIFICANT_FIDUCIARY_REVIEW:
    regulation: DPDP Act 2023
    jurisdiction: JUR-IN
    entry_type: REVIEW_CYCLE
    cadence: ANNUAL
    description: Annual significant data fiduciary obligations review
    lead_time_required_days: 30
    trigger_at_days_before: 45
    
  PDPA_ANNUAL_DPO_REVIEW:
    regulation: PDPA
    jurisdiction: JUR-SG
    entry_type: REVIEW_CYCLE
    cadence: ANNUAL
    description: Annual data protection officer review of PDPA compliance
    lead_time_required_days: 14
    trigger_at_days_before: 30
    
  EU_AI_ACT_CONFORMITY_REVIEW:
    regulation: EU AI Act
    jurisdiction: JUR-EU
    entry_type: REVIEW_CYCLE
    cadence: ANNUAL
    description: Annual conformity assessment review for high-risk AI systems
    lead_time_required_days: 45
    trigger_at_days_before: 60
    
  ISO_27001_SURVEILLANCE_AUDIT:
    regulation: ISO 27001
    jurisdiction: ALL
    entry_type: REVIEW_CYCLE
    cadence: ANNUAL
    description: ISO 27001 surveillance audit (between recertification years)
    lead_time_required_days: 30
    trigger_at_days_before: 45
    
  ISO_27001_RECERTIFICATION:
    regulation: ISO 27001
    jurisdiction: ALL
    entry_type: RENEWAL_OBLIGATION
    cadence: TRIENNIAL
    description: Full ISO 27001 recertification audit
    lead_time_required_days: 90
    trigger_at_days_before: 120
    
  SOC2_TYPE2_ANNUAL:
    regulation: SOC 2
    jurisdiction: JUR-US
    entry_type: RENEWAL_OBLIGATION
    cadence: ANNUAL
    description: Annual SOC 2 Type II audit period completion
    lead_time_required_days: 60
    trigger_at_days_before: 90
```

---

## Deadline Triggering Logic

```
evaluate_calendar_triggers():
  # Runs daily at 06:00 UTC

  entries = load_calendar_entries(status=[UPCOMING, PREPARATION_STARTED])
  
  for entry in entries:
    days_to_deadline = (entry.deadline.date - today()).days
    
    # Update status
    if days_to_deadline < 0 and entry.status != COMPLETE:
      entry.status = MISSED
      alert(T4 + Legal_Org, f"MISSED REGULATORY DEADLINE: {entry.entry_id}")
      
    elif days_to_deadline <= 30 and entry.status == UPCOMING:
      entry.status = AT_RISK
      alert(T3 + Legal_Org, f"Regulatory deadline at risk: {entry.entry_id} in {days_to_deadline} days")
      
    # Trigger preparation
    if days_to_deadline <= entry.preparation.trigger_adaptation_at_days_before and not entry.triggered:
      
      if entry.entry_type == RENEWAL_OBLIGATION:
        trigger_renewal_workflow(entry)
        
      elif entry.entry_type == REVIEW_CYCLE:
        trigger_review_workflow(entry)
        
      elif entry.entry_type == HARD_DEADLINE:
        # Linked to a CHG-{NNN} — adaptation workflow already exists or needs creation
        if not entry.awf_id:
          alert(Governance_Org, f"Hard deadline {entry.entry_id} approaching without adaptation workflow")
          
      entry.preparation.triggered = true
      entry.status = PREPARATION_STARTED
      
    # Check whether compliance predictor sees deadline miss risk
    if not entry.triggered:
      miss_probability = compliance_predictor.predict_deadline_miss(entry)
      if miss_probability >= 0.30:
        alert(Governance_Org, f"Predictor: {miss_probability:.0%} probability of missing {entry.entry_id}")
```

---

## Horizon Scanning

```yaml
horizon_scanning:
  description: Track regulations not yet effective but approaching the pipeline
  
  tracked_items:
    - regulation: EU_AI_LIABILITY_DIRECTIVE
      jurisdiction: JUR-EU
      status: DRAFT_LEGISLATIVE
      expected_effective: 2026-Q3 (estimated)
      os_preparation_needed: Review AI error liability provisions
      monitoring: EUR_LEX weekly
      
    - regulation: EU_EIDAS2_DIGITAL_IDENTITY
      jurisdiction: JUR-EU
      status: ENTERING_FORCE
      expected_compliance_deadline: 2026-09 (estimated)
      os_preparation_needed: Digital identity verification workflow integration
      monitoring: EUR_LEX weekly
      
    - regulation: US_FEDERAL_PRIVACY_LEGISLATION
      jurisdiction: JUR-US
      status: LEGISLATIVE_PROPOSAL
      expected_effective: uncertain
      os_preparation_needed: None until enacted; monitor for progress
      monitoring: CONGRESS_GOV monthly
      
    - regulation: INDIA_DPDP_RULES
      jurisdiction: JUR-IN
      status: DRAFT_RULES
      expected_effective: 2026-Q2 (estimated)
      os_preparation_needed: Significant data fiduciary obligations implementation
      monitoring: MEITY weekly
      
  horizon_review:
    cadence: monthly by Legal Org
    output: horizon items promoted to calendar_entries when legislation finalizes
```

---

## Integration

```
Feeds into:
  adaptation-workflow-orchestrator.md — calendar triggers initiate AWF creation
  compliance-predictor.md — deadline data used in deadline miss prediction model
  compliance-dashboard.md — upcoming deadlines displayed in regulatory calendar view
  compliance-analytics-engine.md — deadline performance included in reports

Receives from:
  regulatory-change-detector.md — deadlines extracted from change records added to calendar
  regulatory-intelligence-system.md — RIUs may carry new deadline information
  Legal Org — manually maintained standing entries; horizon scanning judgments
```

---

## Governance

**Legal Org owns standing entries:** Accuracy of standing calendar entries is Legal Org responsibility; reviewed quarterly  
**Missed deadline is always T4:** Any entry entering MISSED status triggers immediate T4 alert; missed regulatory deadlines are material compliance events  
**Horizon items are opinion:** Horizon scanning items reflect predicted future regulation; they do not trigger compliance obligations until finalized  
**Calendar retention:** All calendar entries retained permanently; missed entries retained as regulatory evidence  
**Audit:** All calendar triggers and status changes to `memory/regulatory-adaptation/calendar-audit.jsonl`
