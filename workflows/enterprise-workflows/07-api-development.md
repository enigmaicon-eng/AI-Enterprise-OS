# WF-007: API Development

**Version:** 1.0.0 | **Owner:** Engineering Org | **Tier:** T2 | **Class:** STANDARD | **SLA:** 14 days

## Purpose
Deliver a new API or API version — from approved PRD/ADR through contract-first design, security review, implementation, backward compatibility validation, documentation, and versioned release — following semver and deprecation contracts.

## Inputs

```
REQUIRED:
  prd_id:           artifact_id — approved WF-001 output
  adr_id:           artifact_id — approved WF-005 output
  api_type:         REST | GRAPHQL | GRPC | EVENT | WEBHOOK
  version_type:     MAJOR | MINOR | PATCH | NEW
  team_id:          string

OPTIONAL:
  consumer_teams:   [team_id] — known API consumers
  external_facing:  boolean — true if API exposed outside OS
  sla_target:       {latency_p95_ms, availability_pct, error_rate_max}
```

## Outputs / Artifacts

```
PRIMARY:
  API_SPEC:          OpenAPI 3.1 / protobuf / schema; wiki/engineering/apis/{api_id}/spec.yaml
  API_RUNBOOK:       wiki/runbooks/{api_id}-operations.md
  MIGRATION_GUIDE:   wiki/engineering/apis/{api_id}/migration-v{N}.md (MAJOR version only)
  DEPLOYMENT_RECORD: deployment-audit entry

SECONDARY:
  CONSUMER_NOTICE:   deprecation/change notification to all registered consumers
  LOAD_TEST_REPORT:  performance results vs. SLA targets
  SECURITY_REPORT:   OWASP scan results
```

## Lifecycle States

```
INITIATED → VALIDATING → CONTRACT_DESIGN → SECURITY_REVIEW
  → IMPLEMENTATION → UNIT_INTEGRATION_TESTING → LOAD_TESTING
  → QUALITY_GATE → CONSUMER_REVIEW → STAGING_DEPLOYMENT
  → [MAJOR] MIGRATION_GUIDE → RELEASE_GATE → COMPLETED
  → FAILED | ROLLBACK
```

## Execution Graph

```
S-001  AUTH_CHECK             [GATE: G-AUTH T2+]              Root
S-002  PREREQUISITE_CHECK     [GATE: COMPOUND]                depends_on: S-001
         REQUIRE: prd.status = APPROVED; adr.status = APPROVED
         IF MAJOR version: migration guide required in plan
S-003  CONTRACT_DESIGN        [AGENT: eng-agent]              depends_on: S-002
         Contract-first: full OpenAPI/proto spec BEFORE implementation
         Include: request/response schemas, error codes, auth scheme, rate limits
         Validation: spec linting + schema validity
S-004  BREAKING_CHANGE_ANALYSIS [AGENT: eng-agent]            depends_on: S-003
         Compare vs. previous version
         MAJOR: breaking changes declared; consumers identified; notice required
         MINOR/PATCH: verify strictly backward compatible; block if breaking
S-005  SECURITY_REVIEW        [AGENT: security-agent]         depends_on: S-003
         OWASP API Security Top 10 scan
         Auth/authz review; rate limiting; input validation; data exposure
         EXTERNAL_FACING: mandatory; T4 security approval required
S-006  CONSUMER_NOTIFICATION  [INTEGRATION]                   depends_on: S-004
         MAJOR: notify consumers 14 days before GA; provide migration guide draft
         MINOR/PATCH: notify consumers 3 days before GA
S-007  IMPLEMENTATION         [AGENT: eng-agent]              depends_on: S-005
         Code follows spec; contract-test suite; error handling; observability hooks
S-008  UNIT_INTEGRATION_TEST  [AGENT: qa-agent]               depends_on: S-007
         Contract tests; backward compat tests; error scenario coverage >= 90%
S-009  LOAD_TESTING           [AGENT: qa-agent]               depends_on: S-007
         Ramp to 2× expected peak traffic; measure p50/p95/p99 latency
         Error rate under load < sla_target.error_rate_max
         Pass: all latency targets met at 2× peak
S-010  QUALITY_GATE           [GATE: G-QUALITY]               depends_on: S-008, S-009
         All tests pass; security scan clean; latency within SLA
         Contract test coverage >= 0.95
S-011  CONSUMER_REVIEW        [HUMAN: consumer_teams T2+]     depends_on: S-010
         Consumer teams validate migration path (MAJOR) or new functionality
         SLA: 3 business days  |  Async review with comment resolution
S-012  STAGING_DEPLOYMENT     [WORKFLOW: WF-011]              depends_on: S-011
         Deploy to staging; verify live with staging consumers
S-013  MIGRATION_GUIDE_FINAL  [AGENT: eng-agent]              depends_on: S-012
         MAJOR only: finalize migration guide; validate all migration paths tested
S-014  RELEASE_GATE           [GATE: G-RELEASE]               depends_on: S-012, S-013
         production-safety-system.md 6-step release protocol
         EXTERNAL: T4 security approval required
S-015  PRODUCTION_RELEASE     [WORKFLOW: WF-010 + WF-011]     depends_on: S-014
S-016  DEPRECATION_SETUP      [AGENT: eng-agent]              depends_on: S-015
         MAJOR: set old version deprecation date (now + 30 days)
                set removal date (now + 60 days) per distribution policy
S-017  ARTIFACT_PERSIST       [INTEGRATION]                   depends_on: S-015–S-016
S-018  MEMORY_UPDATE          [SYSTEM]                        depends_on: S-017
S-019  COMPLETION_EVENT       [SYSTEM]                        depends_on: S-018
```

