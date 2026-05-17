# Agent Roster Management

## Purpose
Manages the full lifecycle of agent registration, deregistration, version upgrades, and record maintenance in the agent registry. Roster management is the administrative control plane for the agent workforce — it decides who is in the registry, ensures records are current, and enforces the governance rules around agent entry and exit.

---

## Roster Management Architecture

```
Roster Events
├── Registration Request       → new agent joining the enterprise
├── Deregistration Request     → agent leaving or being retired
├── Record Update              → capability change, routing change, metadata update
├── Version Upgrade            → agent software/configuration version bump
├── Tier Change                → promotion or demotion
└── Forced Action              → governance-initiated suspension, decommission

        ↓

[Roster Management Engine]
├── [Registration Pipeline]    → 6-step agent onboarding
├── [Deregistration Pipeline]  → controlled agent retirement
├── [Record Maintenance]       → continuous record accuracy
├── [Roster Audit]             → completeness and accuracy checks
└── [Roster Governance]        → policy enforcement on roster changes
```

---

## Registration Pipeline

```yaml
registration_pipeline:
  step_1_request_intake:
    required_fields: [display_name, agent_type, version, tier, org, description]
    optional_fields: [specializations, preferred_task_types, supervisor_agent]
    submitted_by: agent_self | human_operator | orchestration_system
    creates: registration_record (status: PENDING)
  
  step_2_schema_validation:
    checks:
      - all required fields present and correctly typed
      - agent_id conforms to pattern "AGT-{org}-{type}-{seq}"
      - version is valid semver
      - tier is integer 1–5
      - protocol is SYNC | ASYNC | STREAMING
    failure: REJECTED with validation_errors list
  
  step_3_capability_verification:
    action: cross-reference claimed capabilities against assessment records
    source: agent-capability-assessment.md records
    rule: cannot claim PROFICIENT+ without at least one assessment record
    new_agent_exception: NOVICE and CAPABLE claims accepted on self-attestation with monitoring flag
    failure: REJECTED or DOWNGRADED (capabilities adjusted to evidence-supported levels)
  
  step_4_authorization_check:
    checks:
      - agent_type is permitted in this org
      - tier assignment is authorized by appropriate governance level
      - requester has authority to register this agent type
    authority_matrix:
      T1-T2 registration: Tier-3 supervisor approval
      T3 registration: Tier-4 approval
      T4 registration: Tier-5 approval
      T5 registration: Board approval
    failure: REJECTED with authorization_required message
  
  step_5_conflict_detection:
    checks:
      - agent_id not already in registry
      - no duplicate (same display_name + org + agent_type)
      - no pending deregistration for same agent_id
    failure: CONFLICT_ERROR with existing_record reference
  
  step_6_record_inscription:
    action:
      - write full agent_registry_record to primary registry
      - update all 6 indexes synchronously (capability, domain, skill, availability, performance, semantic)
      - assign sequential seq number for agent_id
      - set initial availability.status = OFFLINE (agent must declare AVAILABLE via health probe)
      - emit AGENT_REGISTERED event to enterprise-event-bus.md
    creates: agent_id (permanent, never reused)
    
  step_7_initial_health_probe:
    action: send initial health probe to agent endpoint
    on_success: update availability.status = AVAILABLE
    on_failure: status remains OFFLINE; retry 3× before flagging for operator review
    timeout: 30 seconds per probe attempt
```

---

## Deregistration Pipeline

```yaml
deregistration_pipeline:
  triggers:
    VOLUNTARY: agent or owner requests deregistration
    FORCED_GOVERNANCE: Tier-3+ governance order for permanent removal
    AUTOMATED_CLEANUP: agent offline > 30 days with no recovery
    VERSION_RETIREMENT: old version deregistered upon new version registration
  
  step_1_drain_protocol:
    action: set availability.status = MAINTENANCE (stop new task acceptance)
    wait_for: all current_task_count tasks to complete
    timeout: 4 hours (after which, in-progress tasks are flagged for handoff)
    emergency_bypass: Tier-4+ can force immediate deregistration (tasks orphaned)
  
  step_2_handoff_check:
    action: identify any long-running tasks or commitments this agent holds
    output: handoff_manifest (list of tasks, commitments, pending escalations)
    action: route handoff_manifest to supervisor for reassignment
  
  step_3_record_transition:
    if DECOMMISSIONED (permanent retirement):
      - set availability.status = DECOMMISSIONED
      - remove from all active indexes (capability, domain, availability, skill)
      - retain full record in DECOMMISSIONED archive (7-year retention)
      - emit AGENT_DECOMMISSIONED event
    if TEMPORARY_REMOVAL (maintenance, version upgrade):
      - set availability.status = OFFLINE
      - retain in all indexes (agent may return)
      - emit AGENT_OFFLINE event
  
  step_4_knowledge_preservation:
    action: trigger episodic memory export from agent-memory-system.md
    action: submit any pending semantic memory contributions to org knowledge base
    action: update agent's open coaching plans to CLOSED status
    action: record deregistration in agent's performance record
```

