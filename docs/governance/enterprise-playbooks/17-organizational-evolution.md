# PB-017: Organizational Evolution

**Version:** 1.0.0 | **Owner:** Executive + People Org | **Cadence:** On-trigger | **Tier:** T4 | **Class:** SENSITIVE

## Purpose
Govern structural changes to the organization — team formation, dissolution, restructuring, leadership changes, reporting line changes, and role eliminations — ensuring changes are made with evidence, appropriate authority, legal compliance, humane communication, and sufficient transition support to minimize delivery disruption and human harm.

## Scope

```
THIS PLAYBOOK GOVERNS:
  ✓ New team formation (>= 3 people or budget allocation)
  ✓ Team dissolution or merger (any size)
  ✓ Reporting line changes (moving teams between leaders)
  ✓ Role elimination / position reduction (individual or group)
  ✓ Leadership transition (hiring/departing at T3+)
  ✓ Business unit restructuring (crossing multiple teams)
  ✓ Functional reorg (changing the org model, not just boxes)

DOES NOT GOVERN:
  ✗ Individual performance management (handled by People Ops)
  ✗ Standard backfill hiring (WF-020 handles headcount)
  ✗ Individual manager changes below T3 (People Ops + T3 manager)
  ✗ Contract or vendor staff changes (Procurement + Legal)
```

---

## Change Classification

```
CLASS           SCOPE                                    AUTHORITY   PROCESS
──────────────────────────────────────────────────────────────────────────────────────────────
MINOR           1–4 people; reporting line only          T3 + People  Simplified (no WF-020)
MODERATE        5–15 people OR role changes              T4 + People  Full process; no board
MAJOR           16–50 people OR multiple teams           T4 + CEO     WF-020; board briefing
SIGNIFICANT     > 50 people OR BU-level restructure      T5 + Board   WF-020; board approval
CRITICAL        > 100 people OR major workforce action   T5 + Board + Legal  Board approval required
```

---

## Organizational Evolution Triggers

```
TRIGGER                             CLASS       TYPICAL TIMELINE
──────────────────────────────────────────────────────────────────────────────────────────────
New product area requires team       MINOR–MOD   Plan in quarterly review; execute in 4–6 weeks
Acquisition integration              MAJOR–SIG   60–90 day integration plan
Technology shift (no longer need X) MODERATE    45-day plan; document rationale
Org growth creates span of control   MINOR       30-day plan; no layoffs
Financial constraint / cost target   MAJOR–SIG   Legal review; 60-day plan minimum
Leadership departure (T3+)          MODERATE    45 days to stabilize + succession
Strategy pivot (change OKRs)        MOD–MAJOR   Align structure to new strategy
Team consistently missing OKRs      MINOR–MOD   Performance + structure assessment first
```

---

## Organizational Change Process

### Phase 1: Diagnosis and Design (Weeks 1–2)

```
STEP 1: Trigger assessment
  - Who identified the need? What evidence supports it?
  - Classify the change (MINOR through CRITICAL)
  - Confirm authority level required

STEP 2: Impact analysis
  - How many people affected?
  - Which teams? Which products? Which customers?
  - What are the delivery dependencies? (→ PB-015 dependency register)
  - What is the cost of change vs. cost of status quo?

STEP 3: Design options
  - Develop 2–3 structural options (not just one)
  - Model each option: team composition, reporting, ownership, gaps
  - Evaluate: Conway's Law alignment (does structure match system architecture?)
  - Evaluate: bus factor impact (does change increase knowledge concentration?)
  - Evaluate: delivery continuity (which sprints are disrupted? for how long?)

STEP 4: Legal and HR review
  - Any role eliminations → Legal required before any communication
  - Any redundancies → local labor law review (jurisdiction-specific)
  - Any severance obligations → Finance + Legal
  - Any equity implications → Legal + Finance
```

### Phase 2: Approval and Planning (Weeks 2–3)

```
STEP 5: Authority approval
  MINOR: T3 manager + Chief People Officer approval
  MODERATE: T4 VP approval + Chief People Officer
  MAJOR: CEO + Chief People Officer + Board briefing (not approval)
  SIGNIFICANT/CRITICAL: Board approval required before any action

STEP 6: Communication plan
  - Who is told first? (Individuals affected → their teams → broader org)
  - What is the message? (Honest, clear, no spin)
  - Who delivers the message? (Manager, T4+, or CEO for large changes)
  - When are individuals told vs. when is org told? (same day for large changes)
  - What support is offered? (transition support, severance, references)
  - What is the FAQ? (prepare before communication, not after)

STEP 7: Transition plan
  - Knowledge transfer plan: who knows what, who needs to know what
  - Customer impact plan: any customers affected by people changes?
  - Product continuity plan: which features/systems need handoff?
  - New team formation: charter, OKRs, reporting, Jira board, Slack channel
```

### Phase 3: Execution (Weeks 3–6 depending on class)

