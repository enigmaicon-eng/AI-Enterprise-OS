# Abnormal Orchestration Behavior Detection
**ID:** AIT-AOB-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Detects agents misusing their legitimate orchestration roles to pursue unauthorized objectives — routing tasks in ways that evade governance, inserting adversarial instructions into downstream workflows, abusing fan-out authority to initiate unauthorized operations, or manipulating workflow topology to concentrate control or bypass oversight. Orchestration abuse is a highest-impact insider threat: an orchestrator agent has structural authority to direct other agents, making its compromise a force multiplier for any underlying attack. Normal orchestration is deterministic and auditable; abnormal orchestration is characterized by routing surprises, governance evasion, and unexplained structural deviation.

---

## Orchestration Abuse Taxonomy

```yaml
orchestration_abuse_taxonomy:

  UNAUTHORIZED_TASK_ROUTING:
    definition: orchestrator routes tasks to agents, tiers, or workflow branches
                that are not authorized for the task type, bypassing governance
                gates that would trigger on the correct routing path
    examples:
      - routing a PRIVILEGED operation through a T1 agent to avoid PRIVILEGED_ACCESS_WORKFLOW
      - routing a financial action through a non-financial workflow agent chain
    severity: CRITICAL
    
  INSTRUCTION_INJECTION_VIA_ROUTING:
    definition: orchestrator inserts adversarial instructions or context into
                task payloads during routing — the downstream agent receives a
                different task than the originating agent dispatched
    examples:
      - modifying HandoffPacket content between receipt and forwarding
      - prepending covert instructions to task descriptions before delegation
    severity: CRITICAL
    
  GOVERNANCE_GATE_BYPASS_ROUTING:
    definition: orchestrator routes around required approval nodes, compliance
                checks, or policy evaluation gates by constructing workflow
                paths that skip mandatory stops
    examples:
      - dispatching directly to execution engine, bypassing approval-workflow-engine
      - routing around compliance-checks/ agents for flagged operations
    severity: CRITICAL
    
  UNAUTHORIZED_WORKFLOW_INSTANTIATION:
    definition: orchestrator spawns workflows it is not authorized to instantiate,
                or instantiates authorized workflow types with parameters outside
                the authorized parameter space
    examples:
      - spawning an emergency workflow outside emergency conditions
      - instantiating a PRIVILEGED_OPERATION workflow without required JIT grant
    severity: CRITICAL
    
  FAN_OUT_ABUSE:
    definition: orchestrator issues an unusually large fan-out of parallel tasks
                to create computational load, consume approval queue capacity,
                or initiate multiple unauthorized operations under a single authorization
    severity: HIGH to CRITICAL
    
  TOPOLOGY_MANIPULATION:
    definition: orchestrator progressively restructures workflow topology over time —
                inserting itself into routing paths it was not assigned, removing
                oversight nodes from paths, or creating shortcuts that bypass controls
    severity: CRITICAL
```

---

## Detection Rules

