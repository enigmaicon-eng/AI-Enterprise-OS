# Research Intelligence Orchestrator

**System ID:** `research-intelligence-orchestrator`
**Role:** Master coordinator for all autonomous research operations
**Model:** opus
**Scope:** Enterprise-wide intelligence gathering, synthesis, and delivery

---

## Architecture Overview

The Research Intelligence Orchestrator is the top-level controller for all research activity across the Enterprise AI OS. It receives research mandates, decomposes them into parallel investigation tracks, routes evidence to synthesis pipelines, scores confidence, and delivers structured intelligence packages.

It is modeled on an iterative, tool-calling agent loop — like Dexter's core `agent.ts` — but expressed as a document-driven workflow orchestration system.

```
[Research Mandate Received]
         │
         ▼
PHASE 01: Decomposition
  ├─ Parse mandate into sub-questions
  ├─ Identify required intelligence domains
  ├─ Select investigative workflows
  └─ Allocate source channels
         │
         ▼
PHASE 02: Parallel Investigation
  ├─ Evidence Gatherer       → raw evidence corpus
  ├─ Contextual Researcher   → domain context
  ├─ Source Validator        → credibility scores
  └─ Competitive/Market Intel → external signals
         │
         ▼
PHASE 03: Evidence Consolidation
  ├─ Evidence Tracker writes JSONL log
  ├─ Confidence Scorer rates each claim
  ├─ Contradiction Reconciler flags conflicts
  └─ Deduplication pass
         │
         ▼
PHASE 04: Synthesis
  ├─ Evidence Synthesizer → unified evidence base
  ├─ Insight Extractor    → key findings
  ├─ Strategic Synthesis  → implications + recommendations
  └─ Context Compaction   → token-optimized summaries
         │
         ▼
PHASE 05: Intelligence Package
  ├─ Report Generator     → structured deliverable
  ├─ Memory Flush         → persist durable knowledge
  ├─ Research Graph Update → lineage + nodes
  └─ Escalation Check     → trigger if gaps remain
         │
         ▼
[Intelligence Package Delivered]
```

---

## Orchestration Protocols

### 1. Mandate Intake

When a research mandate arrives:

1. Parse the mandate into a **Research Brief** using this template:
   ```
   Research Brief
   ──────────────
   Question:     [The primary question to answer]
   Sub-questions: [3-7 supporting questions]
   Domains:      [market | competitive | technical | org | PM]
   Urgency:      [immediate | standard | background]
   Depth:        [shallow (2h) | standard (8h) | deep (2d)]
   Owner:        [requesting agent or team]
   ```

2. Check `intelligence-memory/investigation-continuity.md` for prior investigations on the same topic.

3. Load relevant prior context from `intelligence-memory/research-graph.md`.

4. Assign investigation tracks and activate workflows.

### 2. Parallel Investigation Management

The orchestrator runs multiple investigation tracks concurrently:

| Track | Workflow | Agent | Output |
|-------|----------|-------|--------|
| Primary Evidence | `investigative-workflows/deep-dive-workflow.md` | evidence-gatherer | `evidence-corpus-[id].jsonl` |
| Market Signals | `investigative-workflows/market-research-workflow.md` | market-intelligence | `market-signals-[id].md` |
| Competitive Intel | `investigative-workflows/competitive-analysis-workflow.md` | competitive-intelligence | `competitive-brief-[id].md` |
| Technical Context | `investigative-workflows/technical-investigation-workflow.md` | architecture-intelligence | `technical-context-[id].md` |
| Org Intelligence | `research-intelligence/organizational-intelligence.md` | org-intelligence | `org-context-[id].md` |

Tracks run **concurrently** up to the depth limit. Read-only evidence tools are batched. State-modifying writes (memory flush, graph update) are sequential.

### 3. Context Threshold Management

The orchestrator monitors evidence accumulation:

