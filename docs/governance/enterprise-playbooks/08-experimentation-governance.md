# PB-008: Experimentation Governance

**Version:** 1.0.0 | **Owner:** PM + Analytics Org | **Cadence:** Per-experiment + Weekly triage | **Tier:** T2 | **Class:** ELEVATED

## Purpose
Govern all product experiments (A/B tests, multivariate tests, holdout studies) from hypothesis registration through analysis and decision — preventing P-hacking, ensuring statistical rigor, protecting customer experience via guardrails, and building institutional knowledge from every experiment.

## Experimentation Principles

```
PRINCIPLE 1: Pre-registration required
  Hypothesis, metrics, sample size, and stopping criteria must be registered
  BEFORE any traffic is exposed. Post-hoc hypothesis changes are prohibited.

PRINCIPLE 2: Guardrails are non-negotiable
  Every experiment defines HARD guardrail metrics that trigger immediate stop.
  No experiment may continue when a guardrail is breached.

PRINCIPLE 3: One primary metric per experiment
  Multiple secondary metrics permitted, but statistical significance applies
  only to the primary metric. No "cherry-picking" secondary metrics as primary.

PRINCIPLE 4: Bayesian early stopping only
  Classical NHST p-values require full duration. Bayesian models may stop
  early but only when probability_of_superiority meets pre-registered threshold.

PRINCIPLE 5: Business decisions are human decisions
  Statistical significance is necessary but not sufficient to ship.
  PM + exec judgment required on business impact and strategic alignment.
```

---

## Experiment Lifecycle

```
IDEA → PRE-REGISTRATION → REVIEW → APPROVED → RUNNING
  → [guardrail breach] EMERGENCY_STOP → ANALYSIS → STOPPED
  → [duration complete] ANALYSIS → DECISION
  → [SHIP] FULL_ROLLOUT (→ WF-011) → LEARNINGS_DOCUMENTED
  → [ITERATE] NEXT_HYPOTHESIS → PRE-REGISTRATION
  → [KILL] KILL_DECISION → LEARNINGS_DOCUMENTED
  → [INCONCLUSIVE] REVISIT → PRE-REGISTRATION or KILL
```

---

## Experiment Pre-Registration

**Required before any traffic exposure**
**Submitted via:** Jira EXPERIMENT project + `wiki/experiments/{exp_id}/design.md`

```
REQUIRED FIELDS:
  experiment_id:       EXP-{NNN}
  hypothesis:          "If we [change], then [primary metric] will [direction] by [estimate],
                        because [mechanism]"
  primary_metric:      single metric; must have baseline + minimum detectable effect (MDE)
  secondary_metrics:   up to 5; directional; NOT used for go/no-go
  guardrail_metrics:   metrics that trigger immediate stop if breached
                       (e.g., "page error rate must not exceed 2×baseline")
  sample_size:         calculated via power analysis (alpha=0.05, power=0.80 minimum)
  allocation:          control % vs. treatment % (equal split preferred)
  duration:            minimum run time based on sample size + traffic (≥ 2 business cycles)
  stopping_criteria:   Bayesian: probability_of_superiority >= 0.95 (ship) or <= 0.05 (kill)
  audience:            who is included / excluded from the experiment
  feature_flag:        flag name; rollback mechanism
  risks:               customer experience risks; rollback plan
```

### Power Analysis Requirements
```
MINIMUM POWER: 0.80 (80% chance of detecting true effect)
ALPHA:         0.05 (5% false positive rate)
MDE:           must be set to business-meaningful threshold (not "any improvement")
SAMPLE SIZE:   computed from MDE + baseline variance; analytics-agent validates

RULE: Experiments cannot run for less than their calculated minimum duration,
      even if early Bayesian stopping conditions are met before the minimum.
      (Minimum = 2 full business cycles, typically 2 weeks minimum)
```

---

## Weekly Experiment Triage

**Cadence:** Every Wednesday, 45 minutes
**Participants:** PM Lead, Analytics Lead, Engineering Lead
**Purpose:** Intake, approve, and review active experiments

### Agenda
```
TIME    TOPIC                                              OWNER          OUTPUT
──────────────────────────────────────────────────────────────────────────────────────────
0:00    New experiment proposals: design review            PM + Analytics Decision: APPROVE/REJECT/REVISE
0:20    Active experiments: health check                   Analytics      Green/Yellow/Red status
0:30    Guardrail status: any breaches?                    Analytics      Immediate action if breach
0:35    Experiments ready for decision: results review     PM + Analytics SHIP/KILL/INCONCLUSIVE
0:40    Learning extraction: what did we learn?            PM             Update hypothesis library
0:45    Close
```

