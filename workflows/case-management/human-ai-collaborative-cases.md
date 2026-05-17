# Human-AI Collaborative Cases

## Purpose
Defines the collaboration patterns for cases where humans and AI agents work together as partners — neither fully autonomous AI nor fully manual human processes. This system manages the division of labor, context handoffs, disagreement resolution, and trust calibration between human and AI participants.

---

## Collaboration Modes

### Mode 1 — AI-Assisted Human
AI analyzes and recommends; human decides and executes.

```
Human initiates task
  → AI: analyze context, generate options, score each option
  → AI: present analysis with confidence scores and reasoning
  → Human: select option (can override AI)
  → Human: execute decision
  → AI: learn from outcome (update model if feedback provided)
```

**When to use:** High-stakes decisions; regulatory contexts; novel situations with insufficient AI training data.

---

### Mode 2 — Human-Supervised AI
AI executes; human monitors and can intervene.

```
Human or system initiates task
  → AI: execute task autonomously
  → AI: publish intermediate results and confidence levels
  → Human: monitors (async spot-checks based on risk level)
  → If confidence drops below threshold: AI pauses, requests human review
  → If human dissatisfied: human overrides or redirects
  → AI: learns from overrides
```

**When to use:** Repeatable tasks where AI has proven track record; human capacity is the constraint.

---

### Mode 3 — Parallel Investigation
Human and AI investigate independently; compare and synthesize findings.

```
Both receive same task simultaneously
  → AI: complete analysis using available data + reasoning
  → Human: complete analysis using domain expertise + intuition
  → Both submit findings independently
  → Synthesis agent: compare findings, identify agreements and discrepancies
  → Joint review: resolve discrepancies with explicit rationale
  → Synthesized conclusion published
```

**When to use:** Critical decisions where bias detection matters; novel problems.

---

### Mode 4 — Iterative Co-Creation
Human and AI take turns building the artifact.

```
Human: initial framing or partial artifact
  → AI: extend, refine, identify gaps
  → Human: review AI additions, accept/modify/reject
  → AI: update based on human feedback
  → [iterate until human satisfied]
  → Human: final approval and signature
```

**When to use:** Document creation, design, planning.

---

## Collaboration Contract Schema

Each collaborative case task defines a collaboration contract:

```yaml
collaboration_contract:
  task_id: "string"
  mode: AI_ASSISTED_HUMAN | HUMAN_SUPERVISED_AI | PARALLEL | ITERATIVE
  
  ai_agent:
    agent_id: "agent-id"
    capabilities: [capability-strings]
    confidence_threshold: 0.0–1.0   # below this: pause and request human
    autonomy_scope: "what AI can do without asking"
    escalation_triggers: [condition-strings]
  
  human_participant:
    participant_id: "agent-id"
    role: "role string"
    review_commitment: "when/how often human will check in"
    override_rights: FULL | SCOPE_LIMITED | NONE
    notification_channel: "email | slack | in-app"
  
  handoff_protocol:
    ai_to_human:
      trigger: "confidence < threshold OR uncertainty_flag OR scope_exceeded"
      handoff_package:
        - current_analysis
        - confidence_scores_by_dimension
        - questions_for_human
        - recommended_next_steps
        - time_sensitive: true/false
    
    human_to_ai:
      trigger: "human completes their portion"
      handoff_package:
        - human_decision
        - rationale
        - additional_context
        - feedback_on_ai_analysis: {useful: bool, gaps: [string]}
  
  disagreement_resolution:
    on_ai_human_disagreement:
      threshold: 0.30     # disagreement magnitude (0.0–1.0)
      below_threshold: log_and_proceed_with_human_decision
      above_threshold: convene_structured_review
    
    structured_review:
      chair: governance-lead role
      process: explicit_rationale_from_both + synthesis
      outcome_required: ADOPT_AI | ADOPT_HUMAN | SYNTHESIS | ESCALATE
  
  learning:
    capture_outcome: true
    feedback_to_ai: true
    outcome_labels: [correct | partially_correct | incorrect | uncertain]
    data_retention: 365 days
```

---

## Trust Calibration System

Tracks AI reliability per task type to dynamically adjust autonomy:

```yaml
trust_calibration:
  trust_scores:
    "{agent_id}:{capability}":
      score: 0.0–1.0
      observations: integer
      correct_count: integer
      override_count: integer
      last_updated: ISO-8601
  
  autonomy_thresholds:
    LOW_AUTONOMY:    score < 0.60    # Mode 1 only; human does all critical steps
    MODERATE:        0.60–0.80       # Mode 2 with frequent spot-checks
    HIGH:            0.80–0.90       # Mode 2 with infrequent spot-checks
    FULL_AUTONOMY:   score >= 0.90   # AI executes; human reviews outcome only
  
  trust_update_formula: |
    new_score = (score × observations + outcome_weight) / (observations + 1)
    
    outcome_weights:
      correct_with_no_override: +1.0
      correct_after_human_review: +0.8
      override_but_ai_was_right: +0.5
      override_ai_was_wrong: -1.0
      incorrect_without_override: -2.0   # penalty for undetected errors
  
  trust_decay:
    rate: 0.02 per 30 days of inactivity   # stale trust degrades
    minimum_observations_for_HIGH: 20
    minimum_observations_for_FULL: 50
```

---

## Context Handoff Package

Standardized package passed between human and AI at every handoff:

```yaml
handoff_package:
  handoff_id: "uuid"
  from: {agent_id, type: HUMAN | AI}
  to: {agent_id, type: HUMAN | AI}
  timestamp: ISO-8601
  case_id: string
  task_id: string
  
  current_state:
    what_was_done: "narrative description"
    artifacts_produced: [artifact-ref]
    decisions_made: [{decision, rationale, confidence}]
    data_examined: [data-ref]
  
  open_items:
    questions: [{question, context, urgency: HIGH | NORMAL | LOW}]
    next_steps: [{step, reason, estimated_effort}]
    blockers: [{blocker, owner, expected_resolution}]
  
  confidence_summary:
    overall: 0.0–1.0
    by_dimension: {dimension: score}
    low_confidence_areas: [area-description]
  
  recommendations: [recommendation-with-rationale]
  
  time_context:
    time_spent_ms: integer
    deadline: ISO-8601 | null
    urgency: CRITICAL | HIGH | NORMAL | LOW
```

---

## Escalation from Collaborative Cases

When collaboration breaks down (persistent disagreement, missed commitments, scope confusion):

```yaml
collaboration_escalation_triggers:
  - disagreement_rounds >= 3 without resolution
  - human_non_responsive > sla_ms × 2
  - ai_confidence < 0.40 on critical task (not enough to proceed)
  - scope_expansion_detected (case growing beyond original mandate)
  - constitutional_concern_flagged_by_ai

escalation_action:
  create: case-management/escalation-case-system.md new case
  type: COLLABORATION_BREAKDOWN
  evidence: full collaboration history + disagreement log
  route_to: governance-lead + both participants' managers
```
