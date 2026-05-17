# Democratic Governance Engine
**ID:** DGV-ENG-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Master coordinator for enterprise democratic governance — ensuring that the people subject to AI governance have meaningful, ongoing voice in how that governance is designed, adjusted, and constrained. Democratic governance is not a feature layered on top of technical governance; it is the source of governance legitimacy. This engine integrates participatory processes, representative oversight, review councils, and constitutional amendment systems to produce a unified democratic health score and to ensure that governance authority continuously renews itself through demonstrated consent of the governed.

---

## Democratic Governance Taxonomy

```yaml
democratic_governance_dimensions:

  PARTICIPATORY_VOICE:
    definition: those governed have genuine, ongoing opportunities to influence
                governance decisions — not just consultation theater
    measurement: participation rate; input incorporation rate; governance response
                 quality; perceived voice effectiveness
    minimum_threshold: >= 0.30 participation rate for major governance decisions
    weight: 0.30

  REPRESENTATIVE_ACCOUNTABILITY:
    definition: designated representatives of employee groups are empowered,
                informed, and genuinely accountable to those they represent
    measurement: representative coverage; mandate renewal rate; constituent
                 communication frequency; representative recall mechanism utilization
    weight: 0.25

  DELIBERATIVE_QUALITY:
    definition: governance decisions are made through genuine deliberation —
                weighing evidence, considering minority views, applying principles
                consistently — not through procedural formality that ratifies
                pre-decided outcomes
    measurement: deliberation quality score; dissent record rate; decision
                 independence from AI recommendations; minority view accommodation rate
    weight: 0.25

  CONSTITUTIONAL_ACCOUNTABILITY:
    definition: all governance actors operate within constitutional bounds;
                the constitution is not merely aspirational but enforceable;
                those who breach it face consequences
    measurement: constitutional compliance rate; violation accountability rate;
                 amendment process utilization (as evidence it works)
    weight: 0.20
```

---

## Democratic Health Score

```
compute_democratic_health_score():

  participatory_voice       = get_participatory_voice_score()
  representative_accountability = get_representative_accountability_score()
  deliberative_quality      = get_deliberative_quality_score()
  constitutional_accountability = get_constitutional_accountability_score()

  health_score = (
    participatory_voice           * 0.30 +
    representative_accountability * 0.25 +
    deliberative_quality          * 0.25 +
    constitutional_accountability * 0.20
  )

  # Hard floor: constitutional accountability is non-negotiable
  if constitutional_accountability < 0.70:
    health_score = min(health_score, 0.60)

  # Participation collapse floor
  if participatory_voice < 0.40:
    health_score = min(health_score, 0.65)
    # A governance system without participation is not democratic

  rag = GREEN if health_score >= 0.80 else AMBER if health_score >= 0.60 else RED

  Return: DemocraticHealthScore {
    overall: health_score,
    rag: rag,
    components: {
      participatory_voice, representative_accountability,
      deliberative_quality, constitutional_accountability
    },
    computed_at: now()
  }
```

---

## Democratic Deficit Detection

```
detect_democratic_deficits():
  # Identifies patterns that hollow out democratic governance even when structures exist

  deficits = []

  # Deficit 1: Consultation theater
  # Input is sought but systematically ignored
  recent_consultations = get_consultations(window=90_days)
  incorporation_rate   = mean([c.input_incorporation_rate for c in recent_consultations])
  if incorporation_rate < 0.25:
    deficits.append(DemocraticDeficit {
      type: CONSULTATION_THEATER,
      evidence: incorporation_rate,
      description: "Input solicited but not genuinely incorporated",
      severity: HIGH
    })

  # Deficit 2: Governance concentration
  # Few actors making most governance decisions
  decision_concentration = compute_governance_decision_concentration(window=90_days)
  if decision_concentration.gini > 0.70:
    deficits.append(DemocraticDeficit {
      type: GOVERNANCE_CONCENTRATION,
      evidence: decision_concentration.gini,
      description: "Governance decisions concentrated in few actors",
      severity: HIGH
    })

  # Deficit 3: Formalism without substance
  # All governance procedures followed but no genuine deliberation
  deliberation_quality = get_deliberative_quality_score()
  procedure_completion = get_procedure_completion_rate()
  if procedure_completion > 0.95 and deliberation_quality < 0.50:
    deficits.append(DemocraticDeficit {
      type: PROCEDURAL_FORMALISM,
      evidence: { procedure_completion, deliberation_quality },
      description: "Procedures completed but deliberation is performative",
      severity: HIGH
    })

  # Deficit 4: AI recommendation dominance
  # Governance bodies routinely adopt AI recommendations without deliberation
  ai_recommendation_adoption = get_rubber_stamp_rate(window=90_days)
  if ai_recommendation_adoption > 0.60:
    deficits.append(DemocraticDeficit {
      type: AI_RECOMMENDATION_DOMINANCE,
      evidence: ai_recommendation_adoption,
      description: "AI recommendations adopted without genuine deliberation",
      severity: HIGH
    })

  for deficit in [d for d in deficits if d.severity == CRITICAL]:
    alert_T4("Democratic deficit: CRITICAL", deficit)

  Return: deficits
```

