# Digital Twin Operations

**Status:** Active  
**Last Updated:** 2026-05-14  
**Owner:** AI-Native Org

Operational reference for the digital twin system — how to monitor twin health, trigger manual actions, diagnose problems, and maintain the system.

---

## Normal Operating Behavior

In healthy operation:

- All four twins are STABLE (last sync < their freshness target)
- Engine cycle runs every 4 hours without error
- Prediction report generated after each cycle
- No IMMEDIATE alerts active
- Prediction calibration ≥ 80% for all classes

Check system health at any time by reading `memory/digital-twins/engine-state.yaml`.

---

## Twin Health States

| State | Meaning | Action |
|-------|---------|--------|
| `STABLE` | Synchronized within freshness target | None |
| `SYNCING` | Currently mid-sync | Wait; do not read until stable |
| `STALE` | Last sync exceeded freshness target | Trigger manual sync |
| `DEGRADED` | Drift > 20% detected, or sync failed | Investigate root cause; resync |
| `UNINITIALIZED` | Never synced | Run initial sync |

**Freshness targets:**
- runtime-twin: 5 minutes
- workflow-twin: 10 minutes
- org-twin: 15 minutes
- delivery-twin: 30 minutes

---

## Manual Operations

### Force a Twin Sync

When a twin is STALE or you know a significant event just occurred:

```
Action: Manual twin sync
Target: [twin-id]  # org-twin | workflow-twin | delivery-twin | runtime-twin
Reason: [why you're forcing it]

Route to: digital-twins/twin-sync.md → trigger delta sync for [twin-id]
```

The twin-sync system will:
1. Read all events from the execution ledger since the last sync
2. Apply delta updates to the twin state
3. Recompute derived metrics
4. Mark the twin STABLE with a fresh timestamp

For a full resync (if you suspect drift): trigger the scheduled batch sync, which does a complete recomputation from ground truth.

### Trigger a Manual Prediction Run

The engine runs automatically every 4 hours, but you can trigger it outside the cycle:

```
Action: Manual prediction run
Reason: [why you need a fresh report]

Route to: digital-twins/twin-engine.md → run prediction cycle
```

Useful after a significant event (major incident resolved, key hire made) that you want reflected immediately rather than waiting for the next cycle.

### Force Emergency Resync (All Twins)

If you suspect systemic drift across multiple twins:

```
Action: Emergency resync — all twins
Reason: [suspected data integrity issue]

Route to: digital-twins/twin-sync.md → emergency_resync protocol
```

The emergency resync:
1. Marks all twins RESYNCING (prevents reads during resync)
2. Rebuilds each twin from scratch in parallel
3. Runs cross-twin consistency check on completion
4. Marks all twins STABLE if consistent, DEGRADED if not

---

## Monitoring Twin Health

### Key Signals to Watch

**Twin sync lag:**  
If any twin's sync lag consistently exceeds its freshness target, the twin-sync event pipeline may have a backlog or the execution ledger write rate is too high.

**Drift rate:**  
If drift corrections are frequent (> 2 per day for any twin), the event-driven sync is missing events. Investigate whether the execution ledger is capturing all relevant events.

**Simulation failure rate:**  
If simulations are failing (check `simulation-index.yaml`), investigate whether the frozen snapshot creation is encountering stale twins.

**Prediction calibration drop:**  
A sudden drop in calibration for a specific class indicates the underlying model's assumptions are no longer valid for current conditions. Check whether a structural change occurred (reorg, major policy change, new release cadence) that the model doesn't account for.

### Dashboard View

For a quick snapshot, read `memory/digital-twins/engine-state.yaml`:

```yaml
engine_status: RUNNING
last_cycle: 2026-05-14T10:00:00Z
next_cycle: 2026-05-14T14:00:00Z

twin_registry:
  org-twin: { status: STABLE, sync_lag_minutes: 4, health: GOOD }
  workflow-twin: { status: STABLE, sync_lag_minutes: 3, health: GOOD }
  delivery-twin: { status: STABLE, sync_lag_minutes: 12, health: GOOD }
  runtime-twin: { status: STABLE, sync_lag_minutes: 1, health: GOOD }
```

---

## Diagnosing Common Problems

