---
integration: Kubernetes
category: infrastructure
status: active
mcp-available: partial
connector-agent: enterprise-systems-agent
source-of-truth: container orchestration, workload state, cluster health
data-classification: CONFIDENTIAL
created: 2026-05-10
---

# Kubernetes Integration

> Kubernetes is the container orchestration platform. The OS reads cluster health, workload status, pod logs, and resource utilization from Kubernetes, and publishes deployment configurations, scaling decisions, and rollback instructions back to it. The OS maintains a READ-MOSTLY posture: all production Kubernetes writes require H-001 (production deployment) or H-025 (staging deployment). Kubernetes is the authoritative source for workload runtime state.

---

## 1. Ingestion Workflows

**What flows from Kubernetes → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Pod health status (all namespaces) | kubectl/API poll | runtime-coordination-agent | Every 2 min |
| Deployment rollout status | Watch API (watch=true) | release-governance-agent | Real-time |
| Pod restart / CrashLoopBackOff | Event API watch | incident-manager-agent | Real-time |
| Node resource utilization (CPU/mem) | Metrics Server API | analytics-agent | Every 5 min |
| HPA scaling events | Event API watch | delivery-manager-agent | Real-time |
| Namespace resource quotas | API poll | vp-engineering-agent | Daily |
| Failed job / CronJob | Event API watch | runtime-coordination-agent | Real-time |
| Certificate expiry warnings | CertManager event watch | security-architect-agent | Real-time |

**Ingestion Protocol:**
```yaml
kubernetes_ingestion:
  trigger: Kubernetes API server watch (long-polling) + scheduled poll
  auth: Service account bearer token (projected volume in-cluster) or kubeconfig (external)
  api_server: https://kubernetes.default.svc (in-cluster) or cluster endpoint
  watch_resources:
    - pods (all namespaces)
    - deployments
    - events (type: Warning)
    - horizontalpodautoscalers
    - nodes
  transformations:
    - map pod.status.phase → OS workload status (Running/Failed/Pending)
    - extract container restartCount → OS health signal
    - classify event reason → OS alert category
    - aggregate node metrics → OS capacity model
  destination: event-bus topic `integration.kubernetes.event`
  error_handling: retry x3 with exponential backoff; dead-letter queue; alert enterprise-systems-agent
  namespace_filter: production, staging, monitoring, ai-os (not kube-system unless alert)
```

---

## 2. Publishing Workflows

**What flows from OS → Kubernetes:**

| OS Artifact | Kubernetes Destination | Publishing Agent | Trigger | Gate |
|-------------|----------------------|-----------------|---------|------|
| Deployment manifest | kubectl apply -f | release-governance-agent | Release milestone | H-001 (prod) |
| ConfigMap update | kubectl apply configmap | release-governance-agent | Config change | H-001 (prod) |
| HPA config update | kubectl apply hpa | delivery-manager-agent | Capacity decision | H-001 (prod) |
| Rollback command | kubectl rollout undo | incident-manager-agent | P0/P1 rollback | H-001 (prod) |
| Staging deployment | kubectl apply (staging) | release-governance-agent | Pre-release | H-025 (staging) |
| Namespace resource quota | kubectl apply quota | vp-engineering-agent | Capacity planning | H-009 (permissions) |
| Horizontal scale-out | kubectl scale | runtime-coordination-agent | Auto-scale trigger | H-001 (prod writes) |

