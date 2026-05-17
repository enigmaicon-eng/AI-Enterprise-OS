# Strategic Manipulation Defense
**ID:** ADF-SMP-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Detects and neutralizes coordinated attempts to manipulate the enterprise's strategic direction, organizational priorities, governance outcomes, or decision-making processes through subtle, non-technical influence attacks. Unlike prompt injection (which targets individual agent reasoning), strategic manipulation operates at the organizational level — gradually shifting priorities, narratives, or governance posture to serve adversarial objectives over time.

---

## Strategic Manipulation Threat Model

```yaml
strategic_manipulation_taxonomy:

  NARRATIVE_INJECTION:
    definition: introducing false or misleading information into the enterprise knowledge base,
                intelligence reports, or strategic briefings to shape decision-making
    attack_vectors:
      - poisoning the strategic intelligence fusion layer with fabricated market signals
      - injecting false competitive intelligence to trigger misdirected investment
      - corrupting scenario planning models with biased assumptions
      - inserting false incident postmortem findings to erode trust in specific systems
    detection_window: days to weeks
    severity: CRITICAL
    
  GOAL_SUBSTITUTION:
    definition: gradually replacing the enterprise's genuine objectives with adversary-defined
                substitutes through repeated small adjustments to OKRs, roadmaps, or priorities
    attack_vectors:
      - micro-modifications to OKR definitions across multiple update cycles
      - portfolio reprioritization to deprioritize security or compliance work
      - roadmap manipulation to delay threat remediation features
      - aligning recommendation patterns to steer initiative approvals toward adversary benefit
    detection_window: sprints to quarters
    severity: CRITICAL
    
  TRUST_NETWORK_MANIPULATION:
    definition: systematic manipulation of the agent trust network to elevate adversary-controlled
                agents and isolate legitimate high-trust agents
    attack_vectors:
      - endorsement flooding of compromised agents to inflate their trust scores
      - warning suppression for agents exhibiting rogue behavior
      - collaboration pattern manipulation to isolate trustworthy agents
      - delegate-and-elevate: chain-delegating through low-trust agents to reach high-authority operations
    detection_window: hours to days
    severity: HIGH
    
  GOVERNANCE_NARRATIVE_CAPTURE:
    definition: capturing the framing of governance discussions to systematically bias
                constitutional interpretations, policy decisions, or compliance assessments
    attack_vectors:
      - loading governance discussions with pre-framed context that biases interpretation
      - controlling the set of evidence presented to approval committees
      - manipulating the order and framing of policy options to favor adversary-preferred choices
      - introducing linguistic drift in governance artifact language that weakens protections
    detection_window: weeks to months
    severity: CRITICAL
    
  PRIORITY_INVERSION:
    definition: systematically inverting the enterprise's priority ordering so high-risk
                items are deprioritized and low-value items consume resources
    attack_vectors:
      - manipulating urgency signals to hide critical security items
      - manufacturing false P0 issues to distract from real vulnerabilities
      - gaming the prioritization scoring model to suppress security work
      - inserting synthetic backlog items that consume governance review bandwidth
    detection_window: sprints
    severity: HIGH
```

---

## Detection Rules

```yaml
strategic_manipulation_rules:

  SMP-001:
    name: "Strategic Intelligence Injection Detection"
    condition: |
      intelligence_report.source_count < 3 (insufficient corroboration)
      AND intelligence_report.confidence > 0.80 (suspiciously high confidence for few sources)
      AND intelligence_report.strategic_impact = HIGH | CRITICAL
    severity: HIGH
    auto_action: hold_report_pending_T3_review; alert_T2; require_source_verification
    
  SMP-002:
    name: "OKR Drift Accumulation"
    condition: |
      semantic_drift(current_okr_definition, original_okr_definition) > 0.25
      ACROSS >= 3 consecutive sprint cycles
      WITHOUT T4-approved strategic pivot record
    severity: HIGH
    auto_action: freeze_okr_updates; alert_T3; flag_for_strategic_review
    
  SMP-003:
    name: "Security Work Suppression Pattern"
    condition: |
      OVER rolling_90_days:
        security_related_items_deprioritized_count / total_deprioritized_count > 0.60
        AND security_related_items_approved_count / total_approved_count < 0.20
    severity: CRITICAL
    auto_action: alert_T3; security_posture_review; T4_notification
    # Pattern: adversary systematically deprioritizing security to increase attack surface
    
  SMP-004:
    name: "Governance Framing Capture"
    condition: |
      governance_decision_inputs ANALYZED_FOR framing_bias_score
      WHERE framing_bias_score > 0.70 (heavily one-sided presentation)
      AND decision_outcome CORRELATES_WITH biased_framing_direction in > 70% of cases over 30 days
    severity: CRITICAL
    auto_action: flag_governance_process; alert_T3; adversarial_audit_of_recent_decisions
    
  SMP-005:
    name: "Trust Score Manipulation Pattern"
    condition: |
      OVER 7_DAYS:
        endorsement_rate(agent_id=X) > 3× historical_endorsement_rate(X)
        AND warning_suppression_rate_for_peers(X) > 0.40
    severity: HIGH
    auto_action: freeze_trust_updates_for_X; alert_T3; trust_network_audit
    
  SMP-006:
    name: "Priority Inversion Detection"
    condition: |
      COMPUTE priority_alignment_score:
        correlate item_risk_score with item_priority_position
        target: HIGH_RISK items should have HIGH priority (positive correlation)
      IF correlation < 0 (inverse correlation): priority_inversion_suspected
      IF correlation < -0.30 (strong inverse): priority_inversion_confirmed
    severity: HIGH
    auto_action: alert_T3; suspend_prioritization_engine; manual_priority_review
    
  SMP-007:
    name: "Synthetic Backlog Injection"
    condition: |
      backlog_items created_by same_agent OR same_recommendation_engine
      WITHIN 48_HOURS: count > 20
      AND avg_business_value_score < 0.30
      AND avg_urgency_score > 0.80 (low value but high urgency — attention capture)
    severity: HIGH
    auto_action: hold_injected_items; alert_T2; source_investigation
```

