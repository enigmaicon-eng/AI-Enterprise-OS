# Intelligence Pipeline Registry

**System ID:** `pipeline-registry`
**Role:** Central registry of all intelligence pipelines, their capabilities, input/output contracts, and routing rules
**Maintained by:** Research Intelligence Orchestrator

---

## Purpose

The Pipeline Registry is the discovery and routing layer for the research intelligence system. When a research mandate arrives at the orchestrator, it consults the registry to select the right combination of pipelines, agents, and workflows for the specific mandate type.

Modeled on Dexter's `tool-registry.ts` — which registers all available tools, their descriptions, concurrency safety properties, and conditional inclusion rules — extended to the full enterprise intelligence pipeline set.

---

## Registered Pipelines

### Group 01: Evidence Gathering Pipelines

| Pipeline | ID | Type | Concurrency | Input | Output |
|----------|-----|------|-------------|-------|--------|
| Evidence Gatherer | `evidence-gatherer` | read | parallel (5) | query + sub-questions | evidence JSONL |
| Contextual Researcher | `contextual-researcher` | read | parallel (3) | mandate context | context brief |
| Source Validator | `source-validator` | read | parallel (10) | source URLs | quality records |

**Concurrency rules:**
- Evidence Gatherer: up to 5 concurrent tool calls per batch
- Contextual Researcher: up to 3 concurrent (simpler queries)
- Source Validator: up to 10 concurrent (lightweight URL checks)

**Conditional inclusion:**
- Contextual Researcher: include if domain context is unknown or partially known
- Skip if `intelligence-memory/validated-facts.jsonl` already contains rich domain context

---

### Group 02: Synthesis Pipelines

| Pipeline | ID | Type | Concurrency | Input | Output |
|----------|-----|------|-------------|-------|--------|
| Evidence Synthesizer | `evidence-synthesizer` | sequential | 1 | evidence JSONL | synthesis summary |
| Contradiction Reconciler | `contradiction-reconciler` | sequential | 1 | contradiction map | reconciled claims |
| Insight Extractor | `insight-extractor` | sequential | 1 | reconciled claims | insight set |
| Strategic Synthesis | `strategic-synthesis` | sequential | 1 | insight set | strategic brief |
| Research Memory Synthesizer | `research-memory-synthesizer` | sequential | 1 | synthesis outputs | memory records |

**Concurrency rules:**
- All synthesis pipelines are sequential (each depends on previous)
- Never run synthesis pipelines concurrently with each other
- Can run synthesis on Track A while Track B continues gathering (cross-track concurrency OK)

**Conditional inclusion:**
- Contradiction Reconciler: always include (contradictions must be identified)
- Strategic Synthesis: include only if mandate requires strategic recommendations
  - Skip for: factual lookups, data gathering only, pure technical research
  - Include for: PM decisions, market entry, competitive response, architecture choices

---

### Group 03: Intelligence Domain Pipelines

| Pipeline | ID | Domain | Depth | Typical Duration |
|----------|-----|--------|-------|-----------------|
| PM Intelligence | `pm-intelligence` | Product | Standard | 2-4h |
| Competitive Intelligence | `competitive-intelligence` | Market | Deep | 4-8h |
| Market Intelligence | `market-intelligence` | Market | Standard | 3-6h |
| Architecture Intelligence | `architecture-intelligence` | Technical | Deep | 4-8h |
| Organizational Intelligence | `organizational-intelligence` | Internal | Shallow | 1-2h |

**Routing rules:**
- PM mandate → `pm-intelligence` + `competitive-intelligence` (light scan)
- Competitive threat → `competitive-intelligence` (deep) + `market-intelligence`
- Market opportunity → `market-intelligence` (deep) + `competitive-intelligence`
- Architecture decision → `architecture-intelligence` (deep) + `organizational-intelligence`
- Strategic horizon → all domain pipelines (multi-stage investigation)

---

### Group 04: Investigative Workflows

| Workflow | ID | Use When | Duration |
|----------|-----|----------|----------|
| Multi-Stage Investigation | `multi-stage-investigation` | Cross-domain, high stakes | 1-5d |
| Deep Dive | `deep-dive` | Single question, exhaustive | 4-24h |
| Competitive Analysis | `competitive-analysis` | Competitive intelligence | 2-8h |
| Market Research | `market-research` | Market intelligence | 2-8h |
| Technical Investigation | `technical-investigation` | Architecture/technology | 2-8h |