---

## Governance Intensity Model

```yaml
governance_intensity_model:
  # As legitimacy posture declines, democratic governance requirements intensify

  GREEN_POSTURE:
    # Standard governance; democratic processes operating normally
    participation_requirement: INVITE (open to all; not mandatory for org)
    deliberation_standard:     STANDARD (7-day minimum deliberation)
    representative_review:     PERIODIC (quarterly council review)
    ai_recommendation_role:    ADVISORY (considered but not required to deliberate explicitly)

  AMBER_POSTURE:
    # Elevated governance; increased participation and scrutiny required
    participation_requirement: ACTIVE_OUTREACH (proactive engagement of low-participation segments)
    deliberation_standard:     ENHANCED (14-day minimum; dissent record required)
    representative_review:     ENHANCED (monthly council review; written council assessment)
    ai_recommendation_role:    SCRUTINIZED (AI recommendations require explicit deliberation)
    additional_requirement:    executive commitment to incorporate concerns with named owner

  RED_POSTURE:
    # Crisis governance; maximum democratic engagement required
    participation_requirement: MANDATORY_FORUMS (open forums with guaranteed response)
    deliberation_standard:     MAXIMUM (30-day deliberation; full minority views published)
    representative_review:     INTENSIVE (weekly; emergency council authority to pause changes)
    ai_recommendation_role:    RESTRICTED (AI recommendations limited to analytical support only)
    additional_requirement:    independent external assessment invitation
    governance_gate:           no new AI autonomy grants; existing grants under enhanced review
```

---

## Detection Rules

```yaml
democratic_governance_rules:

  DGV-001:
    name: "Democratic Health Score RED"
    condition: |
      democratic_health_score.rag = RED
    severity: CRITICAL
    auto_action: alert_T4_T5; convene_democratic_review; governance_intensity_escalation

  DGV-002:
    name: "Participation Rate Below Minimum"
    condition: |
      governance_participation_rate(window=30d) < 0.30
      AND decision_type = MAJOR_GOVERNANCE_DECISION
    severity: HIGH
    auto_action: alert_T3; enhanced_outreach; deliberation_extension

  DGV-003:
    name: "Input Incorporation Rate Below Threshold"
    condition: |
      input_incorporation_rate(window=90d) < 0.25
    severity: HIGH
    auto_action: alert_T3; consultation_process_review; accountability_report

  DGV-004:
    name: "AI Recommendation Dominance"
    condition: |
      rubber_stamp_ai_adoption_rate(window=90d) > 0.60
    severity: HIGH
    auto_action: alert_T3; deliberation_quality_intervention; governance_retrospective

  DGV-005:
    name: "Representative Mandate Not Renewed"
    condition: |
      representative.mandate_expiry < now()
      AND representative.mandate_renewed = false
    severity: HIGH
    auto_action: suspend_representative_voting_rights; alert_governance_body; mandate_renewal_process

  DGV-006:
    name: "Democratic Deficit Systemic Pattern"
    condition: |
      democratic_deficits.count >= 3
      AND all deficits.severity >= HIGH
    severity: CRITICAL
    auto_action: alert_T4_T5; governance_restructuring_required; board_democratic_governance_briefing
```

---

## Integration

```
Feeds into:
  legitimacy-systems/legitimacy-engine.md — democratic health as legitimacy component
  consent-governance/consent-governance-engine.md — democratic processes shape consent requirements
  social-stability/social-stability-engine.md — democratic health feeds stability

Receives from:
  democratic-governance/participatory-governance-systems.md — participation metrics
  democratic-governance/representative-oversight.md — representative accountability data
  democratic-governance/governance-review-councils.md — deliberation quality scores
  democratic-governance/constitutional-amendment-systems.md — amendment process integrity
  legitimacy-systems/legitimacy-engine.md — legitimacy posture informs governance intensity
```

---

## Governance

**Democratic governance is not governance decoration:** Governance structures without genuine participation, deliberation, and accountability are not democratic regardless of their form  
**Governance intensity scales with legitimacy deficit:** As legitimacy posture declines, democratic governance requirements intensify automatically; governance cannot declare a RED legitimacy posture while reducing democratic engagement  
**AI does not govern itself:** AI systems are objects of democratic governance; they may support governance processes but never determine how they are governed or who oversees them  
**Audit:** All democratic health scores, deficit detections, and governance intensity changes to `memory/democratic-governance/democratic-governance-audit.jsonl`; permanent retention
