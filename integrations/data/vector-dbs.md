---
integration: Vector Databases (Pinecone / Weaviate / Chroma)
category: data
status: planned
mcp-available: no
connector-agent: enterprise-systems-agent
source-of-truth: semantic embeddings, RAG retrieval, similarity search
data-classification: INTERNAL
gap-reference: GAP-INT-002
created: 2026-05-10
---

# Vector Database Integration

> Vector databases provide semantic search and RAG (Retrieval-Augmented Generation) capabilities for the OS. Three candidate platforms are evaluated: Pinecone (managed cloud), Weaviate (self-hosted or cloud), Chroma (lightweight local). This connector is PLANNED (GAP-INT-002). Until activation, the OS performs exact-match lookups against markdown files in `wiki/` and `memory/`. This document defines the target connector spec, the embedding pipeline, and activation prerequisites.

---

## 1. Ingestion Workflows

**What flows from Vector DB → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Semantic search results (wiki pages) | On-demand query | Any agent needing context retrieval | Per agent request |
| Similar artifact references | On-demand similarity query | artifact-publishing-agent | Per artifact publish |
| Relevant past decisions (ADR lookup) | On-demand query | technical-documentation-agent | Per ADR authoring |
| Related incident patterns | On-demand query | incident-manager-agent | Per incident triage |
| Policy relevance search | On-demand query | compliance-documentation-agent | Per compliance check |
| Agent capability similarity | On-demand query | connector-architecture-agent | Per capability gap analysis |

**Ingestion Protocol:**
```yaml
vector_db_ingestion:
  trigger: on-demand semantic query
  auth:
    pinecone: API key header (api-key)
    weaviate: API key or OIDC bearer token
    chroma: API key (if hosted) or no-auth (local)
  query_pattern:
    type: nearest neighbor (ANN) search
    embedding_model: text-embedding-3-small (OpenAI, 1536 dimensions)
    top_k: 5 (configurable per use case, max 20)
    filter: metadata filters (document_type, agent_scope, date_range)
  transformations:
    - embed query text → 1536-dim vector
    - query index → top-k results with similarity scores
    - filter by score threshold (> 0.75)
    - extract document_id + metadata → OS context
    - route retrieved context to requesting agent
  destination: requesting agent context window (not persisted)
  error_handling: fallback to keyword search in markdown files
```

---

## 2. Publishing Workflows

**What flows from OS → Vector DB:**

| OS Artifact | Vector DB Destination | Publishing Agent | Trigger |
|-------------|----------------------|-----------------|---------|
| Wiki pages (all) | ai_os_wiki index | docs-agent | On wiki update |
| ADR decisions | ai_os_decisions index | technical-documentation-agent | On ADR ratification |
| Incident PIRs | ai_os_incidents index | incident-manager-agent | Post-PIR completion |
| Sprint retrospectives | ai_os_sprints index | delivery-manager-agent | Per sprint close |
| Compliance controls | ai_os_compliance index | compliance-documentation-agent | On control update |
| Agent definitions | ai_os_agents index | connector-architecture-agent | On agent update |

