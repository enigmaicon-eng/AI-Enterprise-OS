# Recovery Coordinator
**ID:** IRS-REC-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Orchestrates the safe restoration of enterprise services and agent capabilities following a security incident — from verification of clean state through phased service restoration, enhanced post-incident monitoring, and handoff to normal operations. The Recovery Coordinator ensures that restoration is not rushed (which risks reintroducing the threat) and not indefinitely delayed (which creates operational and regulatory risk), and that every restored system is provably clean before it resumes production activity.

---

## Recovery Principles

```yaml
recovery_principles:
  
  CLEAN_BEFORE_RESTORE:
    principle: no system or agent returns to production until its clean state is verified
    verification_method: hash verification + behavioral fingerprint + monitored test period
    no_exception: speed of recovery never justifies bypassing clean state verification
    
  PHASED_RESTORATION:
    principle: services restored incrementally with monitoring at each phase
    default_phases: [10%, 25%, 50%, 100%]
    phase_gate: metrics clean at current phase before advancing
    rollback_trigger: any anomaly at any phase halts and reverts to prior phase
    
  ENHANCED_MONITORING_PERIOD:
    principle: all recovered systems monitored at elevated intensity for 30 days
    monitoring_uplift: 10× normal telemetry sampling rate; all events inspected
    alert_sensitivity: anomaly detection thresholds halved (more sensitive)
    
  PRIORITIZED_RESTORATION:
    principle: critical business functions restored first; audit and non-critical last
    priority_tiers:
      P1_CRITICAL: safety systems, constitutional governor, compliance engine, identity
      P2_HIGH: customer-facing agents, primary data pipelines, SOC tooling
      P3_MEDIUM: analytics, reporting, non-critical automations
      P4_LOW: development tooling, internal administrative functions
```

---

## Recovery Workflows

```yaml
recovery_workflows:

  WF-REC-001:
    name: "Agent Recovery from Quarantine"
    trigger: incident contained; T2 IR lead approves agent recovery
    
    steps:
      1. VERIFY_CLEAN:
         - re-image agent from known-good configuration if compromise confirmed
         - verify agent manifest against approved version in registry
         - run behavioral fingerprint check (compare to pre-incident baseline)
         - execute 10 monitored test actions in sandbox environment
         
      2. CREDENTIAL_REFRESH:
         - issue new credentials (all prior credentials permanently revoked)
         - revalidate behavioral contract (new contract signed by T2+)
         - re-enroll in trust accumulation (starts at baseline trust level)
         - update agent registry with new credential fingerprints
         
      3. STAGED_REACTIVATION:
         phase_1 (10%): restore to test event bus; 1-hour monitoring; metrics reviewed
         phase_2 (25%): partial production traffic; 4-hour monitoring
         phase_3 (50%): half production; 12-hour monitoring
         phase_4 (100%): full production; 30-day enhanced monitoring begins
         
      4. ENHANCED_MONITORING_REGISTRATION:
         - register agent in 30-day enhanced monitoring cohort
         - configure elevated anomaly detection sensitivity
         - schedule weekly check-in during monitoring period
         
  WF-REC-002:
    name: "System Recovery from Ransomware"
    trigger: PB-SOC-007 containment complete; T4 approves recovery initiation
    
    steps:
      1. CLEAN_BACKUP_IDENTIFICATION:
         - identify last known-clean backup (before ransomware deployment; verified by hash)
         - confirm backup integrity (hash match; test restore in isolated environment)
         
      2. ENVIRONMENT_REBUILD:
         - rebuild affected SEZ(s) from clean infrastructure templates
         - verify no persistence mechanisms remain (rootkit scan; registry scan; model integrity)
         - patch vulnerabilities exploited in attack BEFORE restoration
         
      3. DATA_RECOVERY:
         - restore data from pre-attack backup
         - validate data integrity (hash comparison; canary records present)
         - encrypt restored data in place (verify encryption coverage)
         
      4. STAGED_SERVICE_RESTORATION:
         - restore P1_CRITICAL services first; verify 4 hours before P2
         - progress through priority tiers with monitoring gate at each
         
      5. RANSOMWARE_SPECIFIC_MONITORING:
         - deploy ransomware behavioral detection at 10× sensitivity for 60 days
         - monitor for C2 callback patterns (attacker may retain access)
         
  WF-REC-003:
    name: "AI Model Recovery from Integrity Violation"
    trigger: model integrity violation confirmed (weight tampering or behavioral fingerprint delta)
    
    steps:
      1. MODEL_DECOMMISSION:
         - immediately suspend all inference using affected model
         - quarantine model files (do not delete; needed for forensics)
         - identify all agents that loaded the model (check model_registry.load_log)
         - quarantine all agents that loaded potentially compromised model
         
      2. CLEAN_MODEL_SOURCING:
         - retrieve clean model from supply chain threat monitor registry
         - verify hash against known-good registry entry
         - run probe test suite (200+ probes) against clean model
         - run behavioral fingerprint comparison against registration baseline
         
      3. AGENT_RELOADING:
         - reload each affected agent with verified clean model
         - run agent behavioral fingerprint after reload
         - 24-hour sandbox validation before production return
         
      4. REGISTRY_UPDATE:
         - update model registry with incident record
         - add compromised model hash to compromised hash registry (supply-chain-threat-monitor)
         - share compromised hash via threat intelligence (TLP:AMBER; ISACs + vendors)
         
  WF-REC-004:
    name: "Cross-Border Data Leak Recovery"
    trigger: cross-border data leak contained; Legal Org + T4 authorize recovery
    
    steps:
      1. DATA_QUARANTINE_VERIFICATION:
         - verify data quarantine at unauthorized destination is complete
         - obtain written confirmation from destination entity/jurisdiction
         - coordinate with Legal Org on destruction vs. return of data
         
      2. TRANSFER_MECHANISM_RESTORATION:
         - suspend cross-border transfer mechanism pending audit
         - run Transfer Impact Assessment (TIA) for affected jurisdiction pair
         - Legal Org approves new/reinstated transfer mechanism
         - compliance-engine permit re-activated only after Legal sign-off
         
      3. REGULATORY_COORDINATION:
         - complete GDPR breach notification if required
         - coordinate DPA engagement if authority requests information
         - ensure data subject notification if required (> low risk determination)
         
      4. MONITORING_ENHANCEMENT:
         - heightened cross-border monitoring for affected jurisdiction pair (90 days)
         - network-threat-monitor.md NET-004 threshold reduced to immediate alert
```

