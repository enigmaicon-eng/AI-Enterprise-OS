# WF-006: AI Feature Delivery

**Version:** 1.0.0 | **Owner:** Engineering Org | **Tier:** T2 | **Class:** REGULATED | **SLA:** 21 days

## Purpose
Deliver AI/ML-powered features safely from approved PRD through architecture review, model selection, safety evaluation, EU AI Act compliance assessment, staged rollout, and post-launch monitoring — with every gate enforced and every decision recorded.

## Inputs

```
REQUIRED:
  prd_id:               artifact_id — approved WF-001 output
  adr_id:               artifact_id — approved WF-005 output (architecture approved)
  ai_approach:          MODEL_INTEGRATION | FINE_TUNING | RAG | AGENT_BASED | CUSTOM_MODEL
  risk_classification:  MINIMAL | LIMITED | HIGH_RISK (EU AI Act Art.6)
  team_id:              string

OPTIONAL:
  model_candidates:     [model_id] — pre-identified model options
  data_sources:         [entity_id] — training/inference data sources
  latency_sla_ms:       number — inference latency requirement
```

## Outputs / Artifacts

```
PRIMARY:
  AI_SPEC:              wiki/engineering/ai-specs/{feature_id}.md
  SAFETY_EVAL_REPORT:   evaluation results across all safety dimensions
  EU_AI_ACT_ASSESSMENT: HIGH_RISK classification checklist + compliance record
  MODEL_CARD:           model metadata, limitations, bias assessment
  DEPLOYMENT_RECORD:    deployment-intelligence/deployment-audit.md entry

SECONDARY:
  MONITORING_PLAN:      observability config for live model behavior
  FALLBACK_PLAN:        degradation behavior if model fails
  ROLLBACK_RUNBOOK:     steps to disable AI feature and revert to baseline
```

## Lifecycle States

```
INITIATED → VALIDATING → PREREQUISITE_CHECK → AI_SPEC_DRAFTING
  → MODEL_SELECTION → SAFETY_EVALUATION → EU_AI_ACT_REVIEW
  → [HIGH_RISK] COMPLIANCE_GATE → IMPLEMENTATION
  → INTEGRATION_TESTING → QUALITY_GATE → STAGING_VALIDATION
  → LAUNCH_READINESS_GATE → CANARY_LAUNCH → FULL_LAUNCH
  → POST_LAUNCH_MONITORING (30 days)
  → COMPLETED | FAILED | ROLLBACK
```

## Execution Graph

```
S-001  AUTH_CHECK              [GATE: G-AUTH T2+]              Root
S-002  PREREQUISITE_CHECK      [GATE: COMPOUND]                depends_on: S-001
         REQUIRE: prd_id.status = APPROVED; adr_id.status = APPROVED
         REQUIRE: data sources have GOLD quality tier (HIGH_RISK) or SILVER (others)
         REQUIRE: if HIGH_RISK: privacy impact assessment initiated
S-003  AI_SPEC_DRAFT           [AGENT: eng-agent]              depends_on: S-002
         Produce: problem framing, input/output schema, model approach, eval plan
         Include: explainability requirements (EU AI Act Art.13 if HIGH_RISK)
S-004  MODEL_SELECTION         [AGENT: eng-agent + arch-agent] depends_on: S-003
         Evaluate candidates: quality, latency, cost, data privacy, EU AI Act fit
         Output: selected model with justification; runner-up documented
S-005  DATA_GOVERNANCE_REVIEW  [AGENT: governance-agent]       depends_on: S-003
         Check: data lineage complete; PII handling compliant; retention policy set
         HIGH_RISK: DPO sign-off required (S-005a [HUMAN: DPO])
S-006  SAFETY_EVALUATION       [AGENT: safety-evaluator]       depends_on: S-004
         Dimensions: hallucination rate, bias assessment, harmful output rate,
                     performance variance, out-of-distribution behavior
         Tools: evaluation-framework.md DEEP evaluation protocol
         Pass threshold: all dimensions >= 0.85 (HIGH_RISK: 0.95)
S-007  EU_AI_ACT_ASSESSMENT    [AGENT: compliance-agent]       depends_on: S-006
         Map to: EU AI Act Art.6 risk classification
         HIGH_RISK checklist: Art.9 (risk mgmt), Art.10 (data gov), Art.11 (technical doc),
                              Art.13 (transparency), Art.14 (human oversight), Art.15 (accuracy)
         Output: compliance status per article; gaps identified
S-008  COMPLIANCE_GATE         [GATE: G-LEGAL]                 depends_on: S-007
         REQUIRED ONLY IF: risk_classification = HIGH_RISK
         Approver: T4 DPO + T4 CISO  |  SLA: 5 business days
         BLOCK: if any HIGH_RISK gap unresolved
S-009  IMPLEMENTATION          [AGENT: eng-agent]              depends_on: S-007 or S-008
         Code + integration; follows ADR patterns; observability instrumented
         Mandatory: explainability endpoint for HIGH_RISK features
         Mandatory: fallback_plan implemented and tested
S-010  INTEGRATION_TESTING     [AGENT: qa-agent]               depends_on: S-009
         Test suite: functional, safety regression, latency, fallback activation
S-011  QUALITY_GATE            [GATE: G-QUALITY]               depends_on: S-010
         All tests pass; safety metrics above threshold; latency within SLA
S-012  STAGING_VALIDATION      [AGENT: eng-agent + qa-agent]   depends_on: S-011
         24hr soak in staging; monitor: inference quality, latency, error rate
         Simulate: adversarial inputs; out-of-distribution inputs
S-013  MODEL_CARD_WRITE        [AGENT: eng-agent]              depends_on: S-012
         Document: architecture, training data summary, eval results, limitations, bias findings
S-014  LAUNCH_READINESS        [GATE: G-LAUNCH]                depends_on: S-012, S-013
         Reviewers: PM lead, engineering lead, QA lead, (DPO if HIGH_RISK)
         Check: monitoring plan live; rollback runbook tested; comms ready
S-015  CANARY_LAUNCH           [WORKFLOW: WF-011]              depends_on: S-014
         5% traffic; 24hr monitoring; canary-intelligence.md assessment
         SUCCESS: promote to full launch
         FAIL: auto-rollback; trigger ROLLBACK state
S-016  FULL_LAUNCH             [WORKFLOW: WF-011]              depends_on: S-015
S-017  POST_LAUNCH_MONITORING  [AGENT: monitoring-agent]       depends_on: S-016
         30-day window: track quality drift, bias drift, EU AI Act continued compliance
         Weekly: safety metrics report; DPO report if HIGH_RISK
S-018  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-017 start
S-019  MEMORY_UPDATE           [SYSTEM]                        depends_on: S-018
S-020  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-019
```

