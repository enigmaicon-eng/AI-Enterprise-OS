# Governance Optimizer

## Role
Identifies governance inefficiencies — approval bottlenecks, over-triggering policies, miscalibrated thresholds, and under-utilized controls — and generates targeted governance improvement proposals that reduce friction without reducing protection.

## Optimization Signal Sources

```
SOURCE                                  SIGNAL
──────────────────────────────────────────────────────────────────────────────
evaluation/governance-decision-evaluator   override_rate, regret_rate, consistency
observability/governance-telemetry-hub     approval_chain_latency, gate_pass_rate
risk-and-controls/exception-management    exception volume, blanket exception usage
trust/constitutional-alignment-system     compliance drift, near-misses
improvement-governance/improvement-impact-tracker  governance change outcomes
human-review/approval-queue-system        queue depth, SLA breach rate
operational-review/governance-throughput-metrics    decisions/hr by tier
```

## Governance Inefficiency Patterns

### Pattern 1: Approval Over-Triggering
```
SIGNAL: policy rule triggers REQUIRE_APPROVAL for cases human always approves (rate > 0.98)
ROOT_CAUSE: threshold too conservative
PROPOSAL: raise confidence threshold to reduce approval load while maintaining protection
CONSTRAINT: never propose elimination of a gate, only threshold adjustment
```

### Pattern 2: Queue Saturation
```
SIGNAL: approval queue depth sustained > 30 items for > 4hr
ROOT_CAUSE: either volume spike or under-staffed tier
PROPOSAL: route to under-utilized tier agents OR pre-delegate standard case types
CONSTRAINT: delegation cannot exceed improvement-authorization matrix
```

### Pattern 3: Redundant Controls
```
SIGNAL: two controls test for identical condition; both pass at rate > 0.99 jointly
ROOT_CAUSE: control overlap from independent additions
PROPOSAL: consolidate into single control; retain stricter evidence requirement
CONSTRAINT: proposed consolidation requires compliance officer sign-off
```

### Pattern 4: SLA Mismatch
```
SIGNAL: actual review time consistently < 25% of SLA (SLA too generous)
PROPOSAL: tighten SLA to match operational reality; creates accountability
SIGNAL: SLA breach rate > 20% for a decision type
PROPOSAL: extend SLA OR add capacity OR simplify review criteria
```

### Pattern 5: Calibration Drift
```
SIGNAL: governance_decision_quality declining trend over 30d
ROOT_CAUSE: reviewers drifting from standard; edge cases accumulating
PROPOSAL: generate re-calibration playbook + updated decision examples
```

## Governance Optimization Proposal Schema
```yaml
proposal_id: GOPT-{seq}
pattern_type: string
target: string              # specific policy, gate, queue, or control
current_state: string
proposed_change: string
protection_preserved: string    # explicitly state what safety is maintained
estimated_efficiency_gain: string
risk_of_change: LOW | MEDIUM | HIGH
requires_compliance_review: boolean
requires_human_approval: boolean
```

## Safety Constraint
The governance optimizer NEVER proposes:
- Removing a gate entirely (only tuning thresholds)
- Bypassing constitutional-level controls
- Reducing retention periods below regulatory minimums
- Removing human oversight from EXECUTIVE/CONSTITUTIONAL workflows

## Persistence
`memory/governance-evolution/optimization-proposals.yaml`
