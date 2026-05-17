# Extension Lifecycle

## Role
Manages the complete lifecycle of OS extensions from submission through activation, operation, and retirement. Enforces governance gates at each transition to ensure only safe, high-quality extensions operate in the OS.

## Lifecycle State Machine

```
SUBMITTED → SECURITY_SCAN → REVIEW → APPROVED → STAGED → ACTIVE
                                  ↘ REJECTED
                                       ACTIVE → DEPRECATED → ARCHIVED
                                       ACTIVE → SUSPENDED (immediate, on violation)
                                       ACTIVE → ROLLED_BACK (on regression)
```

## Phase 1: Submission

```
REQUIRED ARTIFACTS:
  - extension manifest (extension-model.md schema)
  - README with purpose, usage, examples
  - test suite (unit + integration; must include adversarial inputs)
  - capability declaration (explicit; not "all access")
  - author identity verification

AUTO-CHECKS ON SUBMISSION:
  - schema validation (manifest format)
  - no prohibited keywords (credentials, root keys, constitutional references)
  - semver format valid
  - author organization in allow-list

RESULT: SUBMITTED → SECURITY_SCAN queue
```

## Phase 2: Security Scan

```
AUTOMATED SCAN (24hr SLA):
  static analysis:
    - capability over-declaration detection (declares more than logic uses)
    - dependency vulnerability scan (known CVEs)
    - credential pattern detection in source
    - prompt injection pattern detection (for AI extensions)
    - data exfiltration pattern detection (unusual outbound calls)
  
  sandbox execution:
    - run extension in isolated sandbox with synthetic inputs
    - monitor: actual resource usage vs. declared limits
    - monitor: actual system calls vs. declared capabilities
    - IF any undeclared capability exercised: FAIL → REJECTED
  
RESULT: PASS → REVIEW | FAIL → REJECTED (with report)
```

## Phase 3: Review

```
REVIEWERS: extension-registry/extension-governance.md (by type):
  AGENT_EXTENSION:     AI-Native org reviewer + Security
  CONNECTOR_EXTENSION: Integration architect + Security + DPO (if PII scope)
  WORKFLOW_EXTENSION:  Delivery org reviewer
  TOOL_EXTENSION:      Architecture + Security

REVIEW SLA: 5 business days standard; 24hr for CRITICAL priority extensions

REVIEW CHECKLIST:
  ☐ Capability declaration matches actual behavior (from security scan)
  ☐ Resource limits appropriate for declared purpose
  ☐ No scope creep (does only what it says)
  ☐ Documentation is accurate and sufficient
  ☐ Test suite covers edge cases and adversarial inputs
  ☐ No constitutional conflicts (C-001–C-012)

RESULT: APPROVED (with conditions if any) | REJECTED (with detailed feedback)
```

## Phase 4: Staging and Activation

```
STAGED:
  - installed in staging environment only
  - 48hr minimum in staging before production promotion
  - usage metrics collected; no regressions vs. staging baseline

ACTIVE:
  - promoted to production
  - listed in extension-catalog.md (if marketplace listing requested)
  - monitoring active (extension-governance.md)
```

## Phase 5: Maintenance

```
PATCH_UPDATE: security scan only (no full review for patch-level changes)
MINOR_UPDATE: security scan + automated review (human review optional)
MAJOR_UPDATE: full review cycle (treat as new submission)

DEPRECATION:
  - 30-day notice to users
  - extension enters DEPRECATED state (still invokable but not recommended)
  - after 30 days: ARCHIVED (no longer invokable)
```

## Suspension Protocol (Immediate)
```
TRIGGERS: capability violation detected | security event | constitutional violation
PROCESS:
  1. suspend immediately (no delay, no warning)
  2. notify all workflows using this extension
  3. investigate within 24hr
  4. resolve: REINSTATE (with fix) | PERMANENTLY_REJECTED
```
