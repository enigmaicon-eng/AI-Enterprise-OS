# Regulatory Intelligence System
**ID:** CIN-RIS-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Legal Org + Governance Org | **Updated:** 2026-05-16

---

## Purpose

Monitors the global regulatory landscape continuously, detects changes relevant to the enterprise's jurisdictions and domains, classifies their impact, and routes actionable intelligence to the policy adaptation and regulatory calendar systems. The Regulatory Intelligence System transforms the raw signal of regulatory change — official gazette publications, supervisory authority announcements, enforcement actions, court rulings — into structured, prioritized intelligence that the OS can act on before a compliance gap opens.

---

## Source Registry

```yaml
regulatory_sources:

  EU:
    EUR_LEX:
      url_pattern: "eur-lex.europa.eu"
      content_types: [REGULATION, DIRECTIVE, DECISION, OPINION, GUIDANCE]
      monitoring_frequency: DAILY
      
    EDPB:
      description: European Data Protection Board — GDPR guidance and opinions
      content_types: [OPINION, GUIDELINE, RECOMMENDATION, BINDING_DECISION]
      monitoring_frequency: WEEKLY
      
    EU_AI_OFFICE:
      description: EU AI Office — AI Act implementation guidance
      content_types: [GUIDANCE, STANDARD, PROHIBITION_LIST_UPDATE]
      monitoring_frequency: WEEKLY
      
    NATIONAL_DPAS:
      entities: [BfDI, CNIL, ICO_EU_Mirror, Garante, AEPD]
      content_types: [ENFORCEMENT_ACTION, OPINION, INVESTIGATION_OUTCOME]
      monitoring_frequency: WEEKLY

  UK:
    ICO:
      description: Information Commissioner's Office
      content_types: [ENFORCEMENT_ACTION, PENALTY_NOTICE, GUIDANCE, ANNUAL_REPORT]
      monitoring_frequency: WEEKLY
      
  CN:
    CAC:
      description: Cyberspace Administration of China
      content_types: [REGULATION, STANDARD, ENFORCEMENT_ACTION, ALGORITHM_REGISTRATION_UPDATE]
      monitoring_frequency: DAILY
      
    MIIT:
      description: Ministry of Industry and Information Technology — MLPS updates
      content_types: [STANDARD, GUIDANCE]
      monitoring_frequency: MONTHLY
      
  US:
    FTC:
      content_types: [ENFORCEMENT_ACTION, GUIDANCE, RULEMAKING]
      monitoring_frequency: WEEKLY
      
    HHS_OCR:
      description: HIPAA enforcement
      content_types: [ENFORCEMENT_ACTION, GUIDANCE, SETTLEMENT]
      monitoring_frequency: WEEKLY
      
    SEC:
      content_types: [RULEMAKING, GUIDANCE, ENFORCEMENT_ACTION]
      monitoring_frequency: WEEKLY
      
    STATE_ATTORNEYS_GENERAL:
      states: [CA, TX, NY, IL, VA]
      content_types: [ENFORCEMENT_ACTION, OPINION]
      monitoring_frequency: MONTHLY
      
  IN:
    MEITY:
      description: Ministry of Electronics and Information Technology — DPDP implementation
      content_types: [REGULATION, RULE, GUIDANCE]
      monitoring_frequency: WEEKLY
      
    RBI:
      content_types: [CIRCULAR, GUIDELINE, ENFORCEMENT]
      monitoring_frequency: WEEKLY
      
  SG:
    PDPC:
      content_types: [ENFORCEMENT_ACTION, ADVISORY_GUIDELINE, DECISION]
      monitoring_frequency: WEEKLY
      
  INTERNATIONAL:
    OECD_AI_POLICY_OBSERVATORY:
      content_types: [POLICY_UPDATE, COUNTRY_PROFILE]
      monitoring_frequency: MONTHLY
```

---

## Intelligence Pipeline

```
process_regulatory_signal(raw_signal, source):

  # Stage 1: Parse and normalize
  normalized = normalize_signal(raw_signal, source.format)
  
  # Stage 2: Classify signal type
  signal_type = classify_signal_type(normalized)
  # BINDING_LAW | BINDING_REGULATION | BINDING_DECISION | SOFT_GUIDANCE |
  # ENFORCEMENT_ACTION | OPINION | COURT_RULING | STANDARD | DRAFT_CONSULTATION
  
  # Stage 3: Jurisdiction and domain tagging
  jurisdictions = extract_jurisdictions(normalized)
  domains = extract_compliance_domains(normalized)
  affected_regulations = map_to_regulation_registry(normalized)
  
  # Stage 4: Impact classification
  impact = classify_impact(normalized, signal_type, domains)
  # CRITICAL | HIGH | MEDIUM | LOW
  
  urgency = classify_urgency(normalized, signal_type, impact)
  # EMERGENCY (<24hr) | URGENT (<7d) | STANDARD (<90d) | PLANNED (>90d)
  
  # Stage 5: Relevance filtering
  relevance_score = score_relevance(jurisdictions, domains, affected_regulations)
  if relevance_score < 0.30:
    log SIGNAL_FILTERED_LOW_RELEVANCE; Return
    
  # Stage 6: Duplication check
  if is_duplicate(normalized, processed_signals_last_30d):
    log SIGNAL_DUPLICATE; Return
    
  # Stage 7: Generate regulatory intelligence unit
  riu = RegulatoryIntelligenceUnit {
    riu_id: RIU-{NNN},
    source, signal_type, jurisdictions, domains, affected_regulations,
    impact, urgency, relevance_score,
    summary: llm_summarize(normalized),
    effective_date: extract_effective_date(normalized),
    deadline: extract_compliance_deadline(normalized),
    raw_reference: normalized.source_url,
    processed_at: now()
  }
  
  # Stage 8: Route to downstream systems
  route_intelligence(riu)
  
  Return: riu
```

