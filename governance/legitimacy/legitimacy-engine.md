# Legitimacy Engine
**ID:** LGT-ENG-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Master coordinator for enterprise AI legitimacy — continuously measuring, defending, and reporting on whether the OS's authority, governance structures, and AI decision-making are perceived as valid, justified, and acceptable by all stakeholders. Legitimacy is not a binary state; it is an earned, observable, and fragile organizational property. This engine aggregates legitimacy signals from four subsystems — explainable authority, governance transparency, organizational trust, and constitutional legitimacy — to produce a unified legitimacy posture that informs governance decisions, shapes communication strategy, and triggers remediation when legitimacy is at risk.

---

## Legitimacy Taxonomy

```yaml
legitimacy_taxonomy:

  PROCEDURAL_LEGITIMACY:
    definition: authority is legitimate because it was granted and exercised
                through processes that are fair, consistent, and transparent
    signals: governance process adherence rate, decision explanation coverage,
             appeal resolution rate, procedural complaint volume
    failure_mode: governance that bypasses defined process even for good outcomes
    
  SUBSTANTIVE_LEGITIMACY:
    definition: authority is legitimate because outcomes are good, fair, and
                aligned with organizational values and stakeholder interests
    signals: decision outcome satisfaction rates, value alignment assessments,
             employee impact surveys, fairness perception scores
    failure_mode: technically correct decisions that are perceived as unjust
    
  CONSTITUTIONAL_LEGITIMACY:
    definition: authority is legitimate because it derives from a foundational
                document that was itself consented to, is publicly known, and
                constrains all actors including those with highest authority
    signals: constitution ratification state, amendment process integrity,
             constitutional compliance rate, citizen awareness scores
    failure_mode: authority acting outside constitutional mandate
    
  DEMOCRATIC_LEGITIMACY:
    definition: authority is legitimate because it incorporates representative
                voice, participatory input, and is accountable to those it governs
    signals: participation rates, representative coverage, feedback incorporation
             rate, council deliberation quality scores
    failure_mode: governance that concentrates decision-making without consent
    
  EXPERTISE_LEGITIMACY:
    definition: authority is legitimate because the agents and systems exercising
                it demonstrably understand the domain, are calibrated, and
                acknowledge the limits of their knowledge
    signals: calibration ECE scores, uncertainty disclosure rates, expertise
             certification coverage, hallucination detection rates
    failure_mode: AI systems presenting false confidence or overreaching capability claims
```

---

## Legitimacy Posture Score

```
compute_legitimacy_posture():

  # Component scores from subsystems
  authority_score    = explainable_authority_system.get_score()
  transparency_score = governance_transparency_system.get_score()
  trust_score        = organizational_trust_mechanisms.get_score()
  constitutional_score = constitutional_legitimacy_system.get_score()

  # Weighted composite
  posture_score = (
    constitutional_score * 0.30 +   # Constitutional legitimacy is load-bearing
    transparency_score   * 0.25 +
    trust_score          * 0.25 +
    authority_score      * 0.20
  )

  # Hard overrides
  if constitutional_score < 0.50:
    posture_score = min(posture_score, 0.40)
    # Constitutional breach caps legitimacy regardless of other scores

  if transparency_score < 0.40:
    posture_score = min(posture_score, 0.55)
    # Opacity disqualifies governance from claiming high legitimacy

  rag = GREEN if posture_score >= 0.80 else AMBER if posture_score >= 0.60 else RED

  # Trend analysis
  trend = compute_7d_trend(posture_score, historical_scores)

  Return: LegitimacyPosture {
    score: posture_score,
    rag: rag,
    trend: trend,
    components: { authority_score, transparency_score, trust_score, constitutional_score },
    computed_at: now()
  }
```

---

## Legitimacy Threat Detection

```yaml
legitimacy_threat_rules:

  LGT-001:
    name: "Authority Exercise Without Explanation"
    condition: |
      T3+ decision made WHERE:
        decision.explanation IS NULL
        OR decision.explanation.quality_score < 0.60
        AND decision.impact_tier >= SIGNIFICANT
    severity: HIGH
    auto_action: flag_decision_for_explanation_supplement; alert_T3; log_transparency_gap
    
  LGT-002:
    name: "Governance Process Bypass"
    condition: |
      outcome achieved WHERE:
        required_governance_process NOT in execution_trace
        AND no authorized_exception_record EXISTS
    severity: CRITICAL
    auto_action: invalidate_outcome_if_reversible; alert_T4; mandatory_process_retrospective
    
  LGT-003:
    name: "Constitutional Compliance Decline"
    condition: |
      constitutional_compliance_rate(window=30_days) < 0.97
      OR 3 consecutive weeks of declining compliance trend
    severity: CRITICAL
    auto_action: alert_T4; freeze_new_AI_autonomy_grants; board_legitimacy_briefing
    
  LGT-004:
    name: "Stakeholder Trust Score Below Threshold"
    condition: |
      organizational_trust_score < 0.55
      AND trust_trend = DECLINING
      AND trust_decline_rate > 0.05_per_week
    severity: HIGH
    auto_action: alert_T3; trigger_trust_recovery_protocol; executive_communication_review
    
  LGT-005:
    name: "Participation Rate Collapse"
    condition: |
      governance_participation_rate(window=30_days) < 0.25
      (fewer than 1 in 4 eligible stakeholders are engaging with governance)
    severity: HIGH
    auto_action: alert_T3; governance_accessibility_review; outreach_campaign_trigger
    
  LGT-006:
    name: "Legitimacy Score Sustained RED"
    condition: |
      legitimacy_posture.rag = RED
      FOR >= 7 consecutive days
    severity: CRITICAL
    auto_action: alert_T4_T5; convene_legitimacy_crisis_committee; governance_pause_assessment
    # A sustained RED legitimacy posture is a governance emergency
```

