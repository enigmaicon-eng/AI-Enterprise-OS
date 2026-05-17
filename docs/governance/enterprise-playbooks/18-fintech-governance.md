# PB-018: Fintech Governance

**Version:** 1.0.0 | **Owner:** Compliance + Legal Org (DPO) | **Cadence:** Monthly + Quarterly | **Tier:** T4 | **Class:** REGULATED

## Purpose
Govern all fintech-specific regulatory obligations — AML, KYB/KYC, sanctions screening, data protection, open banking, payment processing, financial crime prevention, and regulatory reporting — through continuous monitoring, periodic review cycles, evidence retention, and binding compliance decisions. All customer-facing financial products must meet obligations before go-live.

## Regulatory Framework Map

```
REGULATION          SCOPE                                   OWNER           DEADLINE / CADENCE
──────────────────────────────────────────────────────────────────────────────────────────────
AML (AMLD5/6)       Anti-money laundering obligations        DPO + MLRO      Continuous
GDPR / UK GDPR      Personal data processing                 DPO             Continuous
PSD2 / Open Banking Payment services + open banking          DPO + Legal     Per product
DORA (EU)           Digital operational resilience           CTO + DPO       2025-01-17 live
SOC2 Type II        Security controls attestation            CISO            Annual audit
PCI-DSS             Payment card data security               CISO + Eng      Annual assessment
FATF                Financial crime risk framework           MLRO            Annual review
eIDAS 2.0           Digital identity standards               Legal + Eng     Per product
Sanctions           OFAC, EU, HMT, UN screening             Compliance team  Real-time
```

---

## Monthly Fintech Compliance Review

**Cadence:** Second Wednesday of each month, 90 minutes
**Chair:** DPO
**Participants:** DPO, MLRO (Money Laundering Reporting Officer), CISO, Legal Counsel, VP Engineering, Compliance Analyst

### Pre-Meeting Package (T-3 business days)
```
DELIVERABLE                                 OWNER
──────────────────────────────────────────────────────────────────────────────────────────────
AML transaction monitoring report           Compliance team (automated)
KYB/KYC completion rate by customer cohort  Compliance team
Sanctions screening result summary          Compliance team (automated)
Open regulatory findings + remediation      Legal Counsel
PCI-DSS compliance status + findings        CISO
GDPR data subject request completion rate   DPO
Data breach log (any reportable events)     DPO
Regulatory change watch list               Legal Counsel
New product/feature pre-compliance review   Compliance Analyst
```

### Monthly Review Agenda
```
TIME    TOPIC                                               OWNER         DECISION?
──────────────────────────────────────────────────────────────────────────────────────────────
0:00    AML monitoring: SAR filings, transaction alerts     MLRO          File/close decisions
0:15    KYB/KYC status: outstanding + failed screenings    Compliance     Risk acceptance
0:30    Sanctions screening: any hits or near-misses?       Compliance     Immediate actions
0:40    Regulatory findings: open items + remediation       Legal          Deadlines confirmed
0:55    Data + privacy: DSARs, breaches, new data flows     DPO            Breach notification?
1:05    PCI-DSS: monthly controls check                     CISO           Findings + gaps
1:15    Upcoming regulatory changes: what's on the horizon? Legal          Prep actions
1:20    New product compliance pre-review                   DPO            Approve/block/condition
1:25    Decision summary + actions                         DPO            Logged
```

---

## AML Framework

### Transaction Monitoring
```
MONITORING SYSTEM: Automated rules engine + AI anomaly detection
ALERT THRESHOLDS (configurable; reviewed quarterly):
  Structuring detection: multiple transactions < reporting threshold in 24hr
  Velocity anomaly: transaction volume > 3× 30-day baseline
  Geographic risk: transactions involving high-risk jurisdictions (FATF list)
  Counterparty risk: transaction with sanctions-listed entity (auto-block)
  Unusual pattern: round amounts, rapid in/out, dormant account sudden activity

ALERT DISPOSITION:
  AUTO_BLOCK: Sanctions match → immediate freeze; MLRO notified within 1hr
  HIGH_ALERT: Analyst review within 4hr; MLRO review within 24hr
  MEDIUM_ALERT: Analyst review within 2 business days
  LOW_ALERT: Weekly batch review; false positive learning feedback

SAR FILING PROTOCOL:
  MLRO decides to file / not file within 30 days of SAR designation
  Filing: per jurisdiction (FinCEN / NCA / FIU-NET)
  Tipping-off prohibition: no disclosure to customer that SAR filed
  SAR records: retained 5 years minimum
```

