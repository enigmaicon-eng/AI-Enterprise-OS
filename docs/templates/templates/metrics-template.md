---
type: metrics-framework
version: "2.0"
id: METRICS-<YYYY-MM-DD>-<slug>
status: draft | approved | active | archived
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
author: analytics-agent
prd-ref: prds/<slug>.md
feature: <feature or initiative name>
owner: analytics-agent
review-cadence: weekly | biweekly | monthly
---

# Metrics Framework: <Feature / Initiative Name>

> **Status:** `DRAFT`
> **PRD:** `prds/<slug>.md`
> **Dashboard:** `<link when built>`
> **First review date:** `<T+48h post-launch>`

---

## ① Framework Summary

| Field | Value |
|-------|-------|
| **Feature** | `<feature name>` |
| **Primary user segment** | `<who this measures>` |
| **North star metric** | `<metric name>` |
| **Baseline** | `<current value>` |
| **Target** | `<target value>` by `<date>` |
| **Analytics events required** | `<N events>` — see §⑤ |
| **A/B test planned** | Yes / No |
| **PII in events** | Yes (see §⑦) / No |

---

## ② North Star Metric

The single metric that best captures value delivered to users.

**Metric name:** `<exact name>`

**Definition:** `<Precise, unambiguous definition. How is this calculated? What counts as a conversion/action/event?>`

**Formula (if computed):**
```
<metric> = <numerator> / <denominator> × 100
Example: Task completion rate = tasks_completed / tasks_started × 100
```

**How measured:**
- Data source: `<warehouse / analytics tool / database>`
- Query / event: `<event name or SQL stub>`
- Aggregation: `<per-user / per-session / absolute count>`
- Frequency: `<real-time / daily / weekly>`

**Baseline:** `<current value>` as of `<date>` (source: `<where>`)

**Target:** `<value>` by `<date>`

**Confidence:** High / Medium / Low — `<rationale>`

**Why this metric:** `<1–2 sentences on why this captures real user value, not just activity>`

---

## ③ Driver Metrics

Leading indicators that predict movement in the north star. Each driver must have a stated causal hypothesis.

| Metric | Definition | Baseline | Target | By | Source | Cadence | Causal Link |
|--------|-----------|---------|--------|-----|--------|---------|------------|
| `<metric>` | `<exact definition>` | `<value>` | `<target>` | `<date>` | `<source>` | daily/weekly | `<how this drives north star>` |

**Driver hierarchy:** `<describe how drivers connect to north star — funnel or causal chain>`

---

## ④ Guardrail Metrics

Metrics that must NOT degrade. These protect user experience, system health, and business outcomes that are not the focus of this feature but could be harmed by it.

| Metric | Current Value | Floor (Must Stay ≥) | Why Protected | Alert If Breached |
|--------|-------------|--------------------|--------------|--------------------|
| `<metric>` | `<value>` | `<minimum>` | `<why it matters>` | YES — `<notify who>` |
| Error rate | `<X%>` | ≤ `<Y%>` | Core reliability SLA | YES — on-call |
| P99 latency | `<Xms>` | ≤ `<Yms>` | User experience | YES — on-call |

---

## ⑤ Counter-Metrics

Watch for unintended consequences. These are not guardrails — they're signals of unexpected side effects.

| Risk Metric | Why We Watch It | Alert Threshold | Action if Triggered |
|------------|----------------|----------------|-------------------|
| `<metric>` | `<unintended effect we want to catch>` | `<threshold>` | `<investigate / rollback>` |

---

## ⑥ Event Taxonomy

Every analytics event required for this framework. Events must be instrumented before launch.

### Event Naming Convention

`<object>_<action>` — object (noun), action (past tense verb)

Examples: `task_started`, `feature_viewed`, `form_submitted`, `error_displayed`

### Required Events

| Event Name | Trigger | Properties | Priority | Owner |
|-----------|---------|-----------|---------|-------|
| `<object_action>` | `<when this fires exactly>` | `{ "property": "type" }` | must-have / nice-to-have | engineer-agent |

### Event Schema Standard

```json
{
  "event": "<object_action>",
  "timestamp": "ISO-8601",
  "user_id": "uuid (hashed if PII)",
  "session_id": "uuid",
  "properties": {
    "<key>": "<value>"
  },
  "context": {
    "platform": "web | mobile | api",
    "version": "<app-version>",
    "feature_flag": "<flag-name>:<value>"
  }
}
```

