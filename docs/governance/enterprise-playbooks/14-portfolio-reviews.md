# PB-014: Portfolio Reviews

**Version:** 1.0.0 | **Owner:** Delivery + PM Org | **Cadence:** Monthly + Quarterly | **Tier:** T3 | **Class:** ELEVATED

## Purpose
Maintain executive visibility into the full portfolio of active initiatives — their delivery health, resource consumption, risk exposure, and strategic alignment — and make binding decisions on scope changes, re-prioritization, resource reallocation, and initiative cancellation. The portfolio review is the mechanism by which strategy stays coupled to execution.

## Portfolio Review Cadence

```
REVIEW TYPE           CADENCE            DURATION    AUDIENCE
──────────────────────────────────────────────────────────────────────────────────────────────
Monthly Health Check  First Tuesday/mo   60 min      T3+ PM/Delivery + VP Eng + CPO
Quarterly Deep Review Last week of qtr   Half-day    T3+ + CEO (if major re-prioritization)
Emergency Portfolio   On-trigger         30 min      Initiating leader + CPO + VP Eng
```

---

## Portfolio Taxonomy

### Initiative Classes

```
CLASS       CRITERIA                                  GOVERNANCE LEVEL
──────────────────────────────────────────────────────────────────────────────────────────────
STRATEGIC   Tied to company-level OKR; > 1 team       T4 approval for scope/cancel
PRODUCT     Feature delivery; 1–2 teams; < 1 qtr     T3 PM approval for changes
TECH        Infrastructure; technical debt; platform  T3 Eng Dir approval for changes
REGULATORY  Compliance-driven; fixed deadline         T4 + DPO; no scope reduction
EXPERIMENTAL Research spike; time-boxed               T2 PM; kill if not ship in time-box
```

### Initiative Status

```
STATUS          DEFINITION                                      ACTION REQUIRED
──────────────────────────────────────────────────────────────────────────────────────────────
ON_TRACK        Delivering per plan; no flags                   None
AT_RISK         1 or more: dependency slip, scope creep,        PM escalation within 48hr
                capacity issue; no SLA breach yet
CRITICAL        SLA breach imminent (< 25% buffer);             L3 escalation; council review
                blocking dependency; budget overrun > 20%
BLOCKED         Cannot proceed; awaiting external resolution     Immediate L3 escalation
CANCELLED       Decision made to stop; work stops               WF → clean-up + retrospective
COMPLETED       All acceptance criteria met; shipped             Retrospective + learnings doc
```

---

## Monthly Portfolio Health Check

**Timing:** First Tuesday of each month, 10:00–11:00
**Pre-work:** PM leads submit status updates by Monday 17:00 (day before)
**Output:** Updated portfolio dashboard + decisions logged

### Agenda

```
TIME    TOPIC                                               OWNER         DECISION?
──────────────────────────────────────────────────────────────────────────────────────────────
0:00    Portfolio dashboard review: statuses overview       Delivery Mgr  Flag changes
0:10    AT_RISK initiatives: what changed + plan            PM Leads      Mitigation confirmed
0:25    CRITICAL/BLOCKED initiatives: root cause + options  PM + Eng      Resolution decision
0:40    Capacity vs. demand: are teams overloaded?          Delivery Mgr  Reallocation if needed
0:50    Milestone outlook: what ships this month?           PM Leads      Forecast committed
0:55    Actions + decisions recorded                        Delivery Mgr  Log artifacts
```

### Status Update Format (submitted by each PM lead)

```
INITIATIVE: {initiative_name} | {class} | {status}
SUMMARY: One-line: what happened since last review?
MILESTONE: Next milestone — what + when?
FLAGS: Any risks, blockers, or scope changes?
NEEDS: Any decision or resource from this review?
```

---

## Quarterly Portfolio Deep Review

**Timing:** Last week of quarter (Day 1: health; Day 2: re-prioritization)
**Duration:** Half-day (4 hours) or full-day for large portfolios (> 20 initiatives)
**Pre-work package (assembled by analytics-agent + PM leads, T-5 business days):**

