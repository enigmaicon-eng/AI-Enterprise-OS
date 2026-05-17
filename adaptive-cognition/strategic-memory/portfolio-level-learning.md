# Portfolio-Level Learning
**ID:** AC-SM-002 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Strategy Org + Delivery Org | **Updated:** 2026-05-17

---

## Purpose

Captures and encodes learning that spans multiple projects — patterns visible only at portfolio scale that would be invisible from any single project's perspective. Portfolio-level learning informs planning, resource allocation, and delivery strategy across the entire project portfolio.

---

## Portfolio Learning Scope

```
PORTFOLIO LEARNING ADDRESSES:

  DELIVERY PATTERNS:
    Which delivery approaches (sequencing, team size, cadence) consistently succeed?
    Which fail, and under what conditions?

  ESTIMATION ACCURACY:
    Is the portfolio systematically over- or under-estimating certain work types?
    How has estimation accuracy changed over time?

  DEPENDENCY PATTERNS:
    Which cross-project dependencies consistently create friction?
    Which inter-team coordination patterns are most effective?

  QUALITY PATTERNS:
    Which practices correlate with high quality gate pass rates?
    Which quality issues recur despite fixes?

  RISK PATTERNS:
    Which categories of risk are most frequently underestimated?
    Which mitigation strategies have been most effective?

  VELOCITY PATTERNS:
    Which factors are most predictive of delivery velocity?
    Which team compositions or work structures produce consistent velocity?
```

---

## Portfolio Learning Record Schema

```yaml
portfolio_learning_record:
  record_id: PLR-{YYYY}-{seq4}
  domain: DELIVERY | ESTIMATION | DEPENDENCY | QUALITY | RISK | VELOCITY
  title: string
  pattern: string              # concise statement of the observed pattern
  evidence_base:
    project_count: integer     # ≥ 3 required for portfolio scope
    project_refs: [anonymized] # anonymized project identifiers
    time_period: ISO8601/ISO8601
    sample_size: integer
  confidence: float [0.65, 1.00]
  effect_size: float           # practical significance (not just statistical)
  applicability:
    conditions: [string, ...]  # when does this pattern hold?
    exceptions: [string, ...]  # when does it NOT hold?
  recommended_action: string   # what should change based on this learning?
  status: PROPOSED | ACTIVE | UNDER_REVIEW | SUPERSEDED | ARCHIVED
  created: ISO8601
  last_reviewed: ISO8601
```

---

## Portfolio Learning Discovery Protocol

```
QUARTERLY PORTFOLIO LEARNING REVIEW:

  1. AGGREGATE EVIDENCE COLLECTION
     Consolidate post-execution reflection records from all projects this quarter
     Aggregate quality gate results, estimation deltas, escalation records
     Build cross-project comparison matrices for each learning domain

  2. PATTERN IDENTIFICATION
     Statistical threshold: pattern must appear in ≥ 3 projects this quarter
     OR: pattern has appeared in ≥ 2 consecutive quarters
     Effect size threshold: practical significance > 10% difference

  3. CONTRADICTION CHECK
     New proposed learning must not contradict existing ACTIVE portfolio learning records
     If contradiction detected: flag both records for T3 joint review
     Do NOT activate new record until contradiction is resolved

  4. DRAFT AND REVIEW
     Strategy Org drafts portfolio_learning_record (PROPOSED)
     T3 review by Delivery Org + Strategy Org
     On approval: status → ACTIVE
     Active records fed into planning heuristics and capacity models

  5. RETROSPECTIVE APPLICATION
     For each active portfolio learning record: was it applied in this quarter's planning?
     If not: why not? Was it irrelevant, unknown, or ignored?
     Unused applicable records surfaced in quarterly planning retrospective
```

---

## Portfolio Learning Application Points

```
WHERE PORTFOLIO LEARNING IS APPLIED:

  PROJECT PLANNING:
    Orchestrator retrieves applicable PLRs when a new project plan is being formed
    Relevant delivery patterns, risk patterns, and velocity patterns surfaced as context
    PM Agent receives PLR context before producing project brief

  ESTIMATION:
    Estimation bias patterns applied as calibration offsets
    "This work type has historically been underestimated by 40%" surfaced to estimators

  DEPENDENCY PLANNING:
    Known cross-project dependency friction patterns surfaced in dependency planning
    Recommended mitigation strategies from prior success patterns included

  RESOURCE ALLOCATION:
    Team composition and velocity correlation patterns inform staffing proposals
    Executive memory (AC-SM-001) receives portfolio learning summaries quarterly
```

---

## Portfolio Learning Library (Current)

```
ACTIVE PORTFOLIO LEARNING RECORDS:
  (library grows over time; initially empty for new OS deployments)

  PLR-2026-0001: [to be created when first portfolio-scale pattern is observed]

  TARGET LIBRARY METRICS (after 12 months operation):
    Total ACTIVE records:    target 15–30
    Domain coverage:         all 6 domains represented
    Avg confidence:          target > 0.75
    Application rate:        > 70% of applicable records used in planning each quarter
```

---

## Governance

- Portfolio learning records require T3 approval (Strategy Org + Delivery Org)
- Records with project_count < 3 cannot be promoted to portfolio scope
- Annual portfolio learning library review required; stale records archived
- Portfolio learning library accessible to orchestration agents and PM agents for planning context
