# Context Restorer

**System ID:** `context-restorer`
**Role:** Reconstructs the minimum viable agent context needed to resume a suspended step — prevents context over-loading and under-loading
**Extends:** `orchestrator/context-manager.md`

---

## Purpose

When a workflow resumes after a session break, the receiving agent gets exactly the context it needs — no more (which causes context rot), no less (which causes incorrect decisions). The Context Restorer builds this minimum viable continuation context from checkpoints, artifacts, and the execution ledger.

---

## Context Reconstruction Layers

Following `orchestrator/context-manager.md` Layer 1-6 hierarchy, extended for continuation:

### Layer 1: Agent Identity (unchanged)
Load the agent definition file unchanged.
`agents/<agent>.md` → system prompt

### Layer 2: Continuation Frame (ADDED for resumption)
Inject before any task context. This is the most critical addition.

```
CONTINUATION FRAME
══════════════════
Workflow: [id]
Resuming at: Step [N] — [name]
Session: [session-number] of this workflow

COMPLETED (do not repeat):
  ✓ [Step 1 name] → [artifact path] [GATE PASSED]
  ✓ [Step 2 name] → [artifact path] [GATE PASSED]

SETTLED (do not re-open):
  • [Decision] — made at Step [N] — rationale: [brief]

OPEN (must address in this step):
  • [Question from prior handoff]

THIS STEP: [step name]
PRODUCE: [artifact name] at [path]
ADVANCE TO: Step [N+1] when complete
══════════════════
```

### Layer 3: Step-Specific Inputs
Load inputs for the current resume step only — NOT for prior completed steps.

**Input compression rules:**
- Artifacts from steps >2 steps back: summary only (not full content)
- Artifacts from step N-1: full content if < agent's budget allocation; summary + path if larger
- Artifacts from step N-2: key decisions only (3-5 bullets)
- Artifacts from steps N-3+: single-line reference only

```yaml
step_inputs:
  primary_input:             # from step N-1 handoff
    artifact: [full content or compressed]
    gate_status: PASSED
    key_decisions: [list]
  
  upstream_reference:        # from steps N-2 and earlier
    artifact: "[name] at [path]"  # reference only
    constraint: "[constraint this places on current step]"
  
  handoff_envelope:          # from step N-1's completion
    decisions_made: [list]
    constraints_established: [list]
    open_questions: [list]
    explicitly_excluded: [list]  # CRITICAL: prevents re-litigating
```

### Layer 4: Decision Memory (critical for continuation)

Decisions made in prior steps must be loaded as constraints, not as reopenable questions.

```yaml
settled_decision_registry:
  - decision: "[what was decided]"
    step_number: [N]
    agent: "[who decided]"
    rationale: "[why — one sentence]"
    constraint_on_resume: "[what this prevents the next agent from doing]"
    irreversibility: "FINAL | SOFT"  # FINAL = never reopen; SOFT = reopen only with escalation
```

**Decision loading rules:**
- FINAL decisions: load as hard constraints (agent cannot contradict)
- SOFT decisions: load as context (agent may propose change, but must escalate)
- Decisions from >3 steps back: load as single-line constraints only

### Layer 5: Upstream Artifacts (compressed for continuation)

Implement 3-tier compression:

**Tier 1 — Immediate predecessor (step N-1):** Full content or structured summary
```
ARTIFACT: [name]
Path: [path]
Status: COMPLETE | GATE_PASSED
[Full content if < 2000 tokens, else:]
KEY DECISIONS: [3-5 bullets]
CONSTRAINTS ON THIS STEP: [2-3 bullets]
FULL ARTIFACT: available at [path] — read if needed
```

**Tier 2 — Recent precedents (steps N-2, N-3):** Key decisions only
```
PRIOR STEP [N-2]: [name]
Decision: [one sentence]
Constraint: [one sentence]
```

**Tier 3 — Older steps:** Path reference only
```
STEP [N-K] artifact at [path] — do not re-read unless necessary
```

