# WF-010: Release Governance

**Version:** 1.0.0 | **Owner:** Delivery Org | **Tier:** T3 | **Class:** CRITICAL | **SLA:** 2 days

## Purpose
Gate every production release through a structured multi-stakeholder sign-off process — QA, security, architecture, executive, and compliance — ensuring no release enters production without evidence-based approval and a tested rollback plan.

## Inputs

```
REQUIRED:
  release_id:         string — unique release identifier
  release_type:       FEATURE | HOTFIX | MAJOR | SECURITY_PATCH | SCHEMA_MIGRATION
  components:         [component_id] — what is being released
  change_summary:     string — human-readable what changed
  test_evidence:      artifact_id — test run results
  requestor_id:       string — T3 release manager

OPTIONAL:
  customer_impact:    boolean — does this change directly affect customer-facing behavior?
  regulatory_change:  boolean — compliance-driven release
  rollback_plan_id:   artifact_id — pre-tested rollback procedure
```

## Outputs / Artifacts

```
PRIMARY:
  RELEASE_RECORD:     deployment-audit entry (SHA-256 hash-chained)
  RELEASE_CHECKLIST:  signed checklist of all gate approvals
  RELEASE_NOTES:      wiki/releases/{release_id}.md

SECONDARY:
  ROLLBACK_RUNBOOK:   tested rollback procedure with verification steps
  CUSTOMER_COMMS:     if customer_impact = true
```

## Lifecycle States

```
INITIATED → VALIDATING → QA_GATE → SECURITY_GATE
  → [schema change / API change] ARCHITECTURE_GATE
  → [customer_impact / MAJOR] EXEC_GO_NO_GO
  → [regulatory_change] COMPLIANCE_GATE
  → RELEASE_APPROVED → DEPLOYMENT_QUEUE → COMPLETED
  → BLOCKED (any gate fail) → NO_GO_DECISION → FAILED
```

## Execution Graph

```
S-001  AUTH_CHECK              [GATE: G-AUTH T3+]              Root
S-002  RELEASE_MANIFEST        [AGENT: delivery-agent]         depends_on: S-001
         Compile: all components, versions, changelogs, test coverage
         Verify: all components have passed CI/CD; no unresolved CRITICAL issues
S-003  ROLLBACK_PLAN_CHECK     [GATE: COMPOUND]                depends_on: S-002
         Verify: rollback_plan exists and was tested in staging
         Verify: rollback estimated time < 10 minutes
         BLOCK if: no tested rollback plan
S-004  QA_GATE                 [GATE: G-QUALITY]               depends_on: S-002
         Criteria: all test suites passing; code coverage >= 80%
         E2E tests passing; regression tests passing
         Performance tests within ±10% of baseline
         SLA: 4hr  |  T3 QA lead sign-off
S-005  SECURITY_GATE           [GATE: G-SECURITY]              depends_on: S-002
         SAST/DAST scan results: no CRITICAL or HIGH findings unaddressed
         Dependency vulnerability scan: no CVSS >= 7.0 unaddressed
         SLA: 4hr  |  T4 security lead sign-off required for MAJOR/SECURITY_PATCH
S-006  ARCHITECTURE_GATE       [GATE: G-ARCH]                  depends_on: S-002
         REQUIRED IF: API contract change OR database schema change OR new service
         T4 architect sign-off  |  SLA: 4hr
S-007  COMPLIANCE_GATE         [GATE: G-LEGAL]                 depends_on: S-002
         REQUIRED IF: regulatory_change = true
         T4 DPO/CISO sign-off  |  SLA: 24hr (regulatory releases need deliberation)
S-008  EXEC_GO_NO_GO           [GATE: G-EXEC]                  depends_on: S-004–S-007
         REQUIRED IF: customer_impact = true OR release_type = MAJOR
         T5 CPO or T4 CTO synchronous  |  SLA: 2hr
         Review: QA evidence, security status, rollback plan, customer comms
S-009  RELEASE_APPROVAL_RECORD [SYSTEM]                        depends_on: S-008 or S-007
         Create: signed release record with all gate approvals
         SHA-256 hash-chain entry in deployment-audit.jsonl
S-010  DEPLOYMENT_QUEUE        [WORKFLOW: WF-011]              depends_on: S-009
         Hand off to WF-011 (Rollout Governance) for deployment
S-011  CUSTOMER_COMMS          [INTEGRATION]                   depends_on: S-009
         If customer_impact: send release notes; schedule announcement
S-012  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-009–S-011
S-013  MEMORY_UPDATE           [SYSTEM]                        depends_on: S-012
S-014  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-013
```

