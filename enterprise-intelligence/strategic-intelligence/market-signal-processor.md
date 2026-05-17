# Market Signal Processor
**ID:** SI-CORE-005 | **Tier:** T3 | **Class:** STANDARD
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Processes inbound market signals from external sources, normalizes them to the strategic signal schema, scores their relevance and credibility, and routes them to the intelligence fusion layer. Acts as the interface between the external world and the enterprise strategic intelligence system.

---

## Signal Categories

| Category | Examples | Refresh |
|----------|---------|---------|
| MARKET_SIZE | TAM/SAM/SOM estimates, analyst reports | Monthly |
| MARKET_TREND | Technology adoption curves, category growth rates | Weekly |
| REGULATORY | New regulations, enforcement actions, guidance documents | Per event |
| MACRO_ECONOMIC | Interest rates, funding environment, enterprise spending | Weekly |
| TECHNOLOGY_SHIFT | New AI models, platform changes, infrastructure evolution | Per event |
| CUSTOMER_BEHAVIOR | Buying pattern changes, RFP language shifts, decision cycle changes | Per deal cycle |
| TALENT_MARKET | Hiring trends, salary benchmarks, skill supply/demand | Monthly |
| PARTNER_ECOSYSTEM | Integration marketplace shifts, platform strategy changes | Per event |
| ANALYST_COVERAGE | Analyst report releases, rating changes, market map updates | Per event |
| INVESTMENT_SIGNALS | Funding rounds in adjacent spaces, M&A activity | Per event |

---

## Signal Processing Pipeline

```
1. INGEST
   Sources: enterprise connectors (integrations/), research-intelligence/ outputs,
            enterprise-telemetry/ events, manual analyst submissions
   
2. VALIDATE
   - Source credibility check via evidence-systems/source-validator.md
   - Duplicate detection (7-day window, semantic similarity > 0.85 = duplicate)
   - Relevance filter: does signal touch any domain in our strategic_signal schema?
   
3. NORMALIZE
   - Standardize to strategic_signal schema
   - Extract quantitative anchors (numbers, dates, named entities)
   - Assign initial confidence based on source authority
   
4. SCORE
   Relevance_score = domain_match × recency_weight × magnitude_estimate
   Credibility_score = source_authority × evidence_support × corroboration_bonus
   Signal_priority = relevance × credibility
   
5. ROUTE
   signal_priority ≥ 0.70: → intelligence-fusion-layer.md (immediate)
   signal_priority 0.40–0.69: → daily batch fusion
   signal_priority < 0.40: → weekly watch batch
   
6. LOG
   All signals to memory/strategic-intelligence/signal-log.jsonl regardless of priority
```

---

## Market Model (maintained state)

The processor maintains a living market model used as baseline for signal contextualization:

```yaml
market_model:
  snapshot_date: ISO8601
  
  tam_estimate:
    value: number
    unit: USD_M
    confidence: 0.00–1.00
    source: string
    
  growth_rate:
    annual_pct: number
    trend: ACCELERATING | STABLE | DECELERATING
    confidence: 0.00–1.00
    
  market_maturity: EMERGING | GROWTH | MATURE | DECLINING
  
  key_segments:
    - segment_name: string
      size_pct: number
      growth_rate: number
      competitive_intensity: LOW | MEDIUM | HIGH | EXTREME
      
  adoption_cycle_stage: INNOVATORS | EARLY_ADOPTERS | EARLY_MAJORITY | LATE_MAJORITY | LAGGARDS
  
  macro_tailwinds: [string]
  macro_headwinds: [string]
  
  regulatory_climate: FAVORABLE | NEUTRAL | UNFAVORABLE | VOLATILE
```

Model updated monthly (full refresh) and event-driven (partial update on significant signals).

---

## Trend Detection

The processor applies statistical methods to detect emerging trends before they become obvious:

| Method | Application | Trigger |
|--------|-------------|---------|
| EWMA (λ=0.3) | Topic frequency acceleration | Signal volume 2σ above baseline |
| Granger causality | Leading indicator patterns | Temporal correlation across signal types |
| Zipf's law | Segment size distribution shifts | Power law deviation > 15% |
| Temporal clustering | Event clustering (burst detection) | ≥ 5 related signals in 7-day window |

Detected trends → EMERGING classification in strategic_signal schema → intelligence-fusion-layer.md.

---

## Signal Quality Reporting

Weekly quality report published to `memory/strategic-intelligence/signal-quality.yaml`:
- Signal volume by category and priority tier
- Source distribution and authority scores
- False positive rate (signals that didn't produce actionable UIUs)
- Coverage gaps (strategic domains with low signal volume)

Coverage gaps automatically routed to `research-intelligence/orchestrator.md` as investigation triggers.
