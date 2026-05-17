# Evidence Pipeline

**System ID:** `evidence-pipeline`
**Role:** Processes raw evidence from gathering phase into structured, validated, scored corpus ready for synthesis
**Position:** Between evidence gathering and synthesis phases

---

## Purpose

The Evidence Pipeline takes the raw evidence output from the gathering phase and prepares it for synthesis. It is the processing layer between collection and analysis — validating sources, scoring confidence, deduplicating records, and organizing the corpus into a synthesis-ready structure.

Without this pipeline, the synthesis system would receive unvalidated, unscored, potentially redundant evidence that leads to poor synthesis quality.

---

## Pipeline Stages

```
RAW EVIDENCE JSONL
        │
        ▼
STAGE 01: Format Validation
  Verify all required fields present, types correct
        │
        ▼
STAGE 02: Source Validation
  Apply source-validator to all new sources
  Load existing quality records from memory
        │
        ▼
STAGE 03: Deduplication
  Remove near-duplicate evidence items
  Merge same-claim multi-source items
        │
        ▼
STAGE 04: Confidence Scoring
  Apply confidence-scorer to each item
  Compute claim-level confidence
        │
        ▼
STAGE 05: Sub-Question Organization
  Group evidence by sub-question
  Generate coverage report
        │
        ▼
STAGE 06: Context Integration
  Attach context brief entries to relevant evidence
  Flag evidence that should be interpreted with specific context
        │
        ▼
STAGE 07: Corpus Finalization
  Write processed corpus
  Generate corpus manifest
        │
        ▼
PROCESSED EVIDENCE CORPUS (ready for synthesis)
```

---

## Stage Definitions

### STAGE 01: Format Validation

Check every record against the evidence schema:

Required fields:
- `id` — must be unique, format `ev-[uuid]`
- `timestamp` — ISO-8601
- `source_url` — URL or file path
- `claim` — non-empty string
- `claim_type` — one of: fact, trend, estimate, opinion, inference
- `sub_question` — must match a declared sub-question ID
- `confidence_raw` — float 0.0–1.0

Failures:
- Missing `source_url` → mark as [UNSOURCEABLE], do not include in synthesis
- Missing `claim` → discard
- Missing `sub_question` mapping → assign to "Q_UNASSIGNED", flag for manual review
- `confidence_raw` out of range → clamp to [0.0, 1.0], add note

### STAGE 02: Source Validation

For each unique source URL in the corpus:
1. Check if source quality record exists in `intelligence-memory/source-quality.jsonl`
2. If yes: load existing credibility scores
3. If no: run `evidence-systems/source-validator.md` → write new quality record
4. Attach source quality record to all evidence items from that source

Batch: up to 10 concurrent source validations.

### STAGE 03: Deduplication

**Exact duplicate detection:**
- Same `source_url` AND same `claim` (normalized) → keep first, discard second, log

**Near-duplicate detection:**
- Same `source_url`, similar claim (>85% overlap in key terms) → merge with note: "[MERGED: similar claims from same source]"
- Different `source_url`, same claim → keep both, add `corroborates` link, increment `corroboration_count`

**Contradiction tagging:**
- Different `source_url`, directly conflicting claims on same sub-question → add `contradicts` link to both records

**Deduplication report:**
```
Deduplication Results:
  Items before: [N]
  Exact duplicates removed: [N]
  Near-duplicates merged: [N]
  Corroboration links added: [N]
  Contradiction links added: [N]
  Items after: [N]
```

### STAGE 04: Confidence Scoring

Apply `evidence-systems/confidence-scorer.md` to each evidence item:

Inputs per item:
- Source credibility (from Stage 02)
- Claim specificity (computed from claim text)
- Corroboration count (from Stage 03)
- Primary source proximity (from source type)

Output per item:
```json
"confidence": 0.78,
"confidence_factors": {
  "source": 0.82,
  "specificity": 0.75,
  "corroboration": 0.55,
  "proximity": 0.90
},
"confidence_flags": ["SINGLE_SOURCE_TYPE"]
```

Also compute claim-level aggregates and sub-question-level aggregates.

### STAGE 05: Sub-Question Organization

Group evidence by sub-question:

```
Sub-question Coverage Report:
  Q1: [N] items | Avg confidence: 0.82 | Status: SUFFICIENT
  Q2: [N] items | Avg confidence: 0.74 | Status: SUFFICIENT
  Q3: [N] items | Avg confidence: 0.51 | Status: THIN ← flag
  Q4: [N] items | Avg confidence: 0.00 | Status: NO COVERAGE ← escalate
```

Escalation triggers:
- Any PRIMARY sub-question with 0 evidence → HALT and alert orchestrator
- Any PRIMARY sub-question with avg confidence < 0.50 → flag for additional gathering
- Any SECONDARY sub-question with 0 evidence → flag but continue

### STAGE 06: Context Integration

Read context brief entries from `evidence-systems/evidence-tracker.md` (record_type: `context_record`):

For each evidence item, attach relevant context:
```json
"context_notes": [
  "Industry norm: 15-20% margin is typical here — this claim of 30% is above average",
  "Regulatory context: GDPR applies to all EU-scoped claims in this domain"
]
```

Context integration helps synthesis pipeline interpret evidence correctly.

### STAGE 07: Corpus Finalization

Write processed corpus manifest:

```json
{
  "corpus_id": "[investigation-id]-processed",
  "generated": "[ISO-8601]",
  "investigation_id": "[id]",
  "pipeline_version": "1.0",
  "stages_completed": ["format_validation", "source_validation", "deduplication", "confidence_scoring", "subq_organization", "context_integration"],
  "evidence_count": 87,
  "unique_sources": 23,
  "source_types": {
    "web_fetch": 45,
    "web_search": 28,
    "internal_doc": 14
  },
  "confidence_distribution": {
    "high_0.80plus": 34,
    "good_0.70_0.79": 28,
    "moderate_0.60_0.69": 15,
    "low_below_0.60": 10
  },
  "subq_coverage": {
    "Q1": {"count": 18, "avg_confidence": 0.84, "status": "sufficient"},
    "Q2": {"count": 22, "avg_confidence": 0.78, "status": "sufficient"},
    "Q3": {"count": 6, "avg_confidence": 0.52, "status": "thin"}
  },
  "escalation_flags": ["Q3: thin coverage, consider additional gathering"],
  "ready_for_synthesis": true
}
```

---

## Output Files

```
wiki/intelligence/corpus/[id]-processed.jsonl       ← processed evidence corpus
wiki/intelligence/corpus/[id]-processed-manifest.json  ← corpus manifest
intelligence-memory/source-quality.jsonl            ← updated source records
```

---

## Integration

**Called by:** `research-intelligence/orchestrator.md` (after gathering, before synthesis)
**Reads from:**
- `evidence-systems/evidence-tracker.md` — raw corpus
- `intelligence-memory/source-quality.jsonl` — existing source records

**Writes to:**
- Processed corpus file
- `intelligence-memory/source-quality.jsonl` (new source records)

**Feeds:** `intelligence-pipelines/synthesis-pipeline.md`
