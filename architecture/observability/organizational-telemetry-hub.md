# Organizational Telemetry Hub

## Role
Aggregates organizational health signals — agent utilization, escalation rates, decision velocity, knowledge health, collaboration quality, and org stress indicators — into a unified stream for human leaders and the digital twin system.

## Organizational Signal Catalog

```
SIGNAL                          SOURCE                                  TARGET
────────────────────────────────────────────────────────────────────────────────────────
agent_utilization_avg           enterprise-telemetry/org-health-tele    0.60-0.80
escalation_rate_per_workflow    escalation-monitoring                   < 0.10
decision_velocity_hrs           orchestration-observability             < 4hr avg
wiki_freshness_score            wiki-maintenance workflow               >= 0.80
knowledge_gap_count             knowledge-governance/accuracy-monitor   0 CRITICAL
cross_org_handoff_quality       coordination-monitor                    >= 0.80
agent_performance_avg           agent-performance/tracker               >= 0.75
org_stress_level                workflow-monitoring/org-stress-detector NORMAL
onboarding_coverage_pct         agent-capabilities/assessment           >= 0.90
capability_gap_alerts           agent-capabilities/governance           0 CRITICAL
```

## Organizational Health Score

```
org_health = (
  agent_utilization_score   × 0.20
  + escalation_rate_score   × 0.20
  + decision_velocity_score × 0.15
  + knowledge_health_score  × 0.15
  + collaboration_score     × 0.15
  + performance_score       × 0.15
)

STRESS OVERRIDE: IF org_stress_detector reports SUSTAINED_HIGH:
  org_health = min(org_health, 0.60)
```

## Organizational Telemetry Panels

### Agent Load Distribution
Shows utilization spread across orgs — identifies overloaded orgs and idle capacity

### Escalation Trend
Tracks escalation rate trend; sustained increase signals capacity or capability gap

### Knowledge Velocity
Tracks wiki update rate vs. decision rate — declining ratio signals knowledge debt

### Cross-Org Collaboration Health
Handoff success rates between org pairs — identifies friction points

## Organizational Alerts

```
agent_utilization_avg > 0.90 sustained 4hr:  ORG_SATURATION → T4 staffing review
escalation_rate > 0.20 for 24hr:             ORG_STRESS → T3 investigation
decision_velocity > 8hr avg:                 DECISION_PARALYSIS → governance review
wiki_freshness_score < 0.60:                 KNOWLEDGE_DECAY → wiki maintenance trigger
capability_gap CRITICAL:                     T3 agent development escalation
```

## Organizational Telemetry Stream
Published to event bus topic: `enterprise.org.telemetry`

Subscribed by:
- digital-twins/org-twin.md (live org mirror)
- predictive-intelligence/org-forecaster.md (trajectory prediction)
- workflow-monitoring/organizational-stress-detector.md (stress detection)
- governance-evolution/adaptive-governance-controller.md (governance adaptation signal)

## Weekly Org Health Report
Generated every Monday 08:00 UTC:
- Per-org utilization and health breakdown
- Top 3 escalation drivers
- Knowledge gaps detected
- Capability development recommendations

## Persistence
`memory/enterprise-telemetry/org-health-metrics.yaml`
