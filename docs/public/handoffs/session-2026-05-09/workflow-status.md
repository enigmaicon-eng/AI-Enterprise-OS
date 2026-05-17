---
type: workflow-status
as-of: 2026-05-09
---

# Workflow Status

Status of all workflows in the OS. Distinguishes between the 7 new deterministic workflows (authoritative) and 7 legacy stubs (pre-existing, should be deprecated).

---

## Authoritative Workflows (New — Use These)

| Workflow | File | Status | Gate Count | Never Run | Blocking Gap |
|---------|------|--------|-----------|-----------|-------------|
| Product Discovery | `workflows/product-discovery.md` | Ready | 8 | Yes | Answer Q-001 through Q-005 first |
| Architecture Workflow | `workflows/architecture-workflow.md` | Ready | 4 | Yes | Requires approved PRD (G1) |
| Engineering Workflow | `workflows/engineering-workflow.md` | Ready | 5 | Yes | Requires accepted ADR for L-tier (G2) |
| QA Workflow | `workflows/qa-workflow.md` | Ready | 4 | Yes | Requires code deployed to staging |
| Incident Workflow | `workflows/incident-workflow.md` | Ready | — | Yes | Trigger: `!incident` |
| AI Feature Workflow | `workflows/ai-feature-workflow.md` | Ready | 7 | Yes | Use only for AI/ML features |
| Workflows INDEX | `workflows/INDEX.md` | Ready | — | — | Read this first |

---

## Workflow Detail

### Product Discovery (`workflows/product-discovery.md`)

```
Status:        Ready
Trigger:       "I have an idea / problem / opportunity"
Steps:         9 (includes conditional validation sprint)
Artifacts:     opportunity-assessment.md, market-brief.md, assumption-map.md,
               discovery-decision.md, PRD draft
Decision:      GO / NO-GO / PIVOT
Duration:      5–10 days
Owner:         pm-agent (lead), strategist-agent (market), analytics-agent (data)
Blocking gap:  Q-001 through Q-005 must be answered first
```

**Key design features:**
- Opportunity scoring formula: (Value × Confidence) / Effort
- 4 discovery types: PROBLEM_KNOWN, SOLUTION_KNOWN, METRIC_SIGNAL, MARKET_PULL, TECHNOLOGY_PUSH
- Conditional Step 06: Validation Sprint if HIGH-risk UNVALIDATED assumptions exist
- Parallel steps 03a (market) + 03b (user research)

---

### Architecture Workflow (`workflows/architecture-workflow.md`)

```
Status:        Ready
Trigger:       PRD approved (G1 gate passed)
Steps:         10
Artifacts:     architectural options doc, ADR, RFC (if needed), threat model
Decision:      ADR accepted / rejected
Duration:      2–5 days
Owner:         architect-agent (lead), security-agent (threat model)
Blocking gap:  None — ready to run after PRD approval
```

**Key design features:**
- 4 paths (A: new system, B: modification, C: cross-team interface, D: data architecture)
- Anti-strawman rule: all alternatives must be genuinely viable
- Weighted scoring matrix (7 criteria, configurable weights)
- Tiebreaker: prefer more reversible when < 10% margin
- RFC review period: 5 business days

---

### Engineering Workflow (`workflows/engineering-workflow.md`)

```
Status:        Ready
Trigger:       ADR accepted (G2 gate passed)
Steps:         XS: 5 steps, M: 9 steps, L: 12 steps
Artifacts:     implementation plan, PR, test coverage report
Decision:      PR ready for QA handoff
Duration:      XS: hours, M: 2–5 days, L: 5–15 days
Owner:         engineer-agent
Blocking gap:  L-tier requires accepted ADR (currently 0 ADRs exist)
```

**Key design features:**
- Tier classification table determines required process
- Step 01L: ADR Confirmation (L-tier only — explicit check before coding starts)
- Step 02L: Deployment plan with staged rollout phases
- Step 05L: Security code review (OWASP Top 10 per language)
- Superpowers subagent-driven development for M/L

---

### QA Workflow (`workflows/qa-workflow.md`)

