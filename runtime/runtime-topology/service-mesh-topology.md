# Service Mesh Topology

**System ID:** `service-mesh-topology`
**Role:** Maintains the service mesh view of the enterprise AI OS — tracks all active service-to-service connections, health status per connection, latency distributions, circuit breaker states, request rates, and error rates across the full mesh of agent-to-system and system-to-system connections; enables operators to see connection health at the mesh level, not just the node level
**Storage:** `memory/runtime-topology/mesh-state.yaml`

---

## Purpose

Individual system health is necessary but insufficient. Two healthy systems with a broken connection between them create a failure that neither system's health score captures. The service mesh topology tracks the connections themselves: every agent-to-system link, every system-to-system dependency, circuit breaker states, connection error rates, and latency distributions per link. It surfaces the mesh-level failures that node-level monitoring misses.

---

## Mesh Model

```yaml
ServiceMeshState:
  last_updated: datetime
  
  services: [ServiceNode]
  connections: [MeshConnection]
  circuit_breakers: [CircuitBreakerState]
  
  # Mesh health
  healthy_connections: integer
  degraded_connections: integer
  open_circuit_breakers: integer
  total_connections: integer
  
  # Mesh-level metrics
  total_request_rate: float      # Requests/second across all connections
  mesh_error_rate: float         # Aggregate error rate
  mesh_p99_latency_ms: float

ServiceNode:
  service_id: string
  service_type: "AGENT_ORG | WORKFLOW_ENGINE | EXECUTION_RUNTIME | GOVERNANCE | INTEGRATION | SEMANTIC_GATEWAY | AUDIT"
  display_name: string
  status: "HEALTHY | DEGRADED | OFFLINE"
  
  # Traffic metrics
  inbound_request_rate: float
  outbound_request_rate: float
  error_rate: float
  p99_latency_ms: float

MeshConnection:
  connection_id: string
  from_service_id: string
  to_service_id: string
  connection_type: "SYNCHRONOUS_CALL | EVENT_SUBSCRIPTION | DATA_FLOW | CONTROL"
  
  # Health
  status: "HEALTHY | DEGRADED | FAILING | CIRCUIT_OPEN"
  
  # Traffic
  request_rate: float            # Requests per minute
  error_rate: float
  timeout_rate: float
  
  # Latency
  latency_p50_ms: float
  latency_p90_ms: float
  latency_p99_ms: float
  
  # SLA
  sla_p99_ms: float
  sla_compliant: boolean
  
  # Circuit breaker
  circuit_breaker_state: "CLOSED | OPEN | HALF_OPEN"
  consecutive_failures: integer
  last_failure_at: datetime | null
  circuit_opened_at: datetime | null

CircuitBreakerState:
  breaker_id: string
  connection_id: string
  state: "CLOSED | OPEN | HALF_OPEN"
  failure_threshold: integer      # Open after N consecutive failures
  success_threshold: integer      # Close (from HALF_OPEN) after N successes
  timeout_seconds: integer        # How long to stay OPEN before going HALF_OPEN
  consecutive_failures: integer
  last_state_change: datetime
  opened_at: datetime | null
```

---

## Connection Registry

```yaml
# Standard enterprise AI OS connection map

ServiceConnections:
  
  workflow-engine→execution-runtime:
    connection_type: SYNCHRONOUS_CALL
    sla_p99_ms: 500
    circuit_breaker: {threshold: 5, timeout: 30}
  
  workflow-engine→semantic-gateway:
    connection_type: SYNCHRONOUS_CALL
    sla_p99_ms: 200
    circuit_breaker: {threshold: 3, timeout: 20}
  
  dag-engine→worker-dispatcher:
    connection_type: SYNCHRONOUS_CALL
    sla_p99_ms: 100
    circuit_breaker: {threshold: 5, timeout: 30}
  
  execution-runtime→execution-signing:
    connection_type: SYNCHRONOUS_CALL
    sla_p99_ms: 50
    circuit_breaker: {threshold: 3, timeout: 10}
  
  any-agent→constitutional-ai-governor:
    connection_type: SYNCHRONOUS_CALL
    sla_p99_ms: 300
    circuit_breaker: {threshold: 3, timeout: 20}
    note: "MANDATORY — cannot be bypassed"
  
  any-agent→immutable-audit-log:
    connection_type: SYNCHRONOUS_CALL
    sla_p99_ms: 100
    circuit_breaker: {threshold: 1, timeout: 5}    # Extremely strict — audit is critical
  
  enterprise-event-bus→all-subscribers:
    connection_type: EVENT_SUBSCRIPTION
    sla_p99_ms: 1000
    circuit_breaker: null                          # Event bus has its own back-pressure
  
  governance-attestation→cryptographic-approval-engine:
    connection_type: SYNCHRONOUS_CALL
    sla_p99_ms: 200
    circuit_breaker: {threshold: 5, timeout: 30}
  
  mcp-governance-gateway→external-mcp-servers:
    connection_type: SYNCHRONOUS_CALL
    sla_p99_ms: 5000
    circuit_breaker: {threshold: 5, timeout: 60}   # External services get more tolerance
  
  connectors→external-integrations:
    connection_type: SYNCHRONOUS_CALL
    sla_p99_ms: 10000
    circuit_breaker: {threshold: 3, timeout: 120}
```

