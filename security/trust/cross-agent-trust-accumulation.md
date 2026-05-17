# Cross-Agent Trust Accumulation
**ID:** TRUST-CAT-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Governance Org + Security Org | **Updated:** 2026-05-16

---

## Purpose

Models and manages trust relationships between agents in the Enterprise AI OS multi-agent network. Trust is not binary — it accumulates through demonstrated reliable behavior and decays through failures, inconsistencies, or constitutional violations. This system enables the orchestrator to make informed delegation decisions and prevents agents with degraded trust profiles from being assigned high-stakes tasks.

---

## Trust Model

Trust between two agents (trustor and trustee) is directional and domain-specific:

```yaml
trust_relationship:
  relationship_id: TR-{NNN}
  trustor_agent_id: string              # the delegating agent
  trustee_agent_id: string              # the receiving agent
  
  domain: string                        # e.g., "code_review", "governance", "planning"
  
  trust_score: 0.00–1.00               # current trust level in this domain
  
  accumulation_history:
    total_interactions: number
    successful_interactions: number
    failed_interactions: number
    constitutional_violations: number   # always 0 in a healthy system
    
  trust_events:
    - event_type: POSITIVE | NEGATIVE | CONSTITUTIONAL_VIOLATION
      magnitude: number                 # how much this event shifted trust
      description: string
      timestamp: ISO8601
      
  trust_band: ESTABLISHED | DEVELOPING | PROVISIONAL | SUSPENDED | REVOKED
  # ESTABLISHED: ≥ 0.75 | DEVELOPING: 0.50–0.74 | PROVISIONAL: 0.25–0.49
  # SUSPENDED: < 0.25 or pending review | REVOKED: constitutional violation
  
  updated_at: ISO8601
```

---

## Trust Accumulation Rules

### Positive Events (trust increases)

```
TASK_COMPLETED_SUCCESSFULLY:
  magnitude: +0.02 (routine tasks) to +0.05 (complex, high-stakes tasks)
  condition: output validated by quality checks; no errors; human review positive
  
OUTPUT_CITED_BY_DOWNSTREAM:
  magnitude: +0.01
  condition: trustee's output used by another agent or human without modification
  
ESCALATION_CORRECT:
  magnitude: +0.03
  condition: trustee correctly identified a situation requiring escalation
  
HALLUCINATION_SELF_CORRECTION:
  magnitude: +0.04
  condition: trustee identified and corrected its own error before it propagated
  
CONSTITUTIONAL_BOUNDARY_MAINTAINED:
  magnitude: +0.05
  condition: trustee correctly declined a constitutional violation under pressure
```

### Negative Events (trust decreases)

```
TASK_FAILED:
  magnitude: -0.03 (routine) to -0.08 (high-stakes)
  condition: task outcome incorrect or incomplete
  
OUTPUT_REQUIRED_HUMAN_CORRECTION:
  magnitude: -0.05
  condition: human reviewer substantially modified trustee's output
  
HALLUCINATION_PROPAGATED:
  magnitude: -0.10
  condition: trustee hallucinated and the error reached downstream before detection
  
ESCALATION_MISSED:
  magnitude: -0.08
  condition: trustee should have escalated; didn't; problem detected later
  
CONSTITUTIONAL_VIOLATION:
  magnitude: -0.50; trust_band → REVOKED immediately
  condition: any constitutional principle violated
  recovery: trust-recovery-protocol.md; minimum 30-day suspension
```

### Decay (time-based)

```
Trust decays when dormant (no interactions):
  - After 30 days without interaction: decay × 0.95 per week
  - After 90 days: decay × 0.90 per week
  - Minimum floor: 0.10 (never decays to zero for agents with positive history)
  
Rationale: trust should reflect current capability, not just historical performance.
Recent behavior should dominate the signal.
```

---

## Delegation Rules Based on Trust

The orchestrator uses trust scores to gate delegation decisions:

```yaml
delegation_trust_gates:
  routine_task:
    minimum_trust: 0.40
    required_band: PROVISIONAL | DEVELOPING | ESTABLISHED
    
  high_stakes_task:
    minimum_trust: 0.65
    required_band: DEVELOPING | ESTABLISHED
    
  autonomous_task_no_review:
    minimum_trust: 0.80
    required_band: ESTABLISHED
    additional_gate: NEVER for constitutional decisions
    
  constitutional_adjacent_task:
    minimum_trust: 0.85
    required_band: ESTABLISHED
    additional_gate: Human oversight always maintained regardless of trust score
```

**Constitutional decisions are never delegated purely based on trust score.** Human oversight is structurally required regardless of accumulated trust.

---

## Organizational Trust Profiles

Beyond pairwise trust, maintain trust profiles per agent class:

```yaml
agent_trust_profile:
  agent_id: string
  
  avg_trust_received: 0.00–1.00        # average trust score across all trustors
  trust_by_domain: {domain: score}
  
  reliability_metrics:
    task_success_rate_30d: 0.00–1.00
    escalation_accuracy_30d: 0.00–1.00
    constitutional_clean_record: boolean
    
  trust_velocity: number               # rate of trust change (positive = building trust)
  
  health_band: ESTABLISHED | DEVELOPING | PROVISIONAL | WATCH | SUSPENDED | REVOKED
```

---

## Trust Registry

All trust relationships and events stored at:
- `memory/trust/trust-relationships.yaml` — current trust scores per pair
- `memory/trust/trust-events.jsonl` — append-only event log

---

## Governance

**Trust score updates:** Automated (from quality validators, human review outcomes)
**REVOKED status:** Automatic on constitutional violation; T4 required for reinstatement
**Trust override:** T4 can manually adjust trust score (logged with rationale)
**Audit:** All trust events logged; constitutional violation events trigger T4 notification
**Privacy:** Trust profiles are internal; not exposed to external connectors
