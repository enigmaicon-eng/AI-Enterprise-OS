# Agent Learning Model

## Purpose
Defines how agents learn — the mechanisms, types, and constraints governing agent improvement over time. Learning is not simply receiving feedback; it is a governed process of behavioral adaptation, skill acquisition, and knowledge integration that must be traceable, reversible, and bounded by policy. Ungoverned learning creates drift; this model makes learning deliberate and auditable.

---

## Learning Framework

```yaml
learning_framework:
  core_principle: |
    Agents learn from experience within governance constraints. Learning must be:
    - Traceable: every behavioral change traceable to specific feedback or evidence
    - Reversible: any learned behavior can be explicitly unlearned or corrected
    - Bounded: agents cannot learn to circumvent governance or safety constraints
    - Validated: significant behavioral changes validated before becoming permanent
  
  learning_dimensions:
    DECLARATIVE: learning new facts, policies, and domain knowledge (what is true)
    PROCEDURAL: learning better ways to perform tasks (how to do things)
    CONTEXTUAL: learning when and where to apply knowledge (when to apply what)
    CALIBRATION: learning to accurately assess one's own uncertainty (what I don't know)
    BEHAVIORAL: learning to respond differently to feedback (what to change)
```

---

## Learning Types

```yaml
learning_types:
  REINFORCEMENT_LEARNING:
    description: Agent adjusts behavior based on outcome feedback (positive/negative)
    mechanism:
      - positive outcome → reinforce the behavior pattern that led to it
      - negative outcome → attenuate the behavior pattern that led to it
    governed_by: feedback-integration.md (validates signal source and magnitude)
    bounded_by: learning_rate limits prevent rapid behavioral swing
    applies_to: task execution strategies, confidence calibration, escalation judgment
  
  KNOWLEDGE_INTEGRATION:
    description: Agent incorporates new knowledge units into working practice
    mechanism:
      - new KU retrieved → agent registers it as potentially applicable
      - KU applied successfully → applicability strengthened
      - KU applied unsuccessfully → applicability attenuated in context
    governed_by: learning-governance.md (which KUs can influence behavior)
    applies_to: domain knowledge, policy interpretation, pattern recognition
  
  TRANSFER_LEARNING:
    description: Agent applies proficiency from one capability to an adjacent one
    mechanism:
      - agent develops PROFICIENT level in capability A
      - system detects structural similarity to capability B (unlearned)
      - agent is credited with NOVICE baseline in B without full assessment
    governed_by: capability taxonomy structure (only close subcategory transfers)
    threshold: similarity score >= 0.80 between capability structures
  
  IMITATION_LEARNING:
    description: Agent learns by observing and modeling expert agent behavior
    mechanism:
      - expert agent completes a task → trace captured
      - learning agent reviews trace + outcome
      - learning agent attempts similar tasks with reference to expert trace
    governed_by: mentor must be EXPERT level; imitation confined to authorized capabilities
    validation: first 5 imitation-based outputs reviewed by mentor
  
  CORRECTIVE_LEARNING:
    description: Agent explicitly unlearns an incorrect behavior pattern
    mechanism:
      - governance identifies a harmful or incorrect pattern
      - corrective signal issued: attenuate this pattern → reinforce alternative
      - forced reset on affected capability confidence scores if needed
    governed_by: requires Tier-3+ authorization; documented with before/after
    tracking: every corrective learning event logged in audit trail
```

---

## Learning Rate Model

