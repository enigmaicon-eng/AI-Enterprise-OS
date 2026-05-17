# Knowledge Distillation

## Purpose
Reduces large bodies of knowledge to their essential, highest-value content. Where the synthesis engine combines and integrates knowledge, distillation compresses and simplifies it — producing concise summaries, key fact sheets, decision quick-references, and onboarding digests that make organizational knowledge accessible without requiring navigation of a large knowledge base.

---

## Distillation Types

```yaml
distillation_types:
  DOMAIN_DIGEST:
    description: A concise summary of the most important knowledge in a domain
    input: all ACTIVE, HIGH or EXEMPLARY quality KUs in a domain
    output_length: 1,000–3,000 words
    output_type: DOMAIN_KNOWLEDGE
    knowledge_type: CONTEXT_KNOWLEDGE
    use_case: agent onboarding; domain orientation
    update_trigger: when > 20% of source KUs have been updated since last distillation
  
  ESSENTIAL_FACTS_SHEET:
    description: 10–20 key facts an agent must know to operate in a domain
    input: top-ranked KUs by quality × usage_score in a domain
    output_length: 300–800 words (concise; checklist format)
    output_type: DOMAIN_KNOWLEDGE
    use_case: quick reference; pre-meeting briefing; shift handoff
  
  DECISION_QUICK_REFERENCE:
    description: Distilled decision criteria for the most common decision types
    input: DECISION_KNOWLEDGE units in a domain (highest confidence ones)
    output_format: table of {situation → decision criteria → typical outcome}
    output_length: 500–1,500 words
    output_type: DECISION_KNOWLEDGE
    use_case: reviewer interface injection; agent decision support
  
  INCIDENT_RUNBOOK_DIGEST:
    description: Distilled response playbook from all relevant incident KUs
    input: INCIDENT_KNOWLEDGE in a domain; PROCESS_KNOWLEDGE response playbooks
    output_format: severity-ordered runbook with detection signals + immediate actions
    output_length: 1,000–4,000 words
    output_type: PROCESS_KNOWLEDGE
    use_case: incident response; on-call briefing
  
  POLICY_QUICK_REFERENCE:
    description: Distilled policy guidance for the most commonly encountered policies
    input: POLICY_KNOWLEDGE units by retrieval frequency in a domain
    output_format: policy → interpretation → common exception cases
    output_length: 500–2,000 words
    output_type: POLICY_KNOWLEDGE
    update_trigger: any source policy KU updated
  
  ONBOARDING_PACKAGE:
    description: Complete distillation of essential knowledge for a new agent in a role
    input: all foundational KUs in agent's domains + org context KUs
    output_format: structured onboarding guide with sections by knowledge_type
    output_length: 3,000–8,000 words
    output_type: CONTEXT_KNOWLEDGE
    tags: [human-facing, agent-facing, foundational, evergreen]
    generation_trigger: new agent registration or role change
```

---

## Distillation Algorithm

