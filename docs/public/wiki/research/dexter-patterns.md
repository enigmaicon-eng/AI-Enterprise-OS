---
layer: wiki
section: research
type: synthesis
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: knowledge-systems-architect-agent
last-reviewed: 2026-05-10
status: active
synthesis-id: SYN-003
source: external-research/dexter/
---

# Dexter Patterns — Enterprise AI OS Adaptations

Patterns extracted from dexter (autonomous financial research agent, TypeScript/Bun) and adapted for the Enterprise AI OS.

---

## Pattern D-001: Run-Context — Serializable Session Boundary Object

**Origin:** dexter's run-context object that carries full agent state across execution boundaries

**Enterprise AI OS Adaptation:**
The run-context is the single serializable object that contains everything needed to resume a workflow after a session ends:

```yaml
run-context:
  instance-id: "{UUID}"
  workflow-id: "{workflow-name}"
  initiative-id: "{initiative}"
  session-created: "{ISO-8601}"
  last-updated: "{ISO-8601}"
  
  completed-steps: ["{step-id}"]
  in-progress-step:
    step-id: "{step-id}"
    started-at: "{ISO-8601}"
    checkpoint-path: "{path}"
  pending-steps: ["{step-ids}"]
  
  blocking-conditions:
    - type: OPEN_QUESTION|CAPABILITY_GAP|HUMAN_GATE
      description: "{what is blocking}"
      blocking-since: "{ISO-8601}"
  
  open-questions-raised: ["{Q-NNN}"]
  
  artifacts-produced:
    - type: "{artifact-type}"
      path: "{path}"
      produced-at: "{ISO-8601}"
  
  loop-detection:
    step-visit-counts: {"{step-id}": N}
    loop-detected: false
    
  metadata:
    total-steps-executed: N
    total-sessions: N
```

**Key insight from dexter:** The run-context is not a log — it is the minimal sufficient state for autonomous continuation. Everything in it is needed to resume; nothing extra.

**Where implemented:** `knowledge-governance/runtime-state-synchronization.md`, `memory-governance/continuity-checkpoint-system.md`, `ontology/runtime-vocabulary.md`

**When to use:** Every workflow instance has a run-context from creation to completion.

---

## Pattern D-002: Task Decomposition Loop

**Origin:** dexter's complex query → structured steps → execute → self-validate → confidence → loop

**Enterprise AI OS Adaptation:**
For complex orchestrator-level tasks (not a simple single-step dispatch), the master-orchestrator-agent decomposes first:

```
INPUT: complex task description
  │
  ▼
DECOMPOSE: break into ordered, atomic steps
  │ (each step has: input requirements, output schema, assigned agent, dependencies)
  ▼
VALIDATE DECOMPOSITION: consistency check (no circular deps, all inputs available)
  │
  ▼
EXECUTE: dispatch steps (sequential or parallel per dependency graph)
  │
  ▼
SELF-VALIDATE: after each step, check output against step spec
  │ PASS         FAIL
  ▼              ▼
NEXT STEP    RETRY or ESCALATE
```

**Where implemented:** `orchestrator/master-orchestrator.md`, `state-models/agent-execution-states.md`

**When to use:** Complex tasks that span multiple agents or require multiple steps.

---

## Pattern D-003: Loop Detection Safety Control

**Origin:** dexter's step-visit counter (if same step visited >3 times → loop detected → pause)

**Enterprise AI OS Adaptation:**
The run-context tracks `step-visit-counts` for every step. If any step is visited more than 3 times:
1. Set `loop-detected: true` in run-context
2. Transition agent to PAUSED state
3. Emit `workflow.loop.detected` event
4. Escalate to master-orchestrator-agent

Master orchestrator response options:
- **Break the loop:** Modify the step spec or provide missing context that caused the loop
- **Skip and continue:** If the looping step is non-critical
- **Abort the workflow:** If the loop indicates a fundamental design problem

**Why this matters:** Without loop detection, an autonomous agent can spin indefinitely consuming context budget without making progress.

**Where implemented:** `state-models/agent-execution-states.md`, `memory-governance/continuity-checkpoint-system.md`

**When to use:** Automatically enforced by the orchestrator on every workflow.

---

## Pattern D-004: Scratchpad — Ephemeral Working Memory

**Origin:** dexter's scratchpad (agent working memory during a step, not persisted)

**Enterprise AI OS Adaptation:**
Every agent has an implicit scratchpad — the in-context reasoning space during a step. Key rules:

1. **Scratchpad is not persisted:** When the step completes, scratchpad content is not written to memory
2. **Scratchpad is not the artifact:** The artifact is the structured output that matches the step schema
3. **Scratchpad can be used freely:** Agents can reason, backtrack, and revise in the scratchpad without governance overhead
4. **Scratchpad does not update the wiki:** Only formal artifacts trigger wiki and memory updates

