---
layer: evaluations
version: 1.0.0
created: 2026-05-09
status: active
owner: analytics-agent
---

# Evaluations Framework

The evaluation layer ensures AI feature quality is measured objectively, not asserted subjectively. Before any AI feature ships, it must have an evaluation suite that can detect quality degradation automatically.

## The Core Problem

AI systems degrade in ways that are invisible to code review and unit tests. A prompt change, model update, or distribution shift can silently degrade quality. Without evaluations, the organization is flying blind.

## Evaluation Principles

1. **Eval-first:** Define evaluations before writing AI feature code. The eval framework is the specification.
2. **Golden tests:** Maintain a set of human-labeled examples that are the ground truth for each feature.
3. **LLM-as-judge with calibration:** Use an LLM to scale evaluation, but calibrate it against human judgments.
4. **Regression thresholds:** Define the score below which a release is blocked.
5. **Production sampling:** After release, continue sampling to detect drift.

This is enforced by `workflows/ai-feature-workflow.md` at Steps 3 (eval framework) and 12 (pre-release eval run).

## Directory Structure

```
evaluations/
├── README.md              ← This file
├── criteria.md            ← Universal evaluation criteria and scoring rubrics
├── golden-tests.md        ← Golden test set format and management protocol
└── <feature-slug>/        ← Per-feature evaluation suites (created when feature starts)
    ├── eval-plan.md       ← Feature-specific evaluation plan
    ├── golden-set.json    ← Ground truth examples
    └── results/           ← Historical eval run results
```

## Integration with Workflows

| Workflow | Eval Touchpoint |
|---------|----------------|
| ai-feature-workflow.md | Step 3: define eval framework; Step 12: run eval before release |
| release-workflow.md | Pre-release checklist: eval score above threshold |
| wiki-maintenance.md | Archive eval results when feature is retired |

## Integration with Observability

Eval scores feed directly into:
- `observability/metrics.md` (A1, A2, A3)
- `observability/alerts.md` (ALERT-001: quality degradation)
- `observability/dashboards.md` (DASH-03: AI quality dashboard)

## Governance

The eval framework is a quality gate input, not an afterthought. An AI feature without an eval plan cannot pass G5 (QA gate).
