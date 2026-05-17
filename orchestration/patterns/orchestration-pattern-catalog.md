# Orchestration Pattern Catalog

## Purpose
Defines the canonical library of multi-agent orchestration patterns available in the enterprise. Each pattern specifies when to use it, how agents are structured, how work flows, and what governance controls apply. Orchestrators select from this catalog rather than improvising structure — pattern selection is itself a governed decision.

---

## Pattern Taxonomy

```
Orchestration Patterns
├── HIERARCHICAL          → authority flows top-down; single coordinator controls subordinates
│   ├── COMMAND_AND_CONTROL     → strict single-authority execution
│   ├── SUPERVISED_EXECUTION    → coordinator delegates with oversight
│   └── FEDERATED_HIERARCHY     → distributed coordinators under apex authority
│
├── PEER_COORDINATION    → agents collaborate without single authority
│   ├── CONSENSUS_PROTOCOL      → agents reach joint decisions
│   ├── MARKET_MECHANISM        → agents bid for work competitively
│   └── STIGMERGIC_COORDINATION → agents coordinate through shared state (no direct communication)
│
├── PIPELINE             → sequential processing chains
│   ├── LINEAR_PIPELINE         → A → B → C with handoffs
│   ├── BRANCHING_PIPELINE      → conditional routing at each stage
│   └── FEEDBACK_PIPELINE       → outputs loop back as inputs
│
├── ENSEMBLE             → multiple agents produce parallel outputs combined into one result
│   ├── PARALLEL_EVALUATION     → all evaluate same input; best selected
│   ├── ADVERSARIAL_REVIEW      → one produces, one challenges
│   └── VOTING_ENSEMBLE         → majority or weighted vote determines output
│
└── DYNAMIC              → structure determined at runtime
    ├── DYNAMIC_TEAM_FORMATION  → team assembled per task requirements
    ├── MARKET_CLEARING         → work units auctioned to best-fit agents
    └── SELF_ORGANIZING         → agents declare capacity and attract work
```

---

## Pattern Specifications

### COMMAND_AND_CONTROL
```yaml
pattern_id: PAT-ORCH-001
name: COMMAND_AND_CONTROL
category: HIERARCHICAL

structure:
  coordinator: 1 (T3+ governance or orchestration agent)
  subordinates: 1–N agents (T1-T2 typically)
  communication: strictly top-down; subordinates report to coordinator only

when_to_use:
  - high-stakes governance decisions requiring clear accountability chain
  - tasks where intermediate outputs must be reviewed before proceeding
  - regulated processes where coordination must be auditable to one authority

when_not_to_use:
  - exploratory or creative tasks (constraint kills divergent thinking)
  - tasks where speed matters more than control
  - large N subordinates (bottleneck at coordinator)

governance:
  coordinator_tier: >= 3
  requires_human_supervisor: recommended for T4+ coordinators
  decision_authority: coordinator has final authority; subordinates cannot override
  audit_level: ENHANCED

performance_characteristics:
  throughput: LOW (coordinator is bottleneck)
  latency: MEDIUM-HIGH
  reliability: HIGH (single coordinator is clear point of escalation)
  governance_fit: EXCELLENT
```

### SUPERVISED_EXECUTION
```yaml
pattern_id: PAT-ORCH-002
name: SUPERVISED_EXECUTION
category: HIERARCHICAL

structure:
  supervisor: 1 (orchestration agent; T2+)
  workers: 2–8 agents (T1-T2)
  communication: supervisor assigns; workers execute and report; supervisor reviews outputs

when_to_use:
  - standard task decomposition with moderate governance requirements
  - tasks with clear sub-task boundaries
  - situations where worker outputs need quality review before combination

governance:
  supervisor_tier: >= 2
  output_review: supervisor reviews before final delivery
  worker_autonomy: workers can make task-level decisions; cannot change task scope

performance_characteristics:
  throughput: MEDIUM (workers in parallel; supervisor at review)
  latency: MEDIUM
  governance_fit: GOOD
```

