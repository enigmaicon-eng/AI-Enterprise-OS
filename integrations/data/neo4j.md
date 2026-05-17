---
integration: Neo4j
category: data
status: planned
mcp-available: no
connector-agent: enterprise-systems-agent
source-of-truth: knowledge graph, entity relationships, ontology data
data-classification: INTERNAL
gap-reference: GAP-INT-001
created: 2026-05-10
---

# Neo4j Integration

> Neo4j is the enterprise knowledge graph database. The OS uses Neo4j to persist entity relationships — agent-to-agent dependencies, artifact lineage, decision chains, and organizational ontology. This connector is PLANNED (GAP-INT-001): the Neo4j instance has not been provisioned. Until activation, the OS maintains a flat markdown approximation at `memory/knowledge-graph/`. This document defines the target-state connector spec and the activation prerequisites.

---

## 1. Ingestion Workflows

**What flows from Neo4j → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Agent dependency graph | Cypher query on startup | connector-architecture-agent | Session init |
| Artifact lineage chain | On-demand Cypher query | compliance-documentation-agent | Per audit request |
| Decision graph (ADR chain) | On-demand query | technical-documentation-agent | Per ADR review |
| Entity relationship map | Scheduled query | analytics-agent | Weekly |
| Ontology version diff | Change detection query | docs-agent | On schema update |
| Knowledge graph health | Ping + node count query | enterprise-systems-agent | Every 15 min |

**Ingestion Protocol:**
```yaml
neo4j_ingestion:
  trigger: on-demand Cypher query + scheduled batch
  auth: Basic auth (username + password) or bearer token (Neo4j Aura)
  driver: Neo4j Python/JS driver (Bolt protocol, port 7687)
  query_pattern: >
    MATCH (n)-[r]->(m) WHERE n.type = $entity_type
    RETURN n, r, m LIMIT $limit
  transformations:
    - deserialize graph nodes → OS entity schema
    - map relationship types → OS ontology vocabulary
    - extract subgraph → OS in-memory graph slice
    - compute graph metrics (degree, centrality) → OS analytics store
  destination: event-bus topic `integration.neo4j.graph`
  error_handling: retry x3, dead-letter queue, fallback to markdown graph
  pagination: cursor-based (skip/limit) for large result sets
```

---

## 2. Publishing Workflows

**What flows from OS → Neo4j:**

| OS Artifact | Neo4j Destination | Publishing Agent | Trigger |
|-------------|------------------|-----------------|---------|
| New agent registration | (:Agent) node + (:DEPENDS_ON) edges | connector-architecture-agent | Agent onboarding |
| Artifact publish event | (:Artifact)-[:PUBLISHED_BY]->(:Agent) | artifact-publishing-agent | On artifact publish |
| ADR decision | (:Decision)-[:SUPERSEDES]->(:Decision) | technical-documentation-agent | ADR ratification |
| Workflow execution trace | (:Workflow)-[:TRIGGERED]->(:Agent) chain | observability layer | Per workflow |
| Ontology schema update | Schema constraint updates (Cypher DDL) | docs-agent | Ontology version bump |
| Incident causal chain | (:Incident)-[:CAUSED_BY]->(:RootCause) | incident-manager-agent | Post-PIR |

