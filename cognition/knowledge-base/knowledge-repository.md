# Knowledge Repository

## Purpose
Provides durable, versioned, indexed storage for all knowledge units. The repository is the persistence layer — it handles storage, versioning, indexing for retrieval, access control, and retention. All knowledge creation, update, and archival flows through this system.

---

## Repository Architecture

```
Knowledge Unit Ingest
    ↓
[1. Schema Validation]       → validates against knowledge-model.md schema
[2. Taxonomy Validation]     → validates domain, subdomain, tags vs taxonomy
[3. Duplicate Detection]     → semantic similarity check against existing units
[4. Version Assignment]      → assigns version number; links to prior version
[5. Quality Baseline]        → runs initial quality scoring
    ↓
[Primary Store]              → structured document storage (full KU)
[Version Archive]            → immutable historical versions
[Search Indexes]             → multiple indexes for different retrieval modes
[Graph Store]                → relationship graph (unit → unit edges)
[Embedding Store]            → vector embeddings for semantic search
    ↓
[Post-Ingest Actions]
    ├── [Cache Invalidation]    → clear stale search caches
    ├── [Relationship Detector] → find related existing units
    └── [Owner Notification]    → alert owner of related units
```

---

## Storage Layers

### Primary Store

Full knowledge unit documents:

```yaml
primary_store:
  format: structured JSON (schema enforced)
  indexing:
    primary_key: unit_id
    secondary_keys: [slug, title, domain, status]
  compression: gzip for units > 10KB
  encryption: at-rest encryption for RESTRICTED and CONFIDENTIAL access levels
  
  read_path:
    by_id: < 10ms
    by_slug: < 20ms
    by_query: < 200ms (simple), < 2s (complex)
  
  write_path:
    create: < 500ms (including index updates)
    update: < 1s (triggers version archival)
    delete: prohibited (units are archived, not deleted)
```

### Version Archive

Immutable history of all knowledge unit versions:

```yaml
version_archive:
  immutability: write-once; no updates or deletes
  format: diff from prior version + full snapshot every 5 versions
  
  version_record:
    unit_id: string
    version_id: string
    version_number: string
    created_at: ISO-8601
    created_by: agent-id
    changes_summary: string
    diff: {added_fields: {}, changed_fields: {}, removed_fields: []}
    full_snapshot: boolean   # true for every 5th version
    snapshot_ref: string | null   # reference to full snapshot if not embedded
  
  retention: permanent (knowledge versions never purged)
  query_targets: retrieve any version by (unit_id, version_number) in < 500ms
```

### Search Indexes

Multiple indexes optimized for different access patterns:

```yaml
search_indexes:
  title_index:
    type: full-text (BM25)
    fields: [title, slug, tags]
    update: synchronous (< 100ms post-write)
    use_case: keyword search
  
  content_index:
    type: full-text (BM25)
    fields: [content.summary, content.body, content.examples.*.description]
    update: asynchronous (< 30s post-write)
    use_case: content search
  
  taxonomy_index:
    type: faceted
    fields: [domain, subdomain, tags, knowledge_type, status, access_level]
    update: synchronous
    use_case: filtered browsing and structured queries
  
  embedding_index:
    type: vector (HNSW approximate nearest neighbor)
    model: enterprise-embedding-model-v2
    dimensions: 1536
    update: asynchronous (< 5 minutes post-write)
    use_case: semantic similarity search
  
  provenance_index:
    type: inverted
    fields: [provenance.origin_refs, provenance.captured_by, provenance.contributing_agents]
    use_case: "find knowledge derived from this workflow/decision/incident"
  
  usage_index:
    type: sorted
    fields: [usage.retrieval_count, usage.usefulness_score, lifecycle.published_at]
    use_case: ranking, trending, recently-published
```

### Graph Store

Relationship graph for traversal queries:

```yaml
graph_store:
  nodes: knowledge_unit_id → {unit_id, title, domain, status, quality.overall_quality}
  
  edges:
    relationship_type: [SUPERSEDES, EXTENDS, CONTRADICTS, SUPPORTS, APPLIES_TO, ...]
    edge_attributes: {created_at, created_by, strength: 0.0–1.0, bidirectional: bool}
  
  traversal_queries:
    find_related: BFS from unit_id with relationship filters
    find_contradicting: directed query on CONTRADICTS edges
    find_support_chain: recursive SUPPORTS traversal
    find_applicability_context: APPLIES_TO traversal
    compute_centrality: PageRank-style influence scoring
  
  query_targets:
    single_hop: < 50ms
    multi_hop (depth ≤ 5): < 500ms
    full_graph_traversal: < 5s (for synthesis tasks)
```

---

## Duplicate Detection

Prevents knowledge fragmentation through redundant units:

```yaml
duplicate_detection:
  triggers: on every new unit submission
  
  methods:
    exact_match:
      check: slug uniqueness (hard constraint)
      check: title near-exact match (> 0.95 string similarity)
    
    semantic_duplicate:
      check: embedding similarity > 0.92 against existing ACTIVE units
      scope: same domain AND same knowledge_type
      action: WARN (do not block; similar units may have different nuance)
    
    content_overlap:
      check: key facts extraction + comparison
      threshold: > 80% fact overlap
      action: WARN with link to potential duplicate
  
  on_potential_duplicate:
    presenter: submitter shown potential duplicates with similarity scores
    options:
      - EXTEND: submit as extension of existing unit
      - SPECIALIZE: submit as a specialization (more specific case)
      - SUPERSEDE: explicitly replace the existing unit
      - PROCEED: create as new (different enough; add relationship manually)
      - CANCEL: abandon submission
```

---

## Access Control

```yaml
access_control:
  levels:
    PUBLIC:
      description: Accessible to all agents and humans in the enterprise
      search: included in all indexes
    
    ORG:
      description: Accessible to members of the owning org and cross-org principals
      search: included in searches for members of owning_org
    
    RESTRICTED:
      description: Specific agent/role list only
      search: only shown to authorized principals
      storage: encrypted at rest
    
    CONFIDENTIAL:
      description: Minimal distribution; explicit access grants only
      search: excluded from all standard indexes (direct ID lookup only)
      storage: encrypted at rest
      audit: all accesses logged with ENHANCED audit
  
  access_check:
    on_every_retrieval: true
    cache_duration: PT5M (authorization decisions cached briefly)
```

---

## Repository Operations API

```yaml
api:
  create:
    endpoint: repository.create(unit: KnowledgeUnit) → unit_id
    validation: schema + taxonomy + duplicate check
    response: {unit_id, version_id, index_status, duplicate_warnings}
  
  get:
    endpoint: repository.get(unit_id, version: "latest" | version_number) → KnowledgeUnit
    access_check: true
    cache: 5-minute TTL for ACTIVE units
  
  update:
    endpoint: repository.update(unit_id, changes: PartialKU, change_summary: string) → version_id
    creates_new_version: true
    access_check: owner | steward | Tier-3+
  
  search:
    endpoint: repository.search(query: SearchQuery) → {results: [KURef], total: int, facets: {}}
    delegates_to: knowledge-retrieval/knowledge-query-api.md
  
  relate:
    endpoint: repository.add_relationship(from_id, to_id, type, strength) → edge_id
    access_check: contributor to either unit
  
  deprecate:
    endpoint: repository.deprecate(unit_id, reason, superseded_by_id) → void
    access_check: owner | Tier-3+
    triggers: label unit DEPRECATED; update search indexes
  
  archive:
    endpoint: repository.archive(unit_id, reason) → void
    access_check: Tier-4+
    triggers: remove from standard search; retain in archive
```

---

## Repository Metrics

```yaml
metrics:
  size:
    total_units_by_status: {ACTIVE, REVIEW, DRAFT, DEPRECATED, ARCHIVED}
    total_units_by_domain: breakdown
    units_per_day_created: time series
    units_per_day_deprecated: time series
  
  health:
    units_without_owner: count (should be 0)
    overdue_for_review: count (next_review < today)
    units_with_quality < 0.60: count
    contested_units: count
    orphaned_units: count (no relationships; possible fragmentation)
  
  usage:
    most_retrieved_this_week: top 10
    least_retrieved_active_units: bottom 10 (candidates for archival)
    retrieval_to_application_rate: overall
    trending_units: retrieval rate increasing > 50% week-over-week
```
