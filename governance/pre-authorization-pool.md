# Pre-Authorization Pool
**ID:** GOV-PAP-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Eliminates the governance throughput bottleneck by pre-authorizing classes of routine decisions before they are needed. Instead of blocking every low-risk decision on human review, qualified agent actions within pre-defined parameters are authorized in advance. Target: 5× governance throughput increase, reducing average approval latency from ~4 hours to <5 minutes for routine decisions.

---

## Pre-Authorization Model

A pre-authorization is a standing grant for a specific (agent, action_class, parameter_bounds) triple, valid for a defined time window:

```yaml
pre_authorization:
  pauth_id: PAUTH-{NNN}
  
  grant:
    agent_id: string                         # which agent (or agent_class)
    action_class: string                     # e.g., SPRINT_PLANNING, TECH_DEBT_FIX
    workflow_ids: [string]                   # which workflows this applies to
    
  parameter_bounds:                          # hard limits on authorized actions
    max_story_points_per_sprint: number
    max_scope_change_pct: number            # e.g., 0.10 = 10% scope change OK
    max_budget_delta_usd: number
    max_agents_assigned: number
    allowed_environments: [STAGING, DEV]    # never PRODUCTION by default
    excluded_data_classes: [CONSTITUTIONAL, COMPLIANCE, PII]
    
  authorization:
    granted_by: string                       # T3+ human approver
    granted_at: ISO8601
    valid_until: ISO8601                     # max 90 days per grant
    rationale: string
    
  consumption_limits:
    max_uses_per_day: number
    max_uses_total: number | null
    current_uses_today: number
    total_uses: number
    
  audit:
    every_use_logged: true                   # non-negotiable
    anomaly_threshold: number                # alert if usage spikes > N×baseline
    
  status: ACTIVE | SUSPENDED | EXPIRED | REVOKED
```

---

## Authorized Action Classes

| Class | Description | Default Bounds | T-Level to Grant |
|-------|-------------|----------------|-----------------|
| SPRINT_PLANNING_ROUTINE | Sprint backlog grooming, point estimation | ≤ 40 pts/sprint, no budget change | T3 |
| TECH_DEBT_FIX | Code quality improvements | ≤ 5 pts, staging only, no new deps | T3 |
| WIKI_UPDATE | Knowledge base updates from verified sources | No constitutional/governance pages | T2 |
| DIAGNOSTIC_QUERY | Read-only queries across all memory systems | Read-only enforced | T2 |
| CONNECTOR_HEALTH_CHECK | Ping and schema validation on connectors | Read-only, no auth token refresh | T2 |
| INCIDENT_TRIAGE_MINOR | Classify and route incidents | P3/P4 only, no P0/P1/P2 | T3 |
| REPORT_GENERATION | Generate status/digest reports | No external publishing | T2 |
| AGENT_SELF_CALIBRATION | Agent updates its own calibration parameters | Self only, ±10% bounds | T3 |
| DEPENDENCY_AUDIT | Read dep registry, flag issues | Read-only | T2 |
| SCHEDULE_ADJUSTMENT | Shift task timing ±2 business days | ≤ 2 days, no milestone impact | T3 |

---

## What Cannot Be Pre-Authorized

The following always require real-time human approval regardless of pre-authorization:

- Any action touching constitutional principles (C-001–C-012)
- Any production data modification
- Any action affecting > 10 agents simultaneously
- Any budget change > $10,000
- Any architectural decision (ADR creation)
- Any new connector or dependency admission
- Any action flagged by semantic firewall
- Any action from a source with cross-session risk > 0.50
- Any action during active security incident

---

## Approval Batching

For decisions that don't qualify for pre-authorization, approval batching reduces human review burden:

```
Batching rules:
  1. Collect routine approval requests with urgency < HIGH for up to 60 minutes
  2. Group by approver and workflow
  3. Present as a single batch with summary context:
     "12 routine approvals: 8 sprint tasks (WF-001), 3 wiki updates, 1 diagnostic query"
  4. Approver reviews batch summary + drill-downs available per item
  5. Approve all / Approve N / Reject all / Reject N actions available
  6. Batch approval signed with Ed25519; recorded per-item in approval chain

Batch size limits:
  - Max 20 items per batch
  - Max 60-minute batching window
  - HIGH urgency items: never batched; immediate attention required
  - T4+ decisions: never batched; individual review required
```

---

## Usage Monitoring and Anomaly Detection

Pre-authorizations are monitored for abuse:

```
Per pre-authorization, track:
  - Uses per hour (hourly moving average)
  - Parameter distribution (are parameters clustering near limits?)
  - Outcome patterns (are pre-authorized actions producing expected results?)
  
Anomaly signals:
  - Usage spike > 3× 30-day average in 1 hour → T3 alert + suspend
  - Parameters consistently at bounds (≥ 90% of uses hit a limit) → review trigger
  - Unexpected error rate increase post-pre-auth action → T3 alert
  - Same agent consuming multiple PAUTH grants simultaneously → flag for review
  
Monthly audit:
  - Review all PAUTH grants for continued necessity
  - Revoke unused grants (0 uses in 30 days)
  - Renew active grants (manual renewal required; no auto-renewal)
```

---

## Grant Lifecycle

```
Request → T3 review (1 business day SLA) → Grant issued (max 90 days) →
  Active consumption (logged per use) →
  Monthly review (revoke if unused) →
  Expiry (must re-apply; no auto-renew) →
  Renewal or close
  
Emergency suspension: any T3+ can suspend a PAUTH immediately
  → All pending uses blocked
  → T3 alert issued
  → Investigation opened
  → Reinstatement requires T4 approval
```

---

## Governance

**Grant authority:** T3 (T1/T2 action classes), T4 (T3 action classes)
**Registry:** `memory/governance/pre-authorization-registry.yaml`
**Audit log:** `memory/governance/pauth-usage-log.jsonl` (append-only, every use)
**Batch audit:** `memory/governance/batch-approval-log.jsonl`
**Review cadence:** All grants reviewed monthly; expiry enforced hard at 90 days
**Throughput target:** 5× improvement over baseline human-review-only throughput
