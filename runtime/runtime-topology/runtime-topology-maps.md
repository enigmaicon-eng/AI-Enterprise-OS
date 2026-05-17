# Runtime Topology Maps

**System ID:** `runtime-topology-maps`
**Role:** Maintains and renders live topology maps of the enterprise AI OS runtime — tracks agent nodes, trust zone boundaries, active workflow flows, inter-org connection strengths, and system dependencies as a force-directed graph updated on agent lifecycle events; enables operators to see the runtime as a system, not a list of metrics
**Storage:** `memory/runtime-topology/topology-state.yaml`

---

## Purpose

Metrics tell you what is happening. Topology maps tell you where. A runtime topology map shows which agents are active, which trust zones contain the most traffic, which org-to-org paths are load-bearing, and which systems would cascade if a node failed. When a routing anomaly appears in the orchestration health score, the topology map shows the actual routing path that is misbehaving. Topology maps transform the abstract metric into a spatial understanding of the system.

---

## Topology Model

```yaml
TopologyGraph:
  graph_id: string
  generated_at: datetime
  last_updated: datetime
  
  nodes: [TopologyNode]
  edges: [TopologyEdge]
  zones: [TrustZone]
  
  # Graph metadata
  total_nodes: integer
  total_active_nodes: integer
  total_edges: integer
  zone_count: integer

TopologyNode:
  node_id: string
  node_type: "AGENT | ORG | SYSTEM | WORKER_POOL | INTEGRATION | GATE"
  
  # Identity
  display_name: string
  system_id: string
  
  # Position (force-directed layout coordinates)
  x: float
  y: float
  z: float | null              # For 3D layouts
  
  # State
  status: "ACTIVE | IDLE | DEGRADED | SUSPENDED | OFFLINE"
  trust_tier: integer | null   # T1–T5 for agents
  trust_zone: string
  authority_level: integer | null
  
  # Load indicators
  utilization_rate: float | null    # 0.0–1.0 for agents/orgs
  queue_depth: integer | null       # For queued systems
  active_runs: integer | null       # For workflow systems
  
  # Visual encoding
  size: float                  # Node size proportional to load or importance
  color: string                # Hex; green=healthy, yellow=degraded, red=critical
  border_color: string         # Zone color

TopologyEdge:
  edge_id: string
  from_node_id: string
  to_node_id: string
  
  edge_type: "ROUTING | DELEGATION | HANDOFF | DATA_FLOW | TRUST_BOUNDARY | DEPENDENCY"
  
  # Load metrics
  flow_rate: float             # Events/connections per minute
  flow_direction: "UNIDIRECTIONAL | BIDIRECTIONAL"
  latency_ms: float | null
  error_rate: float | null
  
  # Visual encoding
  width: float                 # Line width proportional to flow rate
  opacity: float               # Low opacity = inactive/rare; high = active
  color: string                # Green=healthy, yellow=high latency, red=errors
  animated: boolean            # Animate for active flows
  
  # Period
  active_in_window: boolean    # Active in last 15 minutes

TrustZone:
  zone_id: string
  zone_name: string
  trust_level: integer
  node_ids: [string]
  boundary_color: string       # Visual zone delineation
  
  # Zone health
  avg_utilization: float
  active_node_count: integer
  total_node_count: integer
  health_status: string
```

---

## Topology Build Engine

