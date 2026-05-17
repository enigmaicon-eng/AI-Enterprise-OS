# Strategy Retrospectives
**ID:** AC-RE-005 | **Tier:** T4 | **Class:** ELEVATED
**Owner:** Executive Org + Strategy Org | **Updated:** 2026-05-17

---

## Purpose

Conducts quarterly strategy-level retrospective analysis across all organizational execution, decision history, and strategic memory. Produces the highest-level cognition signal: what has the organization learned about *how it makes strategic decisions* over time, and whether its strategic reasoning machinery is improving.

---

## Cadence and Scope

```yaml
frequency: quarterly (Q1/Q2/Q3/Q4 close)
scope: all execution events, strategic decisions, portfolio outcomes for the quarter
depth: DEEP
participants: Executive Org (CPO, CTO, CAIO), Strategy Org, Governance Org
output: quarterly_strategy_retrospective + strategic_memory_entries
time_investment: 2-4 hours (human-facilitated with AI preparation)
```

---

## Retrospective Domains

### Domain 1: Strategic Decision Quality
```
Review: all strategic decisions made in the quarter (decision-log.jsonl, scope = STRATEGIC)
Assess:
  - Decision quality at time of decision (was information complete? was reasoning sound?)
  - Decision quality in hindsight (were the outcomes as predicted?)
  - Decision velocity (how fast did we move from question to decision?)
  - Decision reversal rate (how many decisions were changed within 30 days?)
Output: strategic_decision_quality_score (0.0–1.0) + improvement recommendations
```

### Domain 2: Organizational Learning Effectiveness
```
Review: all learning records activated in the quarter
Assess:
  - Did activated learning records improve outcomes in subsequent executions?
  - Were learning records appropriately scoped (not over-fitted to specific incidents)?
  - Were important lessons missed (failures recurred without learning response)?
  - Learning velocity: how quickly did the OS adapt to identified problems?
Output: learning_effectiveness_score + coverage gap analysis
```

### Domain 3: Strategic Memory Utility
```
Review: all strategic memory entries accessed in the quarter
Assess:
  - Which strategic memory entries were retrieved and applied?
  - Which entries were never accessed (potential staleness)?
  - Which decisions would have benefited from memory access that didn't happen?
  - Memory retrieval quality (right memory surfaced at right decision point)
Output: memory_utility_score + stale_entries list + retrieval_gap analysis
```

### Domain 4: Heuristic Portfolio Health
```
Review: all heuristic changes made in the quarter
Assess:
  - Net outcome improvement from heuristic adaptations?
  - Any heuristics approaching their governance bounds?
  - Cumulative drift assessment (governance.md drift detection)
  - Any heuristics demonstrating consistently low effectiveness?
Output: heuristic_portfolio_health_score + drift_report
```

### Domain 5: Cross-Organizational Coordination Quality
```
Review: all cross-org collaboration records in the quarter
Assess:
  - Which org pairs collaborated most effectively?
  - Which org pairs showed persistent friction?
  - Escalation patterns: are escalations resolving correctly?
  - Trust evolution: is the trust network maturing as expected?
Output: coordination_maturity_score + friction_map
```

---

## Strategic Memory Outputs

Every strategy retrospective generates strategic_memory_entries with memory_type = EXECUTIVE_INSIGHT:

```yaml
example_strategic_memory:
  memory_id: SM-20260517-Q2-001
  memory_type: EXECUTIVE_INSIGHT
  horizon: ANNUAL
  summary: "Q2 2026: Decision velocity improved 23% after routing refinement; 
            strategic decision reversal rate dropped from 18% to 9%."
  evidence_ids: [RE-20260517-0801..RE-20260517-1244]
  confidence: 0.88
  relevance_domains: [orchestration, decision-quality, strategic-planning]
  review_at: 2026-11-17
```

---

## Retrospective Facilitation Protocol

```
PRE-RETROSPECTIVE (automated, 48 hours before):
  1. Compile all relevant records for the quarter
  2. Generate preliminary metrics for all 5 domains
  3. Identify top 5 patterns from hindsight reviews during the period
  4. Identify top 3 governance/compliance events
  5. Prepare draft strategic_memory_entries for review

RETROSPECTIVE SESSION:
  1. Executive summary of preliminary metrics (15 min)
  2. Domain 1 + 2 review — learning and decision quality (30 min)
  3. Domain 3 + 4 review — memory and heuristics (20 min)
  4. Domain 5 review — coordination (15 min)
  5. Proposed strategic memory entries — review and approve (20 min)
  6. Top 3 improvement priorities for next quarter (15 min)

POST-RETROSPECTIVE (automated, within 24 hours):
  1. Finalize and write approved strategic_memory_entries
  2. Write quarterly_strategy_retrospective record
  3. Activate any T4-approved heuristic changes
  4. Archive preliminary data
  5. Schedule follow-up reviews for flagged items
```

---

## Governance

- Strategy retrospectives are T4-class events; outputs are executive-level records
- Proposed strategic memory entries require at least one T4 participant approval
- Retrospective findings that implicate governance constraints are routed to Constitutional Review team
- All retrospective materials (preliminary data, session notes, outputs) are retained for 5 years
