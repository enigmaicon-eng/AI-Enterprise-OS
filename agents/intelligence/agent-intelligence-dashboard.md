# Agent Intelligence Operations Dashboard

## Purpose
The unified observability console for all enterprise agent intelligence and learning operations. Consolidates signals from capability systems, performance trackers, learning engines, reasoning systems, memory systems, and calibration monitors into a single real-time operational view for capability governance leads, supervisors, and Tier-3+ leadership.

---

## Dashboard Architecture

```
Data Sources (real-time feeds)
├── agent-capabilities/ (all systems)        → capability profiles, skill registry
├── agent-performance/ (all systems)         → performance scores, coaching plans
├── agent-learning/ (all systems)            → learning events, adaptation, governance
├── agent-intelligence/agent-reasoning-engine.md     → reasoning quality metrics
├── agent-intelligence/agent-memory-system.md        → memory effectiveness
├── agent-intelligence/agent-confidence-calibration.md → calibration health
└── agent-intelligence/agent-intelligence-analytics.md → intelligence analytics

        ↓ 60-second aggregation

[Agent Intelligence Dashboard]
├── [Capability Portfolio]     → coverage, gaps, assessment health
├── [Performance Health]       → scores, coaching pipeline, trends
├── [Learning Activity]        → adaptations, acquisitions, governance
├── [Intelligence Quality]     → reasoning, memory, calibration
├── [Risk Monitor]             → active intelligence risks
└── [Operator Actions]         → interventions available
```

---

## Full Console View

```
╔════════════════════════════════════════════════════════════════════════════════════════╗
║  ENTERPRISE AGENT INTELLIGENCE OPERATIONS              2026-05-15 15:22 UTC           ║
║  Intelligence Health: ✓ 0.81  |  Active Risks: 2  |  Refresh: 60s                   ║
╠══════════════════════════════════╦═════════════════════════════════════════════════════╣
║  CAPABILITY PORTFOLIO            ║  ACTIVE ALERTS                                      ║
║  ─────────────────────────────   ║  ─────────────────────────────────────────────     ║
║  Agents (Active): 144            ║  ⚠[HIGH]  constitutional_eval: only 2 EXPERT      ║
║  Capability Assessments:         ║            agents authorized (min=3)               ║
║    Due This Week:    12          ║  ⚠[WARN]  ORCHESTRATION cohort P10 below target   ║
║    Overdue:           3  ⚠       ║                                                     ║
║  Proficiency Distribution:       ║  CALIBRATION STATUS                                 ║
║    EXPERT:     8%                ║  ─────────────────────────────────────────────     ║
║    PROFICIENT: 31%               ║  Portfolio Calib. Error:  0.11  ✓                  ║
║    CAPABLE:    44%               ║  Agents GREEN:   108  (75%)  ✓                     ║
║    NOVICE:     15%               ║  Agents YELLOW:   28  (19%)  ✓                     ║
║    NONE:        2%               ║  Agents ORANGE:    7   (5%)  ⚠                     ║
║  Skill Grants This Week:  14     ║  Agents RED:       1   (1%)  ⚠ [view]             ║
║  Pending Authorizations:   5     ║                                                     ║
╠══════════════════════════════════╩═════════════════════════════════════════════════════╣
║  PERFORMANCE HEALTH (30-day rolling)                                                    ║
║  ─────────────────────────────────────────────────────────────────────────────────    ║
║  Tier        EXCEPTIONAL  STRONG  ADEQUATE  DEVELOPING  CONCERNING  Avg Score         ║
║  T1 (n=48)      12%        51%      31%        5%         1%  ✓      0.74  ✓          ║
║  T2 (n=53)      18%        48%      27%        6%         1%  ✓      0.77  ✓          ║
║  T3 (n=33)      24%        45%      24%        5%         2%  ✓      0.80  ✓          ║
║  T4 (n=10)      30%        50%      20%        0%         0%  ✓      0.84  ✓          ║
║  Active Coaching Plans:  11   |  Escalated to L2+:  2   |  Avg Plan Completion: 0.72 ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║  LEARNING ACTIVITY (last 7 days)              REASONING QUALITY (last 30 days)         ║
║  ───────────────────────────────────────      ──────────────────────────────────────   ║
║  Adaptation Events:     247               Protocol Completion Rate:  0.91  ✓           ║
║    AUTO_AUTHORIZED:     198 (80%)         Verification Pass Rate:    0.88  ✓           ║
║    SUPERVISOR_NOTIFIED:  41 (17%)         Most Used Protocol:        CHAIN_OF_THOUGHT  ║
║    SUPERVISOR_APPROVED:   8  (3%)         Constitutional Protocol:    23 uses  ✓       ║
║  Skill Acquisitions:     12               Top Failure Mode:           anchoring (31%)  ║
║  Corrective Learning:     1               Reasoning Coaching:          3 agents        ║
║  Learning Freezes:        0  ✓           ─────────────────────────────────────────    ║
║  Governance Violations:   0  ✓           MEMORY EFFECTIVENESS                          ║
║                                           Episodic Recall Relevance:  0.64  ✓          ║
║  INTELLIGENCE GROWTH (90d)                Semantic Memory Accuracy:   0.77  ✓          ║
║  Cap. Upgrades:  31 proficiency levels    Knowledge Integration Rate: 0.54  ✓          ║
║  Org KU Contributions:  8 (from agents)  Semantic→OrgKU Transfer:    0.22  ✓          ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║  CAPABILITY COVERAGE BY DOMAIN                                                          ║
║  ─────────────────────────────────────────────────────────────────────────────────    ║
║  Capability                    PROFICIENT+  EXPERT  Critical  Risk                     ║
║  constitutional_evaluation         7          2       YES      ⚠ (min 3 EXPERT)       ║
║  policy_interpretation             11          3       YES      ✓                      ║
║  risk_assessment                   18          5       YES      ✓                      ║
║  multi_agent_orchestration         14          4       YES      ✓                      ║
║  causal_reasoning                  22          6       NO       ✓                      ║
║  synthesis_and_integration         19          4       NO       ✓                      ║
║  override_assessment                5          1       YES      ⚠ (min 2 EXPERT)       ║
║  escalation_judgment               31          8       YES      ✓                      ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║  INTELLIGENCE RISK MONITOR              COLLECTIVE INTELLIGENCE SCORE                   ║
║  ──────────────────────────────────     ──────────────────────────────────────────     ║
║  Risk: SINGLE_AGENT_CONCENTRATION       Reasoning Quality:    0.82  ✓                 ║
║    Capability: constitutional_eval      Calibration Health:   0.79  ✓                 ║
║    Severity: HIGH  Age: 3 days          Learning Velocity:    0.77  ✓                 ║
║    Mitigation: [Initiate Mentorship]    Memory Effectiveness: 0.76  ✓                 ║
║  Risk: OVERRIDE_ASSESS_GAP              Capability Coverage:  0.73  ⚠                 ║
║    Severity: WARN  Age: 1 day           ───────────────────────────────────           ║
║    Mitigation: [Review Authorization]   Intelligence Health:  0.81  ✓                 ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║  OPERATOR ACTIONS                                                                       ║
║  [Initiate Mentorship]  [Trigger Assessment]  [Review Learning Events]  [Grant Skill]  ║
║  [Export Report]        [Configure Alerts]    [View Calibration Detail] [Risk Detail]  ║
╚════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## Drill-Down Capabilities

```yaml
drill_downs:
  capability_detail:
    shows: all agents with this capability; proficiency distribution; assessment history; trend
    actions: [initiate_assessment, assign_mentor, revoke_authorization, grant_skill]
  
  agent_intelligence_profile:
    shows: full intelligence profile (capability + performance + calibration + learning + reasoning)
    actions: [create_coaching_plan, assign_mentor, freeze_learning, initiate_assessment]
  
  calibration_detail:
    shows: per-agent calibration curve; ECE by domain; correction history; trend
    actions: [apply_correction, initiate_coaching, restrict_domain, escalate]
  
  learning_event_log:
    shows: all adaptation events in time range; filter by type/agent/authorization level
    actions: [rollback_event, freeze_agent_learning, escalate_for_review]
  
  reasoning_trace_viewer:
    shows: full reasoning trace for a specific task; step-by-step with verification results
    actions: [flag_for_coaching, submit_to_knowledge_capture, mark_as_example]
  
  risk_detail:
    shows: risk evidence; affected agents; historical trend; recommended mitigations
    actions: [acknowledge, assign_remediation, dismiss_false_positive, escalate]
  
  cohort_comparison:
    shows: any agent vs. their cohort; percentile ranking per dimension
    actions: [view_top_performer_for_mentorship, view_struggling_cohort]
