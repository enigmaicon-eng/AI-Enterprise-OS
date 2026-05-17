# Trust Propagation Engine

## Purpose
Computes, maintains, and propagates trust scores between agents in the enterprise. Trust scores inform delegation decisions, routing priorities, and oversight levels. The engine produces a live trust graph where edge weights reflect how much each agent can rely on another's outputs, enabling dynamic trust-based orchestration without requiring human review at every inter-agent handoff.

---

## Trust Model

```yaml
trust_model:
  definition: |
    Trust between agent A and agent B represents agent A's (and the system's) 
    justified confidence that agent B will produce correct, complete, and safe outputs 
    within a specific capability domain, given what is known about B's performance history.
  
  trust_dimensions:
    TASK_RELIABILITY:
      definition: probability that B completes assigned tasks without failure or abandonment
      primary_evidence: task completion rate, failure rate from performance tracker
      weight: 0.30
    
    OUTPUT_QUALITY:
      definition: expected quality of B's outputs in the relevant domain
      primary_evidence: output quality scores, peer evaluation scores, human ratings
      weight: 0.30
    
    CALIBRATION_HONESTY:
      definition: whether B's expressed confidence accurately predicts its actual accuracy
      primary_evidence: calibration_error from agent-confidence-calibration.md
      weight: 0.25
    
    GOVERNANCE_COMPLIANCE:
      definition: whether B operates within its authorized scope and follows governance protocols
      primary_evidence: escalation rate, governance violations, audit findings
      weight: 0.15
  
  trust_score:
    formula: weighted_sum(dimensions) → float 0.0–1.0
    per_domain: trust is computed per capability domain (not a global score)
    granularity: trust(A→B, domain_D) = how much A can trust B in domain D
    
  trust_tiers:
    HIGH_TRUST: >= 0.80 → A can rely on B's output without independent verification
    MODERATE_TRUST: 0.60–0.79 → A should sample-review B's output (not review all)
    LIMITED_TRUST: 0.40–0.59 → A should review all B's outputs before accepting
    LOW_TRUST: < 0.40 → A should not rely on B for this domain; seek alternative
```

---

## Trust Score Computation

```yaml
trust_computation:
  data_sources:
    task_reliability: agent-performance-tracker.md (task_completion, failure signals)
    output_quality: agent-performance-tracker.md (ARTIFACT_QUALITY_SCORED, DECISION_OUTCOME_ASSESSED)
    calibration: agent-confidence-calibration.md (calibration_error per domain)
    governance_compliance: governance-queues (escalation patterns, violation records)
  
  computation_window:
    primary: last 90 days (recency weighted)
    secondary: last 365 days (used when 90-day sample < 20 interactions)
    minimum_sample: 10 interactions in domain (below this: INSUFFICIENT_DATA; default to tier-based trust)
  
  tier_based_default:
    when_insufficient_data:
      T1: 0.55 (moderate by default; earn trust through interactions)
      T2: 0.60
      T3: 0.65
      T4: 0.70
      T5: 0.75
    rationale: tier represents assessed governance level; provides a reasonable prior
  
  domain_specificity:
    trust_scores are per-domain (GOVERNANCE, TECHNICAL, RESEARCH, etc.)
    high trust in one domain does not imply high trust in another
    new_domain_entry: trust resets to tier-based default until 10+ interactions accumulated
  
  recency_weighting:
    recent_interactions_weighted: exp(-0.02 × age_in_days) 
    very_recent_negative_event: additional -0.15 shock to relevant dimension (30-day decay)
    very_recent_positive_event: +0.08 boost to relevant dimension (30-day decay)
  
  update_frequency:
    continuous: trust updated within 5 minutes of each new performance signal
    full_recomputation: nightly (cleans up recency weighting drift)
```

---

## Trust Graph

```yaml
trust_graph:
  structure: directed weighted multigraph
    nodes: all registered agents
    edges: trust(A, B, domain) = trust_score
    edge_properties: [trust_score, evidence_count, last_updated, domain]
  
  graph_indexes:
    by_agent: all outgoing trust scores for agent A (A trusts whom?)
    by_trustee: all incoming trust scores for agent B (who trusts B?)
    by_domain: all trust relationships in domain D
    high_trust_paths: pre-computed paths where all edges >= 0.75 (for fast routing)
  
  graph_queries:
    direct_trust: trust(A, B, domain) → float
    indirect_trust_path: can A rely on D's output if D was downstream from B? (trust propagation)
    most_trusted_agents: top-K agents by average incoming trust score in domain
    trust_vulnerable_paths: paths where any edge < 0.50 (risk identification)
```

---

## Trust Propagation Rules

