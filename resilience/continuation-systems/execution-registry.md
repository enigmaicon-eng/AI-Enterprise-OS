# Execution Registry

**System ID:** `execution-registry`
**Role:** Single source of truth for all active, suspended, and recently completed workflow executions — the index that enables the continuation engine to find and resume any workflow
**Storage:** `memory/execution-registry.yaml`

---

## Purpose

The Execution Registry is the authoritative catalog of every workflow execution the OS has ever started. At any session start, the continuation engine queries this registry to discover what needs to be resumed, what is blocked, and what has failed. Without this registry, the system must scan all workflow state files — fragile and slow.

---

## Registry Schema

```yaml
execution_registry:
  last_updated: "[ISO-8601]"
  version: "1.0"
  
  active:    # RUNNING or IN_PROGRESS
    - [RegistryEntry]
  
  suspended: # SUSPENDED — needs resumption
    - [RegistryEntry]
  
  blocked:   # BLOCKED — has identified blocker
    - [RegistryEntry]
  
  escalated: # ESCALATED — human input needed
    - [RegistryEntry]
  
  failed:    # FAILED — needs recovery
    - [RegistryEntry]
  
  complete:  # COMPLETE — archived (last 30 days retained)
    - [RegistryEntry]
```

### Registry Entry Schema

```yaml
RegistryEntry:
  # Identity
  workflow_id: "[YYYY-MM-DD]-[workflow-name]-[slug]"
  workflow_type: "feature-development | discovery | architecture-review | sprint-planning | release | incident | multi-stage-investigation | ..."
  workflow_file: "workflows/[name].md"
  
  # Status
  status: "RUNNING | SUSPENDED | BLOCKED | ESCALATED | FAILED | COMPLETE | CANCELLED"
  sub_status: null  # e.g., "GATE_REVIEW" | "AWAITING_HUMAN" | "DEPENDENCY_WAIT"
  priority: "critical | high | normal | low"
  
  # Timing
  started: "[ISO-8601]"
  last_activity: "[ISO-8601]"
  suspended_at: "[ISO-8601]"
  completed_at: "[ISO-8601]"
  due: "[date or null]"
  
  # Current Position
  step_current: "[step-id]"
  step_current_name: "[human readable name]"
  step_total: [N]
  steps_complete: [N]
  pct_complete: [0-100]
  
  # Agents Involved
  owner_agent: "[primary orchestrating agent]"
  current_agent: "[agent handling current step]"
  
  # Checkpointing
  latest_checkpoint:
    id: "[checkpoint-id]"
    type: "phase_boundary | runtime_snapshot | cold_start_marker"
    timestamp: "[ISO-8601]"
    step: "[step-id at time of checkpoint]"
    path: "workflow-checkpoints/snapshots/[filename]"
    integrity: "VALID | STALE | CORRUPT"
  
  # Artifacts
  artifacts_produced:
    - step: "[step-id]"
      name: "[artifact name]"
      path: "[file path]"
      gate_status: "PASSED | FAILED | PENDING"
  
  # Blockers
  blockers:
    - id: "[blocker-id]"
      description: "[what is blocking]"
      owner: "[agent or HUMAN]"
      since: "[timestamp]"
      resolved: false
  
  # Recovery
  recovery_attempts: 0
  last_recovery_attempt: null
  recovery_type: null
  
  # Links
  state_file: "memory/workflow-state/[id].yaml"
  execution_log_entries: [N]
  related_workflows: ["[id]"]
```

---

## Registry Operations

### Register New Workflow
When a workflow starts:
1. Generate workflow_id: `[YYYY-MM-DD]-[workflow-name]-[6char-slug]`
2. Write RegistryEntry with status: RUNNING
3. Create state file at `memory/workflow-state/[id].yaml`
4. Initialize checkpoint at `workflow-checkpoints/snapshots/`

### Update Step Progress
After each step transition:
1. Update `step_current`, `step_current_name`, `steps_complete`, `pct_complete`
2. Update `last_activity` timestamp
3. Add to `artifacts_produced` list
4. Update `latest_checkpoint`

### Suspend Workflow
When session ends with workflow in progress:
1. Set status: SUSPENDED
2. Set `suspended_at` timestamp
3. Write final runtime snapshot (if mid-step)
4. Update `latest_checkpoint`

### Resume Workflow
When continuation engine picks up suspended workflow:
1. Set status: RUNNING
2. Clear `suspended_at`
3. Update `last_activity`
4. Load `latest_checkpoint`

### Mark Complete
When final step passes gate:
1. Set status: COMPLETE
2. Set `completed_at`
3. Calculate total duration
4. Move to `complete` section of registry (after 30 days: archive)

---

## Registry Query Interface

The continuation engine uses these queries at session start:

### Query 01: What Needs Resumption?
```
SELECT * FROM registry
WHERE status IN ('SUSPENDED', 'BLOCKED')
ORDER BY priority DESC, suspended_at ASC
```

Response: Ordered list of workflows to resume, highest priority first.

### Query 02: What Has Failed?
```
SELECT * FROM registry
WHERE status = 'FAILED'
AND recovery_attempts < 3
ORDER BY priority DESC
```

Response: Failed workflows eligible for recovery.

### Query 03: What Needs Human Input?
```
SELECT * FROM registry
WHERE status = 'ESCALATED'
OR sub_status = 'AWAITING_HUMAN'
```

Response: Surface to operator immediately.

### Query 04: What Is Overdue?
```
SELECT * FROM registry
WHERE due < TODAY
AND status NOT IN ('COMPLETE', 'CANCELLED', 'FAILED')
```

Response: At-risk workflows requiring priority attention.

### Query 05: Workflow by ID
```
SELECT * FROM registry WHERE workflow_id = '[id]'
```

Response: Single workflow entry for targeted resumption.

---

## Registry Integrity

The registry is the single source of truth — it must be correct.

**Integrity checks (run on every session start):**

1. **Status-Artifact Consistency**
   For every step marked COMPLETE: artifact must exist at stated path.
   If artifact missing: downgrade step to IN_PROGRESS, update status.

2. **Checkpoint Currency**
   For every SUSPENDED workflow: checkpoint timestamp must be from this session.
   If checkpoint is from a prior session: mark as COLD_START_NEEDED.

3. **Stale Active Detection**
   Any workflow with status RUNNING and `last_activity` > 15 minutes ago:
   This session is the only active session — was this workflow abandoned?
   If yes: transition to SUSPENDED.

4. **Duplicate Detection**
   Multiple entries for same workflow_id: merge, keep most recent status.

**After integrity check:**
Write `registry_integrity_report` to execution ledger.

---

## Storage Location

**Primary:** `memory/execution-registry.yaml`
**Backup:** `memory/execution-registry-backup.yaml` (written before every update)
**Archive:** `memory/execution-registry-archive/[YYYY-MM].yaml` (monthly archive)

The backup is written atomically before every update — ensures no corruption from partial writes.

---

## Integration

**Written to by:**
- `continuation-systems/continuation-engine.md` → status updates
- `orchestrator/execution-engine.md` → new workflow registration
- `continuation-systems/workflow-continuator.md` → resumption events
- `recovery-systems/recovery-orchestrator.md` → recovery status

**Read by:**
- `continuation-systems/continuation-engine.md` → at session start
- `runtime-recovery/recovery-orchestrator.md` → recovery planning
- `continuation-systems/organizational-continuity.md` → active work inventory
- `orchestrator/master-orchestrator.md` → routing decisions