---

## Record Maintenance

```yaml
record_maintenance:
  triggered_updates:
    CAPABILITY_CHANGE:
      trigger: assessment record updated in agent-capability-assessment.md
      action: update capability_profile in registry record + capability_index
      latency: < 5 minutes after assessment completion
    
    SKILL_GRANT_OR_REVOKE:
      trigger: skill authorization change in agent-skill-registry.md
      action: update authorized_skills list + skill_index
      latency: synchronous (immediate)
    
    PERFORMANCE_UPDATE:
      trigger: hourly performance tracker update from agent-performance-tracker.md
      action: update performance_context fields
      latency: hourly
    
    AVAILABILITY_UPDATE:
      trigger: heartbeat cycle (every 30 seconds from agent-health-monitor.md)
      action: update availability.status, load_factor, current_task_count
      latency: < 5 seconds from heartbeat receipt
    
    ROUTING_CHANGE:
      trigger: agent submits routing update (new endpoint, protocol change, capacity change)
      action: update routing fields; re-validate endpoint; update all dependent indexes
      requires: Tier-3 supervisor notification for capacity reductions > 50%
    
    TIER_CHANGE:
      trigger: governance decision (promotion or demotion)
      action: update tier; re-evaluate all capability authorizations; update domain_index
      requires: Tier-3+ approval for promotion; Tier-4+ for demotion
  
  scheduled_maintenance:
    daily_staleness_check:
      check: last_updated > 7 days → flag record for owner review
      check: performance_context.last_performance_update > 2 hours → alert health monitor
    
    weekly_index_reconciliation:
      action: verify all 6 indexes are consistent with primary registry records
      auto_fix: minor discrepancies corrected automatically
      escalate: major discrepancies (>1% of records) → operator review
    
    monthly_record_audit:
      check: all registered agents have had at least 1 health probe in 30 days
      check: capability_profiles have current assessment records (per assessment schedule)
      check: all T3+ agents have assigned supervisor_agent
      output: roster_audit_report (see governance section)
```

---

## Version Management

```yaml
version_management:
  version_upgrade_protocol:
    step_1: register new version as separate agent record (same org/type, new seq)
    step_2: run parallel validation (new version passes capability verification)
    step_3: drain old version (deregistration pipeline step 1-2)
    step_4: cutover traffic to new version
    step_5: decommission old version record (DECOMMISSIONED status; 7-year retention)
  
  version_rollback:
    trigger: new version fails health probe or performance drops > 20% in 48h
    action: old version re-activated if still within 7-day rollback window
    requires: Tier-3 supervisor authorization
  
  version_compatibility:
    if capabilities changed between versions: re-run capability verification (step 3)
    if tier changed between versions: re-run authorization check (step 4)
    if routing protocol changed: validate new endpoint before cutover
```

---

## Roster Governance

```yaml
roster_governance:
  policies:
    POLICY-RM-001:
      name: no_unilateral_self_registration
      rule: agents cannot register themselves at T3+ without human approval
      enforcement: authorization check in step 4
    
    POLICY-RM-002:
      name: roster_completeness_enforcement
      rule: all active agents in the enterprise must be in the registry
      enforcement: monthly roster audit; unregistered agents flagged for immediate registration
    
    POLICY-RM-003:
      name: record_accuracy_sla
      rule: registry records must reflect actual agent state within defined latencies
      sla: capability changes ≤5 min; availability ≤5 sec; performance ≤1 hour
      enforcement: daily staleness check; SLA breach alerts
    
    POLICY-RM-004:
      name: decommission_completeness
      rule: decommissioned agents must have complete handoff manifest before removal
      exception: emergency decommission with forced handoff permitted (Tier-4+ only)
    
    POLICY-RM-005:
      name: audit_trail_integrity
      rule: all roster changes are append-only audit log entries with cryptographic chaining
      retention: 7 years for all registration/deregistration events
  
  roster_audit_report:
    frequency: monthly
    content:
      - total agents by type, tier, org
      - registrations this month (new + version upgrades)
      - deregistrations this month (voluntary + forced + automated)
      - stale records count
      - policy violations detected and remediated
      - upcoming planned decommissions
    recipients: Tier-4+ leadership; capability governance lead
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-registry/agent-registry-model.md` | Primary record schema and index definitions |
| `agent-registry/agent-health-monitor.md` | Availability updates trigger record maintenance |
| `agent-capabilities/agent-capability-assessment.md` | Capability changes trigger record updates |
| `agent-capabilities/agent-skill-registry.md` | Skill grants trigger authorized_skills updates |
| `agent-performance/agent-performance-tracker.md` | Performance updates trigger performance_context refresh |
| `agent-intelligence/agent-memory-system.md` | Episodic memory preserved on deregistration |
| `enterprise-telemetry/enterprise-event-bus.md` | AGENT_REGISTERED / AGENT_DECOMMISSIONED events |
