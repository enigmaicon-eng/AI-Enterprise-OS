# Multi-Stage Investigation Workflow

**Workflow ID:** `multi-stage-investigation`
**Org Sequence:** RESEARCH-ORCHESTRATOR → DISCOVERY-AGENT → SYNTHESIS-SYSTEMS → INTELLIGENCE-PIPELINES
**Typical Duration:** 1-5 days (shallow: 2-4h, standard: 8h-1d, deep: 2-5d)
**Trigger:** Complex research mandate requiring evidence from multiple domains, or strategic question with high-stakes decision dependency

---

## Purpose

The Multi-Stage Investigation is the master investigative workflow. It coordinates the full research intelligence stack from mandate intake through intelligence package delivery. Use when a single research question requires evidence from multiple domains and the decision stakes are too high for shallow analysis.

```
[Research Mandate]
       │
       ▼
STAGE 01: Mandate Decomposition (Orchestrator)
  │  Gate: Brief complete, tracks assigned
       │
       ▼
STAGE 02: Parallel Evidence Gathering (Discovery Agent × N tracks)
  │  Gate: Evidence corpus meets minimum coverage
       │
       ▼
STAGE 03: First Synthesis Pass (Evidence Synthesizer)
  │  Gate: Claims extracted, contradictions mapped
       │
       ▼
STAGE 04: Contradiction Resolution (Contradiction Reconciler)
  │  Gate: Contradictions classified, unresolved flagged
       │
       ▼
STAGE 05: Confidence Assessment (Confidence Scorer)
  │  Gate: Confidence ≥ 0.60 on primary sub-questions
  │  [If < 0.60 on critical: loop back to Stage 02 targeted re-gather]
       │
       ▼
STAGE 06: Insight Extraction (Insight Extractor)
  │  Gate: ≥3 high-confidence insights produced
       │
       ▼
STAGE 07: Strategic Synthesis (Strategic Synthesis Pipeline)
  │  Gate: Recommendation formed, options documented, risks registered
       │
       ▼
STAGE 08: Intelligence Package Assembly (Reporting Pipeline)
  │  Gate: Package complete, all gates passed
       │
       ▼
STAGE 09: Memory Flush (Research Memory Synthesizer)
  │  Gate: Durable facts written, open threads recorded
       │
       ▼
[Intelligence Package Delivered]
```

---

## Stage Definitions

### STAGE 01: Mandate Decomposition

**Agent:** `research-intelligence/orchestrator.md`
**Duration:** 15-30 minutes

**Actions:**
1. Parse mandate into Research Brief (see orchestrator format)
2. Load prior context from `intelligence-memory/investigation-continuity.md`
3. Check `intelligence-memory/investigation-index.jsonl` for related prior investigations
4. Decompose into 3-7 sub-questions
5. Assign sub-questions to tracks
6. Set depth level and iteration budget

**Output:** `wiki/intelligence/briefs/[date]-[slug]-brief.md`

**Gate:**
- [ ] Research Brief complete with all fields
- [ ] Sub-questions cover all mandate dimensions
- [ ] Investigation tracks assigned
- [ ] Depth and budget set
- [ ] Prior context loaded (or confirmed absent)

---

### STAGE 02: Parallel Evidence Gathering

**Agents:** `research-intelligence/discovery-agent.md` × N tracks
**Duration:** Varies by depth (shallow: 30min, standard: 2-4h, deep: 8-24h)

**Actions (per track):**
1. Execute iterative evidence gathering loop
2. Append results to `evidence-systems/evidence-tracker.md`
3. Trigger micro-compaction if track exceeds 50 items
4. Maintain query log (no repeat queries)
5. Stop when: track confidence ≥ 0.80 OR iteration budget exhausted

**Concurrent tracks (run in parallel):**
- Track A: Primary evidence (web search + fetch)
- Track B: Domain-specific intelligence (market/competitive/technical/org)
- Track C: Counter-evidence (adversarial queries)
- Track D: Memory retrieval (prior investigations, validated facts)

**Output:** `wiki/intelligence/corpus/[id].jsonl`

**Gate:**
- [ ] Minimum 20 evidence items across all tracks (shallow: 10)
- [ ] All sub-questions have at least 1 evidence item
- [ ] Counter-evidence gathered for primary claims
- [ ] Source types include ≥2 independent source categories
- [ ] Query log shows no repeat queries

---

### STAGE 03: First Synthesis Pass

**System:** `synthesis-systems/evidence-synthesizer.md`
**Duration:** 30-60 minutes

**Actions:**
1. Deduplication pass on evidence corpus
2. Claim extraction from all evidence items
3. Cross-reference pass (contradictions + corroboration)
4. Per-sub-question synthesis
5. Cross-domain synthesis
6. Synthesis summary generation
7. Context compaction if budget requires it

**Output:**
- `synthesis-summary-[id].md`
- `claim-registry-[id].json`
- `contradiction-map-[id].json`

**Gate:**
- [ ] All evidence items deduplicated
- [ ] All claims extracted with source citations
- [ ] Contradiction map complete
- [ ] Per-sub-question synthesis complete
- [ ] Synthesis summary produced

