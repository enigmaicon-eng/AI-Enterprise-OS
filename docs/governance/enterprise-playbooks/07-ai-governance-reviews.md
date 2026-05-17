# PB-007: AI Governance Reviews

**Version:** 1.0.0 | **Owner:** AI Governance Org (CAIO) | **Cadence:** Monthly + Quarterly | **Tier:** T4 | **Class:** REGULATED

## Purpose
Maintain continuous governance over all AI systems in production — ensuring EU AI Act compliance, constitutional alignment, model health, bias monitoring, human oversight controls, and evidence retention. Produces binding governance decisions on AI system risk classifications, deployment authorizations, and remediation timelines. All HIGH_RISK AI systems must achieve full compliance by 2026-08-02.

## Regulatory Context

```
EU AI ACT KEY DEADLINES:
  2026-02-02:  Prohibited practices ban effective (Art.5)
  2026-08-02:  HIGH_RISK system compliance required (Art.6, Art.9–15)
  2027-08-02:  GPAI model obligations (Art.51–56)

HIGH_RISK AI SYSTEM CRITERIA (Art.6):
  - Used in credit scoring or loan decisioning
  - Used in hiring or employment decisions
  - Used in critical infrastructure management
  - Used in law enforcement or border control
  - Biometric identification systems
  - Systems used in education assessment
  - Safety component of product covered by EU harmonization legislation

PROHIBITED PRACTICES (Art.5 — hard deny in production):
  - Subliminal manipulation of behavior
  - Exploitation of vulnerabilities (age, disability)
  - Social scoring by public authorities
  - Real-time remote biometric identification in public spaces (with exceptions)
  - Emotion recognition in workplace/education
```

---

## AI System Registry

**Maintained in:** `wiki/ai-governance/ai-system-registry.md`
**Updated:** On every new AI system deployment (WF-006 triggers update)

```
REGISTRY FIELDS PER SYSTEM:
  system_id:            string
  name:                 string
  version:              semver
  deployed_date:        ISO8601
  risk_classification:  PROHIBITED | HIGH_RISK | LIMITED_RISK | MINIMAL_RISK
  domain:               CREDIT | UNDERWRITING | HR | OPERATIONS | CUSTOMER | PRODUCT | INTERNAL
  model_card:           link
  explainability_endpoint: URL | null
  human_oversight:      MANDATORY | AVAILABLE | NOT_REQUIRED
  compliance_status:    COMPLIANT | IN_PROGRESS | AT_RISK | NON_COMPLIANT
  dpo_signed:           boolean
  ciso_signed:          boolean
  next_review:          ISO8601
  evidence_retained_until: ISO8601 (HIGH_RISK: 10 years)
```

---

## Monthly AI Governance Review

**Cadence:** Third Wednesday of each month, 90 minutes
**Chair:** CAIO
**Participants:** CAIO, DPO, CISO, VP Engineering, relevant PM leads, Domain Architects

### Pre-Meeting Package (T-3 business days)
```
PREPARED BY        DELIVERABLE
───────────────────────────────────────────────────────────────────────────────────────────
compliance-agent   AI model health summary: performance drift, accuracy, bias metrics
analytics-agent    Constitutional alignment scores across all AI systems (target >= 0.99)
compliance-agent   EU AI Act compliance dashboard: HIGH_RISK systems status vs. 2026-08-02
CAIO               New AI systems deployed since last review
DPO                Personal data processing by AI systems: any new PII flows
CISO               Security posture for AI endpoints: model extraction, prompt injection status
```

### Monthly Review Agenda
```
TIME    TOPIC                                                  OWNER         DECISION?
──────────────────────────────────────────────────────────────────────────────────────────
0:00    AI system registry review: new + changed systems       CAIO          Classification decision
0:20    HIGH_RISK systems: compliance progress vs. 2026-08-02  CAIO + DPO    Remediation authority
0:40    Model health: accuracy drift, bias metrics             analytics-agent Alert triage
0:55    Constitutional alignment: C-001–C-012 compliance       compliance-agent  Flag + remediation
1:05    Security: adversarial testing results                  CISO          Risk acceptance/action
1:15    Incident review: any AI-related incidents since last   CAIO          Root cause review
1:20    Upcoming AI deployments: pre-review for next month     PM + Eng leads Preview/gate check
1:25    Decisions + actions                                    CAIO          Record all decisions
```

