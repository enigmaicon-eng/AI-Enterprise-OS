---
type: implementation-plan
version: "1.0"
id: IMPL-<YYYY-MM-DD>-<slug>
status: draft | approved | in-progress | complete | abandoned
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
author: engineer-agent
eng-lead: <name>
prd-ref: prds/<slug>.md
adr-ref: architecture/decisions/ADR-NNN.md
tier: XS | M | L
sprint: <sprint-id>
---

# Implementation Plan: <Feature Name>

> **Status:** `DRAFT`
> **Tier:** `<XS | M | L>`
> **Estimated effort:** `<T-shirt size>`
> **Target completion:** `<YYYY-MM-DD>`

---

## ① Summary

| Field | Value |
|-------|-------|
| **Feature** | `<feature name>` |
| **PRD** | `prds/<slug>.md` |
| **ADR** | `architecture/decisions/ADR-NNN.md` |
| **Tier** | XS / M / L |
| **Approach** | `<one-line technical strategy>` |
| **Risk level** | High / Medium / Low |
| **Security review** | Required / Not required |
| **Staged rollout** | Required / Not required |

---

## ② Technical Approach

### 2.1 Design Summary

`<3–5 sentences: what is being built, how it fits the existing system, and what the key technical decision is>`

### 2.2 System Components Affected

| Component | Change Type | Risk | Notes |
|-----------|------------|------|-------|
| `<component>` | new / modified / deleted / unchanged | H/M/L | `<what specifically changes>` |

### 2.3 Architecture Diagram

```
# ASCII diagram of the new component interactions
# Before (if modifying):
  <system-A> → <system-B> → <system-C>

# After:
  <system-A> → <system-B> → <system-D> → <system-C>
                              ↕
                          <new-component>
```

### 2.4 Data Model Changes

```
# List schema changes. Prefix: + add, ~ modify, - remove

Table: <table_name>
  + new_field       type        nullable  description
  ~ existing_field  old → new   reason
  - removed_field               reason

Migration type: additive / requires backfill / breaking
Downtime required: yes / no
```

### 2.5 API Changes

```
# New or modified endpoints

NEW:
  POST /v1/<resource>
  GET  /v1/<resource>/{id}

MODIFIED:
  PATCH /v1/<resource>/{id}  — added field: <field>

REMOVED:
  DELETE /v1/<old-endpoint>  — replaced by: <new-endpoint>

Breaking: YES / NO
```

---

## ③ Work Breakdown

### 3.1 Phase Plan

| Phase | Description | Owner | Estimate | Dependencies | Deliverable |
|-------|------------|-------|---------|-------------|-------------|
| 1 | `<task>` | `<agent/eng>` | `<Xd>` | none | `<artifact>` |
| 2 | `<task>` | | | Phase 1 | |
| 3 | `<task>` | | | Phase 2 | |

### 3.2 Task Breakdown (L-tier only)

| ID | Task | Tier | Owner | Estimate | Blocked By | Status |
|----|------|------|-------|---------|-----------|--------|
| T-01 | `<task>` | L/M/XS | | `<Xh>` | none | Not started |
| T-02 | `<task>` | | | | T-01 | |

### 3.3 Parallel Work

These tasks can execute concurrently:
- **Track A:** `<backend work>`
- **Track B:** `<frontend work>`
- **Track C:** `<infrastructure work>`

Join point: `<what must be true before tracks merge>`

---

## ④ Implementation Details

### 4.1 Key Algorithms / Logic

```
# Describe the core logic here in pseudocode or prose
# Keep this concise — link to code, don't reproduce it
```

### 4.2 Error Handling Strategy

| Failure Mode | Recovery Strategy | User Impact |
|-------------|------------------|------------|
| `<failure>` | `<retry / fallback / fail-fast>` | `<what user sees>` |

### 4.3 Performance Targets

| Operation | P50 Target | P99 Target | Current Baseline | Measurement |
|-----------|-----------|-----------|-----------------|------------|
| `<operation>` | `<Xms>` | `<Xms>` | `<Xms or N/A>` | `<how measured>` |

### 4.4 Caching Strategy

```
Cache layer:   <none | Redis | CDN | in-memory | browser>
TTL:           <duration>
Invalidation:  <on what event>
Cache key:     <format>
Cache miss:    <fallback behavior>
```

---

## ⑤ Testing Plan

### 5.1 Test Coverage Requirements

| Test Type | Required Coverage | Tool | Notes |
|-----------|-----------------|------|-------|
| Unit | ≥ 80% for new code | `<jest / pytest / etc>` | |
| Integration | All API endpoints | | |
| E2E | Critical user paths | | |
| Load | `<concurrent users>` | `<k6 / locust>` | L-tier only |

