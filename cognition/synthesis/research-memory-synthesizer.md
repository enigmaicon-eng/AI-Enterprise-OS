# Research Memory Synthesizer

**System ID:** `research-memory-synthesizer`
**Role:** Extracts durable knowledge from completed investigations and writes it to persistent memory systems
**Trigger:** Called at end of every investigation, and on context threshold approach
**Output:** Memory chunks written to intelligence-memory system

---

## Purpose

The Research Memory Synthesizer is the bridge between active investigation and persistent organizational memory. It extracts what is worth keeping from a completed investigation and writes it in a form that future investigations can retrieve and build on.

This is the Dexter `flush.ts` analog — extracting durable facts, user preferences, and financial information before compaction — extended to the full enterprise research domain.

Without this system, every investigation starts from zero. With it, each investigation inherits the validated knowledge of all prior investigations.

---

## What Gets Written to Memory

### Category 01: Validated Facts
Claims confirmed by ≥3 independent sources with confidence ≥0.80.

These are durable: they don't expire unless contradicted by future evidence.

```json
{
  "type": "validated_fact",
  "fact": "[specific, precisely stated claim]",
  "domain": "[market | technical | competitive | org | user]",
  "confidence": 0.91,
  "source_count": 4,
  "sources": ["[source1]", "[source2]"],
  "investigation_id": "[id]",
  "date_validated": "[ISO-8601]",
  "expires": null,
  "contradicts": []
}
```

### Category 02: Competitive Signals
Market positioning, product features, pricing, and strategic moves for tracked competitors.

These expire: 30-day TTL for pricing/features, 90-day TTL for strategy, 12-month TTL for structural facts.

```json
{
  "type": "competitive_signal",
  "competitor": "[name]",
  "signal_type": "[pricing | feature | strategy | funding | hiring | positioning]",
  "signal": "[specific signal]",
  "source": "[url or reference]",
  "ingestion_date": "[ISO-8601]",
  "ttl_days": 30,
  "expires": "[ISO-8601]",
  "investigation_id": "[id]"
}
```

### Category 03: Source Quality Records
Credibility assessments for sources used in investigations, so future investigations can weight them appropriately.

```json
{
  "type": "source_quality",
  "source": "[url or reference identifier]",
  "source_type": "[official | analyst | community | press | primary]",
  "credibility_score": 0.85,
  "reliability_notes": "[any reliability patterns observed]",
  "first_used": "[ISO-8601]",
  "usage_count": 3,
  "last_used": "[ISO-8601]"
}
```

### Category 04: Open Research Threads
Sub-questions that were not answered in the investigation, preserved for future investigation.

```json
{
  "type": "open_thread",
  "question": "[specific unanswered question]",
  "context": "[why this question matters]",
  "investigation_id": "[id where this was first identified]",
  "priority": "high | medium | low",
  "created": "[ISO-8601]",
  "follow_up_investigation": null
}
```

### Category 05: Investigation Index
Metadata about completed investigations for graph traversal and continuity.

```json
{
  "type": "investigation_index",
  "investigation_id": "[id]",
  "topic": "[topic]",
  "mandate": "[original question]",
  "date": "[ISO-8601]",
  "depth": "shallow | standard | deep",
  "confidence": 0.78,
  "key_findings": ["[finding 1]", "[finding 2]"],
  "open_threads": ["[thread 1]"],
  "follow_on_recommended": true,
  "related_investigations": ["[id1]", "[id2]"]
}
```

---

## Extraction Process

### Step 01: Durable Fact Extraction

Read the reconciled claims registry. For each claim:
- If confidence ≥ 0.80 AND source_count ≥ 3 AND not time-sensitive → write as validated_fact
- If confidence 0.60–0.79 → write with [MODERATE CONFIDENCE] tag
- If confidence < 0.60 → do NOT write to long-term memory (too thin)
- If time-sensitive (pricing, feature, hiring signal) → write as competitive_signal with TTL

### Step 02: Source Quality Recording

For every source used:
- Record source type and URL
- Record credibility score assigned by source-validator
- Merge with existing source quality record if source was used in prior investigations
- Update usage_count and last_used

### Step 03: Open Thread Extraction

Read the gap report from the investigation:
- For each unanswered sub-question: create open_thread record
- Assign priority based on investigation importance and gap impact
- Link to investigation ID for traceability

### Step 04: Investigation Indexing

Create investigation_index record:
- Summarize key findings (5 bullets maximum — must be self-contained)
- Link to related investigations (same domain, same topic area, same competitor)
- Set follow_on_recommended if open threads are high-priority

### Step 05: Contradiction Update

For each unresolved contradiction in the investigation:
- Check if any validated_fact in memory is contradicted
- If yes: downgrade contradicted fact confidence, add contradiction note
- Create contradiction record in the research graph

---

## Memory Decay Management

Not all memory is equally durable:

| Memory Type | TTL | Refresh Trigger |
|------------|-----|----------------|
| Validated facts (structural) | Indefinite | Contradicted by future evidence |
| Competitive signals (pricing) | 30 days | New investigation on same competitor |
| Competitive signals (features) | 30 days | Changelog update detected |
| Competitive signals (strategy) | 90 days | Major news event |
| Market sizing estimates | 180 days | Industry report refresh |
| Source quality records | Indefinite | Reliability failure observed |
| Open threads | 90 days | Answered or de-prioritized |
| Investigation index | Indefinite | Never expires |

### Decay Management Process

At the start of each investigation:
1. Scan memory for facts relevant to the new mandate
2. Flag any facts past their TTL as [NEEDS REFRESH]
3. Do not use [NEEDS REFRESH] facts as primary evidence (secondary context only)
4. After investigation: refresh stale facts with new investigation evidence

---

## Memory Storage Format

All memory is written to `intelligence-memory/` as JSONL files:

```
intelligence-memory/
  validated-facts.jsonl          ← all durable facts
  competitive-signals.jsonl      ← time-bound competitor signals
  source-quality.jsonl           ← source credibility records
  open-threads.jsonl             ← unanswered research questions
  investigation-index.jsonl      ← completed investigation registry
  contradictions.jsonl           ← contradiction records
```

---

## Context Threshold Flush

When context fills during an active investigation (approaching token limit):

**Priority order for preservation:**
1. Investigation mandate + sub-questions (always preserve)
2. Synthesis summaries (preserve all)
3. Unresolved contradictions (preserve all)
4. Last 5 evidence items per track (preserve recency)
5. High-confidence claims (preserve top 10)
6. Source list (preserve full list, compressed)

**What to flush:**
- Raw evidence items beyond last 5 per track
- Intermediate query results
- Duplicate or near-duplicate evidence

After flush: write all flushed content to `wiki/intelligence/corpus/[id].jsonl` for persistent access via read_file tool.

---

## Integration

**Called by:**
- `research-intelligence/orchestrator.md` → Memory Flush step (Phase 05)
- Also called at context threshold during active investigation

**Writes to:**
- `intelligence-memory/validated-facts.jsonl`
- `intelligence-memory/competitive-signals.jsonl`
- `intelligence-memory/source-quality.jsonl`
- `intelligence-memory/open-threads.jsonl`
- `intelligence-memory/investigation-index.jsonl`

**Read by:**
- All research agents (at investigation start)
- `intelligence-memory/research-graph.md` (for graph building)
- `intelligence-memory/investigation-continuity.md` (for thread continuation)
