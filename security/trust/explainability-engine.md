# Explainability Engine

## Role
Generates human-readable explanations for AI decisions, workflow outputs, and routing choices. Provides the reasoning chain, evidence basis, and confidence rationale that enables human reviewers to understand, verify, and if necessary override AI outputs.

## Explanation Types

```
TYPE                        TRIGGER                                 AUDIENCE
────────────────────────────────────────────────────────────────────────────────
DECISION_RATIONALE          Any workflow decision with consequence   Reviewer / T3+
CONFIDENCE_BREAKDOWN        Output confidence score generated        Reviewer
ROUTING_JUSTIFICATION       Agent routing decision made              Orchestration lead
POLICY_APPLICATION          Policy evaluated and verdict issued      Compliance / T3+
RISK_ASSESSMENT             Risk score computed                      Risk officer
ESCALATION_TRIGGER          Escalation initiated                     Escalation target
OVERRIDE_CONTEXT            Human override requested                 Human reviewer
CONSTITUTIONAL_EVALUATION   Constitutional principle evaluated       T4/T5
```

## Explanation Schema

```yaml
explanation_record:
  explanation_id: string
  type: string
  subject_id: string          # decision_id, output_id, routing_id, etc.
  
  summary: string             # 1-2 sentence plain language summary
  
  reasoning_chain:
    - step: number
      description: string     # what was considered at this step
      evidence: [string]      # supporting evidence references
      confidence: number      # step-level confidence
  
  evidence_basis:
    sources_used: number
    avg_source_reliability: number
    weakest_link: string      # the least certain step or claim
  
  confidence_rationale:
    composite_score: number
    dimension_breakdown: {dimension: score}
    limiting_factor: string   # what most limited confidence
  
  alternatives_considered:
    - option: string
      rejected_because: string
  
  human_review_notes: string  # populated by reviewer post-review
  
  generated_at: ISO8601
  generated_for_audience: string
```

## Explanation Generation Protocol

```
TRIGGER: any output requiring review OR confidence < 0.75

STEP 1: TRACE REASONING
  extract from agent execution trace: key decision points + supporting context

STEP 2: EVIDENCE MAPPING
  for each claim: map to source evidence (knowledge graph, context, tools)

STEP 3: ALTERNATIVE RECONSTRUCTION
  identify: what were the main alternative conclusions and why rejected

STEP 4: GENERATE SUMMARY
  produce: plain-language explanation tailored to audience tier
  T1/T2 audience: technical, detailed
  T3/T4 audience: executive, decision-focused
  T5 audience: strategic, consequence-focused

STEP 5: ATTACH CONFIDENCE BREAKDOWN
  link: workflow-confidence-framework confidence_record for this output
```

## EU AI Act Transparency Compliance
For HIGH_RISK AI systems (per EU AI Act Art. 13):
- Explanation must include: capability limitations, intended purpose, oversight guidance
- Explanation must be generated and stored for every consequential decision
- Retention: 10 years for HIGH_RISK AI system explanations

## Explainability Coverage Target
```
Coverage = explanations_generated / outputs_requiring_explanation
TARGET: >= 0.99 for CONSEQUENTIAL decisions
ALERT: if coverage drops below 0.95
```

## Persistence
`memory/trust/explanations.yaml`  (index of generated explanations)
`memory/trust/explanation-store/` (full explanation records by subject_id)
