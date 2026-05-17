---
integration: Workday
category: erp
status: active
mcp-available: no
connector-agent: enterprise-systems-agent
source-of-truth: headcount, organizational structure, compensation, requisitions, HR master data
data-classification: RESTRICTED
created: 2026-05-10
---

# Workday Integration

> Workday is the HCM (Human Capital Management) system of record for headcount, organizational hierarchy, compensation, job requisitions, and HR lifecycle data. The OS reads team headcount, org structure, open requisitions, and termination feeds from Workday via REST API and RaaS (Reports-as-a-Service). All read operations are anonymized — compensation and personal PII are NOT accessible to OS agents. Workday write operations are BLOCKED for OS agents; HR workflows execute exclusively within Workday itself.

---

## 1. Ingestion Workflows

**What flows from Workday → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Active headcount by department | RaaS: AIOS_Active_Headcount | delivery-manager-agent | Daily |
| Org hierarchy (manager chain) | Workday REST: /workers | delivery-manager-agent | Weekly |
| Open requisitions by team | RaaS: AIOS_Open_Requisitions | delivery-manager-agent | Daily |
| Cost center hierarchy | RaaS: AIOS_Cost_Center_Hierarchy | analytics-agent | Weekly |
| New hire start dates (anonymized) | RaaS: AIOS_Termination_Feed | delivery-manager-agent | Daily |
| Termination feed (anonymized) | RaaS: AIOS_Termination_Feed | delivery-manager-agent | Daily |
| Budget vs. actual headcount | RaaS: AIOS_Budget_vs_Actual | analytics-agent | Monthly |
| OOO / leave status | Workday Absence API | delivery-manager-agent | Daily |

**Ingestion Protocol:**
```yaml
workday_ingestion:
  trigger: scheduled batch (Workday does not support real-time webhooks for HR data)
  auth: OAuth 2.0 client credentials (Workday ISU — Integration System User)
  isu_name: AI_OS_ISU
  api_methods:
    rest_api: Workday REST API v1 (https://tenant.workday.com/api/v1/)
    raas: Workday RaaS (Reports-as-a-Service) — GET custom report URLs
    soap: Workday Web Services (SOAP, for legacy report types)
  raas_reports:
    AIOS_Active_Headcount:
      url: https://services1.myworkday.com/ccx/service/customreport2/{tenant}/AI_OS_ISU/AIOS_Active_Headcount
      fields: [worker_id_hash, department, job_family, location, status]
    AIOS_Open_Requisitions:
      url: .../AIOS_Open_Requisitions
      fields: [req_id, department, job_family, target_start, status]
    AIOS_Cost_Center_Hierarchy:
      url: .../AIOS_Cost_Center_Hierarchy
      fields: [cost_center_id, parent_id, name, manager_id_hash]
    AIOS_Termination_Feed:
      url: .../AIOS_Termination_Feed
      fields: [worker_id_hash, effective_date, department, reason_category]
    AIOS_Budget_vs_Actual:
      url: .../AIOS_Budget_vs_Actual
      fields: [cost_center_id, budget_hc, actual_hc, open_reqs, variance]
  transformations:
    - hash worker_id → anonymized_worker_id (SHA-256 + salt)
    - aggregate headcount by department (no individual records in OS)
    - map Workday org structure → OS team capacity model
    - strip all PII fields (name, SSN, salary, address, DOB) before OS storage
    - classify new hire / termination as delta event (anonymized)
  destination: event-bus topic `integration.workday.hr`
  error_handling: retry x3, dead-letter queue, alert enterprise-systems-agent
```

---

## 2. Publishing Workflows

**What flows from OS → Workday:**

| OS Artifact | Workday Destination | Publishing Agent | Trigger | Gate |
|-------------|--------------------|-----------------|---------| -----|
| None | — | — | — | BLOCKED |

