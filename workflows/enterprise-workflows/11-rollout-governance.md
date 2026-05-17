# WF-011: Rollout Governance

**Version:** 1.0.0 | **Owner:** Delivery Org | **Tier:** T3 | **Class:** CRITICAL | **SLA:** Real-time

## Purpose
Execute production deployments safely using phased rollout, automated health monitoring, Bayesian canary analysis, and sub-10-second automatic rollback — ensuring every production change is observable, controllable, and reversible.

## Inputs

```
REQUIRED:
  release_record_id:  artifact_id — approved WF-010 output
  rollout_strategy:   STANDARD_PHASED | SLOW_BURN | FAST_TRACK | BLUE_GREEN | TIER_BASED
  components:         [component_id] — what to deploy
  health_thresholds:  {error_rate_max, latency_p95_max, rollback_error_pct}

OPTIONAL:
  canary_pct:         number — initial canary traffic % (default: 5%)
  phase_dwell_min:    number — minutes per phase (default: 15/30/30/60)
  notify_teams:       [team_id] — teams to notify
```

## Outputs / Artifacts

```
PRIMARY:
  DEPLOYMENT_RECORD:  SHA-256 hash-chained entry in deployment-audit.jsonl
  ROLLOUT_TIMELINE:   phase-by-phase health metrics during rollout
  HEALTH_CERTIFICATE: post-rollout 24hr health verification

SECONDARY:
  ROLLBACK_RECORD:    if rollback occurred — reason, trigger, restoration time
```

## Lifecycle States

```
INITIATED → VALIDATING → PRE_DEPLOY_SNAPSHOT → CANARY_DEPLOY
  → CANARY_MONITORING → [pass] PHASE_1_DEPLOY (5→25%)
  → PHASE_1_MONITORING → [pass] PHASE_2_DEPLOY (25→50%)
  → PHASE_2_MONITORING → [pass] PHASE_3_DEPLOY (50→100%)
  → SOAK_PERIOD (24hr) → HEALTH_CERTIFIED
  → COMPLETED
  → ROLLBACK_TRIGGERED → ROLLBACK_VERIFYING → ROLLBACK_COMPLETE
  → FAILED
```

## Execution Graph

```
S-001  AUTH_CHECK              [GATE: G-AUTH T3+]              Root
S-002  RELEASE_VALIDATION      [GATE: COMPOUND]                depends_on: S-001
         Verify: release_record.status = APPROVED; not expired (< 24hr old)
         Verify: production session available; no active incidents in affected scope
         Verify: maintenance window if required
S-003  PRE_DEPLOY_SNAPSHOT     [SYSTEM]                        depends_on: S-002
         Capture: current production state; traffic baseline; error baseline
         Store: rollback checkpoint (immutable)
         Calculate: EWMA baselines for all health_threshold metrics
S-004  CANARY_DEPLOY           [SYSTEM]                        depends_on: S-003
         Deploy to canary_pct % of traffic (default 5%)
         Record: deployment start time; component versions deployed
S-005  CANARY_MONITORING       [AGENT: monitoring-agent]       depends_on: S-004
         Duration: phase_dwell_min (default 15min)
         Monitor every 30s: error_rate, latency_p95, throughput
         SPIKE DETECTOR: error_rate > 3× baseline in 5min → IMMEDIATE rollback signal
         Bayesian canary score: composite of all health metrics
         PROMOTE if: improvement_probability >= 0.90 (after 15min min)
         ROLLBACK if: improvement_probability < 0.20 OR spike detected
         HUMAN REVIEW if: 0.20–0.89 (operator decides)
S-006  PHASE_1_DEPLOY          [SYSTEM]                        depends_on: S-005 PASS
         Increase traffic to 25%  |  Dwell: 30min
S-007  PHASE_1_MONITORING      [AGENT: monitoring-agent]       depends_on: S-006
         Same monitoring protocol as S-005  |  Threshold: same health_thresholds
S-008  PHASE_2_DEPLOY          [SYSTEM]                        depends_on: S-007 PASS
         Increase traffic to 50%  |  Dwell: 30min
S-009  PHASE_2_MONITORING      [AGENT: monitoring-agent]       depends_on: S-008
S-010  PHASE_3_DEPLOY          [SYSTEM]                        depends_on: S-009 PASS
         Full rollout: 100%  |  Dwell: 60min
S-011  FULL_TRAFFIC_MONITORING [AGENT: monitoring-agent]       depends_on: S-010
         1hr post-100% monitoring; verify stable at full load
S-012  SOAK_PERIOD             [AGENT: monitoring-agent]       depends_on: S-011 PASS
         24hr health monitoring at full traffic
         Alert if: any threshold breach during soak
S-013  HEALTH_CERTIFICATE      [SYSTEM]                        depends_on: S-012
         Generate: post-rollout health report; confirm all metrics within targets
S-014  DEPLOYMENT_RECORD_FINAL [SYSTEM]                        depends_on: S-013
         Write final immutable deployment record; SHA-256 hash-chain
S-015  ROLLBACK_CHECKPOINT_EXPIRE [SYSTEM]                     depends_on: S-014
         After 30 days: rollback checkpoint archived (30-day rollback window)
S-016  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-014
S-017  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-016
```

