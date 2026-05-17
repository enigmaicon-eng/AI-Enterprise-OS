---
integration: SAP
category: erp
status: active
mcp-available: no
connector-agent: enterprise-systems-agent
source-of-truth: financial records, procurement data, cost center hierarchy, ERP master data
data-classification: RESTRICTED
created: 2026-05-10
---

# SAP Integration

> SAP is the enterprise resource planning system of record for financial data, procurement, cost centers, and supply chain. The OS reads financial summaries, cost center hierarchies, purchase orders, and vendor master data from SAP via RFC/BAPI, OData, and IDoc interfaces. All SAP write operations require a ServiceNow Change Request with CAB approval — NO autonomous SAP writes are permitted. Financial and compensation data classified RESTRICTED. SAP integration uses dedicated technical users (`S_AIOS_{FUNCTION}` naming convention) with minimal authorization objects.

---

## 1. Ingestion Workflows

**What flows from SAP → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Cost center hierarchy | RFC/BAPI call | analytics-agent | Daily |
| Monthly financial summary (P&L) | OData query → BW/BEX report | analytics-agent | Monthly |
| Purchase order status | OData: /sap/opu/odata/sap/MM_PO_Q_SRVC | risk-management-agent | Daily |
| Vendor master data | RFC: BAPI_VENDOR_GETLIST | risk-management-agent | Weekly |
| Budget vs. actual | BW InfoProvider query | analytics-agent | Monthly |
| Open goods receipts | OData: MM_GR_Q_SRVC | risk-management-agent | Daily |
| Invoice processing status | OData: /AP_Q_SRVC | analytics-agent | Daily |
| Material master (key items) | RFC: BAPI_MATERIAL_GET_ALL | risk-management-agent | Weekly |

**Ingestion Protocol:**
```yaml
sap_ingestion:
  trigger: scheduled batch (no real-time SAP webhooks in standard configuration)
  auth:
    rfc_bapi: SAP technical user + password (R/3 authentication)
    odata: Basic auth over HTTPS (SAP Gateway)
    btp_integration: OAuth 2.0 client credentials (SAP BTP Integration Suite)
  connection:
    rfc: SAP JCo connector (port 3300/33NN, message server)
    odata: HTTPS REST (SAP Gateway, port 443)
    idoc: SAP ALE/IDOC port (when used)
  technical_user_naming: S_AIOS_{FUNCTION}
  authorization_objects:
    S_RFC: RFC function group access
    S_SERVICE: OData service access
    S_TABU_DIS: table display authorization
  transformations:
    - map SAP cost center codes → OS cost center taxonomy
    - extract P&L line items → OS financial metrics schema
    - parse BAPI return structure → OS data model
    - strip PII (employee numbers → anonymized IDs before OS storage)
  destination: event-bus topic `integration.sap.financial`
  error_handling: retry x3 with connection reset; dead-letter queue; alert enterprise-systems-agent
```

---

## 2. Publishing Workflows

**What flows from OS → SAP:**

| OS Artifact | SAP Destination | Publishing Agent | Trigger | Gate |
|-------------|----------------|-----------------|---------|------|
| None (read-only default) | — | — | — | — |
| Budget commentary annotation | SAP PS: Project System note (future) | analytics-agent | Quarterly review | Change Request + CAB |
| Vendor performance flag | SAP MM: Vendor evaluation update (future) | risk-management-agent | Vendor review cycle | Change Request + CAB |

