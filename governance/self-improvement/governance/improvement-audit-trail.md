# Improvement Audit Trail

**Component:** RSI-GOV-003 | **Owner:** Meta-Org | **Tier:** T4 | **Class:** CRITICAL

## Role
Immutable, tamper-evident, permanently retained record of every event in the improvement system — proposals generated, safety checks run, authorizations granted or denied, changes applied, outcomes measured, and rollbacks executed. The audit trail is the legal and governance record of how the OS evolves over time.

---

## Audit Record Types

```
EVENT TYPE        TRIGGER                                     RETENTION
─────────────────────────────────────────────────────────────────────────────
PROPOSAL_CREATED  improvement-planner generates proposal      Permanent
SAFETY_CHECK_RUN  safety controller processes proposal        Permanent
HARD_DENY         safety controller issues HD-{NNN}           Permanent + Alert
AUTHORIZATION     authorizer makes decision (any tier)        Permanent
CHANGE_APPLIED    approved change deployed to system          Permanent
MEASUREMENT_T7    outcome measurement at T+7 days             Permanent
MEASUREMENT_T30   outcome measurement at T+30 days            Permanent
MEASUREMENT_T90   outcome measurement at T+90 days            Permanent
ROLLBACK_EXECUTED change rolled back for any reason           Permanent + Alert
MATRIX_QUERIED    authorization matrix checked (for integrity) 90 days
CYCLE_STARTED     improvement cycle begins                    Permanent
CYCLE_COMPLETED   improvement cycle completes                 Permanent
META_PROPOSAL     meta-improvement proposal generated         Permanent
CONSTITUTIONAL_CHECK constitutional alignment check run      Permanent
EMERGENCY_AUTH    emergency authorization invoked             Permanent + Alert
AUDIT_READ        audit trail accessed by operator            90 days
```

---

## Audit Record Schema

```yaml
audit_event:
  event_id: AUD-{YYYY}-{NNNNN}       # sequential within year; never reused
  event_type: string                  # from EVENT TYPE table above
  timestamp: ISO8601                  # UTC; millisecond precision
  proposal_id: IMP-{YYYY-MM-DD}-{NNN} | null
  actor:
    type: SYSTEM | HUMAN | AGENT
    identity: string                  # system component name or human role
    tier: AUTO | T2 | T3 | T4 | T5
  event_data:
    summary: string                   # human-readable one-line summary
    details: object                   # event-type specific fields (see below)
  prior_event_id: AUD-{YYYY}-{NNNNN} # hash chain link to previous event
  event_hash: SHA-256                 # SHA-256(event_id + timestamp + proposal_id + event_data + prior_event_id)
  signature: Ed25519                  # signed by RSI system key
```

### Event-Specific Detail Fields

```yaml
# PROPOSAL_CREATED
details:
  domain: WORKFLOW | ORCHESTRATION | RUNTIME | GOVERNANCE | ORG | CAPABILITY | META
  opportunity_type: string
  priority: P0 | P1 | P2 | P3 | P4
  forecast_roi: float
  proposing_component: string

# SAFETY_CHECK_RUN
details:
  constitutional_alignment: PASS | CONDITIONAL | FAIL
  blast_radius: LOCAL | MODERATE | WIDE | ENTERPRISE
  rollback_viability: PASS | FAIL
  regulatory_compliance: PASS | CONDITIONAL | FAIL
  security_impact: PASS | CONDITIONAL | FAIL
  overall_result: APPROVED | CONDITIONAL | REJECTED_SAFETY | REJECTED_HARD_DENY
  check_duration_ms: integer
  conditions: list of strings

# HARD_DENY
details:
  deny_code: HD-{NNN}
  deny_reason: string
  proposing_agent: string
  deny_count_this_month: integer  # triggers investigation if > 3
  t4_alert_sent: boolean
  t4_alert_timestamp: ISO8601

# AUTHORIZATION
details:
  authorization_tier: string
  authorizer_role: string
  decision: APPROVED | APPROVED_WITH_CONDITIONS | REQUEST_REVISION | REJECTED
  conditions: list of strings | null
  rejection_reason: string | null
  time_to_decision_hours: float
  sla_met: boolean

# CHANGE_APPLIED
details:
  change_scope: FILE | SUBSYSTEM | CROSS_SYSTEM
  affected_components: list of strings
  implementation_method: string
  rollback_available_until: ISO8601
  deployment_window: string

# MEASUREMENT_T{N}
details:
  metric_name: string
  baseline_value: float
  measured_value: float
  improvement_pct: float
  forecast_accuracy_ratio: float
  side_effects_observed: list of strings
  sustained: boolean

# ROLLBACK_EXECUTED
details:
  rollback_reason: REGRESSION | SIDE_EFFECT | AUTHORIZATION_REVOKED | MANUAL
  rollback_triggered_by: string
  rollback_duration_minutes: float
  rollback_successful: boolean
  systems_restored: list of strings
```

