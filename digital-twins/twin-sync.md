# Twin Sync

**System ID:** `twin-sync`
**Role:** Defines and executes the synchronization protocol for all digital twins — how twins stay current with reality, how conflicts are resolved, and how drift is detected and corrected
**Storage:** `memory/digital-twins/sync-log.jsonl`

---

## Purpose

A digital twin that is not synchronized with reality is a hallucination. Twin sync ensures all four twins (org, workflow, delivery, runtime) reflect the actual current state of the enterprise at all times within their respective staleness thresholds.

Sync is not trivial: source data may be incomplete, events may arrive out-of-order, and multiple data sources may disagree. This document defines how to handle each case.

---

## Sync Architecture

Two sync modes operate concurrently:

### Mode 01: Event-Driven Delta Sync (Real-Time)

Triggered by each new event in the execution-ledger.jsonl:

```
NEW LEDGER EVENT ARRIVES:
  → Parse event_type
  → Determine which twins are affected (routing table below)
  → Apply delta update to each affected twin
  → Update last_synced timestamp
  → Write sync_event to sync-log.jsonl
```

**Event → Twin Routing Table:**

| Ledger Event Type | Affected Twins |
|-------------------|----------------|
| `workflow_started` | org-twin, workflow-twin, delivery-twin |
| `step_started` | workflow-twin, runtime-twin |
| `step_completed` | org-twin, workflow-twin, delivery-twin |
| `gate_pass` | workflow-twin, delivery-twin |
| `gate_fail` | workflow-twin |
| `workflow_suspended` | workflow-twin, org-twin |
| `workflow_resumed` | workflow-twin, org-twin, runtime-twin |
| `workflow_completed` | all twins |
| `workflow_failed` | all twins |
| `escalation_opened` | org-twin |
| `escalation_resolved` | org-twin |
| `rollback_executed` | workflow-twin, delivery-twin, runtime-twin |
| `cold_start_initiated` | runtime-twin |
| `checkpoint_written` | runtime-twin |
| `decision_logged` | org-twin |
| `handoff_recovered` | runtime-twin |

### Mode 02: Scheduled Full Sync (Batch)

Scheduled per twin at their sync frequency:

```
SCHEDULED SYNC FOR twin [id]:
  1. Read all source-of-truth files for this twin
  2. Compute current ground truth state
  3. Diff against existing twin state
  4. Apply all diffs (not just deltas)
  5. Recompute all derived metrics
  6. Run drift detection (see below)
  7. Update last_synced timestamp
  8. Write batch_sync event to sync-log.jsonl
```

**Sync Schedule:**

| Twin | Sync Frequency | Staleness Threshold |
|------|---------------|---------------------|
| org-twin | 15 minutes | 20 minutes |
| workflow-twin | 5 minutes | 10 minutes |
| delivery-twin | 30 minutes | 45 minutes |
| runtime-twin | 5 minutes | 10 minutes |

---

## Delta Update Protocol

When applying a delta update (event-driven):

### STEP 01: Parse Event

```
READ event: {event_type, workflow_id, step_id, timestamp, ...}

VALIDATE:
  - timestamp is not more than 30 minutes old (discard stale events)
  - event is not a duplicate (check sync-log for same event in last 5 min)
  - all referenced IDs (workflow_id, step_id) are valid
```

### STEP 02: Load Twin State

```
READ: memory/digital-twins/twin-state/[twin-id].yaml
LOCK: Prevent concurrent writes during update
```

### STEP 03: Compute Delta

```
Based on event_type, compute the specific changes needed:

EXAMPLE: step_completed event →
  affected twin: workflow-twin
  changes:
    - workflow_twin.portfolio.by_type.[type].active -= 1  (if this was last step)
    - workflow_twin.step_performance.total_steps_completed += 1
    - workflow_twin.step_performance.avg_step_duration_minutes = rolling_avg(
        current_avg, step_duration_seconds/60, window=1000
      )
    
  IF this was a gate_pass:
    - workflow_twin.gate_performance.overall_pass_rate = rolling_avg(...)
    - workflow_twin.gate_performance.by_gate_type.[type].pass_rate = rolling_avg(...)

  RECOMPUTE derived metrics affected by changes
```

### STEP 04: Write Updated State

```
WRITE: updated twin state to memory/digital-twins/twin-state/[twin-id].yaml
UNLOCK: Release write lock

LOG to sync-log.jsonl:
{
  "sync_type": "delta",
  "twin_id": "[id]",
  "triggered_by_event": "[event_type]",
  "timestamp": "[ISO-8601]",
  "fields_updated": ["[field1]", "[field2]"],
  "drift_detected": false
}
```

