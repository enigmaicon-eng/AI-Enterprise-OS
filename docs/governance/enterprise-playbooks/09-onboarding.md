# PB-009: Onboarding

**Version:** 1.0.0 | **Owner:** People + Engineering Org | **Cadence:** Per-hire | **Tier:** T2 | **Class:** STANDARD

## Purpose
Bring every new team member to full productivity efficiently and consistently — through a structured 90-day program that builds technical context, organizational knowledge, relationship networks, and contribution cadence, while protecting the team from onboarding-as-an-afterthought.

## Onboarding Program Overview

```
PHASE         DURATION     GOAL                              PRODUCTIVITY TARGET
──────────────────────────────────────────────────────────────────────────────────────────
ORIENTATION   Week 1       Understand the org, tools, and   0% delivery (learning only)
                           systems; meet key people
CONTEXT       Weeks 2–4    Deep-dive into domain, codebase,  20% delivery capacity
                           workflows, and operating model
CONTRIBUTION  Weeks 5–8   Deliver first meaningful work;    50% delivery capacity
                           pair with teammates
INTEGRATION   Weeks 9–17  Full sprint participation;        75% delivery capacity
                           independent ownership of work
FULL_RAMP     Week 18+    Full capacity; full ownership;   100% delivery capacity
                           potential to mentor next hire
```

---

## Pre-Arrival Checklist (T-5 to T-1 business days)

**Owner:** Hiring Manager + People Ops

```
PEOPLE + SYSTEMS:
  □ IT: laptop provisioned; accounts created (email, Jira, Slack, GitHub/GitLab)
  □ Access: role-appropriate system access configured (principle of least privilege)
  □ Onboarding buddy assigned (peer; ≠ manager; same domain)
  □ 30/60/90-day plan drafted by hiring manager
  □ First-week calendar pre-populated (no blank spots)
  □ Team introduction Slack message drafted (manager sends Day 1)

CONTEXT PACKAGES (prepared by PM-agent + knowledge-agent):
  □ Org chart and team structure
  □ Active sprint plan and current OKRs
  □ Relevant ADRs and architectural overview
  □ Runbook and operational guide
  □ Key stakeholder map (who to know; who decides what)
  □ Compliance briefing (data classification, security policies, NDA signed)
```

---

## Week 1: Orientation

**Goal:** Functional (can use all tools); oriented (understands the org)
**Delivery target:** 0% — no sprint work; full focus on learning

```
DAY 1: Welcome Day
  AM: HR orientation (policies, benefits, compliance briefing)
  AM: Security + access training (mandatory: data classification, phishing awareness)
  PM: Manager 1:1 (role expectations, 90-day success criteria, working style)
  PM: Team lunch / virtual intro
  PM: Self-guided: read SYSTEM.md and CLAUDE.md

DAY 2: Systems + Tooling
  AM: IT setup (verify all access working; escalate gaps same day)
  AM: Development environment setup (buddy assists)
  PM: Key tools walkthrough: Jira, Slack, GitHub, monitoring dashboards
  PM: First PR: documentation fix (low-stakes contribution; gets them through the pipeline)

DAY 3: Organization Context
  AM: Read: active OKRs (team + company), current sprint plan
  AM: Review: last 3 sprint retrospectives (understand team operating model)
  PM: Architecture overview session (Domain Architect, 90 min)
  PM: Buddy 1:1 (informal; anything confusing)

DAY 4: Domain Deep-Dive
  AM: Product context: PM 1:1 (what are we building and why?)
  AM: Customer context: CS brief (who are our customers; what problems do they have?)
  PM: Analytics orientation: what metrics matter; how do we measure success?
  PM: Read: 3 recent postmortems (understand how the team handles failure)

DAY 5: Governance + Culture
  AM: Compliance orientation (DPO brief if data-processing role; 30 min)
  AM: AI governance orientation (if role touches AI systems; CAIO or delegate)
  PM: 1:1 with hiring manager: week 1 check-in (what's confusing? what's missing?)
  PM: Set up: personal learning plan for weeks 2–4
```

