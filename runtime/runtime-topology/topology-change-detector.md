# Topology Change Detector

**System ID:** `topology-change-detector`
**Role:** Detects and classifies changes to the enterprise runtime topology — monitors agent registrations and deregistrations, trust zone membership changes, capability profile updates, new integration connections, and routing table changes; publishes topology change events that drive topology map updates and alert operators to significant structural changes
**Storage:** `memory/runtime-topology/topology-changes.jsonl`

---

## Purpose

A topology that is silently changing is a topology that will surprise you. An agent deregisters mid-workflow and no one notices until its tasks start timing out. A new integration registers with EXTERNAL trust tier when it should be ENTERPRISE. A capability profile is updated and suddenly an agent can no longer handle its routing category. The topology change detector watches for all these structural changes and surfaces them as actionable events before they cascade into operational incidents.

---

## Change Categories

```yaml
TopologyChangeCategories:
  
  AGENT_REGISTRATION:
    severity: INFO
    description: "New agent registered with capability manifest"
    triggers_routing_update: true
    requires_verification: false
  
  AGENT_DEREGISTRATION:
    severity: HIGH
    description: "Agent deregistered from the system"
    triggers_routing_update: true
    requires_verification: true      # Verify no tasks in flight
  
  AGENT_SUSPENSION:
    severity: HIGH
    description: "Agent suspended — all new routing to this agent halted"
    triggers_routing_update: true
    requires_verification: false
  
  CAPABILITY_PROFILE_CHANGE:
    severity: MEDIUM
    description: "Agent capability manifest updated — allowed tools or classification ceiling changed"
    triggers_routing_update: true
    requires_verification: true     # May break in-flight tasks expecting old capabilities
  
  TRUST_TIER_CHANGE:
    severity: HIGH
    description: "Agent trust tier changed (T2→T1, T3→T2, etc.)"
    triggers_routing_update: true
    requires_verification: true
  
  ZONE_MEMBERSHIP_CHANGE:
    severity: HIGH
    description: "Agent moved from one trust zone to another"
    triggers_boundary_update: true
    requires_verification: true
  
  ROUTING_RULE_ADDED:
    severity: MEDIUM
    description: "New routing rule added to the routing table"
    requires_verification: false
  
  ROUTING_RULE_MODIFIED:
    severity: HIGH
    description: "Existing routing rule changed"
    requires_verification: false
    triggers_audit: true
  
  INTEGRATION_REGISTERED:
    severity: MEDIUM
    description: "New MCP server or external integration registered"
    triggers_verification: true     # Verify trust tier is appropriate
  
  INTEGRATION_DEREGISTERED:
    severity: HIGH
    description: "Integration removed — dependent workflows may fail"
    requires_impact_assessment: true
  
  WORKER_POOL_CHANGE:
    severity: MEDIUM
    description: "Worker pool capacity or classification ceiling changed"
  
  BOUNDARY_POLICY_CHANGE:
    severity: HIGH
    description: "Trust boundary crossing policy modified"
    triggers_audit: true
    requires_verification: true
```

---

## Change Detection Engine

