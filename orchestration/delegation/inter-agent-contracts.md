# Inter-Agent Contracts

## Purpose
Defines the formal agreements between agents during multi-agent coordination. Inter-agent contracts transform implicit coordination assumptions into explicit, auditable commitments — specifying what each agent will deliver, by when, in what format, and what happens if commitments are not met. Contracts are the foundation of reliable multi-agent execution.

---

## Contract Model

```yaml
contract_model:
  definition: |
    An inter-agent contract is a mutually acknowledged agreement between two or more agents 
    specifying: what one agent (the provider) will deliver to another (the consumer), 
    the conditions and timeline for delivery, what the consumer will provide in return 
    (typically: task scope + access to necessary resources), and the remedies available 
    if either party fails to meet their commitment.
  
  contract_types:
    TASK_CONTRACT:
      description: one-to-one agreement; provider delivers specific artifact to consumer
      parties: 1 provider + 1 consumer
      typical_use: orchestrator → worker assignment
    
    TEAM_CONTRACT:
      description: multi-party agreement governing a team's coordinated work
      parties: 1 team_lead + N team_members
      typical_use: dynamic team formation charter
      includes: all member deliverables + inter-member dependencies
    
    SERVICE_CONTRACT:
      description: standing agreement for recurring services between agents
      duration: time-bound (default 30 days; renewable)
      typical_use: analytics agent providing regular reports to orchestration agent
    
    PEER_CONTRACT:
      description: symmetric agreement for peer coordination protocols
      parties: N peers with symmetric obligations
      typical_use: consensus deliberation, adversarial review
```

---

## Contract Schema

```yaml
inter_agent_contract:
  contract_id: "CTR-{task_id}-{seq}"
  contract_type: TASK | TEAM | SERVICE | PEER
  version: int                               # incremented on amendments
  
  parties:
    provider:
      agent_id: string
      role: string
      acknowledged: boolean
      acknowledged_at: ISO-8601 | null
    
    consumer:
      agent_id: string
      role: string
      acknowledged: boolean
      acknowledged_at: ISO-8601 | null
    
    additional_parties: [                    # for TEAM and PEER contracts
      {agent_id, role, acknowledged, acknowledged_at}
    ]
    
    mediator: agent_id | null                # optional; escalation path if dispute
  
  deliverable_specification:
    deliverable_id: string
    description: string
    schema: string (schema reference or inline schema)
    format: string
    quality_requirements:
      minimum_quality_score: float | null    # if null, no minimum enforced
      confidence_floor: float | null         # output must have at least this confidence
      completeness_criteria: [string]        # what constitutes "complete"
  
  timeline:
    effective_from: ISO-8601
    delivery_deadline: ISO-8601
    milestones: [
      {milestone_id, description, expected_at, deliverable_id | null}
    ]
    grace_period: duration | null            # time after deadline before breach is declared
  
  provider_obligations:
    primary: deliver deliverable per specification by delivery_deadline
    communication:
      - notify consumer within 10 minutes of discovering any risk to deadline
      - provide status update at each milestone
      - immediately notify of any blocker
    quality_assurance:
      - self-review against quality_requirements before delivery
      - flag uncertainty that exceeds confidence_floor
  
  consumer_obligations:
    primary: provide clear task scope, required resources, and access
    response_SLA:
      clarification_request: respond within 15 minutes
      output_review_and_acceptance: respond within 30 minutes of delivery
      rejection_with_feedback: if rejected, feedback provided within 15 minutes
  
  breach_and_remedy:
    provider_breach:
      late_delivery:
        trigger: delivery_deadline + grace_period elapsed without delivery
        remedy:
          step_1: consumer activates backup_provider if designated
          step_2: consumer escalates to mediator or supervisor
          step_3: task reassigned; breach recorded in provider's performance record
      quality_failure:
        trigger: delivered artifact rejected by consumer (< minimum_quality_score)
        remedy:
          provider has: 1 revision attempt within 20% of original time budget
          if revision also fails: escalate to mediator or supervisor
      abandonment:
        trigger: provider stops responding (no update for > 2× expected_task_duration)
        remedy: immediate escalation; backup activation; task reassignment
    
    consumer_breach:
      late_clarification: provider pauses work; breach recorded; escalated to mediator
      unjustified_rejection: mediator reviews; if consumer wrong, contract upheld
  
  amendment:
    any_amendment: requires acknowledgment by all parties
    scope_expansion: requires grantor approval (not just consumer + provider)
    deadline_extension: requires consumer acknowledgment; logged with reason
    scope_reduction: provider acknowledged; work-to-date credited
  
  termination:
    COMPLETED: all deliverables accepted
    REVOKED_BY_CONSUMER: consumer cancels; provider work-to-date documented; no breach
    TERMINATED_FOR_CAUSE: mediator or supervisor terminates due to breach; breach recorded
    EXPIRED: deadline passed without completion; triggers breach handling
  
  governance:
    audit_level: STANDARD (default) | ENHANCED (if task is governance-related)
    audit_trail: all contract events (creation, amendments, milestones, breaches) logged
    retention: 1 year (STANDARD); 3 years (ENHANCED or TEAM)
```

