# Dependency Impact Analyzer

**System ID:** `dependency-impact-analyzer`
**Role:** Analyzes the downstream impact of failures, slowdowns, and changes in the workflow dependency graph — computes blast radius for any given workflow or agent failure, estimates cascade delays across the dependency chain, identifies the minimum set of interventions to isolate an impact, and generates impact reports for operators making intervention decisions
**Storage:** `memory/orchestration-observability/impact-analyses.jsonl`

---

## Purpose

Before an operator intervenes in a live system, they need to know: "If I cancel this workflow, what else breaks? If this agent is suspended, which runs will stall? If this approval takes 2 more hours, how many downstream SLOs will breach?" The dependency impact analyzer answers these questions quantitatively — turning dependency maps into actionable impact assessments before the operator commits to an action.

---

## Impact Analysis Types

```yaml
ImpactAnalysisTypes:
  
  WORKFLOW_FAILURE_IMPACT:
    description: "If workflow X fails, what downstream workflows are affected?"
    inputs: [run_id]
    outputs: [blast_radius, cascade_chain, slo_breaches, estimated_delay]
  
  AGENT_SUSPENSION_IMPACT:
    description: "If agent/org Y is suspended, which in-flight workflows stall?"
    inputs: [agent_id or org_id]
    outputs: [affected_runs, estimated_stall_duration, alternative_agents]
  
  APPROVAL_DELAY_IMPACT:
    description: "If approval X takes N more minutes, what is the end-to-end SLO impact?"
    inputs: [approval_id, additional_delay_minutes]
    outputs: [affected_runs, slo_breach_count, estimated_total_delay]
  
  INTERVENTION_SAFETY_CHECK:
    description: "Is it safe to apply intervention X without cascade failures?"
    inputs: [intervention_type, target_id]
    outputs: [safe_to_proceed, risks, minimum_blast_radius, recommendations]
  
  POLICY_CHANGE_IMPACT:
    description: "If policy P changes, which in-flight workflows are affected by drift?"
    inputs: [policy_id, new_policy_version]
    outputs: [affected_runs, drift_severity, revalidation_required]
```

---

## Impact Analysis Engine