### New Experiment Approval Criteria
```
APPROVED if:
  □ Hypothesis is crisp (specific, falsifiable)
  □ Primary metric clearly defined with baseline + MDE
  □ Guardrails defined and technically enforceable
  □ Sample size calculation submitted and validated
  □ Duration >= 2 business cycles
  □ Feature flag + rollback tested in staging
  □ No concurrent overlapping experiments on same surface (saturation check)

REJECTED if:
  □ No falsifiable hypothesis (exploratory fishing)
  □ No guardrail metrics defined
  □ MDE set too small (requiring years of traffic)
  □ Overlapping with another running experiment (novelty/interaction effects)
  □ Cannot be rolled back in < 10 minutes

REVISE if:
  □ Hypothesis needs clarification
  □ Sample size needs recalculation
  □ Guardrails need strengthening
```

---

## Guardrail Monitoring

**Automated, real-time — analytics-agent monitors every 15 minutes during business hours**

```
GUARDRAIL TYPES:
  RELIABILITY:   Page error rate; API error rate; latency p99
  REVENUE:       Conversion rate; checkout completion; ARR proxy
  ENGAGEMENT:    Session depth; return visits; core action completion
  COMPLIANCE:    Any data processing change must not trigger consent violation

BREACH PROTOCOL:
  BREACH DETECTED:
    1. Immediate alert to PM + Analytics + Engineering (Slack + PagerDuty)
    2. Automatic traffic shift to 0% treatment (if auto-stop configured)
    3. Guardrail stop event logged (permanent record)
    4. Root cause analysis within 24hr (→ WF-013 postmortem if SEV2+)

  MANUAL OVERRIDE (NOT PERMITTED):
    Guardrail breaches cannot be manually overridden to continue experiment
    Exception: DPO/CAIO certification that breach is measurement artifact, not real
    Exception requires: written explanation + T4 PM VP approval + logged permanently
```

---

## Statistical Analysis Protocol

### When to Read Results
```
DO NOT READ RESULTS UNTIL:
  □ Minimum run duration has elapsed (2 business cycles)
  □ Minimum sample size has been reached in both groups
  □ No significant changes to product (deploys) during experiment window
  □ Traffic allocation has been stable (no ramp changes)

PEEKING PROBLEM:
  Do not make decisions based on in-flight results before minimum duration
  Exception: guardrail breach (stop immediately regardless of duration)
  Bayesian monitoring is permitted for guardrails only, not go/no-go
```

### Analysis Standards
```
FOR BAYESIAN ANALYSIS:
  Report: probability_of_superiority(treatment > control)
  SHIP:   >= 0.95
  KILL:   <= 0.05
  INCONCLUSIVE: 0.05–0.94 → re-run with larger sample or kill

FOR FREQUENTIST ANALYSIS (legacy / comparison):
  Report: p-value + confidence interval + effect size (Cohen's d)
  SHIP:   p < 0.05 AND effect_size >= MDE AND CI does not cross zero
  KILL:   p > 0.30 (large sample; clearly no effect)
  INCONCLUSIVE: 0.05 <= p <= 0.30 → power analysis to determine if worth re-running

ALWAYS REPORT:
  - Confidence interval (not just p-value)
  - Effect size and practical significance
  - Breakdown by key segments (mobile vs. desktop; new vs. returning)
  - Any data quality issues (SRM — sample ratio mismatch check)
```

### Sample Ratio Mismatch (SRM) Check
```
REQUIRED before analysis:
  Expected allocation: 50/50 (or configured split)
  Actual allocation: within 1% of expected (chi-squared test, p > 0.01)
  
SRM DETECTED:
  Experiment results are INVALID — do not make decisions
  Root cause: redirect bug, logging issue, framework bug
  Action: fix, re-run from scratch; logged as data quality incident
```

---

## Experiment Decision Framework

### Go/No-Go Decision Meeting (per experiment, 30 min)

**Participants:** PM, Analytics, Engineering, VP Product (for P1 experiments)

