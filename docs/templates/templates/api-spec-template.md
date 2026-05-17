---
type: api-specification
version: "1.0.0"
api-name: <API Name>
api-version: v1
status: draft | review | approved | deprecated
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
author: architect-agent
owner-team: <team>
base-url: https://api.<domain>.com/v1
openapi-ref: implementation/api-specs/<slug>.yaml
rfc-ref: rfc/<date>-<slug>.md
adr-ref: architecture/decisions/ADR-NNN.md
---

# API Specification: <API Name> v<N>

> **Status:** `DRAFT`
> **Base URL:** `https://api.<domain>.com/v1`
> **Auth:** Bearer token (JWT) / API Key / OAuth 2.0

---

## ① Overview

### 1.1 Purpose

`<What this API does and what system or capability it exposes>`

### 1.2 Audience

- **Primary consumers:** `<teams, services, or user types>`
- **Authentication required:** Yes — `<auth type>`
- **Rate limited:** Yes — `<see §3>`

### 1.3 Design Principles

1. **RESTful**: Resources are nouns; HTTP verbs express actions
2. **Consistent**: All responses follow the standard envelope schema
3. **Explicit errors**: Every error has a machine-readable code and human-readable message
4. **Versioned**: Breaking changes are never made without a version bump
5. **Idempotent writes**: PUT and DELETE are idempotent; POST is not unless noted

### 1.4 Changelog Summary

| Version | Date | Type | Summary |
|---------|------|------|---------|
| 1.0.0 | `<date>` | new | Initial release |

---

## ② Conventions

### 2.1 Base URL & Versioning

```
Production:  https://api.<domain>.com/v1
Staging:     https://api-staging.<domain>.com/v1
Local:       http://localhost:8080/v1

Versioning strategy: URI path versioning (/v1/, /v2/)
Deprecated version sunset: 12 months after next version GA
```

### 2.2 Authentication

```
Header: Authorization: Bearer <token>

Token type:     JWT (RS256)
Token lifetime: 1 hour (access), 30 days (refresh)
Scopes:         read:resource  write:resource  admin:resource

# API Key alternative (for server-to-server):
Header: X-API-Key: <key>
Scope: determined by key configuration
```

### 2.3 Standard Request Headers

```http
Content-Type:     application/json
Accept:           application/json
Authorization:    Bearer <token>
X-Request-ID:     <uuid>          # Idempotency key for POST/PUT
X-Idempotency-Key: <uuid>         # Retry-safe for mutations
```

### 2.4 Standard Response Envelope

**Success:**
```json
{
  "data": <resource or array>,
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO-8601",
    "version": "1.0.0"
  },
  "pagination": {             // Omitted for single-resource responses
    "page": 1,
    "per_page": 25,
    "total": 142,
    "next_cursor": "base64string",
    "prev_cursor": null
  }
}
```

**Error:**
```json
{
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Human-readable message suitable for logging",
    "detail": "Optional additional context",
    "field": "field_name",           // For validation errors
    "request_id": "uuid",
    "docs_url": "https://docs.<domain>.com/errors/MACHINE_READABLE_CODE"
  }
}
```

### 2.5 HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|----------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation failure, malformed request |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Auth valid, but insufficient permissions |
| 404 | Not Found | Resource doesn't exist or caller can't see it |
| 409 | Conflict | Resource already exists; idempotency conflict |
| 422 | Unprocessable | Semantically invalid (passes schema, fails business rules) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unhandled server-side error |
| 503 | Service Unavailable | Downstream dependency down; retry with backoff |

### 2.6 Pagination

```
Default page size: 25
Maximum page size: 100
Strategy: cursor-based (not offset — safe for real-time data)

Request:  GET /resources?cursor=<base64>&per_page=25
Response: { data: [...], pagination: { next_cursor: "...", ... } }
```

### 2.7 Timestamps

All timestamps in ISO 8601 UTC: `2026-05-08T14:32:00Z`

### 2.8 IDs

All resource IDs: UUIDs v4 (`550e8400-e29b-41d4-a716-446655440000`)

---

## ③ Rate Limiting

```
Default limit:    1,000 requests / minute / API key
Write limit:      100 requests / minute / API key
Burst allowance:  2× limit for up to 10 seconds

Response headers when approaching limit:
  X-RateLimit-Limit:     1000
  X-RateLimit-Remaining: 423
  X-RateLimit-Reset:     1715176800   (Unix timestamp)

429 response body:
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Retry after X seconds.",
    "retry_after": 42
  }
}
```

