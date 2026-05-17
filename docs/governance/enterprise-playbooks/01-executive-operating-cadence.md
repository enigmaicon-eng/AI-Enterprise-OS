# PB-001: Executive Operating Cadence

**Version:** 1.0.0 | **Owner:** Executive Org | **Cadence:** Daily / Weekly / Monthly / Quarterly | **Tier:** T4 | **Class:** CRITICAL

## Purpose
Define the complete operating rhythm for T4/T5 executive leadership — establishing deterministic cadences for health monitoring, strategic alignment, cross-functional decision-making, and organizational accountability. Prevents reactive management by building proactive review into the operating model.

## Participants

```
ROLE                    TIER  DAILY  WEEKLY  MONTHLY  QUARTERLY
──────────────────────────────────────────────────────────────────────
CEO                     T5    Read   Core    Core     Core
CPO                     T5    Read   Core    Core     Core
CTO                     T5    Read   Core    Core     Core
CAIO                    T5    -      Core    Core     Core
CFO                     T5    -      Read    Core     Core
VP Engineering          T4    -      Core    Core     Core
VP Product              T4    -      Core    Core     Core
VP Customer Success     T4    -      Opt     Core     Core
DPO / CISO              T4    -      Opt     Core     Core (regulated reviews)
EA / Chief of Staff     T3    Prep   Prep    Prep     Prep

Core = required; Read = read-only briefing; Opt = invited if relevant; Prep = prepares materials
```

---

## Daily Executive Health Brief

**Format:** Async digest (no meeting)
**Delivery:** 08:00 local T4/T5 time
**Prepared by:** AI OS (analytics-agent + monitoring-agent)
**Recipient:** All T4+ executives

### Content
```
SECTION                    SOURCE                        THRESHOLD FOR ESCALATION
─────────────────────────────────────────────────────────────────────────────────────────
Active incidents           WF-012 active-executions      Any SEV1 active → call T5
Production health          Runtime metrics               Error rate > 2× baseline → flag
Open customer escalations  WF-017 active-executions      Any ESC1 active → flag
Release pipeline status    WF-010/011 active-executions  Release blocked > 24hr → flag
Compliance posture         WF-014 findings               Any CRITICAL gap → flag
AI governance status       WF-006/007 models             HIGH_RISK non-compliant → flag
Sprint health              Team velocity + health         Any team DISTRESSED → flag
Dependency critical path   WF-016 critical-path          Any path at risk → flag
```

### Format
```
[DATE] Executive Health Brief

🟢 PRODUCTION: All systems nominal | 🔴 PRODUCTION: SEV1 active — [incident_id]
🟢 RELEASES: 0 blocked | 🟡 RELEASES: [release_id] blocked at [gate]
🟢 CUSTOMERS: 0 escalations | 🔴 CUSTOMERS: ESC1 active — [customer_name]
🟢 COMPLIANCE: Posture STRONG | 🟡 COMPLIANCE: [N] open findings
...

ACTION ITEMS REQUIRING T4/T5 TODAY:
[list or "none"]
```

---

## Weekly Executive Sync

**Cadence:** Every Monday, 90 minutes
**Format:** Synchronous; video required
**Chair:** CEO (or CPO if CEO unavailable)
**Quorum:** CEO + 2 of {CPO, CTO, CAIO, CFO}

### Preparation (by Friday EOD prior week)
```
OWNER              DELIVERABLE
─────────────────────────────────────────────────────────────────────────────────────────
Chief of Staff     Consolidated weekly report package (assembled from below)
VP Engineering     Engineering health brief: DORA metrics, incidents, tech debt
VP Product         Product health brief: sprint progress, roadmap status, key risks
analytics-agent    AI synthesis of org health, velocity trends, dependency risks
DPO (if issues)    Compliance status update (only if open CRITICAL findings)
```

