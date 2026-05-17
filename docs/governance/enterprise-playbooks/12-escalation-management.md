# PB-012: Escalation Management

**Version:** 1.0.0 | **Owner:** Delivery + Engineering Org | **Cadence:** On-trigger | **Tier:** T3 | **Class:** CRITICAL

## Purpose
Define the complete escalation protocol for all operational issues — ensuring the right people are engaged at the right time, with the right information, without over-escalating routine issues or under-escalating critical ones. Prevents both alarm fatigue and silent failures.

## Escalation Philosophy

```
ESCALATION IS NOT FAILURE.
  Escalating appropriately is a sign of good judgment.
  Failing to escalate when needed is a performance issue.
  Over-escalating routine matters is also a performance issue.

THE RULE OF THUMB:
  If you're uncertain whether to escalate → escalate.
  If you're certain you don't need to → document why.
  If you've tried to resolve it yourself for > SLA/2 → escalate.
```

---

## Escalation Taxonomy

```
CLASS          EXAMPLES                              TIER         SLA
──────────────────────────────────────────────────────────────────────────────────────────────
OPERATIONAL    Deployment blocked; build broken       T2 Eng Lead  30 min (business hours)
               Service degraded; alert firing         T3 Eng Dir   15 min (any time)
DELIVERY       Sprint at risk; dependency miss        T3 PM + RM   Same business day
               Release blocked; milestone slip > 1wk  T4 VP Eng    Next business day
TECHNICAL      Architectural breach; security gap      T3 Arch      4hr (business hours)
               Critical vulnerability in production   T4 CISO      1hr (any time)
ORGANIZATIONAL People conflict; policy dispute         T3 Manager   Next business day
               Team health CRITICAL; attrition risk   T4 VP People Same business day
REGULATORY     Compliance gap identified               T4 DPO       4hr (business hours)
               Regulatory deadline at risk            T5 CTO       2hr (any time)
CUSTOMER       Tier-2 customer impacted               T3 CS Lead   2hr (business hours)
               Tier-1 customer at churn risk          T4 VP CS     1hr (any time)
               ESC1 (>$500K ARR risk)                 T5 CEO       30 min (any time)
```

---

## Escalation Severity Levels

### Level 1 (L1) — Self-Managed
```
DEFINITION: Issue within team's capability to resolve without senior involvement
CRITERIA:
  - Resolution path known
  - No risk of SLA breach
  - No customer impact
  - No cross-team dependencies blocked

ACTION:
  - Team resolves
  - Logs in Jira or incident tracker
  - No notification required above T2

TIMEOUT: If not resolved in 2 business days → auto-escalate to L2
```

### Level 2 (L2) — Team Lead Escalation
```
DEFINITION: Issue requires management attention or cross-team coordination
CRITERIA:
  - Resolution path unclear OR requires resource beyond team authority
  - SLA at risk (< 50% time remaining)
  - Single external dependency blocked
  - Minor customer impact possible

ACTION:
  - Escalate to Engineering Lead / PM Lead (T2)
  - Provide: issue summary, impact, what was tried, what is needed
  - Sync: same business day (within 4 hours)

TIMEOUT: If not resolved in 1 business day → auto-escalate to L3
```

### Level 3 (L3) — Director/VP Escalation
```
DEFINITION: Issue requires director authority, significant resources, or cross-org coordination
CRITERIA:
  - SLA breach imminent (< 25% time remaining) or already breached
  - Multiple cross-team dependencies blocked
  - Customer impact confirmed or imminent
  - Budget decision required

ACTION:
  - Escalate to Director or VP (T3)
  - Provide: escalation package (see below)
  - Response: within 2hr (business hours); 30 min (P1/customer impacting)

TIMEOUT: If not resolved in 4 business hours → auto-escalate to L4
```

