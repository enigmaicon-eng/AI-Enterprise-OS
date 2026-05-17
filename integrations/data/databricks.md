---
integration: Databricks
category: data
status: active
mcp-available: partial
connector-agent: mcp-integration-agent
source-of-truth: ML platform and big data processing
data-classification: CONFIDENTIAL / RESTRICTED
created: 2026-05-09
---

# Databricks Integration

> Databricks is the enterprise ML and data engineering platform — primary for big data processing, ML model training, feature engineering, and AI/ML lifecycle management. The OS integrates with Databricks to: trigger ML pipeline runs, retrieve model evaluation results, publish AI evaluation datasets, and consume feature store data for product intelligence. Databricks is source of truth for ML model artifacts and big data processing results.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent |
|-----------|---------|----------------|
| ML model evaluation results | Job run completes (webhook) | ai-evaluation-qa-agent |
| Feature store data | On-demand (analytics request) | analytics-agent |
| Big data processing results | Job run completes | analytics-agent |
| Model registry update | Webhook (model version registered) | caio-agent |
| Data pipeline output | Job run completes | organizational-learning-agent |
| Experiment tracking results | MLflow experiment run completes | ai-evaluation-qa-agent |

**Ingestion pipeline:**
```
Databricks job run completion webhook → OS endpoint
  → HMAC validation
  → databricks_get_run_output (retrieve job results)
  → Data validation (schema + quality checks)
  → Convert to OS format → store in memory/data/ml/
  → Notify consuming agent
  → audit log entry
```

---

## 2. Publishing Workflows

| OS Dataset | Databricks Target | Publishing Agent | Method |
|------------|------------------|-----------------|--------|
| AI evaluation training data | Unity Catalog table | ai-evaluation-qa-agent | Delta Lake write |
| Agent interaction logs | Unity Catalog table | organizational-learning-agent | Delta Lake write |
| Hallucination dataset | ML model training table | hallucination-detection-agent | Delta Lake write |
| Benchmark results | MLflow experiment | ai-evaluation-qa-agent | MLflow log_metric |

**Publication pipeline:**
```
OS structured dataset
  → databricks_sql_execute (INSERT/MERGE into Unity Catalog)
  → OR databricks_mlflow_log (log metrics/artifacts to MLflow)
  → Confirmation received
  → audit log entry
```

---

## 3. Sync Systems

```yaml
sync:
  direction: primarily Databricks → OS (job results, model metadata)
  os_to_databricks: training datasets, evaluation logs
  model_registry:
    sync_direction: Databricks Model Registry → OS model catalog
    trigger: webhook on model version registration
    os_role: reads model metadata; triggers AI safety review (caio-agent)
  unity_catalog:
    sync: read-only for OS from production catalogs
    write: OS writes to ai_os.* catalog only
```

---

## 4. Permissions

```yaml
databricks_permissions:
  auth_method: Databricks personal access token (PAT) + OAuth M2M
  pat_path: vault://integrations/databricks/access-token
  oauth_client_id: vault://integrations/databricks/oauth-client-id
  secret_path: vault://integrations/databricks/credentials
  rotation: 90 days
  workspace_url: stored in config
  permissions_granted:
    - jobs_read: read job definitions and run status
    - jobs_run: trigger existing job runs (cannot create new jobs)
    - sql_read: SELECT on analytics catalogs
    - sql_write: INSERT/MERGE on ai_os.* catalog
    - mlflow_read: read experiments, runs, models
    - mlflow_write: log metrics/artifacts to OS-owned experiments
    - model_registry_read: read model versions and metadata
    - cluster_read: read cluster status (cannot create clusters)
  restricted:
    - cluster_create: false (devops-engineer-agent only)
    - catalog_create: false (data engineering team only)
    - model_deploy: false (requires human operator review)
```

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Read job results | None (agent autonomous) |
| Trigger existing job run | analytics-agent review |
| Write training data to Unity Catalog | None (ai_os.* schema) |
| Model registration approval | caio-agent + H-003 (AI model governance) |
| Deploy model to production | caio-agent + human operator |
| Create new Databricks cluster | devops-engineer-agent + human operator |
| PII data access in Databricks | H-025 + human operator |

