# Blast Radius Analyzer
**ID:** BRC-BRA-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Quantifies the potential damage scope of any agent action before execution and monitors scope expansion during live execution. The blast radius analyzer computes a composite score from the set of resources, agents, systems, and business functions that could be affected if an action fails, behaves unexpectedly, or is executed at full scale. High blast radius scores trigger escalated sandbox modes, additional authorization requirements, or execution blocks.

**Core use:** Pre-execution risk gate. If blast radius exceeds the declared bound, the action does not proceed.

---

## Blast Radius Definition

```
blast_radius(action) = f(
  affected_resource_count,
  affected_system_count,
  affected_agent_count,
  affected_business_function_count,
  criticality_weights,
  reversibility_factor
)

Blast radius is scored 0.00 – 1.00:
  0.00 – 0.19: MINIMAL   (single resource, internal only, fully reversible)
  0.20 – 0.39: LOW       (few resources, bounded to one system)
  0.40 – 0.59: MEDIUM    (multiple systems, limited agents affected)
  0.60 – 0.79: HIGH      (cross-org, multiple critical systems, significant agent count)
  0.80 – 1.00: CRITICAL  (enterprise-wide, constitutional-adjacent, or irreversible)
```

---

## Scoring Model

```
compute_blast_radius(action_descriptor, declared_scope) → BlastRadiusReport:

  DIMENSION 1 — Resource Scope (weight: 0.25)
    r_count = number of distinct resources in declared_scope
    r_criticality = avg(criticality_tier[r] for r in declared_scope)
      criticality_tier:
        CORE_DATA: 1.0
        FINANCIAL_RECORD: 0.9
        CUSTOMER_RECORD: 0.9
        AGENT_STATE: 0.7
        CONFIG: 0.8
        WORKFLOW_STATE: 0.6
        LOG: 0.2
    resource_score = min(1.0, r_count / 100) * 0.5 + r_criticality * 0.5

  DIMENSION 2 — System Scope (weight: 0.25)
    s_count = number of distinct systems/connectors touched
    s_criticality = avg(criticality_tier[s] for s in affected_systems)
      system_criticality:
        FINANCIAL_SYSTEM: 1.0
        AUTH_SYSTEM: 1.0
        PRODUCTION_DB: 0.9
        CRM: 0.8
        PROJECT_MGMT: 0.6
        ANALYTICS: 0.4
        INTERNAL_WIKI: 0.2
    system_score = min(1.0, s_count / 20) * 0.5 + s_criticality * 0.5

  DIMENSION 3 — Agent Scope (weight: 0.20)
    a_count = number of agents whose state could be affected
    a_autonomy_avg = avg(autonomy_level[a] for a in affected_agents)
    agent_score = min(1.0, a_count / 144) * 0.6 + (a_autonomy_avg / 5) * 0.4

  DIMENSION 4 — Business Function Scope (weight: 0.20)
    b_count = number of distinct business functions affected
    b_revenue_exposure = max revenue_at_risk / total_revenue (0.0 – 1.0)
    business_score = min(1.0, b_count / 10) * 0.4 + b_revenue_exposure * 0.6

  DIMENSION 5 — Reversibility Factor (weight: 0.10)
    reversibility_factor:
      FULLY_REVERSIBLE: 0.0 (no blast radius amplification)
      PARTIALLY_REVERSIBLE: 0.3
      CONTEXTUALLY_REVERSIBLE: 0.6
      IRREVERSIBLE: 1.0 (maximum amplification)

  composite_score = (
    resource_score * 0.25 +
    system_score * 0.25 +
    agent_score * 0.20 +
    business_score * 0.20 +
    reversibility_factor * 0.10
  )
  
  Return: BlastRadiusReport
```

---

## Blast Radius Report Schema

```yaml
blast_radius_report:
  report_id: BRA-{NNN}
  action_id: ACT-{NNN} | null
  sandbox_id: SBOX-{NNN} | null
  
  declared_scope: [string]              # what the agent claimed to touch
  inferred_scope: [string]             # what analysis determined could be touched
  scope_delta: [string]                # resources in inferred but not declared
  scope_expansion_detected: boolean
  
  scores:
    resource_scope: float
    system_scope: float
    agent_scope: float
    business_scope: float
    reversibility_factor: float
    composite: float                   # 0.00 – 1.00
    
  tier: MINIMAL | LOW | MEDIUM | HIGH | CRITICAL
  
  affected_resources: [string]
  affected_systems: [string]
  affected_agents: [string]
  affected_business_functions: [string]
  
  risk_narrative: string               # human-readable summary of key risks
  
  recommended_sandbox: DRY_RUN | SYNTHETIC | SCOPED | REVERSIBLE | BLOCK
  recommended_authority: T2 | T3 | T4
  
  computed_at: ISO8601
  valid_for_seconds: 300               # re-analyze if action not started within 5 minutes
```

