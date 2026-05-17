# Evaluation Dashboard

## Role
Live visibility console for the OS evaluation system. Surfaces quality gate performance, agent evaluation trends, governance decision quality, and evaluation system health in a single unified view for operators and leadership.

## Dashboard Layout

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                   ENTERPRISE AI OS — EVALUATION DASHBOARD                        ║
║  Updated: {ISO8601}  |  Coverage: {N}%  |  System Status: {OK/WARN/CRITICAL}    ║
╠══════════════════════╦═══════════════════════════╦═══════════════════════════════╣
║  OUTPUT QUALITY      ║  GATE PERFORMANCE         ║  EVALUATION COVERAGE          ║
║  Avg Score:  {N}     ║  Pass Rate:    {N}%        ║  Standard:   {N}%             ║
║  Trend 7d:   ▲{N}%  ║  Fail Rate:    {N}%        ║  Deep:       {N}%             ║
║  Below 0.70: {N}     ║  Retry Rate:   {N}%        ║  Human:      {N}%             ║
║  Blocked:    {N}     ║  Human Review: {N}%        ║  Missed:     {N}              ║
╠══════════════════════╩═══════════════════════════╩═══════════════════════════════╣
║  AGENT PERFORMANCE (Top / Bottom 3)                                               ║
║  BEST:  {agent_id} ({score})  |  {agent_id} ({score})  |  {agent_id} ({score})  ║
║  WORST: {agent_id} ({score})  |  {agent_id} ({score})  |  {agent_id} ({score})  ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║  GOVERNANCE DECISION QUALITY                                                      ║
║  Policy Verdict Quality:  {N}   Override Rate:  {N}%                            ║
║  Approval Quality:        {N}   Regret Rate:    {N}%                            ║
║  Finding Calibration:     {N}   Consistency:    {N}%                            ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║  TRUST SIGNALS                                                                    ║
║  Constitutional Alignment: {N}%   Hallucination Events (7d): {N}               ║
║  Avg Confidence Score:     {N}    Reliability Band UNRELIABLE agents: {N}       ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║  RECENT EVALUATION EVENTS                                                         ║
║  [PASS] {output_id}: {workflow_type} | Score: {N} | {timestamp}                 ║
║  [FAIL] {output_id}: {workflow_type} | Score: {N} | {dimension} deficit         ║
║  [HUMAN_REVIEW] {output_id}: {workflow_type} | Confidence: {N} | Pending        ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║  QUALITY TREND (30-day)                                                           ║
║  ▲ Improving:  {N} workflow types   ▼ Declining:  {N}   = Stable: {N}           ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

## Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| Gate pass rate < 0.70 | HIGH | Alert T3 + investigate |
| Avg output quality < 0.65 (7d) | HIGH | Alert T3 + workflow review |
| Constitutional violations > 0 | CRITICAL | Immediate T5 escalation |
| Hallucination events > 5/day | HIGH | Alert T3 + containment review |
| UNRELIABLE agents > 5 | WARN | Coaching priority escalation |
| Evaluation coverage < 0.90 | WARN | Check evaluation pipeline health |
| Governance regret rate > 0.15 | HIGH | Governance process review |

## Drill-Down Views
1. **Agent quality heatmap** — quality by agent × task type matrix
2. **Workflow quality trend** — 30-day quality trend per workflow type
3. **Failure analysis** — top failing dimensions + root cause clustering
4. **Governance quality history** — per-decision-type quality over time
5. **Trust signal timeline** — confidence, hallucination, reliability trends

## Refresh Cadence
- Live metrics: 60s
- Trend charts: 5min
- Agent rankings: hourly
- Monthly quality report: auto-generated 1st of month

## Persistence
`memory/evaluation/dashboard-state.yaml`
