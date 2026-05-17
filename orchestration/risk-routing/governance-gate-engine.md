---
layer: risk-aware-routing
type: governance-gate-engine
version: 1.0.0
created: 2026-05-10
owner: compliance-governance-agent
authority: enterprise-architecture-council
---

# Governance Gate Engine

Enforces governance gates at the correct points in every workflow. Knows which gates require human approval, which require agent authority, when gates may be bypassed (never without a logged exception), and how exceptions are governed.

**Core rule:** No agent may bypass a required governance gate, regardless of confidence score, urgency, or authority tier. Gate bypasses are constitutional violations.

---

## Gate Registry

All governance gates are registered here. This is the authoritative source for what gates exist and when they apply.

### G1: Schema Validation Gate

```yaml
gate-id: G1
name: Artifact Schema Validation
trigger: Any artifact produced by an agent
approver: Automated (schema validator)
human-required: false
bypass-allowed: false

rules:
  - All declared required sections must be present
  - All required fields must be populated (no placeholder text)
  - Format must match declared template
  
outcome-if-failed:
  action: REJECT_ARTIFACT
  agent-notified: producing-agent
  message: "Schema validation failed. Revise and resubmit."
  max-retries: 3
  on-max-retries-exceeded: escalate-to-orchestrator
```

### G2: Consistency Gate

```yaml
gate-id: G2
name: Post-Output Consistency Check
trigger: Any artifact with organizational claims (facts about agents, integrations, version, etc.)
approver: Automated (consistency-anchor comparison)
human-required: false
bypass-allowed: false

rules:
  - 0 contradictions with consistency anchor: PASS
  - 1-2 contradictions: WARN (artifact advances, contradictions flagged)
  - 3+ contradictions: FAIL (artifact rejected, contradictions logged as CONT-NNN)
  
outcome-if-failed:
  action: REJECT_ARTIFACT + LOG_CONTRADICTION
  contradictions-routed-to: knowledge-systems-architect-agent
  artifact-disposition: returned-to-producing-agent
```

### G3: Peer Review Gate

```yaml
gate-id: G3
name: Peer Review
trigger:
  - Any HIGH-importance artifact
  - Any artifact with risk level MEDIUM or above
  - Any PRD or ADR (always)
approver: Same-tier domain peer agent
human-required: false
bypass-allowed: false  # exception process required

sla: 30 minutes
outcome-if-approved: artifact advances
outcome-if-rejected: artifact returned with structured feedback
```

### G4: Human Approval Gate

```yaml
gate-id: G4
name: Human Approval
trigger: Per constitution/human-approval-constitution.md
  (specifically: new ADRs with binding constraints, governance changes,
   CRITICAL risk artifacts, constitutional changes, significant scope changes)
approver: human-operator
human-required: true  # cannot be delegated to any agent
bypass-allowed: false  # NEVER

sla:
  CRITICAL: 4 hours
  HIGH: 24 hours
  NORMAL: 72 hours
  
outcome-if-no-response-at-sla:
  action: ESCALATE and PAUSE (not auto-approve)
  
outcome-if-approved: artifact becomes binding
outcome-if-rejected: artifact returned to orchestrator for revision or scope change
```

### G5: Security Review Gate

```yaml
gate-id: G5
name: Security Review
trigger:
  - Any artifact touching auth, access control, secrets, PII
  - Any artifact with security risk dimension >= 8
  - All threat models (always)
approver: security-architect-agent (T2)
human-required: false (unless risk = CRITICAL)
bypass-allowed: false

sla: 2 hours
outcome-if-failed: REJECT with detailed security findings
finding-format:
  - finding-id: "SEC-{NNN}"
    severity: CRITICAL|HIGH|MEDIUM|LOW
    description: "{what is wrong}"
    remediation: "{specific fix required}"
```

### G6: Compliance Review Gate

```yaml
gate-id: G6
name: Regulatory Compliance Review
trigger:
  - Any artifact touching financial data, health data, legal obligations
  - Any artifact with regulatory risk dimension >= 15
  - All external communication artifacts
approver: compliance-governance-agent (T2), with human escalation for CRITICAL
human-required: depends (CRITICAL → yes)
bypass-allowed: false

sla: 4 hours
outcome-if-failed: REJECT with compliance findings and required changes
```

### G7: Architectural Binding Gate