**Retry guidance:** Exponential backoff with jitter. Base: 1s. Max: 60s. Max retries: 5.

---

## ④ Resources & Endpoints

### Resource: `<ResourceName>`

**Description:** `<what this resource represents>`
**Base path:** `/resources`
**Data model:** `§7.<N>`

---

#### `GET /resources`

List all resources accessible to the caller.

**Authorization:** `read:resources`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|---------|---------|------------|
| `cursor` | string | No | null | Pagination cursor |
| `per_page` | integer | No | 25 | Results per page (max: 100) |
| `status` | enum | No | all | Filter: `active`, `archived`, `all` |
| `created_after` | ISO-8601 | No | — | Filter by creation date |
| `sort` | string | No | `created_at:desc` | `field:asc` or `field:desc` |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Example Resource",
      "status": "active",
      "created_at": "2026-05-08T14:32:00Z",
      "updated_at": "2026-05-08T14:32:00Z"
    }
  ],
  "meta": { "request_id": "...", "timestamp": "..." },
  "pagination": { "page": 1, "per_page": 25, "total": 142, "next_cursor": "abc123" }
}
```

**Error Responses:**

| Code | Error Code | Condition |
|------|-----------|----------|
| 401 | `UNAUTHORIZED` | Missing or expired token |
| 403 | `FORBIDDEN` | Token lacks `read:resources` scope |

---

#### `POST /resources`

Create a new resource.

**Authorization:** `write:resources`
**Idempotency:** Supported via `X-Idempotency-Key` header

**Request Body:**
```json
{
  "name": "string",              // required, 1–255 chars
  "description": "string",       // optional, max 2000 chars
  "status": "active",            // optional, default: "active"
  "metadata": {                  // optional, arbitrary key-value
    "key": "value"
  }
}
```

**Request Body Schema:**

| Field | Type | Required | Constraints | Description |
|-------|------|---------|------------|------------|
| `name` | string | **Yes** | 1–255 chars | Display name |
| `description` | string | No | max 2000 chars | Optional description |
| `status` | enum | No | `active`, `inactive` | Defaults to `active` |
| `metadata` | object | No | max 10 keys, string values | Arbitrary metadata |

**Response `201 Created`:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Example Resource",
    "status": "active",
    "created_at": "2026-05-08T14:32:00Z",
    "updated_at": "2026-05-08T14:32:00Z"
  },
  "meta": { "request_id": "..." }
}
```

**Error Responses:**

| Code | Error Code | Condition |
|------|-----------|----------|
| 400 | `VALIDATION_ERROR` | Missing required field or constraint violated |
| 409 | `ALREADY_EXISTS` | Resource with this name already exists |
| 422 | `BUSINESS_RULE_VIOLATION` | Passes schema but violates a business rule |

---

#### `GET /resources/{id}`

Retrieve a single resource by ID.

**Authorization:** `read:resources`
**Path Parameters:** `id` (UUID, required)

**Response `200 OK`:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Example Resource",
    "status": "active",
    "created_at": "2026-05-08T14:32:00Z",
    "updated_at": "2026-05-08T14:32:00Z"
  }
}
```

**Error Responses:**

| Code | Error Code | Condition |
|------|-----------|----------|
| 404 | `NOT_FOUND` | Resource doesn't exist or caller can't see it |

---

#### `PATCH /resources/{id}`

Partially update a resource. Only provided fields are updated.

**Authorization:** `write:resources`
**Path Parameters:** `id` (UUID, required)

**Request Body:** Same schema as POST, all fields optional.

**Response `200 OK`:** Updated resource object (same as GET response).

**Error Responses:**

| Code | Error Code | Condition |
|------|-----------|----------|
| 400 | `VALIDATION_ERROR` | Field constraint violated |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Concurrent modification detected |

---

#### `DELETE /resources/{id}`

Soft-delete a resource (status → `archived`). Hard delete requires admin scope.

**Authorization:** `write:resources` (soft delete) · `admin:resources` (hard delete)
**Path Parameters:** `id` (UUID, required)

**Response `204 No Content`**

**Error Responses:**

| Code | Error Code | Condition |
|------|-----------|----------|
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource has active dependents |

---

### Resource: `<ResourceName2>`

_(repeat endpoint pattern)_

---

## ⑤ Webhooks

_If this API emits webhooks, document them here. Otherwise delete this section._

### 5.1 Delivery Mechanism

```
Protocol:      HTTPS POST
Retry policy:  5 attempts with exponential backoff (1s, 2s, 4s, 8s, 16s)
Timeout:       5 seconds per attempt
Failure:       After 5 attempts, event is dropped; webhook marked unhealthy
Signature:     HMAC-SHA256 — header: X-Signature: sha256=<hash>
```

### 5.2 Webhook Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `resource.created` | Resource created | Resource object |
| `resource.updated` | Resource modified | Resource object + `changed_fields` |
| `resource.deleted` | Resource soft-deleted | `{ id, deleted_at }` |

### 5.3 Webhook Payload

```json
{
  "id": "evt_uuid",
  "type": "resource.created",
  "created_at": "2026-05-08T14:32:00Z",
  "api_version": "1.0.0",
  "data": {
    "object": { <resource object> }
  }
}
```

### 5.4 Signature Verification

```python
import hmac, hashlib

