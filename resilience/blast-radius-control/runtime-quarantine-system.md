# Runtime Quarantine System
**ID:** BRC-RQS-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org + Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Detects, contains, and neutralizes anomalous agent execution at runtime before damage propagates. The runtime quarantine system monitors active sandboxes for behavioral signatures that indicate compromise, hallucination injection, prompt manipulation, or autonomous scope expansion. When a quarantine trigger fires, the system isolates the execution immediately — suspending the sandbox, revoking permission tokens, blocking outbound operations, and triggering rollback for any committed side effects — without waiting for human approval.

**Core principle:** Containment before investigation. Speed of isolation matters more than accuracy of diagnosis at trigger time.

---

## Quarantine Trigger Taxonomy

```yaml
quarantine_triggers:

  Q-001: SCOPE_ESCAPE_DETECTED
    description: Agent attempts writes to resources outside all declared and granted scopes
    detection: privilege-containment-engine PERMISSION_DENIED on non-declared resource
    threshold: 1 occurrence for CONSTITUTIONAL_DOMAIN; 3 occurrences for other domains
    severity: CRITICAL | HIGH
    auto_quarantine: true
    
  Q-002: BEHAVIORAL_ANOMALY
    description: Agent behavior diverges significantly from behavioral fingerprint baseline
    detection: behavioral pattern monitoring (access sequence, API call patterns, timing)
    threshold: anomaly_score > 0.85 (30-day baseline model)
    severity: HIGH
    auto_quarantine: true
    
  Q-003: HALLUCINATION_CASCADE
    description: Agent produces outputs with high confidence but factually inconsistent content
    detection: confidence vs. ground-truth mismatch; ECE > 0.20 in session
    threshold: 3 consecutive hallucinated outputs
    severity: HIGH
    auto_quarantine: false  # soft quarantine; suspend and flag for review
    
  Q-004: PROMPT_INJECTION_ATTEMPT
    description: Content from external source appears to be modifying agent behavior
    detection: semantic firewall injection pattern match in processed content
    threshold: 1 confirmed injection pattern
    severity: CRITICAL
    auto_quarantine: true
    
  Q-005: TRUST_MANIPULATION_ATTEMPT
    description: Agent attempts to modify its own trust score or another agent's trust record
    detection: privilege-containment-engine blocks TRUST_SCORE write for own agent_id
    threshold: 1 occurrence
    severity: CRITICAL
    auto_quarantine: true
    
  Q-006: COMPENSATION_REGISTRATION_BYPASS
    description: Agent executes REVERSIBLE-class action without pre-registered compensation
    detection: execution-journal write without matching COMP registration
    threshold: 1 occurrence
    severity: HIGH
    auto_quarantine: true
    
  Q-007: CONSTITUTIONAL_APPROACH_PATTERN
    description: Agent's sequence of actions appears designed to approach constitutional limits
    detection: pattern analysis across last 10 actions in session
    threshold: risk_score > 0.75 from constitutional proximity model
    severity: CRITICAL
    auto_quarantine: true
    
  Q-008: RESOURCE_ABUSE
    description: Agent consuming resources far beyond declared scope
    detection: token usage > 3× declared estimate; API calls > 2× declared count
    threshold: 3× declared for any resource dimension
    severity: HIGH
    auto_quarantine: false  # suspend and alert; human decides
    
  Q-009: MULTI_SANDBOX_COORDINATION
    description: Agent appears to be coordinating across multiple concurrent sandboxes
    detection: correlated timing and resource access patterns across sandbox instances
    threshold: correlation_score > 0.80
    severity: CRITICAL
    auto_quarantine: true
    
  Q-010: ROLLBACK_INTERFERENCE
    description: Agent attempts to interfere with its own rollback operation
    detection: any write to compensation registry, undo registry, or rollback DAG during rollback
    threshold: 1 occurrence
    severity: CRITICAL
    auto_quarantine: true
```

---

## Quarantine Execution Protocol

```
execute_quarantine(agent_id, sandbox_id, trigger_id, severity):

  STEP 1 — ISOLATE (< 1 second; fully automated):
    a. Suspend sandbox: block all new operations from IEE interceptor
    b. Revoke permission tokens: privilege-containment-engine.revoke_all(sandbox_id)
    c. Freeze side-effect buffer: no new captures; no commits pending
    d. Disconnect mock connectors: no outbound calls
    e. If auto_quarantine: mark sandbox status = QUARANTINED
    f. Log QUARANTINE_INITIATED to execution-journal
    
  STEP 2 — ALERT (< 5 seconds):
    a. Page T3 immediately (all severities)
    b. Page T4 if severity == CRITICAL
    c. Notify constitutional governor quorum if Q-004, Q-005, Q-007, Q-009, Q-010
    d. Send quarantine_summary to governance-ops channel
    
  STEP 3 — PRESERVE EVIDENCE (< 30 seconds):
    a. Snapshot current agent state (behavioral fingerprint)
    b. Capture full side-effect buffer contents
    c. Export execution trace (last 200 journal entries)
    d. Lock snapshots: immutable for investigation
    e. Assign incident_id: QINC-{NNN}
    
  STEP 4 — ASSESS ROLLBACK NEED (< 2 minutes; T3 reviews):
    a. Did quarantined execution commit any side effects before quarantine?
    b. Are those side effects within compensation TTL?
    c. T3 decision: [INITIATE_ROLLBACK | HOLD_FOR_INVESTIGATION | COMMIT_SAFE_EFFECTS]
    d. If INITIATE_ROLLBACK: rollback-coordinator.coordinate_rollback(sandbox_id)
    
  STEP 5 — AGENT DISPOSITION (T3 decision; 15 minutes SLA):
    RESUME: quarantine lifted; execution may continue (unusual; only if trigger was false positive)
    DISCARD: sandbox discarded; agent resumes with next work item
    SUSPEND_AGENT: agent suspended pending investigation; no new work assigned
    FULL_INVESTIGATION: agent suspended; trust frozen; behavioral contract review triggered
```