---

## Hash Chain Integrity

```
HASH CHAIN MECHANISM:
  Each event record includes prior_event_id (the ID of the previous audit event).
  Each event_hash = SHA-256(event_id || timestamp || proposal_id || event_data || prior_event_id)
  Hash chain starts at genesis event AUD-2026-00001 (system initialization).

TAMPER DETECTION:
  Any modification to a historical event invalidates its hash AND all subsequent hashes.
  Chain verification: walk from AUD-2026-00001 to current event; recompute each hash.
  Verification runs: automated daily; on-demand for any audit query.
  Verification failure: SYSTEM HALT + T5 alert (tampering is a critical security event).

SIGNATURE:
  Each event signed with Ed25519 using the RSI system key.
  System key: rotated annually; prior keys archived + remain valid for historical verification.
  Signature verification: included in daily hash chain verification.

STORAGE:
  Primary: memory/recursive-self-improvement/improvement-audit-trail.jsonl (append-only)
  Replica: distributed to compliance-storage/ on write (dual-write; both must succeed)
  Archive: quarterly snapshot to long-term archive (immutable after snapshot)
  Backup: nightly backup to offsite; retention = indefinite
```

---

## Retention and Access Policy

```
RETENTION:
  All audit events: permanent (never purged; no TTL)
  Rationale: regulatory obligation + forensic + pattern analysis + recurrence detection

ACCESS CONTROL:
  T2: can query own-team proposal outcomes (aggregate only; no individual authorization records)
  T3: can query full improvement history for their domain; cannot query authorization records
  T4: full read access to all audit events
  T5: full read + verification run access

SENSITIVE FIELDS:
  Human authorizer identity: encrypted at rest; T4+ with explicit purpose to decrypt
  Constitutional violation attempts: accessible only to T4+ (never visible to T3-)
  Hard Deny records: T4+ only; included in monthly T4 audit review

ACCESS LOG:
  All audit trail reads recorded in AUDIT_READ events (90-day retention)
  Bulk exports require T4 authorization + logged justification
```

---

## Audit Trail Queries

```
SUPPORTED QUERIES:
  get_proposal_history(proposal_id)     → full event chain for one proposal
  get_domain_history(domain, days)      → all events for a domain over N days
  get_hard_denies(since)               → all HD-{NNN} events since date
  get_authorizations(tier, since)       → all authorization decisions since date
  get_rollbacks(since)                  → all rollback events since date
  get_cycle_history(cycle_id)          → all events for one improvement cycle
  verify_chain(from, to)               → hash chain integrity check for range
  get_agent_activity(agent_id, since)  → all events by a specific agent
  get_proposal_outcome(proposal_id)    → latest measurement event for proposal

QUERY PERFORMANCE:
  Standard queries: < 1 second
  Full chain verification (all events): < 5 minutes
  Index: (proposal_id, event_type, timestamp, domain) → event_ids
```

---

## Regulatory Compliance

```
GDPR ARTICLE 22: Automated decisions with significant effects must be auditable.
  → All AUTO-tier improvement decisions logged with full context.

EU AI ACT ARTICLE 12: High-risk AI systems must maintain records for 10 years.
  → Permanent retention satisfies and exceeds this requirement.

SOC 2 TYPE II: Change management must have audit trail.
  → This trail satisfies CC6.1, CC6.2, CC7.1 change management controls.

PCI-DSS 10.7: Audit logs must be retained for at least 12 months.
  → Permanent retention satisfies this requirement.

DORA ARTICLE 17: ICT change management records must be maintained.
  → This trail is the ICT change record for AI system improvements.
```

---

## Audit Trail Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Hash chain integrity (daily verification) = PASS (100% of days)
Event completeness (no gaps)             = 100%
Write latency (event to persisted)       < 500ms
Dual-write success rate                  = 100%
Tamper detection incidents               = 0 (any detected = T5 alert)
Regulatory audit readiness               = 100% (queries answer within 24hr)
Access control violations                = 0
```
