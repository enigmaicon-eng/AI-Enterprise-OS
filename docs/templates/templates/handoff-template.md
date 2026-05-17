---
type: handoff
version: "2.0"
handoff-id: HO-<YYYY-MM-DD>-<from>-to-<to>-<slug>
from-agent: <agent-id>
to-agent: <agent-id>
workflow: <workflow-id>
step-from: <step-id>
step-to: <step-id>
timestamp: <ISO timestamp>
priority: critical | high | normal | low
gate-passed: <gate-id or null>
---

# Handoff: <from-org> → <to-org>

> **Workflow:** `<workflow name>`
> **Completing:** `<step-id>` — `<step name>`
> **Starting:** `<step-id>` — `<step name>`
> **Priority:** `critical | high | normal | low`

---

## ① Work Summary

Brief, precise summary of what was completed. Write for someone who needs enough context to start immediately — not a narrative of what you did, but what they need to know.

`<2–4 sentences: what was built/decided/produced, what key findings emerged, and what condition the work is in>`

---

## ② Artifacts Produced

All artifacts the receiving agent should read before starting work.

| # | Artifact | Path | Status | Read First? |
|---|----------|------|--------|------------|
| 1 | `<name>` | `<canonical path>` | final / draft / needs-review | YES / if needed |
| 2 | | | | |

**Most important artifact:** `<path>` — `<one sentence on why it's critical>`

---

## ③ Decisions Made (Do Not Re-Litigate)

These decisions are final. The receiving agent works within them, not around them.

| # | Decision | Rationale | Authority |
|---|---------|-----------|----------|
| 1 | `<what was decided>` | `<why this was chosen>` | `<ADR-NNN / stakeholder / PRD ref>` |
| 2 | | | |

> If you believe a decision is wrong, raise it via the supervisor escalation path — do not silently override it.

---

## ④ Constraints

Hard boundaries the receiving agent must operate within. Each constraint has a stated reason so the agent can make judgment calls at the margins.

| Constraint | Type | Reason |
|-----------|------|--------|
| `<constraint statement>` | technical / security / business / legal | `<why it's fixed>` |

---

## ⑤ Open Questions (For Receiving Agent)

Questions that remain unanswered. The receiving agent should address these during their step.

| ID | Question | Priority | Answer Needed By |
|----|---------|---------|-----------------|
| Q-01 | `<question>` | blocking / non-blocking | `<step name or date>` |

---

## ⑥ Explicitly Out of Scope

Do not spend time on these. They are either already handled or deliberately deferred.

| Item | Disposition |
|------|------------|
| `<item>` | already handled in `<step or artifact>` |
| `<item>` | deferred to `<phase/sprint/PRD>` |
| `<item>` | out of scope per `<authority>` |

---

## ⑦ Context Package

Curated references for the receiving agent. Do not include everything — include what they actually need.

| Type | Reference | Why Relevant |
|------|-----------|-------------|
| PRD | `prds/<slug>.md` | `<what sections are most relevant>` |
| ADR | `architecture/decisions/ADR-NNN.md` | `<what decision to reference>` |
| Wiki | `wiki/<path>` | `<what pattern or decision is documented here>` |
| Memory | `memory/<file>` | `<what prior learning applies>` |
| Prior artifact | `<path>` | `<relationship to current work>` |

**Explicitly excluded from context:** `<what not to load — saves token budget>`

---

## ⑧ Ready Signal

The receiving agent may begin when all of these are true:

- [ ] `<prerequisite 1 — e.g., "PRD approved">`
- [ ] `<prerequisite 2 — e.g., "staging environment provisioned">`
- [ ] `<prerequisite 3>`

**Blocked by:** `<if currently blocked, describe>` / nothing

---

## ⑨ Expected Output

What the sending agent expects the receiving agent to produce. Used to verify the handoff was complete.

| Artifact | Path | Required By |
|----------|------|------------|
| `<artifact name>` | `<canonical path>` | `<date or next gate>` |

**Gate to pass:** `<gate-id>` — `<what the gate checks>`

---

## ⑩ Escalation Path

If the receiving agent is blocked or encounters a decision outside their authority:

| Situation | Escalate To | How |
|-----------|------------|-----|
| Ambiguous requirement | pm-agent | Re-open `prds/<slug>.md` Q&A |
| Architecture conflict | architect-agent | New ADR or ADR amendment |
| Security concern | security-agent | Immediate; do not proceed |
| Scope change | supervisor-agent | Supervisor review before action |
| Any P1/P2 risk | commander on-call | `!incident` |