```
Status:        Ready
Trigger:       Code deployed to staging (after engineering workflow)
Steps:         10
Artifacts:     QA plan, test execution log, verdict (PASS/CONDITIONAL/FAIL), bug reports
Decision:      PASS → delivery-agent, FAIL → engineer-agent
Duration:      1–5 days
Owner:         qa-agent
Blocking gap:  None — ready to run after staging deployment
```

**Key design features:**
- 12 mandatory edge case scenarios always applied
- Performance test types: response time, load, stress
- Accessibility: automated scanner + keyboard + screen reader + color contrast
- Verdict decision tree: ANY critical bug → FAIL unconditional
- QA cannot be compressed below 1 day regardless of deadline pressure

---

### Incident Workflow (`workflows/incident-workflow.md`)

```
Status:        Ready
Trigger:       !incident (any severity)
Steps:         12
Artifacts:     incident report, post-mortem, action items
Decision:      P1: ≤ 1h MTTR target; P2: ≤ 4h; P3: ≤ 24h; P4: ≤ 72h
Duration:      Severity-dependent
Owner:         incident-commander (delivery-agent or on-call)
Blocking gap:  None — can be triggered at any time
```

**Key design features:**
- P1–P4 severity matrix with MTTR targets
- Stakeholder notification template with timing SLAs
- Root cause category table (8 categories); "human error" explicitly invalid
- Rollback decision criteria: > 30 min on P1 → rollback
- Abbreviated QA for incident fix (3 checks only)
- Post-mortem: blameless, 5-Whys, action item accountability matrix

---

### AI Feature Workflow (`workflows/ai-feature-workflow.md`)

```
Status:        Ready
Trigger:       PRD approved AND feature is AI/LLM-powered
Steps:         14
Artifacts:     AI risk assessment, eval framework, golden test set, prompt architecture,
               iteration log, staged rollout plan
Decision:      Phase gate at each rollout phase
Duration:      2–6 weeks
Owner:         engineer-agent + analytics-agent + security-agent
Blocking gap:  Eval framework must exist before first model code (no exceptions)
```

**Key design features:**
- AI Risk Classification: HIGH/MEDIUM/LOW
- Eval dimensions: correctness, relevance, safety, consistency, latency, cost efficiency, user satisfaction
- Golden test set: 50–200 examples
- LLM-as-judge: ≥ 80% human calibration required
- Iteration loop: max 5 cycles
- Staged rollout: Phase 0 (10 users) → Phase 1 (1–5%) → Phase 2 (25%) → Phase 3 (100%)
- Rollback trigger: safety violation rate > 0.01% in 1-hour window

---

## Legacy Workflows (Pre-existing — Do Not Use)

These exist in `workflows/` but are superseded. Until deprecation notices are added (see `open-work.md` P1), be careful not to use these.

| File | Superseded By | Action Required |
|------|--------------|----------------|
| `workflows/feature-development.md` | `workflows/engineering-workflow.md` | Add deprecation notice |
| `workflows/discovery.md` | `workflows/product-discovery.md` | Add deprecation notice |
| `workflows/incident-response.md` | `workflows/incident-workflow.md` | Add deprecation notice |
| `workflows/sprint-planning.md` | `playbooks/sprint-playbook.md` | Evaluate; likely deprecate |
| `workflows/architecture-review.md` | `workflows/architecture-workflow.md` + `playbooks/architecture-review-playbook.md` | Add deprecation notice |
| `workflows/release-workflow.md` | `playbooks/release-playbook.md` | Evaluate overlap; possibly keep |
| `workflows/wiki-maintenance.md` | No direct equivalent | Upgrade or keep |

---

## Workflow Chaining (Standard Sequence)

```
[Human: problem statement]
        ↓
product-discovery.md → GO decision
        ↓
architecture-workflow.md → ADR accepted
        ↓
engineering-workflow.md → PR ready
        ↓
qa-workflow.md → PASS verdict
        ↓
release-playbook.md → deployed
        ↓
PM-review-playbook.md → metrics reviewed
        ↓ (if anything breaks)
incident-workflow.md → post-mortem → action items
        ↓ (if AI feature)
ai-feature-workflow.md → replaces engineering-workflow.md steps 3–9
```

---

## Workflow State Files

When any workflow is in progress, its state is saved to:
`memory/workflow-state/<workflow-id>-<date>.md`

Currently: `memory/workflow-state/README.md` only — no active workflow states.
