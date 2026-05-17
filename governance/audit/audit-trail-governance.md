# Audit Trail Governance

## Purpose
Governs the integrity, completeness, immutability, and accessibility of the enterprise audit trail — the authoritative, tamper-evident record of all consequential actions taken by agents, systems, and humans across the enterprise AI operating system. The audit trail is the foundation of accountability: it answers who did what, when, with what authorization, and with what outcome. Without a reliable audit trail, compliance claims are unverifiable and incidents are uninvestigable.

---

## Audit Trail Architecture

```
Event Sources
├── Agent Actions          → all agent task executions, decisions, delegations
├── Human Actions          → all human approvals, overrides, attestations
├── System Events          → configuration changes, access events, policy evaluations
├── Compliance Events      → evidence submissions, finding generation, exception approvals
├── Security Events        → authentication, authorization decisions, anomaly detections
└── Governance Events      → committee decisions, policy approvals, audit outcomes

        ↓ all events

[Event Ingestion Layer]
├── [Event Normalization]  → standardize to canonical event schema
├── [Event Signing]        → Ed25519 signature by originating system
├── [Hash Chain Linking]   → SHA-256 chained to prior event
├── [Event Validation]     → schema check + signature verify + chain verify
└── [Event Storage]        → append-only; immutable; encrypted at rest (AES-256)

        ↓

[Audit Trail Index]
├── by entity_id (who?)
├── by action_type (what?)
├── by timestamp (when?)
├── by session_id (in what context?)
└── by resource_id (on what object?)
```

---

## Event Schema

```yaml
audit_event:
  event_id: "EVT-{timestamp_ms}-{random_6char}"    # globally unique
  
  what:
    action_type: string                 # from action_type_registry below
    action_description: string          # human-readable description of the action
    outcome: SUCCESS | FAILURE | PARTIAL | BLOCKED
    outcome_detail: string              # additional context about the outcome
  
  who:
    actor_id: agent_id | human_id | system_id
    actor_type: AGENT | HUMAN | SYSTEM | EXTERNAL
    actor_tier: int | null              # 1-5 for agents; null for systems
    acted_on_behalf_of: agent_id | human_id | null  # if acting as delegate
    delegation_chain: [agent_id | human_id]         # full chain if delegated action
    session_id: string                  # groups related actions in a session
  
  authorization:
    authority_basis: string             # what authorized this action? (role, delegation_id, etc.)
    delegation_id: string | null        # if action was taken under a delegation
    policy_ids_evaluated: [string]      # policies checked before this action
    permission_check_result: GRANTED | DENIED | ELEVATED_REQUIRED
  
  what_object:
    resource_type: string               # AGENT | TASK | EVIDENCE | FINDING | EXCEPTION | POLICY | RISK | REPORT | ...
    resource_id: string                 # the specific resource affected
    resource_state_before: string | null  # hash of state before action (for mutations)
    resource_state_after: string | null   # hash of state after action (for mutations)
  
  context:
    timestamp: ISO-8601 (millisecond precision)
    timezone: UTC (always)
    source_system: string               # which system generated this event
    correlation_id: string              # links related events across systems
    workflow_id: string | null          # if part of an orchestrated workflow
    task_id: string | null
  
  integrity:
    event_hash: SHA-256                 # hash of all fields above (excluding integrity block)
    prior_event_hash: SHA-256           # hash of immediately prior event (hash chain)
    chain_sequence: int                 # monotonically increasing position in chain
    actor_signature: Ed25519            # signed by actor's private key at emission time
    ingestion_signature: Ed25519        # countersigned by audit trail ingestion system
    chain_verified: boolean             # verified at write time (runtime check)
```

---

## Action Type Registry

