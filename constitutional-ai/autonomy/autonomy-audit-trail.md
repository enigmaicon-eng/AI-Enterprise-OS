# Autonomy Audit Trail
**ID:** AUT-AAT-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Maintains a complete, tamper-evident, cryptographically verifiable audit trail of all autonomous decisions made by Level 3+ agents. As autonomy increases, the ability to reconstruct exactly what was decided, why, and with what authority becomes a legal, regulatory, and governance requirement — not just a nice-to-have. This trail is the ultimate accountability mechanism for autonomous AI.

---

## Audit Record Schema

Every autonomous decision at Level 3+ produces an immutable audit record:

```yaml
autonomy_audit_record:
  record_id: AUD-{NNN}
  sequence: number                       # monotonically increasing within agent
  
  agent:
    agent_id: string
    autonomy_level: 3 | 4 | 5
    contract_id: string
    contract_version: string
    
  decision:
    decision_id: string
    decision_type: string
    workflow_id: string | null
    step_id: string | null
    decided_at: ISO8601
    
  authorization:
    authorization_basis: PRE_AUTHORIZED | CONTRACT_SCOPE | ESCALATED | BEHAVIORAL_CONTRACT
    pre_auth_id: string | null           # if pre-authorized
    human_approval_id: string | null     # if escalated and approved
    
  scope_validation:
    contract_check_passed: boolean
    pre_auth_check_passed: boolean
    prohibited_action_check_passed: boolean
    constitutional_check_passed: boolean # must always be true — records where false are incidents
    
  explanation_id: string                 # reference to explanation-first record
  
  outcome:
    action_taken: string
    artifacts_produced: [string]
    downstream_agents_delegated_to: [string]
    external_systems_written: [string]
    
  integrity:
    prev_record_hash: string             # hash chain: links to previous audit record
    record_hash: string                  # SHA-256 of this record (excluding this field)
    signature: string                    # Ed25519 signature by audit logger
```

---

## Hash Chain Architecture

The autonomy audit trail uses the same hash chain architecture as the approval chain:

```
AUD-001: prev_hash = GENESIS, hash = H1, sig = S1
AUD-002: prev_hash = H1,      hash = H2, sig = S2
AUD-003: prev_hash = H2,      hash = H3, sig = S3
...

Verification:
  1. Verify each record's signature (Ed25519)
  2. Verify each record's prev_hash matches the prior record's hash
  3. Any break in the chain → INTEGRITY_VIOLATION alert; T4 immediate
  
Segment boundaries: handled by JSONL segment manager (MEM-INT-002)
  Chain-continuation record written at each segment start
```

---

## Audit Query Interface

```
query_autonomy_trail(
  agent_id,
  time_range,
  decision_type,
  autonomy_level
) → [audit_records]

  - Routes to correct segment(s) via segment manager
  - Optionally verifies hash chain integrity for returned records
  - Returns records in chronological order
  - Estimated latency: < 2s for hot (30-day) segments

audit_summary(agent_id, period) → {
  total_decisions: number,
  by_type: {type: count},
  constitutional_checks_all_passed: boolean,
  avg_confidence: number,
  human_override_count: number,
  scope_violations: number              # target: 0
}

verify_integrity(agent_id, start_record, end_record) → {
  chain_intact: boolean,
  first_break: record_id | null
}
```

---

## Regulatory Use Cases

The autonomy audit trail satisfies multiple regulatory requirements:

| Requirement | How Satisfied |
|-------------|---------------|
| EU AI Act Art. 12 (logging for high-risk AI) | Full decision audit with authorization basis |
| EU AI Act Art. 14 (human oversight) | Escalation triggers + override capability logged |
| SOX (control evidence) | Authorized autonomous decisions with approval trail |
| GDPR Art. 22 (automated decision explanation) | Linked to explanation-first record |
| ISO 42001 (AI management system) | Complete audit trail for AI governance |

---

## Immutability Guarantees

```
Audit records are:
  APPEND-ONLY: once written, cannot be modified or deleted
  HASH-CHAINED: any tampering breaks chain verification
  Ed25519-SIGNED: only audit logger's key can create valid records
  SEGMENTED: rotated daily; monthly archives; annual cold storage (AES-256)
  
Retention:
  Level 3 agent decisions: 7 years
  Level 4 agent decisions: 10 years
  Level 5 agent decisions: Permanent
  Constitutional incidents (any level): Permanent
```

---

## Real-Time Monitoring

The audit trail feeds real-time autonomy monitoring:

```yaml
autonomy_monitoring:
  agents_at_level_3: number
  agents_at_level_4: number
  agents_at_level_5: number
  
  decisions_last_hour: number
  constitutional_incidents_24h: number  # target: 0
  scope_violations_24h: number          # target: 0
  human_overrides_24h: number
  
  highest_confidence_decision: {agent_id, confidence, decision_type}
  lowest_confidence_decision: {agent_id, confidence, decision_type}
    # low confidence autonomous decisions are escalation candidates
```

Alert: any constitutional_incident → T4 immediate. Any scope_violation → T3 immediate.

---

## Governance

**Audit log:** `memory/autonomy/autonomy-audit-trail.jsonl` (hash-chained, append-only)
**Integrity verification:** Weekly automated sweep; on-demand by T3+
**Access:** Governance Org (read all), T4+ (full access including verification tools)
**Tampering detection:** Any chain break → T4 emergency + Security Org investigation
**Regulatory access:** Available to authorized regulators under data sharing agreement
