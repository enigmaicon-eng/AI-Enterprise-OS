# WF-019: Mortgage Customer Onboarding

**Version:** 1.0.0 | **Owner:** Customer Success Org | **Tier:** T3 | **Class:** REGULATED | **SLA:** 45 days

## Purpose
Onboard mortgage lenders and servicers to the platform with full regulatory compliance under RESPA, TILA, HMDA, and state-level mortgage regulations — including lender licensing verification, data privacy controls, fair lending compliance, and MISMO data standard integration — producing a certified compliant customer environment ready for production loan processing.

## Inputs

```
REQUIRED:
  lender_name:        string — legal entity name
  lender_type:        BANK | CREDIT_UNION | IMB | SERVICER | CORRESPONDENT | BROKER
  state_licenses:     [state_code] — states where lender is licensed to originate
  nmls_id:            string — NMLS company ID
  contract_id:        string — signed MSA reference
  sales_owner:        string — T3 account executive

OPTIONAL:
  loan_types:         [CONVENTIONAL | FHA | VA | USDA | JUMBO | HELOC]
  integration_type:   LOS_INTEGRATION | API | BATCH | HYBRID
  los_vendor:         string — Loan Origination System vendor (e.g., Encompass, BytePro)
  servicing_portfolio: boolean — includes loan servicing (additional compliance layer)
  go_live_date:       ISO8601 — target production activation
  annual_loan_volume: number — estimated annual loan count
```

## Outputs / Artifacts

```
PRIMARY:
  ONBOARDING_RECORD:     wiki/customers/{customer_id}/mortgage-onboarding.md
  LICENSE_VERIFICATION:  NMLS + state license verification package
  COMPLIANCE_PACKAGE:    RESPA | TILA | HMDA + fair lending controls evidence
  TECHNICAL_CERT:        LOS integration test pass certificate + MISMO validation
  GO_LIVE_CERTIFICATE:   signed compliance clearance for production loan processing

SECONDARY:
  FAIR_LENDING_SETUP:    documented HMDA data collection + fair lending monitoring config
  MISMO_MAPPING:         field-level mapping from customer LOS to MISMO 3.4 standard
  CUSTOMER_RUNBOOK:      lender-specific ops guide for support team
```

## Lifecycle States

```
INITIATED → LICENSE_VERIFICATION → REGULATORY_COMPLIANCE_REVIEW
  → [BLOCKED] REGULATORY_HOLD → REGULATORY_DECISION
  → [CLEAR] CONTRACT_REVIEW → DATA_PRIVACY_SETUP → PROVISIONING
  → LOS_INTEGRATION_SETUP → MISMO_VALIDATION → COMPLIANCE_TESTING
  → FAIR_LENDING_VALIDATION → COMPLIANCE_SIGN_OFF → GO_LIVE_GATE
  → LIVE → HYPERCARE → COMPLETED
  → REJECTED (license invalid / compliance block)
```

## Execution Graph