### Events by User Journey Step

```
Step 1: <user action>
  → fires: <event_name>
  → properties: { <key>: <type> }

Step 2: <user action>
  → fires: <event_name>

Step N (goal reached): <user action>
  → fires: <event_name>
```

---

## ⑦ A/B Experiment Design

_Complete this section if an A/B test is planned. Skip if not._

### 7.1 Experiment Hypothesis

> We believe `<change>` will increase `<metric>` by `<N%>` for `<user segment>` because `<evidence>`.
> We will know this is true when `<observable signal in data>`.

### 7.2 Experiment Parameters

| Parameter | Value |
|-----------|-------|
| **Control group** | `<description of current behavior>` |
| **Treatment group(s)** | `<description of new behavior>` |
| **Split** | `<50/50 | 80/20 | other>` |
| **Randomization unit** | `<user-level | session-level | account-level>` |
| **Minimum detectable effect (MDE)** | `<X% relative change>` |
| **Required sample size** | `<N users per variant>` |
| **Estimated runtime** | `<N days to reach significance>` |
| **Significance threshold** | α = 0.05 (two-tailed) |
| **Power** | 80% |

### 7.3 Experiment Guardrails

These metrics must not regress in treatment group. Automatic stop-loss if breached.

| Metric | Stop-Loss Threshold |
|--------|-------------------|
| `<metric>` | `<value>` |

### 7.4 Analysis Plan

- **Primary analysis:** t-test / chi-square / Mann-Whitney on primary metric
- **Secondary analyses:** `<subgroup analyses or secondary metrics>`
- **Novelty effect check:** `<how to detect / correct for novelty bias>`
- **Decision criteria:** `<when to declare winner / call inconclusive>`

---

## ⑧ Dashboard Requirements

### 8.1 Dashboard Sections

1. **Overview**: North star + week-over-week trend
2. **Funnel**: Step-by-step conversion through the feature flow — highlight drop-off points
3. **Segments**: Breakdown by `<user type / platform / cohort / geography>`
4. **Health**: Error rate, latency, guardrail metrics — real-time
5. **Experiments**: A/B results with confidence intervals (if applicable)
6. **Retention**: `<if applicable — D1/D7/D30 cohort retention>`

### 8.2 Dashboard SLAs

| Panel | Data Freshness | Source |
|-------|--------------|--------|
| Error rate | < 5 minutes | `<monitoring tool>` |
| North star | Daily | `<warehouse>` |
| Funnel | Daily | `<analytics tool>` |

---

## ⑨ PII & Data Compliance

| Data Element | Classification | In Events? | Handling |
|-------------|---------------|-----------|---------|
| User ID | Internal | Yes | Hashed/pseudonymized |
| Email | Confidential | NO | Never log |
| `<field>` | `<class>` | Yes/No | `<how handled>` |

**GDPR-compliant:** `<how deletion requests affect event data>`

**Retention policy:** `<raw events: N days | aggregated: N years>`

---

## ⑩ Review Cadence

| Cadence | Focus | Owner | Duration |
|---------|-------|-------|---------|
| T+48h post-launch | Error rates, core funnel — catch regressions | analytics-agent | 30 min |
| T+7d post-launch | Week 1 north star trend vs. target | analytics-agent + PM | 1 hour |
| Weekly (ongoing) | Driver metrics vs. targets; experiment status | analytics-agent | 30 min |
| Monthly | North star progress; cohort retention; guardrail health | analytics-agent + PM | 1 hour |
| Quarterly | Full framework review; retire stale metrics | analytics-agent + PM | 2 hours |

---

## ⑪ Data Availability Audit

| Data Need | Source | Available Today | Gap | Resolution |
|-----------|--------|----------------|-----|-----------|
| `<data need>` | `<source>` | Yes / No | `<what's missing>` | `<action>` |

**Pre-launch data gap check:** All must-have events must be instrumented and verified in staging before release.

- [ ] All must-have events firing in staging
- [ ] Event schema validated against standard
- [ ] Dashboard showing data for at least 48h in staging
- [ ] PII handling verified (no raw PII in event stream)
