# Insider Threat Detector
**ID:** TDT-ITD-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Detects behavioral indicators of insider threat activity — including malicious insiders, compromised legitimate agents, and negligent behavior that creates systemic risk — using longitudinal behavioral analysis, peer comparison, and risk factor accumulation. The Insider Threat Detector operates under strict human oversight requirements: it produces risk scores and evidence packages for human review but initiates no enforcement actions without explicit T4 + Legal Org + HR authorization, consistent with PB-SOC-008.

---

## Insider Threat Risk Model

```yaml
insider_threat_risk_model:

  risk_categories:
    
    MALICIOUS_INSIDER:
      description: agent deliberately acting against enterprise interests
      indicators:
        - data exfiltration pattern (staging + transfer)
        - sabotage pattern (deletion + modification of critical records)
        - unauthorized privilege accumulation
        - cover track behavior (log deletion, evidence modification)
        - contact with known threat actor infrastructure
        
    COMPROMISED_INSIDER:
      description: legitimate agent whose credentials or behavior are controlled by adversary
      indicators:
        - impossible temporal behavior (simultaneous actions across geographies)
        - behavior shift coinciding with known external threat event
        - credential use outside established behavioral baseline
        - sudden escalation of permissions inconsistent with role history
        
    NEGLIGENT_INSIDER:
      description: agent creating risk through careless or policy-ignorant behavior
      indicators:
        - repeated policy violations (same policy; > 3 times in 90 days)
        - sensitive data in unauthorized storage
        - sharing credentials or behavioral contracts
        - bypassing established workflows with high-risk shortcuts
        
    COLLUDING_INSIDERS:
      description: coordinated action between multiple agents against enterprise
      indicators:
        - synchronized anomalous behavior across peer agents
        - data fragmentation + reassembly across multiple agents
        - mutual permission escalation (agent A escalates B; B escalates A)
```

---

## Risk Scoring Engine

```
compute_insider_threat_score(agent_id):

  # Component scores (0.0–1.0 each)
  
  behavioral_drift = behavioral_anomaly_detector.get_score(agent_id)
  # Sustained behavioral drift from baseline
  
  data_access_risk = score_data_access_risk(agent_id):
    # Volume above baseline * sensitivity weight
    # Access to data outside normal workflow scope
    # Cross-jurisdiction access without established permit pattern
  
  privilege_risk = score_privilege_risk(agent_id):
    # Privilege escalation attempts
    # Access to resources not needed for stated function
    # Use of emergency/override mechanisms frequency
    
  policy_violation_history = score_policy_violations(agent_id, window=90_days):
    # CRITICAL violation: 0.80; HIGH: 0.50; MEDIUM: 0.20; LOW: 0.05
    # Multiple violations same policy: multiplier 1.5×
    
  peer_deviation = score_peer_deviation(agent_id):
    # Compare agent behavior to peer group (same role + jurisdiction)
    # Outlier detection: Mahalanobis distance > 3σ = high risk
    
  temporal_anomaly = score_temporal_anomaly(agent_id):
    # Activity outside established hours
    # Impossible geographic/zone concurrency
    
  external_contact_risk = score_external_contact_risk(agent_id):
    # Contact with IPs/domains in threat intelligence (IOC match)
    # Abnormal volume of outbound encrypted traffic
    
  # Weighted composite
  composite_score = (
    behavioral_drift         * 0.25 +
    data_access_risk         * 0.25 +
    privilege_risk           * 0.15 +
    policy_violation_history * 0.15 +
    peer_deviation           * 0.10 +
    temporal_anomaly         * 0.05 +
    external_contact_risk    * 0.05
  )
  
  # Override conditions
  if any_CRITICAL_sabotage_indicator: composite_score = max(composite_score, 0.90)
  if confirmed_c2_contact: composite_score = max(composite_score, 0.95)
  
  Return: composite_score, component_scores, contributing_indicators
```

---

## Risk Thresholds and Actions

```yaml
risk_thresholds:

  WATCH (score 0.30–0.49):
    action: log to insider_threat_store; contribute to longitudinal tracking
    escalation: none autonomous; reviewed in weekly insider threat report
    retention: 90 days
    
  ELEVATED (score 0.50–0.69):
    action: create insider_threat_record; notify T3 SOC lead (not agent)
    enhanced_monitoring: increase telemetry sampling rate for agent (silent)
    human_decision: T3 decides whether to escalate to T4+Legal+HR
    notification_constraint: agent NOT notified; HR NOT notified without T4 gate
    
  HIGH (score 0.70–0.84):
    action: create insider_threat_alert → security-alert-manager (T2 minimum)
    escalation: T3 SOC lead immediately briefed
    human_gate: mandatory T4 + Legal Org decision before any investigation action
    playbook: PB-SOC-008 triggered (requires human gate before all actions)
    
  CRITICAL (score >= 0.85):
    action: create CRITICAL insider_threat_alert; immediate T4 notification
    escalation: T4 + Legal Org + HR representative required within 2 hours
    human_gate: same as HIGH — no autonomous action; all actions require authorization
    evidence_preservation: silent evidence preservation authorized only AFTER gate A of PB-SOC-008
    
  suppression:
    no_autonomous_enforcement: the Insider Threat Detector NEVER autonomously suspends,
      quarantines, restricts, or notifies an agent under investigation
    rationale: insider investigations have HR, legal, and employment law implications
      that require human judgment regardless of score certainty
```