```
PREPARED DELIVERABLES:
  1. Portfolio Scorecard: all initiatives with RAG status, % complete, budget consumed
  2. Delivery Velocity Report: planned vs. actual completions last quarter
  3. Capacity Utilization: team load, utilization rate, projected next quarter
  4. Risk Register: current portfolio risks with probability + impact
  5. Strategic Alignment Heat Map: each initiative mapped to OKRs
  6. Budget Variance Report: planned vs. actual spend per initiative class
  7. Dependency Map: cross-initiative dependencies with risk flags
  8. Quarterly Completion Retrospective: what shipped, what slipped, root causes
```

### Day 1 — Health Review Agenda (2 hours)

```
TIME    TOPIC                                               OWNER         DECISION?
──────────────────────────────────────────────────────────────────────────────────────────────
0:00    Quarterly delivery retrospective: shipped vs. plan  Delivery Mgr  No decision; data
0:20    Portfolio scorecard walkthrough: RAG status         PM Leads      Revalidate statuses
0:50    CRITICAL + BLOCKED deep dive: root cause analysis   PM + Eng      Resolution decisions
1:10    Capacity + resource utilization: over/underloaded?  Delivery Mgr  Rebalancing decisions
1:30    Strategic alignment check: is the portfolio right?  CPO           Flag misaligned items
1:50    Summary: what does Q+1 look like?                   CPO           Input to Day 2
```

### Day 2 — Re-Prioritization Agenda (2 hours)

```
TIME    TOPIC                                               OWNER         DECISION?
──────────────────────────────────────────────────────────────────────────────────────────────
0:00    Re-prioritization candidates: what's on the table?  CPO           Framing
0:15    Strategic portfolio: add / remove / re-scope?       CEO + CPO     Binding decisions
0:45    Resource reallocation: capacity follow-on           VP Eng + CPO  Reallocations approved
1:05    Cancellation decisions: kill criteria met?          CPO           Cancel or continue
1:25    Q+1 portfolio snapshot: committed plan              Delivery Mgr  Portfolio committed
1:45    Communication plan: what gets communicated + how?   PM Leads      Drafted
```

---

## Portfolio Metrics Dashboard

**Maintained in:** `wiki/portfolio/dashboard.md` (auto-generated by analytics-agent)

```
PORTFOLIO SNAPSHOT — {quarter} — Updated: {date}
──────────────────────────────────────────────────────────────────────────────────────────────
TOTAL INITIATIVES:  {N}
  STRATEGIC:        {N}    ON_TRACK: {N}  AT_RISK: {N}  CRITICAL: {N}  BLOCKED: {N}
  PRODUCT:          {N}
  TECH:             {N}
  REGULATORY:       {N}
  EXPERIMENTAL:     {N}

DELIVERY HEALTH:
  Planned completions this quarter: {N}
  Completed on time: {N} ({%})
  Slipped: {N} — avg slip: {N} weeks
  Cancelled: {N}

CAPACITY:
  Total team capacity (SP/sprint): {N}
  Allocated to active initiatives: {N} ({%})
  Reserved (tech debt + ops): {N} ({%})
  Unallocated buffer: {N} ({%})

BUDGET:
  Total portfolio budget (Q): ${N}
  Consumed to date: ${N} ({%})
  Projected overrun: ${N} | {%} of initiatives over budget
```

---

## Initiative Scoring and Prioritization

**Used for quarterly re-prioritization; scored by PM lead, reviewed by CPO**

```
DIMENSION                   WEIGHT    SCORING
──────────────────────────────────────────────────────────────────────────────────────────────
Strategic alignment          30%       5=directly tied to company OKR; 1=no clear tie
Customer impact              25%       5=all customers, revenue-critical; 1=internal only
Risk of not doing            20%       5=regulatory/churn risk; 1=nice-to-have
Confidence in delivery       15%       5=team confident, low risk; 1=high uncertainty
Resource efficiency           10%       5=small team, fast; 1=large team, slow

TOTAL SCORE = Σ(dimension × weight)
THRESHOLD FOR CONTINUATION: score >= 3.0
ESCALATION: score < 2.0 → CPO must justify continuation
```

---

## Kill Criteria

