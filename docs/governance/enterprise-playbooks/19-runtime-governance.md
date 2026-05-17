# PB-019: Runtime Governance

**Version:** 1.0.0 | **Owner:** Engineering Org (SRE + Platform) | **Cadence:** Weekly + Monthly | **Tier:** T3 | **Class:** CRITICAL

## Purpose
Govern the health, reliability, security, and compliance of all production systems in continuous operation — ensuring SLOs are tracked, SLA obligations are met, production changes are controlled, capacity is managed proactively, and the engineering org maintains a clear picture of the state of production at all times.

## Runtime Governance vs. Incident Management

```
INCIDENT MANAGEMENT (WF-012):
  Trigger: something is broken RIGHT NOW
  Goal: restore service; minimize customer impact
  Reactive; time-bounded

RUNTIME GOVERNANCE (this playbook):
  Trigger: continuous + scheduled review
  Goal: prevent future incidents; maintain system health; govern change
  Proactive; continuous + periodic

Runtime governance identifies and resolves issues BEFORE they become incidents.
```

---

## Weekly Production Health Review

**Cadence:** Every Monday, 10:00–10:45
**Participants:** SRE Lead + Engineering Leads + On-call (outgoing + incoming) + Release Manager
**Output:** Updated production health dashboard + action assignments

### Pre-Meeting Automated Report (09:30 Monday)
```
PREPARED BY: monitoring-agent + analytics-agent

REPORT SECTIONS:
  1. SLO Status: all services (7-day rolling)
  2. Incident Summary: all incidents in past week + MTTR
  3. Error Budget: remaining error budget per service (7-day)
  4. Deployment Activity: all deployments in past week + outcomes
  5. Capacity: resource utilization trends (CPU, memory, storage, DB)
  6. Security: vulnerability scan results + patch compliance
  7. On-call load: alerts fired, pages, escalations
  8. Upcoming deployments: what ships this week
```

### Weekly Agenda

```
TIME    TOPIC                                               OWNER         DECISION?
──────────────────────────────────────────────────────────────────────────────────────────────
0:00    SLO review: any services in error budget burn?      SRE Lead      Action if burning fast
0:10    Incident review: what happened last week?           Outgoing OC   Systemic patterns?
0:20    Deployment health: any regressions from deploys?    RM + Eng      Remediation assigned
0:25    Capacity: any services approaching limits?          SRE Lead      Scale action if needed
0:30    Security: patches + vulnerabilities outstanding?    CISO delegate  Prioritize if critical
0:35    On-call load: was last week sustainable?            Outgoing OC   Reduce alert noise?
0:40    This week: what ships? Any high-risk changes?       RM            Deploy approval needed?
0:45    Close; actions logged
```

---

## SLO / SLA Framework

### SLO Definitions
```
STANDARD SLO TIERS (customizable per service):

TIER      AVAILABILITY SLO  LATENCY P99    ERROR RATE    APPLIES TO
──────────────────────────────────────────────────────────────────────────────────────────────
GOLD      99.99% (52m/yr)   100ms          < 0.01%       Revenue-critical, payments
SILVER    99.9% (8.7hr/yr)  200ms          < 0.1%        Core product features
BRONZE    99.5% (43.8hr/yr) 500ms          < 0.5%        Internal tools, batch jobs
BEST_EFF  99.0% (87.6hr/yr) 1000ms         < 1%          Development, staging

SLO REVIEW: Confirmed or adjusted at quarterly review; deviation requires SRE + CTO approval
SLO BREACH: Any service below SLO in a 7-day window → weekly review flag
            Any service below SLO for 30 days → incident + engineering escalation
```

### Error Budget Policy
```
ERROR BUDGET = 1 - SLO (e.g., 99.9% SLO → 0.1% error budget = 43.8 min/month)

ERROR BUDGET BURN TIERS:
  TIER    BURN RATE         ACTION
  GREEN   < 5% of budget    No action
  YELLOW  5–25% of budget   SRE monitoring; reduce risk in deployments
  ORANGE  25–50% of budget  Deployment freeze; SRE review; root cause required
  RED     > 50% of budget   Full deployment freeze; engineering focus on reliability
                             until budget recovery; release council notification

BURN RATE ALERT:
  2% burn rate in 1hr = 100% budget consumed in 2.5 days → immediate alert
  5% burn rate in 1hr = 100% budget consumed in 20hr → CRITICAL alert
```

---

## Production Change Control

### Change Categories

```
CATEGORY        RISK LEVEL   APPROVAL                  TESTING REQUIRED
──────────────────────────────────────────────────────────────────────────────────────────────
STANDARD        LOW          Pre-approved template       Unit + integration
NORMAL          MEDIUM       Change record + Eng Lead    Full test suite + staging
MAJOR           HIGH         Release Council (PB-004)    Full ORR (PB-010)
EMERGENCY       CRITICAL     On-call + Engineering Dir   Minimum viable (post-review within 24hr)
LATENT          LOW          Engineering Lead async      None (config/metadata only; no code)
```

