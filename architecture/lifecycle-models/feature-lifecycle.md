---
layer: lifecycle-models
type: feature-lifecycle
version: 1.0.0
created: 2026-05-09
owner: architect-agent
---

# Feature Lifecycle

The complete lifecycle of a feature from idea to retirement. Each phase has defined entry criteria, exit criteria, key activities, and the agent(s) responsible.

---

## Phase Overview

```
IDEA ──→ DISCOVERY ──→ DESIGN ──→ BUILD ──→ RELEASE ──→ GROWTH ──→ MATURE ──→ SUNSET
```

---

## Phase 1: IDEA

**Description:** An unvalidated hypothesis about something worth building.
**Entry criteria:** Any team member or operator proposes the idea.
**Exit criteria:** Commitment to run discovery (or explicit decision to drop).

**Activities:**
- Idea is captured as a note (no template required)
- pm-agent + strategist-agent perform rough opportunity sizing (< 1 hour)
- Decision: proceed to discovery or drop

**Owner:** pm-agent
**Artifacts:** Informal idea note (not a governed artifact)
**Metrics:** N/A

---

## Phase 2: DISCOVERY

**Description:** Structured validation of the problem and solution hypothesis.
**Workflow:** `workflows/product-discovery.md`
**Entry criteria:** Idea proceeds from IDEA phase; operator provides problem statement.
**Exit criteria:** GO/NO-GO decision with documented rationale; PRD created on GO.

**Activities:**
- Opportunity assessment (pm-agent)
- Positioning brief (strategist-agent)
- Market analysis if needed (market-analyst-agent)
- Evidence scoring
- GO/NO-GO decision
- PRD draft on GO

**Owner:** pm-agent
**Artifacts:** PRD (`prds/<date>-<slug>.md`), discovery artifacts (`prds/discovery/`)
**Gate:** G1 (PRD approval by supervisor-agent)
**Metrics:** Evidence strength score, decision confidence level

---

## Phase 3: DESIGN

**Description:** Technical and user experience design before any code is written.
**Workflows:** `workflows/architecture-workflow.md`, UX design steps
**Entry criteria:** PRD at status APPROVED (G1 passed).
**Exit criteria:** ADR approved (L-tier) or architecture confirmed; UX designs approved (G4).

**Activities:**
- Architecture design (architect-agent)
- ADR creation (L-tier required)
- Threat modeling (security-agent) — G3
- UX design (ux-agent) — G4
- API spec (engineer-agent if API changes)

**Owner:** architect-agent (technical), ux-agent (experience)
**Artifacts:** ADR, threat model, UX designs, API spec
**Gates:** G2 (architecture), G3 (security design), G4 (UX)
**Metrics:** Design review cycle count

---

## Phase 4: BUILD

**Description:** Implementation against the approved design.
**Workflow:** `workflows/engineering-workflow.md`
**Entry criteria:** G2 + G3 + G4 passed; implementation plan exists.
**Exit criteria:** QA gate passes; feature ready for release.

**Activities:**
- Implementation (engineer-agent)
- Code review
- QA testing (qa-agent) — G5
- Security testing (security-agent) — G6
- Documentation (docs-agent)

**Owner:** engineer-agent (build), qa-agent (verification)
**Artifacts:** Implementation artifacts, QA plan, test results, bug reports
**Gates:** G5 (QA), G6 (security release)
**Metrics:** Build time, bug count, test coverage, gate cycle count

---

## Phase 5: RELEASE

**Description:** Controlled deployment to production users.
**Workflow:** `workflows/release-workflow.md`
**Playbook:** `playbooks/release-playbook.md`
**Entry criteria:** G5 + G6 passed; pre-release checklist complete (G7).
**Exit criteria:** Feature is available to target user segment; post-release monitoring active.

**Activities:**
- Pre-release checklist (delivery-agent) — G7
- Staged rollout: 0% → 1% → 25% → 100% (L-tier features)
- Post-release monitoring
- Go/no-go decisions at each rollout stage

**Owner:** delivery-agent
**Artifacts:** Release plan, rollout plan
**Gates:** G7 (pre-release checklist)
**Metrics:** Deployment success rate, D3 (change failure rate during rollout)

---

## Phase 6: GROWTH

**Description:** Feature is live; usage is growing; optimization is active.
**Entry criteria:** 100% rollout complete; no P0/P1 incidents from release.
**Exit criteria:** Usage plateau (indicates MATURE phase entry).

**Activities:**
- Metric review (analytics-agent, PM-review-playbook.md)
- User feedback synthesis (pm-agent)
- Performance optimization (engineer-agent)
- AI quality monitoring (analytics-agent) — if AI feature

**Owner:** pm-agent (metrics ownership), analytics-agent (monitoring)
**Artifacts:** Metrics reports, optimization artifacts
**Metrics:** Feature usage rate, user retention, D1 (deployment frequency of improvements)

---

## Phase 7: MATURE

**Description:** Feature is stable; usage is steady; minimal investment.
**Entry criteria:** Usage plateau + no significant bugs + low improvement velocity.
**Exit criteria:** Decision to sunset OR unexpected growth (re-entry to GROWTH).

**Activities:**
- Ongoing monitoring (reduced cadence)
- Regression prevention
- Security maintenance (patch updates)

**Owner:** delivery-agent
**Metrics:** Stability metrics; cost per active user

---

## Phase 8: SUNSET

**Description:** Feature is being removed from the product.
**Entry criteria:** Product decision to retire (with rationale documented in PRD update).
**Exit criteria:** Feature removed from production; all dependent features migrated.

**Activities:**
- User migration plan (pm-agent)
- Deprecation notice to users
- Gradual feature removal
- Runbook and documentation archival
- Incident post-mortem if sunset is due to failure

**Owner:** pm-agent (decision), engineer-agent (removal), docs-agent (archival)
**Artifacts:** Deprecation plan, migration guide, archival notes
**Metrics:** Migration completion rate

---

## Phase Transition Gates

| From → To | Gate / Decision | Owner |
|-----------|----------------|-------|
| IDEA → DISCOVERY | Operator go-ahead | Operator + pm-agent |
| DISCOVERY → DESIGN | G1 (PRD approval) | supervisor-agent |
| DESIGN → BUILD | G2 + G3 + G4 | supervisor-agent + security-agent |
| BUILD → RELEASE | G5 + G6 + G7 | qa-agent + security-agent + delivery-agent |
| RELEASE → GROWTH | Rollout complete; no critical incidents | delivery-agent |
| GROWTH → MATURE | PM decision at metric review | pm-agent + operator |
| MATURE → SUNSET | Product decision with rationale | pm-agent + operator |

---

## Lifecycle Tracking

Feature lifecycle state is tracked in the PRD frontmatter:
```yaml
lifecycle-phase: idea | discovery | design | build | release | growth | mature | sunset
phase-entered: YYYY-MM-DD
```

The PM-review-playbook.md reviews lifecycle phase at each sprint review.