**Publishing Protocol:**
```yaml
sap_publish:
  status: READ-ONLY (no write operations in current implementation)
  write_gate: >
    ALL SAP write operations require ServiceNow Change Request with
    CAB (Change Advisory Board) approval before execution.
    No SAP writes may be performed autonomously by any OS agent.
    Change Request must reference specific BAPI/OData operation, target object,
    data payload hash, business justification, and rollback procedure.
  future_write_operations:
    method: SAP OData PATCH/POST or RFC/BAPI create/update functions
    auth: SAP technical user with extended authorization objects
    pre_conditions:
      - ServiceNow Change Request in state Approved
      - CAB review completed
      - OS agent cites Change Request ID in audit log
      - Rollback procedure documented and tested in SAP sandbox
  secret_path: vault://integrations/sap/technical-user-credentials
  rotation: 90 days
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-SAP | SAP-to-OS | Conflict Resolution |
|-------|----------|----------|---------------------|
| Financial data | Not written by OS | SAP → OS financial metrics | SAP always wins (ERP is authoritative) |
| Cost centers | Not written by OS | SAP hierarchy → OS cost model | SAP always wins |
| Purchase orders | Not written by OS | PO status → OS procurement report | SAP always wins |
| Vendor master | Not written by OS | Vendor data → OS risk registry | SAP always wins |

**Sync frequency:** Daily batch for operational data (cost centers, PO status). Monthly for financial summaries. Weekly for vendor/material master. No real-time streaming in standard SAP configuration (IDoc-based near-real-time available with additional configuration).

**Source-of-truth designator:** SAP is the absolute source of truth for all financial, procurement, and ERP master data. The OS treats all SAP data as read-only ground truth. No OS-generated data overrides SAP records.

---

## 4. Permissions

```yaml
sap_permissions:
  auth_method: SAP technical user (Basic auth for OData; JCo user for RFC)
  technical_users:
    S_AIOS_FIN:
      purpose: Financial data read (cost centers, P&L)
      authorization_objects:
        - S_SERVICE: FI OData services
        - S_TABU_DIS: T001 (company codes), T009 (fiscal year)
        - F_BKPF_AK: Display financial documents
    S_AIOS_MM:
      purpose: Materials management read (PO, GR, vendor)
      authorization_objects:
        - S_SERVICE: MM OData services (MM_PO_Q_SRVC, MM_GR_Q_SRVC)
        - M_EINK_EKO: Purchase order display
        - M_LFM1_EKO: Vendor master display
    S_AIOS_RPT:
      purpose: BW/BEx report extraction
      authorization_objects:
        - S_RS_COMP: BW query component access
        - S_RS_HIER: BW hierarchy access
  blocked_operations:
    - FB50 (post journal entry)
    - ME21N (create purchase order)
    - XK01 (create vendor master)
    - any write transaction without Change Request
  data_classification_enforcement:
    compensation_data: RESTRICTED — not accessible via S_AIOS users
    banking_data: RESTRICTED — not accessible via S_AIOS users
    cost_center_data: CONFIDENTIAL — accessible with S_AIOS_FIN
  secret_path: vault://integrations/sap/technical-user-credentials
  rotation: 90 days (enforced via SAP SU01)
```

**Agent authorization matrix:**

| Agent | SAP Permission | Operations |
|-------|---------------|------------|
| analytics-agent | FIN + RPT read | Financial summaries, cost center data, BW reports |
| risk-management-agent | MM read | PO status, vendor master, goods receipts |
| compliance-documentation-agent | FIN read (audit mode) | Financial audit data for compliance evidence |
| All others | None | No SAP access |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Read financial data (S_AIOS_FIN) | None (agent autonomous) | — |
| Read procurement data (S_AIOS_MM) | None (agent autonomous) | — |
| Read BW/BEx reports (S_AIOS_RPT) | None (agent autonomous) | — |
| Any SAP write operation | ServiceNow Change Request + CAB | H-001 (change) + external CAB |
| Create new S_AIOS technical user | SAP Basis admin + Human operator | H-009 |
| Add authorization object to S_AIOS user | SAP Basis admin + Human operator | H-009 |
| Export SAP data to external system | Human operator + data classification review | H-023 |
| Access compensation/banking data | BLOCKED — not available to OS agents | N/A |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: SAP JCo (RFC, port 3300) + OData REST (HTTPS, SAP Gateway) + BTP Integration Suite
  mcp_server: none (custom SAP connector via JCo or HTTP client)
  tools_available:
    - sap_odata_query (OData GET requests)
    - sap_rfc_call (RFC/BAPI function calls)
    - sap_bw_query (BW/BEx report extraction)
    - sap_idoc_receive (incoming IDoc processing)
  connection_pool: 3 connections max (JCo pool)
  timeout: 30s per RFC call (BW reports: 120s)
  retry_policy: exponential backoff (5s, 10s, 20s), max 3 retries (longer for RFC stability)
  circuit_breaker:
    threshold: 3 failures in 60s
    open_duration: 300s (5 min — SAP connection resets slowly)
    half_open_probe: 1 request per 120s
    fallback: serve last cached financial snapshot (< 24h); alert enterprise-systems-agent
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| SAP connection refused (RFC) | JCo exception: CONNECTION_FAILURE | Alert enterprise-systems-agent; serve cache | SAP Basis investigation |
| Auth failure | RFC: NOT_AUTHORIZED | Halt all SAP calls; alert enterprise-systems-agent | Credential rotation via Vault |
| BAPI return error | RETURN table type: E (Error) | Log BAPI error message; alert | Human review of BAPI parameters |
| OData query timeout | HTTP timeout > 30s | Retry x3; fall back to RFC equivalent | Reduce query scope or use RFC |
| BW report timeout | Response > 120s | Retry with narrower selection | Reduce query scope; pre-aggregate in BW |
| SAP system maintenance | Connection refused (planned) | Serve cached data; suspend ingestion | Auto-resume after maintenance window |

**Degraded mode:** If SAP unavailable > 30 min, OS serves last cached financial snapshot stored at `memory/snapshots/sap-financial-cache.json` (max 24h old). Analytics-agent and risk-management-agent notified. All scheduled SAP ingestion suspended until reconnection. Cache staleness logged in every report generated during degraded mode.

---

## 8. Observability

```yaml
observability:
  metrics:
    - sap_ingestion_success_rate:       target: "> 98%"
    - sap_rfc_p95_latency:              target: "< 10s"
    - sap_odata_p95_latency:            target: "< 5s"
    - sap_circuit_breaker_trips:        target: "0 per week"
    - sap_cache_staleness:              target: "< 24h"
    - sap_data_freshness:               target: "within scheduled batch window"
  alerts:
    - condition: "ingestion_success_rate < 95%"
      severity: HIGH
      notify: [analytics-agent, enterprise-systems-agent]
    - condition: "circuit_breaker = OPEN"
      severity: HIGH
      notify: [enterprise-systems-agent]
    - condition: "cache_staleness > 24h"
      severity: HIGH
      notify: [analytics-agent]
      action: alert_data_freshness_risk
  health_check:
    method: RFC ping (RFC_PING function module)
    frequency: every 15 minutes
    timeout: 10s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Cached snapshot (stale) | Clear cache; force re-ingestion from SAP | analytics-agent | Anytime |
