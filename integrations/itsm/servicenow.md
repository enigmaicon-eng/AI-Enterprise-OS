---
integration: ServiceNow
category: itsm
status: active
mcp-available: partial
connector-agent: mcp-integration-agent
source-of-truth: IT service management (incidents, changes, problems, CMDB)
data-classification: INTERNAL / CONFIDENTIAL
created: 2026-05-09
---

# ServiceNow Integration

> ServiceNow is the enterprise ITSM platform for IT incident management, change management, problem management, CMDB, and service catalog. The OS integrates bidirectionally: ingesting ITSM events (incidents, change requests, CMDB updates) to inform operational decisions, and publishing OS-generated records (incidents, change requests, problem analyses) back to ServiceNow. ServiceNow is the source of truth for ITSM record state.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent |
|-----------|---------|----------------|
| Incident created (P1/P2) | ServiceNow webhook (INC created) | incident-manager-agent |
| Change request approved | ServiceNow webhook (CHG state change) | devops-engineer-agent |
| Problem record created | ServiceNow webhook (PRB created) | incident-manager-agent |
| CMDB CI update | ServiceNow webhook (CMDB change) | enterprise-systems-agent |
| Service catalog request | ServiceNow webhook (RITM created) | enterprise-systems-agent |
| SLA breach alert | ServiceNow webhook (SLA breached) | incident-manager-agent |

**Ingestion pipeline:**
```
ServiceNow webhook → OS webhook endpoint (/integrations/servicenow/events)
  → HMAC-SHA256 signature validation
  → Event classified by type (INC / CHG / PRB / CMDB)
  → Routed to consuming agent via routing table
  → Agent processes event → updates OS state
  → Acknowledgment returned to ServiceNow
```

---

## 2. Publishing Workflows

| OS Event | ServiceNow Record | Publishing Agent | Record Type |
|----------|------------------|-----------------|-------------|
| P0/P1 incident declared | INC created | incident-manager-agent | Incident (P1) |
| Change required | CHG submitted | devops-engineer-agent | Change Request |
| Root cause identified | PRB updated | incident-manager-agent | Problem record |
| Post-incident review | PIR attached | incident-manager-agent | PIR document |
| Compliance audit item | CHG created | compliance-documentation-agent | Change Request |
| Infrastructure provision | RITM fulfilled | devops-engineer-agent | Service Request |
| Security vulnerability remediation | CHG submitted | security-engineer-agent | Emergency Change |

**Publication pipeline:**
```
OS agent decision → servicenow_create_record (Table API)
  → Idempotency check (correlation_id exists?)
  → ServiceNow Table API (REST v2) POST/PATCH
  → Record created → sys_id returned → stored in OS memory
  → Webhook confirmation received
  → audit log entry
```

---

## 3. Sync Systems

```yaml
sync:
  direction: bidirectional
  servicenow_wins: incident state, change approval state, SLA status
  os_wins: incident description content, root cause analysis, PIR content
  sync_mechanism: ServiceNow webhooks (inbound) + Table API (outbound)
  conflict_resolution: ServiceNow state fields win; OS narrative/content fields win
  correlation_key: OS correlation_id stored in ServiceNow work notes
  cmdb:
    sync_direction: ServiceNow CMDB → OS infrastructure inventory
    frequency: real-time (webhook) + daily full reconciliation
    os_role: read-only consumer of CMDB data
```

---

## 4. Permissions

```yaml
servicenow_permissions:
  auth_method: OAuth 2.0 (ServiceNow OAuth server) + Basic Auth fallback
  oauth_client_id: vault://integrations/servicenow/oauth-client-id
  oauth_client_secret: vault://integrations/servicenow/oauth-client-secret
  service_account: ai-os-integration@company.servicenow.com
  secret_path: vault://integrations/servicenow/credentials
  rotation: 90 days
  api_version: REST v2 (Table API)
  instance_url: stored in config (not hardcoded)
  permissions_granted:
    - incident_read: read all incidents
    - incident_write: create and update incidents
    - change_read: read change requests
    - change_write: create and submit change requests (cannot approve own changes)
    - problem_read: read problem records
    - problem_write: update problem records
    - cmdb_read: read CMDB CI records
    - cmdb_write: false  # CMDB writes require human operator
```

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Create incident record (P3/P4) | None (agent autonomous) |
| Create incident record (P1/P2) | None (but triggers H-014 escalation notification) |
| Submit normal change request | devops-engineer-agent review (CHG board approval in ServiceNow) |
| Submit emergency change | human operator + H-014 equivalent |
| Update CMDB CI record | Human operator (CMDB integrity protection) |
| Close incident record | None (agent autonomous per incident-manager-agent) |
| Major incident declaration (P1) | incident-manager-agent + H-014 |

