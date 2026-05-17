# PB-010: Operational Readiness

**Version:** 1.0.0 | **Owner:** Delivery + Engineering Org | **Cadence:** Per-feature / Pre-release | **Tier:** T3 | **Class:** CRITICAL

## Purpose
Certify that every feature or system change is production-ready before it ships — ensuring monitoring, alerting, runbooks, on-call coverage, rollback procedures, performance baselines, and disaster recovery are in place. A feature is not "done" until it is operationally ready.

## Operational Readiness Definition

```
A feature or system change is operationally ready when:
  ✓ The engineering team can detect when it breaks (observability)
  ✓ The on-call team knows how to respond when it breaks (runbook)
  ✓ The system can be rolled back in < 10 minutes (rollback tested)
  ✓ Performance is within acceptable bounds at production scale (load tested)
  ✓ Capacity is sufficient to run this feature at peak load (capacity plan)
  ✓ Data is protected and classified appropriately (data governance)
  ✓ Compliance obligations are met before traffic is served (compliance gate)
```

---

## Operational Readiness Review (ORR) Checklist

**Completed by:** Engineering Lead + PM
**Reviewed by:** Release Manager + Domain Architect
**Timing:** T-5 business days before release council (PB-004)

### 1. Observability

```
MONITORING:
  □ Service-level indicators (SLIs) defined:
      - Availability SLI: % requests succeeding (target: 99.9% or agreed)
      - Latency SLI: p99 response time (target: <= defined threshold ms)
      - Error rate SLI: 5xx / total requests (target: <= 0.1%)
  □ SLOs configured in monitoring system (not just SLIs)
  □ Dashboards created: feature-specific dashboard in monitoring platform
  □ Existing dashboards updated: affected systems' dashboards updated
  □ Business metrics: key business metric baseline captured (Jira ticket linked)

ALERTING:
  □ Page-worthy alert defined: what warrants waking someone up?
  □ Alert configured with correct thresholds (not too noisy, not too silent)
  □ Alert routed to correct on-call team (PagerDuty / alerting system)
  □ Alert tested: synthetic failure test confirms alert fires
  □ Alert burn rate configured: 2% burn rate = warning; 5% = critical (SRE standard)
```

### 2. Runbook

```
RUNBOOK REQUIREMENTS (wiki/runbooks/{service}-{feature}.md):
  □ Feature overview: what does it do? What does it touch?
  □ Common failure modes: top 3 expected failures + symptoms
  □ Diagnosis guide: how to determine root cause
      - What logs to look at? (log query examples included)
      - What metrics indicate which failure mode?
      - What recent deploys to check first?
  □ Mitigation steps: step-by-step for each failure mode
  □ Escalation path: when to escalate, to whom, how to contact
  □ Rollback procedure: exact steps + expected time
  □ Feature flag kill switch: how to disable feature without rollback

RUNBOOK QUALITY GATE:
  □ Tested by someone other than the author (dry-run or review)
  □ Reviewed by on-call engineer (not just the team that built the feature)
  □ Links to dashboards, log queries, and relevant ADRs
```

### 3. Rollback Readiness

```
  □ Rollback procedure documented and tested in staging
  □ Rollback estimated time: <= 10 minutes (measured in staging)
  □ Rollback does not require database migration reversal (if schema change:
      verify forward/backward compatibility; blue-green or expand-contract used)
  □ Feature flag disables feature without deploy (if applicable)
  □ Rollback authority confirmed: who can authorize rollback during on-call?
  □ Rollback tested: simulation run in staging; time recorded
  □ Data migration reversibility: if data was migrated, is it reversible?
```

### 4. Load and Performance

```
  □ Load test run: simulated peak traffic (1.5× expected peak)
  □ Latency baseline: p50, p95, p99 under load (recorded; not just "looks fine")
  □ Throughput ceiling: maximum RPS before degradation (documented)
  □ Database query performance: slow query log reviewed; EXPLAIN plans checked
  □ Resource usage: CPU, memory, DB connections under load (baseline recorded)
  □ Cache behavior: hit rates; cold start behavior; TTL configured correctly
  □ Graceful degradation: what happens if a dependency fails?
  □ Timeout configuration: all outbound calls have timeouts configured

PERFORMANCE GATES:
  Latency p99 <= SLA target
  Error rate at 1.5× peak < 1%
  No memory leak observed over 1hr load test
  Database connection pool not saturated at 1.5× peak
```

### 5. Capacity Planning

```
  □ Traffic forecast: expected RPS at P50, P95, peak traffic
  □ Resource requirements: compute, storage, database capacity for 90-day growth
  □ Scaling policy: auto-scaling configured? Limits set appropriately?
  □ Cost estimate: monthly cost of running this feature (approved by VP Eng if > $5K/mo)
  □ Quota/rate limit review: any external service quotas that could be hit?
```

### 6. Data Governance

```
  □ Data classification: all data entities classified (PUBLIC → TOP_SECRET)
  □ PII processing: any new PII? DPO notified + DPA reviewed
  □ Data retention: retention policy configured per data class
  □ Encryption: data at rest encrypted? Data in transit TLS 1.2+?
  □ Access control: data access follows least privilege
  □ Data lineage: registered in data catalog (WF for data fabric)
  □ GDPR: if EU user data — Art.30 record updated
```

### 7. Security

