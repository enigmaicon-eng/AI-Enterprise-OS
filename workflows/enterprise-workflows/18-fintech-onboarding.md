# WF-018: Fintech Customer Onboarding

**Version:** 1.0.0 | **Owner:** Customer Success Org | **Tier:** T3 | **Class:** REGULATED | **SLA:** 30 days

## Purpose
Onboard fintech customers to the platform with full regulatory compliance — KYB, AML screening, sanctions checks, contract execution, technical integration, and go-live certification — producing a complete compliance evidence package and a live, certified customer environment.

## Inputs

```
REQUIRED:
  customer_name:      string — legal entity name
  customer_type:      NEOBANK | PAYMENTS | LENDING | CRYPTO | INSURANCE | WEALTHTECH
  jurisdiction:       [country_code] — operating jurisdictions
  contract_id:        string — signed MSA reference
  sales_owner:        string — T3 account executive

OPTIONAL:
  integration_type:   API | SDK | EMBEDDED | WHITE_LABEL
  data_residency:     string — required data location (e.g., EU, US)
  regulatory_license: string — customer's operating license reference
  go_live_date:       ISO8601 — target production activation
```

## Outputs / Artifacts

```
PRIMARY:
  ONBOARDING_RECORD:    wiki/customers/{customer_id}/onboarding.md
  KYB_PACKAGE:          identity verification + AML + sanctions evidence
  COMPLIANCE_CERTIFICATE: signed compliance clearance for go-live
  TECHNICAL_CERT:       integration test pass certificate + monitoring setup

SECONDARY:
  CONTRACT_SUMMARY:     key commercial terms extracted for ops team
  RUNBOOK:              customer-specific ops runbook for support team
```

## Lifecycle States

```
INITIATED → KYB_INITIATED → SANCTIONS_SCREENING → AML_REVIEW
  → [BLOCKED] COMPLIANCE_HOLD → COMPLIANCE_DECISION
  → [CLEAR] CONTRACT_REVIEW → PROVISIONING → TECHNICAL_ONBOARDING
  → INTEGRATION_TESTING → COMPLIANCE_SIGN_OFF → GO_LIVE_GATE
  → LIVE → HYPERCARE → COMPLETED
  → REJECTED (KYB fails / compliance block)
```

## Execution Graph

```
S-001  AUTH_CHECK              [GATE: G-AUTH T3+]              Root
S-002  CUSTOMER_INTAKE         [AGENT: delivery-agent]         depends_on: S-001
         Collect: legal entity docs, ownership structure, UBOs
         Collect: regulatory license, jurisdiction registrations
         Assign: onboarding manager (T3 CS)
S-003  KYB_SCREENING           [INTEGRATION: KYB_PROVIDER]     depends_on: S-002
         Business verification: legal entity, registration numbers
         UBO (Ultimate Beneficial Owner) verification: identity docs
         Adverse media check: negative news screening
         Corporate structure: ownership chain verification
         SLA: 3 business days
S-004  SANCTIONS_SCREENING     [INTEGRATION: SANCTIONS_API]    depends_on: S-002
         Screen: entity + all UBOs against OFAC, EU sanctions, UN lists
         Screen: jurisdictions for restricted territories
         Flag: any partial matches for human review
         SLA: automated <1hr; human review if flagged 24hr
S-005  AML_RISK_ASSESSMENT     [HUMAN: compliance team T3]     depends_on: S-003, S-004
         Assess: customer risk tier (HIGH | MEDIUM | LOW)
         HIGH: enhanced due diligence required; T4 DPO approval
         Factors: jurisdiction risk, business model risk, customer type
         SLA: 2 business days
S-006  COMPLIANCE_DECISION     [HUMAN: T4 DPO or compliance officer] depends_on: S-005
         HIGH risk: DPO must approve; document enhanced DD measures
         BLOCKED: issue identified; legal counsel + T4 DPO decision
         CLEAR: proceed with onboarding
S-007  CONTRACT_REVIEW         [AGENT: pm-agent]               depends_on: S-006 CLEAR
         Extract: key terms (SLAs, data processing terms, liability caps)
         Verify: DPA (Data Processing Agreement) signed
         Verify: security addendum signed
         Verify: jurisdiction-appropriate terms (EU: SCCs if required)
S-008  ENVIRONMENT_PROVISIONING [SYSTEM]                       depends_on: S-007
         Create: dedicated customer environment (prod + staging)
         Configure: data residency per contract requirements
         Set: rate limits, quotas per contract tier
         Generate: API credentials; webhook endpoints
S-009  TECHNICAL_ONBOARDING    [HUMAN: solutions engineer T3]  depends_on: S-008
         Deliver: integration guide, API documentation
         Provide: sandbox credentials; test scenarios
         Schedule: technical kickoff call
         SLA: first session within 3 business days of provisioning
S-010  SECURITY_CONFIGURATION  [AGENT: eng-agent]              depends_on: S-008
         Configure: IP allowlisting per customer request
         Set up: audit logging for customer activity
         Enable: customer-specific encryption keys (if required by contract)
S-011  INTEGRATION_TESTING     [HUMAN: solutions engineer + customer] depends_on: S-009, S-010
         Test suite: authentication, core API flows, webhook delivery
         Test: error handling, rate limit behavior
         Test: data residency compliance (data stays in correct region)
         Acceptance: solutions engineer certifies integration
         SLA: 10 business days
S-012  COMPLIANCE_SIGN_OFF     [HUMAN: T4 DPO + compliance]    depends_on: S-011
         Review: KYB package completeness
         Review: DPA signed; data flow documentation complete
         Review: monitoring in place for AML-required transaction monitoring
         Sign: compliance clearance certificate
S-013  GO_LIVE_GATE            [GATE: G-LEGAL + G-SECURITY]    depends_on: S-012
         G-LEGAL: compliance clearance signed
         G-SECURITY: security config verified; audit logging active
         Ops runbook: customer-specific runbook complete
         On-call: customer added to monitoring alerts
S-014  PRODUCTION_ACTIVATION   [SYSTEM]                        depends_on: S-013
         Enable: production credentials
         Activate: production rate limits and quotas
         Set: SLA monitoring thresholds
S-015  GO_LIVE_NOTIFICATION    [INTEGRATION]                   depends_on: S-014
         Notify: customer + internal teams of production activation
         Slack: #customers channel; email: account team
S-016  HYPERCARE_PERIOD        [HUMAN: dedicated CSM T3]       depends_on: S-015
         Duration: 30 days post-go-live
         Weekly: CSM check-in calls
         Monitoring: elevated alerting thresholds during hypercare
         Escalation: any issue escalates immediately (treat as ESC2)
S-017  HYPERCARE_CLOSE         [AGENT: delivery-agent]         depends_on: S-016
         Assess: integration stability, customer satisfaction
         Transition: to standard CSM coverage
         Document: any lingering issues in account notes
S-018  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-017
S-019  MEMORY_UPDATE           [SYSTEM]                        depends_on: S-018
S-020  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-019
```

