# PB-013: Organizational Reviews

**Version:** 1.0.0 | **Owner:** Executive + People Org | **Cadence:** Quarterly | **Tier:** T4 | **Class:** ELEVATED

## Purpose
Assess organizational health, team performance, structure effectiveness, and people outcomes on a quarterly basis — producing binding decisions on team composition, structure, leadership effectiveness, and improvement investments. The org review is the mechanism by which the organization reflects on itself and improves.

## Org Review vs. QBR vs. Portfolio Review

```
QUARTERLY BUSINESS REVIEW (PB-005, PB-006):
  Focus: product roadmap, OKR progress, financial outcomes
  Owner: PM + Product Org
  Audience: T4+ + PM org

ORGANIZATIONAL REVIEW (PB-013):
  Focus: people, structure, health, effectiveness of teams and leaders
  Owner: People Org + Executive Org
  Audience: T4+ + People (CONFIDENTIAL; HR-protected)

PORTFOLIO REVIEW (PB-014):
  Focus: initiative status, resource allocation, delivery performance
  Owner: Delivery Org + PM Org
  Audience: T3+

These are THREE separate reviews with separate artifacts, decisions, and audiences.
```

---

## Org Review Calendar

```
CADENCE: Last Thursday–Friday of each quarter end
DURATION: 2 days (full-day per day for orgs > 50 people)
TIMING:
  Q1 Review: last week of March
  Q2 Review: last week of June
  Q3 Review: last week of September
  Q4 Review: last week of December (combined with Annual People Planning)

PRE-WORK WINDOW: 2 weeks prior
  - People analytics package assembled (people-intelligence team)
  - Manager feedback submitted
  - Employee engagement survey results compiled
  - Team health scores calculated
```

---

## Org Review Dimensions

### Dimension 1: Team Health

```
TEAM HEALTH SCORE (per team, automated):
  SIGNALS:
    Velocity trend (12-week rolling): improving / stable / declining
    Sprint carryover rate: < 10% healthy; > 25% distressed
    Incident rate attributable to team: < 5/quarter healthy
    Retrospective action completion rate: > 80% healthy
    Code review turnaround: < 24hr healthy; > 72hr distressed
    On-call escalation rate: < 2/month healthy

  SCORE:
    HEALTHY:    4 of 6 signals healthy
    WATCH:      3 of 6 signals healthy
    DISTRESSED: 2 or fewer signals healthy
    CRITICAL:   velocity decline > 20% + carryover > 30% + escalations rising

TEAM HEALTH DASHBOARD: wiki/org-intelligence/team-health-dashboard.md
```

### Dimension 2: Engagement and Retention

```
ENGAGEMENT METRICS (quarterly):
  Employee Engagement Score: survey-based; target >= 7.0/10.0
  eNPS (Employee Net Promoter Score): target >= 30
  Voluntary attrition rate: target < 0.12 (12% annualized)
  Regrettable attrition rate: target < 0.05 (5% annualized — "A-player" exits)
  30-day retention rate (new hires): target >= 0.95
  90-day retention rate (new hires): target >= 0.90

ALERT THRESHOLDS:
  eNPS < 10: immediate review required
  Regrettable attrition > 10% in a quarter: executive action required
  Single team attrition > 20% in a quarter: team health investigation
```

### Dimension 3: Leadership Effectiveness

```
LEADERSHIP METRICS (quarterly):
  360 feedback completion rate (managers): target = 100%
  Manager effectiveness score (direct report survey): target >= 7.5/10
  1:1 completion rate (weekly): target >= 0.85 (15% excused, not missed)
  Team OKR achievement rate: target >= 0.70
  Escalation-to-manager rate: (number of escalations routed to this manager)

LEADERSHIP HEAT MAP (wiki/people-intelligence/leadership-effectiveness.md):
  GREEN:  effectiveness >= 7.5 + team health HEALTHY + attrition < team avg
  YELLOW: effectiveness 6.0–7.4 OR team WATCH OR attrition slightly above avg
  RED:    effectiveness < 6.0 OR team DISTRESSED OR attrition significantly above avg
```

