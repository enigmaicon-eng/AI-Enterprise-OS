# Intelligence Memory Index

**System ID:** `memory-index`
**Role:** Master index of all intelligence memory files, their contents, and access patterns
**File:** Always loaded at investigation start — kept compact

---

## Purpose

The Memory Index is the entry point to the intelligence memory system. It tells any agent:
1. What memory files exist and what they contain
2. How to read from and write to each memory store
3. Which memory stores to check for a given mandate type
4. The current state and health of the memory system

---

## Memory File Registry

### Primary Memory Stores

| File | Type | Contents | TTL | Size |
|------|------|----------|-----|------|
| `validated-facts.jsonl` | JSONL | Structural + domain facts (Class A+B) | Indefinite / 12-24mo | Growing |
| `competitive-signals.jsonl` | JSONL | Competitor-specific signals (Class C) | 30-90 days | Rolling |
| `source-quality.jsonl` | JSONL | Source credibility records (Class D) | Indefinite | Growing |
| `investigation-index.jsonl` | JSONL | All investigation records (Class E) | Indefinite | Growing |
| `open-threads.jsonl` | JSONL | Unanswered research questions | 90 days | Rolling |
| `contradictions.jsonl` | JSONL | Contradiction records | Indefinite | Growing |
| `research-graph.jsonl` | JSONL | Graph nodes and edges | Indefinite | Growing |

### Archive Stores

| File | Type | Contents |
|------|------|----------|
| `archive/expired-facts.jsonl` | JSONL | Expired validated facts (reference only) |
| `archive/superseded-facts.jsonl` | JSONL | Facts superseded by newer evidence |

---

## Memory Load Protocol

At the start of every investigation, load memory in this order:

### Step 01: Check Investigation Index
```
Read: intelligence-memory/investigation-index.jsonl
Filter: investigations matching mandate domain/topic keywords
Load: investigation IDs, key findings (5 bullets each), open threads created
Purpose: avoid re-investigating, inherit prior context
```

### Step 02: Load Validated Facts
```
Read: intelligence-memory/validated-facts.jsonl
Filter: facts matching mandate domain and topic tags
Status check: flag facts with TTL > 50% consumed as [AGING]
Load: fresh and aging facts as prior context
Skip: expired or stale facts (load as [NEEDS REFRESH] hints only)
```

### Step 03: Load Competitive Signals (if mandate is competitive or PM)
```
Read: intelligence-memory/competitive-signals.jsonl
Filter: signals for competitor(s) relevant to mandate
Status check: flag signals past TTL as [STALE — VERIFY]
Load: fresh signals only as primary context
```

### Step 04: Check Open Threads
```
Read: intelligence-memory/open-threads.jsonl
Filter: threads matching mandate domain
Status: open threads only (skip answered/deprioritized)
Action: include matching open threads as additional sub-questions
```

### Step 05: Load Source Quality Records (for known sources)
```
Read: intelligence-memory/source-quality.jsonl
Filter: sources from domains relevant to mandate
Load: credibility records for those sources
Purpose: instant credibility scoring when those sources appear
```

---

## Memory Write Protocol

At the end of every investigation, write memory in this order:

### Step 01: Write Validated Facts
```
Source: synthesis output — claims with confidence ≥ 0.80 AND ≥ 2 sources
Write to: intelligence-memory/validated-facts.jsonl
Check first: does equivalent fact already exist? → merge or supersede
```

### Step 02: Write Competitive Signals
```
Source: competitive intelligence findings
Write to: intelligence-memory/competitive-signals.jsonl
Include: TTL based on signal type
```

### Step 03: Update Source Quality Records
```
Source: all sources used in investigation
Write to: intelligence-memory/source-quality.jsonl
Merge: update usage_count, last_used, investigations for existing sources
```

### Step 04: Write Open Threads
```
Source: gap report — unanswered sub-questions
Write to: intelligence-memory/open-threads.jsonl
Include: follow-up queries, priority, blocking status
```

### Step 05: Write Investigation Index Record
```
Source: investigation metadata
Write to: intelligence-memory/investigation-index.jsonl
Include: key findings (5 max), open threads created, follow-on recommended
```

### Step 06: Update Research Graph
```
Source: all nodes and edges from investigation
Write to: intelligence-memory/research-graph.jsonl
Include: all high-confidence claim nodes, all entity nodes, all edges
```

---

## Memory Query Patterns

### By Domain
```
To find all memory relevant to a domain (e.g., "market"):
  Read validated-facts.jsonl WHERE domain = "market"
  Read competitive-signals.jsonl WHERE signal_type in [any]
  Read investigation-index.jsonl WHERE domain = "market"
  Read open-threads.jsonl WHERE domain = "market"
```

### By Entity (Competitor, Market, Technology)
```
To find everything known about entity X:
  Read competitive-signals.jsonl WHERE competitor = "X"
  Read research-graph.jsonl WHERE entity.label = "X" → follow edges to claims
  Read investigation-index.jsonl WHERE mandate CONTAINS "X"
```

### By Topic Keywords
```
To find memory matching keywords [k1, k2, k3]:
  Full-text search across:
    - validated-facts.jsonl: fact field
    - investigation-index.jsonl: mandate + key_findings
    - open-threads.jsonl: question field
    - research-graph.jsonl: node label fields
```

### By Freshness
```
To find facts that need refresh:
  Read validated-facts.jsonl WHERE last_refreshed < today - (ttl_days × 0.5)
  Read competitive-signals.jsonl WHERE expires < today + 7 days
```

---

## Memory Health Status

Assessed at each investigation start:

```
Intelligence Memory Health
════════════════════════════════
validated-facts.jsonl: [N] records | [N] fresh | [N] aging | [N] expired
competitive-signals.jsonl: [N] records | [N] fresh | [N] stale
source-quality.jsonl: [N] sources tracked
investigation-index.jsonl: [N] investigations | [N] complete | [N] paused
open-threads.jsonl: [N] open | [N] high-priority
research-graph.jsonl: [N] nodes | [N] edges | [N] unresolved contradictions

Health: GOOD | NEEDS_REFRESH | STALE
Next sweep recommended: [date]
```

---

## Memory System Governance

### What Gets Written
Only write to memory what will be useful in a FUTURE investigation:
- Validated facts (high confidence, durable)
- Source quality records (reused across many investigations)
- Investigation index (enables continuity)
- Open threads (prevents losing research questions)
- Competitive signals (time-sensitive, must be explicitly included)

### What Does NOT Get Written
- In-progress investigation state (use investigation continuity checkpoints instead)
- Raw evidence items (stored in corpus files, not memory)
- Synthesis outputs (stored in wiki, not memory)
- Low-confidence claims (below 0.60)
- Temporary context (relevant only to current session)

### Memory Size Management
When any memory file exceeds 500 records:
1. Archive records past their TTL to `archive/`
2. Consolidate similar validated facts (merge if identical)
3. Prune investigation index entries older than 12 months to summary-only format

---

## Integration

**This file is read by:**
- All research intelligence agents (at session start)
- `research-intelligence/orchestrator.md` (mandate intake)
- `research-intelligence/discovery-agent.md` (investigation resume)

**This file is updated by:**
- `synthesis-systems/research-memory-synthesizer.md` (after each investigation)

**All memory operations flow through:**
- Write: `research-memory-synthesizer.md`
- Read: direct JSONL reads by any agent
- Governance: `intelligence-memory/evidence-retention.md`
- Lineage: `intelligence-memory/source-lineage.md`
- Graph: `intelligence-memory/research-graph.md`
- Continuity: `intelligence-memory/investigation-continuity.md`