### 5.2 Test Scenarios

| # | Scenario | Type | AC Ref | Pass Criteria |
|---|----------|------|--------|--------------|
| 1 | Happy path: `<description>` | E2E | AC-01 | `<expected>` |
| 2 | Error: `<failure condition>` | Integration | AC-03 | `<expected>` |
| 3 | Edge: `<boundary condition>` | Unit | AC-02 | `<expected>` |

### 5.3 Security Test Requirements

- [ ] Input validation tested for all user-supplied fields
- [ ] Authentication enforced on all protected routes
- [ ] Authorization tested: verify users cannot access others' data
- [ ] Dependency scan: no new critical/high CVEs
- [ ] `<feature-specific security test>`

---

## ⑥ Deployment Plan

### 6.1 Environment Sequence

```
Local → Development → Staging → Production
```

### 6.2 Feature Flags

```yaml
flag_name: <feature_flag_id>
default: false
rollout:
  - environment: staging
    percentage: 100
    date: <YYYY-MM-DD>
  - environment: production
    percentage: 5
    date: <YYYY-MM-DD>
  - environment: production
    percentage: 100
    date: <YYYY-MM-DD>
```

_If no feature flag required: state reason._

### 6.3 Pre-Deployment Checklist

- [ ] All tests passing (unit, integration, E2E)
- [ ] Security review completed and approved
- [ ] Database migration script reviewed and tested on staging
- [ ] Feature flag configured
- [ ] Monitoring dashboards updated
- [ ] Runbook written: `wiki/runbooks/<slug>.md`
- [ ] On-call team notified
- [ ] Rollback plan documented (§7)

### 6.4 Deployment Steps

```
1. Deploy migration (if any) to production database
2. Verify migration: <check command>
3. Deploy application code behind feature flag (default: off)
4. Enable flag for <N%> of traffic
5. Monitor for <X minutes>: <metrics to watch>
6. Expand flag to 100% if no anomalies
7. Remove flag from code in next sprint
```

---

## ⑦ Rollback Plan

**Rollback trigger:** `<observable condition that warrants rollback — be specific>`

**Rollback decision owner:** `<who can authorize rollback>`

**Rollback steps:**

```
1. Disable feature flag: <command or UI action>
2. Verify rollback: <check that feature is no longer active>
3. If database migration is not reversible:
   a. <specific recovery step>
   b. <specific recovery step>
4. Notify stakeholders: <who, what to say>
5. Open incident if P1/P2: !incident
```

**Estimated rollback time:** `<X minutes>`

**Data risk:** `<none | describe any data that cannot be rolled back>`

---

## ⑧ Observability

### 8.1 New Metrics

| Metric Name | Type | Description | Alert Threshold |
|------------|------|------------|----------------|
| `<metric>` | counter / gauge / histogram | `<what it measures>` | `<when to alert>` |

### 8.2 Logging

```
Level:   INFO for normal operations, ERROR for exceptions
Format:  structured JSON
Fields:  { request_id, user_id, operation, duration_ms, result }
PII:     <none | describe what is scrubbed>
```

### 8.3 Dashboards

New panels required in `<dashboard-name>`:
- `<panel description>`
- `<panel description>`

### 8.4 Alerts

| Alert | Condition | Severity | Notification Target |
|-------|-----------|---------|-------------------|
| `<alert name>` | `<threshold>` | P1/P2/P3 | `<oncall / channel>` |

---

## ⑨ Decision Log

Decisions made during implementation. Reference ADRs for architecture decisions; this log captures implementation-level choices.

| # | Decision | Options Considered | Chosen | Rationale | Date |
|---|---------|-------------------|--------|-----------|------|
| D-01 | `<decision topic>` | A / B | A | `<why>` | |

---

## ⑩ Risks & Mitigations

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|------|------------|--------|-----------|-------|
| R-01 | `<risk>` | H/M/L | H/M/L | `<mitigation>` | |
| R-02 | Implementation takes longer than estimated | M | M | Scope cut: defer `<items>` to v2 | |

---

## ⑪ Open Questions

Questions that must be resolved before or during implementation.

| ID | Question | Blocking? | Owner | Due | Status |
|----|---------|----------|-------|-----|--------|
| Q-01 | `<question>` | YES / NO | | | Open |

---

## ⑫ Sign-Off

| Role | Name | Decision | Date |
|------|------|---------|------|
| Eng Lead | | Approved / Changes Needed | |
| Security | | Approved / Not Required | |
| QA Lead | | Reviewed | |
