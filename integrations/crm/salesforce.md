---
integration: Salesforce
category: crm
status: active
mcp-available: partial
connector-agent: mcp-integration-agent
source-of-truth: customer relationship management (accounts, contacts, opportunities, cases)
data-classification: CONFIDENTIAL (customer data)
created: 2026-05-09
---

# Salesforce Integration

> Salesforce is the enterprise CRM — authoritative source for customer accounts, contacts, opportunities, cases, and revenue pipeline. The OS integrates with Salesforce to: ingest customer data for product intelligence and escalation handling, publish OS-generated customer communications and case updates, and sync opportunity data for financial modeling. Salesforce is source of truth for all customer relationship data.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent |
|-----------|---------|----------------|
| Customer escalation case | Salesforce webhook (Case created HIGH+) | escalation-response-agent |
| Opportunity stage change | Salesforce webhook (Opp stage updated) | financial-modeling-agent |
| New account created | Salesforce webhook (Account created) | customer-intelligence-agent |
| Churn risk signal | Salesforce webhook (Health score drops) | customer-intelligence-agent |
| Contract renewal due | Salesforce scheduled (30/60/90 day) | business-analyst-agent |
| Support case resolved | Salesforce webhook (Case closed) | customer-intelligence-agent |

**Ingestion pipeline:**
```
Salesforce Platform Event / webhook → OS endpoint (/integrations/salesforce/events)
  → HMAC-SHA256 signature validation
  → Event classified by object type (Case / Opportunity / Account)
  → Routed to consuming agent via routing table
  → Agent processes event → updates OS customer intelligence
  → Acknowledgment returned
  → audit log entry (customer data access logged)
```

---

## 2. Publishing Workflows

| OS Artifact | Salesforce Target | Publishing Agent | Operation |
|-------------|------------------|-----------------|-----------|
| Case resolution notes | Case.Description + Activity | escalation-response-agent | PATCH |
| Product feedback digest | Account.Activity log | customer-intelligence-agent | POST |
| Escalation timeline | Case.Activity | escalation-response-agent | POST |
| Contract renewal analysis | Opportunity.Description | business-analyst-agent | PATCH |
| Customer health report | Account.Custom field | customer-intelligence-agent | PATCH |

**Publication pipeline:**
```
OS agent decision
  → salesforce_upsert_record (Salesforce REST API)
  → External ID deduplication check
  → Salesforce REST API v58 PATCH/POST
  → Record updated → confirmation received
  → audit log entry
```

---

## 3. Sync Systems

```yaml
sync:
  direction: bidirectional (Salesforce → OS for CRM data; OS → Salesforce for activity logs)
  salesforce_wins: account, contact, opportunity, case data
  os_wins: activity log content, analysis narratives, escalation timelines
  platform_events:
    mechanism: Salesforce Platform Events → OS webhook subscriber
    real_time: true
    replay_id: tracked for at-least-once delivery guarantee
  scheduled_sync:
    - Opportunity pipeline: daily extract (financial modeling)
    - Customer health: weekly aggregate (customer-intelligence-agent)
```

---

## 4. Permissions

```yaml
salesforce_permissions:
  auth_method: OAuth 2.0 JWT Bearer Flow (server-to-server; no user interaction)
  connected_app: AI OS Integration (Salesforce Connected App)
  private_key: vault://integrations/salesforce/jwt-private-key
  consumer_key: vault://integrations/salesforce/consumer-key
  secret_path: vault://integrations/salesforce/credentials
  rotation: 90 days (JWT key rotation)
  api_version: v58.0 (REST API)
  instance_url: stored in config
  permissions_granted:
    api: true
    read_on: Account, Contact, Opportunity, Case, Lead, Product
    write_on: Case (activity), Account (custom fields), Activity (log)
    restricted:
      - Contact.Email: hashed in OS logs (privacy)
      - Financial data (ACV, ARR): RESTRICTED classification
      - Personal health data (if applicable): blocked without H-025
```

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Read Account / Opportunity data | None (agent autonomous per schedule) |
| Read Case data for escalation | None (escalation-response-agent) |
| Update Case activity log | None (agent autonomous) |
| Update Opportunity (financial data) | financial-modeling-agent review |
| Bulk update > 100 records | Human operator review |
| Access Contact personal data (PII) | H-025 + human operator |
| Delete Salesforce record | Human operator only (blocked for OS agents) |