```yaml
distillation_algorithm:
  step_1_source_ranking:
    rank KUs by: quality.overall_quality × 0.40
               + usage.usefulness_score × 0.30
               + usage.retrieval_count_normalized × 0.20
               + recency_score × 0.10
    
    recency_score:
      published within 90 days: 1.0
      published within 180 days: 0.85
      published within 1 year: 0.70
      older: 0.50
    
    quality_gate: only include KUs with overall_quality >= 0.60
  
  step_2_coverage_check:
    ensure: distillation covers all major subdomains of the target domain
    if_gap_found: include best available KU even if below normal quality threshold (mark as lower confidence)
    report: coverage_score = subdomains_covered / total_subdomains
  
  step_3_fact_extraction:
    extract: key facts, rules, thresholds, patterns from each source KU's structured_data and body
    normalize: express all facts in consistent format
    deduplicate: remove identical facts; merge near-identical
    conflict_detection: flag contradictory facts for human review before including
  
  step_4_organization:
    for DOMAIN_DIGEST: organize by knowledge_type → quality-ranked sequence
    for ESSENTIAL_FACTS: organize by importance (most consequential first)
    for DECISION_QUICK_REFERENCE: organize by situation frequency (most common first)
    for INCIDENT_RUNBOOK_DIGEST: organize by severity (P1 first) then detection signal type
    for POLICY_QUICK_REFERENCE: organize by policy applicability frequency
    for ONBOARDING_PACKAGE: organize by learning progression (foundational → advanced)
  
  step_5_compression:
    target: reduce source word count by 70–85%
    method: extract topic sentences; remove redundant elaborations; keep examples where critical
    preserve: all quantitative thresholds, named entity references, procedural step sequences
    never_compress: warning language, exception conditions, security-critical constraints
  
  step_6_provenance_annotation:
    each_section: cite source KUs with {unit_id, title, quality_tier}
    footer: full source list with links
    note: distillation is a derivative; always link to primary sources for authoritative detail
```

---

## Distillation Quality Controls

```yaml
quality_controls:
  pre_distillation:
    minimum_source_count: 3 (do not distill from fewer than 3 KUs)
    minimum_source_quality: 0.60 average across sources
    conflict_resolution: detect and flag conflicts before distillation; do not silently choose one
  
  post_distillation:
    coverage_score: must be >= 0.80 (at least 80% of subdomains covered)
    accuracy_check: automated fact verification against source KUs (all facts must trace to a source)
    readability: AI-scored for clarity >= 0.75
    human_review: required for ONBOARDING_PACKAGE and INCIDENT_RUNBOOK_DIGEST types
  
  staleness_management:
    distilled_KU_dependency_tracking:
      when source KU updated: check if distilled KU is affected
      if_affected: schedule distilled KU for update within 7 days
    
    full_refresh_schedule:
      DOMAIN_DIGEST: quarterly
      ESSENTIAL_FACTS_SHEET: quarterly
      DECISION_QUICK_REFERENCE: whenever a source DECISION_KNOWLEDGE KU changes
      INCIDENT_RUNBOOK_DIGEST: whenever a source INCIDENT_KNOWLEDGE KU changes
      POLICY_QUICK_REFERENCE: whenever a source POLICY_KNOWLEDGE KU changes
      ONBOARDING_PACKAGE: semi-annually
```

---

## Distillation Job Schema

```yaml
distillation_job:
  job_id: "DJ-uuid"
  distillation_type: [see distillation_types]
  target_domain: string
  target_subdomain: string | null
  target_agent_role: string | null       # for ONBOARDING_PACKAGE
  
  requested_by: agent-id
  requested_at: ISO-8601
  auto_triggered: boolean
  
  source_selection:
    candidate_pool_size: int
    sources_selected: [unit_id]
    sources_excluded: [{unit_id, reason}]
    coverage_score: float
  
  output:
    draft_ku_id: unit_id | null
    word_count: int
    compression_ratio: float             # output_words / total_source_words
    facts_included: int
    conflicts_detected: int
    human_review_required: boolean
  
  status: QUEUED | RUNNING | COMPLETE | FAILED | NEEDS_REVIEW
  completed_at: ISO-8601 | null
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-synthesis/knowledge-synthesis-engine.md` | Distillation as SUMMARY_DISTILLATION synthesis type |
| `knowledge-base/knowledge-repository.md` | Source KU access; distilled KU storage |
| `knowledge-retrieval/knowledge-recommendation-engine.md` | ONBOARDING_PACKAGE delivery |
| `knowledge-retrieval/contextual-knowledge-delivery.md` | INCIDENT_RUNBOOK_DIGEST delivery during incidents |
| `knowledge-governance/knowledge-operations-dashboard.md` | Distillation coverage metrics |
| `case-management/incident-case-management.md` | Incident runbook consumption |
