# People Intelligence Governance

## Role
Defines the privacy protections, consent framework, data handling policies, and ethical guardrails for all people intelligence systems. Ensures that skill tracking, collaboration analysis, and growth analytics serve team members and the organization without creating surveillance, bias, or unintended consequences.

## Governing Principles

```
PRINCIPLE 1: SERVE THE INDIVIDUAL FIRST
  People intelligence data exists to help team members grow and succeed.
  No data collected purely for monitoring, ranking, or disciplinary purposes.
  Every data point must have a clear beneficial use case.

PRINCIPLE 2: TRANSPARENCY
  Every agent and human must know what is tracked and why.
  The full people intelligence data model is documented and accessible.
  Team members can view their own data at any time.

PRINCIPLE 3: MINIMAL FOOTPRINT
  Collect only what is necessary for stated purposes.
  Aggregate rather than individual tracking where aggregate is sufficient.
  Retention aligned to purpose: growth data = 2 years; anonymized aggregates = indefinite.

PRINCIPLE 4: NO HARMFUL COMPARISON
  Individual performance data never used for ranking teams against each other.
  No publishing of individual quality scores or skill levels to peers.
  Org-level dashboards: aggregate distributions only (no named individuals at T3 and below).

PRINCIPLE 5: HUMAN OVERRIDE
  Any person can flag their data as contested and request review.
  Inferred skill levels can be disputed and corrected with evidence.
  Growth plan recommendations are advisory; never mandatory.
```

## Data Access Controls

```
DATA TYPE               T1 ACCESS     T2 ACCESS          T3 ACCESS           T4+ ACCESS
───────────────────────────────────────────────────────────────────────────────────────────
Own skill graph         Full read      N/A (same)         Full read/write      Full
Others' skill graph     None           Aggregates only    Anonymized distrib.  Full (own team)
Own growth analytics    Full read      N/A (same)         Full read/write      Full
Others' growth          None           None               Managed reports only Full (own team)
Collaboration graph     Own edges      Team edges         Team + org view      Full org
Concentration risks     Own area       Team area          Org-wide             Full org + history
Org health aggregate    Tier only      Scores             Full dimensions      Full + team breakdown
```

## Consent Framework

```
WHAT IS ALWAYS COLLECTED (no opt-out; org necessity):
  - Workflow execution records (required for operations)
  - Quality gate outcomes (required for quality management)
  - Handoff and approval events (required for governance audit)

WHAT IS CONSENT-BASED:
  - Explicit skill level declarations (voluntary)
  - Growth plan preferences (voluntary)
  - Coaching session notes (opt-in for written records)
  
WHAT IS NEVER COLLECTED:
  - Communication content (Slack, email text) — only metadata
  - Subjective sentiment or personality assessments
  - Anything not derivable from documented OS operations
```

## Individual Data Rights

```
VIEW OWN DATA:
  Any team member: GET /people-intelligence/me → full data profile
  Includes: skill evidence, quality trends, growth trajectory, coaching history

CONTEST DATA:
  Any team member: POST /people-intelligence/me/contest
  Fields: data_type, specific_record_id, contestation_reason
  Review: T3 + data steward within 5 business days
  Outcome: ACCEPTED (data corrected) | REJECTED (explanation provided)
  Contested records flagged: inferred_confidence reduced; routing weight reduced

DELETE OWN DATA:
  GDPR Art.17 right to erasure applies
  Aggregated org metrics: anonymized aggregates retained; individual records deleted
  Lineage: deletion proof per data-fabric/data-lineage-tracker.md
```

## Bias Monitoring

```
BIAS CHECKS (monthly automated):
  Skill level distribution by team / tenure cohort → statistical parity check
  Quality score distribution → no systematic divergence by team composition
  Coaching frequency → equitable distribution (not concentrated on specific groups)
  Growth plan recommendations → reviewed for consistent quality across all individuals
  
IF statistical disparity detected (p < 0.05):
  Flag to T4 + DPO for review
  Hold: pause automated recommendations until review complete
  Remediation: if bias confirmed → model recalibration + retrospective correction
```

## Governance Reporting

```
QUARTERLY PEOPLE INTELLIGENCE GOVERNANCE REPORT:
  - Data subjects: total agents + humans tracked
  - Consent status: all opt-in items confirmed
  - Contestation requests: N received, N resolved, N pending
  - Access log summary: who accessed what category at what tier
  - Bias check results: statistical parity outcomes per category
  - Data deletion requests: N received, N completed
  - Retention review: records approaching retention limit + planned action
  → Delivered to: DPO + T4 + any team members who requested it
```

## Persistence
`memory/people-intelligence/consent-records.yaml`
`memory/people-intelligence/contestation-log.jsonl`
`memory/people-intelligence/bias-check-results.yaml`
`memory/people-intelligence/access-audit.jsonl`
