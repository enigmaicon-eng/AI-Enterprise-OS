# PB-004: Release Councils

**Version:** 1.0.0 | **Owner:** Delivery Org | **Cadence:** Per-release | **Tier:** T3 | **Class:** CRITICAL

## Purpose
Govern every production release through a structured multi-stakeholder council — providing a single synchronous gate where QA, security, architecture, product, and executive sign-off converge before any code reaches production. The Release Council is the final human checkpoint before WF-011 (Rollout Governance) begins.

## Council Composition

```
ROLE                    TIER  REQUIRED FOR        AUTHORITY
───────────────────────────────────────────────────────────────────────────────────────────
Release Manager         T3    All releases        Convener; decision recorder
QA Lead                 T3    All releases        G-QUALITY gate holder
Security Lead           T3    All; T4 for MAJOR   G-SECURITY gate holder
Engineering Lead        T2    All releases        Technical readiness attestation
Domain Architect        T3    Schema/API changes  G-ARCH gate holder
Product Manager         T2    All releases        Customer impact assessment
DPO / Compliance        T4    Regulatory releases G-LEGAL gate holder
VP Engineering (CTO)    T4/T5 MAJOR releases      G-EXEC gate holder
Customer Success Lead   T3    Customer-impact     External comms readiness
On-call Engineer        T2    All releases        Rollback readiness attestation
```

---

## Release Classification

```
CLASS          CRITERIA                                       COUNCIL TYPE
───────────────────────────────────────────────────────────────────────────────────────────
PATCH          Bug fix; no API change; no schema change       Async council (Slack thread)
               < 3 files changed (heuristic)
STANDARD       Feature addition; backward-compatible API      Sync council (60 min)
               No customer-facing breaking change
MAJOR          Breaking API change OR new service OR          Full council (90 min)
               customer-facing behavioral change              + G-EXEC gate required
HOTFIX         Production outage fix; expedited path          Emergency council (30 min)
               Follows emergency protocol
SECURITY_PATCH CVE remediation; security hardening           Security council (60 min)
               May require off-hours execution               + CISO present
SCHEMA_MIGRATION Database schema change; migration script     Schema council (60 min)
               Rollback window analysis required             + T4 architect required
REGULATORY     Compliance-driven change; DPO required        Regulatory council (90 min)
               7-yr retention; DPO signature
```

---

## Pre-Release Checklist (T-48 hours)

**Assembled by:** Release Manager
**Reviewed by:** All council members async before sync session

```
CATEGORY            ITEM                                           STATUS
──────────────────────────────────────────────────────────────────────────────────────────
CODE QUALITY
  □ All CI checks green (no red/yellow)
  □ Code review approved by ≥ 2 engineers
  □ Test coverage >= 80% for changed code
  □ No open CRITICAL or HIGH Jira issues in scope

TEST EVIDENCE
  □ Unit tests: all passing
  □ Integration tests: all passing
  □ E2E tests: passing (regression suite)
  □ Performance tests: within ±10% of baseline
  □ Security scan: no unaddressed CRITICAL or HIGH findings

ROLLBACK READINESS
  □ Rollback runbook written and tested in staging
  □ Rollback estimated time < 10 minutes
  □ Rollback decision authority confirmed (T3 on-call)
  □ Pre-deploy snapshot checkpoint created

OBSERVABILITY
  □ Feature flags configured (if applicable)
  □ Monitoring dashboards updated for new features
  □ Alerts configured for new failure modes
  □ On-call briefed on what to watch post-deploy

DEPENDENCIES
  □ No unresolved cross-team dependencies (WF-016 check)
  □ Downstream system owners notified if behavior changes
  □ Third-party integrations tested in staging

CUSTOMER IMPACT
  □ Customer impact assessment: affected accounts identified
  □ Customer communication drafted (if needed)
  □ Support team briefed on new behavior
  □ Documentation updated

COMPLIANCE (if regulatory)
  □ DPO review complete
  □ GDPR data processing changes documented
  □ EU AI Act classification confirmed (if AI system)
  □ Compliance evidence package assembled
```

