# Execution Memory

**System ID:** `execution-memory`
**Role:** Persistent store for decisions, constraints, and context that must survive across all sessions of a workflow's lifetime — the workflow's durable brain
**Storage:** `memory/execution-memory/[workflow-id]-memory.yaml`

---

## Purpose

Execution Memory stores the things that must never be forgotten for a workflow — regardless of how many sessions it spans, how many context resets occur, or how many different agents touch it. It is specifically designed to be small, targeted, and loaded by every agent at every step.

The key insight: most context can be recovered from artifacts, but some context — especially the "why" behind decisions — only existed in an agent's reasoning and must be explicitly captured or it is gone.

---

## Memory Categories

### Category 01: Settled Decisions

Decisions that cannot be re-opened without explicit escalation.

```yaml
settled_decisions:
  - decision_id: "dec-[uuid]"
    decision: "[what was decided — stated precisely]"
    rationale: "[why — one sentence that captures the essential reason]"
    made_by: "[agent-id]"
    made_at_step: "[step-id]"
    timestamp: "[ISO-8601]"
    finality: "FINAL | SOFT"
    
    # What this prevents
    prevents:
      - "[thing that agents must NOT re-propose]"
      - "[thing that agents must NOT revisit]"
    
    # What this requires
    requires:
      - "[thing that all future steps must honor]"
    
    # When it expires (if ever)
    expires: null  # null = never expires
    expires_at: null
```

**Finality levels:**
- `FINAL`: Cannot be changed without human approval and explicit rollback
- `SOFT`: Can be changed by escalation to supervisor-agent with justification

### Category 02: Active Constraints

Constraints established during the workflow that all agents must honor.

```yaml
active_constraints:
  - constraint_id: "con-[uuid]"
    constraint: "[what is required or forbidden]"
    type: "MUST | MUST_NOT | SHOULD | SHOULD_NOT"
    domain: "[technical | PM | UX | security | compliance | resource]"
    source: "[step-id or external-requirement]"
    rationale: "[why this constraint exists]"
    applies_to_steps: "[all | [list of step-ids]]"
    enforced_by: "[gate-type that checks this]"
    expires_with: "[step-id where this constraint no longer applies, or null]"
```

**Example:**
```yaml
- constraint_id: "con-001"
  constraint: "All API endpoints must use JWT authentication"
  type: "MUST"
  domain: "security"
  source: "step-03-architecture"
  rationale: "ADR-042 mandates JWT for all new endpoints"
  applies_to_steps: "all"
  enforced_by: "agent-review"
  expires_with: null
```

### Category 03: Established Context

Domain knowledge and context established during the workflow that prevents agents from re-researching settled ground.

```yaml
established_context:
  - context_id: "ctx-[uuid]"
    topic: "[what this context is about]"
    content: "[the established context — be specific]"
    source: "[where this was established]"
    established_at_step: "[step-id]"
    type: "FACT | ASSUMPTION | SCOPE | CONSTRAINT | DEPENDENCY"
    relevance_to_steps: "[all | [specific step-ids]]"
    confidence: "[HIGH | MEDIUM | LOW]"
    expires: "[date or null]"
```

**Example:**
```yaml
- context_id: "ctx-003"
  topic: "Target deployment environment"
  content: "This feature deploys to AWS ECS, not Lambda. Stateful sessions are acceptable. Cold start latency is not a concern."
  source: "step-02-architecture"
  type: "FACT"
  relevance_to_steps: "all"
  confidence: "HIGH"
  expires: null
```

### Category 04: Rejected Approaches

Approaches that were considered and rejected — ensures agents don't re-propose them.

```yaml
rejected_approaches:
  - rejection_id: "rej-[uuid]"
    approach: "[what was proposed]"
    reason_rejected: "[why it was rejected — be specific]"
    rejected_at_step: "[step-id]"
    timestamp: "[ISO-8601]"
    do_not_propose_again: true
    unless: "[condition under which this could be reconsidered, if any]"
```

