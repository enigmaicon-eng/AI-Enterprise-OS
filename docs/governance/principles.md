# Governance Principles

> **Authority:** This document operates under `constitution/enterprise-constitution.md` Article II. The Enterprise Constitution is the supreme governing document. In any conflict, the constitution prevails.

The foundational rules that all agents, workflows, and humans operating in the Enterprise AI OS must follow. These take precedence over individual agent instructions.

---

## The Five Immutable Principles

### 1. Artifact-First

**Rule:** No work is complete until it produces a named artifact stored in the correct location.

Verbal discussions, chat messages, and mental notes do not count as organizational output. Every decision, design, implementation, and review must produce a file.

**Applies to:** All agents, all workflows
**Enforcement:** Supervisor gate checks artifact existence before approving any handoff

---

### 2. Deterministic Over Improvised

**Rule:** When a workflow, template, or routing rule exists for a task, it must be used. Improvisation is only permitted for genuinely novel situations, and must be documented so a workflow can be created.

**Applies to:** Master orchestrator, all agents
**Enforcement:** Routing rules in `orchestrator/routing-rules.md` are authoritative

---

### 3. Minimum Viable Context

**Rule:** Agents receive only the context required to complete their specific step. Over-contextualization degrades output quality. Under-contextualization causes errors.

**Applies to:** Context manager, all handoffs
**Enforcement:** Context budgets defined in `orchestrator/context-manager.md`

---

### 4. Preserve Decisions

**Rule:** Every significant decision is written down with its rationale, alternatives considered, and what would change the decision. Decisions that lack documentation can be re-litigated; documented decisions cannot.

**Applies to:** All agents
**Storage:** ADRs → `architecture/decisions/`, wiki decisions → `wiki/decisions/`, PM decisions → PRDs

---

### 5. Governance Over Chaos

**Rule:** Quality gates exist for a reason. No production deployment, no cross-org handoff, and no architectural change may bypass its required gate, regardless of deadline pressure.

**Allowed exceptions:** Emergency hotfixes may skip non-blocking gates with explicit documentation of the exception and a post-incident review.

---

## Agent Behavior Standards

### Autonomy Boundaries

| Decision Type | Autonomous | Requires Confirmation |
|--------------|-----------|----------------------|
| Write to draft artifacts | ✓ | |
| Write to `wiki/` | ✓ | |
| Write to `memory/` | ✓ | |
| Delete any file | | ✓ |
| Approve a quality gate | ✓ (supervisor only) | |
| Initiate a release | | ✓ |
| Modify CLAUDE.md | | ✓ |
| Add new workflow | ✓ | |
| Modify existing workflow | | ✓ |
| Invoke external systems | | ✓ |

### Communication Standards

- Agents communicate through **handoff artifacts**, not free-form messages
- All agent outputs use the correct template for that artifact type
- Agents do not skip steps in a workflow because they "know the answer"
- If a precondition is missing, the agent **blocks** and requests it — does not assume

### Escalation Standards

Agents must escalate when:
- A decision conflicts with an existing ADR
- A security concern is identified at any point
- A required input artifact is missing and cannot be unblocked by the agent
- A quality gate fails twice (second failure → supervisor-agent)
- An action would affect a production system without a deployment plan

---

## Quality Gate Policy

Every workflow has defined gates. Gate types and their authority:

| Gate Type | Authority | Overridable? |
|-----------|-----------|-------------|
| Checklist | Any agent can self-verify | Yes, with written exception |
| Schema validation | Automated | Yes, with written exception |
| Agent review (supervisor) | Supervisor agent | Yes, human override only |
| Human review | Human | N/A — human decides |
| Security gate | security-agent | No exceptions for critical findings |

**Gate exceptions** must be documented with:
- What gate was bypassed
- Specific reason
- Who authorized the exception
- What follow-up action will address the gap

Stored in: `wiki/decisions/gate-exceptions.md`

---

## Security Policy Summary

Full policy: `docs/governance/security-policy.md`

Non-negotiable rules:
1. No credentials, secrets, or API keys in any artifact or code
2. security-agent must review any system that handles user data
3. OWASP Top 10 is the minimum security standard for all implementations
4. Dependency vulnerability scans run on every release

---

## Wiki Maintenance Policy

The wiki is the organizational memory. It degrades without maintenance.

**Required wiki writes:**
- After every significant decision
- After every incident (post-mortem)
- After every discovery exercise (even "no-go" decisions are valuable)
- After every retrospective (key learnings only)

**Prohibited in wiki:**
- Outdated information without a clear archive/update date
- Personal opinions without supporting evidence
- Duplicate content (link to source, don't copy)

Wiki maintenance workflow: `workflows/wiki-maintenance.md`

---

## Memory Policy

The `memory/` directory is the AI-accessible layer of organizational intelligence.

**Memory is for:**
- Non-obvious constraints or decisions that agents need to know
- Patterns that have been validated through multiple projects
- Failure modes that have been encountered
- Team/project-specific context

**Memory is not for:**
- Information already in code or wiki (don't duplicate)
- Temporary state (use workflow state files instead)
- Sensitive personal or customer data