```yaml
gate-id: G7
name: Architectural Binding Constraint Creation
trigger:
  - Any artifact that creates a new binding constraint (ADR, architectural decision)
  - Any artifact that overrides an existing ADR
approver: chief-architect-agent (T4) + human notification
human-required: notification only (not approval, unless risk = CRITICAL)
bypass-allowed: false

sla: 24 hours
binding-on-approval: immediately, for all subsequent work in scope
```

### G8: Knowledge Archive Gate

```yaml
gate-id: G8
name: EWC Pre-Archival Gate
trigger: Any CRITICAL or HIGH memory entry transitioning to ARCHIVED
approver: knowledge-systems-architect-agent (T3)
human-required: false
bypass-allowed: false

rules:
  - EWC check must pass: all unique knowledge confirmed captured elsewhere
  - If EWC fails: gate BLOCKED until knowledge is transferred
  
outcome-if-passed: archive proceeds
outcome-if-failed: archive BLOCKED, producing agent must transfer unique knowledge first
```

---

## Gate Execution Engine

The governance gate engine runs gates automatically at the correct points in every workflow:

```python
def run_gates(artifact, workflow_step):
    applicable_gates = determine_applicable_gates(artifact, workflow_step)
    gate_results = []
    
    for gate in applicable_gates:
        result = execute_gate(gate, artifact)
        gate_results.append(result)
        
        if result.outcome == "FAIL" and not gate.bypass_allowed:
            # Hard stop — artifact cannot advance
            handle_gate_failure(artifact, gate, result)
            return GateFailed(gate=gate, result=result)
        
        elif result.outcome == "WARN":
            # Log warning but artifact may advance
            log_gate_warning(gate, result)
    
    # All gates passed
    return GatePassed(gates_run=applicable_gates, results=gate_results)

def determine_applicable_gates(artifact, workflow_step):
    applicable = [G1, G2]  # Always run
    
    if artifact.importance >= "HIGH":
        applicable.append(G3)  # Peer review
    
    if is_human_approval_required(artifact):  # per human-approval-constitution.md
        applicable.append(G4)
    
    if artifact.risk.security >= 8:
        applicable.append(G5)
    
    if artifact.risk.regulatory >= 15:
        applicable.append(G6)
    
    if creates_binding_constraint(artifact):
        applicable.append(G7)
    
    if artifact.transitioning_to == "ARCHIVED" and artifact.importance >= "HIGH":
        applicable.append(G8)
    
    return sorted(applicable, key=lambda g: g.gate_id)  # G1 first, always
```

---

## Gate Exception Protocol

A gate exception is a formal request to bypass a governance gate. This is an extraordinary action that requires justification and authorization.

```yaml
gate-exception-request:
  exception-id: "GEXC-{NNN}"
  requested-at: "{ISO-8601}"
  requested-by: "{agent-id}"
  
  gate-to-bypass: "G{N}"
  artifact: "{path}"
  
  exception-grounds: "TIME_CRITICAL|TECHNICAL_IMPOSSIBILITY|SUPERSEDED_BY_HIGHER_AUTHORITY"
  
  justification: "{detailed explanation — why the gate cannot be followed}"
  
  risk-of-bypass: "{what could go wrong if the gate is skipped}"
  
  compensating-controls:
    - "{what will be done instead to achieve the gate's intent}"
    
  required-authorization: "T4+ agent + human notification"
  
  expiry: "{ISO-8601}"  # exception is time-limited
```

**Authorization requirements:**
- G1, G2 bypass: Not possible (automated, no human override)
- G3 bypass: T4 authority + justification
- G4 bypass: Not possible (constitutional — no human can delegate their approval to an agent)
- G5, G6 bypass: T4 authority + human notification + time-limited
- G7 bypass: T5 + human approval
- G8 bypass: T3 + EWC documentation of unique knowledge location

**All exceptions are logged and reviewed monthly by compliance-governance-agent.**

---

## Gate Health Metrics

| Metric | Target | Alert |
|---|---|---|
| G1 pass rate (first attempt) | ≥95% | <90% |
| G2 FAIL rate (3+ contradictions) | <2% | >5% |
| G3 rejection rate | <25% | >40% |
| G4 SLA compliance | ≥90% | <80% |
| G5 finding severity (avg) | <MEDIUM | Any CRITICAL |
| Gate exception count per month | 0 | >2 |
| Gate bypass attempts (denied) | 0 | Any |