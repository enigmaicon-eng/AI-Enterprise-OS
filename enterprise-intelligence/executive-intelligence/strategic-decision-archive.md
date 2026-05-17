# Strategic Decision Archive
**ID:** SI-EXEC-004 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Permanent, immutable archive of all strategic decisions with full context, rationale, conditions, and outcomes. Serves as organizational memory for strategic decision-making. Enables calibration of the intelligence and scenario systems. Provides the foundation for learning from past decisions.

---

## Archive Record Schema

```yaml
decision_record:
  record_id: DEC-{YYYY}-{seq}
  dp_ref: DP-*                           # source decision package
  
  # Decision Identity
  title: string
  class: STRATEGIC | TACTICAL | OPERATIONAL | RESOURCE | RISK
  decision_made: string                  # what was actually decided (human-authored)
  
  # Full Context at Time of Decision
  decided_by: agent_id
  decided_at: ISO8601
  authorization_tier: T3 | T4 | T5 | T5+BOARD
  
  # Conditions and Logic
  decision_rationale: string             # why this option was chosen (human-authored)
  key_uncertainties_acknowledged: [string]  # what the decision-maker knew they didn't know
  
  # AI Recommendation Record
  ai_recommendation: OPT-*
  ai_confidence: 0.00–1.00
  ai_recommendation_accepted: true | false | partial
  if_diverged_reason: string | null      # if human chose differently than AI recommendation
  
  # Scenario Context at Time of Decision
  active_scenarios_at_decision: [SCP-*]
  most_probable_world_at_decision: WLD-*
  world_probability_at_decision: 0.00–1.00
  
  # Reversibility
  reversibility: REVERSIBLE_IMMEDIATELY | REVERSIBLE_EXPENSIVE | PARTIALLY_REVERSIBLE | IRREVERSIBLE
  rollback_plan: string | null
  
  # Outcome Tracking
  outcome_review_schedule: [ISO8601]     # T+30, T+90, T+180, T+365
  
  outcomes:
    - review_date: ISO8601
      actual_outcome: string
      vs_forecast: BETTER | AS_EXPECTED | WORSE | NOT_YET_MEASURABLE
      leading_indicators_confirmed: [string]
      leading_indicators_disconfirmed: [string]
      decision_quality_in_hindsight: GOOD | ACCEPTABLE | POOR | EXCELLENT
      notes: string
      
  # Cryptographic integrity
  sha256_hash: string                    # hash of record at creation
  ed25519_signature: string             # signed by deciding agent
  
  # Retention
  retention_class: STANDARD_7Y | IRREVERSIBLE_PERMANENT | BOARD_PERMANENT
```

---

## Outcome Review Protocol

The archive is only useful if outcomes are tracked. Reviews are triggered automatically:

**T+30 day review:**
- Are leading indicators trending as expected?
- Are any early warning signals triggering?
- Is the decision still the right one given new information?

**T+90 day review:**
- Quantitative outcome measurement vs. forecast
- World probability update (did the expected world materialize?)
- Any early learning for the AI recommendation system?

**T+180 day review:**
- Full outcome assessment
- Recommendation accuracy measurement (fed back to outcome-probability-modeler.md)
- Pattern identification: what did we get right/wrong in the analysis?

**T+365 day review:**
- Final outcome judgment for STRATEGIC and RESOURCE class decisions
- Calibration contribution to the intelligence system
- Narrative learning written to wiki for organizational memory

---

## Learning Extraction

Monthly, the archive is analyzed for patterns:

**Decision quality patterns:**
- Which decision classes have best outcome rates?
- Where does AI recommendation vs. human divergence correlate with better outcomes?
- Which uncertainty types were most underweighted?

**AI calibration:**
- For decisions where AI recommendation was accepted: what % had GOOD/EXCELLENT outcomes?
- For decisions where AI recommendation was rejected: what % had BETTER/AS_EXPECTED outcomes?
- This feeds forecast calibration in outcome-probability-modeler.md

**Strategic pattern library:**
- Decisions in similar contexts: what worked?
- Decisions under time pressure vs. deliberate: quality difference?
- Reversible vs. irreversible decisions: different calibration thresholds needed?

Learning output: monthly summary to `memory/strategic-intelligence/decision-learnings.yaml`.

---

## Access and Governance

**Access tiers:**
- T2: Own decision records only
- T3: All decisions in their domain
- T4: Full archive read access
- T5: Full archive read/write; can amend (but not delete) records

**Immutability:** Original records are never modified. Amendments are appended records that reference the original.

**Cryptographic integrity:** SHA-256 hash chain across all records (same pattern as `audit-replay/immutable-audit-log.md`). Chain integrity verified daily.

**Retention:**
- STANDARD decisions: 7 years
- IRREVERSIBLE decisions: permanent
- BOARD decisions: permanent

**Confidentiality:** All records are CONFIDENTIAL minimum; BOARD decisions are RESTRICTED.