```
  □ SAST scan: no unaddressed HIGH or CRITICAL findings
  □ Dependency scan: no CVSS >= 7.0 unaddressed
  □ Secrets management: no secrets in code; all via secrets manager
  □ Input validation: all user inputs validated and sanitized
  □ Authentication/authorization: new endpoints secured appropriately
  □ Rate limiting: new public endpoints have rate limiting configured
  □ Security review: complex features reviewed by security team (T4 if new attack surface)
```

### 8. On-Call Readiness

```
  □ On-call team briefed: primary and secondary on-call aware of the feature
  □ Escalation contacts: who to wake up for this system (defined + current)
  □ Contact list current: phone numbers + Slack IDs verified this week
  □ On-call rotation: coverage during deployment window confirmed
  □ Previous incidents reviewed: any past issues with this system/service?
```

### 9. Compliance (for REGULATED features)

```
  □ EU AI Act: risk classification confirmed (if AI system)
  □ GDPR: privacy impact assessment complete (if new data processing)
  □ SOC2: new control mappings documented
  □ Audit logging: all required events logged to compliance audit trail
  □ Evidence retention: configured per data class retention schedule
  □ DPO sign-off: documented if required
```

---

## ORR Sign-Off Process

**Format:** Checklist review meeting (45 min) or async if all items clearly green

```
PARTICIPANTS:
  Engineering Lead (accountable for checklist completeness)
  Release Manager (verifies ORR is complete before adding to release council)
  Domain Architect (spot-checks high-risk items)
  DPO / Security Lead (if relevant items flagged)

SIGN-OFF OUTCOMES:
  ORR PASSED:      All required items checked; feature may proceed to release council
  ORR CONDITIONAL: < 3 items marked as "in progress with SLA"; tracked to completion
  ORR FAILED:      Critical items incomplete; feature pulled from release; timeline shifted

CONDITIONAL GATE RULES:
  Conditions must have explicit owner + completion date
  All conditions resolved before release council; no conditions carried into production
  Maximum 3 conditions permitted; if > 3 items incomplete → ORR FAILED
```

---

## Feature Flag Governance

```
FEATURE FLAGS are REQUIRED for:
  Any customer-facing change (allows gradual rollout)
  Any change to a HIGH_RISK AI system behavior
  Any feature where performance impact is uncertain

FEATURE FLAG STANDARDS:
  Flag names: lowercase-with-hyphens; descriptive; tied to feature not sprint
  Default state: OFF for new features; ON only after ORR passes
  Cleanup: feature flags removed within 2 sprints of full rollout (tech debt)
  Kill switch: every flag must disable feature cleanly (no half-states)

FEATURE FLAG REGISTRY:
  All flags registered in: wiki/engineering/feature-flag-registry.md
  Stale flags (> 60 days since last state change): PM decision to ship or remove
```

---

## Production Incident Preparedness (Game Day)

**Cadence:** Quarterly per team; new features > quarterly are covered at release ORR

```
GAME DAY PROTOCOL:
  Scenario: engineering lead picks a realistic failure scenario
  Duration: 60–90 min
  Objective: verify runbook + alerting + escalation path actually works
  Participants: on-call primary + secondary + engineering lead

  PHASES:
    1. Inject failure (staging; not production)
    2. Detect via monitoring (was the alert triggered in < 2 min?)
    3. Diagnose via runbook (was the runbook sufficient?)
    4. Remediate (was mitigation correct?)
    5. Debrief (what gaps found?)

  OUTPUT: Gap list → runbook updates → ORR items for new features
```

---

## Governance Checkpoints

```
C-001: ORR sign-off is a human review; checklist cannot be auto-approved
C-003: ORR checklist artifact required before release council; no exception
C-004: All ORR reviews, conditions, and decisions permanently recorded
ROLLBACK: Tested rollback is non-negotiable; ORR fails without it
SECURITY: Unaddressed CRITICAL security finding blocks ORR; no exceptions
DATA_GOVERNANCE: PII processing changes require DPO notification before ORR passes
AI_SYSTEMS: HIGH_RISK AI systems require EU AI Act conformity assessment before ORR
```

## Health Metrics

```
METRIC                                  TARGET
──────────────────────────────────────────────────────────────────────────────
ORR completion rate (before release)    = 100%
ORR first-pass rate (no conditions)     >= 0.75
Average ORR cycle time                  <= 3 days (T-8 to T-5 before release)
Rollback test success rate              = 100% (all tested; all pass)
Post-release ORR-gap incidents          target = 0 (incidents from missed ORR items)
Feature flag cleanup rate               >= 0.90 within 2 sprints post-rollout
Game day completion per team/quarter    = 1.00
```

## Workflow Integrations

```
WF-010  Release Governance → ORR passed is input to G-QUALITY gate in WF-010
WF-011  Rollout Governance → rollback plan from ORR is the WF-011 rollback procedure
WF-012  Incident Management → ORR runbook is the incident response runbook
WF-006  AI Feature Delivery → ORR includes EU AI Act conformity assessment step
PB-004  Release Council    → ORR completion is prerequisite for release council
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
ORR done after release is in council queue  Council gaps; rushed fixes; quality issues
Runbook written by feature author only      On-call cannot follow it; longer MTTR
Rollback not tested ("it should work")      Rollback fails during incident; extended outage
Alerts set too loose to avoid noise        Real incidents go undetected
Feature flags never cleaned up             Flag debt; unexpected interactions; confusion
Load test only at current traffic, not 1.5× Surprises at peak; degradation not predicted
ORR conditions never resolved post-ship    Permanent tech debt; risk accumulates silently
```