```yaml
action_type_registry:
  # Agent/Task Actions
  TASK_ASSIGNED: agent received task assignment
  TASK_STARTED: agent began task execution
  TASK_COMPLETED: agent completed task; artifact produced
  TASK_FAILED: agent task failed; reason recorded
  TASK_DELEGATED: agent delegated task to another agent
  TASK_REASSIGNED: task transferred due to agent unavailability
  
  # Compliance Actions
  EVIDENCE_SUBMITTED: evidence item submitted for a control
  EVIDENCE_APPROVED: evidence item approved by independent reviewer
  EVIDENCE_REJECTED: evidence item rejected; reason recorded
  FINDING_GENERATED: compliance finding created
  FINDING_ACKNOWLEDGED: finding owner acknowledged finding
  FINDING_CLOSED: finding verified and closed
  EXCEPTION_REQUESTED: exception request submitted
  EXCEPTION_APPROVED: exception granted by authorized approver
  EXCEPTION_EXPIRED: exception reached expiry without renewal
  CONTROL_TESTED: control testing execution completed
  CONTROL_EFFECTIVENESS_CHANGED: control effectiveness state changed
  
  # Governance Actions
  POLICY_APPROVED: policy document approved by authorized authority
  POLICY_UPDATED: policy document modified
  RISK_ASSESSED: risk assessment conducted or updated
  RISK_ACCEPTED: risk formally accepted by authorized authority
  DELEGATION_GRANTED: authority delegated to another agent or human
  DELEGATION_REVOKED: previously granted delegation revoked
  EXCEPTION_REVIEWED: active exception reviewed for continued validity
  AUTHORITY_TRANSFERRED: authority transfer protocol activated
  
  # Access and Security Actions
  ACCESS_GRANTED: access to resource authorized
  ACCESS_DENIED: access to resource denied (critical: always log)
  ACCESS_ELEVATED: privileged access granted (time-bound)
  CONFIGURATION_CHANGED: system or control configuration modified
  AUDIT_LOG_ACCESSED: audit trail queried (log the logging access)
  
  # Human Oversight Actions
  HUMAN_REVIEW_ACTIVATED: human review gate triggered for AI decision
  HUMAN_OVERRIDE_APPLIED: human overrode AI recommendation
  HUMAN_APPROVED: human approved AI action or recommendation
  HUMAN_REJECTED: human rejected AI action or recommendation
  ESCALATION_INITIATED: escalation to higher authority triggered
  ESCALATION_RESOLVED: escalation resolved at escalation tier
  
  # External Actions
  REGULATORY_SUBMISSION_DELIVERED: submission delivered to regulatory authority
  EXTERNAL_AUDIT_RESPONSE: response to external auditor request
  VENDOR_ASSESSMENT_COMPLETED: third-party vendor assessment finished
  EXAMINER_REQUEST_RECEIVED: regulatory examiner made evidence request
```

---

## Hash Chain Integrity Protocol

```yaml
hash_chain:
  purpose: |
    The hash chain makes the audit trail tamper-evident. Each event includes the hash of the
    prior event. Any modification of a historical record breaks the chain, making tampering
    detectable. The chain is the difference between a log and an audit trail.
  
  chain_construction:
    event_hash = SHA-256(event_id + action_type + actor_id + timestamp + resource_id + resource_state_after + prior_event_hash)
    prior_event_hash: the event_hash of the immediately preceding event (by chain_sequence)
    genesis_event: chain_sequence = 0; prior_event_hash = SHA-256("GENESIS-{system_id}")
  
  chain_verification:
    continuous: verified on each event write (reject event if chain breaks)
    daily: full chain walk from genesis to present (verify every link)
    on_demand: triggered by integrity alert or regulatory examination
  
  chain_breach_response:
    detection: chain_sequence gap OR hash mismatch at any link
    immediate_action: INTEGRITY_SIGNAL fired (see control-effectiveness-monitor.md CTL-SEC-006)
    severity: CRITICAL — chain breach = potential tampering = security incident
    actions:
      - isolate affected chain segment
      - preserve current state (do not modify)
      - initiate security investigation
      - notify Tier-4+ and security team immediately
      - determine breach scope (which events are unverifiable)
      - regulatory notification may be required (breach of audit trail integrity)
    
    note: chain breach does NOT mean necessarily that tampering occurred — could be system failure
    note: chain breach investigation must determine root cause before any compliance assertions
          that rely on the affected period can be made
  
  chain_segments:
    the chain is organized into daily segments (midnight UTC boundaries)
    each segment has a segment_root_hash anchored to the prior segment's last event
    segment_hashes published to append-only external anchor (timestamp authority)
    this allows independent verification of any day's events without reading entire history
```

---

## Audit Trail Access Control

