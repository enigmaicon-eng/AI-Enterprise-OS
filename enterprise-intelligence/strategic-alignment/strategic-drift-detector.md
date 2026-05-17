# Strategic Drift Detector
**ID:** SI-ALIGN-003 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Detects when organizational execution is drifting away from declared strategy without explicit decision to change course. Distinguishes intentional pivots (documented, authorized) from accidental drift (emerging, unnoticed). Surfaces drift before it becomes irreversible.

---

## Drift Taxonomy

| Drift Type | Description | Typical Cause | Detection Signal |
|------------|-------------|--------------|-----------------|
| SCOPE_DRIFT | Features/capabilities being built that aren't in strategy | Product enthusiasm without governance | Work items not linked to OKR or initiative |
| PRIORITY_DRIFT | Low-priority items consuming high proportion of capacity | Squeaky wheel dynamics | Velocity vs. strategic allocation mismatch |
| TIMELINE_DRIFT | Strategic initiatives slipping without acknowledged tradeoffs | Optimism bias, poor estimation | Schedule variance > 20% on STRATEGIC_BET items |
| QUALITY_DRIFT | Cutting corners in ways that undermine strategic assets | Velocity pressure | Gate pass rate declining in strategic domains |
| DECISION_DRIFT | Tactical decisions accumulating into implicit strategy change | Death-by-a-thousand-decisions | Contradiction cluster in decision-archive |
| RESOURCE_DRIFT | Budget/headcount migrating from strategic to maintenance | Urgency bias | Monthly portfolio alignment score declining trend |
| MARKET_DRIFT | Strategy based on outdated market model | Stale intelligence | Market signal diverges from strategy assumptions |
| CAPABILITY_DRIFT | Building capabilities not required by strategy | Empire building | New skill acquisitions with no OKR connection |

---

## Detection Protocol

### Continuous Monitoring (hourly)
- Work item routing: every work unit must have OKR or initiative reference or auto-flagged as unlinked
- Decision contradiction scan: new decisions are compared to strategic direction for contradictions
- Resource flow: budget consumption by initiative class vs. target (weekly delta)

### Daily Analysis
- Velocity vs. strategic allocation: is actual work distribution matching planned allocation?
- OKR progress velocity trends: is any critical KR velocity declining unexpectedly?

### Weekly Pattern Analysis
- Aggregate work distribution vs. strategy: what % of completed work contributed to declared strategy?
- Initiative progress vs. plan: schedule variance trending analysis
- Cross-team drift: are teams coordinating in ways consistent with strategic direction?

### Monthly Trend Analysis
- Strategic coherence score: overall alignment trend over 90 days
- Market model freshness check: are strategy assumptions still supported by current market intelligence?
- Decision pattern analysis: is the decision corpus drifting from strategic commitments?

---

## Drift Severity Schema

```yaml
drift_event:
  drift_id: DRF-{YYYYMMDD}-{seq}
  drift_type: [see taxonomy]
  severity: MINOR | MODERATE | SIGNIFICANT | CRITICAL
  
  # What drifted
  domain: string                      # which area of the strategy
  description: string
  evidence: [refs]
  
  # Magnitude
  magnitude_estimate: string          # how far from intended course
  trajectory: WORSENING | STABLE | IMPROVING
  
  # Attribution
  drift_duration_days: number         # how long has this been accumulating?
  
  # Recommended Response
  recommended_action: MONITOR | FLAG | CORRECT | ESCALATE
  correction_options: [string]
  escalation_tier_required: T2 | T3 | T4
  
  # Status
  status: DETECTED | ACKNOWLEDGED | CORRECTING | RESOLVED | ACCEPTED_PIVOT
  detected_at: ISO8601
  acknowledged_at: ISO8601 | null
```

---

## Drift vs. Intentional Pivot

Not all drift is bad. Sometimes the organization discovers better paths. The detector distinguishes:

**Drift (unintentional):** No explicit decision recorded; contradicts existing decision-archive records; no updated OKR or initiative classification.

**Pivot (intentional):** New decision recorded in `strategic-decision-archive.md`; OKRs updated; affected initiatives reclassified; executive notification sent.

**Protocol:** When SIGNIFICANT or CRITICAL drift is detected:
1. Check `strategic-decision-archive.md` for a recent decision that could explain it
2. If found: update context, close drift event with "pivot acknowledged"
3. If not found: escalate as unintentional drift requiring correction

---

## Strategic Coherence Score

Monthly composite metric summarizing overall strategy-execution alignment:

```
strategic_coherence_score = (
  portfolio_alignment_mean × 0.30 +     # from portfolio-strategy-alignment.md
  okr_coverage_rate × 0.20 +            # % of work contributing to OKRs
  decision_consistency_rate × 0.20 +    # decisions consistent with strategy
  resource_allocation_alignment × 0.15 + # budget distribution vs. strategy
  market_model_freshness × 0.15         # how current are strategy assumptions
)

Bands:
  ≥ 0.80: COHERENT
  0.65–0.79: ADEQUATE
  0.50–0.64: DRIFTING → T3 review required
  < 0.50: CRITICALLY_DRIFTED → T4 immediate + strategy refresh trigger
```

---

## Governance

**Alert routing:** SIGNIFICANT drift → T3 alert; CRITICAL drift → T4 alert within 2 hours
**Intentional pivot governance:** Pivots must be recorded in strategic-decision-archive.md within 48 hours of decision
**Constitutional binding:** C-001 — drift corrections are human decisions; detector only surfaces and recommends
