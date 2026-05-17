# Failure Isolation System
**ID:** BRC-FIS-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + Engineering Org | **Updated:** 2026-05-16

---

## Purpose

Prevents failures in one agent, workflow, or system from cascading into others. The failure isolation system applies circuit breaker and bulkhead patterns at the execution layer, ensures that a failing sandbox does not exhaust shared resources, and quarantines misbehaving executions before they affect the wider agent mesh. Isolation is always active during sandboxed execution and is the first line of defense against systemic failure propagation.

---

## Failure Modes Addressed

```yaml
failure_modes:
  CASCADE_FAILURE:
    description: Agent A fails → retries → overwhelms connector → connector fails → Agents B, C, D fail
    pattern: Circuit Breaker
    
  RESOURCE_EXHAUSTION:
    description: One agent monopolizes tokens, connections, or compute, starving others
    pattern: Bulkhead
    
  TIMEOUT_PROPAGATION:
    description: Slow downstream causes upstream timeout cascade
    pattern: Timeout + Fallback
    
  RETRY_STORM:
    description: Multiple agents simultaneously retry failed operations, amplifying load
    pattern: Exponential Backoff + Jitter + Global Rate Limit
    
  POISON_MESSAGE:
    description: Malformed event or payload causes repeated agent failures when processed
    pattern: Dead Letter Queue + Quarantine
    
  DEPENDENCY_AVALANCHE:
    description: Shared dependency failure brings down all dependent workflows
    pattern: Dependency Isolation + Fallback Registry
```

---

## Circuit Breaker

```yaml
circuit_breaker_config:
  per_connector:                         # separate circuit breaker per connector
    failure_threshold: 5                 # failures within window to open circuit
    failure_window_seconds: 60
    success_threshold: 3                 # successes needed to close from HALF_OPEN
    open_timeout_seconds: 30             # time before attempting HALF_OPEN
    
  per_agent_pair:                        # circuit breaker for agent-to-agent calls
    failure_threshold: 3
    failure_window_seconds: 30
    open_timeout_seconds: 15

circuit_breaker_states:
  CLOSED:
    behavior: normal execution; track failures
    transition_to_OPEN: failure_count >= threshold within window
    
  OPEN:
    behavior: FAIL FAST — return error immediately without attempting call
    agents receive: CIRCUIT_OPEN error code
    transition_to_HALF_OPEN: after open_timeout_seconds
    
  HALF_OPEN:
    behavior: allow limited probe requests (1 per 5s)
    if probe succeeds: increment success_count
    transition_to_CLOSED: success_count >= success_threshold
    transition_to_OPEN: any probe failure
```

```
evaluate_circuit_breaker(connector_id, agent_id):
  cb = load_circuit_breaker(connector_id)
  
  if cb.state == OPEN:
    log CIRCUIT_OPEN_FAST_FAIL
    return CIRCUIT_OPEN_ERROR  # immediate; no network call
    
  if cb.state == HALF_OPEN:
    if time_since_last_probe < 5s:
      return CIRCUIT_OPEN_ERROR  # still probing; reject
    # else: allow this probe through
    
  try:
    result = execute_call(connector_id, ...)
    cb.record_success()
    return result
  except ConnectorError:
    cb.record_failure()
    if cb.failure_count >= cb.failure_threshold:
      cb.open()
      alert: T2 (CIRCUIT_BREAKER_OPENED, connector_id)
    raise
```

---

## Bulkhead Pattern

Prevents any single agent or workflow from exhausting shared resources:

```yaml
bulkhead_config:
  resource_pools:
    connector_connections:
      total_pool_size: 200
      per_agent_max: 20                  # no agent gets > 10% of pool
      per_org_max: 60
      
    token_budget:
      total_system_budget_per_hour: 50000000
      per_agent_max_per_hour: 2000000    # 4% ceiling per agent
      per_workflow_max: 500000
      
    sandbox_slots:
      total_slots: 50                    # from sandbox-registry.md
      per_agent_max: 10
      
    event_bus_partitions:
      producer_rate_per_agent: 1000 events/min
      consumer_lag_threshold: 10000 messages  # SLOW_CONSUMER alert
```

```
enforce_bulkhead(agent_id, resource_type, requested_amount):
  current_usage = load_usage(agent_id, resource_type)
  
  if current_usage + requested_amount > bulkhead_config[resource_type].per_agent_max:
    log BULKHEAD_LIMIT_REACHED
    alert: T2 (agent_id, resource_type, current_usage, limit)
    return BULKHEAD_REJECTED
    
  if system_total_usage + requested_amount > bulkhead_config[resource_type].total_pool_size:
    log SYSTEM_RESOURCE_EXHAUSTION
    alert: T3 immediate
    return SYSTEM_CAPACITY_EXCEEDED
    
  allocate(agent_id, resource_type, requested_amount)
  return ALLOCATED
```

