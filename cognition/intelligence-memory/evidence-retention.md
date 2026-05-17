# Evidence Retention System

**System ID:** `evidence-retention`
**Role:** Defines policies and mechanisms for retaining, expiring, refreshing, and retrieving evidence across investigations
**Storage:** `intelligence-memory/validated-facts.jsonl` + `intelligence-memory/competitive-signals.jsonl`

---

## Purpose

The Evidence Retention System governs what evidence persists across investigations, for how long, and how it should be retrieved. Without a retention policy, the memory system either retains everything (bloated, including stale facts) or retains nothing (every investigation starts from zero).

Good retention policy means: high-value, durable knowledge is available instantly; stale knowledge is flagged for refresh; low-value knowledge is expired gracefully.

---

## Retention Taxonomy

### Class A: Structural Facts
*Facts about fundamental market structures, historical events, regulatory frameworks.*
Properties: Durable, slow to change, high reuse value.

**Examples:**
- "The enterprise software buying cycle typically involves 3-5 stakeholders"
- "Kafka was acquired by Confluent in [year]"
- "GDPR applies to any company processing EU citizen data"
- "B2B SaaS gross margins typically range from 70-85%"

**Retention policy:**
- TTL: Indefinite
- Expiry trigger: Only when directly contradicted by new evidence
- Storage: `intelligence-memory/validated-facts.jsonl` (type: `structural`)
- Minimum source count: 2

---

### Class B: Domain Intelligence
*Facts about market size, technology capabilities, and domain-specific patterns.*
Properties: Moderately durable (1-3 years), moderate reuse value.

**Examples:**
- "Total market for [category] software is $X billion (methodology: bottom-up)"
- "PostgreSQL supports native JSONB indexing from version 9.4+"
- "Enterprise SaaS ACV in this segment ranges from $X to $Y"

**Retention policy:**
- TTL: 12 months (market/technology), 24 months (structural domain facts)
- Refresh trigger: New analyst report, major product version release
- Storage: `intelligence-memory/validated-facts.jsonl` (type: `domain`)
- Minimum source count: 2
- Flag as [NEEDS REFRESH] after TTL

---

### Class C: Competitive Intelligence
*Facts about specific competitors — products, pricing, strategy, positioning.*
Properties: Fast-changing, medium reuse value (must re-verify).

**Examples:**
- "Competitor X prices their starter tier at $Y/month per seat"
- "Competitor X launched async voice notes in Q2 2025"
- "Competitor X is hiring aggressively for ML engineers"

**Retention policy:**
- TTL: 30 days (pricing, features), 90 days (strategy, positioning), 365 days (structural competitive facts)
- Refresh trigger: Investigation of same competitor
- Storage: `intelligence-memory/competitive-signals.jsonl`
- Minimum source count: 1 (but flag single-source)
- Flag as [STALE — VERIFY] after TTL

---

### Class D: Source Quality Records
*Credibility assessments for research sources.*
Properties: Slow to change, high reuse value, applies across all investigations.

**Examples:**
- "engineering.stripe.com: authority 0.85, credibility 0.87"
- "Gartner market sizing reports: note vendor-commission bias risk"
- "G2 reviews for this category: selection bias toward B2B SMB"

**Retention policy:**
- TTL: Indefinite
- Update trigger: New usage with conflicting quality signal
- Storage: `intelligence-memory/source-quality.jsonl`
- No minimum source count (this IS the source quality record)

---

### Class E: Investigation Index
*Records of completed investigations — topic, findings, confidence.*
Properties: Permanent, enables investigation continuity.

**Retention policy:**
- TTL: Indefinite (never expire)
- Storage: `intelligence-memory/investigation-index.jsonl`
- Purpose: Graph traversal, continuity, avoiding re-investigation

---

## Retention Record Format

### Validated Facts (Class A + B)
```json
{
  "fact_id": "fact-[uuid]",
  "class": "A | B",
  "fact": "[precisely stated claim]",
  "domain": "[market | technology | org | user | regulatory]",
  "confidence": 0.87,
  "source_count": 3,
  "sources": [
    {"url": "[url]", "type": "[type]", "date": "[date]"}
  ],
  "investigation_id": "[id]",
  "date_validated": "2026-05-14",
  "ttl_days": null,
  "expires": null,
  "last_refreshed": "2026-05-14",
  "refresh_count": 0,
  "contradicted_by": [],
  "tags": ["[domain-tag]", "[topic-tag]"]
}
```

