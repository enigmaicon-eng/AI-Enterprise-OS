---
layer: knowledge-governance
type: cross-agent-consistency-protocol
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-agent
authority: knowledge-systems-architect-agent
---

# Cross-Agent Consistency Protocol

The rules that ensure all agents in the Enterprise AI OS share a consistent view of organizational truth, even when operating in different sessions, on different initiatives, or with different context packages.

---

## The Consistency Problem

In a multi-agent system where each agent session starts fresh, consistency is not automatic. Without explicit coordination:

- Agent A in session 1 writes that there are 128 agents
- Agent B in session 2 writes that there are 144 agents
- Agent C reads both and doesn't know which to trust

The cross-agent consistency protocol solves this by defining: what must be consistent, how consistency is achieved, and what happens when inconsistency is detected.

---

## Consistency Dimensions

### Factual Consistency
All agents share the same factual understanding of the OS's current state: agent count, integration count, open questions, active workflows, current maturity score.

**Enforcement:** Factual claims are sourced from T3+ documents only. Agents are prohibited from asserting facts from session memory if a T3+ source contradicts.

### Temporal Consistency
All agents agree on which decisions are current vs. superseded, which questions are open vs. resolved, which risks are active vs. closed.

**Enforcement:** All time-sensitive facts include timestamps. Agents check the timestamp of any claim before using it. Claims >90 days old require re-validation before acting on them.

### Ontological Consistency
All agents use shared terminology with identical definitions. The word "workflow" means the same thing to every agent.

**Enforcement:** Context packages include the relevant ontology vocabulary files. Agents producing governance-critical artifacts verify term usage against `ontology/core-concepts.md`.

### Structural Consistency
All agents agree on the organization structure: which agents exist, what their roles are, how routing works.

**Enforcement:** All structural facts are sourced exclusively from `agents/MASTER-REGISTRY.md` and `agents/ROUTING-TABLE.md`. These are T3 sources and may not be contradicted by any lower-tier artifact.

---

## The Consistency Anchor

Each session, the executive-orchestrator-agent loads the **Consistency Anchor** — a minimal, authoritative snapshot of organizational facts that all agents must agree on:

```yaml
consistency-anchor:
  session-id: "{session-id}"
  loaded-at: "{timestamp}"
  facts:
    agent-count: 144
    org-count: 17
    integration-count: 33
    open-questions: [Q-001, Q-002, Q-003, Q-004, Q-005]
    active-gaps: [GAP-INT-001, ..., GAP-INT-007]
    current-maturity: "2.3/5"
    system-version: "3.0.0"
    constitution-status: "DRAFT — not yet ratified"
  sources:
    agent-count: "agents/MASTER-REGISTRY.md"
    integration-count: "integrations/MASTER-INTEGRATION-REGISTRY.md"
    open-questions: "memory/open-questions.md"
    active-gaps: "integrations/CAPABILITY-GAP-TRACKER.md"
```

All agent dispatches receive the consistency anchor as mandatory context. If an agent produces an artifact that contradicts the consistency anchor, it is flagged as an inconsistency.

---

## Pre-Dispatch Consistency Check

Before any agent is dispatched for governance-critical work, the context-routing-engine performs a consistency check:

1. Load agent's planned context package
2. Extract all factual claims in the context package
3. Verify each claim against the consistency anchor
4. Flag any claim that contradicts the anchor
5. Resolve: update the claim in context to match the anchor before dispatch

This prevents agents from operating on stale context they received from a lower-tier source.

---

## Post-Output Consistency Check

After an agent produces an artifact, `hallucination-detection-agent` performs:

1. Extract all factual claims in the artifact
2. Cross-reference each claim against T3+ sources
3. Score consistency: [0 contradictions = PASS, 1-2 = WARN, 3+ = FAIL]
4. WARN: flag artifact for human review, proceed cautiously
5. FAIL: artifact returned to producing agent for correction before downstream use

---

## The Anti-Drift Protocol for Knowledge

Adapted from ruflo's anti-drift swarm coordination:

**Hierarchical Knowledge Topology:** One knowledge leader per domain (Raft leader). The leader's state is canonical during the session. All other agents in that domain are followers — they read from the leader, not from their own cached copies.

**Specialized Roles:** Each agent has a defined knowledge domain. Agents do not produce authoritative claims outside their domain without explicit authority grant.

**Frequent Consistency Gates:** Before any multi-step knowledge workflow proceeds to the next step, a consistency check verifies that the output of the previous step aligns with all T3+ sources.

**Rollback on Drift:** If an agent's output is found to have drifted from authoritative sources by >10% of factual claims, the output is rolled back and the agent is re-dispatched with corrected context.

---

## Named Knowledge Domains

Each knowledge domain has a designated owner who holds Raft leadership for that domain:

| Domain | Knowledge Owner | Leader During Session |
|---|---|---|
| Agent topology | executive-orchestrator-agent | Raft leader for agent facts |
| Integration state | enterprise-systems-agent | Raft leader for integration facts |
| Product decisions | senior-pm-agent | Raft leader for product facts |
| Architecture | principal-architect-agent | Raft leader for technical facts |
| Security posture | security-architect-agent | Raft leader for security facts |
| Quality standards | qa-agent | Raft leader for quality facts |
| Financial / ERP | fintech-pm-agent | Raft leader for financial facts |
| Organizational knowledge | knowledge-systems-architect-agent | Raft leader for meta-knowledge |

---

## Cross-Session Consistency Handoff

At session end, the cross-agent-continuity-agent writes a consistency summary:

```yaml
cross-session-consistency-handoff:
  session-id: "{session-id}"
  consistency-facts-updated:
    - claim: "agent-count is 144"
      source: "agents/MASTER-REGISTRY.md"
      confidence: HIGH
  knowledge-added:
    - path: "{new-artifact-path}"
      type: "{artifact-type}"
      domain: "{domain}"
  contradictions-resolved:
    - contradiction-id: "CONT-NNN"
      resolution: "{summary}"
  contradictions-open:
    - contradiction-id: "CONT-NNN"
      status: OPEN
      next-session-action: "{required-action}"
  next-session-consistency-anchor: "{anchor-file-path}"
```

This handoff is stored in `handoffs/{date}/consistency-handoff.md` and loaded at the start of the next session before any other agent is dispatched.
