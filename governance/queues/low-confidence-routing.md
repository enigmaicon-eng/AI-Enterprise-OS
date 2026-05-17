# Low-Confidence Routing

## Purpose
Defines exactly how outputs that fall below confidence thresholds are routed for human review. Low-confidence routing is the primary handoff mechanism from AI-autonomous operation to human oversight — it must be fast, context-preserving, and intelligent about who should review what.

---

## Routing Decision Tree

```
AI Output Generated
    ↓
[Confidence Score Evaluated]
    ↓
┌──────────────────────────────────────────────────────────────────┐
│ Zone?                                                            │
├──────────────────────────────────────────────────────────────────┤
│ AUTONOMOUS (≥ 0.90)                                              │
│   → Proceed; sample 10% for QA; log to telemetry                │
│                                                                  │
│ ASSISTED_AUTONOMOUS (0.80–0.90)                                  │
│   → Proceed; notify relevant human async; 24h review window     │
│                                                                  │
│ SOFT_REVIEW (0.70–0.80)                                          │
│   → Speculative execution + concurrent human review             │
│   → Route to approval-queue (TIER-1)                            │
│   → If approved: commit; if rejected: compensate                │
│                                                                  │
│ REQUIRED_REVIEW (0.60–0.70)                                      │
│   → Halt execution; queue approval request (TIER-2)             │
│   → Resume only after APPROVED decision                         │
│                                                                  │
│ EXPERT_REVIEW (0.40–0.60)                                        │
│   → Halt + quarantine output                                    │
│   → Route to approval-queue (TIER-3, expertise_match)           │
│   → Flag with LOW_CONFIDENCE label in review interface          │
│                                                                  │
│ REJECT_AND_FLAG (< 0.40)                                         │
│   → Reject output entirely                                      │
│   → Route to exception-review-queue (CONFIDENCE_THRESHOLD_BREACH│
│   → Notify agent of rejection                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Routing Payload Schema

When routing a low-confidence output for review, a complete routing payload is assembled:

```yaml
low_confidence_routing_payload:
  routing_id: "LCR-uuid"
  
  # Origin
  agent_id: string
  workflow_instance_id: string | null
  node_id: string | null
  output_type: DECISION | RECOMMENDATION | ARTIFACT | ROUTING | ANALYSIS
  
  # Confidence detail
  confidence:
    overall: float
    zone: SOFT_REVIEW | REQUIRED_REVIEW | EXPERT_REVIEW | REJECT_AND_FLAG
    dimensions:
      factual_accuracy: float
      policy_compliance: float
      scope_appropriateness: float
      completeness: float
      constitutional_safety: float
    weakest_dimension: string          # highest-priority review focus for human
    confidence_reasoning: string       # agent's explanation of its uncertainty
  
  # What was produced
  output:
    content: {}                        # the AI output itself
    content_hash: "sha256:..."
    output_summary: string             # human-readable summary
    downstream_impact: string          # what happens if this is approved/rejected
  
  # Context for reviewer
  review_context:
    task_description: string           # what the agent was trying to do
    inputs_summary: string             # what information the agent had
    alternative_outputs: [{option, confidence, rationale}]  # other options agent considered
    agent_question: string             # what specific question the agent wants human to answer
    suggested_review_focus: [dimension-name]  # where agent thinks human attention is most needed
  
  # Routing metadata
  target_queue: APPROVAL | EXCEPTION
  target_tier: 1–5
  assignment_hint: LEAST_LOADED | EXPERTISE_MATCH
  expertise_required: [domain-string]
  priority_score: integer
  sla_ms: integer