### Competitive Signals (Class C)
```json
{
  "signal_id": "sig-[uuid]",
  "competitor": "[name]",
  "signal_type": "pricing | feature | strategy | hiring | funding | positioning",
  "signal": "[specific signal]",
  "detail": "[additional context]",
  "source": "[url]",
  "source_date": "[date]",
  "ingestion_date": "2026-05-14",
  "ttl_days": 30,
  "expires": "2026-06-13",
  "status": "fresh | aging | stale",
  "confidence": 0.80,
  "investigation_id": "[id]"
}
```

---

## Retention Lifecycle States

### Fresh
Evidence is within TTL, fully valid for use in investigations.
Action: Use as primary evidence.

### Aging
Evidence is past 50% of TTL, approaching stale.
Action: Use as evidence, but flag for refresh in next investigation.

### Stale
Evidence is past TTL.
Action: Use as context hint only (not primary evidence). Tag: [STALE — VERIFY].
Trigger refresh in current investigation if relevant.

### Refreshed
Evidence was re-verified in a new investigation. TTL reset.
Action: Update `last_refreshed`, reset TTL, update confidence if changed.

### Superseded
New evidence directly contradicts this record. Original is preserved but demoted.
Action: Keep original with tag [SUPERSEDED BY fact-[new-id]]. New fact is primary.

### Expired
TTL has passed AND fact has not been used for 2 TTL periods. Candidate for archive.
Action: Move to `intelligence-memory/archive/expired-facts.jsonl`. Do not use.

---

## Retention Operations

### Write
When a new investigation produces validated facts:
1. Check if equivalent fact already exists in retention store
2. If yes AND confidence is same or lower: update source list, increment source count, reset TTL
3. If yes AND confidence is higher: update fact, confidence, sources, reset TTL
4. If no: write new record

### Read (at investigation start)
1. Load all facts with tags matching investigation domain
2. Filter out [EXPIRED] facts
3. Flag [STALE] facts — include as context but require fresh evidence for primary claims
4. Pass fresh and aging facts to discovery agent as prior context

### Refresh
When an investigation produces evidence about a topic with stale facts:
1. Compare new evidence against stale fact
2. If consistent: refresh TTL, update last_refreshed, increment refresh_count
3. If contradicts: mark old fact [SUPERSEDED], write new fact
4. If evidence is weaker than old fact: do not supersede, flag for manual review

### Expiry Sweep
Run monthly (or manually):
1. Identify all records where `expires < today` AND `last_refreshed < today - (2 × ttl_days)`
2. Move to archive file
3. Log archival in expiry log

---

## Evidence Reuse Rules

**Reuse without verification (fresh facts):**
- Structural facts (Class A): Always reuse without re-verification
- Domain intelligence (Class B, age < 6 months): Reuse without re-verification
- Competitive signals (Class C, age < 30 days): Reuse without re-verification

**Reuse with verification flag (aging/stale):**
- Domain intelligence (Class B, age > 6 months): Tag as [NEEDS REFRESH], use as context
- Competitive signals (Class C, age > 30 days): Tag as [STALE — VERIFY], do not use as primary
- Structural facts (Class A): Reuse but check for contradictions in current corpus

**Do not reuse:**
- Competitive signals older than 12 months without re-verification
- Market sizing older than 24 months without re-verification
- Any fact with [SUPERSEDED] or [EXPIRED] status

---

## Storage Structure

```
intelligence-memory/
  validated-facts.jsonl          ← Class A + B: structural and domain facts
  competitive-signals.jsonl      ← Class C: competitor-specific signals
  source-quality.jsonl           ← Class D: source credibility records
  investigation-index.jsonl      ← Class E: investigation registry
  open-threads.jsonl             ← Unanswered research questions
  contradictions.jsonl           ← Contradiction records
  archive/
    expired-facts.jsonl          ← Expired records (preserved, not used)
    superseded-facts.jsonl       ← Superseded records (preserved for history)
```

---

## Integration

**Written to by:** `synthesis-systems/research-memory-synthesizer.md`
**Read by:**
- `research-intelligence/discovery-agent.md` (at investigation start)
- `intelligence-memory/investigation-continuity.md` (thread tracking)
- `intelligence-memory/research-graph.md` (graph node population)
- All domain intelligence agents (prior context loading)
