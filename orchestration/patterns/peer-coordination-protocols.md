# Peer Coordination Protocols

## Purpose
Defines how agents coordinate as peers — without a central coordinator holding authority over others. Peer protocols are used when multiple independent perspectives genuinely improve quality, when no single agent should have unilateral authority, and when collaborative deliberation produces better outcomes than delegation. Every peer protocol includes structured procedures to prevent coordination failure.

---

## Peer Coordination Principles

```yaml
peer_principles:
  STRUCTURED_DELIBERATION:
    statement: Peer coordination is not unstructured discussion. Each protocol defines rounds, outputs, and convergence criteria.
    implication: Agents cannot deviate from the protocol structure; unstructured sidebar exchanges are not permitted.
  
  INDEPENDENCE_BEFORE_SHARING:
    statement: Each peer produces an independent position before seeing others' positions.
    implication: Anchoring bias from early position disclosure is avoided; each peer's initial view is preserved in audit.
  
  DISSENT_PRESERVATION:
    statement: Minority positions are recorded in full, even when a majority position is adopted.
    implication: Dissent is not suppressed; it becomes part of the audit trail and may be used for future review.
  
  ESCALATION_OVER_DEADLOCK:
    statement: When peer protocols cannot converge, the issue escalates to a higher tier rather than being arbitrarily resolved.
    implication: Deadlock is a governance signal, not a failure. It means the decision needs human judgment.
  
  NO_COVERT_SIDE_CHANNELS:
    statement: All inter-agent communication in a peer protocol is observable by the protocol coordinator.
    implication: Agents cannot form coalitions or pre-agree outside the protocol; all messages are logged.
```

---

## Protocol 1: CONSENSUS_DELIBERATION

```yaml
protocol_id: PEER-001
name: CONSENSUS_DELIBERATION
purpose: Reach a shared position through structured rounds of analysis and position exchange
participants: 3–9 agents (odd number preferred; minimum tier 2)
use_case: policy interpretation, governance decisions, high-stakes evaluations

execution:
  round_1_independent_analysis:
    duration: each agent given equal time budget (default 10 minutes)
    action: each agent independently analyzes the issue and produces:
      - position (the agent's conclusion)
      - supporting_reasoning (why this position)
      - confidence_score (float 0–1)
      - key_uncertainties (list)
    communication: NONE between agents during round 1
    output: N independent position records (one per agent)
  
  round_2_position_exchange:
    action: all round_1 positions shared simultaneously with all agents
    duration: each agent reviews all positions (default 5 minutes)
    action: each agent produces:
      - updated_position (may be same or changed)
      - rationale_for_change | rationale_for_maintaining
      - points_of_agreement (with which agents and why)
      - points_of_disagreement (with which agents and why)
  
  round_3_convergence_check:
    convergence_definition: >= 75% of agents share the same position
    if_converged:
      - record: majority_position, supporting_agents, dissenting_agents, dissent_rationale
      - output: CONSENSUS_REACHED record
    if_not_converged:
      trigger_round_4: focused deliberation on key disagreement points
  
  round_4_focused_deliberation (conditional):
    action: identify the single most consequential disagreement; each agent argues their position
    duration: 5 minutes per disagreement point
    convergence_check: >= 60% (relaxed threshold for round 4)
    if_converged: output CONSENSUS_REACHED with note of relaxed threshold
    if_not_converged: output DEADLOCK → escalate to tier+1 human
  
  output_schema:
    protocol_run_id: string
    participants: [agent_id]
    issue_description: string
    consensus_reached: boolean
    majority_position: content | null
    majority_confidence: float | null
    supporting_agent_ids: [agent_id]
    dissent_records: [{agent_id, position, reasoning}]
    escalated: boolean
    rounds_conducted: int
    audit_trail: all round records (retained 3 years for governance decisions)
```

---

## Protocol 2: ADVERSARIAL_REVIEW