---

## Weeks 2–4: Context Building

**Goal:** Contributing to discussions; understanding the codebase; first real deliverable
**Delivery target:** 20% of full capacity

```
ACTIVITIES:
  Sprint participation: attend all ceremonies (no assignment until week 3)
  Code reading: review recent PRs to understand code patterns
  Shadow sessions: sit in on architecture review, PM sync, incident retrospective
  Starter task: assigned in week 3 (small, clearly scoped, pair-supported)
  Documentation: new hire writes down anything confusing → improves onboarding docs

STARTER TASK CRITERIA:
  Well-defined scope (no ambiguity)
  Clear acceptance criteria (PM has written it)
  Buddy available for questions (not away on holiday)
  Rollback possible (low production risk)
  Estimated at S or M (not L or XL)
  Domain: familiar territory for the new hire's background

WEEK 4 CHECKPOINT (Hiring Manager 1:1, 45 min):
  Review: 30-day plan progress
  Assess: any access gaps, knowledge gaps, relationship gaps?
  Calibrate: is 20% capacity target realistic? Adjust if needed
  Confirm: first real sprint assignment for week 5
```

---

## Weeks 5–8: Contribution Phase

**Goal:** Self-sufficient on well-defined tasks; proactively asking questions
**Delivery target:** 50% of full capacity

```
SPRINT PARTICIPATION:
  Full sprint ceremonies (planning, standup, review, retro)
  Sprint assignment: 3–4 stories per sprint (vs. team average 5–6)
  Code review: reviewer (not just reviewee) by week 6
  Architecture: invited to RFC discussions; encouraged to ask questions

OWNERSHIP MILESTONES:
  Week 5: First solo story completed with minimal handholding
  Week 6: First code review approved without revisions
  Week 7: Presents sprint demo item independently
  Week 8: Files first Jira issue independently (identified a bug or gap)

60-DAY CHECKPOINT (Hiring Manager 1:1, 60 min):
  Review: 60-day plan progress
  Assess: performance signals (code quality, communication, problem-solving)
  Feedback: specific and actionable; not vague
  Plan: what needs to happen in weeks 9–17 for full ramp?
  Decision: is the hire on track? (if not: formal performance plan or escalation)
```

---

## Weeks 9–17: Integration Phase

**Goal:** Full sprint ownership; growing independence; mentoring readiness
**Delivery target:** 75% of full capacity

```
SPRINT PARTICIPATION:
  Full load (75% of team average story point allocation)
  Architecture: can explain their own design choices in code review
  Incident on-call: shadow rotation (not primary yet)
  PM collaboration: contributes to story grooming and acceptance criteria

OWNERSHIP MILESTONES:
  Week 10: Owns full feature end-to-end (design → build → test → deploy)
  Week 12: Joins on-call shadow rotation
  Week 14: Runs a sprint demo independently
  Week 16: Contributes to team retrospective as facilitator or note-taker
  Week 17: Identified stretch goal for full ramp phase

90-DAY CHECKPOINT (Hiring Manager + Skip-Level 1:1, 60 min):
  Formal 90-day review: achievements vs. 90-day success criteria
  Performance signal: is hire meeting role expectations?
  Growth plan: what are the next 6–12 month development goals?
  Decision: full ramp confirmed or adjusted plan for 30 additional days
  Documentation: 90-day summary saved to people intelligence records
```

---

## Onboarding Buddy Protocol

**Assignment:** Buddy assigned before Day 1; confirmed available week 1–4 at minimum

