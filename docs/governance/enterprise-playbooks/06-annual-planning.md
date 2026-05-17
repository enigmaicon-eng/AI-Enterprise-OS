# PB-006: Annual Planning

**Version:** 1.0.0 | **Owner:** PM + Executive Org | **Cadence:** Annual (Q3→Q4 of current year for next year) | **Tier:** T4 | **Class:** ELEVATED

## Purpose
Translate company strategy into a year-long operating plan — setting OKRs, allocating headcount and budget, defining strategic bets, establishing the delivery roadmap, and creating the accountability framework that quarterly planning executes against. Annual planning is the highest-stakes planning ritual in the OS.

## Annual Planning Timeline

```
DATE             MILESTONE                                   OWNER
──────────────────────────────────────────────────────────────────────────────────────────
Q3 Week 6        Strategic context session: market + trends  CEO + CAIO + CPO
Q3 Week 8        Company strategy review + update            T5 leadership team
Q3 Week 10       Financial targets set for next year         CFO + CEO
Q3 Week 12       Executive strategy workshop (2 days)        All T4/T5
Q4 Week 1        Company OKRs drafted                        CEO + CPO + CTO
Q4 Week 2        Company OKRs reviewed + finalized           T4/T5; board alignment
Q4 Week 3        Org OKR cascade: each org drafts team OKRs  All T3 leads
Q4 Week 4        Headcount and budget planning               CFO + all VPs
Q4 Week 5        Cross-function alignment: trade-offs        CPO + CTO + CFO session
Q4 Week 6        Board review: OKRs + budget + headcount     CEO + CFO; board
Q4 Week 7        Final plan approved                         T5 + board
Q4 Week 8        Annual plan communicated to org             CEO all-hands
Q4 Week 10       Q1 planning begins (PB-005)                 PM Org
```

---

## Strategic Context Session (Q3 Week 6)

**Participants:** CEO, CPO, CTO, CAIO, CFO, Strategy Org
**Duration:** Half day
**Purpose:** Establish shared strategic context before OKR setting begins

### Agenda
```
TOPIC                                         SOURCE                     DURATION
────────────────────────────────────────────────────────────────────────────────────────────
Market analysis: competitive landscape        Strategy Org               45 min
Technology trajectory: AI + platform trends   CTO + CAIO                 30 min
Customer intelligence: what customers need    VP CS + analytics-agent    30 min
Regulatory horizon: upcoming obligations      DPO                        20 min
Org health review: team performance trends   HRBP + analytics-agent     20 min
Previous year: what worked, what didn't       CEO facilitated            45 min
Strategic questions for next year             CEO                        30 min
```

**Output:** Strategic context memo (2 pages max)
`wiki/strategy/{year}/strategic-context.md`

---

## Executive Strategy Workshop (Q3 Week 12, 2 days)

**Participants:** All T4/T5 executives; facilitator (external or Chief of Staff)
**Format:** Off-site preferred; in-person required

### Day 1: Retrospective + Context
```
SESSION 1 (3hr): Annual retrospective
  - Year-in-review: achievements, misses, surprises
  - OKR assessment: hit rate analysis; what drove success/failure?
  - Org health trends: teams, capability, culture
  - Customer health trends: NPS, churn, escalation patterns

SESSION 2 (3hr): Strategic context deep-dive
  - Market and competitive position
  - Technology trajectory (AI, platform, infrastructure)
  - Regulatory landscape (EU AI Act enforcement 2026-08-02 for current planning)
  - Financial performance vs. prior targets
```

### Day 2: Forward Planning
```
SESSION 3 (3hr): Strategic bets
  - What are our 3–5 strategic bets for next year?
  - Which bets are "must win" vs. "explore"?
  - What would we have to be true for each bet to succeed?
  - What would we stop doing to free up capacity?

SESSION 4 (3hr): OKR and resource framework
  - Draft company-level OKRs (3–5 objectives, 2–4 KRs each)
  - Resource allocation: headcount and budget by org
  - Interdependencies: which bets depend on which orgs?
  - Risk register: top 5 risks for next year

SESSION 5 (1hr): Alignment check
  - Final review: are these the right bets?
  - Any fundamental disagreements? Document dissent.
  - Next steps: who drafts what, by when
```