```
build_runtime_topology() → TopologyGraph:
  
  # Collect all registered agents and systems
  agent_manifests = capability_scope_controller.get_all_manifests()
  org_definitions = get_all_org_definitions()
  zone_definitions = trust_boundary_registry.get_all_zones()
  
  # Current load state
  pool_status = load_worker_pool_status()
  org_health = organizational_health_telemetry.get_latest_snapshot()
  orch_metrics = orchestration_telemetry.get_latest_snapshot()
  
  nodes = []
  edges = []
  
  # --- Build org nodes ---
  FOR org in org_definitions:
    utilization = org_health.utilization.by_org.get(org.org_id, 0.0)
    queue_depth = org_health.queues.by_org.get(org.org_id, 0)
    
    nodes.append(TopologyNode(
      node_id = org.org_id,
      node_type = "ORG",
      display_name = org.org_name,
      system_id = org.org_id,
      status = classify_node_status(utilization=utilization),
      trust_tier = org.dominant_trust_tier,
      trust_zone = org.trust_zone,
      utilization_rate = utilization,
      queue_depth = queue_depth,
      size = max(1.0, utilization × 3.0),
      color = utilization_to_color(utilization),
      border_color = get_zone_color(org.trust_zone)
    ))
  
  # --- Build inter-org edges from collaboration data ---
  collab_flows = get_org_collaboration_flows(window_minutes=60)
  
  FOR (from_org, to_org), flow_data in collab_flows.items():
    IF flow_data.request_count > 0:
      edges.append(TopologyEdge(
        edge_id = f"{from_org}→{to_org}",
        from_node_id = from_org,
        to_node_id = to_org,
        edge_type = "ROUTING",
        flow_rate = flow_data.request_count / 60.0,
        flow_direction = "UNIDIRECTIONAL",
        latency_ms = flow_data.avg_latency_ms,
        error_rate = flow_data.error_rate,
        width = min(5.0, max(0.5, flow_data.request_count / 10.0)),
        opacity = min(1.0, 0.2 + flow_data.request_count / 100.0),
        color = error_rate_to_color(flow_data.error_rate),
        animated = flow_data.request_count > 5,
        active_in_window = True
      ))
  
  # --- Build worker pool nodes ---
  FOR pool_id, pool in pool_status.items():
    utilization = pool.active_workers / max(pool.total_workers, 1)
    
    nodes.append(TopologyNode(
      node_id = f"pool-{pool_id}",
      node_type = "WORKER_POOL",
      display_name = pool_id,
      system_id = pool_id,
      status = "DEGRADED" if utilization > 0.90 else "ACTIVE",
      trust_zone = "zone-execution",
      utilization_rate = utilization,
      size = 2.0,
      color = utilization_to_color(utilization),
      border_color = get_zone_color("zone-execution")
    ))
  
  # --- Build trust boundary edges ---
  FOR zone_boundary in get_active_zone_crossings(window_minutes=60):
    edges.append(TopologyEdge(
      edge_id = f"boundary-{zone_boundary.from_zone}→{zone_boundary.to_zone}",
      from_node_id = zone_boundary.from_zone,
      to_node_id = zone_boundary.to_zone,
      edge_type = "TRUST_BOUNDARY",
      flow_rate = zone_boundary.crossing_rate,
      flow_direction = "UNIDIRECTIONAL",
      color = "#9C27B0",     # Purple for boundary crossings
      width = 1.0,
      opacity = 0.6,
      animated = False,
      active_in_window = zone_boundary.crossing_rate > 0
    ))
  
  # --- Build zone overlays ---
  zones = [
    TrustZone(
      zone_id = zone.zone_id,
      zone_name = zone.zone_name,
      trust_level = zone.trust_level,
      node_ids = [n.node_id for n in nodes if n.trust_zone == zone.zone_id],
      boundary_color = get_zone_color(zone.zone_id),
      avg_utilization = MEAN([n.utilization_rate for n in nodes if n.trust_zone == zone.zone_id and n.utilization_rate is not null]) or 0.0,
      active_node_count = len([n for n in nodes if n.trust_zone == zone.zone_id and n.status == "ACTIVE"]),
      total_node_count = len([n for n in nodes if n.trust_zone == zone.zone_id])
    )
    for zone in zone_definitions
  ]
  
  graph = TopologyGraph(
    graph_id = generate_uuid(),
    generated_at = now(),
    last_updated = now(),
    nodes = nodes,
    edges = edges,
    zones = zones,
    total_nodes = len(nodes),
    total_active_nodes = len([n for n in nodes if n.status == "ACTIVE"]),
    total_edges = len(edges),
    zone_count = len(zones)
  )
  
  persist_topology_graph(graph)
  RETURN graph

utilization_to_color(rate) → str:
  IF rate >= 0.90: RETURN "#F44336"   # Red
  IF rate >= 0.75: RETURN "#FF9800"   # Orange
  IF rate >= 0.50: RETURN "#FFC107"   # Yellow
  RETURN "#4CAF50"                     # Green
```

---

## Topology Delta Tracking

```
compute_topology_delta(prev_graph, curr_graph) → TopologyDelta:
  
  added_nodes = [n for n in curr_graph.nodes if n.node_id not in {p.node_id for p in prev_graph.nodes}]
  removed_nodes = [n for n in prev_graph.nodes if n.node_id not in {c.node_id for c in curr_graph.nodes}]
  
  changed_status = [
    (prev_n, curr_n) for prev_n in prev_graph.nodes
    for curr_n in curr_graph.nodes
    if prev_n.node_id == curr_n.node_id AND prev_n.status != curr_n.status
  ]
  
  added_edges = [e for e in curr_graph.edges if e.edge_id not in {p.edge_id for p in prev_graph.edges}]
  removed_edges = [e for e in prev_graph.edges if e.edge_id not in {c.edge_id for c in curr_graph.edges}]
  
  RETURN TopologyDelta(
    added_nodes = added_nodes,
    removed_nodes = removed_nodes,
    status_changes = changed_status,
    added_edges = added_edges,
    removed_edges = removed_edges,
    delta_at = now()
  )
```

---

## Integration

**Called by:**
- `operational-command-center/orchestration-control-plane.md` — routing visualization
- `orchestration-observability/live-topology-viewer.md` — real-time topology display
- Human operators — topology investigation

**Calls:**
- `enterprise-telemetry/enterprise-event-bus.md` — consumes agent lifecycle events
- `trust-boundaries/trust-boundary-registry.md` — zone definitions
- `enterprise-telemetry/orchestration-telemetry.md` — collaboration flows

**Writes to:** `memory/runtime-topology/topology-state.yaml`
