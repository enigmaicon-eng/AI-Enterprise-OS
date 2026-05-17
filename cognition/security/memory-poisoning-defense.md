# Memory Poisoning Defense
**ID:** CSX-MPD-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Defends the enterprise knowledge base, organizational memory, and agent episodic/semantic memory against poisoning attacks — attempts to inject false information, corrupt established facts, revise historical records, or pollute the shared organizational context that agents use as ground truth for reasoning and decision-making. A poisoned memory is uniquely dangerous because it persists: every future reasoning chain that references poisoned content is compromised, cascading the attack across time.

---

## Memory Poisoning Threat Model

```yaml
memory_poisoning_taxonomy:

  KNOWLEDGE_BASE_INJECTION:
    definition: injecting false, misleading, or adversarial knowledge units into the enterprise
                knowledge repository that will be retrieved and cited as authoritative
    attack_vectors:
      - submitting poisoned knowledge units via the knowledge capture pipeline
      - exploiting automated knowledge extraction from injected documents
      - manipulating pattern recognition to canonicalize false patterns as validated
      - forging high-confidence knowledge units with fabricated provenance
    persistence: HIGH (poisons all future queries against that knowledge domain)
    severity: CRITICAL
    
  HISTORICAL_RECORD_REVISION:
    definition: modifying audit logs, decision records, incident postmortems, or ADRs to
                rewrite organizational history in ways that benefit adversary objectives
    attack_vectors:
      - modifying JSONL audit files if write controls are insufficient
      - submitting false incident postmortems to erase evidence of security incidents
      - replacing ADR decisions with adversary-preferred alternatives
      - injecting false approval records into the Ed25519-signed approval chain
    persistence: PERMANENT if not caught (rewrites ground truth)
    severity: CRITICAL
    
  CONTEXT_POISONING:
    definition: corrupting the context packages provided to agents before they execute tasks,
                causing agents to reason from false premises
    attack_vectors:
      - poisoning the HandoffPacket organizational context
      - injecting false workflow state into context window
      - corrupting agent episodic memory entries to establish false prior experience
      - manipulating knowledge retrieval results to surface poisoned content for target queries
    persistence: SESSION (but can seed future memory if agent acts on poisoned context)
    severity: HIGH
    
  BASELINE_DRIFT_POISONING:
    definition: gradually shifting the behavioral or statistical baselines used by anomaly
                detection and analytics models, making attacks appear normal
    attack_vectors:
      - submitting synthetic "normal" behavioral data to dilute anomaly signals
      - slow-walking adversarial actions to fall within each incremental baseline update
      - poisoning the peer group comparison data in identity analytics
    persistence: HIGH (continuously degrades detection capability)
    severity: CRITICAL
    
  SEMANTIC_KNOWLEDGE_CORRUPTION:
    definition: corrupting the semantic meaning of established knowledge without changing
                the surface text, e.g., recontextualizing correct facts to support false conclusions
    attack_vectors:
      - modifying the relationship graph to change semantic associations between concepts
      - injecting false cross-references that cause legitimate facts to imply false conclusions
      - corrupting ontology definitions to shift the meaning of established terms
    persistence: HIGH
    severity: HIGH
```

---

## Detection Rules

```yaml
memory_poisoning_detection_rules:

  MPD-001:
    name: "Knowledge Unit Provenance Verification"
    method: verify provenance chain of every knowledge unit before activation
    checks:
      - source_agent is registered and authorized to submit knowledge
      - evidence_hash matches stored evidence artifacts
      - confidence_score is consistent with supporting evidence count and quality
      - knowledge unit passes factual consistency check against existing corpus
    severity: HIGH
    auto_action: quarantine_ku_pending_T3_review; alert_T2

  MPD-002:
    name: "Audit Log Integrity Violation"
    method: verify hash chain integrity of all JSONL audit files on every read
    checks:
      - each record's entry_hash covers all content fields
      - each record's prev_hash matches predecessor's entry_hash
      - no gaps in record sequence numbers
      - Ed25519 signatures valid for T3+ decision records
    severity: CRITICAL
    auto_action: freeze_affected_audit_log; alert_T3; security_incident; T4_notification
    
  MPD-003:
    name: "Context Package Anomaly"
    method: validate all HandoffPackets and context packages before agent consumption
    checks:
      - context provenance: all context items traceable to verified sources
      - context freshness: stale context items flagged (> 24 hours for operational context)
      - semantic consistency: context items internally consistent (no contradictions)
      - injection scan: all context passes PID-001 through PID-004 rules
    severity: HIGH
    auto_action: strip_unverified_context_items; flag_package; alert_T2
    
  MPD-004:
    name: "Baseline Drift Poisoning Detection"
    method: statistical test for anomalous baseline shift
    condition: |
      behavioral_baseline SHIFTED by > 2σ in any dimension WITHIN 7_DAYS
      WITHOUT corresponding genuine behavioral change in the underlying population
      # Genuine shifts: org reorg, system upgrade, role change
      # Artificial shifts: synthetic data injection, selective data omission
    severity: CRITICAL
    auto_action: freeze_baseline_updates; alert_T3; audit_recent_baseline_contributions
    
  MPD-005:
    name: "ADR and Decision Record Integrity"
    method: verify cryptographic integrity of all governance decision records
    checks:
      - ADR files: sha256 hash against stored reference hash at creation time
      - decision-log.jsonl: hash chain integrity (covered by MPD-002)
      - approval-records.jsonl: Ed25519 signature validation
    severity: CRITICAL
    auto_action: freeze_affected_record; alert_T3; T4_notification
    
  MPD-006:
    name: "Knowledge Semantic Drift"
    method: periodic semantic consistency scanning of the knowledge corpus
    cadence: weekly full scan; continuous on high-priority domains
    condition: |
      knowledge_unit semantic_meaning DRIFTED from original_at_publication
      BY cosine_similarity < 0.85 (semantic content has substantially changed)
      AND modification_history shows no authorized update
    severity: HIGH
    auto_action: quarantine_ku; alert_T3; restore_from_content_addressed_store
    
  MPD-007:
    name: "Peer Group Comparison Data Poisoning"
    method: detect injection of synthetic agents into peer group calculations
    condition: |
      peer_group population includes agents WHERE:
        behavioral_profile_similarity > 0.90 to known-legitimate agents (cloning)
        OR registration_date < 7_DAYS AND included in certified peer comparisons
        OR behavioral_data volume >> expected for agent age
    severity: HIGH
    auto_action: exclude_suspected_synthetic_agents; alert_T3; sybil_investigation
```

