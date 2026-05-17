# Reporting Pipeline

**System ID:** `reporting-pipeline`
**Role:** Assembles all synthesis outputs into a complete, structured intelligence package for delivery
**Position:** Final stage before memory flush and delivery

---

## Purpose

The Reporting Pipeline transforms synthesis outputs into the final, deliverable intelligence package. It ensures completeness, applies quality gates, formats for the intended audience, and writes the final artifact to the wiki.

Every investigation ends with the Reporting Pipeline producing an intelligence package — the definitive output of the research intelligence system.

---

## Report Types

### Type 01: Full Intelligence Package
Complete investigation output — all findings, evidence, insights, strategic synthesis.
Use for: high-stakes decisions, major investigations, cross-domain mandates.

### Type 02: Intelligence Brief
Condensed version — key findings, top insights, recommendation, evidence summary.
Use for: standard investigations, PM decisions, competitive signals.

### Type 03: Signal Alert
Minimal format — a specific finding or threat signal requiring fast delivery.
Use for: time-sensitive competitive threats, breaking market signals, urgent technical risks.

### Type 04: Context Memo
Domain context and background — no primary findings, just situational context.
Use for: briefing a new agent on a domain, pre-meeting context, onboarding intelligence.

---

## Report Assembly Process

### STEP 01: Collect Stage Outputs

Gather all outputs from prior pipeline stages:

```
synthesis-summary-[id].md        ← required
claim-registry-[id].json         ← required
reconciled-claims-[id].json      ← required
insight-set-[id].json            ← required
strategic-brief-[id].md          ← conditional (include if present)
context-brief-[id].md            ← optional
contradiction-resolution-log.md  ← required
```

### STEP 02: Quality Gate Checklist

Before assembling, verify:

**Evidence quality:**
- [ ] All claims have source citations
- [ ] No evidence items with missing source_url in final set
- [ ] Confidence scores present for all claims
- [ ] Source types documented

**Synthesis quality:**
- [ ] All sub-questions addressed (even if "insufficient evidence")
- [ ] All contradictions documented (not suppressed)
- [ ] Minority views preserved in contradiction section
- [ ] Gap report complete (what was not answered)

**Insight quality:**
- [ ] ≥ 3 insights if standard/deep investigation
- [ ] Each insight traces to ≥ 2 evidence claims
- [ ] Each insight has stated implication
- [ ] Observations clearly separated from insights

**Strategic quality (if included):**
- [ ] Recommendations trace to insights
- [ ] Assumptions explicit
- [ ] Risks documented
- [ ] Next steps actionable

**Report completeness:**
- [ ] Executive summary present
- [ ] Confidence score stated and justified
- [ ] Unknowns section present (explicit about limits)
- [ ] Source registry complete

If any required item fails: document the failure in the package and continue (don't block delivery).

### STEP 03: Executive Summary Generation

Write the executive summary last (after all sections assembled):

```markdown
## Executive Summary

[2-3 sentences on the overall finding and recommendation]

**Investigation confidence:** [0.0–1.0] — [brief justification]

**Bottom line:** [One sentence statement of the most important conclusion]

**Primary recommendation:** [One sentence recommendation if applicable]

**Key uncertainty:** [The most important thing this investigation could not resolve]
```

### STEP 04: Audience Calibration

Adjust report depth based on mandate audience:

| Audience | Executive Summary | Evidence Details | Technical Depth |
|----------|------------------|-----------------|----------------|
| PM/Strategy | Detailed | Light | Low |
| Architecture | Brief | Moderate | High |
| Executive | Very brief | Minimal | Low |
| Analyst | Detailed | Full | High |
| All audiences | Standard | Standard | Standard |

### STEP 05: Intelligence Package Assembly

Assemble in canonical section order:

```markdown
# Intelligence Package: [Topic]

**Investigation ID:** [id]
**Date:** [YYYY-MM-DD]
**Depth:** [shallow | standard | deep]
**Investigation Type:** [mandate type]
**Confidence:** [0.0–1.0]
**Tracks Active:** [list]
**Pipelines Run:** [list]

---

## Executive Summary
[Generated in Step 03]

---

## Key Findings
[Top 5-7 findings, ranked by confidence and importance]
| Finding | Confidence | Evidence Count | Impact |
|---------|------------|---------------|--------|
[table]

---

## Primary Insights
[Top 3-5 insights from insight-extractor]

### Insight 1: [Headline]
[explanation + evidence + implication]

---

## Evidence Analysis

### By Sub-Question
[Per-sub-question synthesis from synthesis-summary]

### Contradictions Identified
[Full contradiction documentation from reconciler]

### Minority Views
[Preserved minority positions from reconciler]

---

## Strategic Synthesis [if included]
[Situation assessment, options, recommendation, risk register, next steps]

---

## Key Uncertainties
[Explicit statement of what this investigation could not answer]
[Why these gaps exist]
[What would resolve them]

---

## Source Registry
| Source | Type | Credibility | Date | Claims Contributed |
|--------|------|-------------|------|--------------------|
[table]

---

## Evidence Corpus Reference
- Full corpus: `wiki/intelligence/corpus/[id].jsonl`
- Processed corpus: `wiki/intelligence/corpus/[id]-processed.jsonl`
- Claim registry: `claim-registry-[id].json`

---

## Related Investigations
[Links to prior investigations this builds on or is related to]

---

## Open Research Threads
[Unanswered questions for follow-on investigation]
```

### STEP 06: Write to Wiki

Write final package to: `wiki/intelligence/[YYYY-MM-DD]-[slug]-intelligence-package.md`

Also write to: `wiki/intelligence/INDEX.md` (append new entry)

Index entry format:
```
| [Date] | [Topic] | [Type] | [Confidence] | [link] |
```

---

## Report Variants

### Signal Alert Format
For urgent, time-sensitive signals:

```markdown
# Intelligence Signal Alert: [Topic]

**Alert ID:** [id]
**Date:** [date]
**Urgency:** IMMEDIATE | HIGH | MODERATE
**Signal type:** [competitive | market | technical | regulatory]

## Signal
[One paragraph — what was detected]

## Evidence
[2-3 evidence items]

## Implication
[What this means, time horizon]

## Recommended Action
[Immediate action required]

## Full Investigation
[Link if full investigation is warranted]
```

### Context Memo Format
For background/context delivery:

```markdown
# Context Memo: [Domain/Topic]

**Memo ID:** [id]
**Date:** [date]
**Domain:** [domain]
**Audience:** [who this is for]

## Domain Overview
## Key Concepts
## Historical Context
## Current Environment
## Key Actors
## Rate of Change
## Caveats
```

---

## Delivery

After writing the intelligence package:
1. Log delivery in investigation state
2. Trigger `research-memory-synthesizer` → memory flush
3. Notify requesting agent/team that package is ready
4. Write summary to orchestrator log

---

## Integration

**Called by:** `research-intelligence/orchestrator.md` (Phase 05: Intelligence Package)
**Reads from:** All synthesis pipeline outputs
**Writes to:**
- `wiki/intelligence/` — intelligence packages
- `wiki/intelligence/INDEX.md` — intelligence index

**Triggers:** `synthesis-systems/research-memory-synthesizer.md` after delivery