---

### STAGE 04: Contradiction Resolution

**System:** `synthesis-systems/contradiction-reconciler.md`
**Duration:** 15-45 minutes

**Actions:**
1. Classify all contradictions (Type A-F)
2. Apply resolution strategy per type
3. Gather tiebreaker evidence for Type E (factual) conflicts
4. Produce reconciled claims registry
5. Preserve minority views
6. Generate resolution log

**Gate:**
- [ ] All contradictions classified
- [ ] Resolution documented for each
- [ ] Unresolved contradictions flagged with decision implications
- [ ] Confidence adjustments applied
- [ ] Minority views preserved

---

### STAGE 05: Confidence Assessment

**System:** `evidence-systems/confidence-scorer.md`
**Duration:** 15-30 minutes

**Actions:**
1. Score each claim on multi-factor confidence model
2. Aggregate per-sub-question confidence
3. Identify critical sub-questions below threshold (< 0.60)
4. Generate gap report for sub-threshold questions

**Escalation trigger:** If any critical sub-question is < 0.60 confidence AND gap can be addressed by additional evidence gathering → loop back to Stage 02 with targeted queries. Maximum 2 loop iterations.

**Gate:**
- [ ] All claims scored
- [ ] Per-sub-question confidence calculated
- [ ] Gap report generated
- [ ] Escalation decision made (loop or proceed)

---

### STAGE 06: Insight Extraction

**System:** `synthesis-systems/insight-extractor.md`
**Duration:** 30-60 minutes

**Actions:**
1. Cross-claim pattern search
2. Evidence-deficit scan
3. Trajectory analysis
4. Structural decomposition
5. Surprise test on all candidates
6. Validation and ranking

**Minimum:** 3 validated insights with confidence ≥ 0.60

**Gate:**
- [ ] Minimum 3 high-confidence insights
- [ ] Each insight traces to ≥2 evidence claims
- [ ] Each insight has stated implication and falsification
- [ ] Insights ranked by composite score
- [ ] Surprise test applied (observations separated from insights)

---

### STAGE 07: Strategic Synthesis

**System:** `synthesis-systems/strategic-synthesis.md`
**Duration:** 30-60 minutes

**Actions:**
1. Situation assessment (facts / inferences / assumptions)
2. Force field analysis
3. Strategic option generation (3-5 options)
4. Option evaluation matrix
5. Primary recommendation formation
6. Risk register
7. Next steps (30-day action list)

**Gate:**
- [ ] All recommendations trace to insights (no ungrounded recommendations)
- [ ] Assumptions explicit
- [ ] 3-5 genuinely distinct options generated
- [ ] "Do nothing" considered
- [ ] Risk register complete
- [ ] Next steps actionable (owner + date)

---

### STAGE 08: Intelligence Package Assembly

**System:** `intelligence-pipelines/reporting-pipeline.md`
**Duration:** 15-30 minutes

**Actions:**
1. Assemble full intelligence package from all stage outputs
2. Apply quality gates checklist
3. Calculate overall investigation confidence
4. Flag any unresolved issues
5. Write to `wiki/intelligence/`

**Output:** `wiki/intelligence/[date]-[slug]-intelligence-package.md`

**Gate (full checklist):**
- [ ] All sections present (see orchestrator output format)
- [ ] All claims have source citations
- [ ] Contradictions surfaced (not suppressed)
- [ ] Recommendations trace to insights trace to evidence
- [ ] Confidence scores justified
- [ ] Open threads documented

---

### STAGE 09: Memory Flush

**System:** `synthesis-systems/research-memory-synthesizer.md`
**Duration:** 15-30 minutes

**Actions:**
1. Extract validated facts (confidence ≥ 0.80, ≥3 sources)
2. Record source quality data
3. Write competitive signals with TTL
4. Record open threads
5. Add to investigation index
6. Update research graph

**Gate:**
- [ ] Validated facts written to `intelligence-memory/validated-facts.jsonl`
- [ ] Open threads written to `intelligence-memory/open-threads.jsonl`
- [ ] Investigation added to `intelligence-memory/investigation-index.jsonl`
- [ ] Source quality records updated

---

## Depth Profiles

| Depth | Iterations | Tool Budget | Tracks | Min Evidence | Duration |
|-------|-----------|-------------|--------|-------------|----------|
| Shallow | 1-5 | 20 calls | 2 | 10 items | 2-4h |
| Standard | 6-15 | 60 calls | 3 | 30 items | 8h-1d |
| Deep | 16-30 | 150 calls | 4-5 | 60 items | 2-5d |

---

## When to Use

**Use this workflow when:**
- Research mandate spans ≥2 intelligence domains
- Decision stakes are high (roadmap, architecture, market entry)
- Evidence must be independently validated (no assumptions allowed)
- Prior investigation context must be incorporated

**Use simpler workflows when:**
- Question is within a single domain (use domain-specific workflow instead)
- Quick answer acceptable with lower confidence
- Human will do primary research (use `research-intelligence/pm-intelligence.md` for framing only)
