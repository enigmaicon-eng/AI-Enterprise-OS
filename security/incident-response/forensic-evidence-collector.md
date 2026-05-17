# Forensic Evidence Collector
**ID:** IRS-FEC-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Collects, preserves, and maintains the chain-of-custody for all forensic evidence generated during security incidents and investigations — including agent state captures, memory dumps, conversation history, network traffic, log exports, and configuration snapshots. The Forensic Evidence Collector ensures that all evidence is collected in a manner that is legally defensible, tamper-evident, jurisdiction-aware, and suitable for use in regulatory proceedings, legal actions, and post-incident analysis.

---

## Evidence Types and Collection Methods

```yaml
evidence_types:

  AGENT_STATE_SNAPSHOT:
    description: complete point-in-time state of an agent at time of incident
    contents: [active_permissions, behavioral_contract, memory_state, active_sessions,
               pending_actions, trust_scores, compliance_state, last_100_actions]
    collection_method: atomic snapshot via agent-runtime API
    collection_trigger: automatic on any quarantine action; on-demand by T2+
    format: structured JSON; signed by collector agent (T3)
    
  CONVERSATION_HISTORY:
    description: full turn-by-turn record of agent sessions relevant to incident
    contents: [all_turns, tool_calls, tool_outputs, timestamps, constitutional_proximity_scores]
    collection_method: session store API; full history without truncation
    sensitivity: may contain adversarial content; RESTRICTED access
    collection_trigger: automatic for constitutional incidents; on-demand for others
    
  NETWORK_CAPTURE:
    description: network traffic associated with incident timeframe
    contents: [flow_records, packet_captures_if_decryptable, dns_logs, connection_metadata]
    collection_method: network-threat-monitor.md flow store + on-demand capture
    time_window: incident_start - 2hr to incident_contained + 1hr
    size_limit: 50GB per incident; additional requires T3 approval
    
  LOG_EXPORT:
    description: all relevant audit logs from involved systems
    sources:
      - canonical-event-schema logs (all agent actions)
      - security-event-correlator correlation-audit.jsonl
      - security-alert-manager alert-audit.jsonl
      - adaptive-compliance compliance decisions
      - identity/authentication events
      - storage access logs
    collection_method: time-bounded export from JSONL stores
    
  MEMORY_DUMP:
    description: in-memory state of affected processes at time of compromise
    use_case: malware analysis; model weight inspection; process injection detection
    collection_method: OS-level memory dump (requires T2 authorization)
    handling: encrypted immediately; chain-of-custody from collection
    
  CONFIGURATION_SNAPSHOT:
    description: system configuration at time of incident
    contents: [agent_manifests, behavioral_contracts, network_rules, policy_states,
               model_versions, dependency_manifests, environment_variables_sanitized]
    sanitization: credentials and secrets removed before storage; locations logged
    
  MALWARE_SAMPLE:
    description: extracted malicious artifacts (files, payloads, injection strings)
    handling: quarantine container; sandbox analysis only; never executed on production
    sharing: TLP:AMBER with AV vendors and ISACs after T3 approval
    
  WITNESS_RECORD:
    description: structured record of observations from analysts involved in incident
    contents: [analyst_id, timestamp, observation, actions_taken, decisions_made]
    integrity: signed by recording analyst; immutable after signing
    
  REGULATORY_EVIDENCE_PACKAGE:
    description: curated evidence package for regulatory disclosure
    authority: Legal Org curates content; T4 signs; provided only to named regulatory authority
    jurisdiction_scope: contains only data from disclosed jurisdiction
```

---

## Collection Protocol

```
collect_evidence(incident_id, evidence_types, scope):

  incident = load_incident(incident_id)
  collection_record = EvidenceCollection {
    collection_id: EVC-{NNN},
    incident_id: incident_id,
    requested_at: now(),
    requested_by: current_agent_id(),
    status: COLLECTING
  }
  
  for evidence_type in evidence_types:
    
    # Authorization check
    if evidence_type in [MEMORY_DUMP, WITNESS_RECORD]:
      require_authorization(min_tier=T2, collection_id=collection_id)
    if evidence_type == REGULATORY_EVIDENCE_PACKAGE:
      require_authorization([Legal_Org, T4], collection_id=collection_id)
      
    # Collect
    raw_evidence = execute_collection(evidence_type, scope, incident.timeline)
    
    # Immediately compute integrity hash
    evidence_hash = sha256(raw_evidence)
    
    # Encrypt at collection (before any storage or transfer)
    encrypted_evidence = encrypt(raw_evidence, key=incident_evidence_key(incident_id))
    
    # Create evidence record
    evidence_record = EvidenceRecord {
      evidence_id: EVD-{NNN},
      collection_id: collection_id,
      evidence_type: evidence_type,
      collected_at: now(),
      collector_id: current_agent_id(),
      jurisdiction: determine_evidence_jurisdiction(scope),
      hash: evidence_hash,
      hash_algorithm: SHA256,
      storage_location: RESTRICTED,    # physical path not in audit log; location registry separate
      chain_of_custody: []
    }
    
    # Append to chain of custody
    append_custody_entry(evidence_record, action=COLLECTED, actor=current_agent_id())
    
    # Store
    store_evidence(encrypted_evidence, evidence_record)
    
  collection_record.status = COMPLETE
  collection_record.evidence_ids = [record.evidence_id for record in collected]
  log_collection(collection_record)
  
  Return: collection_record
```

