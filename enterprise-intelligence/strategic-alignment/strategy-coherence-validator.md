# Strategy Coherence Validator
**ID:** SI-ALIGN-004 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Validates that the organization's declared strategy is internally coherent — that its OKRs, strategic options, resource allocations, and capability development plans are consistent with each other and collectively sufficient to achieve the strategic intent. Surfaces contradictions, gaps, and logical inconsistencies before they cause execution failures.

---

## Coherence Dimensions

### 1. Internal Logic Consistency
Are the strategy's elements logically consistent with each other?
- OKRs that require contradictory trade-offs (e.g., "maximize speed" + "minimize cost" in same quarter without explicit prioritization)
- Strategic options that require capabilities being reduced by other decisions
- Resource allocations that arithmetically cannot support all declared priorities

### 2. Capability Sufficiency
Does the organization have (or have a credible plan to acquire) the capabilities required to execute?
- Capability gaps from `agent-capabilities/agent-capability-model.md` vs. strategy requirements
- Skill acquisition lead time vs. initiative timeline
- Integration dependencies that don't yet exist

### 3. Resource Arithmetic
Does the portfolio fit within resource constraints?
- Sum of all initiative capacity requirements vs. actual org capacity
- Financial commitments vs. available budget
- Platform capacity vs. projected demand

### 4. Strategic Environment Alignment
Is the strategy still coherent given current market and competitive conditions?
- Strategy assumptions (market model from planning time) vs. current intelligence
- Competitive moves that invalidate strategy assumptions
- Regulatory changes that create new requirements or opportunities

### 5. Temporal Coherence
Is the sequencing of strategic bets internally consistent?
- Dependencies: Does Phase 2 require outputs of Phase 1 on a compatible timeline?
- Option windows: Are time-sensitive opportunities resourced in the right time window?
- Capability development: Are skills being built before they're needed?

---

## Validation Protocol

Full coherence validation runs:
- At each quarterly planning cycle start
- When a STRATEGIC_BET initiative is added or materially changed
- When a T4+ decision is made
- When strategic_coherence_score drops below 0.60

```
Step 1: Load current strategy artifacts
  - Active OKR set
  - Active strategic options (OPT-*)
  - Portfolio classification (from portfolio-strategy-alignment.md)
  - Capability map
  - Resource allocation
  - Current market intelligence (from market-signal-processor.md)
  
Step 2: Run coherence checks across 5 dimensions
  For each dimension: generate finding list (PASS | WARN | FAIL | CRITICAL)
  
Step 3: Contradiction detection
  Cross-check: are any two strategy elements logically contradictory?
  Score: 0–5 contradictions → MINOR; 6–10 → MODERATE; > 10 → CRITICAL
  
Step 4: Gap analysis
  Required capabilities vs. available + pipeline
  Required resources vs. committed + available
  Required timing vs. execution calendar
  
Step 5: Synthesis
  Generate coherence report with:
  - Coherence_score per dimension
  - Contradiction list with severity
  - Gap list with mitigation options
  - Recommended corrections
```

---

## Contradiction Schema

```yaml
contradiction:
  contradiction_id: CONT-{YYYYMMDD}-{seq}
  dimension: [see 5 dimensions]
  severity: MINOR | MODERATE | CRITICAL
  
  element_a: {type: OKR | OPT | RESOURCE | CAPABILITY | TIMELINE, ref: id, description: string}
  element_b: {type: OKR | OPT | RESOURCE | CAPABILITY | TIMELINE, ref: id, description: string}
  
  contradiction_type: DIRECT_CONFLICT | RESOURCE_COMPETITION | TIMING_INCOMPATIBILITY | ASSUMPTION_VIOLATION | LOGICAL_INCONSISTENCY
  description: string                    # how they contradict
  
  resolution_options:
    - option: string
      requires: T3 | T4 | T5
      
  status: OPEN | ACKNOWLEDGED | RESOLVING | RESOLVED | ACCEPTED
```

---

## Integration with Planning Cycles

The validator is a required input to:
- `enterprise-workflows/03-quarterly-planning.md` (G-QUALITY gate requires coherence score ≥ 0.70)
- `enterprise-workflows/02-annual-planning.md` (coherence validation before OKR finalization)
- `enterprise-playbooks/05-quarterly-planning.md` (pre-QBR coherence check)

A coherence score < 0.60 blocks the G-QUALITY gate in quarterly planning, requiring T4 intervention.

---

## Output Report

```
STRATEGY COHERENCE REPORT — Q3 2026
Generated: 2026-05-16 | Validation scope: Company + Division level

COHERENCE SCORE: 0.74  [ADEQUATE]
  Internal Logic: 0.82 PASS
  Capability Sufficiency: 0.68 WARN — 3 capability gaps
  Resource Arithmetic: 0.79 PASS — slight over-allocation in Q4
  Strategic Environment: 0.71 PASS — 2 stale assumptions flagged
  Temporal Coherence: 0.71 PASS

CONTRADICTIONS: 2 MINOR, 1 MODERATE
  MODERATE: OKR-2026-Q3-OBJ2 (speed) vs. OBJ5 (quality) — no explicit trade-off declared
  MINOR: RESOURCE allocation to INIT-029 exceeds platform capacity by 15%
  MINOR: Phase 2 of strategic option OPT-2026-015 assumes CAPABILITY-ML-004 (not yet built)

RECOMMENDATIONS:
  1. Declare explicit priority trade-off between OBJ2 and OBJ5 (T3 decision)
  2. Reduce INIT-029 scope or shift Phase 2 delivery by 1 sprint
  3. Add capability development milestone for CAPABILITY-ML-004 before Phase 2 begins
```
