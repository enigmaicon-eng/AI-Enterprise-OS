# BPMN Subprocess Library — Reusable Process Patterns

## Purpose
A catalog of reusable subprocess patterns. These are composable BPMN fragments that implement common enterprise patterns. Use Call Activities to invoke them — do not inline-copy their logic.

---

## Pattern Registry

### SBP-001 — Approval Gate Pattern

**Use when:** Any decision requiring tier-gated human approval before proceeding.

```
(○) ——→ [⚙ prepare approval request]
    ——→ [👤 tier-N approval]
    ——→ ◇ X (decision?)
        ——APPROVED——→ (● approved)
        ——REJECTED——→ (● rejected)
        ——NEEDS_INFO——→ [⚙ request clarification] ——→ (⊙ await response) ——→ [loop back to approval]
```

**Parameters:**
```yaml
inputs:
  artifact: reviewable artifact
  tier_required: 1–5
  sla_ms: milliseconds
  approver_role: role string
outputs:
  decision: APPROVED | REJECTED | NEEDS_INFO
  rationale: string
  approver_id: agent-id
```

**Error handling:** `ERR_APPROVAL_TIMEOUT` if SLA breached; auto-escalates via PROC-INCIDENT-001.

---

### SBP-002 — Retry with Exponential Backoff

**Use when:** Calling external services or agents that may transiently fail.

```
(○) ——→ [⚙ attempt]
    ——→ ◇ X (success?)
        ——YES——→ (● success)
        ——NO——→ ◇ X (max attempts reached?)
            ——YES——→ (✕ ERR_MAX_RETRIES)
            ——NO——→ [⚙ compute backoff delay] ——→ (⊙ timer: backoff) ——→ [loop back to attempt]
```

**Parameters:**
```yaml
inputs:
  task_ref: element-id of task to retry
  max_attempts: integer (default 3)
  base_delay_ms: integer (default 1000)
  multiplier: float (default 2.0)
  max_delay_ms: integer (default 60000)
outputs:
  result: task output on success
error_codes:
  - ERR_MAX_RETRIES
```

---

### SBP-003 — Parallel Approval Collection

**Use when:** Multiple independent approvals required before proceeding (quorum pattern).

```
(○) ——→ [⚙ identify required approvers]
    ——→ ◇ + (parallel split — one branch per required approver)
        ——→ [👤 approver-1 review]
        ——→ [👤 approver-2 review]
        ——→ [👤 approver-N review]
    ——→ ◇ + (join all)
    ——→ [⚙ compute quorum result]
    ——→ ◇ X (quorum met?)
        ——YES——→ (● quorum approved)
        ——NO——→ (● quorum rejected)
```

**Parameters:**
```yaml
inputs:
  approver_ids: [agent-id]
  quorum_threshold: float (0.0–1.0, default 0.67)
  sla_ms: per-approver SLA
outputs:
  quorum_met: boolean
  votes: {agent-id: APPROVE | REJECT | ABSTAIN}
  vote_rationales: {agent-id: string}
```

---

### SBP-004 — Saga Compensation Chain

**Use when:** Multi-step transaction where each step has a compensating action for rollback.

```
(○)
  ——→ [⚙ step-1]  ←— compensation: [⚙ undo-step-1]
  ——→ [⚙ step-2]  ←— compensation: [⚙ undo-step-2]
  ——→ [⚙ step-3]  ←— compensation: [⚙ undo-step-3]
  ——→ (● complete)

On ERR_ANY at step-N:
  Trigger compensation in reverse order: undo-N → undo-(N-1) → ... → undo-1
  ——→ (● compensated)
```

**Parameters:**
```yaml
inputs:
  steps: [task-definitions with compensation_handler each]
outputs:
  result: COMPLETED | COMPENSATED
  completed_steps: [step-id]
  compensation_log: [compensation-event]
```

---

### SBP-005 — Constitutional Review Checkpoint

**Use when:** Any process element that may have constitutional implications.

```
(○) ——→ [⚙ extract reviewable artifact]
    ——→ [📋 evaluate against constitution/]
    ——→ ◇ X (verdict?)
        ——PASS——→ (● constitutional)
        ——CONDITIONAL——→ [⚙ apply conditions] ——→ [👤 condition acknowledgment] ——→ (● conditional-pass)
        ——FAIL——→ [⚙ emit constitutional-violation-detected] ——→ (✕ ERR_CONSTITUTIONAL_VIOLATION)
```

**Parameters:**
```yaml
inputs:
  artifact: reviewable artifact
  evaluation_context: {principal, action, scope}
outputs:
  verdict: PASS | CONDITIONAL | FAIL
  violations: [principle-id]
  conditions: [condition-string]
```

This is the runtime implementation of PROC-GOV-005.

---

### SBP-006 — Human-AI Collaborative Review

**Use when:** Review tasks where AI provides analysis and human provides judgment.

```
(○) ——→ [⚙ AI pre-analysis] (confidence scored)
    ——→ ◇ X (confidence > threshold?)
        ——HIGH——→ [⚙ AI decision with rationale] ——→ [👤 human spot-check sample] ——→ (● decided)
        ——LOW——→ [⚙ present AI analysis to human]
                 ——→ [👤 human review with AI context]
                 ——→ [⚙ AI updates model from human decision]
                 ——→ (● decided)
```

**Parameters:**
```yaml
inputs:
  artifact: reviewable artifact
  confidence_threshold: float (default 0.85)
  spot_check_rate: float (default 0.10)  # for high-confidence path
outputs:
  decision: string
  decided_by: AI | HUMAN | HUMAN_WITH_AI
  confidence: float
  rationale: string
```

---

### SBP-007 — Event-Driven State Synchronization

**Use when:** Process must wait for external state change signaled via enterprise event bus.

```
(○) ——→ [⚙ register correlation-id on event bus]
    ——→ ◇ ⊙ (event-based gateway)
        ——→ (◎ success-signal received) ——→ (● success)
        ——→ (⊙ timeout timer) ——→ ◇ X (retry?)
            ——YES——→ [⚙ retry trigger] ——→ [loop back]
            ——NO——→ (✕ ERR_SYNC_TIMEOUT)
```

**Parameters:**
```yaml
inputs:
  expected_topic: event bus topic
  correlation_key: string
  timeout_ms: integer
  max_retries: integer
outputs:
  received_event: event payload
error_codes:
  - ERR_SYNC_TIMEOUT
  - ERR_CORRELATION_MISMATCH
```

---

## Library Governance

- All patterns versioned; breaking changes require new SBP-XXX ID
- Deprecated patterns retained for 180 days (longer than process deprecation)
- New patterns require structural validation proof and 2 concrete usage examples before registration
- Patterns are parameterized — no hardcoded IDs, roles, or SLAs
