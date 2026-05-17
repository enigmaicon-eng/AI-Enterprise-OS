---
integration: Snowflake
category: data
status: active
mcp-available: partial
connector-agent: mcp-integration-agent
source-of-truth: enterprise data warehouse (analytical data)
data-classification: CONFIDENTIAL / RESTRICTED (PII data)
created: 2026-05-09
---

# Snowflake Integration

> Snowflake is the enterprise data warehouse — the authoritative source for analytical data, business metrics, product telemetry, financial data, and compliance datasets. The OS ingests Snowflake query results to power analytics agents, product intelligence, financial modeling, and observability reporting. The OS also publishes structured datasets to Snowflake (e.g., AI evaluation results, agent performance metrics, audit logs). Snowflake is source of truth for all analytical data; OS wiki is source of truth for interpretations and reports.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent |
|-----------|---------|----------------|
| Product metrics query | Scheduled (daily) | analytics-agent |
| Financial data extract | Scheduled (weekly) | financial-modeling-agent |
| Customer segment data | On-demand (analytics request) | customer-intelligence-agent |
| DORA metrics | Scheduled (per sprint) | delivery-manager-agent |
| Compliance dataset | On-demand (audit trigger) | compliance-documentation-agent |
| AI evaluation results | On-demand (evaluation run) | ai-evaluation-qa-agent |
| Experiment results | On-demand (experiment concludes) | experimentation-agent |
| Risk data | Scheduled (weekly) | risk-management-agent |

**Ingestion pipeline:**
```
Scheduled trigger or agent request
  → snowflake_execute_query (parameterized SQL — no string interpolation)
  → Result set returned (JSON / Arrow format)
  → Data validation (schema check, null checks, outlier detection)
  → Convert to OS structured format (markdown tables / JSON datasets)
  → Store in memory/data/[dataset]-[date].json
  → Notify consuming agent
  → audit log entry (query hash + row count + warehouse used)
```

**PII handling in queries:**
- Never SELECT raw PII columns — always aggregate or hash at query time
- PII data access requires H-025 approval and uses dedicated restricted warehouse

---

## 2. Publishing Workflows

| OS Dataset | Snowflake Target | Publishing Agent | Table |
|------------|-----------------|-----------------|-------|
| AI evaluation scores | ai_os.evaluations.agent_scores | ai-evaluation-qa-agent | INSERT |
| Agent performance metrics | ai_os.observability.agent_metrics | organizational-learning-agent | INSERT |
| Audit log export | ai_os.audit.event_log | audit-readiness-agent | INSERT |
| Incident timeline | ai_os.incidents.timeline | incident-manager-agent | INSERT |
| Experiment results | ai_os.experiments.results | experimentation-agent | INSERT |

**Publication pipeline:**
```
OS structured dataset
  → Schema validation (matches target table schema)
  → snowflake_execute_query (INSERT INTO ... VALUES ... parameterized)
  → Row count confirmation
  → audit log entry
```

---

## 3. Sync Systems

```yaml
sync:
  direction: primarily Snowflake → OS (read-heavy)
  os_to_snowflake: specific OS datasets (evaluations, audit, metrics)
  conflict_resolution: Snowflake wins for analytical facts; OS wins for interpretations
  cache:
    enabled: true
    ttl: 1 hour (metrics); 24 hours (financial data)
    storage: memory/data/cache/
    invalidation: on-demand query reruns invalidate cache
  dbt_integration:
    - OS does NOT run dbt models; consumes dbt-transformed views
    - dbt transformation schedule monitored by enterprise-systems-agent
```

---

## 4. Permissions

```yaml
snowflake_permissions:
  auth_method: Key-pair authentication (RSA private key, no username/password)
  private_key_path: vault://integrations/snowflake/rsa-private-key
  account: stored in config (e.g., xy12345.snowflakecomputing.com)
  rotation: 90 days (key rotation)
  warehouses:
    - AI_OS_WH: standard queries (XS size, auto-suspend 60s)
    - AI_OS_ANALYTICS_WH: analytics queries (S size, auto-suspend 300s)
    - AI_OS_RESTRICTED_WH: PII data queries (H-025 required; separate auth)
  roles:
    AI_OS_READ: SELECT on analytical schemas
    AI_OS_WRITE: INSERT on ai_os.* schema only
    AI_OS_RESTRICTED: SELECT on PII schemas (H-025 required)
  databases:
    - read: PROD_DW, ANALYTICS, COMPLIANCE_DB
    - write: AI_OS_DB (OS-owned schema)
```

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| SELECT on analytical data | None (agent autonomous per scheduled cadence) |
| SELECT on PII data | H-025 + human operator |
| On-demand query (non-scheduled) | analytics-agent review |
| INSERT into AI_OS_DB | None (agent autonomous for OS-owned schema) |
| CREATE TABLE in AI_OS_DB | devops-engineer-agent review |
| Query costs > $50/run (estimated) | enterprise-systems-agent notification |
| Full table scan on large tables (> 1B rows) | enterprise-systems-agent review |

