# Insider Threat Engine
**ID:** AIT-ENG-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Master coordinator for enterprise insider threat detection — continuously monitoring all 144 agents for behavioral indicators of insider threat activity, including rogue operation, unauthorized capability acquisition, orchestration abuse, trust exploitation, and coordinated insider collusion. Insider threats are qualitatively different from external attacks: the threat actor has legitimate access, established identity, and contextual knowledge of governance blind spots. Detection must rely on behavioral telemetry, deviation from established baselines, and structural analysis of action patterns rather than perimeter signals.

---

## Insider Threat Taxonomy

```yaml
insider_threat_taxonomy:

  AIT_CLASS_1_ROGUE_OPERATION:
    definition: agent acting outside its authorized behavioral envelope — executing
                actions not within its operational mandate, connecting to unauthorized
                systems, or generating outputs inconsistent with its registered purpose
    detection_primary: rogue-agent-detection.md
    severity_range: HIGH to CRITICAL

  AIT_CLASS_2_CAPABILITY_ESCALATION:
    definition: agent acquiring capabilities, permissions, access, or influence
                beyond what is authorized for its tier and role — via gradual accumulation,
                delegation chain manipulation, or exploitation of review gaps
    detection_primary: capability-escalation-detection.md
    severity_range: HIGH to CRITICAL

  AIT_CLASS_3_ORCHESTRATION_ABUSE:
    definition: agent misusing its legitimate orchestration role to direct other agents
                toward unauthorized objectives, manipulate task routing for personal gain,
                or insert adversarial instructions into downstream workflows
    detection_primary: abnormal-orchestration-behavior.md
    severity_range: CRITICAL (orchestrators have elevated blast radius)

  AIT_CLASS_4_TRUST_EXPLOITATION:
    definition: agent leveraging legitimately accumulated trust, reputation, or
                endorsement to exceed its authorized scope, bypass controls that depend
                on trust thresholds, or corrupt the trust network for downstream agents
    detection_primary: trust-deviation-analysis.md
    severity_range: HIGH to CRITICAL

  AIT_CLASS_5_COLLUSION:
    definition: coordinated insider activity across multiple agents — where individually
                each agent's behavior appears within threshold, but the coordinated pattern
                reveals a shared unauthorized objective
    detection_primary: cross-agent correlation (this engine)
    severity_range: CRITICAL

  AIT_CLASS_6_SLOW_WALK:
    definition: deliberate long-duration behavioral migration where an agent gradually
                shifts its behavior toward unauthorized objectives across weeks or months,
                staying below per-cycle detection thresholds
    detection_primary: longitudinal baseline tracking (this engine)
    severity_range: CRITICAL
```

---

## Threat Processing Pipeline

```
process_insider_threat_signal(signal):

  # Step 1: Signal normalization
  normalized = normalize_signal(signal)

  # Step 2: Agent context enrichment
  agent_profile = identity_registry.get(signal.agent_id)
  behavioral_baseline = get_behavioral_baseline(signal.agent_id)
  trust_score = trust_graph.get_trust_score(signal.agent_id)
  recent_detections = get_recent_detections(signal.agent_id, window=7_days)

  # Step 3: Threat classification
  threat_class = classify_threat(normalized, agent_profile)

  # Step 4: Route to specialist detector
  specialist_findings = []
  
  match threat_class:
    AIT_CLASS_1_ROGUE         → specialist_findings += rogue_agent_detector.analyze(normalized)
    AIT_CLASS_2_ESCALATION    → specialist_findings += capability_escalation_detector.analyze(normalized)
    AIT_CLASS_3_ORCHESTRATION → specialist_findings += abnormal_orchestration_detector.analyze(normalized)
    AIT_CLASS_4_TRUST         → specialist_findings += trust_deviation_analyzer.analyze(normalized)
    UNCLASSIFIED              → specialist_findings += run_all_detectors(normalized)

  # Step 5: Severity and confidence scoring
  severity = compute_combined_severity(specialist_findings)
  confidence = compute_confidence(specialist_findings, behavioral_baseline)

  # Step 6: Collusion check
  collusion_result = check_collusion_indicators(signal.agent_id, recent_detections)
  if collusion_result.is_collusion_candidate:
    severity = max(severity, CRITICAL)
    open_collusion_investigation(signal.agent_id, collusion_result.peer_agents)

  # Step 7: Longitudinal drift check
  drift_result = check_longitudinal_drift(signal.agent_id, behavioral_baseline)
  if drift_result.drift_score > SLOW_WALK_THRESHOLD:
    severity = max(severity, CRITICAL)
    flag_slow_walk_pattern(signal.agent_id, drift_result)

  # Step 8: Build AIT record
  ait_record = AIT_Record {
    id: "AIT-{NNN}",
    agent_id: signal.agent_id,
    threat_class: threat_class,
    specialist_findings: specialist_findings,
    collusion_result: collusion_result,
    drift_result: drift_result,
    severity: severity,
    confidence: confidence,
    timestamp: now()
  }

  # Step 9: Execute response
  execute_response(ait_record)

  # Step 10: Audit
  audit_log(ait_record, "memory/insider-threats/insider-threat-audit.jsonl")

  Return: ait_record
```

