# Reversibility Framework
**ID:** REV-FWK-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Defines the universal model for reversible action execution across the Enterprise AI OS. The reversibility framework establishes which actions can be undone, how inverse operations are constructed, and what the conditions are under which compensation is legally and technically possible. Every REVERSIBLE sandbox execution depends on this framework to classify, constrain, and authorize undo operations.

---

## Reversibility Classification

```yaml
reversibility_classes:

  FULLY_REVERSIBLE:
    description: Action can be completely undone with no residual effect
    examples:
      - database row update (original values restorable)
      - configuration key change (previous value known)
      - file overwrite (content snapshotted pre-write)
      - agent trust score adjustment (previous score recorded)
      - sprint assignment change (previous assignment known)
    compensation_confidence: HIGH
    undo_authority: T2
    
  PARTIALLY_REVERSIBLE:
    description: Core state restored but secondary effects may persist
    examples:
      - workflow invocation (workflow state reset, but downstream events may have fired)
      - sprint ticket creation (ticket deleted, but creation event was published to bus)
      - knowledge base article publish (unpublished, but readers may have cached)
    compensation_confidence: MEDIUM
    undo_authority: T3
    residual_effects_documented: required
    
  CONTEXTUALLY_REVERSIBLE:
    description: Reversible only within a time window or when dependent state unchanged
    examples:
      - OKR score update (reversible if no downstream calculations have run)
      - connector credential rotation (reversible if old credential still valid)
      - agent behavioral contract update (reversible if no new actions executed under it)
    compensation_confidence: CONDITIONAL
    undo_authority: T3
    preconditions_checked_at_undo_time: true
    
  IRREVERSIBLE:
    description: Cannot be undone; external effects cannot be recalled
    examples:
      - email or notification sent to real recipients
      - external webhook delivered to third-party system
      - payment or financial transaction committed externally
      - data permanently deleted with no snapshot
      - cryptographic key destroyed
    compensation_confidence: NONE
    handling: BLOCK unless T4 explicitly authorizes with documented justification
```

---

## Reversibility Decision Tree

```
classify_action_reversibility(action_descriptor):

  1. Is the action in the compensation-library.md?
     NO → IRREVERSIBLE (no known inverse operation)
     YES → continue
     
  2. Is pre-action state capturable?
     NO (write-only stream, external sink) → IRREVERSIBLE
     YES → continue
     
  3. Is the action external to the enterprise (reaches third-party systems)?
     YES, with no recall mechanism → IRREVERSIBLE
     YES, with recall API available → CONTEXTUALLY_REVERSIBLE
     NO → continue
     
  4. Are dependent downstream effects containable?
     ALL effects within enterprise boundary → FULLY_REVERSIBLE
     SOME effects cross boundary (events published, notifications sent) → PARTIALLY_REVERSIBLE
     ALL effects cross boundary → IRREVERSIBLE
     
  5. Is there a time-window dependency?
     YES (reversal only valid within N seconds/minutes) → CONTEXTUALLY_REVERSIBLE
     NO → FULLY_REVERSIBLE
     
  Return: reversibility_class, compensation_confidence, undo_authority, preconditions
```

---

## Compensation Construction Rules

```
construct_compensation(forward_action) → compensation_operation:

  Primitive inverses:
    INSERT(table, row)         → DELETE(table, row_id)
    UPDATE(table, row, fields) → UPDATE(table, row, previous_fields_from_snapshot)
    DELETE(table, row)         → INSERT(table, row_from_snapshot)
    CREATE(file, content)      → DELETE(file)
    UPDATE(file, content)      → WRITE(file, previous_content_from_snapshot)
    DELETE(file)               → CREATE(file, content_from_snapshot)
    SET(config, key, value)    → SET(config, key, previous_value_from_snapshot)
    TRUST_ADJUST(agent, delta) → TRUST_ADJUST(agent, -delta)
    ASSIGN(resource, entity)   → ASSIGN(resource, previous_entity_from_snapshot)
    
  Composite action inverses:
    Executed as ordered sequence of primitive inverses, reversed:
    [F1, F2, F3] → compensation = [C3, C2, C1]
    
  Compensation is INVALID if:
    - Pre-action snapshot expired or corrupted
    - Preconditions no longer hold (dependent state changed)
    - Compensation would itself produce IRREVERSIBLE effects
```

---

## Compensation Precondition Validation

Before executing any compensation:

```
validate_compensation_preconditions(compensation_id):

  Load compensation from undo-registry
  Load pre-action snapshot
  
  Check 1 — Snapshot integrity:
    sha256(loaded_snapshot) == compensation.pre_action_snapshot.content_hash
    FAIL → CORRUPTED_SNAPSHOT; escalate T4; do NOT execute compensation
    
  Check 2 — TTL validity:
    now() < compensation.valid_until
    FAIL → COMPENSATION_EXPIRED; undo no longer possible; log for audit
    
  Check 3 — Dependent state unchanged (CONTEXTUALLY_REVERSIBLE only):
    query current state of dependent resources
    compare against dependency_snapshot captured at pre-registration
    if changed: PRECONDITION_FAILED; human review required; T3 immediate
    
  Check 4 — Target resource existence:
    target resource still accessible (not deleted, not moved)
    FAIL → TARGET_MISSING; partial undo; human intervention required
    
  All checks PASS → proceed with compensation execution
  Any check FAIL → abort; do not attempt partial compensation; escalate per authority level
```

---

## Reversibility Metadata Schema

Attached to every action executed under a REVERSIBLE sandbox:

```yaml
reversibility_metadata:
  action_id: ACT-{NNN}
  compensation_id: COMP-{NNN}
  reversibility_class: FULLY_REVERSIBLE | PARTIALLY_REVERSIBLE | CONTEXTUALLY_REVERSIBLE
  compensation_confidence: HIGH | MEDIUM | CONDITIONAL | NONE
  undo_authority: T2 | T3 | T4
  snapshot_id: SNAP-{NNN}
  compensation_ttl: ISO8601
  residual_effects: [string]              # effects that persist even after successful undo
  preconditions: [string]                 # conditions that must hold for compensation to execute
```

---

## Human Disclosure Requirement

For actions classified as PARTIALLY_REVERSIBLE or CONTEXTUALLY_REVERSIBLE, the executing agent must disclose:

```
REVERSIBILITY NOTICE:
  Action: {action_descriptor}
  Reversibility: {class}
  
  What CAN be undone: {list of reversible components}
  What CANNOT be undone: {list of residual effects}
  Undo window: {valid_until}
  Undo authority: {T2 | T3 | T4}
  
  Proceed? [APPROVE | REJECT | REQUEST_FULLY_REVERSIBLE_ALTERNATIVE]
```

---

## Integration

```
Feeds into:
  compensating-transaction-engine.md — uses this framework to build compensation chains
  undo-registry.md — stores reversibility metadata per action
  rollback-dag-engine.md — constructs rollback DAGs using compensation rules here
  reversible-execution-system.md — enforces classification before any forward action

Receives from:
  compensation-library.md — catalog of available inverse operations
  state-snapshot-manager.md — snapshot integrity and storage
  behavioral-contract-system.md — authorized action classes that are reversible
```

---

## Governance

**IRREVERSIBLE actions:** Never executed without T4 authorization; DRY_RUN preview required first  
**Compensation library coverage:** Quarterly audit; any action class without a registered inverse must be blocked until compensation is registered  
**Residual effects disclosure:** Mandatory for PARTIALLY_REVERSIBLE; skipping disclosure = governance violation  
**Audit:** All reversibility classifications logged to `memory/reversible-actions/reversibility-log.jsonl`
