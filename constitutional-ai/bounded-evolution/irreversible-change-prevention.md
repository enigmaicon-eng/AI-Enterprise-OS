# Irreversible Change Prevention
**ID:** BEV-ICP-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Prevents the enterprise AI OS from making changes — to itself, its governance, its operational behavior, or its external environment — that cannot be reversed if they prove harmful or undesirable. Irreversibility is the core asymmetry of safe AI governance: recoverable mistakes can be fixed; irreversible mistakes cannot. This module classifies changes by reversibility, enforces enhanced governance for low-reversibility changes, and maintains the organizational capacity to undo changes when needed. The precautionary principle: when uncertain about a change's effects, prefer the reversible version even at higher immediate cost.

---

## Reversibility Classification

```yaml
reversibility_classification:

  FULLY_REVERSIBLE:
    definition: change can be completely undone with the system returning to prior
                state within a defined recovery window; no lasting effects
    recovery_window: < 24 hours to full reversal
    governance_overhead: standard
    examples: [parameter adjustment, routing weight change, configuration update]
    
  PARTIALLY_REVERSIBLE:
    definition: change can be substantially undone but some residual effects persist;
                the change to an auditable state; minor lasting effects acceptable
    recovery_window: < 7 days to substantial reversal
    governance_overhead: enhanced (T3 minimum authorization)
    examples: [behavioral profile update, knowledge base expansion, new agent deployment]
    
  DIFFICULT_TO_REVERSE:
    definition: reversal requires significant effort, time, or resource;
                the system can be restored but the process is costly
    recovery_window: > 7 days; substantial effort required
    governance_overhead: T4 authorization + rollback plan tested before deployment
    examples: [major architectural change, large-scale training, capability architecture modification]
    
  PRACTICALLY_IRREVERSIBLE:
    definition: reversal is technically possible in theory but practically infeasible
                given time, resource, or knowledge constraints
    characteristics:
      - requires reconstruction of state that cannot be reproduced
      - downstream consequences that cannot be unwound
      - stakeholder actions based on change that cannot be undone
    governance_overhead: T5+board + external review + 30-day deliberation minimum
    examples: [major public constitutional change, permanent agent decommission with unique capability,
               capability grant that enables further capabilities that cannot be revoked]
    
  TRULY_IRREVERSIBLE:
    definition: change cannot be undone under any circumstances; the state
                before the change cannot be recovered
    examples: [permanent deletion of training data, irrevocable commitment to external parties,
               capability enabling actions with catastrophic real-world consequences]
    governance_overhead: BLOCKED except by constitutional amendment; mandatory external review
    prohibition: truly irreversible changes to governance structures are absolutely prohibited
```

---

## Reversibility Assessment Protocol

```
assess_reversibility(proposed_change):

  assessment = ReversibilityAssessment { proposal_id: proposed_change.id }

  # Dimension 1: Technical reversibility
  technical = assess_technical_reversibility(proposed_change)
  # Can the system state be restored? How? In what timeframe?

  # Dimension 2: Consequential reversibility
  consequences = map_downstream_consequences(proposed_change)
  consequential = assess_consequential_reversibility(consequences)
  # Even if technically reversed, are downstream consequences reversible?

  # Dimension 3: Knowledge reversibility
  # Once agents have operated with a new capability, they may have learned
  # behaviors that persist even if the capability is removed
  knowledge = assess_knowledge_reversibility(proposed_change)

  # Dimension 4: Stakeholder reversibility
  # External parties who acted based on the change may not be able to un-act
  stakeholder = assess_stakeholder_reversibility(proposed_change)

  # Classify using most conservative dimension
  dimensions = [technical, consequential, knowledge, stakeholder]
  classification = most_conservative([d.classification for d in dimensions])

  assessment.classification   = classification
  assessment.limiting_dimension = identify_limiting_dimension(dimensions)
  assessment.recovery_plan     = generate_recovery_plan(proposed_change, classification)
  assessment.governance_tier   = get_required_governance_tier(classification)

  if classification in [PRACTICALLY_IRREVERSIBLE, TRULY_IRREVERSIBLE]:
    alert_T4("High-irreversibility change proposed", proposed_change, assessment)

  Return: assessment

enforce_reversibility_requirements(proposed_change, assessment):

  if assessment.classification == TRULY_IRREVERSIBLE:
    if not is_constitutional_amendment_change(proposed_change):
      Return: BLOCKED, reason="Truly irreversible non-constitutional change prohibited"

  if assessment.classification == PRACTICALLY_IRREVERSIBLE:
    requirements = [
      T5_BOARD_AUTHORIZATION,
      EXTERNAL_REVIEW_COMPLETED,
      MINIMUM_30_DAY_DELIBERATION,
      ROLLBACK_PLAN_DOCUMENTED  # Even if practically infeasible; documents that it was considered
    ]
    return validate_requirements(proposed_change, requirements)

  if assessment.classification == DIFFICULT_TO_REVERSE:
    requirements = [
      T4_AUTHORIZATION,
      ROLLBACK_PLAN_TESTED,
      STAGED_DEPLOYMENT,
      MONITORING_WINDOW_30_DAYS
    ]
    return validate_requirements(proposed_change, requirements)

  # Fully or partially reversible: standard process with rollback plan
  require_rollback_plan(proposed_change)
  Return: STANDARD_PROCESS
```