```
analyze_workflow_failure_impact(run_id) → WorkflowFailureImpactReport:
  
  dep_map = workflow_dependency_maps.get_current_dependency_map()
  
  # 1. Blast radius: which runs depend on this one?
  blast_radius = workflow_dependency_maps.assess_failure_blast_radius(run_id)
  
  # 2. Cascade delay estimation
  cascade_chains = build_cascade_chains(run_id, dep_map)
  
  delayed_runs = []
  slo_breach_predictions = []
  
  FOR chain in cascade_chains:
    FOR i, dependent_run_id in enumerate(chain.run_ids[1:]):   # Skip root
      upstream_delay = estimate_failure_delay(run_id)
      propagation = chain.delay_multipliers[i]
      estimated_delay = upstream_delay × propagation
      
      # Check against SLO
      slo_status = compute_run_slo_status(dependent_run_id)
      time_to_breach = slo_status.slack_seconds
      
      delayed_runs.append(DelayedRunEstimate(
        run_id = dependent_run_id,
        estimated_additional_delay_seconds = estimated_delay,
        current_slack_seconds = time_to_breach,
        will_breach_slo = estimated_delay > time_to_breach,
        chain_distance = i + 1
      ))
      
      IF estimated_delay > time_to_breach:
        slo_breach_predictions.append(SLOBreachPrediction(
          run_id = dependent_run_id,
          breach_in_seconds = max(0, time_to_breach - estimated_delay),
          confidence = estimate_prediction_confidence(chain, i)
        ))
  
  # 3. Minimum intervention set
  intervention = identify_minimum_intervention(blast_radius, cascade_chains)
  
  report = WorkflowFailureImpactReport(
    root_run_id = run_id,
    directly_affected_count = blast_radius.directly_affected,
    total_affected_count = blast_radius.total_affected_runs,
    affected_run_ids = blast_radius.affected_run_ids,
    propagation_depth = blast_radius.propagation_depth,
    cascade_chains = cascade_chains,
    delayed_runs = delayed_runs,
    slo_breach_predictions = slo_breach_predictions,
    slo_breach_count = len(slo_breach_predictions),
    intervention_recommendation = intervention,
    severity = blast_radius.severity,
    analyzed_at = now()
  )
  
  append_impact_analysis(report)
  RETURN report

analyze_agent_suspension_impact(agent_id) → AgentSuspensionImpactReport:
  
  active_runs = dag_runtime.get_all_active_runs()
  
  # Find all runs that have nodes currently assigned to or awaiting this agent
  affected_runs = []
  FOR run in active_runs:
    run_detail = workflow_command_center.get_workflow_detail(run.run_id)
    
    # Check current nodes
    agent_nodes = [n for n in run_detail.dag.nodes
                   if n.assigned_agent_id == agent_id and n.state in ["RUNNING", "PENDING"]]
    
    IF agent_nodes:
      stall_duration = estimate_agent_stall_duration(agent_id, agent_nodes)
      slo_status = compute_run_slo_status(run.run_id)
      
      affected_runs.append(AffectedRunSummary(
        run_id = run.run_id,
        definition_id = run.definition_id,
        affected_node_count = len(agent_nodes),
        estimated_stall_seconds = stall_duration,
        will_breach_slo = stall_duration > slo_status.slack_seconds,
        mitigation = find_alternative_agent(agent_id, agent_nodes)
      ))
  
  # Find alternative agents that could handle the suspended agent's tasks
  alternatives = find_agent_alternatives(agent_id)
  
  RETURN AgentSuspensionImpactReport(
    agent_id = agent_id,
    affected_run_count = len(affected_runs),
    affected_runs = affected_runs,
    slo_breach_count = sum(1 for r in affected_runs if r.will_breach_slo),
    total_stall_seconds = sum(r.estimated_stall_seconds for r in affected_runs),
    alternative_agents = alternatives,
    safe_to_suspend = len([r for r in affected_runs if r.will_breach_slo]) == 0,
    analyzed_at = now()
  )

analyze_approval_delay_impact(approval_id, additional_delay_minutes) → ApprovalDelayImpactReport:
  
  approval = cryptographic_approval_engine.load_pending_request(approval_id)
  IF NOT approval:
    RETURN ApprovalDelayImpactReport(found=False)
  
  run_id = approval.subject.run_id
  additional_delay_seconds = additional_delay_minutes × 60
  
  # Direct SLO impact
  slo_status = compute_run_slo_status(run_id)
  direct_breach = additional_delay_seconds > slo_status.slack_seconds
  
  # Cascade impact (downstream runs that depend on this run completing)
  dep_map = workflow_dependency_maps.get_current_dependency_map()
  downstream_deps = [d for d in dep_map.dependencies if d.upstream_run_id == run_id]
  
  cascade_impacts = []
  FOR dep in downstream_deps:
    downstream_slo = compute_run_slo_status(dep.downstream_run_id)
    propagated_delay = additional_delay_seconds × dep.delay_propagation_multiplier
    
    cascade_impacts.append(CascadeImpact(
      run_id = dep.downstream_run_id,
      propagated_delay_seconds = propagated_delay,
      will_breach_slo = propagated_delay > downstream_slo.slack_seconds
    ))
  
  RETURN ApprovalDelayImpactReport(
    approval_id = approval_id,
    run_id = run_id,
    additional_delay_minutes = additional_delay_minutes,
    direct_slo_breach = direct_breach,
    direct_slack_remaining_seconds = slo_status.slack_seconds,
    cascade_impact_count = len(cascade_impacts),
    cascade_slo_breaches = sum(1 for c in cascade_impacts if c.will_breach_slo),
    cascade_impacts = cascade_impacts,
    recommendation = (
      "EXPEDITE_APPROVAL" if direct_breach or any(c.will_breach_slo for c in cascade_impacts)
      else "ACCEPTABLE_DELAY"
    ),
    analyzed_at = now()
  )

check_intervention_safety(intervention_type, target_id) → InterventionSafetyReport:
  
  risks = []
  
  IF intervention_type == "WORKFLOW_CANCEL":
    impact = analyze_workflow_failure_impact(target_id)
    IF impact.slo_breach_count > 0:
      risks.append(InterventionRisk(
        risk_type = "CASCADE_SLO_BREACHES",
        severity = "HIGH",
        description = f"Cancelling this workflow will cause {impact.slo_breach_count} downstream SLO breaches",
        affected_runs = [p.run_id for p in impact.slo_breach_predictions]
      ))
    IF impact.total_affected_count > 5:
      risks.append(InterventionRisk(
        risk_type = "HIGH_BLAST_RADIUS",
        severity = "MEDIUM",
        description = f"Cancellation affects {impact.total_affected_count} downstream workflows"
      ))
  
  ELIF intervention_type == "AGENT_SUSPENSION":
    impact = analyze_agent_suspension_impact(target_id)
    IF NOT impact.safe_to_suspend:
      risks.append(InterventionRisk(
        risk_type = "IN_FLIGHT_SLO_BREACHES",
        severity = "HIGH",
        description = f"Suspending this agent will breach {impact.slo_breach_count} active workflow SLOs"
      ))
  
  RETURN InterventionSafetyReport(
    intervention_type = intervention_type,
    target_id = target_id,
    safe_to_proceed = len([r for r in risks if r.severity == "HIGH"]) == 0,
    risks = risks,
    recommendation = "PROCEED" if not risks else "REVIEW_RISKS_BEFORE_PROCEEDING",
    analyzed_at = now()
  )
```

---

## Integration

**Called by:**
- `operational-command-center/runtime-intervention-interfaces.md` — pre-intervention safety check
- `operational-command-center/workflow-command-center.md` — workflow failure impact view
- Human operators — impact investigation before decisions

**Calls:**
- `runtime-topology/workflow-dependency-maps.md` — dependency graph and blast radius
- `orchestration-dags/dag-runtime.md` — active run state
- `governance-attestation/cryptographic-approval-engine.md` — pending approval state

**Writes to:** `memory/orchestration-observability/impact-analyses.jsonl`
