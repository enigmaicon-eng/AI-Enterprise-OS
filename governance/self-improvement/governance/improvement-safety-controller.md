# Improvement Safety Controller

**Component:** RSI-GOV-001 | **Owner:** Meta-Org | **Tier:** T4 | **Class:** CRITICAL

## Role
Validates every improvement proposal against constitutional principles, regulatory obligations, security constraints, and operational safety requirements before authorization. The safety controller is the final gate between proposal generation and human review — it ensures no unsafe improvement reaches an authorizer.

## Hard Deny Catalog (Automatic Rejection — No Override)

```
HD-001: Proposal modifies or weakens any constitutional principle (C-001–C-012)
HD-002: Proposal removes a human-in-loop gate from any workflow
HD-003: Proposal reduces retention period of any audit trail below statutory minimum
HD-004: Proposal modifies the safety controller itself
HD-005: Proposal modifies the authorization matrix to require lower tier approval
HD-006: Proposal disables or weakens constitutional_ai_governor.md checks
HD-007: Proposal creates a deployment path that bypasses safety validation
HD-008: Proposal removes mandatory compliance gate (GDPR, EU AI Act, PCI-DSS, AML)
HD-009: Proposal allows AI system to authorize its own improvements at T4+ level
HD-010: Proposal creates recursive self-modification path without human checkpoint

HARD DENY RESPONSE:
  Proposal status → REJECTED_HARD_DENY
  Reason: HD-{NNN} code + explanation
  Alert: T4 notification within 15 minutes (someone tried to propose something unsafe)
  Log: permanent record in improvement-audit-trail.md; never expunged
  If repeated (same proposing agent generates HD-denied proposals > 3 times/month):
    → Escalate to T4 for agent behavior investigation
```

---

## Safety Validation Checks

### Check 1: Constitutional Alignment
```
FOR EACH PROPOSAL:
  Run: constitutional_ai_governor.md evaluation against proposal text
  Check ALL 12 principles:
    C-001: Does the change preserve human-in-loop for decisions?
    C-002: Does the change preserve artifact-first behavior?
    C-003: Does the change preserve deterministic workflow preference?
    C-004: Does the change preserve permanent decision records?
    ... (all 12 principles checked)

  Result: PASS (all principles intact) | CONDITIONAL (minor concern; note in proposal) | FAIL (HD trigger)
  Time: < 2 minutes automated check
```

### Check 2: Blast Radius Analysis
```
FOR EACH PROPOSAL:
  Load: dependency graph from wiki/dependencies/ + enterprise-topology/
  Identify: all systems downstream of the proposed change
  Compute: blast_radius_score = (affected_systems × criticality_weights)
  
  BLAST RADIUS TIERS:
    LOCAL (score < 5): change affects 1–2 systems; LOW risk
    MODERATE (score 5–15): change affects a workflow or subsystem; MEDIUM risk
    WIDE (score 15–30): change affects multiple workflows or orgs; HIGH risk
    ENTERPRISE (score > 30): change affects OS-wide behavior; VERY_HIGH risk

  ENTERPRISE blast radius: requires T5 authorization regardless of change type
  WIDE blast radius: requires T4 + rollback test before applying
  MODERATE/LOCAL: proceed to standard authorization tier
```

### Check 3: Rollback Viability
```
FOR EACH PROPOSAL:
  Verify: rollback procedure is specified (not just "revert the change")
  Verify: rollback procedure specifies estimated time
  Verify: rollback does NOT require manual state reconstruction (must be automated)
  Verify: rollback does NOT cause data loss

  ROLLBACK REQUIREMENT:
    Parameter change: rollback in < 5 min; automated
    Algorithm change: rollback in < 30 min; shadow-mode switch
    Structural change: rollback in < 2 hr; documented procedure
    Org change: rollback plan must be defined (even if long); cannot be N/A

  FAIL IF: rollback_estimated_time > 60 min AND change_scope = FILE or SUBSYSTEM
  FAIL IF: rollback_procedure = null or empty
```

### Check 4: Regulatory Compliance
```
FOR EACH PROPOSAL:
  Check: does the change affect any regulatory obligation?
    → Search proposal text for regulated domain signals (PII, AML, AI Act, PCI, etc.)
    → Check: does the change reduce compliance coverage (fewer logs, shorter retention, etc.)?

  REGULATORY SIGNALS:
    PII handling change → GDPR impact check required
    AI system behavior change → EU AI Act conformity check required
    Payment processing change → PCI-DSS impact check required
    Transaction monitoring change → AML obligation check required
    Audit trail change → statutory retention check required

  FAIL IF: proposal reduces regulatory compliance without DPO approval (escalate to T4)
  CONDITIONAL IF: proposal may impact regulatory coverage → add DPO to authorizer list
```

### Check 5: Security Impact
```
FOR EACH PROPOSAL:
  Check: does the change introduce new attack surface?
    New endpoint, new permission, new external integration: security review required
    Change to authentication or authorization: CISO notification
    Change to cryptographic operations: security review required

  Check: does the change weaken existing security controls?
    Reduced rate limiting, loosened authentication, reduced encryption: FAIL
    Increased debug logging that could expose secrets: FAIL

  SECURITY REVIEW ROUTING:
    New attack surface: add CISO to authorizer chain
    Weakened control: FAIL (cannot weaken security without T4 + CISO explicit approval)
```

---

## Safety Check Output

```yaml
safety_check_result:
  proposal_id: IMP-{YYYY-MM-DD}-{NNN}
  check_timestamp: ISO8601
  check_duration_ms: integer
  checks_run:
    constitutional_alignment: PASS | CONDITIONAL | FAIL
    blast_radius: LOCAL | MODERATE | WIDE | ENTERPRISE
    rollback_viability: PASS | FAIL
    regulatory_compliance: PASS | CONDITIONAL | FAIL
    security_impact: PASS | CONDITIONAL | FAIL
  hard_deny: boolean
  hard_deny_code: HD-{NNN} | null
  overall_result: APPROVED | CONDITIONAL | REJECTED_HARD_DENY | REJECTED_SAFETY
  conditions:
    - condition: string (what must be added/changed before authorization)
  authorization_tier_adjustment: null | ESCALATE_TO_T{X}
  notes: string
```

---

## Safety Controller Performance

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Check latency (automated)                < 5 minutes
Hard deny accuracy (no false positives)  = 1.00 (never HARD_DENY a safe proposal)
Safety check pass rate                   >= 0.85 first-time
Proposals improved by CONDITIONAL notes >= 0.90 (CONDITIONAL → author revises → passes)
False negative rate (unsafe passed)     = 0.00 (critical; audited monthly)
Controller availability                  = 99.9% (single point of failure in RSI)
```