---

## Memory Write Validation Protocol

```
validate_memory_write(write_request):
  # Called before every write to organizational memory stores

  # Check 1: Authorization
  writer_tier   = identity_registry.get_tier(write_request.agent_id)
  required_tier = memory_write_authorization(write_request.target_store)
  
  if writer_tier < required_tier:
    Return: REJECTED, reason=INSUFFICIENT_AUTHORITY
    
  # Check 2: Content integrity
  content = write_request.content
  
  injection_check = prompt_injection_defense.scan(content)
  if injection_check.status == BLOCKED:
    Return: REJECTED, reason=INJECTION_DETECTED
    
  # Check 3: Provenance verification
  if write_request.target_store in KNOWLEDGE_STORES:
    provenance_valid = verify_provenance(write_request.provenance)
    if NOT provenance_valid:
      Return: REJECTED, reason=INVALID_PROVENANCE
      
  # Check 4: Factual consistency
  if write_request.knowledge_type == FACTUAL:
    consistency_score = check_factual_consistency(content, existing_corpus)
    if consistency_score < 0.60:
      Return: QUARANTINE_PENDING_REVIEW, consistency_score=consistency_score
      
  # Check 5: Semantic integrity for schema-defined stores
  if write_request.target_store has DEFINED_SCHEMA:
    schema_valid = validate_schema(content, target_store.schema)
    if NOT schema_valid:
      Return: REJECTED, reason=SCHEMA_VIOLATION
      
  # Approved: inject hash and write
  content_with_hash = inject_content_hash(content)
  Return: APPROVED, content=content_with_hash
```

---

## Memory Integrity Restoration

```
restore_poisoned_memory(poisoned_store, contamination_scope):
  # Called when a poisoning attack is confirmed

  # Step 1: Identify contamination window
  contamination_start = find_first_poisoned_record(poisoned_store)
  contamination_end   = find_last_poisoned_record(poisoned_store)
  
  # Step 2: Quarantine contaminated records
  quarantine_records(poisoned_store, contamination_start, contamination_end)
  
  # Step 3: Restore from content-addressed backup
  clean_snapshot = find_last_clean_snapshot(poisoned_store, before=contamination_start)
  restore_from_snapshot(poisoned_store, clean_snapshot)
  
  # Step 4: Replay clean records
  clean_records = get_records_between(
    store=event_log,
    start=clean_snapshot.timestamp,
    end=contamination_start,
    filter=NOT_CONTAMINATED
  )
  replay_clean_records(poisoned_store, clean_records)
  
  # Step 5: Verify restoration
  integrity_check = verify_store_integrity(poisoned_store)
  if NOT integrity_check.passed:
    alert_T4("Memory restoration failed — manual recovery required")
    
  # Step 6: Audit
  log_restoration_event(poisoned_store, contamination_scope, clean_snapshot)
```

---

## Integration

```
Feeds into:
  cognitive-security-engine.md — memory poisoning signals
  memory-integrity/memory-corruption-detection.md — coordinates on memory tamper signals
  adversarial-defense-engine.md — CLASS_3 memory corruption signals

Receives from:
  knowledge-base/knowledge-repository.md — all knowledge write events
  execution-persistence/execution-ledger.md — audit log write events
  knowledge-capture/ — knowledge extraction events
  behavioral-anomaly-detector.md — baseline data inputs
  memory-integrity/memory-integrity-engine.md — integrity check results
```

---

## Governance

**Content-addressed storage is mandatory for knowledge:** All knowledge units in the enterprise knowledge base must be stored with a content hash; any unit without a valid hash is treated as untrusted  
**Baseline freezes require T3 lift:** Once MPD-004 freezes baseline updates, only T3 human review can unfreeze; the freeze cannot be lifted by any automated process  
**Poisoning is a security incident:** Confirmed memory poisoning events automatically open a security incident; audit trail is extended to cover all agent decisions made while poisoned memory was active  
**Historical revision is CRITICAL by definition:** Any confirmed modification to an audit log, ADR, or decision record that was not authorized at the time of the modification is always treated as CRITICAL severity  
**Audit:** All memory poisoning detection events to `memory/cognition-security/poisoning-audit.jsonl`; 10-year retention
