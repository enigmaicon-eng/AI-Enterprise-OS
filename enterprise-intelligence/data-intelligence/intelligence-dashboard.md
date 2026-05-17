# Intelligence Dashboard

## Role
Unified visibility hub for all data intelligence outputs — anomalies, patterns, predictions, and synthesized insights. Single pane of glass for data health, emerging risks, and intelligence trends across the entire OS data fabric.

## Dashboard Layout

```
╔══════════════════════════════════════════════════════════════════════╗
║  ENTERPRISE DATA INTELLIGENCE DASHBOARD                               ║
║  Updated: {timestamp}   Period: {window}   Fabric health: {score}/1.0 ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 1: DATA FABRIC HEALTH                                          ║
║  Total entities: {N}    GOLD: {N}%    SILVER: {N}%    BRONZE+: {N}%  ║
║  Pipelines active: {N}  On SLA: {N}%  Data contracts OK: {N}%        ║
║  Lineage coverage: {N}% Schema drift alerts: {N}  Stale entities: {N} ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 2: ACTIVE ANOMALIES                                            ║
║  CRITICAL: {N}  HIGH: {N}  WARNING: {N}  INFO: {N}                   ║
║  Top anomaly: {entity_id} — {description} [{severity}]               ║
║  Oldest open: {anomaly_id} ({age}hr) — {type}                        ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 3: ACTIVE PREDICTIONS                                          ║
║  High-confidence alerts: {N}                                          ║
║  ⚠ {model}: {prediction} (conf: {N}%)  → Action: {action}           ║
║  ⚠ {model}: {prediction} (conf: {N}%)  → Action: {action}           ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 4: PATTERN INTELLIGENCE                                        ║
║  Active patterns: {N}  New this week: {N}  CRITICAL severity: {N}    ║
║  Top actionable: {pattern_name} — {recommended_action}               ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 5: SYNTHESIS OUTPUTS                                           ║
║  Latest executive summary: {date}  Quality: {score}                  ║
║  Pending reviews: {N}  Delivered this week: {N}                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 6: PIPELINE OPERATIONS                                         ║
║  Running: {N}   Failed last 24hr: {N}   Backlog: {N}                  ║
║  Stream lag p95: {N}ms   Batch on-time rate: {N}%                    ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 7: COMPLIANCE + GOVERNANCE                                     ║
║  Policy violations 30d: {N}   Erasure requests open: {N}             ║
║  GDPR Art.30 last updated: {date}  Lineage gaps HIGH_RISK: {N}       ║
╚══════════════════════════════════════════════════════════════════════╝
```

## Fabric Health Score

```
fabric_health = quality_score×0.35 + pipeline_health×0.30 + lineage_coverage×0.20 + compliance_score×0.15

quality_score:     weighted avg quality tier across all entities
pipeline_health:   (pipelines_on_sla / total_active_pipelines) × (1 - error_rate)
lineage_coverage:  entities_with_complete_lineage / total_entities
compliance_score:  (compliant_entities / total_entities) × (1 - open_critical_findings)

THRESHOLDS:
  HEALTHY:   >= 0.80   → green; no action required
  DEGRADED:  0.65–0.79 → yellow; monitor and address issues
  IMPAIRED:  0.50–0.64 → orange; T3 review required; pipeline intake throttled
  CRITICAL:  < 0.50    → red; T4 alert; new REGULATED pipelines blocked
```

## Alerts and Notifications

```
ALERT ROUTING FROM DASHBOARD:
  CRITICAL anomaly:      T3 + event bus enterprise.data.alert.critical
  CRITICAL fabric health: T4 + event bus enterprise.data.health.critical
  HIGH prediction:        T2 owner + steward; event bus enterprise.data.prediction.high
  Compliance violation:   DPO + T3; event bus enterprise.compliance.violation

SUPPRESSION:
  Known maintenance: anomaly alerts suppressed for declared entities
  Acknowledged anomalies: dashboard shows ACK status; no re-alert for 4hr
```

## Dashboard Refresh Rates

```
PANEL              REFRESH
────────────────────────────────
Data Fabric Health    5 min
Active Anomalies      1 min
Active Predictions    5 min
Pattern Intelligence  1 hr
Synthesis Outputs     15 min
Pipeline Operations   2 min
Compliance            1 hr
```

## Drill-Downs

```
1. ENTITY PROFILE:       quality history + lineage graph + consumer map + access log
2. PIPELINE DETAIL:      step-level execution trace + transformation log + SLA history
3. ANOMALY INVESTIGATION: timeline + correlated signals + similar past anomalies + AI diagnosis
4. PREDICTION AUDIT:     feature values at prediction time + calibration history + outcome
5. COMPLIANCE REPORT:    full GDPR Art.30 + EU AI Act documentation + open findings
```

## Persistence
`memory/data-intelligence/dashboard-state.yaml`
`memory/data-intelligence/alert-log.jsonl`
`memory/data-intelligence/fabric-health-history.jsonl`
