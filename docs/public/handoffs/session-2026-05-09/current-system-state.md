---
type: system-state
as-of: 2026-05-09
prepared-by: claude-sonnet-4-6
---

# Current System State

Complete inventory of the Enterprise AI OS as of 2026-05-09. Every directory and file that matters for operation.

---

## Directory Tree (OS-Owned Directories)

```
AI-Enterprise-OS/
│
├── SYSTEM.md                          ← Master entry point and system map
├── Claude.md                          ← Agent instructions (updated with OS init section)
│
├── orchestrator/                      ← Central coordination layer [6 files]
│   ├── master-orchestrator.md         ← Intent classifier and routing entry point
│   ├── agent-registry.md             ← All 10 agents with triggers/inputs/outputs
│   ├── routing-rules.md              ← Lookup tables: intent → workflow/agent
│   ├── execution-engine.md           ← Step schemas, FSM, gate logic, retry policy
│   ├── context-manager.md            ← Token budgets, compression, cache strategy
│   ├── supervisor.md                 ← Adversarial quality reviewer (6 dimensions)
│   └── README.md
│
├── agents/                            ← Custom agent definitions [10 files] + installed repo
│   ├── pm-agent.md                   ← FAANG PM identity; RICE/JTBD/PRD frameworks
│   ├── architect-agent.md            ← Principal architect; ADR protocol; design principles
│   ├── engineer-agent.md             ← Senior engineer; tier system; code quality gates
│   ├── qa-agent.md                   ← QA engineer; testing pyramid; verdict logic
│   ├── security-agent.md             ← Security engineer; STRIDE; OWASP; CVE policy
│   ├── analytics-agent.md            ← Analytics; north star framework; event taxonomy
│   ├── delivery-agent.md             ← TPM; DORA metrics; sprint/release protocols
│   ├── docs-agent.md                 ← Technical writer; runbook structure
│   ├── strategist-agent.md           ← Product strategist; positioning; PMF
│   ├── ux-agent.md                   ← UX designer
│   └── plugins/                      ← Installed repos: ai-pm-copilot, agent-teams, etc.
│
├── workflows/                         ← [7 deterministic + 7 legacy stubs]
│   ├── INDEX.md                      ← Workflow catalog and selection guide
│   ├── product-discovery.md          ← 9 steps, GO/NO-GO, opportunity scoring
│   ├── architecture-workflow.md      ← 10 steps, 4 paths, ADR creation
│   ├── engineering-workflow.md       ← Tiered XS/M/L, test-driven, security gates
│   ├── qa-workflow.md                ← 10 steps, PASS/CONDITIONAL/FAIL verdict
│   ├── incident-workflow.md          ← 12 steps, P1–P4 severity, blameless post-mortem
│   ├── ai-feature-workflow.md        ← 14 steps, eval framework, staged AI rollout
│   ├── feature-development.md        ← [LEGACY — pre-existing stub]
│   ├── discovery.md                  ← [LEGACY — pre-existing stub]
│   ├── incident-response.md          ← [LEGACY — pre-existing stub]
│   ├── sprint-planning.md            ← [LEGACY — pre-existing stub]
│   ├── architecture-review.md        ← [LEGACY — pre-existing stub]
│   ├── release-workflow.md           ← [LEGACY — pre-existing stub]
│   └── wiki-maintenance.md           ← [LEGACY — pre-existing stub]
│
├── templates/                         ← [18 templates]
│   ├── prd-template.md               ← v2.0 — 12 sections, RACI, evidence matrix
│   ├── rfc-template.md               ← v2.0 — detailed design, migration, blocking comments
│   ├── api-spec-template.md          ← NEW — envelope, rate limiting, webhooks, SDK
│   ├── implementation-plan-template.md ← NEW — WBS, rollback, observability, sign-off
│   ├── qa-plan-template.md           ← NEW — testing pyramid, OWASP, a11y, verdict
│   ├── incident-template.md          ← v2.0 — 5-Whys, STRIDE RCA, stakeholder comms
│   ├── handoff-template.md           ← v2.0 — out-of-scope table, escalation matrix
│   ├── rollout-plan-template.md      ← NEW — 4-phase canary, go/no-go, rollback
│   ├── architecture-review-template.md ← NEW — 7 quality attrs, STRIDE, NFR grid
│   ├── metrics-template.md           ← v2.0 — causal drivers, A/B design, PII compliance
│   ├── adr-template.md               ← [PRE-EXISTING — not upgraded]
│   ├── sprint-template.md            ← [PRE-EXISTING — not upgraded]
│   ├── retro-template.md             ← [PRE-EXISTING — not upgraded]
│   ├── threat-model-template.md      ← [PRE-EXISTING — not upgraded]
│   ├── release-template.md           ← [PRE-EXISTING — not upgraded]
│   ├── test-plan-template.md         ← [PRE-EXISTING — not upgraded]
│   ├── runbook-template.md           ← [PRE-EXISTING — not upgraded]
│   └── bug-report-template.md        ← v2.0 — upgraded during Phase 2
│
├── playbooks/                         ← [6 playbooks + index] NEW DIRECTORY
│   ├── INDEX.md
│   ├── daily-operating-playbook.md   ← 6 time-boxed daily windows
│   ├── sprint-playbook.md            ← Full 2-week sprint calendar
│   ├── release-playbook.md           ← Pre-release gate → hypercare window
│   ├── incident-playbook.md          ← DETECT → POST-MORTEM, commander checklist
│   ├── architecture-review-playbook.md ← 5 phases, weighted scoring, conditions
│   └── PM-review-playbook.md         ← Weekly metrics + roadmap + discovery cadence
│
├── memory/                            ← Warm memory layer [14 files]
│   ├── MEMORY_INDEX.md               ← Index of all memory entries
│   ├── README.md
│   ├── decisions.md                  ← Master cross-domain decision log
│   ├── architecture-decisions.md     ← Arch decisions with binding constraints
│   ├── product-decisions.md          ← Product/strategy decisions with evidence
│   ├── open-questions.md             ← 8 unresolved questions (5 HIGH priority)
│   ├── known-risks.md                ← 11 organizational risks with mitigations
│   ├── organizational/
│   │   ├── system-context.md
│   │   └── governance-constraints.md
│   ├── patterns/
│   │   ├── artifact-driven-communication.md
│   │   ├── minimum-viable-context.md
│   │   └── dev-tier-classification.md
│   ├── failures/
│   │   └── README.md                 ← [STUB — no failures documented yet]
│   └── workflow-state/
│       └── README.md                 ← [STUB — no active workflow states]
│
├── docs/governance/                   ← [3 governance files]
│   ├── principles.md                 ← 5 immutable governance principles
│   ├── quality-gates.md              ← G1–G8 gates with checklists
│   └── security-policy.md            ← Data classification, auth, compliance triggers
│
├── architecture/                      ← [2 files + stub]
│   ├── agent-topology.md             ← Agent comms matrix, execution patterns
│   └── decisions/
│       └── README.md                 ← [STUB — 0 ADRs written yet]
│
├── wiki/                              ← Organizational knowledge [6 files]
│   ├── index.md
│   ├── architecture/
│   │   ├── overview.md
│   │   └── agent-topology.md
│   ├── onboarding/
│   │   └── agent-ops.md              ← Operations guide for agents
│   └── processes/
│       ├── workflow-guide.md
│       └── feature-development.md
│
├── handoffs/                          ← [2 artifacts]
│   ├── handoff-protocol.md           ← Universal inter-agent handoff standard
│   └── session-2026-05-09/           ← This handoff package
│
│ ── EMPTY / STUB DIRECTORIES ──────────────────────────────────────────────
│
├── prds/                              ← [EMPTY] Will hold PRD artifacts
├── rfc/                               ← [EMPTY] Will hold RFC documents
├── implementation/                    ← [EMPTY] Will hold impl plans, API specs
├── release/                           ← [EMPTY] Will hold release artifacts
├── qa/                                ← [EMPTY] Will hold QA reports
├── analytics/                         ← [EMPTY] Will hold metrics frameworks
│
│ ── INSTALLED REPOS (read-only reference) ───────────────────────────────
│
├── BMAD-METHOD/                       ← BMAD v6 agile SDLC framework
├── agents/plugins/                    ← ai-pm-copilot, agent-teams plugins
├── Agent-Skills-for-Context-Engineering/ ← Context engineering patterns
├── claude-dev-workflow/               ← XS/M/L tier system
├── claude-skills/                     ← Skill definitions
├── claude-mem/                        ← Memory patterns
├── claude-scaffold-project/           ← Project scaffolding
├── get-shit-done/                     ← Execution patterns
├── superpowers/                       ← Subagent execution
├── obsidian-skills/                   ← Knowledge management
├── pm-academy/                        ← PM training resources
└── ui-ux-pro-max-skill/               ← UX/design skills
```