**Publishing Protocol:**
```yaml
neo4j_publish:
  method: Bolt protocol via Neo4j driver (Cypher MERGE statements)
  auth: Basic auth + TLS (Bolt+s)
  idempotency: MERGE on unique node properties (e.g., agent_id, artifact_id)
  transaction_mode: explicit transaction with retry on deadlock
  operations:
    create_node: CREATE (n:Label {props})
    merge_node: MERGE (n:Label {id: $id}) ON CREATE SET n += $props
    create_edge: MATCH (a),(b) MERGE (a)-[:REL_TYPE]->(b)
    update_node: MATCH (n {id: $id}) SET n += $props
  batch_size: 500 nodes per transaction
  secret_path: vault://integrations/neo4j/credentials
  rotation: 90 days
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-Neo4j | Neo4j-to-OS | Conflict Resolution |
|-------|------------|------------|---------------------|
| Agent registry | OS pushes new agent nodes | Neo4j agent graph → OS dependency lookup | OS registry is source; Neo4j mirrors |
| Artifact lineage | OS pushes publish events | Lineage queries → OS audit reports | OS audit log is source; Neo4j enables traversal |
| Ontology schema | OS maintains schema files | Neo4j schema constraints → validation | OS schema files are source; Neo4j enforces |
| Decision chains | OS pushes ADR decisions | Decision graph queries → OS context | OS ADR files are source; Neo4j enables graph traversal |

**Sync frequency:** Event-driven writes for agent/artifact events; weekly full graph reconciliation; on-demand reads for compliance queries.

**Source-of-truth designator:** OS wiki and memory files are source-of-truth for content. Neo4j provides graph traversal, relationship queries, and lineage capabilities that flat files cannot support. On conflict, OS files win; Neo4j is re-synced.

---

## 4. Permissions

```yaml
neo4j_permissions:
  auth_method: Basic auth (username/password) over Bolt+s (TLS)
  service_account: ai-os-neo4j-sa
  database: ai_os_knowledge_graph
  roles:
    ai_os_reader: MATCH, CALL (read-only procedures)
    ai_os_writer: MATCH, MERGE, CREATE, SET, CALL
    ai_os_schema_admin: CREATE CONSTRAINT, CREATE INDEX (schema DDL)
  blocked_operations:
    - DROP DATABASE
    - DELETE all nodes (DETACH DELETE without WHERE clause)
    - apoc.export.* to external endpoints without H-023
  node_labels_allowed:
    - Agent, Artifact, Decision, Workflow, Incident, Entity, OntologyClass
  secret_path: vault://integrations/neo4j/credentials
  rotation: 90 days
```

**Agent authorization matrix:**

| Agent | Neo4j Permission | Operations |
|-------|----------------|------------|
| connector-architecture-agent | Writer | Create/update agent nodes and dependency edges |
| artifact-publishing-agent | Writer | Create artifact nodes and lineage edges |
| technical-documentation-agent | Writer | Create decision/ADR nodes |
| compliance-documentation-agent | Reader | Lineage traversal, audit graph queries |
| analytics-agent | Reader | Graph metrics, relationship analysis |
| docs-agent | Schema admin | Ontology schema updates |
| All others | None | No direct Neo4j access |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Read graph queries | None (agent autonomous) | — |
| Write agent/artifact nodes | None (agent autonomous) | — |
| Schema DDL (constraints, indexes) | docs-agent self-approves + human review | H-009 |
| Export graph to external system | Human operator | H-023 |
| Delete nodes (bulk) | Human operator | H-021 |
| Provision Neo4j instance | Human operator + infrastructure team | H-015 |
| Enable Neo4j connector (activation) | Human operator + H-015 review | H-015 |

---

## 6. Runtime Integration

```yaml
runtime:
  status: PLANNED — not yet active
  activation_prerequisites:
    - Neo4j instance provisioned (AuraDB or self-hosted)
    - Credentials stored in Vault at vault://integrations/neo4j/credentials
    - Network connectivity verified from OS runtime environment
    - Schema initialized (Cypher DDL in integrations/data/neo4j-schema.cypher)
    - H-015 new system authorization completed
  target_connection_type: Neo4j Python driver (Bolt protocol, port 7687)
  mcp_server: none (custom Bolt driver integration)
  tools_available:
    - neo4j_query (Cypher read)
    - neo4j_merge_node (Cypher MERGE)
    - neo4j_create_edge (relationship creation)
    - neo4j_batch_write (transactional bulk write)
    - neo4j_get_subgraph (bounded graph retrieval)
  connection_pool: 5 connections max
  timeout: 10s per query (30s for complex traversals)
  retry_policy: exponential backoff (2s, 4s, 8s), max 3 retries
  circuit_breaker:
    threshold: 5 failures in 120s
    open_duration: 180s
    half_open_probe: 1 request per 60s
    fallback: markdown graph at memory/knowledge-graph/
