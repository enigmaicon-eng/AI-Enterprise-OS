# Risk-Aware Router

## Purpose
Integrates live risk intelligence from the enterprise risk register and control effectiveness monitor into every routing decision the orchestration system makes. Standard routing finds the best-capable, most-available agent for a task. Risk-aware routing goes further: it adjusts routing decisions based on the current risk posture of the domain, the risk profile of the task, and the compliance state of candidate agents — ensuring that high-risk work goes to agents with verified compliance standing, that failing controls automatically redirect work through compensating paths, and that elevated-risk periods trigger more conservative orchestration choices.

---

## Risk Routing Architecture

```
Routing Request
        ↓
[1. Task Risk Profile]         → determine the risk level of this task
        ↓
[2. Domain Risk Check]         → what is the current risk posture of this domain?
        ↓
[3. Candidate Evaluation]      → score each candidate agent for risk-adjusted fit
        ↓
[4. Constraint Application]    → apply risk-based constraints to candidate set
        ↓
[5. Route Selection]           → select route; apply risk-aware conditions
        ↓
[6. Route Monitoring Directive] → attach enhanced monitoring for high-risk routes
        ↓
[7. Route Decision Record]     → log routing decision with risk rationale
```

---

## Task Risk Profile

```yaml
task_risk_profile:
  determination:
    step_1: lookup resource domain in enterprise-risk-register.md
    step_2: check if task relates to any CRITICAL or HIGH KRI currently AT_RISK
    step_3: check if task involves any control currently in DEGRADED or FAILED state
    step_4: check if task relates to obligations with approaching deadlines (< 30 days)
    step_5: apply task_type_risk_multiplier (see below)
    
    output:
      base_risk_level: CRITICAL | HIGH | MEDIUM | LOW
      risk_amplifiers: [string]    # list of factors increasing risk (AT_RISK KRI, FAILED control, etc.)
      risk_mitigators: [string]    # list of factors reducing risk (active compensating control, exception in place)
      effective_task_risk: CRITICAL | HIGH | MEDIUM | LOW
  
  task_type_risk_multiplier:
    AI_GOVERNANCE tasks: 1.5× (highest; EU AI Act exposure)
    DATA_PRIVACY tasks: 1.3× (GDPR/CCPA regulatory risk)
    SECURITY_CONFIGURATION tasks: 1.3×
    FINANCIAL_REPORTING tasks: 1.2×
    GOVERNANCE_APPROVAL tasks: 1.2×
    OPERATIONAL tasks: 1.0×
    RESEARCH tasks: 0.9×
    
    note: multipliers applied to base_risk_score; result mapped to effective_task_risk level
```

---

## Risk-Adjusted Candidate Scoring

```yaml
risk_adjusted_scoring:
  base_score: from agent-discovery-engine.md discovery_fit_score (5 components)
  
  risk_adjustments:
    POSITIVE_adjustments (increase score):
      high_governance_compliance_dimension:
        condition: agent.trust_score[GOVERNANCE_COMPLIANCE] >= 0.80
        adjustment: +0.10
        rationale: agents with high governance compliance track record preferred for risk-sensitive work
      
      no_open_findings:
        condition: agent has no open HIGH or CRITICAL compliance findings
        adjustment: +0.05
        rationale: agents with clean compliance standing preferred
      
      recent_training_in_domain:
        condition: agent has completed domain-specific training within 90 days
        adjustment: +0.05
      
      specialist_in_risk_domain:
        condition: agent.specialization matches task.resource_domain AND task.effective_task_risk >= HIGH
        adjustment: +0.10
    
    NEGATIVE_adjustments (decrease score):
      degraded_calibration:
        condition: agent.calibration_error > 0.15
        adjustment: -0.15
        rationale: poorly calibrated agents are risk for compliance decisions
      
      low_governance_trust:
        condition: agent.trust_score[GOVERNANCE_COMPLIANCE] < 0.55
        adjustment: -0.20
      
      open_critical_finding:
        condition: agent has open CRITICAL compliance finding
        adjustment: -0.30
      
      recent_escalation:
        condition: agent triggered escalation in same domain within last 7 days
        adjustment: -0.10
      
      high_current_load:
        condition: agent.load_factor > 0.85
        adjustment: -0.20
        rationale: overloaded agents more prone to quality degradation under pressure
  
  minimum_score_by_task_risk:
    CRITICAL_task: minimum_score = 0.70 (higher than standard 0.40 threshold)
    HIGH_task: minimum_score = 0.55
    MEDIUM_task: minimum_score = 0.45
    LOW_task: minimum_score = 0.40 (standard threshold)
  
  disqualification_rules:
    CRITICAL_task_to_agent_with_open_CRITICAL_finding: DISQUALIFIED (agent removed from candidate set)
    HIGH_task_to_agent_with_calibration_error_>_0.20: DISQUALIFIED
    GOVERNANCE_task_to_agent_without_GOVERNANCE_trust_score: DISQUALIFIED
    AI_GOVERNANCE_task_to_agent_in_SUSPENDED_state: DISQUALIFIED
```

