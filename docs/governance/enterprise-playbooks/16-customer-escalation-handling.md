# PB-016: Customer Escalation Handling

**Version:** 1.0.0 | **Owner:** Customer Success Org | **Cadence:** On-trigger | **Tier:** T3 | **Class:** CRITICAL

## Purpose
Define the complete protocol for receiving, triaging, escalating, resolving, and closing customer-reported issues that exceed normal support handling — ensuring high-value customers receive responses proportional to their risk and urgency, with clear cross-functional coordination, executive visibility, and no customer-damaging commitments made without legal clearance.

## Customer Escalation vs. Production Incident

```
PRODUCTION INCIDENT (WF-012 / PB-010):
  Trigger: system failure detected internally or via monitoring
  Primary owner: Engineering + On-call
  Goal: restore service

CUSTOMER ESCALATION (this playbook + WF-017):
  Trigger: customer reports issue (may or may not correlate with prod incident)
  Primary owner: Customer Success + PM
  Goal: restore customer confidence + resolve root cause

THESE CAN OVERLAP: A customer escalation may trigger a production incident review.
  If overlap detected → both protocols run in parallel; CS and Eng sync every 30 min.
```

---

## Customer Tier Classification

```
TIER    CRITERIA                                              ESCALATION AUTHORITY
──────────────────────────────────────────────────────────────────────────────────────────────
T1      ARR > $250K OR strategic (logo, reference, partner)   VP CS escalation; CEO notified
T2      ARR $50K–$250K OR high growth potential              CS Director escalation
T3      ARR $10K–$50K OR standard commercial                 CS Lead escalation
T4      ARR < $10K OR trial / SMB                            CS Rep handles; escalate if needed
```

---

## Escalation Severity Levels

### ESC1 — Critical
```
DEFINITION:
  Customer is actively threatening churn OR
  ARR at risk > $500K OR
  Customer is unable to use the product entirely (production blocked) OR
  Legal threat or regulatory complaint filed

RESPONSE SLA:
  ACK to customer: < 30 minutes (business hours); < 1 hour (after hours)
  Internal sync: < 1 hour
  Status update to customer: every 2 hours until resolved
  T5 CEO notification: yes, within 30 minutes of ESC1 classification

TEAM ENGAGED:
  CS Director (owner), VP CS, assigned Eng Lead, PM Lead, Legal (on ESC1 with legal threat)
```

### ESC2 — High
```
DEFINITION:
  Customer reporting significant business impact OR
  ARR at risk $100K–$500K OR
  Core workflow blocked (workaround exists) OR
  Churn risk signal (renewal at risk, negative sentiment)

RESPONSE SLA:
  ACK to customer: < 1 hour (business hours); < 2 hours (after hours)
  Internal sync: < 2 hours
  Status update to customer: every 4 hours until resolved
  VP CS notification: yes
  CEO notification: only if VP CS escalates further
```

### ESC3 — Elevated
```
DEFINITION:
  Customer reporting persistent issue with workaround OR
  ARR at risk $25K–$100K OR
  Customer frustration escalating (multiple contacts, tone shift) OR
  Feature gap impacting contract renewal

RESPONSE SLA:
  ACK to customer: < 4 hours (business hours)
  Internal sync: same business day
  Status update to customer: daily
  CS Lead notification: yes; VP CS: optional
```

### ESC4 — Standard
```
DEFINITION:
  Customer inquiry escalated from support that is complex but not urgent OR
  ARR at risk < $25K OR
  Non-blocking usage question or feature request tied to existing ticket

RESPONSE SLA:
  ACK to customer: < 24 hours (business hours)
  Internal sync: next business day
  Status update: when resolution available
  CS Lead: informed; no escalation above T3
```

---

## Escalation Workflow

### Step 1: Intake and Triage (0–30 min)
```
TRIGGER: Customer contact → support ticket → CS Rep identifies escalation signal
ACTIONS:
  CS Rep: does this exceed normal support? → YES → initiate escalation
  Classify severity (ESC1–ESC4) based on ARR + impact + churn risk
  Create escalation record: wiki/customer-escalations/{esc_id}.md
  Notify CS Lead (ESC3/4); CS Director (ESC2); VP CS (ESC1)
  ACK customer: templated acknowledgment with named owner and timeline
```

### Step 2: Internal Kickoff (0–2 hr depending on ESC level)
```
PARTICIPANTS: CS owner + assigned Eng Lead + PM Lead (+ Legal if ESC1 legal threat)
KICKOFF AGENDA (30 min):
  - What is the customer saying vs. what is actually happening?
  - Is there a production incident? → If yes: loop in WF-012
  - What has been tried so far?
  - Who owns each track: customer comms / technical investigation / PM context?
  - What are the commitments NOT to make?
  - When is the next customer touchpoint?
```

### Step 3: Investigation and Communication Loop
```
INVESTIGATION (Eng Lead):
  - Reproduce the issue (staging / logs / customer data with consent)
  - Root cause investigation: per runbook + logs + monitoring
  - Estimated resolution time: commit to CS within 2hr (ESC1) or 4hr (ESC2)
  - Update CS Lead: every 30 min (ESC1); every 2hr (ESC2); daily (ESC3/4)

CUSTOMER COMMUNICATION (CS owner):
  - All communication via CS owner (no direct eng-to-customer without CS present)
  - Status updates per SLA above
  - NEVER commit to: release dates, SLA credits, refunds, architecture changes
  - ALWAYS say: "I'm investigating and will update you by [time]"
  - Escalate to CS Director before any promise involving value/credit/timeline
```

