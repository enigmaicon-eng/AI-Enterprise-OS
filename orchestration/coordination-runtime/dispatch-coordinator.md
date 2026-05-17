---
layer: coordination-runtime
type: dispatch-coordinator
version: 1.0.0
created: 2026-05-10
owner: master-orchestrator-agent
authority: enterprise-architecture-council
---

# Dispatch Coordinator

Manages multi-agent dispatch patterns — how agents are dispatched in coordinated configurations (sequential, parallel, conditional, tournament) and how dispatch queues are managed.

---

## Dispatch Patterns

### Pattern 1: Sequential Chain
Each agent completes before the next starts. Output of agent N is the direct input to agent N+1.

```
[Agent A] → artifact-A → [Agent B] → artifact-B → [Agent C] → final-artifact

Use when:
  - B requires A's output as input
  - Order matters for quality (analysis before design before implementation)
  - Risk must be assessed before high-authority agent engages

Dispatch sequence:
  1. Dispatch Agent A with context package
  2. Await RESULT message from Agent A (artifact-A)
  3. Validate artifact-A against step schema
  4. If valid: add artifact-A to Agent B's dispatch context
  5. Dispatch Agent B
  6. Repeat
```

### Pattern 2: Parallel Fan-Out
Multiple agents dispatched simultaneously for independent tasks. Fan-in at completion.

```
                ┌─ [Agent A] ─ artifact-A ─┐
[Coordinator] ──┼─ [Agent B] ─ artifact-B ─┼─ [Fan-In] → merged-artifact
                └─ [Agent C] ─ artifact-C ─┘

Use when:
  - Tasks are genuinely independent (no data dependency)
  - Latency matters more than sequential quality
  - Multiple domain perspectives needed simultaneously

Dispatch sequence:
  1. Verify independence: no step in the parallel band depends on another
  2. Dispatch all N agents simultaneously with their separate context packages
  3. Collect results as they arrive (async)
  4. When all N complete (or timeout): trigger fan-in
  5. Fan-in applies merge/consensus/arbiter strategy
  6. Produce merged artifact
```

### Pattern 3: Conditional Routing
Next agent is selected based on the output of the current agent.

```
[Risk Classifier] → risk-score
  │
  ├─ LOW (0-25)     → [Standard Agent T2]
  ├─ MEDIUM (26-50) → [Specialist Agent T2]
  ├─ HIGH (51-75)   → [Authority Agent T3]
  └─ CRITICAL (76+) → [Executive Agent T4] + human gate

Use when:
  - Routing decision cannot be made before the prior step completes
  - Different risk levels require different agents
  - Workflow branches on a classification or decision
```

### Pattern 4: Tournament
Multiple agents independently produce competing solutions. An arbiter selects.

```
                ┌─ [Agent A proposal] ─┐
[Coordinator] ──┼─ [Agent B proposal] ─┼─ [Arbiter Agent] → winning-proposal
                └─ [Agent C proposal] ─┘

Use when:
  - High-stakes decision where multiple valid approaches exist
  - Want to mitigate single-agent bias (from TradingAgents: analyst independence)
  - Novel problem where the best solution is not obvious

Dispatch sequence:
  1. Dispatch all N agents with IDENTICAL context packages
  2. Agents produce independent proposals (no visibility into each other's work)
  3. Coordinator collects all proposals
  4. Arbiter receives all N proposals in a single context package
  5. Arbiter evaluates using structured rubric (consensus-engine.md: ARBITER protocol)
  6. Arbiter produces winning proposal or synthesized output
```

### Pattern 5: Escalation Chain
Task starts at minimum authority tier and escalates if the agent determines it's beyond scope.

```
[T1 Agent] → ESCALATE → [T2 Agent] → ESCALATE → [T3 Agent] → decision

Use when:
  - Task complexity is uncertain at intake
  - Want to use lowest possible tier for efficiency
  - Escalation criteria are well-defined

Escalation triggers (for auto-escalation):
  - Confidence score < 75 and task risk ≥ HIGH
  - Agent encounters constitutional constraint it cannot evaluate
  - Decision would bind future work (binding constraint creation)
  - Agent determines it lacks domain expertise
```

---

## Dispatch Queue Management

When more tasks are ready to dispatch than agents are available:

### Priority Queue Ordering
Tasks in the dispatch queue are ordered by:
```
priority_score = (urgency_weight × urgency) + (risk_weight × risk_level) + (dependency_weight × blocking_count)

urgency_weight = 0.4
risk_weight = 0.3       # HIGH/CRITICAL risk tasks get priority
dependency_weight = 0.3  # tasks blocking many other tasks get priority

urgency: CRITICAL=100, HIGH=75, NORMAL=50, LOW=25
risk_level: CRITICAL=100, HIGH=75, MEDIUM=50, LOW=25
blocking_count: number of subsequent steps this step blocks
```

### Queue Policies

**FIFO within same priority:** Tasks with identical priority scores process in arrival order.

**Starvation prevention:** No task may wait more than 2× its declared time budget in the queue before priority is automatically elevated by one level.

**Human gate priority:** Tasks awaiting human approval are placed in a separate HUMAN_GATE_PENDING queue and do not consume execution queue slots.

**Emergency preemption:** CRITICAL risk tasks flagged by the risk classifier may preempt currently queued (not executing) tasks of MEDIUM or lower priority.

---

## Agent Availability Management

Before dispatching to an agent, the dispatch coordinator checks availability:

```yaml
# Availability thresholds
LOW: 0-1 active steps — immediately available
MEDIUM: 2-3 active steps — available with minor queue wait
HIGH: 4-5 active steps — may queue; consider backup agent
OVERLOADED: 6+ active steps — route to backup agent; do not add to queue
```

### Backup Agent Selection

When primary agent is OVERLOADED, select backup:
1. Look up agent's `expertise-domain` in expertise-registry.md
2. Find agents with matching domain expertise and availability ≤ HIGH
3. Select highest-expertise match that is within required authority tier
4. If no backup exists at correct tier: queue for primary agent (do not downgrade authority)

---

## Dispatch Timeout Protocol

Every dispatch has a declared time budget based on task complexity:

| Task Complexity Score | Time Budget |
|---|---|
| 0 (T0) | 30 seconds |
| 1-30 (T1) | 5 minutes |
| 31-75 (T2-Sonnet) | 20 minutes |
| 76-100 (T2-Opus) | 45 minutes |

At 80% of time budget: dispatch coordinator emits `dispatch.approaching-timeout` warning.
At 100% of time budget: dispatch marked as STALLED, execution-monitor.md protocol activates.

---

## Cross-Session Dispatch Continuity

If a dispatch is in-flight when a session ends (abnormal termination):

1. The dispatch state is saved in coordination-state.md (step status: RUNNING)
2. On next session start: RUNNING steps are reset to PENDING (output not verified)
3. Dispatch coordinator re-dispatches all PENDING steps
4. If the prior dispatch produced a partial output file: it is discarded (not used)
5. Fresh dispatch produces clean output