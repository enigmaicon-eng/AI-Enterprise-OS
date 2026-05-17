# Expert Knowledge Elicitation

## Purpose
Extracts tacit knowledge from domain experts — human and AI agents — that cannot be automatically captured from workflow traces or decision records. Experts hold mental models, heuristics, contextual judgments, and pattern recognition that would otherwise remain invisible to the organization. This system makes that knowledge explicit and permanent.

---

## Elicitation Types

```yaml
elicitation_types:
  STRUCTURED_INTERVIEW:
    description: Guided question session with a domain expert
    duration: 30–90 minutes
    output: DOMAIN_KNOWLEDGE or PATTERN_KNOWLEDGE units
    best_for: deep expertise, tacit heuristics, contextual judgment
  
  SCENARIO_WALKTHROUGH:
    description: Expert walks through how they would handle a specific scenario
    duration: 45–60 minutes
    output: PROCESS_KNOWLEDGE or DECISION_KNOWLEDGE units
    best_for: capturing step-by-step reasoning and decision criteria
  
  THINK_ALOUD_PROTOCOL:
    description: Expert narrates their reasoning as they work through a real task
    duration: variable (task-dependent)
    output: DECISION_KNOWLEDGE or PROCESS_KNOWLEDGE units
    best_for: capturing implicit decision steps that experts don't normally articulate
  
  CRITICAL_INCIDENT_TECHNIQUE:
    description: Expert recalls and describes specific past incidents — successes and failures
    duration: 45–75 minutes
    output: INCIDENT_KNOWLEDGE or PATTERN_KNOWLEDGE units
    best_for: high-value past experiences, edge cases, near-misses
  
  KNOWLEDGE_AUDIT:
    description: Systematic review of what an expert knows across a domain
    duration: multiple sessions over 2–5 days
    output: multiple DOMAIN_KNOWLEDGE units; knowledge map
    best_for: onboarding new agents, succession planning, comprehensive knowledge transfer
  
  PEER_COMPARISON:
    description: Two or more experts discuss a topic; facilitator extracts disagreements and resolutions
    duration: 60–90 minutes
    output: DOMAIN_KNOWLEDGE + potentially CONTESTED relationships if disagreement unresolved
    best_for: contested areas, areas with multiple valid approaches
```

---

## Elicitation Session Schema

```yaml
elicitation_session:
  session_id: "ES-uuid"
  session_type: [see elicitation_types]
  
  participants:
    expert: agent-id                 # the knowledge source
    facilitator: agent-id            # the elicitation conductor
    observer: agent-id | null        # optional silent observer / quality checker
  
  subject:
    topic: string
    domain: taxonomy_domain
    subdomain: taxonomy_subdomain
    target_ku_types: [knowledge_type]
    target_gaps: [string]            # what specific knowledge gaps prompted this session
    prior_kus_referenced: [unit_id]  # existing units to build on or verify
  
  session_record:
    scheduled_at: ISO-8601
    completed_at: ISO-8601
    duration_minutes: int
    transcript_ref: ref-id           # pointer to raw transcript storage
    key_extracts: [string]           # facilitator's curated quotes/insights
    themes_identified: [string]      # high-level topics covered
    knowledge_gaps_surfaced: [string] # gaps discovered during session
    follow_up_required: boolean
    follow_up_sessions: [session_id]
  
  output_units:
    ku_drafts_created: [unit_id]
    ku_drafts_updated: [unit_id]
    relationships_added: [{from_id, to_id, type}]
```

---

## Elicitation Question Library

