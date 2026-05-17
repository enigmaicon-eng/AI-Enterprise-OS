# Entity Relationship System

## Purpose
Manages the lifecycle of entities and their relationships within the enterprise knowledge graph — from initial entity extraction and resolution through deduplication, merging, canonicalization, and retirement. The entity relationship system is the steward of graph data quality: it ensures that the same real-world entity is not represented as multiple different nodes, that relationships are correctly typed and attributed, and that entity identity remains stable over time even as properties change. Without this system, the graph fragments into disconnected islands of duplicate entities, destroying the relationship traversal that gives the graph its power.

---

## Entity Lifecycle

```
Raw Text / Structured Data
        ↓
[1. Entity Mention Detection]  → identify spans referring to entities
        ↓
[2. Entity Type Classification] → classify as AGENT, TASK, POLICY, OBLIGATION, etc.
        ↓
[3. Entity Resolution]          → match to existing node or declare new entity
        ↓
[4. Canonicalization]           → establish canonical form of entity name
        ↓
[5. Property Integration]       → merge new properties with existing node
        ↓
[6. Deduplication Check]        → verify no duplicate node exists
        ↓
[7. Graph Write]                → upsert into knowledge graph
        ↓
[8. Relationship Extraction]    → extract relationships between resolved entities
        ↓
[9. Relationship Resolution]    → match relationship to existing edge or create new
        ↓
[10. Relationship Write]        → append edge to knowledge graph
```

---

## Entity Resolution Algorithm

```yaml
entity_resolution:
  purpose: |
    Given a mention of an entity in new content, determine whether it refers to
    an existing node in the graph or represents a genuinely new entity.
    Resolution errors cause either fragmentation (missed merge) or fusion (wrong merge).
    Fragmentation creates duplicate nodes; fusion corrupts data by merging distinct entities.

  resolution_pipeline:
    step_1_exact_id_match:
      method: check if mention contains an exact entity ID (agent_id, policy_id, task_id, etc.)
      if_found: confident resolution; no further steps needed
      confidence: 1.00

    step_2_canonical_name_match:
      method: normalize mention (lowercase, remove punctuation, resolve abbreviations);
              lookup in BM25_index on node.name and node.aliases
      threshold: exact normalized match → HIGH confidence
      confidence: 0.95

    step_3_alias_match:
      method: check registered aliases for each candidate; select best match
      threshold: alias match → MEDIUM-HIGH confidence
      confidence: 0.85

    step_4_contextual_vector_match:
      method: embed entity mention in context; ANN search over node embeddings;
              take top candidate if similarity > 0.88 AND type matches
      confidence: similarity_score × 0.90

    step_5_property_corroboration:
      method: for top candidate, verify key properties match (tier, type, domain)
      if_properties_match: confidence × 1.10 (boosted)
      if_properties_conflict: confidence × 0.50 (penalized)

    step_6_resolution_decision:
      RESOLVED: highest candidate score > 0.80 AND no other candidate within 0.10
      AMBIGUOUS: top two candidates within 0.10 of each other → flag for human review
      NEW_ENTITY: all candidates < 0.70 → create new node

  resolution_confidence_required:
    AGENT nodes: >= 0.85 (wrong agent resolution = governance risk)
    POLICY nodes: >= 0.90 (policy confusion = compliance risk)
    TASK nodes: >= 0.75
    KNOWLEDGE nodes: >= 0.60 (merging knowledge is lower risk than merging agents)
    GENERIC ENTITY: >= 0.70

  ambiguity_handling:
    AMBIGUOUS case: write provisional node with UNRESOLVED flag
    human_review_queue: AMBIGUOUS cases queued for resolution within 24h
    auto_escalation: AGENT or POLICY ambiguities escalated to Tier-3+ within 4h
```

---

## Entity Deduplication

```yaml
deduplication:
  purpose: detect and merge duplicate nodes that represent the same real-world entity

  detection_methods:
    BLOCKING_PASS:
      description: group candidate pairs by entity type + first_token_of_name (reduces comparison space)
      output: candidate_pairs for pairwise similarity check

    PAIRWISE_SIMILARITY:
      description: for each candidate pair, compute multi-dimensional similarity
      dimensions:
        name_similarity: Levenshtein distance + Jaccard on tokens (weight: 0.30)
        alias_overlap: fraction of aliases shared (weight: 0.20)
        property_similarity: cosine similarity of key property values (weight: 0.20)
        embedding_similarity: cosine of node embeddings (weight: 0.20)
        relational_similarity: Jaccard on neighbor node sets (weight: 0.10)
      composite_score: weighted sum of dimension scores

    DUPLICATE_THRESHOLD:
      AGENT: composite_score > 0.92 → probable duplicate (review required before merge)
      POLICY: composite_score > 0.95 → probable duplicate
      GENERIC_ENTITY: composite_score > 0.88 → probable duplicate
      AUTO_MERGE: composite_score > 0.98 (near-certain duplicates merged without review)

  merge_protocol:
    step_1_select_canonical: choose node with more edges + higher trust_score as canonical
    step_2_merge_properties: union of all properties; prefer canonical for conflicts
    step_3_merge_aliases: union of all aliases; add non-canonical name as alias
    step_4_redirect_edges: all edges pointing to non-canonical → redirect to canonical
    step_5_merge_community_membership: union of community memberships
    step_6_deprecate_duplicate: mark non-canonical node as MERGED (active = false; canonical_id = canonical)
    step_7_audit: log merge event to audit-trail

  merge_governance:
    AGENT_merge: requires Tier-3+ confirmation before execution
    POLICY_merge: requires Tier-4+ confirmation + compliance lead review
    auto_merge_limit: no more than 100 auto-merges per hour (rate limit prevents bulk errors)
```

