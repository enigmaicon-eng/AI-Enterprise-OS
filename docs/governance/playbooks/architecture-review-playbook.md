---
type: playbook
id: PLAY-ARCH-REVIEW
version: "1.0"
cadence: per L-tier feature | per RFC acceptance | on-demand
created: 2026-05-08
updated: 2026-05-08
owner: architect-agent
participants: [architect-agent, engineer-agent, security-agent, pm-agent, supervisor-agent]
estimated-duration: 2–5 days
---

# Architecture Review Playbook

The process from "we have a design" to "ADR accepted and implementation may begin." This playbook applies to every Tier-L engineering initiative and any initiative that changes a cross-team interface, data model, or security boundary.

**Entry condition:** PRD approved (G1 gate passed) AND design proposal exists (RFC draft or design doc).
**Exit condition:** ADR accepted OR rejected with documented rationale. If accepted: implementation plan can begin.

**Skip condition:** XS and M-tier work with no cross-team interface change and no schema change does not require this playbook — use `workflows/architecture-workflow.md` for lightweight ADR creation only.

---

## When to Run This Playbook

Run the full playbook when ANY of the following is true:
- Work is classified Tier-L
- Change introduces a new API (internal or external)
- Change modifies an existing API in a potentially breaking way
- Change modifies a shared database schema
- Change crosses team or service boundaries
- Change touches authentication, authorization, or encryption
- Change introduces a new external dependency
- Change affects system-wide performance characteristics

---

## Phases Overview

| Phase | Name | Duration | Owner | Output |
|-------|------|---------|-------|--------|
| 1 | Proposal preparation | 1 day | engineer-agent | RFC draft or design doc |
| 2 | Pre-review async | 1–2 days | all reviewers | Written comments |
| 3 | Synchronous review | 2 hours | architect-agent | Review findings |
| 4 | Decision & ADR | 0.5 day | architect-agent | ADR accepted/rejected |
| 5 | Conditions tracking | ongoing | delivery-agent | Conditions closed |

---

## Phase 1 — Proposal Preparation (1 day)

**Owner:** engineer-agent (with architect-agent support)

### 1.1 What Must Be in the Proposal

Before scheduling a review, the proposal must contain all of the following. Incomplete proposals are returned — not reviewed.

- [ ] Problem statement: what is being solved and why this design
- [ ] System diagram: ASCII or linked diagram showing component interactions before and after
- [ ] Data model changes: schema diff using `+` / `~` / `-` notation
- [ ] API changes: new/modified/removed endpoints with before/after
- [ ] At least 2 alternatives evaluated with specific reasons for rejection
- [ ] Security considerations: STRIDE check, at minimum brief
- [ ] Performance considerations: latency and throughput impact
- [ ] Migration plan (if breaking change): phased rollout with consumer impact table
- [ ] Open questions: questions the author knows are unresolved

**Template:** `templates/architecture-review-template.md`

### 1.2 Anti-Strawman Rule

Alternatives must be genuine. An alternative that is obviously broken (e.g., "Alternative B: do nothing — too slow") is not a valid alternative. Each alternative must reflect an approach someone could reasonably advocate for.

If you can't produce two serious alternatives, you haven't thought about the design space enough yet. Find someone to challenge your assumptions before writing the proposal.

### 1.3 Proposal Routing

Once draft is complete:
1. Save to: `architecture/proposals/<date>-<slug>.md`
2. Notify architect-agent: proposal is ready for review scheduling
3. Notify security-agent: flag if proposal involves auth, data, or new attack surface
4. Notify affected team leads: they must either review or explicitly delegate

---

## Phase 2 — Pre-Review Async (1–2 days)

**Owner:** all reviewers read independently before the synchronous session

**Purpose:** Quality reviews come from people who read the proposal carefully, not from people who encounter it cold in a meeting.

### 2.1 Reviewer Assignments

| Reviewer | Always | Conditional |
|---------|--------|------------|
| architect-agent | Yes | — |
| security-agent | If auth / data / new attack surface | — |
| engineer-agent (affected) | If change touches their codebase | — |
| pm-agent | If change affects user-visible behavior or delivery timeline | — |
| supervisor-agent | If cross-org impact or architectural risk is HIGH | — |

### 2.2 Pre-Review Checklist (Per Reviewer)

Each reviewer answers these questions in writing before the sync:

```
1. What is my overall assessment? (Strong approve / Weak approve / Neutral / Weak reject / Strong reject)

2. What is the most important thing I want to discuss?

3. Are there any blocking issues that would prevent me from approving?
   (A blocking issue is one where the design must change, not just a preference)

4. What am I uncertain about that the author should clarify?

5. What's good about this design that should be preserved in any revision?
```

Comments are posted to the proposal doc or linked review document. The architect-agent reads all comments before the sync and identifies:
- Themes (multiple reviewers flagging the same concern)
- Genuine conflicts (reviewers disagree — needs discussion)
- Questions that the author can answer in writing before the sync

### 2.3 Pre-Review Resolution

If a reviewer's concern can be resolved by a clarification or small change — resolve it before the sync. Sync time is for genuine disagreements and design tradeoffs, not factual corrections.

The author may update the proposal in response to pre-review feedback. Substantive changes that affect the design decision require re-review.

---

## Phase 3 — Synchronous Review (2 hours)

**Owner:** architect-agent (facilitates)
**Required attendees:** author + architect-agent + any reviewer with a blocking comment

**Not a status meeting.** The sync exists only to resolve disagreements, evaluate tradeoffs, and make a decision. Points that are already resolved or non-controversial are not discussed.

### Agenda

