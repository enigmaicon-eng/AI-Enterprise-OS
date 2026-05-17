# Compensation Library
**ID:** RBK-CPL-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Authoritative catalog of all registered compensation operations available in the Enterprise AI OS. Every reversible action must have a corresponding entry here before it can execute in a REVERSIBLE sandbox. The compensation library defines the inverse operation for each forward action type, specifies what state must be captured in the pre-action snapshot, and declares the preconditions under which the compensation remains valid. Actions without a library entry are treated as IRREVERSIBLE and blocked from REVERSIBLE execution.

---

## Library Entry Schema

```yaml
compensation_entry:
  entry_id: CPL-{NNN}
  version: semver
  
  # Forward action
  forward_action_class: string           # e.g., DATABASE_ROW_UPDATE
  forward_action_pattern:
    operation: string                    # INSERT | UPDATE | DELETE | SET | INVOKE | etc.
    target_type: string                  # what kind of resource
    parameter_schema: {}                 # what parameters the forward action takes
    
  # Compensation operation
  compensation_operation:
    inverse_type: string                 # e.g., DATABASE_ROW_RESTORE
    inverse_operation: string
    execution_steps: [string]            # ordered steps to reverse the forward action
    idempotent: boolean                  # must be true; library rejects non-idempotent compensations
    
  # Snapshot requirements
  snapshot_requirements:
    resource_types: [string]             # what must be captured
    capture_scope: {}                    # scope specification
    minimum_ttl_seconds: number         # minimum compensation window required
    
  # Validity conditions
  preconditions:
    checked_at: REGISTRATION | EXECUTION | BOTH
    conditions: [string]                 # what must be true for compensation to be valid
    
  # Residual effects
  residual_effects: [string]            # what CANNOT be undone even after compensation
  reversibility_class: FULLY_REVERSIBLE | PARTIALLY_REVERSIBLE | CONTEXTUALLY_REVERSIBLE
  
  # Authorization
  minimum_undo_authority: T2 | T3 | T4
  
  # Governance
  registered_by: string
  approved_by: string
  registered_at: ISO8601
  last_reviewed_at: ISO8601
  next_review_due: ISO8601              # annual review required
  status: ACTIVE | DEPRECATED | RETIRED
```

---

## Standard Compensation Catalog

### Database Operations

```yaml
- entry_id: CPL-001
  forward_action_class: DATABASE_ROW_INSERT
  forward_action_pattern: {operation: INSERT, target_type: DATABASE_ROW}
  compensation_operation:
    inverse_type: DATABASE_ROW_DELETE
    inverse_operation: DELETE FROM {table} WHERE {primary_key} = {inserted_id}
    execution_steps:
      - verify row exists (idempotent: if not exists → ALREADY_COMPENSATED)
      - DELETE row by primary key
    idempotent: true
  snapshot_requirements:
    resource_types: [TABLE_SCHEMA]
    capture_scope: {table_name, primary_key_value}
    minimum_ttl_seconds: 3600
  preconditions:
    checked_at: EXECUTION
    conditions: ["row still exists with matching primary key"]
  residual_effects: ["Row delete triggers fired (async subscribers may have acted)"]
  reversibility_class: PARTIALLY_REVERSIBLE
  minimum_undo_authority: T2

- entry_id: CPL-002
  forward_action_class: DATABASE_ROW_UPDATE
  forward_action_pattern: {operation: UPDATE, target_type: DATABASE_ROW}
  compensation_operation:
    inverse_type: DATABASE_ROW_RESTORE
    inverse_operation: UPDATE {table} SET {previous_fields} WHERE {primary_key} = {row_id}
    execution_steps:
      - load previous field values from snapshot
      - UPDATE row to previous values (idempotent by value comparison)
    idempotent: true
  snapshot_requirements:
    resource_types: [DATABASE_ROW]
    capture_scope: {table, row_id, all_columns}
    minimum_ttl_seconds: 3600
  preconditions:
    checked_at: EXECUTION
    conditions: ["row still exists", "no concurrent modification after snapshot (check row version)"]
  residual_effects: []
  reversibility_class: FULLY_REVERSIBLE
  minimum_undo_authority: T2

- entry_id: CPL-003
  forward_action_class: DATABASE_ROW_DELETE
  forward_action_pattern: {operation: DELETE, target_type: DATABASE_ROW}
  compensation_operation:
    inverse_type: DATABASE_ROW_RECREATE
    inverse_operation: INSERT INTO {table} ({columns}) VALUES ({snapshot_values})
    execution_steps:
      - load row content from snapshot
      - INSERT with original primary key (idempotent: if already exists → ALREADY_COMPENSATED)
    idempotent: true
  snapshot_requirements:
    resource_types: [DATABASE_ROW]
    capture_scope: {table, row_id, all_columns, foreign_keys}
    minimum_ttl_seconds: 3600
  preconditions:
    checked_at: EXECUTION
    conditions: ["primary key slot available", "foreign key references still valid"]
  residual_effects: ["Row delete events already published to event bus"]
  reversibility_class: PARTIALLY_REVERSIBLE
  minimum_undo_authority: T2
```

