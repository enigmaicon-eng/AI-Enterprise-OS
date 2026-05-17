# Incident Lessons Learned

## Purpose
Systematically extracts, structures, and preserves organizational learning from every significant incident. Incident knowledge is the highest-urgency knowledge type — it encodes hard-won understanding about failure modes, detection gaps, and response patterns that must be preserved and applied to prevent recurrence.

---

## Lessons Learned Process

```
Incident Closed (P1–P4)
        ↓
[1. Mandatory Blameless Postmortem]  → conducted within SLA by incident commander
[2. Structured Extraction]           → convert postmortem to knowledge unit drafts
[3. Root Cause Classification]       → map causes to known failure mode taxonomy
[4. Pattern Matching]                → find related incidents and patterns
[5. Recommendation Generation]       → produce concrete prevention and detection actions
[6. Knowledge Unit Publishing]       → publish INCIDENT_KNOWLEDGE units
[7. Action Tracking]                 → track whether recommendations are implemented
[8. Recurrence Detection]            → monitor for repeat incidents
```

---

## Postmortem Requirements

```yaml
postmortem_requirements:
  trigger: all incidents P1, P2, P3 (P4 optional but encouraged)
  
  sla:
    P1: postmortem completed within 5 business days
    P2: postmortem completed within 10 business days
    P3: postmortem completed within 20 business days
  
  required_participants:
    P1: incident_commander + all responders + Tier-3+ sponsor
    P2: incident_commander + primary responders
    P3: incident_commander (solo OK for simple incidents)
  
  blameless_principle:
    enforce: system and process failures are the focus; not individual failures
    facilitator_responsibility: redirect blame language; reframe as system causes
    prohibited: naming individuals as root cause; using "human error" without system analysis
  
  postmortem_template:
    sections:
      incident_summary:
        - title and severity
        - timeline (detection → impact → response → resolution)
        - total_customer_impact and business_impact
      
      root_cause_analysis:
        - primary_root_cause (single clearest cause)
        - contributing_factors (systemic + process + tooling)
        - five_whys analysis (drill from symptom to root)
        - trigger vs. root_cause distinction
      
      detection_analysis:
        - how_was_it_detected (monitor / alert / user_report / random_observation)
        - detection_delay: time from occurrence to detection
        - detection_gaps: what monitoring would have caught this earlier
      
      response_analysis:
        - what_worked_well
        - what_did_not_work
        - escalation_path_assessment
        - communication_effectiveness
      
      resolution_analysis:
        - resolution_steps_taken
        - time_to_resolution
        - workarounds_applied
        - permanent_fix_status
      
      action_items:
        - [{action, owner, priority: P0/P1/P2, due_by, prevents_recurrence: bool}]
      
      lessons_learned:
        - [{lesson, category, applicability}]
```

---

## Structured Extraction Schema

```yaml
lessons_learned_extraction:
  auto_extract_from_postmortem:
    one_ku_per_lesson: true
    one_ku_per_failure_mode: true
    one_ku_per_detection_gap: true
    one_ku_per_response_pattern: true
  
  lesson_ku_schema:
    knowledge_type: INCIDENT_KNOWLEDGE
    domain: INCIDENT
    subdomain: failure_modes | response_playbooks | root_cause_patterns | prevention_strategies
    
    content.structured_data:
      root_cause: string
      contributing_factors: [string]
      detection_signals: [string]            # observable signals that preceded failure
      detection_lag_minutes: int             # how late detection was
      remediation_steps: [string]            # steps that resolved the incident
      prevention_measures: [string]          # what would prevent recurrence
      severity: P1 | P2 | P3 | P4
      incident_type: OPERATIONAL | CONSTITUTIONAL | SECURITY | GOVERNANCE | ORGANIZATIONAL
      recurrence_risk: HIGH | MEDIUM | LOW   # human assessment
      affected_systems: [string]
    
    provenance:
      origin_type: INCIDENT_LESSON
      origin_refs: [incident_id]
      captured_by: knowledge-capture-agent
      contributing_agents: [postmortem_participants]
      evidence_strength: OBSERVED             # default; upgrade to VALIDATED after prevention works
      confidence: 0.80                        # default for reviewed postmortem
  
  detection_gap_ku_schema:
    knowledge_type: DOMAIN_KNOWLEDGE
    domain: OPERATIONAL
    subdomain: monitoring_patterns
    
    content.body: |
      Detection gap identified during incident {incident_id}:
      {description_of_gap}
      
      Recommended monitoring: {recommendations}
    
    tags: [diagnostic, prescriptive, agent-facing]
```

