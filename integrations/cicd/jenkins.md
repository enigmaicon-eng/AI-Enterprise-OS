---
integration: Jenkins
category: cicd
status: active
mcp-available: partial
connector-agent: enterprise-systems-agent
source-of-truth: CI pipeline execution, build artifacts, test results, quality gates
data-classification: INTERNAL
created: 2026-05-10
---

# Jenkins Integration

> Jenkins is the CI/CD automation server. The OS reads build status, test results, coverage metrics, and pipeline health from Jenkins, and triggers pipelines and quality gate enforcement actions via the Jenkins REST API and webhook system. Jenkins is the authoritative source for build execution state and artifact provenance. All production release build triggers require H-001 approval.

---

## 1. Ingestion Workflows

**What flows from Jenkins → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Build started | Webhook: build.started | release-governance-agent | Real-time |
| Build completed (pass/fail) | Webhook: build.completed | release-governance-agent | Real-time |
| Test results (JUnit XML) | Build completed + artifact fetch | qa-agent | Per build |
| Code coverage report | Build completed + artifact fetch | qa-agent | Per build |
| Static analysis results (SonarQube) | Webhook from SonarQube via Jenkins | security-architect-agent | Per build |
| Build duration trend | Scheduled API query | analytics-agent | Daily |
| Pipeline failure pattern | Webhook: build.failed | incident-manager-agent | Real-time |
| Queue depth (backlog) | REST API poll | delivery-manager-agent | Every 15 min |

**Ingestion Protocol:**
```yaml
jenkins_ingestion:
  trigger: Jenkins webhook (HTTP POST to OS endpoint) + scheduled API poll
  auth:
    webhook: HMAC-SHA256 secret validation (X-Jenkins-Signature header)
    api_poll: Basic auth (API token, not password)
  webhook_payload: Jenkins v2 JSON notification payload
  api_base_url: https://jenkins.internal/
  transformations:
    - map build.result (SUCCESS/FAILURE/UNSTABLE) → OS build status
    - extract test pass rate from JUnit XML → OS quality metric
    - extract coverage % from coverage plugin → OS quality gate input
    - classify failure type (test/compile/infra) → OS routing
  destination: event-bus topic `integration.jenkins.build`
  error_handling: retry x3, dead-letter queue, alert enterprise-systems-agent
  deduplication: build_number + job_name hash
```

---

## 2. Publishing Workflows

**What flows from OS → Jenkins:**

| OS Artifact | Jenkins Destination | Publishing Agent | Trigger | Gate |
|-------------|--------------------|-----------------|---------| -----|
| Pipeline trigger (feature branch) | POST /job/{name}/build | release-governance-agent | PR merged | None |
| Pipeline trigger (release build) | POST /job/{name}/buildWithParameters | release-governance-agent | Release milestone | H-001 |
| Quality gate enforcement action | Abort build via API | qa-agent | Quality gate failure | None |
| Pipeline config update (Jenkinsfile) | Git push (triggers Jenkins) | release-governance-agent | Pipeline change | H-001 (prod) |
| Build parameter injection | POST /buildWithParameters | delivery-manager-agent | Parameterized build | H-001 (prod) |

