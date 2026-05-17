# Handoff Protocol

The universal inter-agent communication standard for the Enterprise AI OS. Every agent transition uses this protocol. No exceptions.

---

## Why This Exists

Without a handoff protocol, agents:
- Re-litigate settled decisions
- Receive too much (or too little) context
- Produce artifacts that ignore upstream constraints
- Lose information at org boundaries

This protocol creates **lossless, minimum-viable handoffs**.

---

## The Handoff Envelope

Every handoff uses the template at `templates/handoff-template.md`. The envelope contains:

```
1. What was done (summary, not exhaustive)
2. Artifacts produced (names + paths)
3. Decisions made (must be honored)
4. Constraints established (hard limits)
5. Open questions (for the receiving agent)
6. Explicitly out of scope (prevents wasted effort)
7. Context references (wiki/memory pointers)
8. Ready signal (what must be true before starting)
```

---

## Standard Handoff Paths

### PM → Architecture
**Trigger:** PRD approved (supervisor gate passed)
**Sends:** PRD path, success metrics, constraints, open technical questions
**Receives:** Nothing at handoff time — architect reads PRD directly
**Gate before send:** PRD must have all required sections complete

### PM → UX
**Trigger:** PRD approved
**Sends:** PRD path, user segment, primary JTBD, design constraints
**Receives:** Design brief acknowledgment
**Gate before send:** Acceptance criteria must be user-testable

### Architecture → Engineering
**Trigger:** ADR accepted + system design doc approved
**Sends:** Architecture doc path, ADR paths, key constraints, explicitly out of scope
**Receives:** Implementation questions (open questions for arch)
**Gate before send:** Security review must be complete or explicitly deferred

### Architecture → Security
**Trigger:** System design draft complete
**Sends:** Design doc path, specific concerns for threat modeling
**Receives:** Threat model + security verdict
**Gate before send:** Design must include data flow and trust boundaries

### UX → Engineering
**Trigger:** Design spec complete (supervisor gate passed)
**Sends:** Design spec path, user flow path, design system refs, a11y requirements
**Receives:** Implementation questions
**Gate before send:** All UI states specified; mobile and desktop covered

### Engineering → QA
**Trigger:** Implementation complete, tests passing, PR ready
**Sends:** PR link, coverage report, acceptance criteria checklist, known limitations
**Receives:** QA verdict
**Gate before send:** All acceptance criteria marked as implemented/not-implemented

### Engineering → Docs
**Trigger:** Implementation merged
**Sends:** What changed, public API changes, config changes, migration notes
**Receives:** Documentation artifact
**Gate before send:** No pending major changes expected

### QA → Delivery (Pass)
**Trigger:** QA verdict PASS or CONDITIONAL_PASS
**Sends:** QA report path, gate verdict path, open issues list, performance baseline
**Receives:** Release plan
**Gate before send:** Quality gate artifact created at `qa/gates/`

### QA → Engineering (Fail)
**Trigger:** QA verdict FAIL
**Sends:** Bug reports for all blocking issues, retest criteria
**Receives:** Fix confirmation
**Gate before send:** All blocking bugs documented with reproduction steps

### Security → Architecture
**Trigger:** Threat model complete
**Sends:** Threat model path, required controls, verdict
**Receives:** Updated design (if changes required)
**Gate before send:** STRIDE analysis complete

### Security → Delivery (Pre-release gate)
**Trigger:** Security review of release complete
**Sends:** Security review path, verdict, conditions (if conditional)
**Receives:** Deploy confirmation
**Gate before send:** All critical and high findings resolved or formally accepted

### Delivery → PM (Post-release)
**Trigger:** Release deployed + 24h monitoring complete
**Sends:** Release summary, metrics dashboard link, retro doc, proposed next sprint focus
**Receives:** Post-release review decision
**Gate before send:** 24h post-deploy monitoring window complete

---

## Handoff Quality Standards

A handoff is **complete** when:
1. The template is filled out (no placeholders)
2. All referenced artifacts exist at their stated paths
3. Constraints are explicit (not "follow best practices")
4. Open questions are genuinely open (not rhetorical)
5. Out-of-scope list prevents the most likely forms of drift

A handoff is **invalid** when:
- Referenced artifacts don't exist
- Decisions contain "TBD"
- Constraints say "see the PRD" without specifying which constraint
- Out-of-scope is empty (there is always something to exclude)

---

## Handoff Storage

All handoffs are stored at: `handoffs/<date>-<from>-to-<to>-<slug>.md`

This creates an audit trail of all org transitions for a given feature.

---

## Emergency Handoff (Incident Response)

During P1/P2 incidents, use the abbreviated emergency handoff:

```yaml
emergency_handoff:
  from: <agent>
  to: <agent>
  incident: <incident-id>
  situation: "<one sentence>"
  immediate_action_needed: "<specific ask>"
  artifacts_available: ["<path>"]
  do_not_touch: ["<systems>"]
```

No template required in emergencies — use inline YAML in the incident channel.
