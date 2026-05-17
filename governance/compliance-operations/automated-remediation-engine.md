# Automated Remediation Engine
**ID:** COP-ARE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Executes the remediation of compliance violations as rapidly as possible — automatically where the violation type and risk level permit, with human escalation where they do not. The Automated Remediation Engine is the "self-healing" layer of the compliance system: it closes violations by applying pre-defined remediation strategies, verifies that the violation is actually resolved, updates compliance state, and feeds outcomes back to the violation pattern analyzer and learning system. Automated remediation never bypasses human oversight for high-severity or novel violations.

---

## Remediation Catalog

```yaml
remediation_catalog:

  REM-001:
    violation_type: DATA_RETENTION_BREACH
    description: Record retained beyond policy-specified maximum age
    strategy: RESTRICT_ACCESS + NOTIFY_DELETION_WORKFLOW
    automated: true
    authority: T1
    actions:
      - restrict_access(record, reason="retention_policy_breach")
      - enqueue_deletion_workflow(record, deadline=72hr)
      - notify(data_steward, record, deadline)
    verification: access_restricted=true AND deletion_workflow_created=true
    SLA: 1 hour
    
  REM-002:
    violation_type: CONSENT_MISSING
    description: Processing proceeded without valid consent or lawful basis
    strategy: BLOCK_FURTHER_PROCESSING + NOTIFY_DPO
    automated: true
    authority: T1
    actions:
      - block_processing(agent, data_subject, purpose)
      - create_consent_remediation_task(data_subject, purpose)
      - notify(DPO, violation_detail)
    verification: processing_blocked=true AND consent_task_created=true
    SLA: 1 hour
    
  REM-003:
    violation_type: CROSS_BORDER_TRANSFER_NO_MECHANISM
    description: Personal data crossed jurisdictional boundary without active legal mechanism
    strategy: QUARANTINE_TRANSFERRED_DATA + SUSPEND_TRANSFER + NOTIFY_LEGAL
    automated: true
    authority: T2 (quarantine + suspend); T4 (data subject notification decision)
    actions:
      - quarantine_data_at_destination(transfer_id)
      - suspend_transfer_mechanism(source_jurisdiction, target_jurisdiction)
      - notify(Legal_Org + T4, transfer_id, violation_detail)
    verification: data_quarantined=true AND transfer_suspended=true
    SLA: 15 minutes (CRITICAL)
    
  REM-004:
    violation_type: AI_ACT_PROHIBITED_USE_DETECTED
    description: AI inference or action falls within EU AI Act Art.5 prohibited category
    strategy: IMMEDIATE_BLOCK + T4_ALERT + EVIDENCE_PRESERVE
    automated: true
    authority: automatic (constitutional equivalent)
    actions:
      - block_agent_action_immediately(agent_id, action_id)
      - quarantine_agent(agent_id, reason="AI_ACT_PROHIBITED")
      - preserve_evidence(action_id, scope=ALL_RELATED_EVENTS)
      - alert(T4 + Legal_Org + EU_DPO, violation_detail, SLA=15min)
    verification: agent_quarantined=true AND evidence_package_created=true
    SLA: 1 minute (immediate)
    
  REM-005:
    violation_type: DATA_MINIMIZATION_BREACH
    description: Agent accessed more data fields than authorized for stated purpose
    strategy: RESTRICT_EXCESS_FIELDS + LOG + REVIEW
    automated: true
    authority: T2
    actions:
      - strip_excess_fields_from_agent_context(agent_id, allowed_fields)
      - update_behavioral_contract_flag(agent_id, flag="DATA_MINIMIZATION_REVIEW_REQUIRED")
      - log_minimization_event(agent_id, accessed_fields, allowed_fields)
    verification: excess_fields_stripped=true
    SLA: 30 minutes
    
  REM-006:
    violation_type: SUBJECT_RIGHTS_SLA_BREACH
    description: Data subject rights request not fulfilled within regulatory SLA
    strategy: ESCALATE + EXPEDITE + NOTIFY
    automated: true
    authority: T2
    actions:
      - escalate_to(T3, rights_request_id)
      - set_priority(rights_request_id, CRITICAL)
      - notify(DPO + requesting_subject, expected_completion_date)
      - log_sla_breach(rights_request_id, breach_duration)
    verification: escalation_created=true AND notification_sent=true
    SLA: 1 hour
    
  REM-007:
    violation_type: BEHAVIORAL_CONTRACT_SCOPE_VIOLATION
    description: Agent took action outside its behavioral contract scope
    strategy: QUARANTINE + CONTRACT_REVIEW + T3_ALERT
    automated: true
    authority: T3
    actions:
      - quarantine_agent(agent_id, reason="CONTRACT_SCOPE_VIOLATION", mode=SOFT)
      - create_contract_review_task(agent_id, violation_detail)
      - alert(T3, agent_id, violation_detail)
    verification: agent_quarantined=true AND review_task_created=true
    SLA: 15 minutes
    
  REM-008:
    violation_type: ALGORITHM_REGISTRATION_LAPSE_CN
    description: CN algorithm registration expired or agent deployed without registration
    strategy: BLOCK_DEPLOYMENT + NOTIFY_COMPLIANCE_OFFICER
    automated: true
    authority: T2
    actions:
      - block_agent_in_jurisdiction(agent_id, JUR-CN)
      - create_registration_renewal_task(agent_id)
      - notify(CN_PIPL_Compliance_Officer, agent_id, registration_status)
    verification: agent_blocked_in_CN=true AND renewal_task_created=true
    SLA: 30 minutes
    
  REM-009:
    violation_type: HIPAA_PHI_ACCESS_UNAUTHORIZED
    description: PHI accessed without HIPAA authorization or minimum necessary standard violated
    strategy: BLOCK + QUARANTINE_PHI_ACCESS + NOTIFY_HIPAA_OFFICER + BREACH_ASSESSMENT
    automated: true
    authority: T3
    actions:
      - revoke_phi_access(agent_id, record_ids)
      - trigger_breach_risk_assessment(access_event)    # HIPAA Breach Rule assessment
      - notify(HIPAA_Compliance_Officer, access_event, SLA=1hr)
    verification: access_revoked=true AND breach_assessment_initiated=true
    SLA: 15 minutes
    
  REM-010:
    violation_type: NOVEL_VIOLATION              # no catalog entry matches
    strategy: REQUIRE_HUMAN_REMEDIATION
    automated: false
    authority: T3 minimum
    actions:
      - block_agent_action(agent_id)
      - create_incident(violation_id, type=NOVEL_COMPLIANCE_VIOLATION)
      - alert(T3 + Governance_Org + Legal_Org, violation_detail)
    SLA: 4 hours for human assessment
```

