# Context Manager

Governs how context is assembled, compressed, and passed between agents. Built on the principles from `Agent-Skills-for-Context-Engineering`.

## Core Problem

Multi-agent workflows suffer from context rot: agents receive too much irrelevant history, causing degraded output quality and wasted tokens. This module enforces **minimum viable context** at every agent invocation.

---

## Context Layers (Read Order)

When assembling context for any agent invocation, load in this order:

```
Layer 1: AGENT IDENTITY (always included)
  → agents/<agent>.md system prompt

Layer 2: TASK CONTEXT (always included)
  → orchestration envelope from execution-engine.md
  → specific artifact or request being handled

Layer 3: RELEVANT WIKI (summarized, conditional)
  → only wiki pages directly relevant to this step
  → pass summary paragraph, not full page

Layer 4: RELEVANT MEMORY (selective, conditional)
  → only memory entries relevant to this domain
  → decisions that constrain this task

Layer 5: UPSTREAM ARTIFACTS (structured reference)
  → artifacts from previous steps this step depends on
  → pass full artifact if <2000 tokens, summary + path if larger

Layer 6: CONSTRAINTS (always included)
  → governance rules that apply to this task
  → quality gates this step must meet
```

---

## Context Budget Per Agent

| Agent Type | Max Context Budget | Notes |
|-----------|-------------------|-------|
| PM agents | 8,000 tokens | PRDs can be long; limit upstream artifacts |
| Architect agents | 6,000 tokens | Tech specs + ADRs; exclude PM prose |
| Engineer agents | 10,000 tokens | Code context; minimize strategy/PM content |
| QA agents | 6,000 tokens | Test specs + implementation; minimal strategy |
| UX agents | 5,000 tokens | Design brief + user research; minimal tech |
| Analytics agents | 6,000 tokens | Data context + business goals |
| Delivery agents | 4,000 tokens | Status + artifacts list; no implementation details |
| Supervisor | 8,000 tokens | Full artifact being reviewed + quality criteria |

---

## Compression Protocol

When an artifact exceeds its budget allocation:

### Step 1: Structured Summary
```
ARTIFACT SUMMARY
━━━━━━━━━━━━━━━━
Name:     <artifact name>
Path:     <file path>
Type:     <PRD | ADR | Tech Spec | etc>
Created:  <date>
Status:   <draft | approved | archived>

KEY DECISIONS:
• <decision 1>
• <decision 2>

CONSTRAINTS ON THIS TASK:
• <what the receiving agent must honor>

FULL ARTIFACT: available at <path>
```

### Step 2: Relevance Filter
Before including any wiki page or memory entry, ask:
- Does the agent need this to complete their specific step?
- Is there a more targeted piece of information?
- Would omitting this cause an error or contradiction?

If all three answers are NO/NO/NO → exclude it.

### Step 3: Hierarchical Loading
For very large projects, structure artifacts as:
```
├── summary.md          (always passed)
├── decisions.md        (passed if relevant)
├── implementation.md   (passed only to engineer-agent)
└── full-spec.md       (passed by reference; agent reads on demand)
```

---

## Context Rot Signals

Route to context repair if agent output shows:
- References to incorrect prior decisions
- Contradicts an existing ADR
- Repeats work already completed
- Ignores constraints that were explicitly set
- Hallucinates system capabilities

When context rot detected: stop, rebuild context from clean state, re-invoke agent.

---

## Memory Lookup Protocol

Before each agent invocation:

```python
# Pseudocode for memory lookup
relevant_memory = []

for entry in memory/organizational-memory.md:
    if entry.domain matches agent.domain:
        if entry.recency > 90_days or entry.importance == "critical":
            relevant_memory.append(entry.summary)

# Cap at 3 most relevant entries to avoid noise
context_additions = relevant_memory[:3]
```

---

## Handoff Context Package

What gets passed between workflow steps (the minimum viable handoff):

```yaml
handoff_context:
  from_step: "<step-id>"
  to_step: "<step-id>"
  
  decisions_made:
    - "<decision and rationale>"
  
  constraints_established:
    - "<constraint the next agent must honor>"
  
  artifacts_produced:
    - name: "<artifact name>"
      path: "<file path>"
      summary: "<2-3 sentence summary>"
  
  open_questions:
    - "<question that next agent should address>"
  
  explicitly_excluded:
    - "<what the next agent should NOT spend time on>"
```

The `explicitly_excluded` field is critical — it prevents agents from re-litigating settled decisions.

---

## Cache Strategy

Following Anthropic's prompt caching best practices:
- Agent system prompts (identity + domain knowledge) → **cache-eligible** (stable)
- Wiki content → **cache-eligible** if unchanged in last hour
- Task-specific context → **never cached** (changes every invocation)
- Handoff envelopes → **never cached**
