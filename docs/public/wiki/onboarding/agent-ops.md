---
type: wiki
status: current
created: 2026-05-08
audience: operators, developers
---

# Agent Operations Guide

How to operate the Enterprise AI OS: invoke agents, run workflows, interpret outputs, and maintain the system.

---

## Quick Start

### Run a Feature
```
I want to build [feature description]
```
→ Master Orchestrator classifies as CROSS intent → invokes `feature-development` workflow

### Get a PRD Written
```
I need a PRD for [problem description]
```
→ Routes to `pm-agent` → produces PRD at `prds/<date>-<slug>.md`

### Make an Architecture Decision
```
We need to decide [technical decision]
```
→ Routes to `architect-agent` → invokes `architecture-review` workflow → produces ADR

### Respond to an Incident
```
!incident [description of production problem]
```
→ `!incident` prefix immediately invokes `incident-response` workflow

### Run Discovery
```
I'm not sure we should build [X]. Let's do discovery first.
```
→ Routes to `discovery` workflow → pm-agent + strategist-agent → go/no-go decision

---

## Understanding Agent Outputs

Every agent response follows this structure:
```
[Agent identity: which agent is responding]
[What was done]
[Artifacts produced: name and path]
[Handoff: what's next and for whom]
[Wiki/memory updates made]
```

If you don't see an artifact path, the output is incomplete. Ask: "What artifact was produced and where was it saved?"

---

## Workflow Invocation

### By Name
```
Run the [workflow-name] workflow for [context]
```
Available workflows:
- `feature-development` — full feature lifecycle
- `discovery` — problem validation before building
- `architecture-review` — ADR/RFC process
- `sprint-planning` — sprint cycle management
- `release-workflow` — deploy to production
- `incident-response` — production incident handling
- `wiki-maintenance` — keep wiki current

### By Intent (Auto-Routing)
Just describe what you need. The orchestrator matches to the right workflow or agent automatically. See `orchestrator/routing-rules.md` for the full routing table.

---

## Quality Gates

When a gate blocks progress, you will see:
```
GATE: [gate name] — BLOCKED
Reason: [specific issue]
Required action: [what must be done to proceed]
```

**Never bypass a gate without creating a gate exception document.** See `wiki/decisions/gate-exceptions.md`.

---

## Reading Artifacts

All artifacts have frontmatter with metadata:
```yaml
---
type: prd | adr | handoff | qa-report | release | ...
status: draft | in-review | approved | ...
created: YYYY-MM-DD
author: <agent-id>
---
```

**Status meanings:**
- `draft` — being worked on
- `in-review` — awaiting gate review
- `approved` — gate passed, ready for use
- `implemented` — completed
- `archived` — no longer active but preserved for history

---

## Wiki Maintenance

After any significant work, an agent should update the wiki. If it doesn't, prompt:
```
Please update the wiki with the decisions made in this session.
```

Wiki writes go to:
- `wiki/decisions/` — any decision worth preserving
- `wiki/architecture/` — architecture knowledge
- `wiki/research/` — research findings
- `wiki/incidents/` — incident learnings

---

## Memory Management

The `memory/` directory stores persistent context for future agent sessions. After a major project or decision, check that key learnings are in memory:
```
Please update the memory with the key constraints and decisions from this work.
```

Memory files are read at the start of each session where they're relevant. They must be concise — one key fact per file, not full project histories.

---

## Emergency Protocols

### Incident (P1/P2)
Prefix your message with `!incident` — this bypasses normal routing and immediately invokes the incident response workflow.

### Override
Prefix with `!override` to bypass workflow routing for the current request. The override is logged to `memory/overrides.md`.

---

## Troubleshooting

**"Agent ignored a constraint I established"**
→ The constraint may not have been in the handoff envelope. Add it explicitly to the handoff and re-invoke.

**"Output doesn't match the template"**
→ The agent may have had too much unstructured context. Invoke with explicit template reference: "Use `templates/prd-template.md`"

**"Gate failed but I believe the artifact is good enough"**
→ Create a gate exception at `wiki/decisions/gate-exceptions.md` with your justification, then proceed.

**"I can't find the artifact"**
→ Ask: "Where did you save the artifact? Please provide the exact file path."

**"Workflow got stuck"**
→ Check `memory/workflow-state/<workflow-id>.yaml` for current step status. Re-invoke from the blocked step with the required input.
