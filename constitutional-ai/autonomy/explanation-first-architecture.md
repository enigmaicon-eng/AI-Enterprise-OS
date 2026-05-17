# Explanation-First Architecture
**ID:** AUT-EFA-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + Governance Org | **Updated:** 2026-05-16

---

## Purpose

Requires Level 3+ autonomous agents to produce structured explanations of their reasoning before or alongside their outputs. As agents gain autonomy, the ability to audit and understand their reasoning becomes more — not less — important. Explanation-first architecture makes AI reasoning legible to humans and enables meaningful oversight even as autonomy increases.

---

## Explanation Levels

Not every decision requires the same depth of explanation. This framework defines appropriate depth by decision stakes:

```yaml
explanation_depth:
  MINIMAL:
    when: Routine pre-authorized actions, data retrieval
    format: Single sentence + decision type label
    example: "Retrieved Q2 OKR data for quarterly review [DATA_RETRIEVAL]"
    
  STANDARD:
    when: Workflow step completion, routine recommendations
    format: What was decided + why (3–5 sentences) + alternatives considered
    required_for: Level 3+ agents on any step boundary
    
  DETAILED:
    when: Strategic recommendations, resource allocation, escalation decisions
    format: Structured reasoning trace (see schema below)
    required_for: Level 4+ agents; any Level 3 agent making HIGH-stakes decisions
    
  FULL_AUDIT:
    when: Decisions near constitutional boundaries, irreversible actions, novel situations
    format: Complete chain-of-thought with uncertainty quantification
    required_for: Any Level 3+ agent when escalation trigger is considered but not pulled
```

---

## Standard Explanation Schema

```yaml
decision_explanation:
  explanation_id: EXP-{NNN}
  agent_id: string
  decision_at: ISO8601
  
  context:
    workflow_id: string | null
    step_id: string | null
    decision_type: string
    stakes: LOW | MEDIUM | HIGH | CRITICAL
    
  reasoning:
    situation_assessment: string         # what is the current state / problem?
    relevant_constraints: [string]       # what constraints apply to this decision?
    options_considered: [{
      option: string,
      pros: [string],
      cons: [string],
      eliminated_because: string | null
    }]
    chosen_option: string
    primary_reason: string               # the single most important reason for choice
    uncertainty_level: LOW | MEDIUM | HIGH
    uncertainty_basis: string            # what drives the uncertainty?
    
  constitutional_check:
    principles_considered: [string]      # which of C001–C012 were relevant
    constitutional_issues_identified: [string]  # any concerns, even if resolved
    resolution: string | null            # how constitutional concerns were addressed
    
  confidence: 0.00–1.00
  escalation_considered: boolean
  escalation_reason_if_not: string | null  # why escalation was NOT triggered
  
  depth: MINIMAL | STANDARD | DETAILED | FULL_AUDIT
```

---

## Explanation Capture Infrastructure

```
Explanation capture pipeline:

  Agent generates explanation (structured or natural language) →
  Explanation Parser normalizes to standard schema →
  Explanation Store appends to memory/autonomy/explanations.jsonl →
  Explanation Indexer makes searchable by agent/decision/date →
  Human Review Queue (sampled explanations surfaced for human review)
```

### Explanation Quality Checks

```
Automated quality assessment per explanation:
  - Completeness: are all required fields populated for the declared depth?
  - Coherence: does chosen_option follow logically from options_considered?
  - Constitutional coverage: if decision was near C00X boundary, was it mentioned?
  - Confidence calibration: track explanation confidence vs. outcome accuracy over time
    (target ECE < 0.08 on explanation confidence scores)

Quality score per explanation: 0.00–1.00
Low quality (< 0.60): flag for agent; contribute to trust score (−0.01 per low-quality explanation)
High quality (> 0.90): positive trust contribution (+0.01)
```

---

## Explanation Review Interface

Human reviewers see explanations surfaced by behavioral contract monitoring:

```
╔═════════════════════════════════════════════════════════════╗
║  EXPLANATION REVIEW — agent-strategic-001 — 2026-05-16      ║
╠═════════════════════════════════════════════════════════════╣
║  Decision: Recommended deprioritizing Initiative X in Q3    ║
║  Stakes: HIGH | Confidence: 0.72 | Depth: DETAILED          ║
╠═════════════════════════════════════════════════════════════╣
║  SITUATION: Initiative X has ROI of 0.4× over 90 days,     ║
║  below the 0.5× threshold defined in portfolio guidelines.   ║
║                                                             ║
║  OPTIONS CONSIDERED:                                        ║
║  A. Deprioritize (chosen): frees 3 agent-weeks for Q3       ║
║  B. Pivot scope: would require T4 approval; too slow         ║
║  C. Continue: would consume budget with negative ROI         ║
║                                                             ║
║  CONSTITUTIONAL CHECK: None of C001–C012 implicated.        ║
║  ESCALATION: Not triggered (within Level 3 scope).          ║
╠═════════════════════════════════════════════════════════════╣
║  [APPROVE] [REQUEST_CLARIFICATION] [OVERRIDE] [FLAG]        ║
╚═════════════════════════════════════════════════════════════╝
```

---

## Aggregated Explanation Analytics

```yaml
explanation_analytics:
  period: YYYY-MM
  agent_id: string
  
  explanations_generated: number
  avg_quality_score: 0.00–1.00
  
  decision_type_breakdown: {type: count}
  
  escalation_rate: 0.00–1.00           # % of decisions that triggered escalation
  constitutional_consideration_rate: 0.00–1.00  # % that mentioned any principle
  
  confidence_calibration:
    mean_confidence: 0.00–1.00
    actual_accuracy: 0.00–1.00
    ece: 0.00–1.00                     # target: < 0.08
    
  human_override_rate: 0.00–1.00       # % of decisions overridden by human review
```

---

## Governance

**Explanation requirement:** Mandatory for all Level 3+ agents; cannot be disabled
**Minimum depth by level:** Level 3 → STANDARD; Level 4 → DETAILED; Level 5 → FULL_AUDIT
**Explanation store:** `memory/autonomy/explanations.jsonl` (append-only, 3-year retention)
**Review sampling:** Behavioral contract sets sampling rate; minimum 5% for Level 3
**Calibration review:** Monthly explanation quality and confidence calibration report
