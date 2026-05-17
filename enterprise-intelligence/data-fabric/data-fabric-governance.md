# Data Fabric Governance

## Role
Defines policies, controls, and oversight mechanisms that ensure data in the OS is used lawfully, ethically, and safely. Governs data access, retention, privacy, cross-boundary sharing, and compliance reporting for all data fabric assets.

## Data Governance Policy Hierarchy

```
LEVEL 1  CONSTITUTIONAL DATA PRINCIPLES (C-006: Privacy-First; C-011: Minimal Footprint)
          → Never overridden; enforced at every layer

LEVEL 2  REGULATORY REQUIREMENTS (GDPR, EU AI Act, SOC2, HIPAA where applicable)
          → Enforced automatically; non-compliance = COMPLIANCE_FINDING

LEVEL 3  ENTERPRISE DATA POLICIES (below)
          → Set by T4+ with DPO/CISO input; updated via policy-evolution-engine.md

LEVEL 4  TEAM DATA POLICIES
          → Set by T3+ within bounds of Level 1–3; auto-validated against upper levels
```

## Core Data Policies

```
POLICY              RULE
──────────────────────────────────────────────────────────────────────────────
DATA_MINIMIZATION   Pipelines may only access fields required for their declared purpose
PII_PURPOSE_BINDING PII access requires declared purpose; purpose logged per access
RETENTION_CAPS      Data auto-deleted at retention_days unless T4 extends with justification
CROSS_TEAM_SHARING  CONFIDENTIAL+ sharing between teams: T3 approval + purpose declaration
EXTERNAL_EXPORT     Any data leaving the OS: T4 approval + DPO sign-off if PII present
PSEUDONYMIZATION    PII fields in analytical data: always pseudonymized before aggregation
ERASURE_SUPPORT     All PII entities: must support erasure_record per data-lineage-tracker.md
```

## Data Stewardship Model

```
ROLE              TIER    RESPONSIBILITIES
────────────────────────────────────────────────────────────────────────────
DATA OWNER        T4      Accountable for data asset quality and compliance; approves policy exceptions
DATA STEWARD      T3      Day-to-day quality monitoring; remediation decisions; access approvals
DATA CONSUMER     T1+     Uses data within declared purpose; reports quality issues
DPO (Data Prot.) T4+     Signs off on PII exports; GDPR escalations; erasure verification
CISO             T4+     Signs off on RESTRICTED+ access; security scan for external flows
```

## Access Control Enforcement

```
ACCESS REQUEST FLOW:
  1. Requestor declares: entity_id + purpose + duration
  2. Classification check:
     - PUBLIC/INTERNAL: auto-approved if tier_required met
     - CONFIDENTIAL: T2+ + purpose logged; auto-approved in 15min
     - RESTRICTED: T3 steward approval + DPO notification (1hr SLA)
     - TOP_SECRET: T4 + DPO + CISO approval (4hr SLA)
  3. Grant: scoped access token (purpose-bound, time-limited)
  4. Audit: every access logged to data-access-audit.jsonl

ANOMALOUS ACCESS DETECTION:
  - Access volume > 3× usual rate for entity → alert steward
  - Access outside declared purpose detected → immediate revocation + T3 alert
  - Cross-classification hop (INTERNAL→CONFIDENTIAL in one session) → CRITICAL alert
```

## Compliance Reporting

```
GDPR ARTICLE 30 (Records of Processing Activities):
  - Auto-generated from catalog: entity, purpose, retention, transfers
  - Updated on any catalog change
  - Available to DPO on demand

EU AI ACT ANNEX IV (Technical Documentation):
  - All OPERATIONAL entities used in HIGH_RISK AI: documented with lineage
  - Quality monitoring evidence: exported monthly
  - Available to notified body on request

SOC2 TYPE II:
  - Access controls: quarterly evidence package (access logs, permission reviews)
  - Data retention: automated deletion logs as evidence
  - Encryption at rest/transit: asserted by classification-enforcement layer

MONTHLY DATA GOVERNANCE REPORT:
  - Policy violations this month
  - Erasure requests completed / pending
  - Cross-team sharing approvals
  - Quality tier distribution
  → delivered to DPO + T4 Data Owner
```

## Policy Enforcement Points

```
POINT             TRIGGER                           ACTION
─────────────────────────────────────────────────────────────────────────────
INGEST            New data arrives                  Classification scan + schema validation
ACCESS_REQUEST    Consumer requests entity access   Purpose check + tier validation + audit
PIPELINE_START    Pipeline step initiates           Minimization check (only declared fields)
CROSS_BOUNDARY    Data crosses team/zone boundary   Classification uplift check + approval gate
EXPORT            Data leaves OS                    DPO review + export record
RETENTION_EXPIRY  TTL reached                       Auto-delete + deletion-proof record
ERASURE_REQUEST   GDPR Art.17 request received      Lineage trace → cascade erasure → proof
```

## Persistence
`memory/data-fabric/governance-policy-state.yaml`
`memory/data-fabric/data-access-audit.jsonl`
`memory/data-fabric/erasure-requests.yaml`
`memory/data-fabric/compliance-reports.yaml`