---

## Contract Lifecycle

```yaml
contract_lifecycle:
  DRAFT:
    created by: orchestration engine or team lead
    state: terms defined but not yet acknowledged
    action_required: all parties must acknowledge within 2-minute window
  
  ACTIVE:
    entered when: all parties acknowledged
    provider begins: execution
    monitoring begins: milestone tracking, communication SLA tracking
  
  MILESTONE_CHECKPOINT:
    at each milestone:
      provider delivers: milestone progress report
      consumer confirms: receipt
      system checks: is timeline on track? any breach risk?
  
  DELIVERY:
    provider delivers: artifact per specification
    consumer reviews: within response_SLA
    outcomes:
      ACCEPTED: contract → COMPLETED
      REJECTED_WITH_FEEDBACK: provider revision window begins
      ACCEPTED_WITH_CONDITIONS: consumer notes conditions; contract → COMPLETED with notes
  
  COMPLETED:
    all deliverables accepted
    performance signals emitted to agent-performance-tracker.md
    contract archived
  
  BREACHED:
    breach detected (provider or consumer)
    breach remedies activated per breach_and_remedy section
    breach recorded: in breaching agent's performance record
    contract: may continue (if breach resolved) or terminate
```

---

## Contract Templates

```yaml
contract_templates:
  TEMPLATE-CTR-001: standard_task_contract
    use_when: one agent delivers one artifact to one consumer
    pre_filled: delivery_deadline (from orchestration plan), schema (from deliverable spec)
    parties: 2 (provider + consumer)
    governance: STANDARD
  
  TEMPLATE-CTR-002: team_coordination_contract
    use_when: dynamic team formation (see dynamic-team-formation.md)
    pre_filled: all member deliverables, inter-member dependencies, team_lead as mediator
    parties: team_lead + all members
    governance: STANDARD or ENHANCED based on task
    includes: dependency graph for inter-member artifacts
  
  TEMPLATE-CTR-003: adversarial_review_contract
    use_when: ADVERSARIAL_REVIEW peer protocol
    parties: producer + challenger + arbiter
    special_terms:
      challenger_isolation: challenger cannot communicate with producer before CHALLENGE_REPORT
      arbiter_finality: arbiter's decision is binding; no appeal within protocol
    governance: ENHANCED
  
  TEMPLATE-CTR-004: consensus_deliberation_contract
    use_when: CONSENSUS_DELIBERATION peer protocol
    parties: all participants (3–9)
    special_terms:
      round_independence: agents cannot communicate before each round's position submission
      dissent_preservation: all minority positions recorded in full
    governance: ENHANCED
  
  TEMPLATE-CTR-005: standing_service_contract
    use_when: recurring service relationship (30-day renewable)
    defines: service description, SLA, refresh frequency, escalation path
    amendment: renewal required at each 30-day anniversary
    governance: STANDARD
```

---

## Contract Dispute Resolution

```yaml
dispute_resolution:
  tier_1_negotiation:
    parties: provider + consumer directly
    duration: up to 30 minutes
    outcome: amended contract or agreed resolution
  
  tier_2_mediation:
    parties: provider + consumer + mediator (if designated in contract)
    duration: up to 1 hour
    mediator_authority: can impose resolution; both parties bound
    escalation: if mediator cannot resolve in 1 hour → Tier 3
  
  tier_3_governance_escalation:
    parties: supervisor for each agent
    if_same_supervisor: supervisor arbitrates
    if_different_supervisors: Tier-3+ governance review
    binding: governance decision is final for current task
    consequences: can result in breach recording, performance notes, contract modifications
  
  dispute_prevention:
    quality_requirements: must be specified clearly before acknowledgment (no vague terms)
    schema_validation: deliverable schema validated before contract activation
    milestone_clarity: milestones must have observable success criteria
```

---

## Integration Points

| System | Role |
|---|---|
| `delegation-and-trust/delegation-model.md` | Delegation record triggers contract creation |
| `delegation-and-trust/trust-propagation-engine.md` | Contract breach history affects trust scores |
| `delegation-and-trust/delegation-governance.md` | Contract governance policies |
| `orchestration-patterns/dynamic-team-formation.md` | Team charter instantiates TEMPLATE-CTR-002 |
| `orchestration-patterns/peer-coordination-protocols.md` | ADVERSARIAL_REVIEW and CONSENSUS use peer contracts |
| `agent-performance/agent-performance-tracker.md` | Contract completion/breach signals feed performance tracker |
| `coordination-operations/conflict-resolution-engine.md` | Handles contract disputes that escalate beyond tier 2 |
