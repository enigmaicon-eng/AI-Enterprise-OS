---
layer: ontology
type: workflow-vocabulary
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
status: active
---

# Workflow Vocabulary

Authoritative definitions for all workflow, orchestration, and execution terms used across the Enterprise AI OS. Terms here take precedence over ad-hoc usage in any artifact.

---

## Workflow Execution Terms

### Workflow
A deterministic, multi-step process with defined inputs, outputs, quality gates, and agent assignments. Stored in `workflows/`. Workflows are specifications — they describe WHAT to do and in what order. A workflow cannot execute itself.

### Workflow Instance
A single execution of a workflow, bound to a specific initiative and date. Identified by `{workflow-id}-{date}-{instance-id}`. State persisted to `memory/workflow-state/{instance-id}.md` after every step.

### Workflow Step
One node in a workflow. Has: assigned agent, input artifacts, output artifact, quality check. Steps are atomic — they either complete fully or roll back.

### Step Checkpoint
A persisted state snapshot written after each step completes. Enables resume from the last completed step on session boundary. Pattern adapted from LangGraph checkpoint/resume. Format: `{instance-id}-step-{N}.checkpoint.md`.

### Step Limit
The maximum number of steps a workflow instance may execute autonomously before requiring human re-authorization. Default: 25 steps per session. Anti-runaway control adapted from dexter's step-limit safety pattern.

### Workflow Run-Context
The boundary object that travels with a workflow instance across session boundaries. Contains: current step N, all completed step outputs, all open questions, agent assignments. Written to `memory/workflow-state/` at session end, loaded at session start.

---

## Orchestration Terms

### Orchestrator
The executive-orchestrator-agent. Reads intent, routes to correct workflow, dispatches agents. Does not execute work itself — coordinates others.

### Dispatch
The act of activating an agent for a specific step with a scoped context package. Dispatch is deterministic: routing table → agent, not improvised.

### Handoff
The structured transfer of work between agents via a named artifact (YAML envelope). Handoffs are the primary inter-agent communication mechanism. Free-form messages between agents are prohibited.

### Pipeline
A chained sequence of agents where each agent's output is the next agent's input. Pipelines are defined in workflow files. Adapted from ruflo's named-agent SendMessage chain.

### Fan-Out
A workflow pattern where one step produces N parallel subtasks dispatched simultaneously to N agents. Outputs are collected before proceeding.

### Fan-In
The collection step following a fan-out. Aggregates N parallel results into one synthesized output before the workflow continues.

### Swarm
A collection of named, addressable agents with shared task memory, coordinated by a topology (hierarchical, mesh, adaptive). Swarms execute complex tasks requiring continuous inter-agent coordination.

### Anti-Drift Protocol
The set of constraints that prevent agents in a swarm from diverging from their assigned roles, topology, and task context. Enforced via: hierarchical topology (single coordinator), raft consensus (one leader per domain), specialized roles (no role overlap).

---

## Execution State Terms

### Execution Graph
The DAG of steps in a workflow instance, where nodes are steps and edges are data dependencies. The execution graph is the runtime representation of a workflow definition.

### Dependency Edge
A directed edge in the execution graph from step A to step B, indicating B cannot start until A completes and its output artifact is validated.

### Parallel Band
A set of steps in the execution graph with no inter-dependencies — they can execute simultaneously. Maximizing parallel bands reduces total wall-clock time.

### Critical Path
The longest sequence of dependent steps in the execution graph. Defines the minimum time to workflow completion.

### Blocking Gate
A quality gate that halts execution until a human or designated agent provides explicit approval. Blocking gates cannot be auto-resolved.

### Non-Blocking Gate
A quality gate that flags a potential issue but does not halt execution. Non-blocking gate failures are logged and reviewed post-execution.

### Rollback Point
A step N such that if step N+1 fails, the workflow can restore to the state after step N without data loss. Rollback points must be explicitly defined in workflow specifications.

---

## Autonomy Terms

### Autonomous Step
A workflow step that executes without human interaction, given its preconditions are met.

### Human-Required Step
A workflow step that mandates human authorization before proceeding. Defined in `constitution/human-approval-constitution.md`.

### Loop Detection
A runtime check that identifies if a workflow instance is cycling through the same steps without progress. Triggered when a step is visited >3 times in a single instance. Loop detection is an autonomous safety control. Adapted from dexter's loop detection system.

### Confidence Threshold
The minimum quality score an agent's output must achieve before the workflow proceeds to the next step. If output score < threshold, the step self-validates and retries (max: 3 iterations). Adapted from dexter's self-validation loop.

### Autonomous Continuation
The protocol by which a workflow resumes execution after a session boundary without human re-initiation. Requires: valid run-context checkpoint, no human-required gates in the next step, no active escalations.

---

## Scheduling Terms

### Cron Workflow
A workflow that executes on a defined schedule rather than on demand. Examples: wiki freshness check (daily), memory consolidation (weekly), maturity model assessment (monthly). Adapted from dexter's cron scheduling system.

### Trigger Event
An external signal that initiates a workflow instance. Trigger types: human-initiated, scheduled (cron), event-driven (webhook), dependency-satisfied (another workflow completed).

### Backpressure
The condition where the workflow queue exceeds the agent dispatch capacity. Backpressure is resolved by prioritizing by initiative tier and deferring lower-priority instances.

---

## Model Dispatch Terms

### Dispatch Tier
The complexity-based model selection system for agent tasks. Three tiers:
- **T0:** Template/booster — deterministic transforms, no LLM call
- **T1:** Haiku — simple tasks, well-defined outputs, low reasoning requirement
- **T2:** Sonnet/Opus — complex reasoning, architecture decisions, security review, synthesis

Adapted from ruflo's 3-tier model routing (WASM→Haiku→Sonnet/Opus).

### Task Complexity Score
A 0–100 score assigned before dispatch to determine Dispatch Tier. Factors: number of input artifacts (×5), reasoning depth required (0/25/50), cross-domain coordination required (0/25), security sensitivity (0/25).

### Fallback Route
The secondary agent or model invoked when the primary dispatch fails or times out. Every dispatch has a defined fallback.
