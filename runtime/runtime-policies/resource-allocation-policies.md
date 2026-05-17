# Resource Allocation Policies

## Purpose
Governs how compute, context, tool budgets, and agent capacity are allocated across workflows, agents, and organizational units. Resource allocation without policy creates race conditions, priority inversions, starvation of critical compliance workflows, and runaway consumption by low-priority agents. These policies ensure governance-critical work always has sufficient resources, prevent any single agent or workflow from monopolizing shared capacity, and enforce quotas that protect the stability of the operating system under load.

---

## Policy Catalog — Resource Domain

```yaml
resource_allocation_policies:
  POL-RES-001:
    policy_name: governance_critical_resource_reservation
    description: "Governance-critical workflows (CRITICAL risk, human oversight, regulatory) always receive resource allocation before general workloads."
    priority: 10
    
    rules:
      RULE-RES-001-01:
        name: critical_governance_cannot_be_starved
        description: "CRITICAL governance workflows must receive resource allocation regardless of overall system load."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "RESOURCE_ALLOCATION_REQUESTED"}
            - {field: "resource.resource_domain", op: eq, value: "GOVERNANCE"}
            - {field: "context.current_risk_level", op: eq, value: "CRITICAL"}
        effect:
          type: ALLOW_WITH_CONDITIONS
          conditions:
            - condition_id: COND-RESERVED-POOL
              description: "Allocation must draw from the 20% reserved governance resource pool, not general pool."
              check: "allocation_from_reserved_pool(resource.resource_id)"
      
      RULE-RES-001-02:
        name: human_review_gate_always_resources
        description: "Human review gate agents always receive requested resources; cannot be deferred due to capacity constraints."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "RESOURCE_ALLOCATION_REQUESTED"}
            - {field: "subject.actor_roles", op: contains, value: "HUMAN_REVIEW_GATE_AGENT"}
        effect:
          type: ALLOW
          priority_class: GOVERNANCE_CRITICAL
  
  POL-RES-002:
    policy_name: agent_context_budget_enforcement
    description: "Enforces per-agent and per-workflow context (token) budget limits to prevent runaway consumption."
    priority: 20
    
    rules:
      RULE-RES-002-01:
        name: tier1_agent_context_ceiling
        description: "Tier-1 agents are limited to 50,000 context tokens per task; violations are denied."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "CONTEXT_BUDGET_REQUESTED"}
            - {field: "subject.actor_tier", op: eq, value: 1}
            - {field: "resource.resource_type", op: eq, value: "CONTEXT_TOKENS"}
            - {field: "action.intended_effect", op: "numeric_gt", value: 50000}
        effect:
          type: DENY
          reason_template: "Tier-1 agents are limited to 50,000 context tokens per task. Requested: {action.intended_effect}."
      
      RULE-RES-002-02:
        name: workflow_context_budget_cap
        description: "Any single workflow may not consume more than 500,000 context tokens total."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "CONTEXT_BUDGET_REQUESTED"}
            - {function: "workflow_total_context_consumed", args: ["context.workflow_id"], op: "numeric_gt", value: 500000}
        effect:
          type: REQUIRE_APPROVAL
          approvers: [{tier_minimum: 3}]
          quorum: 1
          timeout: "30m"
          reason_template: "Workflow {context.workflow_id} has consumed > 500,000 context tokens. Additional budget requires Tier-3+ approval."
      
      RULE-RES-002-03:
        name: research_workflows_elevated_budget
        description: "Research and intelligence workflows may use up to 200,000 tokens per task (elevated budget)."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "CONTEXT_BUDGET_REQUESTED"}
            - {field: "resource.resource_domain", op: eq, value: "RESEARCH_INTELLIGENCE"}
            - {field: "action.intended_effect", op: "numeric_lte", value: 200000}
        effect:
          type: ALLOW
  
  POL-RES-003:
    policy_name: tool_call_rate_limiting
    description: "Limits per-agent tool call rates to prevent resource exhaustion and ensure fair access."
    priority: 25
    
    rules:
      RULE-RES-003-01:
        name: web_search_rate_limit_tier1
        description: "Tier-1 agents may not execute more than 10 web search tool calls per minute."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "TOOL_CALL_REQUESTED"}
            - {field: "resource.resource_type", op: eq, value: "WEB_SEARCH"}
            - {field: "subject.actor_tier", op: lte, value: 1}
            - {function: "tool_call_rate", args: ["subject.actor_id", "WEB_SEARCH", "60s"], op: "numeric_gte", value: 10}
        effect:
          type: DENY
          reason_template: "Tool call rate limit exceeded: Tier-1 agent may not exceed 10 WEB_SEARCH calls per minute."
      
      RULE-RES-003-02:
        name: destructive_tool_rate_limit_all_tiers
        description: "No agent may execute more than 5 destructive tool calls (Write, Edit, Delete) per 5-minute window."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "TOOL_CALL_REQUESTED"}
            - {field: "resource.resource_type", op: in, value: ["FILE_WRITE", "FILE_EDIT", "FILE_DELETE", "DB_WRITE", "SYSTEM_CONFIGURE"]}
            - {function: "tool_call_rate", args: ["subject.actor_id", "DESTRUCTIVE", "300s"], op: "numeric_gte", value: 5}
        effect:
          type: REQUIRE_APPROVAL
          approvers: [{tier_minimum: 3}]
          quorum: 1
          timeout: "15m"
  
  POL-RES-004:
    policy_name: worker_pool_allocation_fairness
    description: "Prevents any single organizational unit from monopolizing worker pool capacity."
    priority: 30
    
    rules:
      RULE-RES-004-01:
        name: org_unit_max_worker_allocation
        description: "No single organizational unit may hold more than 40% of total available workers simultaneously."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "WORKER_ALLOCATION_REQUESTED"}
            - {function: "org_unit_worker_share", args: ["subject.actor_id"], op: "numeric_gt", value: 0.40}
        effect:
          type: DENY
          reason_template: "Org unit worker allocation would exceed 40% capacity cap. Current share: {org_unit_worker_share(subject.actor_id)}."
      
      RULE-RES-004-02:
        name: low_priority_work_cannot_preempt_governance
        description: "LOW-priority work requests cannot preempt workers currently executing GOVERNANCE or CRITICAL tasks."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "WORKER_PREEMPTION_REQUESTED"}
            - {field: "subject.actor_tier", op: lte, value: 1}
            - {function: "current_task_priority", args: ["resource.resource_id"], op: in, value: ["GOVERNANCE", "CRITICAL"]}
        effect:
          type: DENY
          hard_deny: false
          reason_template: "LOW-priority work cannot preempt workers executing GOVERNANCE or CRITICAL tasks."
  
  POL-RES-005:
    policy_name: memory_and_storage_quota_enforcement
    description: "Enforces per-agent and per-workflow memory/storage quotas."
    priority: 35
    
    rules:
      RULE-RES-005-01:
        name: agent_working_memory_ceiling
        description: "Agent working memory may not exceed 100MB per task; requests above this require approval."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "MEMORY_ALLOCATION_REQUESTED"}
            - {field: "action.intended_effect", op: "size_gt", value: "100MB"}
        effect:
          type: REQUIRE_APPROVAL
          approvers: [{tier_minimum: 2}]
          quorum: 1
          timeout: "10m"
```

