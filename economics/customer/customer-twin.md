# Customer Digital Twin
**ID:** CI-TWIN-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** PM Org + Analytics Org | **Updated:** 2026-05-16

---

## Purpose

Maintains a live, continuously updated digital model of each customer segment's behavior, needs, satisfaction, and risk profile. The customer twin enables proactive product decisions, early churn detection, and personalized value delivery at scale without requiring individual customer surveillance. Operates at segment-level by default; individual-level only where contractually and legally authorized.

---

## Twin Architecture

```
customer-intelligence/
  customer-twin.md              ← this file (system definition)
  customer-feedback-pipeline.md ← signal ingestion
  churn-prediction-system.md    ← survival analysis engine
  user-research-infrastructure.md ← qualitative signal capture
  product-telemetry-pipeline.md ← behavioral instrumentation

memory/customer-intelligence/
  segment-models.yaml           ← live segment twin states
  customer-signals.jsonl        ← incoming signal stream
  churn-predictions.jsonl       ← churn probability history
  satisfaction-history.jsonl    ← NPS/CSAT time series
  research-findings.jsonl       ← qualitative insights
```

---

## Customer Segment Model

```yaml
segment_twin:
  segment_id: SEG-{NNN}
  segment_name: string
  
  profile:
    size_customers: number
    size_arr_usd: number
    tier: ENTERPRISE | MID_MARKET | SMB | TRIAL
    primary_use_cases: [string]
    maturity_level: EARLY | GROWING | MATURE | AT_RISK
    
  behavioral_model:
    avg_daily_active_users: number
    feature_adoption_rates: {feature_id: 0.00–1.00}
    workflow_completion_rates: {workflow_id: 0.00–1.00}
    support_ticket_rate_per_user_per_month: number
    integrations_active: [string]
    
  satisfaction:
    nps_score: -100–100
    nps_trend: IMPROVING | STABLE | DECLINING
    csat_score: 0.00–5.00
    last_survey_date: ISO8601
    
  health_indicators:
    engagement_score: 0.00–1.00          # composite of DAU, features, workflows
    expansion_signal: CONTRACTING | STABLE | EXPANDING
    churn_probability_90d: 0.00–1.00
    churn_risk_tier: HEALTHY | WATCH | AT_RISK | CRITICAL
    
  needs_model:
    expressed_needs: [string]            # from feedback, support, research
    latent_needs: [string]              # inferred from behavior patterns
    unmet_needs: [string]              # expressed but not solved
    next_best_action: string
    
  updated_at: ISO8601
  data_freshness:
    behavioral_data: ISO8601            # from product telemetry
    satisfaction_data: ISO8601          # from surveys/NPS
    research_data: ISO8601              # from qualitative research
```

---

## Signal Integration

The customer twin synthesizes signals from five sources:

| Source | Signal Type | Update Frequency | Weight |
|--------|-----------|-----------------|--------|
| Product telemetry | Behavioral (DAU, feature usage, workflows) | Real-time | 0.35 |
| Support tickets | Problem signals, frustration indicators | Daily | 0.20 |
| NPS/CSAT surveys | Satisfaction, loyalty | Monthly/Quarterly | 0.20 |
| User research | Deep qualitative needs | Ad hoc (monthly target) | 0.15 |
| Sales/CS signals | Expansion/contraction, relationship health | Weekly | 0.10 |

Signal fusion uses weighted EWMA (λ=0.3) for smoothing; sudden changes flagged as anomalies.

---

## Churn Risk Classification

```
churn_risk_tier assignment:
  HEALTHY:  churn_probability_90d < 0.10
  WATCH:    churn_probability_90d 0.10–0.24
  AT_RISK:  churn_probability_90d 0.25–0.49
  CRITICAL: churn_probability_90d ≥ 0.50

On tier change:
  HEALTHY → WATCH:    Create watch ticket; CS team notified
  WATCH → AT_RISK:    Create intervention ticket; T3 PM + CS review; intervention plan required
  AT_RISK → CRITICAL: T3 immediate; executive CS engagement; 72-hour intervention plan
  Any → HEALTHY:      Log success pattern; extract to research-findings.jsonl
```

---

## Privacy and Data Governance

**Data minimization:** Segment-level by default. Individual-level data only where:
- Customer has provided informed consent (B2C)
- Enterprise contract explicitly authorizes (B2B)
- Legal basis documented per regulatory-conflict-matrix.md

**PII handling:**
- No PII in segment_twin records (aggregated only)
- Individual-level signals pseudonymized at ingestion (customer_id hash)
- Raw behavioral logs: 90-day retention, then aggregated
- Survey response data: 2-year retention (de-identified after 90 days)

**Regulatory compliance:**
- GDPR Art. 22: no automated individual decisions with legal effect from twin
- CCPA: segment data is not "personal information" (aggregated); individual data subject to opt-out
- EU AI Act: customer twin classified as GENERAL_PURPOSE AI system (not high-risk)

---

## Product Decision Integration

The customer twin feeds directly into product decisions:

```
Inputs to PM Org:
  - Weekly: Top 3 unmet needs per segment (auto-generated from needs_model)
  - Monthly: Feature adoption heat map across segments
  - On churn tier change: intervention recommendation with supporting evidence
  - Quarterly: Segment health summary for QBR/board reporting
  
Roadmap influence:
  - Features with high AT_RISK/CRITICAL segment adoption: P0 quality priority
  - Expressed needs appearing in ≥ 3 segments: automatically proposed to backlog
  - Declining engagement on feature X: UX research trigger
```

---

## Governance

**Data access:** PM Org (read all), CS Org (read own segments), Analytics Org (read all + write)
**Individual-level access:** T3 approval + legal basis required
**Segment creation/deletion:** T3 PM + Analytics Org approval
**Audit:** All twin updates to `memory/customer-intelligence/twin-update-log.jsonl`
**Review:** Monthly twin accuracy review (compare predictions vs. actuals)