---

## Timeout Management

```yaml
timeout_policy:
  connector_calls:
    default: 30000ms
    per_connector_override:
      salesforce: 45000ms               # slower API
      github: 20000ms
      slack: 10000ms
    on_timeout: return TIMEOUT_ERROR; record as failure for circuit breaker
    
  agent_to_agent_delegation:
    default: 120000ms (2 minutes)
    on_timeout: return DELEGATION_TIMEOUT; escalate T2
    
  sandbox_execution_total:
    DRY_RUN: 300000ms (5 minutes hard TTL → matches sandbox TTL)
    SYNTHETIC: 1800000ms (30 minutes)
    SCOPED: 900000ms (15 minutes)
    REVERSIBLE: 3600000ms (60 minutes)
    on_timeout: auto-trigger rollback-coordinator; sandbox EXPIRED
    
  fallback_behavior:
    on_timeout: check fallback_registry for degraded-mode alternative
    no_fallback_available: return OPERATION_UNAVAILABLE; agent must handle gracefully
```

---

## Retry Management

```yaml
retry_policy:
  exponential_backoff:
    base_delay_ms: 500
    multiplier: 2
    max_delay_ms: 30000
    max_attempts: 5
    jitter: true                         # ±25% random jitter to prevent retry storms
    
  retryable_errors:
    - TIMEOUT
    - TRANSIENT_NETWORK_ERROR
    - SERVICE_UNAVAILABLE_503
    - TOO_MANY_REQUESTS_429
    
  non_retryable_errors:
    - PERMISSION_DENIED
    - CIRCUIT_OPEN
    - CONSTITUTIONAL_VIOLATION
    - BULKHEAD_REJECTED
    - INVALID_INPUT
    
  global_retry_rate_limit:
    max_retries_per_connector_per_minute: 100  # prevents retry storm
    if_exceeded: CIRCUIT_OPEN for that connector
```

---

## Failure Propagation Blocking

```
prevent_failure_propagation(failed_sandbox_id, failure_type):

  1. Identify downstream dependencies:
     dependent_sandboxes = find_sandboxes_depending_on(failed_sandbox_id)
     dependent_workflows = find_workflows_triggered_by(failed_sandbox_id)
     
  2. For each dependent:
     if dependency is hard (output of failed is input to dependent):
       SUSPEND dependent sandbox
       notify dependent agent: UPSTREAM_DEPENDENCY_FAILED
       escalate: T2
       
     if dependency is soft (notification-based):
       send DEGRADED_MODE signal to dependent
       dependent switches to fallback behavior
       
  3. Prevent event cascade:
     if failed sandbox published events before failure:
       check: did downstream consumers process those events?
       if YES and events were triggering actions:
         trigger: rollback-coordinator for downstream actions
       
  4. Isolate agent from new work:
     if failure is repeated (3+ in 1 hour for same agent):
       pause agent's work queue; flag for behavioral review
       alert: T3
```

---

## Fallback Registry

```yaml
fallback_registry:
  entries:
    - connector: jira
      fallback: local_ticket_queue       # queue tickets locally; sync when JIRA recovers
      degradation_level: PARTIAL
      
    - connector: slack
      fallback: email_smtp               # route notifications to email
      degradation_level: DEGRADED
      
    - connector: github
      fallback: read_cached_state        # use cached repo state; block new deploys
      degradation_level: READ_ONLY
      
    - connector: salesforce
      fallback: local_crm_cache          # read-only CRM view; no writes
      degradation_level: READ_ONLY
      
    - system: knowledge_base
      fallback: local_snapshot           # use last 24h snapshot
      degradation_level: STALE_READ
```

---

## Integration

```
Feeds into:
  runtime-quarantine-system.md — FIS detects anomalous patterns; quarantine handles containment
  rollback-coordinator.md — failure detection triggers rollback for in-flight actions
  blast-radius-analyzer.md — runtime failure scope feeds blast radius monitoring
  sandbox-engine.md — circuit open / bulkhead exceeded → sandbox suspended

Receives from:
  isolated-execution-environment.md — execution errors feed circuit breaker
  side-effect-tracker.md — cascading side effects identified via tracker
  blast-radius-analyzer.md — scope expansion triggers isolation response
  privilege-containment-engine.md — permission denials feed scope violation detection
```

---

## Governance

**Circuit breaker tuning:** Only Architecture Org may change thresholds; changes require performance test evidence  
**Bulkhead limits:** Only T4 may increase per-agent limits; system-wide limits require T4 + Architecture Org  
**Fallback accuracy:** Fallback registry reviewed quarterly; stale or broken fallbacks = HIGH risk gap  
**Audit:** All circuit breaker state changes and bulkhead rejections to `memory/blast-radius-control/failure-isolation-log.jsonl`