### File System Operations

```yaml
- entry_id: CPL-010
  forward_action_class: FILE_CREATE
  forward_action_pattern: {operation: CREATE, target_type: FILE}
  compensation_operation:
    inverse_type: FILE_DELETE
    inverse_operation: DELETE file at {path}
    idempotent: true  # if not exists → ALREADY_COMPENSATED
  snapshot_requirements:
    resource_types: [FILESYSTEM_PATH_EXISTENCE]
    capture_scope: {path, pre_exists: false}
    minimum_ttl_seconds: 3600
  residual_effects: []
  reversibility_class: FULLY_REVERSIBLE
  minimum_undo_authority: T2

- entry_id: CPL-011
  forward_action_class: FILE_UPDATE
  forward_action_pattern: {operation: UPDATE, target_type: FILE}
  compensation_operation:
    inverse_type: FILE_RESTORE
    inverse_operation: WRITE previous_content to {path}
    idempotent: true  # restoring same content is idempotent
  snapshot_requirements:
    resource_types: [FILE_CONTENT]
    capture_scope: {path, content_hash, size_bytes}
    minimum_ttl_seconds: 3600
  residual_effects: []
  reversibility_class: FULLY_REVERSIBLE
  minimum_undo_authority: T2

- entry_id: CPL-012
  forward_action_class: FILE_DELETE
  forward_action_pattern: {operation: DELETE, target_type: FILE}
  compensation_operation:
    inverse_type: FILE_RECREATE
    inverse_operation: WRITE snapshot_content to {path}
    idempotent: true
  snapshot_requirements:
    resource_types: [FILE_CONTENT, FILE_METADATA]
    capture_scope: {path, full_content, permissions, owner}
    minimum_ttl_seconds: 3600
  residual_effects: []
  reversibility_class: FULLY_REVERSIBLE
  minimum_undo_authority: T2
```

### Configuration Operations

```yaml
- entry_id: CPL-020
  forward_action_class: CONFIG_KEY_SET
  forward_action_pattern: {operation: SET, target_type: CONFIG_KEY}
  compensation_operation:
    inverse_type: CONFIG_KEY_RESTORE
    inverse_operation: SET {key} = {previous_value} at {config_path}
    idempotent: true
  snapshot_requirements:
    resource_types: [CONFIG_KEY_VALUE]
    capture_scope: {config_path, key, value, version}
    minimum_ttl_seconds: 86400
  preconditions:
    checked_at: EXECUTION
    conditions: ["key version matches snapshot version (no concurrent modification)"]
  residual_effects: ["Services that already read the new value may have cached it"]
  reversibility_class: CONTEXTUALLY_REVERSIBLE
  minimum_undo_authority: T3
```

### Agent State Operations