| Incorrect data classification (report) | Recall report; re-generate with correct data | analytics-agent + human | Immediate |
| SAP technical user misconfigured | Revert authorization objects via SU01 | SAP Basis + human | Immediate |
| SAP write (if ever approved) | SAP rollback procedure per Change Request | SAP Basis + Change Request | Per CAB rollback window |

**Rollback guarantee:** OS only reads from SAP — no data modification to roll back under normal operations. All SAP write operations (future, gated) require documented rollback procedure in the Change Request before CAB approval. Financial data snapshots versioned with ingestion timestamp.

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| Finance team | P&L summary | SAP account structure with GL codes; budget vs. actual |
| Executives | Financial scorecard | Revenue, EBITDA, cost variance — no SAP codes |
| Engineering managers | Cost center report | Team-level cost allocation; headcount cost |
| Procurement | PO status report | Vendor, PO number, delivery date, open value |
| Compliance | Financial audit extract | SAP document numbers, posting dates, control references |

audience-transformation-agent applies FINANCE profile for GL-code-level reports and EXEC profile for executive financial summaries. SAP codes and transaction IDs stripped from executive outputs.

---

## 11. Governance

```yaml
governance:
  data_classification: RESTRICTED
  pii_handling: >
    SAP contains employee numbers, vendor banking details, compensation data.
    RESTRICTED data (compensation, banking) not accessible via OS S_AIOS technical users.
    Employee numbers anonymized before storage in OS memory.
    Vendor banking data never extracted by OS agents.
    Financial data access logged in full audit trail.
  retention_policy:
    financial_audit_log: 7 years (SOX requirement)
    ingestion_log: 3 years
    sap_cache: 24 hours (auto-purge)
  access_review: quarterly (S_AIOS user authorization review, SAP Basis + compliance)
  data_residency: SAP system region (on-premises or SAP Cloud — confirm H-003)
  compliance_requirements:
    - SOX: financial data read audit trail required
    - GDPR: vendor/employee data handling, right to erasure
    - ISO_27001: access control, change management for SAP writes
    - SAP_GRC: authorization object review via SAP GRC (if deployed)
  write_policy: >
    ABSOLUTE: No OS agent may write to SAP without an approved ServiceNow Change Request
    and CAB sign-off. This governance rule cannot be overridden by any agent
    or workflow, including in P0 incident scenarios. SAP is the financial system
    of record — unauthorized writes carry audit and regulatory risk.
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every SAP query (technical_user, function_module or OData endpoint, result_count, timestamp)
    - Every BW report extraction (query_name, selection_fields, row_count, agent)
    - Every auth failure (technical_user, function_module, error_code)
    - Every cache hit during degraded mode (cache_age, agent, report_requested)
    - Every circuit breaker state change
    - Every SAP maintenance window detection
    - Every export of SAP data to OS memory (data_type, classification, row_count)
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/sap-audit.jsonl
  retention: 7 years (SOX financial audit requirement)
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent identifier
    technical_user: S_AIOS_{FUNCTION} identifier
    operation: RFC_CALL | ODATA_GET | BW_QUERY | CACHE_READ
    target: function_module or OData service name
    result_count: number of records returned
    data_classification: RESTRICTED | CONFIDENTIAL | INTERNAL
    result: success | failure | cache_served
    correlation_id: OS workflow execution ID
```