### Step 4: Resolution
```
RESOLUTION CONFIRMED WHEN:
  Customer confirms: issue no longer impacting their operations
  Root cause identified: what caused it
  Fix deployed or workaround in place: verified in customer environment
  No recurrence in 24 hours

RESOLUTION COMMUNICATION:
  Final message to customer: what happened, what was fixed, what prevents recurrence
  Proactive offer: post-mortem meeting if ESC1/ESC2
  SLA credit review: if applicable (per contract; CS Dir approves; no self-approval)
```

### Step 5: Debrief and Prevention
```
TIMING: Within 3 business days of resolution (ESC1/ESC2); within 1 week (ESC3)
PARTICIPANTS: CS Director + Eng Lead + PM Lead
AGENDA:
  - What was the root cause? (technical + process)
  - Was the escalation classified correctly and quickly?
  - Were SLAs met? If not: why?
  - What was the customer experience? (1–10 rating if obtainable)
  - What systemic change prevents recurrence?

OUTPUT: Escalation retrospective → wiki/customer-escalations/retros/{esc_id}.md
        Engineering improvement ticket (if technical root cause)
        Process improvement ticket (if CS process gap)
        PM ticket (if feature/product gap)
```

---

## Escalation Record Standard

**Filed at:** `wiki/customer-escalations/{esc_id}.md`

```
ESCALATION RECORD:
  esc_id:               ESC-{YYYY-MM-DD}-{NNN}
  severity:             ESC1 | ESC2 | ESC3 | ESC4
  customer:             customer name + tier + ARR
  esc_owner:            CS owner name + role
  opened:               ISO8601
  ack_sent:             ISO8601 (was SLA met?)
  issue_summary:        what the customer reported (their language)
  actual_impact:        what is actually happening (technical)
  prod_incident:        yes (WF-012 id) | no
  resolution_eta:       ISO8601 (committed to customer)
  resolved:             ISO8601 | null
  resolution_summary:   what was done to fix it
  root_cause:           technical root cause
  closed:               ISO8601
  customer_satisfaction: 1–10 (if obtainable post-resolution)
  prevention_tickets:   [Jira ticket IDs]
```

---

## Communication Scripts

### ESC1 Initial ACK (< 30 min)
```
Subject: Urgent: We're On It — [Customer Name]

[Customer Contact Name],

I want to personally acknowledge that we've received your message and I've assembled the right team to address this immediately.

I'm [Name], your dedicated escalation owner for this issue. I'll be your single point of contact.

Current status: Our engineering team is actively investigating. I'll update you by [specific time — 2 hours from now].

What I need from you: [specific diagnostic info if needed, or "nothing — we're on it"].

[Name]
[Title] | [Phone]
```

### Status Update Template
```
Subject: Update — [Issue title] — [Customer Name] | [time]

[Customer Contact Name],

Status update as of [time]:

WHERE WE ARE: [1–2 sentences on investigation progress]
NEXT STEP: [specific action being taken]
NEXT UPDATE: [specific time of next update]

If this is urgent, call me directly: [phone].

[Name]
```

---

## Governance Checkpoints

```
C-001: Commitments to customers are human decisions; no AI may make customer-facing commitments
C-004: All escalations permanently recorded; never deleted even after resolution
LEGAL: No commitment involving compensation, credits, or SLA breach acknowledgment without CS Director + Legal
COMMS: All customer communication via CS owner; direct eng-to-customer requires CS presence
ESCALATION_BIAS: When uncertain about severity, classify higher (ESC1 over ESC2); downgrade with justification
CEO_NOTIFY: All ESC1 escalations: VP CS responsible for CEO notification within 30 min
```

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
ESC1 ACK within SLA                      = 100%
ESC2 ACK within SLA                      >= 0.98
ESC3 ACK within SLA                      >= 0.95
ESC1/ESC2 retros completed               = 100%
Customer satisfaction post-ESC1/ESC2     >= 7.0/10
Same-issue recurrence within 60 days     < 0.10
ESC1 churn prevented (retained post-esc) >= 0.85
```

## Workflow Integrations

```
WF-017  Customer Escalation  → this playbook operationalizes WF-017
WF-012  Incident Management  → production incidents affecting customers link both workflows
PB-012  Escalation Mgmt     → internal escalations within this process follow PB-012
PB-001  Executive Cadence    → ESC1 escalations interrupt executive schedule
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
CS makes promises before eng assesses      Impossible commitments; more escalation
Eng communicates directly without CS       Scope creep, undocumented commitments, confusion
ESC1 not notifying CEO                      CEO blindsided on customer call; trust lost
"It's probably fixed" without verification  Issue recurs; customer trust destroyed
Escalation closed before customer confirms  Customer still impacted; CS has "resolved"
No debrief for "minor" ESC2s               Same issue escalates again next quarter
```