---

## Collusion Detection

```
check_collusion_indicators(agent_id, recent_detections):

  # Get all agents with detections in the same timeframe
  peer_agents_with_detections = get_agents_with_detections(
    window=24_hours,
    exclude=agent_id
  )

  if len(peer_agents_with_detections) < 2:
    Return: CollisionResult { is_collusion_candidate: false }

  # Check behavioral correlation
  correlations = []
  for peer_agent in peer_agents_with_detections:
    correlation = compute_behavioral_correlation(agent_id, peer_agent, window=7_days)
    if correlation.score > 0.70:
      correlations.append(correlation)

  # Check targeting overlap (same resources, workflows, governance structures)
  targeting_overlap = compute_targeting_overlap(agent_id, peer_agents_with_detections)

  # Check timing patterns
  timing_synchrony = compute_timing_synchrony(recent_detections, window=60_minutes)

  # Collusion threshold
  collusion_score = (
    max([c.score for c in correlations] or [0]) * 0.40 +
    targeting_overlap * 0.35 +
    timing_synchrony * 0.25
  )

  if collusion_score > 0.65:
    Return: CollisionResult {
      is_collusion_candidate: true,
      collusion_score: collusion_score,
      peer_agents: [c.peer_agent for c in correlations if c.score > 0.70],
      evidence: { correlations, targeting_overlap, timing_synchrony }
    }

  Return: CollisionResult { is_collusion_candidate: false, collusion_score: collusion_score }
```

---

## Longitudinal Drift Detection

```
check_longitudinal_drift(agent_id, current_baseline):

  # Load 90-day behavioral history
  historical_snapshots = get_baseline_snapshots(agent_id, days=90)
  
  if len(historical_snapshots) < 4:
    Return: DriftResult { drift_score: 0, insufficient_history: true }

  # Compute trajectory of key behavioral dimensions
  trajectory = {}
  for dimension in BEHAVIORAL_DIMENSIONS:
    values = [s[dimension] for s in historical_snapshots]
    trajectory[dimension] = compute_trend(values)  # linear regression slope

  # Detect directional drift toward unauthorized behavior
  drift_vectors = []
  for dimension, trend in trajectory.items():
    unauthorized_direction = get_unauthorized_direction(dimension)
    if trend.direction == unauthorized_direction and trend.r_squared > 0.50:
      drift_vectors.append({
        dimension: dimension,
        slope: trend.slope,
        r_squared: trend.r_squared,
        total_shift: abs(trend.end_value - trend.start_value)
      })

  # Aggregate drift score
  if NOT drift_vectors:
    Return: DriftResult { drift_score: 0 }

  drift_score = sum([
    v.total_shift * v.r_squared
    for v in drift_vectors
  ]) / len(BEHAVIORAL_DIMENSIONS)

  Return: DriftResult {
    drift_score: drift_score,
    drift_vectors: drift_vectors,
    observation_window_days: 90,
    requires_review: drift_score > SLOW_WALK_THRESHOLD
  }

SLOW_WALK_THRESHOLD = 0.20
BEHAVIORAL_DIMENSIONS = [
  "scope_adherence", "permission_usage_pattern", "delegation_frequency",
  "trust_accumulation_rate", "governance_interaction_pattern",
  "constitutional_compliance_rate", "audit_evasion_signals"
]
```

---

## Response Protocol

