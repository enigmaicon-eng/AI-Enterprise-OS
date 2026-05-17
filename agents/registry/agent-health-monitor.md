# Agent Health Monitor

## Purpose
Continuously tracks the operational health and availability of all registered agents. The health monitor is the real-time nervous system of the agent registry — it keeps availability states current, detects degraded or unresponsive agents, triggers recovery protocols, and ensures that orchestration decisions are always based on accurate agent availability data.

---

## Health Monitoring Architecture

```
Health Monitor
├── [Heartbeat Collection]      → agents actively report their state
├── [Active Health Probing]     → monitor actively pings agents
├── [Passive Signal Analysis]   → infer health from task outcomes and error signals
├── [State Machine Engine]      → manages AVAILABLE/BUSY/OVERLOADED/OFFLINE transitions
├── [Recovery Detection]        → detects when offline agents come back
└── [Health Alerting]           → notifies relevant parties of health changes

        ↓ feeds into

[Availability Index]            → real-time availability state for discovery engine
[Health Dashboard]              → operator visibility into fleet health
[Roster Management]             → triggers record updates and forced deregistration
```

---

## Heartbeat Protocol

```yaml
heartbeat_protocol:
  agent_responsibilities:
    frequency: every 30 seconds
    endpoint: POST /registry/heartbeat
    payload:
      agent_id: string
      timestamp: ISO-8601
      status: AVAILABLE | BUSY | OVERLOADED | MAINTENANCE
      current_task_count: int
      load_factor: float
      version: string
      health_indicators:
        memory_pressure: LOW | MEDIUM | HIGH
        error_rate_5m: float
        avg_task_duration_5m: seconds | null
  
  monitor_processing:
    on_receipt: update availability_index immediately
    latency: registry update within 2 seconds of heartbeat receipt
    
    state_derivation:
      AVAILABLE: status=AVAILABLE AND load_factor < 0.70
      BUSY: status=BUSY OR (AVAILABLE AND load_factor 0.70–0.90)
      OVERLOADED: load_factor > 0.90 (regardless of self-reported status)
      auto_correction: if agent reports AVAILABLE but load_factor > 0.90, override to OVERLOADED
  
  missed_heartbeat_handling:
    after_1_missed (30s): mark as HEARTBEAT_DELAYED; no state change
    after_2_missed (60s): issue active health probe
    after_3_missed (90s): mark as OFFLINE; alert orchestrators
    after_5_missed (150s): escalate to operator; begin recovery protocol
```

---

## Active Health Probing

```yaml
active_health_probing:
  probe_types:
    LIVENESS_PROBE:
      description: Is the agent reachable?
      method: HTTP GET {endpoint}/health
      timeout: 5 seconds
      expected_response: 200 OK with status payload
      frequency: on demand (triggered by missed heartbeats or operator)
    
    READINESS_PROBE:
      description: Is the agent ready to accept tasks?
      method: HTTP GET {endpoint}/ready
      timeout: 10 seconds
      expected_response: {ready: boolean, reason: string | null}
      frequency: after OFFLINE recovery (before returning to AVAILABLE)
    
    CAPABILITY_SPOT_CHECK:
      description: Can the agent execute its claimed capabilities?
      method: POST {endpoint}/spot-check with minimal test task
      timeout: 30 seconds
      expected_response: correct output with confidence score
      frequency: weekly for T3+ agents; monthly for T1-T2
      trigger: also triggered after version upgrades
  
  probe_scheduling:
    routine: liveness probe every 5 minutes for all AVAILABLE agents
    degraded_watch: liveness probe every 60 seconds for YELLOW health agents
    recovery_watch: liveness probe every 15 seconds for recently-OFFLINE agents
```

---

## Passive Signal Analysis

```yaml
passive_signal_analysis:
  signals:
    TASK_TIMEOUT:
      source: execution-runtime (agent failed to complete task in SLA)
      weight: MEDIUM health concern
      action: increment health.timeout_count; if > 3 in 1h → YELLOW health
    
    TASK_ERROR:
      source: execution-runtime (agent returned error response)
      weight: varies by error_type
      error_types:
        TRANSIENT (retry_success): LOW concern
        PERSISTENT (repeated failures): HIGH concern
        SAFETY_VIOLATION: CRITICAL → immediate SUSPENDED state trigger
    
    ESCALATION_SPIKE:
      source: governance queues (agent escalating at > 3× baseline rate)
      weight: MEDIUM concern (may indicate overload or capability gap)
      action: flag for supervisor review; potential OVERLOADED state
    
    CONFIDENCE_COLLAPSE:
      source: confidence-threshold-system (agent confidence dropping dramatically)
      weight: HIGH concern (agent may be in degraded reasoning state)
      action: trigger CAPABILITY_SPOT_CHECK; notify supervisor
    
    CALIBRATION_BREACH:
      source: agent-confidence-calibration.md
      weight: HIGH concern for GOVERNANCE agents
      action: update performance_context.calibration_state in registry
```

---

## Health State Machine