```
SHIP decision requires:
  □ Primary metric: statistically significant improvement
  □ All guardrails: not breached during experiment
  □ Secondary metrics: no significant degradation (two-sided check)
  □ Segment analysis: no major negative subgroup (e.g., mobile regression)
  □ Business judgment: magnitude of improvement justifies rollout cost
  □ SRM check: passed
  → Approved for full rollout via WF-011

KILL decision:
  □ Primary metric: no improvement or statistically significant degradation
  □ Clear null result with sufficient sample size
  □ Learning: what do we now know? Update hypothesis library.
  → Feature flag set to 0%; code reviewed for removal or iteration

INCONCLUSIVE decision:
  Options: (a) re-run with larger sample, (b) iterate hypothesis, (c) kill
  NOT PERMITTED: indefinitely leave as "needs more time"
  Decision deadline: within 2 weeks of inconclusive call
```

---

## Experiment Portfolio Governance

### Monthly Experiment Health Review (30 min)
```
  - Portfolio: how many experiments running / completed / queued?
  - Velocity: experiments completed per sprint (target >= 2/quarter per team)
  - Quality: guardrail breach rate; SRM incident rate
  - Learning rate: hypotheses confirmed vs. disproven (target: 30-40% win rate)
  - Backlog health: are we testing the most important hypotheses?
```

### Hypothesis Library
**Maintained in:** `wiki/experiments/hypothesis-library.md`

```
ENTRY PER EXPERIMENT:
  - Hypothesis tested
  - Result: CONFIRMED / REJECTED / INCONCLUSIVE
  - Effect size observed
  - Learnings: what does this tell us about our customers?
  - Next hypothesis: what does this result suggest we test next?

PURPOSE:
  Prevents re-testing the same hypothesis
  Builds institutional knowledge about what moves metrics
  Informs product strategy with evidence base
```

---

## AI-Driven Experiments Special Governance

```
AI experiments (model variants, prompt changes, recommendation systems):
  ADDITIONAL REQUIREMENTS:
    □ Bias check: experiment must not introduce demographic disparity > 5%
    □ Constitutional alignment: treatment model must score >= 0.99
    □ DPO sign-off: if experiment involves new personal data processing
    □ CAIO review: if experiment changes a HIGH_RISK AI system's behavior
    □ EU AI Act: reclassification check if experiment changes system purpose

  ADDITIONAL GUARDRAILS:
    - Model confidence must not drop > 10% in treatment
    - Hallucination rate must not increase > 1%
    - Human override rate must not increase > 5%
```

---

## Governance Checkpoints

```
C-001: Experiment go/no-go decisions are human decisions; AI provides analysis
C-004: All experiments, results, and decisions permanently recorded (hypothesis library)
PRE_REGISTRATION: No traffic exposure before pre-registration is approved
GUARDRAIL: Guardrail breaches cannot be overridden to extend experiment
SRM: Invalid experiments (SRM detected) cannot be used for decisions
P_HACKING: Post-hoc hypothesis changes strictly prohibited; prior version archived
AI_EXPERIMENTS: CAIO + DPO sign-off required for AI system behavioral changes
```

## Health Metrics

```
METRIC                                  TARGET
──────────────────────────────────────────────────────────────────────────────────────────
Pre-registration rate (before traffic)  = 100%
Guardrail breach rate                   < 0.05 experiments
Win rate (primary metric improvement)   30–40% (lower = poor hypotheses; higher = too safe)
SRM incident rate                        < 0.03 experiments
Average experiment cycle time           <= 4 weeks
Experiments with learnings documented   = 100%
Inconclusive experiments resolved < 2wk >= 0.90
Statistical power (retrospective)       >= 0.80 per experiment
```

## Workflow Integrations

```
WF-009  Experimentation     → this playbook operationalizes WF-009
WF-011  Rollout Governance  → SHIP decision triggers WF-011 for full rollout
WF-006  AI Feature Delivery → AI experiments require AI governance from PB-007
WF-012  Incident Management → guardrail breach at scale may trigger incident
WF-004  Roadmap Governance  → experiment results may change roadmap priorities
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
Peeking and stopping early on good results  P-hacking; inflated false positive rate
Hypothesis changed after results seen       Scientific fraud; untrustworthy conclusions
Guardrail set so wide it never triggers     Customers harmed by unchecked regressions
"We'll run it a bit longer" when inconc.    Opportunity cost; no decision discipline
Win rate 0% or > 60%                       Hypotheses too poor or too safe respectively
Experiments never killed (permanent A/B)   Code bloat; interaction effects; tech debt
No segment analysis in winning experiments  Mobile regression undetected; partial harm
```
