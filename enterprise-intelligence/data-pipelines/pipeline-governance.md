# Pipeline Governance

## Role
Defines approval requirements, compliance controls, audit standards, and operational policies for all data pipelines in the OS. Ensures pipelines operate within data governance boundaries, meet quality standards, and produce auditable evidence for compliance purposes.

## Pipeline Classification

```
PIPELINE CLASS     CRITERIA                                     GOVERNANCE LEVEL
───────────────────────────────────────────────────────────────────────────────
STANDARD           Internal data, no PII, < CONFIDENTIAL        T1 owner; automated review
ELEVATED           CONFIDENTIAL data or PII                     T2 owner; T3 approval to activate
REGULATED          RESTRICTED+ or EU AI Act HIGH_RISK input     T3 owner; T4 approval + DPO review
CRITICAL           TOP_SECRET or production-system write        T4 owner; T5 approval; quarterly audit
```

## Pipeline Approval Gates

```
NEW PIPELINE:
  STANDARD:   schema review (automated) + T1 self-certification → active
  ELEVATED:   T2 review + automated security scan → T3 approval → active
  REGULATED:  T3 review + security scan + DPO review → T4 approval → active
  CRITICAL:   T3 review + security scan + DPO + CISO → T5 + board approval → active

MAJOR VERSION CHANGE:
  Any class: repeat approval gate for new version
  Side-by-side deployment: old version runs until new version verified

BACKFILL / PURGE:
  Always: T3 minimum; DPO notification if PII; T4 for production entities
```

## Audit Requirements

```
STANDARD PIPELINES:
  - Run records retained 90 days
  - Error events retained 1 year
  - Lineage records retained per entity policy

ELEVATED PIPELINES:
  - Run records + step-level detail retained 2 years
  - All input/output entity snapshots at run time: hash recorded
  - Monthly automated compliance report to T2 owner

REGULATED PIPELINES:
  - Run records retained 7 years minimum (10yr if HIGH_RISK AI)
  - Full input/output schema version at run time
  - Quality gate evidence retained with run record
  - Quarterly manual audit by T3 + compliance team

CRITICAL PIPELINES:
  - Every execution: T4 notified with summary
  - Quarterly board-level evidence package
  - Annual third-party audit required
```

## SLA Management

```
PIPELINE SLA ENFORCEMENT:
  80% of SLA elapsed → WARNING alert to owner team
  100% SLA → BREACH alert; T2 notified; execution log frozen for investigation
  2× SLA → auto-cancel; T3 escalation; incident record created

SLA TARGETS BY CLASS:
  STANDARD:  4hr max (most complete in < 30min)
  ELEVATED:  2hr max
  REGULATED: 6hr max (larger datasets expected)
  CRITICAL:  1hr max (production impact if slow)
```

## Data Contract Enforcement

```
DATA CONTRACT: agreement between pipeline and consuming team
  contract_id: string
  producer_pipeline_id: string
  consumer_team_id: string
  entity_ids: [entity_id]
  
  guarantees:
    freshness_sla_min: number    # pipeline commits to this freshness
    quality_tier_min: GOLD | SILVER | BRONZE
    schema_stability: MAJOR_ONLY | MINOR_OK | ANY  # how often schema changes
  
  notification:
    on_freshness_breach: boolean
    on_quality_degradation: boolean
    on_schema_change: boolean

CONTRACT VIOLATIONS:
  freshness breach:    notify consumer team; log to contract-violations.jsonl
  quality drop:        notify consumer team; pipeline owner gets T+1hr to resolve
  breaking schema:     consumer team gets 14-day migration window
```

## Governance Dashboard

```
╔════════════════════════════════════════════════════════════╗
║  PIPELINE GOVERNANCE DASHBOARD                              ║
╠════════════════════════════════════════════════════════════╣
║  CATALOG          QUALITY              COMPLIANCE           ║
║  Total: {N}       Avg score: {N}       Violations: {N}      ║
║  Active: {N}      GOLD: {N}%           Open findings: {N}   ║
║  CRITICAL: {N}    Freshness OK: {N}%   Contracts OK: {N}%   ║
╠════════════════════════════════════════════════════════════╣
║  SLA HEALTH       REGULATED PIPELINES  TOP ISSUES           ║
║  On-time: {N}%    Count: {N}           1. {issue}           ║
║  Breaches 30d: N  Next audit: {date}   2. {issue}           ║
╚════════════════════════════════════════════════════════════╝
```

## Persistence
`memory/data-pipelines/pipeline-governance-state.yaml`
`memory/data-pipelines/data-contracts.yaml`
`memory/data-pipelines/contract-violations.jsonl`
`memory/data-pipelines/compliance-evidence.yaml`
