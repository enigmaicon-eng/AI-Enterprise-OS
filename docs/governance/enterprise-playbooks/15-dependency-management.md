# PB-015: Dependency Management

**Version:** 1.0.0 | **Owner:** Delivery Org | **Cadence:** Weekly + Per-release | **Tier:** T3 | **Class:** ELEVATED

## Purpose
Identify, track, coordinate, and resolve all cross-team and cross-system dependencies before they become blockers — using deterministic tracking, formal commitment records, critical path analysis, and escalation triggers to prevent dependency-induced delivery failures.

## Dependency Philosophy

```
DEPENDENCIES ARE FIRST-CLASS DELIVERY RISKS.
  Every dependency registered is a risk identified.
  Every unregistered dependency is a risk hidden until it blocks.
  Commitment from providing team = binding; not best-effort.
  No dependency is "probably fine" — it is confirmed or it is a risk.
```

---

## Dependency Taxonomy

### By Type

```
TYPE              DEFINITION                                    EXAMPLES
──────────────────────────────────────────────────────────────────────────────────────────────
API_CONTRACT      Consuming team needs API from providing team  Auth service, payment API
SCHEMA            Shared database or event schema change        Database migration, Kafka topic
FEATURE           Work item must ship before another can start  Backbone feature for dependent
ENVIRONMENT       Shared infra/environment needed               Staging environment slot, GPU
COMPLIANCE        Third-party review or sign-off required       DPO sign-off, security review
EXTERNAL          Dependency on vendor, partner, or 3rd party   Stripe API, cloud service
DATA              Dataset, model, or data pipeline needed       Training data, feature store
PLATFORM          Platform capability needed                    Feature flag system, CI/CD
```

### By Criticality

```
CRITICALITY       DEFINITION
──────────────────────────────────────────────────────────────────────────────────────────────
BLOCKING          Work cannot begin or continue without this
CRITICAL_PATH     On the critical path; delay = initiative delay (CPM calculated)
HIGH              Work can proceed partially but milestone blocked without this
MEDIUM            Work can complete but integration cannot without this
LOW               Nice to have sooner but non-blocking
```

---

## Dependency Register

**Maintained in:** `wiki/dependencies/register.md`
**Updated:** Real-time as dependencies are identified; reviewed weekly

```
DEPENDENCY RECORD:
  dep_id:           DEP-{NNN}
  type:             [from taxonomy]
  criticality:      BLOCKING | CRITICAL_PATH | HIGH | MEDIUM | LOW
  consuming_team:   team + PM + Jira ticket
  providing_team:   team + lead + Jira ticket
  description:      what exactly is needed?
  need_by_date:     ISO8601 (latest date consuming team can receive without delay)
  commitment_date:  ISO8601 (date providing team has committed to deliver)
  gap_days:         commitment_date - need_by_date (negative = at risk)
  status:           IDENTIFIED | COMMITTED | AT_RISK | MISSED | FULFILLED | CANCELLED
  escalation_level: NONE | L2 | L3 | L4
  last_updated:     ISO8601
  notes:            any context, blockers, workarounds
```

---

## Weekly Dependency Triage

**Cadence:** Every Thursday, 30 minutes (Delivery Manager + PM Leads + Eng Leads)
**Purpose:** Triage new dependencies, review at-risk items, confirm commitments

### Agenda

```
TIME    TOPIC                                               OWNER         OUTPUT
──────────────────────────────────────────────────────────────────────────────────────────────
0:00    New dependencies: registered since last triage      Delivery Mgr  Assign + classify
0:10    AT_RISK dependencies: gap_days < 0                  PM Leads      Mitigation or escalate
0:20    MISSED dependencies: what is the impact?            PM + Eng      Recovery plan or L3
0:25    COMMITTED: any confidence changes?                  Eng Leads     Re-confirm or flag
0:30    Close; update register
```

### New Dependency Protocol (registered between trages)

```
WHEN IDENTIFIED:
  1. Consuming team PM registers in dependency register (same day)
  2. Slack DM to providing team lead: formal request with DEP-{id}
  3. Providing team lead acknowledges within 24hr (business hours)
  4. Providing team lead commits date within 48hr or escalates capacity issue
  5. Commitment recorded in register; Jira tickets linked

SAME-DAY REGISTRATION RULE:
  Any dependency identified > T-4 sprints from need date: standard process
  Dependency identified T-2 to T-4 sprints from need date: PM Lead notified
  Dependency identified < T-2 sprints from need date: CRITICAL flag; L3 escalation
```

---

## Critical Path Analysis

**Owner:** Delivery Manager + analytics-agent
**Cadence:** Recalculated weekly; recalculated immediately after any CRITICAL_PATH change

```
CPM PROCESS:
  1. All BLOCKING + CRITICAL_PATH dependencies mapped to initiative DAG
  2. Earliest Start (ES) and Latest Start (LS) calculated per work item
  3. Float = LS - ES; Float = 0 → on critical path
  4. Critical path activities flagged in portfolio dashboard
  5. Any new dependency with gap_days < 0 added to critical path → immediate risk flag

CRITICAL PATH REPORT: wiki/dependencies/critical-path.md (auto-generated)

CRITICAL PATH BREACH TRIGGERS:
  Any CRITICAL_PATH dep with gap_days <= -5: L3 escalation
  Any CRITICAL_PATH dep with gap_days <= -10: L4 escalation
  Critical path slip > 2 weeks: quarterly portfolio review triggered
```

