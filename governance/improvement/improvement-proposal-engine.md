# Improvement Proposal Engine

## Role
Generates structured improvement proposals from signals across all optimization subsystems. Prioritizes, packages, and routes proposals through the appropriate governance path (auto-apply, advisory review, or human approval).

## Proposal Generation Pipeline

```
SIGNAL SOURCES → PROPOSAL ENGINE → PRIORITIZATION → ROUTING → APPLY/REVIEW
     ↑                  ↓
performance-feedback-loop    proposal_record
execution-pattern-miner      impact_analysis
resource-efficiency-scorer   safety_classification
cost-optimization-advisor    authorization_path
bottleneck-learning-engine
```

## Proposal Schema

```yaml
proposal_id: PROP-{domain}-{seq}
title: string
description: string
domain: ROUTING | WORKFLOW | POLICY | RESOURCE | AGENT | BOTTLENECK | ARCHITECTURE
type: QUICK_WIN | INCREMENTAL | STRUCTURAL | EXPERIMENTAL

evidence:
  signal_count: number
  observation_period_days: number
  supporting_patterns: [pattern_id]
  conflicting_signals: [string]

impact:
  primary_metric: string
  estimated_improvement_pct: number
  estimated_monthly_cost_savings_usd: number
  affected_workflows: [string]
  affected_agents: [string]
  side_effects: [string]

risk:
  safety_class: SAFE | CAUTION | REQUIRES_REVIEW | HIGH_RISK
  reversibility: INSTANT | MINUTES | HOURS | DAYS | IRREVERSIBLE
  blast_radius: SINGLE_WORKFLOW | WORKFLOW_TYPE | ALL_WORKFLOWS | SYSTEM_WIDE

authorization:
  path: AUTO_APPLY | ADVISORY | T3_APPROVAL | T4_APPROVAL | T5_BOARD
  rationale: string

priority_score: number    # computed: ROI × confidence × urgency
status: PROPOSED | UNDER_REVIEW | APPROVED | IMPLEMENTING | DONE | REJECTED
```

## Authorization Path Rules
```
SAFE + QUICK_WIN + estimated_improvement < 15%:      AUTO_APPLY
SAFE + INCREMENTAL + blast_radius <= WORKFLOW_TYPE:  AUTO_APPLY with monitoring
CAUTION OR STRUCTURAL:                               ADVISORY (improvement dashboard)
POLICY change (non-constitutional):                  T3_APPROVAL
AGENT capability change:                             T3_APPROVAL
ARCHITECTURAL change:                                T4_APPROVAL
CONSTITUTIONAL-adjacent:                             T5_BOARD + human sign-off
```

## Proposal Lifecycle
```
PROPOSED → (safety check) → UNDER_REVIEW → (authorization) → APPROVED
         → (implementation) → IMPLEMENTING → (monitoring) → DONE
                                                          → ROLLED_BACK (auto or manual)
PROPOSED → REJECTED (if conflicting evidence or manual veto)
```

## Conflict Detection
```
BEFORE generating proposal:
  check: is there an active proposal for the same target (policy/workflow/agent)?
  IF YES: merge evidence OR flag conflict for human resolution
  NEVER: issue two conflicting proposals for same component simultaneously
```

## Persistence
`memory/improvement-governance/proposals.yaml`
`memory/improvement-governance/proposal-history.jsonl`
