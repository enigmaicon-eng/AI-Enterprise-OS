# Sandbox Registry
**ID:** SBOX-REG-001 | **Tier:** T2 | **Class:** STANDARD
**Owner:** Engineering Org | **Updated:** 2026-05-16

---

## Purpose

Central registry for all active, completed, and expired sandbox instances across the Enterprise AI OS. The sandbox registry is the authoritative source of truth for sandbox lifecycle state, resource accounting, and audit traceability. Every sandbox provisioned by the sandbox engine must register here before execution begins and must record its final disposition before resources are released.

---

## Registry Schema

```yaml
sandbox_registry_entry:
  # Identity
  sandbox_id: SBOX-{NNN}                  # globally unique, monotonically increasing
  iee_id: IEE-{NNN}                       # linked isolated execution environment
  sandbox_type: DRY_RUN | SYNTHETIC | SHADOW | SCOPED | REVERSIBLE
  
  # Ownership
  agent_id: string
  workflow_id: string | null
  session_id: string                       # execution session
  requested_by: string                     # agent or human who triggered
  
  # Purpose
  action_descriptor: string               # human-readable summary of what this sandbox runs
  declared_scope: [string]                # resources this execution is supposed to touch
  
  # Lifecycle timestamps
  registered_at: ISO8601
  provisioned_at: ISO8601 | null
  started_at: ISO8601 | null
  completed_at: ISO8601 | null
  committed_at: ISO8601 | null
  discarded_at: ISO8601 | null
  expires_at: ISO8601                      # hard TTL (DRY_RUN 5m / SYNTHETIC 30m / SCOPED 15m / REVERSIBLE 60m)
  
  # Execution record
  execution_record:
    side_effects_captured: number
    resource_consumption:
      tokens: number
      wall_time_ms: number
      api_calls: number
      db_ops: number
    errors_encountered: [string]
    
  # Outcomes
  validation_result: PASS | FAIL | PARTIAL | REQUIRE_HUMAN_REVIEW | null
  commit_decision: COMMITTED | DISCARDED | PENDING | null
  rollback_triggered: boolean
  rollback_id: string | null
  
  # Status
  status: REGISTERED | PROVISIONING | ACTIVE | VALIDATING | COMMITTED | DISCARDED | EXPIRED | ERROR
  
  # Links
  compensation_ids: [string]              # REVERSIBLE sandboxes only
  snapshot_ids: [string]                  # pre-action snapshots
  dry_run_result_id: string | null        # DRY_RUN result reference
  audit_entries: [string]                 # linked audit trail entries
```

---

## Registry Operations

```
register_sandbox(sandbox_config) → sandbox_id:
  1. Assign next SBOX-{NNN} (atomic increment, no gaps)
  2. Validate agent_id exists in agent-registry
  3. Validate workflow_id if provided
  4. Check resource limits:
       agent concurrent count: must be < 10
       system concurrent count: must be < 50
     If either limit reached: REJECT with CAPACITY_EXCEEDED
  5. Write registry entry with status=REGISTERED
  6. Return sandbox_id
  
update_sandbox_status(sandbox_id, new_status, metadata):
  1. Load current entry
  2. Validate state transition is legal (see state machine below)
  3. Apply metadata updates (timestamps, execution_record fields)
  4. Write updated entry
  5. Append to `memory/execution-sandbox/sandbox-log.jsonl`
  
expire_sandbox(sandbox_id):
  1. Check expires_at < now()
  2. If status not in [COMMITTED, DISCARDED]:
     trigger discard: wipe side-effect buffer, wipe ephemeral fs
     set status=EXPIRED
     log SANDBOX_AUTO_EXPIRED
  3. Do NOT commit any pending operations (expired = discarded)
  
query_registry(filters) → [sandbox_registry_entry]:
  filters: agent_id | status | sandbox_type | date_range | workflow_id
  returns: list of matching entries, sorted by registered_at DESC
```

---

## State Machine

