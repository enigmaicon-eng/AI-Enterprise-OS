# Architecture Decision Continuity
**ID:** AC-RH-004 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-17

---

## Purpose

Ensures that Architecture Decision Records (ADRs) are not treated as isolated snapshots but as living nodes in a reasoning lineage. Architecture decision continuity tracks the full evolution of architectural thinking — what was decided, why it evolved, what was superseded, and what principles have remained stable across architectural generations.

---

## ADR Lineage Model

```
ARCHITECTURE DECISION LINEAGE

  Each ADR is a node in a lineage graph:
    - Created from: prior ADRs, architectural principles, governance constraints
    - Supersedes: prior ADR(s) that are no longer active
    - Is superseded by: later ADR(s) (set when archived)
    - Constrained by: governance invariants and constitutional principles
    - Enables: downstream ADRs that depend on this decision

  ADR STATES:
    PROPOSED   → under review; not yet active
    ACTIVE     → in effect; constrains architectural work
    SUPERSEDED → replaced by a newer ADR; archived with successor pointer
    DEPRECATED → no longer applicable; context that required it is gone
    CONTESTED  → active challenge filed; under T3 review

  LINEAGE POINTER FIELDS (in every ADR):
    lineage_parent: ADR-xxx  (prior decision this builds on or supersedes)
    superseded_by: ADR-xxx   (set when this ADR is archived)
    governance_basis: [INV-*, GP-*, P*]  (governance anchors)
    reasoning_lineage_record: RL-xxx  (link to AC-RH-001 record)
```

---

## ADR Evolution Tracking

```
ARCHITECTURAL DRIFT DETECTION:

  Architecture decisions accumulate over time; without active tracking, drift occurs:

  DRIFT SIGNALS:
    - Two active ADRs make conflicting recommendations
    - A decision that was made to address a specific problem persists after
      the problem no longer exists
    - New development patterns emerge that are inconsistent with active ADRs
      but no one has formally updated the ADR record
    - ADR references a component or system that no longer exists

  DRIFT RESPONSE:
    MINOR DRIFT:  Flag ADR for scheduled review; log drift observation
    MODERATE DRIFT: Flag ADR as CONTESTED; T3 review within 30 days
    SEVERE DRIFT:  Emergency architectural review; ADR suspended from use
                   as binding constraint until resolved
```

---

## ADR Continuity Review Protocol

```
QUARTERLY ADR CONTINUITY REVIEW (T3 Architecture Org):

  1. INVENTORY
     List all ACTIVE ADRs
     For each: verify it is still referenced in current architectural work
     Identify ADRs not referenced in >90 days → candidate for DEPRECATED review

  2. LINEAGE INTEGRITY
     Verify all lineage_parent pointers resolve to valid records
     Detect orphan ADRs (no lineage_parent and no referenced governance basis)
     Detect circular lineage (ADR A → B → C → A)

  3. PRINCIPLE STABILITY ANALYSIS
     For each ADR, verify the governance basis still holds
     If a referenced governance principle has been updated:
       → Review whether ADR is still valid under updated principle
       → If not: initiate formal ADR update or archival process

  4. CONTRADICTION DETECTION
     Run cross-ADR consistency scan:
       Are any two ACTIVE ADRs making directly contradictory recommendations?
       If yes: raise CONTRADICTION escalation to T3; both ADRs suspended until resolved

  5. EVOLUTIONARY SUMMARY
     Document: how many ADRs were created/superseded/deprecated this quarter
     Document: major architectural direction changes
     Document: principles that have remained stable
     Feed summary into longitudinal-reasoning-lineage.md (AC-RH-001)
```

---

## ADR Supersession Protocol

```
WHEN AN ADR IS TO BE SUPERSEDED:

  STEP 1: New ADR is drafted with explicit reference to the ADR it supersedes:
    supersedes: ADR-xxx
    reason_for_supersession: [why the prior decision no longer holds]
    conditions_changed: [what changed that made the prior decision obsolete]

  STEP 2: Architecture Org T3 review of both old and new ADR together:
    Is the new ADR internally consistent?
    Does it create new conflicts with other active ADRs?
    Is the reason for supersession valid and documented?

  STEP 3: Upon approval of new ADR:
    Prior ADR state → SUPERSEDED
    Prior ADR gains: superseded_by: ADR-new
    Prior ADR preserved permanently (not deleted)
    Reasoning lineage record updated

  STEP 4: Systems referencing the superseded ADR notified:
    Architectural agents updated with new constraint
    Any workflows that cited the old ADR flagged for review

  INTEGRITY RULE: A superseded ADR is never deleted. The full chain of
  architectural evolution must remain traversable forever.
```

---

## Architectural Principle Stability Index

```
STABILITY TRACKING:

  Over time, the ADR lineage reveals which architectural principles
  have remained stable across generations of architectural decisions.

  HIGH STABILITY PRINCIPLES (≥ 90 days, no contradiction):
    These are candidates for elevation to governance invariants (T4 process)

  LOW STABILITY PRINCIPLES (multiple revisions within 90 days):
    Signal: principle may be under-specified or context-dependent
    Action: flag for architectural clarification; avoid using as binding basis
            for new ADRs until stabilized

  PRINCIPLE STABILITY RECORD:
    principle_id: string
    first_appeared: ISO8601 (in which ADR)
    revision_count: integer
    last_revision: ISO8601
    stability_score: float (computed from revision frequency and age)
    status: STABLE | EVOLVING | CONTESTED | DEPRECATED
```

---

## Integration with Reasoning History

```
ADR records feed two upstream systems:

  AC-RH-001 (Longitudinal Reasoning Lineage):
    Each new ADR and each ADR supersession generates a reasoning_lineage_record
    The lineage record captures the WHY at the moment of decision
    → Builds the long-term reasoning arc of architectural thinking

  AC-RH-002 (Decision Chain Preservation):
    ADRs are the primary source for technical decision chains
    Dependency traversal uses ADR lineage pointers
    Contradiction detection uses ADR state and recommendation fields
    → Ensures downstream decisions have valid architectural basis

  CROSS-REFERENCE RULE:
    Every ADR must have either:
      (a) lineage_parent pointing to a prior ADR or architectural principle, OR
      (b) an explicit documentation of first-principles basis
    Orphan ADRs (no basis documented) are flagged for retrospective rationale.
```

---

## Governance

- ADR lineage records are permanent; archival with succession chain only
- All active ADRs visible to T2+ agents operating in relevant architectural domain
- ADR supersession requires T3 Architecture Org approval
- Annual architectural evolution retrospective required at T3
- ADR continuity review results published to Executive Org (summary) quarterly