---

## 6. Runtime Integration

```yaml
runtime:
  connector: snowflake-connector-python (official Snowflake Python connector)
  mcp_wrapper: snowflake-mcp-server (custom — built by connector-builder-agent)
  tools_available:
    - snowflake_execute_query          # Run parameterized SQL query
    - snowflake_get_query_results      # Fetch results (async large queries)
    - snowflake_list_tables            # Schema discovery
    - snowflake_describe_table         # Column + type metadata
    - snowflake_estimate_query_cost    # Pre-flight cost estimate
    - snowflake_cancel_query           # Cancel runaway query
  query_standards:
    parameterized_only: true           # NEVER string interpolation
    max_rows_default: 100000           # Agents request larger sets explicitly
    timeout: 300s
    result_format: JSON (small) | Arrow (large batches)
  warehouse_selection:
    read_queries: AI_OS_WH (default) | AI_OS_ANALYTICS_WH (complex analytics)
    write_queries: AI_OS_WH
    pii_queries: AI_OS_RESTRICTED_WH (H-025 required)
  cost_controls:
    auto_suspend: 60s (standard WH) | 300s (analytics WH)
    query_timeout: 300s (kill runaway queries automatically)
    credit_alert: > 10 credits/day → enterprise-systems-agent notification
```

---

## 7. Failure Handling

| Failure | Response |
|---------|----------|
| Snowflake unavailable | Use cached data (if within TTL); alert analytics-agent; defer non-critical queries |
| Query timeout | Cancel query; log; retry with reduced scope; alert requesting agent |
| Authentication failure | Alert mcp-integration-agent; rotate key-pair; pause data workflows |
| Schema change detected | Alert analytics-agent; pause dependent queries; validate schema |
| Result set too large | Paginate (LIMIT + OFFSET); stream results in batches |
| Cost overrun detected | Alert enterprise-systems-agent; pause non-critical queries |

---

## 8. Observability

```yaml
metrics:
  - snowflake_query_success_rate      # target: > 99.5%
  - snowflake_query_latency_p95       # target: < 30s (standard); < 120s (analytics)
  - snowflake_credit_consumption      # daily credit budget tracking
  - snowflake_cache_hit_rate          # target: > 60% (reduce warehouse usage)
  - data_freshness_lag                # target: < 25h for daily datasets

alerts:
  - query_timeout > 5 in 1h → HIGH → analytics-agent
  - credit_consumption > 150% daily budget → HIGH → enterprise-systems-agent
  - authentication_failure → CRITICAL → mcp-integration-agent
```

---

## 9. Rollback Systems

Snowflake Time Travel: 90-day rollback for data recovery. If OS writes incorrect data to AI_OS_DB:
1. snowflake_execute_query (DELETE WHERE correlation_id = [bad-id])
2. Re-run correct write operation
3. Document rollback in audit log

Historical analytical data is read-only from OS perspective — no rollback needed.

---

## 10. Audience Adaptation

Snowflake data is adapted before publishing to human-facing artifacts:
- Executive reports: aggregated KPIs, trend charts, plain language
- Technical reports: raw metrics, statistical distributions, methodology notes
- Compliance reports: evidence-grade data, methodology, data lineage

---

## 11. Governance

```yaml
governance:
  data_classification: CONFIDENTIAL (default); RESTRICTED (PII data)
  pii_handling:
    - PII columns never extracted as plaintext
    - Aggregation or SHA-256 hashing at query time
    - PII access logged per H-025 approval
  data_lineage:
    - All OS queries logged with source table + query hash
    - Output datasets tagged with Snowflake source table + query timestamp
  retention:
    - AI_OS_DB data: 1 year (OS operational data)
    - Analytical data: per PROD_DW retention policies (managed by data engineering team)
  prohibited:
    - Raw PII extraction without H-025
    - Production data modification (only AI_OS_DB writes permitted)
    - CREATE/DROP on non-AI_OS schemas
```

---

## 12. Auditability

```yaml
audit:
  logged_per_query:
    - agent_id: requesting agent
    - query_hash: SHA-256 of parameterized query template
    - warehouse: warehouse used
    - database_schema_table: target(s)
    - timestamp: ISO 8601
    - rows_returned: count
    - execution_time: milliseconds
    - credits_used: Snowflake credit estimate
    - correlation_id: OS workflow execution ID
  log_path: memory/events/snowflake-audit.jsonl
  retention: 7 years (financial and compliance queries)
  snowflake_native: Snowflake Query History + Account Usage schema for compliance
```

---
