# Sovereignty-Aware Retrieval
**ID:** SVM-SAR-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Ensures that every knowledge retrieval operation in the Enterprise AI OS respects the jurisdiction of both the querying agent and the memory records being retrieved. An agent operating in the EU may not retrieve records partitioned to China without authorization; a query issued from a US-region agent must not surface personal data governed by GDPR without a valid transfer mechanism. Sovereignty-aware retrieval intercepts every query, applies jurisdiction filters, enforces cross-partition rules, and returns only records the requesting agent is legally permitted to access.

**Core guarantee:** No retrieval result set may contain a record from a jurisdiction for which the requesting agent lacks authorization, regardless of semantic relevance.

---

## Retrieval Request Schema

```yaml
retrieval_request:
  request_id: RET-{NNN}
  
  # Requester context
  requester:
    agent_id: string
    deployment_region: string           # physical region where agent is running
    deployment_jurisdiction: JUR-{XX}  # jurisdiction of agent's deployment
    cross_boundary_permits: [CBP-{NNN}] # active cross-boundary permits
    
  # Query
  query:
    semantic_query: string | null       # natural language or embedding query
    structured_filters: {}              # explicit field filters
    content_types: [string]             # what content types to search
    
  # Sovereignty scope
  sovereignty_scope:
    requested_jurisdictions: [JUR-{XX}]  # which jurisdictions to search; default = deployment jurisdiction only
    include_global_partition: boolean    # whether to include PARTITION-GLOBAL
    cross_partition_permit_id: CBP-{NNN} | null
    
  # Output constraints
  output_constraints:
    max_results: number
    include_jurisdiction_metadata: boolean  # always true for audit
    redact_cross_jurisdiction_pii: boolean  # always true for cross-partition results
```

---

## Retrieval Pipeline

```
execute_retrieval(retrieval_request) → RetrievalResult:

  Phase 1 — JURISDICTION RESOLUTION (< 5ms)
    authorized_partitions = resolve_authorized_partitions(retrieval_request)
    
    # Default: only own deployment jurisdiction
    authorized = [PARTITION-{requester.deployment_jurisdiction}]
    
    # Add explicitly requested jurisdictions (if authorized)
    for each requested_jurisdiction in sovereignty_scope.requested_jurisdictions:
      if requested_jurisdiction == requester.deployment_jurisdiction:
        continue  # already included
      permit = check_cross_boundary_permit(
        requester, requested_jurisdiction, retrieval_request.cross_partition_permit_id
      )
      if permit.valid: authorized.append(PARTITION-{requested_jurisdiction})
      else: log CROSS_PARTITION_ACCESS_DENIED (informational; not an error)
      
    if sovereignty_scope.include_global_partition:
      authorized.append(PARTITION-GLOBAL)
      
  Phase 2 — PARTITION-SCOPED QUERY (parallel per authorized partition)
    raw_results = {}
    for partition in authorized_partitions [parallel]:
      partition_results = query_partition(
        partition_id = partition.partition_id,
        query = retrieval_request.query,
        content_type_filter = retrieval_request.query.content_types,
        jurisdiction_filter = partition.jurisdiction
      )
      raw_results[partition.partition_id] = partition_results
      
  Phase 3 — RESULT FILTERING (< 10ms)
    filtered_results = []
    for each record in merge(raw_results):
      
      # Filter 1: Access control
      if not record.access_control.authorized_roles intersects requester.roles:
        skip (not logged — normal access control)
        
      # Filter 2: Sovereignty clearance
      if record.access_control.sovereignty_clearance_required:
        if not requester has sovereignty_clearance for record.jurisdiction:
          skip; log SOVEREIGNTY_CLEARANCE_REQUIRED
          
      # Filter 3: Sensitivity tier
      if record.sensitivity_tier == SOVEREIGN_CRITICAL:
        if not requester.deployment_jurisdiction == record.primary_jurisdiction:
          skip; log SOVEREIGN_CRITICAL_CROSS_JURISDICTION_BLOCKED
          
      # Filter 4: Retention validity
      if record.expires_at < now():
        skip (treat as not found; expired records are as if purged)
        
      filtered_results.append(record)
      
  Phase 4 — DATA MINIMIZATION (before returning to agent)
    for each result in filtered_results:
      if result.primary_jurisdiction != requester.deployment_jurisdiction:
        apply_minimization(result, source_jurisdiction=result.primary_jurisdiction,
                           target_jurisdiction=requester.deployment_jurisdiction)
        
  Phase 5 — AUDIT LOGGING
    log_retrieval_audit(retrieval_request, filtered_results, authorized_partitions)
    
  Phase 6 — RETURN
    return RetrievalResult {
      results: filtered_results,
      jurisdiction_summary: {partition: count for partition in authorized_partitions},
      records_filtered_sovereignty: count,
      cross_partition_records: count
    }
```

