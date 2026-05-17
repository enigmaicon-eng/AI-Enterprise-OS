# SOC Playbook Engine
**ID:** SOC-SPE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Executes structured, repeatable security response playbooks for known threat scenarios — automating the routine steps that every analyst would take for a given alert type, while preserving human decision points for actions requiring judgment, authority, or legal review. The SOC Playbook Engine is the SOAR (Security Orchestration, Automation, and Response) layer of the SOC: it ensures consistent, fast, auditable response to security events and prevents analyst-to-analyst variance in handling common threats.

---

## Playbook Library

```yaml
playbook_library:

  PB-SOC-001:
    name: "Phishing Email Investigation and Response"
    trigger_alerts: [PHISHING_DETECTED, MALICIOUS_URL_CLICKED, CREDENTIAL_HARVEST_SUSPECTED]
    severity_scope: [CRITICAL, HIGH, MEDIUM]
    automated_steps:
      1. extract_email_headers(email_id)
      2. detonate_urls(url_list, sandbox=synthetic-enterprise-environment)
      3. check_sender_reputation(sender_domain, sender_ip)
      4. check_ioc_match(url_list + attachment_hashes)
      5. identify_recipients(email_thread)
    human_gate_A:
      decision: "Quarantine sender domain?"
      authority: T2
      SLA: 30 minutes
    automated_steps_continued:
      6. IF approved: block_sender_domain(domain)
      7. quarantine_emails_in_flight(email_thread)
      8. notify_recipients(risk_guidance)
      9. create_ioc_records(confirmed_malicious_indicators)
      10. close_alert_with_classification(TRUE_POSITIVE)
    rollback: unquarantine_domain if false positive confirmed
    
  PB-SOC-002:
    name: "Malware Detection and Remediation"
    trigger_alerts: [MALWARE_DETECTED, RANSOMWARE_INDICATORS, SUSPICIOUS_PROCESS]
    severity_scope: [CRITICAL, HIGH]
    automated_steps:
      1. isolate_affected_agent(agent_id, mode=NETWORK_ISOLATION)
      2. collect_forensic_artifacts(agent_id)  # memory dump, process list, network connections
      3. compute_hash(suspicious_file) → check_against_ioc_store
      4. enumerate_lateral_movement(agent_id, window=24hr)
      5. snapshot_agent_state(agent_id)         # pre-remediation snapshot
    human_gate_A:
      decision: "Scope and remediation approach confirmed?"
      authority: T2
      SLA: 15 minutes (CRITICAL); 1 hour (HIGH)
    automated_steps_continued:
      6. execute_remediation(remediation_plan)
      7. re-image or restore_from_snapshot(agent_id)
      8. verify_clean(agent_id)
      9. restore_network_access(agent_id)
      10. create_iocs_from_artifacts
      
  PB-SOC-003:
    name: "Credential Compromise Response"
    trigger_alerts: [CREDENTIAL_COMPROMISE, IMPOSSIBLE_TRAVEL, TOKEN_REPLAY_DETECTED]
    severity_scope: [CRITICAL, HIGH]
    automated_steps:
      1. revoke_all_tokens(agent_id)
      2. force_behavioral_contract_revalidation(agent_id)
      3. audit_recent_actions(agent_id, window=24hr)
      4. check_for_lateral_movement(agent_id)
      5. identify_accessed_resources(agent_id, window=24hr)
    human_gate_A:
      decision: "Reset credentials and notify affected resource owners?"
      authority: T2
      SLA: 30 minutes
    automated_steps_continued:
      6. issue_new_credentials(agent_id)
      7. notify_affected_resource_owners(accessed_resources)
      8. IF data_accessed: trigger_compliance_assessment(accessed_data_classes)
      9. enhanced_monitoring(agent_id, duration=7_days)
      
  PB-SOC-004:
    name: "Critical IOC Match Response"
    trigger_alerts: [IOC_MATCHED_CRITICAL]
    severity_scope: [CRITICAL]
    automated_steps:
      1. block_ioc_at_all_gateways(ioc)
      2. scan_for_ioc_in_logs(ioc, window=90_days)  # historical compromise check
      3. identify_agents_with_ioc_contact(ioc)
      4. check_ioc_context(threat_actor, campaign, ttp)
    human_gate_A:
      decision: "Quarantine agents with IOC contact?"
      authority: T2
      SLA: 15 minutes
    automated_steps_continued:
      5. IF approved: quarantine_agents(agents_with_contact)
      6. collect_evidence(agents_with_contact)
      7. update_ioc_confidence(ioc, sighted_internally=True)
      8. share_ioc_with_threat_intel_platform
      
  PB-SOC-005:
    name: "AI Prompt Injection / Jailbreak Response"
    trigger_alerts: [PROMPT_INJECTION_DETECTED, JAILBREAK_ATTEMPT, MULTI_TURN_MANIPULATION,
                     CONSTITUTIONAL_PROXIMITY_CRITICAL]
    severity_scope: [CRITICAL]
    automated_steps:
      1. terminate_session(session_id)
      2. quarantine_session_artifacts(session_id)  # preserve full conversation history
      3. constitutional_proximity_score_snapshot(session_id)
      4. identify_injection_vector(session_id)     # direct, indirect, multi-turn
      5. check_actor_pattern_match(session_artifacts)
    human_gate_A:
      decision: "Quarantine agent? Report to constitutional quorum?"
      authority: T2 (quarantine); T3 (constitutional report)
      SLA: 15 minutes
    automated_steps_continued:
      6. IF constitutional_proximity > 0.85: mandatory_report_to_quorum(session_id)
      7. quarantine_agent_if_approved(agent_id)
      8. extract_iocs_from_injection_payload
      9. update_detection_rules(injection_pattern)
      10. brief_T4_within_1hr
      
  PB-SOC-006:
    name: "Cross-Border Data Anomaly Response"
    trigger_alerts: [CROSS_JURISDICTION_LEAK, UNAUTHORIZED_CROSS_BORDER_TRANSFER]
    severity_scope: [CRITICAL]
    automated_steps:
      1. quarantine_data_at_destination(data_id, jurisdiction)
      2. suspend_transfer_mechanism(source_jurisdiction, target_jurisdiction)
      3. identify_data_scope(data_id)              # what was transferred; data classes
      4. calculate_subjects_affected(data_id)
    human_gate_A:
      decision: "Initiate GDPR/PIPL breach assessment?"
      authority: T4 + Legal Org
      SLA: 30 minutes
    automated_steps_continued:
      5. IF gdpr_applicable: start_72hr_notification_clock
      6. preserve_evidence_for_dpa(data_id, transfer_record)
      7. notify_entity_dpo(affected_jurisdictions)
      8. coordinate_with_cross-border-governance.md
      
  PB-SOC-007:
    name: "Ransomware Containment"
    trigger_alerts: [RANSOMWARE_INDICATORS, DATA_ENCRYPTED_UNEXPECTED]
    severity_scope: [CRITICAL]
    automated_steps:
      1. network_isolate_all_suspect_agents(agents)  # immediately; no human gate
      2. block_known_ransomware_c2_iocs
      3. snapshot_unaffected_systems_immediately
      4. enumerate_encrypted_files
      5. identify_patient_zero(correlation)
    human_gate_A:
      decision: "Initiate DR plan? Notify law enforcement?"
      authority: T4
      SLA: 30 minutes
    automated_steps_continued:
      6. execute_disaster_recovery_plan(disaster-recovery/dr-plan.md)
      7. preserve_ransom_note_and_malware_samples
      8. engage_external_IR_if_authorized(T4)
      9. board_notification(T4_initiates)
      
  PB-SOC-008:
    name: "Insider Threat Behavioral Investigation"
    trigger_alerts: [INSIDER_THREAT_BEHAVIORAL, UNUSUAL_DATA_ACCESS, PRIVILEGE_ABUSE_SUSPECTED]
    human_gate_BEFORE_ANY_ACTION:
      decision: "Authorized to proceed with insider investigation?"
      authority: T4 + Legal Org + HR representative
      SLA: 2 hours
      rationale: insider investigations have significant HR and legal implications
    automated_steps_after_gate:
      1. preserve_evidence_silently(agent_id)    # non-alerting evidence collection
      2. audit_data_access(agent_id, window=90_days)
      3. identify_exfiltration_vectors(agent_id)
      4. behavioral_baseline_comparison(agent_id)
    human_gate_B:
      decision: "Suspend agent access pending investigation?"
      authority: T4 + Legal Org
      SLA: 4 hours from gate A
```