```
BUDDY RESPONSIBILITIES:
  Answer "silly" questions without judgment
  Introduce new hire to people organically (no formal intros meeting)
  Check in informally 2× per week for first 4 weeks
  Flag any concerns to hiring manager (not new hire) proactively
  Be honest about unwritten norms and culture

BUDDY COMMITMENTS:
  Available 30–60 min/week (scheduled blocks, not ad-hoc)
  Not on vacation week 1 of new hire
  Not themselves ramping from another onboarding (no stacking)

BUDDY ROTATION:
  Each engineer buddies ≤ 2 new hires per year (not more; quality degrades)
  Buddy experience adds to skill graph (people-intelligence/skill-graph.md)
```

---

## Documentation Improvement Protocol

```
"CONFUSED? WRITE IT DOWN" RULE:
  Every new hire is required to document any confusing process, unclear doc, or
  missing context they encounter during onboarding.

  Format: simple Jira issue: "Onboarding gap — [what was confusing]"
  Owner: Onboarding Coordinator triages weekly
  Action: Fix documentation or update process within 1 sprint

OUTCOME:
  Onboarding docs improve with every hire
  New hires feel their confusion is valued (not penalized)
  Onboarding quality metric: measure via exit survey at Day 90
```

---

## Role-Specific Onboarding Tracks

### Engineering Track (additional)
```
Week 1: Local development environment fully operational
Week 2: First PR merged (no matter how small)
Week 3: First code review submitted to peer
Week 4: Can run all test suites locally
Week 8: On-call shadow completed (1 full rotation)
Week 12: Can deploy to staging independently
Week 17: Can deploy to production with supervisor sign-off
```

### PM Track (additional)
```
Week 1: Active sprint board mastered; attended all ceremonies
Week 2: Shadowed customer call or CS escalation
Week 3: Wrote first user story (reviewed by senior PM)
Week 4: Facilitated standup for one day
Week 8: Owns one feature from discovery to backlog
Week 12: Runs sprint review independently
Week 17: Drives roadmap item from problem → shipped feature
```

### Compliance / DPO-Adjacent Track (additional)
```
Week 1: Data classification training complete
Week 2: DPO briefing on GDPR + EU AI Act obligations
Week 3: Reviewed 2 recent compliance reviews (WF-014)
Week 4: Understands AI system registry and classification process
Week 8: Participated in one compliance review meeting
```

---

## Governance Checkpoints

```
C-001: Hiring manager makes all 30/60/90-day decisions; AI supports with analytics
C-004: Onboarding records and checkpoint decisions permanently documented
SECURITY: Security + compliance training mandatory in week 1; no exceptions
ACCESS: Principle of least privilege; access granted incrementally, not all on day 1
BUDDY: No new hire starts without an assigned buddy; hiring manager blocked if not assigned
DATA_CLASSIFICATION: New hires cannot access CONFIDENTIAL+ systems until training complete
```

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────
Time to first PR (engineering)           <= 5 days
Time to first story complete (solo)      <= 4 weeks
90-day ramp completion rate              >= 0.85 (15% may need extra 30 days)
Onboarding satisfaction score (Day 90)   >= 4.0/5.0
Documentation gaps filed per hire        >= 3 (low = not engaging; gaps undetected)
Buddy assignment rate (Day 1)            = 100%
90-day retention rate                    >= 0.90
Security training completion (Week 1)    = 100%
```

## Workflow Integrations

```
WF-020  Org Evolution      → new hires from headcount decisions in WF-020 onboarded via this playbook
PB-002  PM Cadence         → new hires integrated into sprint ceremonies from week 2
PB-003  Architecture Council → new engineers attend (shadow) from week 3
PB-007  AI Governance      → AI-adjacent roles get AI governance briefing in week 1
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
No pre-arrival setup (laptop not ready)     First day is dead time; early trust broken
"Figure it out" onboarding                 New hire takes 6 months to ramp; may leave
Buddy not available week 1                  New hire isolated; questions unanswered
90-day checkpoint skipped                   Performance issues undetected; late surprises
Sprint loading to 100% in week 5           Carry-over; quality issues; new hire stressed
Onboarding docs never updated              Same gaps hit every hire; morale issue
No role-specific track                      Generic onboarding misses domain knowledge
```