**Publishing Protocol:**
```yaml
jenkins_publish:
  auth: Jenkins API Token (HTTP Basic: user:token)
  method: Jenkins REST API (JSON API)
  operations:
    trigger_build: POST /job/{jobName}/build
    trigger_parameterized: POST /job/{jobName}/buildWithParameters
    abort_build: POST /job/{jobName}/{buildNum}/stop
    get_build_info: GET /job/{jobName}/{buildNum}/api/json
    get_queue_item: GET /queue/item/{id}/api/json
  csrf_protection: crumb required (GET /crumbIssuer/api/json before each POST)
  idempotency: check queue + running builds before triggering to prevent duplicates
  rate_limit: 100 API requests/min (Jenkins default)
  secret_path: vault://integrations/jenkins/api-token
  rotation: 90 days
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-Jenkins | Jenkins-to-OS | Conflict Resolution |
|-------|--------------|--------------|---------------------|
| Build status | OS triggers; Jenkins executes | Build result → OS quality record | Jenkins wins (execution authority) |
| Quality gates | OS defines thresholds | Jenkins reports metrics; OS decides gate | OS decides; Jenkins enforces abort |
| Pipeline config | OS pushes Jenkinsfile changes | Jenkins parses and validates | Jenkins validation wins (syntax error = rejected) |
| Build artifacts | Not managed by OS | Artifact URLs → OS release record | Jenkins artifact store is authoritative |
| Queue status | OS queries | Jenkins queue → OS capacity model | Jenkins wins (queue state) |

**Sync frequency:** Real-time webhooks for build events; 15-minute poll for queue depth; daily batch for build trend analysis.

**Source-of-truth designator:** Jenkins is authoritative for build execution state, test results, and artifact provenance. OS is authoritative for quality gate thresholds and release decision criteria.

---

## 4. Permissions

```yaml
jenkins_permissions:
  auth_method: Jenkins API Token (HTTP Basic)
  service_account: ai-os-jenkins-sa
  jenkins_permissions_granted:
    - Job/Read
    - Job/Build (trigger)
    - Job/Cancel
    - Build/Read
    - Queue/Item/Cancel
    - View/Read
  blocked_permissions:
    - Job/Configure (pipeline config changes go through git)
    - Job/Delete
    - Manage Jenkins (admin)
    - Credentials/Create
  pipeline_trigger_scope:
    feature_builds: autonomous (no gate)
    staging_builds: autonomous (no gate)
    release_builds: H-001 gate required
    hotfix_builds: H-001 gate required
  secret_path: vault://integrations/jenkins/api-credentials
  rotation: 90 days
```

**Agent authorization matrix:**

| Agent | Jenkins Permission | Operations |
|-------|-------------------|------------|
| release-governance-agent | Build trigger + read | Trigger feature/staging builds; read build status |
| qa-agent | Read + abort | Read test results; abort failing builds |
| incident-manager-agent | Read | Read failed build details for incident context |
| analytics-agent | Read | Query build history for DORA metrics |
| delivery-manager-agent | Read | Queue depth for sprint capacity planning |
| All others | None | No Jenkins access |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Read build status / test results | None (agent autonomous) | — |
| Trigger feature branch build | None (agent autonomous) | — |
| Trigger staging build | None (agent autonomous) | — |
| Abort unstable build (quality gate) | qa-agent self-approves | — |
| Trigger production release build | Human operator | H-001 |
| Trigger hotfix release build | Human operator (expedited) | H-001 |
| Modify Jenkinsfile (pipeline config) | Human operator | H-001 |
| Create/delete Jenkins job | Human operator | H-009 |
| Modify Jenkins system config | Human operator + IT admin | H-009 |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: Jenkins REST API (HTTPS JSON API)
  mcp_server: none (direct HTTP client)
  tools_available:
    - jenkins_trigger_build
    - jenkins_get_build_status
    - jenkins_get_test_results
    - jenkins_abort_build
    - jenkins_get_queue_depth
    - jenkins_list_jobs
    - jenkins_get_build_artifacts
    - jenkins_get_console_output
  connection_pool: 5 connections max
  timeout: 15s per API call (console output: 30s)
  retry_policy: exponential backoff (2s, 4s, 8s), max 3 retries
  circuit_breaker:
    threshold: 5 failures in 120s
    open_duration: 120s
    half_open_probe: 1 request per 60s
    fallback: alert release-governance-agent; queue all non-critical triggers
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| Jenkins unreachable | Connection timeout | Alert enterprise-systems-agent; queue triggers | Manual Jenkins restart or investigate |
| Webhook delivery failure | Missed events via poll reconciliation | Poll GET /job/{name}/lastBuild every 5 min | Reconcile missed events on reconnect |
| Build trigger duplicate | Check running builds before trigger | Skip if identical build running | Deduplication via pre-trigger check |
| CSRF crumb expired | 403 on POST | Refresh crumb; retry | Automated crumb refresh |
| Auth token expired | 401 response | Alert enterprise-systems-agent | Manual token rotation via Vault |
| Build stuck (no progress) | Build duration > 2x p95 baseline | Alert qa-agent; do not auto-abort | Human investigation; abort if confirmed stuck |

**Degraded mode:** If Jenkins unavailable > 10 min, all build triggers queued in `memory/events/jenkins-trigger-queue.jsonl`. Release decisions blocked until Jenkins recovers. Delivery-manager-agent notified of sprint impact. Queue replayed on recovery in FIFO order.

---

## 8. Observability

```yaml
observability:
  metrics:
    - jenkins_build_success_rate:        target: "> 90%"
    - jenkins_build_p95_duration:        target: "< 15 min (configurable per pipeline)"
    - jenkins_api_success_rate:          target: "> 99%"
    - jenkins_queue_depth:               target: "< 10 builds waiting"
    - jenkins_webhook_delivery_rate:     target: "> 99.5%"
    - jenkins_circuit_breaker_trips:     target: "0 per week"
    - jenkins_quality_gate_pass_rate:    target: "> 95%"
  alerts:
    - condition: "build_success_rate < 80%"
      severity: HIGH
      notify: [qa-agent, delivery-manager-agent]
    - condition: "queue_depth > 20"
      severity: MEDIUM
      notify: [delivery-manager-agent]
    - condition: "circuit_breaker = OPEN"
      severity: HIGH
      notify: [release-governance-agent, enterprise-systems-agent]
    - condition: "quality_gate_pass_rate < 90%"
      severity: HIGH
      notify: [qa-agent]
  health_check:
    endpoint: GET /api/json?tree=mode
    frequency: every 5 minutes
    timeout: 5s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Triggered wrong build | Abort via POST /stop | qa-agent | Immediately after trigger |
