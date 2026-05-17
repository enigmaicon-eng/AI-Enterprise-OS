# Recovery Runbook
**ID:** DR-CORE-003 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Runtime Org | **Updated:** 2026-05-16

---

## Purpose

Step-by-step operational runbook for executing OS recovery from any failure class. Designed to be followed under pressure with minimal cognitive load. Each step has an expected duration, a success criterion, and a fallback action.

---

## Pre-Recovery Checklist

Before initiating any recovery:
- [ ] Identify failure class (D1–D5) using dr-plan.md classification
- [ ] Authorize recovery action (T4 for D3+, T5 for D4+)
- [ ] Notify T4+ of recovery initiation
- [ ] Start recovery timer
- [ ] Open this runbook step-by-step — do not improvise

---

## Section A: Bootstrap Sequence (all recovery classes D3+)

These steps must always execute in order. Never skip.

### A1 — Establish Coordination Channel (5 min)
```
Action: Activate emergency coordination channel
  1. Declare recovery mode to all T3+ agents
  2. Assign Recovery Coordinator (T4)
  3. Assign two Recovery Validators (T3)
  4. Recovery Coordinator has sole decision authority during recovery

Success: Team assembled; coordination active
Fallback: If T4 unavailable, senior T3 may act; escalate T5 notification
```

### A2 — Assess State (10 min)
```
Action: Determine what survived vs. what was lost
  1. Query memory/disaster-recovery/backup-state.yaml for last backup times
  2. Assess each data tier:
     - Constitutional + Governance files: present? intact?
     - Agent definitions: present? indexed?
     - Memory YAML state: how stale?
     - JSONL logs: continuous replication lag?
  3. Identify the recovery starting point (which backup to restore from)

Success: Clear inventory of available vs. lost state
```

### A3 — Select Recovery Path (5 min)
```
Based on assessment:
  If memory/ state < 1 hour stale AND orchestrator rebuilds → A4 (warm resume)
  If memory/ state 1–24 hour stale → A5 (daily snapshot restore)
  If state > 24 hours stale → A6 (cold archive restore)
  If agent definitions lost → A7 (full rebuild)
```

---

## Section B: Warm Resume (D3 — Platform Recovery)

### B1 — Restart Orchestration Layer (20 min)
```
1. Provision secondary orchestrator environment
2. Load checkpoint-registry.yaml
3. Load agent-registry/agent-registry.yaml (agent index)
4. Load routing-table from agents/ROUTING-TABLE.md
5. Resume in-flight workflows from last checkpoint (RS-06 state)

Validate: orchestrator health check returns HEALTHY
Fallback: If checkpoint corrupt, restart all workflows from beginning
```

### B2 — Restore Event Bus (15 min)
```
1. Load consumer-offsets.yaml (last committed positions)
2. Start all 15 topic consumers from last committed offset
3. Process backlog (estimate: 1 min per 1000 backlogged events)
4. Verify no consumer lag > 5 min before proceeding

Validate: All consumers RUNNING; lag < 5 min
Fallback: Reset offset to -1hr if consumer state corrupt
```

### B3 — Restore Digital Twins (20 min)
```
1. Load twin-state YAML files (org/workflow/delivery/runtime)
2. Flag all twins as RECOVERING (15-min sync lag expected)
3. Trigger forced sync cycle
4. Twins return to HEALTHY after next sync completes

Validate: All 4 twins RECOVERED or HEALTHY
Fallback: Mark twins as DEGRADED; proceed without twin-dependent decisions
```

---

## Section C: Daily Snapshot Restore (D4 — Datacenter Recovery)

### C1 — Restore Foundation Layer (30 min)
```
1. Mount daily backup archive (most recent successful)
2. Restore all .md files to /agents, /workflows, /templates, /governance
3. Restore memory/ directory from snapshot
4. Verify file count matches manifest (zero tolerance for missing files)

Validate: File count matches; SHA-256 checksums pass
Fallback: Fall back to prior day's backup if current is corrupt
```

### C2 — Restore Security Context (15 min)
```
1. Re-establish Ed25519 signing keys from HSM (two-person integrity)
2. Rebuild ephemeral permission manager (all active tokens revoked and reissued)
3. Reload semantic firewall threat patterns
4. Verify constitutional governor quorum is operational

CRITICAL: Do not accept any workflow submissions until security context is validated
```

### C3 — Mark Interrupted Workflows (10 min)
```
1. Scan execution-store/workflow-states.jsonl for RUNNING workflows at snapshot time
2. Set all RUNNING → INTERRUPTED
3. Queue INTERRUPTED workflows for T3 review (manual restart decision)
4. Notify workflow owners of interruption

Note: Data loss = snapshot age (< 1 hr per RPO target)
```

---

## Section D: Post-Recovery Validation

### D1 — Run 30-Point Checklist (dr-plan.md)
Must achieve 30/30 before returning to normal operations.

### D2 — Governance Verification
```
1. Constitutional compliance check: run 12-principle scan on current state
2. Approval queue: verify all pending approvals survived; re-issue expired tokens
3. Attestation registry: verify integrity of attestation chain
```

### D3 — Return to Operations Authorization
```
Required: T5 sign-off on recovery completion
Required: At least 2 T3 validators confirm 30-point checklist
Required: Zero constitutional violations in validation run
Required: Notify all T2+ agents of recovery completion

Documentation: DR event record in memory/disaster-recovery/dr-events.jsonl
Post-DR review: Scheduled within 48 hours
```

---

## Emergency Contacts and Escalation

| Situation | Contact | SLA |
|-----------|---------|-----|
| Recovery taking > 2× RTO | T5 | Immediate |
| Security breach discovered during recovery | T5 + Security Lead | Immediate |
| Data loss exceeds RPO | T5 + Board notification | 30 min |
| Constitutional violation during recovery | T5 + All T4 | Immediate |