## Approval Gates

```
G-AUTH:    initiator >= T2; PRD and ADR approved
G-QUALITY: all tests pass; security scan clean; SLA targets met at 2× load
G-RELEASE: per production-safety-system.md; T4 security if external-facing
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
Security scan critical finding           Block; T4 security review   2hr
Breaking change in MINOR/PATCH version   Block; force MAJOR bump     Immediate
Consumer review SLA breach (3d)          T3 escalation + extension   4hr
Load test fails SLA at 2× peak           Perf review; rearchitect    48hr
```

## Governance Checkpoints

```
C-003: API spec before implementation (contract-first)
C-004: migration guide for every MAJOR version
SEMVER: automated validator blocks MINOR/PATCH with breaking changes
DEPRECATION: 30-day notice; 60-day removal per marketplace-distribution.md
EXTERNAL API: T4 security approval + DPO check if PII in API payload
```

## Observability

```
HEALTH METRICS:
  avg_delivery_cycle_days:  target <= 14
  spec_to_code_adherence:   contract test pass rate >= 0.95
  consumer_migration_rate:  (MAJOR) pct consumers migrated by deprecation date
  load_test_pass_rate:      target >= 0.90
  security_scan_clean_rate: target = 1.00 (zero unaddressed critical findings)

POST-LAUNCH (ongoing):
  p95_latency_ms:       vs. sla_target; alert if > 1.5× SLA
  error_rate:           vs. sla_target.error_rate_max
  consumer_error_rate:  per consumer; spike → alert consumer team lead
```

## Telemetry Events

```
enterprise.workflows.WF-007.initiated       {api_id, version_type, api_type}
enterprise.workflows.WF-007.breaking_change {severity, consumers_affected, notice_sent}
enterprise.workflows.WF-007.gate.G-QUALITY  {result, test_coverage, load_results}
enterprise.workflows.WF-007.gate.G-RELEASE  {result, approver, security_reviewed}
enterprise.workflows.WF-007.completed       {api_id, version, deprecation_date}
```

## Rollback System

```
ROLLBACK WINDOW: 30 days post-GA (deployment-intelligence rollback)
ROLLBACK TRIGGER: critical security vulnerability; consumer-breaking regression

ROLLBACK STEPS:
  R-1: route traffic back to previous version (< 10s via version-manager.md)
  R-2: notify all consumers of rollback; provide ETA for fix
  R-3: open investigation ticket; trigger WF-013 if consumer impact
  R-4: set new version to DEPRECATED; old version to ACTIVE
  R-5: fix + re-run full WF-007 cycle before re-releasing
```

## Enterprise System Integrations

```
GITHUB:    S-003 → API spec PR; S-007 → implementation PR
JIRA:      S-002 → create API epic + consumer migration sub-tasks
SLACK:     S-006 → notify consumer teams in #api-consumers
API_GATEWAY: S-015 → deploy to API gateway; configure rate limits
DOCS_PORTAL: S-017 → publish API documentation
```

## Wiki Updates

```
wiki/engineering/apis/{api_id}/spec.yaml         ← OpenAPI spec (versioned)
wiki/engineering/apis/{api_id}/migration-v{N}.md ← migration guide (MAJOR)
wiki/runbooks/{api_id}-operations.md             ← operations runbook
wiki/architecture/api-catalog.md                 ← add API to catalog
```

## Memory Updates

```
memory/developer-platform/api-keys.yaml           ← if new external API: register
memory/deployment-intelligence/version-registry.yaml ← API version record
memory/data-fabric/catalog-index.yaml             ← register API as data entity
```