---

## Semantic Retrieval with Sovereignty Guardrails

For embedding-based semantic search:

```
semantic_retrieval(query_embedding, retrieval_request):

  1. Sovereignty-aware index selection:
     For each authorized partition:
       select the partition-specific vector index
       (each partition maintains its own embedding index; no shared cross-partition index)
       
  2. Parallel semantic search per partition:
     results_per_partition = []
     for partition in authorized_partitions [parallel]:
       hits = vector_search(
         index = partition.vector_index,
         query = query_embedding,
         top_k = retrieval_request.max_results * 2  # over-fetch to allow for filtering
       )
       results_per_partition.append((partition, hits))
       
  3. Merge and re-rank:
     all_hits = merge_ranked(results_per_partition, strategy=JURISDICTION_WEIGHTED)
     # JURISDICTION_WEIGHTED: slightly boosts results from requester's own jurisdiction
     # to reduce cross-partition retrieval where same information exists locally
     
  4. Apply Phase 3–5 filters from above
  
  Return: filtered, minimized, sovereignty-compliant results
```

---

## Jurisdiction-Weighted Ranking

```yaml
jurisdiction_weighting:
  purpose: prefer locally-jurisdictioned results when semantically equivalent records exist
  
  ranking_adjustment:
    same_jurisdiction_as_requester: +0.10 score boost
    adequacy_decision_jurisdiction: +0.05 boost
    neutral_global_partition: +0.00
    cross_partition_with_permit: -0.05 (slight penalty to discourage over-reliance)
    
  rationale: minimizes cross-partition data flow (data minimization by default)
  override: disabled (scoring is applied; agents cannot request pure semantic ranking ignoring jurisdiction)
```

---

## Audit Trail

Every retrieval operation is logged:

```yaml
retrieval_audit_record:
  request_id: RET-{NNN}
  requester_agent_id: string
  deployment_jurisdiction: JUR-{XX}
  
  partitions_queried: [PART-{XX}]
  total_records_examined: number
  total_records_returned: number
  records_filtered_sovereignty: number
  records_filtered_access_control: number
  cross_partition_records_returned: number
  
  cross_partition_permits_used: [CBP-{NNN}]
  
  query_hash: sha256                    # hash of query (not raw query — PII risk)
  results_hash: sha256                  # hash of result set
  
  duration_ms: number
  timestamp: ISO8601
  
  # Anomaly flags
  sovereignty_violations_blocked: number  # should always be 0 in normal operation
  unexpected_cross_partition_attempt: boolean
```

---

## Performance Targets

| Metric | Target |
|---|---|
| Single-partition retrieval | < 50ms p95 |
| Two-partition retrieval | < 100ms p95 |
| Full multi-partition retrieval | < 200ms p95 |
| Jurisdiction resolution | < 5ms |
| Data minimization overhead | < 10ms per result |
| Audit log write | < 5ms (async, non-blocking) |

---

## Integration

```
Feeds into:
  jurisdiction-aware-orchestration.md — retrieval service called by orchestrator
  sovereignty-aware-topology.md — topology determines which partition replicas to query

Receives from:
  legal-memory-partitioning.md — partition topology and access policies
  regional-cognition-boundaries.md — boundary constraints applied during Phase 3 filtering
  cross-region-federation-controls.md — federation permits determine cross-partition access
  jurisdiction-aware-memory.md — jurisdiction metadata on every record
```

---

## Governance

**No shared cross-partition index:** Each partition maintains its own embedding index; no global index that would bypass jurisdiction filtering  
**Audit completeness:** Every retrieval logged including filtered results count; gaps = CRITICAL  
**SOVEREIGN_CRITICAL records:** Never returned cross-partition regardless of permit; must be accessed in-jurisdiction only  
**Expired record treatment:** Treat as non-existent in all retrieval operations; never surface expired records  
**Audit:** All retrieval operations to `memory/sovereign-memory/retrieval-audit.jsonl` (partitioned by requester jurisdiction)
