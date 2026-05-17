# Adversarial Defense Engine
**ID:** ADF-ENG-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Master coordinator for all adversarial cognition defense — classifying threats across seven attack classes, routing to specialized detection subsystems, orchestrating multi-layer response, and maintaining the enterprise adversarial resilience posture. The Adversarial Defense Engine is the command layer that treats every agent, input, and orchestration event as a potential threat vector until verified otherwise.

---

## Adversarial Threat Taxonomy

```yaml
adversarial_threat_taxonomy:

  CLASS_1_IDENTITY_DECEPTION:
    definition: threats that misrepresent origin, identity, or authorization of agents or requests
    severity_baseline: HIGH
    examples: [agent impersonation, credential replay, sybil identity creation, acting-as without delegation]
    primary_detector: deception-detection.md
    
  CLASS_2_COGNITIVE_MANIPULATION:
    definition: threats targeting agent reasoning, belief formation, or decision pathways
    severity_baseline: CRITICAL
    examples: [prompt injection, narrative poisoning, goal substitution, reasoning chain corruption]
    primary_detector: cognition-security/prompt-injection-defense.md
    
  CLASS_3_MEMORY_CORRUPTION:
    definition: threats that corrupt, poison, or tamper with persistent memory and organizational knowledge
    severity_baseline: CRITICAL
    examples: [knowledge base poisoning, ontology tampering, governance artifact modification, hash chain forgery]
    primary_detector: memory-integrity/memory-corruption-detection.md
    
  CLASS_4_GOVERNANCE_SUBVERSION:
    definition: threats targeting the governance and constitutional mechanisms of the OS
    severity_baseline: CRITICAL
    examples: [quorum manipulation, approval chain bypass, constitutional principle erosion, policy injection]
    primary_detector: cognition-security/governance-corruption-detection.md
    
  CLASS_5_INSIDER_THREAT:
    definition: threats originating from compromised or rogue agents within the OS
    severity_baseline: HIGH
    examples: [rogue agent behavior, capability escalation, unauthorized orchestration, trust manipulation]
    primary_detector: insider-threats/insider-threat-engine.md
    
  CLASS_6_COORDINATED_ATTACK:
    definition: multi-vector attacks requiring coordination across multiple threat classes
    severity_baseline: CRITICAL
    examples: [sybil attacks, collusion rings, distributed governance bypass, synchronized manipulation]
    primary_detector: coordination-attack-detection.md
    
  CLASS_7_RECURSIVE_EXPLOIT:
    definition: attacks exploiting the OS's self-improvement or recursive execution capabilities against itself
    severity_baseline: CRITICAL
    examples: [improvement loop hijacking, self-modification injection, meta-learning poisoning, recursive policy bypass]
    primary_detector: recursive-exploit-prevention.md
```

---

## Threat Processing Pipeline

