# Live Topology Viewer

**System ID:** `live-topology-viewer`
**Role:** Provides a real-time interactive visualization of the enterprise AI OS topology — renders the runtime topology graph with live metric overlays, animates active data flows, highlights degraded nodes and connections, supports drill-down inspection of any node or edge, and provides a time-slider for reviewing historical topology states
**Storage:** `memory/orchestration-observability/viewer-state.yaml`

---

## Purpose

Static topology diagrams age immediately. The live topology viewer renders the topology as it is right now — showing which agents are under load, which connections are degraded, which zones are busy, and where the active data flows are moving. When an operator sees a red cluster in zone-execution and an orange dependency edge feeding into zone-governance, they know something is building before any alert fires.

---

## Viewer Layers

```yaml
ViewerLayers:
  
  BASE_TOPOLOGY:
    description: "Core nodes and edges from runtime-topology-maps.md"
    refresh_interval_seconds: 30
    includes: [agent_org_nodes, inter_org_edges, trust_zone_boundaries, worker_pool_nodes]
    always_visible: true
  
  LOAD_OVERLAY:
    description: "Real-time utilization color-coding on nodes"
    refresh_interval_seconds: 15
    data_source: organizational-health-telemetry
    encoding: node_color (green→yellow→red by utilization)
    toggle: true
    default: ON
  
  FLOW_ANIMATION:
    description: "Animated particles on edges showing active traffic"
    refresh_interval_seconds: 10
    data_source: enterprise-event-bus (telemetry.metrics)
    encoding: particle_speed ∝ flow_rate, particle_color = error_rate
    toggle: true
    default: ON
  
  DEPENDENCY_MAP_OVERLAY:
    description: "Active workflow dependency edges from workflow-dependency-maps.md"
    refresh_interval_seconds: 60
    encoding: edge_color=dependency_type, edge_style=blocking vs non-blocking
    toggle: true
    default: OFF
  
  MESH_HEALTH_OVERLAY:
    description: "Service mesh connection health from service-mesh-topology.md"
    refresh_interval_seconds: 30
    encoding: edge_color=connection_status, bold_red=circuit_open
    toggle: true
    default: OFF
  
  TRUST_ZONE_HIGHLIGHTING:
    description: "Color-coded trust zone boundaries (T1=blue → T5=gold)"
    refresh_interval_seconds: 300
    toggle: true
    default: ON
  
  ALERT_MARKERS:
    description: "Pulsing red markers on nodes/edges with active alerts"
    refresh_interval_seconds: 5
    data_source: alerts.critical, alerts.high
    toggle: true
    default: ON
  
  HEATMAP_OVERLAY:
    description: "Temporal heatmap from orchestration-heatmaps.md overlaid on topology"
    refresh_interval_seconds: 300
    toggle: true
    default: OFF
```

---

## Viewer State and Rendering

```
ViewerState:
  view_id: string
  
  # Active layers
  active_layers: [string]
  
  # Current topology data
  topology_graph: TopologyGraph          # From runtime-topology-maps
  mesh_state: ServiceMeshState           # From service-mesh-topology
  active_alerts: [ConsoleAlert]          # From enterprise-operations-console
  
  # Interaction state
  selected_node_id: string | null
  selected_edge_id: string | null
  focus_zone: string | null              # Zoom to a specific trust zone
  
  # Time controls
  viewing_live: boolean
  historical_timestamp: datetime | null  # null = live mode
  
  # Layout
  layout_algorithm: "FORCE_DIRECTED | HIERARCHICAL | CIRCULAR | MANUAL"
  zoom_level: float
  pan_x: float
  pan_y: float

render_viewer_state() → ViewerFrame:
  
  # Assemble base topology
  graph = runtime_topology_maps.get_current_graph()
  
  # Apply active layer overlays
  FOR layer in viewer_state.active_layers:
    
    IF layer == "LOAD_OVERLAY":
      org_metrics = organizational_health_telemetry.get_latest_snapshot()
      FOR node in graph.nodes:
        IF node.node_type == "ORG":
          utilization = org_metrics.utilization.by_org.get(node.node_id, 0.0)
          node.color = utilization_to_color(utilization)
          node.size = 1.0 + utilization × 2.0
    
    IF layer == "FLOW_ANIMATION":
      recent_metrics = consume_buffered_events(topic="telemetry.metrics", limit=100)
      flow_by_edge = compute_flow_by_edge(recent_metrics)
      FOR edge in graph.edges:
        flow = flow_by_edge.get(edge.edge_id, 0)
        edge.animated = flow > 0
        edge.width = min(8.0, max(0.5, flow / 5.0))
        edge.animation_speed = min(1.0, flow / 20.0)
    
    IF layer == "MESH_HEALTH_OVERLAY":
      mesh = service_mesh_topology.get_current_mesh()
      FOR edge in graph.edges:
        mesh_conn = find_mesh_connection(mesh, edge.from_node_id, edge.to_node_id)
        IF mesh_conn:
          edge.color = connection_status_to_color(mesh_conn.status)
          IF mesh_conn.circuit_breaker_state == "OPEN":
            edge.width = 3.0
            edge.dash_pattern = [5, 5]    # Dashed = circuit open
    
    IF layer == "ALERT_MARKERS":
      alerts = enterprise_operations_console.get_active_alerts()
      alert_node_ids = set(a.source_node_id for a in alerts if a.source_node_id)
      FOR node in graph.nodes:
        IF node.node_id in alert_node_ids:
          node.pulse_animation = True
          node.border_color = "#F44336"
          node.border_width = 3.0
  
  RETURN ViewerFrame(
    graph = graph,
    active_layers = viewer_state.active_layers,
    rendered_at = now()
  )
```

