---
layer: wiki
section: knowledge
type: governance
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: knowledge-systems-architect-agent
---

# Karpathy Wiki Governance

Governance rules for the organizational wiki. These rules ensure the wiki remains accurate, current, and useful — not a documentation graveyard.

**The Karpathy principle:** A wiki is only as good as its maintenance protocol. A wiki that agents don't trust becomes invisible. Trust requires accuracy. Accuracy requires governance.

---

## Wiki Governance Principles

### 1. Every Wiki Page Has an Owner
No orphaned pages. Every wiki page has a named agent owner responsible for its accuracy. Owner is listed in page frontmatter.

### 2. Accuracy Over Comprehensiveness
A shorter, accurate page is better than a longer, partially-outdated one. Agents must delete or archive outdated sections rather than appending new content alongside old.

### 3. Wiki Pages Are ACTIVE or ARCHIVED — No STALE State
Unlike memory entries, wiki pages don't go STALE — they get updated. If a page hasn't been touched in 90 days, the owner must review and either update or archive it. There is no middle ground.

### 4. No Unverified Claims
Every claim in the wiki must be traceable to a source: an artifact, a decision record, or a named agent's direct knowledge. No "it is believed that..." or "supposedly..."

### 5. Cross-References Must Resolve
Every internal link in the wiki must point to a real file that exists. Broken cross-references are integrity violations detected by weekly maintenance.

### 6. Wiki Pages Are Not the Source of Truth for Governance
The wiki documents and explains governance. It is not authoritative for governance decisions. Authority lives in:
- T1: `constitution/enterprise-constitution.md`
- T2: ADRs in `docs/adrs/`
- T3: Master registries (`agents/MASTER-REGISTRY.md`, `integrations/MASTER-INTEGRATION-REGISTRY.md`)

---

## Wiki Page Lifecycle

```
PROPOSED (draft, owner has write access only)
    │ APPROVE (owner + 1 peer review)
    ▼
ACTIVE (published, all agents read)
    │ 
    ├── UPDATE (owner edits in place, no state change)
    ├── SUPERSEDE (new version replaces, old goes to archive)
    │
    ▼
ARCHIVED (wiki/archive/{section}/{year}/)
```

---

## Wiki Page Structure

Every wiki page must use this structure:

```markdown
---
layer: wiki
section: {section-name}
type: {governance|reference|pattern|retrospective|synthesis|tutorial}
version: {N.M.0}
created: {YYYY-MM-DD}
owner: {agent-id}
authority: {T2+ agent who approved}
last-reviewed: {YYYY-MM-DD}
status: active|draft|archived
---

# {Page Title}

{One-paragraph abstract — what this page teaches and why it matters}

---

## {Section headers}

{Content}

---

## Related Pages
- `{path}` — {what that page covers and why it relates}
```

---

## Wiki Update Protocol

When an agent discovers that a wiki page is inaccurate or incomplete:

1. **Minor update (typo, link fix, small factual correction):** Edit in place, update `last-reviewed`, no approval needed.

2. **Moderate update (adds section, corrects analysis):** Edit in place, get one peer review, update `last-reviewed`.

3. **Major update (rewrites core claim, changes conclusions):** Create draft version, get authority approval, supersede existing page.

4. **Structural change (rename, merge, split):** T3+ authority approves, update all cross-references, update master-cognition-index.

---

## Wiki Maintenance Schedule

| Maintenance Task | Frequency | Owner |
|---|---|---|
| Validate all cross-references resolve | Weekly | knowledge-systems-engineer-agent |
| Flag pages not reviewed in 90 days | Weekly | knowledge-systems-engineer-agent |
| Archive confirmed-stale pages | Monthly | knowledge-systems-architect-agent |
| Full wiki inventory and gap analysis | Quarterly | knowledge-systems-architect-agent |
| Cross-wiki consistency check | Monthly | organizational-learning-agent |

---

## Wiki Section Ownership

| Section | Owner Agent | Tier |
|---|---|---|
| wiki/knowledge/ | knowledge-systems-architect-agent | T3 |
| wiki/engineering/ | principal-architect-agent | T2 |
| wiki/product/ | senior-pm-agent | T2 |
| wiki/architecture/ | chief-architect-agent | T4 |
| wiki/governance/ | compliance-governance-agent | T2 |
| wiki/security/ | security-architect-agent | T2 |
| wiki/incidents/ | delivery-lead-agent | T2 |
| wiki/research/ | knowledge-systems-architect-agent | T3 |
| wiki/onboarding/ | agent-coordination-agent | T3 |

---

## Anti-Patterns (What Not To Do)

| Anti-Pattern | Why It's Harmful | Correct Approach |
|---|---|---|
| Appending "UPDATE:" sections | Creates ambiguity about current truth | Edit in place, delete old content |
| "TODO: verify this" inline | Signals distrust, spreads distrust | Don't publish until verified |
| Copying content from another page | Creates synchronization drift | Cross-reference the source page |
| Writing "as of {date}" everywhere | Page should always be current | Update the page, remove dates |
| No owner listed | Nobody feels responsible for accuracy | All pages have named owners |
| Giant mega-pages | Prevents precise index retrieval | Split into focused topic pages |