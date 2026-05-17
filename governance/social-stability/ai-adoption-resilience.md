# AI Adoption Resilience
**ID:** SST-AAR-001 | **Tier:** T3 | **Class:** HIGH
**Owner:** HR Org + Delivery Org | **Updated:** 2026-05-16

---

## Purpose

Builds, measures, and defends the organizational capacity to absorb, adapt to, and recover from the disruptions caused by ongoing AI deployment — ensuring that the workforce retains meaningful competence, agency, and adaptability throughout AI adoption cycles. Resilience is not the absence of disruption; it is the organization's ability to navigate disruption without losing human capability, morale, or institutional knowledge. This module operationalizes resilience as both a measurement system and an active intervention capacity.

---

## Resilience Dimensions

```yaml
adoption_resilience_dimensions:

  SKILL_ADAPTATION_VELOCITY:
    definition: how quickly employees build the new skills that AI deployment
                requires and maintain value-generating work capability
    measurement: skill gap closure rate; new capability acquisition speed;
                 time-to-proficiency for AI-augmented roles
    target: skill gap closure rate >= 0.70 within 6 months of deployment
    weight: 0.25
    
  ROLE_IDENTITY_RESILIENCE:
    definition: employees' ability to maintain a coherent, valued professional
                identity as AI takes on tasks they previously performed
    measurement: role identity survey; professional value perception;
                 contribution meaningfulness score
    critical_threshold: < 3.0/5.0
    weight: 0.25
    
  CHANGE_FATIGUE_INDEX:
    definition: the degree to which cumulative AI-driven change has depleted
                employee adaptive capacity — the cost of prior absorptions
    measurement: change fatigue survey; reported overwhelm rate;
                 productivity variance during deployment periods
    critical_threshold: fatigue_index > 0.60
    weight: 0.20
    
  ORGANIZATIONAL_LEARNING_RATE:
    definition: how effectively the organization captures, distributes, and
                applies lessons from AI adoption experiences
    measurement: lesson capture rate; knowledge distribution reach;
                 adaptation pattern recurrence rate
    target: pattern_recurrence_rate <= 0.20 (not repeating same mistakes)
    weight: 0.15
    
  SAFETY_NET_COVERAGE:
    definition: the breadth and quality of support mechanisms available to
                employees during transitions — reskilling, mental health,
                career navigation, role redesign
    measurement: support utilization rate; support effectiveness scores;
                 safety net awareness coverage
    minimum_coverage: 0.90 of employees aware of available support
    weight: 0.15
```

---

## Resilience Score

```
compute_adoption_resilience_score():

  skill_velocity    = get_skill_adaptation_velocity_score()
  role_identity     = get_role_identity_resilience_score()
  change_fatigue    = 1.0 - get_change_fatigue_index()  # Invert: high fatigue = low score
  learning_rate     = get_organizational_learning_rate_score()
  safety_net        = get_safety_net_coverage_score()

  resilience_score = (
    skill_velocity  * 0.25 +
    role_identity   * 0.25 +
    change_fatigue  * 0.20 +
    learning_rate   * 0.15 +
    safety_net      * 0.15
  )

  # Critical threshold floor
  if get_change_fatigue_index() > 0.60:
    resilience_score = min(resilience_score, 0.60)

  if get_role_identity_resilience_score() < 3.0/5.0:
    resilience_score = min(resilience_score, 0.65)

  Return: AdoptionResilienceScore {
    overall: resilience_score,
    components: { skill_velocity, role_identity, change_fatigue, learning_rate, safety_net },
    computed_at: now()
  }
```

---

## Resilience Intervention Playbook

```yaml
resilience_interventions:

  SKILL_GAP_ACCELERATION:
    trigger: skill_adaptation_velocity_score < 0.60
    actions:
      - targeted skills assessment for affected roles
      - accelerated learning pathways with protected time allocation
      - pairing with AI-proficient peers (not AI itself as sole teacher)
      - role-specific AI augmentation training (not generic AI training)
    owner: HR Org + direct managers
    timeline: 90 days with progress gates

  ROLE_IDENTITY_SUPPORT:
    trigger: role_identity_resilience_score < 3.0/5.0 (CRITICAL trigger)
    actions:
      - role redesign workshops facilitated by HR (identifying AI-augmented value)
      - storytelling program (employees articulate their unique human contribution)
      - visible recognition of human-judgment wins alongside AI efficiency wins
      - management coaching on reinforcing employee professional value
    owner: HR Org + Org Design Org
    timeline: 60 days initial; ongoing measurement

  CHANGE_FATIGUE_RECOVERY:
    trigger: change_fatigue_index > 0.60
    actions:
      - MANDATORY deployment pace review — no new AI deployments until fatigue resolved
      - protected "AI-free" workflow zones for highly fatigued teams
      - explicit recovery time built into team capacity planning
      - executive acknowledgment of change burden (no minimization)
    owner: Executive sponsor + HR Org
    timeline: 45-day minimum recovery before new deployments

  LEARNING_ACCELERATION:
    trigger: pattern_recurrence_rate > 0.20
    actions:
      - structured retrospective on recurring adoption failures
      - knowledge distribution audit (are lessons reaching those who need them?)
      - adoption playbook updates with concrete anti-patterns
      - cross-team learning sessions
    owner: Knowledge Management Org + Delivery Org
    timeline: 30 days per cycle

  SAFETY_NET_EXPANSION:
    trigger: safety_net_awareness < 0.90
    actions:
      - proactive outreach to teams with low support awareness
      - simplified support access (one-click from employee portal)
      - peer support network activation
      - manager training on how to connect employees to support
    owner: HR Org
    timeline: 30 days
```

