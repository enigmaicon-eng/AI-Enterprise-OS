# Work Pattern Miner

## Role
Discovers recurring patterns in how work flows through the OS — which workflow sequences reliably succeed, which sequences tend to fail, which work types cluster together, and which handoff sequences create bottlenecks. These patterns feed workflow optimization and sprint planning intelligence.

## Pattern Mining Scope

```
PATTERN TYPE            INPUT DATA                        INSIGHT PRODUCED
─────────────────────────────────────────────────────────────────────────────────
WORKFLOW_SEQUENCE       Ordered workflow steps + outcomes  Which step sequences fail most
HANDOFF_CHAIN           Cross-agent/team handoff records   Which chains have highest latency
WORK_TYPE_CLUSTER       Work item type co-occurrence       Which work types travel together
FAILURE_PRECURSOR       Event sequences before failures    Early warning signatures
SUCCESS_SIGNATURE       Features of highest-quality runs  Replicate what works
REWORK_TRIGGER          Work items requiring rework        What causes correction cycles
TIME_BOXING_PATTERN     Duration distributions per type    Where time is actually spent
BATCH_AFFINITY          Work items often batched together  Optimize batching decisions
```

## Mining Algorithms

```
SEQUENCE MINING:
  Algorithm: PrefixSpan (efficient for sparse sequences)
  min_support: 0.05 (appears in ≥ 5% of executions)
  max_sequence_length: 10 steps
  lookback_window: 90 days

ASSOCIATION RULES:
  Algorithm: Apriori for co-occurrence; lift > 1.5 required (not just correlation)
  min_support: 0.10; min_confidence: 0.70
  Use: work type clustering, failure co-occurrence

ANOMALY SEQUENCES:
  Isolate sequences with high failure_rate vs. overall baseline
  Chi-squared test for significance: p < 0.05
  Report: "When step A → step B → step C occurs, failure rate is 3× baseline"

AI SYNTHESIS:
  Weekly: claude-sonnet-4-6 reviews top 10 candidate patterns
  Task: explain business meaning, recommend process change
  Output: natural-language insight card
```

## Work Pattern Record Schema

```yaml
work_pattern:
  pattern_id: string
  name: string
  type: PATTERN_TYPE
  status: CANDIDATE | VALIDATED | ACTIVE | SUPERSEDED
  
  discovered_at: ISO8601
  validated_at: ISO8601          # date human confirmed pattern is real
  occurrence_count: number
  support: number                # fraction of workflows exhibiting pattern
  confidence: number             # for conditional patterns: P(outcome|pattern)
  lift: number                   # vs. baseline rate
  
  pattern_definition:
    sequence: [step_id]          # for sequence patterns
    items: [item_type]           # for cluster patterns
    condition: expression        # for conditional patterns
  
  insight:
    description: string
    probable_cause: string
    recommended_action: string
    expected_improvement: string
  
  evidence:
    sample_instance_ids: [run_id]  # max 5 example instances
    statistical_test: string
    p_value: number
```

## Pattern Validation Protocol

```
CANDIDATE → VALIDATED:
  1. Statistical significance confirmed (p < 0.05)
  2. min_occurrence_count >= 20 (prevent small-sample artifacts)
  3. Reviewed by at least T2 workflow owner
  4. Not already explained by a SUPERSEDED pattern (dedup check)

VALIDATED → ACTIVE:
  Pattern confirmed as actionable; recommended_action agreed upon

ACTIVE → SUPERSEDED:
  A more specific or more accurate pattern replaces this one
  Or: root cause fixed; pattern no longer occurs

WEEKLY PATTERN REVIEW:
  Top 5 new CANDIDATE patterns → AI insight synthesis → human review queue
  T2+ reviews and validates/rejects within 5 business days
```

## Pattern Library

```
PATTERN LIBRARY:
  Active patterns: queryable by type, work_type, team, severity
  Pattern search: find patterns affecting a specific workflow or agent
  Pattern attribution: when optimization applied, link back to pattern that triggered it

PATTERN DIGEST (weekly, T2+):
  - New patterns this week: N
  - Patterns validated: N
  - Top actionable pattern: {name} — {description}
  - Expected improvement if addressed: {estimated_impact}
```

## Persistence
`memory/work-cognition/pattern-library.yaml`
`memory/work-cognition/pattern-candidates.yaml`
`memory/work-cognition/pattern-history.jsonl`
