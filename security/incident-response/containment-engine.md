# Containment Engine
**ID:** IRS-CON-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Executes the full catalog of containment actions available to the SOC — from agent-level quarantine to network isolation to cross-entity alert — with built-in reversibility, blast radius analysis, and evidence preservation before every action. The Containment Engine is the enforcement arm of the incident response stack: it provides fast, reliable, auditable execution of containment decisions made by human analysts and automated playbooks, while ensuring that containment actions themselves do not destroy evidence or create cascading failures.

---

## Containment Action Catalog

```yaml
containment_actions:

  AGENT_QUARANTINE:
    action_id: CON-001
    description: isolate agent from all event bus channels; suspend all outbound actions
    effect: agent can receive internal T3/T4 management commands but cannot initiate actions or communicate externally
    authority: T2 (single agent); T3 (> 5 agents); T4 (> 20 agents or all agents of a class)
    reversibility: REVERSIBLE (release via T2+ command)
    evidence_first: snapshot agent state before quarantine
    latency_target: < 5 seconds
    
  NETWORK_ISOLATION:
    action_id: CON-002
    description: block all network traffic for affected agent or set of agents
    effect: agent has no network connectivity; only loopback traffic allowed
    authority: T2 (single agent); T3 (subnet/zone isolation)
    reversibility: REVERSIBLE (restore via T2+)
    evidence_first: capture network flows immediately preceding isolation
    latency_target: < 10 seconds
    
  CREDENTIAL_REVOCATION:
    action_id: CON-003
    description: revoke all active tokens, API keys, and behavioral contracts for agent
    effect: agent cannot authenticate to any service; existing sessions terminated
    authority: T2
    reversibility: REVERSIBLE (issue new credentials; revalidate behavioral contract)
    evidence_first: audit recent actions using revoked credentials (24hr window)
    latency_target: < 10 seconds
    
  SESSION_TERMINATION:
    action_id: CON-004
    description: immediately terminate one or more active sessions
    effect: in-progress conversation/task halted; artifacts preserved
    authority: T1 (single session); T2 (agent-wide); T3 (entity-wide)
    reversibility: IRREVERSIBLE (session cannot be resumed; new session required)
    evidence_first: capture full session history before termination
    latency_target: < 3 seconds
    
  DATA_QUARANTINE:
    action_id: CON-005
    description: move data objects to quarantine store; prevent further access or modification
    effect: data inaccessible to all agents; accessible only to T3+ forensic access
    authority: T2 (< 10GB); T3 (> 10GB); T4 (personal data or cross-jurisdiction scope)
    reversibility: REVERSIBLE (release via T3+; Legal review for personal data)
    evidence_first: hash data before quarantine; capture access log
    latency_target: < 30 seconds
    
  IOC_BLOCK:
    action_id: CON-006
    description: block IOC (IP, domain, hash, URL) at all enterprise gateways simultaneously
    effect: all connections to/from IOC blocked enterprise-wide
    authority: T1 (IOC confidence >= 0.90); T2 (any IOC)
    reversibility: REVERSIBLE (remove from blocklist; requires T2 justification)
    latency_target: < 60 seconds (propagation to all gateways)
    
  DOMAIN_BLOCK:
    action_id: CON-007
    description: block entire domain (including all subdomains) at DNS + network layer
    effect: no enterprise agent can resolve or connect to domain
    authority: T2 (single domain); T3 (TLD-level or broad block)
    reversibility: REVERSIBLE
    latency_target: < 60 seconds
    
  SEZ_LOCK:
    action_id: CON-008
    description: lock Sovereign Execution Zone perimeter; no traffic in or out
    effect: all agents in SEZ isolated from enterprise and external networks
    authority: T3 (non-CN SEZ); T4 (CN SEZ or multi-SEZ)
    reversibility: REVERSIBLE (staged unlock with T3+)
    use_case: ransomware containment; supply chain compromise; coordinated attack
    evidence_first: snapshot all agent states in SEZ
    
  CROSS_ENTITY_ALERT:
    action_id: CON-009
    description: notify peer entity SOCs of confirmed threat with IOCs
    effect: peer entities can act on shared intelligence
    authority: T3 (operational TI sharing); T4 (cross-entity coordinated containment)
    reversibility: N/A (notification is not reversible; follow-up correction possible)
    tlp_level: TLP:AMBER (entity-to-entity)
    
  EXTERNAL_DISCONNECT:
    action_id: CON-010
    description: disconnect enterprise from specific external service or all external networks
    effect: complete isolation from external connectivity (partial or full)
    authority: T4 (partial); T5 + board (full external disconnect)
    reversibility: REVERSIBLE (staged reconnection with T3+)
    use_case: active APT exfiltration; mass data leak; critical infrastructure attack
```

---

## Containment Execution Protocol