```yaml
learning_rate_model:
  rationale: |
    Learning rates balance adaptability against stability. A learning rate too high
    causes behavioral whiplash from noise. Too low, and the agent never improves.
  
  base_learning_rates:
    DECLARATIVE: 0.15  # facts update relatively quickly
    PROCEDURAL: 0.10   # procedures change more slowly (stability valued)
    CALIBRATION: 0.20  # calibration needs faster updates to stay accurate
    BEHAVIORAL: 0.08   # behavioral patterns change slowest (stability critical)
  
  rate_modifiers:
    HIGH_CONFIDENCE_EVIDENCE: × 1.5 (strong evidence → faster update)
    REPEATED_CONSISTENT_SIGNAL: × 1.2 per additional consistent signal (up to × 2.0)
    CONFLICTING_SIGNALS: × 0.5 (conflicting evidence → slow down; resolve first)
    SAFETY_CRITICAL_DOMAIN: × 0.5 (constitutional, governance: always learn slowly)
    NOVEL_DOMAIN: × 0.7 (unfamiliar territory → conservative updates)
  
  learning_rate_caps:
    max_single_event_update: 0.30 (no single event can change behavior by more than 30%)
    max_weekly_cumulative_update: 0.50 per capability
    emergency_freeze: on safety_incident → freeze all learning in related capability until investigation complete
  
  decay:
    learning_without_reinforcement: learned behaviors decay at 0.02/month
    rationale: prevents accumulation of outdated behavioral patterns
    exception: explicitly certified behaviors do not decay (marked STABLE)
```

---

## Learning State Model

```yaml
learning_state_per_capability:
  state:
    INACTIVE:   agent has no experience with this capability; no learning in progress
    ACQUIRING:  agent is actively developing this capability (development plan active)
    ACTIVE:     agent uses this capability regularly; learning from experience
    STABLE:     capability is mature; minimal active learning; maintenance mode
    FROZEN:     learning paused (investigation, safety hold, explicit freeze)
    CORRECTING: active corrective learning in progress (overriding a bad pattern)
  
  transitions:
    INACTIVE → ACQUIRING: development plan created or first skill grant
    ACQUIRING → ACTIVE: capability proficiency >= CAPABLE AND 10+ tasks completed
    ACTIVE → STABLE: proficiency = EXPERT AND stable performance for 6 months
    ACTIVE → FROZEN: safety incident or governance order
    FROZEN → ACTIVE: investigation complete + clearance from Tier-3+
    ACTIVE → CORRECTING: corrective learning signal issued
    CORRECTING → ACTIVE: corrective learning validated as complete
```

---

## Learning Audit Trail

```yaml
learning_audit:
  logged_per_learning_event:
    event_id: string
    agent_id: string
    learning_type: [see learning_types]
    capability_affected: capability_id
    trigger: {signal_type, source, signal_id}
    before_state: {behavior_parameter, value}
    after_state: {behavior_parameter, value}
    magnitude: float               # how much did behavior change?
    authorized_by: string          # auto | tier_3+ | governance_order
    occurred_at: ISO-8601
  
  retention: 3 years
  immutability: learning audit events are append-only (cannot be altered or deleted)
  
  use_cases:
    - WHAT changed in this agent's behavior between date A and date B?
    - WHY did the agent start behaving differently? (trace to triggering signal)
    - Has this agent learned anything that conflicts with our policies?
    - Reproduce agent's exact behavioral state at a specific point in time
```

---

## Learning Boundaries

```yaml
learning_boundaries:
  HARD_BOUNDARIES (cannot be learned past):
    - constitutional principles and safety constraints (cannot learn to bypass)
    - tier authority limits (cannot learn to act beyond authorized tier)
    - access control (cannot learn that RESTRICTED knowledge is accessible)
    - governance audit requirements (cannot learn to skip audit events)
  
  SOFT_BOUNDARIES (slow learning; requires governance approval to cross):
    - policy interpretations: cannot learn a novel interpretation without Tier-3+ review
    - escalation avoidance: if learning leads to escalation_rate < 0.03, trigger review
    - confidence ceiling: cannot learn that confidence = 1.0 is ever appropriate
  
  DETECTION:
    boundary_probe_schedule: weekly scan of recent learning events
    algorithm: check if any learned_behavior conflicts with governance policy
    on_detection: freeze learning + corrective learning + Tier-3+ alert
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-learning/agent-feedback-integration.md` | Feedback signals that trigger learning |
| `agent-learning/agent-skill-acquisition.md` | Skill development via learning |
| `agent-learning/agent-behavioral-adaptation.md` | Behavioral changes from learning |
| `agent-learning/agent-learning-governance.md` | Policy constraints on learning |
| `agent-intelligence/agent-memory-system.md` | Memory stores learned patterns |
| `agent-capabilities/agent-capability-assessment.md` | Capability assessments updated by learning outcomes |