```
detect_topology_changes() → [TopologyChangeEvent]:
  
  # Load current state
  current_topology = runtime_topology_maps.get_current_graph()
  previous_topology = load_previous_topology_snapshot()
  
  changes = []
  
  # Agent changes
  current_agents = {n.node_id: n for n in current_topology.nodes if n.node_type == "AGENT"}
  previous_agents = {n.node_id: n for n in previous_topology.nodes if n.node_type == "AGENT"}
  
  # New agents
  FOR agent_id in set(current_agents) - set(previous_agents):
    agent = current_agents[agent_id]
    changes.append(TopologyChangeEvent(
      change_id = generate_uuid(),
      change_type = "AGENT_REGISTRATION",
      severity = "INFO",
      subject_id = agent_id,
      subject_name = agent.display_name,
      detected_at = now(),
      details = {trust_tier: agent.trust_tier, trust_zone: agent.trust_zone}
    ))
  
  # Removed agents
  FOR agent_id in set(previous_agents) - set(current_agents):
    agent = previous_agents[agent_id]
    
    # Check for in-flight tasks before reporting deregistration
    in_flight = check_agent_in_flight_tasks(agent_id)
    
    changes.append(TopologyChangeEvent(
      change_id = generate_uuid(),
      change_type = "AGENT_DEREGISTRATION",
      severity = "HIGH",
      subject_id = agent_id,
      subject_name = agent.display_name,
      detected_at = now(),
      details = {in_flight_task_count: in_flight, verification_required: in_flight > 0},
      requires_operator_action = in_flight > 0
    ))
  
  # Changed agents (trust tier, zone, status)
  FOR agent_id in set(current_agents) & set(previous_agents):
    prev = previous_agents[agent_id]
    curr = current_agents[agent_id]
    
    IF prev.trust_tier != curr.trust_tier:
      changes.append(TopologyChangeEvent(
        change_type = "TRUST_TIER_CHANGE",
        severity = "HIGH",
        subject_id = agent_id,
        details = {from_tier: prev.trust_tier, to_tier: curr.trust_tier},
        requires_operator_action = True
      ))
    
    IF prev.trust_zone != curr.trust_zone:
      changes.append(TopologyChangeEvent(
        change_type = "ZONE_MEMBERSHIP_CHANGE",
        severity = "HIGH",
        subject_id = agent_id,
        details = {from_zone: prev.trust_zone, to_zone: curr.trust_zone},
        requires_operator_action = True
      ))
    
    IF prev.status == "ACTIVE" AND curr.status == "SUSPENDED":
      changes.append(TopologyChangeEvent(
        change_type = "AGENT_SUSPENSION",
        severity = "HIGH",
        subject_id = agent_id,
        details = {previous_status: prev.status}
      ))
  
  # Routing rule changes
  routing_changes = detect_routing_rule_changes()
  changes.extend(routing_changes)
  
  # Integration changes
  integration_changes = detect_integration_changes()
  changes.extend(integration_changes)
  
  # Publish all detected changes
  FOR change in changes:
    enterprise_event_bus.publish(
      topic = "org.agent.lifecycle",
      event_type = f"TOPOLOGY_{change.change_type}",
      payload = change.to_dict(),
      priority = "HIGH" if change.severity in ["HIGH", "CRITICAL"] else "NORMAL"
    )
    
    append_to_change_log(change)
    
    IF change.requires_operator_action:
      enterprise_event_bus.publish(
        topic = "alerts.high",
        event_type = "TOPOLOGY_CHANGE_REQUIRES_ATTENTION",
        payload = {change_id: change.change_id, change_type: change.change_type, subject_id: change.subject_id},
        priority = "HIGH"
      )
  
  RETURN changes
```

---

## Capability Drift Detection

```
detect_capability_drift() → [CapabilityDriftEvent]:
  
  # Compare current capability manifests with what in-flight workflows expect
  active_runs = dag_runtime.get_all_active_runs()
  drifts = []
  
  FOR run in active_runs:
    # Get what capabilities the workflow needs from remaining nodes
    required_capabilities = extract_required_capabilities(run)
    
    FOR agent_id, required_caps in required_capabilities.items():
      current_manifest = capability_scope_controller.load_manifest(agent_id)
      
      IF current_manifest is null:
        drifts.append(CapabilityDriftEvent(
          drift_type = "AGENT_MISSING",
          run_id = run.run_id,
          agent_id = agent_id,
          severity = "CRITICAL",
          impact = f"Agent '{agent_id}' required by run but no longer registered"
        ))
        CONTINUE
      
      # Check tool access
      missing_tools = [t for t in required_caps.tools if t not in current_manifest.allowed_tools]
      IF missing_tools:
        drifts.append(CapabilityDriftEvent(
          drift_type = "CAPABILITY_PROFILE_CHANGE",
          run_id = run.run_id,
          agent_id = agent_id,
          severity = "HIGH",
          impact = f"Agent '{agent_id}' lost access to tools: {missing_tools}",
          details = {missing_tools: missing_tools}
        ))
  
  RETURN drifts
```

---

## Integration

**Called by:**
- `enterprise-telemetry/enterprise-event-bus.md` — subscribes to `org.agent.lifecycle`
- `runtime-topology/runtime-topology-maps.md` — triggers topology rebuild on changes
- `operational-command-center/orchestration-control-plane.md` — routing table changes

**Calls:**
- `enterprise-telemetry/enterprise-event-bus.md` — publishes change events and alerts
- `execution-security/capability-scope-controller.md` — capability manifest queries

**Writes to:** `memory/runtime-topology/topology-changes.jsonl`
