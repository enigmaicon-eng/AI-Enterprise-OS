# Sandbox Engine
**ID:** SBOX-ENG-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + Engineering Org | **Updated:** 2026-05-16

---

## Purpose

Master coordinator for all execution sandboxing in the Enterprise AI OS. Every agent action that touches external systems, modifies shared state, or produces side effects should pass through the sandbox engine before live execution. The sandbox engine determines the appropriate isolation level, provisions the environment, monitors execution, and either commits or discards results based on validation outcomes.

**Core guarantee:** No sandboxed execution can produce irreversible external effects without explicit commit authorization.

---

## Sandbox Taxonomy

```yaml
sandbox_types:
  DRY_RUN:
    description: Execute logic without committing any side effects
    isolation: Full — all writes intercepted; no external calls made
    cost: Low (no resource provisioning)
    use_case: Validate workflow logic, preview outputs, governance checks
    
  SYNTHETIC:
    description: Execute against a fully synthetic replica of the enterprise environment
    isolation: Full — uses synthetic data, mock connectors, simulated state
    cost: Medium (synthetic environment provisioning)
    use_case: Testing new agent behaviors, training, pre-production validation
    
  SHADOW:
    description: Execute in parallel with live execution; results compared but not used
    isolation: Partial — real data visible; writes to shadow copy only
    cost: High (doubles execution cost)
    use_case: Model upgrade validation, A/B behavior comparison
    
  SCOPED:
    description: Execute against real systems within a defined blast radius boundary
    isolation: Bounded — real reads; writes restricted to scoped resources
    cost: Low overhead (live data access)
    use_case: Routine agent actions with blast-radius containment
    
  REVERSIBLE:
    description: Execute against real systems with full undo capability pre-registered
    isolation: None for reads; writes logged with compensation operations
    cost: Medium (snapshot + compensation registration)
    use_case: Consequential but reversible actions (configuration changes, etc.)
```

---

## Sandbox Lifecycle

```
Request → Classify → Provision → Execute → Validate → Commit/Discard → Record

classify_sandbox(action_descriptor) → sandbox_type:
  1. Is the action against external systems with no undo? → DRY_RUN first
  2. Is this new agent behavior not yet validated? → SYNTHETIC
  3. Is this a model upgrade being evaluated? → SHADOW
  4. Is this a routine action with bounded scope? → SCOPED
  5. Is this a consequential action with registered undo? → REVERSIBLE
  6. Is this IRREVERSIBLE with no mitigation? → BLOCK; require T4 authorization

provision_sandbox(sandbox_type, execution_context) → sandbox_id:
  - Allocate isolation boundary (network namespace, permission scope, synthetic dataset)
  - Register sandbox in sandbox-registry.md
  - Set TTL: DRY_RUN 5min / SYNTHETIC 30min / SHADOW indefinite / SCOPED 15min / REVERSIBLE 60min
  - Return sandbox_id for execution tracking

execute_in_sandbox(sandbox_id, agent_action):
  - Route all system calls through sandbox interceptor
  - Intercept: file writes, API calls, database writes, external communications
  - Allow: reads, computation, local state mutation (within sandbox boundary)
  - Capture: all intercepted operations → side-effect-tracker.md
  - Monitor: resource consumption, time limits, anomalous access patterns

validate_sandbox_results(sandbox_id, results):
  - Check: output quality metrics
  - Check: no unauthorized scope expansion detected
  - Check: blast radius within declared bounds
  - Check: constitutional compliance (12 principles)
  - Check: compensation operations registered for all writes (REVERSIBLE mode)
  - Output: PASS | FAIL | PARTIAL | REQUIRE_HUMAN_REVIEW

commit_or_discard(sandbox_id, validation_result):
  PASS → commit: apply captured side effects to live systems
  FAIL → discard: drop all captured operations; restore pre-sandbox state
  PARTIAL → human review: present diff for human approval before commit
  REQUIRE_HUMAN_REVIEW → escalate: T3 reviews before commit decision
```

---

## Sandbox Environment Schema

```yaml
sandbox_instance:
  sandbox_id: SBOX-{NNN}
  sandbox_type: string
  
  provisioned_at: ISO8601
  expires_at: ISO8601
  
  execution_context:
    agent_id: string
    workflow_id: string | null
    action_descriptor: string
    declared_scope: [string]             # what resources this action is supposed to touch
    
  isolation_config:
    network_access: NONE | MOCK_ONLY | SCOPED_REAL
    filesystem_access: NONE | TEMP_ONLY | SCOPED
    external_api_access: BLOCKED | MOCK | SCOPED_REAL
    state_writes: CAPTURED | SHADOW | LIVE_SCOPED
    
  execution_record:
    started_at: ISO8601 | null
    completed_at: ISO8601 | null
    side_effects_captured: number
    resource_consumption: {tokens: number, wall_time_ms: number}
    
  validation_result: PASS | FAIL | PARTIAL | REQUIRE_HUMAN_REVIEW | null
  commit_decision: COMMITTED | DISCARDED | PENDING | null
  committed_at: ISO8601 | null
  
  status: PROVISIONING | ACTIVE | VALIDATING | COMMITTED | DISCARDED | EXPIRED
```

---

## Sandbox Selection Matrix

| Action Type | Default Sandbox | Override Conditions |
|-------------|----------------|---------------------|
| New workflow first run | SYNTHETIC | T3 can reduce to SCOPED after 3 successful SYNTHETIC runs |
| Agent operating at Level 0–1 | DRY_RUN | T3 can promote to SYNTHETIC |
| Agent operating at Level 2–3 | SCOPED | Behavioral contract defines scope |
| Agent operating at Level 4 | REVERSIBLE | Behavioral contract + compensation library |
| Model upgrade validation | SHADOW | Always — cannot be reduced |
| Constitutional-adjacent action | DRY_RUN | T4 required to promote to any live mode |
| New connector first use | SYNTHETIC | T3 required for live access |
| Production config change | REVERSIBLE | Snapshot required before execution |
| Irreversible external action | BLOCK | T4 explicit authorization to proceed |

---

## Integration Points

```
Feeds into:
  side-effect-tracker.md — captures all intercepted operations
  blast-radius-analyzer.md — pre-execution scope analysis
  pre-execution-simulator.md — simulation before provisioning
  rollback-coordinator.md — compensation if commit fails mid-way
  sandbox-registry.md — lifecycle tracking

Receives from:
  autonomy-level-framework.md — which sandbox level applies per agent autonomy level
  behavioral-contract-system.md — declared scope for SCOPED sandboxes
  compensation-library.md — available undo operations for REVERSIBLE sandboxes
  privilege-containment-engine.md — permission boundaries for SCOPED sandboxes
```

---

## Governance

**Sandbox bypass:** NEVER for constitutional-adjacent actions; T4 for any bypass of DRY_RUN default
**Commit authority:** Automated for PASS + SCOPED/REVERSIBLE; T3 for PARTIAL; T4 for REQUIRE_HUMAN_REVIEW
**Sandbox TTL enforcement:** Expired sandboxes auto-discarded; never committed after expiry
**Audit:** All sandbox lifecycle events to `memory/execution-sandbox/sandbox-log.jsonl` (append-only)
**Resource limits:** Max 10 concurrent sandboxes per agent; max 50 system-wide