**Example:**
```yaml
- rejection_id: "rej-002"
  approach: "Use a graph database for the user relationship model"
  reason_rejected: "Infrastructure team confirmed no graph DB support in current stack"
  rejected_at_step: "step-02-architecture"
  do_not_propose_again: true
  unless: "Infrastructure team approves graph DB addition"
```

### Category 05: Open Questions

Questions that arose during the workflow but couldn't be answered in the step where they appeared.

```yaml
open_questions:
  - question_id: "oq-[uuid]"
    question: "[what needs to be answered]"
    context: "[why this matters — what depends on the answer]"
    raised_at_step: "[step-id]"
    priority: "HIGH | MEDIUM | LOW"
    blocks_step: "[step-id or null]"
    answer: null
    answered_at_step: null
    status: "open | answered | deferred | irrelevant"
```

### Category 06: Scope Boundaries

What is explicitly in scope and out of scope for this workflow.

```yaml
scope:
  in_scope:
    - "[what this workflow must address]"
  
  out_of_scope:
    - "[what this workflow must NOT address]"
    - rationale: "[why it's out of scope]"
  
  scope_set_at: "[step-id]"
  scope_set_by: "[agent-id]"
  scope_changes:
    - change: "[what changed]"
      at_step: "[step-id]"
      reason: "[why scope changed]"
```

---

## Memory Loading Protocol

At the start of every agent invocation for this workflow, load a compressed version of execution memory:

```
EXECUTION MEMORY CONTEXT
════════════════════════

SETTLED (do not re-open):
  • [decision 1] (step N)
  • [decision 2] (step M)

MUST / MUST NOT:
  • MUST: [constraint 1]
  • MUST NOT: [constraint 2]

DO NOT PROPOSE AGAIN:
  • [rejected approach 1] — reason: [brief reason]

SCOPE:
  IN: [brief scope statement]
  OUT: [brief out-of-scope]

OPEN QUESTIONS (answer if you can):
  • [question 1] — priority: HIGH
```

Target: < 300 tokens for the compressed memory context.

If memory content exceeds 300 tokens:
1. First drop: LOW priority open questions
2. Second drop: MEDIUM priority open questions
3. Third drop: SOFT decisions (keep hard constraints, MUST/MUST_NOT, FINAL decisions)
4. Never drop: FINAL decisions, MUST constraints, rejected approaches

---

## Memory Write Protocol

After each step completes, the agent or deterministic executor writes to execution memory:

```
WRITE PROTOCOL:
  1. Extract decisions made in this step → write to settled_decisions
  2. Extract constraints established → write to active_constraints
  3. Extract context facts established → write to established_context
  4. Extract rejected approaches → write to rejected_approaches
  5. Extract open questions raised → write to open_questions
  6. Update scope if changed
```

Each write is appended (YAML list append, not overwrite).

---

## Memory Integrity

**No overwriting:** Decisions and constraints are appended, never replaced.
To update a SOFT decision: write a new decision record with a `supersedes: [prior-decision-id]` field. The prior decision is preserved in history.

**Conflict detection:** Before writing a new SOFT decision, check if it conflicts with existing FINAL decisions. If conflict: escalate before writing.

**Stale detection:** Context items with `expires` field set are flagged when past expiry.

---

## Storage Format

```
memory/execution-memory/
  [workflow-id]-memory.yaml    ← primary execution memory
  [workflow-id]-memory-v[N].yaml  ← version snapshots (written at each session boundary)
```

Version snapshots enable rollback to an earlier memory state if the current memory has been corrupted by bad agent output.

---

## Integration

**Written to by:**
- `continuation-systems/deterministic-executor.md` → after each step
- `continuation-systems/context-restorer.md` → when loading memory for agents

**Read by:**
- `continuation-systems/context-restorer.md` → compressed memory for agent context
- `recovery-systems/state-reconstructor.md` → settled decisions for reconstruction
- `recovery-systems/rollback-engine.md` → decisions to clear on rollback
- `continuation-systems/workflow-continuator.md` → continuation frame construction
