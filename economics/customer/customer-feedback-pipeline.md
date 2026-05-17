# Customer Feedback Pipeline
**ID:** CI-FBK-001 | **Tier:** T2 | **Class:** STANDARD
**Owner:** PM Org + Analytics Org | **Updated:** 2026-05-16

---

## Purpose

Ingests, normalizes, classifies, and routes customer feedback from all channels into the customer twin and product backlog. Prevents feedback from being siloed in support tickets, Slack messages, and survey responses that never reach product decisions. All customer signal flows through this pipeline.

---

## Ingestion Channels

| Channel | Connector | Volume (est.) | Format |
|---------|-----------|--------------|--------|
| In-product NPS | Product telemetry | ~500/month | Survey response |
| CSAT post-support | Support system | ~200/month | 1-5 score + comment |
| Customer interviews | User research | ~20/month | Transcript |
| Support tickets | Jira/Zendesk | ~1,000/month | Freeform text |
| Sales call notes | CRM | ~50/month | Structured notes |
| Community posts | Community platform | ~300/month | Forum posts |
| App store reviews | App store API | ~100/month | Review text + rating |
| Social mentions | Social monitoring | ~200/month | Post/mention text |

---

## Pipeline Stages

```
Stage 1: Ingest
  - Connectors poll each channel per their configured interval
  - Raw signals appended to memory/customer-intelligence/customer-signals.jsonl
  - Deduplication: hash(channel + signal_id) for idempotency
  
Stage 2: Normalize
  - Extract: sentiment score (-1.0 to 1.0), channel, timestamp, customer_id (hash)
  - Segment resolution: map customer_id → segment_id via segment-models.yaml
  - Language detection + translation to English for non-English signals
  
Stage 3: Classify
  - Topic classification (taxonomy below) — primary + up to 2 secondary
  - JTBD signal: is this feedback about a job-to-be-done? Classify JTBD if yes
  - Urgency scoring: 0.00–1.00 (high urgency = explicit frustration + high-value customer)
  - Signal type: BUG_REPORT | FEATURE_REQUEST | SATISFACTION | CHURN_SIGNAL | PRAISE | OTHER
  
Stage 4: Route
  - BUG_REPORT: → Engineering Org ticket queue (severity: urgency × customer_tier)
  - FEATURE_REQUEST: → PM Org backlog (auto-tagged with segment + JTBD)
  - CHURN_SIGNAL: → Customer twin churn prediction; CS team alert if high-value
  - SATISFACTION: → Customer twin satisfaction model update
  - PRAISE: → Customer twin (positive signal) + success pattern library
  
Stage 5: Aggregate
  - Hourly: update segment satisfaction EWMA
  - Daily: generate topic frequency report (top 10 topics × segment)
  - Weekly: trend analysis (rising/falling topics, emerging themes)
  - Monthly: full feedback synthesis report to PM Org + T3
```

---

## Topic Taxonomy

```yaml
feedback_topics:
  product_performance:
    - speed_latency
    - reliability_uptime
    - scalability
    
  feature_quality:
    - missing_feature
    - feature_works_wrong
    - feature_confusing_to_use
    - feature_request_new
    
  integration:
    - connector_broken
    - connector_missing
    - api_issue
    
  onboarding:
    - setup_difficulty
    - documentation_gap
    - training_needed
    
  pricing_value:
    - too_expensive
    - value_not_clear
    - billing_issue
    
  support:
    - slow_response
    - resolution_quality
    - agent_helpfulness
    
  security_compliance:
    - security_concern
    - compliance_requirement
    - data_handling
```

---

## Feedback Signal Schema

```yaml
feedback_signal:
  signal_id: FS-{NNN}
  channel: string
  received_at: ISO8601
  
  customer:
    customer_id_hash: string             # pseudonymized
    segment_id: string
    tier: ENTERPRISE | MID_MARKET | SMB | TRIAL
    
  content:
    raw_text: string | null              # if text-based
    rating: number | null                # if rating-based
    language_original: string
    translated: boolean
    
  classification:
    signal_type: string
    primary_topic: string
    secondary_topics: [string]
    sentiment_score: -1.00–1.00
    urgency_score: 0.00–1.00
    jtbd_classified: boolean
    jtbd_id: string | null
    
  routing:
    routed_to: [string]                  # where signal was sent
    ticket_id: string | null             # if ticket created
```

---

## Quality and Coverage

```
Feedback coverage targets:
  - NPS response rate: ≥ 25% (alert if < 15%)
  - CSAT response rate: ≥ 30%
  - Pipeline processing lag: < 4 hours from ingestion to routing
  - Classification accuracy: ≥ 85% (validated via monthly sample review)
  
Coverage gaps:
  - Segments with < 5 signals/month: flag for proactive research outreach
  - Topics with < 2 signals/month: may be gap in collection (not absence of issue)
  - Low-NPS customers with no feedback: CS team outreach trigger
```

---

## Governance

**Data retention:** Raw signals 90 days (then aggregated); classified signals 2 years
**PII handling:** Customer names/emails stripped at ingestion; ID pseudonymized
**Access:** PM Org + CS Org (read); Analytics Org (read + write); no direct access to raw text for T1 agents
**Audit:** All routing decisions to `memory/customer-intelligence/feedback-routing-log.jsonl`
**Accuracy review:** Monthly sample of 50 signals re-classified by PM Org; accuracy tracked