### Classification Decision Protocol
```
NEW SYSTEM CLASSIFICATION (at review):
  STEP 1: Domain assessment → does it fall in any HIGH_RISK category?
  STEP 2: Impact assessment → what decisions does it influence?
  STEP 3: Human oversight → can human override all AI decisions?
  STEP 4: DPO assessment → does it process personal data?
  STEP 5: CISO assessment → attack surface and data security

  CLASSIFICATION VOTE: CAIO + DPO + CISO must agree
  CONFLICT: CAIO has tie-breaking authority; dissent recorded
  PROHIBITED classification: immediate deployment block; legal review

RECLASSIFICATION:
  Any system can be reclassified upward at any time (no vote required for escalation)
  Downward reclassification: requires all three (CAIO + DPO + CISO) agreement
```

---

## Quarterly AI Governance Deep Review

**Cadence:** Last Thursday of each quarter, 3 hours
**Chair:** CAIO
**Participants:** All monthly participants + CEO + CPO + External AI Ethics Advisor (optional)

### Quarterly Deep Review Agenda
```
TIME    TOPIC                                                  OWNER
──────────────────────────────────────────────────────────────────────────────────────────
0:00    Quarterly AI performance report                        CAIO
0:20    EU AI Act compliance roadmap: status + timeline risk   DPO + CAIO
0:50    HIGH_RISK system audits: evidence packages reviewed    compliance-agent
1:20    Bias and fairness audit: quarterly bias report         analytics-agent
1:40    Constitutional alignment audit: quarterly trends       CAIO + governance-agent
2:00    Model cards review: all HIGH_RISK systems              Domain Architects
2:20    Strategic AI governance decisions                      CAIO + CEO
2:50    Next quarter AI governance plan                        CAIO
3:00    Close
```

### EU AI Act Compliance Tracker

**Managed in:** `wiki/compliance/eu-ai-act/compliance-tracker.md`

```
PER HIGH_RISK SYSTEM:

CONFORMITY ASSESSMENT CHECKLIST (Art.9–15):
  □ Art.9:  Risk management system documented and operational
  □ Art.10: Training data governance (lineage, quality, bias checks)
  □ Art.11: Technical documentation complete and current
  □ Art.12: Logging and record-keeping active (10-year retention)
  □ Art.13: Transparency and information to users implemented
  □ Art.14: Human oversight mechanisms operational and tested
  □ Art.15: Accuracy, robustness, and cybersecurity measures in place

COMPLIANCE TIMELINE (all HIGH_RISK systems):
  Target: COMPLIANT by 2026-06-01 (2 months buffer before 2026-08-02 deadline)
  At-risk (< 2026-07-01): T5 CTO + DPO emergency escalation
  Non-compliant at 2026-08-02: system suspension; legal notification
```

---

## Model Health Monitoring

**Automated, continuous — alert thresholds trigger governance review**

```
METRIC                          THRESHOLD FOR ALERT       GOVERNANCE ACTION
──────────────────────────────────────────────────────────────────────────────────────────
Prediction accuracy drift        > 5% degradation          CAIO + PM review within 48hr
Bias metric (demographic parity) Disparity > 10%           DPO + CAIO emergency review
False positive rate spike        > 2× baseline             Engineering incident + review
Model confidence calibration     ECE > 0.08                Retraining evaluation
Input distribution shift (PSI)   > 0.2 (moderate drift)   Monitor; evaluate retraining
                                 > 0.25 (significant)      Suspend + retrain before resume
Adversarial probe success rate   > 1%                      CISO + CAIO; security hardening
Constitutional alignment score   < 0.99 on any principle   Governance-agent alert; T4 review
```

---

## Human Oversight Protocol (HIGH_RISK systems)

```
REQUIREMENT (Art.14): All HIGH_RISK AI systems must have human oversight mechanisms

OVERSIGHT LEVELS:
  MANDATORY:   Human must review every AI decision before action taken
               Used for: credit decisions, adverse employment actions
  MONITORED:   Human reviews random sample + all flagged decisions
               Used for: risk scoring, content moderation
  AUDITABLE:   Human can review any decision post-hoc + AI can be overridden
               Used for: recommendation systems, operational AI

OVERRIDE GOVERNANCE:
  Human override always available: no AI system can disable human override
  Override logged: every override is recorded with reason
  Override pattern analysis: if override rate > 20% → model review required
  Override audit: monthly review of override patterns (CAIO + DPO)
```

---

## AI Incident Response

**Trigger:** Any AI system producing harmful, biased, or non-compliant outputs at scale

