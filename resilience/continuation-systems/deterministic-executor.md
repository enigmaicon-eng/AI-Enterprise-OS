# Deterministic Executor

**System ID:** `deterministic-executor`
**Role:** Enforces deterministic execution guarantees — same inputs always produce same path through the workflow regardless of which session, agent instance, or context window executes it
**Principle:** Every workflow execution is reproducible, auditable, and resumable from any prior checkpoint

---

## Purpose

Non-determinism is the enemy of autonomous continuation. If two different session instances execute the same step with the same inputs and produce different decisions, recovery becomes impossible — which session's output do you trust?

The Deterministic Executor enforces the conditions under which workflow execution is deterministic, detects non-determinism when it occurs, and provides the mechanisms to resolve it.

---

## Determinism Guarantees

### Guarantee 01: Input Determinism
Given the same set of input artifacts and the same step definition, a step always receives the same context.

**Enforcement:**
- Step inputs are assembled by `context-restorer.md` using a deterministic assembly algorithm
- Input assembly is re-runnable: running it twice produces the same result
- No ambient context is injected that wasn't in the checkpoint

**Verification:**
- Input hash is recorded in the checkpoint
- On resume, re-assemble inputs and compare hash
- If hash mismatch: inputs have changed → flag as [NON-DETERMINISTIC INPUT], halt and investigate

### Guarantee 02: Gate Determinism
Gate evaluation for the same artifact always produces the same verdict.

**Enforcement:**
- Checklist gates are purely structural (does section X exist?) — deterministic
- Schema gates validate against fixed templates — deterministic
- Agent-review gates: same supervisor agent, same criteria → should produce same verdict (with bounded variance)
- Human-review gates: not deterministic — treated as an external input, not re-evaluated

**Variance handling for agent-review gates:**
If an agent-review gate produces a different verdict on re-evaluation:
1. Log both verdicts to execution ledger
2. Apply the stricter verdict (fail beats pass on re-evaluation)
3. Flag as [GATE VARIANCE DETECTED] — investigate if recurring

### Guarantee 03: Step Ordering Determinism
Steps always execute in the same order. Parallel steps always join before sequential steps.

**Enforcement:**
- Step ordering is encoded in the workflow definition file (read-only during execution)
- Parallel groups have explicit join conditions
- No step may advance until its gate passes AND all predecessor steps are COMPLETE

### Guarantee 04: Idempotent Re-execution
Executing a step that has already completed produces the same output (or discovers the prior output is still valid).

**Enforcement:**
1. Before executing any step: check if artifact exists at expected path
2. If yes AND gate_passed in ledger: skip — artifact is the canonical output
3. If yes AND gate NOT passed: re-run gate check before re-executing
4. If no: execute step normally

**Critical rule:** The ledger is the authority — not the in-memory state. If the ledger says gate_passed, the step is done, full stop.

---

## Non-Determinism Detection

The executor monitors for these non-determinism signals:

### Signal 01: Decision Drift
The same question was decided differently in two different steps or sessions.

**Detection:**
```
FOR each decision in current step:
  IF decision conflicts with any FINAL decision in settled_decision_registry:
    HALT → flag [DECISION DRIFT]
    → report: "Step [N] decision '[X]' conflicts with settled decision '[Y]' from step [M]"
    → resolution: settled decision is authoritative; current decision is rejected
```

### Signal 02: Artifact Mutation
An artifact that was marked COMPLETE has been modified after its completion timestamp.

**Detection:**
```
FOR each artifact marked COMPLETE:
  IF file.modification_timestamp > step.completed_timestamp:
    FLAG [ARTIFACT MUTATED]
    → possible causes: manual edit, another workflow writing to same path, write error
    → resolution: run gate check on current artifact state; if still passes: re-log as valid
    → if gate fails: re-execute the producing step
```

### Signal 03: Context Contamination
An agent received context from a different workflow run mixed in with the correct context.

**Detection:**
```
IF agent output references:
  - Workflow IDs from other workflows
  - Artifacts not in the current workflow's artifact registry
  - Decisions not in the current workflow's checkpoint:
    FLAG [CONTEXT CONTAMINATION]
    → discard output
    → rebuild context from clean checkpoint
    → re-invoke agent
```

