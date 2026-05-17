---
type: wiki
status: current
created: 2026-05-08
updated: 2026-05-14
canonical-ref: ../../architecture/agent-topology.md
---

# Agent Topology

**Canonical document:** `architecture/agent-topology.md`

---

## Two Interaction Models

The OS runs two interaction models simultaneously:

**Demand-driven execution** — User or orchestrator triggers an agent. Agents communicate through artifacts and handoff envelopes only; no direct agent-to-agent calls. Output: work artifacts, gate verdicts.

**Schedule-driven intelligence** — The twin engine runs autonomously every 4 hours (and on anomaly detection). It syncs the four digital twins from the execution ledger, runs simulations, generates predictions, and surfaces alerts back to the orchestrator. Output: prediction reports, early warnings.

---

## Topology at a Glance

```
Human → Master Orchestrator → Execution Agents (144, 17 orgs)
                │                      │
                │ IMMEDIATE alerts      │ writes events
                │◄──────────────────────┼────────────────────────────┐
                │                      ▼                             │
                │              Execution Ledger (ground truth)       │
                │                      │                             │
                │              Twin Sync (event-driven + batch)      │
                │                      │                             │
                │              4 Digital Twins:                      │
                │              org · workflow · delivery · runtime   │
                │                      │                             │
                │              Simulation Engine (10 simulators)     │
                │                      │                             │
                └──────────────Prediction Engine──────────────────────┘
                                org-forecaster
                                operational-forecaster
                                bottleneck-predictor
                                governance-risk-predictor
```

---

## Key Topology Properties

**Artifact-driven communication** — Agents write artifacts and handoff envelopes; the orchestrator reads the handoff and invokes the next agent. No agent-to-agent API calls.

**Context inheritance (6 layers)** — Each agent receives: identity, task spec, relevant wiki pages, memory entries, upstream artifacts, applicable constraints. For routing decisions, a 7th layer injects active prediction state (IMMEDIATE alerts always; HIGH predictions for involved units).

**Digital twin write exclusivity** — Only the twin engine and prediction engine write to `memory/digital-twins/`. Execution agents read from it but never write to it.

**Intelligence escalation path** — IMMEDIATE predictions → master-orchestrator alert. HIGH predictions → `wiki/intelligence/` (picked up next session). The intelligence layer operates at T3 authority; it escalates to T4/T5 but doesn't take those decisions itself.

**Recovery autonomy** — On session interrupt, the recovery-orchestrator classifies the state (RS-01 to RS-09) and routes to the appropriate recovery agent (warm-resume, cold-start, interruption-recovery, etc.) without human intervention, unless the state is RS-09 (runaway).

---

## Agent Authority Tiers

| Tier | Who | Decisions |
|------|-----|-----------|
| T5 | Human operator | CRITICAL governance violations, RS-09, budget decisions |
| T4 | Executive agents (CPO, CTO, VPs) | Go/no-go on release, major reorg, policy changes |
| T3 | Supervisor, Governance, AI-Native, Meta-org | Gate verdicts, recovery escalation, prediction recalibration |
| T2 | Domain orgs (PM, Arch, Eng, QA, UX, Delivery, Analytics…) | Workflow execution, artifact production, routine handoffs |
| T1 | Execution orgs (Engineering, Runtime) | Implementation, tool execution |

The digital twin intelligence layer operates at T3.

---

## Agents with Deep Twin Integration

| Agent | How it uses the twin |
|-------|---------------------|
| `master-orchestrator` | Receives IMMEDIATE alerts; reads saturation level before routing; checks delivery confidence |
| `delivery-agent` | Reads sprint health and carry-over risk before sprint decisions |
| `governance-agent` | Reads governance-risk-predictor; responds to gate compliance alerts |
| `qa-agent` | Reads quality degradation predictions; adjusts review depth accordingly |
| `architect-agent` | Reads dependency-simulator output for cross-team work reviews |

---

**Full documentation:** `architecture/agent-topology.md`  
**Digital twin system:** `wiki/systems/digital-twin-system.md`  
**Communication patterns:** `orchestrator/routing-rules.md`
