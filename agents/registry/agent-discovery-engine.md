# Agent Discovery Engine

## Purpose
Enables orchestrators, supervisors, and agents to find the right agent for any task. Translates task requirements into structured queries against the agent registry, ranks candidates by fit, and returns ordered agent recommendations with justification. The discovery engine is the primary interface between work and workforce.

---

## Discovery Architecture

```
Discovery Request
        ↓
[1. Request Parsing]         → extract task_type, required_capabilities, constraints
[2. Query Construction]      → build structured registry queries
[3. Multi-Index Query]       → capability_index + availability_index + performance_index
[4. Semantic Expansion]      → semantic_index query for fuzzy/natural language requests
[5. Candidate Filtering]     → hard filters (authorization, availability, restrictions)
[6. Candidate Scoring]       → multi-factor fit score
[7. Ranking and Slicing]     → top-N ordered results with justification
[8. Discovery Audit]         → log discovery event + selection rationale
        ↓
[Discovery Result]           → ranked candidate list with fit scores and explanations
```

---

## Discovery Request Schema

```yaml
discovery_request:
  # What work needs doing
  task:
    task_type: string                        # matches preferred_task_types in registry
    required_capabilities: [
      {
        capability_id: string
        minimum_proficiency: NOVICE | CAPABLE | PROFICIENT | EXPERT
        authorized_required: boolean         # must have explicit authorization?
      }
    ]
    required_skills: [skill_id]             # specific skills that must be authorized
    complexity: BASIC | STANDARD | COMPLEX | EXPERT  # informs minimum tier
    domain: string                           # enterprise domain (from taxonomy)
    estimated_duration_minutes: int
  
  # Constraints on who can do it
  constraints:
    minimum_tier: int                        # governance floor
    maximum_tier: int | null                # ceiling (e.g., don't use T4 for routine tasks)
    exclude_agents: [agent_id]             # agents to exclude (conflict of interest, etc.)
    require_supervision: boolean | null    # null = use registry default
    require_agents_from_org: string | null # restrict to specific org unit
    max_load_factor: float                  # default 0.80 (don't route to near-capacity agents)
  
  # How to rank results
  ranking_preferences:
    optimize_for: PERFORMANCE | AVAILABILITY | LOAD_BALANCE | SPECIALIZATION
    max_results: int                         # default 5
    include_busy: boolean                    # include BUSY agents (default true)
    include_reasoning: boolean               # include fit score breakdown (default true)
  
  # Discovery metadata
  requester_id: agent_id | human_id
  request_context: string                   # optional: why this discovery is needed
  request_id: string                        # for audit trail
  requested_at: ISO-8601
```

---

## Discovery Query Pipeline

```yaml
query_pipeline:
  step_1_hard_filter:
    conditions:
      - availability.status IN [AVAILABLE, BUSY]    # exclude OVERLOADED/OFFLINE/etc.
      - availability.load_factor <= constraints.max_load_factor
      - governance.active_restrictions NOT intersect required_capabilities
      - agent_id NOT IN constraints.exclude_agents
      - tier >= constraints.minimum_tier
      - tier <= constraints.maximum_tier (if set)
      - org == constraints.require_agents_from_org (if set)
    result: eligible_agent_pool
    latency: < 10ms (all index lookups)
  
  step_2_capability_match:
    for_each required_capability:
      query: capability_index[capability_id][proficiency_level >= minimum_proficiency]
      intersect: eligible_agent_pool
      if authorized_required: filter to agents where capability.authorized == true
    result: capability_qualified_pool
    latency: < 15ms
  
  step_3_skill_match:
    for_each required_skill:
      query: skill_index[skill_id]
      intersect: capability_qualified_pool
    result: fully_qualified_pool
    latency: < 10ms
  
  step_4_semantic_expansion:
    trigger: fully_qualified_pool.size < max_results AND request has natural_language_description
    action: query semantic_index for similar agents; merge into candidates with lower priority
    latency: < 200ms
  
  step_5_scoring:
    for_each candidate in fully_qualified_pool:
      compute: discovery_fit_score(candidate, request)
    sort: descending by fit_score
    slice: top max_results
```

---

## Fit Score Model