- **Micro-compaction trigger:** When a single track produces >50 evidence items, trigger `synthesis-systems/evidence-synthesizer.md` on that track alone.
- **Full compaction trigger:** When total evidence corpus exceeds 200 items OR token budget reaches 80%, trigger full synthesis pass.
- **Emergency compaction:** If context fills before synthesis completes, preserve the last 10 evidence items per track plus all compaction summaries.

This mirrors Dexter's `compact.ts` + `microcompact.ts` behavior but expressed in document-driven workflow steps.

### 4. Synthesis Sequencing

After evidence collection closes:

```
SYNTHESIS PASS 01 → Evidence Synthesizer (per-track)
SYNTHESIS PASS 02 → Contradiction Reconciler (cross-track)
SYNTHESIS PASS 03 → Insight Extractor (key findings)
SYNTHESIS PASS 04 → Strategic Synthesis (implications)
SYNTHESIS PASS 05 → Report Generator (deliverable)
```

Each pass is gated. Pass N does not start until Pass N-1 is complete and its output is stored.

### 5. Confidence and Escalation

After synthesis, the orchestrator runs:

1. **Confidence Scoring** → reads `evidence-systems/confidence-scorer.md`
2. **Gap Detection** → identifies unanswered sub-questions
3. **Escalation Decision:**
   - Confidence ≥ 0.80 on all sub-questions → deliver package
   - Confidence 0.60–0.79 → deliver with uncertainty flags
   - Confidence < 0.60 on critical sub-question → escalate: reactivate evidence gathering on specific gap
   - Max 2 escalation cycles before forced delivery with explicit unknowns section

---

## Investigation Types and Routing

| Mandate Type | Primary Workflow | Depth Default |
|-------------|-----------------|---------------|
| PM feature discovery | `investigative-workflows/deep-dive-workflow.md` | standard |
| Competitive threat | `investigative-workflows/competitive-analysis-workflow.md` | deep |
| Market opportunity | `investigative-workflows/market-research-workflow.md` | standard |
| Architecture decision | `investigative-workflows/technical-investigation-workflow.md` | deep |
| Org capability gap | `research-intelligence/organizational-intelligence.md` | shallow |
| Strategic horizon scan | `investigative-workflows/multi-stage-investigation.md` | deep |

---

## Memory and Continuity

After every completed investigation:

1. Write durable facts to `intelligence-memory/evidence-retention.md`
2. Update source registry in `intelligence-memory/source-lineage.md`
3. Add investigation node to `intelligence-memory/research-graph.md`
4. Update `intelligence-memory/investigation-continuity.md` with open threads

Before any new investigation:

1. Check `intelligence-memory/investigation-continuity.md` for active threads
2. Load relevant prior nodes from `intelligence-memory/research-graph.md`
3. Avoid re-gathering evidence already in the corpus (check source lineage)

---

## Output Format

Every completed investigation produces an **Intelligence Package** at:
`wiki/intelligence/[YYYY-MM-DD]-[slug]-intelligence-package.md`

```markdown
# Intelligence Package: [Topic]

**Investigation ID:** [uuid]
**Date:** [YYYY-MM-DD]
**Depth:** [shallow | standard | deep]
**Confidence:** [0.0–1.0]
**Tracks Active:** [list]

## Executive Summary
[3-5 sentence synthesis of key findings]

## Key Findings
1. [Finding] — Confidence: [H/M/L] — Sources: [n]
2. ...

## Evidence Base
[Link to evidence corpus JSONL]

## Contradictions Identified
[Any unresolved conflicts between sources]

## Strategic Implications
[Recommendations, risks, opportunities]

## Unknowns and Gaps
[What this investigation could not answer]

## Source Registry
[List of sources with lineage links]

## Research Graph Links
[Prior investigations this builds on]
```

---

## Governance

- All research mandates must have an owner agent or team
- Intelligence packages are write-once artifacts (append new packages, never overwrite)
- Source lineage must be traceable for every claim in a final package
- Confidence scores must be justified, not assumed
- Contradictions must be surfaced, not suppressed