### Level 4 (L4) — Executive Escalation
```
DEFINITION: Issue requires executive authority, significant organizational risk
CRITERIA:
  - Major milestone at risk (> 1 week slip)
  - Significant customer impact (Tier-1 or > $250K ARR)
  - Regulatory or legal risk identified
  - Cross-org resource contention unresolvable at director level

ACTION:
  - Escalate to VP or C-Suite (T4)
  - Escalation package required (see below)
  - Response: within 1hr (any time for customer/regulatory)

TIMEOUT: If not resolved or acknowledged in 2hr → escalate to L5
```

### Level 5 (L5) — CEO/Board Level
```
DEFINITION: Company-level risk; requires CEO or board awareness
CRITERIA:
  - Customer at risk > $500K ARR
  - Regulatory non-compliance with enforcement risk
  - Security breach with data exposure
  - Major production outage > 4 hours affecting all customers

ACTION:
  - Escalate to CEO (T5) immediately
  - Legal + DPO automatically notified
  - Board notification if financial impact > $1M or regulatory breach
  - Response: immediate acknowledgment; war room within 30 min
```

---

## Escalation Package Standard

**Required for L3 and above. Sent before or simultaneously with verbal escalation.**

```
ESCALATION PACKAGE TEMPLATE (Slack or email):

ESCALATION — [L3/L4/L5] — [ONE-LINE SUMMARY]
──────────────────────────────────────────────────────────────────────────────────
WHAT:       [What is the issue? 1–2 sentences]
IMPACT:     [Who is impacted? What is the business/customer impact?]
TIMELINE:   [When did this start? When does this become irreversible?]
TRIED:      [What has been done so far to resolve it?]
BLOCKED ON: [What specific decision or resource is needed to unblock?]
OPTIONS:    [Option A: ... | Option B: ... | Recommend: Option A because ...]
OWNER:      [Who owns resolution from this point?]
ESCALATED BY: [Name + role + contact]
```

---

## Escalation Routing Matrix

```
ISSUE TYPE                              L2          L3          L4          L5
──────────────────────────────────────────────────────────────────────────────────────────────
Production incident (SEV3/SEV4)         Eng Lead    —           —           —
Production incident (SEV2)              —           Eng Dir     —           —
Production incident (SEV1)              —           —           VP Eng/CTO  CEO
Sprint delivery risk                    PM Lead     PM Dir      VP Product  —
Release blocked                         RM          VP Eng      CTO         —
Architectural dispute unresolved        Arch Lead   Principal   CTO         —
Security vulnerability (HIGH)           Sec Lead    CISO        —           —
Security breach                         —           CISO        CTO         CEO+Legal
Customer complaint (Tier-2)             CS Lead     —           —           —
Customer complaint (Tier-1)             —           CS Dir      VP CS       —
Customer ESC1 (>$500K ARR)              —           —           VP CS       CEO
Compliance gap identified               DPO         —           —           —
Regulatory deadline at risk             —           DPO         CTO         CEO
Team health CRITICAL                    Manager     Eng Dir     VP People   —
Budget overrun > 20%                    PM          Eng Dir     VP Eng      CFO
```

---

## Escalation Anti-Patterns and Consequences

```
ANTI-PATTERN                            CONSEQUENCE
──────────────────────────────────────────────────────────────────────────────────────────────
Hero culture ("I can fix this")         Late escalation; customer impact; outage extended
Escalation theater (escalate everything) Executive fatigue; real escalations ignored
Skipping levels ("I'll go straight to CEO") Trust erosion; process breakdown
Vague escalation ("there's a problem")  No action taken; time wasted on clarification
Escalating without a recommendation     Decision-maker has to rebuild context from scratch
No follow-through after escalation       Issue "escalated" but still unresolved; falls through
Retroactive escalation ("FYI: we missed it") Opportunity to prevent impact lost
```

---

## Escalation Communication Templates

### Slack Alert (< 280 characters)
```
🔴 L[3/4/5] ESCALATION | [ISSUE_TYPE] | Impact: [1 line] | Need: [1 line] | Owner: [name] | Thread for details ↓
```

