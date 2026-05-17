# Decision Chain Preservation
**ID:** AC-RH-002 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-17

---

## Purpose

Preserves the dependency structure between decisions — the causal chains that connect earlier decisions to later ones. Without decision chain preservation, agents re-examine settled questions, make decisions that contradict prior commitments, or miss critical constraints established in prior reasoning.

---

## Decision Chain Model

```
DECISION CHAIN STRUCTURE

  Every significant decision has:
    - Dependencies: prior decisions this decision relies on or is constrained by
    - Descendants: subsequent decisions this decision enables or constrains
    - Alternatives rejected: what was considered but not chosen
    - Constraints established: what this decision prevents or requires in the future

  Example:
    Decision: "Adopt deterministic workflow execution"
    ├── Depends on: [architectural principle: explicit > implicit, governance invariant: auditability]
    ├── Enables: [workflow checkpoints, execution ledger, deterministic recovery]
    ├── Constrains: [probabilistic routing approaches cannot be used for critical paths]
    └── Rejects: ["flexible workflow" approach; reason: governance auditability requires determinism]
```

---

## Chain Integrity Checks

```
INTEGRITY VIOLATIONS (detected and flagged):

  ORPHAN DECISION:
    A decision with no documented basis (no lineage_parent, no principles referenced)
    Risk: decision may be arbitrary; may conflict with established direction
    Response: flag for T3 review; add retrospective rationale

  CONTRADICTION:
    A decision that directly conflicts with a prior active decision in its chain
    Risk: system will behave inconsistently
    Response: BLOCK new decision until contradiction is resolved
    Resolution: one decision updated/archived; conflict resolution documented

  STALE DEPENDENCY:
    A decision that depends on a prior decision that has since been archived/superseded
    Risk: decision may no longer be valid
    Response: flag for review; may need renewal or update

  CIRCULAR DEPENDENCY:
    Decision A depends on B which depends on A
    Risk: no valid resolution order; potential reasoning deadlock
    Response: architectural review; one dependency restructured
```

---

## Decision Chain Visualization

```
For any significant active decision, the dependency chain is traversable:

  QUERY: "Show decision chain for: use of Ed25519 hash chains for audit integrity"

  CHAIN:
    [Root] Governance Principle 2: "All actions are auditable"
      └── ADR-001: "Append-only JSONL audit trails"
            └── ADR-008: "Cryptographic hash chain for audit trail integrity"
                  └── ADR-019: "Ed25519 as signing algorithm for hash chains"
                        └── [Current] "Apply Ed25519 to adaptive cognition audit logs"

  This chain shows the full principled basis for the current decision.
  Any challenge to the current decision must address the full chain.
```

---

## Governance

- Decision chains are traversable in both directions (dependencies and descendants)
- Contradiction detection runs automatically before any significant new decision is finalized
- Decision chain records are retained permanently
- Chain visualization available to all agents for decisions relevant to their work
