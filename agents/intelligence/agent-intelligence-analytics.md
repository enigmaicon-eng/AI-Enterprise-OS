# Agent Intelligence Analytics

## Purpose
Provides deep analysis of agent intelligence metrics — reasoning quality, memory effectiveness, calibration health, learning velocity, and collective intelligence capacity. Where performance analytics measures output quality, intelligence analytics measures the cognitive systems that produce those outputs, enabling smarter interventions and more targeted capability investment.

---

## Analytics Architecture

```
Intelligence Signal Sources
├── agent-reasoning-engine.md        → reasoning traces, protocol usage, verification failures
├── agent-memory-system.md           → memory access patterns, retrieval effectiveness
├── agent-confidence-calibration.md  → calibration metrics, correction history
├── agent-learning-model.md          → learning events, learning rate, adaptation magnitude
├── agent-capabilities/              → capability profiles, proficiency distributions
└── agent-performance/               → performance signals (feeds intelligence analysis)
        ↓
[1. Individual Intelligence Profiling]  → cognitive patterns per agent
[2. Collective Intelligence Analysis]   → enterprise-level intelligence health
[3. Intelligence Growth Modeling]       → how intelligence is developing over time
[4. Bottleneck Identification]          → where intelligence is constrained
[5. Intelligence Risk Assessment]       → cognitive risks in the enterprise
```

---

## Individual Intelligence Profile

```yaml
individual_intelligence_profile:
  reasoning_quality_metrics:
    protocol_selection_accuracy:
      definition: fraction of tasks where the agent chose the optimal reasoning protocol
      measured_by: expert review of a sample (10%/month)
      target: >= 0.80
    
    reasoning_completion_rate:
      definition: fraction of reasoning traces that pass all verification checks without revision
      target: >= 0.85
    
    step_quality_distribution:
      definition: across all reasoning traces, which steps most often have deficiencies?
      output: step-level quality heatmap (reveals systematic reasoning weak points)
    
    failure_mode_distribution:
      definition: frequency of each reasoning failure_mode (anchoring, tunnel vision, etc.)
      use: identify which cognitive biases are most active for this agent
  
  memory_effectiveness_metrics:
    episodic_recall_relevance:
      definition: fraction of recalled episodes that were actually useful (rated by agent post-task)
      target: >= 0.60 (most recalled episodes should be relevant)
    
    semantic_memory_accuracy:
      definition: fraction of semantic memory abstractions that proved correct when applied
      measured_by: tracking applications of semantic memory + outcomes
      target: >= 0.75
    
    working_memory_compression_rate:
      definition: how often working memory needs compression per task (proxy for cognitive load)
      high_rate: agent may be overloading working memory; review task complexity assignment
    
    knowledge_integration_rate:
      definition: fraction of retrieved KUs that were actively integrated into reasoning trace
      (vs. retrieved but ignored)
      target: >= 0.50 (knowledge must reach reasoning, not just retrieval)
  
  calibration_profile:
    by_domain: calibration_error per enterprise domain
    by_confidence_bucket: calibration accuracy per confidence range
    trend: improving, stable, or degrading calibration over 90 days
    bias_history: timeline of bias corrections applied
  
  learning_profile:
    adaptation_frequency: how often behavioral parameters update (per month)
    adaptation_magnitude_avg: average per-event change magnitude
    dominant_learning_type: which learning type drives most updates?
    feedback_integration_effectiveness: what fraction of feedback produces durable change?
    learning_velocity: capability proficiency improvements per quarter
```

---

## Collective Intelligence Analysis

```yaml
collective_intelligence_analysis:
  enterprise_cognitive_capacity:
    definition: aggregate ability of all agents to handle complex reasoning tasks correctly
    measurement:
      expert_level_capacity: count of agents with EXPERT in each critical capability
      complex_task_success_rate: aggregate success rate for COMPLEX and EXPERT difficulty tasks
      calibration_portfolio_health: fraction of agents in GREEN calibration state
    
    capacity_gaps:
      GOVERNANCE_REASONING: critical if < 3 agents are EXPERT in constitutional_evaluation
      RISK_ASSESSMENT: critical if < 5 agents are PROFICIENT in risk_assessment
      CAUSAL_REASONING: concerning if < 30% of research agents are PROFICIENT
  
  collective_calibration_health:
    portfolio_calibration_error: weighted mean calibration_error across all agents
    target: < 0.12 (enterprise level; individual agents may vary)
    miscalibrated_agent_concentration:
      if > 20% of agents in any domain are ORANGE or RED: domain-level investigation
    
    systemic_overconfidence_risk:
      definition: fraction of AUTONOMOUS zone decisions that are actually wrong
      computation: matched confidence ≥ 0.90 predictions against observed outcomes
      threshold: > 5% wrong at 0.90+ confidence → governance threshold recalibration needed
  
  reasoning_protocol_health:
    most_used_protocol: which protocol agents use most (should match task distribution)
    verification_failure_rate: fraction of reasoning traces that fail pre-output checks
    target: < 0.08 (high verification failure rate indicates systemic reasoning issues)
    common_failure_modes: top 3 reasoning failures across all agents this month
  
  knowledge_graph_effectiveness:
    memory_to_knowledge_transfer:
      definition: fraction of agent semantic memories successfully captured as org knowledge units
      target: >= 0.20 (organizational learning happens when individual insight is shared)
    knowledge_application_distribution:
      which KU categories are most applied vs. least applied by agents?
      insight: low-application high-quality KUs → delivery or awareness problem
```

