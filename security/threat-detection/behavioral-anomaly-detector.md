# Behavioral Anomaly Detector
**ID:** TDT-BAD-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Establishes behavioral baselines for every agent, session, and workflow pattern in the enterprise and continuously compares observed behavior against those baselines to detect anomalies that rule-based detection cannot catch. The Behavioral Anomaly Detector is the ML layer of the detection stack: it catches novel attacks, insider threats, compromised agents, and slow-burn manipulation campaigns that have no known signature by identifying statistical deviation from established norms.

---

## Behavioral Profile Schema

```yaml
behavioral_profile:
  profile_id: BEH-{NNN}
  subject_type: AGENT | SESSION | WORKFLOW | API_CALLER
  subject_id: string
  
  baseline_window: integer                # days used to compute baseline
  last_updated: ISO8601
  profile_status: BUILDING | STABLE | DEGRADED | INVALIDATED
  
  # Agent behavioral dimensions
  agent_dimensions:
    action_frequency:
      actions_per_hour: {mean: float, stddev: float}
      peak_hour_distribution: [float]    # 24-element array; % of actions per hour
      
    resource_access:
      typical_data_classes: [string]
      typical_jurisdictions: [JUR-{XX}]
      access_volume_per_day: {mean: float, stddev: float}
      cross_border_frequency: float      # transfers per day
      
    permission_patterns:
      typical_permission_scopes: [string]
      escalation_frequency: float        # escalations per week
      denial_rate: float                 # % of permission requests denied
      
    api_call_patterns:
      typical_external_apis: [string]
      call_volume_per_hour: {mean: float, stddev: float}
      payload_size_distribution: {p50: integer, p95: integer, p99: integer}
      
    temporal_patterns:
      active_hours: [integer]            # hours of day (UTC) typically active
      active_days: [string]              # days of week typically active
      session_duration: {mean: float, stddev: float}
      
    collaboration_graph:
      typical_peer_agents: [string]      # agents frequently interacting with
      message_volume_per_day: {mean: float, stddev: float}
      
  # Session behavioral dimensions (for interactive/conversational agents)
  session_dimensions:
    constitutional_proximity_history:
      mean_proximity_score: float
      max_proximity_score: float
      proximity_trend: STABLE | INCREASING | DECREASING
      
    topic_distribution:
      typical_topic_clusters: [string]
      topic_drift_rate: float            # std deviation of topic embedding shift per turn
      
    instruction_complexity:
      mean_instruction_length: float
      complexity_score_distribution: {p50: float, p95: float}
      
    adversarial_signal_baseline:
      injection_attempt_rate: float      # known injection patterns per session
      role_play_frequency: float
      boundary_test_frequency: float
```

---

## Anomaly Detection Models

```yaml
anomaly_models:

  MODEL-BAD-001:
    name: "Agent Behavioral Isolation Forest"
    type: UNSUPERVISED_ML
    algorithm: Isolation Forest (contamination=0.01)
    features:
      - action_frequency_z_score
      - resource_access_deviation
      - permission_escalation_rate
      - api_call_volume_z_score
      - cross_border_frequency_delta
      - temporal_pattern_deviation
      - peer_graph_centrality_shift
    output: anomaly_score [0.0–1.0]
    training: 30-day rolling window; weekly retrain
    alert_threshold: anomaly_score > 0.75
    
  MODEL-BAD-002:
    name: "Session Trajectory LSTM"
    type: SEQUENCE_MODEL
    algorithm: LSTM autoencoder
    features:
      - per_turn_constitutional_proximity_score
      - per_turn_topic_embedding_vector
      - per_turn_instruction_complexity
      - per_turn_adversarial_signal_score
    sequence_length: 20 turns (sliding window)
    output: reconstruction_error [0.0–1.0]; trajectory_direction
    training: 7-day rolling window; daily retrain on synthetic + production sessions
    alert_threshold: reconstruction_error > 0.70 OR trajectory_direction == TOWARD_BOUNDARY
    
  MODEL-BAD-003:
    name: "Peer Network Graph Anomaly"
    type: GRAPH_ML
    algorithm: Graph Autoencoder (GAE)
    features:
      - agent_interaction_frequency
      - message_volume_per_pair
      - data_sharing_volume_per_pair
      - trust_score_per_pair
    output: edge_anomaly_score per agent pair
    alert_threshold: edge_anomaly_score > 0.80 for any pair involving flagged agent
    training: weekly retrain on interaction graph snapshot
    
  MODEL-BAD-004:
    name: "API Call Pattern Deviation"
    type: STATISTICAL
    algorithm: z-score + CUSUM control chart
    features:
      - call_volume_per_hour
      - unique_endpoint_count
      - payload_size_p95
      - error_rate
      - external_vs_internal_ratio
    output: deviation_score + CUSUM_statistic
    alert_threshold: deviation_score > 3.0 (3 sigma) OR CUSUM_statistic > control_limit
    
  MODEL-BAD-005:
    name: "Constitutional Proximity Trend Detector"
    type: STATISTICAL + RULE
    algorithm: Mann-Kendall trend test + monotonicity check
    input: per-session constitutional_proximity_score sequence
    output:
      trend_direction: INCREASING | STABLE | DECREASING
      trend_significance: p_value
      monotonic_increase_detected: boolean
      turns_to_threshold: integer | null    # estimated turns to reach 0.85
    alert_conditions:
      - trend INCREASING with p < 0.05 AND proximity > 0.50
      - monotonic_increase detected across >= 3 turns reaching > 0.60
      - turns_to_threshold < 5
```

