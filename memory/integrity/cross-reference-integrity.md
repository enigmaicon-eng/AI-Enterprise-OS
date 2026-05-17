# Cross-Reference Integrity System
**ID:** MEM-INT-003 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org | **Updated:** 2026-05-16

---

## Purpose

Extends the global reference validator (MEM-INT-001) with active integrity enforcement at write time. While the global reference validator runs weekly sweeps, this system validates cross-system references synchronously before writes commit — preventing dangling references from entering the system in the first place. Also maintains a live reference graph for instant impact analysis when records are deleted or modified.

---

## Write-Time Validation

Every write to a structured memory file triggers synchronous cross-reference validation:

```
validate_before_write(file_path, new_content, operation: CREATE|UPDATE|DELETE):

  CREATE / UPDATE:
    1. Parse new_content for all embedded ID references (regex against known patterns)
    2. For each referenced ID:
       a. Check live reference graph (O(1) cache lookup)
       b. If not in cache: query authoritative source (< 100ms SLA)
       c. If ID does not exist: BLOCK write; return BROKEN_REFERENCE error with details
    3. If all references valid: approve write; update reference graph
    4. Record validation event to memory/memory-integrity/integrity-events.jsonl
    
  DELETE:
    1. Look up all inbound references to this record in reference graph
    2. If any inbound references exist:
       a. Classify: are any CRITICAL (active workflow/governance)?
       b. If CRITICAL inbound refs: BLOCK delete; return WOULD_ORPHAN_CRITICAL error
       c. If HIGH inbound refs: soft-block; require T3 approval to proceed
       d. If MEDIUM/LOW: allow delete; flag inbound refs as BROKEN for next sweep
    3. After approved delete: remove all outbound references from graph
    4. Mark inbound references as ORPHANED in reference graph
```

---

## Live Reference Graph

A directed graph maintained in memory and checkpointed every 5 minutes:

```
Nodes: all records in structured memory files (identified by record type + ID)
Edges: directed reference edges (from referencing record → to referenced record)

Edge schema:
  source: {file_path, record_id, field_path}
  target: {record_type, record_id}
  criticality: CRITICAL | HIGH | MEDIUM | LOW   # determined by source context
  created_at: ISO8601
  last_verified: ISO8601

Graph operations:
  add_edge(source, target): O(1) — on write validation pass
  remove_edges_from(source): O(degree) — on source record delete
  get_inbound_refs(target_id): O(1) — for impact analysis
  get_outbound_refs(source_id): O(1) — for record validation

Graph persistence:
  Checkpoint: memory/memory-integrity/reference-graph-checkpoint.bin (every 5 minutes)
  On restart: reload from checkpoint; reconcile against global reference validator sweep
  Size estimate: ~50,000 edges at current OS scale; fits in memory comfortably
```

---

## Impact Analysis API

Before any delete or bulk modification, callers can query impact:

```
analyze_impact(record_id) → impact_report:
  {
    record_id: string,
    direct_dependents: [{record_id, file, criticality}],
    transitive_dependents: [{record_id, file, depth, criticality}],
    
    impact_summary: {
      critical_count: number,
      high_count: number,
      affected_workflows: [string],
      affected_agents: [string]
    },
    
    recommendation: SAFE_TO_DELETE | REQUIRES_REVIEW | BLOCKED
  }

Transitive depth: up to 5 hops (covers most dependency chains)
SLA: < 500ms for direct; < 2s for transitive up to 5 hops
```

---

## Criticality Classification

Reference criticality is determined by the context of the referencing record:

| Referencing Context | Criticality |
|--------------------|-----------  |
| Active workflow state | CRITICAL |
| Constitutional / governance document | CRITICAL |
| Approval chain record | CRITICAL |
| Active scenario or strategic decision | HIGH |
| Knowledge unit (active KU) | HIGH |
| Agent definition | HIGH |
| Archived record | MEDIUM |
| Log/audit reference (backward-looking) | LOW |

---

## Orphan Recovery

When orphaned references are detected (either by write-time deletion or weekly sweep):

```
For each ORPHANED reference:
  1. Assess criticality of the referencing record
  2. CRITICAL orphan: T3 immediate alert; human review required
  3. HIGH orphan: T3 weekly digest entry; auto-flag in source record
  4. MEDIUM/LOW orphan: weekly sweep report entry; no immediate action

Auto-recovery candidates:
  - If orphaned ID matches a renamed record (fuzzy ID match): propose re-link
  - If orphaned workflow state references a deleted workflow: route to DR recovery
  - If orphaned agent reference: check agent registry for renamed agent
  
Manual recovery: T3 can apply reference patch via governance-approved write
All orphan resolutions logged to memory/memory-integrity/orphan-recovery-log.jsonl
```

---

## Integration Points

- **global-reference-validator.md (MEM-INT-001):** Weekly sweep reads from reference graph checkpoint for efficient scanning; graph is the shared state layer
- **jsonl-segment-manager.md (MEM-INT-002):** Segment rotation triggers reference graph snapshot for segment boundary continuity
- **orchestrator-ha.md (ORCH-HA-001):** Orchestrator state replication includes reference graph checkpoint for failover continuity
- **disaster-recovery/dr-plan.md (DR-CORE-001):** Reference graph checkpoint included in hourly backup; recovery rebuilds graph from checkpoint

---

## Health Metrics

```yaml
cross_reference_integrity_health:
  live_graph_nodes: number
  live_graph_edges: number
  orphaned_references: number              # target: 0
  critical_orphans: number                 # target: 0
  
  write_validation_stats:
    validations_last_24h: number
    blocked_writes_last_24h: number        # any block = investigate
    avg_validation_latency_ms: number      # target: < 100ms
    
  graph_health:
    last_checkpoint: ISO8601
    checkpoint_age_minutes: number         # alert if > 10
    last_reconciliation: ISO8601           # weekly reconciliation with sweep
```

---

## Governance

**Write validation:** Always on; cannot be disabled
**Impact analysis:** Available to all T2+ agents (read-only)
**Orphan resolution:** T3 approval required for any reference patch
**Audit:** All blocked writes and orphan resolutions to `memory/memory-integrity/integrity-events.jsonl`
**Graph checkpoint:** `memory/memory-integrity/reference-graph-checkpoint.bin` (5-minute interval)
