# Agent Skill Acquisition

## Purpose
Governs how agents acquire new skills — adding net-new capabilities to their repertoire rather than refining existing ones. Skill acquisition is the most consequential form of learning: it expands what an agent can do, changes which tasks they can be assigned, and potentially changes their tier authorization. Accordingly, it is the most heavily governed form of agent learning.

---

## Acquisition Pathways

```yaml
acquisition_pathways:
  EXPLICIT_INSTRUCTION:
    description: A skill is taught to an agent through structured training material
    mechanism:
      1. skill specification published in skill-registry.md
      2. training package created (examples, counter-examples, common errors)
      3. agent studies training package
      4. agent completes skill benchmark
      5. if benchmark passed: skill added to profile at NOVICE level
      6. skill authorized if tier_required <= agent's tier
    typical_duration: 1–4 weeks
    success_rate: HIGH for well-specified skills with good training packages
  
  EXPERIENTIAL_ACQUISITION:
    description: Skill develops through repeated task exposure (learning by doing)
    mechanism:
      1. agent repeatedly performs tasks that exercise the target skill
      2. each task execution + feedback contributes learning signal
      3. system detects emerging proficiency in task performance patterns
      4. at threshold: skill formally recognized and added to profile at NOVICE
      5. assessment run to confirm and calibrate level
    typical_duration: 1–6 months
    success_rate: MEDIUM (unguided; slower; risk of developing poor habits)
    governed_by: monitoring required to catch incorrect patterns early
  
  TRANSFER_FROM_ADJACENT:
    description: Proficiency in a related skill bootstraps a new skill
    mechanism:
      1. agent demonstrates PROFICIENT+ in source_skill
      2. system identifies target_skill with >= 0.80 structural similarity
      3. transfer assessment administered (reduced benchmark; 30–50% of full)
      4. agent credited with CAPABLE baseline in target_skill if transfer assessment passed
    conditions: source and target must be in same capability subcategory
    example: expert_elicitation → knowledge_audit (both under knowledge_elicitation capability)
  
  MENTORSHIP_ACQUISITION:
    description: Expert mentor guides acquisition of a new skill
    mechanism:
      1. mentor demonstrates skill in a live session
      2. agent observes and documents key steps, decision points, failure modes
      3. agent attempts skill under mentor supervision (3–5 supervised attempts)
      4. mentor signs off on acquisition when agent performs independently
      5. assessment administered; skill added to profile
    typical_duration: 2–8 weeks (shorter for simpler skills)
    success_rate: VERY_HIGH (direct guidance reduces error accumulation)
    required_for: all GOVERNANCE category skills tier >= 3
  
  SYNTHESIS_ACQUISITION:
    description: Agent synthesizes a new skill by combining two existing skills
    mechanism:
      1. agent demonstrates PROFICIENT in two related skills (A and B)
      2. system or agent identifies that combining A + B enables skill C
      3. agent describes the synthesis and submits for review
      4. Tier-3+ governance agent evaluates whether the synthesis is sound
      5. if approved: skill C added to profile with CAPABLE baseline; no full assessment needed
    requires: Tier-3+ approval; novel; cannot be a re-labeling of existing skills
```

---

## Skill Acquisition Schema

```yaml
skill_acquisition_record:
  acquisition_id: "SA-uuid"
  agent_id: string
  skill_id: string
  pathway: [see acquisition_pathways]
  
  initiation:
    initiated_at: ISO-8601
    initiated_by: agent | supervisor | system
    target_proficiency: NOVICE | CAPABLE | PROFICIENT
    target_date: ISO-8601
    rationale: string           # why this skill is being acquired
  
  progress:
    training_completed: boolean
    benchmark_attempts: [{attempt_id, score, date, passed}]
    supervised_attempts: int
    mentor_id: string | null
    feedback_integrated: int    # count of feedback items incorporated
  
  completion:
    completed_at: ISO-8601 | null
    final_proficiency: string
    assessment_method: string
    assessment_evidence: ref
    certified_by: agent-id | null   # GOVERNANCE skills require certifier
  
  status: PLANNED | IN_PROGRESS | COMPLETE | FAILED | ABANDONED
```

---

## Acquisition Governance

```yaml
acquisition_governance:
  authorization_gates:
    tier_1_skills: no gate; any agent can acquire any time
    tier_2_skills: supervisor notification required; no approval needed
    tier_3_skills: Tier-3+ approval required before acquisition begins
    tier_4_skills: Tier-4+ dual-approval required; formal acquisition plan submitted
    tier_5_skills: board-level knowledge governance lead approval
  
  speed_limits:
    max_new_skills_per_month: 3 (prevents dilution of focus)
    exception: structured learning path (see agent-capability-development.md) may exceed this
    rationale: skill acquisition requires cognitive investment; too many at once reduces depth
  
  quality_gate_before_authorization:
    for_tier_3_plus_skills:
      agent_must_demonstrate: NOVICE proficiency before authorization granted
      mechanism: acquisition benchmark at NOVICE difficulty level
      before_authorization: not DURING authorization (avoid circular grant/practice confusion)
  
  acquisition_freeze_conditions:
    on_performance_score_below_0.50: freeze all new acquisitions; focus on current skills
    on_safety_incident: freeze all GOVERNANCE skill acquisitions pending investigation
    on_CORRECTING_learning_state: freeze acquisition in affected capability subcategory
```

---

## Skill Catalog Expansion

```yaml
skill_catalog_expansion:
  who_can_propose_new_skills:
    agents: PROFICIENT+ in the capability domain the skill falls under
    supervisors: any supervisor
    governance: any Tier-3+ agent
  
  new_skill_proposal_schema:
    proposed_name: string
    proposed_category: string
    problem_solved: string           # what gap does this fill?
    inputs: []
    outputs: []
    implements_capabilities: [CAP-id]
    example_tasks: [string]
    estimated_tier_required: int
    proposed_by: agent-id
    submitted_at: ISO-8601
  
  review_process:
    reviewer: capability governance lead (skill category owner)
    sla: 10 business days
    criteria: [is this distinct from existing skills? is it governable? is tier appropriate?]
    outcome: APPROVE | APPROVE_WITH_MODIFICATIONS | REJECT (with reason)
  
  catalog_version:
    skill_additions: MINOR version bump
    skill_deprecations: PATCH version bump (existing skills removed)
    skill_behavior_changes: MAJOR version bump (requires re-assessment for all users)
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-learning/agent-learning-model.md` | Acquisition pathways fit within learning types |
| `agent-capabilities/agent-skill-registry.md` | Skill definitions; acquisition adds to registry profile |
| `agent-capabilities/agent-capability-assessment.md` | Post-acquisition assessment |
| `agent-capabilities/agent-capability-governance.md` | Authorization gate for new skills |
| `agent-capabilities/agent-capability-development.md` | Development plans include skill acquisition |
| `agent-learning/agent-feedback-integration.md` | Feedback during acquisition shapes proficiency |