### KYB/KYC Standards
```
CUSTOMER ONBOARDING (→ WF-018 for full onboarding workflow):

KYC (Individual):
  Tier 1 (< $2,500/month): name, email, phone — soft KYC
  Tier 2 ($2,500–$25,000/month): ID document + address verification
  Tier 3 (> $25,000/month): enhanced due diligence — ID + source of funds + PEP check

KYB (Business):
  Beneficial ownership: all owners >= 25% UBO must be verified (EU AMLD5)
  Business registration: active incorporation verified in country of domicile
  Director verification: KYC on each director at Tier 2 level minimum
  Source of funds: revenue model documented and plausible
  Industry risk: FATF high-risk industry → enhanced due diligence mandatory

RE-KYC TRIGGERS:
  Periodic refresh: Tier 3 annually; Tier 2 every 2 years
  Event-driven: change in ownership > 10%, adverse media hit, transaction anomaly
  Regulatory change: new risk classifications require re-screening

SANCTIONS SCREENING:
  Lists: OFAC SDN, EU Consolidated, HMT, UN Security Council, domestic
  Frequency: real-time on onboarding + daily batch refresh
  Near-match handling: fuzzy match > 85% → analyst review within 1hr; exact → auto-block
```

---

## GDPR / Data Protection Framework

### Data Processing Register (Article 30)
```
Maintained in: wiki/compliance/gdpr/data-processing-register.md
Required for: ALL personal data processing activities
Fields per activity:
  Processing purpose, legal basis, data categories, data subjects,
  recipients, retention period, international transfers, technical safeguards

LEGAL BASIS MAPPING (fintech-specific):
  Contract performance (Art.6.1.b): transaction processing, account management
  Legal obligation (Art.6.1.c): AML reporting, tax reporting, sanctions screening
  Legitimate interests (Art.6.1.f): fraud prevention, analytics (with LIA)
  Consent (Art.6.1.a): marketing, optional profiling
  Vital interests: NOT applicable for fintech processing
```

### Data Subject Rights
```
DSAR (Data Subject Access Request):
  Response SLA: 30 days (extendable to 90 days for complex requests)
  Volume target: < 5% of active users per month (above = systemic issue)
  Fulfillment rate: >= 0.98 (2% rejectable on legal grounds)
  DSAR log maintained: wiki/compliance/gdpr/dsar-log.md

ERASURE (Right to be Forgotten):
  Fintech exception: AML / fraud prevention data may be retained despite erasure request
    Legal basis required; DPO sign-off; customer notified of exception
  Standard PII: erasure within 30 days of confirmed request
  Backup purge: within next scheduled backup rotation (max 90 days)

DATA BREACH NOTIFICATION:
  Internal detection → DPO notified within 24 hours
  Supervisory authority notification: within 72 hours of awareness (GDPR Art.33)
    Only if risk to natural persons; DPO + Legal decision
  Customer notification: only if high risk to rights/freedoms (DPO decision)
  Threshold: > 500 data subjects OR sensitive financial data → notify regulator
  Records: all breaches logged even if below notification threshold
```

---

## PCI-DSS Framework

```
PCI-DSS SCOPE:
  All systems that store, process, or transmit cardholder data (CHD)
  Out-of-scope strategy: tokenization; minimize CHD scope to reduce audit surface

KEY CONTROLS (monthly check):
  □ No cardholder data in logs (automated scan)
  □ Encryption at rest: AES-256 for stored CHD
  □ Encryption in transit: TLS 1.2+ for all CHD transmission
  □ Access control: least privilege; no shared accounts on CHD systems
  □ Vulnerability scanning: monthly ASV scan (external) + quarterly pen test
  □ Log monitoring: SIEM alerts for unauthorized CHD access attempts
  □ Patch management: critical patches within 30 days of release

ANNUAL ASSESSMENT:
  Level 1 merchants: QSA (Qualified Security Assessor) on-site audit
  Level 2–4: SAQ (Self-Assessment Questionnaire) with CISO certification
  Report on Compliance (ROC): filed with payment brands annually
```

---

## DORA (Digital Operational Resilience Act)

