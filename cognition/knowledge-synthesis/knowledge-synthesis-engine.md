# Knowledge Synthesis Engine

## Purpose
Combines multiple knowledge units into new, higher-order knowledge that could not be derived from any single unit alone. Where knowledge capture records individual observations, synthesis integrates across observations to produce generalizations, frameworks, conflict resolutions, and consolidated views. Synthesis is how the organization builds increasingly sophisticated understanding over time.

---

## Synthesis Architecture

```
Synthesis Request (manual trigger or automated schedule)
        ↓
[1. Source Selection]       → identify KUs to synthesize from
[2. Coherence Check]        → detect conflicts before synthesis
[3. Synthesis Strategy]     → select algorithm for synthesis type
[4. Integration Engine]     → execute synthesis; produce integrated content
[5. Provenance Linking]     → record DERIVED_FROM relationships to all sources
[6. Novelty Assessment]     → how much does this add beyond sources?
[7. Quality Scoring]        → score synthesized unit on all quality dimensions
[8. Review Gate]            → human review for novel synthesis; auto-publish if derivative
```

---

## Synthesis Types

```yaml
synthesis_types:
  CONSOLIDATION:
    description: Merge multiple units on the same topic into a single authoritative unit
    trigger: >= 3 units with semantic similarity > 0.85 and overlapping content
    method: find common facts, merge non-conflicting additions, resolve minor conflicts
    output_type: same knowledge_type as sources
    evidence_strength: max(source evidence_strengths)
    requires_human_review: false (if no conflicts found)
    example: "Consolidate 5 separate PROCESS_KNOWLEDGE units on RFC approval into 1"
  
  GENERALIZATION:
    description: Abstract a general pattern from specific instances
    trigger: >= 5 units that share structural similarity despite different contexts
    method: extract invariant structure; identify variable parts; express as general pattern
    output_type: PATTERN_KNOWLEDGE
    evidence_strength: VALIDATED (if all sources are OBSERVED or higher)
    requires_human_review: true
    example: "5 incident KUs all show config drift → generalize to CONFIG_DRIFT failure pattern"
  
  CROSS_DOMAIN_SYNTHESIS:
    description: Integrate knowledge across multiple domains to produce cross-cutting insight
    trigger: manual request or cross-domain-synthesis.md engine
    method: find cross-domain relationships; identify leverage points
    output_type: RELATIONSHIP_KNOWLEDGE or DOMAIN_KNOWLEDGE
    evidence_strength: OBSERVED (cross-domain assertions require more validation)
    requires_human_review: true
    example: "Governance throughput KUs + incident timing KUs → insight about how governance load causes incident risk"
  
  CONFLICT_RESOLUTION:
    description: Synthesize a resolution for CONTESTED units
    trigger: CONTESTED unit with >= 2 evidence units on each side
    method: adjudication framework; evidence weighing; resolution statement
    output_type: same type as contested unit; supersedes contested unit
    evidence_strength: VALIDATED (resolved conflicts become authoritative)
    requires_human_review: true (Tier-3+ for POLICY and GOVERNANCE domains)
  
  SUMMARY_DISTILLATION:
    description: Extract key facts from a large set of units into a concise summary unit
    trigger: domain has > 50 ACTIVE units with no summary unit
    method: extract highest-confidence facts; structure as domain overview
    output_type: DOMAIN_KNOWLEDGE or CONTEXT_KNOWLEDGE
    evidence_strength: min(source evidence_strengths)
    requires_human_review: false (distillation, not interpretation)
  
  PREDICTIVE_SYNTHESIS:
    description: Combine historical pattern knowledge to generate forward-looking insight
    trigger: explicit analytical request
    method: trend analysis across pattern KUs; extrapolation with uncertainty ranges
    output_type: DOMAIN_KNOWLEDGE with structured_data.predictions field
    evidence_strength: ANECDOTAL (predictions carry inherent uncertainty)
    requires_human_review: true (predictions should not auto-publish)
```

---

## Source Selection Algorithm

```yaml
source_selection:
  for_consolidation:
    method: semantic_similarity clustering
    seed: query or unit_id provided by requester
    candidate_pool: all ACTIVE KUs with cosine_similarity > 0.80 to seed
    filter: same knowledge_type AND same domain
    max_sources: 20
  
  for_generalization:
    method: structural similarity analysis
    seed: a set of units expected to share a pattern
    candidate_pool: all KUs provided + semantically similar KUs
    min_sources: 5
  
  for_cross_domain_synthesis:
    method: graph traversal + semantic expansion
    seed: two domains or two concepts
    candidate_pool: high-quality KUs from both domains with cross-domain tags
    quality_floor: overall_quality >= 0.70
  
  for_conflict_resolution:
    method: CONTRADICTS edge traversal from contested unit
    seed: contested unit_id
    candidate_pool: unit + all units with CONTRADICTS or SUPPORTS relationship
  
  source_quality_requirements:
    minimum_quality_per_source: 0.50
    preferred_minimum: 0.70
    maximum_poor_quality_sources: 0 (do not synthesize from poor quality)
```