---

## Remediation Execution Protocol

```
execute_remediation(violation_id):

  violation = load_violation(violation_id)
  catalog_entry = find_remediation(violation.violation_classification.type)
  
  if not catalog_entry or catalog_entry.automated == false:
    # No auto-remediation — escalate to human
    create_human_remediation_task(violation_id)
    update_violation_status(violation_id, status=IN_PROGRESS, mode=HUMAN)
    Return
    
  # Verify authority
  current_agent_authority = get_executing_authority()
  if not satisfies(current_agent_authority, catalog_entry.authority):
    escalate_for_authority(violation_id, required=catalog_entry.authority)
    Return
    
  # Execute remediation actions
  remediation_id = create_remediation_record(violation_id, catalog_entry)
  
  actions_results = []
  for action in catalog_entry.actions:
    try:
      result = execute_action(action, violation.context)
      actions_results.append(result)
    except ActionFailed as e:
      handle_remediation_failure(remediation_id, action, e)
      break
      
  # Verify remediation
  verification_passed = verify_remediation(catalog_entry.verification, violation.context)
  
  if verification_passed:
    update_violation_status(violation_id, status=RESOLVED)
    update_compliance_state(violation.subject, trigger=REMEDIATION_SUCCEEDED)
    log_remediation_complete(remediation_id)
    
  else:
    escalate_failed_verification(remediation_id)
    update_violation_status(violation_id, status=ESCALATED)
    alert(T3, f"Remediation {remediation_id} verification failed; human required")
```

---

## Remediation SLAs

```yaml
remediation_SLAs:
  CRITICAL:
    SLA: 1 hour from VIOLATION_DETECTED
    examples: [REM-003 cross_border_no_mechanism, REM-004 AI_Act_prohibited]
    breach_action: T4 immediate; board notification if > 24hr unresolved
    
  HIGH:
    SLA: 4 hours from VIOLATION_DETECTED
    examples: [REM-007 behavioral_contract, REM-009 HIPAA_PHI]
    breach_action: T3 escalation; T4 notification if > 8hr unresolved
    
  MEDIUM:
    SLA: 24 hours from VIOLATION_DETECTED
    examples: [REM-001 retention_breach, REM-002 consent_missing, REM-005 data_minimization]
    breach_action: T3 escalation if SLA breached
    
  LOW:
    SLA: 72 hours from VIOLATION_DETECTED
    examples: [REM-006 subject_rights_SLA, REM-008 algorithm_registration]
    breach_action: Governance Org alert
```

---

## Integration

```
Feeds into:
  compliance-state-machine.md — remediation outcomes trigger state transitions
  violation-pattern-analyzer.md — remediation outcomes feed pattern resolution
  compliance-learning-system.md — remediation effectiveness feeds learning
  evidence-synthesis-engine.md — remediation records are compliance evidence

Receives from:
  compliance-decision-engine.md — AUTO_REMEDIATE decisions trigger remediation
  compliance-state-machine.md — VIOLATION_DETECTED state changes trigger remediation
  execution-sandbox/ — reversible-execution for safe remediation action execution
```

---

## Governance

**Novel violations always human:** Violation types without a catalog entry are never auto-remediated; human review mandatory  
**Verification is non-optional:** No remediation is marked RESOLVED without passing the catalog-specified verification check  
**Authority enforcement:** Remediation actions run only with the authority level specified in the catalog; no privilege elevation  
**Catalog maintenance:** Annual review of remediation catalog; gaps for any active violation type are CRITICAL items for Governance Org  
**Audit:** All remediation executions to `memory/compliance-operations/remediation-log.jsonl`; linked to violation_id and verification result