## Approval Gates

```
G-AUTH:    T3 account executive; signed contract
G-LEGAL:   T4 DPO sign-off on KYB + DPA + compliance clearance
G-SECURITY: security config verified; audit logging confirmed active
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
Sanctions match detected                 FREEZE; T4 DPO + Legal      Immediate
KYB HIGH risk without DPO approval       HOLD; T4 escalation          2hr
AML assessment exceeds 2d SLA            T4 compliance escalation     4hr
Contract missing DPA (GDPR requirement) BLOCK; Legal alert           Immediate
Integration SLA breach (10d)             T3 escalation; CSM involved 24hr
Go-live date < 5d; compliance not clear  T4 emergency review          4hr
Data residency violation detected        BLOCK production; T4+DPO    Immediate
```

## Governance Checkpoints

```
C-001: human DPO review of all KYB packages; no automated compliance clearance
C-004: complete onboarding audit trail retained 7 years
SANCTIONS: any positive sanctions match = immediate freeze; Legal + DPO required
AML: HIGH risk customers require enhanced DD + T4 approval before activation
DATA_RESIDENCY: technical enforcement verified before go-live; not self-reported
DPA: GDPR-compliant DPA mandatory before data processing begins
HYPERCARE: all fintech customers require 30-day hypercare; no exceptions
```

## Observability

```
HEALTH METRICS:
  avg_onboarding_days:          target <= 30
  kyb_pass_rate:                diagnostic (low = customer quality; high = screening too loose)
  compliance_clearance_rate:    target >= 0.85 (after KYB pass)
  integration_success_rate:     target >= 0.95
  time_to_first_api_call_days:  target <= 15
  hypercare_escalation_rate:    target < 0.20

REGULATORY:
  dpa_signed_at_go_live:        target = 100%
  audit_log_coverage:           target = 100%
  data_residency_compliance:    target = 100%
```

## Telemetry Events

```
enterprise.workflows.WF-018.initiated    {customer_type, jurisdiction, integration_type}
enterprise.workflows.WF-018.kyb_complete {result, risk_tier, enhanced_dd: bool}
enterprise.workflows.WF-018.compliance_cleared {approver_tier, dpa_signed}
enterprise.workflows.WF-018.go_live      {days_from_initiation, integration_type}
enterprise.workflows.WF-018.completed    {customer_id, onboarding_days, hypercare_issues}
```

## Rollback System

```
ROLLBACK: onboarding cannot be "rolled back" once live; offboarding is a separate process
KYB_BLOCK: environment provisioned but not activated; safe to deprovision
COMPLIANCE_HOLD: environment suspended; customer notified; legal holds data 90 days
```

## Enterprise System Integrations

```
SALESFORCE:     S-002 → create customer record; S-020 → update to LIVE status
KYB_PROVIDER:   S-003 → submit KYB request; receive results
SANCTIONS_API:  S-004 → real-time screening; batch re-screening quarterly
JIRA:           S-009 → create technical integration tickets; link to onboarding
SLACK:          S-015 → #customers go-live announcement; S-016 → hypercare channel
EMAIL:          S-015 → customer go-live confirmation with credentials
COMPLIANCE_SYSTEM: S-018 → file KYB package; record compliance clearance
```

## Wiki Updates

```
wiki/customers/{customer_id}/onboarding.md   ← full onboarding record
wiki/customers/{customer_id}/runbook.md      ← ops runbook for support team
wiki/customers/customer-registry.md         ← append customer entry
wiki/compliance/kyb-registry.md             ← append KYB evidence reference
```

## Memory Updates

```
memory/compliance/open-findings.yaml        ← close if any compliance items raised
memory/data-fabric/governance-policy-state.yaml ← register new data processor
```