---

## Integration Engine

```yaml
integration_engine:
  coherence_check:
    detect: factual contradictions, incompatible applicability conditions, contradictory criteria
    
    on_minor_conflict:
      action: note conflict in synthesized unit as "alternative view"
      flag: add CONTESTED tag to synthesized unit; requires resolution
    
    on_major_conflict:
      action: halt synthesis; alert requester with conflict details
      resolution_path: CONFLICT_RESOLUTION synthesis type
  
  fact_integration:
    method:
      1. extract key facts from each source as structured propositions
      2. deduplicate identical facts
      3. merge compatible facts (same proposition, different supporting evidence)
      4. flag incompatible facts for conflict resolution
      5. rank integrated facts by cumulative evidence_strength
    
    output: ordered list of integrated facts with provenance per fact
  
  synthesis_confidence:
    base: min(source confidence values)
    
    upward_adjustment:
      all_sources_agree: + 0.10
      high_source_count (>= 10): + 0.05
      sources_from_multiple_domains: + 0.05 (cross-validation)
    
    downward_adjustment:
      sources_conflict: - 0.15
      low_source_quality: - 0.10
      predictive_synthesis: - 0.20 (inherent uncertainty)
  
  provenance_linking:
    create_relationship: DERIVED_FROM → all source unit_ids
    store: in graph store + in synthesized KU's provenance.origin_refs
    bidirectional: sources get a "has_synthesis" reference
```

---

## Synthesis Job Schema

```yaml
synthesis_job:
  job_id: "SJ-uuid"
  requested_by: agent-id
  requested_at: ISO-8601
  synthesis_type: [see synthesis_types]
  
  sources:
    seed_query: string | null
    seed_unit_ids: [unit_id]
    selected_sources: [unit_id]         # final source set after selection algorithm
    sources_rejected: [{unit_id, reason}]
  
  output:
    draft_unit_id: unit_id | null
    quality_scores: {completeness, accuracy, clarity, applicability}
    novelty_score: 0.0–1.0              # how much beyond sources; low = mostly distillation
    coherence_score: 0.0–1.0            # no conflicts = 1.0; conflicts present = < 0.70
  
  status: QUEUED | RUNNING | COMPLETE | FAILED | REQUIRES_HUMAN_REVIEW
  completed_at: ISO-8601 | null
  review_assigned_to: agent-id | null
  
  performance:
    duration_seconds: int
    source_count: int
    facts_extracted: int
    facts_integrated: int
    conflicts_detected: int
```

---

## Synthesis Scheduling

```yaml
synthesis_scheduling:
  automated_triggers:
    CONSOLIDATION:
      schedule: weekly
      condition: find clusters of 3+ semantically similar ACTIVE KUs in same domain
      priority: low (offline analysis)
    
    SUMMARY_DISTILLATION:
      schedule: monthly
      condition: domain has > 50 ACTIVE KUs AND no summary DOMAIN_KNOWLEDGE unit
    
    GENERALIZATION:
      schedule: weekly
      condition: pattern_recognition_engine identifies recurring pattern candidate
    
    CONFLICT_RESOLUTION:
      schedule: daily
      condition: CONTESTED units older than 14 days with no resolution in progress
  
  manual_triggers:
    api: knowledge-synthesis/synthesize (POST)
    requires: Tier-2+ authorization for most types; Tier-3+ for CROSS_DOMAIN and PREDICTIVE
  
  rate_limits:
    max_parallel_jobs: 5
    max_jobs_per_day: 50
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-base/knowledge-model.md` | SYNTHESIS origin_type; DERIVED_FROM relationship |
| `knowledge-base/knowledge-repository.md` | Source retrieval; synthesized KU storage |
| `knowledge-synthesis/cross-domain-synthesis.md` | Cross-domain synthesis specialization |
| `knowledge-synthesis/knowledge-distillation.md` | Distillation specialization |
| `knowledge-synthesis/organizational-learning-engine.md` | Synthesis feeds org learning |
| `knowledge-capture/pattern-recognition-engine.md` | Pattern candidates trigger GENERALIZATION |
| `knowledge-governance/knowledge-ownership-system.md` | Synthesized KU ownership assignment |
