# Enterprise Workflow Standards

## Role
Defines the canonical schema, conventions, and enforcement rules that all enterprise workflows must conform to. Every workflow in `enterprise-workflows/` is a deterministic execution specification: same inputs always produce the same states, gates, and outputs.

## Workflow Schema

```yaml
workflow:
  id: string                    # WF-NNN format; globally unique
  name: string
  version: semver
  owner_org: string             # which org owns this workflow
  tier_required: T1..T5         # minimum tier to initiate
  classification: STANDARD | ELEVATED | REGULATED | CRITICAL
  
  description: string
  purpose: string               # one-sentence why this workflow exists
  
  inputs:
    required: [{name, type, description, validation}]
    optional: [{name, type, description, default}]
  
  outputs:
    artifacts: [{name, type, schema_ref, destination}]
    events: [{event_type, topic, payload_schema}]
  
  lifecycle:
    states: [STATE_NAME]
    initial_state: STATE_NAME
    terminal_states: [STATE_NAME]
    transitions: [{from, to, trigger, guard, action}]
  
  execution_graph:
    steps: [workflow_step]      # DAG; see step schema below
  
  routing:
    intake_agent: agent_id
    primary_agents: [agent_id]
    escalation_agents: [{condition, agent_id}]
  
  approval_gates: [gate_def]
  
  escalation:
    rules: [escalation_rule]
    max_escalation_tier: T1..T5
  
  governance:
    checkpoints: [checkpoint_def]
    constitution_refs: [C-001..C-012]
    regulatory_refs: [regulation_tag]
  
  observability:
    health_metrics: [metric_def]
    sla: {total_duration_target, gate_sla_map}
  
  telemetry:
    events: [telemetry_event]
    topic_prefix: string
  
  rollback:
    rollback_window: duration
    rollback_steps: [step_id]
    rollback_trigger: [condition]
  
  integrations:
    systems: [{system_id, operation, trigger}]
  
  persistence:
    wiki_updates: [wiki_section]
    memory_updates: [memory_file]
```

## Workflow Step Schema

```yaml
workflow_step:
  step_id: string               # S-NNN; unique within workflow
  name: string
  type: HUMAN | AGENT | GATE | INTEGRATION | DECISION | PARALLEL | WAIT
  
  agent_id: string              # if AGENT type
  tier_required: T1..T5         # if HUMAN type
  
  inputs: [step_input]
  outputs: [step_output]
  
  depends_on: [step_id]         # empty = root step
  
  gate:
    evaluator: AUTOMATED | HUMAN | HYBRID
    pass_threshold: number
    retry_limit: number
    on_fail: RETRY | ESCALATE | TERMINATE | SKIP
  
  timeout:
    duration: string            # ISO 8601 duration
    on_timeout: ESCALATE | RETRY | TERMINATE
  
  sla:
    target: string
    breach_action: ALERT | ESCALATE | BLOCK_NEXT
```

## State Machine Convention

```
ALL WORKFLOWS follow this skeleton:
  INITIATED → VALIDATING → [workflow-specific states] → COMPLETED | FAILED | CANCELLED

TERMINAL STATES:
  COMPLETED:  all outputs produced; artifacts persisted; wiki updated
  FAILED:     unrecoverable error; rollback triggered if within window
  CANCELLED:  intentionally stopped by authorized tier; partial artifacts marked INCOMPLETE

SUSPENSION STATES (non-terminal, waiting):
  PENDING_APPROVAL:   waiting for human gate
  PENDING_INPUT:      waiting for required artifact from upstream
  BLOCKED:            dependency unavailable; auto-resumes when unblocked
  ESCALATED:          sent up tier hierarchy; awaiting decision
```

## Approval Gate Convention

```
GATE NAMING:
  G-AUTH:     authentication gate (does initiator have required tier?)
  G-QUALITY:  quality/completeness gate (automated evaluation)
  G-ARCH:     architecture review gate (T4 architect)
  G-SECURITY: security review gate (T4 CISO / security team)
  G-EXEC:     executive approval gate (T5 CPO/CTO/CFO)
  G-LEGAL:    legal / compliance review gate (T4 DPO / legal)
  G-LAUNCH:   launch readiness gate (T4 multi-stakeholder)
  G-RELEASE:  production release gate (production-safety-system.md)

GATE RESULT: PASS | FAIL | CONDITIONAL_PASS (conditions noted in artifact)
GATE TIMEOUT: configured per gate; timeout → ESCALATE to next tier
```

## Escalation Rules Convention

```
ESCALATION TRIGGER TYPES:
  SLA_BREACH:       step or gate exceeds SLA target
  GATE_FAIL:        gate fails N times (usually N=2 for critical gates)
  ANOMALY:          AI confidence below threshold on key output
  BLOCKING:         downstream teams blocked due to dependency
  SEVERITY_CHANGE:  event reclassified to higher severity

ESCALATION PATH:
  T1 → T2 → T3 → T4 → T5
  Each tier has SLA to acknowledge: T2=4hr, T3=2hr, T4=1hr, T5=30min
```

## Telemetry Event Convention

```
ALL WORKFLOWS emit:
  {workflow_id}.initiated       on INITIATED state entry
  {workflow_id}.gate.{gate_id}  on each gate (result: PASS|FAIL|CONDITIONAL)
  {workflow_id}.escalated       on any escalation
  {workflow_id}.completed       on COMPLETED state entry
  {workflow_id}.failed          on FAILED state entry
  {workflow_id}.cancelled       on CANCELLED state entry
  {workflow_id}.sla_breached    when any SLA target exceeded

ALL published to topic: enterprise.workflows.{workflow_id}
```

## Artifact Naming Convention

```
ARTIFACT_ID: {workflow_id}-{artifact_type}-{run_id}
ARTIFACT_TYPES: PRD | RFC | ADR | SPEC | PLAN | REPORT | RUNBOOK | REVIEW | DECISION | INCIDENT | POSTMORTEM
VERSION: semver; incremented on each revision
CLASSIFICATION: inherited from workflow classification or input data classification
DESTINATION: wiki/{path} | memory/{file} | integration/{system}
```

## Rollback Convention

```
ROLLBACK ELIGIBILITY:
  Within rollback_window of COMPLETED: eligible
  After rollback_window: requires T4 manual override

ROLLBACK STEPS:
  Executed in REVERSE order of original execution
  Integration side effects: reversed via integration rollback APIs
  Artifacts: marked SUPERSEDED (never deleted)
  Wiki updates: revision entry added noting rollback reason
  Memory updates: reverted to pre-workflow snapshot
```
