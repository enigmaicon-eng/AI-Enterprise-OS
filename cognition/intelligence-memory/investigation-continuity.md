# Investigation Continuity System

**System ID:** `investigation-continuity`
**Role:** Tracks active, paused, and completed investigations — enables continuation across sessions, handoffs, and context window limits
**Storage:** `intelligence-memory/investigation-index.jsonl` + `intelligence-memory/open-threads.jsonl`

---

## Purpose

Research investigations frequently span multiple sessions, context windows, and agent handoffs. The Investigation Continuity system ensures that:
1. No investigation is lost when context resets
2. New sessions can resume exactly where they left off
3. Follow-on investigations inherit the full context of prior work
4. Open research threads are never silently abandoned

This is the persistent state layer for the research intelligence system — the equivalent of Dexter's session context loading, extended to handle multi-session, multi-agent investigations.

---

## Investigation States

```
INITIATED → ACTIVE → [PAUSED] → COMPLETE
                ↓
           ESCALATED → ACTIVE (re-investigation loop)
                ↓
           FAILED (max escalations reached, forced completion)
```

### State Definitions

**INITIATED**
Investigation brief has been written. Evidence gathering has not yet started.
Can be: resumed immediately, cancelled without loss.

**ACTIVE**
Evidence gathering or synthesis is in progress.
Must: save state checkpoint at every phase boundary.
Context risk: HIGH — must write checkpoints frequently.

**PAUSED**
Investigation is mid-stream but context window ended (or agent handed off).
On resume: load last checkpoint, continue from that phase.
State includes: iteration count, evidence corpus path, synthesis stage reached.

**ESCALATED**
Confidence below threshold. Targeted additional gathering in progress.
Behaves like ACTIVE, but with constrained scope.

**COMPLETE**
Intelligence package delivered. Memory flush done. Thread closed.
Index entry is permanent. Evidence corpus is archived.

**FAILED**
Max escalation cycles reached. Package delivered with explicit gaps.
Failure is documented so future investigations know this question is hard.

---

## Investigation Checkpoint Format

Written at every phase boundary:

```json
{
  "investigation_id": "[id]",
  "checkpoint_id": "chk-[N]",
  "timestamp": "[ISO-8601]",
  "state": "ACTIVE",
  "phase_completed": "evidence_gathering",
  "phase_current": "evidence_pipeline",
  
  "mandate": "[original research question]",
  "sub_questions": [
    {"id": "Q1", "text": "[text]", "confidence": 0.84, "status": "sufficient"},
    {"id": "Q2", "text": "[text]", "confidence": 0.51, "status": "thin"},
    {"id": "Q3", "text": "[text]", "confidence": 0.00, "status": "empty"}
  ],
  
  "evidence": {
    "corpus_path": "wiki/intelligence/corpus/[id].jsonl",
    "item_count": 47,
    "source_count": 18,
    "last_query": "[last query string]"
  },
  
  "tool_usage": {
    "calls_used": 38,
    "calls_budget": 60,
    "queries_executed": 28,
    "queries_log_path": "wiki/intelligence/corpus/[id]-queries.jsonl"
  },
  
  "synthesis": {
    "stage_reached": "evidence_pipeline",
    "synthesis_summary_path": null,
    "claim_registry_path": null
  },
  
  "escalations": {
    "count": 0,
    "max": 2,
    "active_escalation": null
  },
  
  "open_questions": [
    "Q3: What is competitor X's enterprise pricing?",
    "Q2: Additional practitioner evidence needed"
  ],
  
  "next_action": "Run evidence-pipeline on current corpus, then check Q2 and Q3 escalation need"
}
```

---

## Session Resume Protocol

When a new session starts for an investigation that was interrupted:

### STEP 01: Load Checkpoint
```
Read: intelligence-memory/investigation-index.jsonl
Find: investigation by topic or mandate keyword
Load: most recent checkpoint for that investigation
```

### STEP 02: Reconstruct Context
From the checkpoint, reconstruct the active investigation state:
1. Load mandate and sub-questions
2. Load evidence corpus (path from checkpoint)
3. Load query log (to avoid re-running queries)
4. Load synthesis outputs completed so far
5. Determine current phase and next action

