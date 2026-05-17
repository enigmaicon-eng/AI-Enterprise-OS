# Integration Graph

## Purpose
Maintains the topology of all integration relationships between enterprise systems, external services, connectors, APIs, and data pipelines. The integration graph is the structural map of how the enterprise OS connects to the world outside its own agents and workflows — which systems exchange data with which other systems, through what protocols, with what reliability, and under what governance constraints. This topology enables blast radius analysis for integration failures, dependency-aware scheduling that avoids overloading shared endpoints, compliance verification for cross-border data flows, and observability that surfaces integration health across the full connectivity landscape.

---

## Integration Node Types

```yaml
integration_nodes:
  ENTERPRISE_SYSTEM:
    description: internal enterprise system (ERP, HRMS, CRM, policy store, etc.)
    fields: [system_id, system_name, system_type, owner_org_id, availability_sla, data_classification, region]
    subtypes: [ERP | HRMS | CRM | POLICY_STORE | AUDIT_STORE | IDENTITY | MONITORING | ANALYTICS]

  EXTERNAL_SERVICE:
    description: third-party or external API endpoint
    fields: [service_id, service_name, provider, endpoint_base_url, authentication_type, data_residency_region, gdpr_adequacy_status, contract_expiry]
    subtypes: [AI_MODEL_API | REGULATORY_DATABASE | CLOUD_PROVIDER | SaaS_TOOL | PAYMENT | IDENTITY_PROVIDER]

  DATA_PIPELINE:
    description: data flow pipeline (ETL, streaming, batch)
    fields: [pipeline_id, pipeline_type: ETL | STREAMING | BATCH | CDC, source_system_id, target_system_id, data_classification, transfer_volume_per_day_GB, latency_p99_ms]

  CONNECTOR:
    description: integration connector managing a specific integration channel
    fields: [connector_id, connector_type, protocol: REST | GRPC | GRAPHQL | WEBHOOK | MQ | SFTP, authentication_method, rate_limit, circuit_breaker_status]

  MESSAGE_QUEUE:
    description: asynchronous message queue or event stream
    fields: [queue_id, queue_type: KAFKA | RabbitMQ | SNS | custom, topics: [string], consumer_count, producer_count, lag_current, lag_threshold]

  API_GATEWAY:
    description: gateway managing multiple integration routes
    fields: [gateway_id, gateway_name, upstream_services: [service_id], rate_limit_global, auth_policy, traffic_volume_req_per_min]
```

---

## Integration Edge Types

```yaml
integration_edges:
  SENDS_DATA_TO:
    semantics: system A sends data to system B
    source: ENTERPRISE_SYSTEM | EXTERNAL_SERVICE | DATA_PIPELINE
    target: ENTERPRISE_SYSTEM | EXTERNAL_SERVICE | DATA_PIPELINE
    properties:
      data_type: string
      data_classification: string
      volume_per_day_GB: float
      frequency: REALTIME | BATCH_HOURLY | BATCH_DAILY | ON_DEMAND
      transfer_mechanism: connector_id | pipeline_id
      cross_border: boolean
      data_transfer_mechanism: SCC | ADEQUACY_DECISION | BCR | null  # if cross_border=true

  CALLS:
    semantics: system A makes API calls to system B
    source: ENTERPRISE_SYSTEM | CONNECTOR | DATA_PIPELINE
    target: EXTERNAL_SERVICE | ENTERPRISE_SYSTEM
    properties:
      protocol: string
      avg_calls_per_minute: float
      rate_limit: float
      timeout_seconds: int
      circuit_breaker_state: CLOSED | OPEN | HALF_OPEN
      error_rate: float
      latency_p50_ms, latency_p99_ms: float

  SUBSCRIBES_TO:
    semantics: system A subscribes to events or data from system B
    source: ENTERPRISE_SYSTEM | DATA_PIPELINE
    target: MESSAGE_QUEUE | ENTERPRISE_SYSTEM
    properties:
      topic: string
      consumer_group_id: string
      processing_lag_ms: float
      at_least_once: boolean

  ROUTES_THROUGH:
    semantics: integration traffic flows through an API gateway or connector
    source: ENTERPRISE_SYSTEM | EXTERNAL_SERVICE
    target: API_GATEWAY | CONNECTOR
    properties: [route_type, priority]

  DEPENDS_ON_INTEGRATION:
    semantics: workflow or agent functionality depends on this integration being available
    source: WORKFLOW | AGENT
    target: CONNECTOR | EXTERNAL_SERVICE | DATA_PIPELINE
    properties: [criticality: CRITICAL | HIGH | MEDIUM | LOW, fallback_available: boolean]

  GOVERNS_INTEGRATION:
    semantics: a data governance policy or DPA governs this integration
    source: POLICY | OBLIGATION
    target: SENDS_DATA_TO (edge) | DATA_PIPELINE | EXTERNAL_SERVICE
    properties: [governance_type: DPA | SCC | POLICY | DATA_RESIDENCY_REQUIREMENT]
```

---

## Integration Health Model

