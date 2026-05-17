# Ontology Version History
**ID:** ONT-VH-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Maintains a complete, auditable history of all changes to the Enterprise AI OS ontology — concept definitions, schema changes, hierarchy restructuring, and canonical name changes. Enables rollback to any prior ontology state, diff analysis between versions, and impact assessment for ontology-dependent systems.

---

## Version Schema

Each ontology version is a complete snapshot of the canonical concepts registry at a point in time:

```yaml
ontology_version:
  version_id: ONT-v{MAJOR}.{MINOR}.{PATCH}
  created_at: ISO8601
  created_by: agent_id | string
  
  change_type: MAJOR | MINOR | PATCH
  
  change_summary:
    concepts_added: number
    concepts_removed: number
    concepts_modified: number
    aliases_added: number
    schema_changes: number
    hierarchy_changes: number
    
  change_details:
    - concept_id: string
      change: ADDED | REMOVED | RENAMED | REDEFINED | SCHEMA_CHANGED | ALIAS_ADDED
      before: string | null
      after: string | null
      rationale: string
      
  backward_compatible: boolean         # is this version compatible with prior version?
  breaking_changes: [string]           # list of breaking changes if not backward_compatible
  
  approved_by: string                  # T3 Architecture for MINOR; T4 for MAJOR
  sha256: string                       # SHA-256 of canonical-concepts.yaml at this version
```

---

## Versioning Conventions

```
PATCH (x.y.Z): Alias additions, clarification edits, no schema changes
  - Automatically applied by deduplication engine for exact duplicates
  - No approval required beyond deduplication engine authorization
  
MINOR (x.Y.z): New concepts added, backward-compatible schema additions
  - Architecture Org T3 approval
  - All existing concept references remain valid
  
MAJOR (X.y.z): Concept removals, renames, schema breaking changes, hierarchy restructuring
  - T4 approval required
  - Breaking changes: migration guide required
  - Downstream systems must update within defined deadline (see migration notice)
```

---

## Change Lifecycle

```
Proposal:
  1. Change proposed (via ontology PR / deduplication engine / ADR)
  2. Automated impact analysis: which systems reference affected concepts?
  3. Backward compatibility check: does this break any current references?
  4. Draft migration guide (if MAJOR)
  
Review:
  - PATCH: Architecture Org automated approval
  - MINOR: Architecture Org T3 review (3-day SLA)
  - MAJOR: T4 review; affected system owners notified; 14-day comment period
  
Application:
  1. Update canonical-concepts.yaml
  2. Increment version number
  3. Create version snapshot (append to version history)
  4. Notify downstream systems (via enterprise.knowledge.updates event bus topic)
  5. Update cross-reference integrity graph (MEM-INT-003)
  
Migration (MAJOR only):
  1. Migration guide published with version announcement
  2. Downstream systems have 30 days to update (60 days for CRITICAL systems)
  3. Reference validator reports broken references from old concept names
  4. Old aliases kept for backward compatibility during transition window
  5. Old aliases removed after transition window expires
```

---

## Rollback Protocol

```
Rollback to prior version (in case of ontology error):

  1. Identify target version (version_id to roll back to)
  2. Load canonical-concepts.yaml at that version (from version history snapshot)
  3. Compute diff: what changed between target and current?
  4. Impact analysis: which active workflows/agents use concepts that will change?
  5. If CRITICAL systems affected: T4 approval before rollback
  6. Apply rollback: restore canonical-concepts.yaml from snapshot
  7. Notify downstream systems of rollback
  8. Update reference graph
  9. Log rollback as a new version (MAJOR — X+1.0.0)
  
Note: A rollback is recorded as a NEW version, not an erasure of history.
The full version history is immutable — never overwrite or delete prior versions.
```

---

## Version History Store

```
ontology/version-history/
  ONT-v1.0.0.yaml               ← initial canonical ontology (OS v28)
  ONT-v1.1.0.yaml               ← added customer intelligence concepts (OS v31)
  ONT-v1.2.0.yaml               ← added financial intelligence concepts (OS v32)
  ONT-v1.3.0.yaml               ← added product intelligence concepts (OS v33)
  ONT-v1.4.0.yaml               ← deduplication pass 1 (OS v35)
  ONT-v2.0.0.yaml               ← major hierarchy restructuring (future)
  
  CHANGELOG.md                  ← human-readable summary of each version
  version-index.yaml            ← index of all versions with SHA-256 hashes
```

---

## Integration

- **deduplication-engine.md (ONT-DED-001):** Primary source of PATCH/MINOR version increments
- **global-reference-validator.md (MEM-INT-001):** Uses current version to validate references
- **cross-reference-integrity.md (MEM-INT-003):** Version changes trigger reference graph update
- **knowledge-management/** Knowledge base entries reference canonical concept IDs; version history tracks concept ID stability

---

## Governance

**Version history:** Immutable append-only (never delete or overwrite prior versions)
**MAJOR version approval:** T4 required
**MINOR version approval:** T3 Architecture
**Version index:** `ontology/version-history/version-index.yaml`
**Notification:** Version changes published to `enterprise.knowledge.updates` event bus topic
**Retention:** All versions retained permanently (ontology history is as important as code history)
