# Policy Optimizer

## Role
Tunes policy thresholds, gate conditions, and approval routing based on operational outcomes — without changing policy intent. Never modifies constitutional or regulatory obligations; only operational thresholds within policy-defined safe bounds.

## Tunable vs. Fixed Policy Elements

```
TUNABLE (optimizer may adjust within bounds):
  - confidence thresholds (e.g., REQUIRE_APPROVAL trigger level)
  - gate pass criteria (e.g., minimum test coverage %)
  - escalation time windows
  - routing priority weights
  - auto-approval eligibility bands

FIXED (never touched by optimizer):
  - constitutional principles (C-001–C-012)
  - regulatory hard-deny rules
  - maximum exception durations
  - non-bypassable human oversight triggers
```

## Threshold Learning Algorithm

### Approval Rate Analysis
```
FOR each policy rule with REQUIRE_APPROVAL verdict:
  compute:
    approval_rate_last_90d        # how often humans approve these
    escalation_rate               # how often they escalate further
    override_rate                 # how often override is used
    avg_review_time_min

  IF approval_rate > 0.98 AND avg_review_time < 2min:
    SIGNAL: threshold may be too conservative → propose raising confidence floor
  IF override_rate > 0.15:
    SIGNAL: threshold may be too permissive → propose tightening
```

### False Positive Rate Reduction
```
FOR each gate with FAIL verdict:
  compute: false_positive_rate = manual_overrides / total_failures
  
  IF false_positive_rate > 0.20 AND sample_count >= 30:
    propose: gate_condition_refinement
    evidence: pattern of what triggered false positive
    constraint: new condition must be strictly within original intent
```

## Optimization Proposal Schema
```yaml
proposal_id: POPT-{rule_id}-{seq}
target_policy: string
target_rule: string
current_threshold: value
proposed_threshold: value
justification: string
evidence:
  sample_count: number
  false_positive_rate: number
  approval_rate: number
  override_rate: number
safety_check: SAFE | REQUIRES_REVIEW
authorization_required: boolean    # always true for REGULATORY/CONSTITUTIONAL policies
```

## Absolute Constraints
- Any policy tagged `category: CONSTITUTIONAL` → read-only, no proposals generated
- Any policy tagged `category: REGULATORY` → proposals generated but require T4+ human approval
- Proposed threshold movement limited to ±15% of current value per optimization cycle
- No compound changes: only one threshold adjustment per rule per 30-day window
