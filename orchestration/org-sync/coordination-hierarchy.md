---
layer: organizational-synchronization
type: coordination-hierarchy
version: 1.0.0
created: 2026-05-10
owner: master-orchestrator-agent
authority: enterprise-architecture-council
---

# Coordination Hierarchy

The authority hierarchy for coordination decisions in the Enterprise AI OS. Defines who coordinates whom, who can override what, and how coordination authority flows.

---

## Hierarchy Overview

```
T5: CONSTITUTIONAL TIER
  enterprise-constitution-guardian-agent
  ├── Authority: Constitutional interpretation, override any T4 decision
  ├── Coordinates: Nothing (initiates from human request)
  └── Coordinates with: T4 on constitutional matters

T4: STRATEGIC TIER
  vp-engineering-agent, chief-architect-agent, vp-product-agent
  ├── Authority: Strategic coordination across organizations
  ├── Coordinates: All T3 agents + inter-org coordination
  └── Reports to: T5 (constitutional challenges) or human operator

T3: ORCHESTRATION TIER
  master-orchestrator-agent, knowledge-systems-architect-agent,
  organizational-learning-agent, agent-coordination-agent
  ├── Authority: Workflow orchestration, cross-domain coordination
  ├── Coordinates: All T2 agents in their domain + cross-domain T2
  └── Reports to: T4 (strategic decisions, risk escalations)

T2: DOMAIN TIER
  All specialist agents (PM, Architecture, Engineering, QA, Security, etc.)
  ├── Authority: Domain-specific tasks and decisions
  ├── Coordinates: T1 agents they supervise + peer T2 agents (collaborative)
  └── Reports to: T3 orchestrator for their domain

T1: EXECUTION TIER
  junior-engineer-agent, test-engineer-agent, documentation-agent
  ├── Authority: Execution tasks with defined schemas
  ├── Coordinates: No agents (leaf tier)
  └── Reports to: Their T2 domain supervisor
```

---

## Coordination Authority Table

| Coordination Action | Minimum Authority | Override Authority |
|---|---|---|
| Dispatch a single T1 agent | T2 | T3 |
| Dispatch a single T2 agent | T3 | T4 |
| Fan-out to parallel T2 agents | T3 | T4 |
| Insert a human gate | T2 (for peer review), T3 (for human approval) | T4 |
| Abort a running workflow | T3 | T4 |
| Override a domain Raft leader | T4 | T5 |
| Change routing rules | T4 | T5 |
| Emergency preemption | T3 | T4 |
| Declare a coordination deadlock | T3 | T4 |

---

## Coordination Escalation Path

Every task has a defined escalation chain. The escalation chain is injected into every context package:

```yaml
# Standard escalation chain for domain agent dispatch
escalation-chain:
  - tier: T2
    agent: "{domain-specialist-agent}"
    when: "task within domain authority"
  - tier: T3
    agent: "master-orchestrator-agent"
    when: "cross-domain coordination, workflow issues, loop detection"
  - tier: T4
    agent: "chief-architect-agent OR vp-engineering-agent"
    when: "strategic decisions, authority conflicts, CRITICAL risk"
  - tier: T5
    agent: "enterprise-constitution-guardian-agent"
    when: "constitutional questions, fundamental governance disputes"
  - tier: HUMAN
    agent: "human-operator"
    when: "Any of: constitutional change, CRITICAL risk, human gate, deadlock"
```

**Escalation rules:**
- Agents may not skip tiers (T2 escalates to T3, not T4)
- Exception: CRITICAL risk events may escalate directly to T4
- Exception: Constitutional violations escalate directly to T5
- Escalation is mandatory when agent confidence < 75 on a HIGH+ risk task

---

## Inter-Organization Coordination

When a task requires agents from multiple organizations:

```
Single-org coordination:
  master-orchestrator-agent dispatches within the org
  → T3 orchestrator has authority within the org

Multi-org coordination (2-3 orgs):
  agent-coordination-agent (T3) coordinates cross-org
  → Assigns sub-tasks to each org's T2 specialists
  → Runs consensus at fan-in if cross-org outputs conflict

Enterprise-wide coordination (4+ orgs):
  master-orchestrator-agent + agent-coordination-agent co-coordinate
  → Master-orchestrator handles overall workflow
  → Agent-coordination-agent handles org-to-org synchronization
  → Escalation to T4 if inter-org conflict cannot be resolved
```

### Cross-Org Handoff Protocol
When work is handed from one org to another:

```yaml
cross-org-handoff:
  from-org: "{org-name}"
  from-agent: "{agent-id}"
  to-org: "{org-name}"
  to-agent: "{agent-id}"
  handoff-at: "{ISO-8601}"
  
  artifact-transferred:
    - path: "{artifact-path}"
      type: "{type}"
      confidence: {N}
      
  context-summary: "{key context the receiving org needs — max 500 tokens}"
  
  open-questions-transferred: ["{Q-NNN}"]
  
  blocking-conditions-transferred:
    - "{anything that will block the receiving org}"
    
  expected-outputs:
    - type: "{artifact-type}"
      deadline: "{ISO-8601}"
```

---

## Coordination Hierarchy Override Protocol

When a T4 agent overrides a T3 decision:

1. Override must be documented (no silent overrides)
2. Override reason must reference: which principle, ADR, or risk finding triggered the override
3. T3 agent is notified (not just their decision reversed — they must understand why)
4. If T3 agent believes the override is incorrect, they may escalate to T5 (but cannot block T4 in the interim)
5. Override is logged in decision record

**Anti-pattern:** T4 routinely overriding T3 indicates either T3 agents need more authority clarity, or T4 is over-involved. Both patterns are flagged in the monthly meta-organization review.

---

## Coordination During Knowledge Domain Transitions

When a workflow crosses domain Raft leadership:

```
Example: Feature development workflow
  Step 1-3: Product domain (Raft leader: senior-pm-agent)
  Step 4:   Security domain (Raft leader: security-architect-agent)
  Step 5-7: Engineering domain (Raft leader: principal-architect-agent)

At each domain transition:
  1. Prior Raft leader writes domain handoff summary
  2. New Raft leader reads handoff summary as part of their context
  3. Any domain-specific constraints from prior domain are preserved
  4. New Raft leader takes full authority for their domain steps
  5. Coordination engine tracks all active Raft leaders for this workflow
```

---

## Emergency Coordination

When a CRITICAL incident or risk requires immediate re-coordination:

```
Emergency coordination sequence:
  1. Any agent detecting CRITICAL risk emits emergency.coordination.required
  2. master-orchestrator-agent receives event within 60 seconds
  3. All current workflows are paused (not aborted)
  4. master-orchestrator-agent assembles emergency context package
  5. T4 agent is immediately dispatched for emergency assessment
  6. Emergency assessment determines: continue (resume), re-route, or abort
  7. Paused workflows resume with updated coordination plan
  8. Human notification sent within 15 minutes of emergency trigger

Emergency authority:
  master-orchestrator-agent has authority to pause any workflow without T4 approval
  Only T4+ can abort a workflow in emergency context
  Human operator must approve any CRITICAL risk resolution strategy
```