**Publishing Protocol:**
```yaml
workday_publish:
  status: BLOCKED — no OS writes to Workday permitted
  policy: >
    Workday is the HR system of record. All data modifications (new hires,
    terminations, compensation changes, org structure updates) are performed
    exclusively by HR personnel within Workday workflows.
    No OS agent may write to Workday under any circumstances.
    This restriction is absolute and applies to all agents and all conditions.
  rationale: >
    HR data modifications carry legal, regulatory, and employee relations risk.
    Compensation and employment status changes require human HR judgment.
    SOX and GDPR compliance require human authorization for HR data changes.
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-Workday | Workday-to-OS | Conflict Resolution |
|-------|--------------|--------------|---------------------|
| Headcount | BLOCKED | Workday → OS capacity model | Workday always wins |
| Org structure | BLOCKED | Workday hierarchy → OS team map | Workday always wins |
| Requisitions | BLOCKED | Workday reqs → OS delivery forecast | Workday always wins |
| Cost centers | BLOCKED | Workday hierarchy → OS cost model | Workday always wins |
| Compensation | BLOCKED | Not ingested (RESTRICTED) | N/A — never accessed |

**Sync frequency:** Daily for headcount/requisitions/terminations. Weekly for org hierarchy and cost centers. Monthly for budget vs. actual headcount.

**Source-of-truth designator:** Workday is the absolute source of truth for all HR data. The OS uses Workday data to model team capacity and delivery forecasting only. No HR data is stored in OS memory beyond aggregated, anonymized team-level counts.

---

## 4. Permissions

```yaml
workday_permissions:
  auth_method: OAuth 2.0 (Workday ISU — Integration System User)
  isu_name: AI_OS_ISU
  isu_security_groups:
    - AI_OS_Report_Reader (custom security group)
    - Report_Only (standard Workday security group)
  domain_permissions_granted:
    - Worker Data: Worker Profile and Compensation (compensation: VIEW restricted)
    - Worker Data: Current Staffing Information (READ)
    - Recruiting: Job Requisitions (READ)
    - Organization: Cost Centers (READ)
  blocked_domains:
    - Worker Data: Compensation (salary amounts, grades — BLOCKED for AI_OS_ISU)
    - Worker Data: Personal Information (SSN, DOB, address — BLOCKED)
    - Worker Data: Banking Information (BLOCKED)
    - Benefits: All (BLOCKED)
    - Payroll: All (BLOCKED)
  raas_access: custom report URLs scoped to AI_OS_ISU security group
  pii_masking:
    production: full masking (hashed worker_id only)
    non_production: Workday tenant separate from production (no real data)
  secret_path: vault://integrations/workday/isu-credentials
  rotation: 90 days
```

**Agent authorization matrix:**

| Agent | Workday Permission | Operations |
|-------|-------------------|------------|
| delivery-manager-agent | RaaS read (headcount, reqs, OOO) | Read team capacity, open reqs, leave |
| analytics-agent | RaaS read (cost centers, budget vs. actual) | Read org cost model, headcount trends |
| compliance-documentation-agent | RaaS read (anonymized) | Headcount for compliance evidence |
| All others | None | No Workday access |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Read anonymized headcount (RaaS) | None (agent autonomous) | — |
| Read open requisitions (RaaS) | None (agent autonomous) | — |
| Read org hierarchy (REST API) | None (agent autonomous) | — |
| Read OOO / leave data (anonymized) | None (agent autonomous) | — |
| Access compensation data | BLOCKED — not permitted | N/A |
| Access personal PII (name, SSN, DOB) | BLOCKED — not permitted | N/A |
| Write to Workday | BLOCKED — not permitted | N/A |
| Add new RaaS report to ingestion | Human operator + HR approval | H-015 |
| Create new ISU or security group | HR system admin + Human operator | H-009 |
| Export Workday data to external system | Human operator + HR director | H-023 |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: Workday REST API v1 (HTTPS) + RaaS (HTTPS custom report URLs)
  mcp_server: none (direct HTTP client)
  tools_available:
    - workday_raas_query (execute custom RaaS report)
    - workday_rest_get_workers (paginated worker list — anonymized)
    - workday_get_org_hierarchy (manager chain)
    - workday_get_requisitions (open reqs by department)
    - workday_get_leave_status (anonymized OOO)
  connection_pool: 3 connections max
  timeout: 30s per API call (RaaS: 120s for large reports)
  retry_policy: exponential backoff (5s, 10s, 20s), max 3 retries
  circuit_breaker:
    threshold: 3 failures in 60s
    open_duration: 300s
    half_open_probe: 1 request per 120s
    fallback: serve last cached headcount snapshot (< 24h); alert enterprise-systems-agent
  pagination: Workday REST API uses offset-based pagination (limit: 100 per page)
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| Auth token expired | 401 response | Re-authenticate via OAuth 2.0 | Automated token refresh |
| RaaS report timeout | Response > 120s | Retry with smaller date range | Alert analytics-agent |
| Workday maintenance window | 503 + Workday maintenance page | Serve cached snapshot; suspend ingestion | Auto-resume after maintenance window |
| ISU account locked | 401 with ACCOUNT_LOCKED error | Alert enterprise-systems-agent immediately | HR admin unlocks ISU account |
| RaaS report changed/deleted | 404 on report URL | Alert enterprise-systems-agent | HR admin restores report or update config |
| Quota exceeded | 429 response | Queue remaining requests; wait 1 hour | Spread ingestion over 24h window |

**Degraded mode:** If Workday unavailable > 30 min, OS serves last cached headcount at `memory/snapshots/workday-headcount-cache.json` (max 24h). All delivery planning notes use cached data with staleness warning. Auto-resume on Workday recovery. Cache age logged in every delivery forecast generated during degraded mode.

---

## 8. Observability

```yaml
observability:
  metrics:
    - workday_raas_success_rate:        target: "> 98%"
    - workday_api_p95_latency:          target: "< 10s"
    - workday_circuit_breaker_trips:    target: "0 per week"
    - workday_cache_staleness:          target: "< 24h"
    - workday_headcount_freshness:      target: "daily update within 30 min of schedule"
    - workday_pii_access_violations:    target: "0 (alert immediately)"
  alerts:
    - condition: "pii_access_violation detected"
      severity: CRITICAL
      notify: [compliance-documentation-agent, enterprise-systems-agent]
      action: halt_all_workday_ingestion
    - condition: "raas_success_rate < 95%"
      severity: HIGH
      notify: [enterprise-systems-agent, delivery-manager-agent]
    - condition: "cache_staleness > 24h"
      severity: HIGH
      notify: [delivery-manager-agent, analytics-agent]
    - condition: "circuit_breaker = OPEN"
      severity: HIGH
      notify: [enterprise-systems-agent]
  health_check:
    method: GET /api/v1/workers?limit=1 (minimal read)
    frequency: every 15 minutes
    timeout: 10s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Stale headcount cache | Force re-ingestion from Workday | delivery-manager-agent | Anytime |