---

## Drift Detection

Drift = divergence between twin state and ground truth. Run during every full sync:

```
FOR EACH key metric in the twin:
  COMPUTE: expected_value from ground truth sources
  COMPARE: with current twin_value
  
  drift_pct = ABS(expected_value - twin_value) / expected_value
  
  IF drift_pct > 0.05 (5% threshold):
    LOG: drift_detected event
    APPLY: correction (set twin_value = expected_value)
    RECORD: in sync-log as drift_corrected
  
  IF drift_pct > 0.20 (20% threshold):
    ESCALATE: "Significant twin drift detected in [metric] — possible data source issue"
    FLAG: twin as "DEGRADED" until full resync confirms correction
```

### Common Drift Sources

| Cause | Detection | Resolution |
|-------|-----------|-----------|
| Event missed (delta sync gap) | Metric off by discrete amount | Full sync corrects |
| Out-of-order events | Metric shows impossible transition | Replay events in timestamp order |
| Source file write collision | Metric NaN or impossible value | Read previous version, re-apply |
| Long gap (no events in 1 hour for active workflows) | No delta updates but workflows should be active | Trigger emergency full sync |

---

## Conflict Resolution

When two data sources disagree about the same metric:

```
PRIORITY ORDER (highest to lowest):
  1. execution-ledger.jsonl (append-only — never wrong, highest authority)
  2. execution-store/*.jsonl (derived but immutable once written)
  3. execution-registry.yaml (can be overwritten — medium authority)
  4. workflow-state/*.yaml (can be overwritten — lower authority)

PROTOCOL:
  IF source A and source B disagree:
    USE: highest-priority source that has a record for this event
    LOG: discrepancy in sync-log.jsonl
    
  IF ledger contradicts registry:
    → Always trust ledger
    → Update registry to match ledger during sync
    → Flag: "Registry drift corrected from ledger"
```

---

## Staleness Handling

When a twin exceeds its staleness threshold:

```
IF current_time - twin.last_synced > staleness_threshold:
  1. Set twin.status = "STALE"
  2. Log: twin_stale event
  3. Trigger immediate full sync (high priority)
  4. Block simulation requests for this twin until sync completes
     (Return: "Twin [id] is stale — simulation not available. Syncing now.")
  5. After sync: set twin.status = "STABLE"
  6. Allow simulation requests to proceed
```

---

## Sync Log Format

`memory/digital-twins/sync-log.jsonl`:

```json
{
  "event_type": "delta_sync | batch_sync | drift_corrected | twin_stale | emergency_sync",
  "twin_id": "[twin-id]",
  "timestamp": "[ISO-8601]",
  "triggered_by": "[ledger_event | schedule | staleness | manual]",
  "duration_ms": 0,
  "fields_updated": 0,
  "drift_detected": false,
  "drift_corrections": 0,
  "anomalies_flagged": 0
}
```

---

## Emergency Resync

When data integrity is suspect (e.g., store file partially written):

```
EMERGENCY RESYNC PROTOCOL:
  1. Mark ALL twins as "RESYNCING"
  2. Stop accepting simulation requests
  3. For each twin, in parallel:
     a. Read all source files from scratch
     b. Rebuild twin state from first principles
     c. Validate derived metrics
     d. Write new state file
  4. Run cross-twin consistency check (see below)
  5. Mark all twins as "STABLE"
  6. Resume simulation requests
  
Estimated duration: 2-5 minutes for full emergency resync
```

### Cross-Twin Consistency Check

After any full resync, verify twins agree with each other:

```
CHECKS:
  - org-twin.active_workflows == workflow-twin.portfolio.total_active
  - workflow-twin.portfolio.by_type matches delivery-twin.sprint_state (for sprint workflows)
  - runtime-twin.active_sessions_now matches execution-registry active workflow count
  
IF inconsistency found:
  → Use execution-ledger as ground truth
  → Rebuild the inconsistent twin's state from ledger
  → Log: cross_twin_inconsistency_corrected
```

---

## Integration

**Reads from (all source files):**
- `memory/execution-ledger.jsonl`
- `memory/execution-store/*.jsonl`
- `memory/execution-registry.yaml`
- `memory/work-queue.yaml`
- `sprints/` directory
- `agents/*-org.md`

**Writes to:**
- `memory/digital-twins/twin-state/[twin-id].yaml`
- `memory/digital-twins/sync-log.jsonl`

**Called by:**
- `digital-twins/twin-engine.md` (schedules sync, routes events)

**Calls:**
- Each twin's update methods directly (not via separate agent invocations)
