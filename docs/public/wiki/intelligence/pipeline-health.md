# Intelligence Pipeline Health

**Last Updated:** 2026-05-14 (initialized)
**Status:** GREEN — system initialized, no investigations run yet

---

## Pipeline Metrics

| Pipeline | Invocations | Success Rate | Avg Confidence | Avg Duration |
|----------|------------|-------------|----------------|-------------|
| evidence-gatherer | 0 | — | — | — |
| source-validator | 0 | — | — | — |
| evidence-synthesizer | 0 | — | — | — |
| contradiction-reconciler | 0 | — | — | — |
| insight-extractor | 0 | — | — | — |
| strategic-synthesis | 0 | — | — | — |
| reporting-pipeline | 0 | — | — | — |
| research-memory-synthesizer | 0 | — | — | — |

---

## Investigation Metrics

| Metric | Value |
|--------|-------|
| Total investigations | 0 |
| Completed | 0 |
| Paused | 0 |
| Failed | 0 |
| Average confidence | — |
| Average depth | — |

---

## Memory Health

| Store | Records | Freshness |
|-------|---------|-----------|
| validated-facts.jsonl | 0 | — |
| competitive-signals.jsonl | 0 | — |
| source-quality.jsonl | 0 | — |
| investigation-index.jsonl | 0 | — |
| open-threads.jsonl | 0 | — |
| research-graph.jsonl | 0 | — |

---

## Update Protocol

After each investigation completes, append a row to each table above.
After 20 investigations, compute averages and flag any pipeline below threshold.

Thresholds:
- Success rate warning: < 90%
- Success rate critical: < 75%
- Avg confidence warning: < 0.65
- Avg confidence critical: < 0.50