```
INITIATIVE IS KILL CANDIDATE IF:
  □ Strategic alignment score < 2.0 (no longer tied to any active OKR)
  □ Team confidence < 2.0 AND no recovery plan in 2 sprints
  □ Blocked > 6 weeks with no resolution path
  □ Budget overrun > 40% with no approved scope reduction
  □ Business case no longer valid (market changed, competitor shipped, requirement dropped)
  □ Regulatory or compliance blocker not resolvable in timeline

KILL DECISION REQUIRES:
  PRODUCT initiative: CPO approval
  STRATEGIC initiative: CPO + CEO approval
  REGULATORY initiative: DPO + T4 review (cannot cancel without compliance assessment)

KILL PROTOCOL:
  1. PM lead submits kill rationale (1-page)
  2. Kill review meeting (30 min; CPO + relevant T4)
  3. Decision recorded in portfolio log
  4. Team notified within 24hr; work stops
  5. Retrospective within 5 days: learnings documented
  6. Resources formally reallocated to new initiative
```

---

## Scope Change Protocol

```
SCOPE CHANGE CLASSES:
  MINOR: < 5% effort change; no OKR impact; no deadline change
    → PM Lead approval; notify Delivery Manager; log in initiative record
  MODERATE: 5–20% effort change OR 1-week delay OR drop/add 1 feature
    → T3 PM Dir approval; update portfolio dashboard; re-estimate milestone
  MAJOR: > 20% effort change OR > 2-week delay OR significant OKR impact
    → T4 CPO + VP Eng approval; full re-baseline; council notification
  STRATEGIC: Fundamental change to initiative scope or purpose
    → T5 CEO + CPO approval; full portfolio review triggered
```

---

## Dependency Risk Management

```
DEPENDENCY REGISTER (per initiative):
  dependency_id:  DEP-{NNN}
  initiative:     providing work item + team
  required_by:    consuming initiative + team
  need_by_date:   ISO8601
  status:         ON_TRACK | AT_RISK | MISSED | FULFILLED
  risk_level:     LOW | MEDIUM | HIGH | CRITICAL

DEPENDENCY RISK THRESHOLD:
  At-risk dependency: due within 2 sprints + no confirmed commitment
  → Immediate flag in portfolio dashboard + PM notification

CROSS-INITIATIVE DEPENDENCY BREACH:
  → L3 escalation (PB-012)
  → Delivery Manager coordinates resolution
  → CPD critical path recalculated (→ WF-016)
```

---

## Governance Checkpoints

```
C-001: Portfolio re-prioritization decisions are human decisions; analytics are advisory
C-004: All portfolio decisions permanently recorded (kill, scope, re-priority)
STRATEGIC: STRATEGIC initiative cancellation requires CEO approval
REGULATORY: Regulatory initiatives cannot be cancelled without compliance assessment
COMMUNICATION: Teams affected by portfolio changes notified before decision is public
CAPACITY: Portfolio plan must not exceed 90% team capacity (10% ops/tech debt buffer)
```

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Monthly health check held                = 100%
Quarterly deep review held               = 100%
Initiatives with current status          = 100% (no stale statuses)
On-time completion rate (quarterly)      >= 0.70
Average slip per slipped initiative      < 2 weeks
Portfolio budget variance                < 15% overall
Kill decision time (from candidate ID)   < 2 weeks
Cancelled initiatives with retrospective = 100%
```

## Workflow Integrations

```
WF-004  Roadmap Governance  → quarterly re-prioritization feeds roadmap update
WF-016  Dependency Coord.   → portfolio-level dependency risks escalate to WF-016
PB-005  Quarterly Planning  → Q+1 portfolio committed at quarterly review
PB-001  Executive Cadence   → critical portfolio issues escalated to exec monthly sync
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
Status always "GREEN" ("don't want to alarm") Real risks invisible until catastrophic
Portfolio never kills anything              Resources locked in zombies; priority impossible
Kill candidates debated for months         Team in limbo; morale suffers; waste continues
Scope added without re-baselining          Budget blown; teams overloaded; timeline fiction
Dependency risks tracked but not resolved  Cascading slips; everyone surprised at review
Monthly review skipped "busy this month"   Issues compound; quarterly review overwhelming
```