---

## Adoption Curve Modeling

```
model_adoption_curve(ai_system, deployment_plan):
  # Predicts adoption trajectory and identifies risk windows

  # Historical base rates by system type and organizational context
  base_curve = get_historical_adoption_curve(
    system_type=ai_system.type,
    org_context=deployment_plan.target_segments
  )

  # Adjust for current resilience state
  resilience_score = compute_adoption_resilience_score().overall
  adjusted_curve   = adjust_curve_for_resilience(base_curve, resilience_score)

  # Identify risk windows (predicted adoption trough points)
  risk_windows = [
    point for point in adjusted_curve.trajectory
    if point.adoption_rate < 0.40 or point.change_fatigue_predicted > 0.55
  ]

  # Recommend deployment sequencing
  if len(risk_windows) > 0:
    first_risk_window = min(risk_windows, key=lambda p: p.time_offset)
    recommendation = DeploymentRecommendation {
      suggested_pace: SLOWER if first_risk_window.time_offset < 60 else STANDARD,
      risk_windows: risk_windows,
      support_staging: generate_support_staging_plan(risk_windows)
    }
  else:
    recommendation = DeploymentRecommendation { suggested_pace: STANDARD }

  Return: AdoptionCurveModel {
    base_curve: base_curve,
    adjusted_curve: adjusted_curve,
    risk_windows: risk_windows,
    recommendation: recommendation
  }
```

---

## Detection Rules

```yaml
adoption_resilience_rules:

  AAR-001:
    name: "Change Fatigue Critical"
    condition: |
      change_fatigue_index > 0.60
    severity: CRITICAL
    auto_action: alert_T4; mandatory_deployment_pace_review; fatigue_recovery_protocol

  AAR-002:
    name: "Role Identity Resilience Critical"
    condition: |
      role_identity_resilience_score < 3.0 / 5.0
    severity: CRITICAL
    auto_action: alert_T4; role_identity_intervention; executive_engagement

  AAR-003:
    name: "Skill Gap Not Closing"
    condition: |
      skill_gap_closure_rate(window=6_months) < 0.50
    severity: HIGH
    auto_action: alert_T3; skills_acceleration_program; deployment_pace_review

  AAR-004:
    name: "Deployment Without Resilience Check"
    condition: |
      ai_system.deployment_started = true
      AND deployment.resilience_assessment_completed = false
    severity: HIGH
    auto_action: require_resilience_assessment; flag_deployment; alert_T3

  AAR-005:
    name: "Safety Net Coverage Below Minimum"
    condition: |
      safety_net_awareness_coverage < 0.90
    severity: HIGH
    auto_action: alert_HR; safety_net_outreach; manager_briefing

  AAR-006:
    name: "Adoption Resilience Score RED"
    condition: |
      adoption_resilience_score < 0.50
    severity: CRITICAL
    auto_action: alert_T4; deployment_freeze_for_affected_segments; intervention_plan_required
```

---

## Integration

```
Feeds into:
  social-stability/social-stability-engine.md — resilience feeds stability model
  social-stability/organizational-acceptance-modeling.md — resilience predicts acceptance
  enterprise-workflows/ai-deployment-workflow.md — resilience gates deployment decisions

Receives from:
  hr/learning-development-systems.md — skill gap data
  hr/employee-wellbeing-systems.md — change fatigue signals
  knowledge-management/knowledge-lifecycle-management.md — learning rate metrics
  legitimacy-systems/organizational-trust-mechanisms.md — trust affects resilience
```

---

## Governance

**Resilience is a deployment prerequisite:** AI deployments to segments with adoption_resilience_score < 0.55 require T4 authorization and explicit resilience plan  
**Change fatigue triggers mandatory deployment pause:** A change_fatigue_index above critical threshold is a hard governance gate — no new AI deployments until resolved  
**Resilience investment is not optional:** Protected time, reskilling resources, and support mechanisms are governance obligations; framing them as optional productivity investments is a governance failure  
**Audit:** All resilience scores, intervention activations, and adoption curve models to `memory/social-stability/adoption-resilience-audit.jsonl`; 10-year retention