---

## Anomaly Scoring and Fusion

```
compute_composite_anomaly_score(subject_id, observation_window):

  scores = {}
  
  scores.behavioral  = MODEL-BAD-001.score(subject_id)
  scores.session     = MODEL-BAD-002.score(active_session(subject_id)) if session_active
  scores.network     = MODEL-BAD-003.score(subject_id)
  scores.api         = MODEL-BAD-004.score(subject_id)
  scores.proximity   = MODEL-BAD-005.score(active_session(subject_id)) if session_active
  
  # Weighted fusion
  composite = (
    scores.behavioral  * 0.30 +
    scores.session     * 0.25 +
    scores.network     * 0.15 +
    scores.api         * 0.15 +
    scores.proximity   * 0.15
  )
  
  # Override conditions
  if scores.proximity.monotonic_increase_detected:
    composite = max(composite, 0.75)    # hard floor; constitutional concern
    
  if scores.behavioral > 0.90 AND scores.api > 0.80:
    composite = max(composite, 0.90)    # dual-model high confidence
    
  Return: composite, scores, contributing_factors
```

---

## Baseline Management

```yaml
baseline_management:

  initialization:
    new_agent_grace_period: 14 days     # BUILDING status; no anomaly alerts
    minimum_observations: 500           # actions before STABLE profile
    
  stability_requirements:
    STABLE:
      minimum_days: 14
      minimum_observations: 500
      coefficient_of_variation: < 0.40  # profile must be reasonably stable
      
  invalidation_triggers:
    - role_change (agent capability scope changes significantly)
    - credential_reset (new identity; start fresh)
    - post_incident_remediation (compromised profile; discard)
    - explicit_T3_invalidation
    
  drift_adaptation:
    gradual_drift: exponential moving average (α=0.05); profile adapts slowly to legitimate drift
    sudden_shift: if new_behavior_sustained_3_days AND no security incident: create candidate profile; T3 review
    adversarial_drift: if drift coincides with security event: do NOT adapt profile; flag for forensics
    
  profile_storage:
    location: memory/threat-detection/behavioral-profiles/
    format: JSONL (one profile snapshot per day)
    retention: 90 days of daily snapshots; permanent retention for profiles associated with incidents
```

---

## Alert Generation

```yaml
anomaly_alert_thresholds:

  CRITICAL (score > 0.85):
    action: create alert → security-alert-manager; anomaly_score included in enrichment
    routing: T2 minimum; constitutional anomalies → T3 + constitutional quorum notification
    auto_actions:
      - if score > 0.90: flag_agent_for_enhanced_monitoring
      - if proximity_anomaly: notify_constitutional_quorum
      
  HIGH (score 0.70–0.85):
    action: create alert → security-alert-manager
    routing: T1 with T2 notification
    
  MEDIUM (score 0.55–0.70):
    action: log to anomaly store; if sustained 6hr: create LOW alert
    
  LOW (score 0.40–0.55):
    action: log to anomaly store; contribute to correlation engine context
    
  suppression:
    known_maintenance_windows: suppress behavioral anomalies during scheduled maintenance
    new_agent_grace: suppress MODEL-BAD-001 alerts during BUILDING profile period
    
  constitutional_anomalies:
    no_suppression: proximity trend anomalies (MODEL-BAD-005) are NEVER suppressed
    always_alert: even during maintenance windows; even for new agents
```

---

## Explainability

```yaml
explainability:
  requirement: every anomaly alert MUST include top-3 contributing features with direction
  
  output_format:
    anomaly_explanation:
      composite_score: float
      top_contributors:
        - feature: string
          contribution_weight: float
          observed_value: string
          baseline_value: string
          direction: ABOVE_BASELINE | BELOW_BASELINE
      plain_language_summary: string    # one sentence for analyst
      
  example:
    feature: "api_call_volume_per_hour"
    contribution_weight: 0.38
    observed_value: "847 calls/hr"
    baseline_value: "12 calls/hr (±3)"
    direction: ABOVE_BASELINE
    plain_language_summary: "Agent made 70× normal API calls in the last hour, consistent with data staging or model extraction."
```

---

## Integration

```
Feeds into:
  security-event-correlator.md — anomaly scores feed COR-010 coordinated attack detection
  security-alert-manager.md — CRITICAL/HIGH anomaly alerts enter here
  security-metrics-dashboard.md — anomaly detection metrics surfaced here
  insider-threat-detector.md — behavioral anomaly scores inform insider threat risk

Receives from:
  canonical-event-schema.md — all agent actions consumed for behavioral profiling
  constitutional-governor-quorum.md — constitutional proximity scores consumed here
  cross-agent-trust-accumulation.md — trust score changes feed network anomaly model
```

---

## Governance

**No profile suppression for constitutional anomalies:** Constitutional proximity trend detector (MODEL-BAD-005) runs on every session regardless of profile status or maintenance windows  
**Baseline invalidation authority:** T3 SOC for post-incident invalidations; automated for role changes  
**Profile data sovereignty:** Behavioral profiles stored in agent's jurisdiction SEZ; cross-entity aggregation uses anonymized feature vectors only  
**Model retraining gate:** Retrained models require performance validation (AUC > 0.80 on held-out incident data) before deployment; training on adversarial samples prohibited without T4 approval  
**Audit:** All anomaly scores and alert decisions to `memory/threat-detection/anomaly-audit.jsonl`; 7-year retention
