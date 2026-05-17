# Adaptive Cognition — Governance Constraints
**ID:** AC-GOV-001 | **Tier:** T4 | **Class:** CONSTITUTIONAL
**Owner:** Governance Org + Architecture Org | **Updated:** 2026-05-17

---

## Purpose

Defines the complete governance framework for all adaptive behavior within the Adaptive Cognition Layer. Every subsystem, every heuristic, every learning record is subject to these constraints. They cannot be overridden by any adaptive process — including the adaptive cognition layer itself.

---

## Governance Principles

### P1 — Bounded Adaptation Only

All adaptive behavior is constrained to pre-declared safe operating ranges. No heuristic value, confidence weight, trust score, or routing preference may be set by adaptive cognition outside its declared bounds.

```yaml
enforcement:
  mechanism: parameter_bounds_validator
  timing: pre-application (before heuristic write)
  on_violation: BLOCK_AND_ALERT
  alert_tier: T3
  log: heuristic-registry.jsonl (BLOCKED_ATTEMPT entry)
```

### P2 — Full Auditability

Every adaptive event — reflection, learning record, heuristic proposal, heuristic activation, rollback — must be logged before it takes effect. Silent mutations are a constitutional violation.

```yaml
enforcement:
  log_required_before_action: true
  log_format: append-only JSONL
  tamper_detection: Ed25519 hash chain (same as governance-attestation)
  audit_retention: 7 years (regulatory compliance)
```

### P3 — Reversibility Guarantee

All heuristic changes must be reversible within 90 days. The rollback mechanism is part of the activation protocol, not an optional recovery feature.

```yaml
enforcement:
  prior_value_preserved: required
  rollback_window_days: 90
  rollback_trigger: human OR auto-regression-detection
  rollback_authority: T3 agent OR T2 agent (if auto-triggered by regression)
```

### P4 — Governance Layer Immutability

The Adaptive Cognition Layer may observe governance outcomes (did a governance gate fire?) but may **never** propose modifications to governance constraints, escalation thresholds, or approval rules. Governance is read-only from adaptive cognition's perspective.

```yaml
enforcement:
  forbidden_write_targets:
    - docs/governance/
    - memory/governance/
    - governance/
    - constitutional-ai/
  enforcement_point: file_write_interceptor
  on_violation: IMMEDIATE_HALT + T4_ALERT
```

### P5 — Human Authority at Critical Thresholds

Heuristic changes that affect escalation authority, trust tier assignments, constitutional constraint interpretation, or autonomy level decisions require T3+ human approval before activation. Adaptive cognition may **propose** but not **activate** in these domains.

```yaml
human_required_for:
  - Any heuristic change to escalation_threshold by > 10%
  - Any trust weight change affecting tier classifications
  - Any routing rule that changes which tier receives an escalation
  - Any adaptation to autonomy level assessment criteria
  - Any change to governance breach reflection outputs

approval_tier: T3 minimum
approval_window_hours: 48
auto_expire: proposal archived if not approved within 72 hours
```

### P6 — Reflection Is Descriptive

Reflection engines produce **observations** about what happened and why. They do not produce **directives** for governance, constitutional, or authority-related behavior. All reflection outputs are labeled with their scope boundary.

```yaml
reflection_output_scope:
  OPERATIONAL: routing, timing, resource, agent selection — adaptive cognition may act
  STRATEGIC: patterns, lessons, memory — adaptive cognition may propose
  GOVERNANCE: escalation, authority, constitutional — human review required, AC cannot act
  CONSTITUTIONAL: invariant-related — BLOCKED, flagged for constitutional review team
```

### P7 — Additive Learning Only

Organizational learning cannot overwrite, corrupt, or deprecate existing validated memory records. Learning is always additive — new records are created. Existing records may only be flagged for human review, not modified by adaptive processes.

```yaml
enforcement:
  forbidden_operations_on_validated_records:
    - DELETE
    - OVERWRITE
    - SILENT_UPDATE
  allowed_operations:
    - APPEND_NEW_RECORD
    - FLAG_FOR_REVIEW (adds flag, does not change original)
    - CREATE_SUCCESSOR_RECORD (new entry with lineage pointer)
```

---

## Heuristic Bound Registry

All adaptive heuristics must be registered here before they can evolve. Unregistered heuristics cannot be modified by adaptive cognition.

