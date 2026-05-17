---
layer: observability
version: 1.0.0
created: 2026-05-09
status: active
---

# Observability

The Enterprise AI OS observability layer provides measurement, visibility, and alerting across all operational dimensions of the system — from delivery performance to AI quality to governance compliance.

## Why Observability Is a Governance Requirement

An AI-native operating system that cannot measure itself cannot govern itself. The governance principles require quality gates, but gates without instrumentation are theater. Observability is what makes governance real.

## Observability Layers

| Layer | What It Measures | Primary Consumer |
|-------|-----------------|-----------------|
| Delivery | DORA metrics, sprint velocity, feature throughput | delivery-agent, PM |
| Quality | Gate first-pass rate, cycles per gate, defect escape rate | supervisor-agent, qa-agent |
| AI | Model output quality, eval scores, degradation alerts | analytics-agent, ai-feature-workflow |
| Governance | Policy compliance, gate bypass rate, exception frequency | supervisor-agent, security-agent |
| Memory | Memory freshness, open question age, risk registry staleness | orchestrator |
| Resource | Context budget utilization, session frequency, artifact growth rate | orchestrator |

## Directory Structure

```
observability/
├── README.md                  ← This file
├── metrics.md                 ← Metric definitions and targets
├── dashboards.md              ← Dashboard specifications
├── alerts.md                  ← Alert conditions and escalation
└── instrumentation-guide.md   ← How to instrument new workflows and agents
```

## DORA Integration

DORA metrics are the primary delivery health signal. Targets are defined in `metrics.md`. The analytics-agent is responsible for computing and reporting DORA metrics at the close of every sprint.

## AI Quality Monitoring

AI feature quality degrades silently without continuous monitoring. The `ai-feature-workflow.md` requires a quality monitoring plan before any AI feature is released. This plan must reference specific metrics from `metrics.md` and specific alerts from `alerts.md`.

## Entry Points

- Metric definitions → `observability/metrics.md`
- Dashboard specs → `observability/dashboards.md`
- Alert conditions → `observability/alerts.md`
- Instrumentation → `observability/instrumentation-guide.md`
- Governance of metrics → `docs/governance/quality-gates.md`