### STEP 03: Context Injection
Before resuming, inject the compaction summary into active context:
```
INVESTIGATION CONTEXT RESTORED — [investigation-id]
══════════════════════════════════════════════════
Phase completed: [phase]
Evidence: [N] items across [N] sources
Sub-question status:
  Q1: SUFFICIENT (confidence: 0.84)
  Q2: THIN (confidence: 0.51) — needs more gathering
  Q3: EMPTY — no evidence yet
Tool calls used: [N] / [budget]
Next action: [specific next step]
[RESUMING FROM CHECKPOINT chk-[N]]
```

### STEP 04: Resume Investigation
Continue from exactly the stated next action. Do not restart from the beginning.

---

## Open Thread Management

Open threads are research questions that were identified but not answered:

```json
{
  "thread_id": "thread-[uuid]",
  "question": "[specific unanswered question]",
  "context": "[why this question matters + what depends on it]",
  "investigation_id": "[id where this was identified]",
  "date_opened": "2026-05-14",
  "priority": "high | medium | low",
  "domain": "[market | technical | competitive | org | PM]",
  "status": "open | in_progress | answered | deprioritized",
  "answer_investigation_id": null,
  "follow_up_queries": [
    "[query 1 to try]",
    "[query 2 to try]"
  ],
  "blocking": "[any decisions this blocks]"
}
```

### Thread Lifecycle

**Open:** Thread identified, not yet pursued.
**In progress:** A new investigation has picked up this thread.
**Answered:** Answer found, thread closed (reference answering investigation).
**Deprioritized:** Thread is no longer relevant (context changed, question no longer matters).

### Thread Matching

At the start of each new investigation:
1. Search `open-threads.jsonl` for threads matching the new mandate's domain/topic
2. If match found: include those threads as additional sub-questions
3. This ensures open threads are organically resolved as related investigations run

---

## Investigation Index

The master registry of all investigations:

```json
{
  "investigation_id": "[id]",
  "mandate": "[original question]",
  "topic_tags": ["[tag1]", "[tag2]"],
  "domain": "[market | technical | competitive | org | PM]",
  "state": "COMPLETE",
  "started": "2026-05-14T09:00:00Z",
  "completed": "2026-05-14T17:00:00Z",
  "depth": "standard",
  "final_confidence": 0.79,
  "intelligence_package": "wiki/intelligence/2026-05-14-[slug]-intelligence-package.md",
  "evidence_corpus": "wiki/intelligence/corpus/[id].jsonl",
  "key_findings": [
    "[Finding 1 — one sentence]",
    "[Finding 2 — one sentence]",
    "[Finding 3 — one sentence]"
  ],
  "open_threads_created": ["thread-[id1]", "thread-[id2]"],
  "related_investigations": ["[id]"],
  "follow_on_recommended": true,
  "follow_on_reason": "[Why follow-on is recommended]"
}
```

---

## Cross-Investigation Continuity

When a new investigation covers a topic previously investigated:

1. Load prior investigation from index
2. Load validated facts from prior investigation (via evidence-retention)
3. Load prior synthesis summary (context only)
4. DO NOT re-gather evidence already validated with high confidence
5. Focus new investigation on: gaps from prior, stale signals, new sub-questions

This prevents redundant re-investigation of well-established facts while ensuring fresh evidence on time-sensitive claims.

---

## Continuity for Multi-Agent Handoffs

When investigation transfers from one agent session to another:

**Handoff Package (written by departing agent):**
```markdown
## Investigation Handoff: [topic]

**Investigation ID:** [id]
**Checkpoint:** chk-[N]
**Date:** [date]

### Current State
Phase: [current phase]
Evidence: [N] items, confidence by sub-question: [list]
Next action: [exactly what to do next]

### Critical Context
[2-3 sentences of key context the receiving agent must understand]

### Active Issues
[Any escalations, contradictions, or decision points that need resolution]

### Do Not Re-Run
[List of queries already run — do not duplicate]

### Files to Load
- Evidence corpus: [path]
- Query log: [path]
- Synthesis outputs: [paths if any]
- Checkpoint: [path]
```

---

## Integration

**Written to by:**
- `research-intelligence/orchestrator.md` → creates investigation records
- `synthesis-systems/research-memory-synthesizer.md` → closes investigations, writes open threads
- All investigation workflows → write checkpoints at phase boundaries

**Read by:**
- `research-intelligence/orchestrator.md` → checks for prior context at mandate intake
- `research-intelligence/discovery-agent.md` → resumes interrupted investigations
- All domain intelligence agents → inherit prior investigation context