```
SEVERITY CLASSIFICATION:
  AI-SEV1:  Prohibited practice detected in production; immediate harm
            → Suspend system immediately; T5 CEO + Legal + DPO; 2hr response
  AI-SEV2:  HIGH_RISK system failure; incorrect decisions at scale
            → Review + suspend if needed; T4 CAIO + DPO; 4hr response
  AI-SEV3:  Bias metrics breach; significant accuracy degradation
            → Monitoring + retraining evaluation; CAIO 24hr; DPO informed
  AI-SEV4:  Single edge case; no pattern; logged
            → Review at monthly governance; no immediate action

NOTIFICATION OBLIGATIONS:
  EU AI Act Art.62: Serious incident notification to market surveillance authority
    Trigger: AI-SEV1 (injury, death, significant damage to property or rights)
    Deadline: 15 days from awareness
    Owner: DPO + Legal + CAIO
    Tracked in: wiki/compliance/eu-ai-act/incident-notifications.md
```

---

## Model Card Standard

**Required for:** All AI systems (LIMITED_RISK+); mandatory for HIGH_RISK

```
MODEL CARD SECTIONS:
  1. System Overview
     - Purpose; intended use cases; prohibited use cases
     - Risk classification + justification
  2. Training Data
     - Data sources; date range; preprocessing steps
     - Known biases in training data
  3. Performance Metrics
     - Accuracy, precision, recall per segment
     - Fairness metrics (demographic parity, equalized odds)
  4. Limitations and Risks
     - Known failure modes; out-of-distribution behavior
     - Attack surface; adversarial robustness
  5. Human Oversight
     - Oversight mechanism; override procedure
     - Who can override and how
  6. Governance
     - Risk classification approval (CAIO + DPO signatures)
     - Compliance status; next review date
     - Evidence retention schedule
```

---

## Evidence Retention

```
SYSTEM CLASS             RETENTION PERIOD
──────────────────────────────────────────────────────────────────────
PROHIBITED (blocked)     Permanent (record of refusal)
HIGH_RISK                10 years (EU AI Act Art.12)
LIMITED_RISK             3 years
MINIMAL_RISK             1 year

WHAT TO RETAIN:
  - Model version + weights hash
  - Training data lineage
  - Test results + bias audit reports
  - Conformity assessment documentation
  - All governance decisions (classification, approval, override logs)
  - Incident notifications (if any)
  - Human oversight logs (sampling methodology + results)
```

---

## Governance Checkpoints

```
CAIO + DPO + CISO must jointly classify all new AI systems before production deployment
HIGH_RISK: cannot deploy without full conformity assessment (Art.9–15 checklist complete)
PROHIBITED: absolute block; no exceptions; constitutional hard deny (C-001 binding)
HUMAN_OVERSIGHT: override mechanism tested before every HIGH_RISK deployment
EVIDENCE_RETENTION: 10-year retention active before HIGH_RISK go-live; no retroactive fix
MODEL_CARDS: complete before deployment; no "fill in later" exceptions
EU AI ACT 2026-08-02: all HIGH_RISK systems must be compliant; non-compliance = suspension
```

## Health Metrics

```
METRIC                                      TARGET
──────────────────────────────────────────────────────────────────────────────────────────
HIGH_RISK systems compliant (by 2026-08-02) = 100%
Model card coverage (registered models)     = 100%
Constitutional alignment score (all models) >= 0.99 per principle
Bias audit completion rate (quarterly)      = 100% of HIGH_RISK + LIMITED_RISK systems
Human oversight override rate               < 0.20 (high = model quality issue)
Accuracy drift events requiring review      target < 2/quarter per system
AI incident rate (AI-SEV1 or AI-SEV2)       target = 0
Evidence retention coverage                 = 100% (HIGH_RISK: verified quarterly)
```

## Workflow Integrations

```
WF-006  AI Feature Delivery  → every AI deployment requires CAIO+DPO sign-off from this playbook
WF-014  Compliance Review    → quarterly AI governance feeds into WF-014 evidence package
WF-012  Incident Management  → AI-SEV1/SEV2 trigger WF-012 + AI incident protocol
WF-005  Architecture Review  → AI system ADRs include risk classification from this review
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
"We'll classify it later" after deployment  Non-compliant production system; regulatory risk
Model card filled in post-deployment        Missing baseline evidence; unauditable
Human oversight only theoretical            Art.14 violation; potential Art.62 notification
Bias metrics not monitored continuously     Disparate impact accumulates; legal exposure
Evidence retention not configured at launch  10-year obligation cannot be retroactively met
CAIO review skipped "it's just a small model" All models require classification; no exceptions
```
