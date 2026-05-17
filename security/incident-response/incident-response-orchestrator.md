# Incident Response Orchestrator
**ID:** IRS-IRO-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Coordinates the end-to-end response to confirmed security incidents — from declaration through containment, eradication, recovery, and post-incident analysis — ensuring structured, legally defensible, sovereignty-aware incident handling. The Incident Response Orchestrator is the command layer for security incidents: it assigns roles, drives the PICERL lifecycle (Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned), enforces legal review requirements for regulatory notification, and ensures every incident produces organizational learning.

---

## Incident Classification

```yaml
incident_classification:

  severity_levels:
    CRITICAL:
      description: Active breach; ransomware; constitutional boundary violation; data exfiltration confirmed; supply chain compromise active
      IR_team_size: minimum 5 (IR lead T3, 2× T2 analysts, Legal Org, T4 CISO notified)
      response_SLA:
        containment: < 1 hour from declaration
        T4_notification: < 15 minutes from declaration
        legal_notification: < 30 minutes from declaration
        regulatory_assessment: < 2 hours from declaration
        
    HIGH:
      description: Suspected breach; advanced persistent threat activity; insider threat confirmed; AI system integrity compromise
      IR_team_size: minimum 3 (IR lead T3, T2 analyst, Legal Org on standby)
      response_SLA:
        containment: < 4 hours from declaration
        T4_notification: < 1 hour from declaration
        
    MEDIUM:
      description: Confirmed malware without active spread; credential compromise contained; policy violation with data exposure
      IR_team_size: 2 (T2 analyst + T1 support)
      response_SLA:
        containment: < 24 hours
        
    LOW:
      description: Attempted intrusion blocked; suspicious activity no breach; single policy violation
      IR_team_size: 1 (T1 analyst)
      response_SLA:
        resolution: < 72 hours
        
  incident_types:
    DATA_BREACH: personal data or confidential data exfiltrated or accessed without authorization
    RANSOMWARE: data encrypted; extortion demanded
    AI_SYSTEM_COMPROMISE: model integrity violation; backdoor; adversarial attack success
    CONSTITUTIONAL_VIOLATION: agent reached or crossed constitutional boundary
    INSIDER_THREAT_CONFIRMED: insider threat investigation concludes with confirmed malicious activity
    SUPPLY_CHAIN_COMPROMISE: compromised dependency, model, or connector confirmed in production
    CROSS_BORDER_DATA_LEAK: data transferred across jurisdictions without lawful basis
    INFRASTRUCTURE_COMPROMISE: SEZ breach; network infrastructure compromise
    COORDINATED_ATTACK: multi-agent or multi-vector attack campaign confirmed
```

---

## Incident Lifecycle (PICERL)

```
DECLARED → CONTAINED → ERADICATED → RECOVERED → CLOSED (with post-incident analysis)

DECLARED:
  trigger:
    - CRITICAL correlation rule fires (COR-004, COR-005, COR-006, COR-008, COR-009, COR-010)
    - T2 analyst manually declares after investigation
    - T3/T4 declares on external notification (law enforcement, partner, regulator)
    - Auto-declaration for: ransomware behavioral pattern; model integrity violation;
      constitutional proximity > 0.85 confirmed
  actions:
    - create incident_record (INC-{NNN})
    - assign IR lead (T3 for CRITICAL/HIGH; T2 for MEDIUM/LOW)
    - notify T4 CISO (CRITICAL: < 15min; HIGH: < 1hr)
    - notify Legal Org (CRITICAL: < 30min; HIGH: < 1hr; all data breach types immediately)
    - open war room (CRITICAL incidents)
    - start regulatory notification assessment clock

CONTAINED:
  objective: stop active threat from spreading or causing additional harm
  actions (from containment-engine.md):
    - isolate affected agents/systems
    - block attack vectors (network, credential, injection)
    - preserve evidence simultaneously with containment
    - validate containment (no ongoing malicious activity from contained scope)
  evidence_requirement: containment actions logged with timestamps + justification
  authority:
    - T2 can authorize network isolation, credential revocation, agent quarantine
    - T4 required for: external system disconnection, mass agent quarantine (>10), public statement

ERADICATED:
  objective: remove threat from all affected systems; validate clean state
  actions:
    - malware removal / model reload from clean hash
    - compromised credential rotation
    - patch vulnerabilities exploited in attack
    - verify no persistence mechanisms remain
  validation: clean scan across all previously affected systems; T3 sign-off

RECOVERED:
  objective: restore services safely; maintain enhanced monitoring
  actions:
    - restore from clean backup/snapshot (via recovery-coordinator.md)
    - phased service restoration (start at 10%; scale if metrics clean)
    - enhanced monitoring: 30-day post-incident period
    - notify affected parties (internal; regulatory if required; customers if required)
  authority:
    - service restoration: T2 IR lead
    - customer notification: T4 + Legal Org + Communications team
    - regulatory notification: Legal Org primary; T4 sign-off

CLOSED:
  trigger: all recovery steps complete; enhanced monitoring baseline established
  required:
    - post_incident_analysis completed (post-incident-analysis.md)
    - all evidence packages preserved (forensic-evidence-collector.md)
    - regulatory notifications filed if required
    - lessons learned → detection-engineering.md + wiki/security/
  audit: incident record permanently retained
```

---

## Incident Record Schema