---

## Sync Council Session

### Standard Release Council (60 min)

**Convened by:** Release Manager
**Scheduled:** T-24 hours from planned deployment window
**Decision:** GO / NO-GO / CONDITIONAL-GO

```
TIME    STEP                                          OWNER           GATE
──────────────────────────────────────────────────────────────────────────────────────────
0:00    Release brief: scope, customer impact, risk   Release Mgr     -
0:10    QA attestation: test results summary          QA Lead         G-QUALITY
0:20    Security attestation: scan results            Security Lead   G-SECURITY
0:30    Engineering attestation: rollback ready       Eng Lead        ROLLBACK
0:40    Architecture sign-off (if schema/API change)  Arch            G-ARCH
0:45    Customer impact + comms review                PM + CS Lead    -
0:50    Go / No-Go vote                               All council     Decision
0:55    Conditions or actions if CONDITIONAL-GO       Release Mgr     -
0:60    Release approval record signed                Release Mgr     → WF-010 S-009
```

### Major Release Council (90 min)

```
TIME    STEP                                          OWNER           GATE
──────────────────────────────────────────────────────────────────────────────────────────
0:00    Release brief: scope, breaking changes, risk  Release Mgr     -
0:15    QA attestation: full test results             QA Lead         G-QUALITY
0:25    Security attestation: SAST/DAST + deps        Security Lead   G-SECURITY
0:35    Architecture sign-off: ADR confirmed          Domain Arch     G-ARCH
0:50    Customer impact deep-dive                     PM + CS Lead    -
1:05    Exec review: strategic risk + decision auth   VP Eng/CTO      G-EXEC
1:20    Go / No-Go vote + conditions                  All council     Decision
1:30    Actions + deployment window confirmed         Release Mgr     -
```

---

## Go / No-Go Decision Framework

### Vote Protocol
```
EACH GATE HOLDER submits: GO | NO-GO | GO_WITH_CONDITIONS
DECISION LOGIC:
  All GO:                    → Release approved; proceed to WF-011
  Any NO-GO:                 → Release blocked; root cause addressed; re-council
  Any GO_WITH_CONDITIONS:    → Conditions documented; Release Mgr owns resolution
                               Re-vote on conditions within 24hr (async)

CONDITIONS TYPES:
  MONITORING: add specific alert → add before deploy; no re-council needed
  DOCUMENTATION: update runbook → due within 24hr of deploy
  COMMUNICATION: notify customer → CS Lead owns; due before deploy
  CODE_FIX: fix specific issue → requires re-council after fix
```

### No-Go Root Causes (common)
```
ROOT CAUSE              RESPONSIBLE          RECOVERY PATH
────────────────────────────────────────────────────────────────────────────────────────────
Test failure            Engineering          Fix bug → re-test → re-council
Security finding        Security             Fix vulnerability → rescan → re-council
Missing rollback plan   Delivery             Write + test rollback → re-council
Incomplete docs         PM                   Complete documentation → async re-vote
Dependency unresolved   Engineering          Resolve dependency (WF-016) → re-council
DPO sign-off missing    DPO                  DPO review (WF-014/WF-010) → re-council
On-call not briefed     Engineering Lead     Brief on-call → no re-council needed
```

---

## Emergency Hotfix Council (30 min)

**Trigger:** Production SEV1/SEV2 requiring immediate fix
**Convened within:** 30 min of hotfix ready
**Minimum quorum:** Release Manager + Engineering Lead + On-call + 1 Gate Holder

```
TIME    STEP                                          OWNER           NOTE
──────────────────────────────────────────────────────────────────────────────────────────
0:00    Hotfix brief: what broke, what the fix does   Eng Lead        Keep < 3 min
0:05    Fix review: risk of fix worse than problem?   Eng Lead + QA   < 10 min
0:15    Rollback plan: can we undo the hotfix?        On-call Eng     Mandatory
0:20    Go / No-Go: verbal vote                       All present     Decision
0:25    Deploy authorization recorded                 Release Mgr     Async Slack
0:30    Deploy begins (WF-011)                        On-call         -

POST-HOTFIX:
  Full council post-review within 24hr: was the hotfix correct?
  Postmortem (WF-013): was the hotfix needed, or was there a better path?
```