```yaml
access_control:
  read_access:
    COMPLIANCE_LEAD: may query events in their domain; all evidence events
    COMPLIANCE_GOVERNANCE_LEAD: may query all events; may run full chain verification
    AUDITORS: may query all events in audit scope; read-only
    SECURITY_TEAM: may query all SECURITY and ACCESS events; read-only
    REGULATORY_EXAMINER: access granted per pre-examination-preparation.md protocol
    GENERAL_AGENTS: may query their own events only; cannot query other agents' actions
  
  write_access:
    AUDIT_TRAIL_INGESTION_SYSTEM: only authorized writer (no direct writes by any agent or human)
    no_direct_write: no agent, human, or system may write directly to the audit trail storage
    no_modification: modifying existing events is architecturally prohibited (append-only store)
    no_deletion: deletion requires Tier-4+ authorization + legal hold review; deleted events logged
  
  audit_of_audit:
    every_query_to_audit_trail: logged as AUDIT_LOG_ACCESSED event (action_type)
    query_log: who queried, what query, when, what results returned (count only; not full records)
    prevents: audit trail itself from being searched without accountability
    anomaly_detection: unusual query patterns (high volume; unusual hours; broad scope) trigger alert
```

---

## Retention and Disposal

```yaml
retention:
  default_retention: 7 years (aligns with most regulatory requirements)
  
  extended_retention:
    AI_governance_events: 10 years from system decommission (EU AI Act requirement)
    security_incidents: 10 years (investigation archive)
    events_under_legal_hold: indefinite until hold lifted
    regulatory_examination_events: duration of examination + 5 years
  
  disposal:
    disposal_requires: Tier-4+ authorization + legal hold check + retention period confirmed expired
    disposal_process: disposal logged in the audit trail itself (AUDIT_RECORD_DISPOSED action)
    hash_chain_treatment: disposal of events creates a gap; gap must be documented and justified
    bulk_disposal: prohibited; must be event-by-event with authorization per record class
  
  legal_hold:
    trigger: litigation hold notice; regulatory investigation; regulatory examination
    effect: all events matching hold criteria: retention extended; disposal blocked
    hold_registry: all active holds tracked with reason, scope, initiating_authority, and review_date
    hold_release: requires same authority as imposition + legal confirmation that hold is lifted
```

---

## Compliance and Reporting

```yaml
audit_trail_compliance:
  controls_governing_audit_trail:
    CTL-SEC-006: audit log integrity (monitored per control-effectiveness-monitor.md)
    monitoring_threshold: MONITORING_ALERT if log gap > 5 minutes; FAILED if > 2 hours or hash chain failure
  
  audit_trail_reporting:
    daily_chain_verification_report: chain integrity status for prior 24 hours; any anomalies
    weekly_access_report: who accessed audit trail; query volume and patterns
    monthly_coverage_report: event completeness by action_type and source_system
    
  completeness_requirements:
    all_action_types_in_registry: must generate events; gaps are control failures
    coverage_target: >= 99.9% of required events captured (SLA from audit trail ingestion system)
    missing_event_investigation: any systemic gap in event coverage → MONITORING_ALERT or DEGRADED per gap duration
  
  regulatory_use:
    GDPR_Article_30: audit trail satisfies records of processing activities requirement
    EU_AI_Act_Article_12: audit trail satisfies logging requirements for high-risk AI systems
    SOC2_CC7.2: audit trail satisfies monitoring of system activity requirement
    ISO27001_A.8.15: audit trail satisfies information system audit logging control
```

---

## Integration Points

| System | Role |
|---|---|
| `zero-trust architecture (enterprise-telemetry/)` | Primary event source for security and access events |
| `coordination-operations/inter-agent-messaging.md` | All inter-agent messages logged as audit events |
| `delegation-and-trust/authority-transfer-protocol.md` | All authority transfers logged |
| `delegation-and-trust/delegation-model.md` | All delegation grants/revocations logged |
| `risk-and-controls/control-testing-engine.md` | Control test executions logged |
| `audit-and-evidence/evidence-collection-engine.md` | Evidence submissions/approvals logged |
| `audit-and-evidence/finding-management.md` | Finding lifecycle events logged |
| `governance-operations/compliance-incident-management.md` | Incident events logged; audit trail queried for incidents |
| `audit-and-evidence/compliance-reporting-engine.md` | Report generation logged; audit trail queried for reports |