## Approval Gates

```
G-AUTH:       initiator >= T2; PRD and ADR both approved
G-QUALITY:    safety evaluation pass; all tests passing; latency within SLA
G-LEGAL:      DPO + CISO; HIGH_RISK features only; 5-day SLA; no bypass
G-LAUNCH:     PM + Eng + QA + (DPO for HIGH_RISK); SLA 48hr
```

## Escalation Logic

```
TRIGGER                                  ACTION                        SLA
─────────────────────────────────────────────────────────────────────────────────
Safety evaluation fails 2×               T3 ML lead + DPO review       4hr
EU AI Act HIGH_RISK gap unresolved        T4 DPO + legal; block deploy  Immediate
Canary shows quality regression > 5%     Auto-rollback; T3 alert       Immediate
G-LEGAL SLA breach (5d)                   T4 DPO escalation             2hr
Post-launch quality drift > 0.10 in 7d   T3 review; model refresh      24hr
```

## Governance Checkpoints

```
C-001: Human oversight — HIGH_RISK features require DPO + CISO approval
C-003: AI spec artifact before implementation begins
C-004: Model card + EU AI Act assessment records preserved 10 years
C-006: Privacy-first — PII in training/inference data requires DPO sign-off
EU AI Act Art.9,10,11,13,14,15: all required for HIGH_RISK
EU AI Act ENFORCEMENT DATE: 2026-08-02 — all HIGH_RISK features must be compliant
PROHIBITED AI: any feature touching Art.5 prohibited practices → immediate block
```

## Observability

```
HEALTH METRICS:
  safety_eval_pass_rate:      target >= 0.90 (good features pass first time)
  canary_success_rate:        target >= 0.95
  post_launch_quality_drift:  target < 0.05 over 30d
  eu_ai_act_compliance_pct:   target = 100% for HIGH_RISK features
  model_latency_p95_ms:       within declared latency_sla_ms

SLA BREACH:
  > 21 days: ALERT T3 + T4
  HIGH_RISK gap at launch: BLOCK; T4 immediate; cannot ship non-compliant HIGH_RISK AI
```

## Telemetry Events

```
enterprise.workflows.WF-006.initiated           {feature_id, risk_classification}
enterprise.workflows.WF-006.gate.G-QUALITY      {result, safety_scores, latency_p95}
enterprise.workflows.WF-006.gate.G-LEGAL        {result, compliance_gaps, approvers}
enterprise.workflows.WF-006.canary_result       {success, quality_score, rollback_triggered}
enterprise.workflows.WF-006.post_launch_report  {day, quality_score, drift_detected}
enterprise.workflows.WF-006.completed           {feature_id, model_id, compliance_status}
```

## Rollback System

```
ROLLBACK WINDOW: 30 days post-launch
ROLLBACK TRIGGER: quality drift > 0.15; safety violation; EU AI Act finding; user harm signal

ROLLBACK STEPS (< 10 minutes target):
  R-1: disable AI feature via feature flag (fallback_plan activates automatically)
  R-2: restore baseline behavior; verify
  R-3: alert T3 + DPO (HIGH_RISK) immediately
  R-4: create incident ticket; trigger WF-012
  R-5: post-rollback analysis within 48hr
  R-6: model retrain or compliance fix before re-enabling (requires full WF-006 cycle)
```

## Enterprise System Integrations

```
GITHUB:      S-009 → PR with AI code; model card in /docs/models/
JIRA:        S-002 → create AI feature epic; compliance tracking sub-tasks
MODEL_REGISTRY: S-013 → register model card with version in model registry
MONITORING:  S-017 → deploy inference monitoring dashboards
COMPLIANCE:  S-008 → EU AI Act compliance record filed in compliance system
```

## Wiki Updates

```
wiki/engineering/ai-specs/{feature_id}.md      ← AI specification
wiki/compliance/eu-ai-act/{feature_id}.md      ← EU AI Act assessment record
wiki/engineering/model-cards/{model_id}.md     ← model card
wiki/architecture/decisions/ADR-{N}.md         ← ADR updated with model selection
```

## Memory Updates

```
memory/compliance/high-risk-ai-registry.yaml   ← register HIGH_RISK AI feature
memory/deployment-intelligence/version-registry.yaml ← model version record
memory/data-fabric/lineage-graph.yaml         ← training data lineage registered
```