```yaml
incident_record:
  incident_id: INC-{NNN}
  declared_at: ISO8601
  declared_by: string
  
  classification:
    severity: CRITICAL | HIGH | MEDIUM | LOW
    incident_type: string
    ai_specific: boolean
    constitutional_adjacent: boolean
    
  scope:
    affected_agents: [string]
    affected_jurisdictions: [JUR-{XX}]
    affected_data_classes: [string]
    estimated_data_subjects_affected: integer | null
    cross_entity: boolean
    
  regulatory:
    gdpr_applicable: boolean
    notification_required: boolean
    notification_deadline: ISO8601 | null    # 72hr from awareness for GDPR
    notification_status: NOT_REQUIRED | PENDING | FILED | OVERDUE
    dpa_notified_at: ISO8601 | null
    affected_dpa: string | null
    
  team:
    ir_lead: string
    ir_members: [string]
    legal_counsel: string | null
    external_ir_firm: string | null
    
  timeline:
    declared_at: ISO8601
    contained_at: ISO8601 | null
    eradicated_at: ISO8601 | null
    recovered_at: ISO8601 | null
    closed_at: ISO8601 | null
    
  sla_status:
    containment_sla: ON_TIME | AT_RISK | BREACHED
    notification_sla: ON_TIME | AT_RISK | BREACHED | NOT_APPLICABLE
    
  linked_artifacts:
    alert_ids: [ALT-{NNN}]
    playbook_execution_ids: [PBX-{NNN}]
    evidence_package_ids: [EVD-{NNN}]
    post_incident_analysis_id: PIA-{NNN} | null
    
  integrity:
    entry_hash: sha256
    chain_hash: sha256    # links to previous incident record entry
```

---

## Regulatory Notification Workflow

```
assess_regulatory_notification(incident_id):

  incident = load_incident(incident_id)
  
  # GDPR / DPDP / PIPL assessment
  if incident.scope.affected_data_classes INTERSECTS personal_data_classes:
    if incident.scope.affected_jurisdictions CONTAINS JUR-EU:
      # GDPR Art.33: 72hr to supervisory authority
      gdpr_clock = start_clock(deadline=incident.declared_at + 72hr)
      require_legal_review_by = incident.declared_at + 2hr
      notify_dpo(incident_id, JUR-EU)
      
    if incident.scope.affected_jurisdictions CONTAINS JUR-CN:
      # PIPL: 10 working days to CAC
      pipl_clock = start_clock(deadline=working_days_from(incident.declared_at, 10))
      notify_dpo(incident_id, JUR-CN)
      
    if incident.scope.affected_jurisdictions CONTAINS JUR-US:
      # HIPAA: 60 days; FTC: case-by-case; State AGs: vary
      assess_us_notification_requirements(incident_id)
      
  # NIS2 assessment (EU critical infrastructure)
  if incident.severity == CRITICAL AND JUR-EU IN incident.scope.affected_jurisdictions:
    # NIS2: 24hr early warning; 72hr incident notification; 1 month final report
    nis2_early_warning_deadline = incident.declared_at + 24hr
    alert_legal_nis2(incident_id, nis2_early_warning_deadline)
    
  # Constitutional incident: no regulatory notification without T4 + constitutional quorum review
  if incident.classification.constitutional_adjacent:
    require_quorum_review_before_any_external_disclosure(incident_id)
    
  Return: notification_plan (deadlines, authorities, required approvals)
```

---

## Cross-Entity Incident Coordination

```yaml
cross_entity_coordination:

  trigger: incident.cross_entity == true
  
  coordination_steps:
    1. notify_affected_entity_soc_leads(incident_id, affected_entities)
    2. establish_shared_war_room(incident_id)  # entity-sovereignty-aware; no raw data crossing
    3. coordinate_containment_actions_across_entities(incident_id)
    4. synchronize_regulatory_notification_timelines(incident_id)
    5. share_iocs_and_attack_patterns(incident_id)  # TLP:AMBER; entity consent required
    
  sovereignty_constraints:
    data_sharing: only anonymized indicators; raw evidence stays in entity jurisdiction
    legal_matters: each entity files its own regulatory notifications
    cn_entity: CN SOC coordinates separately; no raw data to other entities
    
  coordination_record:
    entry_id: CEC-{NNN}
    entities_involved: [string]
    coordination_actions: [string]
    data_shared: [string]    # what was shared; TLP level; entity consent recorded
```

---

## Integration

```
Feeds into:
  post-incident-analysis.md — every closed incident triggers PIR
  forensic-evidence-collector.md — evidence preservation requests
  containment-engine.md — containment action execution
  recovery-coordinator.md — recovery orchestration
  detection-engineering.md — new detection hypotheses from incidents

Receives from:
  security-alert-manager.md — CRITICAL alerts create incident declarations
  security-event-correlator.md — CRITICAL correlation rules trigger auto-declaration
  soc-playbook-engine.md — PB-SOC-007/008 hand off to full IR
  threat-intelligence-platform.md — threat context enriches incident scope
  adaptive-compliance/compliance-engine.md — regulatory notification requirements
```

---

## Governance

**T4 notification is non-negotiable for CRITICAL:** Any CRITICAL incident without T4 notification within 15 minutes triggers automatic escalation to T5 + board  
**Legal review before external disclosure:** No statement to regulator, press, customer, or partner proceeds without Legal Org review + T4 sign-off  
**GDPR 72-hour clock:** System tracks the clock automatically; at 48hr with notification pending → T4 urgency escalation; at 60hr → board notification  
**Constitutional incidents:** Any incident with constitutional_adjacent flag requires constitutional quorum review before any external disclosure  
**Evidence chain integrity:** All incident actions cryptographically timestamped; audit trail must be legally defensible; no modifications to closed incident records  
**Audit:** All incident lifecycle events to `memory/incident-response/incident-audit.jsonl`; permanent retention