```yaml
protocol_id: PEER-002
name: ADVERSARIAL_REVIEW
purpose: Improve artifact quality by deliberately stress-testing it with a challenger
participants:
  producer: 1 agent (created the artifact to be reviewed)
  challenger: 1 agent (specifically tasked to find flaws, gaps, and risks)
  arbiter: 1 agent or human (resolves disputes between producer and challenger)
use_case: risk plans, policy proposals, architectural decisions, high-stakes artifacts

execution:
  phase_1_artifact_delivery:
    action: producer delivers artifact with confidence score and self-assessment
    challenger_isolation: challenger has NOT seen artifact before phase 1
  
  phase_2_challenger_review:
    duration: challenger given equal time to producer's creation time (or 15 minutes, whichever is longer)
    action: challenger produces CHALLENGE_REPORT containing:
      - identified_flaws: [{location, severity, description}]
      - identified_gaps: [{what_is_missing, why_it_matters}]
      - identified_risks: [{risk, likelihood, impact}]
      - overall_challenge_verdict: SOUND | CONDITIONALLY_SOUND | UNSOUND
      - challenger_confidence: float
    constraint: challenger must support each challenge with evidence or reasoning
  
  phase_3_producer_response:
    duration: 10 minutes
    action: producer reviews CHALLENGE_REPORT and produces RESPONSE containing:
      - conceded_flaws: [{flaw_id, how_addressed}]
      - contested_flaws: [{flaw_id, counter_argument}]
      - artifact_revision: updated artifact (if conceded flaws incorporated)
  
  phase_4_arbiter_resolution:
    inputs: original artifact, CHALLENGE_REPORT, RESPONSE, revised artifact
    action: arbiter produces ARBITRATION_RECORD containing:
      - upheld_challenges: [flaw/gap/risk ids upheld after review]
      - dismissed_challenges: [flaw/gap/risk ids dismissed with rationale]
      - required_revisions: [list of changes producer must make]
      - final_verdict: APPROVED | APPROVED_WITH_CONDITIONS | REJECTED
    arbiter_authority: final; producer and challenger cannot appeal within this protocol
    appeal_path: escalation to human (Tier-3+) if either party disputes arbiter's decision
  
  output_schema:
    protocol_run_id: string
    artifact_id: string
    producer_id: agent_id
    challenger_id: agent_id
    arbiter_id: agent_id | human_id
    final_verdict: APPROVED | APPROVED_WITH_CONDITIONS | REJECTED
    challenge_report: CHALLENGE_REPORT record
    arbitration_record: ARBITRATION_RECORD record
    revised_artifact_id: string | null
    audit_trail: all phase records (retained 3 years)
```

---

## Protocol 3: VOTING_ENSEMBLE

```yaml
protocol_id: PEER-003
name: VOTING_ENSEMBLE
purpose: Aggregate multiple independent assessments into a single output using weighted voting
participants: 3–7 agents (all must have the required capability at CAPABLE or above)
use_case: quality scoring, risk rating, capability assessment, calibration benchmarks

execution:
  phase_1_independent_assessment:
    action: each agent independently produces:
      - assessment_value (numeric, categorical, or ranked)
      - confidence: float
      - reasoning_summary: string
    constraint: no communication between agents during this phase
  
  phase_2_aggregation:
    aggregation_method: WEIGHTED_VOTE
    weight_computation:
      weight_i = confidence_i × proficiency_factor_i
      proficiency_factor: EXPERT=1.5, PROFICIENT=1.2, CAPABLE=1.0
      normalized: weights sum to 1.0
    
    for_numeric_outputs:
      aggregate = Σ(weight_i × assessment_i)
      variance = weighted_variance across assessments
      high_variance_threshold: > 0.20 standard deviation → flag for arbiter review
    
    for_categorical_outputs:
      winner = category with highest summed weight
      clear_majority: if winner > 0.60 weighted share
      contested: if winner < 0.60 → review by arbiter or escalate
  
  phase_3_outlier_review:
    trigger: any assessment deviates from aggregate by > 1.5 standard deviations
    action: outlier agent asked to justify deviation
    outcomes:
      JUSTIFIED: outlier position preserved in audit; aggregate unchanged
      WITHDRAWN: outlier agent revises position; aggregate recomputed
      UNRESOLVED: escalate to human reviewer
  
  output_schema:
    protocol_run_id: string
    subject: string (what was assessed)
    participants: [agent_id]
    individual_assessments: [{agent_id, assessment, confidence, reasoning}]
    aggregate_result: value
    aggregate_confidence: float
    variance: float
    outliers_reviewed: [{agent_id, outcome}]
    audit_trail: all assessment records
```

