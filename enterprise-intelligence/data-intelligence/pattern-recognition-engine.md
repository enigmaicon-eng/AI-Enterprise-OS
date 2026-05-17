# Pattern Recognition Engine

## Role
Identifies recurring patterns, correlations, and structural regularities across OS data, workflow executions, and organizational behavior. Surfaces insights that are invisible in point-in-time analysis — enabling the OS to learn from its own operational history and improve proactively.

## Pattern Categories

```
CATEGORY          DESCRIPTION                                   TIME HORIZON
────────────────────────────────────────────────────────────────────────────
OPERATIONAL       Recurring workflow failure modes              Hours–days
SEASONAL          Time-of-day/week/sprint cyclical patterns     Days–weeks
CAUSAL            A consistently precedes B                     Minutes–hours
QUALITY           Data quality degradation precursors           Hours–days
BEHAVIORAL        Agent + team behavioral trends                Days–weeks
RESOURCE          Resource usage patterns + peaks               Hours–sprints
COMPLIANCE        Pre-incident compliance warning signals        Hours–days
CORRELATION       Co-movement between metrics without causality Days–weeks
```

## Pattern Mining Methods

```
FREQUENT_ITEMSET:
  Apriori/FP-Growth on event sequences
  min_support: 0.05 (5% of executions exhibit pattern)
  min_confidence: 0.70

SEQUENTIAL_PATTERN:
  PrefixSpan on ordered event logs
  max_gap_seconds: configurable per pattern type
  min_occurrences: 10 before pattern promoted to ACTIVE

CORRELATION:
  Pearson/Spearman on time-series metric pairs
  min_|correlation|: 0.65
  min_data_points: 30
  lag_analysis: test lags of 0, 1, 5, 15, 60 minutes

AI SYNTHESIS (claude-sonnet-4-6 for complex patterns):
  Input: pattern candidates from statistical methods
  Task: explain business meaning; assess actionability
  Output: natural-language insight + recommended action
  Trigger: weekly batch for ACTIVE patterns + on-demand for CRITICAL
```

## Pattern Record Schema

```yaml
pattern_record:
  pattern_id: string
  name: string
  category: PATTERN_CATEGORY
  status: CANDIDATE | ACTIVE | DEPRECATED
  
  discovered_at: ISO8601
  last_observed: ISO8601
  occurrence_count: number
  
  definition:
    method: FREQUENT_ITEMSET | SEQUENTIAL | CORRELATION | AI_SYNTHESIZED
    entities: [entity_id]
    sequence: [event_type]        # for SEQUENTIAL patterns
    metrics: [metric_name]        # for CORRELATION patterns
    lag_seconds: number           # for CAUSAL patterns
    support: number               # how often pattern occurs
    confidence: number            # given antecedent, how often consequent follows
  
  insight:
    description: string           # human-readable explanation
    probable_cause: string        # AI assessment
    recommended_action: string
    actionable: boolean
  
  impact:
    severity: INFO | MEDIUM | HIGH | CRITICAL
    affected_entities: [entity_id]
    estimated_improvement_if_resolved: string
```

## Pattern Lifecycle

```
CANDIDATE → ACTIVE:
  Requires: occurrence_count >= 10 AND confidence >= 0.70 AND human review = CONFIRMED
  Human review: T2+ confirms pattern is real (not artifact); approves recommended_action

ACTIVE → DEPRECATED:
  Triggers:
    - occurrence_count < 2 in last 30d (pattern no longer occurring)
    - root_cause_fixed = true (underlying issue resolved)
    - human marks deprecated after investigation

PATTERN ALERT:
  New ACTIVE pattern: notify relevant team based on affected_entities
  CRITICAL severity pattern: immediate alert to T3 + event bus notification
```

## Weekly Pattern Report

```
WEEKLY PATTERN DIGEST:
  - New patterns discovered this week: N
  - Active patterns count: N
  - Patterns resolved (deprecated): N
  
  TOP 3 ACTIONABLE PATTERNS:
    1. {pattern_name}: {description} — Action: {recommended_action}
    2. ...
  
  COMPLIANCE WARNING PATTERNS:
    - Any pattern with category=COMPLIANCE_SIGNAL: highlighted separately
    → Delivered to T3+ and compliance team

  TREND:
    - Pattern discovery rate trending UP/DOWN/STABLE
```

## Persistence
`memory/data-intelligence/pattern-registry.yaml`
`memory/data-intelligence/pattern-history.jsonl`
`memory/data-intelligence/correlation-models.yaml`
