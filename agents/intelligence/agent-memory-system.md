# Agent Memory System

## Purpose
Provides each agent with structured, governed memory across three tiers: working memory (active task context), episodic memory (past experience), and semantic memory (integrated knowledge). Memory is what transforms stateless language model calls into continuous, improving agents — it makes past experience available to present reasoning, and present outcomes available to future behavior.

---

## Memory Architecture

```
Agent Working Context
        ↓
[Working Memory]      ← active task context; immediate recall
        ↓ consolidation (on task completion)
[Episodic Memory]     ← experiences: what happened, when, outcome
        ↓ abstraction (pattern recognition)
[Semantic Memory]     ← integrated knowledge: what is generally true
        ↓
[Behavioral Parameters]  ← how memory shapes action (via adaptation engine)
```

---

## Working Memory

```yaml
working_memory:
  description: |
    The active context window for a task in progress. Contains everything the agent
    needs to complete the current task without losing context. Ephemeral — cleared
    when task completes or times out.
  
  capacity:
    hard_limit: governed by underlying model context window
    effective_limit: 80% of hard limit (reserve for safety reasoning and output generation)
    overflow_policy: compress oldest working memory items via summarization
  
  contents:
    task_definition: the current task specification
    active_reasoning_trace: in-progress reasoning steps (from reasoning-engine.md)
    retrieved_knowledge: KUs retrieved for this task (from knowledge-retrieval/)
    retrieved_precedents: similar past experiences from episodic memory
    artifact_drafts: work-in-progress outputs
    active_constraints: governance constraints, policies, constitutional triggers active for this task
    context_from_caller: workflow context, case context, caller metadata
  
  working_memory_schema:
    item:
      item_id: string
      item_type: TASK_DEF | REASONING | KNOWLEDGE | PRECEDENT | DRAFT | CONSTRAINT | CONTEXT
      content: {}
      added_at: ISO-8601
      relevance_score: 0.0–1.0    # used for compression priority (lower → compress first)
      pinned: boolean             # pinned items never compressed (safety constraints, task def)
  
  compression_policy:
    trigger: working memory reaches 80% capacity
    action: compress lowest-relevance non-pinned items to summary form (< 20% original size)
    pinned_items: task_definition, all CONSTRAINT type items (never compressed)
    output: compressed_item preserves key facts; full item archived in episodic memory
```

---

## Episodic Memory

```yaml
episodic_memory:
  description: |
    Long-term record of an agent's experiences — tasks attempted, decisions made,
    outcomes observed, feedback received. Episodic memory is the agent's personal
    history that informs judgment through lived experience rather than abstract knowledge.
  
  episode_schema:
    episode_id: "EP-uuid"
    agent_id: string
    occurred_at: ISO-8601
    
    context:
      task_type: string
      domain: string
      complexity: TRIVIAL | SIMPLE | STANDARD | COMPLEX | EXPERT
      workflow_id: string | null
      case_id: string | null
    
    experience:
      action_taken: string               # what the agent did
      reasoning_approach: string         # which protocol was used
      key_knowledge_applied: [unit_id]  # KUs that influenced the decision
      key_constraints_active: [string]  # governance constraints that shaped action
    
    outcome:
      immediate_result: string
      quality_score: float | null
      feedback_received: [feedback_id]
      outcome_assessment: POSITIVE | NEGATIVE | NEUTRAL | UNKNOWN
      reversal_occurred: boolean
    
    learning:
      what_worked: string | null
      what_failed: string | null
      surprise_factor: 0.0–1.0          # how much did this deviate from expectation?
      knowledge_gaps_identified: [string]
  
  storage:
    capacity: unlimited (external storage; not in context window)
    retention: 3 years of raw episodes; summaries permanent
    compression: episodes older than 90 days compressed to summary form
    indexing:
      by_domain: retrieve episodes from same domain
      by_task_type: retrieve similar past tasks
      by_outcome: retrieve by outcome type (all past failures; all successes)
      semantic: embedding index on action + context (retrieve by similarity)
  
  retrieval:
    at_task_start: retrieve top 5 most similar past episodes automatically
    on_demand: agent can query episodic memory during reasoning
    retrieval_query: {task_type, domain, complexity_estimate, constraints_active}
    similarity_metric: weighted combination of task_type match + domain match + embedding similarity
```