## Approval Gates

```
G-AUTH:      requestor >= T3; all components have passing CI
G-QUALITY:   QA lead sign-off; all required tests passing; coverage >= 80%
G-SECURITY:  no unaddressed CRITICAL/HIGH findings; T4 for MAJOR/SECURITY_PATCH
G-ARCH:      T4 architect; required for schema or API contract changes
G-LEGAL:     T4 DPO; required for regulatory releases; 24hr SLA
G-EXEC:      T5 CPO or T4 CTO; required for customer-facing MAJOR releases
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
Any gate SLA breach (4hr QA/Security)    Escalate to T4              1hr response
G-EXEC SLA breach (2hr)                  T5 escalation               30min response
Security CRITICAL finding at release     BLOCK; T4 security review   Immediate
No rollback plan                         BLOCK; create rollback plan first
Hotfix: customer production impact       Fast-track: T4 direct auth  30min SLA
```

## Governance Checkpoints

```
C-001: human sign-off at every gate; no automated release without approval chain
C-003: release record artifact with all approvals before deployment
C-004: every release decision (including NO_GO) recorded with reason
AUDIT: SHA-256 hash-chained deployment record; tamper-evident
ROLLBACK: tested rollback plan is mandatory; no exceptions
REGULATORY: DPO gate cannot be bypassed for regulatory releases
```

## Observability

```
HEALTH METRICS:
  release_cycle_time_hr:      target <= 48hr
  gate_pass_rate:             QA target >= 0.90; Security target >= 0.85
  no_go_rate:                 diagnostic; high = quality issues upstream
  rollback_rate:              target < 0.05 post-release
  hotfix_rate:                target < 0.10 (high = quality gates not catching issues)

RELEASE FREQUENCY: tracked as DORA deployment_frequency metric
```

## Telemetry Events

```
enterprise.workflows.WF-010.initiated       {release_id, type, components}
enterprise.workflows.WF-010.gate.G-QUALITY  {result, coverage, test_pass_rate}
enterprise.workflows.WF-010.gate.G-SECURITY {result, findings_count, critical_count}
enterprise.workflows.WF-010.gate.G-EXEC     {result, approver, customer_impact}
enterprise.workflows.WF-010.no_go           {reason, gate, blocking_findings}
enterprise.workflows.WF-010.approved        {release_id, approval_chain_hash}
enterprise.workflows.WF-010.completed       {release_id, deployment_queued}
```

## Rollback System

```
ROLLBACK WINDOW: N/A (release governance itself is not rolled back; rollback is at WF-011)
NO_GO DECISION: block deployment; require fix + full re-run of failed gate
GATE_FAIL: specific gate fails → go back to development; re-submit changed components
```

## Enterprise System Integrations

```
JIRA:         S-002 → link release to all component tickets; close completed items
CI/CD:        S-002 → pull CI results; S-010 → trigger deployment pipeline
SLACK:        S-014 → notify #releases with release_id, scope, deployment ETA
PAGERDUTY:    S-010 → alert on-call of pending deployment
STATUS_PAGE:  S-011 → post maintenance window if needed
```

## Wiki Updates

```
wiki/releases/{release_id}.md              ← release notes + gate approvals
wiki/delivery/release-history.md           ← append release entry
wiki/runbooks/{component}-rollback.md      ← verify rollback runbook is current
```

## Memory Updates

```
memory/deployment-intelligence/deployment-queue.yaml  ← add approved release
memory/deployment-intelligence/version-registry.yaml  ← pre-deployment version snapshot
```