---

## 6. Runtime Integration

```yaml
runtime:
  connector: simple-salesforce (Python) + Salesforce REST API
  mcp_wrapper: salesforce-mcp-server (custom — built by connector-builder-agent)
  tools_available:
    - salesforce_query               # SOQL query (parameterized)
    - salesforce_get_record          # Read single record by ID
    - salesforce_create_record       # Create new record
    - salesforce_update_record       # PATCH existing record
    - salesforce_upsert_record       # Upsert by external ID
    - salesforce_bulk_query          # Bulk API 2.0 for large datasets
    - salesforce_subscribe_events    # Subscribe to Platform Events
  soql_standards:
    parameterized_only: true          # NEVER string interpolation
    select_limit: 200 records default
    bulk_threshold: > 2000 records → use Bulk API 2.0
  rate_limit:
    rest_api: 100,000 req/24h (standard Salesforce limit)
    bulk_api: 15,000 batches/24h
  circuit_breaker: 5 failures/60s → open 120s
  idempotency: External ID field (OS_Correlation_ID__c) on all OS-written records
```

---

## 7. Failure Handling

| Failure | Response |
|---------|----------|
| Salesforce API unavailable | Queue operations; retry; alert enterprise-systems-agent |
| Authentication failure (JWT) | Alert mcp-integration-agent; rotate JWT key; pause CRM workflows |
| SOQL query fails | Log; validate query; retry; alert requesting agent |
| Platform Event replay gap | Use Replay ID to re-subscribe; log missed events |
| Bulk API fails | Split into smaller batches; retry; alert if > 3 consecutive failures |
| Record lock (concurrent edit) | Retry after 5s; if > 3 retries, alert requesting agent |

---

## 8. Observability

```yaml
metrics:
  - salesforce_api_success_rate       # target: > 99.5%
  - salesforce_api_latency_p95        # target: < 3s
  - platform_event_delivery_rate      # target: > 99.9%
  - customer_data_freshness           # target: < 4h lag for critical customer events
  - salesforce_credit_usage           # target: < 80% of daily API limit
```

---

## 9. Rollback Systems

Salesforce native audit trail: field history tracking + Recycle Bin (15 days). If OS writes incorrect data:
1. Retrieve previous value from field history
2. salesforce_update_record (restore previous value)
3. Log correction in activity log with OS agent ID
4. Document rollback in OS audit log

---

## 10. Audience Adaptation

Salesforce data is adapted before publishing to OS artifacts:
- Executive: pipeline value, win rate, churn rate (aggregated)
- Sales: individual opportunity details, account health
- Customer Success: case resolution trends, satisfaction scores
- Finance: ACV/ARR pipeline, renewal forecasts

---

## 11. Governance

```yaml
governance:
  data_classification: CONFIDENTIAL (all CRM data)
  pii_handling:
    - Contact email/phone: SHA-256 hashed in OS logs; raw accessible only with H-025
    - Customer PII never included in Slack/Teams messages
    - Customer data in DOCX/PDF requires data classification label
  financial_data:
    - Opportunity ACV/ARR: RESTRICTED until disclosed
    - Access logged per H-022 for financial forecast data
  data_residency: Salesforce org region (confirm with H-003)
  prohibited:
    - Raw customer contact data in unencrypted channels
    - Opportunity financial data without RESTRICTED classification
    - Salesforce record deletion by OS agents
```

---

## 12. Auditability

```yaml
audit:
  logged_per_operation:
    - agent_id: requesting agent
    - operation: query | read | create | update | upsert
    - object: Account | Contact | Opportunity | Case
    - record_id: Salesforce record ID (18-char)
    - correlation_id: OS workflow execution ID
    - timestamp: ISO 8601
    - fields_accessed: list of fields read/written
    - pii_accessed: boolean
  log_path: memory/events/salesforce-audit.jsonl
  retention: 7 years (customer data compliance)
  salesforce_native: Salesforce Shield Event Monitoring + Field History supplement OS audit
```

---
