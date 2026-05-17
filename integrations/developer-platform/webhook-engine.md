# Webhook Engine

## Role
Manages outbound webhook delivery from the OS to external systems. Enables event-driven integrations where external applications receive real-time notifications when OS workflows complete, governance events occur, or observability thresholds are crossed.

## Webhook Event Catalog

```
EVENT_TYPE                          TRIGGER                                     DEFAULT_PAYLOAD
────────────────────────────────────────────────────────────────────────────────────────────────
workflow.completed                  workflow reaches terminal state              status, output_summary, artifacts
workflow.failed                     workflow fails after all retries             error, failure_reason, recovery_hint
workflow.gate_failed                quality gate fails                          gate_id, score, required_score
governance.approval_required        workflow enters human approval queue        approval_url, timeout, description
governance.approval_decided         approval decision made                      decision, approver_tier, rationale
compliance.finding_created          new compliance finding generated            finding_id, severity, obligation
compliance.incident_declared        compliance incident declared                severity, regulatory_scope
agent.reliability_degraded          agent reliability drops below band          agent_id, score, previous_band
os.health_changed                   OS health band changes                      from_band, to_band, cause
os.governance_intensity_changed     adaptive governance level changes           from_level, to_level, trigger
```

## Webhook Registration

```yaml
webhook_registration:
  webhook_id: string
  name: string
  endpoint_url: string              # must be HTTPS; no localhost
  events_subscribed: [string]       # event type patterns, wildcards supported
  
  authentication:
    method: HMAC_SHA256 | BEARER | NONE
    secret: string                  # HMAC secret or bearer token
  
  filters:
    workflow_types: [string]        # only events from these workflow types
    severity_minimum: string        # for compliance/governance events
    
  delivery:
    retry_policy: EXPONENTIAL_BACKOFF
    max_retries: 5
    timeout_sec: 30
    
  status: ACTIVE | PAUSED | DISABLED | FAILED
  created_by: string
  created_at: ISO8601
```

## Delivery Protocol

```
ON EVENT EMITTED:
  1. find matching registered webhooks (topic match + filter evaluation)
  2. FOR each matching webhook:
     a. construct payload (event type + data + delivery metadata)
     b. sign payload: HMAC-SHA256(secret, payload_body) in X-OS-Signature header
     c. POST to endpoint_url with timeout=30s
     d. IF 2xx response: DELIVERED; record delivery
     e. IF non-2xx or timeout: RETRY with exponential backoff
     f. IF 5 retries exhausted: FAILED; disable webhook; notify registrant

RETRY SCHEDULE: 30s, 2min, 10min, 30min, 2hr
```

## Security
```
INBOUND VALIDATION (webhook consumer's responsibility):
  verify: X-OS-Signature == HMAC-SHA256(your_secret, raw_body)
  reject: any request where signature doesn't match
  
OUTBOUND SECURITY:
  TLS 1.2+ required on all endpoints
  IP allowlist optional (configurable per webhook)
  Payload data classification: max CONFIDENTIAL in webhook payloads (no RESTRICTED+)
```

## Webhook Health Monitoring
```yaml
webhook_health:
  success_rate_7d: number          # target: > 0.98
  avg_delivery_latency_ms: number  # target: < 500ms
  failed_webhooks: [webhook_id]    # currently disabled due to repeated failures
  pending_retries: number
```

## Persistence
`memory/developer-platform/webhook-registrations.yaml`
`memory/developer-platform/webhook-delivery-log.jsonl`