```

---

## Intelligence Health Score

```yaml
intelligence_health_score:
  formula:
    reasoning_quality_score:     weight 0.25
    calibration_health_score:    weight 0.25
    learning_velocity_score:     weight 0.20
    memory_effectiveness_score:  weight 0.15
    capability_coverage_score:   weight 0.15
  
  hard_penalties:
    any_RED_calibration_agent_in_GOVERNANCE_role: − 0.10
    any_CRITICAL_intelligence_risk_unresolved_>7d: − 0.15
    constitutional_evaluation_EXPERT_count < 2: − 0.20
  
  health_tiers:
    EXCELLENT: >= 0.88
    HEALTHY:   >= 0.75
    ATTENTION: >= 0.60
    CONCERN:   >= 0.45
    CRITICAL:  < 0.45  → immediate Tier-4+ briefing required
```

---

## Alert Configuration

```yaml
alert_configuration:
  critical_alerts_always_on:
    - GOVERNANCE_capability EXPERT count < 2
    - any agent CRITICAL calibration in GOVERNANCE domain
    - learning governance violation detected
    - reasoning protocol compliance drop below 0.75
  
  configurable_alerts:
    PERFORMANCE_CONCERNING_RATE: threshold (default: > 5% agents CONCERNING)
    CALIBRATION_ORANGE_RATE: threshold (default: > 10% agents ORANGE)
    ADAPTATION_VELOCITY_SPIKE: threshold (default: > 3× weekly average in 24h)
  
  alert_escalation:
    HIGH_unacknowledged_>2h: email to capability governance lead
    CRITICAL_unacknowledged_>30m: Tier-4+ notification
```

---

## Integration Points

| System | Role |
|---|---|
| All `agent-capabilities/` systems | Capability and skill data |
| All `agent-performance/` systems | Performance scores and coaching |
| All `agent-learning/` systems | Learning events and governance |
| `agent-intelligence/agent-reasoning-engine.md` | Reasoning quality metrics |
| `agent-intelligence/agent-memory-system.md` | Memory effectiveness |
| `agent-intelligence/agent-confidence-calibration.md` | Calibration health |
| `agent-intelligence/agent-intelligence-analytics.md` | All intelligence analytics |
| `enterprise-telemetry/enterprise-event-bus.md` | Real-time event stream |
| `knowledge-governance/knowledge-operations-dashboard.md` | Cross-dashboard coordination |
