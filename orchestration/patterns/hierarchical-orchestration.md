# Hierarchical Orchestration

## Purpose
Defines the complete operational model for hierarchical multi-agent orchestration — how coordinators assign work to subordinates, how authority flows through the hierarchy, how outputs are reviewed and combined, and how escalation travels upward. Hierarchical orchestration is the primary pattern for governed, high-stakes, and complex multi-agent tasks.

---

## Hierarchy Architecture

```
[Human Sponsor / Executive Tier]        ← escalation terminus
         ↓ (authority grant)
[Apex Coordinator (T3+)]               ← overall task authority
    ├── [Domain Coordinator A (T2+)]   ← domain-level authority
    │       ├── [Worker A1 (T1+)]
    │       └── [Worker A2 (T1+)]
    └── [Domain Coordinator B (T2+)]
            ├── [Worker B1 (T1+)]
            └── [Worker B2 (T1+)]

Authority Flow: downward (delegation)
Work Flow:      upward (artifact delivery)
Escalation:     upward (unresolved issues)
Reporting:      upward (status, completion, risk)
```

---

## Role Definitions

```yaml
roles:
  APEX_COORDINATOR:
    description: Holds the task charter; responsible for final integrated output; highest authority
    capabilities_required: [multi_agent_orchestration, task_decomposition, synthesis_and_integration]
    minimum_tier: 3
    responsibilities:
      - decompose task into domain sub-tasks
      - assign domain coordinators via agent-discovery-engine
      - define deliverable schemas for each sub-task
      - receive and integrate domain outputs
      - conduct final quality review
      - deliver integrated output or escalate
      - maintain task-level audit log
    authority:
      - can reassign domain coordinators mid-task
      - can escalate to human sponsor
      - cannot exceed scope of task charter
  
  DOMAIN_COORDINATOR:
    description: Manages a bounded sub-domain of the task; responsible for domain deliverable
    capabilities_required: [workflow_execution, task_decomposition]
    minimum_tier: 2
    responsibilities:
      - receive domain sub-task from apex coordinator
      - decompose into worker assignments
      - assign workers via agent-discovery-engine
      - review worker outputs
      - combine domain outputs into domain deliverable
      - report domain status to apex coordinator
      - escalate to apex coordinator when needed
    authority:
      - can reassign workers within domain
      - cannot change domain scope without apex coordinator approval
      - cannot escalate directly to human (must go through apex coordinator)
  
  WORKER:
    description: Executes a specific task unit; produces atomic deliverable
    minimum_tier: 1
    responsibilities:
      - receive task assignment and deliverable schema
      - execute task using authorized capabilities and skills
      - apply appropriate reasoning protocol
      - produce output conforming to schema
      - report completion or blockers to domain coordinator
    authority:
      - can request clarification from domain coordinator
      - can invoke confidence-based escalation (see confidence-threshold-system)
      - cannot self-assign new tasks or recruit other agents
```

---

## Task Decomposition Protocol

```yaml
task_decomposition:
  inputs: [task_charter, available_agents, time_constraints, governance_level]
  
  decomposition_steps:
    step_1_boundary_analysis:
      action: identify clear domain boundaries in the task (where expertise specializes)
      output: domain_list with scope definitions
      guard: no domain boundary should depend on output from another domain (minimize coupling)
    
    step_2_dependency_mapping:
      action: map dependencies between domains (which domains need others' outputs?)
      output: dependency_graph (DAG; cycles flagged as decomposition error)
      use: determines sequencing vs. parallelism
    
    step_3_agent_sizing:
      action: estimate effort per domain; determine how many workers each domain needs
      inputs: task complexity estimate, agent capacity from registry
      output: per-domain worker_count recommendation
    
    step_4_deliverable_schema_definition:
      action: define the exact output schema each domain coordinator must deliver
      requirement: schema must be specified before domain coordinators begin work
      format: structured artifact per templates/artifact-templates/
    
    step_5_timeline_allocation:
      action: assign time budgets to each domain; compute critical path
      method: CPM (Critical Path Method); domains on critical path get priority agents
    
    step_6_assignment:
      action: use agent-discovery-engine (PRECISE mode) to find domain coordinators and workers
      assign: task charter + deliverable schema + time budget + escalation path
  
  decomposition_output:
    task_tree:
      root: apex_coordinator
      branches: [{domain_coordinator, scope, deliverable_schema, workers, deadline}]
      dependencies: [{from_domain, to_domain, dependency_type}]
    decomposition_record: persisted in task audit log
```

---

## Status Reporting Protocol