```
00:00 – 00:10  Author presents: what changed since the proposal was posted (5 min)
               + top 2 open questions they want input on (5 min)
               [No full design walkthrough — reviewers have already read it]

00:10 – 00:40  Blocking issues: each blocking reviewer states their concern
               Author responds; group discusses
               Architect-agent drives toward resolution or explicit disagreement

00:40 – 01:10  Tradeoff discussion: unresolved design choices
               Use weighted scoring matrix if multiple serious options remain
               (Criteria: scalability / reliability / security / operability / maintainability / cost)

01:10 – 01:40  Security review (if security-agent present):
               STRIDE walkthrough of new attack surface
               Any security non-negotiables stated explicitly

01:40 – 01:55  Conditions discussion:
               If approve with conditions: state each condition precisely
               Assign owner and deadline for each condition

01:55 – 02:00  Verdict: architect-agent states the preliminary decision
```

### Weighted Scoring Matrix (When Needed)

Use when two or more alternatives are still serious candidates at the start of the sync.

```
Criteria         Weight   Option A   Option B   Option C
Scalability        20%       8          6           7
Reliability        20%       7          8           6
Security           20%       9          7           8
Operability        15%       6          8           7
Maintainability    15%       7          6           8
Cost               10%       8          7           6
Total             100%      7.5        7.0         7.1
```

**Tiebreaker:** When scores are within 10% of each other, prefer the more reversible option.

### Review Meeting Rules

- Architect-agent decides — review is consultative, not a vote
- Reviewer role: surface concerns and information; author role: respond accurately; architect role: weigh and decide
- "I don't like it" is not a blocking comment — it must be stated as a specific risk or failure mode
- If a concern can't be articulated as a failure mode, it is a preference, not a block
- New concerns raised for the first time in the sync (not in pre-review) carry less weight — reviewers had their chance

---

## Phase 4 — Decision & ADR (0.5 day)

**Owner:** architect-agent

### 4.1 Verdict Options

| Verdict | Meaning | Next Step |
|---------|---------|-----------|
| **Approved** | Design is accepted as-is | Write ADR; implementation may begin |
| **Approved with conditions** | Design is accepted pending specific changes | Write ADR with conditions; implementation begins when conditions are met |
| **Needs revision** | Design has blocking issues that require a rework | Author revises; lightweight re-review (async) |
| **Rejected** | Design is fundamentally not viable | Author starts a new proposal; lessons documented |

### 4.2 ADR Creation

For every Approved or Rejected decision, architect-agent writes an ADR:

**File:** `architecture/decisions/ADR-<NNN>-<slug>.md`

**Required sections:**
- Context: what problem this ADR addresses
- Decision: exactly what was decided (affirmative statement)
- Rationale: the specific reasons, not just "it's better"
- Alternatives rejected: each with specific reasons
- Consequences: what this decision makes easier, harder, or impossible
- Conditions (if conditional): specific and time-bound

**ADR numbering:** Sequential, no gaps, no reuse. Check the last ADR in `architecture/decisions/` for the next number.

### 4.3 Register the Decision

- [ ] ADR saved to `architecture/decisions/ADR-<NNN>-<slug>.md`
- [ ] Decision indexed in `memory/architecture-decisions.md`
- [ ] Decision cross-referenced in `memory/decisions.md`
- [ ] Proposal doc updated with final verdict and ADR link
- [ ] All reviewers notified of decision

---

## Phase 5 — Conditions Tracking

If the verdict is "Approved with conditions," every condition must be tracked to closure before implementation begins on the affected component.

### 5.1 Conditions Register

Conditions are documented in the ADR and tracked in:
`architecture/proposals/<date>-<slug>-conditions.md`

| # | Condition | Owner | Due | Status |
|---|---------|-------|-----|--------|
| 1 | `<specific condition>` | | | Open |

### 5.2 Condition Closure

When a condition is met:
1. Owner updates conditions register: status → Closed, with artifact link
2. Architect-agent verifies the condition is genuinely met — not just asserted
3. If all conditions closed: architect-agent updates ADR status to "fully approved"
4. If a condition cannot be met by the deadline: escalate to re-review, not silent extension

### 5.3 Implementation Gating

Implementation of components covered by an open condition is blocked until that condition is closed. Delivery-agent enforces this gate on the sprint board.

---

## Review Quality Standards

### What Makes a Good Architecture Review

A good review produces an ADR with:
- A decision that a new team member can understand without reading the meeting notes
- Rationale that references specific non-functional requirements (latency targets, reliability SLAs, scale targets), not just preferences
- Rejected alternatives that document what was considered and why it wasn't chosen
- Conditions that are specific enough to verify — not vague guidance

### Common Review Failures

| Failure | Symptom | Correction |
|---------|---------|-----------|
| Rubber stamp | Review takes < 30 min; no blocking comments | Pre-review comments required; sync not scheduled until 2+ written concerns |
| Scope creep in review | Reviewers raising concerns outside the stated scope | Architect-agent redirects: "That's a valid concern, but it's not in scope for this ADR" |
| Architecture by committee | Design changes with every reviewer's preference | Architect-agent owns the decision; reviewers advise |
| Vague conditions | "Improve performance before shipping" | Conditions must be measurable: "P99 latency ≤ 200ms under 1k RPS" |
| Decision not written down | Verbal approval, no ADR | No ADR = no approval. Period. |

---

## Architecture Review Escalation

| Situation | Escalate To | How |
|-----------|------------|-----|
| Architectural disagreement unresolved after sync | supervisor-agent | Supervisor review within 24h |
| Security-agent raises a blocker | security-agent becomes decision authority for that component | Separate security review before architecture approval |
| Design affects another team's service contract | That team's lead + architect-agent | Joint review; both teams must approve |
| Design requires a new external vendor or dependency | Human operator + architect-agent | Procurement / legal review before ADR is accepted |
