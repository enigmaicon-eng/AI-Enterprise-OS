# Agent Registry Governance

## Purpose
Defines the governance framework for the agent registry — who can make registry changes, what changes require approval, how the registry is audited, and what policies constrain registry operations. The registry is the authoritative source of truth about the agent workforce; its integrity is a governance foundation for all orchestration and delegation decisions.

---

## Registry Governance Principles

```yaml
governance_principles:
  AUTHORITATIVE_SINGLE_SOURCE:
    statement: The registry is the single source of truth about agent identity, capabilities, and availability.
    implication: No orchestration or delegation decision may be made using agent information not sourced from this registry.
  
  REGISTRY_INTEGRITY:
    statement: Registry records must accurately reflect actual agent state within defined SLAs.
    implication: Stale records are a governance breach; accuracy monitoring is mandatory.
  
  CONTROLLED_CHANGE:
    statement: All registry changes require authorization appropriate to their governance impact.
    implication: No agent can enter, exit, or be modified in the registry without authorized approval.
  
  COMPLETE_AUDIT_TRAIL:
    statement: Every registry change is recorded in an append-only, cryptographically-chained audit log.
    implication: The full history of any agent's registry record is always reconstructible.
  
  TRANSPARENCY:
    statement: Agents and their supervising humans are notified of registry changes that affect them.
    implication: No covert registry modifications; all changes visible to appropriate parties.
```

---

## Registry Change Authorization Matrix

```yaml
authorization_matrix:
  REGISTRATION:
    T1-T2 agents: Tier-3 supervisor approval
    T3 agents: Tier-4 approval
    T4 agents: Tier-5 approval
    T5 agents: Board approval
    new_agent_type: Tier-4+ approval regardless of tier
  
  DEREGISTRATION:
    voluntary (agent/owner request): Tier-3 supervisor approval
    automated_cleanup (>30d offline): Tier-3 supervisor acknowledgment
    forced_governance: Tier-4+ order
    emergency_forced: Tier-5 only (immediate; no drain protocol)
  
  RECORD_UPDATES:
    capability_change (assessment-driven): automatic (system-to-system; no human approval)
    skill_grant: authorization per agent-capability-governance.md
    tier_promotion: Tier-4+ approval
    tier_demotion: Tier-4+ order (with supervisor notification)
    routing_change (endpoint/protocol): Tier-3 notification; no approval needed
    routing_change (capacity reduction >50%): Tier-3 approval
    governance.active_restrictions update: Tier-3+ authorization
    supervisor_agent change: current supervisor + Tier-3 acknowledgment
  
  SUSPENSION:
    suspend: Tier-3+ governance order
    reinstate: Tier-3+ clearance (same or higher authority as suspending order)
  
  BULK_ACTIONS (affecting >10 agents simultaneously):
    any_bulk_action: Tier-4+ approval
    bulk_deregistration: Tier-5 approval
```

---

## Registry Policies

```yaml
registry_policies:
  POLICY-RG-001:
    name: registry_completeness
    statement: Every agent operating in the enterprise must be registered before executing tasks.
    detection: cross-reference active task logs against registry; unregistered agents flagged
    consequence: unregistered agent activities voided; immediate registration required or suspension
    exception: sandbox/test environments with explicit exemption (max 7 days)
  
  POLICY-RG-002:
    name: no_phantom_agents
    statement: Registry records must correspond to real, reachable agents.
    detection: health monitor; agents that never respond to probes after 7 days = phantom candidate
    consequence: phantom records escalated for investigation then deregistered
  
  POLICY-RG-003:
    name: capability_accuracy
    statement: Claimed capabilities must be supported by current assessment evidence.
    detection: monthly roster audit cross-references capability claims against assessment records
    consequence: unsupported claims removed; agent notified and re-assessed
  
  POLICY-RG-004:
    name: supervision_coverage
    statement: All T3+ agents must have an assigned supervisor_agent in their registry record.
    detection: daily check; T3+ agents with null supervisor_agent → immediate alert
    consequence: supervisor assignment required within 24 hours; agent restricted to T2 tasks until resolved
  
  POLICY-RG-005:
    name: record_accuracy_sla
    statement: Registry records must reflect actual agent state within defined latency SLAs.
    sla:
      availability_status: 5 seconds
      capability_changes: 5 minutes
      performance_context: 1 hour
    breach_action: SLA breach logged as compliance event; repeated breaches → monitoring escalation
  
  POLICY-RG-006:
    name: decommission_data_retention
    statement: Decommissioned agent records are retained for 7 years for audit and lineage purposes.
    prohibition: decommissioned records cannot be deleted, only archived
    access: Tier-4+ can query decommissioned records; Tier-3 can query records for their org
  
  POLICY-RG-007:
    name: audit_trail_immutability
    statement: The registry audit trail is append-only; no entries may be modified or deleted.
    enforcement: cryptographic hash chaining (each entry includes hash of prior entry)
    verification: monthly hash chain integrity check
```

