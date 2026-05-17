# Improvement Memory

**Component:** RSI-REC-002 | **Owner:** Meta-Org | **Tier:** T3 | **Class:** ELEVATED

## Role
Persistent, queryable memory of every improvement the OS has ever attempted — what worked, what failed, what the conditions were, and what was learned. Prevents repeated failures, accelerates solution generation by surfacing prior successes, and builds institutional knowledge about how this specific OS improves.

---

## Memory Architecture

```
MEMORY LAYERS:
  EPISODIC MEMORY:   Individual improvement records (what happened in this specific attempt)
  SEMANTIC MEMORY:   Generalized learnings extracted from episodic records (patterns)
  PATTERN LIBRARY:   Reusable improvement templates validated by past success
  FAILURE LIBRARY:   Anti-patterns with conditions under which they fail

STORAGE:
  Primary: memory/recursive-self-improvement/improvement-memory.yaml
  Episodes: memory/recursive-self-improvement/improvement-episodes.jsonl (append-only)
  Patterns: memory/recursive-self-improvement/improvement-patterns.yaml
  Failures: memory/recursive-self-improvement/failure-library.yaml
```

---

## Episodic Memory Record

```yaml
improvement_episode:
  episode_id: EP-{NNN}
  proposal_id: IMP-{YYYY-MM-DD}-{NNN}
  domain: WORKFLOW | ORCHESTRATION | RUNTIME | GOVERNANCE | ORG | CAPABILITY | META
  opportunity_type: BOTTLENECK | WASTE | QUALITY_GAP | CAPABILITY_GAP | STRUCTURAL | etc.
  solution_type: PARALLELIZATION | THRESHOLD_ADJUSTMENT | ROUTING_CHANGE | etc.
  context:
    org_health_at_time: float
    adaptation_capacity_at_time: float
    system_load_at_time: LOW | MEDIUM | HIGH
    concurrent_changes: integer
    key_conditions: list of strings
  implementation:
    change_description: string (specific)
    change_scope: FILE | SUBSYSTEM | CROSS_SYSTEM
    effort_actual: TRIVIAL | SMALL | MEDIUM | LARGE
    implementation_duration_days: integer
  outcomes:
    forecast_improvement: percentage
    actual_improvement: percentage
    forecast_accuracy: ratio
    side_effects: list of strings (positive and negative)
    sustained_30d: boolean
    sustained_90d: boolean
  result: SUCCESS | PARTIAL | FAILED | ROLLED_BACK
  failure_reason: string | null
  lessons_learned: list of strings
  reuse_conditions: string (when should this solution be tried again?)
  do_not_repeat_if: string (when should this solution NOT be tried?)
```

---

## Semantic Memory (Patterns)

```
PATTERN EXTRACTION PROCESS (monthly):
  1. Load all episodes from last 90d with result = SUCCESS
  2. Cluster by (domain, opportunity_type, solution_type) combinations
  3. For clusters with >= 3 episodes: extract common context conditions
  4. Validate: do common conditions predict success? (vs. FAILED episodes)
  5. If condition_accuracy >= 0.80: write VALIDATED pattern to pattern library

PATTERN RECORD:
  pattern_id: PAT-{NNN}
  domain + opportunity_type + solution_type: the triple
  success_rate: fraction of attempts with this triple that succeeded
  optimal_conditions: context conditions that predict success
  contraindications: context conditions that predict failure
  avg_improvement: median actual improvement across successful episodes
  episode_count: how many times validated
  last_validated: ISO8601

PATTERN LIBRARY USAGE:
  When improvement-planner generates options: check pattern library first
  If matching pattern found with success_rate >= 0.75: recommend as primary option
  Include optimal_conditions check: "this works best when X, Y, Z"
```

---

## Failure Library

```
FAILURE RECORD:
  failure_id: FAIL-{NNN}
  domain + opportunity_type + solution_type: the triple
  failure_mode: REGRESSION | NO_EFFECT | ROLLBACK_FAILED | SIDE_EFFECT | BLOCKED
  failure_conditions: context conditions present when failed
  failure_frequency: how often this approach fails in these conditions
  root_cause: why does it fail? (not just what failed)
  alternative: what worked instead? (if known)

FAILURE LIBRARY USAGE:
  When improvement-planner proposes solution:
    1. Check failure library for matching (domain + solution_type) entries
    2. If current context matches failure_conditions: warn planner; lower solution priority
    3. If failure_frequency >= 0.70: exclude solution from options
    4. If failure_frequency >= 0.50: include with explicit risk warning
```

---

## Memory Queries

```
QUERY TYPES:
  find_similar_success(domain, opportunity_type, context) → top-3 matching episodes
  find_validated_pattern(domain, opportunity_type) → best matching pattern
  check_failure_risk(domain, solution_type, context) → failure probability estimate
  get_improvement_history(subsystem) → all improvements ever applied to subsystem
  get_recurrence_history(opportunity_type) → times same issue recurred + resolution
  get_forecast_calibration(domain) → bias correction factors for domain

QUERY PERFORMANCE:
  All queries: < 500ms
  Index: (domain × opportunity_type × solution_type × result) → episode_ids
  Bloom filter: fast "has this been tried before?" check (< 10ms)
```

---

## Memory Governance

```
RETENTION: All episodes retained permanently (indefinitely; never purged)
  Rationale: Even old failures inform current decisions; recurrence patterns need long history

INTEGRITY: Episodes are append-only (improvement-episodes.jsonl)
  No episode may be modified after recording; corrections filed as new episodes with REVISION flag

PRIVACY: Episodes may contain context about teams, agents, and performance
  Access: T3+ for full episodes; T2 for aggregated pattern summaries only

QUALITY: Episodes with low-quality outcome data (no measurement at T+30d) flagged as INCOMPLETE
  INCOMPLETE episodes: excluded from pattern extraction; included in failure library only
  Target: >= 0.90 of episodes have complete outcome data
```

---

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Episode completeness (T+30d outcome)    >= 0.90
Pattern library validated patterns      >= 20 (mature after 6 months)
Pattern hit rate (planner uses pattern) >= 0.50 of proposals reference a prior pattern
Failure library coverage                >= 0.80 (known failure modes documented)
Query response time                     < 500ms
Memory coverage (all domains active)    = 100%
```
