# Contextual Knowledge Delivery

## Purpose
Delivers knowledge to agents and humans at the right moment, in the right form, with the right context — without requiring explicit search queries. Where the semantic search engine responds to pull requests, contextual delivery is a push system: it observes what agents are doing and surfaces relevant knowledge proactively, before the agent knows they need it.

---

## Delivery Architecture

```
Event Stream (enterprise event bus)
        ↓
[Context Observer]         → monitors agent activity for delivery triggers
        ↓
[Relevance Engine]         → selects knowledge units relevant to current context
        ↓
[Delivery Format Adapter]  → adapts KU content to the format needed
        ↓
[Delivery Channel]         → injects knowledge into the active workflow/interface
        ↓
[Feedback Collector]       → tracks whether delivered knowledge was used
```

---

## Delivery Triggers

```yaml
delivery_triggers:
  WORKFLOW_ENTRY:
    event: workflow.node.started
    condition: node.type IN [TASK, HUMAN_REVIEW, DECISION_POINT]
    action: surface KUs tagged for this workflow_id or process pattern
    latency_target: < 500ms (knowledge must arrive before human reviewer acts)
  
  DECISION_POINT:
    event: decision.evaluation.started
    condition: decision_model in [TABLE, TREE, SCORING] with complexity > SIMPLE
    action: surface DECISION_KNOWLEDGE matching the decision domain
    latency_target: < 200ms
  
  REVIEW_CONTEXT_LOAD:
    event: human.review.interface.opened
    condition: review_item.risk_level IN [HIGH, CRITICAL]
    action: surface top 5 KUs: relevant policies + recent decisions + similar precedents
    latency_target: < 1s
  
  INCIDENT_DETECTED:
    event: incident.created
    condition: severity IN [P1, P2]
    action: immediately surface response playbooks + known failure modes for incident_type
    latency_target: < 2s (urgent)
  
  CONFIDENCE_THRESHOLD_BREACH:
    event: ai.confidence.below_threshold
    condition: confidence < 0.70
    action: surface relevant POLICY_KNOWLEDGE and DECISION_KNOWLEDGE to guide human reviewer
    latency_target: < 500ms
  
  AGENT_TASK_START:
    event: agent.task.started
    condition: task.domain is set
    action: surface 3 highest-quality KUs matching task domain
    latency_target: < 1s
  
  KNOWLEDGE_GAP_SIGNAL:
    event: search.query.zero_results
    condition: true
    action: notify knowledge steward; no delivery to original requester
    latency_target: N/A (asynchronous)
  
  PERIODIC_BRIEFING:
    event: scheduled (agent session start)
    condition: agent has active cases or workflows
    action: daily briefing of new KUs in agent's domains + updates to KUs they've used
    latency_target: N/A (async briefing, not blocking)
```

---

## Relevance Engine

```yaml
relevance_engine:
  inputs:
    trigger_event: the delivery trigger event
    active_context: {workflow_id, node_id, domain, risk_level, agent_id, active_case_id}
    agent_profile: {domains, tier, prior_retrievals, usefulness_feedback}
  
  selection_algorithm:
    step_1_domain_filter:
      keep: KUs where domain matches context domain OR has cross-org tag
      also_keep: KUs cited in the specific workflow_id (process-specific knowledge)
    
    step_2_type_filter_by_trigger:
      INCIDENT_DETECTED: prefer INCIDENT_KNOWLEDGE + PROCESS_KNOWLEDGE (playbooks)
      DECISION_POINT: prefer DECISION_KNOWLEDGE + POLICY_KNOWLEDGE
      REVIEW_CONTEXT_LOAD: prefer POLICY_KNOWLEDGE + DECISION_KNOWLEDGE + precedents
      WORKFLOW_ENTRY: prefer PROCESS_KNOWLEDGE + DOMAIN_KNOWLEDGE
    
    step_3_rank:
      primary: semantic similarity between trigger context and KU content
      secondary: quality score (EXEMPLARY >> HIGH >> ACCEPTABLE)
      tertiary: recency (newer knowledge preferred for time-sensitive contexts)
      penalty: KUs the current agent has already retrieved in this session (avoid repeats)
    
    step_4_cap:
      max_units_delivered: 5 (brevity; too many KUs reduces signal-to-noise)
      unless trigger = INCIDENT_DETECTED: max = 10 (responders need comprehensive coverage)
  
  relevance_score:
    formula: 0.50 × semantic_similarity + 0.25 × quality_score + 0.15 × recency + 0.10 × usage_signal
    threshold_for_delivery: >= 0.55 (do not push low-relevance knowledge)
```