---

## Semantic Memory

```yaml
semantic_memory:
  description: |
    Abstracted, generalized knowledge derived from episodic experiences.
    Where episodic memory says "on 2026-03-14, I found that X worked in this context,"
    semantic memory says "X generally works in contexts like C." Semantic memory is
    the integrated wisdom layer — closer to knowledge units than raw experiences.
  
  distinction_from_enterprise_knowledge_base:
    enterprise_knowledge_base: organizational knowledge (shared across all agents)
    semantic_memory: agent-specific learned abstractions (personal; not automatically shared)
    sharing_path: if agent's semantic memory generalizes to useful organizational knowledge →
                  agent can submit it for capture as a knowledge unit (via workflow-knowledge-extraction.md)
  
  semantic_memory_schema:
    memory_id: "SM-uuid"
    agent_id: string
    
    knowledge_type: PROCEDURAL | CONTEXTUAL | CALIBRATION | BEHAVIORAL
    domain: string
    topic: string
    
    abstraction:
      pattern: string                    # the generalized insight ("When X happens in domain Y, Z is effective")
      confidence: 0.0–1.0
      evidence_count: int               # how many episodes support this abstraction
      evidence_quality: ANECDOTAL | OBSERVED | VALIDATED
      applicable_contexts: string       # conditions under which this holds
      counter_contexts: string | null   # conditions under which this does NOT hold
    
    provenance:
      derived_from_episodes: [episode_id]
      derived_at: ISO-8601
      last_updated: ISO-8601
    
    governance:
      shared_with_org: boolean          # has this been submitted as a knowledge unit?
      org_ku_id: unit_id | null         # if shared, the resulting KU ID
  
  abstraction_engine:
    trigger: agent accumulates >= 5 episodes with similar context + consistent outcome
    method: pattern extraction from episode set → draft semantic memory entry
    quality_check: new semantic memory must not contradict existing VALIDATED semantic memory
    on_contradiction: flag for agent review; both marked CONTESTED until resolved
  
  sharing_policy:
    agent_may_share: any semantic memory that generalizes beyond their specific context
    sharing_process: propose to domain knowledge steward → review → knowledge unit creation
    incentive: agents who contribute validated semantic memory to org knowledge base receive credit in performance metrics
```

---

## Memory Governance

```yaml
memory_governance:
  working_memory:
    retention: cleared on task completion (no persistence)
    exception: task abandonment → snapshot to episodic memory for continuity
    audit: CONSTRAINT-type items are logged before clearing (governance trail)
  
  episodic_memory:
    access_control:
      agent_own_episodes: full read access
      supervisor: read access (for coaching; not used for performance punishment)
      capability_governance_lead: read access for governance investigation
      other_agents: no access (privacy; prevents inter-agent bias)
    
    retention_policy:
      raw_episodes: 3 years; then summarized and archived
      summaries: permanent
      episodes_flagged_as_anomalous: permanent raw retention
    
    right_to_forget:
      trigger: agent decommissioned or role change
      scope: raw episodes purged after 90-day retention window post-decommission
      preserved: summaries (for organizational learning purposes)
  
  semantic_memory:
    review_schedule: agent reviews their own semantic memory quarterly (flag stale abstractions)
    expiry: semantic memories not updated in 12 months flagged for review
    governance_audit: monthly scan for semantic memories that contradict enterprise policy
    on_conflict_with_policy: mark DEPRECATED; corrective learning initiated
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-intelligence/agent-reasoning-engine.md` | Reasoning protocols access working + episodic memory |
| `agent-intelligence/agent-confidence-calibration.md` | Episodic calibration history used for re-calibration |
| `agent-learning/agent-behavioral-adaptation.md` | Semantic memory informs behavioral parameters |
| `knowledge-capture/workflow-knowledge-extraction.md` | Semantic memory contributions → org knowledge units |
| `knowledge-retrieval/knowledge-recommendation-engine.md` | Episodic patterns influence recommendations |
| `agent-performance/agent-performance-tracker.md` | Episode outcomes feed performance metrics |
