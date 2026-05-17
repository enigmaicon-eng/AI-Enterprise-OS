# Competitive Intelligence Hub
**ID:** SI-CORE-004 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Aggregates, synthesizes, and continuously updates the enterprise competitive intelligence picture. Tracks competitors across product, technology, talent, and market dimensions. Surfaces competitive threats and positioning opportunities for the opportunity-threat-radar. Feeds competitive context into all executive decisions and scenario plans.

---

## Competitor Registry Schema

```yaml
competitor:
  competitor_id: COMP-{slug}
  name: string
  category: DIRECT | ADJACENT | PLATFORM | EMERGING | POTENTIAL_ENTRANT
  threat_level: EXISTENTIAL | HIGH | MEDIUM | LOW | MONITORING
  
  dimensions:
    product:
      known_features: [string]
      announced_features: [string]           # from public sources
      patent_filings: [string]               # tracked via external signals
      pricing_model: string
      pricing_last_observed: ISO8601
      
    technology:
      primary_stack: [string]
      ai_capabilities: [string]
      infrastructure_signals: [string]       # job postings, blog posts, open-source
      
    market:
      segments_active: [string]
      segments_targeting: [string]           # announced/inferred
      geographic_expansion: [string]
      estimated_arr_range: string            # e.g., "$50M–$100M" (public estimates only)
      growth_signal: ACCELERATING | STABLE | DECELERATING | UNKNOWN
      
    talent:
      key_hires_observed: [string]
      departure_signals: [string]
      talent_acquisition_focus: [string]     # from job posting analysis
      
    strategy:
      positioning_statement: string          # inferred from messaging
      apparent_strategic_bets: [string]
      partnership_ecosystem: [string]
      
  intelligence_quality:
    last_updated: ISO8601
    data_freshness: CURRENT | AGING | STALE   # STALE = > 90 days
    confidence: 0.00–1.00
    source_diversity: 0.00–1.00
```

---

## Intelligence Collection Protocol

The hub does NOT perform direct competitive research (that is `research-intelligence/competitive-intelligence.md`). The hub:

1. **Receives** finished intelligence from `research-intelligence/competitive-intelligence.md`
2. **Aggregates** signals from enterprise-telemetry, customer org, sales signals
3. **Maintains** the live competitor registry (continuous updates)
4. **Synthesizes** cross-competitor patterns and market dynamics
5. **Publishes** to `enterprise.competitive.intelligence` event bus topic

---

## Competitive Analysis Modules

### Market Position Matrix
Continuously maintained 2x2 analysis (feature completeness × market reach) for all DIRECT and ADJACENT competitors. Updated whenever:
- New product announcement detected
- Market share signal received
- Customer win/loss pattern emerges

### Threat Escalation Logic
```
competitor move detected:
  if move_type = CORE_PRODUCT_FEATURE_PARITY:
    → P1 threat (confidence-weighted) → opportunity-threat-radar.md
    
  if move_type = PRICING_UNDERCUT (> 20% on core SKU):
    → P1 threat → executive-alert-system.md
    
  if move_type = STRATEGIC_ACQUISITION (target in our domain):
    → P0 threat → immediate T4 briefing
    
  if move_type = TALENT_POACHING (≥ 3 senior hires from our org in 90 days):
    → P1 threat → people-intelligence escalation
    
  if move_type = REGULATORY_MOAT (competitor achieves compliance before us):
    → P1 threat → compliance-framework escalation
```

### Positioning Gap Analysis
Monthly analysis identifying:
- Segments where competitors are stronger (vulnerability map)
- Segments where competitors are weak (attack surface)
- Emerging segments with no strong incumbent (whitespace)

---

## Competitive Battle Cards

Auto-generated per competitor (DIRECT and ADJACENT only) when intelligence confidence > 0.65:

```yaml
battle_card:
  competitor_id: COMP-*
  generated_at: ISO8601
  
  our_advantages: [string]          # where we clearly win
  competitor_advantages: [string]   # where they clearly win  
  neutral_zones: [string]           # unclear or contextual
  
  key_differentiators: [string]     # top 3 messages against this competitor
  trap_questions: [string]          # questions they use against us + responses
  red_flags: [string]               # signals customer considering them
  
  deal_strategies:
    replace_competitor: string      # if customer has them
    prevent_loss_to_competitor: string  # if customer evaluating them
    
  intel_confidence: 0.00–1.00
  expires_at: ISO8601               # 30 days default; 90 days if LOW threat level
```

Battle cards published to `memory/strategic-intelligence/battle-cards/` and accessible via knowledge-retrieval/knowledge-query-api.md.

---

## Competitive Calendar

Automatic monitoring of competitor event calendar:
- Earnings calls (public companies)
- Conference presentations (announced events)
- Product launch cycles (inferred from historical patterns)
- Regulatory filing deadlines

Generates pre-event briefing 48 hours before significant competitor events.

---

## Governance

**Data classification:** All competitive intelligence defaults to CONFIDENTIAL
**Source verification:** External signals require validation by `evidence-systems/source-validator.md` before registry update
**Accuracy discipline:** Speculation is flagged explicitly; only evidence-backed claims in competitor records
**Ethical constraints:** Collection limited to publicly available information + enterprise connector feeds. No signals from unauthorized sources.
**Audit:** `memory/strategic-intelligence/competitor-intel-log.jsonl` (append-only)