### FEDERATED_HIERARCHY
```yaml
pattern_id: PAT-ORCH-003
name: FEDERATED_HIERARCHY
category: HIERARCHICAL

structure:
  apex_coordinator: 1 (T3+)
  domain_coordinators: 2–5 (T2-T3, one per domain/sub-problem)
  workers: N under each domain coordinator
  communication: apex ↔ domain coordinators; domain coordinators ↔ workers

when_to_use:
  - large multi-domain problems requiring parallel coordination streams
  - enterprise-scale tasks (>20 agent-tasks)
  - problems where domain expertise at the coordinator level matters

governance:
  apex_coordinator_tier: >= 3
  requires_human_executive_sponsor: for tasks >4 hours duration
  escalation_path: worker → domain_coordinator → apex_coordinator → human

performance_characteristics:
  throughput: HIGH (parallel domain execution)
  latency: MEDIUM (domain coordination overhead)
  governance_fit: GOOD
```

### CONSENSUS_PROTOCOL
```yaml
pattern_id: PAT-ORCH-004
name: CONSENSUS_PROTOCOL
category: PEER_COORDINATION

structure:
  participants: 3–9 agents (odd number preferred for tie-breaking)
  roles: each agent is peer; no authority hierarchy
  communication: all-to-all deliberation; structured rounds

when_to_use:
  - decisions where multiple perspectives genuinely improve quality
  - governance decisions where no single agent should have unilateral authority
  - policy interpretation requiring cross-domain synthesis

consensus_mechanism:
  round_1: each agent independently analyzes and produces position
  round_2: positions shared; each agent updates position based on others
  round_3: convergence check; if < 75% agree → escalate to human
  output: majority position with dissent record

governance:
  minimum_tier: 2 for all participants (ensures quality floor)
  dissent_preservation: minority positions recorded in full
  human_escalation_trigger: no consensus after 3 rounds
  audit: full deliberation trace required

performance_characteristics:
  throughput: LOW (serial rounds)
  latency: HIGH
  decision_quality: VERY HIGH
  governance_fit: EXCELLENT (for high-stakes decisions)
```

### LINEAR_PIPELINE
```yaml
pattern_id: PAT-ORCH-005
name: LINEAR_PIPELINE
category: PIPELINE

structure:
  stages: 2–10 sequential agents
  communication: each stage receives output of prior stage as its input
  handoff: artifact-driven (each stage produces a structured artifact)

when_to_use:
  - transformation tasks with defined sequential stages
  - tasks where stage N requires stage N-1 output (dependency chain)
  - workflows with established stage definitions (e.g., design → review → approve)

governance:
  stage_handoff_validation: each artifact validated against stage schema before passing
  rejection_handling: failed artifacts routed back to prior stage or escalated
  parallel_stages: not supported (use SUPERVISED_EXECUTION for parallel)

performance_characteristics:
  throughput: MEDIUM (limited by slowest stage)
  latency: HIGH (total = sum of all stages)
  reliability: MEDIUM (single stage failure breaks pipeline)
  governance_fit: GOOD
```

### PARALLEL_EVALUATION
```yaml
pattern_id: PAT-ORCH-006
name: PARALLEL_EVALUATION
category: ENSEMBLE

structure:
  evaluators: 2–5 agents (same or similar capabilities)
  coordinator: 1 (aggregates results)
  communication: each evaluator works independently; coordinator combines

when_to_use:
  - tasks where quality variance across agents is high (reduce luck)
  - high-stakes evaluations (constitutional review, quality gate)
  - tasks where confidence in a single output is insufficient

aggregation_methods:
  BEST_OF_N: select highest-scoring output
  AVERAGE: average numeric outputs (calibration checks, scores)
  SYNTHESIS: coordinator synthesizes insights from all outputs

governance:
  evaluators_must_be_independent: no communication between evaluators before aggregation
  conflicts: flagged for human review
  audit: all individual evaluator outputs retained

performance_characteristics:
  throughput: N× higher cost
  latency: matches slowest evaluator (parallel execution)
  quality: HIGHER than single agent
  governance_fit: EXCELLENT for high-stakes
```