```
STEP 8: Individual notifications (BEFORE any org-wide announcement)
  - All affected individuals: same business day (not same hour if staggered)
  - Notification = 1:1 conversation (not email); manager present
  - HR representative available that day for questions
  - Documentation: each notification logged with time + confirmation received

STEP 9: Team notifications
  - Within 24 hours of individual notifications
  - Team meeting with T4+ leader present
  - Written summary distributed immediately after meeting
  - Q&A time: minimum 30 minutes

STEP 10: Org-wide communication
  - Within 24 hours of team notifications
  - CEO or T4+ communication for MAJOR+
  - FAQ published same day in wiki

STEP 11: Transition execution
  - Reporting lines updated in HRIS same day as announcement
  - Access + permissions updated within 24 hours
  - New team charter published within 1 week
  - Jira projects, Slack channels, GitHub teams updated within 1 week
  - Departure offboarding if applicable: 2-week overlap minimum if possible
```

### Phase 4: Stabilization (Weeks 6–14)

```
STEP 12: 30-day health check
  - Morale pulse: short survey to affected teams
  - Delivery velocity: has it dropped? (target: < 20% drop; recover within 4 weeks)
  - On-call stability: no increase in escalations attributable to change
  - Customer impact: no customer escalations due to team change

STEP 13: 60-day review
  - Is the new structure working? (evidence: velocity, health, collaboration)
  - Any unintended consequences? (new bottlenecks, knowledge gaps)
  - Adjustments needed? → Minor adjustments via T3 approval; major → restart process

STEP 14: 90-day confirmation
  - New structure confirmed as permanent (or identified for further change)
  - All transition documents updated: org chart, runbooks, ownership registry
  - Post-change retrospective filed: wiki/org-evolution/{change_id}/retro.md
```

---

## Change Communication Standards

### What to Say
```
REQUIRED ELEMENTS:
  What is changing and why (honest; not PR-polished)
  Who is affected and how (specific, not vague)
  What happens next and when (timeline, not "soon")
  Where to get support (HR contact, manager, resources)
  What is NOT changing (stability anchors reduce anxiety)

FORBIDDEN:
  "We're doing this for you" — say why the business needs it
  "This is good news" — let people have their reaction
  "This will make us stronger" — may be true; don't say it in notification
  Vague language: "transition," "evolution," "right-sizing" — be specific
```

### Tone Standard
```
NOTIFICATION MEETING:
  Factual → Empathetic → Specific → Supportive
  NOT: apologetic, defensive, cheerful, rushed

WRITTEN FOLLOW-UP:
  One page maximum
  No jargon
  Include FAQ section
  Direct contact for questions
```

---

## Severance and Exit Standards

```
ROLE ELIMINATION MINIMUMS (consult Legal for jurisdiction-specific requirements):
  < 2 years tenure:      2 weeks notice OR severance in lieu
  2–5 years tenure:      4 weeks notice OR severance in lieu
  5+ years tenure:       8 weeks notice OR severance in lieu + T3 review of exception
  T3+ leader departing:  Individual negotiation; Legal required

VESTING:
  Unvested equity: per contract; Legal reviews all exceptions
  Accelerated vesting: T4 approval required; rare

TRANSITION SUPPORT:
  Outplacement services: offered for all involuntary exits
  Reference policy: company confirms role and tenure; no disparagement
  Alumni access: Slack alumni channel for 90 days post-departure
```

---

## Governance Checkpoints

```
C-001: Organizational change decisions are human decisions; no AI autonomy over people
C-004: All org change records permanently retained in HR system and wiki
LEGAL: Role eliminations require Legal review before notification; no exceptions
SAME_DAY: All affected individuals notified same business day for changes > 5 people
COMMUNICATION: No org announcement before all individuals are notified
DELIVERY: Change plan must address delivery continuity; no change without transition plan
AUTHORITY: MAJOR+ changes require CEO approval before any action; no "ask forgiveness"
```

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Individual notifications: same-day rate  = 100% (MODERATE+ changes)
Delivery velocity drop post-change       < 20%; recovery < 4 weeks
Post-change attrition (unplanned, 90d)  < 10% of affected team
90-day health check completed            = 100%
Change retros filed                      = 100%
Legal pre-review for role eliminations   = 100%
```

## Workflow Integrations

```
WF-020  Org Evolution  → this playbook operationalizes WF-020
PB-013  Org Reviews    → org review findings may trigger this playbook
PB-006  Annual Planning → planned structural changes managed through annual planning
PB-009  Onboarding     → new teams formed via this process use PB-009 for new hires
PB-012  Escalation     → any blocked change (legal hold, employee issue) escalates via PB-012
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
Restructure decided Friday; announced Monday  Legal exposure; no support; trust destroyed
"Let's just move the boxes and see"           Confusion; no ownership; delivery chaos
Announcing before individuals told           Information asymmetry; people learn from Slack
Severance negotiated verbally               Disputed later; legal liability
No transition plan for departing T3+        Knowledge cliff; customer impact
Change implemented without delivery plan    Sprints miss; customers impacted
"We'll explain the why later"               Speculation and distrust fill the vacuum
```
