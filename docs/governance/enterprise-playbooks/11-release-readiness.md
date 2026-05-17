# PB-011: Release Readiness

**Version:** 1.0.0 | **Owner:** Delivery Org | **Cadence:** Per-release | **Tier:** T3 | **Class:** CRITICAL

## Purpose
Define the complete criteria and process for certifying a release as ready to ship — integrating QA signoff, security clearance, operational readiness, rollback validation, customer communications, and deployment logistics into a single deterministic checklist that the release council (PB-004) reviews to make a Go/No-Go decision.

## Release Readiness vs. Operational Readiness

```
OPERATIONAL READINESS (PB-010):
  Scope: individual feature or component
  Focus: observability, runbook, rollback, performance, data governance
  Owner: Engineering team
  Timing: T-5 days before release council

RELEASE READINESS (PB-011):
  Scope: entire release (all components combined)
  Focus: aggregate quality, risk, communications, coordination
  Owner: Release Manager
  Timing: T-24 hours before deployment window

ORR is a prerequisite for RR. Release readiness cannot pass if any component's ORR is incomplete.
```

---

## Release Readiness Scorecard

**Completed by:** Release Manager
**Reviewed by:** Release Council (PB-004)
**Filed at:** `wiki/releases/{release_id}/readiness-scorecard.md`

### Track 1: Code Quality and Testing

```
ITEM                                              STATUS    BLOCKER?
──────────────────────────────────────────────────────────────────────────────────────────
All CI/CD pipeline checks green (no yellow/red)   □         YES
All unit tests passing (0 failures)               □         YES
All integration tests passing                     □         YES
E2E regression suite: passing                     □         YES
Performance tests: within ±10% of baseline        □         YES
Code coverage >= 80% for all changed components   □         YES
All CRITICAL and HIGH Jira issues resolved        □         YES
No unreviewed code in release scope               □         YES
All PRs approved by >= 2 engineers               □         YES
Test report artifact attached to release record   □         YES
```

### Track 2: Security

```
ITEM                                              STATUS    BLOCKER?
──────────────────────────────────────────────────────────────────────────────────────────
SAST scan completed: no unaddressed CRITICAL      □         YES
SAST scan completed: no unaddressed HIGH          □         YES
Dependency scan: no CVSS >= 7.0 unaddressed       □         YES
Secrets scan: no secrets committed to repo        □         YES
Container scan (if containerized): no CRITICAL    □         YES
Security review completed (T4 if MAJOR/SECURITY)  □         YES (if required)
Penetration test completed (quarterly or new API) □         IF REQUIRED
Security sign-off recorded                        □         YES (T4 for MAJOR)
```

### Track 3: Operational Readiness (aggregate)

```
ITEM                                              STATUS    BLOCKER?
──────────────────────────────────────────────────────────────────────────────────────────
ORR completed for all components in release scope □         YES
All ORR conditions resolved                       □         YES
Monitoring dashboards updated                     □         YES
Alerts configured and tested for new features     □         YES
On-call briefed: primary and secondary            □         YES
Runbooks written, reviewed, and linked            □         YES
Rollback procedure tested in staging              □         YES
Rollback estimated time: <= 10 minutes            □         YES
Feature flags configured (OFF by default)         □         IF APPLICABLE
Load test results within targets                  □         YES (new services)
```

### Track 4: Deployment Logistics

```
ITEM                                              STATUS    BLOCKER?
──────────────────────────────────────────────────────────────────────────────────────────
Deployment window confirmed (not in blackout)     □         YES
Deployment window: Tuesday–Thursday, 10:00–16:00  □         YES (unless exception)
Database migrations tested in staging (if any)    □         YES
Migration rollback tested                         □         YES (if schema change)
Third-party integrations tested in staging        □         YES (if affected)
API consumers notified of breaking changes        □         YES (if breaking)
Downstream system owners notified                 □         YES (if behavior changes)
Deployment prerequisites confirmed (no active SEVs) □       YES
Pre-deploy snapshot scheduled                     □         YES (WF-011 S-003)
Release notes drafted                             □         YES
```

### Track 5: Customer and Communications

```
ITEM                                              STATUS    BLOCKER?
──────────────────────────────────────────────────────────────────────────────────────────
Customer impact assessment: complete              □         YES
Affected customer accounts identified             □         YES (if customer-impacting)
Customer communication drafted and reviewed       □         IF REQUIRED
CS team briefed on new behavior                   □         YES (if customer-facing)
Support documentation updated                     □         YES (if customer-facing)
Status page message prepared (if maintenance)     □         IF REQUIRED
Customer communication sent / scheduled           □         IF REQUIRED (before deploy)
```

### Track 6: Compliance (if applicable)

```
ITEM                                              STATUS    BLOCKER?
──────────────────────────────────────────────────────────────────────────────────────────
DPO sign-off obtained                             □         IF REGULATORY
GDPR data processing documentation updated        □         IF NEW PII PROCESSING
EU AI Act conformity assessment complete          □         IF AI SYSTEM
Compliance evidence package assembled             □         IF REGULATED RELEASE
DPO approval recorded                             □         IF REQUIRED
Regulatory submission date confirmed (if filing)  □         IF REGULATORY
```

---

## Release Risk Score

**Computed by:** Release Manager + analytics-agent
**Used by:** Release council for Go/No-Go calibration