### Twin Showing STALE

**Symptom:** Twin status is STALE; predictions may be DEGRADED confidence.

**Diagnostic steps:**
1. Check the execution ledger — is it receiving new events?
2. Check twin-sync — is the event pipeline running?
3. Check the twin's primary source — is the source system (execution-registry, work-queue, etc.) being updated?

**Resolution:**
- If source system is healthy: trigger manual sync
- If source system is stale: the root issue is upstream — investigate why the source isn't being updated

### Predictions Showing DEGRADED Confidence

**Symptom:** Prediction reports show `confidence: DEGRADED` for multiple classes.

**Causes:**
- One or more required twins are STALE or DEGRADED
- Insufficient history for trend computation (< 7 days of data)
- High volatility in the metric making trends unreliable

**Resolution:**
- If twin stale: trigger sync, re-run predictions
- If insufficient history: confidence will naturally improve as the system accumulates data
- If high volatility: this is informational — the system genuinely cannot predict reliably; widen decision margins

### Prediction Calibration Below 60%

**Symptom:** `prediction-accuracy.yaml` shows calibration_rate < 0.60 for a class.

**Meaning:** The model's p10-p90 ranges are systematically too narrow (overconfident) or the p50 is systematically biased.

**Resolution:**
1. Identify whether the error is consistent (always over-forecasting, or always under-forecasting)
2. Check whether a structural change occurred that shifted the baseline
3. Route to governance-simulator or the relevant forecaster for recalibration
4. Flag the class as under recalibration in `prediction-accuracy.yaml`

### Simulation Engine Returning No Findings

**Symptom:** Simulation completes but `findings` list is empty.

**Causes:**
- The perturbation is within normal operating bounds (no threshold breach projected)
- The scenario is too mild to produce measurable impact

**What it means:** Null findings are meaningful. "We simulated a hiring freeze and found no significant impact" is a valid and useful result — it means current capacity has sufficient headroom. Document the null finding; don't re-run with larger perturbations just to generate findings.

### Recovery Cascade Warning

**Symptom:** `runtime-twin.recovery_overhead.recovery_overhead_fraction > 0.20`; runtime saturation alert firing.

**Meaning:** Failures are generating recovery overhead faster than productive work can compensate. The system is in a feedback loop.

**Caution:** Do not try to resolve this by parallelizing more work. More parallelism increases session count, which increases context pressure, which increases failures — amplifying the cascade. Instead:

1. Identify the primary failure class (check runtime-twin `recovery_overhead.by_type`)
2. Reduce the *cause* of failures (not the recovery)
3. Reduce concurrency temporarily to let the recovery queue drain
4. Once failure rate drops below baseline, gradually restore concurrency

---

## Maintaining the Scenario Library

When the organization changes significantly (new release cadence, major team restructure, new governance policies), update the scenario library:

1. Review predefined scenarios in `enterprise-modeling/scenario-model.md`
2. Add new scenarios that reflect the new operating model
3. Archive scenarios that are no longer relevant (mark `status: archived`)
4. Re-run key scenarios against updated twin state to establish new baselines

---

## Twin Data Retention

| Data Type | Retention |
|-----------|----------|
| Twin state files | Current state only (overwritten each sync) |
| Simulation results | 90 days |
| Forecast results | 90 days |
| Prediction files | 90 days |
| Prediction accuracy | Permanent |
| Simulation index | Permanent |

Historical twin states are not retained — if you need a point-in-time twin snapshot, take a checkpoint before a major event (e.g., before a large reorg or release) by saving a copy of the twin-state files manually.

---

## Adding a New Twin

If a new enterprise system needs to be modeled as a twin:

1. Create `digital-twins/[name]-twin.md` following the existing twin schema
2. Define the state schema, sync sources, and sync frequency
3. Create the data model in `enterprise-modeling/`
4. Register in `digital-twins/twin-registry.md`
5. Add sync routing in `digital-twins/twin-sync.md` (event types → this twin)
6. Create `memory/digital-twins/twin-state/[name]-twin-state.yaml`
7. Update `memory/digital-twins/engine-state.yaml` to include the new twin

---

*Back to: [`systems/digital-twin-system.md`](digital-twin-system.md)*