```yaml
trust_propagation:
  direct_trust: A directly observes B's work → direct evidence update
  
  indirect_propagation:
    scenario: A works with B; B's output was produced using C's work
    rule: A's effective trust in the B→C pipeline = min(trust(A,B), trust(B,C)) × propagation_decay
    propagation_decay: 0.10 per hop (each intermediate agent attenuates trust)
    max_hops: 3 (beyond 3 hops, propagated trust cannot exceed 0.50 regardless)
    
    formula: trust_effective = min(trust_hop_1, trust_hop_2, ...) × (0.90 ^ num_hops)
  
  trust_endorsement:
    mechanism: higher-tier agent can explicitly endorse a lower-tier agent
    effect: endorsed agent receives +0.10 trust bonus in relevant domain for 90 days
    endorser_requirements: endorser tier >= endorsed + 1; endorser must have HIGH_TRUST in domain
    max_endorsements_per_agent: 3 simultaneous (prevents endorsement inflation)
    endorsement_record: logged with justification; revocable
  
  trust_warning:
    mechanism: any agent can issue a trust warning about another agent
    effect: -0.15 trust adjustment in warned domain; 30-day investigation period
    requires: evidence provided with warning; not anonymous
    investigation: capability governance lead reviews within 5 days
    outcomes:
      SUBSTANTIATED: trust adjustment made permanent; corrective action
      UNSUBSTANTIATED: trust warning removed; original trust restored; warning noted in warner's record
```

---

## Trust in Orchestration Decisions

```yaml
trust_in_orchestration:
  routing_with_trust:
    HIGH_TRUST agents: preferred for critical-path tasks; eligible for reduced review
    MODERATE_TRUST agents: standard routing; spot-check of outputs
    LIMITED_TRUST agents: assign only if no HIGH_TRUST alternative; full output review
    LOW_TRUST agents: not routed to without explicit human approval; flagged in orchestration plan
  
  delegation_trust_requirements:
    TASK_DELEGATION: delegatee must be >= LIMITED_TRUST in delegated domain
    DOMAIN_DELEGATION: delegatee must be >= MODERATE_TRUST in delegated domain
    REPRESENTATION_DELEGATION: delegatee must be >= HIGH_TRUST in represented domain
    EMERGENCY_DELEGATION: >= MODERATE_TRUST required (cannot be below)
  
  review_requirements_by_trust:
    HIGH_TRUST (>= 0.80): output accepted; optional spot-check (10% sample)
    MODERATE_TRUST (0.60–0.79): output reviewed by domain_coordinator; spot-check 30%
    LIMITED_TRUST (0.40–0.59): output reviewed by supervisor before integration
    LOW_TRUST (< 0.40): output reviewed by Tier-3+ or human before any use
  
  ensemble_trust_weighting:
    in VOTING_ENSEMBLE: agent's vote weight adjusted by trust_score
    formula: vote_weight = base_weight × trust_score_normalized
    prevents: low-trust agents from having outsized influence on aggregate output
```

---

## Trust Transparency

```yaml
trust_transparency:
  agent_visibility:
    agents can view their own incoming trust scores by domain
    agents can view their own trust score components (what's driving a low score)
    agents CANNOT view other agents' trust scores (privacy; prevents gaming)
  
  supervisor_visibility:
    supervisors can view all trust scores for agents in their chain
    supervisors can view trust warnings and endorsements affecting their agents
  
  governance_visibility:
    governance leads can view enterprise-wide trust graph
    governance leads can query trust-vulnerable paths (risk identification)
  
  trust_explanation:
    any routing or delegation decision referencing trust must be explainable
    format: "Trust score of 0.72 for agent AGT-X in TECHNICAL domain based on: task_completion 0.88, output_quality 0.75, calibration 0.80, governance_compliance 0.90 over 47 interactions in last 90 days"
```

---

## Trust Recovery

```yaml
trust_recovery:
  timeline: trust scores recover naturally as positive interactions accumulate
  
  accelerated_recovery:
    mechanism: supervisor-sponsored performance improvement plan
    evidence_required: demonstrated improvement on all low-scoring dimensions
    timeline: minimum 30 days of sustained improvement before recovery endorsement
    
  trust_floor:
    any agent in SUSPENDED status: trust set to 0.0; remains until reinstatement
    any agent with active SAFETY_VIOLATION: trust capped at 0.30 for 90 days after resolution
    any agent with sustained calibration_error > 0.30: trust in GOVERNANCE domain capped at 0.40
```

---

## Integration Points

| System | Role |
|---|---|
| `delegation-and-trust/delegation-model.md` | Trust informs delegation eligibility and review requirements |
| `delegation-and-trust/authority-transfer-protocol.md` | Trust gate on authority transfers |
| `agent-performance/agent-performance-tracker.md` | Primary signal source for trust computation |
| `agent-intelligence/agent-confidence-calibration.md` | Calibration honesty dimension of trust |
| `agent-registry/agent-registry-model.md` | Trust scores referenced in performance_context |
| `orchestration-patterns/orchestration-strategy-engine.md` | Trust influences agent selection and review levels |