| Incorrectly anonymized data in OS | Delete from OS memory; re-ingest with correct masking | compliance-documentation-agent + human | Immediate |
| Wrong RaaS report ingested | Remove from event bus; re-ingest from correct report | enterprise-systems-agent | Anytime |
| Workday data in OS memory beyond policy | DSAR process — compliance-documentation-agent | compliance-documentation-agent | Per GDPR timelines |

**Rollback guarantee:** OS stores only anonymized, aggregated HR data. Individual records are never persisted. All ingestion events logged to `memory/events/workday-audit.jsonl` with report name, field list, row count (not content). PII incidents trigger immediate halt and compliance escalation.

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| Delivery managers | Capacity report | Team headcount, open reqs, OOO by department |
| Engineering managers | Team snapshot | Headcount vs. plan, requisition status |
| Analytics team | Headcount trend | Monthly headcount by org, req fill rate |
| Executives | Org health summary | Total headcount, open reqs, attrition rate |
| Compliance | HR audit evidence | Anonymized headcount counts, process verification |

audience-transformation-agent applies EXECUTIVE profile to strip org structure detail and COMPLIANCE profile to format HR data per audit requirements. No individual employee data appears in any OS-generated output.

---

## 11. Governance

```yaml
governance:
  data_classification: RESTRICTED
  pii_handling: >
    Workday contains highly sensitive PII: names, SSNs, salary, DOB, address, banking.
    OS agents access ONLY anonymized, aggregated data via scoped RaaS reports.
    worker_id hashed with SHA-256 + tenant-specific salt before OS storage.
    Salary, SSN, banking, personal address: BLOCKED — never accessible to OS.
    All Workday data in OS memory is team-level aggregates only.
    GDPR right-to-erasure: if Workday data included in OS memory, DSAR process applies.
  retention_policy:
    workday_audit_log: 7 years (HR compliance requirement)
    headcount_cache: 24 hours (auto-purge)
    org_snapshot: 90 days (planning purposes)
  access_review: quarterly (ISU permissions, RaaS report scope — HR admin + compliance)
  data_residency: Workday tenant region (confirm H-003; must align with employee data sovereignty)
  compliance_requirements:
    - GDPR: employee data handling, right to erasure, data minimization principle
    - SOX: headcount and cost center data for financial reporting
    - ISO_27001: access control for RESTRICTED HR data
    - CCPA: California employee privacy rights
  pii_masking_in_non_prod: >
    Non-production environments must use synthetic Workday data.
    Real employee data MUST NOT be loaded into staging or development environments.
    Workday production tenant separated from all non-production OS environments.
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every RaaS report execution (report_name, row_count, fields_requested, agent, timestamp)
    - Every REST API call (endpoint, method, result_count, agent)
    - Every anonymization operation (input_type, output_type, salt_version)
    - Every cache read during degraded mode (cache_age, agent, report_type)
    - Every circuit breaker state change
    - Every PII access attempt — including blocked attempts (field_name, agent, result: BLOCKED)
    - Every ISU credential use (operation, timestamp, result)
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/workday-audit.jsonl
  retention: 7 years (HR compliance requirement)
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent identifier
    isu_identifier: AI_OS_ISU
    operation: RAAS_QUERY | REST_GET | CACHE_READ | PII_BLOCK
    report_or_endpoint: RaaS report name or REST path
    row_count: number of records returned (not content)
    pii_fields_accessed: [] (empty — PII access always blocked)
    result: success | failure | blocked | cache_served
    correlation_id: OS workflow execution ID
```