---

## File Counts by Layer

| Layer | Directory | Files Created | Status |
|-------|-----------|--------------|--------|
| Orchestration | orchestrator/ | 7 | Complete |
| Agents | agents/*.md (root) | 10 | Complete |
| Workflows | workflows/ (new) | 7 | Complete |
| Templates | templates/ (new+upgraded) | 10 | Complete; 8 pre-existing |
| Playbooks | playbooks/ | 7 | Complete |
| Memory | memory/ | 14 | Complete (2 stubs) |
| Governance | docs/governance/ | 3 | Complete |
| Architecture | architecture/ | 2 | Partial (0 ADRs) |
| Wiki | wiki/ | 6 | Foundation only |
| Handoffs | handoffs/ | 2 | Active |
| **OS total** | | **~78** | **Infrastructure complete** |

---

## Directories That Need Content Next

| Directory | State | What Goes Here |
|-----------|-------|---------------|
| `prds/` | Empty | First PRD once discovery completes |
| `rfc/` | Empty | First RFC once architecture review triggers |
| `architecture/decisions/` | README only | First ADR once L-tier work is scoped |
| `implementation/` | Empty | Implementation plans, API specs |
| `qa/` | Empty | QA plans and reports |
| `release/` | Empty | Release artifacts |
| `analytics/` | Empty | Metrics frameworks |
| `wiki/runbooks/` | Does not exist | Runbooks (create when first feature ships) |
| `wiki/learnings/` | Does not exist | Post-mortems and retrospective learnings |
| `memory/failures/` | README only | Documented failure modes |
| `memory/workflow-state/` | README only | Active workflow state files |
| `sprints/` | Does not exist | Sprint plans and reviews |
| `incidents/` | Does not exist | Incident reports |