```
EU REGULATION 2022/2554 — IN FORCE 2025-01-17

APPLICABILITY: Financial entities and ICT third-party service providers

KEY OBLIGATIONS:
  ICT Risk Management:
    □ ICT risk management framework documented and board-approved
    □ Business continuity plan covering ICT disruption scenarios
    □ ICT-related incident classification and reporting procedure

  ICT Incident Reporting:
    □ Major incident reporting: NCA within 4 hours of classification as major
    □ Intermediate report: 72 hours
    □ Final report: 1 month from first notification

  Digital Operational Resilience Testing:
    □ Basic testing: annual vulnerability assessments + network scans
    □ Advanced testing (TLPT): Threat Led Penetration Testing for significant entities
      Cadence: every 3 years; coordinated with national competent authority

  ICT Third-Party Risk:
    □ ICT third-party register: all material ICT vendors
    □ Contractual requirements: DORA Art.30 obligations in contracts
    □ Concentration risk: no > 3 material dependencies on single ICT provider
    □ Exit strategy: documented for each material ICT provider

DORA COMPLIANCE TRACKER: wiki/compliance/dora/compliance-tracker.md
```

---

## Quarterly Fintech Governance Deep Review

**Cadence:** Last Friday of each quarter, 3 hours
**Chair:** DPO + MLRO
**Participants:** DPO, MLRO, CISO, Legal, CEO, CFO, VP Engineering

```
TIME    TOPIC                                               OWNER
──────────────────────────────────────────────────────────────────────────────────────────────
0:00    Regulatory landscape: what changed this quarter?    Legal
0:20    AML annual report review (Q4) / quarterly metrics   MLRO
0:40    KYB/KYC quality audit: completion + accuracy rates  Compliance
1:00    GDPR compliance health: breaches, DSARs, gaps       DPO
1:20    PCI-DSS quarterly: remediation status + findings    CISO
1:40    DORA resilience testing results                      CISO + CTO
2:00    Sanctions screening audit: false positives + misses MLRO
2:20    New product pipeline: compliance pre-approval        DPO
2:40    Risk appetite discussion: any escalated risks?       DPO + CEO
3:00    Close + decisions
```

---

## Regulatory Change Management

```
REGULATORY WATCH LIST: wiki/compliance/regulatory-watch.md
Updated: monthly by Legal Counsel

CHANGE PROCESS:
  1. Legal identifies upcoming regulatory change
  2. Impact assessment: which systems/processes affected?
  3. Timeline: compliance deadline (hard) + internal target (deadline - 60 days)
  4. Owner assigned: DPO (data), MLRO (AML), CISO (security), CTO (tech)
  5. Tracked to completion in compliance tracker
  6. Evidence assembled for regulator if audit requested

REGULATORY HORIZON ALERT:
  > 12 months to deadline: MONITOR; log in watch list
  6–12 months: PLAN; initiate design + budget
  < 6 months: EXECUTE; dedicated sprint capacity
  < 90 days: CRITICAL; L4 escalation; daily status
  MISSED: immediate DPO + Legal + CEO notification; mitigation plan
```

---

## Governance Checkpoints

```
DPO_APPROVAL: No new data processing begins without DPO sign-off and Art.30 record update
MLRO_AUTHORITY: MLRO has authority to freeze any customer account pending AML investigation; no override
SAR_TIPPING: No communication to customer or internal parties that SAR has been filed
PCI_SCOPE: Any new system touching CHD must be approved by CISO before deployment
DORA_ICT: Material ICT vendor contracts must include Art.30 DORA obligations before execution
BREACH_NOTIFY: DPO must be notified within 24hr of data breach awareness; 72hr regulatory clock starts
C-004: All compliance decisions, filings, and evidence permanently retained
```

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
AML alert disposition within SLA         >= 0.98
KYB/KYC completion rate at onboarding    = 100% before access granted
Sanctions screening: false negative rate = 0 (all confirmed matches blocked)
GDPR DSAR response within 30 days        >= 0.98
Data breach notification within 72hr     = 100%
PCI-DSS monthly controls pass rate       >= 0.98
DORA resilience tests completed (annual) = 100%
Regulatory deadline misses               = 0
```

## Workflow Integrations

```
WF-018  Fintech Onboarding  → customer compliance clearance in this playbook governs WF-018
WF-014  Compliance Review   → quarterly fintech governance feeds WF-014 evidence package
WF-012  Incident Management → data breach triggers WF-012 + GDPR 72hr clock
PB-007  AI Governance       → AI systems in fintech require additional PB-007 review
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
SAR filing delayed "pending more info"      Tipping-off risk; regulatory breach
"Ship first, compliance later"              Regulator ordered product shutdown; fines
AML alerts auto-closed to reduce backlog    Financial crime facilitation liability
PCI scope creep unchecked                  Audit scope expands; higher assessment cost
GDPR DSARs deprioritized                   Regulatory fine; reputational damage
DORA third-party risk ignored              Single vendor outage = regulatory breach
Beneficial ownership not verified          AMLD5 violation; onboarded high-risk entity
```
