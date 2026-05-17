# Strategic Intelligence Engine
**ID:** SI-CORE-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Master coordinator for the Enterprise Strategic Intelligence and Decision Support System. Fuses signals from all OS intelligence sources into a unified strategic picture, generates intelligence packages for executive consumption, and surfaces strategic opportunities and threats with confidence-rated recommendations.

**Core promise:** No strategic decision is made without synthesized intelligence. No intelligence goes unsurfaced. No opportunity is missed due to signal fragmentation.

---

## Improvement Cycle

```
OBSERVE (collect signals from 12 source systems)
  → FUSE (cross-source synthesis via intelligence-fusion-layer.md)
  → DETECT (opportunity/threat classification via opportunity-threat-radar.md)
  → ANALYZE (scenario modeling via scenario-planning-engine.md)
  → RECOMMEND (executive options via executive-decision-engine.md)
  → TRACK (outcome measurement via strategic-decision-archive.md)
  → CALIBRATE (forecaster accuracy via SI persistence layer)
```

Cycle frequency: continuous signal ingestion; full synthesis every 24 hours; executive package generation every Monday 06:00 UTC.

---

## Source Systems (12)

| Source | Signal Types | Refresh Rate |
|--------|-------------|-------------|
| research-intelligence/ | market, competitive, technical signals | Per investigation |
| data-intelligence/ | anomaly, pattern, predictive signals | Real-time + 24hr |
| knowledge-base/ | organizational knowledge gaps, staleness | Daily |
| compliance-framework/ | regulatory changes, risk register | Daily |
| org-intelligence/ | team health, velocity, capacity | Per sprint |
| digital-twins/ | org, workflow, delivery twin states | 15-min sync |
| predictive-intelligence/ | forecasts across 4 dimensions | 15-min update |
| enterprise-telemetry/ | all 15 event bus topics | Real-time |
| people-intelligence/ | skill gaps, concentration risks | Daily |
| work-cognition/ | bottlenecks, flow efficiency | Per cycle |
| customer/ | customer health, escalations | Per event |
| external-signals/ | market feeds, competitor events | Continuous |

---

## Intelligence Domains

```
STRATEGIC_MARKET:      market sizing, trends, timing windows, adjacency opportunities
COMPETITIVE:           competitor moves, positioning gaps, threat vectors
TECHNOLOGY:            tech debt risk, innovation opportunities, platform gaps
ORGANIZATIONAL:        capability gaps, capacity constraints, culture signals
REGULATORY:            compliance deadline risk, regulatory opportunity windows
FINANCIAL:             cost trajectory, efficiency gains, investment prioritization
PRODUCT:               user signal synthesis, feature adoption, NPS trajectories
OPERATIONAL:           bottleneck impact, quality trend, delivery velocity
```

---

## Strategic Signal Schema

```yaml
strategic_signal:
  signal_id: SS-{YYYYMMDD}-{seq}
  domain: STRATEGIC_MARKET | COMPETITIVE | TECHNOLOGY | ORGANIZATIONAL | REGULATORY | FINANCIAL | PRODUCT | OPERATIONAL
  classification: OPPORTUNITY | THREAT | EMERGING | NEUTRAL | WATCH
  confidence: 0.00–1.00
  urgency: IMMEDIATE | THIS_QUARTER | THIS_YEAR | LONG_TERM
  impact_magnitude: TRANSFORMATIVE | HIGH | MEDIUM | LOW
  source_systems: [list of contributing systems]
  evidence_refs: [evidence IDs from evidence-systems/]
  detected_at: ISO8601
  valid_until: ISO8601 or null
  synthesis_notes: string
  recommended_action: string | null
  escalation_tier: T2 | T3 | T4 | T5
```

---

## Orchestration Protocol

### Step 1 — Signal Collection (continuous)
All 12 source systems publish signals to `enterprise.strategic.signals` event bus topic. The strategic intelligence engine subscribes with `EXACTLY_ONCE` delivery guarantee.

### Step 2 — Triage and Deduplication
Signals are de-duplicated by semantic similarity (cosine distance < 0.12 = duplicate). Related signals are clustered via DBSCAN (ε=0.35). Cluster representatives are forwarded to the fusion layer.

### Step 3 — Intelligence Fusion (24-hour cycle)
`intelligence-fusion-layer.md` performs cross-source synthesis. Conflicting signals are routed to `synthesis-systems/contradiction-reconciler.md` before fusion.

### Step 4 — Opportunity/Threat Classification
`opportunity-threat-radar.md` classifies fused intelligence into the strategic opportunity/threat catalog. Signals with confidence < 0.55 are flagged WATCH only.

### Step 5 — Scenario Activation
Any OPPORTUNITY or THREAT with impact_magnitude ≥ HIGH triggers automatic scenario generation in `scenario-planning-engine.md` (if not already covered by an active scenario).

### Step 6 — Executive Package Assembly
`executive-intelligence-dashboard.md` compiles the weekly strategic package, incorporating:
- Top 5 opportunities ranked by (confidence × magnitude)
- Top 5 threats ranked by (urgency × magnitude)
- 3 active scenarios with probability distributions
- Recommended actions with authorization requirements
- OKR alignment health from `strategic-alignment/`

### Step 7 — Calibration
All signal predictions are tracked against outcomes. Monthly calibration via `memory/strategic-intelligence/forecast-calibration.yaml`.

---

## Governance

**Constitutional bindings:** C-001 (human decisions), C-003 (explainability), C-007 (data minimization)
**Authorization matrix:**
- Signal classification AUTO (T2)
- Scenario activation T3
- Executive package approval T4
- Strategic recommendation to board T5 + board
**Audit:** All signals logged to `memory/strategic-intelligence/signal-log.jsonl` (append-only)
**Hard constraints:**
- Cannot suppress a THREAT signal above HIGH magnitude
- Cannot publish strategic intelligence containing TOP_SECRET data to T2 recipients
- Cannot generate board-level recommendations without T4 review