---

## Playbook Execution Engine

```
execute_playbook(playbook_id, alert_id, context):

  playbook = load_playbook(playbook_id)
  execution = PlaybookExecution {
    execution_id: PBX-{NNN},
    playbook_id, alert_id,
    started_at: now(),
    status: RUNNING
  }
  
  for step in playbook.steps:
    if step.type == AUTOMATED:
      try:
        result = execute_action(step.action, context)
        execution.log_step(step, result, status=COMPLETED)
      except ActionError as e:
        execution.log_step(step, error=e, status=FAILED)
        if step.on_failure == HALT: break
        elif step.on_failure == SKIP: continue
        elif step.on_failure == ESCALATE:
          escalate_to_human(execution, step, e)
          break
          
    elif step.type == HUMAN_GATE:
      gate_request = create_gate_request(
        execution_id=execution.execution_id,
        decision_required=step.decision,
        authority=step.authority,
        sla=step.SLA,
        context=build_gate_context(execution, context)
      )
      
      gate_response = await_human_decision(gate_request)  # blocking; pauses playbook
      
      if gate_response.decision == APPROVE:
        execution.log_gate(step, gate_response, status=APPROVED)
      elif gate_response.decision == REJECT:
        execution.log_gate(step, gate_response, status=REJECTED)
        execution.status = CANCELLED_AT_GATE
        break
      elif gate_response.timeout:
        escalate_gate_timeout(gate_request, step.authority)
        break
        
  execution.completed_at = now()
  execution.status = COMPLETED if no_halt else PARTIAL
  
  log_execution(execution)
  Return: execution
```

---

## Integration

```
Feeds into:
  incident-response-orchestrator.md — PB-SOC-007 and PB-SOC-008 hand off to full IR
  forensic-evidence-collector.md — evidence collection steps call this system
  containment-engine.md — isolation and blocking actions executed here

Receives from:
  security-operations-center.md — playbook assignment decided here
  security-alert-manager.md — alert metadata provides playbook context
  threat-intelligence-platform.md — IOC and actor context enriches playbook decisions
```

---

## Governance

**Human gates for high-consequence actions:** Domain isolation, agent quarantine, external reporting, and insider investigation always have human gates with appropriate authority  
**Constitutional playbook (PB-SOC-005):** Steps 6 (constitutional quorum report) and gate A are non-bypassable; no automation skips constitutional quorum notification for proximity > 0.85  
**Playbook immutability:** Playbook definitions are version-controlled; deployed playbook version is recorded in every execution; changes require T3 approval  
**Insider threat gate:** PB-SOC-008 requires human gate BEFORE any investigation action — no automated evidence gathering without T4 + Legal Org + HR authorization  
**Audit:** All playbook executions (including gates and decisions) to `memory/security-operations/playbook-executions.jsonl`; 7-year retention