```yaml
discovery_fit_score:
  components:
    capability_match_score:
      weight: 0.30
      computation: |
        For each required capability:
          proficiency_bonus = (agent_proficiency_level - minimum_required) × 0.10
          (capped at +0.20 over minimum)
        Average across all required capabilities.
        Agent meeting exact minimum = 0.70 base.
        EXPERT on all = 1.00.
    
    availability_score:
      weight: 0.25
      computation: |
        AVAILABLE + load_factor < 0.30: 1.00
        AVAILABLE + load_factor 0.30–0.60: 0.80
        AVAILABLE + load_factor 0.60–0.80: 0.60
        BUSY + load_factor 0.70–0.90: 0.40
        Any state with next_available_estimate in future: scaled by wait time
    
    performance_score:
      weight: 0.25
      computation: performance_context.overall_performance_score
      calibration_penalty: if calibration_state == RED: score × 0.70
    
    specialization_score:
      weight: 0.10
      computation: |
        task_type IN agent.routing.preferred_task_types: +0.30
        task domain IN agent.capability_profile.capability_domains: +0.20
        task_type IN agent.routing.declined_task_types: 0.00 (immediate disqualification)
    
    load_balance_score:
      weight: 0.10
      computation: 1.0 - availability.load_factor
      rationale: prefer least-loaded among otherwise equal agents
  
  hard_disqualifiers:
    - task_type IN agent.routing.declined_task_types
    - required capability has authorized == false when authorized_required == true
    - governance.active_restrictions overlap required_capabilities
    - calibration_state == RED for GOVERNANCE domain tasks
  
  final_score: weighted_sum(components)  # 0.0 – 1.0
  minimum_viable_score: 0.40             # below this, agent is not returned as candidate
```

---

## Discovery Result Schema

```yaml
discovery_result:
  request_id: string
  query_duration_ms: int
  candidates_evaluated: int
  
  results: [
    {
      rank: int
      agent_id: string
      display_name: string
      fit_score: float
      
      fit_breakdown:
        capability_match_score: float
        availability_score: float
        performance_score: float
        specialization_score: float
        load_balance_score: float
      
      current_state:
        status: AVAILABLE | BUSY
        load_factor: float
        current_task_count: int
        next_available_estimate: ISO-8601 | null
      
      capability_evidence:
        matched_capabilities: [{capability_id, proficiency_level, authorized}]
        authorized_skills: [skill_id]
      
      routing:
        endpoint: string
        protocol: SYNC | ASYNC | STREAMING
        max_concurrent_tasks: int
      
      justification: string               # human-readable explanation of ranking
    }
  ]
  
  discovery_notes:
    pool_size_after_hard_filter: int
    pool_size_after_capability_filter: int
    semantic_expansion_used: boolean
    no_candidates_reason: string | null   # if results is empty
```

---

## Discovery Modes

```yaml
discovery_modes:
  PRECISE:
    description: Exact capability and skill matching; no semantic expansion
    use_when: Orchestrator knows exactly what it needs
    latency_target: < 30ms
  
  EXPLORATORY:
    description: Semantic expansion enabled; broader matching for novel tasks
    use_when: Task type is new or capabilities are described in natural language
    latency_target: < 250ms
  
  EMERGENCY:
    description: Reduced filters; includes BUSY and near-capacity agents; accepts lower fit scores
    use_when: Critical task with no ideal candidate available
    minimum_viable_score: 0.25            # relaxed from 0.40
    include_overloaded: true             # with explicit warning in result
    latency_target: < 15ms
  
  TEAM_FORMATION:
    description: Returns complementary agents for a multi-agent team
    use_when: Dynamic team formation (see dynamic-team-formation.md)
    output: Set of agents covering all required capabilities collectively
    latency_target: < 100ms
```

---

## Caching and Performance

```yaml
discovery_caching:
  capability_query_cache:
    TTL: 5 seconds                        # availability changes frequently; short TTL
    key: hash(required_capabilities + constraints)
    invalidation: on any registry update to relevant agents
  
  semantic_query_cache:
    TTL: 60 seconds                       # semantic index is slower to update
    key: hash(natural_language_description)
  
  performance_targets:
    PRECISE mode p50: < 15ms
    PRECISE mode p99: < 30ms
    EXPLORATORY mode p50: < 100ms
    EXPLORATORY mode p99: < 250ms
    EMERGENCY mode p99: < 15ms
    
  degraded_mode:
    trigger: semantic_index unavailable
    fallback: PRECISE mode only; log warning
    trigger: capability_index unavailable
    fallback: full scan of primary registry (accept up to 500ms)
```

---

## Discovery Audit

```yaml
discovery_audit:
  log_per_request:
    - request_id, requester_id, task_type, required_capabilities
    - candidates_evaluated, results_returned
    - selected_agent (if requester reports back selection)
    - discovery_mode, duration_ms
    - timestamp
  
  retention: 1 year (discovery events); 3 years (if linked to a governance decision)
  
  analytics:
    no_candidate_rate: fraction of requests returning 0 results (alert if > 5%)
    low_fit_rate: fraction of top results with fit_score < 0.60 (signals capability gap)
    semantic_expansion_rate: how often EXPLORATORY mode is needed (signals spec quality)
    selection_vs_recommendation: whether requester selected rank-1 vs. lower (ranking quality)
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-registry/agent-registry-model.md` | Primary data source for all discovery queries |
| `agent-registry/agent-health-monitor.md` | Availability state kept current for discovery |
| `orchestration-patterns/orchestration-strategy-engine.md` | Calls discovery to find agents for work |
| `orchestration-patterns/dynamic-team-formation.md` | Uses TEAM_FORMATION discovery mode |
| `delegation-and-trust/delegation-model.md` | Discovery results inform delegation decisions |
| `agent-capabilities/agent-capability-model.md` | Capability taxonomy used in discovery requests |
