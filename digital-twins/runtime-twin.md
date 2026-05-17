# Runtime Twin

**System ID:** `runtime-twin`
**Role:** Live mirror of the AI agent runtime — tool call rates, context consumption, session concurrency, recovery frequency, and orchestration load — enabling runtime capacity planning and failure prediction
**Storage:** `memory/digital-twins/twin-state/runtime-twin.yaml`

---

## Purpose

The runtime-twin models the execution infrastructure: the actual AI agent sessions, tool budget consumption, context pressure, and orchestration overhead. It answers:

- "How close is the runtime to context saturation under current load?"
- "Which agent types are consuming the most tool budget per workflow?"
- "If we add 3 concurrent critical workflows, does the orchestrator saturate?"
- "What is the current recovery overhead as a fraction of total runtime?"

This twin is the most real-time of the four — runtime conditions change minute-by-minute.

---

## Data Sources

| Data Domain | Source | Sync Frequency |
|-------------|--------|----------------|
| Agent invocations | `memory/execution-store/agent-invocations.jsonl` | 5 min |
| Session activity | `memory/execution-store/session-manifest.jsonl` | 5 min |
| Tool budget usage | `memory/execution-store/step-states.jsonl` | 5 min |
| Checkpoint events | `memory/execution-store/checkpoint-index.jsonl` | 5 min |
| Recovery events | `memory/execution-ledger.jsonl` (recovery types) | 5 min |
| Work queue pressure | `memory/work-queue.yaml` | 5 min |

---

## Runtime Twin State Schema

`memory/digital-twins/twin-state/runtime-twin.yaml`:

### Session and Concurrency

```yaml
runtime_twin:
  snapshot_id: "rt-[YYYY-MM-DD-HHMMSS]"
  synced_at: "[ISO-8601]"
  metrics_window_minutes: 60
  
  concurrency:
    # Current active sessions
    active_sessions_now: 0
    peak_sessions_last_hour: 0
    avg_sessions_last_hour: 0.0
    
    # Concurrency by agent type
    by_agent_tier:
      T1: { active: 0, peak_1h: 0 }   # Engineering
      T2: { active: 0, peak_1h: 0 }   # PM, BA, UX, QA, etc.
      T3: { active: 0, peak_1h: 0 }   # Architecture, AI-Native
      T4: { active: 0, peak_1h: 0 }   # Executive, Meta
      T5: { active: 0, peak_1h: 0 }   # C-suite
    
    # Orchestrator load
    orchestrator:
      active_orchestration_sessions: 0
      avg_workflows_coordinated_per_session: 0.0
      orchestrator_saturation_pct: 0.0   # 0.0-1.0 — above 0.85 = at risk
```

### Context Consumption

```yaml
  context_consumption:
    # Per-session averages (last 60 min)
    avg_tokens_per_session: 0
    p50_tokens_per_session: 0
    p90_tokens_per_session: 0
    max_tokens_observed: 0
    
    # Context pressure signals
    sessions_hit_compression_last_hour: 0
    sessions_hit_limit_last_hour: 0      # sessions that hit context ceiling
    context_pressure_index: 0.0          # 0.0 (no pressure) to 1.0 (critical)
    
    # By workflow type
    by_workflow_type:
      "[workflow-type]":
        avg_tokens: 0
        sessions_requiring_compression: 0
        sessions_hitting_limit: 0
    
    # Compaction events
    micro_compactions_last_hour: 0
    full_compactions_last_hour: 0
    compaction_overhead_pct: 0.0    # fraction of session time spent on compaction
```

### Tool Budget Consumption

```yaml
  tool_budget:
    # Overall tool call rate
    tool_calls_per_hour: 0.0
    tool_calls_per_minute_current: 0.0
    
    # By tool category
    by_tool_category:
      file_operations: { calls_per_hour: 0, avg_latency_ms: 0 }
      search_operations: { calls_per_hour: 0, avg_latency_ms: 0 }
      web_fetch: { calls_per_hour: 0, avg_latency_ms: 0 }
      agent_spawn: { calls_per_hour: 0, avg_latency_ms: 0 }
      write_operations: { calls_per_hour: 0, avg_latency_ms: 0 }
    
    # Budget exhaustion signals
    steps_exhausted_budget_last_hour: 0    # steps that ran out of tool calls
    budget_exhaustion_rate: 0.0            # fraction of steps exhausting budget
    avg_budget_utilization_pct: 0.0        # avg % of budget used per step
    
    # Deduplication efficiency (from interruption-recovery.md)
    tool_calls_deduplicated_last_hour: 0   # tool calls saved by deduplication
    deduplication_savings_pct: 0.0
```

### Checkpoint and Persistence Health

