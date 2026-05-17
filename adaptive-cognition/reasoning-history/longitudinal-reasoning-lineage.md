# Longitudinal Reasoning Lineage
**ID:** AC-RH-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Tracks the full arc of reasoning across the OS's operational history — how the system's reasoning evolved, what drove changes in approach, and where reasoning patterns have proved durable vs. transient. This is the organizational equivalent of a "reasoning journal" — not what was decided, but how the organization thinks through decisions.

---

## Reasoning Lineage Architecture

```
REASONING LINEAGE STRUCTURE

  Each significant reasoning event generates a reasoning_lineage_record (schemas.yaml)
  Records are linked by lineage_parent pointers, forming reasoning chains:

  RL-001: "Decided to use deterministic workflows because probabilistic coordination
           was creating unpredictable outcomes in the routing layer"
      │
      └── RL-007: "Extended deterministic workflow approach to include governance gates
                   after observing governance checks were being bypassed in ad-hoc flows"
              │
              └── RL-019: "Encoded deterministic + gated workflow as immutable design
                            principle after 12 months of consistent positive outcomes"
                      │
                      └── RL-031: "Identified exception class: research workflows benefit
                                    from controlled exploration within deterministic gates"

This chain shows how reasoning evolved: from tactical decision → principled approach →
established invariant → refined understanding of exception conditions.
```

---

## Reasoning Lineage Capture

```
WHAT GETS CAPTURED:
  Major routing decisions (at time of decision, with rationale)
  Architecture decisions (all ADRs → automatic reasoning record created)
  Strategy decisions (T4 decisions, quarterly targets)
  Governance design decisions (when governance is modified by authorized T4 process)
  Escalation resolution decisions (how T4 resolved significant escalations)

WHAT DOES NOT GET CAPTURED:
  Routine execution decisions (these go in execution-ledger.jsonl)
  Repetitive operational decisions (captured statistically, not individually)
  Hypothetical or exploratory reasoning (not finalized)

CAPTURE TIMING:
  Architectural decisions: at ADR creation (linked to ADR record)
  Strategic decisions: at T4 approval
  Governance decisions: at constitutional review completion
  Routing decisions: at heuristic activation
```

---

## Reasoning Quality Assessment

```
REASONING QUALITY DIMENSIONS:
  1. COMPLETENESS: does the record capture the full reasoning, not just the conclusion?
  2. HONESTY: does it include the alternatives considered and why they were rejected?
  3. TRACEABILITY: is the evidence basis referenced?
  4. REVISABILITY: is it clear under what conditions this reasoning should be revisited?

REASONING LINEAGE REVIEW (quarterly):
  Are recent reasoning records high quality?
  Are any reasoning chains showing contradictions?
  Are there reasoning gaps (decisions made without documented rationale)?
  Are assumptions in prior reasoning still valid?
```

---

## Reasoning Pattern Recognition

Over time, reasoning lineage reveals patterns in how the OS approaches certain decision types:

```yaml
recognized_reasoning_patterns:
  FIRST_PRINCIPLES:
    description: reasoning from fundamental principles to specific decisions
    characteristic: long reasoning chains; explicit principle reference
    signal: good for novel situations; may over-engineer for familiar ones

  PRECEDENT_BASED:
    description: reasoning primarily from prior similar decisions
    characteristic: short reasoning chains; heavy lineage_parent references
    signal: efficient for familiar situations; risk of compounding prior errors

  HYBRID:
    description: precedent as starting point; first principles to handle exceptions
    characteristic: medium chain length; mix of references and original reasoning
    signal: generally most robust; context-sensitive

  ESCALATION_SEEKING:
    description: reasoning quickly reaches "escalate" conclusion
    characteristic: very short chains; frequent escalation_decision outcomes
    signal: calibration issue; may indicate over-conservative routing confidence
```

---

## Governance

- Reasoning lineage records are permanent (never deleted)
- Reasoning records are the authoritative record of WHY decisions were made
- Access: T3+ for full reasoning lineage; T1/T2 can access summaries relevant to their work
- Reasoning lineage updates (corrections to prior reasoning) require T3 approval and must be additive (not overwriting)