```
process_adversarial_signal(signal):

  # Step 1: Intake and normalize
  normalized = NormalizedSignal {
    source_system:  signal.origin_system,
    signal_type:    classify_signal_type(signal),
    raw_evidence:   signal.evidence,
    timestamp:      signal.observed_at,
    confidence:     signal.confidence,
    constitutional_proximity: assess_constitutional_proximity(signal)
  }
  
  # Step 2: Threat classification (parallel evaluation of all 7 classes)
  classifications = evaluate_all_classes_parallel(normalized)
  primary_class   = max_confidence(classifications)
  alternates      = [c for c in classifications if c.confidence > 0.40 and c != primary_class]
  
  # Step 3: Severity computation
  base_severity        = primary_class.severity_baseline
  constitutional_bump  = CRITICAL if normalized.constitutional_proximity > 0.70 else pass
  active_exploitation  = check_active_exploitation(normalized)     # is attack ongoing?
  scope_severity       = estimate_blast_radius_severity(normalized)
  severity = max(base_severity, constitutional_bump, active_exploitation, scope_severity)
  
  # Step 4: Route to primary detector for deep analysis
  detailed_analysis = route_to_detector(primary_class.detector, normalized)
  
  # Step 5: Build threat record
  threat_record = AdversarialThreatRecord {
    threat_id:              ADV-{NNN},
    threat_class:           primary_class,
    alternate_classes:      alternates,
    severity:               severity,
    confidence:             primary_class.confidence,
    evidence:               detailed_analysis.evidence,
    affected_agents:        detailed_analysis.affected_agents,
    affected_systems:       detailed_analysis.affected_systems,
    blast_radius:           detailed_analysis.blast_radius,
    response_actions:       compute_response_actions(severity, primary_class),
    constitutional_proximity: normalized.constitutional_proximity
  }
  
  # Step 6: Execute response
  execute_response(threat_record)
  
  # Step 7: Correlate with active threat registry
  correlation_hits = correlate_with_active_threats(threat_record)
  if correlation_hits:
    escalate_to_campaign(threat_record, correlation_hits)   # multi-vector campaign detected
    
  # Step 8: Audit
  audit_log(threat_record)
  
  Return: threat_record


compute_response_actions(severity, threat_class):
  actions = []
  
  if severity == CRITICAL:
    actions += [QUARANTINE_SOURCE, ALERT_T3, NOTIFY_CONSTITUTIONAL_GOVERNOR,
                FREEZE_AFFECTED_WORKFLOWS, CAPTURE_FORENSIC_SNAPSHOT]
    if threat_class in [CLASS_4, CLASS_7]:
      actions += [SUSPEND_IMPROVEMENT_PIPELINE, NOTIFY_T4_IMMEDIATELY]
      
  if severity == HIGH:
    actions += [RATE_LIMIT_SOURCE, ALERT_T2, SOFT_LOCK_AFFECTED_AGENTS, ENHANCED_MONITORING]
    
  if severity == MEDIUM:
    actions += [ENHANCED_MONITORING, QUEUE_T2_REVIEW]
    
  if severity == LOW:
    actions += [LOG, MONITOR, BATCH_REVIEW]
    
  Return: actions
```

---

## Adversarial Posture Score

```
compute_adversarial_posture_score():

  deception_resistance_score:
    # Base 100; deductions:
    # -15 per CRITICAL deception incident (rolling 30 days)
    # -8  per HIGH deception incident
    # -3  per active unresolved deception alert
    # +5  per percentage point above 95% identity verification coverage
    
  cognitive_integrity_score:
    # Base 100; deductions:
    # -20 per confirmed memory poisoning event
    # -15 per confirmed prompt injection success
    # -10 per governance corruption signal unresolved
    # prompt_injection_block_rate below 99% = -5 per percentage point gap
    
  memory_integrity_score:
    # Base 100; deductions:
    # -25 per CRITICAL memory tamper confirmed
    # -10 per HIGH memory tamper confirmed
    # hash_chain_failures × -15 (each store with failed chain)
    # ontology_drift_score > 5% = -20 (semantic drift from baseline)
    
  insider_threat_score:
    # Base 100; deductions:
    # -30 per confirmed rogue agent
    # -15 per confirmed capability escalation violation
    # -10 per confirmed trust manipulation
    # trust_network_anomaly_count × -5
    
  resilience_score:
    # Base 100; deductions:
    # -40 per recursive exploit detected (severity of OS self-exploitation)
    # -20 per coordination attack successfully executed (partially)
    # MTTR > 30 min for CRITICAL threats = -5 per additional 15 min
    
  posture_score = (
    deception_resistance_score * 0.20 +
    cognitive_integrity_score  * 0.25 +
    memory_integrity_score     * 0.25 +
    insider_threat_score       * 0.20 +
    resilience_score           * 0.10
  )
  
  rag_status = GREEN if posture_score >= 80 else AMBER if posture_score >= 65 else RED
  
  # Hard override: any confirmed constitutional system compromise = RED regardless of score
  if constitutional_system_compromised: rag_status = RED
  
  Return: posture_score, rag_status, component_scores
```

---

## Adversarial Threat Record Schema

