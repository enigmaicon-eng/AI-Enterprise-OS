# Source Validator

**System ID:** `source-validator`
**Role:** Assesses credibility, reliability, and potential bias of evidence sources
**Input:** Raw evidence records from evidence-gatherer
**Output:** Source quality scores written to `intelligence-memory/source-quality.jsonl`

---

## Purpose

The Source Validator applies a systematic credibility model to all evidence sources used in research investigations. It prevents high-confidence conclusions from being built on low-quality sources, and maintains a persistent registry of source quality for reuse across investigations.

Not all sources are equal. A Reddit post and a peer-reviewed study both contain claims — the validator ensures the confidence scores reflect the actual reliability of each.

---

## Source Credibility Model

### Dimension 01: Source Authority

Score the source's intrinsic authority in the domain:

| Source Type | Authority Score | Notes |
|-------------|----------------|-------|
| Primary research (peer-reviewed) | 0.95 | Must check methodology section |
| Official documentation | 0.90 | Accurate for stated version |
| Government / regulatory publications | 0.90 | May lag market reality |
| Financial filings (10-K, S-1) | 0.90 | Accurate, but self-serving framing |
| First-party engineering blogs | 0.80 | Practitioner truth, survivorship bias |
| Industry analyst reports (Gartner, etc.) | 0.75 | Often vendor-commissioned — check |
| Reputable press (NYT, WSJ, The Economist) | 0.72 | Accurate events, shallow tech analysis |
| Conference talks (named practitioners) | 0.72 | Experience-based, may be one context |
| Trade press (TechCrunch, VentureBeat) | 0.65 | Accurate for events, PR-influenced |
| Review platforms (G2, Capterra) | 0.60 | Real users, selection bias |
| Community forums (Stack Overflow, Reddit) | 0.55 | Practitioner experience, unverified |
| Social media (Twitter/X, LinkedIn posts) | 0.40 | Signal in aggregate, noise individually |
| Anonymous sources | 0.25 | Low verifiability |

### Dimension 02: Recency

Score based on how current the source is relative to claim type:

| Claim Type | Fresh (<3mo) | Recent (3-12mo) | Aging (1-3yr) | Old (>3yr) |
|------------|-------------|-----------------|---------------|------------|
| Pricing / features | 1.00 | 0.70 | 0.30 | 0.10 |
| Market size / CAGR | 0.90 | 0.85 | 0.70 | 0.50 |
| Technology capability | 0.95 | 0.85 | 0.70 | 0.40 |
| Competitive positioning | 1.00 | 0.80 | 0.50 | 0.20 |
| Structural market facts | 1.00 | 0.95 | 0.90 | 0.80 |
| Historical events | 1.00 | 1.00 | 1.00 | 1.00 |

### Dimension 03: Independence

Is this source independent of the subject being researched?

| Independence Level | Score | Example |
|-------------------|-------|---------|
| Independent, no financial relationship | 1.00 | Academic study |
| Independent, but general domain interest | 0.90 | Trade press article |
| Partially dependent (used the product) | 0.75 | G2 review from customer |
| Vendor-sponsored research | 0.50 | Analyst report funded by subject |
| First-party (subject writing about themselves) | 0.40 | Company blog claiming market leadership |
| Competitor source | 0.30 | Competitor's comparison page |

### Dimension 04: Verifiability

Can the claim be independently verified?

| Verifiability Level | Score |
|--------------------|-------|
| Cites primary source that can be fetched | 1.00 |
| Cites source (not fetched) | 0.85 |
| Names methodology | 0.75 |
| Makes specific claim without source citation | 0.60 |
| Vague claim ("many customers say") | 0.35 |
| No evidence provided | 0.20 |

### Composite Credibility Score

```
Credibility = (Authority × 0.35) + (Recency × 0.25) + (Independence × 0.25) + (Verifiability × 0.15)
```

Round to 2 decimal places. Minimum possible: 0.08. Maximum: 1.00.

---

## Bias Detection Checklist

Apply to each source:

**Confirmation bias risk:**
- [ ] Does the source have a stated position on the topic before presenting evidence?
- [ ] Is the evidence selectively presented (all positive, no negatives)?
- [ ] Is counter-evidence acknowledged?

**Commercial bias risk:**
- [ ] Is the source selling something related to the claim?
- [ ] Was the research sponsored by a company with skin in the game?
- [ ] Does the conclusion align suspiciously with the funder's interests?

**Selection bias risk:**
- [ ] Is the sample from which evidence is drawn representative?
- [ ] Are edge cases excluded without explanation?
- [ ] Survivorship bias: are only success stories represented?

**Temporal bias risk:**
- [ ] Is old data being presented as current without noting age?
- [ ] Is a cyclical signal being presented as a trend?
- [ ] Does the claim assume past trajectory continues unchanged?

**Flag format:**
```
[BIAS RISK: confirmation] — Source advocates for position it claims to evidence
[BIAS RISK: commercial] — Source funded by subject of claim
[BIAS RISK: selection] — Sample limited to [specific group], may not generalize
[BIAS RISK: temporal] — Data is [X] years old, presented without recency caveat
```

---

## Source Quality Record

For each validated source, write a record to `intelligence-memory/source-quality.jsonl`:

```json
{
  "source_id": "src-[uuid]",
  "source_url": "[url or file path]",
  "source_type": "[engineering_blog | official_doc | press | community | etc.]",
  "authority_score": 0.80,
  "recency_score": 0.92,
  "independence_score": 0.90,
  "verifiability_score": 0.85,
  "credibility_composite": 0.86,
  "bias_flags": [],
  "notes": "",
  "first_used": "2026-05-14",
  "usage_count": 1,
  "last_used": "2026-05-14",
  "investigations": ["[id1]"]
}
```

When the same source is used in a new investigation:
- Load existing record from `intelligence-memory/source-quality.jsonl`
- Update `usage_count`, `last_used`, `investigations`
- Do not re-score unless source has changed materially

---

## Credibility Threshold Rules

### Claim acceptance thresholds:

| Credibility Score | Policy |
|-------------------|--------|
| ≥ 0.80 | Accept as evidence, no caveats |
| 0.65–0.79 | Accept with [MODERATE CREDIBILITY] tag |
| 0.50–0.64 | Accept with [LOW CREDIBILITY] tag; requires corroboration from ≥2 other sources |
| 0.35–0.49 | Use as [WEAK SIGNAL] only; requires ≥3 higher-credibility corroborating sources |
| < 0.35 | Reject from active evidence corpus; log as discarded with reason |

### Single-source rule:

No primary claim in a final intelligence package should rest on a single source, regardless of credibility score. Claims from a single source, even high-credibility, are tagged:
```
[SINGLE SOURCE — requires corroboration]
```

---

## Domain-Specific Validation Rules

### Market Size Claims
- Accept only if source and methodology is cited
- Default credibility reduction: -0.10 if no methodology stated
- Tag as [TOP-DOWN ESTIMATE] or [BOTTOM-UP ESTIMATE]
- Flag if analyst report is vendor-commissioned

### Competitive Claims
- Competitor-published comparisons: cap independence at 0.30
- Third-party comparison sites: check for affiliate relationships
- Review site data: aggregate patterns more reliable than individual reviews

### Technical Claims
- Benchmark claims: require methodology (hardware, sample size, test conditions)
- "Best performance" claims without benchmarks: reduce verifiability to 0.20
- Production evidence from named companies at stated scale: full credibility

### Pricing Claims
- Accept only from official pricing pages (authority: 0.90)
- Review-based pricing estimates: cap at 0.60 (may be outdated or plan-dependent)
- Press-reported pricing: check against official source

---

## Integration

**Called by:** `evidence-systems/evidence-gatherer.md` (inline validation on each source)
**Also called by:** `synthesis-systems/evidence-synthesizer.md` (final validation pass before synthesis)
**Writes to:** `intelligence-memory/source-quality.jsonl`
**Read by:** `evidence-systems/confidence-scorer.md` (source quality feeds confidence scoring)