### ADVERSARIAL_REVIEW
```yaml
pattern_id: PAT-ORCH-007
name: ADVERSARIAL_REVIEW
category: ENSEMBLE

structure:
  producer: 1 agent (creates primary output)
  challenger: 1 agent (specifically tasked to find flaws)
  arbiter: 1 agent or human (resolves disputes)

when_to_use:
  - risk assessments, plans, policies where blind spots are costly
  - outputs where false positives (approving bad work) are worse than false negatives
  - any output that will be hard to reverse after approval

governance:
  challenger_independence: challenger must have no prior knowledge of producer's reasoning
  arbiter_tier: arbiter must be >= producer and challenger tier
  escalation: unresolved arbiter decisions → human (Tier-3+)

performance_characteristics:
  latency: 2× single agent (sequential producer → challenger → arbiter)
  quality: SIGNIFICANTLY HIGHER for defect detection
  governance_fit: EXCELLENT
```

### DYNAMIC_TEAM_FORMATION
```yaml
pattern_id: PAT-ORCH-008
name: DYNAMIC_TEAM_FORMATION
category: DYNAMIC

structure:
  team_lead: selected by discovery engine based on task requirements
  team_members: assembled dynamically per task; see dynamic-team-formation.md
  communication: team_lead coordinates; peer-to-peer for sub-task handoffs

when_to_use:
  - novel tasks without predefined workflows
  - tasks requiring rare capability combinations
  - large tasks where team composition needs to match specific expertise

governance:
  team_formation: governed by dynamic-team-formation.md
  team_lead_tier: >= 2; must have orchestration capability
  disbanding: all members return to available pool on task completion

performance_characteristics:
  throughput: HIGH (right-fit team for each task)
  latency: formation overhead (~200ms additional)
  governance_fit: GOOD (team formation is audited)
```

---

## Pattern Selection Decision Tree

```yaml
pattern_selection:
  step_1: How important is accountability traceability?
    HIGH → HIERARCHICAL patterns (PAT-ORCH-001/002/003)
    MEDIUM → any pattern with coordinator role
    LOW → PEER or DYNAMIC patterns acceptable
  
  step_2: Are task stages sequential or parallel?
    SEQUENTIAL → PIPELINE patterns (PAT-ORCH-005)
    PARALLEL_INDEPENDENT → SUPERVISED_EXECUTION or DYNAMIC_TEAM
    PARALLEL_INTERDEPENDENT → FEDERATED_HIERARCHY
  
  step_3: Does the task benefit from multiple independent perspectives?
    YES (evaluation/governance) → ENSEMBLE patterns (PAT-ORCH-006/007)
    YES (decision with risk) → CONSENSUS_PROTOCOL (PAT-ORCH-004)
    NO → single coordinator pattern
  
  step_4: Is the task structure known in advance?
    YES → choose from static patterns above
    NO → DYNAMIC_TEAM_FORMATION (PAT-ORCH-008)
```

---

## Integration Points

| System | Role |
|---|---|
| `orchestration-patterns/hierarchical-orchestration.md` | Detailed specs for HIERARCHICAL patterns |
| `orchestration-patterns/peer-coordination-protocols.md` | Detailed specs for PEER patterns |
| `orchestration-patterns/dynamic-team-formation.md` | DYNAMIC pattern implementation |
| `orchestration-patterns/orchestration-strategy-engine.md` | Selects patterns from this catalog |
| `agent-registry/agent-discovery-engine.md` | Finds agents for each pattern role |
| `delegation-and-trust/delegation-model.md` | Authority flows defined per pattern |