---

## Legitimacy Measurement Cycle

```
run_legitimacy_measurement_cycle():
  # Scheduled: daily full cycle; real-time on governance events

  # Collect fresh signals from all subsystems
  authority_signals    = explainable_authority_system.collect_signals()
  transparency_signals = governance_transparency_system.collect_signals()
  trust_signals        = organizational_trust_mechanisms.collect_signals()
  constitutional_signals = constitutional_legitimacy_system.collect_signals()

  # Aggregate and score
  posture = compute_legitimacy_posture()

  # Threat scan
  threats = run_threat_scan(posture, all_signals)

  # Publish legitimacy report
  report = LegitimacyReport {
    id: "LGT-RPT-{NNN}",
    posture: posture,
    threats: threats,
    signal_summary: aggregate_signals(all_signals),
    recommended_actions: generate_recommendations(posture, threats),
    published_at: now()
  }

  publish_to_governance_dashboard(report)
  publish_to_board_intelligence_system(report)
  audit_log(report, "memory/legitimacy-systems/legitimacy-audit.jsonl")

  # Escalate if warranted
  if posture.rag == RED or threats.has_CRITICAL:
    escalate_to_T4(report)

  Return: report
```

---

## Legitimacy Communication Protocol

```yaml
legitimacy_communication_protocol:

  ROUTINE (GREEN posture):
    frequency: monthly legitimacy digest to all stakeholders
    format: plain-language summary of governance decisions, participation stats,
            constitutional compliance rates, trust scores with trend
    audience: all employees + external stakeholders with governance interest
    
  WATCH (AMBER posture):
    frequency: weekly legitimacy briefing + targeted outreach to low-trust segments
    additional: executive acknowledgment of concerns + remediation timeline
    transparency: proactive disclosure of contributing factors without spin
    
  CRISIS (RED posture):
    frequency: immediate notification to T4/T5 + board; daily stakeholder update
    required_actions:
      - open acknowledgment of legitimacy concern (no concealment)
      - published remediation plan with milestones and accountable owners
      - enhanced participation opportunities (emergency consultation sessions)
      - independent review invitation (if sustained > 14 days)
    principles:
      - NO suppression of negative legitimacy signals
      - NO framing that minimizes stakeholder concern
      - Human decision-makers visible and accountable (not AI proxies)
```

---

## Integration

```
Feeds into:
  democratic-governance/democratic-governance-engine.md — legitimacy score informs governance intensity
  consent-governance/consent-governance-engine.md — legitimacy shapes consent requirements
  social-stability/social-stability-engine.md — legitimacy signals feed stability model
  compound-intelligence/compound-intelligence-engine.md — legitimacy as governance health signal
  executive-intelligence/board-intelligence-system.md — board-level legitimacy reporting

Receives from:
  legitimacy-systems/explainable-authority-systems.md — authority explanation quality
  legitimacy-systems/governance-transparency.md — transparency scores and gaps
  legitimacy-systems/organizational-trust-mechanisms.md — trust scores and trends
  legitimacy-systems/constitutional-legitimacy-systems.md — constitutional compliance
  consent-governance/employee-consent-frameworks.md — consent rates and refusals
  democratic-governance/participatory-governance-systems.md — participation rates
```

---

## Governance

**Legitimacy cannot be manufactured:** No communications campaign, framing exercise, or governance restructuring that does not change actual behavior can improve the legitimacy posture score; the score is derived from behavioral and outcome signals, not stated intentions  
**RED legitimacy posture suspends new autonomous expansions:** While the OS legitimacy posture is RED, no new grants of autonomous authority to AI systems are made; existing grants continue under enhanced monitoring  
**All legitimacy signals are human-verified:** The inputs to the legitimacy posture score include direct human surveys, participation counts, and disclosed conflict rates; AI-generated sentiment proxies are supplementary only and cannot constitute more than 20% of signal weight  
**Audit:** All legitimacy engine events and reports to `memory/legitimacy-systems/legitimacy-audit.jsonl`; permanent retention
