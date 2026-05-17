# API Specification

## Role
Complete REST and event API specification for the Enterprise AI OS. Defines all endpoints, request/response schemas, authentication requirements, rate limits, and versioning contract.

## API Base URLs

```
Production:   https://os.enterprise.internal/api/v1
Sandbox:      https://os-sandbox.enterprise.internal/api/v1
Events (SSE): https://os.enterprise.internal/events/v1
WebSocket:    wss://os.enterprise.internal/ws/v1
```

## Authentication

```
Header: Authorization: Bearer {api_key}
        OR
Header: Authorization: Bearer {oauth2_token}

API key format: osk_{env}_{32_char_base64}
OAuth2 flows: client_credentials, authorization_code
Token TTL: API keys non-expiring (rotatable); OAuth tokens 1hr
```

## Core Endpoints

### Workflows
```
POST   /workflows                → submit workflow
GET    /workflows/{id}           → get workflow status
GET    /workflows/{id}/output    → get workflow output
DELETE /workflows/{id}           → cancel workflow
GET    /workflows/{id}/stream    → SSE stream of step updates
GET    /workflows                → list workflows (paginated)

POST /workflows body:
{
  "workflow_type": "feature-development | discovery | architecture-review | ...",
  "intent": "string (plain language description)",
  "context": {},
  "priority": "CRITICAL | HIGH | NORMAL | LOW",
  "callback_url": "string (optional)",
  "timeout_sec": 300
}
```

### Knowledge
```
POST   /knowledge/query          → semantic search
GET    /knowledge/{id}           → retrieve knowledge unit
POST   /knowledge                → submit new knowledge unit
PATCH  /knowledge/{id}           → update knowledge unit
GET    /knowledge/graph/query    → graph traversal query
```

### Agents
```
GET    /agents                   → list agents (filterable by tier, capability)
GET    /agents/{id}              → agent profile
POST   /agents/{id}/invoke       → direct agent invocation (T3+ only)
GET    /agents/{id}/health       → agent health status
```

### Governance
```
GET    /governance/health        → current governance health score
GET    /governance/intensity     → current adaptive governance level
GET    /governance/approvals     → pending approvals queue (T3+ only)
POST   /governance/approvals/{id}/decide → approve/reject (T4+ only)
GET    /compliance/posture        → current compliance score + findings summary
```

### Observability
```
GET    /health                   → OS health summary (all hubs)
GET    /metrics                  → Prometheus-compatible metrics endpoint
GET    /telemetry/workflow        → workflow telemetry snapshot
GET    /telemetry/runtime         → runtime telemetry snapshot
```

### Events (SSE)
```
GET    /events/stream?topic={topic}&filter={filter}  → subscribe to event stream
Topics: workflow.*, governance.*, runtime.*, org.*, knowledge.*
```

## Response Envelope
```json
{
  "data": {...},
  "meta": {
    "request_id": "req_abc123",
    "api_version": "v1",
    "timestamp": "2026-05-15T00:00:00Z",
    "caller_tier": "T2"
  },
  "error": null
}
```

## Error Envelope
```json
{
  "data": null,
  "error": {
    "code": "PERMISSION_DENIED | RATE_LIMITED | VALIDATION_ERROR | ...",
    "message": "human readable",
    "details": {},
    "request_id": "req_abc123",
    "retry_after": 60
  }
}
```

## Pagination
```
Query params: ?page=1&page_size=50&cursor={opaque_cursor}
Response includes: meta.pagination.next_cursor, meta.pagination.total
Max page_size: 100
```

## Versioning
```
Current stable: v1 (2026-05-15)
Versioning strategy: URL path versioning (/api/v1, /api/v2)
Deprecation policy: 12-month notice before removing a version
Breaking changes: new major version only
Non-breaking additions: deployed to current version without notice
```

## Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1716768000
X-RateLimit-Window: 3600
```
