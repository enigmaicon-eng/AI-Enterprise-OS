# Executive Decision Engine
**ID:** SI-EXEC-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Strategy Org / Executive Org | **Updated:** 2026-05-16

---

## Purpose

Synthesizes all strategic intelligence, scenario outputs, and strategic options into structured executive decision packages. Frames decisions clearly, surfaces the best recommendation with full rationale, identifies the key uncertainties that could change the recommendation, and ensures all decisions are properly authorized and documented.

**Core principle:** Every significant decision has a named recommendation with a clear owner, a clear deadline, and a clear set of conditions under which the recommendation should change.

---

## Decision Package Schema

```yaml
decision_package:
  dp_id: DP-{YYYY}-{seq}
  title: string                              # "Should we [action]?" format
  decision_class: STRATEGIC | TACTICAL | OPERATIONAL | RESOURCE | RISK
  urgency: BOARD_IMMEDIATE | T4_URGENT | T3_STANDARD | ROUTINE
  
  # Context
  situation_summary: string                  # 200 words max: what is the situation?
  stakes: string                             # what happens if we decide well? poorly?
  
  # Options
  options:
    - option_ref: OPT-*
      label: string                          # e.g., "Option A: Invest Aggressively"
      summary: string
      key_risk: string
      financial_summary: string
      
  # Recommendation
  recommended_option: OPT-*
  recommendation_confidence: 0.00–1.00
  recommendation_rationale: string           # 3 reasons why this is the right call
  
  # Key Uncertainties
  recommendation_reversors:
    - condition: string                      # "If [X] happens, recommendation should change to [Y]"
      change_to: OPT-*
      probability: 0.00–1.00
      monitoring_signal: string             # what to watch
      
  # Time Sensitivity
  decision_deadline: ISO8601
  deadline_rationale: string                 # why this deadline
  cost_of_delay_per_week: string            # quantified or qualitative
  
  # Authorization
  decision_authority: agent_id              # who must decide
  required_tier: T3 | T4 | T5 | T5+BOARD
  
  # Supporting Materials
  scenario_refs: [SCP-*]
  uiu_refs: [UIU-*]
  radar_refs: [RAD-*]
  
  # Decision Record (filled when decided)
  decision_made: string | null               # what was decided
  decided_by: agent_id | null
  decided_at: ISO8601 | null
  decision_rationale: string | null         # what the decision-maker said
  
  # Status
  status: DRAFT | PENDING_REVIEW | AWAITING_DECISION | DECIDED | DEFERRED | CANCELLED
  created_at: ISO8601
  updated_at: ISO8601
```

---

## Decision Framing Protocol

The engine applies structured decision framing to every package:

### Frame 1: The Decisive Question
Every package has ONE decisive question. Compound questions are split. "Should we do X?" not "What is our strategy for X?"

### Frame 2: Options Without Anchoring
Options are presented without ordering bias. Financial summaries are comparable on the same dimensions. The recommended option is labeled after options are presented.

### Frame 3: Recommendation with Steel-Manning
The recommendation is accompanied by the strongest possible arguments against it (pre-mortem). This combats confirmation bias.

### Frame 4: Decision Reversors
Every recommendation includes at least 2 explicit conditions that would change the recommendation. This makes the decision robust to new information.

### Frame 5: Reversibility Assessment
Decisions are classified:
- REVERSIBLE_IMMEDIATELY: Can be undone at low cost within 30 days
- REVERSIBLE_EXPENSIVE: Can be undone but with significant cost/time
- PARTIALLY_REVERSIBLE: Some aspects permanent, some reversible
- IRREVERSIBLE: One-way door; requires highest confidence threshold (0.75+ for T4)

Irreversible decisions with confidence < 0.75 are automatically flagged for T5 review.

---

## Urgency Classification

| Class | Trigger | SLA | Escalation |
|-------|---------|-----|-----------|
| BOARD_IMMEDIATE | P0 radar + irreversible | 24 hours | T5 + board notification |
| T4_URGENT | P0/P1 radar + decision deadline < 2 weeks | 72 hours | T4 immediate |
| T3_STANDARD | P1/P2 + planning cycle | 1 week | T3 scheduled |
| ROUTINE | P3/P4 or planning-horizon > 30 days | Monthly cycle | T2 async |

---

## Decision Quality Standards

Before any decision package reaches T4+:
1. All listed options have comparable financial models (same time horizon, same units)
2. Recommendation confidence is explicitly stated and sourced
3. At least 2 decision reversors are identified
4. Reversibility assessment is complete
5. Supporting UIUs are current (< 30 days)
6. Constitutional compliance verified (C-001: human decides; C-003: reasoning explained)

Packages failing these standards are returned to draft with specific deficiency noted.

---

## Governance

**Decision archive:** All decided packages stored in `strategic-decision-archive.md`
**Authorization:** Decision-making authority per tier:
  - T3: tactical decisions < $100K, no headcount impact
  - T4: strategic decisions $100K–$5M, up to 10 headcount
  - T5: strategic decisions > $5M, > 10 headcount, market commitments
  - T5 + Board: M&A, company pivots, irreversible decisions > $20M
**Audit:** All packages logged to `memory/strategic-intelligence/decisions.jsonl` (append-only; Ed25519 signed)
**Constitutional binding:** C-001 absolute — AI recommends, humans decide.