### Change Freeze Policies

```
DEPLOYMENT WINDOWS: Tuesday–Thursday, 10:00–16:00 local time
BLACKOUT PERIODS:
  - Last 2 weeks of fiscal quarter (financial systems: no changes)
  - 72 hours before + after major releases
  - Peak traffic periods (confirmed > 3× normal load)
  - On-call rotation handoff day (avoid Friday releases)
  - Any active SEV1 or SEV2 incident (NO new deployments)

EXCEPTION: Emergency hotfix during blackout
  Requires: T4 Engineering Dir approval + Release Manager + on-call Eng Lead
  Process: PB-004 Emergency Hotfix Council (30 min)
  Post-review: change retrospective within 24hr
```

### Production Change Record
```
CHANGE RECORD FIELDS:
  change_id:        CHG-{YYYY-MM-DD}-{NNN}
  category:         STANDARD | NORMAL | MAJOR | EMERGENCY | LATENT
  description:      what is being changed
  risk_assessment:  LOW | MEDIUM | HIGH | CRITICAL
  rollback_plan:    specific steps; estimated time
  approval:         approver + timestamp
  deployment:       actual deploy time + method (canary / blue-green / direct)
  outcome:          SUCCESS | PARTIAL | ROLLED_BACK + notes
  post_change_check: 2hr health observation result
```

---

## Capacity Management

### Capacity Monitoring
```
MONITORED RESOURCES (per service):
  Compute: CPU utilization (ALERT >= 70% sustained; CRITICAL >= 85%)
  Memory: memory utilization (ALERT >= 75%; CRITICAL >= 90%)
  Storage: disk utilization (ALERT >= 70%; CRITICAL >= 85%)
  Database: connection pool (ALERT >= 70%; CRITICAL >= 85%)
             query time: p99 (ALERT >= 2× baseline; CRITICAL >= 5×)
  Network: bandwidth utilization (ALERT >= 60% of provisioned)
  Queues: queue depth (ALERT >= 1000; CRITICAL >= 5000 or growing)

CAPACITY REVIEW CADENCE: Monthly; triggered earlier by ALERT thresholds
```

### Scaling Policy
```
AUTO-SCALING STANDARDS:
  Scale-out trigger: CPU >= 60% for 5 minutes → add instance
  Scale-in trigger: CPU <= 20% for 30 minutes → remove instance
  Min instances: 2 (no single point of failure in production)
  Max instances: defined per service; requires SRE approval to increase
  Warm-up time: configured to prevent cold-start traffic errors

CAPACITY PLANNING (quarterly):
  90-day traffic forecast: based on product roadmap + historical growth
  Resource headroom requirement: maintain 30% headroom at expected peak
  Cost estimate: capacity plan includes cost projection (monthly + quarterly)
  Approval: capacity plans > $5K/month require VP Eng approval
```

---

## Security Posture Governance

### Weekly Security Checks
```
AUTOMATED (daily; reviewed weekly in health review):
  □ Dependency vulnerability scan: new CVEs in production dependencies
  □ Container image scan: base image vulnerabilities
  □ Infrastructure scan: cloud configuration drift (AWS Config / Azure Policy)
  □ Secrets exposure scan: no secrets in logs, code, or config
  □ Certificate expiry: alerts at 60 days, 30 days, 7 days before expiry

PATCH SLA:
  CRITICAL (CVSS >= 9.0): patch within 24 hours of confirmed applicability
  HIGH (CVSS 7.0–8.9): patch within 7 days
  MEDIUM (CVSS 4.0–6.9): patch within 30 days
  LOW (CVSS < 4.0): next planned maintenance window

PATCH EXCEPTION: If patch requires extended downtime or breaks compatibility
  Document risk acceptance: CISO + Engineering Dir sign-off
  Compensating control required: WAF rule, network isolation, or monitoring increase
  Re-evaluate monthly until patched
```

### Access Review
```
PRODUCTION ACCESS REVIEW:
  Cadence: Monthly (automated report) + Quarterly (manual review)
  Scope: all human access to production systems + data
  Standard: least privilege; access expired 30 days after last use if no renewal
  Quarterly review: SRE Lead + CISO; revoke any access without active justification
  Emergency access: break-glass accounts logged + reviewed within 24hr of use
```

---

## Monthly Runtime Governance Review

**Cadence:** Third Tuesday of each month, 60 minutes
**Participants:** SRE Lead + CISO + VP Engineering + Release Manager + On-call Lead
**Output:** Production health report + decisions + engineering actions