```
S-001  AUTH_CHECK              [GATE: G-AUTH T3+]              Root
S-002  LENDER_INTAKE           [AGENT: delivery-agent]         depends_on: S-001
         Collect: legal entity docs, NMLS filings, state license certificates
         Collect: corporate structure, key personnel (MLOs, compliance officers)
         Assign: mortgage onboarding specialist (T3 CS with mortgage domain expertise)
S-003  NMLS_VERIFICATION       [INTEGRATION: NMLS_API]         depends_on: S-002
         Verify: NMLS company ID active and in good standing
         Verify: all state licenses provided are active (no suspensions/revocations)
         Verify: required state endorsements (e.g., FHA/VA for government loans)
         Cross-check: regulatory actions or enforcement history
         SLA: automated <2hr; manual review if flagged 24hr
S-004  STATE_COMPLIANCE_CHECK  [AGENT: compliance-agent]       depends_on: S-003
         For each state_license: verify state-specific requirements
         Check: bond requirements, net worth requirements, exam requirements
         Identify: states requiring additional disclosure language
         Flag: states with enhanced requirements (NY, CA, MA)
S-005  REGULATORY_COMPLIANCE_REVIEW [HUMAN: compliance team T3] depends_on: S-003, S-004
         Review: RESPA compliance program documentation
         Review: TILA/Reg Z compliance (APR disclosure, right of rescission)
         Review: HMDA eligibility and data collection obligations
         Review: ECOA/Reg B fair lending policies
         For servicers: CFPB servicing rules (Reg X), loss mitigation procedures
         SLA: 3 business days
S-006  REGULATORY_DECISION     [HUMAN: T4 DPO + mortgage compliance officer] depends_on: S-005
         CLEAR: compliance program adequate; proceed
         CONDITIONAL: gaps identified; corrective actions required before go-live
         BLOCKED: material compliance failures; cannot proceed until remediated
S-007  CONTRACT_REVIEW         [AGENT: pm-agent]               depends_on: S-006 CLEAR
         Extract: data processing terms, SLAs, liability caps
         Verify: DPA signed (CCPA + state privacy laws as applicable)
         Verify: GLBA safeguards addendum signed
         Verify: Reg B data retention provisions addressed
         Verify: HMDA data handling provisions
S-008  DATA_PRIVACY_SETUP      [AGENT: eng-agent]              depends_on: S-007
         Configure: PII data handling per GLBA requirements
         Set up: data retention schedules per state requirements (varies: 3-7 years)
         Configure: right-to-access and deletion controls per CCPA
         Set up: audit logging for all NPI (Non-Public Personal Information) access
S-009  ENVIRONMENT_PROVISIONING [SYSTEM]                       depends_on: S-007
         Create: dedicated lender environment
         Configure: state-specific rate tables and fee limits
         Configure: loan type eligibility rules per lender license
         Set: compliance rule engine with applicable regulations
         Generate: API credentials; LOS integration endpoints
S-010  LOS_INTEGRATION_SETUP   [HUMAN: solutions engineer T3]  depends_on: S-009
         Map: customer LOS fields to platform data model
         Configure: data sync frequency and conflict resolution
         For API integration: provide MISMO 3.4 schema documentation
         Technical kickoff with lender's IT team
         SLA: first session within 5 business days of provisioning
S-011  MISMO_VALIDATION        [AGENT: eng-agent]              depends_on: S-010
         Validate: loan file data maps correctly to MISMO 3.4 standard
         Validate: all required HMDA data fields present and correctly typed
         Validate: ULAD (Uniform Loan Application Dataset) compliance
         Run: MISMO schema validation on sample loan data
         Acceptance: zero critical MISMO validation errors
S-012  COMPLIANCE_TESTING      [HUMAN: solutions engineer + compliance] depends_on: S-011
         Test suite:
           - APR calculation accuracy vs. Reg Z tolerance
           - RESPA fee tolerance checks
           - Right of rescission triggers (Reg Z § 1026.23)
           - HMDA data collection triggers and LAR fields
           - ECOA adverse action notice generation
         For servicers: escrow analysis, loss mitigation workflow tests
         Acceptance: all regulatory calculations within tolerance; zero HMDA errors
S-013  FAIR_LENDING_VALIDATION [HUMAN: compliance officer T3]  depends_on: S-012
         Set up: HMDA LAR reporting configuration
         Configure: disparate impact monitoring thresholds
         Set up: CRA (Community Reinvestment Act) tracking if bank
         Verify: AI model used in underwriting reviewed for fair lending (→ WF-006)
         DPO sign-off: fair lending monitoring is active
S-014  COMPLIANCE_SIGN_OFF     [HUMAN: T4 DPO + T4 mortgage compliance] depends_on: S-013
         Review: complete compliance package
         Sign: compliance clearance certificate for production loan processing
         Document: any conditions or ongoing monitoring requirements
S-015  GO_LIVE_GATE            [GATE: G-LEGAL + G-SECURITY]    depends_on: S-014
         G-LEGAL: compliance clearance signed; DPA executed
         G-SECURITY: data security config verified; GLBA safeguards confirmed
         Lender runbook complete; support team briefed
         On-call: lender added to monitoring; HMDA reporting schedule set
S-016  PRODUCTION_ACTIVATION   [SYSTEM]                        depends_on: S-015
         Enable: production credentials
         Activate: state-specific compliance rule sets
         Enable: HMDA data collection
         Set: SLA monitoring thresholds per contract
S-017  GO_LIVE_NOTIFICATION    [INTEGRATION]                   depends_on: S-016
         Notify: lender + internal teams
         Confirm: first HMDA LAR reporting date
         Confirm: scheduled compliance reviews
S-018  HYPERCARE_PERIOD        [HUMAN: dedicated CSM T3]       depends_on: S-017
         Duration: 45 days post-go-live (extended for mortgage due to complexity)
         Weekly: CSM + solutions engineer check-in
         First 30-day: daily loan processing metrics review
         First HMDA submission: assisted by compliance team
         Escalation: any regulatory issue escalates immediately (ESC1)
S-019  HYPERCARE_CLOSE         [AGENT: delivery-agent]         depends_on: S-018
         Assess: loan processing stability, compliance metric health
         Confirm: HMDA data collection accurate
         Transition: to standard CSM coverage
S-020  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-019
S-021  MEMORY_UPDATE           [SYSTEM]                        depends_on: S-020
S-022  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-021
```