---

## 6. Runtime Integration

```yaml
runtime:
  mcp_wrapper: servicenow-mcp-server (custom — built by connector-builder-agent)
  api: ServiceNow Table API v2 + Scripted REST API
  base_url: https://[instance].service-now.com/api/now/v2/table
  tools_available:
    - servicenow_create_record        # Create INC, CHG, PRB, RITM
    - servicenow_update_record        # Update existing record (sys_id)
    - servicenow_get_record           # Read record by sys_id
    - servicenow_query_table          # Query records with filters
    - servicenow_add_work_note        # Add work note to record
    - servicenow_attach_document      # Attach document to record
    - servicenow_get_cmdb_ci          # Read CMDB configuration item
    - servicenow_get_change_approval  # Check change approval status
  rate_limit: 3000 req/hr (ServiceNow SaaS default)
  timeout: 30s per request
  circuit_breaker: 5 failures/60s → open 120s
  idempotency: correlation_id checked in work notes before creating new record
  payload_format:
    incidents:
      short_description: "[AI OS] [agent-id]: [summary]"
      description: "OS-generated incident report"
      correlation_id: OS workflow execution ID
      category: application | infrastructure | security
      priority: 1 (Critical) | 2 (High) | 3 (Moderate) | 4 (Low)
```

---

## 7. Failure Handling

| Failure | Response |
|---------|----------|
| ServiceNow API unavailable | Queue records; retry with exponential backoff; alert enterprise-systems-agent |
| Authentication failure | Alert mcp-integration-agent; pause publishing; rotate credentials |
| Record creation fails (duplicate) | Check for existing record by correlation_id; update instead of create |
| CMDB sync fails | Log; use last known CMDB snapshot; alert enterprise-systems-agent |
| Webhook delivery fails | ServiceNow retry mechanism (3 retries); OS reconciliation job (hourly) |
| SLA breach missed | Alert incident-manager-agent; manual SLA check via servicenow_query_table |

---

## 8. Observability

```yaml
metrics:
  - servicenow_record_creation_rate    # target: > 99.5%
  - servicenow_api_latency_p95         # target: < 5s
  - servicenow_webhook_delivery_rate   # target: > 99%
  - incident_mttr_via_os               # OS-managed incidents vs baseline MTTR
  - change_request_approval_time       # target: < 4h for normal; < 1h for emergency
```

---

## 9. Rollback Systems

ServiceNow records are immutable history — no deletion. Rollback strategy:
1. Update record state (e.g., reopen closed incident)
2. Add work note documenting the correction
3. If emergency change deployed incorrectly → rollback procedure per change CAB
4. OS mirrors ServiceNow state after rollback

---

## 10. Audience Adaptation

ServiceNow record content is adapted per audience:
- Work notes (internal): technical detail, agent IDs, correlation IDs
- Short description (visible to all): plain language summary
- Post-incident review: executive summary + technical appendix per PIR template

---

## 11. Governance

```yaml
governance:
  data_classification: INTERNAL (incidents); CONFIDENTIAL (security incidents)
  cmdb_integrity:
    - CMDB writes blocked for OS agents — human operator only
    - OS reads CMDB for infrastructure context; does not modify
  change_management:
    - No emergency changes without H-014 equivalent approval
    - All changes traceable to OS workflow execution ID
  audit_integration: ServiceNow native audit log + OS audit log (both maintained)
  compliance_integration:
    - ServiceNow GRC module integration for compliance-documentation-agent
    - Audit evidence packages include ServiceNow record exports
```

---

## 12. Auditability

```yaml
audit:
  logged_per_operation:
    - agent_id: requesting agent
    - operation: create | update | query
    - table: incident | change_request | problem | cmdb_ci
    - sys_id: ServiceNow record ID
    - correlation_id: OS workflow execution ID
    - timestamp: ISO 8601
    - payload_hash: SHA-256 of submitted payload
    - result: success | failure
  log_path: memory/events/servicenow-audit.jsonl
  retention: 7 years (ITSM records for compliance)
  servicenow_native: ServiceNow audit logs supplement OS audit trail
```

---