---

## Root Cause Taxonomy

```yaml
root_cause_taxonomy:
  CONFIGURATION:
    subtypes: [misconfiguration, default_unchanged, config_drift, environment_mismatch]
    prevention_patterns: [configuration_validation, drift_detection, change_review]
  
  CAPACITY:
    subtypes: [resource_exhaustion, quota_exceeded, throughput_overflow, memory_leak]
    prevention_patterns: [capacity_planning, auto_scaling, load_testing]
  
  DEPENDENCY:
    subtypes: [upstream_failure, api_change_breaking, third_party_outage, circular_dependency]
    prevention_patterns: [circuit_breaker, graceful_degradation, dependency_monitoring]
  
  PROCESS:
    subtypes: [procedure_gap, procedure_not_followed, procedure_ambiguous, missing_runbook]
    prevention_patterns: [procedure_review, runbook_update, training]
  
  GOVERNANCE:
    subtypes: [approval_bypassed, policy_gap, authority_confusion, escalation_failure]
    prevention_patterns: [governance_hardening, policy_update, authority_clarification]
  
  SECURITY:
    subtypes: [credential_exposure, access_control_failure, injection, privilege_escalation]
    prevention_patterns: [security_review, access_audit, penetration_testing]
  
  KNOWLEDGE:
    subtypes: [unknown_behavior, assumption_violated, undocumented_constraint, stale_knowledge]
    prevention_patterns: [knowledge_capture, documentation_update, knowledge_review]
  
  TOOL:
    subtypes: [bug_in_tool, tool_version_mismatch, tool_limitation, agent_defect]
    prevention_patterns: [version_pinning, testing, vendor_escalation]
```

---

## Action Item Tracking

```yaml
action_tracking:
  action_item_schema:
    action_id: "AI-{incident_id}-{seq}"
    description: string
    owner: agent-id
    priority: P0 | P1 | P2
    prevents_recurrence: boolean
    due_by: ISO-8601
    status: OPEN | IN_PROGRESS | COMPLETE | DEFERRED | BLOCKED
    completion_evidence: string | null
    completion_verified_by: agent-id | null
  
  monitoring:
    P0_actions: review daily; escalate to Tier-4+ if not started within 24h
    P1_actions: review weekly; escalate if not complete by due_by
    P2_actions: review monthly; close if no progress after 90 days
  
  recurrence_detection:
    method: new incident classified with same root_cause AND same affected_system
    action: alert to original postmortem owner + knowledge-governance-lead
    knowledge_update: downgrade evidence_strength of "prevention works" claim
    pattern_flag: if recurs 3× → create PATTERN_KNOWLEDGE unit for the failure mode
  
  resolution_tracking:
    when_prevents_recurrence_action_complete:
      update_ku: evidence_strength OBSERVED → VALIDATED
      add_outcome: positive_outcome to associated INCIDENT_KNOWLEDGE units
```

---

## Incident Pattern Synthesis

```yaml
incident_pattern_synthesis:
  run_frequency: monthly
  
  algorithms:
    recurrence_pattern:
      method: cluster incidents by root_cause + affected_system
      threshold: same root_cause >= 3 times in 90 days
      output: PATTERN_KNOWLEDGE unit on the recurrence pattern
    
    detection_lag_pattern:
      method: aggregate detection_lag across similar incident types
      threshold: avg detection_lag > 2× benchmark
      output: DOMAIN_KNOWLEDGE unit flagging monitoring gap category
    
    cross_system_blast_pattern:
      method: identify incidents where same root_cause propagated to multiple systems
      threshold: blast_radius >= 3 systems
      output: RELATIONSHIP_KNOWLEDGE unit on system dependency risk
    
    response_effectiveness_pattern:
      method: compare response steps across P1/P2 incidents; find consistently effective steps
      threshold: same response step rated "worked well" in >= 70% of similar incidents
      output: PROCESS_KNOWLEDGE unit as incident response pattern
```

---

## Integration Points

| System | Role |
|---|---|
| `case-management/incident-case-management.md` | Incident record source |
| `knowledge-base/knowledge-model.md` | INCIDENT_KNOWLEDGE type definition |
| `knowledge-base/knowledge-repository.md` | KU storage |
| `knowledge-capture/pattern-recognition-engine.md` | Pattern synthesis |
| `knowledge-governance/knowledge-accuracy-monitor.md` | Action completion tracking |
| `enterprise-telemetry/enterprise-event-bus.md` | Incident closed event trigger |
