# Cross-Project Learning
**ID:** AC-OL-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org + Knowledge Management | **Updated:** 2026-05-17

---

## Purpose

Identifies knowledge and patterns that generalize from individual project executions to broader organizational intelligence. Cross-project learning is what transforms individual experience into institutional capability.

---

## Learning Generalization Model

```
GENERALIZATION LADDER:

  Level 1: Incident-specific
    "In Project X, sprint 3, the auth implementation failed because of missing ADR"
    → Single data point; not a learning record

  Level 2: Pattern within project
    "In Project X, architecture gates consistently failed when no ADR existed"
    → Project-scoped pattern; useful but limited

  Level 3: Pattern across projects (CROSS-PROJECT LEARNING)
    "In 6 of 8 projects, security gates blocked implementation when auth ADRs were missing"
    → Portfolio-scoped pattern; highly actionable learning record

  Level 4: Enterprise principle
    "Architecture gates require pre-existing ADRs to be effective at enterprise scale"
    → Enterprise principle; candidate for knowledge base KU entry

Cross-project learning operates at Levels 3 and 4.
```

---

## Cross-Project Learning Process

```
STEP 1: MULTI-PROJECT AGGREGATION
  Query: reflection-log.jsonl for events across all projects in last 90 days
  Group: by workflow_type, failure_class, agent_composition, governance_interaction
  Minimum cross-project signal: same pattern in ≥ 3 distinct projects

STEP 2: SIMILARITY SCORING
  For each candidate cluster:
    Compute structural similarity (not just surface similarity):
      - Same root cause chain structure (not just same FC class)
      - Similar agent compositions
      - Similar workflow types
      - Similar deviation_scores
    Similarity threshold for learning: ≥ 0.70 structural similarity

STEP 3: CONFOUND ELIMINATION
  Check: are projects in the cluster structurally similar in other ways?
    (same project team? same time period? same system load?)
  If confounds explain the pattern → do not promote to learning record
  If confounds do NOT explain it → proceed

STEP 4: LEARNING RECORD CREATION
  Create learning_record with:
    learning_type: PATTERN
    scope: PORTFOLIO (≥ 3 projects) or ENTERPRISE (> 50% of all projects)
    evidence_ids: all contributing reflection_event IDs
    actionable: true if clear heuristic/workflow improvement is implied
    confidence: computed from similarity scores and evidence quality

STEP 5: PROMOTION DECISION
  PORTFOLIO scope: T3 Knowledge Management review required before activation
  ENTERPRISE scope: T4 Architecture + Knowledge Management review required
  Review question: "Is this learning valid, generalizable, and worth acting on?"
```

---

## Learning Record Lifecycle

```
PROPOSED  → submitted for review; not yet active
VALIDATED → reviewed and approved; being monitored
ACTIVE    → applied to heuristics and/or knowledge base
ARCHIVED  → no longer active (superseded by better learning or conditions changed)
FLAGGED   → under investigation (possible conflict with newer evidence)
```

---

## Cross-Project Learning Themes

The system tracks recurring themes to identify the most impactful learning opportunities:

```yaml
current_learning_themes:
  - auth_and_security_gate_preparation
  - specification_completeness_at_kickoff
  - cross_org_handoff_quality_improvement
  - governance_gate_timing_in_workflow
  - knowledge_base_coverage_gaps
  (Themes emerge from pattern analysis; this list grows over time)
```

---

## Governance

- Cross-project learning records cannot reference classified project data
- ENTERPRISE scope learning records require T4 approval before activation
- Learning records once ACTIVE can only be ARCHIVED (not deleted)
- Learning effectiveness tracked: are projects benefiting from activated learning records?
