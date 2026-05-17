# OKR Intelligence Engine
**ID:** SI-ALIGN-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Maintains intelligent, real-time understanding of OKR health, alignment, and trajectory. Goes beyond simple progress tracking to detect OKR drift, predict achievement probability, flag alignment gaps between execution and strategy, and recommend corrective actions before quarter-end.

---

## OKR Data Model

```yaml
okr_set:
  set_id: OKR-{YYYY}-Q{N}
  period: {start: ISO8601, end: ISO8601}
  level: COMPANY | DIVISION | TEAM
  
  objectives:
    - obj_id: OBJ-{set_id}-{seq}
      title: string
      strategic_theme: string            # maps to strategic option or radar item
      owner: agent_id
      
      key_results:
        - kr_id: KR-{obj_id}-{seq}
          title: string
          metric: string                 # what is measured
          baseline: number
          target: number
          unit: string
          current_value: number
          last_updated: ISO8601
          
          # Intelligence fields
          achievement_probability: 0.00–1.00   # ML-projected
          confidence_trend: IMPROVING | STABLE | DECLINING | CRITICAL
          at_risk: boolean
          velocity_required: number            # rate needed to hit target by EOQ
          velocity_current: number             # actual current rate (EWMA)
          
          # Signals
          contributing_workflows: [WF-*]
          blocking_items: [string]
          positive_signals: [string]
          risk_signals: [string]
```

---

## Achievement Probability Model

For each KR, the engine maintains a probability estimate using:

```
1. VELOCITY MODEL
   current_velocity = EWMA(weekly_delta, λ=0.3)
   extrapolated_value = current + current_velocity × remaining_weeks
   probability_from_velocity = P(extrapolated_value ≥ target)

2. RISK ADJUSTMENT
   for each blocking_item: probability -= risk_weight
   for each positive_signal: probability += signal_weight
   
3. HISTORICAL BASE RATE
   Similar KRs in past quarters: P(achieved | similar_start_conditions)
   
4. ENSEMBLE
   final_probability = 0.50 × velocity_model + 0.30 × risk_adjusted + 0.20 × base_rate
```

Probability is recalculated daily and after any significant signal.

---

## OKR Health Classification

| Level | Achievement Probability | Color | Required Action |
|-------|------------------------|-------|----------------|
| ON_TRACK | ≥ 0.75 | GREEN | Monitor weekly |
| WATCH | 0.55–0.74 | YELLOW | Weekly review; identify accelerators |
| AT_RISK | 0.35–0.54 | AMBER | Bi-weekly T3 review; corrective plan required |
| IN_DANGER | 0.15–0.34 | RED | Weekly T3 sync; scope adjustment consideration |
| OFF_TRACK | < 0.15 | CRITICAL | T4 escalation; kill or pivot decision within 2 weeks |

---

## OKR Alignment Analysis

The engine performs two types of alignment analysis:

### Vertical Alignment (strategy → execution)
For each company/division OKR, checks:
- Are sufficient team KRs contributing to it? (coverage check)
- Are contributing teams on track? (bottleneck detection)
- Is there a strategic option or scenario supporting this objective? (context check)
- Does this KR still reflect the strategic intent from the planning session? (drift detection)

### Horizontal Alignment (team-to-team)
- Are dependent KRs at compatible progress levels?
- Are there KRs that conflict (teams pulling in different directions)?
- Are there KRs with shared work that is not coordinated?

---

## OKR Drift Detection

OKR drift occurs when the execution diverges from the intent of the OKR without an explicit decision to change course. The engine detects:

1. **Metric drift:** Team is measuring a different metric than agreed KR definition
2. **Scope drift:** Teams doing work not contributing to any KR (invisible work)
3. **Strategy drift:** KRs were set against a now-outdated strategic context
4. **Definition drift:** KR success criteria has been informally changed without OKR update

Drift detection triggers a flag in `strategic-alignment/strategic-drift-detector.md`.

---

## End-of-Quarter Forecast

At week 8 of a 12-week quarter, the engine generates:
1. Achievability forecast per KR (probability + narrative)
2. Stretch/baseline/floor achievement scenarios
3. Recommended scope adjustments for AT_RISK/IN_DANGER KRs
4. Attribution: what decisions/events most changed trajectory this quarter?

Forecast packaged into `enterprise-playbooks/03-quarterly-planning.md` input.

---

## OKR Retrospective Intelligence

After each quarter, the engine produces:
- Prediction accuracy: how well did T+4 week predictions correlate with final outcomes?
- Achievement distribution: what % ON_TRACK / AT_RISK / OFF_TRACK by objective level
- Ambition calibration: were targets too easy (>90% achieved)? too hard (<40% achieved)?
- Pattern analysis: which types of KRs most commonly drift? most commonly succeed?

Target calibration: company-level KRs should achieve 70% mean score (ambitious but achievable).

---

## Governance

**Access:** OKR data T2+ (own team); T3+ (org-wide)
**Privacy:** Team-level health scores shared within team only; org-level aggregate to T3+
**Audit:** All probability updates logged with methodology