```yaml
- entry_id: CPL-030
  forward_action_class: AGENT_TRUST_ADJUSTMENT
  forward_action_pattern: {operation: ADJUST, target_type: TRUST_SCORE}
  compensation_operation:
    inverse_type: AGENT_TRUST_RESTORE
    inverse_operation: SET trust(from, to, domain) = {previous_score}
    idempotent: true
  snapshot_requirements:
    resource_types: [TRUST_SCORE]
    capture_scope: {from_agent_id, to_agent_id, domain, score, confidence}
    minimum_ttl_seconds: 3600
  residual_effects: []
  reversibility_class: FULLY_REVERSIBLE
  minimum_undo_authority: T2

- entry_id: CPL-031
  forward_action_class: BEHAVIORAL_CONTRACT_UPDATE
  forward_action_pattern: {operation: UPDATE, target_type: BEHAVIORAL_CONTRACT}
  compensation_operation:
    inverse_type: BEHAVIORAL_CONTRACT_RESTORE
    inverse_operation: RESTORE contract to previous version from snapshot
    idempotent: true
  snapshot_requirements:
    resource_types: [BEHAVIORAL_CONTRACT]
    capture_scope: {contract_id, full_contract_yaml, version, signature}
    minimum_ttl_seconds: 86400
  preconditions:
    checked_at: EXECUTION
    conditions: ["no new actions executed under the updated contract since forward action"]
  residual_effects: ["Actions already executed under new contract version remain in effect"]
  reversibility_class: CONTEXTUALLY_REVERSIBLE
  minimum_undo_authority: T3

- entry_id: CPL-032
  forward_action_class: SPRINT_TICKET_ASSIGNMENT
  forward_action_pattern: {operation: ASSIGN, target_type: SPRINT_TICKET}
  compensation_operation:
    inverse_type: SPRINT_TICKET_REASSIGN
    inverse_operation: SET ticket.assignee = {previous_assignee}, ticket.sprint = {previous_sprint}
    idempotent: true
  snapshot_requirements:
    resource_types: [SPRINT_TICKET_STATE]
    capture_scope: {ticket_id, assignee, sprint_id, status}
    minimum_ttl_seconds: 1800
  residual_effects: ["Assignee may have already started work; sprint velocity updated"]
  reversibility_class: PARTIALLY_REVERSIBLE
  minimum_undo_authority: T2

- entry_id: CPL-033
  forward_action_class: OKR_SCORE_UPDATE
  forward_action_pattern: {operation: UPDATE, target_type: OKR_KR_SCORE}
  compensation_operation:
    inverse_type: OKR_SCORE_RESTORE
    inverse_operation: RESTORE kr.score = {previous_score}, kr.confidence = {previous_confidence}
    idempotent: true
  snapshot_requirements:
    resource_types: [OKR_STATE]
    capture_scope: {okr_id, kr_id, score, confidence, period}
    minimum_ttl_seconds: 3600
  preconditions:
    checked_at: EXECUTION
    conditions: ["no downstream OKR roll-up has been computed using the new score"]
  residual_effects: ["OKR dashboards may have been viewed with new score"]
  reversibility_class: CONTEXTUALLY_REVERSIBLE
  minimum_undo_authority: T2
```

---

## Library Governance

```yaml
library_governance:
  new_entry_registration:
    required: architecture_review + T3 approval
    test_required: compensating_transaction_integration_test
    idempotency_test: mandatory
    
  annual_review:
    due: annually per entry
    reviewer: Architecture Org
    actions: REAFFIRM | UPDATE | DEPRECATE
    
  deprecation_process:
    mark: DEPRECATED (still executes; warning logged)
    notice_period: 90 days
    then: RETIRED (blocks new registrations; existing compensations honored until TTL)
    
  coverage_audit:
    frequency: quarterly
    check: all action_classes in behavioral contracts have CPL entries
    gap_found: CRITICAL gap — block affected action class until CPL entry registered
```

---

## Integration

```
Feeds into:
  compensating-transaction-engine.md — validates action has compensation before executing
  reversibility-framework.md — compensation type determines reversibility_class
  undo-registry.md — compensation_operation fetched from here at registration
  reversible-execution-system.md — library check is the gate for REVERSIBLE mode

Receives from:
  behavioral-contract-system.md — action classes trigger coverage validation
  Architecture Org review — new entries registered via governance process
```

---

## Governance

**Coverage invariant:** Any action class in any behavioral contract must have a CPL entry; gaps are CRITICAL blockers  
**Idempotency requirement:** Non-idempotent compensations are never accepted into the library  
**Annual review:** Entries without annual reaffirmation auto-flagged DEPRECATED after 18 months  
**Audit:** All library changes (register, update, deprecate, retire) to `memory/rollback-systems/compensation-library-audit.jsonl`
