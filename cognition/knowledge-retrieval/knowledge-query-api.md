# Knowledge Query API

## Purpose
The public interface through which all agents and systems programmatically access organizational knowledge. Provides a consistent, versioned, governed API surface that abstracts over the underlying storage layers, search indexes, and access control systems.

---

## API Overview

```yaml
api:
  version: v1
  base_path: knowledge-query/v1
  authentication: enterprise-identity (caller_id required on all requests)
  authorization: per-request access check against KU access_level
  rate_limiting: per-caller tier (see rate limits below)
  audit: all requests logged with caller, query, result counts, latency
```

---

## Endpoints

### search

```yaml
endpoint: knowledge-query/v1/search
method: POST
description: Full-text, semantic, and faceted search across the knowledge repository

request:
  query_text: string                     # natural language query (required)
  filters:
    domain: [string]                     # e.g., ["GOVERNANCE", "PROCESS"]
    knowledge_type: [string]
    tags: {include: [string], exclude: [string]}
    status: [string]                     # default: ["ACTIVE"]
    min_quality: float                   # default: 0.50
    published_after: ISO-8601
    published_before: ISO-8601
  pagination:
    page: int                            # default: 1
    page_size: int                       # default: 10, max: 50
  options:
    include_deprecated: boolean          # default: false
    include_related: boolean             # default: true
    include_facets: boolean              # default: true

response:
  query_id: string
  total_matches: int
  results: [KURef]
  facets: {}
  latency_ms: int

performance:
  p50: < 200ms
  p95: < 500ms
  p99: < 1s
```

### get

```yaml
endpoint: knowledge-query/v1/get/{unit_id}
method: GET
description: Retrieve a single knowledge unit by ID

path_params:
  unit_id: string

query_params:
  version: "latest" | version_number    # default: "latest"
  include_related: boolean              # default: false
  include_version_history: boolean      # default: false

response:
  knowledge_unit: KnowledgeUnit         # full schema per knowledge-model.md
  access_metadata: {access_level, caller_can_edit, caller_can_deprecate}
  related_units: [KURef] | null
  version_history: [VersionRecord] | null

errors:
  404: unit not found or ARCHIVED (direct ID lookup still returns 200 for authorized callers with audit log)
  403: caller lacks access to this unit's access_level

performance:
  by_id: p50 < 10ms, p99 < 50ms
```

### get_by_slug

```yaml
endpoint: knowledge-query/v1/slug/{slug}
method: GET
description: Retrieve a knowledge unit by its human-friendly slug

path_params:
  slug: string                          # kebab-case slug

response: same as /get/{unit_id}

performance: p50 < 20ms
```

### related

```yaml
endpoint: knowledge-query/v1/related/{unit_id}
method: GET
description: Find units related to a given unit (graph traversal)

path_params:
  unit_id: string

query_params:
  relationship_types: [string]          # default: all types
  direction: OUTBOUND | INBOUND | BOTH  # default: BOTH
  depth: int                            # 1–5, default: 1
  min_strength: float                   # edge strength floor, default: 0.0

response:
  unit_id: string
  related: [
    {unit_id, title, relationship_type, direction, strength, via_path: [unit_id]}
  ]
  total: int

performance:
  depth_1: p50 < 50ms
  depth_3: p50 < 200ms
  depth_5: p50 < 500ms
```

### semantic_similar

```yaml
endpoint: knowledge-query/v1/similar/{unit_id}
method: GET
description: Find semantically similar units (embedding nearest-neighbor)

path_params:
  unit_id: string

query_params:
  top_k: int                            # default: 10, max: 50
  min_similarity: float                 # default: 0.70
  same_domain_only: boolean             # default: false

response:
  unit_id: string
  similar: [
    {unit_id, title, similarity_score, domain, knowledge_type}
  ]

performance: p50 < 200ms
```

### provenance_lookup

```yaml
endpoint: knowledge-query/v1/provenance
method: POST
description: Find knowledge units derived from specific workflow instances, decisions, or incidents

request:
  origin_refs: [string]                  # workflow_instance_id, decision_id, incident_id
  origin_type: [string]                  # WORKFLOW_EXTRACTION, DECISION_CAPTURE, INCIDENT_LESSON

response:
  results: [KURef with provenance details]
  total: int

performance: p50 < 100ms
```