### Agenda
```
TIME    TOPIC                                       OWNER           DECISION NEEDED?
──────────────────────────────────────────────────────────────────────────────────────────
0:00    Previous week actions — status check        Chief of Staff  No (accountability)
0:10    Production + incident review                VP Eng          Only if open SEV1/SEV2
0:20    Customer escalation review                  VP CS           If ESC1 open
0:30    Delivery health — sprint, releases, deps    CPO + VP Eng    If blocked > 48hr
0:50    Strategic decisions requiring exec input    CPO/CTO         Yes — document each
1:10    Emerging risks + upcoming milestones        All             Prioritize response
1:20    Action items + owners                       Chief of Staff  Yes — capture all
1:25    Close                                       CEO             -
```

### Decision Protocol
```
DECISION TYPES at Weekly Sync:
  OPERATIONAL: any T4 can make; document in weekly digest
  STRATEGIC: requires CPO + CTO alignment; record in decision log (WF-015)
  RESOURCE: requires CFO input; estimate + approve or defer to monthly
  REGULATORY: DPO must be present or decision deferred

BLOCKED DECISIONS:
  If no quorum → defer to async Slack thread; 24hr deadline; document outcome
  If persistent deadlock → escalate to CEO for binding call within 48hr
```

### Output Artifact
```
wiki/executive/weekly-sync/{date}.md
  - Decisions made (each with rationale)
  - Actions + owners + deadlines
  - Risks escalated
  - Metrics summary
```

---

## Monthly Executive Review

**Cadence:** First Tuesday of each month, 3 hours
**Format:** Synchronous; slide deck required
**Chair:** CEO
**Quorum:** All T5 + all T4 VPs

### Preparation (by last Friday of prior month)
```
OWNER              DELIVERABLE                              DUE
─────────────────────────────────────────────────────────────────────────────────────────
VP Product         Product & roadmap review deck            -5 business days
VP Engineering     Engineering health + DORA report         -5 business days
VP CS              Customer health, NPS, escalation summary -5 business days
CFO                Financial performance vs. plan           -3 business days
DPO                Compliance posture summary               -3 business days
CAIO               AI governance status + EU AI Act prep    -3 business days
Chief of Staff     Consolidated pre-read package            -2 business days
analytics-agent    Org intelligence summary + anomalies     -2 business days
```

### Agenda
```
TIME    TOPIC                                       OWNER        TYPE
──────────────────────────────────────────────────────────────────────────────────────────
0:00    Monthly metrics review                      CEO          Review
0:20    Delivery performance + roadmap health       CPO          Review + decision
0:50    Engineering health: quality, reliability    CTO          Review + escalation
1:15    Customer health + escalation trends         VP CS        Review + decision
1:35    Financial performance vs. plan              CFO          Review
1:55    Compliance + regulatory status              DPO          Review + decision
2:15    AI governance update                        CAIO         Review + decision
2:35    Strategic decisions + priority changes      All          Decision
2:55    Actions + owners + close                    CEO          -
```

### Required Decisions Each Month
```
1. Roadmap priority confirmation or change (CPO decision, T5 alignment)
2. Resource reallocation if any team at <70% capacity (CFO + VPs)
3. Any CRITICAL compliance finding remediation authorization (DPO)
4. Release blocking issues → unblock or defer (CTO + CPO)
```

---

## Quarterly Business Review (QBR)

**Cadence:** Last week of each quarter, 1 full day
**Format:** In-person preferred; synchronous required
**Chair:** CEO
**Participants:** All T4+; Board invited as observers for Q4

### Pre-QBR Preparation (3 weeks prior)
```
WEEK -3:  analytics-agent generates quarterly org intelligence report
WEEK -2:  All VPs submit quarterly performance retrospective (1 page each)
WEEK -1:  CFO + CPO submit forecast vs. actuals
DAY -2:   Chief of Staff assembles consolidated QBR package
DAY -2:   Board observer materials shared (confidential subset)
```

