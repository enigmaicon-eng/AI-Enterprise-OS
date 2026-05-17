# BPMN Orchestration Bridge

## Purpose
Translates BPMN process definitions into executable orchestration DAGs. This bridge is the runtime compiler that converts notation into execution. No BPMN process executes directly — it must pass through this bridge to become a runtime artifact.

---

## Translation Pipeline

```
BPMN Definition (bpmn-standards.md schema)
    ↓
[1] Schema Validation (bpmn-validation-engine.md)
    ↓
[2] Element Extraction → Node + Edge lists
    ↓
[3] Gateway Resolution → DAG branch/join structures
    ↓
[4] Activity Binding → Agent task assignments
    ↓
[5] Event Wiring → Enterprise event bus subscriptions
    ↓
[6] Governance Injection → Constitutional checkpoints
    ↓
[7] DAG Emission → orchestration-dag-system.md runtime
```

---

## Element → DAG Node Mapping

| BPMN Element | DAG Node Type | Runtime Handler |
|---|---|---|
| Start Event | `dag.source` | Entry point; no agent assignment |
| End Event | `dag.sink` | Terminal; publishes completion event |
| Service Task | `dag.task.service` | Agent assignment via trust-boundaries/ |
| User Task | `dag.task.human` | Routes to approval queue |
| Business Rule Task | `dag.task.decision` | Calls runtime-decision-engine.md |
| Script Task | `dag.task.script` | Inline deterministic execution |
| Call Activity | `dag.task.subprocess` | Nested DAG instantiation |
| Sub-Process | `dag.group` | Logical grouping; inherits parent DAG scope |
| XOR Gateway | `dag.branch.exclusive` | CEL condition evaluation |
| AND Gateway (split) | `dag.branch.parallel` | Fork all outbound edges |
| AND Gateway (join) | `dag.join.parallel` | Block until all inbound edges complete |
| OR Gateway | `dag.branch.inclusive` | Evaluate all conditions; activate matching |
| Event-Based Gateway | `dag.branch.event` | Subscribe to competing events; first wins |
| Timer Event | `dag.task.timer` | ISO 8601 duration; fires continuation |
| Error Event (boundary) | `dag.handler.error` | Attached to task; activates on ERR_ match |
| Escalation Event | `dag.handler.escalation` | Routes to escalation-case-system.md |
| Compensation Event | `dag.handler.compensation` | Triggers compensating node chain |

---

## Gateway Resolution Rules

### XOR Gateway
```yaml
node_type: dag.branch.exclusive
evaluation_order: top_to_bottom   # BPMN default flow order
default_flow: required            # must specify a default flow
condition_language: CEL
example:
  conditions:
    - flow_id: "flow-approved"
      expression: "approval.status == 'APPROVED'"
    - flow_id: "flow-rejected"
      expression: "approval.status == 'REJECTED'"
  default_flow: "flow-deferred"
```

### AND Gateway (Split)
```yaml
node_type: dag.branch.parallel
behavior: fork_all               # all outbound edges activate simultaneously
scope_isolation: true            # each branch gets own execution context copy
```

### AND Gateway (Join)
```yaml
node_type: dag.join.parallel
completion_mode: all_required     # wait for all incoming branches
timeout_ms: inherited_from_process
on_timeout: ERR_PARALLEL_JOIN_TIMEOUT
```

### Event-Based Gateway
```yaml
node_type: dag.branch.event
subscriptions:                   # generated as enterprise event bus subscriptions
  - topic: "WORKFLOW_SIGNALS"
    filter: "event.signal_id == 'APPROVAL_RECEIVED'"
    flow_id: "flow-approved"
  - topic: "WORKFLOW_SIGNALS"
    filter: "event.signal_id == 'REJECTION_RECEIVED'"
    flow_id: "flow-rejected"
first_wins: true
cancel_others_on_win: true
```

---

## Activity Binding

### Service Task → Agent Assignment
```yaml
bpmn_task:
  id: "validate-rfc"
  type: Service Task
  implementation: "##AgentAssignment"
  extension:
    agent_capability: "document_validation"
    trust_tier_min: 2

dag_node:
  id: "validate-rfc"
  type: dag.task.service
  executor:
    selection_policy: "capability_match"
    required_capability: "document_validation"
    trust_tier_min: 2
    fallback: "escalate_to_human"
  timeout_ms: 30000
  retry:
    policy: exponential
    max_attempts: 3
    base_delay_ms: 1000
```

### User Task → Approval Queue Routing
```yaml
bpmn_task:
  id: "peer-review"
  type: User Task
  assignee: "##Role:architect"
  extension:
    tier_required: 3

dag_node:
  id: "peer-review"
  type: dag.task.human
  routing:
    queue: "approval-queue"
    role: "architect"
    tier_required: 3
    sla_ms: 86400000        # 24h
    on_sla_breach: escalate
    escalation_target: "tier-4-approver"
```

---

## Governance Injection

When a process element has `tier_required > 0` or `constitutional_check: true`, the bridge automatically inserts a governance checkpoint node:

```
Original:  [⚙ risky-action] ——→ [next]

Injected:  [⚙ risky-action] ——→ [⚙ constitutional-check] ——→ ◇ X (pass?)
              ——PASS——→ [next]
              ——FAIL——→ [⚙ governance-violation-handler] ——→ (✕ ERR_CONSTITUTIONAL_VIOLATION)
```

Injection occurs at compile time, not runtime — the DAG stored in orchestration-dag-system.md already contains these nodes.

---

## Event Wiring

BPMN Intermediate Throw Events → enterprise event bus publications:

```yaml
bpmn_event:
  id: "send-completion"
  type: IntermediateThrowEvent
  event_definition: MessageEventDefinition
  message_ref: "workflow-complete"

dag_node:
  id: "send-completion"
  type: dag.task.service
  executor: "enterprise-event-bus.publish"
  payload:
    topic: "WORKFLOW_LIFECYCLE"
    event_type: "WORKFLOW_COMPLETED"
    payload_mapping: "$.context.outputs"
```

BPMN Intermediate Catch Events → event bus subscriptions:

```yaml
dag_node:
  id: "wait-for-approval"
  type: dag.task.timer   # special: pauses DAG execution
  subscription:
    topic: "WORKFLOW_SIGNALS"
    filter: "event.correlation_id == dag.instance_id"
    timeout_ms: 86400000
    on_timeout: ERR_APPROVAL_TIMEOUT
```

---

## Output Artifact

The bridge emits a compiled DAG artifact:

```yaml
dag_artifact:
  source_process_id: "PROC-GOV-001"
  source_version: "2.1.0"
  compiled_at: "ISO-8601 timestamp"
  dag_id: "dag-PROC-GOV-001-2.1.0"
  nodes: [...]
  edges: [...]
  entry_node: "start-event-id"
  terminal_nodes: [...]
  governance_checkpoints: [...]
  event_subscriptions: [...]
  compensation_chains: [...]
  schema_hash: "sha256:..."
```

This artifact is stored in `orchestration-dags/` and referenced by the runtime execution engine.
