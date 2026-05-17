# Insight Extractor

**System ID:** `insight-extractor`
**Role:** Distills reconciled evidence into discrete, actionable insights ranked by significance
**Input:** Reconciled claims registry + synthesis summary
**Output:** Structured insight set with evidence backing and action implications

---

## Purpose

Raw evidence + synthesis tell you what the data shows. Insights tell you **what it means**. The Insight Extractor bridges the gap between evidence (facts) and intelligence (implications).

An insight is not a rephrasing of a data point. An insight is a non-obvious pattern, connection, or implication that requires synthesis across multiple data points to see.

---

## Insight Definition Standards

**A valid insight must:**
1. Be grounded in at least 2 independent evidence items (never single-source)
2. Not be directly stated in any single source (requires synthesis)
3. Have a clear implication for decisions or strategy
4. Be surprising or non-obvious (confirming the expected is observation, not insight)
5. Be falsifiable — must be able to state what would disprove it

**An insight is NOT:**
- A data point restated ("Users have this pain")
- A summary of what competitors do ("Competitor X has feature Y")
- A recommendation (recommendations come from insights, they are not insights themselves)
- An opinion without evidence grounding

---

## Insight Types

### 1. Pattern Insight
A pattern appearing across multiple data points that wasn't stated anywhere explicitly.

Example: "Users request feature X in three different contexts — onboarding, migration, and advanced config — suggesting X solves a cross-cutting problem, not a point-solution need."

### 2. Contradiction Insight
A contradiction that, when examined, reveals an underlying structural truth.

Example: "Power users love the complexity; new users abandon because of it. The contradiction reveals our current product is optimized for one segment at the expense of the other — not a quality problem but a segmentation problem."

### 3. Gap Insight
What is absent from the evidence corpus that should be there.

Example: "No competitor has addressed async collaboration in this space, yet user reviews consistently mention team coordination friction. The absence of a solution + clear demand = white space."

### 4. Trajectory Insight
A direction of change implied by signals across time.

Example: "Three years of review data show increasing mentions of 'AI' and 'automation' in the same sentence as our product category — demand for AI-native features is accelerating, not stable."

### 5. Structural Insight
A structural property of the market or problem that shapes all decisions.

Example: "The buying process consistently involves 3 stakeholders with different priorities: IT (security), Finance (cost), and the end user (usability). Products optimized for any one stakeholder lose in deals requiring all three."

---

## Extraction Process

### Step 01: Cross-Claim Pattern Search

Read all reconciled claims and search for:
- Claims from different sub-questions that share a common underlying mechanism
- Claims that together imply something neither states alone
- Claims that, when juxtaposed, reveal an unexpected structure

### Step 02: Evidence-Deficit Scan

Identify where evidence was expected but absent:
- Sub-questions where competitors should have data but don't → gap signal
- Market segments that should appear in reviews but don't → possible underserved segment
- Time periods where signals should exist but are missing → suppressed information or premature inquiry

### Step 03: Trajectory Analysis

Sort evidence items by date and look for:
- Direction of change in sentiment, volume, or nature of signals
- Acceleration or deceleration in trend strength
- Phase transitions (market moving from early-adopter to mainstream, for example)

### Step 04: Structural Decomposition

Ask of every major finding:
- What structural property of the market/user/technology makes this true?
- If you changed that structural property, would the finding reverse?
- What decisions does this structural property constrain?

### Step 05: Surprise Test

For each candidate insight:
- Would a well-informed domain expert already know this?
  - Yes → this is observation, not insight. Deepen.
  - No → candidate insight, proceed to validation

### Step 06: Insight Validation

For each candidate insight:
- Map to at least 2 independent evidence items (cite claim IDs)
- State the implication clearly
- State what would falsify it
- Assign confidence score based on evidence depth

---

## Insight Record Format

```json
{
  "insight_id": "ins-[uuid]",
  "type": "pattern | contradiction | gap | trajectory | structural",
  "headline": "[One sentence — the insight]",
  "explanation": "[2-3 sentences — why this is non-obvious and what it implies]",
  "evidence_claims": ["cl-[id1]", "cl-[id2]", "cl-[id3]"],
  "evidence_strength": "strong | moderate | tentative",
  "confidence": 0.84,
  "implication": "[What this means for a decision-maker]",
  "falsification": "[What evidence would disprove this insight]",
  "urgency": "immediate | 3-month | 6-month | long-term",
  "decision_domains": ["PM | strategy | architecture | market | org"],
  "recommended_action_type": "investigate | decide | monitor | escalate"
}
```

---

## Insight Ranking

Rank insights by composite score:

```
Insight Score = (Confidence × 0.40) + (Evidence Strength × 0.30) + (Decision Impact × 0.30)

Decision Impact:
  - Blocks a major decision if wrong: 1.0
  - Changes a roadmap priority: 0.7
  - Adds nuance to existing direction: 0.4
  - Interesting but not action-driving: 0.1
```

Top-ranked insights go in the Executive Summary. All insights go in the full intelligence package.

---

## Output Format

```markdown
# Insight Set: [Investigation Topic]

**Extraction Date:** [date]
**Total Insights:** [N]
**High-confidence (≥0.80):** [N]
**Medium-confidence (0.60–0.79):** [N]
**Tentative (<0.60):** [N]

## Priority Insights

### Insight 1: [Headline]
**Type:** [type] | **Confidence:** [score] | **Urgency:** [urgency]

[Explanation — 2-3 sentences]

**Evidence backing:**
- [Claim summary] — [source type] — Confidence: [score]
- [Claim summary] — [source type] — Confidence: [score]

**Implication:** [Decision-relevant implication]
**Falsification:** [What would disprove this]
**Recommended action:** [investigate | decide | monitor | escalate]

---

[Repeat for all priority insights]

## Supporting Insights
[Full list of lower-priority insights in condensed format]

## Insight Confidence Map
[Matrix showing which sub-questions have strong vs. thin insight support]
```

---

## Integration

**Called by:** `research-intelligence/orchestrator.md` (after contradiction-reconciler)
**Feeds:** `synthesis-systems/strategic-synthesis.md` (insights → strategic implications)
**Also feeds:** `intelligence-pipelines/reporting-pipeline.md` (insights → final report)