def verify(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

---

## ⑥ Error Codes Reference

Complete list of all machine-readable error codes this API emits.

| Code | HTTP Status | Description | Resolution |
|------|------------|------------|-----------|
| `UNAUTHORIZED` | 401 | Token missing or expired | Refresh token or re-authenticate |
| `FORBIDDEN` | 403 | Insufficient scope | Request additional permissions |
| `NOT_FOUND` | 404 | Resource not found | Verify ID and that caller has access |
| `VALIDATION_ERROR` | 400 | Field constraint violated | Check `error.field` and fix input |
| `ALREADY_EXISTS` | 409 | Duplicate resource | Use existing resource or change name |
| `BUSINESS_RULE_VIOLATION` | 422 | Violates domain logic | See `error.detail` for specifics |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Retry after `retry_after` seconds |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Retry once; if persists, contact support with `request_id` |
| `SERVICE_UNAVAILABLE` | 503 | Upstream dependency down | Retry with exponential backoff |

---

## ⑦ Data Models

### 7.1 `Resource` Object

| Field | Type | Nullable | Description |
|-------|------|---------|------------|
| `id` | UUID | No | Unique identifier |
| `name` | string | No | Display name |
| `description` | string | Yes | Optional description |
| `status` | enum | No | `active` · `inactive` · `archived` |
| `metadata` | object | Yes | Arbitrary key-value pairs |
| `created_at` | ISO-8601 | No | Creation timestamp (UTC) |
| `updated_at` | ISO-8601 | No | Last modification timestamp (UTC) |
| `created_by` | UUID | No | User ID of creator |

### 7.2 `<ResourceName2>` Object

_(repeat)_

---

## ⑧ SDK & Integration Notes

### 8.1 Recommended Libraries

| Language | Library | Notes |
|---------|---------|-------|
| TypeScript/JS | `@<domain>/api-client` | Official SDK |
| Python | `<domain>-python` | Official SDK |
| Other | Use OpenAPI generator | `openapi-generator-cli` |

### 8.2 Authentication Setup

```typescript
import { ApiClient } from '@<domain>/api-client';

const client = new ApiClient({
  baseUrl: 'https://api.<domain>.com/v1',
  apiKey: process.env.API_KEY,       // server-to-server
  // OR
  getAccessToken: async () => await refreshToken(),  // user auth
});
```

### 8.3 Error Handling Pattern

```typescript
try {
  const result = await client.resources.create({ name: 'My Resource' });
} catch (err) {
  if (err.status === 429) {
    await sleep(err.retryAfter * 1000);
    // retry
  } else if (err.status >= 500) {
    // log and retry with backoff
  } else {
    // 4xx: fix the request; do not retry
    logger.error(err.code, err.message);
  }
}
```

---

## ⑨ Changelog

| Version | Date | Type | Breaking? | Changes |
|---------|------|------|---------|---------|
| 1.0.0 | `<date>` | new | — | Initial release |
| 1.1.0 | | feature | No | Added `metadata` field to Resource |
| 2.0.0 | | breaking | **Yes** | `DELETE` now returns 204 (was 200) |

**Deprecation policy:** Breaking changes require a new major version. Old version supported for minimum 12 months after new version GA.

---

## ⑩ OpenAPI Reference

Machine-readable spec: `implementation/api-specs/<slug>.yaml` (OpenAPI 3.1)

To generate client SDK:
```bash
npx @openapitools/openapi-generator-cli generate \
  -i implementation/api-specs/<slug>.yaml \
  -g typescript-fetch \
  -o ./sdk/typescript
```