---

## Domain Risk Routing Rules

```yaml
domain_risk_routing:
  CRITICAL_domain_risk:
    # domain's risk posture is CRITICAL (from enterprise-risk-register.md)
    routing_adjustments:
      - minimum_candidate_tier: increase by 1 (LOW tasks become MEDIUM tier requirement)
      - require_peer_review: all outputs in CRITICAL-risk domain require independent review
      - enhanced_monitoring_mandatory: monitoring_directive = INTENSIVE
      - no_tier1_agents_for_domain: regardless of task_risk_level
    approval_required: Tier-3+ approval before any HIGH+ blast_radius action in domain
  
  FAILED_control_routing:
    # a control that governs this task domain is in FAILED state
    routing_adjustments:
      - avoid_agents_who_depend_on_failed_control: agents whose work requires FAILED control are deprioritized
      - compensating_control_agent_preferred: agents capable of operating with compensating control preferred
      - require_manual_verification: automated steps that relied on failed control must be manually verified
    monitoring: INTENSIVE
    finding_generated: MEDIUM finding for routing through FAILED control domain
  
  AT_RISK_KRI_routing:
    # one or more KRIs for this domain are AT_RISK
    routing_adjustments:
      - prefer_specialist_agents: generalist agents deprioritized; specialists with domain certification preferred
      - require_documented_approach: agent must document approach before starting task (not just at completion)
    escalation_threshold_lowered: escalate to compliance governance lead if task_risk >= HIGH
  
  pre_exam_mode_routing:
    # enterprise is within 90 days of a regulatory examination
    trigger: regulatory-change-management.md pre_exam_preparation is ACTIVE
    routing_adjustments:
      - no_new_exception_reliant_routes: routing that depends on active exceptions is blocked
      - highest_trust_agents_preferred: sort by GOVERNANCE_COMPLIANCE trust score descending
      - evidence_collection_mandatory: every task must generate evidence; routes without evidence generation capability deprioritized
```

---

## Route Decision Record

```yaml
route_decision_record:
  decision_id: "RTDEC-{workflow_id}-{task_id}-{timestamp}"
  
  task_context:
    task_id: string
    workflow_id: string
    effective_task_risk: CRITICAL | HIGH | MEDIUM | LOW
    risk_amplifiers: [string]
    domain_risk_level: CRITICAL | HIGH | MEDIUM | LOW
  
  routing_outcome:
    selected_agent: agent_id
    adjusted_score: float
    adjustment_details: [{factor_name, direction, amount, rationale}]
    disqualified_candidates: [{agent_id, disqualification_reason}]
    minimum_score_applied: float
    route_mode: STANDARD | RISK_ADJUSTED | DOMAIN_CRITICAL | FAILED_CONTROL | PRE_EXAM
  
  monitoring_directive:
    monitoring_level: STANDARD | ENHANCED | INTENSIVE
    review_required: boolean
    review_type: PEER_REVIEW | SUPERVISORY_REVIEW | COMPLIANCE_REVIEW
    evidence_generation_required: boolean
  
  metadata:
    decided_at: ISO-8601
    decided_by: RISK_AWARE_ROUTER
    rationale: string
```

---

## Monitoring Directives

```yaml
monitoring_directives:
  STANDARD:
    signal_check_frequency: per normal schedule (control-effectiveness-monitor.md)
    human_review: not required (unless triggered by other policy)
    evidence: per normal evidence collection schedule
  
  ENHANCED:
    signal_check_frequency: 15-minute checks (regardless of control's normal schedule)
    human_review: supervisory spot-check at 50% completion
    evidence: real-time evidence collection (not just scheduled)
    audit_trail: verify audit trail event generated for each major step
  
  INTENSIVE:
    signal_check_frequency: every 5 minutes
    human_review: human review required at each workflow phase boundary
    evidence: continuous evidence generation; hash-verified at each step
    audit_trail: full trace of every tool call; every intermediate output reviewed
    escalation_threshold: any anomaly → immediate escalation (no waiting for pattern)
```

---

## Integration Points

| System | Role |
|---|---|
| `risk-and-controls/enterprise-risk-register.md` | Domain risk levels and KRI status |
| `risk-and-controls/control-effectiveness-monitor.md` | FAILED/DEGRADED control detection |
| `agent-registry/agent-discovery-engine.md` | Base candidate scores adjusted here |
| `agent-performance/agent-performance-tracker.md` | Calibration error and compliance dimension scores |
| `orchestration-constraints/constraint-solver.md` | Feasibility pre-checked before risk-aware routing |
| `governance-operations/regulatory-change-management.md` | Pre-exam mode trigger |
| `governance-policies/governance-traceability.md` | Route decisions traceable to risk rationale |
