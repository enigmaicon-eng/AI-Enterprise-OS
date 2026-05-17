# Strategic Synthesis Pipeline

**System ID:** `strategic-synthesis`
**Role:** Translates insights into strategic implications, recommendations, and decision options
**Input:** Insight set from insight-extractor
**Output:** Strategic brief with recommendations, risks, and options

---

## Purpose

The Strategic Synthesis pipeline takes the insight set and asks the question that insights alone cannot answer: **"Given all of this, what should we do?"**

Strategic synthesis connects evidence → insights → options → recommendations. It is explicit about confidence, explicit about what it doesn't know, and explicit about what assumptions underlie each recommendation.

---

## Synthesis Framework

### Layer 01: Situation Assessment
*What is actually true about this situation, based on the evidence?*

Produces a 3-layer situation model:
```
FACTS: [What the evidence confirms with high confidence]
INFERENCES: [What the evidence strongly suggests but doesn't prove]
ASSUMPTIONS: [What we are treating as true without direct evidence]
```

Every recommendation must be traceable to at least one FACT. Recommendations built only on ASSUMPTIONS are flagged as [HIGH RISK - ASSUMPTION-DEPENDENT].

### Layer 02: Force Field Analysis
*What forces are working for us and against us?*

```
TAILWINDS (working in our favor):
  - [Force] → [Evidence] → [Duration: short/medium/long]

HEADWINDS (working against us):
  - [Force] → [Evidence] → [Duration: short/medium/long]

WILD CARDS (high-impact, uncertain timing):
  - [Force] → [Evidence] → [Trigger: [what would activate this]]
```

### Layer 03: Strategic Option Generation
*What are the distinct paths forward?*

Generate 3-5 distinct strategic options. Options must be:
- Genuinely different (not variations on the same approach)
- Feasible given the situation assessment
- Traceable to the insight set (each option must respond to at least one insight)

For each option:
```
Option [N]: [Name]
Description: [2-3 sentence description]
Responds to: [Insight IDs this option addresses]
Assumptions required: [list]
Key risks: [list]
Key benefits: [list]
Evidence support: [how strongly the evidence supports this path]
Resource intensity: [Low | Medium | High | Very High]
Time to results: [< 3 months | 3–6 months | 6–12 months | > 12 months]
Reversibility: [Easily reversible | Partially reversible | Hard to reverse | Irreversible]
```

### Layer 04: Option Evaluation
*Which option(s) best fit the evidence and constraints?*

Evaluate each option against:

| Criterion | Weight | Option 1 | Option 2 | Option 3 |
|-----------|--------|----------|----------|----------|
| Evidence alignment | 30% | [0-10] | [0-10] | [0-10] |
| Risk-adjusted upside | 25% | [0-10] | [0-10] | [0-10] |
| Reversibility | 20% | [0-10] | [0-10] | [0-10] |
| Feasibility | 15% | [0-10] | [0-10] | [0-10] |
| Speed to signal | 10% | [0-10] | [0-10] | [0-10] |
| **Weighted score** | | **[score]** | **[score]** | **[score]** |

### Layer 05: Recommendation Formation
*What do we recommend, and why?*

```
PRIMARY RECOMMENDATION: [Option N]
Rationale: [2-3 sentences citing evidence and insight IDs]
Key condition: [What must be true for this to be the right call]
Confidence: [0.0–1.0]

ALTERNATIVE IF WRONG: [Option M]
Trigger: [What evidence or event would make Option M better]

WHAT NOT TO DO: [Option(s) to avoid]
Reason: [Why — cite evidence or insight]
```

### Layer 06: Risk Register
*What could make us wrong?*

For each recommendation:
```
Risk [N]: [Description]
Type: [Assumption failure | Competitive response | Execution | Market shift | Technical]
Likelihood: [H/M/L]
Impact if realized: [H/M/L]
Early warning signals: [What to watch for]
Mitigation: [Pre-emptive actions to reduce likelihood or impact]
```

### Layer 07: Next Steps
*What must happen in the next 30 days?*

```
ACTION [N]:
  What: [Specific action]
  Owner: [Agent or team]
  By when: [Date]
  Purpose: [What decision or milestone this enables]
  Success signal: [How you know this action succeeded]
```

---

## Strategic Synthesis Quality Gates

Before delivering, verify:

- [ ] Every recommendation traces to at least one insight (no ungrounded recommendations)
- [ ] Every insight traces to at least 2 evidence claims (no ungrounded insights)
- [ ] Options are genuinely different (not variations on one path)
- [ ] Risks are concrete and falsifiable (not generic "execution risk")
- [ ] Assumptions are explicit (not hidden inside recommendations)
- [ ] "Do nothing" was considered as an option (even if rejected)
- [ ] Reversibility is assessed for each option (high-stakes decisions need reversibility weighting)

---

## Output Format

```markdown
# Strategic Synthesis: [Topic]

**Research ID:** [id]
**Date:** [date]
**Confidence in recommendation:** [0.0–1.0]

## Situation Assessment
**FACTS:**
- [Fact] [Confidence: H/M/L] [Evidence: cl-id]

**INFERENCES:**
- [Inference] [Confidence: H/M/L] [Evidence: cl-id]

**ASSUMPTIONS:**
- [Assumption] [Risk if wrong: H/M/L]

## Force Field
**Tailwinds:** [list]
**Headwinds:** [list]
**Wild cards:** [list]

## Strategic Options
[Per-option cards]

## Option Evaluation Matrix
[Scored matrix]

## Primary Recommendation
[Full recommendation with rationale]

## Risk Register
[Risk table]

## Next Steps (30 days)
[Action list]

## What This Cannot Answer
[Explicit unknowns that limit confidence]
```

---

## Integration

**Called by:** `research-intelligence/orchestrator.md` (Synthesis Phase 04)
**Feeds:** `intelligence-pipelines/reporting-pipeline.md` → final intelligence package
**Also informs:** PM, Architecture, and Strategy agents as named in the mandate