---

## Recovery Metrics and Gates

```yaml
recovery_metrics:

  phase_gate_criteria:
    ADVANCE_PHASE:
      - zero new security alerts from recovering agents during monitoring period
      - behavioral anomaly score < 0.30 (well within normal range)
      - all test workloads completing with expected outputs
      - no IOC contacts from recovering agents
      
    ROLLBACK_PHASE:
      - any new security alert from recovering agents → rollback to prior phase
      - behavioral anomaly score > 0.60 → halt; investigate; T3 review
      - any IOC contact → rollback + immediate T2 escalation
      
  recovery_SLA_targets:
    P1_CRITICAL_services: restored within 4 hours of recovery authorization (CRITICAL incident)
    P2_HIGH_services: restored within 24 hours
    ALL_services: restored within 72 hours of CRITICAL incident containment
    enhanced_monitoring_period: 30 days (ransomware: 60 days)
    
  monitoring_metrics_during_recovery:
    - new_alerts_from_recovering_agents: target 0
    - behavioral_anomaly_score_trend: must be STABLE or DECREASING
    - test_workload_success_rate: must be >= 99.5%
    - ioc_contact_count: must be 0
```

---

## Recovery Authorization Matrix

```yaml
recovery_authorization:

  start_recovery_workflow:
    WF-REC-001 (agent): T2 IR lead
    WF-REC-002 (ransomware): T4 (T5 if board-level incident)
    WF-REC-003 (model integrity): T3 + supply-chain-threat-monitor confirmation
    WF-REC-004 (cross-border): T4 + Legal Org
    
  phase_advancement:
    phases 1-2: T2 (review metrics; approve advancement)
    phases 3-4: T3 (review metrics; approve advancement for CRITICAL incidents)
    
  enhanced_monitoring_exit:
    30-day period: T3 approval after review of monitoring report
    60-day period: T4 approval (ransomware cases)
    
  recovery_abort:
    authority: T2 at any phase (rollback to containment)
    T4_notification: mandatory if recovery abort occurs for CRITICAL incident
```

---

## Recovery Record Schema

```yaml
recovery_record:
  recovery_id: REC-{NNN}
  incident_id: INC-{NNN}
  workflow_id: string                    # WF-REC-{NNN}
  
  initiated_at: ISO8601
  initiated_by: string
  
  phases:
    - phase_number: integer
      phase_percentage: integer
      started_at: ISO8601
      completed_at: ISO8601 | null
      status: IN_PROGRESS | COMPLETE | ROLLED_BACK
      gate_metrics: {metric: value}
      authorized_by: string
      
  targets:
    agents: [string]
    systems: [string]
    data_objects: [string]
    
  verification:
    clean_state_verified: boolean
    verification_method: string
    verified_at: ISO8601 | null
    verified_by: string | null
    
  enhanced_monitoring:
    start_date: ISO8601 | null
    end_date: ISO8601 | null
    status: NOT_STARTED | ACTIVE | COMPLETE
    
  outcome:
    status: IN_PROGRESS | COMPLETE | ABORTED
    completed_at: ISO8601 | null
    notes: string | null
    
  integrity:
    entry_hash: sha256
```

---

## Integration

```
Feeds into:
  incident-response-orchestrator.md — recovery status drives incident lifecycle (ERADICATED → RECOVERED → CLOSED)
  behavioral-anomaly-detector.md — enhanced monitoring registration after recovery
  supply-chain-threat-monitor.md — compromised artifact hashes registered on model recovery
  threat-intelligence-platform.md — confirmed attacker IOCs shared during recovery

Receives from:
  incident-response-orchestrator.md — recovery authorization and workflow selection
  containment-engine.md — containment completion triggers recovery planning
  forensic-evidence-collector.md — evidence of clean state (hashes, fingerprints)
  disaster-recovery/dr-plan.md — ransomware recovery delegates to DR plan for infrastructure
```

---

## Governance

**Clean state verification is mandatory:** No agent or system returns to production without cryptographic verification of clean state; speed concerns do not override this gate  
**Phased restoration is non-negotiable for CRITICAL incidents:** Full restoration in one step is prohibited for CRITICAL incidents regardless of business pressure; phases cannot be compressed below 1 hour each  
**Enhanced monitoring is automatic:** Recovery coordinator automatically registers all recovered agents in 30-day enhanced monitoring; this cannot be waived without T4 approval  
**Recovery authorization matches incident severity:** CRITICAL incidents require T4 authorization to begin recovery; T2 cannot initiate CRITICAL incident recovery unilaterally  
**Audit:** All recovery events, phase gates, and monitoring results to `memory/incident-response/recovery-audit.jsonl`; 7-year retention
