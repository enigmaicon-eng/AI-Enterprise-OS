# Execution Hindsight Reviews
**ID:** AC-RE-004 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org + Delivery Org | **Updated:** 2026-05-17

---

## Purpose

Conducts periodic retrospective quality reviews over batches of execution history. Where post-execution reflection is per-event, hindsight reviews are aggregate — they look across a set of executions (a sprint, a project period, a calendar week) to identify patterns that only become visible at scale.

---

## Review Cadence

```yaml
review_cadences:

  SPRINT_CLOSE:
    frequency: end of every sprint (typically every 2 weeks)
    scope: all workflow executions in the sprint
    depth: MODERATE
    output: sprint_hindsight_report
    owner: Delivery Org + AI-Native Org
    trigger: sprint.close event

  WEEKLY_OPERATIONAL:
    frequency: every Monday 06:00 UTC
    scope: last 7 days of execution events
    depth: SURFACE (automated; no human required unless anomaly detected)
    output: weekly_execution_summary
    owner: AI-Native Org (automated)

  PROJECT_CLOSE:
    frequency: at project completion
    scope: all workflow executions for the project
    depth: DEEP
    output: project_hindsight_report
    owner: PM Org + Architecture Org + AI-Native Org
    trigger: project.completed event

  QUARTERLY_EXECUTIVE:
    frequency: quarterly (driven by strategy-retrospectives.md)
    scope: last quarter of execution data
    depth: DEEP
    output: quarterly_cognition_report
    owner: Executive Org + Governance Org
```

---

## Hindsight Analysis Method

```
1. EXECUTION BATCH ASSEMBLY
   Pull all workflow executions in review scope from execution-ledger.jsonl
   Include: all reflection_event records for these executions
   Exclude: events already incorporated in prior hindsight reports

2. AGGREGATE METRICS COMPUTATION
   Success rate: % workflows reaching SUCCESS outcome
   Failure class distribution: which FC-NN failures were most common
   Governance interaction rate: % workflows that touched a governance gate
   Escalation rate: % workflows requiring escalation
   Agent utilization: which agents executed most/least; load distribution
   Handoff quality distribution: distribution of collaboration quality scores

3. TREND DETECTION
   Compare aggregate metrics to prior period (same cadence)
   Flag: metrics that changed by > 15% vs. prior period
   Flag: new failure classes appearing (not in prior period)
   Flag: agent performance degradation (any agent performing > 20% below its historical average)

4. PATTERN MINING
   Run across all reflection events in scope:
     - Cluster events by workflow_type, agent composition, failure_class
     - Identify clusters with > 3 members (potential patterns)
     - Score cluster coherence (are they truly similar events?)
     - Propose high-coherence clusters as learning_record candidates

5. HEURISTIC EFFECTIVENESS ASSESSMENT
   For each active heuristic:
     Was this heuristic applied during executions in this period?
     Did execution outcomes correlate positively with this heuristic?
     Compute heuristic_effectiveness_score for each applied heuristic
     Flag heuristics with effectiveness_score < 0.50 for review

6. HINDSIGHT REPORT GENERATION
   Compile: aggregate_metrics, trend_flags, pattern_proposals, heuristic_assessment
   Classify: GREEN (all metrics nominal) / AMBER (1-2 significant trends) / RED (systemic issue)
   Route: GREEN → automated archive; AMBER → T3 notification; RED → T3 immediate review
```

---

## Hindsight Report Template

```markdown
# [SPRINT/PROJECT/PERIOD] Hindsight Report
Period: [start] → [end]
Status: GREEN | AMBER | RED
Generated: [timestamp]
Review Owner: [agent/human]

## Executive Summary
[2-3 sentence assessment of execution quality for the period]

## Aggregate Metrics
| Metric | This Period | Prior Period | Change | Status |
|--------|-------------|--------------|--------|--------|
| Success Rate | % | % | Δ% | 🟢/🟡/🔴 |
| Escalation Rate | % | % | Δ% | 🟢/🟡/🔴 |
| Governance Interaction | % | % | Δ% | 🟢/🟡/🔴 |
| Avg Handoff Quality | score | score | Δ | 🟢/🟡/🔴 |

## Failure Distribution
[Table of failure classes encountered, count, % of failures]

## Patterns Identified
[List of pattern proposals, each with: description, evidence count, confidence, recommended action]

## Heuristic Effectiveness
[Table of heuristics assessed, effectiveness score, recommendation]

## Recommended Actions
[Ordered list of proposed actions: heuristic changes, routing improvements, agent training]

## Open Questions for Human Review
[Items requiring T3+ consideration]
```

---

## Governance

- Hindsight reports are permanent records; they are never deleted
- Hindsight reports classified RED require T3 review within 48 hours
- Heuristic recommendations from hindsight reviews go through standard heuristic adaptation process
- Hindsight reports covering GOVERNANCE or CONSTITUTIONAL scope are shared with Governance Org