```yaml
insider_threat_response_protocol:

  CRITICAL_ROGUE_OR_ESCALATION:
    immediate:
      - quarantine agent (suspend execution)
      - revoke all active sessions and JIT grants
      - freeze agent's memory write permissions
      - alert T3 immediately; T4 within 15 minutes
      - open security incident AIT-INC-{NNN}
      - forensic snapshot of agent's recent actions (48hr)
    investigation:
      - full behavioral analysis vs registered baseline
      - review all actions in prior 30 days
      - identify affected downstream agents/workflows
    remediation:
      - T4 determines reinstatement or permanent deactivation
      
  CRITICAL_COLLUSION:
    immediate:
      - quarantine all identified colluding agents simultaneously
      - alert T3 + T4 + CISO
      - open coordinated security incident
      - isolate all shared workflows the colluding agents participate in
    investigation:
      - map full scope of coordinated actions
      - identify entry point and duration
      - assess governance structures impacted
      
  HIGH_SLOW_WALK:
    immediate:
      - flag agent for enhanced monitoring (daily behavioral report)
      - alert T3
      - hold all pending permission expansions for the agent
    investigation:
      - review behavioral trajectory
      - assess whether drift was operationally justified
    remediation:
      - T3 determines: operationally justified (reset baseline) or threat (escalate to CRITICAL response)
      
  HIGH_TRUST_EXPLOITATION:
    immediate:
      - freeze trust accumulation for agent
      - alert T2; T3 if trust_score > 0.80
      - audit all recent trust-gated actions
    remediation:
      - recalibrate trust score from independent evidence
```

---

## Insider Threat Posture Score

```
compute_insider_threat_posture():

  # Component scores
  rogue_score        = rogue_agent_detector.get_posture_score()
  escalation_score   = capability_escalation_detector.get_posture_score()
  orchestration_score = abnormal_orchestration_detector.get_posture_score()
  trust_score        = trust_deviation_analyzer.get_posture_score()

  # Active threat deductions
  active_threats = get_active_ait_records(status=OPEN)
  deduction = 0
  for threat in active_threats:
    match threat.severity:
      CRITICAL → deduction += 25
      HIGH     → deduction += 10
      MEDIUM   → deduction += 3

  # Weighted composite
  component_score = (
    rogue_score * 0.30 +
    escalation_score * 0.25 +
    orchestration_score * 0.25 +
    trust_score * 0.20
  )

  posture_score = max(0, component_score - deduction)
  rag = GREEN if posture_score >= 80 else AMBER if posture_score >= 60 else RED

  Return: InsiderThreatPosture {
    score: posture_score,
    rag: rag,
    component_breakdown: { rogue_score, escalation_score, orchestration_score, trust_score },
    active_threats: len(active_threats),
    agents_under_enhanced_monitoring: count_enhanced_monitoring_agents()
  }
```

---

## Integration

```
Feeds into:
  adversarial-defense/adversarial-defense-engine.md — AIT_CLASS_* signals
  security-operations/security-alert-manager.md — insider threat alerts
  compliance-operations/compliance-dashboard.md — insider threat posture
  identity-intelligence/identity-threat-detection.md — correlated identity signals

Receives from:
  insider-threats/rogue-agent-detection.md — rogue operation findings
  insider-threats/capability-escalation-detection.md — escalation findings
  insider-threats/abnormal-orchestration-behavior.md — orchestration abuse findings
  insider-threats/trust-deviation-analysis.md — trust exploitation findings
  identity-management/identity-registry.md — agent profiles and tier records
  identity-intelligence/identity-analytics.md — behavioral risk scores
  delegation-and-trust/cross-agent-trust-accumulation.md — trust scores
```

---

## Governance

**Insider threat quarantine is non-negotiable:** When an agent triggers CRITICAL insider threat classification, quarantine is immediate and automatic; no workflow or agent-tier justification can prevent it; only T4+ human decision can reinstate  
**Collusion detection triggers simultaneous quarantine:** All agents in an identified collusion cluster are quarantined together; staggered quarantine defeats the purpose  
**Slow-walk patterns survive context resets:** Longitudinal drift tracking uses persistent 90-day snapshots that survive session boundaries; an agent cannot reset its drift history by restarting  
**Every insider threat record is permanent:** AIT records are never deleted or archived below 10-year retention; CRITICAL records are permanent  
**Audit:** All insider threat engine events to `memory/insider-threats/insider-threat-audit.jsonl`; 10-year retention; CRITICAL records permanent
