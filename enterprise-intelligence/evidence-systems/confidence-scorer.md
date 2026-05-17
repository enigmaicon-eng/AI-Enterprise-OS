# Confidence Scorer

**System ID:** `confidence-scorer`
**Role:** Multi-factor confidence scoring for evidence items, claims, sub-questions, and overall investigations
**Input:** Evidence corpus + source quality records
**Output:** Confidence scores at all levels (item → claim → sub-question → investigation)

---

## Purpose

The Confidence Scorer provides calibrated, multi-factor confidence estimates for every piece of intelligence produced by the research system. It answers: **"How sure should we be about this?"**

Uncalibrated confidence leads to overconfidence in weak evidence or underuse of strong evidence. The scorer makes the confidence estimation explicit, consistent, and traceable.

---

## Confidence Score Hierarchy

```
Investigation Confidence
  └── Sub-question Confidence [Q1, Q2, ..., Qn]
        └── Claim Confidence [cl-1, cl-2, ..., cl-m]
              └── Evidence Item Confidence [ev-1, ev-2, ..., ev-k]
```

Each level aggregates from the level below. Confidence flows upward.

---

## Evidence Item Confidence

Computed for each raw evidence record:

### Factor 01: Source Credibility
Use the composite credibility score from `evidence-systems/source-validator.md`.
```
source_factor = credibility_composite
```

### Factor 02: Claim Specificity
How precise and specific is the claim?

| Specificity Level | Score |
|------------------|-------|
| Exact: specific number, date, named entity, verifiable fact | 1.00 |
| Near-exact: specific claim with minor uncertainty | 0.85 |
| General: directional claim without specific quantity | 0.65 |
| Vague: "many", "some", "often", without specifics | 0.40 |
| Opinion presented as fact | 0.25 |

### Factor 03: Corroboration
Is this claim supported by other independent sources?

| Corroboration Level | Score |
|--------------------|-------|
| 4+ independent sources agree | 1.00 |
| 3 independent sources agree | 0.90 |
| 2 independent sources agree | 0.75 |
| 1 source (no corroboration yet) | 0.55 |
| Contradicted by 1 source | 0.40 |
| Contradicted by 2+ sources | 0.20 |

### Factor 04: Primary Source Proximity
How close is this to the original source?

| Proximity Level | Score |
|----------------|-------|
| This IS the primary source | 1.00 |
| Directly quoting primary source | 0.92 |
| Citing primary source (not fetched) | 0.80 |
| Secondary source, methodology explained | 0.70 |
| Secondary source, no methodology | 0.55 |
| Tertiary or unclear chain | 0.40 |

### Item Confidence Formula

```
item_confidence = (
  source_factor     × 0.30 +
  specificity_factor × 0.25 +
  corroboration_factor × 0.30 +
  proximity_factor   × 0.15
)
```

Range: 0.0–1.0. Round to 2 decimal places.

---

## Claim Confidence

A claim may have multiple evidence items supporting it. Aggregate:

```
base_confidence = WEIGHTED_MEAN(item_confidence values, weight = source_credibility)

adjustment factors:
  + 0.05 if evidence from ≥2 independent source TYPES (web + document + memory)
  + 0.03 if publication date is recent (<3 months)
  - 0.10 if any contradicting claim exists (unresolved)
  - 0.05 if single source (applies even if high-quality source)
  - 0.08 if claim is statistical without methodology noted

claim_confidence = CLAMP(base_confidence + adjustments, 0.05, 0.98)
```

Cap at 0.98 — never claim perfect certainty.

---

## Sub-Question Confidence

Aggregate all claim confidence scores for a sub-question:

```
STEP 01: Identify all claims mapped to sub-question Qi
STEP 02: Weight claims by evidence item count (more evidence = more weight)
STEP 03: Apply coverage penalty if only one claim type addresses the question

coverage_score = MIN(claim_count / 3, 1.0)  ← full coverage = 3+ distinct claims
weighted_mean = WEIGHTED_MEAN(claim_confidence values)
subq_confidence = weighted_mean × (0.70 + 0.30 × coverage_score)
```

Sub-question confidence interpretation:

| Score | Interpretation | Action |
|-------|---------------|--------|
| 0.85–1.00 | High confidence | Ready for synthesis |
| 0.70–0.84 | Good confidence | Acceptable, flag uncertainty |
| 0.60–0.69 | Moderate confidence | Note gaps, proceed |
| 0.45–0.59 | Low confidence | Escalate if critical sub-question |
| < 0.45 | Very low confidence | Requires additional gathering |

---

## Investigation Confidence

Aggregate sub-question confidence scores:

```
STEP 01: Classify sub-questions as PRIMARY (essential) or SECONDARY (supporting)
STEP 02: Weight primary sub-questions at 2× secondary
STEP 03: Apply penalty for unresolved contradictions on primary questions

primary_weight = 2.0
secondary_weight = 1.0

weighted_subq_confidence = WEIGHTED_MEAN(subq_confidence values, weights)

contradiction_penalty = 0.05 × COUNT(unresolved contradictions on primary sub-questions)

investigation_confidence = CLAMP(
  weighted_subq_confidence - contradiction_penalty,
  0.05, 0.95
)
```

---

## Confidence Reporting Format

### Item-Level (embedded in evidence tracker record)
```json
"confidence_raw": 0.72,
"confidence_factors": {
  "source": 0.80,
  "specificity": 0.65,
  "corroboration": 0.55,
  "proximity": 0.92
}
```

### Claim-Level (in claim registry)
```json
"confidence": 0.78,
"confidence_basis": "2 sources, 1 source type, recent (<1mo), no contradictions",
"confidence_flags": ["SINGLE_SOURCE_TYPE"]
```

### Sub-Question Level (in synthesis summary)
```
Q1: [Sub-question text]
  Confidence: 0.88 ██████████ HIGH
  Claims: 5 | Evidence items: 12 | Source types: 3
  Status: READY FOR SYNTHESIS

Q3: [Sub-question text]
  Confidence: 0.47 █████░░░░░ LOW
  Claims: 2 | Evidence items: 4 | Source types: 1
  Status: ESCALATE — below threshold, critical question
```

### Investigation Level (in intelligence package)
```
Investigation Confidence: 0.74

Breakdown:
  Primary sub-questions (weighted ×2): avg 0.79
  Secondary sub-questions (weighted ×1): avg 0.68
  Contradiction penalty: -0.03 (1 unresolved)
  Final: 0.74

Confidence distribution:
  High (≥0.80): Q1, Q2, Q5 [3 questions]
  Good (0.70–0.79): Q4 [1 question]
  Moderate (0.60–0.69): Q3 [1 question — FLAGGED]
  Low (<0.60): [none]
```

---

## Confidence Calibration Guidelines

### Avoid overconfidence when:
- Evidence is concentrated in a single source type (all web, no documents)
- All evidence is from the same publication date window
- No adversarial queries were run
- Source is first-party (subject writing about itself)
- Sample size is small (< 5 reviews, < 3 case studies)

### Avoid underconfidence when:
- Multiple high-authority sources agree on the same specific claim
- Primary source is directly available and verified
- Claim is structural/historical (not time-sensitive)
- Evidence comes from production deployments with named companies and scales

### Hard floors and ceilings:
- No investigation confidence can exceed 0.95 (irreducible uncertainty)
- No investigation confidence should be reported below 0.05 (if lower, halt investigation)
- Single-source claims: ceiling at 0.70 regardless of source quality
- Unverified claims (verbatim not extracted): ceiling at 0.65

---

## Integration

**Called by:**
- `research-intelligence/orchestrator.md` (Phase 03: Confidence Assessment)
- `investigative-workflows/multi-stage-investigation.md` (Stage 05)

**Reads from:**
- `evidence-systems/evidence-tracker.md` — evidence items
- `intelligence-memory/source-quality.jsonl` — source credibility scores

**Writes to:**
- `claim-registry-[id].json` — claim-level confidence scores
- Synthesis summary — sub-question and investigation confidence

**Feeds:**
- `research-intelligence/orchestrator.md` — escalation decision
- `synthesis-systems/evidence-synthesizer.md` — confidence-weighted synthesis
- `intelligence-pipelines/reporting-pipeline.md` — confidence display in reports
