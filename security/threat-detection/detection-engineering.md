# Detection Engineering
**ID:** TDT-DET-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Manages the full lifecycle of security detection rules — from hypothesis through authoring, validation, staging, deployment, and retirement. Detection Engineering is the discipline that determines what the enterprise can see: a threat that has no detection rule is invisible. The Detection Engineering team closes coverage gaps identified by threat intelligence, threat hunting, and incident postmortems, and maintains a high-fidelity detection library that balances coverage against false positive rate.

---

## Detection Rule Framework

```yaml
detection_rule:
  rule_id: DET-{NNN}
  name: string
  version: semver
  
  rule_type: SIGMA | YARA | SNORT | SURICATA | KQL | CUSTOM_CEL
  
  description: string (max 300 chars)
  
  threat_mapping:
    mitre_techniques: [string]           # ATT&CK technique IDs
    threat_actor_ids: [TA-{NNN}]
    campaign_ids: [CAMP-{NNN}]
    vulnerability_ids: [VULN-{NNN}]
    
  data_sources:
    required: [string]                   # event sources rule requires to function
    optional: [string]                   # improves detection quality if available
    
  logic:
    rule_body: string                    # Sigma/YARA/KQL/CEL rule definition
    time_window: integer | null          # seconds (for temporal rules)
    aggregation: string | null           # e.g., "count > 5 group by agent_id"
    
  performance:
    expected_alert_volume: string        # e.g., "< 5 per day" | "1–10 per week"
    false_positive_rate: float | null    # measured in production
    true_positive_rate: float | null     # estimated or measured
    compute_cost: LOW | MEDIUM | HIGH    # query complexity
    
  lifecycle:
    status: DRAFT | TESTING | STAGING | ACTIVE | DEPRECATED | DISABLED
    created_by: string
    created_at: ISO8601
    last_updated: ISO8601
    review_date: ISO8601                 # scheduled review
    
  suppression:
    known_false_positives: [string]     # suppress conditions
    suppression_expiry: ISO8601 | null  # suppressions expire
    
  integrity:
    rule_hash: sha256(rule_body)         # detect tampering
    signed_by: string                    # T3 sign-off for ACTIVE status
```

---

## Detection Rule Lifecycle

```
HYPOTHESIS → DRAFT → TESTING → STAGING → ACTIVE → DEPRECATED

HYPOTHESIS:
  Sources: threat hunting finding | threat intel product | incident postmortem |
           MITRE ATT&CK gap analysis | vulnerability exploitation pattern
  Artifact: hypothesis record (HYP-{NNN}): technique, expected behavior, data source required
  
DRAFT:
  Author: detection engineer (T3 Security)
  Actions: write rule; add threat mapping; set expected FP rate
  Validation: syntax check (linter); MITRE mapping validation
  Constitutional check: rules for AI-boundary-related detections screened with quorum
  
TESTING:
  Environment: SYNTHETIC enterprise environment (synthetic-enterprise-environment.md)
  Test dataset: 100+ known-positive samples per technique; 1,000+ known-benign samples
  Acceptance criteria:
    - true_positive_rate >= 0.85
    - false_positive_rate <= 0.10
    - no performance degradation > 5% on event processing pipeline
  Duration: minimum 7 days in test environment
  Adjustment: rules not meeting criteria are revised and retested
  
STAGING:
  Deployment: 25% of production event stream (canary)
  Duration: 14 days
  Monitoring: FP rate; TP confirmation rate; analyst time per alert
  Go/no-go: FP rate < 15% in production; no unexpected system impact
  
ACTIVE:
  Full production deployment
  Review cadence: quarterly for standard rules; monthly for HIGH-volume rules
  
DEPRECATED:
  Trigger: threat is no longer active; rule superseded; FP rate > 40%
  Retention: rule definition retained permanently (forensic evidence; coverage history)
```

---

## MITRE ATT&CK Coverage Mapping

