# Trust Weight Evolution
**ID:** AC-CP-002 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Governance Org + AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Defines how trust weights between agent pairs evolve based on accumulated operational evidence. Trust weights influence task routing, delegation authority, and handoff confidence. The system builds evidence-based trust rather than relying on static initial assignments.

---

## Trust Weight Model

```
TRUST WEIGHT DEFINITION:

  trust_weight(A → B):
    The degree to which Agent A's outputs can be relied upon by Agent B
    without requiring independent verification at every step.

    trust_weight = 0.20: minimum (mandatory verification of every output)
    trust_weight = 0.50: neutral default (standard verification protocols)
    trust_weight = 0.75: elevated trust (spot-check verification)
    trust_weight = 0.90: maximum allowed (milestone review required before higher)

  HARD CONSTRAINTS:
    - trust_weight is always bounded [0.20, 0.90]
    - trust_weight cannot exceed 0.90 without human milestone review at T3
    - trust_weight cannot drop below 0.20 (all agents retain base participation rights)
    - Trust weights are directional: trust(A→B) ≠ trust(B→A)
    - Trust weights are domain-specific: trust(A→B, domain=security) ≠ trust(A→B, domain=UX)
```

---

## Trust Evidence Model

```yaml
trust_evidence_record:
  record_id: TER-{ISO8601}-{hash6}
  agent_source: agent_id      # the agent whose output is being evaluated
  agent_evaluator: agent_id   # the agent receiving the output
  domain: string
  evidence_type: OUTCOME | REVIEW | VERIFICATION | GOVERNANCE | ESCALATION
  evidence_value: float [-1.0, 1.0]  # positive = trust-building; negative = trust-reducing
  weight: float [0.1, 1.0]           # how much this evidence matters
  timestamp: ISO8601
  workflow_id: WF-*                  # source context

EVIDENCE TYPES:
  OUTCOME:       final output quality score from post-execution reflection
  REVIEW:        quality assessment by a peer or governance reviewer
  VERIFICATION:  spot-check or audit result (pass/fail → ±0.5)
  GOVERNANCE:    governance gate result (pass = +0.3; fail = -0.5; breach = -1.0)
  ESCALATION:    escalation triggered due to quality issue (−0.4 per event)
```

---

## Trust Update Protocol

```
TRUST WEIGHT UPDATE ALGORITHM:

  Inputs:
    current_trust_weight(A → B, domain)
    new_evidence_record (TER-*)

  Algorithm (exponential moving average with floor/ceiling enforcement):

    evidence_contribution = evidence_value × weight
    new_trust = current_trust_weight + (learning_rate × evidence_contribution)
    new_trust = clamp(new_trust, 0.20, 0.90)

    WHERE:
      learning_rate = 0.05  (bounded by heuristic bound registry)
      Negative evidence decays trust faster: if evidence_value < 0:
        learning_rate = 0.10 (asymmetric; negative signal weighted 2×)

  BATCH PROCESSING:
    Trust updates are batched — not applied in real time during execution
    Updates processed after workflow completion via post-execution reflection
    Maximum one update batch per agent pair per workflow
    Real-time trust overrides require T3 authorization

  MILESTONE REVIEW TRIGGER:
    When new_trust would exceed 0.87:
      → Pause update
      → Flag for human milestone review at T3
      → Trust updated to 0.87 pending review
      → After T3 approval: trust can be updated to target value (max 0.90)
```

---

## Trust Degradation Conditions

```
AUTOMATIC TRUST DEGRADATION TRIGGERS:

  HARD DEGRADATION (immediate, -0.20, no batch delay):
    - Governance breach by source agent (GB-01 through GB-07)
    - Constitutional violation detected in source agent output
    - Fabrication or hallucination confirmed by verification

  STANDARD DEGRADATION (batch, -0.10 per occurrence):
    - Quality gate failure attributed to source agent
    - Escalation raised due to source agent output quality
    - Peer review score < 0.40

  RECOVERY PATH:
    After hard degradation: minimum 5 consecutive positive OUTCOME evidences
    required before trust can increase again
    After standard degradation: standard trust update protocol applies
    Trust recovery is bounded by the same 0.90 ceiling
```

---

## Trust Transparency Requirements

```
AUDITABILITY:
  Every trust weight change is recorded in append-only JSONL:
    trust-weight-audit.jsonl (per-pair, per-domain)

  Fields: timestamp, agent_source, agent_evaluator, domain,
          prior_weight, new_weight, delta, trigger_record_id, authorized_by

EXPLAINABILITY:
  Any agent can request: "Why is trust(A→B, domain=X) = 0.63?"
  Response: ordered list of the 5 most impactful evidence records
  that shaped the current weight, with timestamps and context

OVERSIGHT:
  T3 Governance Org has read access to all trust weight records
  Trust weights are included in quarterly AI governance reviews
  Anomalous trust patterns (rapid decline, plateau at extremes) flagged automatically
```

---

## Trust Weight Health Dashboard

```
METRICS:
  avg_trust_weight_by_domain:   target [0.60, 0.80] (healthy operational range)
  pct_pairs_at_floor (0.20):   target < 5%  (too many floor pairs = systemic issue)
  pct_pairs_near_ceiling (0.87+): target < 10% (pending milestone reviews)
  trust_volatility_30d:         target < 0.10 (high volatility = unstable relationships)
  degradation_events_30d:       track count and severity; alert on spike
```

---

## Governance

- Trust weight records are T3-class; modifications require T3 authorization
- Trust weight data is available to orchestrators and orchestration agents for routing
- Trust weights cannot be manually overridden below 0.20 or above 0.90 by any agent
- Annual review of trust weight distribution required by Governance Org
