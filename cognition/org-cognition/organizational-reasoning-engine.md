# Organizational Reasoning Engine
**ID:** ORG-COG-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Executive Org + Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Provides structured deliberation capability for complex organizational problems that resist simple optimization — problems involving competing values, uncertain futures, organizational politics, and irreversible consequences. While the compound intelligence engine synthesizes signals and the strategic intelligence engine generates options, the organizational reasoning engine applies structured deliberative reasoning to produce defensible, well-reasoned recommendations for the hardest organizational decisions.

**Distinction:** The compound intelligence engine asks "what is happening?" The organizational reasoning engine asks "what should we do about it, and why?"

---

## Reasoning Frameworks

The engine applies structured frameworks appropriate to the problem type:

```yaml
reasoning_frameworks:
  FIVE_WHYS:
    when: Root cause analysis; apparent simple problems with recurring patterns
    produces: Causal chain from symptom to root cause
    
  PRE_MORTEM:
    when: Before major decisions; stress-testing plans
    produces: Enumerated failure modes ranked by probability and impact
    
  STEEL_MAN:
    when: Evaluating proposed changes; avoiding confirmation bias
    produces: Strongest possible case FOR the proposal (even if engine would recommend against)
    
  REVERSIBILITY_ANALYSIS:
    when: Any significant decision
    produces: Classification of reversibility + recommendation to preserve optionality
    
  SECOND_ORDER_THINKING:
    when: Strategic decisions with broad organizational impact
    produces: Direct effects + second-order effects + third-order effects (held loosely)
    
  REGRET_MINIMIZATION:
    when: Long-horizon decisions under deep uncertainty
    produces: Which option will you regret least in 10 years? (Bezos framework variant)
    
  REFERENCE_CLASS_FORECASTING:
    when: Project estimates, outcome predictions
    produces: Base rate from analogous cases + current-case adjustment
    
  DIALECTICAL_INQUIRY:
    when: Genuine disagreement between high-quality positions
    produces: Thesis + antithesis + synthesis; explicit tension articulation
```

---

## Deliberation Protocol

```
For a complex organizational problem:

Input:
  problem_statement: string
  context: relevant signals, constraints, stakeholders
  decision_type: STRATEGIC | OPERATIONAL | GOVERNANCE | RESOURCE_ALLOCATION
  time_sensitivity: IMMEDIATE | THIS_WEEK | THIS_MONTH | THIS_QUARTER

Step 1: Problem Framing
  - Apply FIVE_WHYS to ensure we're solving the right problem
  - Check: is this actually a decision problem, or a diagnostic problem?
  - Identify the "decisive question" (core of what must be resolved)
  - List constraints: what are we not allowed to do? (constitutional first)
  
Step 2: Framework Selection
  - Based on decision_type and constraints: select 2–3 applicable frameworks
  - Always apply REVERSIBILITY_ANALYSIS (every significant decision)
  - If time_sensitivity=IMMEDIATE: skip DIALECTICAL_INQUIRY (too slow)
  
Step 3: Framework Application
  - Run each selected framework on the problem
  - For each framework: produce structured output (not free text)
  - Cross-validate: do frameworks converge or diverge?
  - Divergence: flag as genuine uncertainty; recommend conservative option
  
Step 4: Option Generation
  - Enumerate 3–5 distinct options (not variations of the same option)
  - For each option:
    - What does this option accomplish?
    - What does it give up?
    - What does it assume?
    - How reversible is it?
    - Second-order effects?
    
Step 5: Recommendation
  - Synthesize across frameworks and options
  - State recommendation with primary rationale
  - State the single most important uncertainty
  - State what would change the recommendation
  - Flag for human decision (never act autonomously on strategic recommendations)
```

---

## Reasoning Output Schema

```yaml
reasoning_output:
  reasoning_id: ROUT-{NNN}
  problem_id: string
  agent_id: string
  generated_at: ISO8601
  
  problem_framing:
    decisive_question: string
    root_cause_summary: string
    constraints: [string]
    
  frameworks_applied: [string]
  
  options_evaluated:
    - option_id: string
      description: string
      achieves: [string]
      sacrifices: [string]
      assumes: [string]
      reversibility: FULLY_REVERSIBLE | PARTIALLY_REVERSIBLE | IRREVERSIBLE
      second_order_effects: [string]
      framework_scores: {framework: score}
      
  recommendation:
    recommended_option_id: string
    primary_rationale: string
    key_uncertainty: string
    conditions_that_change_recommendation: [string]
    
  dissent_record: string | null        # if any reasoning step produced contrary conclusion
  
  confidence: 0.00–1.00
  human_review_required: true          # always true for organizational reasoning outputs
  routed_to: string                    # who receives this for decision
```

**Human review is always required for organizational reasoning outputs.** The engine reasons; humans decide.

---

## Constitutional Reasoning

When a problem touches constitutional principles, additional structured deliberation applies:

```
Constitutional reasoning overlay:
  1. Identify which of C001–C012 are implicated
  2. For each implicated principle: state how each option interacts with it
  3. Flag any option that weakens a principle (even marginally) → CONSTITUTIONAL_CONCERN
  4. CONSTITUTIONAL_CONCERN: escalate to constitutional governor quorum before recommendation
  5. Never recommend an option that violates a principle, even if it maximizes other objectives
  
Constitutional reasoning is not a constraint on top of the recommendation.
It is foundational — constitutional violations eliminate options before evaluation begins.
```

---

## Governance

**Reasoning invocation:** Level 3+ agents for significant decisions; Level 4+ for strategic recommendations
**Output routing:** Always to human decision-maker; never executed autonomously
**Reasoning log:** `memory/org-cognition/reasoning-outputs.jsonl` (append-only)
**Framework library updates:** T3 Architecture approval (adding new frameworks)
**Calibration:** Quarterly: compare reasoning recommendations vs. actual decisions + outcomes
