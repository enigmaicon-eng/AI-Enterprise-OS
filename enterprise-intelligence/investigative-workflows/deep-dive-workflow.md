# Deep Dive Investigative Workflow

**Workflow ID:** `deep-dive`
**Scope:** Single-domain, maximum-depth investigation of a specific topic
**Duration:** 4-24 hours
**Trigger:** High-stakes single-topic investigation requiring exhaustive evidence gathering

---

## Purpose

The Deep Dive workflow is a single-track, maximum-depth investigation. Where the Multi-Stage Investigation runs parallel tracks across domains, the Deep Dive goes as deep as possible on one specific topic. Use when you need to know everything knowable about a specific question from public sources.

Modeled on Dexter's `deep` investigation depth — iterating 16-30 times with a 150-call tool budget.

---

## Workflow

```
[Specific Question]
       │
       ▼
PHASE 01: Question Architecture
  ├─ Decompose into primary + secondary questions
  ├─ Map known evidence gaps
  └─ Set stopping criteria
       │
       ▼
PHASE 02: Shallow Sweep (Iterations 1-5)
  ├─ Broad coverage — establish baseline
  ├─ 3 query variants per sub-question
  └─ Identify highest-signal sources
       │
       ▼
PHASE 03: Evidence Deepening (Iterations 6-15)
  ├─ Follow top sources into primary references
  ├─ Citation chain following
  ├─ Counter-evidence seeking
  └─ Expert/practitioner source mining
       │
       ▼
PHASE 04: Adversarial Pass (Iterations 16-20)
  ├─ Generate 5 adversarial queries
  ├─ Search specifically for contradicting evidence
  ├─ Check fringe and minority sources
  └─ Identify what could make primary finding wrong
       │
       ▼
PHASE 05: Primary Source Verification
  ├─ Trace top 5 claims to primary sources
  ├─ Verify secondary sources cited correctly
  └─ Flag any broken citation chains
       │
       ▼
PHASE 06: Synthesis and Delivery
  ├─ Full evidence synthesis
  ├─ Deep dive report
  └─ Memory flush
```

---

## Phase Definitions

### PHASE 01: Question Architecture

Define the investigation structure before gathering:

```markdown
## Question Architecture: [Topic]

Primary Question: [The specific question to answer]

Secondary Questions:
  Q1: [Supporting question]
  Q2: [Supporting question]
  Q3: [Counter question — what if the primary answer is wrong?]

Known gaps:
  - [What we don't know going in]

Stopping criteria:
  - Confident when: [specific confidence threshold + evidence count]
  - Stop regardless at: [iteration limit] iterations

Source type priority:
  1. [Highest priority source type]
  2. [Second priority]
  3. [Third priority]
```

### PHASE 02: Shallow Sweep

- Run 3 query variants per sub-question simultaneously
- Do not follow any single source deep yet
- Objective: identify the highest-signal sources for Phase 03
- Target: 20-30 evidence items covering all sub-questions

**Query variant generation:**
```
Direct:     [exact terms]
Lateral:    [adjacent concepts, different framing]
Adversarial:[counter-claims, critiques, failures, problems]
```

### PHASE 03: Evidence Deepening

For each sub-question, follow the highest-signal sources:
- Read full articles / papers (not just previews)
- Follow citations to primary sources
- Extract exact quotes, not summaries
- Note methodology when evidence is quantitative

**Citation chain protocol:**
- If a secondary source cites a primary, fetch the primary
- If a primary source cites data, note the data source and vintage
- Broken citation chain = credibility deduction

**Expert source mining:**
- Search for domain experts writing on this topic
- Conference talks, podcasts, expert blog posts
- Note expert credentials and potential biases

### PHASE 04: Adversarial Pass

Generate 5 adversarial queries designed to find evidence that would invalidate the primary finding:

```
Adversarial query types:
  1. "Why [primary finding] is wrong"
  2. "[Opposite of primary finding]"
  3. "[Primary topic] failure OR problem OR limitation"
  4. "[Primary topic] criticism [expert name]"
  5. "Counterexample [primary finding claim]"
```

If adversarial queries produce strong counter-evidence:
- Document as Type E contradiction (Factual Conflict)
- Seek tiebreaker evidence
- If unresolvable: flag as [CONTESTED CLAIM]

### PHASE 05: Primary Source Verification

For the top 5 highest-confidence claims:
1. Identify the most-cited source for each claim
2. Fetch that source and verify the claim is stated there
3. Check: is the source cited correctly? Is the claim in context?
4. Note any misrepresentation in secondary sources

**Common secondary source failures to check:**
- Statistic cited out of context (denominator missing)
- Percentage vs. percentage point confusion
- Absolute number cited as rate
- Outdated study presented as current
- Quoted study doesn't say what secondary source claims

### PHASE 06: Synthesis and Delivery

Run standard synthesis pipeline:
- `synthesis-systems/evidence-synthesizer.md`
- `synthesis-systems/contradiction-reconciler.md`
- `synthesis-systems/insight-extractor.md`

Produce Deep Dive Report (format below) and flush memory.

---

## Deep Dive Report Format

```markdown
# Deep Dive Report: [Topic]

**Investigation ID:** [id]
**Date:** [date]
**Iterations:** [N]
**Tool calls:** [N]
**Total evidence items:** [N]
**Primary sources verified:** [N]
**Confidence:** [0.0–1.0]

## Primary Question
[The question this investigation answered]

## Answer
[Direct answer, stated plainly, with confidence level]

## Evidence Summary
[Synthesis of key evidence supporting the answer]

## Primary Source Verification Results
| Claim | Source | Verified? | Notes |
|-------|--------|-----------|-------|
[table]

## Counter-Evidence Assessment
[What adversarial queries found, and why the primary answer holds despite it]

## Contested Claims
[Claims where evidence is genuinely conflicted — cannot confidently state either way]

## Key Insights
[Non-obvious patterns from the evidence]

## Evidence Corpus
[Link to full JSONL]

## Source Registry
[Full source list with credibility scores]
```

---

## Query Budget Allocation

For a 150-call budget:

| Phase | Allocation | Purpose |
|-------|-----------|---------|
| Phase 02: Shallow sweep | 30 calls | Breadth coverage |
| Phase 03: Deepening | 60 calls | Primary evidence gathering |
| Phase 04: Adversarial | 20 calls | Counter-evidence |
| Phase 05: Verification | 15 calls | Primary source checks |
| Phase 06: Synthesis | 5 calls | Report generation |
| Buffer | 20 calls | Follow unexpected leads |

---

## When to Use Deep Dive vs. Multi-Stage

| Use Deep Dive when: | Use Multi-Stage when: |
|--------------------|-----------------------|
| Single clear question | Multiple domain questions |
| One domain | Cross-domain |
| Exhaustive evidence needed | Representative evidence needed |
| Technical or factual precision required | Strategic synthesis required |
| Primary source verification essential | Pattern across sources more important |
