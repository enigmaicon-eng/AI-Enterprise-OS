# Source Lineage System

**System ID:** `source-lineage`
**Role:** Tracks the complete lineage of every claim — from final intelligence package back to primary source
**Storage:** `intelligence-memory/source-quality.jsonl` + investigation corpus files

---

## Purpose

Source lineage provides full traceability from conclusions back to primary evidence. It enables:
- Auditability: "How do we know this?"
- Quality control: "Is this claim based on strong or weak evidence?"
- Refresh management: "Which sources need to be re-checked to refresh this claim?"
- Contradiction investigation: "Why do sources disagree?"

Without source lineage, intelligence becomes untraceable assertions. With lineage, every claim can be traced to the specific source that supports it.

---

## Lineage Levels

### Level 01: Claim → Investigation
Every claim in an intelligence package traces to the investigation that produced it.

```
"X market is growing at 18% CAGR" → investigation-id: [id]
```

### Level 02: Claim → Evidence Items
Every claim traces to the specific evidence items that support it.

```
"X market is growing at 18% CAGR" → [ev-1234, ev-5678, ev-9012]
```

### Level 03: Evidence Item → Source
Every evidence item traces to its source.

```
ev-1234 → source: https://gartner.com/report/xyz (Gartner Report, 2024)
ev-5678 → source: https://techcrunch.com/article (TechCrunch, 2024-03)
```

### Level 04: Source → Credibility Record
Every source traces to a quality record.

```
https://gartner.com/report/xyz → source_id: src-[uuid] → credibility: 0.78
```

### Level 05: Source → Source (Citation Chain)
Sources may cite other sources — the lineage tracks the chain.

```
TechCrunch article cites Gartner report
  → TechCrunch (credibility: 0.65) citing Gartner (credibility: 0.78)
  → Primary source: Gartner (higher credibility)
  → Evidence credited at: average(0.65, 0.78) → 0.72
  → OR: use primary source only → 0.78
```

---

## Source Lineage Record

For each unique source used across any investigation:

```json
{
  "source_id": "src-[uuid]",
  "url": "https://example.com/article",
  "url_hash": "[sha256 of normalized URL]",
  "source_type": "engineering_blog | official_doc | press | community | review | academic | filing",
  "domain": "example.com",
  "title": "Article/Page Title",
  "author": "[author if known]",
  "publication_date": "2024-03-15",
  "first_ingested": "2026-05-14",
  "last_used": "2026-05-14",
  "usage_count": 3,
  "investigations_used_in": ["inv-001", "inv-003"],
  "claims_contributed": 5,
  "credibility": {
    "authority_score": 0.82,
    "independence_score": 0.90,
    "verifiability_score": 0.85,
    "recency_at_first_use": 0.95,
    "composite": 0.87
  },
  "bias_flags": [],
  "cites_sources": ["src-[uuid2]"],
  "cited_by_sources": ["src-[uuid3]"],
  "reliability_observations": [],
  "status": "active | stale | unreachable | retracted"
}
```

---

## Lineage Map

The lineage map connects intelligence package claims to their source chain:

```
intelligence-package-[id].md
  └── Finding: "X market growing at 18% CAGR"
        └── Insight: ins-0042
              └── Claims:
                    ├── cl-0091 (confidence: 0.88)
                    │     └── Evidence items:
                    │           ├── ev-1234 → src-0055 (Gartner 2024, credibility: 0.78)
                    │           └── ev-2341 → src-0087 (IDC 2024, credibility: 0.75)
                    └── cl-0093 (confidence: 0.71)
                          └── Evidence items:
                                └── ev-3012 → src-0112 (TechCrunch citing Gartner, credibility: 0.65)
                                      └── cites: src-0055 (Gartner 2024, credibility: 0.78)
                                      └── primary source: src-0055
```

---

## Lineage Query Operations

### "How do we know [claim X]?"
```
1. Find claim X in claim registry
2. Load evidence items for claim X
3. Load source records for each evidence item
4. Display source chain
```

Output:
```
Claim: "X market growing at 18% CAGR"
Confidence: 0.84
Sources:
  [1] Gartner Market Guide 2024 (credibility: 0.78, authority, independent)
      URL: [url] | Date: 2024-Q3
      Verbatim: "...annual growth rate of 18%..."

  [2] IDC Market Forecast 2024 (credibility: 0.75, authority, partially independent)
      URL: [url] | Date: 2024-Q2
      Verbatim: "...consistent with 16-20% growth..."

  [3] TechCrunch (credibility: 0.65, secondary source citing Gartner)
      URL: [url] | Date: 2024-04-15
      Note: Cites Gartner as primary — primary source credited
```

### "Which claims would this source refresh affect?"
```
1. Find all evidence items from source X
2. Find all claims citing those evidence items
3. Find all findings and insights citing those claims
4. Return list of affected claims, confidence impact estimate
```

### "What are the weakest claims in this package?"
```
1. Load all claims from intelligence package
2. Sort by confidence ascending
3. For each claim: show source count and source quality
4. Return: claims with single sources, low-credibility sources, stale sources
```

---

## Citation Chain Analysis

When a secondary source cites a primary:

1. Identify the citation relationship
2. Fetch the primary source if available
3. Verify the secondary source cited correctly:
   - Is the claimed statistic actually in the primary? [CITATION VERIFIED]
   - Is it cited with correct context? [CONTEXT CHECK]
   - Is the primary source itself reliable? [PRIMARY CREDIBILITY]
4. Record citation relationship in lineage map

**Citation chain depth limit:** Track up to 3 levels deep. Anything beyond 3 hops from a primary source is treated as [DISTANT SECONDARY] with credibility penalty.

---

## Lineage Anomaly Detection

Flag these patterns as anomalies in lineage:

### Circular Citation
Source A cites Source B, Source B cites Source A.
Result: Neither is primary. Both get [CIRCULAR CITATION] flag, credibility reduced.

### Missing Primary
Secondary sources all agree on a statistic but no primary source is findable.
Result: Tag as [PRIMARY SOURCE NOT FOUND], credibility capped at 0.60.

### Broken Citation Chain
Secondary source cites a primary that doesn't contain the claimed statistic.
Result: Tag as [CITATION ERROR], remove from primary evidence, move to [WEAK SIGNAL].

### All-Same-Domain Evidence
Multiple sources all from the same domain (e.g., all from company blogs, all from one analyst firm).
Result: Tag as [MONOCULTURE EVIDENCE], flag independence concern.

---

## Storage and Access

### Persistent Storage
All source records: `intelligence-memory/source-quality.jsonl`
Lineage maps: `wiki/intelligence/lineage/[investigation-id]-lineage.json`

### Access Patterns
- Investigation start: load source quality records for relevant domain
- Post-synthesis: generate lineage map for final package
- Audit: query lineage for specific claims
- Refresh: identify stale sources and affected claims

---

## Integration

**Written to by:**
- `evidence-systems/source-validator.md` → writes source quality records
- `synthesis-systems/research-memory-synthesizer.md` → updates usage records

**Read by:**
- `evidence-systems/confidence-scorer.md` → source credibility for scoring
- `synthesis-systems/contradiction-reconciler.md` → source independence check
- `intelligence-pipelines/reporting-pipeline.md` → source registry in reports
- `intelligence-memory/research-graph.md` → source nodes in graph