```

**Workaround (pre-activation):** All knowledge graph data maintained in `memory/knowledge-graph/` as markdown files. Agent dependency graph at `memory/knowledge-graph/agent-dependencies.md`. Artifact lineage at `memory/knowledge-graph/artifact-lineage.md`. These files are the fallback when Neo4j is unavailable.

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| Connection refused (not provisioned) | Bolt connection error | Log GAP-INT-001 warning; use markdown fallback | Activate per H-015 process |
| Auth failure | 401 equivalent (Neo4j status code) | Halt writes; alert enterprise-systems-agent | Credential rotation |
| Query timeout | Response > 10s | Retry with narrower scope; add LIMIT | Alert + query optimization |
| Deadlock | TransientError (Neo4j) | Retry transaction up to 3x with backoff | Auto-retry resolves most deadlocks |
| Schema constraint violation | ClientError on MERGE | Log violation; skip conflicting write | Investigate schema drift |
| Neo4j outage | Health check failure | Fall back to markdown graph | Restore from backup; replay write queue |

**Degraded mode:** When Neo4j unavailable, all graph write events buffered in `memory/events/neo4j-write-queue.jsonl`. Read operations served from markdown approximation. On recovery, queue replayed via batch MERGE operations. Compliance queries deferred until Neo4j reconnects.

---

## 8. Observability

```yaml
observability:
  status: PLANNED — metrics collected after activation
  target_metrics:
    - neo4j_query_p95_latency:       target: "< 500ms"
    - neo4j_write_success_rate:      target: "> 99%"
    - neo4j_connection_pool_usage:   target: "< 80%"
    - neo4j_node_count:              target: "growing (audit weekly)"
    - neo4j_circuit_breaker_trips:   target: "0 per week"
    - neo4j_write_queue_depth:       target: "0 (alert if > 100 queued)"
  alerts:
    - condition: "write_success_rate < 98%"
      severity: HIGH
      notify: [enterprise-systems-agent]
    - condition: "circuit_breaker = OPEN"
      severity: HIGH
      notify: [enterprise-systems-agent, connector-architecture-agent]
    - condition: "write_queue_depth > 500"
      severity: HIGH
      notify: [enterprise-systems-agent]
      action: alert_data_loss_risk
  health_check:
    query: "RETURN 1"
    frequency: every 5 minutes
    timeout: 5s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Created node (incorrect) | MATCH (n {id: $id}) DETACH DELETE n | enterprise-systems-agent | Anytime |
| Created edge (incorrect) | MATCH (a)-[r:TYPE]->(b) DELETE r | connector-architecture-agent | Anytime |
| Schema constraint (incorrect) | DROP CONSTRAINT constraint_name | docs-agent + human | H-009 required |
| Bulk node write (error batch) | Restore from pre-write snapshot | enterprise-systems-agent | Within 24h |

**Rollback guarantee:** All write operations log pre-write state to `memory/events/neo4j-audit.jsonl`. Node deletions are reversible by replaying write queue. Schema changes require H-009 human approval and maintain rollback scripts in `integrations/data/neo4j-migrations/`.

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| Engineers | Graph query results | Raw Cypher result sets with node/edge properties |
| Architects | Dependency graph | Visual Mermaid diagram generated from graph data |
| Compliance | Lineage report | Chronological artifact chain with agent attribution |
| Executives | Knowledge graph summary | Node count by type, relationship density, coverage |

audience-transformation-agent generates TECHNICAL profile for raw graph outputs and EXEC profile for summary reports.

---

## 11. Governance

```yaml
governance:
  data_classification: INTERNAL
  activation_gate: H-015 (new external system authorization)
  pii_handling: >
    Neo4j stores organizational entity data (agent IDs, artifact IDs, decision references).
    No personal PII stored in knowledge graph.
    Employee IDs referenced only as anonymized node properties if needed.
  retention_policy:
    knowledge_graph_nodes: indefinite (organizational memory)
    audit_log: 3 years
    write_queue: 7 days (auto-purge after replay)
  access_review: quarterly (post-activation)
  data_residency: same region as OS runtime environment
  compliance_requirements:
    - SOC_2_Type_II: graph query audit logs as evidence of access control
    - ISO_27001: knowledge graph access control and schema governance
  pre_activation_checklist:
    - [ ] Neo4j instance provisioned
    - [ ] Network firewall rules configured
    - [ ] TLS certificate installed
    - [ ] Schema DDL reviewed by architecture team
    - [ ] H-015 new system authorization approved
    - [ ] Credentials stored in Vault
    - [ ] Health check passing
    - [ ] Smoke test: MERGE 10 agent nodes, MATCH, verify count
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every Cypher write (query hash, node/edge type, agent, result, timestamp)
    - Every schema DDL operation (constraint name, operation, agent, H-009 ref)
    - Every bulk write batch (batch_id, node count, success/failure)
    - Every circuit breaker state change
    - Every fallback to markdown graph (reason, duration)
    - Every activation event (H-015 approval record)
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/neo4j-audit.jsonl
  retention: 3 years
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent identifier
    operation: MERGE | CREATE | MATCH | DELETE | DDL
    node_label: target label type
    payload_hash: SHA-256 of Cypher parameters
    result: success | failure | skipped
    correlation_id: OS workflow execution ID
```
