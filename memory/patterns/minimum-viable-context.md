---
type: pattern
domain: architecture
importance: high
created: 2026-05-08
project: organizational
expires: never
---

# Pattern: Minimum Viable Context

## The Pattern

Each agent receives the minimum context required to complete its specific step — no more, no less.

**Context budget by agent type:**
- PM agents: 8,000 tokens
- Architect agents: 6,000 tokens
- Engineer agents: 10,000 tokens (code context is dense)
- QA agents: 6,000 tokens
- UX agents: 5,000 tokens
- Analytics agents: 6,000 tokens
- Delivery agents: 4,000 tokens
- Supervisor: 8,000 tokens

**When to apply:** Every agent invocation via the context manager.

## Why This Pattern Exists

LLM output quality degrades when the context contains irrelevant information. A PM agent given full code context will produce worse PRDs than one given only user research and business objectives. Focused context produces focused output.

Source: `Agent-Skills-for-Context-Engineering` research (cited Peking University 2026).

## How to Apply

When assembling context for an agent:
1. Load agent identity (always)
2. Load task context (always)
3. Load relevant wiki refs (summarized, conditional)
4. Load relevant memory (selective)
5. Load upstream artifacts (summary if > 2000 tokens)
6. Load constraints (always)

When budget is exceeded: summarize → filter by relevance → load hierarchically (summary first)
