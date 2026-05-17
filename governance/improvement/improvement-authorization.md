# Improvement Authorization System

## Role
Governs which improvement proposals require human approval, at which tier, and under what conditions. Enforces that structural, high-risk, or policy-affecting changes always receive appropriate oversight before application.

## Authorization Matrix

```
PROPOSAL TYPE                           BLAST RADIUS        REVERSIBILITY    REQUIRED AUTH
──────────────────────────────────────────────────────────────────────────────────────────
QUICK_WIN + SAFE                        Single workflow     Instant          AUTO
QUICK_WIN + CAUTION                     Workflow type       Minutes          AUTO + monitoring
INCREMENTAL + SAFE                      Workflow type       Minutes          AUTO + monitoring
INCREMENTAL + CAUTION                   All workflows       Hours            ADVISORY review
STRUCTURAL + SAFE                       Workflow type       Hours            T3 approval
STRUCTURAL + any                        All workflows       Any              T4 approval
POLICY modification (non-regulatory)    Any                 Any              T3 approval
POLICY modification (regulatory)        Any                 Any              T4 approval
AGENT capability modification           Any                 Hours            T3 approval
ROUTING rule change (major)             All workflows       Minutes          T3 approval
CONSTITUTIONAL-adjacent change          System-wide         Days             T5 + human board
```

## Authorization Queue

### Queue Entry Schema
```yaml
auth_request_id: AUTH-{proposal_id}
proposal_id: string
required_tier: T1-T5
requested_at: ISO8601
sla_deadline: ISO8601        # CRITICAL=2hr, HIGH=8hr, MEDIUM=24hr, LOW=72hr
status: PENDING | APPROVED | REJECTED | EXPIRED
  
assigned_to: string
reviewed_at: ISO8601
reviewer_tier: string
decision_rationale: string
conditions: [string]         # e.g., "apply only during off-peak hours"
```

### SLA Enforcement
```
WARN at 75% of SLA window
ESCALATE to next tier at SLA expiry (not auto-approve)
PROPOSAL expires (not approved/rejected) if no decision by 2× SLA
```

## Emergency Override Protocol
```
CONDITION: CRITICAL bottleneck or production outage requiring immediate optimization
PROCESS:
  1. T4+ officer initiates emergency override
  2. 30-minute emergency authorization token issued
  3. Apply optimization with enhanced monitoring (1min intervals)
  4. Full post-action review required within 24hr
  5. Emergency override logged to immutable-audit-log.md
  6. Repeated emergency overrides (> 3/month) trigger governance review
```

## Delegation Rules
```
T3 can delegate to: T2 agent for INCREMENTAL SAFE changes only
T4 can delegate to: T3 for STRUCTURAL SAFE changes
T5 cannot delegate: CONSTITUTIONAL-adjacent decisions always require T5
```

## Persistence
`memory/improvement-governance/auth-queue.yaml`
`memory/improvement-governance/auth-decisions.jsonl`    (append-only)