---

## Chain of Custody

```yaml
chain_of_custody:
  definition: unbroken record of every action taken on an evidence item from collection to presentation
  
  custody_entry_schema:
    entry_id: COC-{NNN}
    evidence_id: EVD-{NNN}
    timestamp: ISO8601
    actor_id: string
    action: COLLECTED | TRANSFERRED | ACCESSED | ANALYZED | COPIED | DISCLOSED | ARCHIVED
    purpose: string
    receiving_party: string | null        # for TRANSFERRED/DISCLOSED
    entry_hash: sha256
    previous_entry_hash: sha256           # hash chain; links to prior custody entry
    
  chain_integrity:
    verification: every custody entry hashed with previous entry's hash
    on_gap: flag as CUSTODY_BREAK; legal team notified; evidence admissibility at risk
    
  access_control:
    read_evidence: T3 SOC (investigation); T4 (oversight); Legal Org (legal review)
    copy_evidence: T3 + purpose logged
    disclose_evidence: Legal Org + T4 sign-off; regulatory disclosure only
    delete_evidence: prohibited during incident; post-close requires T4 + Legal + retention policy
    
  custody_handoff:
    external_ir_firm: T4 authorization required; TLP:AMBER; data processing agreement required
    law_enforcement: Legal Org mandatory; court order required unless voluntary
    regulatory_authority: Legal Org mandatory; T4 sign-off; jurisdiction-scoped package only
```

---

## Evidence Preservation Requirements

```yaml
evidence_preservation:

  retention_by_incident_type:
    DATA_BREACH: minimum 10 years (GDPR Art. 5(2) accountability; litigation hold possible)
    CONSTITUTIONAL_VIOLATION: permanent (constitutional governance record)
    RANSOMWARE: minimum 7 years (criminal investigation timeline)
    INSIDER_THREAT_CONFIRMED: minimum 10 years (employment law; potential prosecution)
    AI_SYSTEM_COMPROMISE: minimum 7 years
    REGULATORY_INVESTIGATION: litigation hold until regulatory closure + 5 years
    ALL_OTHERS: minimum 7 years
    
  jurisdiction_residency:
    rule: evidence collected from agent in JUR-X must be stored in JUR-X SEZ
    cn_evidence: CN evidence stored exclusively in CN SEZ; no copies outside CN
    eu_evidence: EU evidence may be replicated within EU only (GDPR Art.32)
    cross_border_evidence: stored in jurisdiction with higher restriction level
    
  anti_tampering:
    hash_verification: evidence hash re-verified daily; mismatch → T4 alert
    storage_immutability: evidence written to WORM (Write Once Read Many) storage
    backup: 3 geographic copies (jurisdiction-compliant); tested quarterly
    
  litigation_hold:
    trigger: Legal Org declares litigation hold for specific incident or agent
    effect: all evidence retention overrides expire; evidence preserved indefinitely
    release: Legal Org declares hold released; T4 sign-off required
```

---

## Evidence Record Schema

```yaml
evidence_record:
  evidence_id: EVD-{NNN}
  collection_id: EVC-{NNN}
  incident_id: INC-{NNN}
  
  evidence_type: string
  collected_at: ISO8601
  collector_id: string
  
  scope:
    agents_covered: [string]
    time_window: {start: ISO8601, end: ISO8601}
    jurisdiction: JUR-{XX}
    
  integrity:
    hash: sha256
    hash_algorithm: SHA256
    hash_verified_at: ISO8601
    hash_verified_by: string
    
  storage:
    location_ref: string    # reference to location registry; not stored in record
    encrypted: true
    encryption_key_ref: string
    
  chain_of_custody: [COC-{NNN}]
  
  admissibility:
    custody_unbroken: boolean
    jurisdiction_compliant: boolean
    legal_review_completed: boolean | null
    litigation_hold: boolean
    
  retention:
    retention_policy: string
    expires_at: ISO8601 | null    # null if permanent or litigation hold
```

---

## Integration

```
Feeds into:
  incident-response-orchestrator.md — evidence package IDs logged in incident record
  post-incident-analysis.md — evidence reviewed during PIR
  adaptive-compliance/compliance-audit-coordinator.md — regulatory evidence packages

Receives from:
  incident-response-orchestrator.md — collection requests on incident declaration
  soc-playbook-engine.md — PB-SOC-002/004/005/006/007 initiate evidence collection steps
  insider-threat-detector.md — silent evidence collection after PB-SOC-008 gate A
  containment-engine.md — containment actions trigger simultaneous evidence capture
```

---

## Governance

**Evidence collection is simultaneous with containment:** No containment action destroys evidence; collection and containment run in parallel  
**Chain of custody is inviolable:** Any gap in chain of custody is immediately reported to Legal Org; T4 notified; evidence admissibility assessed  
**Jurisdiction residency is enforced at storage:** Evidence storage enforcement is a hard technical control, not policy only; CN evidence physically cannot be written outside CN SEZ  
**Legal review before regulatory disclosure:** No evidence package leaves enterprise control without Legal Org review + T4 sign-off; no exceptions  
**Constitutional evidence:** Evidence from constitutional incidents is permanently retained with T5 + constitutional board authorization required for any disclosure  
**Audit:** All evidence collection, access, and custody events to `memory/incident-response/evidence-audit.jsonl`; permanent retention