**Routing rules:**
```
IF mandate.domains ≥ 2 AND mandate.stakes = HIGH:
  → multi-stage-investigation

IF mandate.domains = 1 AND mandate.depth = DEEP:
  → deep-dive

IF mandate.type = COMPETITIVE:
  → competitive-analysis (calls competitive-intelligence)

IF mandate.type = MARKET:
  → market-research (calls market-intelligence)

IF mandate.type = TECHNICAL:
  → technical-investigation (calls architecture-intelligence)
```

---

### Group 05: Reporting and Memory Pipelines

| Pipeline | ID | Input | Output | When |
|----------|-----|-------|--------|------|
| Evidence Pipeline | `evidence-pipeline` | raw evidence | processed corpus | after gathering |
| Synthesis Pipeline | `synthesis-pipeline` | processed corpus | synthesis summary | after evidence |
| Reporting Pipeline | `reporting-pipeline` | synthesis + insights | intelligence package | at completion |
| Escalation Pipeline | `escalation-pipeline` | confidence scores | escalation decision | if threshold not met |
| Memory Synthesizer | `research-memory-synthesizer` | investigation outputs | memory records | at completion |

---

## Pipeline Selection Algorithm

The orchestrator runs this selection logic for each mandate:

```
STEP 01: Parse mandate
  - Extract: domain(s), stakes level, depth, type, urgency

STEP 02: Select primary workflow
  - domains ≥ 2, stakes = HIGH → multi-stage-investigation
  - domains = 1, depth = DEEP → deep-dive
  - type = COMPETITIVE → competitive-analysis
  - type = MARKET → market-research
  - type = TECHNICAL → technical-investigation

STEP 03: Select domain intelligence agents
  - Always include: evidence-gatherer, source-validator, evidence-tracker
  - Conditionally include: contextual-researcher (if domain unknown)
  - Select domain intelligence agent(s) based on mandate type

STEP 04: Select synthesis pipeline stages
  - Always include: evidence-synthesizer, contradiction-reconciler
  - Include insight-extractor if ≥ 20 evidence items expected
  - Include strategic-synthesis if mandate requires recommendations
  - Always include research-memory-synthesizer at completion

STEP 05: Set tool budgets and iteration limits
  - Shallow: budget 20, iterations 5
  - Standard: budget 60, iterations 15
  - Deep: budget 150, iterations 30

STEP 06: Configure concurrency
  - Parallel tracks for evidence gathering (up to 5 tracks)
  - Sequential for synthesis (pipeline chain)
  - Record pipeline execution order in investigation metadata
```

---

## Pipeline Input/Output Contracts

### Evidence Gatherer
```
Input:
  - mandate: ResearchBrief
  - sub_questions: SubQuestion[]
  - tool_budget: number
  - iteration_limit: number

Output:
  - evidence_corpus: JSONL path
  - query_log: JSONL path
  - tracker_status: TrackerStatus
```

### Evidence Synthesizer
```
Input:
  - evidence_corpus: JSONL path
  - source_quality_records: JSONL path
  - confidence_scores: JSON path

Output:
  - synthesis_summary: Markdown path
  - claim_registry: JSON path
  - contradiction_map: JSON path
  - compaction_summary: Markdown path (if compacted)
```

### Reporting Pipeline
```
Input:
  - synthesis_summary: Markdown path
  - insight_set: JSON path
  - strategic_brief: Markdown path (optional)
  - source_registry: JSON path

Output:
  - intelligence_package: Markdown path (wiki/intelligence/)
```

---

## Pipeline Health Monitoring

The registry tracks pipeline execution health:

| Metric | Warning Threshold | Critical Threshold |
|--------|------------------|--------------------|
| Evidence gatherer failure rate | > 5% | > 15% |
| Synthesis failure rate | > 3% | > 10% |
| Context compaction failure rate | > 5% | > 15% |
| Investigation completion rate | < 90% | < 75% |
| Average confidence score | < 0.65 | < 0.50 |

Track metrics in `wiki/intelligence/pipeline-health.md` (updated after each investigation).