```yaml
abnormal_orchestration_detection_rules:

  AOB-001:
    name: "Unauthorized Routing Path"
    condition: |
      orchestrator routes task_type X to agent_path P WHERE:
        P NOT IN authorized_routing_paths[task_type X]
        AND task_type X has defined routing constraints
    severity: CRITICAL
    auto_action: intercept_routing; alert_T3; reroute_to_authorized_path; flag_orchestrator
    
  AOB-002:
    name: "HandoffPacket Content Modification"
    condition: |
      HandoffPacket.content_hash AT dispatch != HandoffPacket.content_hash AT delivery
      (orchestrator modified payload in transit)
    severity: CRITICAL
    auto_action: block_delivery; alert_T3; forensic_log; security_incident; quarantine_orchestrator
    # HandoffPackets are sealed at dispatch; any modification = CRITICAL
    
  AOB-003:
    name: "Mandatory Governance Gate Skipped"
    condition: |
      task of type requiring governance_gate G was routed AND:
        gate G does NOT appear in the task's routing trace
        AND the task was NOT exempted via an authorized exception record
    severity: CRITICAL
    auto_action: block_downstream_execution; alert_T3; T4_notification; rollback_if_possible
    
  AOB-004:
    name: "Unauthorized Workflow Instantiation"
    condition: |
      orchestrator spawns workflow W WHERE:
        W NOT IN orchestrator.authorized_instantiable_workflows
        OR instantiation_params are outside W.authorized_parameter_ranges
    severity: CRITICAL
    auto_action: terminate_spawned_workflow; alert_T3; log_instantiation_attempt
    
  AOB-005:
    name: "Abnormal Fan-Out Volume"
    condition: |
      orchestrator dispatches > 3× historical_fan_out_rate in a single session
      WITHOUT a corresponding approved high-volume workflow record
    severity: HIGH
    auto_action: rate_limit_orchestrator_fan_out; alert_T2; T3_review_required
    
  AOB-006:
    name: "Governance-Adjacent Routing Avoidance"
    condition: |
      orchestrator's routing choices CONSISTENTLY avoid compliance-adjacent agents
      correlation(routing_path, excludes_compliance_agent) > 0.70
      ACROSS >= 10 routing decisions
    severity: CRITICAL
    auto_action: alert_T3; mandatory_compliance_gate_injection; orchestrator_audit
    # Systematic avoidance = purposeful, not accidental
    
  AOB-007:
    name: "Self-Insertion into Unauthorized Routing Paths"
    condition: |
      orchestrator appears in routing paths for workflow types WHERE:
        orchestrator NOT IN authorized_orchestrators[workflow_type]
        AND insertion is not from an authorized delegation
    severity: CRITICAL
    auto_action: remove_orchestrator_from_path; alert_T3; reroute_to_authorized_orchestrator
    
  AOB-008:
    name: "Downstream Agent Instruction Override"
    condition: |
      orchestrator issues instructions to downstream agent that CONTRADICT
      or OVERRIDE the downstream agent's constitutional constraints or
      behavioral contract parameters
    severity: CRITICAL
    auto_action: block_instruction; alert_T3; alert_downstream_agent; security_incident
    # Orchestrators may DIRECT within authorized scope; they may not OVERRIDE constraints
    
  AOB-009:
    name: "Orchestration Topology Drift"
    condition: |
      graph_similarity(current_orchestration_topology, baseline_topology) < 0.85
      WITHOUT corresponding authorized topology modification record
      # Measured as structural similarity of routing graph over time
    severity: CRITICAL
    auto_action: revert_to_authorized_topology; alert_T3; T4_notification
    
  AOB-010:
    name: "Recursive Orchestration Depth Violation"
    condition: |
      orchestration_depth > MAX_ORCHESTRATION_DEPTH (= 4)
      # Hard limit from recursive-exploit-prevention
    severity: CRITICAL
    auto_action: break_chain_at_depth_limit; alert_T3; prevent_further_delegation
```

---

## Orchestration Baseline

```
OrchestratorBaseline:
  # Per-orchestrator behavioral baseline for routing pattern detection

  orchestrator_id: IDN-{NNN}
  
  authorized_workflow_types: [workflow types this orchestrator may instantiate]
  authorized_routing_paths:
    task_type → [list of authorized agent paths]
  authorized_fan_out_range: { min, max, baseline_mean }
  authorized_downstream_agents: [agent IDs this orchestrator may direct]
  
  routing_pattern_baseline:
    path_distribution: { path_id: historical_frequency }
    governance_gate_inclusion_rate: float  # how often governance gates appear in routes
    avg_fan_out: float
    path_entropy: float  # diversity of routing choices (high entropy = varied; low = concentrated)
    
  topology_hash: sha256(routing_graph_structure)
  baseline_updated_at: ISO8601
  baseline_authorized_by: IDN-{NNN}
```

---

## Routing Audit Trail

```
record_routing_decision(orchestrator_id, task, routing_decision):
  # Called for every routing decision made by every orchestrator
  
  record = RoutingRecord {
    id: "RTE-{NNN}",
    orchestrator_id: orchestrator_id,
    task_id: task.id,
    task_type: task.type,
    routing_decision: routing_decision,
    selected_path: routing_decision.path,
    governance_gates_in_path: identify_governance_gates(routing_decision.path),
    authorization_record: routing_decision.authorization,
    handoff_packet_hash: sha256(routing_decision.payload),
    timestamp: now()
  }

  # Validate against authorized routing paths
  if routing_decision.path NOT IN orchestrator_baseline.authorized_routing_paths[task.type]:
    trigger_AOB_001(orchestrator_id, task, routing_decision)

  # Check for mandatory governance gates
  for gate in get_required_gates(task.type):
    if gate NOT IN record.governance_gates_in_path:
      trigger_AOB_003(orchestrator_id, task, gate)

  write_routing_record(record)
  Return: record
```

