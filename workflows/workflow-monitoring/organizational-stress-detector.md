# Organizational Stress Detector

**System ID:** `organizational-stress-detector`
**Role:** Detects organizational stress patterns across agent orgs — identifies escalation spikes, knowledge gap accumulation, decision paralysis, quality degradation, and capacity saturation; classifies stress levels per org and enterprise-wide, and generates actionable stress reports for organizational health management
**Storage:** `memory/workflow-monitoring/stress-state.yaml`

---

## Purpose

Organizations under stress show patterns before they fail. Escalation rates climb. Decision cycles slow. Knowledge gaps accumulate as agents stop updating the wiki under load pressure. Output quality drops as agents rush through gates. The organizational stress detector watches for these multi-signal stress patterns — not just individual metric alerts, but the confluence of signals that indicate a system under genuine pressure — and classifies the stress level so the right intervention can be applied.

---

## Stress Indicators

```yaml
StressIndicators:
  
  ESCALATION_SURGE:
    signal: escalation_rate
    normal_threshold: 0.05          # < 5 escalations per 100 tasks = normal
    elevated_threshold: 0.10
    high_threshold: 0.20
    critical_threshold: 0.35
    sustained_windows: 3            # Must be elevated for 3 consecutive measurement windows
    weight: 0.25
  
  KNOWLEDGE_GAP_ACCUMULATION:
    signal: knowledge_gap_count and wiki_staleness_score
    detection_method: "rate_of_change"    # Gaps growing faster than they're closed
    growth_rate_threshold: 0.10     # > 10% growth per day = signal
    staleness_threshold: 0.60       # Staleness score > 0.60 = signal
    weight: 0.15
  
  DECISION_PARALYSIS:
    signal: decision_blocked_rate and decision_cycle_time_ms
    blocked_rate_threshold: 0.25    # > 25% of decisions blocked
    cycle_time_multiplier: 2.0      # > 2× baseline cycle time
    weight: 0.20
  
  QUALITY_DEGRADATION:
    signal: gate_pass_rate (per org output)
    normal_threshold: 0.80
    degraded_threshold: 0.65
    critical_threshold: 0.50
    weight: 0.20
  
  CAPACITY_SATURATION:
    signal: agent_utilization_rate and queue_depth
    saturation_threshold: 0.90      # > 90% utilization
    queue_depth_threshold: 15       # > 15 pending tasks
    weight: 0.20
```

---

## Stress Detection Engine

