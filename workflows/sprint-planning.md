# Sprint Planning Workflow

**Workflow ID:** `sprint-planning`
**Cadence:** Every 2 weeks (default), configurable
**Orgs:** PM → DELIVERY → ENG + QA + UX
**Duration:** Half-day planning session

---

## Pre-Sprint Preparation (day before)

**Agent:** `pm-agent`
- [ ] Backlog groomed: all items in "ready for sprint" have acceptance criteria
- [ ] Items prioritized by RICE score or strategic alignment
- [ ] Dependencies identified across items
- [ ] Business context briefing prepared for engineering team

---

## Sprint Planning Steps

### STEP 01: Capacity Check
**Agent:** `delivery-agent`
- Count available engineering days (team size × sprint days × availability %)
- Subtract known commitments (on-call, reviews, etc.)
- Set sprint capacity in story points or days

```yaml
sprint_capacity:
  sprint_id: "<YYYY-MM-DD>-sprint-NN"
  engineering_days: <N>
  qa_days: <N>
  ux_days: <N>
  buffer: "20%"  # for unplanned work
  net_capacity: <N>
```

---

### STEP 02: Sprint Goal Definition
**Agent:** `pm-agent`
- Define ONE sprint goal: the key outcome this sprint should achieve
- Sprint goal must be: specific, user-facing, and testable
- Everything in the sprint should serve the sprint goal

```
Sprint Goal Format:
"By end of sprint [N], users can [do X], which enables [business outcome]"
```

---

### STEP 03: Backlog Selection
**Agents:** `pm-agent` + `delivery-agent` + `engineer-agent`
- Pull items from prioritized backlog
- Size each item (planning poker or T-shirt sizes)
- Verify each item: design done? Acceptance criteria clear? Dependencies resolved?
- Fill to 80% of capacity (leave 20% for unplanned)

**Item readiness checklist (per item):**
- [ ] Acceptance criteria written and testable
- [ ] Design spec exists (if UI work)
- [ ] Dependencies listed and unblocked
- [ ] Sized by engineer who will build it
- [ ] Not blocked by another sprint item

---

### STEP 04: Sprint Plan Artifact
**Agent:** `delivery-agent`
Using `templates/sprint-template.md`:

```markdown
# Sprint N: <Sprint Goal>
**Dates:** <start> → <end>
**Capacity:** <N> engineering days

## Sprint Goal
<Goal statement>

## Committed Items
| ID | Title | Points | Owner | Depends On |
|----|-------|--------|-------|------------|
| ... |

## Stretch Items (if capacity permits)
| ID | Title | Points |
|----|-------|--------|

## Risks & Dependencies
- <risk or external dependency>

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Tests written and passing
- [ ] QA gate passed
- [ ] Documentation updated
- [ ] Design reviewed against spec
```

**Output:** `release/sprints/<sprint-id>.md`

---

### STEP 05: Kickoff
**Agent:** `delivery-agent`
- Share sprint plan with all orgs
- Confirm: who builds what, who reviews what, QA timeline
- Identify any immediate blockers

---

## Sprint Review Protocol

**End of sprint — before retrospective:**

### STEP 06: Demo + Acceptance
**Agents:** `qa-agent` + `pm-agent`
- Demo each completed item against its acceptance criteria
- PM signs off: does this match what was requested?
- QA confirms: does this pass the quality gate?
- Items that don't pass → carry over to next sprint (do NOT re-estimate)

### STEP 07: Sprint Metrics
**Agent:** `delivery-agent`
```yaml
sprint_summary:
  committed: <N items / N points>
  completed: <N items / N points>
  velocity: <points completed>
  carry_over: <items that didn't complete>
  unplanned_work: <items added during sprint>
  blockers_encountered: [<list>]
```

### STEP 08: Retrospective
**Agent:** `delivery-agent`
Using `templates/retro-template.md` — 3 categories:
1. **Keep** (what worked well)
2. **Improve** (what slowed us down)
3. **Action items** (specific, owned, committed for next sprint)

**Output:** `release/retros/<sprint-id>.md`

---

## Sprint Health Signals

| Signal | Threshold | Action |
|--------|-----------|--------|
| Velocity variance | > 30% sprint-over-sprint | Investigate sizing calibration |
| Carry-over rate | > 20% of committed items | Investigate sprint planning quality |
| Unplanned work | > 20% of capacity | Investigate demand management |
| Retro action items completed | < 50% | Retros aren't driving change |