---

## Delivery Formats

```yaml
delivery_formats:
  INLINE_SNIPPET:
    description: 2–3 sentence excerpt injected into the active interface
    includes: title, summary, quality indicator, link to full KU
    use_when: non-blocking context; quick orientation
    character_limit: 500
  
  CONTEXT_PANEL:
    description: Rich panel with full structured content
    includes: title, full summary, key facts from structured_data, links to related KUs
    use_when: human review interfaces; decision points
    character_limit: 2000
  
  REFERENCE_LIST:
    description: Compact list of KU titles with one-line descriptions
    includes: title, knowledge_type, quality tier, link
    use_when: briefings; when multiple KUs are relevant
    character_limit: 100 per item
  
  BRIEFING_PACKAGE:
    description: Formatted digest of multiple KUs with executive summaries
    includes: grouped by knowledge_type; highlights; what's new since last briefing
    use_when: PERIODIC_BRIEFING trigger; shift handoffs
    character_limit: 5000
  
  EMERGENCY_ALERT:
    description: Immediate high-priority knowledge delivery for P1 incidents
    includes: critical facts, immediate actions, escalation contacts
    use_when: INCIDENT_DETECTED P1
    display: interrupts current interface; must be acknowledged
```

---

## Delivery Channels

```yaml
delivery_channels:
  WORKFLOW_CONTEXT_FRAME:
    description: Knowledge panel in the workflow execution interface
    mechanism: inject KU references into workflow context object
    access: workflow engine reads context → passes to human review interface
  
  REVIEW_INTERFACE_PANEL:
    description: Dedicated knowledge panel in the review interface
    mechanism: review-interface-standards.md panel slot 5 (knowledge context)
    format: CONTEXT_PANEL
  
  AGENT_TASK_CONTEXT:
    description: Knowledge injected into agent task initialization payload
    mechanism: task.knowledge_context field populated at task creation
    format: REFERENCE_LIST or INLINE_SNIPPET
  
  INCIDENT_COMMAND_BRIEF:
    description: Automatic knowledge delivery to incident commander on case creation
    mechanism: incident-case-management.md → delivery system → commander interface
    format: EMERGENCY_ALERT + CONTEXT_PANEL
  
  NOTIFICATION:
    description: Asynchronous delivery for briefings and updates
    mechanism: enterprise event bus → notification router → agent inbox
    format: BRIEFING_PACKAGE
```

---

## Feedback Collection

```yaml
feedback_collection:
  signals:
    USED:
      trigger: agent explicitly marks KU as "applied"
      weight: strong positive signal
    
    HELPFUL:
      trigger: agent clicks "helpful" on delivered KU
      weight: moderate positive signal
    
    NOT_RELEVANT:
      trigger: agent clicks "not relevant" on delivered KU
      weight: strong negative signal → update relevance model
    
    IGNORED:
      trigger: KU delivered but no interaction within 60 seconds
      weight: mild negative signal (may have been useful but unread)
    
    OPENED_FULL_KU:
      trigger: agent opens full KU from snippet
      weight: positive signal (engaged with content)
  
  feedback_uses:
    relevance_model_update: adjust semantic similarity weights per trigger type
    delivery_threshold_calibration: raise threshold if not_relevant rate > 20%
    ku_quality_signal: positive feedback boosts usefulness_score on KU
    trigger_calibration: if WORKFLOW_ENTRY consistently yields IGNORED, reduce max_units
  
  privacy:
    agent_level_aggregation: feedback stored per KU, not per agent for public reporting
    exception: agent's own feedback visible to their steward for coaching
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-retrieval/semantic-search-engine.md` | Underlying retrieval engine |
| `enterprise-telemetry/enterprise-event-bus.md` | Delivery trigger events |
| `human-review/review-interface-standards.md` | Context panel slot |
| `case-management/incident-case-management.md` | Incident delivery trigger |
| `knowledge-base/knowledge-quality-system.md` | Quality as ranking signal |
| `knowledge-governance/knowledge-accuracy-monitor.md` | Feedback loop for accuracy |
