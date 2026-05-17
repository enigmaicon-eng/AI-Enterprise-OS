---
layer: ontology
type: core-vocabulary
version: 1.0.0
created: 2026-05-09
owner: architect-agent
---

# Core Concepts

The authoritative definitions for all foundational terms used across the Enterprise AI OS. When a term here conflicts with usage elsewhere in the system, the definition here takes precedence — and the conflicting usage should be updated.

---

## Tier 1: System Identity Terms

### Enterprise AI OS
The complete system: orchestration layer, agent definitions, workflows, templates, governance, memory, wiki, and all supporting infrastructure. Not an application — the coordination and knowledge layer that applications are built through.

### Operating Session
A single continuous Claude conversation. Sessions have no persistent state beyond what is written to disk. The OS is designed to be reconstructed from artifacts at the start of each session.

### Agent
A specialized AI persona with a defined role, capability scope, input requirements, output formats, and handoff paths. Agents do not have memory across sessions — they read context from artifacts, wiki, and memory files.

### Operator
A human who initiates sessions, answers blocking questions, approves human-required gates, and provides business direction. The OS requires at least one operator to function.

---

## Tier 2: Work Classification Terms

### Initiative
A bounded unit of product or engineering work with a defined goal, scope, and success criteria. Initiatives are tracked through the full lifecycle from discovery to delivery. An initiative produces at least one PRD and one set of delivered artifacts.

### Feature
A user-facing capability that is part of an initiative. Features are the primary unit of PM and engineering work. Features have a tier (XS/M/L) that determines the governance requirements.

### Tier (XS / M / L)
The complexity and risk classification of a unit of engineering work:
- **XS:** Bug fixes, configuration changes, copy/content updates. No ADR required. No architecture review.
- **M:** New features, refactors, API changes. Light ADR may be required. Architecture review recommended.
- **L:** Architecture changes, migrations, security-sensitive systems, new data models. ADR required. Full architecture review. Security gate mandatory.

### Task
An atomic unit of work assigned to a single agent within a workflow step. Tasks are not tracked in the memory system — they are captured in sprint artifacts.

### Epic
A collection of features that together constitute a major product capability. Epics span multiple sprints.

---

## Tier 3: Process Terms

### Workflow
A deterministic, multi-step process with defined inputs, outputs, quality gates, and agent assignments. Workflows are stored in `workflows/` and must be used when they exist (Governance Principle 2). Workflows describe WHAT to do and in what ORDER.

### Playbook
An operational guide that provides step-by-step instructions for humans and agents operating the system. Playbooks supplement workflows with practical "how to execute" context. Playbooks are stored in `playbooks/`. Playbooks describe HOW to execute what workflows define.

**Key distinction:** Workflows are declarative specifications. Playbooks are procedural execution guides. A workflow says "run QA gate at step 7." The playbook says "open the test plan, verify coverage, mark each criterion..."

### Step
A single node within a workflow. Each step has an assigned agent, input requirements, output artifact, and quality check.

### Quality Gate
A defined checkpoint that must be passed before work proceeds to the next phase. Gates are binary: PASS or FAIL. Gates cannot be bypassed except by documented exception with human authorization. See `docs/governance/quality-gates.md`.

### Gate Exception
A documented authorization to proceed past a quality gate that has not passed. Requires explicit human authorization. Logged in `wiki/decisions/gate-exceptions.md`.

---

## Tier 4: Artifact Terms

### Artifact
A named file stored at a canonical path that represents a unit of organizational output. Artifacts are the primary communication mechanism between agents and the primary record of all work. See `ontology/artifact-taxonomy.md` for the full classification.

### Handoff
The structured transfer of work between agents, formalized as a handoff artifact (YAML envelope) that includes: the source agent, target agent, task context, input artifacts, output artifact produced, and any open questions or blockers.

### Draft
An artifact that is in progress and has not been reviewed. Drafts are stored with a `-draft` suffix or in a `drafts/` subdirectory.

### Canonical Path
The agreed-upon location for a specific artifact type. Agents must not store artifacts at ad-hoc paths — the canonical path for each artifact type is defined by the relevant workflow.

---

## Tier 5: Memory Terms

### Memory
The `memory/` directory. Contains non-obvious, persistent, and actionable knowledge that agents need across sessions but that is not captured in the wiki or artifacts. Memory is the warm tier of the 3-tier knowledge architecture.

### Wiki
The `wiki/` directory. The hot tier of the knowledge architecture. Human-readable organizational knowledge that is actively maintained and used as shared context by all agents.

### ADR (Architecture Decision Record)
A structured record of a significant architectural decision, including context, alternatives considered, the decision made, and consequences. ADRs are stored in `architecture/decisions/`. All L-tier decisions require an ADR.

### Open Question
A recorded organizational unknown that affects agent decision-making. Open questions are tracked in `memory/open-questions.md`. Agents must not silently assume answers to open questions.

---

## Tier 6: Governance Terms

### Principal
Any entity (agent, human operator, external system) that can take actions within the OS. Principals have defined trust levels and authorization boundaries.

### Trust Level
The degree to which a principal's outputs are accepted without further verification. Defined in the governance layer.

### Escalation
The act of forwarding a decision or blocker to a higher authority (from agent to supervisor, from supervisor to human). Escalation paths are defined per workflow.

### Incident
An unplanned event that degrades or threatens system quality, security, or delivery. Incidents are triggered with `!incident [description]` and handled via `workflows/incident-response.md`.

---

## Term Relationship Map

```
Operator
  └─ initiates → Operating Session
                    └─ routes → Agent
                                  └─ executes → Workflow Step
                                                  └─ produces → Artifact
                                                  └─ passes → Quality Gate
                                                  └─ triggers → Handoff

Initiative
  └─ contains → Feature (Tier: XS/M/L)
                  └─ triggers → Workflow
                  └─ produces → multiple Artifacts
                  └─ closes with → ADR (if L-tier)
```