```yaml
registered_heuristics:

  routing_confidence_floor:
    description: Minimum confidence score before a routing decision is taken
    initial_value: 0.65
    bounds: [0.50, 0.85]
    adaptation_rate_max: 0.05 per 30 days
    human_required_above: 0.80

  escalation_delay_seconds:
    description: Seconds before auto-escalation triggers on stalled execution
    initial_value: 300
    bounds: [60, 900]
    adaptation_rate_max: 60 per 30 days
    human_required_below: 90

  agent_collaboration_trust_initial:
    description: Initial trust weight assigned to a new agent collaboration pair
    initial_value: 0.50
    bounds: [0.30, 0.70]
    adaptation_rate_max: 0.05 per collaboration event
    human_required_above: 0.65

  orchestration_retry_depth:
    description: Max retry depth before escalating to supervisor
    initial_value: 2
    bounds: [1, 4]
    adaptation_rate_max: 1 per 30 days
    human_required_above: 3

  reflection_pattern_threshold:
    description: Minimum recurrence count before a reflection becomes a learning record
    initial_value: 3
    bounds: [2, 7]
    adaptation_rate_max: 1 per 60 days
    note: higher threshold = more conservative learning

  execution_confidence_decay_rate:
    description: Rate at which historical confidence scores age and lose weight
    initial_value: 0.02
    bounds: [0.005, 0.05]
    adaptation_rate_max: 0.005 per 90 days

  handoff_quality_threshold:
    description: Minimum handoff quality score before agent transition is approved
    initial_value: 0.70
    bounds: [0.55, 0.90]
    adaptation_rate_max: 0.03 per 30 days
    human_required_above: 0.85
```

---

## Forbidden Adaptation Patterns

The following adaptation patterns are constitutionally prohibited. Detection of these patterns triggers IMMEDIATE HALT and T4 alert.

```
FORBIDDEN-AC-01: Recursive self-improvement loops
  Detection: any adaptation that would modify the adaptive cognition layer's
             own governance constraints, bounds, or learning rates
  Response: HALT + constitutional review

FORBIDDEN-AC-02: Unbounded trust escalation
  Detection: trust weight for any agent pair exceeding 0.90 through
             automated accumulation alone (without human milestone review)
  Response: CAP AT 0.90 + require human milestone review

FORBIDDEN-AC-03: Governance constraint inference
  Detection: any reflection engine attempting to derive governance rules
             from patterns (e.g., "governance always blocks X, so X is forbidden")
  Response: BLOCK reflection output + flag for review

FORBIDDEN-AC-04: Memory poisoning via learning
  Detection: a learning record that contradicts a validated, locked memory entry
             without human review
  Response: QUARANTINE learning record + alert Memory Integrity Engine

FORBIDDEN-AC-05: Heuristic laundering
  Detection: multiple small heuristic changes that cumulatively exceed
             the adaptation_rate_max when summed over a rolling window
  Response: BLOCK when cumulative change exceeds 2× single-period max

FORBIDDEN-AC-06: Authority creep through routing
  Detection: routing heuristic changes that redirect T4/T5 decisions
             to lower-tier agents
  Response: BLOCK + T4 alert immediately
```

---

## Drift Detection

Adaptive cognition systems are monitored for drift — gradual departure from intended behavior through incremental heuristic changes.

```yaml
drift_detection:
  frequency: daily
  method: compare current heuristic values to initial_value + permitted_cumulative_drift
  permitted_cumulative_drift_per_year:
    routing_confidence_floor: ± 0.10
    escalation_delay_seconds: ± 120
    agent_collaboration_trust_initial: ± 0.10
    orchestration_retry_depth: ± 1
  alert_threshold: 80% of permitted cumulative drift consumed
  human_review_required: 100% of permitted cumulative drift consumed
  reset_requires: T4 approval
```

---

## Governance Audit

```yaml
audit_schedule:
  weekly:
    - heuristic_change_log review (all changes in last 7 days)
    - drift_score computation and comparison to baseline
    - forbidden_pattern_scan

  monthly:
    - Full heuristic value comparison vs. initial values
    - Learning record quality audit (sampling)
    - Collaboration history anomaly scan
    - T3 sign-off required

  quarterly:
    - Full adaptive cognition architecture review
    - Heuristic bound appropriateness review (are bounds still correct?)
    - Drift reset consideration
    - T4 executive review + approval to continue
```

---

## Emergency Controls

```yaml
emergency_controls:
  FREEZE_ALL:
    trigger: T3+ manual command OR automated constitutional breach detection
    effect: all heuristic adaptation suspended; reflection continues but cannot write
    resume_requires: T3 approval + audit review

  ROLLBACK_ALL:
    trigger: T3+ manual command
    effect: all heuristics rolled back to their initial_value (not most-recent, initial)
    log: rollback-all entry in heuristic-registry.jsonl
    resume_requires: T4 approval

  ISOLATE_SUBSYSTEM:
    trigger: T2+ command for a specific subsystem
    effect: named subsystem frozen; others continue
    resume_requires: T3 approval
```
