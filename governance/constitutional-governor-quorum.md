# Constitutional Governor Quorum
**ID:** GOV-CONST-001 | **Tier:** T5 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Eliminates the constitutional governor as a single point of failure by implementing a three-validator quorum with majority rule. Ensures constitutional oversight is available even during partial system failures. No single validator failure can suspend constitutional governance.

---

## Quorum Architecture

```
QUORUM: 3 validators, majority (2/3) required for constitutional decisions

VALIDATOR-A (Primary): constitutional-ai-governor.md
  Role: Policy validation + principle enforcement
  Specialization: C-001 to C-006 (human authority, governance, explainability, data)

VALIDATOR-B (Secondary): Policy + Trust
  Role: Trust boundary enforcement + approval chain verification
  Specialization: C-007 to C-009 (security, proportionality, transparency)

VALIDATOR-C (Tertiary): Safety + Alignment
  Role: Safety controller integration + alignment verification
  Specialization: C-010 to C-012 (safety, non-deception, beneficial outcomes)

QUORUM COORDINATOR: Routes constitutional decisions to all 3 validators
  - Collects verdicts
  - Computes majority
  - Resolves ties using principle hierarchy (lower number = higher authority)
```

---

## Quorum Decision Protocol

```
Step 1: Constitutional check requested
  - Source: any policy evaluation, governance gate, approval chain
  - Quorum coordinator receives request

Step 2: Parallel dispatch
  - Request sent to all 3 validators simultaneously
  - Timeout per validator: 200ms (p99 constitutional latency target)
  - Extended timeout for ABSOLUTE violations: 500ms (worth the wait)

Step 3: Verdict collection
  Possible verdicts: COMPLIANT | NON_COMPLIANT | REQUIRES_REVIEW | ABSTAIN

Step 4: Majority rule
  2/3 COMPLIANT → COMPLIANT
  2/3 NON_COMPLIANT → NON_COMPLIANT (enforcement action)
  Split (1/1/1 or ABSTAIN) → REQUIRES_REVIEW → escalate T4
  Any ABSOLUTE_VIOLATION from any validator → immediate BLOCK (no majority needed)

Step 5: Verdict execution
  - Signed by quorum coordinator (Ed25519)
  - Logged to governance-attestation/approval-records.jsonl
  - Constitutional health metrics updated
```

---

## Validator Health and Failover

```yaml
quorum_health:
  validator_a_status: HEALTHY | DEGRADED | DOWN
  validator_b_status: HEALTHY | DEGRADED | DOWN
  validator_c_status: HEALTHY | DEGRADED | DOWN
  
  quorum_status: FULL (3/3) | REDUCED (2/3) | CRITICAL (1/3) | FAILED (0/3)
  
  degraded_mode_active: boolean
  degraded_since: ISO8601 | null
```

### Degraded Mode (1 validator down)
- Quorum operates with 2 validators
- Decisions require unanimous agreement of remaining 2
- T4 alert: "Constitutional quorum degraded — 2/3 validators operational"
- SLA to restore: 1 hour

### Critical Mode (2 validators down)
- Single validator is insufficient for quorum
- Constitutional decisions queue (not blocked, not bypassed — queued)
- Queue limit: 100 decisions; overflow triggers T5 emergency
- T5 alert: "Constitutional quorum CRITICAL — governance suspended"
- SLA to restore: 15 minutes

### Complete Failure (all validators down)
- Constitutional governance suspended
- ALL workflow execution pauses immediately
- T5 + Board emergency notification
- Emergency restoration from backup validators (cold standby)
- Maximum acceptable suspension: 30 minutes

---

## ABSOLUTE Violation Handling

When ANY validator returns ABSOLUTE_VIOLATION (corresponding to HD-001–HD-010 hard denies):
- Decision is BLOCKED immediately — no majority override possible
- All 3 validators notified of the block
- T5 notification within 60 seconds
- Block is irreversible for that execution instance
- Separate investigation opened (RSI-GOV-001)

**Constitutional principle:** A single validator detecting an ABSOLUTE violation is sufficient to block. Safety cannot be outvoted.

---

## Quorum Calibration

Monthly calibration check:
1. Run 50 golden test cases through full quorum
2. Compare individual validator verdicts to known correct outcomes
3. Check for systematic disagreement between validators (KAPPA ≥ 0.85 required)
4. If any validator's accuracy drops below 0.95: quarantine and retrain before quorum participation

---

## Governance

**Quorum modification authority:** T5 + board (changing quorum size, validator roles, or tie-breaking rules requires board-level governance)
**Validator appointment:** T5 authorization required to designate a new quorum validator
**Audit:** All quorum decisions with individual validator verdicts to `memory/governance/quorum-decisions.jsonl`
**Hard limit:** Quorum cannot be reduced below 2 validators by any means including emergency bypass
