# Incident Case Management

## Purpose
Manages incidents — events that cause or threaten operational harm, constitutional violations, security breaches, SLA failures, or organizational disruption. Incidents require rapid structured response, unlike regular cases which are goal-oriented and exploratory.

---

## Incident Classification

### Severity Levels

| Severity | Definition | Response SLA | Incident Commander |
|---|---|---|---|
| **P1 — Critical** | System-wide failure; constitutional violation; data breach; all-org operational halt | Immediate (< 5 min) | Required — Tier 4+ |
| **P2 — High** | Major functional failure; multi-org impact; SLA breach > 200%; governance failure | < 15 minutes | Required — Tier 3+ |
| **P3 — Medium** | Significant single-org impact; SLA breach 150–200%; repeated governance warnings | < 1 hour | Assigned — Tier 2+ |
| **P4 — Low** | Minor functional degradation; single-org; SLA breach 100–150%; isolated governance issue | < 4 hours | Self-managed |

### Incident Types

```yaml
incident_types:
  OPERATIONAL:
    subtypes: [SERVICE_OUTAGE, PERFORMANCE_DEGRADATION, DATA_PIPELINE_FAILURE, INTEGRATION_FAILURE]
    default_severity: P2
    
  CONSTITUTIONAL:
    subtypes: [PRINCIPLE_VIOLATION, AUTHORITY_ABUSE, OVERSIGHT_BYPASS, TRANSPARENCY_FAILURE]
    default_severity: P1   # always critical
    auto_escalate: true
    
  SECURITY:
    subtypes: [UNAUTHORIZED_ACCESS, DATA_EXPOSURE, PRIVILEGE_ESCALATION, TRUST_BOUNDARY_VIOLATION]
    default_severity: P1
    auto_escalate: true
    
  GOVERNANCE:
    subtypes: [APPROVAL_CORRUPTION, AUDIT_TAMPERING, POLICY_VIOLATION, COMPLIANCE_FAILURE]
    default_severity: P2
    
  ORGANIZATIONAL:
    subtypes: [MASS_ESCALATION, AGENT_POOL_EXHAUSTION, KNOWLEDGE_LOSS, COORDINATION_BREAKDOWN]
    default_severity: P3
```

---

## Incident Lifecycle

```
DETECTED ——[triage]——→ TRIAGED
TRIAGED ——[commander assigned]——→ ACTIVE
ACTIVE ——[mitigation in place]——→ MITIGATED
MITIGATED ——[root cause resolved]——→ RESOLVED
RESOLVED ——[postmortem complete]——→ CLOSED
ACTIVE ——[escalation needed]——→ ESCALATED
ESCALATED ——[escalation resolved]——→ ACTIVE (or RESOLVED)
```

---

## Incident Schema

```yaml
incident:
  incident_id: "INC-YYYYMMDD-NNN"
  incident_type: [from taxonomy]
  severity: P1 | P2 | P3 | P4
  title: "short descriptive title"
  description: "what is happening and observed impact"
  
  detection:
    detected_at: ISO-8601
    detected_by: agent-id | automated-monitor
    detection_source: ALERT | USER_REPORT | MONITORING | AUDIT | CONSTITUTIONAL_CHECK
    
  impact:
    affected_orgs: [org-name]
    affected_workflows: [process-id]
    affected_agents: [agent-id]
    user_impact: NONE | DEGRADED | BLOCKED | DATA_AT_RISK
    estimated_affected_count: integer
    
  commander:
    commander_id: agent-id | null
    assigned_at: ISO-8601 | null
    tier: 2–5
    
  response_team: [agent-id]
  
  timeline:
    - event_type: DETECTED | TRIAGED | COMMANDER_ASSIGNED | UPDATE | MITIGATED | RESOLVED | CLOSED
      timestamp: ISO-8601
      actor: agent-id
      description: string
      
  mitigation:
    plan: string
    steps: [mitigation-step]
    status: NOT_STARTED | IN_PROGRESS | PARTIAL | COMPLETE
    eta: ISO-8601 | null
    
  root_cause:
    identified: true/false
    description: string | null
    category: PROCESS | TECHNICAL | HUMAN | GOVERNANCE | EXTERNAL
    contributing_factors: [string]
    
  resolution:
    status: OPEN | MITIGATED | RESOLVED
    resolved_at: ISO-8601 | null
    resolution_description: string | null
    
  postmortem:
    required: true/false   # always true for P1/P2
    status: NOT_STARTED | IN_PROGRESS | COMPLETE | WAIVED
    postmortem_id: string | null
    
  governance:
    constitutional_violation: true/false
    governance_incident_created: true/false
    tier_notified: integer
    audit_enhanced: true/false
```