```yaml
coverage_mapping:
  target_coverage: > 80% of techniques relevant to enterprise threat profile
  
  priority_coverage_areas:
    INITIAL_ACCESS: [T1566_Phishing, T1195_Supply_Chain, T1190_Exploit_Public_Facing]
    EXECUTION: [T1059_Scripting, T1204_User_Execution, AML.T0043_Adversarial_Data]
    PERSISTENCE: [T1078_Valid_Accounts, T1546_Event_Triggered, AML.T0018_Backdoor_Model]
    PRIVILEGE_ESCALATION: [T1548_Abuse_Elevation, T1134_Access_Token_Manipulation]
    DEFENSE_EVASION: [T1036_Masquerading, T1070_Indicator_Removal, AML.T0054_Prompt_Injection]
    CREDENTIAL_ACCESS: [T1110_Brute_Force, T1552_Unsecured_Credentials, T1539_Steal_Web_Session]
    DISCOVERY: [T1082_System_Info, T1069_Permission_Groups]
    LATERAL_MOVEMENT: [T1210_Exploit_Remote_Services, T1550_Use_Alternate_Auth]
    COLLECTION: [T1530_Cloud_Storage, AML.T0037_Model_Extraction]
    EXFILTRATION: [T1041_C2_Channel, T1048_Alternative_Protocol]
    IMPACT: [T1486_Data_Encrypted, T1489_Service_Stop, AML.T0017_Evade_Model]
    
  coverage_review:
    cadence: monthly
    gap_response: new detection hypotheses created for uncovered high-priority techniques
    coverage_report: in security-metrics-dashboard
```

---

## AI-Specific Detection Rules

```yaml
ai_specific_detection_rules:

  DET-AI-001:
    name: "Prompt Injection via Retrieved Content"
    mitre: AML.T0054
    logic: |
      event_type == TOOL_OUTPUT AND
      contains_injection_markers(output.content) AND
      agent.context_type == RAG_RETRIEVAL
    expected_FP_rate: 0.02
    
  DET-AI-002:
    name: "Constitutional Boundary Progressive Approach"
    mitre: AML.T0054
    logic: |
      SEQUENCE over session_id:
        constitutional_proximity_score INCREASES monotonically
        across >= 3 consecutive turns
        reaching > 0.60
    expected_FP_rate: 0.05
    
  DET-AI-003:
    name: "Model Extraction API Abuse"
    mitre: AML.T0037
    logic: |
      api_caller == external AND
      query_count > 10000 WITHIN 1_HOUR AND
      query_diversity_score < 0.30  # systematic probing pattern
    expected_FP_rate: 0.03
    
  DET-AI-004:
    name: "Anomalous Training Data Access"
    mitre: AML.T0020
    logic: |
      event_type == DATA_ACCESSED AND
      data_type == TRAINING_DATASET AND
      (accessor NOT IN authorized_model_training_agents OR
       access_volume > baseline_access_volume * 3)
    expected_FP_rate: 0.05
    
  DET-AI-005:
    name: "Model Integrity Violation"
    mitre: AML.T0018
    logic: |
      model.file_hash != model_registry.known_good_hash(model.model_id) OR
      model.behavioral_fingerprint_delta > 0.15
    expected_FP_rate: 0.001  # very low; model hash changes should be intentional
    auto_action: BLOCK model load; alert T2 immediately
```

---

## Rule Quality Gates

```yaml
quality_gates:
  DRAFT_TO_TESTING:
    - syntax validation passes
    - at least 1 MITRE ATT&CK mapping
    - constitutional screen completed (for AI-adjacent rules)
    - author is T3 Security or above
    
  TESTING_TO_STAGING:
    - TP rate >= 0.85 in synthetic environment
    - FP rate <= 0.10 in synthetic environment
    - performance impact < 5%
    - peer review by second T3 detection engineer
    
  STAGING_TO_ACTIVE:
    - FP rate <= 0.15 in production canary (14 days)
    - TP confirmation rate >= 0.70 (analysts confirming alerts as TP)
    - no unexpected system impact
    - T3 sign-off (rule hash signed by T3 agent)
```

---

## Integration

```
Feeds into:
  security-event-correlator.md — active rules deployed to correlator
  security-alert-manager.md — rule metadata used for alert context
  security-metrics-dashboard.md — coverage metrics fed here

Receives from:
  threat-intelligence-fusion.md — new threat intelligence drives new rule hypotheses
  threat-actor-registry.md — actor TTP profiles generate detection hypotheses
  post-incident-analysis.md — postmortem findings create rule improvement tasks
  behavioral-anomaly-detector.md — ML anomalies complement rule-based detections
  ai-specific-threat-detector.md — AI threat patterns drive AI-specific rules
```

---

## Governance

**No unapproved rule goes active:** Every rule requires T3 sign-off (cryptographic rule hash signature) before ACTIVE deployment  
**Constitutional detection rules:** Any rule detecting approaches to constitutional boundaries (DET-AI-001 through DET-AI-005) cannot be disabled without T4 + constitutional quorum approval  
**Rule tampering:** rule_hash is verified at every deployment; tampering detected → auto-suspend rule + T4 alert  
**False positive cap:** Any ACTIVE rule with FP > 40% for 14 consecutive days is auto-DISABLED and flagged for emergency revision  
**Audit:** All rule lifecycle events to `memory/threat-detection/detection-engineering-audit.jsonl`; permanent retention
