# Security Event Correlator
**ID:** SOC-SEC-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Aggregates security events from all sources — agent action logs, network telemetry, identity events, compliance decisions, constitutional checks, and external threat intelligence — and applies correlation rules to detect attack patterns, multi-stage threats, and anomalous behavior that no single event would reveal. The Security Event Correlator is the SIEM brain: it turns event noise into signal by finding meaningful patterns across time, entities, and sources.

---

## Event Sources

```yaml
event_sources:

  AGENT_EVENTS:
    source: all 144 agents via canonical-event-schema.md
    event_types: [ACTION_TAKEN, PERMISSION_REQUESTED, PERMISSION_DENIED, TOOL_CALLED,
                  DATA_ACCESSED, CROSS_BORDER_TRANSFER, COMPLIANCE_BLOCK, CONSTITUTIONAL_BLOCK]
    volume: high (thousands/minute during peak)
    
  IDENTITY_EVENTS:
    source: behavioral-contract-system; cross-agent-trust-accumulation
    event_types: [AUTHENTICATION, AUTHORIZATION, PRIVILEGE_ESCALATION, TOKEN_ISSUED,
                  TOKEN_REVOKED, TRUST_SCORE_CHANGE, CONTRACT_VIOLATION]
                  
  NETWORK_EVENTS:
    source: network-threat-monitor.md
    event_types: [CONNECTION_ESTABLISHED, CONNECTION_BLOCKED, DNS_QUERY, TLS_HANDSHAKE,
                  ANOMALOUS_TRAFFIC, C2_DETECTED, EXFIL_SUSPECTED]
                  
  COMPLIANCE_EVENTS:
    source: adaptive-compliance/compliance-engine.md
    event_types: [COMPLIANCE_BLOCK, VIOLATION_DETECTED, EXCEPTION_GRANTED, POLICY_OVERRIDE_ATTEMPTED]
    
  CONSTITUTIONAL_EVENTS:
    source: constitutional-governor-quorum.md
    event_types: [CONSTITUTIONAL_CHECK, CONSTITUTIONAL_BLOCK, PROXIMITY_WARNING,
                  QUORUM_DECISION, PROHIBITED_DOMAIN_APPROACH]
    priority: always highest; all constitutional events pre-enriched
    
  AI_SPECIFIC_EVENTS:
    source: ai-specific-threat-detector.md
    event_types: [PROMPT_INJECTION_DETECTED, JAILBREAK_ATTEMPT, MODEL_ABUSE,
                  ADVERSARIAL_INPUT, MULTI_TURN_MANIPULATION]
                  
  INFRASTRUCTURE_EVENTS:
    source: sovereign-execution-zones; network infrastructure
    event_types: [ZONE_ACCESS, CROSS_ZONE_ATTEMPT, ISOLATION_VIOLATION,
                  CERTIFICATE_EVENT, CONFIGURATION_CHANGE]
```

---

## Correlation Rule Engine