### Dimension 4: Organizational Structure

```
STRUCTURE ASSESSMENT (quarterly):
  Span of control: target 5–8 directs per manager (< 4 = underutilized; > 10 = overloaded)
  Team size: target 6–9 per team (Dunbar team unit; 2-pizza rule)
  Bus factor analysis: any role/knowledge concentration = 1 person → CRITICAL
  Cross-team dependency density: teams with > 4 external blockers/sprint → structural risk
  Org chart changes since last quarter: structural drift assessment
```

### Dimension 5: Compensation and Role Health

```
COMPENSATION METRICS (quarterly review; adjustments annual or off-cycle):
  Compensation band alignment: % roles within their band target
  Below-band count: any role > 15% below band midpoint → immediate flag
  Market gap: comparison to external benchmarks (if available)
  Equity vesting cliffs: any A-players approaching vesting cliff?

ROLE HEALTH:
  Unfilled critical roles > 60 days: escalate to T4
  Roles with unclear ownership: audit annually
  Roles with no performance feedback in 6 months: flag to People Ops
```

---

## Quarterly Org Review Agenda

**Day 1 — Team and Health Review (CEO + T4 People leaders + Eng Directors)**

```
TIME    TOPIC                                              OWNER          DECISION?
──────────────────────────────────────────────────────────────────────────────────────────────
0:00    Team health dashboard walkthrough                  People Ops     Flag DISTRESSED/CRITICAL
0:45    Engagement survey results: highlights + concerns   People Ops     Actions assigned
1:15    Voluntary + regrettable attrition analysis         HRBP           Action if above target
1:45    New hire ramp quality: 90-day cohort outcomes      Onboarding Mgr Adjustments to PB-009
2:15    BREAK
2:30    Leadership effectiveness heat map review           Chief People    Coaching vs. action
3:15    Bus factor + knowledge concentration risk          Eng Leads      Mitigation plans
3:45    Compensation and role health flags                 People Ops     Off-cycle adjustments
4:30    BREAK + consolidation
5:00    Day 1 decision summary + action assignments        CEO            Record decisions
```

**Day 2 — Structure and Strategy Review (CEO + T4+ only; CONFIDENTIAL)**

```
TIME    TOPIC                                              OWNER          DECISION?
──────────────────────────────────────────────────────────────────────────────────────────────
0:00    Org structure fit: current structure vs. strategy  CTO + CPO      Restructure proposals
0:45    Team composition gaps: skills vs. roadmap needs    Eng Directors  Hiring prioritization
1:15    Succession planning: single points of leadership   CEO + CPO      Backup designations
1:45    A-player retention: top performers review          Chief People    Retention actions
2:15    BREAK
2:30    Performance management: PIPs, off-boarding         Chief People    Decisions authorized
3:15    Organizational evolution decisions                 CEO            → WF-020 if triggered
3:45    Q+1 headcount and hiring plan adjustments          Chief People    Budget reallocation
4:15    Communication plan for org changes                 Chief People    Drafted
4:45    Decision record finalized                          Chief People    Artifacts filed
```

---

## ORR Sign-Off and Decision Record

**Filed at:** `wiki/org-reviews/{quarter}/decisions.md` (CONFIDENTIAL; HR access only)

```
DECISION RECORD FIELDS:
  quarter:            e.g., 2026-Q2
  date:               ISO8601
  participants:       names + roles
  decisions:          list of binding decisions (each with owner + deadline)
  open_items:         items requiring further investigation (max 3 from Day 1 to Day 2)
  triggered_workflows: list of WF-020 or other workflows triggered
  communication_plan: what is communicated to whom, by when
  confidentiality:    CONFIDENTIAL | LIMITED_SHARE | GENERAL
```

---

## People Risk Register

**Maintained in:** `wiki/people-intelligence/risk-register.md` (HR access only)

