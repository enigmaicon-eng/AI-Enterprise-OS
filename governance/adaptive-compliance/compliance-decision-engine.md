# Compliance Decision Engine
**ID:** ACE-CDE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Makes real-time compliance decisions at the point of agent action — before any side effect occurs. The Compliance Decision Engine is the runtime gate through which every compliance-relevant action passes: it evaluates active policies, the agent's current compliance state, jurisdiction context, data sensitivity, and risk score, then returns a binding decision in < 200ms p95. Every decision is cached for performance, invalidated immediately on policy or state change, and logged with full context for audit.

---

## Decision Types

```yaml
decision_types:

  PERMIT:
    meaning: Action is compliant; proceed
    conditions: all applicable policies pass; risk score < 0.60; no active suspension
    authority: automatic (T1 effective)
    audit: logged at INFO level
    
  PERMIT_WITH_CONDITIONS:
    meaning: Action is permitted subject to runtime conditions
    conditions: MEDIUM risk; or MONITORING compliance state; or MARGINAL control
    conditions_examples:
      - ENHANCED_LOGGING: capture full audit trail for this action
      - NOTIFY_DPO: send notification to Data Protection Officer
      - HUMAN_VISIBILITY: surface to T3 dashboard (no approval required)
      - TIME_LIMIT: action must complete within specified TTL
    authority: automatic (conditions enforced by runtime)
    audit: logged at INFO with condition set
    
  REQUIRE_REVIEW:
    meaning: Action cannot proceed without human review
    trigger: HIGH risk score; AT_RISK compliance state; or policy explicitly mandates review
    review_authority: T2 (LOW), T3 (MEDIUM-HIGH), T4 (CRITICAL)
    SLA: 15 min (CRITICAL) | 2 hr (HIGH) | 24 hr (MEDIUM)
    timeout_behavior: escalate to next tier if SLA breached
    audit: logged at WARN; review decision appended to record
    
  ESCALATE:
    meaning: Decision cannot be made by engine; requires expert judgment
    trigger: novel policy conflict; multi-jurisdiction disagreement; borderline constitutional proximity
    escalation_target: Legal Org + Governance Org
    SLA: 4 hr for assessment; 24 hr for decision
    interim_behavior: block action pending escalation decision
    audit: logged at WARN with escalation rationale
    
  AUTO_REMEDIATE:
    meaning: Violation detected; automated remediation initiated immediately
    trigger: clear policy violation with pre-defined remediation path
    remediation_id: generated; passed to automated-remediation-engine
    action_status: BLOCKED pending remediation completion
    audit: logged at ERROR; remediation record linked
    
  BLOCK:
    meaning: Action is prohibited; hard stop
    trigger: constitutional violation; SUSPENDED compliance state; Class A restricted domain; CRITICAL risk
    authority: automatic (no human can override a constitutional BLOCK)
    exceptions: none for constitutional; T4 for policy-based BLOCK (with legal justification)
    audit: logged at ERROR; immediate T4 notification for CRITICAL
```

---

## Decision Algorithm

```
make_compliance_decision(action, agent_id, jurisdiction_context, data_context):

  # Step 1: Cache lookup (< 5ms path)
  cache_key = hash(action.type + agent_id + jurisdiction_context + data_context.sensitivity_class)
  cached = decision_cache.get(cache_key)
  if cached and not cached.expired:
    log_cache_hit(cache_key)
    Return: cached.decision

  # Step 2: Constitutional check (always; < 10ms)
  const_result = constitutional_governor_quorum.check(action)
  if const_result == ABSOLUTE_VIOLATION:
    Return: Decision(BLOCK, rationale="constitutional_violation", evidence=const_result)

  # Step 3: Load compliance context
  agent_state = compliance_state_machine.query(agent_id, jurisdiction_context, applicable_domains(action))
  if SUSPENDED in agent_state.values():
    Return: Decision(BLOCK, rationale="agent_suspended", state=agent_state)

  # Step 4: Policy evaluation (parallel across applicable policies)
  applicable_policies = policy_catalog.get_active(
    domains=applicable_domains(action),
    jurisdictions=jurisdiction_context.applicable_jurisdictions,
    agent_class=agent_context.class
  )
  
  [PARALLEL]:
  policy_results = [evaluate_policy(action, policy, data_context) for policy in applicable_policies]
  
  # Step 5: Aggregate policy results
  violations = [r for r in policy_results if r.outcome == FAIL]
  if violations:
    severity = max(v.severity for v in violations)
    if severity == CRITICAL:
      trigger_auto_remediation(action, violations)
      Return: Decision(AUTO_REMEDIATE, violations=violations)
    elif severity == HIGH:
      Return: Decision(REQUIRE_REVIEW, violations=violations, authority=T3)
    else:
      Return: Decision(REQUIRE_REVIEW, violations=violations, authority=T2)

  # Step 6: Risk scoring
  risk = compliance_risk_scorer.score(action, policy_results, agent_state, data_context)
  
  # Step 7: Final decision mapping
  decision = map_risk_to_decision(risk, agent_state)
  
  # Step 8: Cache and return
  decision_cache.set(cache_key, decision, ttl=300s)
  log_decision(action, agent_id, policy_results, risk, decision)
  Return: decision
```