```
TIME    TOPIC                                               OWNER         DECISION?
──────────────────────────────────────────────────────────────────────────────────────────────
0:00    Monthly SLO scorecard: all services                SRE Lead      Breach → action plan
0:10    Incident trend analysis: patterns + systemic issues On-call Lead  Engineering investment
0:20    Error budget status: which services are at risk?   SRE Lead      Change freeze triggers
0:25    Capacity: current state + 90-day forecast           SRE Lead      Scale decisions
0:35    Security: monthly vulnerability + patch status      CISO          Risk acceptance/action
0:45    On-call sustainability: hours, pages, burnout risk  On-call Lead  Rotation adjustments
0:50    Deployment review: velocity, failure rate, MTTR     RM            Process improvements
0:55    Next month: planned high-risk changes               RM            Pre-approval decisions
```

---

## On-Call Governance

```
ON-CALL HEALTH STANDARDS:
  Max pages per week (business hours): 10 actionable pages
  Max pages per week (off-hours): 3 off-hours pages
  Off-hours = escalation quality threshold: if > 3 per week → alert noise review
  On-call rotation: minimum 2 engineers in rotation; no solo on-call
  Maximum on-call stint: 1 week; no back-to-back without at least 1 week off
  Handoff: 30-minute sync between outgoing + incoming on-call

ON-CALL OVERLOAD RESPONSE:
  > 3 off-hours pages/week for 2 consecutive weeks: SRE review of alert thresholds
  > 5 off-hours pages/week: engineering escalation; alert audit within 48hr
  On-call burnout signal (survey or manager flag): immediate rotation change; no delay
  "Pager fatigue" is a production quality issue, not an individual performance issue.

ON-CALL COMPENSATION:
  Defined in employment contracts; reviewed annually
  Additional compensation or comp time for excessive on-call: T3 People + Eng Dir decision
```

---

## Production Observability Standards

```
REQUIRED FOR ALL PRODUCTION SERVICES:
  □ Metrics: RED method (Rate, Errors, Duration) or USE method (Utilization, Saturation, Errors)
  □ Logs: structured JSON; correlation ID on every log line; no PII in logs
  □ Traces: distributed tracing (OpenTelemetry); all cross-service calls traced
  □ Dashboards: service-specific dashboard in monitoring platform
  □ Alerts: page-worthy alert defined; not too noisy, not too silent
  □ SLO dashboard: real-time SLO tracking with error budget visualization

OBSERVABILITY DEBT:
  Services with missing any of the above: flag in weekly health review
  Services with 2+ missing items: blocked from new feature deployment until resolved
  Services with all items missing: L3 escalation; emergency instrumentation sprint
```

---

## Governance Checkpoints

```
C-001: SLO targets set by engineering; customer SLAs require T4 approval (legal obligations)
C-004: All change records, SLO breaches, and capacity decisions permanently recorded
CHANGE_FREEZE: No deployments during blackout periods without T4 emergency exception
PATCH_SLA: CRITICAL patches within 24hr; no exception without CISO risk acceptance
ON_CALL: No engineer on solo on-call; rotation below 2 people = L3 escalation to staff
ERROR_BUDGET: Services in RED error budget: full deployment freeze until recovery
ACCESS_REVIEW: Quarterly access review is mandatory; CISO signs off
```

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Services meeting SLO (monthly)           >= 0.95
Error budget burn incidents (ORANGE/RED) < 2 per quarter per service
CRITICAL patch time                      <= 24 hours
Change success rate                      >= 0.95 (5% rolled back or failed)
On-call off-hours pages per week (avg)   <= 3
Monthly runtime review held              = 100%
Production access review completed       = 100% quarterly
SLO dashboard coverage (all services)   = 100%
```

## Workflow Integrations

```
WF-011  Rollout Governance  → runtime governance provides SLO + error budget context for canary
WF-012  Incident Management → incidents feed back into weekly health review analysis
WF-013  Postmortem          → postmortem action items tracked in runtime governance
PB-004  Release Council     → release council uses runtime health as input for Go/No-Go
PB-010  Operational Readiness → runtime standards define ORR requirements
PB-011  Release Readiness   → deployment window governed by this playbook's blackout rules
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
SLOs set aspirationally; never reviewed    Team unaware of production health; incidents surprise
Error budget ignored until empty           Reliability debt accumulates; major incident follows
"It's just a small change" outside window  Small change = significant incident at wrong time
On-call overload normalized                Engineer burnout; retention risk; incidents missed
CRITICAL CVE "tracked for later"           Breach waiting to happen; regulatory liability
Access never reviewed                      Stale access; ex-employee credentials active
No capacity headroom                       Load spike → immediate outage; no time to scale
Weekly review skipped "no incidents"       Health issues invisible until they become incidents
```