**Practical implication:** Agents should use their full reasoning capability in the scratchpad, then produce a clean, structured artifact as the step output. The scratchpad is where thinking happens; the artifact is what gets institutionalized.

**Where implemented:** `ontology/runtime-vocabulary.md` (Scratchpad definition)

**When to use:** Always — this is standard agent operation mode.

---

## Pattern D-005: Five-Stage Context Compression

**Origin:** dexter's microcompact algorithm (tiered context compression)

**Enterprise AI OS Adaptation:**

| Stage | Technique | Expected Reduction |
|---|---|---|
| Stage 0 | Token estimation (measure before compressing) | 0% (measurement) |
| Stage 1 | Deduplication (remove repeated statements) | -10% |
| Stage 2 | Relevance filtering (drop elements with score <40) | -20% |
| Stage 3 | Distillation (extract only: binding constraints, decisions, entities, numbers, topic sentences) | -30% |
| Stage 4 | Summarization (T1 Haiku summarizes remaining sections) | -40% |
| Stage 5 | Hard truncation (P3+ elements removed until within budget) | varies |

**Critical constraint:** Stages 1-4 must preserve all P0 elements (binding constraints, human gates, security constraints). Stage 5 may only remove P3 and lower.

**Where implemented:** `memory-governance/context-compression-protocol.md`

**When to use:** When context package token count exceeds 90% of tier budget.

---

## Pattern D-006: Hard Token Budget Per Dispatch Tier

**Origin:** dexter's token counter (enforced context budget per dispatch)

**Enterprise AI OS Adaptation:**

| Tier | Model | Total Budget | Mandatory | Domain | Task |
|---|---|---|---|---|---|
| T0 | Template | 2,000 | 2,000 | 0 | 0 |
| T1 | Haiku | 8,000 | 2,000 | 4,000 | 2,000 |
| T2-Sonnet | Sonnet | 32,000 | 2,000 | 16,000 | 14,000 |
| T2-Opus | Opus | 80,000 | 2,000 | 40,000 | 38,000 |

No dispatch may exceed its tier budget. If compression cannot bring the package within budget, the dispatch is blocked and the orchestrator is notified.

**Where implemented:** `memory-governance/context-compression-protocol.md`

**When to use:** Enforced automatically by context-routing-engine on every dispatch.

---

## Pattern D-007: Autonomous Continuation with 6-Check Safety Gate

**Origin:** dexter's autonomous continuation (agent continues across execution boundaries)

**Enterprise AI OS Adaptation:**
Workflows may continue autonomously across session boundaries if ALL six checks pass:

1. Session checkpoint exists and passes integrity verification
2. All P0 binding constraints present in checkpoint
3. No open human gate markers
4. No contradictions detected in last session
5. No step-limit violations pending
6. Next step is clearly specified in run-context

If any check fails → human review required before continuation.

**Where implemented:** `memory-governance/continuity-checkpoint-system.md`

**When to use:** Long-running workflows that span sessions.

---

## Pattern D-008: Cron-Triggered Autonomous Maintenance

**Origin:** dexter's cron scheduling (time-based autonomous execution)

**Enterprise AI OS Adaptation:**

| Schedule | Task | Agent |
|---|---|---|
| Daily | Consistency anchor freshness check | master-orchestrator-agent |
| Weekly | Staleness scan + index rebuild | knowledge-systems-engineer-agent |
| Weekly | Contradiction scan | knowledge-systems-architect-agent |
| Monthly | Sprint capsule synthesis | organizational-learning-agent |
| Quarterly | Full semantic cluster re-analysis | knowledge-systems-engineer-agent |
| Quarterly | Wiki inventory and gap analysis | knowledge-systems-architect-agent |
| Annually | Recursive synthesis (Level 2→3) | knowledge-systems-architect-agent |

**Where implemented:** `knowledge-governance/knowledge-lifecycle-system.md`, `cognition-indexes/README.md`

**Note:** Cron execution requires an event bus or scheduler (GAP-INT-005). Until resolved, crons are manually triggered by the master-orchestrator-agent at session start when the schedule indicates they're due.

---

## Patterns Considered But Not Adapted

| dexter Pattern | Reason Not Adapted |
|---|---|
| Bun runtime (TypeScript execution) | Domain-specific; OS is markdown-based |
| Real-time financial data queries | Domain-specific |
| TypeScript type system | Not applicable to markdown-based OS |
| Self-modifying agent prompts | Potential for uncontrolled behavior; not adopted |