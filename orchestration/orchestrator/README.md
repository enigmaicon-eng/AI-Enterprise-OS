# Enterprise AI Orchestrator

The central coordination layer for all AI agents, workflows, and organizational operations.

## Architecture

```
User Intent
    │
    ▼
Master Orchestrator
    │
    ├── Intent Classifier
    ├── Agent Registry
    ├── Workflow Engine
    ├── Context Manager
    └── Artifact Store
         │
         ├── PM Org (pm-agent, strategist, analyst)
         ├── Architecture Org (architect-agent, adr-agent)
         ├── Engineering Org (engineer-agent, security-agent)
         ├── QA Org (qa-agent, test-agent)
         ├── UX Org (ux-agent, design-agent)
         ├── Analytics Org (analytics-agent)
         └── Delivery Org (delivery-agent, release-agent)
```

## Files

| File | Purpose |
|------|---------|
| `master-orchestrator.md` | Core orchestrator agent prompt |
| `agent-registry.md` | Registry of all available agents |
| `routing-rules.md` | Intent → agent/workflow routing logic |
| `execution-engine.md` | Multi-step workflow execution protocol |
| `context-manager.md` | Context lifecycle and compression |
| `supervisor.md` | Supervisor agent for quality control |

## Usage

Start any interaction by invoking the Master Orchestrator. It will:
1. Classify the intent
2. Select appropriate agent(s) or workflow
3. Manage handoffs between agents
4. Produce and store artifacts
5. Update wiki/memory with decisions

## Core Principle

**Every interaction produces an artifact. Every decision is preserved.**
