---
layer: ontology
type: runtime-vocabulary
version: 1.0.0
created: 2026-05-10
owner: runtime-architect-agent
status: active
---

# Runtime Vocabulary

Authoritative definitions for all runtime, execution infrastructure, and distributed coordination terms. These terms govern how the OS executes, coordinates agents, and manages state at runtime.

---

## Runtime Architecture Terms

### Runtime Substrate
The execution infrastructure that interprets workflow definitions and dispatches agent tasks without human orchestration of each step. Currently absent (CRITICAL-001). Target: MCP-connected coordination layer reading workflow definitions and executing steps.

### Runtime Layer
The active execution surface of the OS. Distinct from the definition layer (workflow/agent files) and the knowledge layer (wiki/memory). The runtime layer holds: active workflow instances, agent dispatch queue, event bus state, health monitors.

### Execution Engine
The component responsible for reading workflow definitions, scheduling step execution, managing step dependencies, and writing checkpoint state after each step. Defined in `orchestrator/execution-engine.md`. Currently: human-operated. Target (Phase 2): automated via MCP tooling.

### Session Boundary
The point at which a Claude operating session ends and all in-memory state is lost unless explicitly persisted. Session boundaries are the primary failure mode for organizational continuity. Managed by the run-context system.

### Run-Context
A serializable boundary object that captures all state necessary to resume a workflow instance at the next session start. Contains: workflow instance ID, current step N, completed step outputs, active agent assignments, open questions, dispatch queue. Persisted to `memory/workflow-state/` at session end. Adapted from dexter's run-context pattern.

---

## State Management Terms

### State Machine
A formal model of a system's possible states and the transitions between them. Every major OS entity (workflow instances, artifacts, agents) has a defined state machine. State machines are specified in `state-models/`.

### State Transition
A change from one valid state to another, triggered by a defined event. Transitions are recorded in the entity's state history. Invalid transitions (not in the state machine) are rejected.

### State Persistence
The act of writing current state to durable storage (disk) such that it survives session boundaries. State persistence is mandatory at: step completion, gate passage, agent handoff, session end.

### Checkpoint
A complete, consistent snapshot of a workflow instance's state at a specific step. Checkpoints enable exact resume — the workflow restarts from the beginning of the checkpointed step. Adapted from TradingAgents' LangGraph checkpoint/resume.

### Resume Point
The step from which a workflow instance restarts after a session boundary. Always the checkpoint immediately before the last-known-good state. Resume is validated by replaying the step's precondition check.

### State Reconciliation
The process of resolving inconsistencies between persisted state (checkpoint) and current conditions. Triggered at session start when a workflow instance checkpoint exists. Agent: `state-machine-systems-agent`.

---

## Event System Terms

### Event
A discrete, timestamped signal that something has happened in the OS or an external system. Events are the primary mechanism for decoupled agent coordination. Every workflow transition, gate passage, and external integration action produces events.

### Event Type
The classification of an event. Namespace: `{source}.{entity}.{action}`. Examples: `workflow.step.completed`, `gate.G2.passed`, `incident.P1.triggered`, `integration.jira.issue.created`.

### Event Bus
The message broker that routes events from producers to subscribers. Currently absent (GAP-INT-005). Without an event bus, the OS operates in poll-only mode.

### Event Subscription
A declared interest by an agent in events of a specific type. Subscriptions are registered in `integrations/event-subscriptions-registry.md`. When the event bus exists, agents receive events matching their subscriptions.

### Event Consumer
An agent or workflow that acts on received events. Consumer contract: process event within SLA, acknowledge receipt, produce output artifact if required by workflow.

### Dead Letter Queue
The store for events that could not be processed by any subscriber after N retry attempts. Events in the DLQ require human intervention to reroute or discard.

### Webhook
An HTTP callback from an external system to the OS's webhook endpoint. Currently absent (GAP-INT-006). When received, webhooks are translated into internal events and published to the event bus.

---

## Agent Execution Terms

### Agent Instance
A single invocation of an agent definition for a specific task within a specific workflow instance. Agent instances are ephemeral — they exist only within a session. Agent definitions are permanent.

### Dispatch Queue
The ordered list of agent instances awaiting execution. Ordered by: priority tier, dependencies satisfied, SLA deadline proximity. Managed by `agent-scheduling-agent`.

### Token Budget
The maximum number of context tokens allocated to a specific agent dispatch. Enforced by the context-routing-engine. If context exceeds budget, compression is applied. Adapted from dexter's token-counter pattern.

### Agent Heartbeat
A periodic signal from a long-running agent instance indicating it is alive and progressing. Absence of heartbeat for >5 minutes triggers a status check by `runtime-observability-agent`.

### Agent Timeout
The maximum wall-clock time an agent instance may run before it is considered failed and the dispatcher retries or escalates. Default timeouts: T1 agents: 5 minutes, T2 agents: 20 minutes.

---

## Distributed Coordination Terms

### Consensus
Agreement among multiple agents on a single authoritative value. Required when multiple agents produce conflicting outputs. Resolution protocol: authority-tier wins; same-tier uses Raft-style leader arbitration.

### Raft Leader
The designated authoritative agent for a specific knowledge domain during a session. The Raft leader holds the canonical state and resolves conflicts among followers. One leader per domain, elected at session start. Adapted from ruflo's Raft consensus mechanism.

### Byzantine Fault Tolerance
The ability of the OS to continue correct operation when some agents produce incorrect, malicious, or inconsistent outputs. The OS achieves this through: mandatory supervisor review, human approval gates, contradiction detection, and EWC checks.

### CRDT (Conflict-Free Replicated Data Type)
A data structure designed so that concurrent updates from multiple agents can always be merged without conflict. Applied to: memory namespace updates, knowledge graph edge sets, capability gap tracker entries. When two agents update the same CRDT concurrently, the merge is deterministic and correct. Adapted from ruflo's crdt-synchronizer.

### Gossip Protocol
A distributed information propagation pattern where each agent periodically exchanges state with a subset of peers. Used for: propagating knowledge updates, disseminating configuration changes, and eventually-consistent state synchronization across agents. Adapted from ruflo's gossip-coordinator.

---

## Health and Observability Terms

### Health Check
A point-in-time assessment of whether a component is operating within its defined parameters. Health checks run every 5 minutes for all registered integrations, every step for all active workflow instances.

### Degraded Mode
The operational state when one or more components are unhealthy but the OS can continue with reduced capability. Degraded mode activates workarounds (e.g., keyword grep instead of vector search).

### Circuit Breaker
A protective pattern that stops sending requests to a failing component after N consecutive failures, allowing it to recover. After a defined wait period, the circuit half-opens to test recovery.

### DORA Metrics
The four delivery performance metrics tracked by the OS:
- D1: Deployment Frequency
- D2: Lead Time for Changes
- D3: Change Failure Rate
- D4: Mean Time to Restore

---

## Model Execution Terms

### Inference
The act of an LLM generating output for a given input. One inference per agent step (or per self-validation iteration).

### Structured Output
An agent output that conforms to a predefined schema, enabling machine-readable parsing and validation by downstream steps. All OS workflow step outputs are structured. Adapted from TradingAgents' structured output agents.

### Prompt Version
A tracked, named version of an agent's system prompt. Prompt versions are managed with the same discipline as code — semantic versioning, diff history, regression testing. Required governance for any agent definition change.

### Reasoning Trace
The chain-of-thought output of an agent step, preserved in the step artifact for audit. Not included in downstream context unless explicitly required by the next step.
