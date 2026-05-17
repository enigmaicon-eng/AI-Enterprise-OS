# Contradiction Reconciler

**System ID:** `contradiction-reconciler`
**Role:** Identifies, classifies, and resolves contradictions across the evidence corpus
**Input:** `contradiction-map-[id].json` from evidence-synthesizer
**Output:** `reconciled-claims-[id].json` + contradiction resolution log

---

## Purpose

When evidence gathering pulls from multiple sources across time, contradictions are inevitable. The Contradiction Reconciler is the system that transforms contradictions from noise into signal.

Unresolved contradictions are not discarded — they are surfaced as first-class findings. The goal is not to eliminate contradiction but to **understand what the contradiction tells us**.

---

## Contradiction Classification

Every contradiction must be classified before resolution is attempted:

### Type A: Temporal Conflict
*Two claims that were both true at different points in time.*

- Example: "Company X raised Series A in 2023" vs. "Company X has raised $50M total"
- Resolution: Both are true — sequence them chronologically
- Action: Accept both, add timestamps, note trajectory

### Type B: Scope Conflict
*Two claims that are both true but for different scopes or segments.*

- Example: "Users love the mobile app" vs. "Users are frustrated with the mobile app"
- Resolution: Both are true for different user segments or use cases
- Action: Accept both, add scope qualifiers, note segment-dependency

### Type C: Credibility Conflict
*Two claims where one source is more credible than the other.*

- Example: Official company announcement vs. anonymous Reddit post
- Resolution: Weight higher-credibility source, note lower-credibility alternative
- Action: Accept high-credibility claim, flag low-credibility as [MINORITY VIEW]

### Type D: Methodological Conflict
*Two claims derived from different methodologies yielding different results.*

- Example: Top-down TAM estimate of $5B vs. bottom-up estimate of $2B
- Resolution: Both are valid — the range IS the answer
- Action: Accept both as bounds, document methodological difference, report as range

### Type E: Factual Conflict
*Two claims cannot both be true — one is incorrect.*

- Example: "Company X has 50 employees" vs. "Company X has 200 employees"
- Resolution: Seek tiebreaker evidence; if unresolvable, flag as [UNRESOLVED CONFLICT]
- Action: Research additional sources, weight by recency and credibility

### Type F: Perspective Conflict
*Two claims that reflect different stakeholder perspectives on the same reality.*

- Example: "This feature was dropped due to low demand" vs. "This feature was discontinued due to technical complexity"
- Resolution: Both may be true as framing; synthesize as multi-causal
- Action: Accept as complementary explanations, note differing framings

---

## Resolution Protocol

### Step 01: Triage

For each contradiction in the map:
1. Classify into Type A–F
2. Assign resolution strategy based on type (see above)
3. Sort by impact on investigation (contradictions in high-confidence, high-importance claims first)

### Step 02: Evidence Gathering (if needed)

For Type E (Factual Conflict) only — gather tiebreaker evidence:
- Search for a third, independent source
- Weight primary sources (official, first-party) over secondary
- Weight recent sources over old
- If no tiebreaker found after 2 additional searches: mark as [UNRESOLVED]

### Step 03: Resolution Documentation

For every contradiction, produce a resolution record:

```json
{
  "contradiction_id": "con-[uuid]",
  "type": "Type-C",
  "claim_a": "cl-[id]",
  "claim_b": "cl-[id]",
  "resolution": "RESOLVED | UNRESOLVED | PARTIAL",
  "resolution_method": "[credibility | temporal | scope | methodological | tiebreaker | perspective]",
  "accepted_claim": "cl-[id]",
  "rejected_claim": "cl-[id]",
  "rejection_reason": "[reason]",
  "minority_view_preserved": true,
  "confidence_impact": -0.05,
  "resolution_evidence": ["ev-[id]"],
  "notes": "[any nuance worth preserving]"
}
```

### Step 04: Confidence Adjustment

After resolution:
- Resolved contradictions: no confidence penalty if well-resolved
- Partially resolved: reduce claim confidence by 0.10
- Unresolved factual conflicts: reduce claim confidence by 0.20
- Multiple unresolved conflicts in same sub-question: escalate to orchestrator

### Step 05: Minority View Preservation

**All minority views are preserved**, even when rejected as primary claim.

Minority views surface in the intelligence package as:
```
[MINORITY VIEW] [Claim] — Source: [source] — Credibility: [score]
Reason not primary: [brief explanation]
Why it matters: [what it might signal]
```

Minority views are particularly valuable as:
- Early signals of emerging reality (what is wrong today may be right tomorrow)
- Counter-evidence for stress-testing the primary finding
- Hedge signals for high-stakes decisions

---

## Unresolved Contradiction Handling

When a contradiction cannot be resolved, it becomes a **first-class finding**:

```markdown
## Unresolved Contradiction: [topic]

**Claims in conflict:**
- Claim A: "[text]" — Source: [source] — Credibility: [score]
- Claim B: "[text]" — Source: [source] — Credibility: [score]

**Why unresolved:** [explanation — e.g., both high credibility, no tiebreaker found]

**What this contradiction signals:**
[Analysis of what the disagreement itself tells us about the topic]

**Decision implication:**
[How a decision-maker should weight this uncertainty]

**Recommended follow-up:**
[What additional investigation would resolve this]
```

Unresolved contradictions are listed in:
- The synthesis summary under "Contradictions"
- The final intelligence package under "Key Uncertainties"
- The gap report for follow-on investigation

---

## Output Format

### Reconciled Claims Registry
```json
{
  "investigation_id": "[id]",
  "reconciliation_timestamp": "[ISO-8601]",
  "contradictions_found": 12,
  "contradictions_resolved": 9,
  "contradictions_unresolved": 3,
  "confidence_impact_avg": -0.04,
  "claims": [
    {
      "claim_id": "cl-[id]",
      "final_confidence": 0.87,
      "resolution_applied": "Type-C",
      "minority_views": ["cl-[id]"]
    }
  ],
  "unresolved_contradictions": [
    {
      "contradiction_id": "con-[id]",
      "impact_on_investigation": "HIGH | MEDIUM | LOW",
      "recommended_action": "[text]"
    }
  ]
}
```

### Contradiction Resolution Log
Human-readable log of all contradiction resolution decisions, rationale, and preservation notes.

---

## Integration

**Called by:** `research-intelligence/orchestrator.md` (after evidence-synthesizer)
**Feeds:** `synthesis-systems/insight-extractor.md` (reconciled claims as input)
**Escalates to:** Orchestrator when >20% of critical claims have unresolved conflicts
