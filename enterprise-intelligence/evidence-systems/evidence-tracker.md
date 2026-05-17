# Evidence Tracker

**System ID:** `evidence-tracker`
**Role:** Append-only JSONL evidence log for active investigations — the primary evidence store for all research in-progress
**Storage format:** JSONL (one JSON record per line)
**Persistence:** Active investigations → `wiki/intelligence/corpus/[investigation-id].jsonl`

---

## Purpose

The Evidence Tracker is the core evidence store for all active research investigations. Every piece of evidence gathered during an investigation passes through the tracker. It is append-only (never modify or delete), supports query deduplication, and enables the synthesis pipeline to process the complete evidence corpus.

This is the direct analog of Dexter's `scratchpad.ts` — the JSONL-based append-only store that tracks all tool results, enables duplicate detection, and provides reporting on what was gathered and from where.

---

## Tracker Architecture

### File Structure

Each investigation gets a dedicated JSONL corpus file:

```
wiki/intelligence/corpus/
  [investigation-id].jsonl       ← active evidence corpus (append-only)
  [investigation-id]-queries.jsonl   ← query log (deduplication)
  [investigation-id]-meta.json       ← investigation metadata
  full-docs/
    [investigation-id]-[hash].txt    ← large document storage
```

### Record Types

The tracker stores multiple record types in the same JSONL stream:

**Type: evidence**
```json
{
  "record_type": "evidence",
  "id": "ev-[uuid]",
  "timestamp": "2026-05-14T10:23:00Z",
  "tool_used": "WebFetch",
  "query": "kafka production lessons learned engineering blog",
  "source_url": "https://engineering.example.com/kafka-lessons",
  "source_type": "engineering_blog",
  "source_date": "2024-03-15",
  "source_credibility_default": 0.80,
  "claim": "Kafka achieves sustained 1M messages/sec throughput on 3-node cluster with 3-broker replication",
  "claim_type": "fact",
  "verbatim": "We sustained over 1 million messages per second with a 3-node Kafka cluster",
  "sub_question": "Q2",
  "confidence_raw": 0.82,
  "contradicts": [],
  "corroborates": [],
  "notes": ""
}
```

**Type: query_log**
```json
{
  "record_type": "query_log",
  "id": "ql-[uuid]",
  "timestamp": "2026-05-14T10:22:45Z",
  "tool": "WebSearch",
  "query": "kafka production lessons learned engineering blog",
  "query_type": "practitioner",
  "sub_question": "Q2",
  "result_count": 8,
  "results_used": 3,
  "status": "executed"
}
```

**Type: compaction_summary**
```json
{
  "record_type": "compaction_summary",
  "id": "cs-[uuid]",
  "timestamp": "2026-05-14T11:15:00Z",
  "compaction_type": "micro | full",
  "items_compacted": 52,
  "items_preserved": 5,
  "token_savings_pct": 72,
  "summary": {
    "sub_questions_covered": ["Q1", "Q2", "Q3"],
    "key_facts": ["Fact 1", "Fact 2", "Fact 3"],
    "confidence": 0.78,
    "unresolved": ["What is cost at 10x scale?"]
  }
}
```

**Type: tool_limit_warning**
```json
{
  "record_type": "tool_limit_warning",
  "timestamp": "2026-05-14T11:30:00Z",
  "calls_used": 48,
  "calls_budget": 60,
  "pct_used": 80,
  "message": "Approaching tool budget limit. Prioritizing remaining calls to lowest-confidence sub-questions."
}
```

**Type: iteration_marker**
```json
{
  "record_type": "iteration_marker",
  "id": "im-[N]",
  "timestamp": "2026-05-14T11:00:00Z",
  "iteration": 8,
  "evidence_count": 47,
  "confidence_by_subq": {
    "Q1": 0.89,
    "Q2": 0.71,
    "Q3": 0.45
  },
  "action": "continue — Q3 below threshold"
}
```

**Type: rejection_log**
```json
{
  "record_type": "rejection_log",
  "id": "rj-[uuid]",
  "timestamp": "2026-05-14T10:25:00Z",
  "source_url": "https://example.com/page",
  "rejection_reason": "paywalled | not_relevant | date_unknown | quality_fail",
  "notes": "Article is behind paywall — abstract only available"
}
```

