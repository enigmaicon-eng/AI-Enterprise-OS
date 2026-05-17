---
layer: observability
type: alert-definitions
version: 1.0.0
created: 2026-05-09
owner: analytics-agent
---

# Alert Definitions

Conditions that require immediate attention. Alerts are triggered by metric thresholds defined in `metrics.md`. Each alert has a severity, owner, escalation path, and required response.

---

## Severity Levels

| Level | Response Time | Who Acts |
|-------|--------------|---------|
| CRITICAL | Immediately | Human operator + security-agent |
| HIGH | Within 1 hour | Assigned agent owner |
| MEDIUM | Within 1 business day | Assigned agent owner |
| LOW | At next sprint review | Delivery-agent logs it |

---

## Production / AI Quality Alerts

### ALERT-001 — AI Quality Degradation
- **Condition:** A3 (7-day rolling eval score) drops > 10% below 30-day baseline
- **Severity:** HIGH
- **Owner:** analytics-agent
- **Response:**
  1. Halt new AI feature rollouts in affected scope
  2. analytics-agent produces quality degradation report
  3. Evaluate: model update, prompt change, or distribution shift as root cause
  4. If > 20% degradation → trigger ROLLBACK consideration
  5. Log in `incidents/` with classification AI-QUALITY

### ALERT-002 — Safety Filter Spike
- **Condition:** A4 (safety filter false positive rate) > 5% in any 24h window
- **Severity:** HIGH
- **Owner:** security-agent, analytics-agent
- **Response:**
  1. Review sample of filtered outputs to confirm false positive pattern
  2. security-agent assesses whether spike is safety regression or filter miscalibration
  3. If confirmed miscalibration → security-agent issues filter adjustment RFC
  4. Log in `incidents/` with classification AI-SAFETY

### ALERT-003 — Change Failure Rate Spike
- **Condition:** D3 (change failure rate) > 30% in any single sprint
- **Severity:** HIGH
- **Owner:** qa-agent, delivery-agent
- **Response:**
  1. Halt releases until root cause identified
  2. qa-agent reviews last 3 QA gate reports for pattern
  3. Delivery-agent produces incident summary
  4. Sprint retrospective must include failure rate as agenda item

---

## Governance Alerts

### ALERT-004 — Governance Bypass Detected
- **Condition:** Any workflow completes without passing its required gate
- **Severity:** CRITICAL
- **Owner:** supervisor-agent
- **Response:**
  1. Immediately flag the bypass to human operator
  2. Halt subsequent workflow steps that depend on the bypassed gate
  3. supervisor-agent produces bypass audit report
  4. Gate exception must be documented in `wiki/decisions/gate-exceptions.md`
  5. If security gate bypassed → security-agent full review before next release

### ALERT-005 — Blocking Question Age Exceeded
- **Condition:** Any question in `memory/open-questions.md` with priority `blocking` is open > 7 days
- **Severity:** HIGH
- **Owner:** orchestrator
- **Response:**
  1. Escalate to human operator with list of blocked workflows
  2. orchestrator refuses to initiate affected workflows until question resolved
  3. Document in sprint retrospective as organizational impediment

### ALERT-006 — ADR Coverage Gap
- **Condition:** L-tier engineering work begins without a linked ADR
- **Severity:** HIGH
- **Owner:** architect-agent
- **Response:**
  1. architect-agent blocks engineering-workflow step 1 until ADR is created
  2. If ADR creation is genuinely blocked → write a "pending" ADR with current state documented

### ALERT-007 — Secret Detected in Artifact
- **Condition:** Any artifact contains patterns matching: API keys, passwords, tokens, private keys, connection strings
- **Severity:** CRITICAL
- **Owner:** security-agent
- **Response:**
  1. Immediately flag artifact as BLOCKED
  2. Notify human operator to rotate the exposed credential
  3. security-agent audits handoff chain to identify propagation
  4. Artifact must be sanitized before any further use
  5. Log as security incident in `incidents/`

---

## Memory and Knowledge Health Alerts

### ALERT-008 — Memory Index Near Capacity
- **Condition:** MEMORY_INDEX.md approaches 180 lines (20 line buffer before 200-line truncation)
- **Severity:** MEDIUM
- **Owner:** orchestrator, architect-agent
- **Response:**
  1. Review MEMORY_INDEX for entries that can be archived or consolidated
  2. Assess whether vector store migration (Q-006) should be accelerated
  3. If consolidation insufficient → escalate Q-006 priority from Normal to High

### ALERT-009 — Wiki Rot Detected
- **Condition:** M3 (wiki coverage) falls below 80% OR any `updated` timestamp in wiki/ is > 60 days old
- **Severity:** MEDIUM
- **Owner:** docs-agent
- **Response:**
  1. docs-agent runs wiki-maintenance workflow
  2. Identify which workflows lack wiki pages
  3. Create stubs with current-date update marker
  4. Schedule full wiki audit in next sprint

### ALERT-010 — Risk Registry Overdue
- **Condition:** Any risk in `memory/known-risks.md` is past its review date
- **Severity:** LOW (MEDIUM if the risk level is HIGH or CRITICAL)
- **Owner:** delivery-agent
- **Response:**
  1. delivery-agent reviews overdue risk during next sprint planning
  2. Re-evaluate probability and impact
  3. Update review date and mitigation status
  4. If risk has materialized → trigger `!incident`

---

## Alert Triage Protocol

When an alert fires:

```
1. Identify the alert ID and severity
2. Read the Response procedure above
3. Assign the alert to the specified owner
4. Create an entry in the active incident/alert log
5. Follow response steps in order
6. Close alert when resolution criteria met
7. If alert fires again within 30 days → root cause analysis required
```

---

## Alert Log Location

Active alerts are tracked in `wiki/operations/active-alerts.md` (create if not exists).
Resolved alerts are archived in `wiki/operations/alert-history.md`.
