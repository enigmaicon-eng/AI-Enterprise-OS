# Ontology Deduplication Engine
**ID:** ONT-DED-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + Knowledge Management | **Updated:** 2026-05-16

---

## Purpose

Detects and resolves duplicate, near-duplicate, and semantically equivalent concepts across the Enterprise AI OS ontology and knowledge base. As the OS has grown to v35+ with 25+ subsystems contributed by 17 organizations, ontological drift has produced redundant concepts — "workflow health" vs. "workflow operational status" vs. "workflow performance score" — that fragment organizational cognition. This engine unifies the concept space.

---

## Duplication Taxonomy

| Type | Description | Example | Risk |
|------|-------------|---------|------|
| EXACT_DUPLICATE | Same concept, same name | Two entries for "agent_invocation" | Low — easy to detect |
| SYNONYM_DUPLICATE | Same concept, different names | "churn_risk" vs. "attrition_probability" | Medium — fragmentation |
| PARTIAL_OVERLAP | Concepts overlap but aren't identical | "health_score" vs. "composite_score" | High — conflicting definitions |
| HIERARCHY_CONFLICT | Same concept at different abstraction levels | "workflow_step" vs. "execution_step" | High — reasoning errors |
| CROSS_SYSTEM_DRIFT | Same concept defined differently in two systems | health score thresholds diverge | CRITICAL — behavioral inconsistency |

---

## Detection Methods

### Lexical Analysis
```
- Exact string match: trivially identical concept names
- Edit distance < 3: near-identical names (e.g., "agent_health" vs. "agents_health")
- Common prefix/suffix patterns: detect variant naming of same concept
```

### Semantic Similarity
```
- Embed all concept definitions using text embedding model
- Compute cosine similarity for all concept pairs
- Threshold: cosine_similarity > 0.85 → candidate duplicate
- Threshold: cosine_similarity > 0.95 → likely duplicate (auto-flag)
```

### Structural Analysis
```
- Concepts that always appear together in documents → likely same concept
- Concepts with identical field schemas in different files → likely duplicate
- Concepts cross-referenced from same source documents → likely same
```

### Cross-System Comparison
```
For every concept that appears in 2+ subsystems:
  - Compare field schemas field-by-field
  - Compare value ranges (same 0–1 scale? same enum values?)
  - Compare threshold definitions (same band boundaries?)
  - Flag any divergence as CROSS_SYSTEM_DRIFT
```

---

## Deduplication Protocol

```
Step 1: Automated Detection (weekly sweep, Sunday 03:00 UTC)
  - Run all four detection methods
  - Produce candidate_duplicate_list with similarity scores and evidence
  - Auto-classify by type (EXACT/SYNONYM/PARTIAL/HIERARCHY/CROSS_SYSTEM)
  - Enqueue for resolution

Step 2: Resolution Proposal (automated for EXACT; human for others)
  EXACT_DUPLICATE:
    - Auto-merge: keep canonical definition; redirect all references to it
    - No human review needed; changes logged
    
  SYNONYM_DUPLICATE:
    - Auto-propose: suggest canonical name + alias list
    - Architecture Org review required; 5-day SLA
    
  PARTIAL_OVERLAP:
    - Flag for Architecture Org + owning org review
    - Two options: merge (if overlap > 80%) or differentiate (add clarifying definition)
    - T3 resolution required; 14-day SLA
    
  HIERARCHY_CONFLICT:
    - Architecture Org restructures hierarchy
    - Potentially involves multiple ADRs
    - T3 review; 30-day SLA
    
  CROSS_SYSTEM_DRIFT:
    - CRITICAL: notify both system owners + Architecture Org
    - Resolution required before next release
    - T4 arbitration if orgs disagree; 7-day SLA

Step 3: Resolution Application
  - Update canonical ontology (ontology/canonical-concepts.yaml)
  - Update all references in affected files (via reference-graph from MEM-INT-003)
  - Run global reference validator to confirm no broken references introduced
  - Log resolution to memory/ontology/deduplication-log.jsonl
```

---

## Canonical Concepts Registry

Deduplicated concepts are registered canonically:

```yaml
canonical_concept:
  concept_id: CON-{NNN}
  canonical_name: string
  aliases: [string]                      # all valid alternative names
  
  definition: string                     # authoritative single definition
  
  owner_org: string
  defined_in: string                     # authoritative source document
  
  schema:
    type: string                         # scalar, enum, composite, etc.
    value_range: string | null
    unit: string | null
    
  cross_system_uses: [string]            # systems that reference this concept
  
  deduplication_history: [string]        # which duplicates were merged into this
  last_validated: ISO8601
```

Stored at `ontology/canonical-concepts.yaml`.

---

## Health Metrics

```yaml
ontology_deduplication_health:
  concept_count_total: number
  duplicate_candidates_open: number       # target: 0 (all resolved)
  cross_system_drift_open: number         # target: 0 (CRITICAL — must resolve)
  
  last_sweep: ISO8601
  concepts_deduplicated_30d: number
  avg_resolution_days: number             # target: < 10
  
  ontology_coherence_score: 0.00–1.00    # 1 - (open_candidates / total_concepts)
  # target: > 0.95
```

---

## Governance

**Sweep authority:** Automated (T2); manual trigger any T3+
**EXACT resolution:** Automated
**SYNONYM/PARTIAL resolution:** Architecture Org T3 approval
**CROSS_SYSTEM_DRIFT:** T4 arbitration if orgs disagree
**Canonical concepts registry:** Architecture Org is owner; all changes tracked
**Audit log:** `memory/ontology/deduplication-log.jsonl` (append-only)