---

## Pre-Execution Gate

```
pre_execution_blast_radius_gate(action_descriptor, declared_scope) → PASS | BLOCK:

  report = compute_blast_radius(action_descriptor, declared_scope)
  
  if scope_expansion_detected:
    log SCOPE_EXPANSION_DETECTED
    if scope_delta contains RESTRICTED resources: BLOCK immediately; alert T4
    else: flag for human review; downgrade to DRY_RUN pending review
    
  if report.tier == MINIMAL:
    sandbox_mode = SCOPED
    authority_required = T2 (if pre-authorized)
    
  if report.tier == LOW:
    sandbox_mode = SCOPED
    authority_required = T2
    
  if report.tier == MEDIUM:
    sandbox_mode = REVERSIBLE
    authority_required = T3
    
  if report.tier == HIGH:
    sandbox_mode = REVERSIBLE
    authority_required = T3
    note: dry-run preview required before REVERSIBLE execution
    
  if report.tier == CRITICAL:
    if action_class == CONSTITUTIONAL_ADJACENT:
      BLOCK; T4 explicit authorization required
    else:
      DRY_RUN first mandatory; T4 authorization for live execution
      
  return: sandbox_recommendation, authority_required, PASS | BLOCK
```

---

## Runtime Monitoring

During live SCOPED or REVERSIBLE execution, the analyzer monitors for blast radius expansion:

```
monitor_execution_blast_radius(sandbox_id, interval_seconds=5):

  baseline_report = get_report_for_sandbox(sandbox_id)
  
  every {interval_seconds}:
    current_side_effects = side_effect_tracker.get_captured(sandbox_id)
    current_inferred_scope = infer_scope_from_side_effects(current_side_effects)
    current_score = compute_from_scope(current_inferred_scope)
    
    if current_score > baseline_report.composite + 0.15:
      log BLAST_RADIUS_EXPANSION_DETECTED
      alert: T3
      if current_score >= 0.80:
        SUSPEND sandbox immediately
        trigger: rollback-coordinator.coordinate_rollback(sandbox_id)
        log BLAST_RADIUS_CRITICAL_AUTO_ROLLBACK
        
    if current_inferred_scope - declared_scope is non-empty:
      log SCOPE_CREEP_DETECTED
      notify: T2 (informational)
      if creep_crosses_org_boundary:
        SUSPEND; alert T3
```

---

## Blast Radius Trend Analysis

```yaml
trend_analysis:
  tracked_metrics:
    - mean_blast_radius_per_agent (7-day rolling)
    - blast_radius_by_action_class (weekly)
    - scope_expansion_rate (count per 100 executions)
    - critical_tier_rate (target < 1%)
    
  alerts:
    agent_blast_radius_trending_up: 20% increase over 7-day baseline → T2 notify
    action_class_consistently_high: 5 consecutive HIGH/CRITICAL for same class → T3 review
    scope_expansion_rate_spike: > 5% in rolling hour → T3 immediate
```

---

## Integration

```
Feeds into:
  sandbox-engine.md — sandbox type selected based on blast radius tier
  pre-execution-simulator.md — blast radius score inputs simulation risk model
  rollback-coordinator.md — runtime expansion triggers rollback
  scoped-execution-domains.md — scope validation cross-checked here

Receives from:
  side-effect-tracker.md — runtime scope data for live monitoring
  behavioral-contract-system.md — declared scope from agent contract
  privilege-containment-engine.md — authorized resource set for scope comparison
  isolated-execution-environment.md — intercepted operations during execution
```

---

## Governance

**Pre-execution mandatory:** Blast radius analysis runs before every SCOPED or REVERSIBLE sandbox provision; cannot be skipped  
**Scope expansion:** Any scope expansion beyond declared bounds immediately logged and alerted; CRITICAL resources trigger automatic block  
**CRITICAL tier:** T4 explicit authorization required; DRY_RUN preview mandatory before any live execution  
**Audit:** All blast radius reports to `memory/blast-radius-control/blast-radius-log.jsonl`; retained 1 year
