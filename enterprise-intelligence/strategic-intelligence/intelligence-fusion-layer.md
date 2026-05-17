# Intelligence Fusion Layer
**ID:** SI-CORE-002 | **Tier:** T4 | **Class:** ELEVATED
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Cross-source synthesis engine. Fuses signals from 12 intelligence source systems into coherent, non-redundant, confidence-weighted intelligence picture. Resolves conflicts, identifies convergence patterns, and produces unified intelligence units (UIUs) that span multiple domains.

---

## Fusion Pipeline (7 stages)

```
Stage 1: INGEST       — receive signals from strategic-intelligence-engine.md
Stage 2: NORMALIZE    — standardize schema, units, time horizon
Stage 3: CLUSTER      — group semantically related signals
Stage 4: RECONCILE    — resolve contradictions within clusters
Stage 5: WEIGHT       — apply confidence × recency × source_authority weighting
Stage 6: SYNTHESIZE   — generate unified intelligence unit per cluster
Stage 7: VALIDATE     — cross-check UIU coherence; flag low-confidence outputs
```

---

## Unified Intelligence Unit (UIU) Schema

```yaml
uiu_id: UIU-{YYYYMMDD}-{seq}
title: string                          # 80-char max executive title
domain_primary: string                 # dominant domain
domain_secondary: [list]               # contributing domains (cross-domain signals)
synthesis_type: CONVERGENT | DIVERGENT | EMERGENT | SINGLE_SOURCE
confidence: 0.00–1.00                  # weighted composite
confidence_breakdown:
  evidence_support: 0.00–1.00         # how many sources support vs. contradict
  source_diversity: 0.00–1.00         # number of distinct source systems
  recency: 0.00–1.00                  # signal freshness
  internal_consistency: 0.00–1.00     # contradiction-free = 1.0
signal_ids: [SS-*]                     # contributing signal IDs
evidence_refs: [list]                  # traceable evidence
classification: OPPORTUNITY | THREAT | EMERGING | NEUTRAL | WATCH
urgency: IMMEDIATE | THIS_QUARTER | THIS_YEAR | LONG_TERM
impact_magnitude: TRANSFORMATIVE | HIGH | MEDIUM | LOW
narrative: string                      # 200-word max synthesis narrative
key_facts: [string]                    # top 5 supporting facts
counterfactuals: [string]              # what would need to be false for this UIU to be wrong
recommended_action: string | null
escalation_tier: T2 | T3 | T4 | T5
created_at: ISO8601
review_by: ISO8601                     # staleness deadline
```

---

## Source Authority Matrix

| Source System | Base Authority | Authority Modifier Conditions |
|--------------|---------------|-------------------------------|
| research-intelligence/ | 0.85 | +0.10 if investigation depth = EXHAUSTIVE |
| compliance-framework/ | 0.95 | +0.05 if regulatory deadline < 90 days |
| digital-twins/ | 0.80 | -0.15 if twin sync lag > 2 hours |
| data-intelligence/ | 0.82 | +0.08 if GOLD quality tier |
| predictive-intelligence/ | 0.75 | Bayesian calibration score applied |
| org-intelligence/ | 0.80 | -0.10 if data > 1 sprint old |
| people-intelligence/ | 0.78 | Consent scope verified |
| enterprise-telemetry/ | 0.90 | Real-time signals = highest authority |
| work-cognition/ | 0.80 | Pattern validation state = ACTIVE |
| knowledge-base/ | 0.72 | Quality tier applied |
| customer/ | 0.85 | +0.10 if customer tier ENTERPRISE |
| external-signals/ | 0.65 | Source validation required (source-validator.md) |

---

## Conflict Resolution

Contradictions between signals are classified by `synthesis-systems/contradiction-reconciler.md` into:

| Class | Example | Fusion Approach |
|-------|---------|----------------|
| TEMPORAL | Signal A says growth, Signal B (older) says decline | Use newer signal; document temporal context |
| SCOPE | Signal A says market declining, Signal B says segment growing | Synthesize as nuanced; document scope boundaries |
| SOURCE_BIAS | Analyst report vs. internal data disagree | Weight by source authority; flag divergence in UIU |
| GENUINE_CONFLICT | Two high-quality sources directly contradict | Create DIVERGENT UIU; escalate to T3 for human judgment |
| MEASUREMENT | Same phenomenon measured differently | Normalize to common unit; document methodology |

DIVERGENT UIUs: synthesized with confidence capped at 0.50. Requires human review before escalation to executive package.

---

## Cross-Domain Emergence Detection

The fusion layer watches for patterns where signals from ≥3 distinct domains converge on a common theme not explicitly present in any single signal. This is the most valuable class of intelligence:

```
CONVERGENT cross-domain signals → flag as EMERGENT synthesis_type
EMERGENT UIUs automatically enter opportunity-threat-radar.md priority queue
EMERGENT UIUs with confidence > 0.70 trigger scenario activation
```

**Example:** Compliance signals (new regulation) + competitive signals (competitor investing in compliance tech) + talent signals (compliance engineers leaving market) → EMERGENT threat: regulatory compliance window closing faster than anticipated.

---

## Output Distribution

UIUs are published to `enterprise.strategic.uius` event bus topic with:
- Tier-based access control (T2 sees LOW/MEDIUM, T3 sees up to HIGH, T4+ sees all)
- Automatic routing to `opportunity-threat-radar.md`
- Daily digest assembled by `executive-intelligence/board-intelligence-system.md`

---

## Quality Gates

| Gate | Threshold | Action on Fail |
|------|-----------|----------------|
| Minimum confidence | 0.40 | Downgrade to WATCH; do not surface in executive package |
| Evidence support | ≥1 cited evidence item | Block publication; request evidence collection |
| Narrative completeness | ≥100 chars | Prompt re-synthesis |
| Cross-check | No ABSOLUTE constitutional violations | Block permanently |
| Staleness review | review_by set on all UIUs | Auto-deprecate past review_by |