---

## 6. Runtime Integration

```yaml
runtime:
  connector: databricks-sdk-python (official)
  mcp_wrapper: databricks-mcp-server (custom — built by connector-builder-agent)
  tools_available:
    - databricks_run_job              # Trigger existing job run
    - databricks_get_run_status       # Poll job run status
    - databricks_get_run_output       # Retrieve completed run output
    - databricks_sql_execute          # Execute parameterized SQL (Unity Catalog)
    - databricks_list_jobs            # List available jobs
    - databricks_mlflow_get_run       # Read MLflow experiment run
    - databricks_mlflow_log_metric    # Log metric to OS MLflow experiment
    - databricks_get_model_version    # Read model registry version
    - databricks_feature_store_read   # Read feature store table
  sql_standards:
    parameterized_only: true          # NEVER string interpolation
    catalog: ai_os (writes) | analytics | prod (reads)
    timeout: 600s (big data jobs may take longer)
  job_execution:
    mode: trigger existing jobs only; do NOT create new jobs autonomously
    polling_interval: 30s
    max_wait: 3600s (1 hour) before alerting requesting agent
```

---

## 7. Failure Handling

| Failure | Response |
|---------|----------|
| Job run fails | Retrieve error log; alert requesting agent; log failure; retry once |
| Authentication failure | Alert mcp-integration-agent; pause ML workflows; rotate credentials |
| Cluster unavailable | Queue job trigger; retry when cluster available; alert enterprise-systems-agent |
| SQL timeout | Cancel query; log; retry with reduced dataset; alert analytics-agent |
| Model registry unavailable | Use last known model metadata from OS cache; alert caio-agent |
| Unity Catalog write fails | Queue; retry; alert if > 3 consecutive failures |

---

## 8. Observability

```yaml
metrics:
  - databricks_job_success_rate       # target: > 99%
  - databricks_job_latency_p95        # target: < job_sla (job-specific)
  - databricks_sql_latency_p95        # target: < 60s (SQL queries)
  - model_registry_sync_freshness     # target: < 15 min from model registration
  - ml_training_data_publish_rate     # target: > 99.5%
```

---

## 9. Rollback Systems

Databricks Delta Lake has native time travel (30-day default). If OS writes incorrect data:
1. databricks_sql_execute (RESTORE TABLE TO TIMESTAMP | VERSION)
2. Re-run correct write operation
3. Document rollback in audit log

ML model rollback: revert model registry to previous version; trigger human operator review before redeployment.

---

## 10. Audience Adaptation

Databricks results are adapted before publishing:
- Executive reports: model performance KPIs, business impact metrics
- Technical reports: full model metrics, training curves, confusion matrices
- AI governance: model cards, bias reports, fairness metrics

---

## 11. Governance

```yaml
governance:
  ml_model_governance:
    - All new model versions require caio-agent safety review before production
    - Model cards required for all production models
    - Bias and fairness evaluation required (ai-evaluation-qa-agent)
  data_classification: CONFIDENTIAL (default); RESTRICTED (PII training data)
  pii_handling:
    - PII training data requires H-025 + anonymization review
    - Production models trained on PII require differential privacy attestation
  ai_safety:
    - All models registered in Databricks trigger caio-agent safety review
    - High-risk models (scoring, decisioning) require H-003 human approval
  data_lineage:
    - All OS writes tagged with agent_id + workflow_execution_id
    - Model lineage tracked: training data → model version → deployment
```

---

## 12. Auditability

```yaml
audit:
  logged_per_operation:
    - agent_id: requesting agent
    - operation: job_run | sql_query | mlflow_log | model_read
    - job_id_or_query_hash: identifier
    - timestamp: ISO 8601
    - result: success | failure
    - rows_affected: count (for SQL operations)
    - model_version: (for model registry operations)
    - correlation_id: OS workflow execution ID
  log_path: memory/events/databricks-audit.jsonl
  retention: 7 years (ML model provenance for compliance)
  databricks_native: Databricks audit log + Unity Catalog lineage supplement OS audit
```

---