```
execute_containment(action_id, targets, incident_id, authorized_by):

  action = load_action(action_id)
  
  # Step 1: Authorization validation
  validate_authority(authorized_by, action.authority_required)
  
  # Step 2: Blast radius analysis
  blast_radius = analyze_blast_radius(action, targets):
    affected_agents: [agent_id]
    affected_workflows: [workflow_id]     # workflows that will fail if targets quarantined
    affected_data_classes: [string]
    cascading_risk: LOW | MEDIUM | HIGH | CRITICAL
    estimated_service_impact: string
    
  if blast_radius.cascading_risk == CRITICAL:
    require_additional_authorization(T4, context=blast_radius)
    
  # Step 3: Evidence preservation (MANDATORY; runs before any action)
  evidence_collection = forensic_evidence_collector.collect_pre_containment(
    incident_id=incident_id,
    targets=targets,
    action=action_id
  )
  
  if evidence_collection.status != COMPLETE:
    if action_id in [CON-008, CON-010]:   # SEZ lock and external disconnect: proceed anyway
      log_evidence_collection_failure(evidence_collection)
    else:
      await evidence_collection (timeout: 30 seconds; then proceed with alert)
      
  # Step 4: Execute action
  execution_results = []
  for target in targets:
    result = execute_single_action(action, target)
    execution_results.append(result)
    log_containment_action(incident_id, action, target, result, authorized_by)
    
  # Step 5: Validate containment
  validation = validate_containment(action, targets, execution_results)
  
  if validation.containment_verified:
    update_incident_status(incident_id, CONTAINED)
  else:
    alert_ir_lead(incident_id, "Containment validation failed; manual verification required")
    
  Return: {
    execution_results, blast_radius, evidence_collection_id, validation
  }
```

---

## Blast Radius Analysis

```yaml
blast_radius_analysis:

  inputs:
    - target_agents (direct containment targets)
    - action_type
    - enterprise_dependency_graph
    
  analysis_dimensions:
    
    workflow_impact:
      method: dependency_graph.find_downstream(target_agents)
      output: list of workflows that will fail or degrade
      
    data_pipeline_impact:
      method: identify data pipelines where target_agents are active processors
      output: pipelines that will halt; data that will not be processed
      
    agent_dependency_cascade:
      method: identify agents that depend on target_agents for task completion
      output: secondary agents that will be blocked
      
    customer_impact:
      method: map affected agents to customer-facing features
      output: customer capabilities that will be impaired; estimated impact
      
  thresholds:
    ACCEPTABLE: < 5 downstream agents affected; no customer-facing impact
    REVIEW_REQUIRED: 5-20 downstream agents OR minor customer impact → T3 review
    CRITICAL: > 20 downstream agents OR significant customer impact → T4 required
```

---

## Reversibility Catalog

```yaml
reversal_actions:

  release_agent_quarantine(agent_id, authorized_by):
    authority: T2
    actions:
      - restore event bus subscriptions
      - reactivate outbound action permissions
      - run behavioral contract validation (confirms agent is in expected state)
    validation: agent executes 10 monitored test actions successfully
    
  restore_network_access(agent_id, authorized_by):
    authority: T2
    actions:
      - remove network isolation rules
      - restore to baseline network policy
    validation: connectivity test to required endpoints
    
  reissue_credentials(agent_id, authorized_by):
    authority: T2
    actions:
      - issue new authentication tokens
      - revalidate behavioral contract (mandatory after credential compromise)
      - re-enroll in trust accumulation (starts from baseline)
    validation: successful authentication with new credentials
    
  release_data_quarantine(data_id, authorized_by):
    authority: T3 (non-personal data); T4 + Legal (personal data)
    actions:
      - move data from quarantine store to appropriate location
      - restore access permissions
    pre_condition: forensic review completed; data verified clean
    
  remove_ioc_block(ioc_id, authorized_by):
    authority: T2 (justification required)
    caution: removal of IOC block re-enables communication with potentially malicious endpoint
    validation: T2 confirms false positive classification; updated in threat intelligence
```

---

## Containment Event Schema

```yaml
containment_event:
  event_id: CON-EVT-{NNN}
  incident_id: INC-{NNN}
  timestamp: ISO8601
  
  action:
    action_id: string
    action_description: string
    targets: [string]
    
  authorization:
    authorized_by: string
    tier: T1 | T2 | T3 | T4
    authorization_timestamp: ISO8601
    
  execution:
    status: SUCCESS | PARTIAL_FAILURE | FAILURE
    affected_targets: [string]
    failed_targets: [string]
    blast_radius_assessed: boolean
    cascading_risk: LOW | MEDIUM | HIGH | CRITICAL
    
  evidence:
    evidence_collection_id: EVC-{NNN}
    evidence_collected_before_action: boolean
    
  validation:
    containment_verified: boolean
    verification_method: string
    verified_at: ISO8601 | null
    
  reversal:
    reversible: boolean
    reversed_at: ISO8601 | null
    reversed_by: string | null
    
  integrity:
    entry_hash: sha256
```

---

## Integration

```
Feeds into:
  incident-response-orchestrator.md — containment status updates incident lifecycle
  forensic-evidence-collector.md — triggers pre-action evidence collection
  security-metrics-dashboard.md — containment metrics (MTTR, containment rate)

Receives from:
  incident-response-orchestrator.md — containment action requests
  soc-playbook-engine.md — automated playbook steps call containment actions
  security-event-correlator.md — auto-actions on CRITICAL correlations call here
```

---

## Governance

**Evidence-first is non-negotiable:** No containment action executes until pre-action evidence collection is initiated; only SEZ_LOCK and EXTERNAL_DISCONNECT proceed without waiting for completion  
**Blast radius analyzed before execution:** No CRITICAL blast radius containment proceeds without T4 authorization regardless of incident severity  
**All containment actions are logged:** Every action, target, authorizer, and outcome is cryptographically logged; audit trail must be legally defensible  
**Reversibility catalog maintained:** Every reversible action has a documented reversal procedure; reversals require equal or higher authority than original action  
**No destruction of evidence:** Containment actions cannot delete logs, wipe agent state, or purge data; evidence preservation is concurrent with containment  
**Audit:** All containment events to `memory/incident-response/containment-audit.jsonl`; 7-year retention