---

## Mesh Monitoring Engine

```
monitor_service_mesh() → ServiceMeshState:
  
  connections = load_registered_connections()
  services = load_registered_services()
  
  # Update each connection with latest metrics
  FOR conn in connections:
    metrics = collect_connection_metrics(conn.from_service_id, conn.to_service_id, window_minutes=5)
    
    conn.request_rate = metrics.request_rate
    conn.error_rate = metrics.error_rate
    conn.timeout_rate = metrics.timeout_rate
    conn.latency_p50_ms = metrics.latency_p50
    conn.latency_p90_ms = metrics.latency_p90
    conn.latency_p99_ms = metrics.latency_p99
    conn.sla_compliant = conn.latency_p99_ms <= conn.sla_p99_ms
    
    # Evaluate circuit breaker
    evaluate_circuit_breaker(conn, metrics)
    
    # Classify connection status
    conn.status = classify_connection_status(conn)
  
  # Alert on degraded connections
  FOR conn in connections:
    IF conn.status == "FAILING":
      enterprise_event_bus.publish(
        topic = "alerts.critical",
        event_type = "MESH_CONNECTION_FAILING",
        payload = {
          connection_id: conn.connection_id,
          from_service: conn.from_service_id,
          to_service: conn.to_service_id,
          error_rate: conn.error_rate
        },
        priority = "CRITICAL"
      )
    
    IF conn.circuit_breaker_state == "OPEN":
      enterprise_event_bus.publish(
        topic = "alerts.high",
        event_type = "CIRCUIT_BREAKER_OPEN",
        payload = {connection_id: conn.connection_id, opened_at: conn.circuit_opened_at},
        priority = "HIGH"
      )
    
    IF NOT conn.sla_compliant:
      enterprise_event_bus.publish(
        topic = "alerts.high",
        event_type = "MESH_SLA_BREACH",
        payload = {
          connection_id: conn.connection_id,
          p99_actual_ms: conn.latency_p99_ms,
          sla_target_ms: conn.sla_p99_ms
        },
        priority = "HIGH"
      )
  
  mesh_state = ServiceMeshState(
    last_updated = now(),
    services = [update_service_health(s, connections) for s in services],
    connections = connections,
    circuit_breakers = [get_circuit_breaker_state(c) for c in connections if c.circuit_breaker_state],
    healthy_connections = len([c for c in connections if c.status == "HEALTHY"]),
    degraded_connections = len([c for c in connections if c.status == "DEGRADED"]),
    open_circuit_breakers = len([c for c in connections if c.circuit_breaker_state == "OPEN"]),
    total_connections = len(connections),
    total_request_rate = sum(c.request_rate for c in connections),
    mesh_error_rate = MEAN([c.error_rate for c in connections if c.request_rate > 0]) if connections else 0,
    mesh_p99_latency_ms = max(c.latency_p99_ms for c in connections if c.latency_p99_ms) if connections else 0
  )
  
  persist_mesh_state(mesh_state)
  RETURN mesh_state

evaluate_circuit_breaker(conn, metrics):
  
  IF conn.circuit_breaker_state == "CLOSED":
    IF metrics.consecutive_failures >= conn.failure_threshold:
      conn.circuit_breaker_state = "OPEN"
      conn.circuit_opened_at = now()
      conn.consecutive_failures = metrics.consecutive_failures
  
  ELIF conn.circuit_breaker_state == "OPEN":
    IF (now() - conn.circuit_opened_at).total_seconds() >= conn.timeout_seconds:
      conn.circuit_breaker_state = "HALF_OPEN"    # Allow one probe request
  
  ELIF conn.circuit_breaker_state == "HALF_OPEN":
    IF metrics.recent_success_count >= conn.success_threshold:
      conn.circuit_breaker_state = "CLOSED"
      conn.circuit_opened_at = null
    ELIF metrics.recent_failures > 0:
      conn.circuit_breaker_state = "OPEN"         # Back to OPEN on any failure in probe
      conn.circuit_opened_at = now()

classify_connection_status(conn) → str:
  IF conn.circuit_breaker_state == "OPEN": RETURN "CIRCUIT_OPEN"
  IF conn.error_rate > 0.20: RETURN "FAILING"
  IF conn.error_rate > 0.05 OR NOT conn.sla_compliant: RETURN "DEGRADED"
  RETURN "HEALTHY"
```

---

## Integration

**Called by:**
- `orchestration-observability/live-topology-viewer.md` — mesh overlay on topology
- `operational-command-center/orchestration-control-plane.md` — circuit breaker control
- `orchestration-observability/coordination-monitor.md` — connection health inputs

**Calls:**
- `enterprise-telemetry/enterprise-event-bus.md` — publishes connection failure alerts

**Writes to:** `memory/runtime-topology/mesh-state.yaml`