### PagerDuty / On-Call Trigger
```
Use for: SEV1/SEV2 production incidents (→ WF-012)
Do NOT use for: Delivery, organizational, or compliance escalations
(PagerDuty is for production system issues only)
```

---

## Escalation Response Commitments

**When you receive an escalation, you commit to:**

```
L2: Acknowledge within 30 min; respond with plan within 2 hours
L3: Acknowledge within 15 min; respond with plan within 1 hour
L4: Acknowledge within 10 min; respond with plan within 30 min; sync within 2 hours
L5: Acknowledge within 5 min; war room within 30 min; update every hour

RESPONSE = acknowledging you received it and confirming you are acting on it.
PLAN = a concrete next step, even if it's "we need 30 more minutes to assess."
```

---

## Escalation Lifecycle Tracking

**All L3+ escalations tracked in:** `wiki/escalations/active.md`

```
ESCALATION RECORD:
  escalation_id:     ESC-{YYYY-MM-DD}-{NNN}
  level:             L3 | L4 | L5
  class:             OPERATIONAL | DELIVERY | TECHNICAL | ORGANIZATIONAL | REGULATORY | CUSTOMER
  opened:            ISO8601
  escalated_by:      name + role
  escalated_to:      name + role
  issue_summary:     one-line description
  business_impact:   quantified if possible
  status:            OPEN | IN_PROGRESS | RESOLVED | ESCALATED_FURTHER
  resolution:        [when resolved: what was decided/done]
  closed:            ISO8601 | null
  root_cause:        [why did this need escalation? was it avoidable?]
  retrospective:     yes | no (required for all L4/L5)
```

---

## Escalation Retrospective (L4/L5)

**Timing:** Within 5 business days of resolution

```
QUESTIONS:
  1. Was the escalation triggered at the right time? (too early / right / too late)
  2. Was the escalation package adequate? (info sufficient to act immediately?)
  3. Was the routing correct? (right person engaged first?)
  4. What was the resolution? Was it the right decision?
  5. Could this issue have been prevented? How?
  6. Does this reveal a systemic gap? (process, tooling, communication)
  7. What changes to this playbook would prevent or improve similar escalations?

OUTPUT: Escalation retrospective note → wiki/escalations/retrospectives/{id}.md
        Process improvement Jira ticket (if systemic gap identified)
```

---

## Governance Checkpoints

```
C-001: L4/L5 escalation decisions are human decisions; AI analytics support only
C-004: All L3+ escalations permanently recorded with resolution
TIMEOUT: Escalation timeouts are non-negotiable; auto-escalate fires regardless of team preference
PACKAGE: L3+ escalations without a package are returned to sender (response blocked)
RESPONSE_SLA: Acknowledging within SLA is mandatory; missing acknowledgment = itself an escalation
RETROACTIVE: Escalation-avoidance ("let's not escalate") is only acceptable with documented rationale
```

## Health Metrics

```
METRIC                                  TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
L3+ escalations with package            = 100%
Escalation acknowledgment within SLA    >= 0.98
L4/L5 retrospectives completed          = 100%
Avg time from issue to correct level    < 30 min (business hours)
Escalation rate per sprint              < 2 L3+ per team per sprint (baseline)
Repeat escalation for same root cause   = 0 (systemic fix required after first)
False-alarm escalations (over-escalate) < 10% of L3+
```

## Workflow Integrations

```
WF-012  Incident Management → SEV1/SEV2 triggers parallel escalation via this playbook
WF-017  Customer Escalation → ESC1/ESC2 customer escalations follow L4/L5 protocol here
PB-001  Executive Operating Cadence → L4/L5 escalations interrupt standard exec schedule
PB-004  Release Council → release blockers escalate via this playbook
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
Escalation list not maintained              Stale contacts; escalation goes to wrong person
"I'll figure it out" past timeout           Silent failure; late escalation; larger impact
L5 escalated as routine L3                 Executive disengages from real L5s
No escalation after SLA breach             Issue persists; no accountability
Package skipped "there's no time"          Recipient has no context; decision delayed anyway
```