```yaml
status_reporting:
  cadence:
    worker → domain_coordinator: on task completion or at milestone; not more than every 5 minutes
    domain_coordinator → apex_coordinator: every 15 minutes; immediately on blocker
    apex_coordinator → human_sponsor: every 30 minutes for tasks > 2 hours; immediately on escalation
  
  status_report_schema:
    reporter_id: agent_id
    reported_to: agent_id | human_id
    task_id: string
    timestamp: ISO-8601
    status: ON_TRACK | AT_RISK | BLOCKED | COMPLETED
    percent_complete: int (0–100)
    completed_deliverables: [deliverable_id]
    pending_deliverables: [deliverable_id]
    blockers: [{description, severity, resolution_attempted}]
    risks: [{description, likelihood, impact, mitigation}]
    next_checkpoint: ISO-8601
  
  BLOCKED_status_handling:
    immediate_action: domain_coordinator escalates to apex_coordinator within 5 minutes
    apex_coordinator_response:
      option_1: provide guidance (unblock)
      option_2: reassign blocked task to different worker
      option_3: escalate to human sponsor
    timeout: if blocker unresolved after 30 minutes → automatic human escalation
```

---

## Output Integration Protocol

```yaml
output_integration:
  domain_output_delivery:
    format: structured artifact conforming to deliverable_schema
    includes: [content, confidence_score, assumptions, limitations, provenance]
    validation: schema validation + quality check before apex coordinator accepts
    rejection_handling: domain coordinator notified; has 20% of original time budget to correct
  
  apex_integration_process:
    step_1_completeness_check: all required domains delivered?
    step_2_consistency_check: no contradictions across domain outputs?
    step_3_synthesis: combine into integrated deliverable
    step_4_gap_analysis: does integrated output answer the original task charter?
    step_5_quality_review: apply appropriate quality evaluation (see agent-skill-registry SKILL-EVL-001)
    step_6_confidence_assessment: compute aggregate confidence for integrated output
    
  conflict_resolution:
    MINOR_CONFLICT (domain outputs partially inconsistent): apex_coordinator resolves using judgment
    MAJOR_CONFLICT (fundamental contradiction): pause integration; request clarification from domains
    UNRESOLVABLE_CONFLICT: escalate to human sponsor with full conflict documentation
  
  integrated_output_schema:
    task_id: string
    deliverable: content (type varies by task)
    confidence_score: float
    contributing_agents: [agent_id]
    domain_outputs: [reference to each domain deliverable]
    conflicts_noted: [conflict description if any]
    assumptions: [list]
    limitations: [list]
    provenance: full task_tree snapshot
```

---

## Escalation Protocol

```yaml
escalation_protocol:
  escalation_triggers:
    TECHNICAL_BLOCKER: task cannot proceed without missing information/capability
    SCOPE_CREEP: task requirements expanded beyond original charter
    TIME_BREACH: task will exceed time budget by > 20%
    QUALITY_GATE_FAIL: integrated output fails quality review (< 0.60 quality score)
    SAFETY_CONCERN: any agent flags potential safety, governance, or ethical issue
    RESOURCE_CONFLICT: required agents unavailable or insufficient capacity
    UNRESOLVABLE_CONFLICT: domain outputs irreconcilably contradictory
  
  escalation_path:
    worker → domain_coordinator (immediate)
    domain_coordinator → apex_coordinator (within 5 minutes)
    apex_coordinator → human_sponsor (within 15 minutes for HIGH severity; immediate for CRITICAL)
  
  escalation_record:
    escalator: agent_id
    escalated_to: agent_id | human_id
    trigger: escalation_trigger type
    context: full task state at time of escalation
    resolution: outcome (filled in when resolved)
    retained: in task audit log; 3-year retention
  
  non-escalatable:
    agents cannot withhold escalation to protect performance metrics
    POLICY: suppressing escalation when a trigger exists = governance violation
```

---

## Hierarchical Governance Controls

```yaml
governance_controls:
  task_charter_immutability:
    rule: task scope cannot be changed without human sponsor authorization
    enforcement: apex_coordinator checks charter on any scope-change request; escalates if changed
  
  anti_collusion:
    rule: domain coordinators cannot make agreements that override apex_coordinator authority
    enforcement: all inter-domain communication is cc'd to apex_coordinator
  
  audit_completeness:
    rule: full task_tree, all status reports, all escalations, all outputs retained
    retention: 3 years for standard tasks; 7 years for governance decisions
  
  minimum_review_before_delivery:
    T1_output_task: domain_coordinator review required
    T2_output_task: apex_coordinator review required
    T3_output_task: apex_coordinator + human supervisor review required
    T4_output_task: apex_coordinator + human + Tier-4 sign-off required
```

---

## Integration Points

| System | Role |
|---|---|
| `orchestration-patterns/orchestration-pattern-catalog.md` | Pattern definitions this file implements |
| `orchestration-patterns/orchestration-strategy-engine.md` | Selects this pattern for appropriate tasks |
| `agent-registry/agent-discovery-engine.md` | Finds coordinators and workers for each role |
| `delegation-and-trust/delegation-model.md` | Authority delegation from apex to domain coordinators |
| `delegation-and-trust/authority-transfer-protocol.md` | Formal authority transfer at each hierarchy level |
| `coordination-operations/work-distribution-engine.md` | Task assignment within the hierarchy |
| `coordination-operations/orchestration-failure-recovery.md` | Recovery when hierarchy nodes fail |