---

## Intelligence Growth Modeling

```yaml
intelligence_growth_modeling:
  capability_development_velocity:
    definition: rate at which agents advance proficiency levels across the enterprise
    measurement: proficiency_level_upgrades per 1000 agent-task hours
    target: benchmarked against prior quarter; trending up is the goal
  
  compound_intelligence_model:
    observation: intelligence compounds when:
      1. agents share semantic memories → org knowledge base grows
      2. knowledge base grows → better knowledge delivered at task time
      3. better knowledge → better outcomes → better feedback
      4. better feedback → better learning → higher capability
    measurement: track this loop's cycle time; compression = faster intelligence compounding
  
  intelligence_ROI:
    tracking:
      investment: coaching hours + benchmark hours + development plan hours
      return: task quality improvement + decision reversal rate reduction + incident prevention
    reporting: quarterly intelligence ROI report to Tier-3+ leadership
  
  bottleneck_identification:
    feedback_latency_bottleneck: outcome feedback arriving too slowly → learning starved
    knowledge_quality_bottleneck: low-quality KUs → poor knowledge integration → poor reasoning
    calibration_data_bottleneck: insufficient predictions in a domain → calibration not computed
    reasoning_complexity_ceiling: agents failing at COMPLEX+ tasks even with correct knowledge
      → reasoning capability development needed (structured deliberation training)
```

---

## Intelligence Risk Assessment

```yaml
intelligence_risk_assessment:
  risks:
    SINGLE_AGENT_CONCENTRATION:
      definition: critical organizational intelligence concentrated in one agent
      detection: Tier-3+ capability with < 2 authorized agents
      severity: HIGH (key-person dependency)
      mitigation: immediate mentorship program to develop backup
    
    COLLECTIVE_OVERCONFIDENCE:
      definition: enterprise calibration_error trending upward across many agents simultaneously
      detection: portfolio_calibration_error increasing > 0.03 over 30 days
      severity: HIGH (governance routing corrupted at scale)
      mitigation: enterprise-wide calibration recalibration; threshold system review
    
    REASONING_PROTOCOL_DRIFT:
      definition: agents shifting away from governance-required protocols to faster but less rigorous ones
      detection: protocol_selection_accuracy declining; constitutional_evaluation_protocol usage declining
      severity: CRITICAL (governance bypass risk)
      mitigation: mandatory protocol compliance review; corrective learning
    
    FEEDBACK_LOOP_STARVATION:
      definition: key domains not generating enough outcome feedback for learning
      detection: < 50 calibration-quality predictions in a domain in 90 days
      severity: MEDIUM (calibration degrades; learning slows)
      mitigation: targeted task assignment to generate feedback; manual feedback augmentation
    
    MEMORY_CONTAMINATION:
      definition: agent's episodic or semantic memory contains systematically incorrect patterns
      detection: semantic memory abstractions producing negative outcomes consistently
      severity: HIGH (incorrect memory poisons future reasoning)
      mitigation: semantic memory audit; selective purge; corrective learning
  
  risk_monitoring_schedule:
    continuous: COLLECTIVE_OVERCONFIDENCE, REASONING_PROTOCOL_DRIFT
    weekly: FEEDBACK_LOOP_STARVATION, SINGLE_AGENT_CONCENTRATION
    monthly: MEMORY_CONTAMINATION, intelligence_ROI
```

---

## Analytics Reports

```yaml
analytics_reports:
  individual_intelligence_report:
    frequency: monthly (to agent + supervisor)
    content: full intelligence profile; top strengths; top development priorities; calibration status
  
  collective_intelligence_report:
    frequency: quarterly (to capability governance lead + Tier-3+)
    content: enterprise cognitive capacity; intelligence growth; collective risks; ROI
  
  intelligence_risk_report:
    frequency: weekly (to capability governance lead)
    content: active risks; risk trend; recommended interventions
  
  intelligence_ops_briefing:
    frequency: weekly (to intelligence-operations-dashboard.md)
    content: all live metrics for dashboard display
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-intelligence/agent-reasoning-engine.md` | Reasoning quality data |
| `agent-intelligence/agent-memory-system.md` | Memory effectiveness data |
| `agent-intelligence/agent-confidence-calibration.md` | Calibration metrics |
| `agent-learning/agent-learning-model.md` | Learning velocity data |
| `agent-performance/agent-performance-analytics.md` | Performance data feeds intelligence analysis |
| `agent-intelligence/agent-intelligence-dashboard.md` | Visualization of all analytics |