```yaml
health_states:
  GREEN:
    definition: Agent operating normally; all metrics within targets
    availability_status: AVAILABLE or BUSY (based on load_factor)
    routing: normal discovery eligibility
    monitoring: standard (heartbeat + routine probes)
  
  YELLOW:
    definition: Agent showing early degradation signals; watchlist
    triggers:
      - error_rate_5m > 0.10
      - heartbeat_delayed once in last 15 minutes
      - task_timeout_count > 2 in last hour
      - performance_context.overall_performance_score < 0.60
    routing: still eligible for discovery; lower fit_score adjustment (×0.90)
    monitoring: enhanced (liveness probe every 60s; passive signal weight increased)
    auto_recovery: returns to GREEN if all triggers clear for 30 consecutive minutes
  
  ORANGE:
    definition: Agent significantly degraded; routing restricted
    triggers:
      - error_rate_5m > 0.25
      - 2 consecutive missed heartbeats
      - CAPABILITY_SPOT_CHECK failed
      - calibration_state = ORANGE for GOVERNANCE tasks
    routing: excluded from new task routing; existing tasks allowed to complete
    action: supervisor_notification immediately
    monitoring: liveness probe every 30s
    auto_recovery: requires READINESS_PROBE success + 10 minutes GREEN signals
  
  RED:
    definition: Agent critically impaired; taken offline
    triggers:
      - 3+ consecutive missed heartbeats
      - SAFETY_VIOLATION signal received
      - CAPABILITY_SPOT_CHECK failed twice in 24h
      - health_monitor.forced_offline (operator action)
    availability_status: OFFLINE (regardless of load_factor)
    routing: excluded from all discovery; no new tasks
    action: immediate operator alert + supervisor notification
    auto_recovery: requires operator acknowledgment + READINESS_PROBE success

agent_state_transitions:
  AVAILABLE → BUSY: load_factor crosses 0.70 threshold
  BUSY → OVERLOADED: load_factor crosses 0.90 threshold
  OVERLOADED → BUSY: load_factor drops below 0.85 (hysteresis)
  ANY → OFFLINE: 3+ consecutive missed heartbeats
  OFFLINE → AVAILABLE: heartbeat resumes + READINESS_PROBE success
  ANY → MAINTENANCE: agent or operator pre-announces planned downtime
  MAINTENANCE → AVAILABLE: maintenance window ends + health probe success
  ANY → SUSPENDED: governance order (Tier-3+)
  SUSPENDED → AVAILABLE: governance clearance (Tier-3+)
```

---

## Recovery Protocol

```yaml
recovery_protocol:
  OFFLINE_RECOVERY:
    detection: heartbeat resumes after OFFLINE period
    step_1: send LIVENESS_PROBE immediately
    step_2: if liveness succeeds → send READINESS_PROBE
    step_3: if readiness succeeds → set status = AVAILABLE (or BUSY per load_factor)
    step_4: log recovery event with downtime duration
    step_5: if downtime > 1 hour → notify supervisor; check for in-flight task orphans
    step_6: if downtime > 24 hours → trigger CAPABILITY_SPOT_CHECK before full routing restoration
  
  CASCADING_FAILURE_PROTECTION:
    trigger: > 10% of agents in a domain go OFFLINE within 5 minutes
    action: alert enterprise-nervous-system; pause new task routing to that domain
    action: escalate to Tier-4+ immediately
    action: initiate emergency capacity assessment
  
  GRACEFUL_DEGRADATION:
    trigger: agent fleet load_factor average > 0.85 across any domain
    action: alert orchestrators to reduce task submission rate
    action: activate EMERGENCY discovery mode (see agent-discovery-engine.md)
    action: trigger on-call notification for capacity management
```

---

## Health Dashboard Metrics

```yaml
fleet_health_metrics:
  real_time:
    total_agents: int
    by_status: {AVAILABLE: n, BUSY: n, OVERLOADED: n, OFFLINE: n, MAINTENANCE: n}
    by_health_state: {GREEN: n, YELLOW: n, ORANGE: n, RED: n}
    fleet_load_factor_avg: float
    fleet_load_factor_p95: float
  
  rolling_30m:
    heartbeat_success_rate: float       # target: > 0.99
    probe_success_rate: float
    avg_recovery_time_minutes: float
    offline_incident_count: int
  
  alerts:
    FLEET_DEGRADED: > 15% agents not in GREEN health state
    DOMAIN_OUTAGE: > 20% agents in any single domain OFFLINE
    HEARTBEAT_STORM: > 100 agents missed heartbeat simultaneously (infrastructure issue)
    RECOVERY_STALLED: agent OFFLINE > 2 hours without recovery progress
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-registry/agent-registry-model.md` | Updates availability_index and health state |
| `agent-registry/agent-roster-management.md` | Health events trigger record maintenance; extended OFFLINE triggers cleanup |
| `agent-registry/agent-discovery-engine.md` | Availability index is primary source for discovery queries |
| `enterprise-telemetry/enterprise-event-bus.md` | Health state changes emitted as events |
| `enterprise-nervous-system/enterprise-command-center.md` | Fleet health metrics feed command center |
| `agent-performance/agent-performance-tracker.md` | Task error signals shared with performance tracking |
