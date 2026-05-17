# Agent Feedback Integration

## Purpose
Collects, validates, and integrates feedback signals from all sources into actionable learning inputs for agents. Feedback is the raw material of learning — but not all feedback is equally reliable, timely, or safe to act on. This system governs the full feedback pipeline from signal emission to behavioral update, ensuring that learning is grounded in quality evidence.

---

## Feedback Signal Taxonomy

```yaml
feedback_taxonomy:
  OUTCOME_FEEDBACK:
    description: The actual result of an action or decision
    reliability: HIGH (ground truth)
    latency: delayed (may take hours to days to know the outcome)
    examples:
      - task completed successfully → positive outcome for all capability patterns exercised
      - artifact quality score returned by reviewer → quality signal
      - decision reversed 5 days later → negative decision quality signal
      - incident caused by agent's action → severe negative signal
    
  EXPLICIT_FEEDBACK:
    description: A human or peer agent explicitly rates the agent's output
    reliability: MEDIUM-HIGH (depends on reviewer quality)
    latency: moderate (within hours typically)
    examples:
      - reviewer marks agent's recommendation as "excellent" or "poor"
      - knowledge.feedback HELPFUL or NOT_RELEVANT from retrieval consumer
      - supervisor rates a coaching session outcome
      - quality reviewer scores an artifact
  
  IMPLICIT_FEEDBACK:
    description: Behavioral signals inferred from how output is used
    reliability: MEDIUM (indirect; requires interpretation)
    latency: low to moderate
    examples:
      - agent's suggested routing accepted without modification (positive)
      - agent's draft heavily rewritten by human (negative implicit)
      - knowledge unit retrieved but not applied (weak negative applicability signal)
      - agent's escalation handled at exact tier suggested (calibration confirmation)
  
  COMPARATIVE_FEEDBACK:
    description: Agent's output compared to a reference or peer
    reliability: HIGH when reference is authoritative
    latency: variable
    examples:
      - agent's constitutional evaluation vs. ground truth evaluation
      - agent's quality score vs. expert quality score for same artifact
      - benchmark result vs. expected_output
  
  SELF_FEEDBACK:
    description: Agent's own reflection on its performance
    reliability: LOW-MEDIUM (potential for bias)
    latency: immediate
    examples:
      - agent's post-task self-assessment (confidence vs. outcome)
      - agent flags its own output as uncertain
      - agent requests additional review (uncertainty-driven escalation)
    governed_by: self-feedback has reduced weight; cannot solely drive learning updates
```

---

## Feedback Validation Pipeline

```yaml
feedback_validation:
  step_1_source_credibility:
    HUMAN_EXPERT: credibility = 0.90
    PEER_AGENT_HIGHER_TIER: credibility = 0.80
    PEER_AGENT_SAME_TIER: credibility = 0.60
    AUTOMATED_SYSTEM: credibility = 0.70 (well-calibrated systems)
    SELF_ASSESSMENT: credibility = 0.40
    UNKNOWN_SOURCE: credibility = 0.20 (treat with extreme caution)
  
  step_2_temporal_validity:
    check: is this feedback about a recent action? (not stale feedback about old behavior)
    cutoff: feedback about events > 90 days ago has 50% weight reduction
    exception: deliberate retrospective analysis (explicitly labeled) has full weight
  
  step_3_signal_consistency:
    check: does this signal agree or disagree with other recent signals?
    consistent_with_prior: validate and reinforce (higher effective weight)
    contradicts_prior: flag for reconciliation before applying (do not apply blindly)
    isolated_signal: apply with caution (single data point; low confidence)
  
  step_4_intent_check:
    purpose: detect adversarial or gaming feedback
    red_flags:
      - unusually positive feedback after a series of poor outcomes
      - feedback from the same source always agrees with agent (possible bias)
      - feedback volume spike (sudden high volume from unfamiliar source)
    on_red_flag: quarantine feedback; flag for governance review; do not apply
  
  step_5_normalization:
    map all feedback to canonical scale: -1.0 (severe negative) to +1.0 (strong positive)
    apply source credibility × temporal weight × consistency weight
    output: validated_feedback_signal {agent_id, capability_id, magnitude, confidence, source_credibility}
```

