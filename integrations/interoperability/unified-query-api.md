# Unified Query API
**ID:** INTER-UQA-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Provides a single, consistent query interface across all Enterprise AI OS memory systems — JSONL audit logs, YAML state files, the knowledge base, digital twin states, and event bus history. Without unification, agents must know the specific location and format of every data source. The UQA abstracts the storage layer and provides a uniform query experience.

---

## Query Schema

```yaml
unified_query:
  query_id: string
  requesting_agent: string
  
  target:
    domain: AUDIT | STATE | KNOWLEDGE | TWIN | EVENTS | ANALYTICS
    resource_type: string              # e.g., "workflow_execution", "agent_trust", "okr_state"
    resource_id: string | null         # specific record ID (if known)
    
  filters:
    time_range:
      start: ISO8601 | null
      end: ISO8601 | null
    field_filters: [{field: string, operator: string, value: any}]
    
  projection:
    fields: [string] | null            # null = return all fields
    
  options:
    limit: number                      # max records returned (default: 100, max: 10,000)
    offset: number
    sort_by: string | null
    sort_dir: ASC | DESC
    consistency: EVENTUAL | STRONG
    
  authorization:
    requester_tier: T1 | T2 | T3 | T4 | T5
    purpose: string                    # why is this query needed (for audit)
```

---

## Domain Routing

The UQA routes queries to the correct backend:

| Domain | Backend | Auth Level |
|--------|---------|-----------|
| AUDIT | JSONL segment manager (MEM-INT-002) | T2 (own agent); T3 (any agent) |
| STATE | YAML state files + modification serializer | T2 (read own scope); T3 (read all) |
| KNOWLEDGE | Knowledge base + read replica manager | T1 (public KUs); T2 (all KUs) |
| TWIN | Digital twin state | T2 (read own twin); T3 (read all twins) |
| EVENTS | Event bus history (last 30 days) | T2 |
| ANALYTICS | Product analytics + attribution | T2 (aggregate); T3 (individual) |

Authorization is enforced at the UQA layer — backends do not re-validate (single enforcement point).

---

## Query Execution

```
execute_query(unified_query):

  1. Validate query schema
  2. Authorization check: does requesting_agent have access to target.domain at requested consistency?
  3. Route to backend based on domain:
     AUDIT → segment_manager.query(resource_type, time_range, filters)
     STATE → yaml_store.read(resource_type, resource_id, consistency)
     KNOWLEDGE → knowledge_repo.search(filters, projection)
     TWIN → twin_manager.query(resource_type, filters)
     EVENTS → event_bus.history(resource_type, time_range, filters)
     ANALYTICS → analytics_store.query(resource_type, filters)
  4. Apply projection (field filtering)
  5. Apply limit/offset (pagination)
  6. Log query to memory/runtime/query-log.jsonl (sample 10% for audit)
  7. Return results

Cross-domain query (rare):
  - Execute each domain query independently
  - Join results on shared key (e.g., workflow_id appears in AUDIT and STATE)
  - Joins are client-side (UQA does not perform server-side joins)
```

---

## Standard Resource Types

```yaml
registered_resource_types:
  # AUDIT domain
  workflow_execution: {schema: execution-ledger, key: workflow_id}
  approval_event: {schema: approval-records, key: approval_id}
  agent_invocation: {schema: agent-invocations, key: invocation_id}
  security_event: {schema: security-incidents, key: incident_id}
  autonomy_decision: {schema: autonomy-audit-trail, key: record_id}
  
  # STATE domain
  workflow_state: {schema: workflow-states, key: workflow_id}
  agent_trust: {schema: trust-relationships, key: relationship_id}
  pre_authorization: {schema: pre-authorization-registry, key: pauth_id}
  feature_flag: {schema: feature-flag-registry, key: flag_id}
  
  # KNOWLEDGE domain
  knowledge_unit: {schema: KU, key: KU-*}
  
  # TWIN domain
  org_twin: {schema: org-digital-twin, key: org_id}
  workflow_twin: {schema: workflow-digital-twin, key: workflow_id}
  market_twin: {schema: market-twin, key: snapshot_id}
  customer_twin: {schema: segment-twin, key: segment_id}
  
  # ANALYTICS domain
  feature_scorecard: {schema: feature-scorecard, key: feature_id}
  segment_health: {schema: segment-twin, key: segment_id}
  attribution_record: {schema: attribution-registry, key: attribution_id}
```

---

## Performance Targets

| Domain | P50 Latency | P95 Latency | Max Throughput |
|--------|------------|-------------|----------------|
| STATE | < 20ms | < 50ms | 2,000 QPS |
| KNOWLEDGE | < 50ms | < 100ms | 1,500 QPS |
| TWIN | < 100ms | < 200ms | 500 QPS |
| AUDIT (hot) | < 200ms | < 500ms | 200 QPS |
| AUDIT (archive) | < 10s | < 30s | 20 QPS |
| EVENTS | < 50ms | < 150ms | 1,000 QPS |
| ANALYTICS | < 500ms | < 2s | 100 QPS |

---

## Governance

**Query authorization:** Enforced at UQA layer; backends trust UQA
**Query log:** Sampled 10% to `memory/runtime/query-log.jsonl`; full log for AUDIT queries on constitutional documents
**Resource type registration:** T3 Architecture approval for new resource types
**API versioning:** Managed by api-version-lifecycle-manager.md (internal version)
**Cross-domain joins:** Not supported server-side; client responsibility