```
RISK DIMENSION                  WEIGHT    SCORING (1=low, 5=high)
──────────────────────────────────────────────────────────────────────────────────────────
Scope size (# components)        20%       1 (<3) → 5 (>10)
Customer impact                  25%       1 (internal) → 5 (all customers, revenue critical)
Recency of code changes          15%       1 (> 1 week old) → 5 (changed in last 24hr)
Rollback complexity               20%       1 (flag flip) → 5 (irreversible schema migration)
Security surface change           10%       1 (no new surface) → 5 (new auth, new endpoints)
Team confidence                   10%       1 (very confident) → 5 (significant uncertainty)

RISK SCORE = sum(dimension × weight)

RISK TIER:
  1.0–2.0: LOW    → Standard release; proceed to council
  2.1–3.5: MEDIUM → Council reviews risk items; additional conditions may apply
  3.6–4.5: HIGH   → Council required; T4 present; extended soak period (48hr)
  4.6–5.0: VERY HIGH → T5 review required; consider deferring non-critical components
```

---

## Release Readiness Dashboard

**Real-time view for Release Manager and Council**
**Location:** `wiki/releases/{release_id}/dashboard.md` (auto-generated)

```
RELEASE: {release_id} | {release_type} | RISK: {score}/5.0 ({tier})
PLANNED WINDOW: {date} {time} | RELEASE MANAGER: {name}

TRACK SUMMARY:
  ✅ Code Quality:    8/8 items green
  ✅ Security:        6/6 items green
  ⚠️  Ops Readiness:  5/6 items green (1 condition: monitoring alert needs tuning)
  ✅ Deployment:      8/8 items green
  ✅ Customer Comms:  4/4 items green
  N/A Compliance:     N/A (non-regulated release)

OVERALL STATUS: CONDITIONAL (1 open condition)
CONDITION OWNER: {name} | DUE: {date}
```

---

## Release Readiness Review Meeting

**Timing:** T-24 hours before deployment window
**Duration:** 30 min (score-based; high-risk releases: 60 min)
**Participants:** Release Manager + Engineering Lead + QA Lead + On-call

```
AGENDA:
  0:00  Scorecard walkthrough: any reds or yellows?
  0:10  Risk score review: what drives the risk?
  0:15  Open conditions: are they resolved or on track?
  0:20  Deployment logistics: is the window still valid?
  0:25  Go/Conditional/No-Go recommendation to council
  0:30  Close

OUTPUT:
  Release Readiness Summary → delivered to Release Council (PB-004) T-2hr
```

---

## Release Notes Standard

**Required for:** All releases (PATCH: brief; STANDARD+: full)
**Published at:** `wiki/releases/{release_id}.md`
**Audience:** Engineering, CS, customers (customer-facing version)

```
RELEASE NOTES SECTIONS:
  Summary:          1–2 sentences; what is this release?
  Changes:          What's new; what's changed; what's fixed (user-facing language)
  Breaking Changes: Any backward-incompatible changes with migration guide
  Known Issues:     Any known limitations or deferred bugs
  Rollback:         How to roll back if needed (internal version)
  Deployment Notes: Any special deployment instructions for ops
  Customer Communication: What customers need to know (separate version)
```

---

## Post-Release Readiness Check (T+24hr)

**Owner:** Release Manager
**Format:** Async checklist; escalate if any item flagged

```
  □ Health certificate generated by WF-011 (soak period complete)
  □ Error rate at baseline or better (24hr post-release)
  □ No customer complaints related to this release
  □ Feature flags ramping as planned
  □ Business metrics not regressing (PM confirms)
  □ No on-call escalations attributable to this release
  □ Release notes published and accessible to CS
  □ Post-release retrospective scheduled (MAJOR releases only)

IF ANY ITEM FAILS:
  Engineering Lead + Release Manager triage within 2hr
  Decision: monitor, rollback, or hotfix (with council approval)
  Escalate to VP Eng if rollback considered (rollback is a T3 decision)
```

---

## Governance Checkpoints

```
C-001: Release Go/No-Go is a human council decision; readiness score is advisory
C-003: Release readiness scorecard is a required artifact; cannot be skipped
C-004: All scores, conditions, and decisions permanently recorded
ROLLBACK: Rollback tested = mandatory checklist item; release blocked if not complete
SECURITY: Any unaddressed CRITICAL security finding = automatic NO-GO; no exceptions
BLACKOUT: Deployment window must be outside blackout periods; T4 authorization required for exceptions
CUSTOMER_COMMS: Customer-impacting releases require CS briefing before deployment; no stealth changes
```

## Health Metrics

```
METRIC                                  TARGET
──────────────────────────────────────────────────────────────────────────────
Readiness scorecard completion rate     = 100% (no releases without it)
First-pass readiness (all green)        >= 0.70
Average conditions per release          < 2.0
Post-release rollback rate              < 0.05
Post-release incident rate              < 0.10 (incidents caused by release)
Customer complaints from releases        < 0.05 of releases
24hr health cert pass rate              >= 0.95
```

## Workflow Integrations

```
WF-010  Release Governance  → readiness scorecard feeds G-QUALITY gate
WF-011  Rollout Governance  → rollback procedure from readiness scorecard used in WF-011
WF-012  Incident Management → release-caused incidents trigger WF-012
PB-004  Release Council     → readiness review feeds directly into council Go/No-Go
PB-010  Operational Readiness → ORR is prerequisite; RR aggregates all ORR results
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
Readiness checked same day as release      No time to fix issues; forced to choose risk/delay
Risk score not computed ("we know this release") Undiscovered risks; council debates without data
Conditions carried silently into production  ORR trust erodes; conditions become permanent
Release notes written post-release         CS cannot brief customers; support load spikes
Customer comms skipped "it's a small change" Customer surprised; trust and relationship damage
Post-release check skipped if no alerts     Slow degradation (business metrics) goes unnoticed
```
