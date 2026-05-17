---
layer: memory-governance
type: context-compression-protocol
version: 1.0.0
created: 2026-05-10
owner: cross-agent-continuity-agent
authority: knowledge-systems-architect-agent
---

# Context Compression Protocol

The rules and algorithms for reducing context size when a context package exceeds an agent's token budget, while preserving all information necessary for correct execution.

Context compression is a load-bearing subsystem — incorrect compression degrades agent output quality more than almost any other failure mode.

---

## Why Compression Is Necessary

Agent context budgets exist because:
1. Large contexts degrade output quality (the "lost in the middle" effect)
2. Larger contexts cost more tokens and increase latency
3. Minimum viable context is Governance Principle 3

When the assembled context package for an agent dispatch exceeds the budget, compression must produce a smaller package that preserves all execution-critical information.

---

## Context Budget Table

| Agent Tier | Context Budget | Mandatory Layer | Domain Layer | Task Layer |
|---|---|---|---|---|
| T0 (template) | 2,000 tokens | 500 | 0 | 1,500 |
| T1 (Haiku) | 8,000 tokens | 1,000 | 2,000 | 5,000 |
| T2 (Sonnet) | 25,000 tokens | 2,000 | 8,000 | 15,000 |
| T2 (Opus) | 60,000 tokens | 2,000 | 15,000 | 43,000 |
| T3 (Orchestrator) | 80,000 tokens | 5,000 | 25,000 | 50,000 |

Budgets are allocated across three layers:
- **Mandatory layer:** Governance context always included (constitution summary, principles, ontology relevant sections)
- **Domain layer:** Domain-specific memory and wiki content
- **Task layer:** Task-specific artifacts and step context

---

## Compression Trigger

Compression is triggered when:
`assembled_context_tokens > tier_budget × 0.90` (triggers at 90% capacity, not 100%)

The 10% headroom is reserved for: agent reasoning trace, output structure, and mid-task context additions.

---

## Compression Algorithm: Tiered Reduction

Compression applies in stages. Each stage is only triggered if the previous stage was insufficient.

### Stage 0: Token Estimation (Pre-Compression)
Before assembling the context package, estimate its token size. Use the formula:
`estimated_tokens = sum(len(entry.content) / 3.5)` (average chars-per-token for English prose)

If `estimated_tokens > budget × 0.90`: proceed to Stage 1.

### Stage 1: Deduplication (Target: -10%)
Remove redundant content. If two context entries make the same claim, keep only the higher-tier source. Remove entries that are pure cross-links to other entries in the context package.

Adapted from ruflo's context compression: eliminate what's already covered.

### Stage 2: Relevance Filtering (Target: -20%)
Score each context entry by relevance to the current task. Remove entries with relevance score < 30. Keep all entries with relevance score ≥ 70. For entries 30–70: keep if they are in the mandatory layer, remove otherwise.

Relevance score factors:
- Domain match with current task domain (0–40 points)
- Keyword overlap with task description (0–30 points)
- Recency (0–15 points: newer = more relevant)
- Explicit citation by workflow step spec (0–15 points: cited = always keep)

### Stage 3: Distillation (Target: -30%)
For entries that must remain but are too long: distill to their key points. Extract:
1. All binding constraints (rules, limits, hard decisions)
2. All action items or required outputs
3. All named entities (agent IDs, file paths, decision IDs)
4. All quantitative facts (counts, scores, dates, percentages)
5. The first sentence of each section (topic sentence)

Remove: explanatory prose, historical context, rationale (summarize to one sentence), examples.

Adapted from dexter's microcompact pattern — aggressive extraction of execution-critical information.

### Stage 4: Summarization (Target: -40%)
For entries that survive Stage 3 but are still large: request a one-paragraph summary from a T1 agent. The summary must include: all binding constraints, all required actions, all named entities.

Note: Stage 4 introduces a secondary LLM call (T1 Haiku for summarization). This adds ~500ms latency but is justified for contexts >50K tokens being delivered to an Opus agent (saves significant cost).

### Stage 5: Hard Truncation (Last Resort)
If Stages 1–4 still leave the context above budget: truncate by excluding the lowest-relevance entries entirely. Log: which entries were excluded and why. Include a note in the context package: "CONTEXT TRUNCATED: following entries were excluded due to token budget. Agent should request specific entries if needed."

Hard truncation is a failure mode, not a design choice. If Stage 5 triggers frequently, the context budget is too small or the context assembly logic is too aggressive.

---

## Compression Quality Assurance

After compression, verify:

```
QUALITY CHECKS:
  1. No binding constraints removed (governance rules, ADR constraints, quality gates)
  2. No human-required gate removed (agent must know when to stop for human approval)
  3. All canonical file paths preserved (agent needs to reference artifacts correctly)
  4. No named entities lost (agents must reference specific IDs by name)
  5. Task specification intact (what the agent needs to produce)
  6. Compression ratio ≤ 70% (removed >70% of context = too aggressive)
```

If any quality check fails: increase the compression budget by 20% and re-apply Stages 1–4.

---

## Context Compression Metrics

Track compression events to tune the system:

| Metric | Formula | Target |
|---|---|---|
| Compression frequency | Compressions / total dispatches | <15% of dispatches trigger compression |
| Average compression ratio | (original - compressed) / original | 20–40% (optimal range) |
| Stage 4/5 frequency | Stage 4 or 5 triggers / total compressions | <5% of compressions reach Stage 4 |
| Quality check failure rate | Failed checks / total compressions | <1% |
| Context efficiency | Task-relevant tokens / total tokens | ≥70% |

---

## Compression Audit Trail

Every compression event is logged:

```yaml
# Appended to memory/compression-log.md
compression-event:
  timestamp: "{ISO-8601}"
  session-id: "{session-id}"
  agent-id: "{agent-id}"
  task-type: "{routing-key}"
  original-tokens: N
  compressed-tokens: N
  compression-ratio: "X%"
  stages-applied: [1, 2, 3]
  entries-removed: N
  entries-distilled: N
  quality-check-passed: true
  notes: ""
```

Compression logs are reviewed monthly by `cross-agent-continuity-agent` to identify context budget tuning opportunities.

---

## Decompression on Error

If an agent produces a clearly incomplete or confused output that may be attributable to over-compression:

1. Retrieve the original (pre-compression) context package from session state
2. Re-dispatch the agent with the full context, overriding the budget for this specific dispatch
3. Log: compression-error event with compression ratio and quality score of the failed output
4. If compression-error occurs ≥3 times for the same agent tier: increase that tier's budget by 20%
