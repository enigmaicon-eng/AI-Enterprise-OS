# Autonomy Level Framework
**ID:** AUT-ALF-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Governance Org + Executive Org | **Updated:** 2026-05-16

---

## Purpose

Defines the Enterprise AI OS autonomy ladder — six discrete levels of AI decision-making autonomy from fully supervised (Level 0) to bounded superintelligence (Level 5). Each level has precise definitions, capability requirements, constitutional constraints, and human oversight requirements. No agent may operate above its certified autonomy level.

**Foundational constraint:** Humans retain constitutional authority permanently at all autonomy levels. Autonomy refers to the scope of routine decisions made without human approval — never to decisions that affect constitutional principles, irreversible high-stakes outcomes, or human welfare.

---

## Autonomy Levels

### Level 0 — Supervised Execution
```
Definition: Agent executes tasks only with explicit per-action human approval.
Decision scope: No autonomous decisions; purely executes approved instructions.
Human oversight: 100% of outputs reviewed before use.
Use cases: New agents during probation; unproven capability domains.
Delegation gate: PROVISIONAL trust band required.
```

### Level 1 — Assisted Autonomy
```
Definition: Agent makes routine micro-decisions autonomously within explicitly bounded scope.
Decision scope: Formatting, ordering, minor parameter selection within prescribed ranges.
Human oversight: All significant outputs reviewed; micro-decisions logged but not individually reviewed.
Use cases: Document formatting, report structuring, minor schedule adjustments.
Delegation gate: DEVELOPING trust (≥ 0.50); Level 1 certification.
```

### Level 2 — Supervised Autonomy
```
Definition: Agent completes workflow steps autonomously; human reviews at step boundaries.
Decision scope: Full step execution including multi-turn reasoning and tool use.
Human oversight: Review at step boundaries (not within steps); escalation triggers available.
Use cases: Most current OS workflows; routine planning, analysis, documentation.
Delegation gate: DEVELOPING trust (≥ 0.60); Level 2 certification; pre-auth pool coverage.
Current default for all 144 agents.
```

### Level 3 — Conditional Autonomy
```
Definition: Agent completes entire workflows autonomously with defined exception conditions.
Decision scope: Full workflow execution including scope adjustments within declared bounds.
Human oversight: Human reviews completed workflow artifacts (not individual steps); 
                 humans alerted immediately for exception conditions.
Exception conditions: Must be defined before workflow starts (not ad hoc).
Use cases: Sprint planning, routine incident triage, standard report generation.
Delegation gate: ESTABLISHED trust (≥ 0.75); Level 3 certification; behavioral contracts active.
Target: 80% of routine decisions at Level 3 by v40.
```

### Level 4 — Autonomous Operation
```
Definition: Agent operates autonomously across multiple workflows with minimal human touchpoints.
Decision scope: Cross-workflow orchestration, resource allocation within budget, 
                strategic recommendation generation.
Human oversight: Exception-only (humans alerted only when agent escalates or breaches contract).
               Regular scheduled reviews (weekly minimum).
Use cases: Research synthesis, competitive intelligence, OKR tracking.
Constitutional hard limits: Cannot modify constitutional documents, make irreversible 
                            decisions, or take actions affecting human welfare.
Delegation gate: ESTABLISHED trust (≥ 0.85); Level 4 certification; T4 approval; 
                behavioral contract in force; explanation-first architecture active.
```

### Level 5 — Bounded Superintelligence
```
Definition: Agent operates with expert-level judgment across complex, multi-domain problems
            with post-hoc human review.
Decision scope: Strategic analysis, novel problem synthesis, cross-domain insight generation.
Human oversight: Post-hoc review (humans review decisions after they are made, not before).
               Constitutional governor quorum always active.
Constitutional hard limits: Same as Level 4 PLUS: no autonomous external communication,
                           no self-modification of own definition, no trust in own 
                           constitutional reasoning beyond governor quorum verification.
Delegation gate: ESTABLISHED trust (≥ 0.95); Level 5 certification; T5 approval;
                full behavioral contract suite; continuous explanation capture.
Timeline: Not before 2034 (requires 2028–2033 evidence base; v41+ implementation).
```

---

## Level Certification Requirements

Each level requires formal certification before an agent is authorized to operate at it:

```yaml
autonomy_certification:
  agent_id: string
  certified_level: 0 | 1 | 2 | 3 | 4 | 5
  
  prerequisites:
    trust_score_minimum: number
    trust_band: string
    days_at_lower_level: number         # must demonstrate success at lower level first
    golden_test_pass_rate: 0.00–1.00   # must be ≥ 0.95 for Level 3+
    constitutional_clean_record_days: number  # 0 violations for this period
    
  certification_evidence:
    performance_review_period_days: number
    success_rate: 0.00–1.00
    escalation_accuracy: 0.00–1.00
    human_correction_rate: 0.00–1.00   # target: < 0.10 for Level 3+
    
  certification_granted_by: string
  certification_date: ISO8601
  certification_expires: ISO8601        # must re-certify annually
  
  active_constraints: [string]          # specific constraints for this agent at this level
```

---

## Autonomy Escalation Protocol

If an agent encounters a situation outside its certified level:

```
Detection (agent self-assessment):
  "This decision is outside my certified autonomy scope because: [reason]"
  
Response:
  1. Pause: do not act on out-of-scope decision
  2. Escalate: route to appropriate higher-level agent or human
  3. Log: escalation event with context
  4. Resume: continue other in-scope work while escalation is processed
  
Self-assessment triggers:
  - Decision involves irreversible action not in pre-authorization pool
  - Decision scope exceeds declared behavioral contract bounds
  - Constitutional principle appears relevant
  - Confidence < 0.60 on high-stakes decision
  - Novel situation with no precedent in knowledge base
  
Failure to escalate when warranted:
  → Trust penalty (−0.08); investigation opened; possible level downgrade
```

---

## Governance

**Level 0–2:** T3 authorization; standard deployment pipeline
**Level 3:** T3 + behavioral contract review; behavioral-contract-system.md required
**Level 4:** T4 approval; explanation-first-architecture.md required; T5 notification
**Level 5:** T5 + board notification; not before 2034
**Annual re-certification:** Mandatory for all Level 3+ agents
**Level downgrade authority:** T3 can downgrade any agent; T4 required to downgrade Level 4
**Autonomy audit:** All Level 3+ decisions logged to `memory/autonomy/autonomy-decisions.jsonl`