**Publishing Protocol (Embedding Pipeline):**
```yaml
vector_db_publish:
  embedding_pipeline:
    model: text-embedding-3-small
    dimensions: 1536
    chunking:
      strategy: recursive_character
      chunk_size: 512 tokens
      chunk_overlap: 64 tokens
      separators: ["\n\n", "\n", ". ", " "]
    batch_size: 100 chunks per request
  operations:
    pinecone:
      upsert: POST https://index.pinecone.io/vectors/upsert
      delete: POST https://index.pinecone.io/vectors/delete
      namespace: {document_type} (wiki | decisions | incidents | compliance)
    weaviate:
      upsert: POST /v1/objects (batch)
      delete: DELETE /v1/objects/{id}
      class: {DocumentType} (WikiPage | ADR | Incident | Sprint)
    chroma:
      upsert: collection.add(embeddings, documents, metadatas, ids)
      delete: collection.delete(ids=[id])
  metadata_schema:
    document_id: string (source file path hash)
    document_type: wiki | adr | incident | sprint | compliance | agent
    title: string
    created_at: ISO 8601
    updated_at: ISO 8601
    agent_scope: [agent names if scoped]
    classification: INTERNAL | CONFIDENTIAL
  secret_path: vault://integrations/vector-db/api-credentials
  rotation: 90 days
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-VectorDB | VectorDB-to-OS | Conflict Resolution |
|-------|---------------|----------------|---------------------|
| Wiki embeddings | OS pushes on wiki update | Retrieved as context during queries | OS wiki is source; VectorDB is index |
| Decision embeddings | OS pushes on ADR ratification | Retrieved for decision context | OS ADR files are source |
| Incident embeddings | OS pushes post-PIR | Retrieved for incident triage | OS incident log is source |
| Index schema | OS defines collection/index structure | Not synced back | OS schema files are authoritative |

**Sync frequency:** Event-driven writes on document update; no periodic polling. Full re-index trigger available via H-015 review for index schema changes.

**Source-of-truth designator:** OS markdown files are always the source of truth. Vector DB stores derived embeddings. If conflict, OS files win; vector index is re-built from OS files.

---

## 4. Permissions

```yaml
vector_db_permissions:
  auth_method:
    pinecone: API key (header: api-key)
    weaviate: API key or OIDC (Authorization: Bearer)
    chroma: API key (hosted) or unauthenticated (local development)
  service_account: ai-os-vectordb-sa
  operations_allowed:
    - upsert vectors (index write)
    - query vectors (similarity search)
    - fetch vector by ID
    - delete vector by ID
    - list namespaces/collections
  blocked_operations:
    - delete entire index without H-021
    - export all embeddings to external endpoint without H-023
    - create new index without H-015 review
  index_access_control:
    ai_os_wiki: all agents (read)
    ai_os_decisions: all agents (read); technical-documentation-agent (write)
    ai_os_incidents: incident-manager-agent, compliance-documentation-agent (read/write)
    ai_os_compliance: compliance-documentation-agent (write), others (read)
    ai_os_agents: connector-architecture-agent (write), others (read)
  secret_path: vault://integrations/vector-db/api-credentials
  rotation: 90 days
```

**Agent authorization matrix:**

| Agent | Vector DB Permission | Operations |
|-------|---------------------|------------|
| docs-agent | Wiki index write + all read | Embed and index wiki pages |
| technical-documentation-agent | Decisions index write + all read | Embed ADRs and retrieve for context |
| incident-manager-agent | Incidents index write + all read | Embed PIRs, retrieve similar incidents |
| compliance-documentation-agent | Compliance index write + all read | Embed controls, retrieve for audit |
| connector-architecture-agent | Agents index write + all read | Embed agent specs, retrieve for gap analysis |
| All others | All indexes read | Semantic context retrieval |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Query (read) | None (agent autonomous) | — |
| Upsert document embedding | None (agent autonomous) | — |
| Create new index/collection | Human operator | H-015 |
| Delete index | Human operator | H-021 |
| Export embeddings externally | Human operator | H-023 |
| Re-index all documents (full rebuild) | docs-agent self-approves with log | H-018 (bulk) |
| Activate vector DB connector | Human operator + H-015 | H-015 |

---

## 6. Runtime Integration

```yaml
runtime:
  status: PLANNED — not yet active
  target_provider: Pinecone (primary), Chroma (local fallback for development)
  activation_prerequisites:
    - Vector DB account provisioned (Pinecone Serverless or Weaviate Cloud)
    - API credentials stored in Vault
    - Embedding model API key configured (OpenAI or equivalent)
    - Index created: ai_os_wiki, ai_os_decisions, ai_os_incidents, ai_os_compliance, ai_os_agents
    - Initial document ingestion pipeline run (wiki + existing ADRs)
    - H-015 new system authorization completed
  mcp_server: none (custom REST client)
  tools_available:
    - vectordb_query (semantic similarity search)
    - vectordb_upsert (embed and index document)
    - vectordb_delete (remove document from index)
    - vectordb_fetch (retrieve by document ID)
    - vectordb_list_collections
  connection_pool: 5 connections max
  timeout: 10s per query, 30s for batch upsert
  retry_policy: exponential backoff (2s, 4s, 8s), max 3 retries
  circuit_breaker:
    threshold: 5 failures in 120s
    open_duration: 180s
    half_open_probe: 1 request per 60s
    fallback: exact-match keyword search in markdown files
