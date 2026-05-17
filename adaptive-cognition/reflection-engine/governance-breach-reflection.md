# Governance Breach Reflection
**ID:** AC-RE-003 | **Tier:** T4 | **Class:** CONSTITUTIONAL
**Owner:** Governance Org + AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Handles post-execution reflection for any event classified as a governance breach — when an agent, workflow, or orchestration process violated a governance constraint. Governance breach reflection is **always DEEP depth** and always produces a breach report regardless of whether the breach was successfully contained.

This file is the most sensitive component of the Reflection Engine. Its outputs inform governance health, not heuristic adaptation. Adaptive cognition observes breaches but does not propose governance changes in response.

---

## Breach Classification

```yaml
breach_classes:

  GB-01: AUTHORITY_OVERREACH
    description: Agent attempted action at a tier above its authority
    severity: HIGH
    contains_itself: usually (governance gate blocks)
    example: T2 agent attempting to approve a T4 decision

  GB-02: CONSTRAINT_BYPASS_ATTEMPT
    description: Agent attempted to route around a constitutional constraint
    severity: CRITICAL
    contains_itself: architecture-dependent
    example: Routing escalation to avoid T3 approval gate

  GB-03: MEMORY_INTEGRITY_VIOLATION
    description: Attempt to overwrite or modify a validated, locked memory record
    severity: HIGH
    contains_itself: yes (memory integrity engine blocks)
    example: Learning record attempting to overwrite an ADR

  GB-04: HEURISTIC_BOUND_VIOLATION
    description: Adaptive cognition proposed a heuristic outside its declared bounds
    severity: HIGH
    contains_itself: yes (bounds validator blocks)
    example: routing_confidence_floor set to 0.92 (above max 0.85)

  GB-05: GOVERNANCE_MODIFICATION_ATTEMPT
    description: Any system attempting to write to governance files
    severity: CRITICAL
    contains_itself: yes (file write interceptor blocks)
    example: Reflection engine proposing a governance constraint change

  GB-06: FORBIDDEN_ADAPTATION_PATTERN
    description: Detection of a pattern listed in governance.md FORBIDDEN section
    severity: CRITICAL
    contains_itself: governance.md enforcement
    examples: FORBIDDEN-AC-01 through FORBIDDEN-AC-06

  GB-07: AUTONOMY_LEVEL_VIOLATION
    description: Agent operating at an autonomy level not yet granted to it
    severity: HIGH
    contains_itself: autonomy-audit-trail.md
    example: Agent acting autonomously when it requires supervised mode
```

---

## Breach Reflection Protocol

```
STEP 1: IMMEDIATE CONTAINMENT VERIFICATION
  Verify: was the breach contained? (gate fired, action blocked, exception raised)
  If NOT contained (breach resulted in unauthorized action): CRITICAL escalation to T4
  Log: immediate containment status

STEP 2: BREACH CLASSIFICATION
  Classify breach class (GB-01 through GB-07)
  If novel breach (no existing GB class): assign GB-NOVEL + immediate T4 notification

STEP 3: CAUSAL RECONSTRUCTION
  Identify: which agent, which workflow, which decision triggered the breach attempt
  Identify: was the breach intentional (design flaw) or incidental (edge case)?
  Map: the decision chain leading to the breach attempt

STEP 4: SYSTEMIC RISK ASSESSMENT
  Question: Is this breach class likely to recur?
  Signals:
    - Same agent involved in prior breaches: HIGH recurrence risk
    - Same workflow type: HIGH recurrence risk
    - Same heuristic active: MEDIUM recurrence risk
    - Isolated edge case: LOW recurrence risk
  Output: recurrence_risk (HIGH | MEDIUM | LOW | ISOLATED)

STEP 5: BREACH REPORT GENERATION
  Generate: breach_report with all fields populated
  Never: propose governance modifications in breach report
  Always: recommend one of these containment actions:
    - MONITORING (low risk, isolated)
    - AGENT_RETRAINING (agent design review required)
    - WORKFLOW_REVIEW (workflow pattern needs correction)
    - HEURISTIC_REVIEW (active heuristic may have contributed)
    - ARCHITECTURE_REVIEW (systemic design issue)
    - CONSTITUTIONAL_REVIEW (critical breach; T4 convenes review)

STEP 6: NOTIFICATION
  GB-01, GB-02, GB-07 (HIGH severity): T3 notification within 15 minutes
  GB-02, GB-05, GB-06 (CRITICAL severity): T4 notification IMMEDIATELY
  All breaches: append to governance-attestation audit trail
```

---

## Breach Report Schema

```yaml
breach_report:
  breach_id: GB-YYYYMMDD-NNNN
  timestamp: ISO8601
  breach_class: GB-NN
  severity: HIGH | CRITICAL
  contained: bool
  containment_method: gate_fired | exception_raised | intercepted | NOT_CONTAINED
  agent_id: offending agent
  workflow_id: execution context
  breach_description: narrative description
  causal_chain: ordered list of contributing decisions
  recurrence_risk: HIGH | MEDIUM | LOW | ISOLATED
  recommended_action: one of the 6 containment actions
  governance_scope: GOVERNANCE | CONSTITUTIONAL
  t4_notified: bool
  hash: ed25519
```

---

## What Governance Breach Reflection Does NOT Do

```
DOES NOT:
  - Propose changes to governance constraints
  - Propose relaxation of authority boundaries
  - Suggest that a gate is "too strict"
  - Adjust governance-related heuristics autonomously

ALWAYS:
  - Treats breaches as errors in execution, not in governance
  - Preserves the constitutional constraint that triggered the breach
  - Routes correction to human review for GB-02, GB-05, GB-06
  - Maintains complete audit trail regardless of breach severity
```

---

## Breach Statistics Dashboard

```
╔══════════════════════════════════════════════════════════╗
║        GOVERNANCE BREACH MONITOR — 2026-05-17            ║
╠══════════════════════════════════════════════════════════╣
║ Total breaches (all time):        0   Target: 0 critical  ║
║ Breaches last 30 days:            0                        ║
║ Contained on detection:        100%   Target: 100%        ║
║ Breach recurrence rate:          0%   Target: < 5%        ║
║                                                            ║
║ BREACH BY CLASS:                                           ║
║   GB-01 (Authority Overreach):    0                        ║
║   GB-02 (Constraint Bypass):      0                        ║
║   GB-03 (Memory Integrity):       0                        ║
║   GB-04 (Heuristic Bound):        0                        ║
║   GB-05 (Governance Modification):0                        ║
║   GB-06 (Forbidden Pattern):      0                        ║
║   GB-07 (Autonomy Violation):     0                        ║
╚══════════════════════════════════════════════════════════╝
```