### Signal 04: Parallel Track Race
Two parallel tracks produce conflicting artifacts that cannot both be true.

**Detection:**
```
AT join_at point:
  FOR each parallel track output:
    IF Track A output contradicts Track B output:
      FLAG [PARALLEL RACE CONDITION]
      → route both to supervisor-agent for conflict resolution
      → do NOT advance to sequential step until resolved
```

---

## Execution Sequence Protocol

Every step execution follows this fixed sequence:

```
STEP EXECUTION SEQUENCE
═══════════════════════
01. PRE-CHECK: Load execution registry entry for this step
02. PRE-CHECK: Verify artifact does not already exist (idempotency)
03. INPUT LOAD: Assemble inputs via context-restorer.md
04. INPUT HASH: Compute and record input hash in checkpoint
05. AGENT INVOKE: Invoke step agent with assembled context
06. OUTPUT VERIFY: Confirm output artifact exists at expected path
07. GATE CHECK: Run gate against output artifact
08. GATE RECORD: Write gate result to execution ledger
09. DECISION LOG: Extract and record decisions from output
10. CHECKPOINT: Write phase-boundary checkpoint
11. REGISTRY UPDATE: Advance step status in execution registry
12. HANDOFF: Generate handoff envelope for next step
13. ADVANCE: Transition to next step (or COMPLETE if final)
```

Every step must complete this sequence in order. No shortcuts.

**Sequence violation handling:**
If a step is found in an intermediate state (started but not all 13 steps complete):
- Identify the last completed sequence item (from execution ledger)
- Resume from item N+1
- Items 01-04 are safe to re-run (idempotent)
- Items 05-13 must be gated: check if prior execution left artifacts

---

## Deterministic Re-execution Decision Matrix

| Artifact Exists? | Gate Passed? | Checkpoint Valid? | Action |
|-----------------|-------------|------------------|--------|
| Yes | Yes | Yes | Skip — canonical output exists |
| Yes | Yes | No | Use artifact, re-write checkpoint |
| Yes | No | Yes | Re-run gate, do NOT re-execute step |
| Yes | Unknown | Any | Run gate check, proceed based on result |
| No | N/A | Yes | Execute step (checkpoint may be stale) |
| No | N/A | No | Execute step from scratch |
| Mutated | Any | Any | Run gate on mutated artifact; if pass: valid; if fail: re-execute |

---

## Execution Trace

Every execution writes a trace — the deterministic record of what happened:

```json
{
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "execution_instance": "[YYYY-MM-DD]-[session]-[attempt]",
  "sequence": [
    {"item": 1, "action": "pre_check", "result": "artifact_missing", "timestamp": "..."},
    {"item": 3, "action": "input_load", "input_hash": "sha256:...", "timestamp": "..."},
    {"item": 5, "action": "agent_invoke", "agent": "...", "timestamp": "..."},
    {"item": 7, "action": "gate_check", "gate_type": "checklist", "result": "PASS", "timestamp": "..."},
    {"item": 10, "action": "checkpoint", "checkpoint_id": "...", "timestamp": "..."},
    {"item": 13, "action": "advance", "next_step": "...", "timestamp": "..."}
  ],
  "decisions_logged": [N],
  "artifacts_produced": ["[path]"],
  "duration_seconds": [N],
  "determinism_flags": []
}
```

This trace is the audit record. Given the trace + the input artifacts, the execution can be replayed exactly.

---

## Integration

**Called by:** `continuation-systems/workflow-continuator.md` (at every step invocation)
**Extends:** `orchestrator/execution-engine.md` (adds determinism protocol to execution)
**Reads from:**
- `execution-persistence/execution-ledger.md` → gate pass/fail history
- `workflow-checkpoints/checkpoint-registry.md` → checkpoint state
- `execution-persistence/execution-memory.md` → settled decisions

**Writes to:**
- `execution-persistence/execution-ledger.md` → step execution trace
- `workflow-checkpoints/checkpoint-engine.md` → triggers checkpoint write
