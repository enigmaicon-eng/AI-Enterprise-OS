# Insight Compression Engine
**ID:** CI-ICE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Compresses the growing volume of organizational intelligence — compound insights, strategic signals, research findings, competitive intelligence — into progressively more compact and reusable representations without losing decision-relevant information. As the OS generates hundreds of insights daily, the cognitive load on human decision-makers becomes unsustainable without active compression. This engine curates signal from noise and distills multi-page analyses into decision-ready summaries.

---

## Compression Hierarchy

Intelligence is compressed across four tiers, each consuming the previous:

```
Tier 1: Raw Signals (real-time)
  Individual data points: NPS scores, event counts, competitor mentions
  Volume: ~50,000 signals/day
  Format: raw event records
  Audience: automated systems
  
  ↓ Compression ↓

Tier 2: Domain Intelligence (daily)
  Synthesized insights per intelligence domain
  Volume: ~200 insights/day
  Format: structured insight records
  Audience: T2 agents, domain specialists
  
  ↓ Compression ↓

Tier 3: Compound Insights (daily)
  Cross-domain patterns and emergent signals
  Volume: ~20 compound insights/day
  Format: compound_insight schema
  Audience: T3 agents, PM/Executive leads
  
  ↓ Compression ↓

Tier 4: Executive Signal (daily)
  The 3–5 most decision-relevant signals for executive action
  Volume: 1 daily executive signal packet
  Format: executive_signal_packet schema (≤ 500 words)
  Audience: T4, T5, board
```

---

## Executive Signal Packet

The final compressed output — what executives actually read:

```yaml
executive_signal_packet:
  packet_id: ESP-{NNN}
  generated_at: ISO8601
  period_covered: string               # e.g., "2026-05-16"
  
  headline_signal: string              # The single most important thing to know (1 sentence)
  
  top_signals: (maximum 5)
    - signal_id: string
      title: string                    # 5–10 words
      one_liner: string                # 1 sentence: what, why it matters
      action_required: boolean
      action_description: string | null
      urgency: IMMEDIATE | THIS_WEEK | THIS_MONTH
      confidence: 0.00–1.00
      source_domains: [string]
      
  strategic_posture:
    assessment: string                 # 2–3 sentences: overall state of the enterprise
    primary_risk: string               # single biggest risk this period
    primary_opportunity: string        # single biggest opportunity
    
  decisions_needed_this_week: [string] # specific decisions executives must make
  
  confidence_summary:
    high_confidence_signals: number    # signals > 0.75 confidence
    low_confidence_signals: number     # signals < 0.40 (should be acted on cautiously)
    data_freshness_ok: boolean
```

---

## Compression Algorithm

```
Tier 2 → Tier 3 compression (compound intelligence engine handles this):
  Inputs: 200 domain insights
  Algorithm: cross-domain pattern detection + causal chain mapping
  Output: ~20 compound insights (10× compression)

Tier 3 → Tier 4 compression (insight compression engine):

  Step 1: Score all active compound insights by relevance score:
    relevance = (magnitude × 0.40) + (confidence × 0.30) + (time_sensitivity × 0.20) + (novelty × 0.10)
    
  Step 2: Rank by relevance score (descending)
  
  Step 3: De-duplicate: if two insights share > 70% semantic overlap, keep only the higher-ranked
  
  Step 4: Filter for decision-relevance: does this insight require executive action?
    - If action window > 90 days AND no human review required: defer to weekly digest
    - If action_required: always include
    
  Step 5: Select top 5 for executive packet (by relevance score after filters)
  
  Step 6: Generate executive packet content:
    - title: extract key concept from insight.title (5–10 words)
    - one_liner: insight.implications.for_strategy (truncated to 1 sentence if needed)
    - Apply plain-language rewriting (no jargon, no acronyms in headline signal)
```

---

## Information Loss Tracking

Compression necessarily loses information — the engine tracks what was compressed away:

```yaml
compression_audit:
  packet_id: string
  insights_considered: number          # total compound insights in pool
  insights_included: number            # included in executive packet
  insights_deferred: number            # relevant but deferred to weekly digest
  insights_archived: number            # below relevance threshold; archived
  
  potentially_significant_archived:
    # Insights that were archived but had moderate confidence (0.40–0.60)
    # These may become significant if new signals corroborate them
    - insight_id: string
      relevance_score: number
      archive_reason: string
      
  review_trigger: boolean              # should a human review the compression decisions?
```

If > 30% of insights were archived with relevance > 0.50: flag for human compression review.

---

## Compression Quality Metrics

```yaml
compression_quality:
  period: YYYY-MM
  
  # Compression ratios
  tier_1_to_2_ratio: number            # signals → domain insights
  tier_2_to_3_ratio: number            # domain insights → compound insights
  tier_3_to_4_ratio: number            # compound insights → executive packet
  
  # Quality measures
  executive_action_rate: 0.00–1.00     # % of executive packets that led to a decision
  missed_signal_rate: 0.00–1.00        # % of important events not flagged in packet (from retro)
  false_urgency_rate: 0.00–1.00        # % of IMMEDIATE signals that turned out not urgent
  
  # Calibration
  executive_satisfaction_score: 0.00–1.00  # periodic survey: is the packet useful?
```

Target: action_rate > 0.50 (most packets should drive at least one decision), missed_signal_rate < 0.10.

---

## Governance

**Packet generation:** Daily automated (05:00 UTC); on-demand for T4+
**Compression algorithm changes:** T3 Architecture approval
**Human compression review:** Available for T3+ to see full uncompressed signal set
**Insight archive:** Compressed-away insights retained 90 days in `memory/compound-intelligence/insight-archive.jsonl`
**Calibration:** Monthly retro: what important signals did we compress away? Feed back to algorithm
