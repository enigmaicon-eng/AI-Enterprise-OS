# Extension Governance

## Role
Defines the governance framework for OS extensions: who reviews them, what security standards apply, how violations are handled, and how the extension ecosystem is kept safe and high-quality over time.

## Governance Principles

1. **Least Capability** — extensions receive only the capabilities they demonstrably need
2. **External = Enhanced Isolation** — all externally authored extensions run in ENHANCED isolation minimum
3. **Auditability** — every extension invocation is logged; no silent side effects
4. **Revocability** — any extension can be suspended immediately if it violates its contract
5. **No Constitutional Bypass** — extensions cannot be used to circumvent constitutional principles

## Review Authority Matrix

```
EXTENSION_TYPE          PRIMARY_REVIEWER        SECONDARY_REVIEWER      APPROVER
──────────────────────────────────────────────────────────────────────────────────────
AGENT_EXTENSION         AI-Native org (T3)      Security (T3)           T4 sign-off
WORKFLOW_EXTENSION      Delivery org (T2)       Orchestration (T2)      T3 sign-off
CONNECTOR_EXTENSION     Integration arch (T3)   Security (T3) + DPO     T4 sign-off
KNOWLEDGE_EXTENSION     Knowledge Lead (T3)     Security (T2)           T3 sign-off
EVALUATION_EXTENSION    QA Lead (T3)            AI-Native (T2)          T3 sign-off
TOOL_EXTENSION          Architecture (T3)       Security (T3)           T4 sign-off
TEMPLATE_EXTENSION      Delivery org (T2)       None                    T2 sign-off
```

## Security Standards

### Mandatory Security Requirements (all extensions)
```
SEC-EXT-001: No hardcoded credentials or API keys
SEC-EXT-002: No access to memory layers beyond declared scope
SEC-EXT-003: No direct agent-to-agent messaging (must route through orchestrator)
SEC-EXT-004: No filesystem access outside sandbox workspace
SEC-EXT-005: No outbound network calls to undeclared endpoints
SEC-EXT-006: No modification of OS policies, governance rules, or constitutional files
SEC-EXT-007: All user data passed through must respect data classification ceiling
```

### Enhanced Requirements (CONNECTOR and AGENT extensions)
```
SEC-EXT-008: mTLS for all external service communication
SEC-EXT-009: Token rotation mechanism for any long-lived credentials
SEC-EXT-010: Rate limiting on all outbound calls
SEC-EXT-011: Anomaly detection enabled (per connector-permission-registry.md rules)
```

## Continuous Compliance Monitoring

```
RUNTIME_MONITORING (every invocation):
  - actual_capabilities_used tracked vs. declared_capabilities
  - resource_usage tracked vs. declared_limits
  - any undeclared network calls: immediate suspension

WEEKLY_REVIEW:
  - flag extensions where actual_usage drifts > 10% from declared
  - security scan re-run if extension updated (any version)

MONTHLY_AUDIT:
  - full capability re-verification for all T2-ceiling extensions
  - dependency vulnerability re-scan
  - author organization status verification
```

## Violation Response

```
SEVERITY          EXAMPLES                                    RESPONSE
────────────────────────────────────────────────────────────────────────────
MINOR             Exceeds resource limits slightly            Warning + limit enforcement
MODERATE          Undeclared read of INTERNAL data            48hr fix window or suspension
MAJOR             Undeclared tool call or network access      Immediate suspension
CRITICAL          Constitutional bypass attempt               Permanent rejection + security incident
```

## Extension Ecosystem Health Metrics
```yaml
ecosystem_health:
  total_active_extensions: number
  security_grade_A_pct: number        # target: > 80%
  avg_rating: number                  # target: > 4.0
  violations_last_30d: number         # target: 0 MAJOR/CRITICAL
  pending_reviews_over_sla: number    # target: 0
  deprecated_still_in_use_pct: number # target: < 5%
```

## Persistence
`memory/extension-registry/governance-log.jsonl`
`memory/extension-registry/violation-records.yaml`