## ROLLBACK PATH (all phases)
```
ROLLBACK_TRIGGER (any phase) → INSTANT_ROLLBACK
  R-1: atomic traffic shift back to pre-deploy snapshot (< 10s)
  R-2: verify: all health metrics returning to baseline
  R-3: emit WF-011.rollback event; page on-call; alert T3
  R-4: create incident ticket (auto-trigger WF-012)
  R-5: hold deployment for investigation; require root cause before retry
  ROLLBACK SLA: < 10 seconds for traffic shift; < 30s for full restoration
```

## Approval Gates

```
G-AUTH:    requestor >= T3; release record approved and < 24hr old
COMPOUND:  no active incidents in scope; rollback checkpoint created; baselines established
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
Spike detected (3× baseline in 5min)     Auto-rollback; T3 page      Immediate (< 5s)
Canary score < 0.20                      Auto-rollback; T3 page      Immediate
Canary score 0.20–0.89                   Human review required; T3   15min
Phase monitoring breach                  Auto-rollback; page on-call Immediate
Soak period breach (any metric)          T3 alert; evaluate rollback 30min
Multiple rollbacks same component (3)    T4 investigation required   Immediate
```

## Governance Checkpoints

```
C-001: human in loop for ambiguous canary (0.20–0.89) scores
C-004: every deployment permanently recorded (hash-chained)
ROLLBACK: automatic rollback always available; never disabled
ZERO_DOWNTIME: phased rollout required; never direct 0→100 for CRITICAL components
AUDIT: PERMANENT retention for constitutional scope changes
DORA: deployment_frequency, lead_time, change_failure_rate, MTTR computed from audit
```

## Observability

```
REAL-TIME METRICS (30s refresh):
  canary_error_rate:          vs. baseline; spike detected at 3×
  canary_latency_p95_ms:      vs. sla_target
  traffic_split:              actual % per phase vs. target
  rollback_checkpoint_age:    track (must be < 10s old for instant restore)

ROLLOUT METRICS:
  phase_success_rate:         target >= 0.95
  rollback_rate:              target < 0.05
  avg_full_rollout_time_min:  target <= 135 min (15+30+30+60 + canary)
  soak_breach_rate:           target < 0.02
```

## Telemetry Events

```
enterprise.workflows.WF-011.initiated       {release_id, strategy, components}
enterprise.workflows.WF-011.canary_started  {canary_pct, baseline_error_rate}
enterprise.workflows.WF-011.canary_result   {confidence, action: PROMOTE|ROLLBACK|REVIEW}
enterprise.workflows.WF-011.phase_complete  {phase, traffic_pct, health_score}
enterprise.workflows.WF-011.rollback        {trigger, phase, restore_time_ms, cause}
enterprise.workflows.WF-011.soak_complete   {health_score, all_metrics_ok}
enterprise.workflows.WF-011.completed       {release_id, total_time_min, rollback_occurred}
```

## Rollback System

```
ROLLBACK WINDOW: 30 days post-completion
ROLLBACK TRIGGER: post-soak issues; security finding post-deploy; business decision

ROLLBACK PROCEDURE:
  < 10s: traffic shift via deployment-intelligence/rollout-controller.md
  < 30s: full state restore from rollback checkpoint
  30 days post: manual rollback requires T4 authorization + impact assessment
  PERMANENT ARTIFACT: deployment record kept forever; rollback_record created
```

## Enterprise System Integrations

```
CI/CD:        S-004 → execute deployment via CI/CD pipeline
MONITORING:   S-005+ → real-time metrics feed to canary-intelligence
PAGERDUTY:    S-017 → close maintenance alert; if rollback → page on-call
STATUS_PAGE:  S-011 → update status page (deployed; all systems OK)
SLACK:        S-017 → notify #deployments; if rollback → notify #incidents
```

## Wiki Updates

```
wiki/releases/{release_id}.md             ← append rollout timeline + health cert
wiki/runbooks/rollback-history.md         ← append rollback record if rollback occurred
```

## Memory Updates

```
memory/deployment-intelligence/deployment-history.jsonl ← append deployment record
memory/deployment-intelligence/canary-state.yaml        ← update canary model
memory/deployment-intelligence/version-registry.yaml    ← confirm version live
```