---

## Impact Classification Rules

```yaml
impact_classification:

  CRITICAL:
    triggers:
      - new prohibition or mandatory requirement in active jurisdiction
      - enforcement action affecting same industry (fine > €1M or equivalent)
      - court ruling invalidating existing transfer mechanism (e.g., Schrems-style)
      - immediate effective date (< 30 days)
    policy_adaptation_urgency: EMERGENCY
    escalation: T4 + Legal Org within 2 hours
    
  HIGH:
    triggers:
      - significant amendment to existing regulation in active jurisdiction
      - new guidance that changes interpretation of existing rule
      - enforcement action with sector-wide implications
      - effective date 30–90 days
    policy_adaptation_urgency: URGENT
    escalation: T3 + Legal Org within 24 hours
    
  MEDIUM:
    triggers:
      - clarifying guidance with no material change to existing practice
      - consultation paper or draft regulation (not yet effective)
      - enforcement action in adjacent jurisdiction (educational signal)
      - effective date 90–180 days
    policy_adaptation_urgency: STANDARD
    escalation: Governance Org within 7 days
    
  LOW:
    triggers:
      - annual report or retrospective publication
      - foreign jurisdiction regulation with indirect relevance
      - academic guidance or best-practice recommendation
    policy_adaptation_urgency: PERIODIC_REVIEW
    escalation: none; logged for quarterly review
```

---

## Routing Logic

```
route_intelligence(riu):

  if riu.urgency == EMERGENCY:
    notify(T4 + Legal Org, channel=IMMEDIATE_ALERT)
    trigger(regulatory-change-detector.md, priority=EMERGENCY)
    trigger(policy-adaptation-engine.md, action=BEGIN_EMERGENCY_DRAFT)
    
  if riu.urgency in [EMERGENCY, URGENT]:
    trigger(impact-assessment-engine.md, riu=riu)
    add_to(regulatory-calendar.md, deadline=riu.deadline)
    
  if riu.urgency in [EMERGENCY, URGENT, STANDARD]:
    trigger(regulatory-change-detector.md, riu=riu)
    trigger(compliance-predictor.md, update_model=true)
    
  always:
    store(regulatory-intelligence-store, riu)
    update(compliance-analytics-engine.md, regulatory_signal_count++)
```

---

## Regulatory Intelligence Unit Schema

```yaml
regulatory_intelligence_unit:
  riu_id: RIU-{NNN}
  source_id: string                    # source registry entry
  signal_type: string
  
  jurisdictions: [JUR-{XX}]
  domains: [string]
  affected_regulations: [string]
  
  impact: CRITICAL | HIGH | MEDIUM | LOW
  urgency: EMERGENCY | URGENT | STANDARD | PLANNED
  relevance_score: float (0.00–1.00)
  
  summary: string (max 500 chars)
  effective_date: ISO8601 | null
  deadline: ISO8601 | null
  raw_reference: string (URL)
  
  downstream_actions:
    policy_draft_triggered: boolean
    impact_assessment_triggered: boolean
    calendar_entry_created: boolean
    
  processed_at: ISO8601
  reviewed_by: string | null           # Legal Org reviewer if HIGH+
  review_notes: string | null
```

---

## Integration

```
Feeds into:
  regulatory-change-detector.md — RIUs are the primary input
  impact-assessment-engine.md — HIGH/CRITICAL RIUs trigger impact assessment
  policy-adaptation-engine.md — EMERGENCY RIUs trigger emergency policy drafts
  regulatory-calendar.md — deadlines extracted from RIUs populate calendar
  compliance-predictor.md — RIU feed updates prediction models

Receives from:
  (external regulatory sources per source registry above)
  Legal Org manual submissions (for enforcement actions not yet indexed)
```

---

## Governance

**Human review for HIGH+:** All CRITICAL and HIGH impact RIUs reviewed by Legal Org before policy action is triggered  
**Source validation:** Every source in the source registry is validated annually; unauthorized sources rejected  
**Coverage gaps:** If a new regulation is detected that has no source in the registry, Governance Org adds source within 30 days  
**False signal management:** If a RIU proves to be a misclassification, a CORRECTION record is created; original RIU is never deleted  
**Audit:** All RIUs to `memory/compliance-intelligence/regulatory-intelligence.jsonl`; 10-year retention (regulatory evidence)
