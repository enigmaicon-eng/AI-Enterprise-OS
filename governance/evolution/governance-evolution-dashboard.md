# Governance Evolution Dashboard

## Role
Live console for monitoring the self-healing governance system. Tracks governance health trends, active policy evolution work, adaptive intensity state, bottleneck status, and the cumulative impact of governance improvements.

## Dashboard Layout

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║           ENTERPRISE AI OS — GOVERNANCE EVOLUTION DASHBOARD                      ║
║  Updated: {ISO8601}  |  Governance Intensity: {LEVEL}  |  Health: {score}       ║
╠══════════════════════╦═══════════════════════════╦═══════════════════════════════╣
║  GOVERNANCE HEALTH   ║  CONSTITUTIONAL ALIGNMENT  ║  POLICY PIPELINE              ║
║  Score: {N}          ║  Clearance Rate: {N}%      ║  In Draft:      {N}           ║
║  Trend 7d: ▲{N}%    ║  Weakest: {principle}      ║  In Testing:    {N}           ║
║  Bottlenecks: {N}    ║  Violations 30d: {N}       ║  Pending Appvl: {N}           ║
║  SLA Breach: {N}%    ║  Drift: {NONE/DETECTED}    ║  Active:        {N}           ║
╠══════════════════════╩═══════════════════════════╩═══════════════════════════════╣
║  ADAPTIVE GOVERNANCE STATE                                                        ║
║  Current Level: {LEVEL}  |  Since: {datetime}  |  Trigger: {reason}             ║
║  Next Review: {datetime}  |  De-escalation path: {conditions_remaining}          ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║  ACTIVE BOTTLENECKS                                                               ║
║  [QUEUE] Tier T3 approval queue: {N} items | SLA at {N}% capacity | Est {Nhr}   ║
║  [NONE] No additional active bottlenecks                                          ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║  GOVERNANCE OPTIMIZATION PROPOSALS                                                ║
║  [GOPT-001] {title} | Pattern: {type} | Risk: {LOW/MED/HIGH} | {status}         ║
║  [GOPT-002] {title} | Pattern: {type} | Risk: {LOW/MED/HIGH} | {status}         ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║  GOVERNANCE QUALITY TRENDS (30d)                                                  ║
║  Decision Quality:  {N} ▲{delta}   Override Rate: {N}%  Regret Rate: {N}%      ║
║  SLA Compliance:   {N}%            Consistency:   {N}%  Coverage:    {N}%       ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║  GOVERNANCE EVOLUTION WINS (30d)                                                  ║
║  Policies evolved:  {N}  |  Bottlenecks resolved: {N}  |  Efficiency +{N}%     ║
║  Approval SLA improvement: {N}min  |  Override rate change: {N}%               ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

## Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| Constitutional clearance < 0.98 | CRITICAL | T5 immediate + pause new work |
| Governance intensity at EMERGENCY | CRITICAL | Board notification |
| SLA breach rate > 25% | HIGH | Bottleneck resolver + T4 alert |
| Policy evolution blocked > 7d | HIGH | T4 escalation |
| Override rate > 0.25 (30d) | HIGH | Governance process review |
| Bottleneck active > 8hr | HIGH | T4 capacity decision |
| Constitutional drift detected | HIGH | T5 notification + immediate assessment |
| No policy evolved in 60d | WARN | Trigger annual review cycle |

## Governance Evolution Reports

### Weekly (auto every Monday 09:00 UTC)
- governance health trend
- bottleneck incidents and resolution status
- policy changes activated in last 7d
- adaptive intensity events

### Monthly (1st of month, T4/T5 distribution)
- full governance quality scorecard
- policy evolution pipeline status
- constitutional alignment trend
- top 3 optimization proposals (prioritized, with ROI)
- governance efficiency improvement vs. prior month

### Quarterly (T5 + board-level)
- 90-day governance health trajectory
- regulatory compliance posture
- constitutional alignment assessment
- governance maturity progression
- strategic governance investments recommended

## Drill-Down Views
1. **Policy audit trail** — complete history of every policy change
2. **Constitutional principle detail** — per-principle compliance trend
3. **Bottleneck history** — all bottleneck events with root causes
4. **Intensity transition log** — every governance level change with rationale
5. **Approval queue drill-down** — live queue with aging and SLA status

## Persistence
`memory/governance-evolution/dashboard-state.yaml`