| Released bad artifact | Trigger rollback build (separate pipeline) | release-governance-agent + human | H-001 required |
| Aborted build (in error) | Re-trigger build | qa-agent or release-governance-agent | Anytime |
| Modified Jenkinsfile | Revert via git; retrigger | release-governance-agent + human | H-001 for prod pipeline |

**Rollback guarantee:** Build history permanently stored in Jenkins (configurable retention). All triggered builds logged to `memory/events/jenkins-audit.jsonl` with trigger agent, job name, parameters, and outcome. Artifact provenance tracked via build number for release traceability.

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| Engineers | Build failure details | Full stack trace, console output excerpt, failed test list |
| QA team | Test result summary | Pass/fail count, flaky tests, coverage delta |
| Engineering manager | Build trend report | Success rate trend, build duration trend, quality gate history |
| Release manager | Release readiness | All quality gates pass/fail, coverage threshold, artifact hash |
| Executive | DORA delivery metrics | Deployment frequency, lead time, change failure rate |

audience-transformation-agent generates EXEC profile for Jenkins-derived DORA metrics. Raw build logs are TECHNICAL — not shared with non-technical stakeholders.

---

## 11. Governance

```yaml
governance:
  data_classification: INTERNAL
  pii_handling: >
    Jenkins build logs may contain developer email addresses and commit author names.
    Logs accessed only for build debugging; not stored in OS memory.
    Build history retention controlled by Jenkins job configuration.
  retention_policy:
    build_audit_log: 3 years
    jenkins_trigger_queue: 7 days (auto-purge after replay)
    quality_gate_records: 1 year (SOC 2 evidence)
  access_review: quarterly (Jenkins API token holders, job permissions)
  data_residency: Jenkins server region (on-premises or cloud — confirm H-003)
  compliance_requirements:
    - SOC_2_Type_II: build audit logs, quality gate enforcement records as evidence
    - ISO_27001: change management records (H-001 release build approvals)
  quality_gate_thresholds:
    test_pass_rate: "> 95%"
    code_coverage: "> 80%"
    static_analysis_severity: "0 CRITICAL, 0 HIGH (blocking)"
    build_duration_regression: "< 20% increase vs 7-day average"
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every build trigger (job_name, parameters, triggering agent, H-NNN ref, timestamp)
    - Every build result ingested (job_name, build_number, result, duration, test_pass_rate)
    - Every quality gate decision (threshold, actual_value, pass/fail, agent)
    - Every build abort (job_name, build_number, reason, agent)
    - Every webhook event received (event_type, job_name, build_number, result)
    - Every circuit breaker state change
    - Every H-001 gate invocation (approval record, decision)
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/jenkins-audit.jsonl
  retention: 3 years (build records), 1 year (read events)
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent identifier
    operation: trigger | read | abort | webhook_ingest
    job_name: Jenkins job identifier
    build_number: integer
    gate_reference: H-001 | none
    result: success | failure | aborted | queued
    correlation_id: OS workflow execution ID
```
