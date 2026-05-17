# Product Telemetry Pipeline
**ID:** CI-TEL-001 | **Tier:** T2 | **Class:** STANDARD
**Owner:** Analytics Org + Engineering Org | **Updated:** 2026-05-16

---

## Purpose

Instruments product behavior to produce a continuous stream of behavioral signals that feed the customer twin, churn prediction system, and product analytics. Telemetry is the quantitative backbone of customer intelligence — without it, decisions are based on anecdote. This pipeline defines what to measure, how to instrument it, and how signals flow from product events to decision inputs.

---

## Instrumentation Schema

Every product event follows the canonical event schema:

```yaml
product_event:
  event_id: string                       # UUID v4
  event_name: string                     # e.g., "workflow.started", "feature.used"
  event_category: string                 # see taxonomy below
  
  actor:
    user_id_hash: string                 # pseudonymized
    session_id: string
    customer_id_hash: string
    segment_id: string
    
  context:
    feature_id: string | null
    workflow_id: string | null
    integration_id: string | null
    
  properties: {string: any}              # event-specific properties
  
  timing:
    client_timestamp: ISO8601
    server_timestamp: ISO8601
    latency_ms: number | null
    
  schema_version: "1.0"
```

---

## Event Taxonomy

```yaml
event_categories:
  engagement:
    - session.started / session.ended
    - feature.viewed / feature.used / feature.completed
    - workflow.started / workflow.completed / workflow.abandoned
    
  adoption:
    - feature.first_use                  # first time user uses feature
    - integration.connected / integration.disconnected
    - onboarding.step_completed / onboarding.completed
    
  collaboration:
    - agent.invoked / agent.completed
    - approval.requested / approval.completed
    - shared_view.opened
    
  errors:
    - feature.error (with error_code, error_message)
    - workflow.failed (with failure_reason)
    - api.timeout / api.error
    
  conversion:
    - trial.started / trial.converted / trial.expired
    - plan.upgraded / plan.downgraded
    - renewal.completed / renewal.failed
```

---

## Pipeline Stages

```
Stage 1: Collection
  - SDK (web/mobile/API) sends events to collection endpoint
  - Events validated against schema (reject malformed events)
  - Events buffered in append-only landing zone: memory/telemetry/raw-events.jsonl
  - Max latency from event to landing: < 5 seconds

Stage 2: Enrichment
  - Resolve user_id_hash → segment_id (lookup)
  - Resolve feature_id → feature metadata (name, launch date, owner)
  - Add server_timestamp (authoritative)
  - Compute latency_ms if timing data available
  
Stage 3: Stream Processing (real-time, < 1 min lag)
  - Compute rolling metrics per session: DAU, feature usage depth
  - Detect anomaly signals: session length spike, error rate spike, abandonment cluster
  - Publish to event bus topic: enterprise.telemetry (for real-time consumers)
  
Stage 4: Batch Aggregation (hourly)
  - Compute per-customer aggregate metrics (hourly snapshots)
  - Update customer twin behavioral_model fields
  - Feed churn prediction feature store with latest behavioral signals
  
Stage 5: Analytics Store (daily)
  - Aggregate daily session data into analytics-ready tables
  - Power product analytics dashboard
  - Feed feature adoption reports
```

---

## Key Metrics Computed

```yaml
behavioral_metrics:
  per_customer:
    dau_7d: number                       # daily active users (7-day average)
    dau_trend_30d: number                # slope (positive = growing)
    feature_adoption_breadth: number     # count of features used ≥ 1× in 30 days
    feature_adoption_depth: {feature_id: sessions_used}
    workflow_completion_rate: 0.00–1.00
    session_frequency_per_user_per_week: number
    error_rate_7d: 0.00–1.00
    support_deflection_rate: 0.00–1.00  # % of error-path users who resolved without support
    
  per_feature:
    adoption_rate: 0.00–1.00             # % of eligible users who used it
    retention_rate_30d: 0.00–1.00       # % who used it again after first use
    completion_rate: 0.00–1.00          # started → completed flow
    avg_time_to_complete_minutes: number
    error_rate: 0.00–1.00
    nps_correlation: number              # Pearson correlation with NPS score
```

---

## Privacy and Consent

**Data minimization:** Collect only what is listed in this document. No additional instrumentation without Analytics Org + Privacy review.
**Consent:** Event collection disclosed in product privacy notice; opt-out mechanism required for B2C.
**PII:** user_id pseudonymized at collection point; original mapping stored in secure key store (access: Analytics Org lead only, with audit log).
**Retention:** Raw events 90 days; hourly aggregates 1 year; daily aggregates 3 years; customer-level behavioral snapshots in twin: indefinite (aggregated, no PII).
**EU AI Act:** Telemetry feeds customer twin which is general-purpose AI system; no automated individual decisions with legal effect.

---

## Governance

**Instrumentation changes:** Any new event or property requires Analytics Org review + Privacy sign-off
**SDK versioning:** Breaking SDK changes require Engineering Org + T3 approval
**Access:** Analytics Org (full), PM Org (aggregate reports only), no individual-level access for non-Analytics agents
**Audit:** Schema changes to `memory/telemetry/schema-changelog.jsonl`
**Coverage target:** ≥ 95% of product flows instrumented; coverage gap report monthly