---

## Dependency Commitment Protocol

**When providing team commits to a dependency:**

```
COMMITMENT RECORD (wiki/dependencies/commitments/{dep_id}.md):
  dep_id:           DEP-{NNN}
  committing_lead:  name + role (must be T2+ Eng Lead or PM Lead)
  committed_date:   ISO8601 (delivery date)
  committed_scope:  exactly what will be delivered (not just "API")
  conditions:       any conditions on commitment (e.g., "requires approval of X first")
  confidence:       HIGH | MEDIUM | LOW (low = flag for weekly triage)
  signed:           electronic acknowledgment required
  backup_contact:   who covers if lead is unavailable

COMMITMENT IS BINDING:
  Missing a committed date without prior notification is a L2 escalation.
  Missing a committed date on a CRITICAL_PATH dependency is a L3 escalation.
  Repeated missed commitments by same team → leadership escalation + process review.
```

---

## Dependency Risk Escalation

```
CONDITION                                           ESCALATION        PLAYBOOK
──────────────────────────────────────────────────────────────────────────────────────────────
gap_days <= -3 (MEDIUM/HIGH dependency)             L2 (PM Lead)      PB-012
gap_days <= -5 (CRITICAL_PATH dependency)           L3 (Director)     PB-012 + WF-016
Commitment missed; no new date given (< 48hr)       L3               PB-012
Commitment missed; BLOCKING dependency              L3 immediately    PB-012 + PB-004
External dependency (vendor) 2 weeks late           L3 + PM escalate  PB-012
Critical path slip > 2 weeks                        L4 (VP)           PB-012 + PB-014
Release date at risk due to dependency              L3 + PB-004       PB-012 + Release council
```

---

## External Dependency Management

```
VENDOR AND PARTNER DEPENDENCIES:
  Register as DEP type = EXTERNAL
  Owner: PM Lead (not Eng Lead; requires commercial relationship management)
  Escalation path: PM → VP Product → CEO if revenue-critical

EXTERNAL DEPENDENCY STANDARDS:
  All external SLAs in contract or formal SLA document
  No single external dependency on CRITICAL_PATH without mitigation plan
  Mitigation plan: alternative vendor, feature flag disable, fallback behavior
  Contract SLA breach: notify Legal within 24hr; negotiate remediation

THIRD-PARTY API DEPRECATIONS:
  Register as dep_type = API_CONTRACT; criticality = based on impact
  If deprecated: 90-day migration plan required
  If < 30 days to deprecation with no plan: L4 escalation
```

---

## Pre-Release Dependency Clearance

**Owner:** Release Manager
**Timing:** T-5 business days before release council (PB-004)

```
DEPENDENCY CLEARANCE CHECKLIST:
  □ All BLOCKING dependencies for this release: FULFILLED
  □ All CRITICAL_PATH dependencies: FULFILLED or gap_days >= 0
  □ All HIGH dependencies: FULFILLED or formal workaround documented
  □ No new BLOCKING/CRITICAL dependencies registered in last 48hr
  □ External dependencies: SLA confirmed current
  □ Downstream system owners notified of this release
  □ API consumers notified (if breaking changes)

RELEASE BLOCKED IF:
  Any BLOCKING dependency not FULFILLED
  Any CRITICAL_PATH dependency with gap_days < -2
  External dependency breached without workaround
```

---

## Dependency Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Same-day dependency registration rate    >= 0.95
Commitments honored on-time              >= 0.90
CRITICAL_PATH dependencies at-risk       = 0 at release time
Weekly triage held                       = 100%
Average dep resolution time              < 5 business days
Missed commitments with L3 escalation    = 100% (no silent misses)
Pre-release dependency clearance pass    = 100%
```

---

## Dependency Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
──────────────────────────────────────────────────────────────────────────────────────────────
"We'll figure it out when we get there"     Dependency discovered blocking production
Verbal commitments only                     Commitment disputed; "I never said that"
Same team always provides to many others    Bottleneck team; constant escalations
Dependency registered week before need     No time to course-correct; forced crunch
"It's an API, just expose it quickly"      Undocumented contract; production incidents
Critical path not maintained               Unknown impacts; everyone surprised by delays
Escalation avoided to preserve harmony     Dependency silently kills the release
```

---

## Governance Checkpoints

```
C-004: All dependency commitments permanently recorded; no verbal-only agreements
COMMITMENT: Providing team lead must sign commitment record; delegate cannot self-commit without lead sign-off
PRE_RELEASE: Release council will not approve if BLOCKING dependencies unresolved
CRITICAL_PATH: CPM analysis is mandatory for all STRATEGIC initiatives
EXTERNAL: External dependencies require PM + VP awareness; eng leads cannot own externals alone
```

## Workflow Integrations

```
WF-016  Dependency Coordination → formal coordination workflow for CRITICAL/BLOCKING dependencies
WF-010  Release Governance      → dependency clearance is G-QUALITY gate input
PB-004  Release Council         → release readiness requires dependency clearance
PB-014  Portfolio Reviews       → dependency risks are portfolio-level risks
PB-012  Escalation Management   → dependency breaches escalate via PB-012
```