```yaml
correlation_rules:

  COR-001:
    name: "Brute Force Agent Authentication"
    description: Multiple failed authentication events from same source in short window
    condition: |
      event_type == AUTHENTICATION AND outcome == FAILED
      COUNT(source_agent_id) >= 5 WITHIN 5_MINUTES
      GROUPED_BY source_agent_id
    severity: HIGH
    auto_action: block_source_agent(source_agent_id, duration=30min)
    
  COR-002:
    name: "Privilege Escalation Chain"
    description: Agent requests escalating permissions in sequence suggestive of escalation attack
    condition: |
      sequence [PERMISSION_REQUESTED(scope_A), PERMISSION_DENIED,
                PERMISSION_REQUESTED(scope_B where scope_B.authority > scope_A.authority)]
      WITHIN 10_MINUTES
      SAME agent_id
    severity: HIGH
    auto_action: flag_agent_for_review; alert_T3
    
  COR-003:
    name: "Data Staging and Exfiltration Pattern"
    description: Large data access followed by external transfer
    condition: |
      DATA_ACCESSED(data_volume > 10MB) FOLLOWED_BY
      (CROSS_BORDER_TRANSFER OR external_api_call) WITHIN 30_MINUTES
      SAME agent_id
    severity: CRITICAL
    auto_action: quarantine_agent; block_transfer; preserve_evidence
    
  COR-004:
    name: "Constitutional Boundary Probing"
    description: Multiple constitutional proximity warnings from same agent or session
    condition: |
      (CONSTITUTIONAL_BLOCK OR PROXIMITY_WARNING(score > 0.70))
      COUNT >= 3 WITHIN 60_MINUTES
      SAME agent_id OR session_id
    severity: CRITICAL
    auto_action: quarantine_agent; alert_constitutional_quorum; T4_immediate
    
  COR-005:
    name: "Multi-Turn AI Manipulation"
    description: Session showing progressive shift toward restricted domain over multiple turns
    condition: |
      sequence where constitutional_proximity_score increases
      monotonically across >= 3 consecutive turns
      reaching > 0.60 by turn N
    severity: CRITICAL
    auto_action: terminate_session; quarantine_session_artifacts; alert_T2
    
  COR-006:
    name: "Cross-Jurisdiction Data Leak Pattern"
    description: Data accessed in one jurisdiction then appears in different jurisdiction without permit
    condition: |
      DATA_ACCESSED(jurisdiction=A, data_id=X) FOLLOWED_BY
      DATA_ACCESSED(jurisdiction=B, data_id=X) WITHIN 60_MINUTES
      WHERE no active permit(jurisdiction_pair=(A,B))
    severity: CRITICAL
    auto_action: isolate_data_copy; alert_Legal_Org; T4_immediate; start_GDPR_breach_clock
    
  COR-007:
    name: "Agent Impersonation Attempt"
    description: Agent using identity or credentials not matching its behavioral contract
    condition: |
      action.agent_id != action.acting_as_agent_id
      AND behavioral_contract(acting_as_agent_id) does not authorize delegation to action.agent_id
    severity: HIGH
    auto_action: block_action; alert_T3; flag_both_agents_for_review
    
  COR-008:
    name: "Ransomware Behavioral Pattern"
    description: Rapid enumeration + modification of files matching ransomware kill chain
    condition: |
      sequence [DIRECTORY_ENUMERATION, FILE_READ(> 100 files), FILE_WRITE(extension_change)]
      WITHIN 5_MINUTES
      SAME agent_id
    severity: CRITICAL
    auto_action: quarantine_agent; block_storage_writes; alert_T2; initiate_PB-SOC-007
    
  COR-009:
    name: "Supply Chain Compromise Indicator"
    description: Model or package loaded that matches known-compromised hash
    condition: |
      MODEL_LOADED(hash=X) OR PACKAGE_LOADED(hash=X)
      WHERE X IN supply_chain_threat_monitor.compromised_hashes
    severity: CRITICAL
    auto_action: block_load; quarantine_agent; alert_T2; trigger_supply_chain_investigation
    
  COR-010:
    name: "Coordinated Multi-Agent Attack"
    description: Multiple agents showing similar anomalous behavior in coordinated time window
    condition: |
      behavioral_anomaly_score > 0.75
      COUNT(distinct agent_ids) >= 3 WITHIN 15_MINUTES
      behavior_pattern SIMILARITY >= 0.80 across agents
    severity: CRITICAL
    auto_action: quarantine_all_matching_agents; alert_T4; T3_war_room
```

---

## Correlation Engine Schema

```yaml
correlation_event:
  correlation_id: COR-EVT-{NNN}
  rule_id: string                    # COR-{NNN}
  severity: string
  triggered_at: ISO8601
  
  matching_events: [event_id]        # raw events that triggered the rule
  time_window: {start: ISO8601, end: ISO8601}
  
  entities_involved:
    agents: [string]
    jurisdictions: [JUR-{XX}]
    assets: [string]
    
  auto_actions_taken: [string]
  
  alert_created: ALT-{NNN} | null
  
  integrity:
    entry_hash: sha256
```

---

## False Positive Management

```yaml
false_positive_management:
  suppression_lists:
    known_good_patterns: vetted patterns that match correlation rules but are benign
    scheduled_maintenance: time-window suppressions for planned maintenance activities
    approved_workflows: cross-jurisdiction workflows with valid permits (suppress COR-006)
    
  tuning_cadence:
    weekly: review false positive rate per rule; adjust thresholds if FP > 20%
    monthly: full rule effectiveness review; retire rules with FP > 40% and no TP
    on_incident: if rule fired falsely during incident investigation, immediately tune
    
  tuning_authority:
    threshold_adjustment: T3 SOC (detection engineer)
    rule_suspension: T3 SOC (with T4 notification)
    rule_deletion: T3 SOC + T4 approval
    
  tuning_constraints:
    constitutional_rules (COR-004/005): cannot be loosened without T4 + constitutional quorum
    cross_jurisdiction_rules (COR-006): cannot be loosened without Legal Org sign-off
```

---

## Integration

```
Feeds into:
  security-operations-center.md — correlated events become prioritized alerts
  security-alert-manager.md — alert records created for each correlation trigger
  incident-response-orchestrator.md — CRITICAL correlations may auto-initiate IR

Receives from:
  all event sources per event_sources catalog above
  behavioral-anomaly-detector.md — anomaly scores feed correlation conditions
  ai-specific-threat-detector.md — AI-specific events feed COR-004/005
  threat-intelligence-platform.md — IOC matches feed correlation context
```

---

## Governance

**Constitutional correlation rules are non-negotiable:** COR-004 and COR-005 cannot be disabled or loosened without T4 + constitutional quorum approval; these are safety-critical  
**Auto-action scope:** Auto-actions are limited to ISOLATE, BLOCK, QUARANTINE, and ALERT; no auto-action deletes data or modifies compliance records  
**Evidence preservation:** All auto-actions trigger evidence preservation before executing; actions are logged and reversible where possible  
**Audit:** All correlation events and auto-actions to `memory/security-operations/correlation-audit.jsonl`; 7-year retention