## Approval Gates

```
G-AUTH:    T3 account executive; signed contract; NMLS ID provided
G-LEGAL:   T4 DPO sign-off; GLBA safeguards addendum; DPA executed; compliance clearance
G-SECURITY: data security config verified; NPI audit logging confirmed
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
NMLS license suspended/revoked           FREEZE; Legal + T4 DPO     Immediate
Regulatory enforcement action found      HOLD; Legal review          2hr
HMDA configuration error found post-live BLOCK new originations; T4  Immediate
APR calculation outside Reg Z tolerance  BLOCK; Compliance + Legal   Immediate
State license expires during onboarding  HOLD that state; notify lender 2hr
Fair lending violation pattern detected  T4 DPO + Legal immediately  Immediate
Go-live date < 7d; compliance not clear  T4 emergency compliance review 4hr
```

## Governance Checkpoints

```
C-001: human compliance officer review of all mortgage compliance packages
C-004: complete onboarding audit trail retained 7 years per Reg B/RESPA
NMLS: active license required before any production loan data processing
HMDA: HMDA configuration must be validated before first loan application taken
FAIR_LENDING: disparate impact monitoring active on day 1 of go-live
AI_UNDERWRITING: any AI used in credit decisioning requires WF-006 (EU AI Act analog for US ECOA)
GLBA: GLBA safeguards addendum mandatory before NPI data processing
HYPERCARE: 45-day hypercare required; no exceptions for mortgage
```

## Observability

```
HEALTH METRICS:
  avg_onboarding_days:          target <= 45
  nmls_verification_rate:       target = 100% before provisioning
  compliance_clearance_rate:    target >= 0.80 after regulatory review
  mismo_validation_pass_rate:   target = 100% before go-live
  apr_calculation_accuracy:     target = 100% within Reg Z tolerance
  hmda_field_completeness:      target = 100% on first submission
  hypercare_escalation_rate:    target < 0.15

REGULATORY METRICS (post-go-live monitoring):
  hmda_error_rate:              target < 0.001 (< 0.1% LAR error rate)
  fair_lending_disparity_flag:  monitored monthly; > 10% disparity ratio triggers review
```

## Telemetry Events

```
enterprise.workflows.WF-019.initiated    {lender_type, state_count, loan_types, los_vendor}
enterprise.workflows.WF-019.nmls_verified {result, states_verified, issues_found}
enterprise.workflows.WF-019.compliance_cleared {approver, conditions_count}
enterprise.workflows.WF-019.mismo_validated {error_count, hmda_fields_complete}
enterprise.workflows.WF-019.go_live      {days_from_initiation, state_count, loan_types}
enterprise.workflows.WF-019.completed    {customer_id, onboarding_days}
```

## Rollback System

```
ROLLBACK: environment provisioned but not activated can be safely deprovisioned
POST_GOLIVE_BLOCK: if compliance violation detected — block new originations;
                   notify lender; legal hold on existing loan data; T4 + DPO
CONDITIONAL_HOLD: if state license lapses — suspend that state's processing only
```

## Enterprise System Integrations

```
SALESFORCE:     S-002 → create customer record; S-022 → update to LIVE
NMLS_API:       S-003 → license verification; quarterly re-verification
JIRA:           S-010 → LOS integration tickets; S-013 → fair lending setup tickets
SLACK:          S-017 → #customers go-live; S-018 → dedicated hypercare channel
EMAIL:          S-017 → lender go-live confirmation; HMDA schedule confirmation
COMPLIANCE_SYSTEM: S-020 → file onboarding compliance package (7-year retention)
HMDA_SYSTEM:    S-013 → register lender for LAR reporting
```

## Wiki Updates

```
wiki/customers/{customer_id}/mortgage-onboarding.md ← full record
wiki/customers/{customer_id}/runbook.md             ← lender ops guide
wiki/customers/customer-registry.md                ← append entry
wiki/compliance/mortgage-compliance-registry.md    ← append compliance cert
```

## Memory Updates

```
memory/compliance/open-findings.yaml              ← any compliance conditions
memory/data-fabric/governance-policy-state.yaml   ← register NPI data processor
```
