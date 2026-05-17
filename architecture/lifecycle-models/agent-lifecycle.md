---
layer: lifecycle-models
type: agent-lifecycle
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: enterprise-architecture-council
---

# Agent Lifecycle

The complete lifecycle of an AI agent in the Enterprise AI OS — from definition through production use to retirement.

---

## Lifecycle Phases

```
PHASE 1: CONCEPTION
  Capability gap or organizational need identified → agent proposed
  
PHASE 2: DEFINITION
  Agent specification written and validated
  
PHASE 3: REGISTRATION
  Agent added to MASTER-REGISTRY.md, routing key assigned
  
PHASE 4: ACTIVATION
  Agent enters production (can be dispatched)
  
PHASE 5: OPERATION
  Normal production operation, monitoring, improvement
  
PHASE 6: EVOLUTION
  Role expanded, contracted, or routing key changed
  
PHASE 7: RETIREMENT
  Agent deprecated and removed from active dispatch
```

---

## Phase 1: Conception

Triggers for proposing a new agent:
| Trigger | Example |
|---|---|
| Unowned capability gap | No agent handles integration health monitoring |
| Routing key collision | Two tasks incorrectly routed to one overloaded agent |
| Domain expansion | New business unit created, needs dedicated PM agent |
| Workflow gap | Workflow step requires reasoning no existing agent does well |
| Research finding | External research reveals a pattern better served by a specialist |

**Proposal output:** Agent conception document in `memory/drafts/agent-proposals/`

**Conception authority:** Domain-tier agents can propose; T3+ authority must approve new agent creation.

---

## Phase 2: Definition

Agent specification must include:

```yaml
# Agent Definition Template
agent-id: "{org-prefix}-{role}-agent"   # e.g. product-senior-pm-agent
display-name: "{Human-readable name}"
org: "{Organization Name}"
tier: T{N}   # T1-T5
routing-key: "{key}"
authority-domain: "{domain}"
escalation-target: "{higher-tier-agent-id}"

capabilities:
  primary: ["{capability-1}", "{capability-2}"]
  secondary: ["{capability-3}"]
  
context-requirements:
  domain-memory: ["{path}"]
  cross-domain-reads: ["{domain}: {tier}"]
  
artifact-authority:
  produces: ["{artifact-type}"]
  approves: ["{artifact-type}"]
  
human-gate-triggers:
  - "{condition requiring human review}"
  
constraints:
  - "{behavioral constraint from governance}
```

**Definition validation:**
- Routing key is unique (no collision with existing agents)
- Tier assignment is consistent with authority level
- Escalation target exists in MASTER-REGISTRY.md
- No circular escalation chains

---

## Phase 3: Registration

Registration process:
1. Add agent to `agents/MASTER-REGISTRY.md` (in correct org section)
2. Add routing key to `orchestrator/routing-rules.md`
3. Update context-routing-engine domain mapping if new routing key introduced
4. Add agent entry to `cognition-indexes/agent-cognition-index.md`
5. Update consistency anchor: increment agent count
6. Emit `agent.registered` event
7. If new org: add org to MASTER-REGISTRY.md org list, update consistency anchor org count

**Registration authority:** knowledge-systems-architect-agent (T3) + chief-architect-agent (T4) for new tier assignments.

---

## Phase 4: Activation

Before an agent can be dispatched for the first time:

**Activation checklist:**
- [ ] Agent spec in MASTER-REGISTRY.md is ACTIVE (not DRAFT)
- [ ] Routing key resolves to this agent in routing-rules.md
- [ ] Context package for this agent's routing key produces valid output (test dispatch)
- [ ] Human gate triggers are correctly configured in workflow definitions
- [ ] Agent is linked to at least one workflow (or is a general-capability agent)
- [ ] Authority chain is complete (escalation path reaches T5 or T4 constitutional agent)

**Activation authority:** master-orchestrator-agent confirms technical readiness; vp-engineering-agent approves for T3+ agents.

---

## Phase 5: Operation

### Normal Operation
- Agent is dispatched for tasks matching its routing key
- Context-routing-engine assembles context package from agent-cognition-index
- Agent produces artifacts per workflow specifications
- Human gates triggered per agent configuration

### Monitoring
| Metric | Target | Alert |
|---|---|---|
| Task success rate | ≥90% | <80% |
| Escalation rate | <10% | >25% |
| Human gate trigger rate | Per design | Unexpected spike |
| Context package relevance (proxy) | ≥85% | <75% |
| Step-limit hits | <5% | >15% |

### Continuous Improvement
- Routing key relevance score reviewed quarterly
- Context package composition reviewed if success rate drops
- Agent capabilities document updated as team learns what works

---

## Phase 6: Evolution

### Routing Key Change
When an agent's primary task evolves:
1. Update routing key in MASTER-REGISTRY.md
2. Update orchestrator/routing-rules.md
3. Update cognition-indexes/agent-cognition-index.md
4. Verify no workflow is broken by the routing key change
5. Emit `agent.routing-key.updated` event

### Tier Promotion
When an agent demonstrates T(N+1) capability:
1. T3+ authority approves promotion
2. Update tier in MASTER-REGISTRY.md
3. Update escalation chain (promoted agent now reports to new peer)
4. Expand authority domain accordingly

### Tier Demotion
Rare — only when role is scoped down:
1. T4+ authority approves demotion
2. Any artifacts the agent was authorizing must be re-assigned
3. Update authority chain to reflect reduced scope

### Org Transfer
When agent moves to a different organization:
1. Update org in MASTER-REGISTRY.md
2. No routing key change required (routing is key-based, not org-based)
3. Update semantic cluster membership in cognition-indexes

---

## Phase 7: Retirement

**Triggers for retirement:**
- Capability made redundant by a new agent
- Domain eliminated (org dissolved)
- Function absorbed by higher-tier agent
- Performance below minimum threshold after improvement attempts

**Retirement protocol:**

1. **Transition period (30 days):**
   - Mark agent as DEPRECATED in MASTER-REGISTRY.md
   - New routing for the routing key transferred to replacement agent
   - Deprecated agent still available for in-flight workflows

2. **Knowledge preservation:**
   - Extract any agent-specific knowledge into domain memory
   - Update cognition-indexes to remove agent-specific entries
   - If agent was Raft leader for a domain → transfer leadership to replacement

3. **Deregistration:**
   - Remove from MASTER-REGISTRY.md (or move to `agents/retired/`)
   - Remove routing key from routing-rules.md (if not transferred)
   - Remove from agent-cognition-index.md
   - Update consistency anchor: decrement agent count
   - Emit `agent.deregistered` event

4. **Audit record:**
   - Retain retirement record in `agents/retired/{agent-id}.md` for 365 days
   - Record: retirement reason, date, replacement agent, knowledge transferred

---

## Agent Lifecycle Governance

| Decision | Authority |
|---|---|
| Propose new agent | T2+ domain agent |
| Approve agent creation | T3+ (knowledge-systems-architect or orchestrator) |
| Approve T4+ agent creation | T4+ (chief-architect or vp-engineering) |
| Routing key change | T3+ |
| Tier promotion | T3+ for T1→T2; T4+ for T2→T3+ |
| Agent retirement | T3+ (if T1-T2); T4+ (if T3-T4); T5 (if T5) |