```

---

## Zone-Specific Routing Logic

### SOFT_REVIEW Zone (0.70–0.80)
```yaml
soft_review_routing:
  execution_mode: SPECULATIVE
  
  speculative_execution:
    proceed: true
    compensation_registered: true     # undo plan pre-registered
    commit_on: APPROVED
    rollback_on: REJECTED | TIMEOUT
    rollback_mechanism: compensation_chain from bpmn-subprocess-library.md SBP-004
  
  review_request:
    submitted_to: approval-queue TIER-1
    priority: LOW to MEDIUM (based on subject risk)
    sla_ms: 14400000  # 4 hours
    interface_note: "SOFT REVIEW — AI proceeded speculatively. Approve to commit."
  
  timeout_handling:
    sla_breach:
      action: auto_rollback + escalate to REQUIRED_REVIEW handling
      notify_agent: true
```

### REQUIRED_REVIEW Zone (0.60–0.70)
```yaml
required_review_routing:
  execution_mode: HALTED
  
  halt:
    ai_stops_at_decision_point: true
    state_preserved: true  # can resume from exact point
    holds_applied: [WORKFLOW_PAUSE if downstream steps exist]
  
  review_request:
    submitted_to: approval-queue TIER-2
    priority: MEDIUM to HIGH
    sla_ms: 28800000  # 8 hours
    interface_note: "REQUIRED REVIEW — AI halted. Decision needed to proceed."
  
  context_enrichment:
    ai_explains_uncertainty: true    # agent must provide explanation of what it's uncertain about
    alternative_approaches: suggested by agent before halting
```

### EXPERT_REVIEW Zone (0.40–0.60)
```yaml
expert_review_routing:
  execution_mode: HALTED + QUARANTINED
  
  quarantine:
    output_quarantined: true
    reason: "Low confidence output; expert review required before any use"
    access_during_quarantine: assigned_reviewer_only
  
  review_request:
    submitted_to: approval-queue TIER-3
    assignment_policy: EXPERTISE_MATCH
    expertise_domains: derived from output_type and content analysis
    priority: HIGH
    sla_ms: 14400000  # 4 hours
    interface_label: "⚠ LOW CONFIDENCE OUTPUT"
    
  agent_feedback:
    on_review_complete: agent receives detailed feedback
    feedback_includes: [what reviewer changed, why, confidence calibration note]
    required_for: trust score update
```

### REJECT_AND_FLAG Zone (< 0.40)
```yaml
reject_and_flag_routing:
  output_rejected: true
  agent_notified: true
  
  agent_notification:
    message: "Output rejected due to very low confidence ({score}). Review the task requirements and consider requesting human assistance."
    confidence_breakdown: included
    guidance: suggestions for improving confidence on retry
  
  exception_item:
    submitted_to: exception-review-queue
    category: CONFIDENCE_THRESHOLD_BREACH
    priority: HIGH
    review_question: "Should this output be reviewed by an expert despite very low AI confidence, OR should the task be re-approached differently?"
  
  retry_policy:
    allow_retry: true
    retry_conditions:
      - agent must acknowledge rejection reason
      - agent must modify approach (can't submit identical output)
      - max_retries: 2 before human takes over task entirely
```

---

## Multi-Dimensional Low Confidence

When only specific dimensions are low (not the overall score):

```yaml
dimension_specific_routing:
  only_policy_compliance_low:
    threshold: policy_compliance < 0.65 (even if overall >= 0.70)
    action: flag for policy specialist review
    route: EXPERT_REVIEW with domain=policy
  
  only_constitutional_safety_low:
    threshold: constitutional_safety < 0.70 (triggers hard floor)
    action: mandatory constitutional review regardless of overall score
    route: REQUIRED_REVIEW minimum; constitutional pre-check forced
  
  only_completeness_low:
    threshold: completeness < 0.60 (even if other dims high)
    action: request_info from submitter before routing for final approval
    route: internal NEEDS_INFO loop first
```

---

## Routing Performance Targets

```yaml
performance:
  routing_decision_latency: < 200ms   # time from confidence score to routing dispatch
  
  queue_submission_latency:
    approval_queue: < 500ms
    exception_queue: < 500ms
  
  end_to_end_routing_latency: < 1 second total
  
  failure_handling:
    if_queue_unavailable: buffer locally for 60 seconds then alert
    if_routing_fails: default to REQUIRED_REVIEW (fail safe, not fail open)
```