---

## Feedback Integration Rules

```yaml
feedback_integration_rules:
  RULE-FI-001:
    name: Minimum Signal Count for Behavioral Change
    rule: A behavioral pattern update requires at least 3 consistent validated signals
    exception: OUTCOME_FEEDBACK from high-credibility source (>= 0.85) may trigger after 1 signal
    rationale: prevents overfitting to noise
  
  RULE-FI-002:
    name: Safety Signal Priority
    rule: Any negative feedback related to constitutional or governance compliance is
          processed immediately with maximum weight, regardless of other signals
    action: immediate learning freeze pending investigation
  
  RULE-FI-003:
    name: Positive Feedback Requires Outcome Confirmation
    rule: Positive feedback alone (without outcome confirmation) updates working memory only
          — not long-term behavioral patterns
    rationale: prevents learning from approval-seeking behavior that hasn't been validated
  
  RULE-FI-004:
    name: Contradiction Triggers Pause
    rule: When two high-credibility signals directly contradict each other, no behavioral
          update occurs until the contradiction is resolved (either by additional signals or human adjudication)
  
  RULE-FI-005:
    name: Self-Feedback Isolation
    rule: Self-feedback signals are stored and considered but cannot independently trigger
          behavioral changes — must be corroborated by at least one external signal
  
  RULE-FI-006:
    name: Feedback Informs, Human Confirms for High-Stakes Capabilities
    rule: For GOVERNANCE category capabilities (constitutional_evaluation, override_assessment),
          behavioral updates from feedback require Tier-3+ human review before taking effect
```

---

## Feedback Application Schema

```yaml
feedback_application:
  application_id: "FA-uuid"
  agent_id: string
  applied_at: ISO-8601
  
  signals_integrated: [signal_id]
  net_signal_magnitude: float        # weighted average of all integrated signals
  
  capability_affected: capability_id
  behavior_parameter: string         # what specific behavior changed
  
  before_value: float                # prior setting
  after_value: float                 # new setting
  change_magnitude: float
  
  authorized_by: string              # auto | governance_id
  audit_ref: learning_audit_event_id
  
  outcome:
    APPLIED: behavioral update executed
    PENDING: waiting for additional signals or human review
    BLOCKED: blocked by governance rule or learning boundary
    QUARANTINED: suspicious feedback; under investigation
```

---

## Feedback Loop Analytics

```yaml
feedback_analytics:
  per_agent_metrics:
    total_signals_received_30d: int
    signals_validated: int
    signals_applied: int
    signals_blocked: int
    integration_rate: applied / validated
    avg_signal_quality: mean(source_credibility × consistency)
    
  system_health:
    feedback_latency: time from event to signal delivery (target < 5 minutes for real-time)
    source_distribution: fraction of signals per source type
    quarantine_rate: quarantined / total signals (high rate → possible gaming attempt)
    contradiction_rate: signals triggering RULE-FI-004 (high rate → signal quality issue)
  
  learning_attribution:
    for_each_behavioral_improvement: trace to specific feedback signals that caused it
    use: understand which feedback sources are most valuable; optimize collection
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-learning/agent-learning-model.md` | Learning model that feedback feeds into |
| `agent-learning/agent-behavioral-adaptation.md` | Behavioral changes from integrated feedback |
| `agent-performance/agent-performance-tracker.md` | FEEDBACK_APPLIED signal source |
| `agent-performance/agent-performance-coach.md` | Coaching delivers structured feedback |
| `knowledge-retrieval/knowledge-query-api.md` | Feedback endpoint for knowledge signals |
| `enterprise-telemetry/enterprise-event-bus.md` | Source of implicit feedback events |
