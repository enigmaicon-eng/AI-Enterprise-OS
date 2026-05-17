# Knowledge Recommendation Engine

## Purpose
Proactively recommends knowledge units to agents and knowledge stewards — surfacing units that are likely to be useful before they are requested. Operates on collaborative filtering, content-based similarity, and organizational context to close knowledge gaps and ensure that high-value knowledge reaches the agents who need it.

---

## Recommendation Architecture

```
Data Inputs
├── retrieval_history (per agent, per workflow type, per domain)
├── application_feedback (APPLIED, HELPFUL, NOT_RELEVANT per KU)
├── agent_profiles (domains, tier, active workflows)
├── knowledge_base (KU metadata, quality, relationships)
└── organizational_signals (team, project, recent incidents)
        ↓
[Recommendation Model]
├── Collaborative Filtering  → "agents like you found these useful"
├── Content-Based Filtering  → "similar to KUs you've used"
├── Context-Based Targeting  → "relevant to your current workflow/domain"
└── Gap-Filling              → "high-quality KUs you haven't seen yet"
        ↓
[Ranking + Deduplication]
        ↓
[Delivery via Channels]
```

---

## Recommendation Models

```yaml
recommendation_models:
  collaborative_filtering:
    method: matrix factorization on agent × KU interaction matrix
    interaction_signals:
      applied: weight 5.0
      helpful: weight 3.0
      opened_full_KU: weight 2.0
      retrieved: weight 1.0
      ignored: weight -0.5
      not_relevant: weight -3.0
    
    similarity_basis: agents with similar domain profiles + interaction patterns
    cold_start: new agents receive recommendations from their org + domain defaults
    
    output: top-K KUs for each agent based on collaborative score
    update_frequency: daily retraining; hourly incremental updates
  
  content_based_filtering:
    method: embedding similarity between KUs the agent has interacted with and remaining corpus
    
    process:
      1. build agent's KU interest profile (weighted average of embeddings of interacted KUs)
      2. cosine similarity against all ACTIVE KU embeddings
      3. rank by similarity × quality_score
    
    penalize: KUs already retrieved by this agent this month
    boost: KUs in agent's primary domain
    
    update_frequency: real-time (profile updates on each interaction)
  
  context_based_targeting:
    method: match KUs to agent's current operational context
    
    context_signals:
      active_workflow_type: boost KUs linked to this workflow
      active_domain: boost KUs in this domain
      recent_incidents: boost INCIDENT_KNOWLEDGE + prevention KUs
      recent_decisions: boost related DECISION_KNOWLEDGE
    
    most_powerful_for: new situations where agent has no prior interaction history
    
    update_frequency: real-time (triggered by context change events)
  
  gap_filling:
    method: identify high-quality KUs in agent's domain that agent has never seen
    
    targeting:
      KUs with quality >= 0.80 AND agent has zero interaction with KU AND KU in agent's domain
    
    priority: EXEMPLARY KUs first; then HIGH; then ACCEPTABLE
    cap: max 3 gap-fill recommendations per briefing (avoid overwhelming)
```

---

## Recommendation Fusion

```yaml
recommendation_fusion:
  combine: merge recommendation lists from all models
  deduplication: remove duplicates; keep highest combined score
  
  fusion_weights:
    collaborative_filtering: 0.35
    content_based_filtering: 0.30
    context_based_targeting: 0.25
    gap_filling: 0.10
  
  post_fusion_filters:
    access_filter: remove KUs the agent cannot access
    staleness_filter: remove DEPRECATED and ARCHIVED
    quality_floor: remove KUs with overall_quality < 0.50
    recency_cap: if agent interacted with KU in last 7 days, exclude (avoid spam)
  
  max_recommendations_per_delivery:
    daily_briefing: 5
    workflow_context: 3
    on_demand: 10
```

---

## Recommendation Scenarios

```yaml
recommendation_scenarios:
  new_agent_onboarding:
    trigger: agent.registered event
    recommendation_source: domain defaults (top EXEMPLARY KUs per domain)
    delivery: onboarding briefing package
    goal: ensure foundational knowledge coverage
    
    foundational_check:
      all_agents: must have seen all EXEMPLARY KUs tagged foundational in their domains
      track: foundational_knowledge_coverage_score per agent (0.0–1.0)
  
  knowledge_gap_discovery:
    trigger: search.query.zero_results event
    recommendation_source: detect if related KUs exist (partial match)
    delivery: to knowledge steward (not original querier)
    message: "Agent X queried '[query]' — no results found. Possibly related: [KUs]. Consider initiating elicitation."
  
  post_incident_briefing:
    trigger: incident.resolved event
    recommendation_source: INCIDENT_KNOWLEDGE + prevention KUs in incident's domain
    delivery: to all agents in affected org
    timing: within 2 hours of incident resolution
  
  policy_update_notification:
    trigger: KU status changed to ACTIVE where knowledge_type = POLICY_KNOWLEDGE
    recommendation_source: the updated KU
    delivery: to all agents in the KU's governing domain + agents who previously cited this KU
    priority: HIGH (policy changes must propagate quickly)
  
  expertise_broker:
    trigger: agent signals "I don't know how to handle this" via low confidence + manual flag
    recommendation_source: find top expert in the relevant domain (highest quality KUs contributed)
    delivery: suggest connecting with identified expert; surface their top KUs
```

---

## Recommendation Quality

```yaml
recommendation_quality:
  tracking:
    accepted_rate: fraction of recommendations that result in APPLIED or HELPFUL feedback
    target: >= 0.25 (at least 1 in 4 recommendations acted upon)
    
    not_relevant_rate: fraction receiving NOT_RELEVANT
    target: <= 0.20
    
    ignored_rate: fraction with no interaction
    target: <= 0.50
  
  model_retraining_triggers:
    accepted_rate < 0.15 for 7 consecutive days: retrain collaborative model
    not_relevant_rate > 0.35 for 3 consecutive days: reduce recommendation volume; retrain
    new_KUs_added > 100: trigger content-based model update
  
  a_b_testing:
    capability: run competing recommendation strategies for 10% of agents
    measurement: accepted_rate, application_count, usefulness_score of recommended KUs
    promotion: winning strategy promoted after 14-day test
  
  feedback_loop_architecture:
    feedback → recommendation_model_update → better_recommendations → higher_acceptance → more_feedback
```

---

## Recommendation API

```yaml
recommendation_api:
  endpoint: knowledge-query/v1/recommendations
  method: GET
  
  query_params:
    context: DAILY_BRIEFING | WORKFLOW | ON_DEMAND | ONBOARDING
    domain: string | null                # restrict to domain
    limit: int                           # default: 5, max: 20
  
  response:
    recommendations: [
      {
        unit_id: string
        title: string
        summary: string
        recommendation_reason: string    # human-readable explanation
        recommendation_model: string     # which model produced this
        relevance_score: float
        quality: {tier, overall_quality}
      }
    ]
    foundational_coverage: float | null  # only if context=ONBOARDING
  
  rate_limits: same as knowledge-query-api.md
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-retrieval/semantic-search-engine.md` | Content-based similarity search |
| `knowledge-retrieval/knowledge-query-api.md` | Recommendation API endpoint |
| `knowledge-retrieval/contextual-knowledge-delivery.md` | Delivery of recommendations |
| `knowledge-base/knowledge-quality-system.md` | Quality as recommendation signal |
| `knowledge-governance/knowledge-ownership-system.md` | Expert broker identification |
| `enterprise-telemetry/enterprise-event-bus.md` | Trigger events (incident.resolved, KU.published) |