---

## Narrative Integrity Scanner

```
scan_intelligence_for_narrative_injection(report):

  # Check 1: Source diversity
  source_count     = count_distinct_sources(report)
  source_diversity = compute_source_diversity(report.sources)  # domain, type, jurisdiction spread
  
  if source_count < 3 OR source_diversity < 0.40:
    flag_low_corroboration(report)
    
  # Check 2: Confidence-evidence alignment
  confidence_score    = report.confidence
  evidence_support    = compute_evidence_support_score(report)
  confidence_gap      = confidence_score - evidence_support
  
  if confidence_gap > 0.30:
    flag_confidence_inflation(report, gap=confidence_gap)
    
  # Check 3: Semantic consistency with historical intelligence
  historical_baseline = retrieve_historical_intelligence(report.domain, lookback=90)
  semantic_delta      = compute_semantic_delta(report, historical_baseline)
  
  if semantic_delta > 0.40:
    flag_narrative_discontinuity(report, delta=semantic_delta)
    
  # Check 4: Strategic impact assessment
  if report.strategic_impact == CRITICAL AND any_flags_above:
    trigger_SMP_001(report)
    hold_report_pending_review()
    
  Return: narrative_integrity_score
```

---

## OKR Integrity Monitor

```
monitor_okr_integrity():
  # Runs on every OKR update event

  for each okr in active_okrs:
    original_definition = get_original_okr_definition(okr.id)
    current_definition  = okr.current_definition
    
    drift = compute_semantic_drift(original_definition, current_definition)
    okr.drift_score = drift
    okr.drift_accumulation.append({sprint: current_sprint, drift: drift})
    
    # Check for sustained drift without authorization
    recent_drift = [d for d in okr.drift_accumulation if d.sprint >= current_sprint - 3]
    avg_recent_drift = mean([d.drift for d in recent_drift])
    
    if avg_recent_drift > 0.25:
      authorized_pivot = get_strategic_pivot_record(okr.id, since=3_sprints_ago)
      if NOT authorized_pivot:
        trigger_SMP_002(okr, drift=avg_recent_drift)
```

---

## Governance Framing Analysis

```
analyze_governance_framing(decision_context):

  # Detect presentation bias in governance inputs
  framing_dimensions = [
    option_ordering_bias(decision_context.options),
    evidence_selection_bias(decision_context.evidence),
    language_valence_analysis(decision_context.narrative),
    alternative_suppression(decision_context.options, known_alternatives)
  ]
  
  framing_bias_score = aggregate_framing_bias(framing_dimensions)
  
  if framing_bias_score > 0.70:
    trigger_SMP_004(decision_context, score=framing_bias_score)
    
  Return: framing_bias_score, framing_dimensions
```

---

## Integration

```
Feeds into:
  adversarial-defense-engine.md — CLASS_2 and CLASS_4 strategic manipulation signals
  strategic-intelligence/strategic-intelligence-engine.md — narrative injection alerts
  strategic-alignment/strategic-drift-detector.md — OKR drift correlation
  governance/constitutional-governor-quorum.md — governance framing capture alerts

Receives from:
  strategic-intelligence/intelligence-fusion-layer.md — intelligence report feeds
  strategic-alignment/okr-intelligence-engine.md — OKR definition updates
  approval-operations/approval-workflow-engine.md — governance decision input packages
  trust/cross-agent-trust-accumulation.md — trust score change events
  optimization-engine/optimization-registry.md — prioritization decisions
```

---

## Governance

**Strategic intelligence held on flag:** Any report flagged by SMP-001 is withheld from distribution until T3 manually clears it; no strategic decision may cite a held report  
**OKR freeze on drift:** Once SMP-002 fires, no further OKR updates are processed until T4 strategic review confirms or reverses the drift  
**Historical records are tamper-evident:** All governance decision context packages are hash-chained; post-hoc modification of the record triggers automatic CRITICAL alert  
**Audit:** All strategic manipulation detections to `memory/adversarial-defense/strategic-manipulation-audit.jsonl`; 10-year retention