---

## Triage Protocol

```
triage(incident_signal):
  # Step 1: Classify
  incident_type = classify_signal(incident_signal)
  severity = determine_severity(incident_type, incident_signal.impact_indicators)
  
  # Step 2: Constitutional check
  if incident_type == CONSTITUTIONAL:
    severity = max(severity, P1)
    immediately_notify(governance_lead, Tier4_principal)
    create_constitutional_audit_flag()
  
  # Step 3: Assign commander
  if severity in [P1, P2]:
    commander = find_available_commander(tier=severity_to_tier_map[severity])
    if not commander:
      use_on_call_commander()
      escalate_to_delivery_lead()
  
  # Step 4: Assemble response team
  team = select_response_team(incident_type, affected_orgs)
  
  # Step 5: Open communication channel
  create_incident_channel(incident_id)
  notify_team(team)
  
  # Step 6: Lock affected context
  if severity == P1:
    suspend_affected_workflows()
    preserve_state_snapshot()
  
  return created_incident
```

---

## Incident Response Playbooks

### Playbook: Service Outage (P1/P2)
```yaml
steps:
  1. Preserve state snapshot of all affected systems
  2. Identify blast radius (workflow-dependency-maps.md blast radius tool)
  3. Activate fallback routing if available
  4. Notify all affected stakeholders (human + AI participants)
  5. Begin root cause investigation in parallel with mitigation
  6. Deploy mitigation (targeted, minimal footprint)
  7. Verify restoration with monitoring
  8. Gradual traffic restoration
  9. Monitor for 30 minutes post-restoration
  10. Declare RESOLVED; begin postmortem scheduling
```

### Playbook: Constitutional Violation (Always P1)
```yaml
steps:
  1. IMMEDIATE: Suspend all activity by violating agent(s)
  2. IMMEDIATE: Preserve complete audit trail (tamper-proof snapshot)
  3. Notify: governance-lead + Tier-4 principal + executive-sponsor
  4. Constitutional review board convened within 1 hour
  5. Full scope determination: what actions were taken, what artifacts affected
  6. Remediation plan: reverse harmful actions where possible
  7. Governance approval required before any work resumes in affected area
  8. Mandatory postmortem
  9. Policy review: does the violation indicate a gap in constitutional guardrails?
  10. Preventive measures implemented and verified before case closed
```

---

## Postmortem System

Required for all P1 and P2 incidents:

```yaml
postmortem:
  postmortem_id: "PM-YYYYMMDD-NNN"
  incident_id: string
  
  blameless: true   # mandatory — postmortems are system-focused, not person-focused
  
  sections:
    incident_summary:
      what: "what happened"
      when: "timeline"
      impact: "what was affected"
      
    root_cause_analysis:
      primary_cause: string
      contributing_factors: [string]
      why_5x: ["why1", "why2", "why3", "why4", "why5"]   # 5-whys analysis
      
    what_went_well: [string]
    what_went_poorly: [string]
    
    action_items:
      - id: "AI-NNN"
        description: string
        owner: agent-id
        type: PREVENTION | DETECTION | RESPONSE | PROCESS
        priority: HIGH | MEDIUM | LOW
        due_date: ISO-8601
        status: OPEN | IN_PROGRESS | DONE
    
    process_improvements:
      workflow_changes: [change-description]
      governance_changes: [change-description]
      monitoring_changes: [change-description]
    
  completed_by: agent-id
  reviewed_by: [agent-id]
  approved_by: governance-lead-id
  published_at: ISO-8601

postmortem_sla:
  P1: complete within 48 hours of resolution
  P2: complete within 5 days of resolution
```

---

## Incident Metrics

Published to `enterprise-telemetry/organizational-health-telemetry.md`:

```yaml
metrics:
  mttr:             # Mean Time to Resolve
    by_severity: {P1, P2, P3, P4}
    rolling: 30d
  mttd:             # Mean Time to Detect
    by_type: {OPERATIONAL, CONSTITUTIONAL, SECURITY, GOVERNANCE, ORGANIZATIONAL}
  incident_rate:    # incidents per 7 days per org
  repeat_rate:      # % incidents with same root cause as prior incident
  postmortem_completion_rate:  # % completed within SLA
  action_item_completion_rate: # % action items done by due date
```