```
REGISTERED
    │
    ▼
PROVISIONING ──(failure)──► ERROR
    │
    ▼
ACTIVE ──(timeout/TTL)──► EXPIRED
    │
    ▼
VALIDATING
    │
    ├──(PASS)──────────────────► COMMITTED
    ├──(FAIL)──────────────────► DISCARDED
    ├──(PARTIAL)───────────────► VALIDATING (pending human review → COMMITTED or DISCARDED)
    └──(REQUIRE_HUMAN_REVIEW)──► VALIDATING (T3 escalation → COMMITTED or DISCARDED)

Legal transitions:
  REGISTERED → PROVISIONING
  PROVISIONING → ACTIVE | ERROR
  ACTIVE → VALIDATING | EXPIRED | ERROR
  VALIDATING → COMMITTED | DISCARDED | VALIDATING (human review loop)
  COMMITTED → terminal
  DISCARDED → terminal
  EXPIRED → terminal
  ERROR → terminal (investigation required before retry)
```

---

## Resource Accounting

```yaml
resource_accounting:
  per_agent_limits:
    max_concurrent_sandboxes: 10
    max_sandboxes_per_hour: 100
    max_tokens_per_hour: 5000000
    
  system_wide_limits:
    max_concurrent_sandboxes: 50
    max_sandboxes_per_hour: 1000
    
  enforcement:
    check_at: register_sandbox() — before provisioning
    over_limit: REJECT with CAPACITY_EXCEEDED; log alert
    alert_at: 80% of any limit
    
  accounting_reset: rolling 1-hour windows (not calendar hours)
```

---

## TTL Enforcement

```
ttl_enforcer (runs every 60 seconds):
  for each sandbox where status == ACTIVE:
    if now() >= expires_at:
      log TTL_EXPIRY_TRIGGERED
      expire_sandbox(sandbox_id)
      
  for each sandbox where status == REGISTERED | PROVISIONING:
    if now() >= expires_at + 5min:   # grace period for slow provisioning
      log STUCK_PROVISIONING_ALERT → T3 immediate
      mark status=ERROR
```

---

## Sandbox Log Format

All state transitions appended to `memory/execution-sandbox/sandbox-log.jsonl`:

```json
{
  "event_id": "SBOX-EVT-{NNN}",
  "sandbox_id": "SBOX-{NNN}",
  "event_type": "REGISTERED|PROVISIONED|STARTED|COMPLETED|COMMITTED|DISCARDED|EXPIRED|ERROR",
  "agent_id": "string",
  "workflow_id": "string|null",
  "sandbox_type": "string",
  "metadata": {},
  "timestamp": "ISO8601",
  "session_id": "string"
}
```

---

## Dashboard View

```
SANDBOX REGISTRY — Live Status
──────────────────────────────────────────────────────
System Capacity:    {active}/{max_system} sandboxes in use
  DRY_RUN:          {count} active
  SYNTHETIC:        {count} active
  SHADOW:           {count} active
  SCOPED:           {count} active
  REVERSIBLE:       {count} active

Per-Agent Hotspots: {agents over 50% of their limit}

Recent Completions (last 1 hour):
  COMMITTED:  {count}
  DISCARDED:  {count}
  EXPIRED:    {count}
  ERROR:      {count}  ← alert if > 0

Pending Human Review: {count}  ← T3 action required
──────────────────────────────────────────────────────
```

---

## Integration

```
Feeds into:
  sandbox-engine.md — registry is the state store for all sandbox lifecycle
  blast-radius-analyzer.md — queries registry for active scope analysis
  governance dashboards — live capacity and status

Receives from:
  sandbox-engine.md — all registration and update calls
  ttl-enforcer — expiry events
  rollback-coordinator.md — rollback_id linkage on REVERSIBLE sandboxes
```

---

## Governance

**Immutability:** Committed and Discarded entries never modified; only status field can advance  
**Append-only log:** `sandbox-log.jsonl` is strictly append-only; tampering = CRITICAL security event  
**Retention:** Registry entries 1 year; sandbox-log.jsonl permanent  
**Concurrent limit bypass:** No override; T4 cannot bypass system-wide concurrent limit (architectural safety)
