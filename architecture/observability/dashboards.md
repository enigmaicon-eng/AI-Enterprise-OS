---
layer: observability
type: dashboard-specifications
version: 1.0.0
created: 2026-05-09
owner: analytics-agent
---

# Dashboard Specifications

Canonical views that operators and agents use to understand system health. Each dashboard has a purpose, audience, required metrics, and update cadence.

---

## DASH-01 — Delivery Health Dashboard

**Audience:** Delivery manager, PM, human operator
**Cadence:** Updated at sprint close; available on-demand
**Location:** `wiki/operations/dashboards/delivery-health.md`

### Required Panels

| Panel | Metric | Display | Alert Threshold |
|-------|--------|---------|----------------|
| Deployment Frequency | D1 | Trend (last 8 sprints) | < 1/sprint |
| Lead Time for Changes | D2 | Average + P90 | > 2 weeks |
| Change Failure Rate | D3 | % with trend | > 20% |
| MTTR | D4 | Average + max | > 3 days |
| Sprint Velocity | N/A | Story points delivered | > 20% carry-over |
| Unplanned Work % | N/A | % of sprint items not in plan | > 30% |

### Narrative Section

A two-paragraph narrative written by delivery-agent at sprint close:
- Paragraph 1: What the numbers mean in context this sprint
- Paragraph 2: Trend vs. prior sprint and any anomalies to investigate

---

## DASH-02 — Quality Gate Health Dashboard

**Audience:** Supervisor agent, PM, QA lead
**Cadence:** Updated after each gate evaluation; summary at sprint close
**Location:** `wiki/operations/dashboards/gate-health.md`

### Required Panels

| Panel | Metric | Display | Alert Threshold |
|-------|--------|---------|----------------|
| Gate First-Pass Rate | Q1 | Per gate (G1–G8) | < 70% any gate |
| Gate Cycle Count | Q2 | Average per gate | > 2 cycles |
| Gate Exception Rate | G2 | Count per sprint | > 2/sprint |
| Defect Escape Rate | Q3 | % | > 5% |
| Security Block Rate | Q4 | % | > 15% |

### Gate Heatmap

Visual grid: gates (rows) × sprints (columns). Color: green (all pass), yellow (1 exception), red (fail or bypass).

---

## DASH-03 — AI Quality Dashboard

**Audience:** Analytics agent, PM (AI features), human operator
**Cadence:** Updated per release; rolling 7-day and 30-day views
**Location:** `wiki/operations/dashboards/ai-quality.md`

### Required Panels

| Panel | Metric | Display | Alert Threshold |
|-------|--------|---------|----------------|
| Eval Score by Feature | A1 | Per-feature scores | < 0.85 |
| Judge Agreement Rate | A2 | % agreement | < 80% |
| Quality Degradation Signal | A3 | 7d vs. 30d rolling average | > 10% drop |
| Safety Filter FP Rate | A4 | % per day | > 2% |
| Production Sample Quality | A3 | Random sample scores | N/A |

### Model Registry Panel

Tracks which model version powers each AI feature and the date of last model change.

| Feature | Model | Version | Last Changed | Eval Score |
|---------|-------|---------|-------------|-----------|
| _(populated when AI features ship)_ | — | — | — | — |

---

## DASH-04 — Governance Compliance Dashboard

**Audience:** Supervisor agent, security agent, human operator
**Cadence:** Weekly; updated at sprint close
**Location:** `wiki/operations/dashboards/governance.md`

### Required Panels

| Panel | Metric | Display | Alert Threshold |
|-------|--------|---------|----------------|
| Governance Compliance Rate | G1 | % this sprint | < 95% |
| Gate Exceptions | G2 | List with reasons | Any without documented authorization |
| ADR Coverage | G3 | % L-tier work with ADR | < 100% |
| Open Blocking Questions | M1 | Count + age | Any blocking > 7 days |
| Risk Registry Status | M4 | Overdue reviews | Any HIGH risk overdue |

### Exception Log

Inline table from `wiki/decisions/gate-exceptions.md`:

| Date | Gate | Reason | Authorized By | Follow-up Due |
|------|------|--------|--------------|--------------|
| _(none yet)_ | — | — | — | — |

---

## DASH-05 — Organizational Knowledge Health

**Audience:** Docs agent, orchestrator, PM
**Cadence:** Weekly
**Location:** `wiki/operations/dashboards/knowledge-health.md`

### Required Panels

| Panel | Metric | Display | Alert Threshold |
|-------|--------|---------|----------------|
| Open Question Age | M1 | Per question, days open | Blocking > 7d, High > 14d |
| Memory Freshness | M2 | % up to date | < 90% |
| Wiki Coverage | M3 | % workflows with wiki page | < 100% |
| Risk Registry Staleness | M4 | Count overdue | > 0 |
| Memory Index Size | N/A | Line count | > 180 |

---

## Dashboard Maintenance Policy

1. Dashboards are generated as markdown files at the specified cadence.
2. The analytics-agent is responsible for computing and populating panels.
3. If input data is missing (pre-operational), panels show "—" with a note: "Baseline period: no data yet."
4. Dashboards are NOT deleted — archive old versions with date suffix.
5. Dashboard pages are never a source of truth — always link to source metrics files.
