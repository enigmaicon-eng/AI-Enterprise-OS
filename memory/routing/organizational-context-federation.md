---
layer: memory-routing
type: organizational-context-federation
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
---

# Organizational Context Federation

The protocol for sharing context across organizational boundaries — between domain namespaces, business units, and agent organizations — while preserving security, relevance, and coherence.

Context federation is the knowledge equivalent of federated identity: each domain owns its memory, but authorized agents can read across boundaries with the right credentials.

---

## Federation Model

```
ENTERPRISE KNOWLEDGE FEDERATION

  [Product Domain]      [Engineering Domain]    [Security Domain]
       │                      │                      │
  [product namespace]   [engineering namespace] [security namespace]
       │                      │                      │ (RESTRICTED)
       └──────────────────────┴──────────────────────┘
                              │
                    [context-routing-engine]
                              │
                    [shared organizational layer]
                              │
                    [context package → agent dispatch]
```

When a cross-domain task requires knowledge from multiple namespaces, the federation protocol manages access.

---

## Federation Access Rules

### Rule 1: Home Domain Priority
Every agent has a home domain. Home domain entries are always included at full priority before cross-domain entries.

### Rule 2: Cross-Domain Read = Read-Only
Reading from a foreign domain namespace does not grant write access. Agents cannot modify foreign namespace entries, regardless of what they read.

### Rule 3: Permission Tier Gates
Cross-domain reads are gated by the requesting agent's clearance level:

| Agent Tier | OPEN Namespace | RESTRICTED | CONFIDENTIAL | CLASSIFIED |
|---|---|---|---|---|
| T1-T2 (domain) | Read ✓ | Home domain only | No | No |
| T3 (orchestration) | Read ✓ | Read ✓ | Metadata only | No |
| T4 (strategic) | Read ✓ | Read ✓ | Read ✓ | Metadata only |
| T5 (constitutional) | Read ✓ | Read ✓ | Read ✓ | Read ✓ |

### Rule 4: Purpose Limitation
Cross-domain reads are logged with their stated purpose. If an agent reads security-domain entries for a product task, this is flagged for review.

### Rule 5: Minimum Cross-Domain Context
When cross-domain context is needed, only the minimum necessary subset is federated — not the entire foreign namespace. The context-routing-engine applies the task-relevance filter before including any cross-domain entry.

---

## Cross-Domain Context Scenarios

### Scenario A: Product-Architecture Cross-Domain (OPEN)
When senior-pm-agent is working on a PRD for a technically complex feature, it benefits from reading relevant architecture constraints:

```
Home domain: product namespace (full read)
Cross-domain read: engineering namespace (OPEN)
  → Included: active ADR binding constraints related to this feature area
  → Included: known technical risks from engineering namespace
  → Excluded: internal engineering discussions, code-level details
  
Federation grant: automatic (T2 agent accessing OPEN namespace)
```

### Scenario B: Engineering-Security Cross-Domain (RESTRICTED)
When backend-engineer-agent implements a security-sensitive feature, it needs security domain context:

```
Home domain: engineering namespace (full read)
Cross-domain read: security namespace (RESTRICTED)
  → Included: OWASP constraints relevant to this feature type
  → Included: prior security decisions for similar features
  → Excluded: internal security audit details, vulnerability disclosures
  
Federation grant: automatic for T2 agents accessing RESTRICTED for their primary function
Purpose: security-sensitive feature implementation
```

### Scenario C: Finance-Legal Cross-Domain (CONFIDENTIAL)
When fintech-pm-agent writes a compliance PRD, it needs legal domain context:

```
Home domain: product + finance namespace
Cross-domain read: legal namespace (CONFIDENTIAL)
  → Included: relevant regulatory requirements
  → Included: compliance constraints
  → Excluded: specific legal opinions, litigation strategy
  
Federation grant: requires T4 approval (vp-product-agent) for CONFIDENTIAL access
```

---

## The Federated Context Package

When a context package includes cross-domain entries, the package marks them clearly:

```yaml
context-package:
  home-domain: product
  home-entries: [{...}, ...]
  
  federated-entries:
    - entry-path: "memory/domains/engineering/security-constraints.md"
      source-domain: engineering
      permission-tier: OPEN
      included-sections: ["Binding constraints for API design"]
      excluded-sections: ["Implementation details", "Internal reviews"]
      federation-reason: "Technical PM task requires engineering constraints"
      
    - entry-path: "memory/domains/security/owasp-requirements.md"
      source-domain: security
      permission-tier: RESTRICTED
      included-sections: ["Input validation requirements"]
      federation-reason: "Security-sensitive feature implementation"
      
  federation-audit-id: "{UUID}"  # logged for compliance
```

---

## Business Unit Federation

When the OS serves multiple business units, BU-level federation applies:

### Within-BU Federation
All agents within the same BU have access to that BU's namespace at their permission tier. No additional grants needed.

### Cross-BU Federation
Agents from BU-A reading BU-B's namespace require:
1. An explicit federation grant signed by BU-B's knowledge custodian
2. The grant specifies: which namespace sections, which agents, for how long
3. The grant is logged in `memory/bus/{bu-b}/federation-grants.md`
4. The grant expires (default: 90 days; extendable)

### Enterprise Layer (Cross-BU Shared)
Certain knowledge is designated as enterprise-layer and shared across all BUs:
- Enterprise constitution and governance principles
- Cross-BU architectural decisions (ADRs affecting all BUs)
- Shared integration state (integrations used by multiple BUs)
- Enterprise-wide risk registry
- Enterprise ontology

---

## Federation Audit Trail

Every cross-domain context read is logged:

```yaml
# Appended to memory/federation-audit-log.md
federation-read:
  timestamp: "{ISO-8601}"
  requesting-agent: "{agent-id}"
  requesting-domain: "{domain}"
  source-domain: "{domain}"
  source-namespace: "{path}"
  permission-tier: "{tier}"
  grant-type: "AUTOMATIC|EXPLICIT"
  grant-reference: "{grant-id if explicit}"
  purpose: "{stated purpose from routing key}"
  entries-read: N
  entries-excluded: N
  session-id: "{session-id}"
```

Federation audit logs are reviewed quarterly by `compliance-governance-agent` to identify:
- Patterns of excessive cross-domain access (potential scope creep)
- Access denials that indicate permission model gaps
- BU cross-access patterns that should be formalized as permanent grants

---

## Context Federation for Multi-Agent Tasks

When multiple agents from different domains collaborate on the same task (e.g., architecture + security + product):

Each agent receives their home domain context plus specifically-scoped cross-domain reads for the collaboration.

The collaboration context is assembled by `agent-coordination-agent` using the federation protocol. A shared collaboration namespace is created for the duration of the multi-agent task:

```
memory/collaboration/{task-id}/
├── shared-context.md    ← context shared by all collaborating agents
├── product-view.md      ← product domain perspective (product agents read)
├── architecture-view.md ← architecture perspective (architecture agents read)
└── security-view.md     ← security perspective (RESTRICTED: security agents only)
```

The collaboration namespace is ephemeral — it is created for the task and archived when the task completes.