---

## Tracker Operations

### Append Evidence
Standard append — write one JSONL line to the corpus file.
Never modify existing lines (append-only invariant).

### Query Deduplication Check
Before executing any new query:
1. Read all `query_log` records from corpus file
2. Compute similarity against new query
3. Return: `execute` | `skip` | `check_prior_results`

### Tool Budget Check
Read all records, count `evidence` + `query_log` records:
```
calls_used = COUNT(query_log WHERE status = "executed")
pct_used = calls_used / budget × 100

if pct_used >= 100: STOP — no more tool calls
if pct_used >= 80:  WARN — write tool_limit_warning record
if pct_used >= 60:  NOTE — de-prioritize low-value queries
```

### Evidence Count by Sub-question
```
SELECT sub_question, COUNT(*) as count, AVG(confidence_raw) as avg_confidence
FROM evidence records
GROUP BY sub_question
ORDER BY avg_confidence ASC  ← lowest confidence first = highest priority for more gathering
```

### Compaction Trigger Check
```
raw_evidence_count = COUNT(evidence records since last compaction_summary)
if raw_evidence_count >= 50: trigger micro-compaction
if total_corpus_size >= context_threshold: trigger full compaction
```

### Status Report
At any point, generate a tracker status report:

```
Evidence Tracker Status — [investigation-id]
════════════════════════════════════════════
Total evidence items: [N]
Unique sources: [N]
Queries executed: [N] / [budget] ([pct]%)
Iterations completed: [N]
Last compaction: [timestamp] (compacted [N] items)

By sub-question:
  Q1: [N] items — Confidence: [0.0-1.0] ████████░░
  Q2: [N] items — Confidence: [0.0-1.0] ██████████
  Q3: [N] items — Confidence: [0.0-1.0] ████░░░░░░ ← LOW

Source type distribution:
  web_search: [N] ([pct]%)
  web_fetch: [N] ([pct]%)
  internal: [N] ([pct]%)

Tool call distribution:
  WebSearch: [N]
  WebFetch: [N]
  Read: [N]
  Write: [N]

Rejections: [N] (reasons: [breakdown])
Query dedup skips: [N] (saves: [N] redundant calls)
```

---

## Investigation Metadata File

Each investigation also has a `[investigation-id]-meta.json`:

```json
{
  "investigation_id": "[id]",
  "mandate": "[original research question]",
  "sub_questions": [
    {"id": "Q1", "text": "[question]"},
    {"id": "Q2", "text": "[question]"}
  ],
  "depth": "shallow | standard | deep",
  "tool_budget": 60,
  "iteration_limit": 15,
  "started": "[ISO-8601]",
  "status": "active | complete | paused",
  "orchestrator_agent": "[agent name]",
  "tracks": ["primary", "competitive", "counter-evidence", "memory"],
  "context_threshold_pct": 80
}
```

---

## Large Document Storage

When fetched content exceeds 50KB:

1. Write full content to `wiki/intelligence/corpus/full-docs/[investigation-id]-[source-hash].txt`
2. In evidence record, note:
   ```json
   "full_doc_path": "wiki/intelligence/corpus/full-docs/[id]-[hash].txt",
   "verbatim": "[first 500 chars as preview]...[TRUNCATED — see full_doc_path]"
   ```
3. The synthesis pipeline can read the full document via `Read` tool when needed

---

## Invariants (Never Violate)

1. **Append-only:** Never modify or delete existing records
2. **Source citation:** Every evidence record must have a source_url or file path
3. **Query logging:** Every tool call must generate a query_log record
4. **Sub-question mapping:** Every evidence record must map to a sub-question
5. **Rejection logging:** Rejected sources must be logged (not silently discarded)
6. **Budget tracking:** Tool calls must be counted against the budget

---

## Integration

**Written to by:** `evidence-systems/evidence-gatherer.md`
**Read by:**
- `synthesis-systems/evidence-synthesizer.md` (corpus for synthesis)
- `evidence-systems/confidence-scorer.md` (items for scoring)
- `evidence-systems/source-validator.md` (sources for validation)
- `research-intelligence/orchestrator.md` (status monitoring)

**Persisted to:** `wiki/intelligence/corpus/[id].jsonl`