```yaml
integration_health:
  per_integration_metrics:
    availability:
      measurement: uptime percentage over rolling 7-day window
      sla_green: >= 99.9%
      sla_yellow: 99.0–99.9%
      sla_red: < 99.0%

    latency:
      measurement: p50, p95, p99 response times in ms
      threshold_yellow: p99 > 2× baseline
      threshold_red: p99 > 5× baseline OR p50 > 2× baseline

    error_rate:
      measurement: (4xx + 5xx) / total_requests over rolling 1-hour window
      threshold_yellow: > 1%
      threshold_red: > 5%

    circuit_breaker_state:
      CLOSED: healthy; requests flowing normally
      HALF_OPEN: recovering; limited requests to probe health
      OPEN: tripped; requests rejected at connector; fallback active if available

    throughput:
      measurement: requests per minute
      saturation_threshold: > 80% of rate_limit

  aggregate_integration_health:
    formula: weighted average of per-integration health scores
    weights: [criticality of dependent workflows | agents]
    score_bands: HEALTHY >= 0.90; DEGRADED 0.75–0.89; AT_RISK 0.60–0.74; CRITICAL < 0.60
```

---

## Cross-Border Data Flow Compliance

```yaml
cross_border_compliance:
  purpose: |
    All data flows that cross jurisdictional borders must be identified,
    governed by a valid legal mechanism, and continuously monitored.
    This is enforced by POL-DATA-003 (HARD_DENY without valid mechanism).

  cross_border_flow_registry:
    detection: SENDS_DATA_TO edges where source.region != target.region
    required_fields: [transfer_mechanism, jurisdiction_from, jurisdiction_to, adequacy_status]

  legal_mechanism_types:
    ADEQUACY_DECISION: EU Commission has determined destination adequate (auto-approved; monitor for revocation)
    SCC: Standard Contractual Clauses in place (verify DPA reference; annual review)
    BCR: Binding Corporate Rules (intra-group only; verify BCR registration)
    DEROGATION: narrow GDPR Art.49 derogation (explicit consent or vital interests; very limited use)
    NOT_APPLICABLE: data not subject to cross-border transfer requirements (verify classification)

  compliance_checks:
    real_time: every SENDS_DATA_TO edge creation is checked for cross-border compliance
    weekly: scan all active cross-border flows; verify mechanism still valid
    on_adequacy_change: if EU revokes adequacy for a country → CRITICAL alert + immediate flow review

  findings:
    MISSING_MECHANISM: HARD_DENY for new flows; CRITICAL finding for existing
    EXPIRED_SCC: HIGH finding; 30-day remediation window
    ADEQUACY_REVOKED: CRITICAL finding; immediate halt if no alternative mechanism
```

---

## Integration Graph Queries

```gql
# All integrations with elevated error rates
MATCH (a:ENTERPRISE_SYSTEM)-[r:CALLS]->(b:EXTERNAL_SERVICE)
WHERE r.error_rate > 0.05
RETURN a, b, r.error_rate, r.latency_p99_ms ORDER BY r.error_rate DESC

# Find all cross-border data flows without a valid mechanism
MATCH (a)-[r:SENDS_DATA_TO]->(b)
WHERE r.cross_border = true AND (r.data_transfer_mechanism IS NULL OR r.data_transfer_mechanism = "null")
RETURN a, b, r.data_classification, r.volume_per_day_GB

# Blast radius of external service going offline
MATCH (s:EXTERNAL_SERVICE {service_id: "svc-ai-model"})<-[:DEPENDS_ON_INTEGRATION]-(w:WORKFLOW)
RETURN w, s

# Integration dependency chain for a critical workflow
MATCH path = (w:WORKFLOW {workflow_id: "wf-compliance-report"})-[:DEPENDS_ON_INTEGRATION*1..3]->(s)
RETURN path, s.service_name, s.availability_sla

# DPA coverage check — data processors without DPA
MATCH (es:EXTERNAL_SERVICE {service_type: "AI_MODEL_API"})
WHERE NOT EXISTS {
  MATCH (p:POLICY)-[:GOVERNS_INTEGRATION]->(es)
  WHERE p.governance_type = "DPA"
}
RETURN es.service_name, es.provider
```

---

## Integration Topology Maintenance

```yaml
topology_maintenance:
  registration:
    trigger: new connector deployed or new service onboarded
    required_fields: [service_id, classification, cross_border, region, dpa_reference_if_applicable]
    governance_gate: third-party-risk-management.md assessment required for EXTERNAL_SERVICE

  deregistration:
    trigger: service decommissioned
    action: mark node DEPRECATED; set valid_until on all integration edges; alert dependent workflows

  health_monitoring:
    frequency: every 30 seconds for CRITICAL integrations; every 2 minutes for others
    update: write updated health metrics to integration nodes
    alert_threshold: health drops below 0.75 → INTEGRATION_DEGRADED event

  circuit_breaker_management:
    trips: when error_rate > 30% for > 30 seconds
    probe: half-open after 60 seconds; 10% traffic probe
    restore: if probe succeeds for 30 seconds, fully close
    alert: CIRCUIT_BREAKER_OPEN event to observability system
```

---

## Integration Points

| System | Role |
|---|---|
| `enterprise-topology/dependency-graph.md` | Integration nodes appear as SERVICE_DEP_NODE dependencies |
| `enterprise-topology/runtime-topology-tracker.md` | Real-time health updates flow through runtime tracker |
| `governance-operations/third-party-risk-management.md` | Vendor assessment required for external service nodes |
| `runtime-policies/data-governance-policies.md` | POL-DATA-003 enforced against SENDS_DATA_TO edges |
| `graph-observability/dependency-heatmaps.md` | Integration health visualized in heatmaps |
| `graph-reasoning/impact-propagation-engine.md` | Integration failure blast radius computed here |