---

## Registry Audit Framework

```yaml
registry_audit:
  continuous_monitoring:
    - SLA compliance for each record type (automated)
    - Supervisor coverage for T3+ agents (automated)
    - Health probe success rate per agent (automated)
    - Unauthorized change detection via audit log analysis (automated)
  
  daily_audit:
    - agents with no heartbeat in 24 hours (escalate to operator)
    - capability assessment overdue per agent-capability-assessment.md schedules
    - orphaned agents (no supervisor, no org assignment)
    - stale records (no update in > 7 days)
  
  monthly_audit:
    scope: full registry scan
    checks:
      - all capability claims supported by current assessment evidence
      - all authorized_skills match skill_registry grants
      - all T3+ agents have assigned supervisor
      - no phantom agents (health_probe_fail_count)
      - decommissioned records intact and accessible
      - audit trail hash chain valid
    output: monthly_registry_audit_report
    recipients: capability governance lead; Tier-4+ leadership
  
  quarterly_audit:
    scope: deep governance review
    additional_checks:
      - tier assignments aligned with agent demonstrated capabilities
      - org assignments accurate (no agents in wrong org)
      - supervision chains complete (no dangling supervisors)
      - registry policies being enforced (spot check 20 random records)
    output: quarterly_registry_governance_report
    recipients: Tier-5 leadership; registry governance lead
  
  audit_record:
    format: append-only log entry per audit
    fields: [audit_type, conducted_by, conducted_at, findings_count, findings_summary, remediation_actions]
    retention: 7 years
```

---

## Registry Access Control

```yaml
access_control:
  read_access:
    all_registered_agents: can read own registry record
    all_registered_agents: can query discovery engine (returns only routing + capability summary)
    supervisors: can read full records for all agents in their supervision chain
    Tier-3+: can read all active registry records in their org
    Tier-4+: can read all active registry records enterprise-wide
    Tier-4+: can query decommissioned records
  
  write_access:
    agents_self: can update own routing (endpoint, preferred_task_types, availability heartbeat)
    agents_self: cannot self-update capability_profile, tier, governance fields
    supervisors: can update supervision_required, audit_level for agents in their chain
    system_processes: capability updates from assessment system (automated, logged)
    governance_lead: can update any field; all changes logged with justification
  
  audit_log_access:
    agent_self: can read own audit history
    supervisors: can read audit history for supervised agents
    governance_lead: full audit log access
    Tier-4+: read-only access to all audit logs (no modification)
```

---

## Registry Health Metrics

```yaml
registry_health:
  completeness_score:
    formula: (registered_active_agents / known_active_agents) × 100
    target: 100% (POLICY-RG-001)
    alert: < 99%
  
  accuracy_score:
    formula: (records_within_SLA / total_records) × 100
    target: > 99.5%
    alert: < 98%
  
  audit_compliance_score:
    formula: (findings_remediated / findings_total) × 100 (rolling 30d)
    target: > 95% remediated within SLA
  
  governance_health_dashboard:
    displays:
      - registry completeness %
      - record accuracy by type
      - open audit findings
      - policy violations in last 30 days
      - decommissioned agents pending 7-year retention check
    update_frequency: hourly
    recipients: registry governance lead; Tier-4+ on request
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-registry/agent-registry-model.md` | Schema and index definitions being governed |
| `agent-registry/agent-roster-management.md` | Registration/deregistration events governed here |
| `agent-registry/agent-health-monitor.md` | Health events inform policy enforcement |
| `agent-capabilities/agent-capability-governance.md` | Capability authorization feeds into registry |
| `docs/governance/principles.md` | Registry policies align to enterprise governance principles |
| `enterprise-telemetry/enterprise-event-bus.md` | Registry governance events emitted as signals |
