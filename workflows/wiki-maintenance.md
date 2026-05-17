# Wiki Maintenance Workflow

**Workflow ID:** `wiki-maintenance`
**Cadence:** After every significant work session + weekly audit
**Owner:** All agents (write) + delivery-agent (audit)
**Purpose:** Keep the organizational memory current and useful

---

## When to Trigger

### Automatic (after every session involving):
- A decision being made → `wiki/decisions/`
- An incident being resolved → `wiki/incidents/`
- Research being completed → `wiki/research/`
- A process changing → `wiki/processes/`
- Architecture being documented → `wiki/architecture/`

### Manual:
- Weekly audit: "Please audit and update the wiki for this week's work"
- Before a major project starts: ensure relevant wiki pages are current

---

## End-of-Session Wiki Update Protocol

At the end of any significant work session, agents should:

```
1. IDENTIFY what was learned or decided
   → Ask: "What would a future agent or engineer need to know from this session?"

2. CLASSIFY into wiki tier:
   - Decision with rationale? → wiki/decisions/<date>-<slug>.md
   - Architecture knowledge? → wiki/architecture/<topic>.md
   - Research finding? → wiki/research/<date>-<slug>.md
   - Process learned or changed? → wiki/processes/<process>.md
   - Incident resolved? → wiki/incidents/<date>-<slug>.md

3. CHECK for existing pages
   → If a page exists, update it rather than creating a duplicate
   → If it's outdated, mark the old content and add the update

4. WRITE the entry
   → Use the appropriate template
   → Include the date and author in frontmatter
   → Link to artifacts that support the knowledge

5. UPDATE wiki/index.md "Recently Updated" table
```

---

## Weekly Audit Protocol

**Agent:** `delivery-agent` (triggers review) + relevant domain agents

### Audit Checklist

**Coverage check:**
- [ ] All incidents from past 7 days have post-mortems
- [ ] All ADRs from past 7 days are in `wiki/architecture/decisions/`
- [ ] All sprint retros are in `wiki/processes/` or `release/retros/`
- [ ] New features have entries in `wiki/features/` after release

**Quality check (random sample of 5 pages):**
- [ ] No pages with `status: outdated` older than 30 days (update or archive)
- [ ] No broken links (referenced artifacts exist)
- [ ] No placeholder content (`TBD`, `TODO`, `placeholder`)

**Growth check:**
- [ ] Are there knowledge gaps? Missing pages that would have helped this week?
- [ ] Create stubs for identified gaps

---

## Wiki Entry Standards

### Evergreen Writing
Write as if the reader has no context from the current moment:
- Include the date something was decided, not just that it was decided
- Include the reason for decisions, not just the decision
- Prefer links to artifacts over duplicating content

### Status Lifecycle
```
draft → current → outdated → archived
```

Never delete wiki entries — archive them. Deleted entries lose valuable "why we tried this and it failed" knowledge.

### Cross-Linking
Every wiki entry should link to:
- The artifact(s) that justify the knowledge (PRD, ADR, incident report)
- Related wiki pages
- The template used to create it (so readers can create similar entries)

---

## Knowledge Synthesis

Once per quarter (or after a major project completes):

1. **Pattern extraction**: Look across multiple incidents/retros for recurring themes
2. **Memory promotion**: If a pattern has appeared 3+ times, promote to `memory/patterns/`
3. **Process update**: If a process failed repeatedly, update `wiki/processes/` and the corresponding workflow file
4. **Anti-pattern documentation**: Common failures go to `memory/failures/`

---

## Wiki Health Metrics

| Metric | Target | Action if Below |
|--------|--------|----------------|
| % of incidents with post-mortems | 100% | Delivery-agent follows up |
| % of ADRs linked from wiki | 100% | Architect-agent updates index |
| Days since last wiki update | < 3 days | Review if work is happening without wiki writes |
| Outdated pages (> 60 days) | < 5% | Quarterly cleanup sprint |