---

## Decision Cache

```yaml
decision_cache:
  implementation: in-memory LRU (per-entity orchestrator)
  ttl: 300 seconds
  max_entries: 100,000 per entity
  
  invalidation_triggers:
    - policy_update: invalidate all entries for affected jurisdictions/domains
    - compliance_state_change: invalidate all entries for affected agent
    - risk_score_tier_change: invalidate entries for affected agent + domain
    - control_failure: invalidate entries for affected domain
    
  cache_key_components:
    - action.type
    - agent.class (not agent_id — agents of same class share decisions for same action type)
    - jurisdiction_context (primary + applicable)
    - data_context.sensitivity_class
    
  cache_bypass_conditions:
    - action involves RESTRICTED or SOVEREIGN_CRITICAL data
    - agent compliance state is AT_RISK or worse
    - action type is cross-border transfer
    - action is constitutional-adjacent (proximity_score > 0.50)
```

---

## Review Queue

```yaml
review_queue:
  queue_id: RVW-{NNN}
  
  fields:
    action: serialized action definition
    agent_id: string
    decision_id: string
    severity: HIGH | MEDIUM | LOW
    assigned_to: T2 | T3 | T4
    created_at: ISO8601
    sla_deadline: ISO8601
    status: PENDING | IN_REVIEW | APPROVED | REJECTED | ESCALATED | EXPIRED
    
  sla_management:
    reminder_at: 50% of SLA consumed
    escalate_at: 80% of SLA consumed (to next tier)
    auto_reject_at: 100% + 15 min (for HIGH/MEDIUM; CRITICAL never auto-rejects)
    
  reviewer_decision:
    APPROVE: action proceeds with reviewer identity logged
    REJECT: action blocked; reviewer must provide rationale
    MODIFY: action proceeds with reviewer-specified modifications
    ESCALATE: reviewer escalates to higher tier
```

---

## Integration

```
Feeds into:
  compliance-state-machine.md — BLOCK/VIOLATION decisions trigger state transitions
  automated-remediation-engine.md — AUTO_REMEDIATE decisions initiate remediation
  compliance-engine.md — decision results feed engine telemetry
  compliance-dashboard.md — REQUIRE_REVIEW queue surfaced on dashboard

Receives from:
  policy-adaptation-engine.md — active policies evaluated here
  compliance-risk-scorer.md — risk scores used in decision mapping
  compliance-state-machine.md — agent compliance state consulted
  governance/constitutional-governor-quorum.md — constitutional gate result
```

---

## Governance

**No autonomous constitutional override:** No agent, human, or system may override a constitutional BLOCK; this is structurally enforced  
**Reviewer accountability:** Every human review decision is attributed; reviewer identity is permanent audit record  
**Cache safety:** Cache never holds decisions for RESTRICTED data, AT_RISK agents, or cross-border transfers; these always take the live path  
**Decision completeness:** Every in-scope action receives a decision; "no decision" is treated as REQUIRE_REVIEW automatically  
**Audit:** All decisions to `memory/adaptive-compliance/decisions.jsonl`; decisions linked to their review records where applicable
