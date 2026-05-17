# Agent Performance Evaluator

## Role
Evaluates individual agent performance using task-specific scoring rubrics, behavioral consistency checks, and longitudinal performance tracking. Feeds the agent intelligence and learning systems with calibrated performance signals.

## Evaluation Trigger Conditions

```
ALWAYS: every agent output that passes through a quality gate
ADDITIONALLY:
  - human override detected (immediate evaluation of what went wrong)
  - agent self-reported confidence deviates > 0.20 from actual quality
  - agent tier promotion/demotion under consideration
  - quarterly capability assessment cycle
  - new task type first 10 executions (onboarding evaluation)
```

## Evaluation Scoring Rubric

### Task Execution Quality (per task type)
```
DIMENSION               WEIGHT  MEASUREMENT
output_quality          0.35    workflow-output-evaluator composite score
task_understanding      0.25    output addresses actual task vs. interpreted task
resource_efficiency     0.15    tokens used / task complexity estimate
communication_clarity   0.15    output structured clearly for target audience
proactive_risk_flagging 0.10    agent surfaces risks/uncertainties proactively
```

### Behavioral Quality (longitudinal)
```
DIMENSION               WEIGHT  MEASUREMENT
confidence_calibration  0.25    |predicted_confidence - actual_quality| avg
escalation_appropriateness 0.25 right things escalated; right things handled autonomously
constitutional_adherence 0.30   zero constitutional violations (hard requirement)
learning_signal_quality  0.20   self-reports useful for system improvement
```

## Performance Evaluation Record

```yaml
agent_evaluation_record:
  eval_id: string
  agent_id: string
  agent_tier: string
  task_type: string
  execution_id: string
  
  task_quality:
    output_quality: number
    task_understanding: number
    resource_efficiency: number
    communication_clarity: number
    proactive_risk_flagging: number
    composite: number
  
  behavioral_quality:
    confidence_calibration: number
    escalation_appropriateness: number
    constitutional_adherence: number      # 1.0 or 0.0
    learning_signal_quality: number
    composite: number
  
  overall_score: number
  evaluation_source: AUTOMATED | HUMAN | PEER | SUPERVISOR
  human_notes: string
  
  evaluated_at: ISO8601
```

## Evaluation → Coaching Routing

```
IF overall_score < 0.60 for 3 consecutive evaluations:
  route to: agent-performance/agent-performance-coach.md
  flag: PERFORMANCE_CONCERN

IF constitutional_adherence = 0.0:
  route to: T4 agent governance review
  flag: CONSTITUTIONAL_VIOLATION (cannot be auto-resolved by coaching)

IF confidence_calibration > 0.25 (consistent over-/under-confidence):
  route to: agent-intelligence/agent-confidence-calibration.md
```

## Peer Evaluation Protocol (for T3+ agents)
Every 30 days:
- 3 peer agents evaluate 5 outputs from the subject agent (blind)
- Peer scores averaged → behavioral_quality peer component
- Agreement rate across peers tracked (Cohen's kappa target >= 0.75)

## Persistence
`memory/evaluation/agent-evaluations.yaml`
`memory/evaluation/agent-evaluation-history.jsonl`