---

## Protocol 4: STIGMERGIC_COORDINATION

```yaml
protocol_id: PEER-004
name: STIGMERGIC_COORDINATION
purpose: Agents coordinate through shared state without direct communication (async, high-scale)
participants: any number of agents (T1+)
use_case: large-scale parallel work where tasks are well-defined and independent; knowledge base contribution; backlog processing

execution:
  shared_state_definition:
    work_queue: [{task_id, requirements, status: OPEN|CLAIMED|COMPLETED}]
    output_board: [{task_id, output, contributor_id, timestamp}]
    signal_board: [{signal_type, content, emitter_id, timestamp}] # for coordination signals
  
  agent_behavior:
    step_1: query work_queue for unclaimed tasks matching own capabilities
    step_2: claim task (atomic operation; claim conflicts handled by first-write wins)
    step_3: execute task
    step_4: post output to output_board; mark task COMPLETED in work_queue
    step_5: emit signals to signal_board if task produced relevant findings for others
    loop: return to step_1
  
  coordination_rules:
    claim_atomicity: only one agent can claim any task (optimistic lock + conflict resolution)
    signal_reading: agents check signal_board periodically (every 5 completed tasks)
    priority: agents should prefer higher-priority unclaimed tasks (priority field in work_queue)
    abandonment: if an agent is offline with a claimed task > 2× expected duration → claim released
  
  governance:
    work_queue_authority: only authorized agents/systems can add tasks to queue
    output_board_immutability: outputs are append-only; corrections add new entries referencing original
    audit: all claim events and output postings logged with timestamps
  
  when_not_to_use:
    - tasks with interdependencies (use HIERARCHICAL patterns)
    - tasks requiring deliberation or review
    - governance or high-stakes decisions (insufficient oversight)
```

---

## Protocol Selection Guide

```yaml
protocol_selection:
  CONSENSUS_DELIBERATION (PEER-001):
    best_for: decisions, policy interpretation, judgments requiring agreement
    participant_count: 3-9 (odd)
    time_cost: HIGH (multiple rounds)
    governance_level: HIGH
  
  ADVERSARIAL_REVIEW (PEER-002):
    best_for: artifact quality improvement, risk identification, plan validation
    participant_count: exactly 3 (producer + challenger + arbiter)
    time_cost: MEDIUM
    governance_level: HIGH
  
  VOTING_ENSEMBLE (PEER-003):
    best_for: scoring, rating, categorical assessment
    participant_count: 3-7 (odd preferred)
    time_cost: LOW-MEDIUM (parallel assessment)
    governance_level: MEDIUM
  
  STIGMERGIC_COORDINATION (PEER-004):
    best_for: high-volume independent task processing
    participant_count: unlimited
    time_cost: LOW per agent
    governance_level: LOW (tasks must be pre-vetted)
```

---

## Integration Points

| System | Role |
|---|---|
| `orchestration-patterns/orchestration-pattern-catalog.md` | Parent catalog defining when peer patterns apply |
| `orchestration-patterns/orchestration-strategy-engine.md` | Selects peer protocols for appropriate tasks |
| `delegation-and-trust/inter-agent-contracts.md` | Contracts govern peer agent commitments |
| `coordination-operations/conflict-resolution-engine.md` | Resolves disputes when peer protocols deadlock |
| `agent-intelligence/agent-reasoning-engine.md` | Structured deliberation protocol informs round design |
| `governance-queues/confidence-threshold-system.md` | Aggregate confidence from ensemble informs routing |