```yaml
  persistence_health:
    # Checkpoint creation rate
    checkpoints_written_last_hour: 0
    phase_snapshots_last_hour: 0
    runtime_snapshots_last_hour: 0
    
    # Checkpoint validity
    checkpoints_invalid_rate: 0.0  # fraction of checkpoints failing integrity
    avg_checkpoint_write_seconds: 0.0
    
    # Ledger health
    ledger_write_rate_per_hour: 0.0
    ledger_size_mb: 0.0
    ledger_approaching_rotation: false    # > 40MB = approaching 50MB rotation
    
    # Store health
    store_files_healthy: true
    largest_store_file_mb: 0.0
    store_approaching_compaction: false   # any file > 8MB
```

### Recovery Overhead

```yaml
  recovery_overhead:
    # Recovery frequency
    recovery_events_last_hour: 0
    recovery_events_last_24h: 0
    recovery_overhead_pct: 0.0    # fraction of runtime spent on recovery
    
    # By recovery type
    by_recovery_type:
      warm_resume: { count_24h: 0, avg_duration_minutes: 0 }
      interruption_recovery: { count_24h: 0, avg_duration_minutes: 0 }
      cold_start: { count_24h: 0, avg_duration_minutes: 0 }
      rollback: { count_24h: 0, avg_duration_minutes: 0 }
    
    # Recovery success rates
    recovery_success_rate: 0.0
    failed_recoveries_24h: 0
    
    # Session bridge usage
    session_bridges_created_24h: 0
    session_bridges_consumed_24h: 0
    bridge_consumption_rate: 0.0   # consumed/created — high = healthy continuity
```

### Orchestration Load

```yaml
  orchestration_load:
    # Routing throughput
    routing_decisions_per_hour: 0.0
    avg_routing_latency_ms: 0.0
    
    # Delegation chain depth
    avg_delegation_depth: 0.0      # how many hops from orchestrator to executor
    max_delegation_depth: 0
    deep_delegation_pct: 0.0       # fraction of delegations with depth > 3
    
    # Delegation outcomes
    delegation_success_rate: 0.0
    handoff_failure_rate: 0.0
    handoff_recovery_rate: 0.0     # of failed handoffs, fraction that recovered
    
    # Supervisor load
    supervisor_reviews_per_hour: 0.0
    supervisor_overload_flag: false
    
    # Coordination overhead
    cross_org_coordination_events_24h: 0
    coordination_failure_rate: 0.0
    avg_coordination_resolution_hours: 0.0
```

---

## Runtime Saturation Model

The runtime-twin models three saturation thresholds:

```yaml
  saturation_model:
    # Current saturation state
    current_saturation_level: "NORMAL | ELEVATED | WARNING | CRITICAL"
    
    # Per-dimension saturation
    context_saturation: 0.0         # based on context_pressure_index
    orchestrator_saturation: 0.0    # based on orchestrator_saturation_pct
    tool_budget_saturation: 0.0     # based on budget_exhaustion_rate
    recovery_saturation: 0.0        # based on recovery_overhead_pct
    
    # Composite saturation score
    composite_saturation: 0.0       # max(above dimensions)
    
    # Time-to-saturation estimate (if current trend continues)
    estimated_saturation_onset: null  # ISO-8601 or null if not trending toward saturation
    
    # Recommended actions
    saturation_mitigations:
      - dimension: "[context | orchestrator | tool_budget | recovery]"
        action: "[specific mitigation]"
        expected_relief_pct: 0.0
```

---

## Simulation Interface

Perturbations for runtime load simulation:

```
PERTURBATION TYPES:
  - { type: "increase_concurrent_workflows", count: 5 }
    → Scale active_sessions by ratio
    → Project context saturation, orchestrator saturation
  
  - { type: "increase_step_complexity", token_factor: 1.3 }
    → Scale avg_tokens_per_session by factor
    → Project compression events, context limit hits
  
  - { type: "tool_latency_increase", category: "web_fetch", latency_factor: 3.0 }
    → Slow down specified tool calls
    → Project throughput impact and budget exhaustion rate change
  
  - { type: "recovery_rate_increase", rate_factor: 2.0 }
    → Double recovery events
    → Project recovery overhead percentage
    → Project impact on normal execution throughput
```

---

## Integration

**Data sources:**
- `memory/execution-store/agent-invocations.jsonl`
- `memory/execution-store/session-manifest.jsonl`
- `memory/execution-store/checkpoint-index.jsonl`
- `memory/execution-ledger.jsonl`
- `memory/work-queue.yaml`

**Read by:**
- `simulation-systems/runtime-load-simulator.md`
- `simulation-systems/orchestration-simulator.md`
- `predictive-intelligence/operational-forecaster.md`
- `predictive-intelligence/bottleneck-predictor.md`

**Written by:**
- `digital-twins/twin-engine.md`
- `digital-twins/twin-sync.md`