### query_builder (structured queries)

```yaml
endpoint: knowledge-query/v1/query
method: POST
description: Execute structured queries using CEL-based filter expressions

request:
  filter_expression: string             # CEL expression over KU fields
  order_by: [{field, direction}]
  limit: int                            # max: 200
  
  examples:
    - filter: "domain == 'INCIDENT' && quality.overall_quality >= 0.80"
    - filter: "tags.has('time-sensitive') && lifecycle.next_review < now()"
    - filter: "usage.retrieval_count > 100 && usage.usefulness_score < 0.60"

response:
  results: [KURef]
  total: int
  query_time_ms: int

security: CEL expression sandboxed; no side effects; field access limited to KU schema

performance: p50 < 500ms, p99 < 2s
```

### feedback

```yaml
endpoint: knowledge-query/v1/feedback
method: POST
description: Submit retrieval and application feedback on a knowledge unit

request:
  unit_id: string
  query_id: string | null               # if feedback is on a search result
  feedback_type: APPLIED | HELPFUL | NOT_RELEVANT | INCORRECT | OUTDATED
  context: {workflow_id, case_id, incident_id} | null
  notes: string | null                  # optional free-text feedback

response:
  recorded: boolean
  feedback_id: string

effects:
  APPLIED: increments usage.application_count
  HELPFUL: contributes to usefulness_score
  NOT_RELEVANT: negative relevance signal; may adjust contextual delivery model
  INCORRECT: flags for accuracy review; alerts knowledge steward
  OUTDATED: triggers scheduled review of that unit
```

---

## Rate Limits

```yaml
rate_limits:
  by_tier:
    Tier-1: 100 requests/minute, 5000/hour
    Tier-2: 200 requests/minute, 10000/hour
    Tier-3: 500 requests/minute, 20000/hour
    Tier-4: 1000 requests/minute, 50000/hour
    AI-agent: 500 requests/minute per agent, 20000/hour
  
  burst_allowance: 2× sustained rate for up to 30 seconds
  
  rate_limit_headers:
    X-RateLimit-Limit: sustained limit
    X-RateLimit-Remaining: remaining in current window
    X-RateLimit-Reset: UTC timestamp of window reset
  
  on_limit_exceeded:
    response: 429 Too Many Requests
    retry_after: X-Retry-After header with wait seconds
```

---

## Error Codes

```yaml
error_codes:
  400_BAD_REQUEST: malformed query, invalid filter expression, missing required field
  401_UNAUTHORIZED: no valid caller identity
  403_FORBIDDEN: caller lacks access to requested KU
  404_NOT_FOUND: unit_id or slug not found
  422_UNPROCESSABLE: CEL expression invalid, taxonomy value unrecognized
  429_TOO_MANY_REQUESTS: rate limit exceeded
  503_UNAVAILABLE: search index temporarily unavailable (with degraded mode indicator)
  
  error_response_schema:
    error_code: string
    message: string
    details: {} | null
    request_id: string
    degraded_mode: boolean
```

---

## API Audit

```yaml
api_audit:
  logged_per_request:
    - caller_id
    - endpoint
    - query_summary (first 200 chars; no PII)
    - filters applied
    - result_count
    - access_filtered_count (results hidden by access control)
    - latency_ms
    - error_code | null
  
  retention: 2 years
  
  audit_reports:
    most_active_callers: weekly
    most_queried_domains: weekly
    zero_result_queries: daily (knowledge gap signals)
    forbidden_access_attempts: daily (security signal)
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-retrieval/semantic-search-engine.md` | Search execution |
| `knowledge-base/knowledge-repository.md` | Storage layer access |
| `knowledge-retrieval/knowledge-recommendation-engine.md` | Recommendation endpoint |
| `knowledge-retrieval/contextual-knowledge-delivery.md` | Delivery system backend |
| `knowledge-governance/knowledge-accuracy-monitor.md` | Feedback processing |
| `knowledge-capture/expert-knowledge-elicitation.md` | Zero-result gap signals |