```yaml
question_library:
  opening_questions:
    - "How would you describe your role in [domain] to someone new to the organization?"
    - "What are the three most important things to know about [topic]?"
    - "What do most people get wrong about [topic]?"
  
  deep_dive_questions:
    - "Can you walk me through exactly how you think about [decision type]?"
    - "What signals do you look for before [action]?"
    - "How do you know when something is going wrong with [process]?"
    - "What would you do differently if you had to [scenario] again?"
    - "What are the edge cases that most people miss?"
    - "When does the usual approach fail, and what do you do then?"
  
  tacit_knowledge_questions:
    - "Is there anything you do automatically that you haven't written down anywhere?"
    - "What would a new agent need to know that isn't in the documentation?"
    - "What's the 'unwritten rule' in [domain] that everyone knows but nobody documents?"
    - "What context do you carry in your head that makes [decision] easier?"
  
  validation_questions:
    - "Is this [knowledge unit] still accurate? Has anything changed?"
    - "Would you add anything to this? Does anything need correction?"
    - "How confident are you in this, and under what conditions might it be wrong?"
    - "Can you think of a case where [pattern] doesn't apply?"
  
  scenario_questions:
    - "If you encountered [scenario], what would you do first? Why?"
    - "Walk me through a real time when you faced [situation]. What happened?"
    - "Imagine [edge case condition]. How does your approach change?"
```

---

## Knowledge Extraction from Transcripts

```yaml
transcript_processing:
  storage:
    raw_transcript: stored in secure document store (not primary KU store)
    access_level: RESTRICTED (elicitation transcripts contain raw expert opinions)
    retention: 5 years
  
  extraction_process:
    step_1_theme_identification:
      method: facilitator or AI extracts themes from transcript
      output: theme list with supporting quotes
    
    step_2_ku_drafting:
      method: one KU draft per theme
      initial_fields: title, summary (from theme), key_quotes, domain/type
      confidence_initial: 0.70 (single expert; unvalidated)
    
    step_3_expert_review:
      method: expert reviews KU drafts; confirms or corrects
      deadline: 5 business days from session completion
      on_expert_confirmation: confidence → 0.80; evidence_strength → VALIDATED
    
    step_4_peer_review:
      method: domain steward reviews for consistency with existing units
      checks: contradictions, duplicates, taxonomy correctness
      deadline: 10 business days from expert confirmation
```

---

## Elicitation Program Management

```yaml
program_management:
  knowledge_gap_identification:
    sources:
      - retrieval_failures: queries with no satisfying results → gaps
      - domain_coverage_analysis: domains with < X units → under-documented
      - expert_departure_risk: agents flagged for succession → priority targets
      - incident_knowledge_gaps: repeated incidents with same root_cause → elicitation needed
    
    gap_registry:
      gap_id: string
      domain: string
      description: string
      priority: HIGH | MEDIUM | LOW
      elicitation_status: NOT_STARTED | SCHEDULED | IN_PROGRESS | COMPLETE
  
  expert_registry:
    expert_profile:
      expert_id: agent-id
      domains: [string]
      experience_depth: FOUNDATIONAL | PRACTITIONER | EXPERT | AUTHORITY
      availability: float (0.0–1.0; fraction of working time available)
      past_sessions: [session_id]
      ku_count_contributed: int
      knowledge_quality_contribution: float (avg quality of KUs from this expert)
  
  session_scheduling:
    priority_order:
      1. HIGH-priority gaps with available AUTHORITY-level experts
      2. MEDIUM-priority gaps with EXPERT-level experts
      3. LOW-priority gaps with PRACTITIONER-level experts
    max_sessions_per_expert_per_month: 4
    min_gap_between_sessions: 3 days
  
  program_metrics:
    sessions_completed_this_month: int
    ku_units_produced: int
    avg_quality_of_elicited_kus: float
    top_contributing_experts: [expert_id]
    gap_closure_rate: closed_gaps / total_identified_gaps
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-base/knowledge-model.md` | Target KU schema; provenance.origin_type = EXPERT_ELICITATION |
| `knowledge-base/knowledge-repository.md` | KU draft storage |
| `knowledge-governance/knowledge-ownership-system.md` | Expert registry; knowledge gap tracking |
| `knowledge-capture/pattern-recognition-engine.md` | Pattern detection from elicited knowledge |
| `knowledge-retrieval/knowledge-query-api.md` | Gap detection from query failures |
| `human-review/review-interface-standards.md` | Interface for expert review of KU drafts |