### Layer 6: Governance Constraints (filtered)
Load only governance rules applicable to the current resume step — not all governance.

```yaml
applicable_constraints:
  - gate: "[gate the current step must pass]"
    criteria: [list]
  - policy: "[policy relevant to this step's domain]"
    requirement: "[specific requirement]"
```

---

## Context Budget Management (Continuation-Specific)

Continuation contexts must stay within agent budget allocations from `context-manager.md`.

**Budget allocation for resumed steps:**

| Component | Token Budget | Priority |
|-----------|-------------|----------|
| Continuation frame | 300 | MANDATORY |
| Agent identity | [per agent type] | MANDATORY |
| Current step inputs | 40% of remaining | HIGH |
| Settled decisions | 15% of remaining | HIGH |
| Upstream artifacts (compressed) | 30% of remaining | MEDIUM |
| Governance constraints | 10% of remaining | MEDIUM |
| Overflow buffer | 5% of remaining | LOW |

If total exceeds budget after applying compression:
1. First drop: Step N-3+ artifacts (keep path references only)
2. Second drop: Step N-2 artifacts to single-line
3. Third drop: Reduce governance to only gate criteria
4. Never drop: Continuation frame, current step inputs, FINAL decisions

---

## Context Integrity Checks

Before injecting context, verify:

**Check 01: No Contradiction Loading**
- Settled decisions and current step instructions must not contradict
- If contradiction detected: flag as [DECISION CONFLICT], escalate before resuming

**Check 02: Decision Currency**
- All loaded decisions were made after the last major context shift
- Decisions made before a ROLLBACK event must be re-validated

**Check 03: Artifact Currency**
- Artifact modification timestamps match expected modification dates
- If artifact was modified after its completion timestamp: flag as [ARTIFACT MODIFIED], check if step must be re-run

**Check 04: Handoff Integrity**
- Handoff envelope from step N-1 matches the artifact produced by step N-1
- If mismatch: handoff is stale or from a different workflow run → regenerate handoff from artifact

---

## Context Restoration Record

After restoring context, write a restoration record to the execution ledger:

```json
{
  "event_type": "context_restoration",
  "workflow_id": "[id]",
  "timestamp": "[ISO-8601]",
  "resume_step": "[step-id]",
  "resume_type": "phase_boundary | mid_step | cold_start",
  "context_components": {
    "continuation_frame": "injected",
    "agent_identity": "loaded",
    "step_inputs": "full | compressed",
    "settled_decisions": [N],
    "upstream_tiers": {"tier1": true, "tier2": true, "tier3": false},
    "governance": "filtered"
  },
  "total_tokens_estimated": [N],
  "budget_pct_used": [N],
  "integrity_checks": {
    "contradiction_free": true,
    "decisions_current": true,
    "artifacts_current": true,
    "handoff_intact": true
  },
  "warnings": []
}
```

---

## Context Restoration for Multi-Agent Handoffs

When context is being restored for a step that involves a new agent (different from prior step):

**Additional injection required:**
```
HANDOFF CONTEXT — this step receives work from [prior agent]
You are [current agent]. You are NOT the agent who completed steps 1-[N-1].
Your predecessor produced [artifact] which is your primary input.
Read [artifact], then complete [your step].
Do not redo prior work. Do not re-decide settled questions.
```

This prevents a common failure mode where an agent receiving a handoff attempts to "start fresh" and re-executes prior work.

---

## Integration

**Called by:** `continuation-systems/workflow-continuator.md`
**Extends:** `orchestrator/context-manager.md`
**Reads from:**
- `workflow-checkpoints/checkpoint-registry.md` → settled decisions, step states
- `execution-persistence/execution-ledger.md` → gate pass/fail history
- `execution-persistence/artifact-registry.md` → artifact paths and timestamps
- `execution-persistence/execution-memory.md` → persistent decisions

**Output:** Assembled context package → passed to workflow-continuator for agent invocation
