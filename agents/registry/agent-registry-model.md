# Agent Registry Model

## Purpose
Defines the canonical data model for all registered agents in the enterprise. The registry is the single source of truth about what agents exist, what they can do, where they are, and whether they are available. Every orchestration decision — from work routing to team formation — begins with querying this model.

---

## Registry Architecture

```
Agent Registration Event
        ↓
[1. Schema Validation]       → does the registration record conform to the model?
[2. Capability Verification] → do claimed capabilities match assessment records?
[3. Authorization Check]     → is this agent type permitted in this org?
[4. Conflict Detection]      → is this agent_id already registered?
[5. Record Inscription]      → write to registry + all indexes
[6. Health Probe]            → initial availability check
        ↓
[Primary Registry]           → full agent record
[Capability Index]           → capability → [agent_ids] inverted index
[Availability Index]         → real-time availability state
[Discovery Index]            → semantic embeddings for natural language discovery
[Health Index]               → live health signals per agent
```

---

## Agent Registry Record

```yaml
agent_registry_record:
  # Identity
  agent_id: "AGT-{org}-{type}-{seq}"     # e.g., AGT-GOV-REVIEW-047
  display_name: string
  agent_type: string                       # GOVERNANCE | ORCHESTRATION | ENGINEERING | etc.
  version: semantic_version                # agent software/configuration version
  
  # Classification
  tier: int                                # 1–5 governance tier
  org: string                              # owning organizational unit
  specializations: [string]               # formal specialization certifications
  
  # Capabilities and Skills
  capability_profile:
    capabilities: [
      {
        capability_id: string
        proficiency_level: NOVICE | CAPABLE | PROFICIENT | EXPERT
        authorized: boolean               # has explicit grant
        last_assessed: ISO-8601
        evidence_count: int
      }
    ]
    authorized_skills: [skill_id]         # skills this agent is authorized to execute
    capability_domains: [string]          # domains where agent is active (subset of taxonomy)
  
  # Contact and Routing
  routing:
    endpoint: string                       # how to invoke this agent
    protocol: SYNC | ASYNC | STREAMING
    max_concurrent_tasks: int             # capacity ceiling
    preferred_task_types: [string]        # what this agent prefers to receive
    declined_task_types: [string]         # what this agent formally declines
  
  # Availability
  availability:
    status: AVAILABLE | BUSY | OVERLOADED | OFFLINE | MAINTENANCE | SUSPENDED
    current_task_count: int
    max_concurrent_tasks: int
    load_factor: float                    # current_task_count / max_concurrent_tasks
    next_available_estimate: ISO-8601 | null
    scheduled_downtime: [{start, end, reason}]
  
  # Performance Context
  performance_context:
    overall_performance_score: float      # from agent-performance-model.md
    calibration_state: GREEN | YELLOW | ORANGE | RED
    sla_compliance_rate_30d: float
    reliability_score_30d: float
    last_performance_update: ISO-8601
  
  # Governance
  governance:
    registered_at: ISO-8601
    registered_by: agent-id | human-id
    last_updated: ISO-8601
    supervisor_agent: agent-id | null
    supervision_required: boolean        # must all outputs be reviewed?
    audit_level: STANDARD | ENHANCED
    active_restrictions: [string]        # capability restrictions in effect
  
  # Metadata
  metadata:
    description: string                  # human-readable description of this agent's purpose
    contact_owner: agent-id | human-id  # who to notify about this agent
    tags: [string]
    registry_version: string             # for migration compatibility
```

---

## Registry Indexes

```yaml
registry_indexes:
  capability_index:
    structure: {capability_id → {proficiency_level → [agent_id]}}
    query: "all agents with PROFICIENT+ in constitutional_evaluation"
    update: synchronous on registration/capability change
    latency: < 10ms
  
  domain_index:
    structure: {domain → {tier → [agent_id]}}
    query: "all T3 agents active in GOVERNANCE domain"
    update: synchronous
    latency: < 10ms
  
  availability_index:
    structure: {status → [agent_id]} + {load_factor: sorted list}
    query: "all AVAILABLE agents sorted by load_factor"
    update: real-time (every heartbeat cycle)
    latency: < 5ms
  
  skill_index:
    structure: {skill_id → [authorized agent_ids]}
    query: "all agents authorized to execute SKILL-GOV-001"
    update: synchronous on skill grant/revoke
    latency: < 10ms
  
  performance_index:
    structure: sorted by performance_score, calibration_state, reliability
    query: "top 10 agents for constitutional evaluation tasks"
    update: hourly (from performance-tracker.md)
    latency: < 20ms
  
  semantic_index:
    structure: HNSW vector index on agent description + capability descriptions
    query: "find agents that can help with regulatory compliance analysis"
    update: asynchronous (< 5 minutes after registration)
    latency: < 200ms
```

---

## Agent State Transitions

```yaml
agent_states:
  AVAILABLE:
    description: Agent is online and accepting new tasks
    task_acceptance: YES
    max_load_factor: < 0.70
  
  BUSY:
    description: Agent is working but still accepting low-priority tasks
    task_acceptance: LOW_PRIORITY_ONLY (or if current_task_count < max_concurrent)
    load_factor_range: 0.70–0.90
  
  OVERLOADED:
    description: Agent is at or near capacity; should not receive new tasks
    task_acceptance: EMERGENCY_ONLY
    load_factor_range: > 0.90
    auto_trigger: load_factor crosses 0.90 threshold
  
  OFFLINE:
    description: Agent is not responding to health probes
    task_acceptance: NO
    health_probe_fail_count: >= 3 consecutive failures
    auto_recovery: agent re-registers when it comes back online
  
  MAINTENANCE:
    description: Agent is temporarily unavailable for planned maintenance
    task_acceptance: NO
    requires: pre-announced scheduled_downtime record
    drain_protocol: completes current tasks; stops accepting new ones
  
  SUSPENDED:
    description: Agent has been suspended by governance action
    task_acceptance: NO
    requires: Tier-3+ governance order
    reinstatement: Tier-3+ clearance required
  
  DECOMMISSIONED:
    description: Agent is permanently retired; record retained for audit
    task_acceptance: NO
    record_retention: 7 years (audit and lineage purposes)
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-registry/agent-discovery-engine.md` | Queries this model for agent selection |
| `agent-registry/agent-health-monitor.md` | Updates availability_index and health state |
| `agent-registry/agent-roster-management.md` | Manages registration lifecycle |
| `agent-capabilities/agent-capability-model.md` | Capability profile source of truth |
| `agent-performance/agent-performance-tracker.md` | Performance context updates |
| `orchestration-patterns/orchestration-strategy-engine.md` | Reads registry for orchestration decisions |