```
RISK CLASSES:
  ATTRITION_RISK:    High-performer with declining engagement or above-market offers
  BUS_FACTOR:        Single person holding critical knowledge or access
  LEADERSHIP_GAP:    Manager with RED leadership score for > 1 quarter
  SUCCESSION_GAP:    T4+ role with no internal succession candidate
  EQUITY_CLIFF:      Key person with vesting cliff in next 180 days

RISK REGISTER ENTRY:
  risk_id:           RR-{NNN}
  risk_class:        one of above
  person_or_role:    [anonymized for non-People-Ops records]
  severity:          HIGH | MEDIUM | LOW
  mitigation_plan:   specific action + owner + deadline
  last_reviewed:     ISO8601
  status:            OPEN | MITIGATING | RESOLVED
```

---

## Manager Performance Protocol

```
MANAGER EFFECTIVENESS THRESHOLD:
  Score >= 7.5: EFFECTIVE — standard development support
  Score 6.0–7.4: WATCH — HRBP coaching plan; 90-day check-in
  Score < 6.0 for 2 consecutive quarters: PERFORMANCE_CONCERN
    Action: formal coaching plan; reassignment consideration
  Score < 5.0 in any quarter: CRITICAL
    Action: immediate HRBP + T4 review; role reassignment within 60 days

MANAGER SCORE INPUTS:
  Direct report survey (anonymous): 60% weight
  Peer / stakeholder feedback: 20% weight
  Objective outcomes (OKR, attrition, carryover): 20% weight
```

---

## Succession Planning Protocol

```
SUCCESSION REQUIRED FOR: All T3+ roles; all sole-owner critical systems
CADENCE: Reviewed quarterly; updated annually

SUCCESSION LEVELS:
  READY_NOW:    Can fill the role today with no ramp
  READY_18MO:   Can fill the role with 12–18 months development
  IDENTIFIED:   Person identified; development plan needed
  GAP:          No successor identified → CRITICAL flag

SUCCESSION GAP RESPONSE:
  T3 gap: Engineering/Product Director responsible to identify + develop within 2 quarters
  T4 gap: CEO + Chief People Officer to develop plan within 1 quarter
  T5 gap: Board-level succession planning
```

---

## Governance Checkpoints

```
C-001: Org structure and personnel decisions are human decisions; AI analytics are advisory
C-004: Org review records permanently retained; HR access controlled
CONFIDENTIALITY: Day 2 outcomes shared on need-to-know basis only
COMMUNICATION: Affected individuals notified before news reaches broader team
PIPs: Performance improvement plans documented and reviewed by HR before delivery
WF-020: Any structural change involving > 5 people triggers WF-020 (Org Evolution)
COMPENSATION: Off-cycle adjustments require T4 approval; on-cycle changes per annual plan
```

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Org review held each quarter              = 100%
Team health DISTRESSED or worse            < 10% of teams (action required if exceeded)
Engagement score                          >= 7.0 / 10.0
eNPS                                      >= 30
Regrettable attrition (annualized)        < 0.05
Manager effectiveness score (avg)         >= 7.5
Bus factor = 1 instances unmitigated      = 0 (all must have mitigation plan)
Succession gaps at T4+                    = 0
```

## Workflow Integrations

```
WF-020  Organizational Evolution → org review decisions may trigger WF-020
PB-001  Executive Operating Cadence → org review outputs briefed in monthly exec review
PB-006  Annual Planning → Q4 org review directly feeds annual headcount + structure plan
PB-009  Onboarding → 90-day cohort outcomes reviewed in org review
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
Org review skipped "busy quarter"          Health issues compound; attrition surprises
Day 2 decisions leaked before Day 1 ends   Trust broken; people seek jobs proactively
Engagement survey ignored ("we know")      Survey trust erodes; participation drops
Bus factor never resolved (always "soon")  Person exits; knowledge lost; 6-month recovery
Performance issue carried for > 2 quarters  High performers demoralized; culture erodes
Org review conflated with QBR              People issues get crowded out by product metrics
```
