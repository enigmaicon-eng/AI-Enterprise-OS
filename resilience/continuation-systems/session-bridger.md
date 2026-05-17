# Session Bridger

**System ID:** `session-bridger`
**Role:** Manages the transition between context windows — writes the bridge package at session end, reads it at session start, and restores the thread of work seamlessly
**Trigger:** Automatic at context budget threshold; manual on session end

---

## Purpose

The Session Bridger solves the hardest problem in autonomous AI execution: the context window is finite, but complex work is not. It creates a deterministic "bridge" between one context window and the next — a compressed representation of everything the next session needs to continue without asking questions.

Think of it as the mandatory handoff between two relay runners: the current runner can't drop the baton; the incoming runner must know exactly where to place their feet.

---

## When the Bridge Is Needed

### Trigger 01: Context Budget Threshold
When the context manager detects budget approaching limit (> 80% consumed):
1. STOP current work at next clean boundary (end of sub-task, not mid-sentence)
2. Trigger session bridge write
3. Complete the bridge before context exhausts

### Trigger 02: Session End (Manual)
When the operator ends the session:
1. Wherever work is in progress: write bridge immediately
2. No waiting for clean boundaries — capture current state as-is
3. Add `[IN-PROGRESS]` header to any incomplete artifacts

### Trigger 03: Explicit Handoff
When deliberately handing off to another agent or session:
1. Write a directed bridge with explicit recipient context
2. Include any non-obvious context the recipient needs
3. Exclude context the recipient's agent definition already covers

---

## Bridge Package Format

Written to `memory/session-bridge/bridge-[YYYY-MM-DD]-[session-N].yaml`:

```yaml
session_bridge:
  bridge_id: "bridge-[YYYY-MM-DD]-[session-N]"
  written_at: "[ISO-8601]"
  written_by: "[agent-id or orchestrator]"
  context_budget_at_write: "[pct]%"
  
  # ════════════════════════════════════════════
  # SECTION 01: IMMEDIATE ORIENTATION
  # The very first thing the next session reads
  # ════════════════════════════════════════════
  
  orientation: |
    WHERE WE ARE:
    [1-2 sentence plain description of where work stands]
    
    WHAT WAS HAPPENING:
    [1-2 sentence description of what was being worked on]
    
    WHAT TO DO FIRST:
    [Specific, actionable first step for next session — no ambiguity]
  
  # ════════════════════════════════════════════
  # SECTION 02: IN-FLIGHT WORK
  # All active workflows and their exact states
  # ════════════════════════════════════════════
  
  in_flight:
    - workflow_id: "[id]"
      workflow_type: "[type]"
      priority: "[priority]"
      
      completed_steps:
        - step: "[step-id]"
          artifact: "[path]"
          gate: "PASSED"
      
      current_step:
        id: "[step-id]"
        name: "[name]"
        agent: "[agent to invoke]"
        status: "IN_PROGRESS | NOT_STARTED"
        sub_task_at: "[description of where in the step work stopped]"
        partial_artifact: "[path if draft exists]"
      
      next_session_action: |
        [Exact instruction for next session: what to do, which agent, what to produce]
  
  # ════════════════════════════════════════════
  # SECTION 03: SETTLED DECISIONS
  # What has been decided — do not re-open
  # ════════════════════════════════════════════
  
  settled_decisions:
    - decision: "[what was decided]"
      workflow: "[workflow-id]"
      step: "[step-id]"
      rationale: "[one sentence why]"
      finality: "FINAL | SOFT"
      do_not_ask: "[what the next session must not re-litigate]"
  
  # ════════════════════════════════════════════
  # SECTION 04: OPEN ITEMS
  # What is unresolved and needs attention
  # ════════════════════════════════════════════
  
  open_items:
    blockers:
      - description: "[blocker]"
        owner: "[agent or HUMAN]"
        impact: "[what it blocks]"
    
    open_questions:
      - question: "[unresolved question]"
        context: "[why it matters]"
        resolution_approach: "[suggested approach]"
    
    human_decisions_needed:
      - question: "[decision for human]"
        urgency: "[immediate | this_sprint]"
        context_at: "[path to full context]"
  
  # ════════════════════════════════════════════
  # SECTION 05: CONTEXT THAT DOES NOT PERSIST
  # Things the next session must know that
  # cannot be derived from artifacts alone
  # ════════════════════════════════════════════
  
  non_obvious_context:
    - "[Non-obvious thing: e.g., 'We rejected approach X because of Y — do not re-propose it']"
    - "[Non-obvious thing: e.g., 'The stakeholder prefers option A — even though option B scores higher']"
    - "[Non-obvious thing: e.g., 'This dependency on Z is intentional — do not remove it']"
  
  # ════════════════════════════════════════════
  # SECTION 06: EXPLICITLY EXCLUDED
  # What the next session should NOT do
  # ════════════════════════════════════════════
  
  explicitly_excluded:
    - "[do not re-examine X — already settled in step N]"
    - "[do not contact Y — they are not available this sprint]"
    - "[do not expand scope to Z — out of scope by decision D]"
  
  # ════════════════════════════════════════════
  # SECTION 07: CHECKPOINT REFERENCES
  # Where to find the full state
  # ════════════════════════════════════════════
  
  checkpoint_references:
    - workflow_id: "[id]"
      checkpoint_id: "[id]"
      checkpoint_path: "[path]"
      checkpoint_type: "phase_boundary | runtime_snapshot"
      step_captured_at: "[step-id]"
```

