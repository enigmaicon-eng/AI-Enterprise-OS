# Analogical Reasoning Engine
**ID:** CI-ARE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + Strategic Intelligence | **Updated:** 2026-05-16

---

## Purpose

Enhances organizational decision-making by systematically retrieving structurally similar situations from the organization's historical record and from an indexed library of external business analogies. Human experts naturally reason by analogy — "this looks like the 2018 market entry challenge" — but this happens inconsistently and relies on individual memory. This engine makes analogical reasoning systematic, searchable, and reliable.

---

## Analogy Library Architecture

```
compound-intelligence/analogy-library/
  internal/
    decisions/                    ← past organizational decisions + outcomes
    incidents/                    ← past incidents + resolutions
    product-launches/             ← past launch patterns + results
    market-moves/                 ← past competitive responses + outcomes
    
  external/
    industry-cases/               ← indexed business case studies
    market-disruptions/           ← historical disruption patterns
    regulatory-transitions/       ← regulatory change adaptations
    technology-adoptions/         ← technology S-curve patterns
    
  meta/
    analogy-index.yaml            ← structural feature index for retrieval
    outcome-registry.jsonl        ← outcomes of analogical predictions
```

---

## Analogy Representation

Each analogy is a structured case that can be indexed and retrieved:

```yaml
analogy_case:
  case_id: ANLG-{NNN}
  source: INTERNAL | EXTERNAL
  
  structural_features:
    situation_type: string              # e.g., "market_entry", "competitive_response"
    actor_type: string                  # e.g., "incumbent", "challenger", "regulator"
    domain: string                      # e.g., "B2B_SaaS", "AI_platform"
    
    conditions:
      market_position: LEADING | PARITY | TRAILING
      resource_level: HIGH | MEDIUM | LOW
      time_pressure: URGENT | MODERATE | NONE
      uncertainty_level: HIGH | MEDIUM | LOW
      
    key_variables: [{name: string, value: string}]
    
  situation_summary: string            # 3–5 sentence description of the situation
  
  decision_made: string                # what was decided
  decision_rationale: string           # why this decision was made
  
  outcome:
    result: SUCCESS | PARTIAL | FAILURE | MIXED
    outcome_description: string
    time_to_outcome_months: number
    key_success_factors: [string]
    key_failure_factors: [string]
    
  structural_similarity_features: [string]   # features that define structural similarity
  
  source_reference: string             # internal: decision_id; external: citation
  confidence_in_outcome: LOW | MEDIUM | HIGH
  added_at: ISO8601
```

---

## Retrieval Protocol

```
find_analogies(current_situation_description, top_n=5):

  Step 1: Structural feature extraction
    - Parse current_situation_description
    - Extract: situation_type, conditions, key_variables
    - Generate structural feature vector
    
  Step 2: Similarity search
    - Compare feature vector against analogy_index (cosine similarity)
    - Weight by: structural_similarity_features (precise match > semantic match)
    - Filter by: source.domain similarity (same industry analogies score higher)
    - Minimum similarity threshold: 0.60 (below this: no analogy is better than a bad one)
    
  Step 3: Outcome filtering
    - Prefer cases with HIGH confidence_in_outcome
    - De-prioritize MIXED outcome cases (harder to learn from)
    - Include at least 1 FAILURE case (negative case is valuable)
    
  Step 4: Return top_n analogies with:
    - similarity_score: how structurally similar
    - applicable_lessons: what the decision-maker should attend to
    - watch_out_for: what made this case different from others
    - outcome_distribution: if multiple similar cases, what % succeeded?
    
  Step 5: Generate analogical_synthesis:
    "Based on N similar cases: X% succeeded when [conditions]. 
     Key differentiating factor: [feature]. Most common failure mode: [failure]."
```

---

## Analogical Synthesis Report

```yaml
analogical_synthesis:
  synthesis_id: SYN-{NNN}
  generated_for: string                # the current situation being analyzed
  generated_at: ISO8601
  
  analogies_found: number
  analogies_used: number               # met similarity threshold
  
  outcome_base_rate:
    success_pct: 0.00–1.00
    partial_pct: 0.00–1.00
    failure_pct: 0.00–1.00
    n_cases: number
    
  key_analogies:
    - case_id: string
      similarity_score: 0.00–1.00
      why_similar: string
      key_lesson: string
      outcome: string
      
  differential_diagnosis:
    why_current_might_succeed_more: [string]
    why_current_might_fail_more: [string]
    key_unknowns: [string]
    
  analogical_recommendation: string    # 2–3 sentence synthesis
  confidence: LOW | MEDIUM | HIGH
  caveat: string                       # important limitation of the analogy
```

---

## Analogy Contribution Loop

The OS continuously adds to its internal analogy library:

```
On decision archive event (strategic-decision-archive.md):
  1. Extract structural features from decision record
  2. Add to internal/decisions/ with features + rationale
  
On outcome review event (T+90/180/365 reviews from strategic-decision-archive.md):
  1. Update analogy case with actual outcome
  2. Calculate: did our analogical reasoning predict this outcome?
  3. Update outcome_registry.jsonl (calibration of analogy retrieval accuracy)
  
Monthly external analogy import:
  - Research team identifies 5–10 high-quality external cases
  - Structure into analogy_case schema
  - Add to external/ library
  - Update analogy_index
```

---

## Governance

**Analogy library:** Curated by Strategic Intelligence Org; quality review quarterly
**External cases:** Must be from credible sources; sourcing documented in case record
**Retrieval authorization:** T2+ agents can query; T3 for using in executive recommendations
**Calibration:** Monthly: compare analogical recommendations vs. outcomes; update retrieval weights
**Analogy log:** `memory/compound-intelligence/analogy-retrievals.jsonl`
**Caution:** Analogies are reasoning aids, not prescriptions. Always document which analogy was used and why in decision records.