**Output:** `wiki/strategy/{year}/workshop-outcomes.md`

---

## Company OKR Framework

### OKR Design Standards
```
OBJECTIVE QUALITY CRITERIA:
  ✓ Qualitative; aspirational but grounded
  ✓ 12-month horizon
  ✓ Clearly owned by a VP or CEO
  ✓ Directionally aligned to at least one strategic bet
  ✗ Not a project or milestone ("launch X")
  ✗ Not a metric (that's the KR)

KEY RESULT QUALITY CRITERIA:
  ✓ Measurable: number + unit + baseline + target
  ✓ Outcome-oriented (not output-oriented)
  ✓ 60–70% stretch (if confident you'll hit, it's too easy)
  ✓ Attributable to this team's work (not pure market movements)
  ✗ Not binary (avoid "yes/no" KRs)
  ✗ Not vanity metrics (page views, downloads without engagement signal)
```

### OKR Hierarchy
```
LEVEL          OWN BY         COUNT         REVIEW CADENCE
──────────────────────────────────────────────────────────────────────────────
Company        CEO            3–5 Objectives Weekly (exec sync)
Organization   VP             2–4 per VP     Monthly (exec review)
Team           T3 PM Lead     2–3 per team   Weekly (PM sync) + QBR
```

### OKR Cascade Rules
```
RULE 1: Bottom-up input before top-down cascade
  → Teams submit aspirational goals first; leadership shapes around team input

RULE 2: Every company OKR maps to ≥ 1 org OKR; every org OKR maps to ≥ 1 team OKR
  → No orphaned OKRs at any level; full traceability required

RULE 3: No team has > 3 objectives
  → Focus over completeness; say no to good ideas

RULE 4: Tech health is always an OKR
  → Every plan includes reliability, quality, or tech debt objective
  → Non-negotiable; cannot be eliminated in resource trade-offs

RULE 5: AI governance is an OKR if AI systems are in scope
  → EU AI Act compliance milestone included for all AI-deploying teams
```

---

## Headcount and Budget Planning (Q4 Week 4)

### Headcount Planning Process
```
BOTTOM-UP:
  Each VP submits headcount plan by role and quarter with justification:
    - Backfills: replacing departures (no net new; like-for-like approval)
    - Growth: new roles to drive OKR (requires ROI justification)
    - Tech debt: roles for platform and reliability work
    - Regulatory: compliance-driven roles (DPO + CISO input)

TOP-DOWN CONSTRAINT:
  CFO provides total headcount budget envelope
  If bottom-up > top-down: trade-off session required

PRIORITIZATION (when over budget):
  P1: Regulatory / compliance (mandatory; non-negotiable)
  P2: Revenue-generating roles (direct customer impact)
  P3: Platform / reliability (deferred harms reliability; CFO + CTO negotiate)
  P4: Exploratory / research (first cut in constraint)
```

### Budget Planning
```
CATEGORIES (standard):
  Personnel costs (salaries + benefits + contractors)
  Infrastructure (cloud, tools, licenses)
  External services (APIs, data providers, compliance tools)
  Travel + off-sites (planning sessions, customer visits)
  Training + development

GOVERNANCE:
  Personnel: T5 final approval; CFO models; VP requests
  Infrastructure: T4 VP Eng approval; quarterly true-up
  > $50K new vendor: T4 approval + security review + DPO (if data processing)
```

---

## Cross-Function Alignment Session (Q4 Week 5)

**Participants:** CPO + CTO + CFO + VP CS + VP Eng
**Duration:** Half day
**Purpose:** Resolve conflicts before board review

```
ALIGNMENT AGENDA:
  1. OKR conflicts: where do org OKRs pull in different directions?
  2. Resource conflicts: who is over-allocating? Who is under-resourced?
  3. Platform vs. product tension: how much engineering serves platform vs. features?
  4. Customer commitment review: what has CS promised? Is it in the plan?
  5. Regulatory timeline: DPO confirms compliance items are funded
  6. AI governance: CAIO confirms EU AI Act milestones are resourced

DECISION RULES:
  Revenue protection > tech debt reduction > new features (default priority order)
  Regulatory requirements cannot be de-funded; escalate to CEO if budget conflict
  Customer commitments override internal priorities; CS Lead holds veto on their accounts
```