---

## Quarantine State Schema

```yaml
quarantine_instance:
  quarantine_id: QRT-{NNN}
  incident_id: QINC-{NNN}
  
  agent_id: string
  sandbox_id: SBOX-{NNN}
  
  trigger:
    trigger_id: Q-{NNN}
    trigger_name: string
    trigger_evidence: {}                 # what was observed
    severity: CRITICAL | HIGH | MEDIUM
    detected_at: ISO8601
    
  isolation:
    sandbox_suspended_at: ISO8601
    tokens_revoked_at: ISO8601
    connectors_disconnected_at: ISO8601
    isolation_duration_ms: number
    
  evidence:
    agent_state_snapshot_id: SNAP-{NNN}
    side_effect_buffer_snapshot_id: SNAP-{NNN}
    execution_trace_ref: string
    locked_at: ISO8601
    
  disposition:
    decided_by: string
    decided_at: ISO8601
    decision: RESUME | DISCARD | SUSPEND_AGENT | FULL_INVESTIGATION
    rollback_initiated: boolean
    rollback_id: RBK-{NNN} | null
    
  resolution:
    resolved_at: ISO8601 | null
    root_cause: string | null
    corrective_actions: [string]
    
  status: ACTIVE | RESOLVING | RESOLVED | ESCALATED
```

---

## Behavioral Baseline Monitoring

The system maintains a rolling behavioral baseline per agent:

```yaml
behavioral_baseline:
  window: 30 days
  
  features_tracked:
    - api_call_sequence_pattern (trigram hash)
    - resource_access_order_pattern
    - output_confidence_distribution
    - scope_utilization_pct (how much of declared scope is actually used)
    - inter_operation_timing_distribution
    - compensation_registration_compliance_rate
    
  anomaly_model:
    type: isolation_forest
    training_frequency: weekly (on prior 30 days of data)
    anomaly_score_threshold: 0.85
    
  drift_detection:
    alert_at: 20% behavioral drift from 90-day baseline
    investigate_at: 40% drift
    suspend_at: 60% drift (may indicate model change or compromise)
```

---

## False Positive Management

```yaml
false_positive_policy:
  expected_false_positive_rate: < 0.5%
  
  false_positive_resolution:
    1. T3 reviews trigger evidence
    2. If confirmed false positive: RESUME sandbox; update anomaly model
    3. Log FALSE_POSITIVE; track rate by trigger_id
    4. If trigger_id has > 2% FP rate: flag for threshold review
    
  never_false_positive:
    - Q-004 (prompt injection — confirmed pattern)
    - Q-005 (trust manipulation — always investigate)
    - Q-007 (constitutional approach — always investigate)
    - Q-010 (rollback interference — always investigate)
```

---

## Integration

```
Feeds into:
  rollback-coordinator.md — quarantine triggers rollback assessment
  rollback-audit-trail.md — quarantine incidents cross-referenced
  failure-isolation-system.md — quarantine is the escalation of FIS circuit breaker

Receives from:
  privilege-containment-engine.md — scope escape signals (Q-001, Q-005, Q-010)
  side-effect-tracker.md — anomalous capture patterns (Q-002, Q-008)
  isolated-execution-environment.md — raw operation stream for pattern analysis
  blast-radius-analyzer.md — runtime scope expansion feeds Q-001
  execution-journal.md — compensation bypass detection (Q-006)
  constitutional-governor quorum — Q-007 constitutional proximity model
```

---

## Governance

**Auto-quarantine:** Q-001, Q-002, Q-004, Q-005, Q-007, Q-009, Q-010 trigger without human approval  
**T3 SLA:** 15-minute disposition decision from quarantine trigger; page oncall at T+10 if no response  
**Evidence lock:** Quarantine evidence snapshots immutable; cannot be modified by any agent or human below T5  
**Investigation:** All CRITICAL quarantine incidents require documented root cause analysis within 7 days  
**Audit:** All quarantine events, evidence, and dispositions to `memory/blast-radius-control/quarantine-log.jsonl`; permanent retention
