---
type: known-risks
as-of: 2026-05-09
scope: continuation risks — specific to resuming this work
---

# Known Risks to Continuation

Risks specific to resuming this work. Different from `memory/known-risks.md` (organizational risks) — this file covers risks introduced by the session boundary itself and the current system state.

---

## Risk 1 — Context Compression at Session Boundary

**Probability:** HIGH
**Impact:** MEDIUM
**Risk:** The previous session ran to context limit and was summarized. The session summary is accurate but compressed. Fine-grained rationale for specific design choices (e.g., why certain token budgets were chosen, why specific escalation thresholds were set) may be unavailable.

**Mitigation:**
- The handoff package captures the key decisions and rationale
- `memory/architecture-decisions.md` and `memory/important-decisions.md` (this session) document binding constraints
- If a specific choice feels arbitrary, check the source template/workflow for inline comments before changing it
- Do not change established thresholds without a documented reason in `memory/architecture-decisions.md`

---

## Risk 2 — Dual Workflows (Legacy + New) Coexisting

**Probability:** HIGH
**Impact:** MEDIUM
**Risk:** The `workflows/` directory contains 7 new deterministic workflows AND 7 legacy pre-existing stubs. An agent that reads the directory index without the INDEX.md may use a legacy stub instead of the authoritative workflow. The legacy stubs have not been deprecated or removed.

**Files at risk:**
- `workflows/feature-development.md` → use `workflows/engineering-workflow.md` instead
- `workflows/discovery.md` → use `workflows/product-discovery.md` instead
- `workflows/incident-response.md` → use `workflows/incident-workflow.md` instead

**Mitigation:**
- Priority P1 in `open-work.md`: add deprecation notices to legacy workflow stubs
- `workflows/INDEX.md` correctly lists only the 7 new workflows
- Any orchestrator routing MUST go through `workflows/INDEX.md` first

---

## Risk 3 — Zero ADRs Means Zero Architecture Memory

**Probability:** MEDIUM
**Impact:** HIGH
**Risk:** `architecture/decisions/` has only a README. No ADRs exist. Any architectural choices made during the first engineering sprint will either be undocumented (violating ORG-003) or will need to be retroactively documented. The first engineer assigned to an L-tier task may not know that ADR-001 must be written before they start coding.

**Mitigation:**
- `memory/open-questions.md` Q-001 must be answered before any L-tier work
- `next-steps.md` Step 3 explicitly creates ADR-001
- `memory/architecture-decisions.md` enforces the rule: "no L-tier work without ADR"
- The governance gate G2 (Architecture Gate) blocks engineering without accepted ADR

---

## Risk 4 — No Operational Runbooks Before First Deployment

**Probability:** HIGH
**Impact:** HIGH
**Risk:** The `release-playbook.md` pre-release checklist requires `wiki/runbooks/<slug>.md` to exist. The `wiki/runbooks/` directory does not yet exist. The first feature cannot be released without creating runbooks first.

**Mitigation:**
- This is Step 4 in `next-steps.md` — create before the first release
- `templates/runbook-template.md` exists and is ready to use
- Runbooks required: deployment, rollback, incident-response, database-migration

---

## Risk 5 — Agent Definitions Exist but Have Never Run

**Probability:** HIGH (certainty)
**Impact:** MEDIUM
**Risk:** All 10 custom agent definitions describe desired behavior but have never been tested against real tasks. Edge cases in the agent definitions (ambiguous routing rules, missing escalation paths, undefined behavior on unusual inputs) will only surface during real operation.

**Mitigation:**
- First run through any workflow should be treated as a calibration run — not production
- Flag any behavior that doesn't match the agent definition as a calibration issue to fix
- `memory/failures/` (currently a stub) should receive the first entry from the first calibration run

---

## Risk 6 — Sprint Infrastructure Missing

**Probability:** HIGH (certainty)
**Impact:** MEDIUM
**Risk:** `sprints/` directory does not exist. Running `playbooks/sprint-playbook.md` requires this directory and the correct file structure (`sprints/<sprint-id>/sprint-plan.md`). An agent following the playbook will try to write to a non-existent path.

**Mitigation:**
- Step 5 in `next-steps.md` creates this structure
- Can be created immediately with: `sprints/sprint-001/sprint-plan.md` (the Write tool creates parent directories)

---

## Risk 7 — Memory Files Are Pre-seeded, Not Evidence-Based

**Probability:** MEDIUM
**Impact:** LOW–MEDIUM
**Risk:** Files like `memory/known-risks.md`, `memory/architecture-decisions.md`, and `memory/open-questions.md` were created with plausible initial content based on the OS design — but none of the entries have been validated against real operation. Pre-seeded "known risks" that don't materialize will create noise; actual risks that were missed will be absent.

**Mitigation:**
- After the first sprint, review all memory files and remove or validate each entry
- Especially: verify the 14 binding constraints in `memory/architecture-decisions.md` actually represent decisions that were consciously made
- Mark any entry that is an assumption (not a confirmed decision) with a note

---

## Risk 8 — Human Operator Context Gap

**Probability:** MEDIUM
**Impact:** HIGH
**Risk:** This system was designed across multiple compressed sessions. The human operator may not have read all artifacts and may not know what exists. They may ask the next agent to create something that already exists, or skip a step that is required.

**Mitigation:**
- Direct human operator to `SYSTEM.md` first — it is the system map
- `playbooks/daily-operating-playbook.md` provides the daily entry point
- `handoffs/session-2026-05-09/recommended-next-prompts.md` provides copy-paste continuations
- If there is confusion about what exists: run `current-system-state.md` as a reference

---

## Risk 9 — Tech Stack Decisions Pending = All ADRs Pending

**Probability:** HIGH (certainty until Q-001 is answered)
**Impact:** HIGH
**Risk:** The system cannot write any meaningful ADRs until the tech stack is known. This blocks all L-tier engineering. The longer Q-001 remains open, the more architectural debt accumulates (decisions made informally without ADRs).

**Mitigation:**
- Q-001 is the FIRST thing to answer in `next-steps.md`
- No L-tier work may be committed to a sprint until Q-001 is answered and ADR-001 exists
- If the human operator wants to "figure it out later," make the governance cost explicit: G2 gate will block L-tier work indefinitely without an ADR

---

## Risk Summary

| Risk | Probability | Impact | Immediate Action |
|------|------------|--------|-----------------|
| 1 — Context compression | HIGH | MEDIUM | Read handoff package; check `memory/` before acting |
| 2 — Legacy workflows coexisting | HIGH | MEDIUM | Add deprecation notices (open-work.md P1) |
| 3 — Zero ADRs | MEDIUM | HIGH | Write ADR-001 after Q-001 is answered |
| 4 — No runbooks | HIGH | HIGH | Create `wiki/runbooks/` before first release |
| 5 — Agents never tested | HIGH | MEDIUM | Treat first workflow as calibration run |
| 6 — No sprints directory | HIGH | MEDIUM | Create `sprints/` immediately |
| 7 — Pre-seeded memory | MEDIUM | LOW | Validate after first sprint |
| 8 — Human context gap | MEDIUM | HIGH | Point to `SYSTEM.md` and this handoff package |
| 9 — Tech stack unknown | HIGH | HIGH | Answer Q-001 before any L-tier work |