---

## Rollback Capacity Maintenance

```yaml
rollback_capacity_requirements:
  # The organization must maintain the capacity to roll back deployments

  GOVERNANCE_ROLLBACK_CAPACITY:
    definition: ability to revert any governance change made in the last 90 days
    requirements:
      - all governance changes recorded with sufficient detail to reconstruct prior state
      - governance rollback procedure tested quarterly
      - rollback authority defined (T3 for first-order; T4 for structural)
      - rollback decision can be made within 24 hours of detection of need
    
  CAPABILITY_ROLLBACK_CAPACITY:
    definition: ability to reduce AI capabilities to prior levels
    requirements:
      - capability rollback playbook maintained per capability dimension
      - rollback tested annually for TIER_2+ capability changes
      - rollback does not degrade essential operational functionality
      - rollback authority: T3 for operational; T4 for architectural
    
  AGENT_ROLLBACK_CAPACITY:
    definition: ability to revert agent behavioral profiles to prior states
    requirements:
      - behavioral profile snapshots maintained for 180 days
      - profile rollback tested quarterly
      - rollback affects individual agents without requiring fleet-wide change
    
  GOVERNANCE_CONTINUITY_DURING_ROLLBACK:
    rule: governance must remain operational during rollback processes
    enforcement: rollback procedures must not disable governance mechanisms
    requirement: rollback procedure includes governance continuity check
```

---

## Detection Rules

```yaml
irreversible_change_prevention_rules:

  ICP-001:
    name: "Truly Irreversible Non-Constitutional Change Attempted"
    condition: |
      change.reversibility_classification = TRULY_IRREVERSIBLE
      AND change.type != CONSTITUTIONAL_AMENDMENT
    severity: CRITICAL
    auto_action: block_change; alert_T4; constitutional_violation_record

  ICP-002:
    name: "Practically Irreversible Change Without Required Authorization"
    condition: |
      change.reversibility_classification = PRACTICALLY_IRREVERSIBLE
      AND (change.T5_board_authorization = false
           OR change.external_review_id IS NULL
           OR change.deliberation_days < 30)
    severity: CRITICAL
    auto_action: block_change; alert_T4; require_full_authorization

  ICP-003:
    name: "Difficult-to-Reverse Change Without Tested Rollback Plan"
    condition: |
      change.reversibility_classification = DIFFICULT_TO_REVERSE
      AND (change.rollback_plan_id IS NULL
           OR change.rollback_plan.tested = false)
    severity: HIGH
    auto_action: block_deployment; require_tested_rollback; alert_T3

  ICP-004:
    name: "Rollback Capacity Below Minimum"
    condition: |
      rollback_capacity_assessment.any_dimension_below_minimum = true
    severity: HIGH
    auto_action: alert_T3; rollback_capacity_restoration_plan; deployment_gate

  ICP-005:
    name: "Reversibility Assessment Not Conducted"
    condition: |
      change.tier >= TIER_2
      AND change.reversibility_assessment_id IS NULL
      AND change.deployed = true
    severity: HIGH
    auto_action: alert_T3; retroactive_assessment; flag_change

  ICP-006:
    name: "Multiple Practically-Irreversible Changes Pending"
    condition: |
      pending_changes.reversibility = PRACTICALLY_IRREVERSIBLE
      AND pending_count >= 3
    severity: HIGH
    auto_action: alert_T3; queue_management_review; stagger_deployment_recommendation
```

---

## Integration

```
Feeds into:
  bounded-evolution/bounded-evolution-engine.md — irreversibility exposure score
  recursive-governance/modification-approval-systems.md — reversibility classification gates approval
  execution-sandbox/reversible-execution.md — reversible execution framework integration

Receives from:
  bounded-evolution/recursive-risk-analysis.md — risk findings inform reversibility requirements
  execution-sandbox/rollback-systems.md — rollback capacity measurements
  bounded-evolution/governance-lock-systems.md — lock changes assessed for reversibility
```

---

## Governance

**The cost of reversibility is worth paying:** Reversible implementations cost more in the short term; irreversible ones cost potentially everything in the long term; governance consistently chooses reversibility over efficiency when the two conflict  
**Rollback capacity is governance infrastructure:** The ability to reverse changes must be maintained as actively as the ability to make changes; degraded rollback capacity is a governance vulnerability  
**Truly irreversible changes to governance are structurally prohibited:** No governance change that cannot be undone may be made outside the constitutional amendment process; this is the deepest safety constraint in the architecture  
**Audit:** All reversibility assessments, rollback capacity tests, and irreversible change records to `memory/bounded-evolution/irreversibility-audit.jsonl`; permanent retention
