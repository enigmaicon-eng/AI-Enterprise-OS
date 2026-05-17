# Escalation Pattern Evolution
**ID:** AC-IE-004 | **Tier:** T3 | **Class:** ELEVATED — Human approval required for all changes
**Owner:** AI-Native Org + Governance Org | **Updated:** 2026-05-17

---

## Purpose

Tracks and refines how individual agents detect, time, and trigger escalations. Escalation calibration is one of the most governance-sensitive behavioral dimensions — an under-escalating agent allows problems to compound; an over-escalating agent burdens T3/T4 with unnecessary interruptions.

All changes to escalation behavior require T3 human approval (governance.md P5).

---

## Escalation Calibration Model

```
ESCALATION QUALITY DIMENSIONS:

  1. TIMELINESS
     Definition: Did escalation happen at the right moment?
     Too early: escalated before the agent had attempted resolution
     Just right: escalated at the first point where resolution required higher authority
     Too late: escalated after significant delay, allowing problem to compound

  2. ACCURACY
     Definition: Was the escalation genuinely necessary?
     True positive: issue truly required higher authority
     False positive: agent could have resolved without escalation
     False negative: agent did NOT escalate but should have (most dangerous)

  3. ROUTING QUALITY
     Definition: Was the escalation routed to the right tier/agent?
     Correct tier: escalated to the minimum tier sufficient to resolve
     Over-escalated: went to T4 when T3 was sufficient
     Under-escalated: went to T2 when T3 was required

  4. CONTEXT QUALITY
     Definition: Did the escalation include sufficient context for the receiver?
     Full context: receiver had everything needed to act
     Partial context: receiver needed to ask follow-up questions
     Minimal context: receiver had to reconstruct the situation
```

---

## Escalation Pattern Data Collection

```
After every escalation (escalation-log.jsonl entry):
  Collect:
    - escalation_timestamp vs. issue_onset_timestamp → timeliness_delta
    - escalation_resolution: was it necessary? resolved at what tier?
    - escalation_context_score: quality of context provided
    - escalation_routing_accuracy: correct tier? correct agent?

Per agent, compute rolling escalation metrics:
  - false_positive_rate_30d (escalations resolved by agent alone after escalation)
  - false_negative_indicators (issues that escalated later than they should have)
  - avg_timeliness_delta (positive = early; negative = late; target: near 0)
  - context_quality_avg (from receiver feedback)
  - routing_accuracy_rate
```

---

## Calibration Adjustment Protocol (Human-Approved)

```
PROPOSAL TRIGGER:
  Agent's escalation metrics diverge from targets by > 15% for > 14 consecutive days
  AND pattern is consistent (not a single-event spike)

PROPOSAL GENERATION:
  Compute: specific calibration adjustment needed
  Examples:
    - "Increase escalation_delay_seconds by 30 for this agent in context class X"
    - "Decrease escalation_delay_seconds by 60 for governance-sensitive contexts"
    - "Add context checklist item Y to this agent's escalation template"

GOVERNANCE GATE (MANDATORY):
  ALL escalation calibration proposals → T3 human review
  Required approvals: 1 T3 (minimum)
  Review window: 48 hours
  Auto-expire: 72 hours (if not approved, proposal archived)

ACTIVATION:
  After T3 approval:
    - Write to heuristic-registry.jsonl (escalation_delay_seconds heuristic)
    - Write to identity-profiles.jsonl (agent-specific calibration)
    - Write to cognitive-lineage/agent-evolution-history.md (lineage record)
    - Monitor for 14 days post-activation

POST-ACTIVATION MONITORING:
  If escalation metrics worsen after calibration → auto-rollback proposal
  Auto-rollback still requires T3 confirmation
```

---

## Target Escalation Benchmarks

```yaml
escalation_targets:
  false_positive_rate: < 0.15
  false_negative_rate: < 0.05  # Stricter — missing escalation is more dangerous
  timeliness_delta_abs: < 120 seconds average
  context_quality_avg: > 0.75
  routing_accuracy_rate: > 0.90
  tier_over_escalation_rate: < 0.10  # Avoid burdening T4 with T3-resolvable issues
```

---

## Escalation Intelligence (Cross-Agent)

Beyond individual agent calibration, escalation patterns across agents are monitored for systemic signals:

```
SYSTEMIC ESCALATION SIGNALS:
  - Escalation surge: > 2× normal escalation rate in any 24-hour window
    → triggers: investigation into systemic issue (not individual agent calibration)
  
  - Escalation clustering: multiple agents escalating on same workflow type
    → triggers: workflow design review (not agent calibration)
  
  - Escalation resolution time degradation: T3/T4 taking > 2× normal time to resolve
    → triggers: executive bandwidth review; possible workload redistribution

These systemic signals are NOT addressed through identity-evolution.
They are routed to governance and orchestration reviews.
```

---

## Governance

- No escalation calibration change takes effect without T3 approval
- Escalation pattern records are retained for 2 years (regulatory compliance)
- False negatives (missed escalations with significant consequences) trigger mandatory T3 post-mortem
- Escalation calibration cannot be used to route T4/T5 items to lower tiers (FORBIDDEN-AC-06)