**Publishing Protocol:**
```yaml
kubernetes_publish:
  auth: Service account with RBAC (ai_os_deployer_role for writes)
  method: Kubernetes API REST (kubectl abstraction) or direct API
  dry_run_first: all apply operations use --dry-run=server before live apply
  operations:
    apply_manifest: POST /apis/apps/v1/namespaces/{ns}/deployments
    rollback: POST /apis/apps/v1/namespaces/{ns}/deployments/{name}/rollback
    scale: PATCH /apis/apps/v1/namespaces/{ns}/deployments/{name}/scale
    apply_configmap: PUT /api/v1/namespaces/{ns}/configmaps/{name}
  validation:
    - schema validation (server-side dry-run)
    - OPA policy check (if Gatekeeper installed)
    - image tag validation (no :latest in production)
  secret_path: vault://integrations/kubernetes/service-account-token
  rotation: 90 days (SA token rotation via Vault)
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-K8s | K8s-to-OS | Conflict Resolution |
|-------|----------|----------|---------------------|
| Desired deployment state | OS publishes manifests | K8s reconciles toward desired | K8s reconciliation loop wins |
| Pod count (replicas) | OS requests scale | K8s HPA may override | K8s HPA wins (runtime authority) |
| Config values | OS applies ConfigMap | Pod restarts pick up new config | K8s ConfigMap state is authoritative after apply |
| Rollout status | OS triggers rollout | K8s reports progress events | K8s wins (deployment controller) |
| Resource quotas | OS requests quota | K8s enforces quota | K8s wins (enforcement) |

**Sync frequency:** Real-time watch streams for events/rollouts; 2-minute poll for pod health; 5-minute poll for node metrics; daily for quota inventory.

**Source-of-truth designator:** Kubernetes is authoritative for all runtime workload state. OS is authoritative for the desired state specifications (manifests in `infrastructure/k8s/`). If K8s state diverges from OS manifests, OS initiates reconciliation via ArgoCD.

---

## 4. Permissions

```yaml
kubernetes_permissions:
  auth_method: Service Account + RBAC
  service_accounts:
    ai_os_reader:
      role: ai_os_reader_role
      namespaces: [production, staging, monitoring, ai-os]
      verbs: [get, list, watch]
      resources: [pods, deployments, replicasets, events, nodes, horizontalpodautoscalers]
    ai_os_deployer:
      role: ai_os_deployer_role
      namespaces: [staging, ai-os]
      verbs: [get, list, watch, create, update, patch]
      resources: [deployments, configmaps, horizontalpodautoscalers]
    ai_os_prod_deployer:
      role: ai_os_prod_deployer_role
      namespaces: [production]
      verbs: [get, list, watch, create, update, patch]
      resources: [deployments, configmaps]
      activation: H-001 required before any verb used
  blocked_operations:
    - delete namespace
    - delete persistent volumes
    - modify RBAC roles/clusterroles
    - exec into production pods (requires H-020 equivalent)
    - access kube-system namespace
  secret_path: vault://integrations/kubernetes/service-account-token
  rotation: 90 days
```

**Agent authorization matrix:**

| Agent | K8s Permission | Operations |
|-------|---------------|------------|
| release-governance-agent | Deployer (staging) + Prod deployer (H-001) | Apply manifests, trigger rollouts |
| incident-manager-agent | Reader + Prod deployer (H-001 emergency) | Read pod state, trigger rollback |
| runtime-coordination-agent | Reader + staging deployer | Read health, scale staging |
| delivery-manager-agent | Reader | Read HPA events, capacity planning |
| analytics-agent | Reader | Read metrics, resource utilization |
| security-architect-agent | Reader (all namespaces) | Audit RBAC, cert expiry |
| All others | None | No K8s access |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Read pod/deployment status | None (agent autonomous) | — |
| Watch events | None (agent autonomous) | — |
| Deploy to staging | release-governance-agent self-approves | H-025 |
| Deploy to production | Human operator | H-001 |
| Rollback production deployment | Human operator (expedited for P0) | H-001 |
| Scale production workload | Human operator | H-001 |
| Modify RBAC roles | Human operator + security review | H-009 |
| Delete workload | Human operator | H-021 |
| Access pod exec (debugging) | Human operator + security review | H-020 |
| Modify resource quotas | Human operator | H-009 |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: Kubernetes REST API (HTTPS) + kubectl binary
  mcp_server: none (kubectl abstraction via Bash tool or custom client)
  tools_available:
    - k8s_get_pods (list pods with status)
    - k8s_get_deployments (deployment rollout state)
    - k8s_get_events (filtered warning events)
    - k8s_get_node_metrics (CPU/memory)
    - k8s_apply_manifest (dry-run then apply; H-001 gated for prod)
    - k8s_rollback_deployment (rollout undo; H-001 gated)
    - k8s_get_logs (pod log tail)
    - k8s_describe_resource (full resource spec)
  connection_pool: 5 connections max
  timeout: 30s (watch streams: indefinite with keepalive)
  retry_policy: exponential backoff (2s, 4s, 8s), max 3 retries
  circuit_breaker:
    threshold: 5 failures in 120s
    open_duration: 180s
    half_open_probe: 1 request per 60s
    fallback: alert enterprise-systems-agent; defer all writes; read-only from last known state
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| API server unreachable | Connection timeout | Alert enterprise-systems-agent; halt all K8s writes | Incident escalation; manual investigation |
| Auth token expired | 401 response | Rotate SA token via Vault | Vault auto-rotation; alert if fails |
| Deployment stuck (Pending) | Rollout status not progressing > 10 min | Alert incident-manager-agent; do not force | Human investigation; possible rollback |
| CrashLoopBackOff | Pod restart event | Alert incident-manager-agent with pod logs | Human-led investigation |
| Resource quota exceeded | 403 on resource creation | Alert delivery-manager-agent; halt deployment | Human quota increase or workload adjustment |
| Node not ready | Node status watch | Alert runtime-coordination-agent | Cluster autoscaler or manual intervention |

**Degraded mode:** If K8s API unreachable > 5 min, all write operations suspended. Read operations served from last-known cached state (30-second cache). Incident-manager-agent notified for P1 escalation. No autonomous recovery writes — human operator required for all K8s actions during outage.

---

## 8. Observability

```yaml
observability:
  metrics:
    - k8s_api_success_rate:          target: "> 99.5%"
    - k8s_pod_health_check_latency:  target: "< 2s"
    - k8s_event_watch_lag:           target: "< 10s"
    - k8s_deployment_success_rate:   target: "> 99% (gated)"
    - k8s_circuit_breaker_trips:     target: "0 per week"
    - k8s_pod_restart_rate:          target: "< 1 restart/pod/day (alert on CrashLoop)"
  alerts:
    - condition: "pod_restartCount > 5 in 10 min"
      severity: HIGH
      notify: [incident-manager-agent]
    - condition: "deployment_rollout_stuck > 10 min"
      severity: HIGH
      notify: [release-governance-agent, incident-manager-agent]
    - condition: "node_status = NotReady"
      severity: CRITICAL
      notify: [runtime-coordination-agent, incident-manager-agent]
    - condition: "api_success_rate < 99%"
      severity: HIGH
      notify: [enterprise-systems-agent]
  health_check:
    endpoint: GET /healthz (K8s API server)
    frequency: every 2 minutes
    timeout: 5s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Bad production deployment | kubectl rollout undo (H-001) | incident-manager-agent + human | Immediate |
