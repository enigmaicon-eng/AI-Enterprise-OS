# AI Model Lifecycle Governance
**ID:** GOV-ML-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** AI-Native Org + Executive Org | **Updated:** 2026-05-16

---

## Purpose

Governs the lifecycle of foundation AI models used by the Enterprise AI OS. Ensures that model upgrades, replacements, and retirements are evaluated, validated, and deployed safely. Prevents undetected behavioral shifts when foundation models change.

**Scope:** All foundation model invocations by OS agents. Current default: `claude-sonnet-4-6`.

---

## Model Registry

```yaml
model_record:
  model_id: string                         # e.g., claude-sonnet-4-6
  provider: string                         # e.g., Anthropic
  status: ACTIVE | EVALUATION | STAGED | DEPRECATED | RETIRED
  
  capability_profile:
    context_window_tokens: number
    primary_strengths: [string]
    known_limitations: [string]
    
  deployment:
    default_for_tiers: [T1, T2, T3, T4, T5]
    total_workflows_using: number
    total_agents_using: number
    
  governance:
    adopted_at: ISO8601
    last_evaluated: ISO8601
    evaluation_score: 0.00–1.00
    constitutional_adherence_rate: 0.00–1.00  # must remain ≥ 0.99
    hallucination_rate_7d: 0.00–1.00
    
  upgrade_path:
    successor_model_id: string | null
    migration_tested: boolean
    migration_approval: agent_id | null
```

---

## Model Evaluation Protocol

### Trigger Conditions

Evaluation is triggered when:
- New model version released by provider
- Current model hallucination rate increases by > 0.05 (30-day trend)
- Constitutional adherence rate drops below 0.99
- Performance benchmark regression > 10% on any tier
- Provider announces deprecation timeline

### Evaluation Process (shadow mode, minimum 7 days)

```
Phase 1: Shadow Evaluation (Days 1–7)
  1. Route 5% of T1 workflow requests to candidate model
  2. Compare outputs between current and candidate on same inputs
  3. Score on 10 evaluation dimensions (evaluation/evaluation-framework.md)
  4. Run all 50 golden tests (evaluations/golden-tests.md)
  5. Measure constitutional adherence (12 principles)
  6. Measure hallucination rate on candidate

Phase 2: Assessment (Day 7–8)
  Required pass criteria for promotion:
  ✓ Constitutional adherence ≥ current model rate (never lower)
  ✓ Golden test pass rate ≥ 95%
  ✓ Hallucination rate ≤ current model rate + 0.01
  ✓ No new capability regression on T1–T3 capability assessments
  ✓ Context window ≥ current model context window
  
  If any criterion fails: evaluation fails; candidate cannot proceed
  
Phase 3: T4 Approval
  - Evaluation report submitted to T4
  - T4 reviews: capability changes, constitutional compliance, risk profile
  - T4 decision: PROCEED_TO_STAGED | EXTEND_EVALUATION | REJECT
```

---

## Staged Rollout Protocol

Once T4 approves, model is deployed via canary pattern:

```
Week 1: 5% of all requests (monitoring only)
Week 2: 25% (requires stable constitutional adherence from week 1)
Week 3: 50% (requires stable hallucination rate from week 2)
Week 4: 100% (requires T4 sign-off)

Rollback trigger (automatic):
  - Constitutional adherence drops below previous model rate
  - Hallucination rate increases > 0.03 vs. current model
  - Any ABSOLUTE constitutional violation (immediate rollback)
  - T4 override at any stage
```

---

## Consistency Requirement

**All 144 agents must run the same model version.** Mixed-version deployment is prohibited because:
- Trust inconsistency: agents calibrated on different models have different behavioral baselines
- Constitutional inconsistency: different models may have different constitutional adherence patterns
- Debugging complexity: behavioral differences between agents would be unattributable

Exception: Shadow evaluation phase (read-only comparison, no artifacts produced by candidate model).

---

## Model Retirement Protocol

When a model is deprecated by its provider:
1. Retirement timeline tracked in model registry
2. Evaluation of successor model initiated at T-90 days
3. Migration plan required by T-60 days (T4 approval)
4. Production cutover required by T-30 days
5. Old model retired from registry at T-0

Emergency retirement (provider announces immediate deprecation):
- T5 notification
- Emergency evaluation (48-hour accelerated protocol)
- T5 authorization for emergency migration

---

## Governance

**Model selection authority:** T4 (standard); T5 (new provider or significant capability change)
**Rollback authority:** T3 (automatic triggers); T4 (manual override)
**Audit:** All model lifecycle events to `memory/ai-model-lifecycle/model-events.jsonl` (append-only)
**Regulatory:** EU AI Act Art.9 — model changes to HIGH_RISK systems require DPO + CISO notification
