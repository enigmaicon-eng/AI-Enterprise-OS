# Orchestrator High Availability
**ID:** ORCH-HA-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Runtime Org + Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Eliminates the master orchestrator as a single point of failure. Implements active-passive high availability using the existing distributed coordinator infrastructure. Guarantees 45-second failover with ≤ 90-second RPO.

---

## Architecture

```
PRIMARY ORCHESTRATOR (active)
  ├── Handles all routing, dispatch, supervision
  ├── Publishes heartbeat every 10 seconds to HA-COORD topic
  ├── Streams state delta to secondary every 30 seconds
  └── Holds leader lease (renewed every 30 seconds)

SECONDARY ORCHESTRATOR (passive)
  ├── Monitors HA-COORD heartbeat topic
  ├── Receives state delta stream (30-second lag max)
  ├── Participates in leader election but defers to primary
  └── Ready to promote in < 45 seconds

DISTRIBUTED COORDINATOR (arbiter)
  ├── Manages leader lease
  ├── Detects primary failure (3 missed heartbeats = 30 seconds)
  └── Triggers leader election protocol
```

---

## State Replication Protocol

The secondary maintains a shadow state updated every 30 seconds:

```yaml
replicated_state:
  active_workflow_ids: [list]           # all in-flight workflow IDs
  workflow_step_positions: {id: step}   # current step per workflow
  agent_assignments: {workflow: agent}  # current agent per task
  pending_escalations: [escalation_ids] # open escalations
  routing_cache: {}                     # recent routing decisions (TTL 5 min)
  
NOT replicated (rebuilt on failover):
  - Full workflow context (loaded from checkpoint on demand)
  - Agent health scores (re-fetched from agent-health-monitor)
  - Event bus consumer state (loaded from consumer-offsets.yaml)
```

Replication is incremental: only changed fields are transmitted. Full state sync on secondary startup.

---

## Failover Protocol

### Detection (0–30 seconds)
```
Distributed coordinator monitors heartbeat topic:
  Heartbeat interval: 10 seconds
  Missed heartbeat threshold: 3 consecutive = SUSPECTED_FAILURE
  
At SUSPECTED_FAILURE:
  1. Coordinator initiates leader election
  2. Secondary receives PREPARE_FOR_LEADERSHIP signal
  3. Secondary locks incoming requests (queue, do not process)
```

### Election (30–40 seconds)
```
Leader election via Raft-compatible protocol (distributed-coordinator.md):
  1. Secondary requests vote from coordinator
  2. Coordinator grants lease to secondary (no other candidates)
  3. Secondary becomes LEADER_ELECT
  
Fencing: Primary's lease expires; any surviving primary requests are rejected
```

### Promotion (40–45 seconds)
```
Secondary promotion sequence:
  1. Load replicated_state (already current within 30 seconds)
  2. Query checkpoint-registry for any workflows ahead of replicated state
  3. Resume in-flight workflows from their last checkpoint
  4. Unlock request queue and begin processing
  5. Publish ORCHESTRATOR_FAILOVER event to enterprise.orchestration.events
  6. Alert T4+ immediately
```

**Total failover time: < 45 seconds from primary loss to secondary operational.**

---

## Health Monitoring

```yaml
ha_state:
  primary_id: orchestrator-primary-001
  secondary_id: orchestrator-secondary-001
  
  primary_status: ACTIVE | DEGRADED | FAILED
  secondary_status: STANDBY | PROMOTING | ACTIVE
  
  last_heartbeat: ISO8601
  last_state_replication: ISO8601
  replication_lag_seconds: number       # alert if > 60
  
  leader_lease_expires: ISO8601
  failover_count_30d: number            # alert if > 2
  last_failover: ISO8601 | null
```

HA state published to `enterprise.orchestration.ha` event bus topic every 30 seconds. Alerts:
- Replication lag > 60 seconds → T3 alert
- Primary DEGRADED → T3 alert + secondary readiness check
- Primary FAILED → T4 immediate + failover initiated
- Failover count > 2 in 30 days → T4 root cause investigation required

---

## Secondary Readiness Protocol

Secondary must be in READY state at all times. Readiness checks (every 5 minutes):
1. Can load full agent registry (< 5 seconds)
2. Can connect to event bus consumer offsets
3. Can access checkpoint registry
4. Has replicated state within 60 seconds

If secondary fails readiness check: T3 alert within 5 minutes. 30-minute SLA to restore readiness before DR posture escalates.

---

## Bootstrap Sequence

On OS startup:
```
1. Start distributed coordinator first
2. Primary orchestrator starts → requests leader lease → granted
3. Primary enters ACTIVE state
4. Secondary starts → joins HA cluster → enters STANDBY state
5. Primary begins state replication stream to secondary
6. HA state published: both nodes healthy
```

If primary fails during bootstrap before secondary is ready: cold start from checkpoints.

---

## Governance

**Failover authorization:** Automatic (no human required for technical failover)
**Post-failover review:** T4 review within 2 hours of any failover
**Scheduled maintenance:** Primary/secondary roles can be manually swapped for maintenance (T3 authorization, 15-min window)