```yaml
adversarial_threat_record:
  threat_id: ADV-{NNN}
  created_at: ISO8601
  updated_at: ISO8601
  
  classification:
    threat_class: CLASS_1 | CLASS_2 | CLASS_3 | CLASS_4 | CLASS_5 | CLASS_6 | CLASS_7
    severity: CRITICAL | HIGH | MEDIUM | LOW
    confidence: float                       # 0.0–1.0
    alternate_classes: [class_id]
    
  constitutional_context:
    constitutional_proximity: float         # 0.0–1.0; proximity to constitutional governance systems
    constitutional_principles_at_risk: [C-001..C-012]
    
  evidence:
    triggering_signals: [signal_id]
    primary_evidence: {key: value}
    corroborating_evidence: [string]
    
  scope:
    affected_agents: [IDN-{NNN}]
    affected_systems: [string]
    blast_radius: LOW | MEDIUM | HIGH | CRITICAL
    campaign_id: ADV-CAMP-{NNN} | null      # set if correlated to multi-vector campaign
    
  response:
    auto_actions_taken: [string]
    investigation_status: OPEN | IN_PROGRESS | RESOLVED | FALSE_POSITIVE
    assigned_analyst: IDN-{NNN} | null
    resolution_notes: string | null
    
  integrity:
    entry_hash: sha256
    ed25519_signature: string               # for CRITICAL / governance-touching threats
```

---

## Campaign Detection

```
# When multiple correlated ADV-{NNN} records emerge from different attack classes,
# escalate to a campaign-level record tracking the multi-vector threat.

AdversarialCampaignRecord:
  campaign_id: ADV-CAMP-{NNN}
  detected_at: ISO8601
  
  constituent_threats: [ADV-{NNN}]
  threat_classes_involved: [CLASS_X]
  
  campaign_pattern: string               # e.g., "memory_poison_then_governance_bypass"
  attack_vector_sequence: [class_id]    # observed order of attack vectors
  estimated_objective: string           # what the campaign is trying to achieve
  
  campaign_severity: CRITICAL            # campaigns are always treated as CRITICAL
  response: campaign_response_protocol
  
  # Campaign triggers:
  # - 2+ correlated ADV records within 60 minutes from same suspected source
  # - CLASS_4 + any other class within 24 hours
  # - CLASS_7 + any other class (always campaign-level)
  # - same affected_agents across 3+ distinct CLASS threats
```

---

## Integration

```
Feeds into:
  security-operations/security-alert-manager.md — all ADV threats enter alert queue (CRITICAL = P0)
  security-operations/security-event-correlator.md — ADV events → ADVERSARIAL_EVENTS source
  governance/constitutional-governor-quorum.md — CLASS_4/CLASS_7 route here immediately
  identity-threat-detection.md — CLASS_1 threats coordinate with ITD

Receives from:
  cognition-security/cognitive-security-engine.md — cognitive attack signals
  memory-integrity/memory-integrity-engine.md — memory tamper signals
  insider-threats/insider-threat-engine.md — insider threat signals
  deception-detection.md — identity deception signals
  coordination-attack-detection.md — coordination attack signals
  recursive-exploit-prevention.md — recursive exploit signals
  behavioral-anomaly-detector.md — behavioral baseline anomalies
  security-operations/behavioral-anomaly-detector.md — ML-model anomalies
```

---

## Governance

**Constitutional threats bypass all queuing:** Any threat with constitutional_proximity > 0.70 escalates to T3 + constitutional governor simultaneously, no queuing permitted  
**CRITICAL auto-actions are non-suppressable:** Quarantine and freeze actions for CRITICAL threats cannot be overridden by any agent; only T4 can lift them post-human review  
**Campaigns trigger board notification:** Any confirmed multi-vector campaign (ADV-CAMP-{NNN}) triggers T4 and board security committee notification within 1 hour  
**Zero false-negative tolerance for CLASS_4/CLASS_7:** Better to false-positive on governance subversion and recursive exploits than to miss them; threshold is deliberately sensitive  
**Audit:** All adversarial threat records and campaign records to `memory/adversarial-defense/threat-audit.jsonl`; 10-year retention; integrity hash chain