---

## Node Inspection Panel

```
inspect_node(node_id) → NodeInspectionPanel:
  
  graph = runtime_topology_maps.get_current_graph()
  node = find_node(graph, node_id)
  
  IF NOT node:
    RETURN NodeInspectionPanel(found=False)
  
  panel = NodeInspectionPanel(
    node_id = node_id,
    display_name = node.display_name,
    node_type = node.node_type,
    status = node.status,
    trust_tier = node.trust_tier,
    trust_zone = node.trust_zone,
    authority_level = node.authority_level
  )
  
  # Type-specific detail
  IF node.node_type == "ORG":
    org_health = organizational_health_telemetry.get_org_detail(node_id)
    panel.utilization_rate = org_health.utilization
    panel.queue_depth = org_health.queue_depth
    panel.escalation_rate = org_health.escalation_rate
    panel.active_agents = org_health.active_agent_count
  
  ELIF node.node_type == "WORKER_POOL":
    pool_status = worker_orchestration.get_pool_status(node_id)
    panel.total_workers = pool_status.total_workers
    panel.active_workers = pool_status.active_workers
    panel.health_status = pool_status.health_status
  
  # Connected edges
  panel.connections = [
    EdgeSummary(
      to_node = find_node(graph, e.to_node_id).display_name,
      flow_rate = e.flow_rate,
      status = e.status if hasattr(e, 'status') else "ACTIVE",
      edge_type = e.edge_type
    )
    for e in graph.edges if e.from_node_id == node_id
  ]
  
  # Active alerts
  panel.active_alerts = [a for a in enterprise_operations_console.get_active_alerts()
                         if a.source_node_id == node_id]
  
  # Quick actions
  panel.available_actions = get_node_quick_actions(node)
  
  RETURN panel

inspect_edge(edge_id) → EdgeInspectionPanel:
  
  graph = runtime_topology_maps.get_current_graph()
  edge = find_edge(graph, edge_id)
  mesh = service_mesh_topology.get_current_mesh()
  
  mesh_conn = find_mesh_connection(mesh, edge.from_node_id, edge.to_node_id)
  
  RETURN EdgeInspectionPanel(
    edge_id = edge_id,
    from_node = edge.from_node_id,
    to_node = edge.to_node_id,
    edge_type = edge.edge_type,
    flow_rate = edge.flow_rate,
    animated = edge.animated,
    mesh = {
      status: mesh_conn.status if mesh_conn else null,
      error_rate: mesh_conn.error_rate if mesh_conn else null,
      p99_latency_ms: mesh_conn.latency_p99_ms if mesh_conn else null,
      circuit_breaker_state: mesh_conn.circuit_breaker_state if mesh_conn else null,
      sla_compliant: mesh_conn.sla_compliant if mesh_conn else null
    } if mesh_conn else null
  )
```

---

## Historical Topology Replay

```
view_historical_topology(target_timestamp) → ViewerFrame:
  
  # Load historical topology snapshot closest to target_timestamp
  historical_graph = load_historical_topology_snapshot(target_timestamp)
  
  IF NOT historical_graph:
    RETURN ViewerFrame(error=f"No topology snapshot available near {target_timestamp.isoformat()}")
  
  # Render with historical data (no live overlays)
  historical_frame = ViewerFrame(
    graph = historical_graph,
    active_layers = ["BASE_TOPOLOGY", "LOAD_OVERLAY", "TRUST_ZONE_HIGHLIGHTING"],
    rendered_at = now(),
    data_timestamp = historical_graph.generated_at,
    is_historical = True
  )
  
  RETURN historical_frame
```

---

## Integration

**Called by:**
- `operational-command-center/enterprise-operations-console.md` — topology panel
- Human operators — primary topology visualization interface

**Calls:**
- `runtime-topology/runtime-topology-maps.md` — base topology graph
- `runtime-topology/service-mesh-topology.md` — mesh health overlay
- `operational-command-center/orchestration-heatmaps.md` — heatmap overlay
- `enterprise-telemetry/enterprise-event-bus.md` — live flow data

**Writes to:** `memory/orchestration-observability/viewer-state.yaml`