### QBR Agenda
```
TIME    TOPIC                                        OWNER        OUTPUT
──────────────────────────────────────────────────────────────────────────────────────────
AM Session: Retrospective
09:00   Quarter in review: key achievements          CEO          -
09:20   Delivery: roadmap progress vs. plan          CPO          Roadmap accuracy %
09:50   Engineering: DORA, incidents, quality        CTO          Reliability scorecard
10:20   Customer: retention, NPS, escalations        VP CS        Customer health score
10:50   Financial: revenue vs. plan                  CFO          Forecast accuracy
11:10   Compliance + AI governance                   DPO + CAIO   Posture assessment
11:30   Organizational health                        HRBP + T4s   Org health tier

PM Session: Forward Planning
13:00   Quarterly planning preview (→ WF-003)        CPO          OKR draft
13:30   Resource + headcount for next quarter        CFO + VPs    Budget commitments
14:00   Strategic risks for next quarter             All          Risk register update
14:45   Exec decisions: priority, resource, risk     CEO          Decision record
15:30   Actions + owners                             Chief of Staff -
16:00   Close                                        CEO          -
```

### QBR Required Outputs
```
1. Quarterly performance scorecard (all metrics vs. targets)
2. OKR retrograde assessment (what hit, what missed, why)
3. Updated risk register for next quarter
4. Authorized headcount and budget for next quarter
5. wiki/executive/qbr/{quarter}.md — permanent record
```

---

## Emergency Executive Protocol

**Trigger:** SEV1 unresolved > 2hr OR ESC1 with churn > $1M OR data breach OR legal threat

```
STEP    ACTION                                         OWNER            SLA
───────────────────────────────────────────────────────────────────────────────────────────
1       Emergency notification sent                    System/PagerDuty Immediate
2       CEO notified via call + SMS                    Chief of Staff   < 5 min
3       Virtual war room opened (#exec-war-room)       System           < 10 min
4       Situation brief delivered (1 page max)         analytics-agent  < 15 min
5       Executive command structure confirmed          CEO              < 15 min
6       Decision authority delegated per situation     CEO              < 20 min
7       External communication reviewed (if needed)   CEO + Legal      < 30 min
8       Resolution timeline established                CTO/CPO          < 30 min
9       T5 updates to board (if material event)        CEO              Within 2 hr
10      Hourly status updates until resolved           Commander        Every 60 min
```

---

## Governance Checkpoints

```
C-001: T4/T5 decisions in weekly/monthly sync must be recorded by human; AI synthesizes but humans decide
C-004: All executive decisions permanently recorded with rationale in wiki
QUORUM: No binding decision without quorum; deferred decisions documented with reason
TRANSPARENCY: Weekly digest shared with all T3+ leads within 24hr of sync (redacted as needed)
CONFLICTS: CPO/CTO/CEO disagreements → CEO binding decision within 48hr; dissent recorded
AI_GOVERNANCE: CAIO must present at every monthly review; no deferred AI governance reporting
```

## Health Metrics

```
METRIC                                TARGET
─────────────────────────────────────────────────────────────
Weekly sync completion rate           >= 0.95 (≤ 1 missed/quarter)
Monthly review completion rate        = 1.00 (no missed)
Action item on-time rate (weekly)     >= 0.85
Decision documentation rate           = 1.00 (every decision recorded)
Brief delivery on-time (daily)        >= 0.99 (automated; no manual excuses)
Escalation response time              <= 15 min for daily brief CRITICAL flags
QBR completion within quarter week    = 1.00
```

## Workflow Integrations

```
WF-002  Annual Planning     → annual planning session structure sourced from PB-006
WF-003  Quarterly Planning  → QBR triggers quarterly planning (PB-005)
WF-012  Incident Mgmt       → SEV1 → emergency protocol; weekly sync review
WF-014  Compliance Review   → monthly and QBR compliance status review
WF-017  Customer Escalation → ESC1 → weekly sync + emergency protocol if > $500K ARR
WF-020  Org Evolution       → T5 approval authority per this playbook's quorum rules
```

## Anti-Patterns

```
ANTI-PATTERN                              CONSEQUENCE
───────────────────────────────────────────────────────────────────────────────────────────
Weekly sync becomes status theatre        Decisions deferred; org loses confidence
Daily brief ignored                       SEV1/ESC1 escalation delayed; SLA breach
No quorum → no decisions documented      Decisions made informally; accountability lost
QBR used for surprises not pre-reads      Poor decision quality; board confidence eroded
Exec sync blocked by T4 unavailability   Delegate to peer; never skip
AI-synthesized brief taken as final      Human judgment must review before escalation
```