---

## Relationship Resolution

```yaml
relationship_resolution:
  purpose: |
    When a new relationship is extracted (e.g., "Agent Alpha delegates to Agent Beta"),
    determine whether this relationship already exists in the graph, or is new.
    Avoid creating duplicate edges for the same relationship.

  resolution_steps:
    step_1_entity_resolution: resolve both source and target entities first
    step_2_edge_lookup: check adjacency_index for existing edges of same type between same nodes
    step_3_temporal_check:
      if_existing_active: check if new relationship is an update or duplicate
        - same properties AND within 1 second: DUPLICATE → skip
        - same properties AND valid_from matches: EXTENSION → update valid_until
        - different properties: UPDATE → close old edge; open new edge
        - contradicting properties: CONFLICT → flag for resolution
      if_no_existing: NEW_RELATIONSHIP → create new edge
    step_4_write: append new edge or update existing per resolution outcome
```

---

## Entity Canonicalization Rules

```yaml
canonicalization:
  AGENT_ENTITIES:
    canonical_id: agent_id field (machine-generated; immutable)
    canonical_name: agent_id (displayed as-is)
    aliases_registered: [display_name, short_name, org_unit/function description]
    never_change: canonical_id; change agent_id = create new entity + deprecate old

  POLICY_ENTITIES:
    canonical_id: policy_id (e.g., POL-AI-001)
    canonical_name: policy_id + policy_name_short
    aliases_registered: [full policy name, obligation references, regulatory citations]

  HUMAN_ENTITIES:
    canonical_id: human_id (enterprise SSO ID)
    canonical_name: display_name from directory
    special_handling: human entities classified CONFIDENTIAL minimum; limited property exposure

  TASK_ENTITIES:
    canonical_id: task_id (workflow-engine assigned)
    aliases: [task_name, workflow_id/task_name, epic/feature reference]

  KNOWLEDGE_ENTITIES:
    canonical_id: knowledge_id (system-assigned)
    deduplication: more aggressive (knowledge nodes merging is lower risk)
    merge_threshold: 0.88 (vs 0.92 for agents)

  name_normalization:
    step_1: lowercase
    step_2: remove leading/trailing whitespace
    step_3: normalize unicode (NFKC)
    step_4: expand registered abbreviations (e.g., "gdpr" → "General Data Protection Regulation")
    step_5: remove punctuation except hyphens and dots in IDs
    stored_as: normalized_name (alongside display name which is not normalized)
```

---

## Entity Quality Metrics

```yaml
entity_quality:
  per_entity_metrics:
    completeness_score:
      formula: filled_required_fields / total_required_fields
      threshold_warn: < 0.70 (node is incomplete)
      threshold_block: < 0.50 (node too incomplete for governance use)

    relationship_density:
      formula: (in_degree + out_degree) / avg_degree_for_node_type
      interpretation: > 1.0 = well-connected; < 0.50 = isolated node (may be orphan or new)

    embedding_quality:
      check: verify embedding is up-to-date (regenerate if properties changed > 30 days ago)
      staleness_threshold: 30 days without embedding refresh

    alias_coverage:
      check: are common aliases registered?
      alert: if alias_match resolution failing frequently for this entity

  system_quality_metrics:
    duplicate_node_rate: target < 0.1% of active nodes are duplicates
    ambiguous_resolution_rate: target < 2% of resolutions are ambiguous
    orphan_node_rate: nodes with 0 edges: target < 5% of active nodes
    stale_embedding_rate: nodes with outdated embeddings: target < 1%

  quality_sweep:
    frequency: daily
    actions:
      - detect and queue orphan nodes for review
      - detect and refresh stale embeddings
      - detect potential duplicates for deduplication pipeline
      - report quality metrics to graph-observability dashboard
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-cognition/graph-cognition-engine.md` | Entity extraction runs in episode ingestion pipeline |
| `graph-cognition/graph-schema.md` | Entity types and relationship types defined here |
| `graph-cognition/graph-index-manager.md` | BM25 and vector indexes used for entity resolution |
| `graph-memory/graph-memory-model.md` | Entity nodes are memory nodes |
| `graph-memory/graph-retrieval-engine.md` | Entity resolution feeds retrieval anchor identification |
| `temporal-knowledge-graphs/relationship-evolution.md` | Relationship resolution triggers evolution events |
| `enterprise-topology/org-relationship-graph.md` | Org entities managed through this system |
