# Context Window Protocol
**ID:** ARCH-CWP-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Defines the Context Window Protocol (CWP) — the standard for how agents manage, compress, and hand off context across multi-step workflows and cross-session continuations. Context window exhaustion is a primary cause of workflow failure, agent confusion, and silent capability degradation. This protocol enforces context budgets, defines the HandoffPacket format, and mandates progressive summarization.

---

## Context Budget Model

Every agent invocation has a declared context budget:

```yaml
context_budget:
  agent_id: string
  workflow_id: string
  step_id: string
  
  total_window_tokens: number            # model's max context window
  budget_allocation:
    system_prompt: number                # reserved; fixed
    workflow_state: number               # current workflow state
    working_memory: number               # in-progress reasoning
    knowledge_retrieval: number          # retrieved KUs
    conversation_history: number         # prior turns (compressed)
    handoff_packet: number               # incoming context from prior step
    output_reservation: number           # reserved for generation
    
  utilization_target: 0.75              # never exceed 75% of window
  warning_threshold: 0.65               # warn at 65%, begin compression
  critical_threshold: 0.80              # hard stop; summarize before continuing

budget_enforcement:
  on_warning: begin progressive summarization of conversation_history
  on_critical: summarize to HandoffPacket immediately; do not proceed without summarization
  on_overflow: reject invocation; return CONTEXT_OVERFLOW error to orchestrator
```

---

## HandoffPacket Schema

The canonical format for context transfer between workflow steps and across sessions:

```yaml
handoff_packet:
  packet_id: HP-{workflow_id}-{step_id}-{timestamp_epoch}
  schema_version: "1.0"
  
  origin:
    workflow_id: string
    step_id: string
    agent_id: string
    completed_at: ISO8601
    
  # What was accomplished (required; max 500 tokens)
  accomplished:
    summary: string                      # 1-3 sentences max
    artifacts_produced: [string]         # file paths or artifact IDs
    decisions_made: [string]             # key decisions with rationale
    
  # What the next step needs (required; max 800 tokens)
  continuation_context:
    current_state: string               # where we are in the workflow
    open_questions: [string]            # unresolved questions needing next agent
    constraints: [string]              # constraints discovered during this step
    warnings: [string]                 # risks or concerns for next agent
    
  # Resolved references (optional; max 400 tokens)
  resolved_references:
    key_ids: {string: string}          # e.g., {workflow_id: WF-005, sprint_id: SP-042}
    agent_assignments: {string: string} # active agent → role mapping
    
  # Metadata
  token_count: number                   # self-reported; validated by receiver
  compressed_from_tokens: number | null # if summarized from larger context
  compression_ratio: number | null
  
  # Integrity
  sha256: string                        # SHA-256 of packet content (excluding this field)
```

**Hard limit: 2,000 tokens total per HandoffPacket.** Validated at creation and receipt.

---

## Progressive Summarization Protocol

When context utilization reaches warning_threshold (65%), progressive summarization begins:

```
Stage 1 (65–75% utilization): Compress conversation_history
  - Summarize oldest N turns into a running summary block
  - Retain exact text of last 3 turns (working memory)
  - Target: reduce conversation_history by 50%
  
Stage 2 (75–80% utilization): Compress knowledge_retrieval
  - Identify KUs no longer referenced in recent reasoning
  - Replace full KU content with KU-ID reference (fetch-on-demand if needed)
  - Target: reduce knowledge_retrieval by 60%
  
Stage 3 (>= 80% utilization — CRITICAL): Create HandoffPacket + truncate
  - Generate HandoffPacket from current state
  - Clear conversation_history (replaced by HandoffPacket)
  - Clear knowledge_retrieval (replaced by references)
  - If still > 80%: truncate working_memory to most recent reasoning only
  - Log CONTEXT_COMPRESSION event to execution-ledger.jsonl
  
Never truncate:
  - System prompt (constitutional principles live here)
  - Current step instructions
  - output_reservation
```

---

## Cross-Session Continuity

When a workflow spans multiple sessions (interrupted and resumed):

```
Session end:
  1. Generate HandoffPacket for current step
  2. Append HandoffPacket to workflow checkpoint in execution-ledger.jsonl
  3. Record HandoffPacket hash in workflow state
  
Session resume:
  1. Load HandoffPacket from checkpoint
  2. Verify HandoffPacket SHA-256 matches checkpoint record
  3. Inject HandoffPacket into context budget (handoff_packet allocation)
  4. Resume from continuation_context.current_state
  5. Log CONTEXT_RESUMED event to execution-ledger.jsonl

If HandoffPacket is missing or corrupted:
  - Do not attempt to continue from memory or inference
  - Escalate to orchestrator: WORKFLOW_CONTEXT_LOST
  - Orchestrator attempts recovery from last valid checkpoint
  - If no valid checkpoint: T3 alert; workflow requires human restart
```

---

## Agent Compliance Requirements

All agents must:

1. Declare a context_budget at invocation start (validated by agent runtime)
2. Monitor utilization every 10 reasoning turns
3. Trigger progressive summarization at the correct thresholds
4. Generate a HandoffPacket before any step boundary
5. Validate incoming HandoffPackets (check SHA-256, token count ≤ 2,000)
6. Log CONTEXT_OVERFLOW, CONTEXT_COMPRESSION, and CONTEXT_RESUMED events

Non-compliant agents: flagged in agent health scoring (governance dimension penalty).

---

## Monitoring

```yaml
context_window_metrics:
  # Per agent, per invocation
  peak_utilization: 0.00–1.00
  compressions_performed: number
  handoff_packets_generated: number
  context_overflow_events: number         # target: 0
  
  # Aggregate (rolling 24h)
  avg_peak_utilization: 0.00–1.00        # target: < 0.75
  compression_rate: 0.00–1.00            # % of invocations requiring compression
  overflow_rate: 0.00–1.00               # target: 0
  avg_handoff_packet_tokens: number      # target: < 1,500 (well under 2,000 limit)
```

Alert if: overflow_rate > 0 (any overflow is an architecture failure), avg_peak_utilization > 0.80.

---

## Governance

**Protocol version:** 1.0 (changes require Architecture Org ADR)
**HandoffPacket limit:** 2,000 tokens (hard, validated; not configurable per-agent)
**Context budget template:** Available in templates/context-budget-template.yaml
**Audit:** Context compression events to `memory/runtime/context-events.jsonl`
**Compliance gate:** WF-006 (AI feature delivery) checks all new agents for CWP compliance