---

## Bridge Compression Protocol

The bridge package must be compact enough to read in < 500 tokens at session start.

**Compression rules:**
- `orientation`: 100 tokens max — the "where we are" summary
- `in_flight` per workflow: 150 tokens max (compress via step list, not full descriptions)
- `settled_decisions`: 10 tokens per decision (decision only, not full rationale)
- `open_items`: 50 tokens max per item
- `non_obvious_context`: 30 tokens max per item
- `explicitly_excluded`: 20 tokens max per item

**If compression target cannot be met:**
1. Move full detail to `memory/session-bridge/detail-[bridge-id].yaml`
2. Keep bridge to orientation + compressed in_flight + decision list
3. Bridge reads the detail file when it needs to expand

---

## Session Start Read Protocol

At every session start, the master orchestrator reads the latest bridge package:

```
STEP 01: Find latest bridge
  → Read memory/session-bridge/ directory
  → Select most recent bridge file by timestamp
  → Verify bridge integrity (hash check)

STEP 02: Inject orientation
  → Inject orientation into active context immediately
  → This is the first thing processed — before any task

STEP 03: Load in-flight work
  → For each workflow in in_flight:
    - Load execution registry entry
    - Verify checkpoint exists and is VALID
    - Queue for resumption in priority order

STEP 04: Load settled decisions
  → Add all FINAL decisions to settled_decision_registry
  → These are hard constraints — cannot be contradicted

STEP 05: Surface open items
  → Blockers → check if resolved; if not, surface to operator
  → Human decisions needed → surface immediately if urgent

STEP 06: Confirm loaded
  → Write session_start event to execution ledger
  → Status: BRIDGE_LOADED, [N] workflows queued for resumption
```

---

## Bridge Integrity

Protect against corrupt or stale bridge packages:

**Write integrity:**
- Compute SHA-256 of bridge content
- Store hash in bridge file header
- Write bridge to temp file first; rename atomically when complete

**Read integrity:**
- Verify hash on read
- If hash mismatch: bridge is corrupt → fall back to execution registry + state files
- If bridge is from > 24h ago: flag as STALE → verify with execution registry

**Stale bridge detection:**
- Bridge written at context limit with incomplete in-flight information
- Context budget at write: < 20% remaining → possible incomplete bridge
- Flag: [LOW-BUDGET BRIDGE — may be incomplete, verify against execution registry]

---

## Multi-Session Continuity Chain

For workflows spanning many sessions:

```
Session 1: Work → Bridge-01 → [END]
Session 2: [Bridge-01 read] → Work → Bridge-02 → [END]
Session 3: [Bridge-02 read] → Work → Bridge-03 → [END]
...
Session N: [Bridge-N-1 read] → Work → [COMPLETE]
```

Each bridge in the chain references the prior bridge — this creates a complete chain of custody from start to finish.

**Bridge chain validation:**
Before starting work, verify the bridge chain is unbroken:
- Bridge N references Bridge N-1
- Bridge N-1's in_flight state matches Bridge N's starting state
- If chain is broken: fall back to cold-start reconstruction

---

## Integration

**Written by:**
- `continuation-systems/continuation-engine.md` → at context threshold
- `orchestrator/master-orchestrator.md` → at session end

**Read by:**
- `orchestrator/master-orchestrator.md` → at every session start
- `continuation-systems/continuation-engine.md` → for workflow queue

**Storage:**
- `memory/session-bridge/` → bridge packages
- `memory/session-bridge/detail/` → overflow detail files