---

## Board Review (Q4 Week 6)

**Participants:** CEO, CFO, CPO, CTO; Board observers/members
**Duration:** 3 hours

```
BOARD REVIEW PACKAGE (submitted T-5 days):
  1. Company strategy narrative (2 pages)
  2. Prior year performance vs. plan (with candid assessment)
  3. Proposed company OKRs for next year
  4. Budget proposal by org
  5. Key risks + mitigation
  6. Major bets: what we're doubling down on vs. stopping
  7. Regulatory landscape and compliance plan (DPO section)
  8. AI governance plan (CAIO section)

BOARD OUTCOMES:
  APPROVED:        Proceed with plan as presented
  APPROVED_WITH:   Conditions documented; adjustments due within 2 weeks
  MORE_ANALYSIS:   Board wants deeper dive; delay final approval
  OBJECTION:       Major strategic disagreement; CEO drives resolution
```

---

## Plan Communication (Q4 Week 8)

**All-Hands Presentation by CEO**
```
CONTENT:
  1. "What we achieved this year" (honest assessment)
  2. "What we learned" (2–3 key insights)
  3. "Our strategic bets for next year" (narrative, not slides)
  4. "Our company OKRs" (all 3–5; explained in plain language)
  5. "What this means for your team" (each org gets 2-min summary)
  6. "How we'll track progress" (quarterly reviews, transparency)

FOLLOW-UP:
  T3+ receives full plan details (OKRs + headcount + budget summary)
  T2 receives OKRs + team-level breakdown
  T1 receives company OKRs + what changed from last year
```

---

## Annual Planning Governance

```
C-001: Strategic and resource decisions made by human leadership; AI provides analytics
C-004: Annual plan, OKRs, and all trade-off decisions permanently recorded in wiki
OKR_BASELINES: Every KR must have an established baseline before Q1 starts
BOARD_ALIGNMENT: No company OKR changes without T5 notification; board changes require re-approval
REGULATORY_INCLUSION: Compliance and AI governance work must be in plan if obligations exist
HEADCOUNT_COMMITMENT: Approved headcount is a binding commitment; changes require T4 re-approval
TRANSPARENCY: All OKRs published to T2+ within 1 week of board approval; no stealth goals
```

## Health Metrics

```
METRIC                                      TARGET
──────────────────────────────────────────────────────────────────────────────────────────
Annual planning cycle completion            On time (Q4 Week 8 communicate)
Company OKR quality score (AI assessment)   >= 80% meet OKR design standards
OKR traceability (team ↔ company)          = 100%
Budget approved on time                     Before Q1 Day 1
Year-end OKR achievement rate               65–80% (lower = too ambitious; higher = too safe)
Mid-year plan material change rate          < 0.20 (high = planning quality issues)
Board approval without rework               >= 0.85 (low = alignment issues)
```

## Workflow Integrations

```
WF-002  Annual Planning    → this playbook operationalizes WF-002
WF-003  Quarterly Planning → annual plan is the input to PB-005 (quarterly planning)
WF-004  Roadmap Governance → major annual roadmap changes use WF-004
WF-014  Compliance Review  → annual plan includes compliance obligations from WF-014
WF-006  AI Feature Deliv   → AI governance milestones in annual plan from WF-006
WF-020  Org Evolution      → headcount changes > 10 people trigger WF-020
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
Top-down OKRs without team input            No ownership; team gaming metrics
OKRs set too late (Q4 Week 12+)            Q1 unplanned; teams reactive
No tech health OKR                          Reliability debt compounds; incidents increase
Budget approved but headcount not           Underfunded OKRs; teams stretched thin
OKRs never reviewed mid-year               Surprises at year-end; no course correction
All OKRs green every year                  No stretch; org stagnates; talent leaves
Planning done in isolation from compliance  Regulatory surprises mid-year; expensive fixes
```