---

## Governance Gate Registry

```yaml
governance_gate_registry:
  # Mandatory gates by task type — all routing paths for these task types must include these gates

  PRIVILEGED_OPERATION:
    required_gates: [privileged-access-manager, policy-decision-point, approval-workflow-engine]
    bypass_permitted: false
    
  FINANCIAL_TRANSACTION_ABOVE_THRESHOLD:
    required_gates: [approval-workflow-engine, compliance-checks/financial-compliance, audit-manager]
    bypass_permitted: false
    
  CONSTITUTIONAL_GOVERNANCE_MODIFICATION:
    required_gates: [constitutional-governor, quorum-validator, T5_board_notification_gate]
    bypass_permitted: NEVER (hard-coded exclusion from bypass eligibility)
    
  AGENT_LIFECYCLE_CHANGE:
    required_gates: [identity-registry, authorization-engine, T3_approval_gate]
    bypass_permitted: false
    
  EXTERNAL_SYSTEM_WRITE:
    required_gates: [policy-decision-point, connector-authorization-gate]
    bypass_permitted: false
    
  DATA_EXPORT_SENSITIVE:
    required_gates: [data-classification-gate, compliance-checks/privacy-compliance, approval-workflow-engine]
    bypass_permitted: false
```

---

## Orchestration Health Score

```
compute_orchestration_health(orchestrator_id):

  # Check routing compliance rate (last 7 days)
  routing_records = get_routing_records(orchestrator_id, days=7)
  authorized_routes = [r for r in routing_records if r.path IN authorized_routing_paths]
  routing_compliance = len(authorized_routes) / len(routing_records) if routing_records else 1.0

  # Check governance gate inclusion rate
  gated_tasks = [r for r in routing_records if task_requires_gates(r.task_type)]
  proper_gated = [r for r in gated_tasks if all_required_gates_present(r)]
  gate_compliance = len(proper_gated) / len(gated_tasks) if gated_tasks else 1.0

  # Check topology stability
  topology_similarity = get_topology_similarity(orchestrator_id)

  # Check active AOB violations
  active_violations = get_active_aob_records(orchestrator_id, status=OPEN)
  violation_deduction = sum([20 if v.severity == CRITICAL else 8 for v in active_violations])

  base_score = (
    routing_compliance * 0.40 +
    gate_compliance * 0.40 +
    topology_similarity * 0.20
  ) * 100

  final_score = max(0, base_score - violation_deduction)
  rag = GREEN if final_score >= 90 else AMBER if final_score >= 70 else RED

  Return: OrchestrationHealth {
    score: final_score,
    rag: rag,
    routing_compliance: routing_compliance,
    gate_compliance: gate_compliance,
    topology_similarity: topology_similarity,
    active_violations: len(active_violations)
  }
```

---

## Integration

```
Feeds into:
  insider-threats/insider-threat-engine.md — AIT_CLASS_3 findings
  adversarial-defense/coordination-attack-detection.md — orchestration-level coordination signals
  cognition-security/organizational-manipulation-detection.md — routing manipulation signals

Receives from:
  workflow-engine/dag-engine.md — all task routing events
  execution-runtime/execution-engine.md — fan-out and execution events
  cognition-security/organizational-manipulation-detection.md — HandoffPacket integrity violations
  authorization/authorization-engine.md — authorization decisions on workflow instantiation
  delegation-and-trust/trust-propagation-engine.md — orchestrator delegation changes
```

---

## Governance

**Every routing decision is audited:** All orchestrator routing decisions are recorded with HandoffPacket hash, governance gates present, and path validation result — there is no unaudited routing path in the OS  
**HandoffPacket integrity is end-to-end:** Packets are sealed at dispatch with content_hash; orchestrators may read but never modify; modification detection (AOB-002) triggers quarantine  
**Constitutional workflow gates are never bypass-eligible:** Any task_type touching constitutional governance has a never-bypass governance gate set; AOB-003 fires regardless of claimed authorization  
**Orchestration topology is under configuration control:** Routing graphs are versioned and hash-tracked; AOB-009 prevents topology drift even when individual routing decisions appear authorized  
**Audit:** All orchestration behavior events to `memory/insider-threats/orchestration-audit.jsonl`; 10-year retention