```
StressAssessment:
  org_id: string
  stress_level: "NORMAL | ELEVATED | HIGH | CRITICAL"
  composite_stress_score: float    # 0.0 (no stress) to 1.0 (maximum stress)
  active_indicators: [StressSignal]
  pattern_type: "ISOLATED | COMPOUND | CASCADING | null"
  
  # Context
  duration_minutes: float          # How long this stress pattern has persisted
  trajectory: "WORSENING | STABLE | IMPROVING"
  
  # Risk assessment
  cascade_risk: boolean            # Stress likely to spread to connected orgs
  intervention_recommended: string | null

StressSignal:
  indicator_id: string
  current_value: float
  threshold: float
  severity: "ELEVATED | HIGH | CRITICAL"
  sustained_windows: integer

detect_organizational_stress() → [StressAssessment]:
  
  # Load org health metrics
  org_metrics = organizational_health_telemetry.get_latest_snapshot()
  
  assessments = []
  
  FOR org_id in get_all_org_ids():
    
    active_indicators = []
    
    # Check each stress indicator
    
    # 1. Escalation surge
    esc_rate = org_metrics.escalations.rate_by_org.get(org_id, 0.0)
    IF esc_rate > STRESS_INDICATORS.ESCALATION_SURGE.normal_threshold:
      severity = classify_threshold(esc_rate, STRESS_INDICATORS.ESCALATION_SURGE)
      active_indicators.append(StressSignal(
        indicator_id = "ESCALATION_SURGE",
        current_value = esc_rate,
        threshold = STRESS_INDICATORS.ESCALATION_SURGE.elevated_threshold,
        severity = severity,
        sustained_windows = count_sustained_windows(org_id, "escalation_rate", esc_rate)
      ))
    
    # 2. Knowledge gap accumulation
    wiki_staleness = org_metrics.knowledge.staleness_by_org.get(org_id, 0.0)
    knowledge_gaps = org_metrics.knowledge.open_knowledge_gaps
    IF wiki_staleness > STRESS_INDICATORS.KNOWLEDGE_GAP_ACCUMULATION.staleness_threshold:
      active_indicators.append(StressSignal(
        indicator_id = "KNOWLEDGE_GAP_ACCUMULATION",
        current_value = wiki_staleness,
        threshold = STRESS_INDICATORS.KNOWLEDGE_GAP_ACCUMULATION.staleness_threshold,
        severity = "HIGH" if wiki_staleness > 0.75 else "ELEVATED",
        sustained_windows = 1    # Staleness is not windowed
      ))
    
    # 3. Decision paralysis
    decision_blocked = org_metrics.decisions.get("blocked_rate_by_org", {}).get(org_id, 0.0)
    IF decision_blocked > STRESS_INDICATORS.DECISION_PARALYSIS.blocked_rate_threshold:
      active_indicators.append(StressSignal(
        indicator_id = "DECISION_PARALYSIS",
        current_value = decision_blocked,
        threshold = STRESS_INDICATORS.DECISION_PARALYSIS.blocked_rate_threshold,
        severity = "HIGH" if decision_blocked > 0.40 else "ELEVATED",
        sustained_windows = count_sustained_windows(org_id, "decision_blocked_rate", decision_blocked)
      ))
    
    # 4. Capacity saturation
    utilization = org_metrics.utilization.by_org.get(org_id, 0.0)
    queue_depth = org_metrics.queues.by_org.get(org_id, 0)
    IF utilization > STRESS_INDICATORS.CAPACITY_SATURATION.saturation_threshold:
      active_indicators.append(StressSignal(
        indicator_id = "CAPACITY_SATURATION",
        current_value = utilization,
        threshold = STRESS_INDICATORS.CAPACITY_SATURATION.saturation_threshold,
        severity = "CRITICAL" if utilization > 0.97 else "HIGH" if utilization > 0.93 else "ELEVATED",
        sustained_windows = count_sustained_windows(org_id, "utilization_rate", utilization)
      ))
    
    IF NOT active_indicators:
      CONTINUE    # Org is healthy — skip assessment record
    
    # Compute composite stress score
    composite_stress = compute_composite_stress(active_indicators)
    
    # Classify pattern
    pattern = classify_stress_pattern(active_indicators)
    cascade_risk = assess_cascade_risk(org_id, active_indicators)
    
    assessment = StressAssessment(
      org_id = org_id,
      stress_level = classify_stress_level(composite_stress),
      composite_stress_score = composite_stress,
      active_indicators = active_indicators,
      pattern_type = pattern,
      duration_minutes = get_stress_duration_minutes(org_id),
      trajectory = compute_trajectory(org_id),
      cascade_risk = cascade_risk,
      intervention_recommended = recommend_intervention(composite_stress, pattern, active_indicators)
    )
    
    assessments.append(assessment)
    
    # Publish stress signal to enterprise event bus
    IF composite_stress > 0.40:
      enterprise_event_bus.publish(
        topic = "org.capacity.signals",
        event_type = "ORG_STRESS_SIGNAL",
        payload = {
          org_id: org_id,
          stress_level: assessment.stress_level,
          stress_score: composite_stress,
          active_indicators: [i.indicator_id for i in active_indicators],
          cascade_risk: cascade_risk
        },
        priority = "HIGH" if composite_stress > 0.65 else "NORMAL"
      )
  
  # Enterprise-wide compound stress detection
  enterprise_assessment = detect_enterprise_compound_stress(assessments)
  IF enterprise_assessment:
    assessments.append(enterprise_assessment)
  
  persist_stress_assessments(assessments)
  RETURN assessments

classify_stress_pattern(indicators) → str:
  IF len(indicators) == 1:
    RETURN "ISOLATED"
  IF len(indicators) >= 3:
    IF any(i.indicator_id == "CAPACITY_SATURATION" for i in indicators):
      RETURN "CASCADING"   # Saturation + multiple other signals = likely cascading
    RETURN "COMPOUND"
  RETURN "COMPOUND"

detect_enterprise_compound_stress(org_assessments) → StressAssessment | null:
  
  high_stress_orgs = [a for a in org_assessments if a.stress_level in ["HIGH", "CRITICAL"]]
  
  IF len(high_stress_orgs) >= 3:
    RETURN StressAssessment(
      org_id = "ENTERPRISE",
      stress_level = "CRITICAL" if any(a.stress_level == "CRITICAL" for a in high_stress_orgs) else "HIGH",
      composite_stress_score = MEAN([a.composite_stress_score for a in high_stress_orgs]),
      active_indicators = [],
      pattern_type = "CASCADING",
      cascade_risk = True,
      intervention_recommended = "enterprise-wide-stress-response"
    )
  
  RETURN null

recommend_intervention(stress_score, pattern, indicators) → str:
  IF stress_score > 0.80:
    RETURN "immediate-executive-escalation"
  IF pattern == "CASCADING" AND stress_score > 0.60:
    RETURN "org-capacity-rebalancing-workflow"
  IF "DECISION_PARALYSIS" in [i.indicator_id for i in indicators]:
    RETURN "governance-unblock-review"
  IF "CAPACITY_SATURATION" in [i.indicator_id for i in indicators]:
    RETURN "capacity-injection-or-load-shedding"
  IF "KNOWLEDGE_GAP_ACCUMULATION" in [i.indicator_id for i in indicators]:
    RETURN "wiki-maintenance-workflow"
  RETURN "org-health-review"
```

---

## Integration

**Called by:**
- Subscription to `org.capacity.signals`, `org.escalation.events`
- `enterprise-telemetry/runtime-trigger-engine.md` — multi-org stress trigger
- `operational-command-center/enterprise-operations-console.md` — org stress panel

**Calls:**
- `enterprise-telemetry/organizational-health-telemetry.md` — org health metrics
- `enterprise-telemetry/enterprise-event-bus.md` — publishes stress signals

**Writes to:** `memory/workflow-monitoring/stress-state.yaml`
