# Portfolio-Strategy Alignment Monitor
**ID:** SI-ALIGN-002 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Continuously validates that the execution portfolio (active initiatives, sprints, resource allocations) remains aligned with the declared strategic direction. Detects misalignments, quantifies their cost, and routes corrections to the appropriate decision authority. Ensures no initiative persists in the portfolio without explicit strategic justification.

---

## Portfolio Item Classification

Every active initiative, project, and significant allocation is classified:

| Class | Description | Justification Required |
|-------|-------------|----------------------|
| STRATEGIC_BET | Core strategic investment; directly drives competitive position | Active OBJ reference + T4 approval |
| STRATEGIC_OPTION | Investment that creates future optionality | Active scenario reference + T3 approval |
| MAINTENANCE | Sustaining operational capability | Annual review + T2 approval |
| DEBT_REDUCTION | Reducing technical/process/organizational debt | Architecture review reference |
| COMPLIANCE | Regulatory or governance requirement | Obligation reference from compliance-framework/ |
| EXPERIMENTAL | Hypothesis-driven innovation; bounded investment | Experiment registration in WF-009 |
| ZOMBIE | No clear strategic justification; candidate for kill | Kill recommendation generated automatically |

---

## Alignment Scoring

For each portfolio item, the alignment score measures connection to declared strategy:

```
alignment_score = (
  okr_coverage × 0.30 +        # Does this contribute to active OKRs?
  strategic_option_coverage × 0.25 +  # Does this support an active strategic option?
  radar_relevance × 0.20 +     # Does this address an active radar item?
  resource_efficiency × 0.15 + # Is resource use proportional to strategic value?
  time_horizon_match × 0.10    # Is this the right time to do this?
)

Thresholds:
  ≥ 0.75: STRONGLY_ALIGNED
  0.55–0.74: ALIGNED
  0.35–0.54: WEAKLY_ALIGNED
  < 0.35: MISALIGNED → zombie detection + kill recommendation
```

---

## Zombie Initiative Detection

Initiatives fall into zombie status when:
- alignment_score < 0.35 for two consecutive sprint reviews
- Contributing OKR has been retired/cancelled without initiative followup
- Strategic option that justified the initiative has been REJECTED
- Initiative has not produced a qualifying artifact in > 60 days
- Resource allocation persists but work is blocked with no escalation

Zombie detection triggers:
1. Automatic classification as ZOMBIE
2. Kill recommendation generated to `strategic-options-generator.md` (DIVEST class)
3. T3 notification within 24 hours
4. T4 escalation if not acted on within 1 sprint

---

## Resource Alignment Analysis

Monthly resource allocation review comparing:
- Budget allocated by initiative class
- Budget allocated by strategic theme
- Budget allocated by time horizon (now/near/far)

Strategic portfolio target (typical enterprise):
```
STRATEGIC_BET: 40–50% of portfolio budget
STRATEGIC_OPTION: 10–20%
MAINTENANCE + DEBT_REDUCTION: 20–30%
COMPLIANCE: 10–15%
EXPERIMENTAL: 5–10%
```

When actual allocation deviates > 15% from target in any class, a rebalancing recommendation is generated.

---

## Initiative Retirement Protocol

When an initiative is marked for retirement (kill/divest):

1. **Impact assessment:** What work is blocked? What dependencies are affected?
2. **Knowledge capture:** Trigger `knowledge-capture/workflow-knowledge-extraction.md`
3. **Resource reallocation:** Route released budget/headcount to highest-priority waiting initiative
4. **Stakeholder notification:** Automated notification to all contributors and dependent teams
5. **Archive:** Initiative artifacts archived with retirement rationale

Timeline: Retirement decision → team notification → 1 sprint wind-down → formal closure.

---

## Strategic Review Integration

The portfolio-strategy alignment monitor feeds directly into:
- `enterprise-playbooks/14-portfolio-reviews.md` (monthly portfolio review)
- `enterprise-playbooks/05-quarterly-planning.md` (quarterly kill/keep decisions)
- `executive-intelligence/executive-decision-engine.md` (rebalancing decision packages)
- `recursive-self-improvement/evolution-systems/org-adaptation-engine.md` (org misalignment signals)

---

## Dashboard Panel

```
PORTFOLIO ALIGNMENT SUMMARY
  Total active initiatives: 47
  STRONGLY_ALIGNED: 21 (45%)
  ALIGNED: 16 (34%)
  WEAKLY_ALIGNED: 7 (15%)
  ZOMBIE CANDIDATES: 3 (6%)   ← Action required
  
  Budget alignment:
    STRATEGIC_BET: 38%    [target 40–50%] ← slightly low
    MAINTENANCE:   34%    [target 20–30%] ← HIGH → recommend rebalance
    EXPERIMENTAL:   4%    [target 5–10%]  ← low
    
  Zombie pipeline: 3 initiatives pending kill decision
    - INIT-2026-017 (87 days without artifact)
    - INIT-2026-023 (OKR cancelled 30 days ago)
    - INIT-2026-031 (alignment score 0.21 for 3 sprints)
```
