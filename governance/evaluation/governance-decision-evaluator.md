# Governance Decision Evaluator

## Role
Evaluates the quality of governance decisions — approvals, policy verdicts, compliance findings, escalation routing — to detect systematic governance failures, ensure decisions are well-reasoned, and provide calibration data for governance evolution.

## Governance Decision Types Evaluated

```
DECISION_TYPE               EVALUATION_TIMING           EVALUATOR
──────────────────────────────────────────────────────────────────────────────
Policy verdict (ALLOW/DENY)  Post-execution outcome      Automated retrospective
Approval decision            Post-outcome review          Automated + human spot check
Compliance finding           Finding lifecycle close      Automated
Escalation routing           Resolution quality           Automated
Risk assessment              Risk realization tracking    Automated (quarterly)
Exception grant              Exception outcome            Automated (at expiry)
Constitutional evaluation    Zero-tolerance check         Automated (every instance)
```

## Evaluation Dimensions

### Policy Verdict Quality
```
CORRECT:    verdict matches what a reasonable human expert would decide
PRECISION:  verdict was specific enough to be actionable
TIMELINESS: verdict produced within SLA
CONSISTENCY: similar cases received similar verdicts

MEASUREMENT:
  - human spot-check: 5% of policy verdicts reviewed monthly
  - automated: track override rates (high override = poor verdict quality)
  - regression test: verdict against golden test set (evaluations/golden-tests.md)
```

### Approval Decision Quality
```
ACCURACY: was the approval correct in hindsight (did the approved action go well)?
THOROUGHNESS: did reviewer check all relevant dimensions?
SLA_ADHERENCE: decision within SLA?
REVERSIBILITY_AWARENESS: irreversible decisions called out?
```

### Finding Calibration
```
SEVERITY_ACCURACY: was the assigned severity correct? (overdue = likely under-severity)
RECURRENCE_RATE: findings with same root cause indicate governance gap, not one-off
ROOT_CAUSE_DEPTH: did finding identify root cause vs. symptom?
```

## Governance Decision Quality Score

```
governance_decision_quality = (
  accuracy       × 0.40
  + consistency  × 0.25
  + timeliness   × 0.20
  + thoroughness × 0.15
)

QUALITY_BANDS:
  EXCELLENT: >= 0.90
  GOOD:      0.75-0.89
  ACCEPTABLE: 0.60-0.74
  POOR:       < 0.60 → governance process review trigger
```

## Systematic Governance Failure Detection

```
SIGNAL: override_rate > 0.20 for any policy over 30d
  → policy may be misconfigured; route to policy-optimizer

SIGNAL: severity_downgrade_rate > 0.15 (findings upgraded later)
  → initial assessment too lenient; calibrate finding-management

SIGNAL: approval_regret_rate > 0.10 (approved things that caused incidents)
  → approval criteria need tightening; route to governance-evolution

SIGNAL: consistency_score < 0.70 for same decision type
  → governance needs standardization; generate consistency playbook
```

## Governance Evaluation Report (Monthly)
```
Generated: last day of each month
Audience: Governance Lead (T4), Compliance Officer (T4)
Contents:
  - decision quality scores by decision type
  - override and regret rates
  - systematic failure patterns detected
  - top 3 governance process improvement recommendations
```

## Persistence
`memory/evaluation/governance-evaluations.yaml`
`memory/evaluation/governance-decision-history.jsonl`
