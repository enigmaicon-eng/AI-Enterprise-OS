# Improvement Planner

**Component:** RSI-CORE-004 | **Owner:** Meta-Org | **Tier:** T3 | **Class:** ELEVATED

## Role
Transforms ranked opportunities from the analysis engine into concrete, actionable improvement proposals with specific change descriptions, implementation steps, success criteria, and rollback plans. Acts as the bridge between diagnosis and execution.

---

## Planning Protocol

```
FOR EACH OPPORTUNITY IN ranked_opportunity_set (top-20):

  STEP 1: CONTEXT ENRICHMENT
    Load: prior improvement history for this domain (improvement-memory.md)
    Load: current state of the affected subsystem (observation data)
    Load: relevant constraints (constitutional, regulatory, architectural)
    Load: pending proposals in same domain (avoid conflicts)

  STEP 2: SOLUTION GENERATION
    Generate 2–3 solution options per opportunity
    For each option:
      - Describe the change specifically (not just "improve X")
      - Identify files / configs / parameters to change
      - Estimate effort: TRIVIAL (<30min) / SMALL (<4hr) / MEDIUM (<2d) / LARGE (>2d)
      - Estimate risk: LOW / MEDIUM / HIGH / VERY_HIGH
      - Verify: is this change reversible? What is the rollback?

  STEP 3: OPTION SELECTION
    Primary criterion: highest expected_value = impact × confidence - risk_penalty
    Tie-breaking: prefer smaller scope; prefer reversible; prefer tested approaches
    If all options are HIGH+ risk: escalate to T4 with options presented

  STEP 4: PROPOSAL ASSEMBLY
    Complete proposal_schema from self-improvement-engine.md
    Attach: specific change description (not vague)
    Attach: rollback procedure (must be testable)
    Attach: success criteria (measurable; must be verifiable within 30 days)
    Attach: risk register (top-3 risks for this change)

  STEP 5: CONFLICT CHECK
    Is any other active improvement modifying the same subsystem?
    → If yes: sequence or merge proposals; no concurrent changes to same component
    → Lock: exclusive change lock per file/subsystem (released on completion)

  STEP 6: FORWARD TO IMPACT FORECASTER
    Complete proposal forwarded to impact-forecaster.md for ROI modeling
    Forecaster result attached before safety validation
```

---

## Solution Templates by Opportunity Type

```
BOTTLENECK:
  Preferred approaches (in order):
    1. Parallelization — can the blocked work be run concurrently?
    2. Pre-computation — can inputs be prepared before the bottleneck?
    3. Threshold relaxation — is the bottleneck a gate that's miscalibrated?
    4. Capacity increase — add workers / approvers / resources
    5. Elimination — is the bottleneck step necessary at all?

WASTE:
  Preferred approaches:
    1. Eliminate — remove the wasteful step/process entirely
    2. Automate — replace manual waste with automated step
    3. Batch — consolidate small wasteful operations
    4. Cache — avoid repeating work with same inputs

QUALITY_GAP:
  Preferred approaches:
    1. Threshold calibration — is the quality bar correctly set?
    2. Training data improvement — does the agent/model need better examples?
    3. Prompt refinement — is the task instruction clear enough?
    4. Gate insertion — add a quality gate before the failing step
    5. Agent routing — route to higher-capability agent for failing task class

CAPABILITY_GAP:
  Preferred approaches:
    1. Skill acquisition — train/develop the capability
    2. Integration — connect to external system with the capability
    3. Agent specialization — create/configure a specialist agent
    4. Playbook creation — document workaround as temporary bridge

STRUCTURAL:
  Preferred approaches:
    1. Team boundary adjustment — align team structure with workflow flow
    2. Ownership reassignment — reassign artifact ownership to reduce handoffs
    3. Workflow redesign — restructure the workflow DAG
    Note: structural changes require org-evolution-engine.md for human org changes

CONFIGURATION_DRIFT:
  Preferred approaches:
    1. Direct reconfiguration — update the drifted parameter
    2. Policy enforcement — add policy check to prevent future drift
    3. Config audit — audit all related configs for similar drift
```

---

## Proposal Priority Classes

```
P0 — EMERGENCY
  Criteria: active degradation affecting production; quality/safety violation
  Target: proposal within 30 min; authorization within 2 hr
  Bypass: standard queue; immediate safety check + T3 fast-path

P1 — CRITICAL
  Criteria: imminent risk; recurrent problem; > 30% performance degradation
  Target: proposal within 4 hr; authorization within 24 hr
  Treatment: top of queue; daily plan synthesis triggered

P2 — HIGH
  Criteria: meaningful opportunity with measurable impact
  Target: included in daily plan synthesis; authorized within standard SLA
  Treatment: standard queue

P3 — MEDIUM
  Criteria: incremental improvement; low urgency
  Target: included in weekly plan batch
  Treatment: batched; may be merged with P2/P3 in same domain

P4 — LOW
  Criteria: cosmetic, documentation, or minor configuration
  Target: monthly batch
  Treatment: auto-approved if AUTO tier; bundled into maintenance release
```

---

## Proposal Conflict Prevention

```
SUBSYSTEM CHANGE LOCK:
  When proposal for subsystem X is AUTHORIZED: X is locked for concurrent changes
  Lock duration: until proposal is COMPLETED or ROLLED_BACK
  Lock contention: if new proposal targets locked subsystem → queue; notify planner

DEPENDENCY ANALYSIS:
  Before proposal finalized: check if target subsystem has upstream/downstream locks
  Upstream locked: safe (change to A doesn't affect A's dependency B)
  Downstream locked: WARNING; change may invalidate in-flight changes to B

SEQUENCING RULES:
  Constitutional changes: sequential only; no concurrent constitutional proposals
  Cross-system changes: require coordination plan; domain leads in scope
  Emergency changes: bypass queue lock; post-change conflict assessment
```

---

## Planning Health Metrics

```
METRIC                               TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Proposals with complete rollback plan  = 100%
Proposals with measurable success criteria  = 100%
Proposal assembly time (P1+)           < 4 hours
Conflict detection rate (caught before auth)  >= 0.95
Proposals passing safety check first-time  >= 0.85
Solution options generated per opportunity  >= 2
```
