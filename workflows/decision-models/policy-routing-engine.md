# Policy Routing Engine

## Purpose
Routes workflows, tasks, cases, and decisions to the correct agents, queues, or handlers based on a policy configuration. Policy routing is declarative — operators define routing rules, and the engine evaluates them at runtime without code changes. All routing decisions are auditable and traceable.

---

## Routing Policy Model

```yaml
routing_policy:
  policy_id: "POLICY-DOMAIN-NNN"
  name: "Policy Name"
  version: "MAJOR.MINOR.PATCH"
  scope: WORKFLOW | TASK | CASE | DECISION | ESCALATION | MESSAGE
  priority: integer   # lower = higher priority; policies evaluated in priority order
  status: DRAFT | ACTIVE | SUSPENDED | DEPRECATED
  owner: "org-name"
  
  applies_to:
    entity_types: [workflow | task | case | ...]   # what entity types this policy governs
    conditions: "CEL expression"                    # additional filtering condition
  
  rules:
    - rule_id: "RULE-NNN"
      name: "rule name"
      condition: "CEL expression"
      priority: integer    # within-policy ordering
      action:
        type: ROUTE | REJECT | TRANSFORM | ENRICH | DELAY | FORK | MERGE
        target: {}         # type-specific action target
        metadata: {}       # additional action parameters
      on_no_match: continue | reject | default_route
  
  default_action:
    type: ROUTE
    target: {pool: "default-pool", strategy: ROUND_ROBIN}
  
  governance:
    tier_required: 0–5
    requires_approval: true/false
  
  effective_from: ISO-8601
  effective_until: ISO-8601 | null
```

---

## Action Types

### ROUTE — Send to specific target
```yaml
action:
  type: ROUTE
  target:
    pool: "agent-pool-name"
    agent_id: "specific-agent-id | null"   # null = pool routing
    queue: "queue-name"
    routing_strategy: ROUND_ROBIN | LEAST_LOADED | CAPABILITY_BEST_MATCH | PRIORITY_WEIGHTED | STICKY
    sticky_key: "$.context.case_id"        # for STICKY: always route same key to same agent
```

### REJECT — Block the request
```yaml
action:
  type: REJECT
  reason: "human-readable rejection reason"
  error_code: "ERR_POLICY_REJECTED"
  notify: [role-strings]
```

### TRANSFORM — Modify before routing
```yaml
action:
  type: TRANSFORM
  transformations:
    - field: "$.inputs.priority"
      operation: SET | APPEND | DELETE | MAP
      value: "CRITICAL"
      condition: "$.context.is_after_hours == true"
  then_route:
    pool: "priority-pool"
```

### ENRICH — Add context before routing
```yaml
action:
  type: ENRICH
  enrichments:
    - source: "runtime-decision-engine"
      model_id: "DM-GOV-001"
      output_field: "$.routing_context.approval_tier"
    - source: "context-lookup"
      lookup_key: "$.context.org"
      data_source: "agents/org-registry"
      output_field: "$.routing_context.org_metadata"
  then_route:
    pool: "enrichment-determined"
    pool_expression: "$.routing_context.approval_tier == 4 ? 'tier4-pool' : 'standard-pool'"
```

### DELAY — Time-based routing
```yaml
action:
  type: DELAY
  delay_until:
    type: FIXED_TIME | DURATION | BUSINESS_HOURS
    value: "PT1H"             # for DURATION
    business_hours: "09:00–17:00 UTC"  # for BUSINESS_HOURS
  then_route:
    pool: "scheduled-pool"
```

### FORK — Route to multiple targets
```yaml
action:
  type: FORK
  targets:
    - pool: "primary-processor"
      mode: ASYNC   # fire and forget
    - pool: "audit-logger"
      mode: ASYNC
    - pool: "notification-service"
      mode: ASYNC
  synchronization: NONE | ALL_COMPLETE | FIRST_COMPLETE
```

---

## Standard Policy Set

### POLICY-ORG-001 — Organizational Routing
```yaml
policy_id: POLICY-ORG-001
name: Organizational Task Routing
scope: TASK
priority: 100
status: ACTIVE

rules:
  - rule_id: RULE-001
    name: Route constitutional tasks to governance
    condition: "task.governance.constitutional_check == true"
    priority: 1
    action:
      type: ROUTE
      target:
        pool: governance-agents
        routing_strategy: CAPABILITY_BEST_MATCH

  - rule_id: RULE-002
    name: Route P1 incidents to priority pool
    condition: "task.context.severity == 'P1'"
    priority: 2
    action:
      type: ROUTE
      target:
        pool: incident-response-agents
        routing_strategy: LEAST_LOADED

  - rule_id: RULE-003
    name: Route by org affinity
    condition: "task.owner_org != null"
    priority: 10
    action:
      type: ROUTE
      target:
        pool: "org-pool-map[task.owner_org]"
        routing_strategy: CAPABILITY_BEST_MATCH
        fallback:
          pool: cross-org-general-agents
```

### POLICY-GOV-001 — Governance Routing
```yaml
policy_id: POLICY-GOV-001
name: Governance Approval Routing
scope: DECISION
priority: 50   # evaluated before organizational routing
status: ACTIVE

rules:
  - rule_id: RULE-001
    name: Tier 5 — Executive only
    condition: "decision.required_tier >= 5"
    action:
      type: ROUTE
      target:
        pool: executive-approvers
        routing_strategy: PRIORITY_WEIGHTED

  - rule_id: RULE-002
    name: Tier 4 — Senior governance
    condition: "decision.required_tier == 4"
    action:
      type: ENRICH
      enrichments:
        - source: "context-lookup"
          lookup_key: "decision.artifact_type"
          output_field: "routing_context.specialist_pool"
      then_route:
        pool: "tier4-governance"
        routing_strategy: CAPABILITY_BEST_MATCH

  - rule_id: RULE-003
    name: Require constitutional review for tier 3+
    condition: "decision.required_tier >= 3 AND decision.constitutional_check_status == 'PENDING'"
    action:
      type: FORK
      targets:
        - pool: constitutional-reviewers
          mode: SYNC   # wait for constitutional check before proceeding
        - pool: tier3-approvers
          mode: ASYNC
      synchronization: ALL_COMPLETE
```

---

## Policy Evaluation Engine

```
evaluate_routing(entity, policies):
  applicable_policies = policies
    .filter(p => p.status == ACTIVE)
    .filter(p => p.scope == entity.type)
    .filter(p => eval_cel(p.applies_to.conditions, entity))
    .sort_by(p.priority ascending)
  
  for policy in applicable_policies:
    sorted_rules = policy.rules.sort_by(r.priority ascending)
    
    for rule in sorted_rules:
      if eval_cel(rule.condition, entity):
        action = rule.action
        result = execute_action(action, entity)
        emit_routing_decision(entity, policy, rule, result)
        
        if action.type != ENRICH:
          return result   # first definitive action wins
  
  # No rule matched — use last applicable policy's default
  return applicable_policies.last().default_action
```

---

## Routing Decision Audit

Every routing decision is logged:

```yaml
routing_decision:
  decision_id: "uuid"
  entity_id: string
  entity_type: string
  evaluated_at: ISO-8601
  
  policies_evaluated: [policy_id]
  winning_policy: policy_id
  winning_rule: rule_id
  
  action_taken: {type, target}
  
  cel_evaluations:
    - policy_id: string
      rule_id: string
      condition: string
      result: true/false
      inputs_snapshot: {}
  
  enrichments_applied: [enrichment-record]
  
  routing_latency_ms: integer
```

Routing decisions are published to `enterprise-telemetry/orchestration-telemetry.md`.