| ConfigMap change (broke pods) | Re-apply previous ConfigMap version | release-governance-agent + human | Immediate |
| HPA misconfiguration | Restore prior HPA spec from git | delivery-manager-agent + human | Within 5 min |
| Staging deployment (broken) | kubectl rollout undo (H-025) | release-governance-agent | Self-approves |
| Resource quota change | Re-apply previous quota spec | human operator | Within 5 min |

**Rollback guarantee:** All K8s manifests version-controlled in `infrastructure/k8s/` (git-tracked). kubectl rollout history maintained by Kubernetes. All applied manifests logged to `memory/events/kubernetes-audit.jsonl` with pre-apply diff. Emergency rollback for P0 incidents requires H-001 approval but expedited (< 5 min SLA).

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| On-call engineer | Pod health report | Full technical: pod name, namespace, restartCount, last log lines |
| Engineering manager | Deployment status | Rollout progress, % pods ready, ETA |
| Executive | Infrastructure health | Uptime %, incident count, capacity utilization |
| QA | Staging environment status | Environment readiness, test namespace pod count |
| Finance | Resource utilization | Node count, CPU/memory %, estimated cloud spend |

audience-transformation-agent generates EXEC profile from K8s health data for executive dashboards. Raw pod status is TECHNICAL profile — not surfaced to non-technical stakeholders directly.

---

## 11. Governance

```yaml
governance:
  data_classification: CONFIDENTIAL
  pii_handling: >
    Kubernetes may contain application logs with PII (user IDs, IP addresses).
    Pod logs accessed only for incident investigation; not stored in OS memory.
    Log content subject to GDPR right-of-erasure compliance.
  retention_policy:
    kubernetes_event_log: 1 year
    deployment_audit_log: 3 years
    pod_log_snapshots: 30 days (incident investigation only)
  access_review: quarterly (RBAC roles, service account usage)
  data_residency: cluster region (must align with H-003 data residency requirement)
  compliance_requirements:
    - SOC_2_Type_II: deployment audit log required as evidence
    - ISO_27001: access control, change management records
    - change_management: all production K8s changes via H-001 process
  production_write_policy: >
    NO autonomous production writes. All production Kubernetes write operations
    require human operator approval (H-001). This is an immutable governance rule.
    Emergency exceptions for P0 incidents still require H-001 expedited approval.
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every K8s API write (operation, resource, namespace, agent, H-NNN ref, timestamp)
    - Every apply operation (manifest hash, dry-run result, live apply result)
    - Every rollback (from_revision, to_revision, trigger, agent, result)
    - Every watch stream connect/disconnect
    - Every circuit breaker state change
    - Every H-001 gate invocation (approval record, approver, decision)
    - Every pod restart event ingested (pod_name, namespace, restart_count)
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/kubernetes-audit.jsonl
  retention: 3 years (deployment records), 1 year (read events)
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent identifier
    operation: K8s API verb + resource type
    namespace: target namespace
    resource_name: deployment/pod/configmap name
    payload_hash: SHA-256 of applied manifest
    gate_reference: H-001 | H-025 | none
    result: success | failure | dry-run-only
    correlation_id: OS workflow execution ID
```