---

## Resource Reservation Pools

```yaml
resource_pools:
  GOVERNANCE_RESERVED_POOL:
    size: 20% of total compute capacity
    access: GOVERNANCE domain tasks only; human review gates; constitutional evaluation
    preemption: cannot be preempted by any non-GOVERNANCE task
    policy: POL-RES-001
  
  GENERAL_POOL:
    size: 70% of total compute capacity
    access: all tasks not requiring GOVERNANCE_RESERVED_POOL
    allocation: priority-ordered (CRITICAL > HIGH > NORMAL > LOW)
    preemption: CRITICAL tasks may preempt NORMAL and LOW tasks in this pool
  
  BURST_POOL:
    size: 10% of total compute capacity
    access: overflow when GENERAL_POOL is saturated; requires approval for non-CRITICAL use
    policy: time-limited (max 30 minutes per workflow without re-approval)
    monitoring: burst pool exhaustion is a capacity alert (see compliance-operations-dashboard.md)
```

---

## Integration Points

| System | Role |
|---|---|
| `policy-as-code/policy-engine.md` | Evaluates resource allocation policies at every allocation request |
| `distributed-execution/task-queue.md` | Task queue priority enforcement per POL-RES-001 |
| `distributed-execution/worker-orchestration.md` | Worker allocation per POL-RES-004 |
| `execution-runtime/runtime-engine.md` | Context budget enforcement per POL-RES-002 |
| `execution-runtime/execution-scaling.md` | Scaling decisions constrained by pool policies |
| `governance-operations/compliance-operations-dashboard.md` | Resource pool health displayed |
