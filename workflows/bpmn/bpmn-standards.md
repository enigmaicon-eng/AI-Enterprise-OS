# BPMN Standards — Enterprise Workflow Notation

## Purpose
Defines the BPMN 2.0 notation standard for all enterprise workflow definitions. Every process that crosses organizational boundaries, involves governance checkpoints, or requires human approval MUST be expressible in BPMN. This file is the authoritative element library.

---

## Element Library

### Flow Objects

#### Events
| Element | Notation | Usage |
|---|---|---|
| Start Event | `(○)` | Process entry point; one per top-level process |
| End Event | `(●)` | Terminal state; multiple allowed |
| Intermediate Catch | `(◎)` | Wait for external signal/timer/message |
| Intermediate Throw | `(◉)` | Emit signal to external subscriber |
| Timer Event | `(⊙)` | Time-based trigger (ISO 8601 duration) |
| Error Event | `(✕)` | Catch or throw named error condition |
| Escalation Event | `(△)` | Escalate to parent process or higher tier |
| Compensation Event | `(↩)` | Trigger compensating transaction |
| Conditional Event | `(≡)` | Evaluate CEL expression to proceed |

#### Activities
| Element | Notation | Usage |
|---|---|---|
| User Task | `[👤 Task]` | Requires human action; integrates with approval queue |
| Service Task | `[⚙ Task]` | Automated agent or API call |
| Script Task | `[📜 Task]` | Inline deterministic computation |
| Business Rule Task | `[📋 Task]` | Invokes decision-models/runtime-decision-engine.md |
| Call Activity | `[▷ Subprocess]` | Invoke reusable subprocess by ID |
| Sub-Process | `[┌─────┐│ Sub │└─────┘]` | Inline subprocess; inherits parent scope |
| Transaction | `[═══════]` | ACID-scoped subprocess; triggers compensation on failure |

#### Gateways
| Element | Notation | Semantics |
|---|---|---|
| Exclusive (XOR) | `◇ X` | One branch selected; evaluated top-to-bottom |
| Inclusive (OR) | `◇ O` | One or more branches; all conditions evaluated |
| Parallel (AND) | `◇ +` | All branches execute simultaneously |
| Event-Based | `◇ ⊙` | First arriving event wins; others discarded |
| Complex | `◇ *` | Custom activation condition via CEL |

---

## Connection Types

| Type | Notation | Rule |
|---|---|---|
| Sequence Flow | `——→` | Connects flow objects within same pool |
| Message Flow | `- - →` | Crosses pool boundary; carries message payload |
| Association | `····→` | Non-flow link (e.g., annotation, data reference) |
| Data Association | `····→` | Links data object to activity input/output |

---

## Pools and Lanes

```
┌─────────────────────────────────────────────────────┐
│ Pool: Organization Name                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Lane: Agent Role / Human Role                   │ │
│ │  (○) ——→ [⚙ Task] ——→ ◇ X ——→ [👤 Approve] ——→(●) │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

Rules:
- One pool per organizational unit (PM, Engineering, QA, etc.)
- Lanes represent agent roles or human actors within the org
- Message flows connect pools; sequence flows stay within pools
- Each pool has exactly one Start Event for the primary flow

---

## Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Process | `VERB-NOUN-SCOPE` | `APPROVE-RFC-GOVERNANCE` |
| Task | `verb + object` | `validate proposal` |
| Gateway (XOR) | `question?` | `approved?` |
| Gateway (AND) | `parallel:` prefix | `parallel: notify orgs` |
| Event (catch) | `[signal] received` | `escalation signal received` |
| Event (throw) | `send [signal]` | `send completion signal` |
| Error | `ERR_DOMAIN_DESCRIPTION` | `ERR_GOVERNANCE_TIMEOUT` |

---

## Subprocess Patterns

### Error Boundary Pattern
```
┌─────────────┐
│ [⚙ Task]    │ ←── boundary event (✕ ERR_X) ——→ [error handler]
└─────────────┘
```

### Compensation Pattern
```
[⚙ Execute] ——→ (●)
     ↑ compensation ←── (↩) ←── on failure
[⚙ Undo Execute]
```

### Parallel Split-Join Pattern
```
◇ + ——→ [⚙ A]
    ——→ [⚙ B]  ——→ ◇ + (join)
    ——→ [⚙ C]
```

---

## Attribute Schema

Every BPMN element MUST carry:

```yaml
element:
  id: "unique-kebab-case-id"
  name: "human-readable name"
  type: "startEvent | task | gateway | ..."
  documentation: "why this element exists"
  extensionElements:
    governance:
      tier_required: 0–5           # minimum approval tier
      constitutional_check: true/false
      audit_level: NONE | STANDARD | ENHANCED
    runtime:
      timeout_ms: integer          # 0 = no timeout
      retry_policy: none | linear | exponential
      compensation_handler: "element-id | null"
    telemetry:
      emit_span: true/false
      metric_tags: [key: value]
```

---

## Validation Rules

1. **No disconnected elements** — every flow object reachable from Start Event
2. **Gateway balance** — every split gateway must have a matching join gateway
3. **Error coverage** — every Service Task MUST have an error boundary or upstream error handler
4. **Tier compliance** — User Tasks with tier_required > 2 must route through governance-aware branching
5. **Naming** — all elements must have non-empty `name` and `documentation`
6. **Timeout mandate** — all Service Tasks MUST specify timeout_ms > 0
7. **No implicit parallelism** — parallel branches must be explicit AND gateways, not unconnected splits

---

## Integration Points

| System | How BPMN connects |
|---|---|
| `workflow-modeling/orchestration-dag-system.md` | BPMN exported to DAG for runtime execution |
| `decision-models/governance-aware-branching.md` | XOR gateways with tier_required > 0 delegate to branching engine |
| `case-management/adaptive-case-management.md` | Case workflows expressed as BPMN with dynamic lane assignment |
| `process-governance/workflow-auditability-system.md` | Every BPMN element emits audit event on entry/exit |
| `enterprise-telemetry/enterprise-event-bus.md` | Intermediate throw events publish to event bus topics |