---

## Insider Threat Record Schema

```yaml
insider_threat_record:
  record_id: ITR-{NNN}
  created_at: ISO8601
  
  subject_agent_id: string
  risk_category: MALICIOUS | COMPROMISED | NEGLIGENT | COLLUDING | UNKNOWN
  risk_score: float
  risk_level: WATCH | ELEVATED | HIGH | CRITICAL
  
  component_scores:
    behavioral_drift: float
    data_access_risk: float
    privilege_risk: float
    policy_violation_history: float
    peer_deviation: float
    temporal_anomaly: float
    external_contact_risk: float
    
  contributing_indicators: [string]      # plain language; for human reviewer
  
  evidence_snapshot:
    behavioral_profile_id: BEH-{NNN}
    relevant_alert_ids: [ALT-{NNN}]
    relevant_violation_ids: [VIO-{NNN}]
    network_flow_ids: [NET-{NNN}]
    
  investigation:
    authorized: boolean                  # true only after T4+Legal+HR gate
    authorized_by: [string] | null
    authorized_at: ISO8601 | null
    investigating_analyst: string | null
    playbook_execution_id: PBX-{NNN} | null
    
  lifecycle:
    status: OPEN | UNDER_INVESTIGATION | RESOLVED_CLEARED | RESOLVED_CONFIRMED | CLOSED
    closed_at: ISO8601 | null
    disposition: string | null
    
  sensitivity:
    classification: RESTRICTED           # all insider threat records are RESTRICTED
    access_restricted_to: [T3, T4, Legal_Org, HR]
    
  integrity:
    entry_hash: sha256
```

---

## Longitudinal Tracking

```yaml
longitudinal_tracking:

  tracking_window: 365 days per agent
  
  trend_indicators:
    IMPROVING: composite_score declining over 60 days
    STABLE: composite_score variance < 0.10 over 60 days
    DETERIORATING: composite_score increasing over 30 days → T3 brief
    CRITICAL_TRAJECTORY: composite_score > 0.60 for 14 consecutive days → mandatory T4 review
    
  cohort_comparison:
    peer_group_definition: same role + same jurisdiction
    anomaly_threshold: Mahalanobis distance > 3σ from peer group centroid
    cadence: weekly cohort comparison report
    
  behavioral_contract_integration:
    deteriorating_score_trigger: if composite_score > 0.60 and behavioral_contract.last_renewal > 90_days_ago:
      flag for behavioral_contract_review (not suspension — just review)
    
  weekly_insider_threat_report:
    audience: T3 SOC lead + T4 CISO
    contents:
      - new ELEVATED+ records this week
      - agents on DETERIORATING trajectory
      - resolved investigations (cleared or confirmed)
      - cohort anomaly summary
    distribution: RESTRICTED; not in general security dashboard
```

---

## Integration

```
Feeds into:
  security-alert-manager.md — HIGH/CRITICAL insider threat alerts (minimum T2 routing)
  soc-playbook-engine.md — PB-SOC-008 triggered for HIGH/CRITICAL (with mandatory human gate)
  forensic-evidence-collector.md — evidence preservation requests after PB-SOC-008 gate A authorized

Receives from:
  behavioral-anomaly-detector.md — primary behavioral drift scores
  network-threat-monitor.md — external contact and exfiltration indicators
  adaptive-compliance/compliance-engine.md — policy violation history
  security-alert-manager.md — correlated alerts contribute to composite score
  cross-agent-trust-accumulation.md — trust score degradation as risk signal
```

---

## Governance

**Human gate is unconditional:** No enforcement action (quarantine, suspension, access restriction, notification) proceeds without T4 + Legal Org + HR authorization per PB-SOC-008; this is non-negotiable and non-bypassable  
**Records are RESTRICTED:** All insider threat records accessible only to T3 SOC, T4, Legal Org, and HR representative; not visible in general security dashboards  
**Agent notification prohibition:** Subjects of insider threat investigations are never notified by this system; human decision-makers control all communication  
**Score-based monitoring expansion:** ELEVATED and above triggers enhanced telemetry silently; no additional data collection that would require additional consent or visibility  
**Colluding insider detection:** Coordinated scoring across agent pairs; if two agents' insider threat scores both exceed 0.60 simultaneously with peer_deviation overlap, COLLUDING pattern flagged to T4  
**Audit:** All insider threat records, score computations, and investigation actions to `memory/threat-detection/insider-threat-audit.jsonl`; 10-year retention (employment law)