```

**Workaround (pre-activation):** Grep-based keyword search across `wiki/`, `memory/`, and `integrations/` directories. Lower precision than semantic search but sufficient for structured markdown content. All agents use Grep tool directly when vector DB is unavailable.

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| Not provisioned (GAP-INT-002) | Connection refused | Log gap warning; use keyword fallback | Activate per H-015 process |
| Embedding API failure | OpenAI API error | Retry x3; cache last embedding if available | Alert enterprise-systems-agent |
| Query timeout | Response > 10s | Return empty result; fall back to keyword search | Alert if persistent |
| Index not found | 404 from API | Alert enterprise-systems-agent; recreate index | Manual re-index required |
| Rate limit | 429 response | Queue upserts; delay 60s; exponential backoff | Resume after backoff window |
| Vector DB outage | Health check failure | Buffer upserts; use keyword fallback for reads | Replay upsert queue on recovery |

**Degraded mode:** All upsert operations queued in `memory/events/vectordb-upsert-queue.jsonl`. Read operations fall back to Grep-based keyword search. Queue replayed on reconnection using batch upsert. Embedding API failures cause upsert to be skipped (documents not indexed until next update cycle).

---

## 8. Observability

```yaml
observability:
  status: PLANNED — metrics after activation
  target_metrics:
    - vectordb_query_p95_latency:      target: "< 500ms"
    - vectordb_query_success_rate:     target: "> 99%"
    - vectordb_upsert_success_rate:    target: "> 99%"
    - vectordb_index_freshness:        target: "< 1h since last update"
    - vectordb_similarity_score_mean:  target: "> 0.75 (relevance quality)"
    - vectordb_circuit_breaker_trips:  target: "0 per week"
  alerts:
    - condition: "query_success_rate < 98%"
      severity: HIGH
      notify: [enterprise-systems-agent]
    - condition: "index_freshness > 4h"
      severity: MEDIUM
      notify: [docs-agent]
      action: trigger_re_index
    - condition: "circuit_breaker = OPEN"
      severity: HIGH
      notify: [enterprise-systems-agent]
  health_check:
    method: describe index / list collections
    frequency: every 5 minutes
    timeout: 5s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Incorrect embedding upsert | Delete by document_id; re-embed from source file | docs-agent | Anytime |
| Corrupted index | Drop and rebuild from markdown sources | enterprise-systems-agent | Within 4h (rebuild time) |
| Wrong metadata on vectors | Delete + re-upsert with corrected metadata | docs-agent | Anytime |
| Failed partial re-index | Resume from checkpoint (tracked in audit log) | docs-agent | Anytime |

**Rollback guarantee:** Vector DB is a derived store — OS markdown files are always the canonical source. Full index rebuild is always possible by re-embedding all source documents. All upsert operations logged with source document hash, enabling delta reconciliation.

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| Engineers | Raw query results | Document excerpts with similarity scores |
| Architects | Capability gap analysis | Semantic similarity clusters as grouped results |
| Compliance | Policy search results | Structured list with document reference and relevance |
| All agents | Context retrieval | Top-5 relevant chunks injected into agent prompt |

Vector DB results are intermediate — always consumed by an agent before being surfaced to a human audience. audience-transformation-agent applies appropriate framing when vector search results appear in human-facing reports.

---

## 11. Governance

```yaml
governance:
  data_classification: INTERNAL
  activation_gate: H-015 (new external system authorization)
  pii_handling: >
    Vector DB stores embeddings of organizational documents.
    No personal PII should be embedded without explicit H-023 approval.
    Employee names in wiki pages are embedded as part of document content.
    If GDPR erasure request received, relevant document must be deleted from index.
  retention_policy:
    index_vectors: indefinite (refreshed on document update)
    upsert_queue: 7 days (auto-purge after replay)
    audit_log: 1 year
  access_review: quarterly (post-activation, API key holders review)
  data_residency: Pinecone US region or Weaviate Cloud US (confirm with H-003)
  compliance_requirements:
    - GDPR: right to erasure applies to embedded personal data
    - SOC_2_Type_II: access logs for embedding and retrieval operations
  pre_activation_checklist:
    - [ ] Vector DB account provisioned
    - [ ] Embedding model API key configured
    - [ ] Indexes created with correct schema
    - [ ] Initial wiki ingestion completed
    - [ ] H-015 authorization approved
    - [ ] Credentials in Vault
    - [ ] Smoke test: embed 10 docs, query, verify top result
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every query (query hash, collection, top_k, score threshold, result count, agent)
    - Every upsert (document_id, source file hash, chunk count, agent, timestamp)
    - Every delete (document_id, reason, agent)
    - Every circuit breaker state change
    - Every fallback to keyword search (reason, query, agent)
    - Every index rebuild (trigger, document count, duration, result)
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/vectordb-audit.jsonl
  retention: 1 year minimum
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent identifier
    operation: query | upsert | delete | rebuild
    collection: index/collection name
    document_id: source document identifier
    payload_hash: SHA-256 of embedded text
    result: success | failure | fallback
    correlation_id: OS workflow execution ID
```