---

## Deployment Window Governance

```
STANDARD WINDOWS (all times local production team):
  Weekday deploys:       Tuesday–Thursday, 10:00–16:00
  Avoid:                 Monday (post-weekend backlog), Friday (pre-weekend risk)
  Prohibited:            Blackout periods (holidays, Q4 crunch, conference dates)

EXCEPTIONS:
  HOTFIX:     Any time; commander authorization
  SECURITY:   Any time; CISO authorization
  REGULATORY: Per compliance deadline; DPO authorization

BLACKOUT MANAGEMENT:
  Delivery Org maintains: wiki/delivery/deployment-calendar.md
  Blackout changes: T3 Release Manager decision; T4 for > 2-week blackout
  All teams notified: Slack #engineering ≥ 1 week in advance
```

---

## Post-Release Tracking

### 24-Hour Soak Watch
```
On-call engineer monitors (automated alerts + manual checks):
  □ Error rate returning to/staying at baseline (WF-011 health cert)
  □ Latency p95 within SLA
  □ Customer support ticket spike (unusual volume = rollback signal)
  □ Feature flag rollout percentage on track
  □ Key business metrics not regressing (PM reviews)

At 24hr: Release Manager confirms health certificate (→ WF-011 S-013)
At 72hr: PM confirms business metric health (no regression)
```

### Release Retrospective (for MAJOR releases)
```
Cadence: Within 1 week of release
Participants: Release council members

Agenda (30 min):
  1. Was the release smooth? Rate 1–5
  2. Any near-misses during council process?
  3. Any post-release surprises?
  4. Process improvements for next release?

Output: wiki/releases/{release_id}.md → retro section appended
```

---

## Governance Checkpoints

```
C-001: Go/No-Go decision is human council decision; AI cannot authorize release
C-003: Release approval record required before WF-011 can begin; no exceptions
C-004: All Go/No-Go votes, conditions, and No-Go reasons permanently recorded
ROLLBACK: Tested rollback plan mandatory for all releases; council cannot waive
REGULATORY: DPO must be present at regulatory release council; no proxy sign-off
BLACKOUT: No releases during blackout periods without T4 authorization
HOTFIX_REVIEW: All hotfixes reviewed by full council within 24hr of deploy
```

## Health Metrics

```
METRIC                                  TARGET
──────────────────────────────────────────────────────────────────────────────
Release cycle time (T-48hr to go-live)  <= 48hr for STANDARD
Go rate (releases approved on first try) >= 0.85
No-Go rate                               < 0.15 (high = quality gate failures upstream)
Hotfix rate                              < 0.10 (high = quality not caught pre-release)
Rollback rate post-release              < 0.05
24hr soak breach rate                   < 0.05
Release council completion rate         = 1.00 (no releases without council)
```

## Workflow Integrations

```
WF-010  Release Governance  → council is the human layer in WF-010 approval chain
WF-011  Rollout Governance  → council GO decision initiates WF-011
WF-012  Incident Management → post-release rollback triggers WF-012
WF-013  Postmortem          → post-hotfix postmortem via WF-013
WF-014  Compliance Review   → regulatory release council requires WF-014 sign-off
WF-016  Dependency Coord    → pre-council checklist includes WF-016 dependency check
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
Release council becomes rubber stamp       Quality gates lose meaning; rollbacks increase
Hotfix path used to bypass standard gates  Hotfix becomes default path; risk normalized
Go/No-Go conditions never re-verified     Conditions accumulate; never enforced
Blackout periods quietly overridden        On-call overwhelmed; SEV1 spike on holidays
Council held without quorum               Decision accountability unclear; contested later
Pre-release checklist skipped "this time"  Missing coverage; unexpected rollbacks
```
