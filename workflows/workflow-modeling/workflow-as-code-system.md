# Workflow-as-Code System

## Purpose
Enables workflow definitions to be authored, versioned, and deployed as code artifacts. Workflows-as-code are YAML/JSON definitions that compile to BPMN and ultimately to executable DAGs. This is the developer-facing authoring interface for the enterprise process modeling stack.

---

## Authoring Format

All workflow definitions are YAML files stored in `workflows/` with the `.workflow.yaml` extension.

### Complete Schema

```yaml
# =============================================
# WORKFLOW DEFINITION SCHEMA v2.0
# =============================================

workflow:
  # Identity
  id: "PROC-DOMAIN-NNN"                    # must match bpmn-process-catalog ID
  name: "Human-readable Name"
  version: "MAJOR.MINOR.PATCH"
  description: "what this workflow does and why"
  
  # Classification
  owner: "org-name"                         # registered org in agents/
  classification: OPERATIONAL | GOVERNANCE | CASE | INCIDENT | INTEGRATION
  complexity: SIMPLE | MODERATE | COMPLEX | ENTERPRISE
  
  # Governance
  governance:
    tier_required: 0–5
    constitutional_check: true/false
    audit_level: NONE | STANDARD | ENHANCED
    approver_roles: [role-string]
  
  # SLA
  sla:
    target_duration: "ISO-8601 duration"    # e.g., PT1H = 1 hour
    p99_duration: "ISO-8601 duration"
    breach_action: escalate | alert | fail
  
  # Interface
  inputs:
    field_name:
      type: string | integer | boolean | object | array
      required: true/false
      description: "field description"
      validation: "CEL expression"
  
  outputs:
    field_name:
      type: string | integer | boolean | object | array
      description: "field description"
  
  error_codes:
    ERR_CODE:
      description: "when this error occurs"
      recoverable: true/false
      recovery_action: "description"
  
  # Steps
  steps:
    - id: "step-id"
      name: "Step Name"
      type: service | human | decision | script | subprocess | parallel | exclusive | event_wait
      
      # For service steps
      executor:
        capability: "capability-string"
        agent_pool: "pool-name | any"
        tier_min: 0–5
      
      # For human steps
      approver:
        role: "role-string"
        tier: 1–5
        sla: "ISO-8601 duration"
        escalation_role: "role-string"
      
      # For decision steps
      decision:
        model_id: "DECISION-MODEL-ID"
        inputs_mapping: {model_input: "$.context.field"}
        outputs_mapping: {context_field: "model_output"}
      
      # For subprocess steps
      subprocess:
        process_id: "PROC-XXX-NNN"
        inputs_mapping: {subprocess_input: "$.context.field"}
        outputs_mapping: {context_field: "subprocess_output"}
      
      # For parallel steps
      parallel:
        branches: [step-id-list]
        join_strategy: all | first | quorum
        quorum_threshold: 0.0–1.0   # only for quorum join
      
      # For exclusive gateway steps
      exclusive:
        conditions:
          - condition: "CEL expression"
            next: "step-id"
          - condition: "CEL expression"
            next: "step-id"
        default: "step-id"
      
      # For event_wait steps
      event_wait:
        topic: "event-bus-topic"
        filter: "CEL expression"
        timeout: "ISO-8601 duration"
        on_timeout: "step-id | ERR_CODE"
      
      # Common fields
      timeout: "ISO-8601 duration"
      retry:
        policy: none | linear | exponential
        max_attempts: integer
        base_delay: "ISO-8601 duration"
      compensation:
        step_id: "step-id"           # step to run if this step needs to be compensated
      governance:
        tier_required: 0–5
        constitutional_check: true/false
      next: "step-id | null"         # null = end of flow
      on_error:
        handler: "step-id"
        or_codes: [ERR_CODE]         # null = catch all
  
  # Initial step
  start: "step-id"
```

---

## Example Workflow Definition

```yaml
workflow:
  id: PROC-ENG-002
  name: Code Review and Merge Process
  version: 1.0.0
  description: Automated code review with AI analysis followed by human senior engineer approval for production-bound changes.
  
  owner: engineering
  classification: OPERATIONAL
  complexity: MODERATE
  
  governance:
    tier_required: 2
    constitutional_check: false
    audit_level: STANDARD
    approver_roles: [senior-engineer, tech-lead]
  
  sla:
    target_duration: PT4H
    p99_duration: PT8H
    breach_action: escalate
  
  inputs:
    pull_request_id:
      type: string
      required: true
    branch_name:
      type: string
      required: true
    target_environment:
      type: string
      required: true
      validation: "target_environment in ['staging', 'production']"
  
  outputs:
    merge_status:
      type: string
    review_decision:
      type: string
    merge_commit_id:
      type: string
  
  error_codes:
    ERR_REVIEW_TIMEOUT:
      description: Senior engineer did not complete review within SLA
      recoverable: true
      recovery_action: Auto-escalate to tech-lead
    ERR_QA_GATE_FAILED:
      description: Automated quality gates did not pass
      recoverable: false
      recovery_action: Return to author for fixes
  
  steps:
    - id: run-qa-gates
      name: Run Automated QA Gates
      type: service
      executor:
        capability: qa_gate_execution
        agent_pool: qa-agents
        tier_min: 1
      timeout: PT15M
      retry:
        policy: linear
        max_attempts: 2
        base_delay: PT1M
      on_error:
        handler: reject-pr
        or_codes: [ERR_QA_GATE_FAILED]
      next: ai-code-analysis

    - id: ai-code-analysis
      name: AI Code Analysis
      type: service
      executor:
        capability: code_review_analysis
        agent_pool: engineering-agents
        tier_min: 2
      timeout: PT10M
      next: human-review
    
    - id: human-review
      name: Senior Engineer Review
      type: human
      approver:
        role: senior-engineer
        tier: 2
        sla: PT4H
        escalation_role: tech-lead
      next: merge-decision
    
    - id: merge-decision
      name: Merge or Reject?
      type: exclusive
      exclusive:
        conditions:
          - condition: "$.steps.human-review.output.decision == 'APPROVE'"
            next: execute-merge
          - condition: "$.steps.human-review.output.decision == 'REQUEST_CHANGES'"
            next: request-changes
        default: reject-pr
    
    - id: execute-merge
      name: Execute Git Merge
      type: service
      executor:
        capability: git_merge_execution
        tier_min: 2
      timeout: PT5M
      compensation:
        step_id: revert-merge
      next: notify-success
    
    - id: revert-merge
      name: Revert Merge (Compensation)
      type: service
      executor:
        capability: git_revert
        tier_min: 2
      timeout: PT5M
      next: null
    
    - id: notify-success
      name: Notify Success
      type: service
      executor:
        capability: notification
      next: null
    
    - id: request-changes
      name: Return to Author
      type: service
      executor:
        capability: notification
      next: null
    
    - id: reject-pr
      name: Reject PR
      type: service
      executor:
        capability: notification
      next: null
  
  start: run-qa-gates
```

---

## Compilation Pipeline

```
workflow.yaml
  ↓ [schema-validate]
  ↓ [resolve subprocess references]
  ↓ [expand parallel/exclusive into BPMN gateway structures]
  ↓ [inject governance checkpoints]
  ↓ [emit BPMN XML/AST]
  ↓ bpmn/bpmn-validation-engine.md
  ↓ bpmn/bpmn-orchestration-bridge.md
  ↓ orchestration-dag-system.md (compiled artifact)
```

---

## Version Control Rules

```yaml
version_control:
  storage: workflows/ directory in enterprise repository
  file_naming: "{process-id}-{version}.workflow.yaml"
  immutability: |
    Once a workflow version is ACTIVE, the corresponding .yaml file is immutable.
    Changes require creating a new version file with incremented version number.
  
  git_requirements:
    branch_protection: main branch protected
    required_reviewers: 2 (process-owner + governance)
    ci_checks:
      - schema_validation
      - structural_validation
      - governance_validation
      - breaking_change_detection
  
  breaking_change_detection:
    breaking:
      - removing required input
      - changing input/output type
      - removing error code
      - changing governance.tier_required to higher value
    non_breaking:
      - adding optional input
      - adding new error code
      - changing SLA (warning only)
      - adding optional step
```

---

## IDE Support

```yaml
language_support:
  schema_validation: JSON Schema available at schemas/workflow-schema-v2.json
  autocomplete: LSP server at tools/workflow-lsp
  linting: workflow-lint CLI
  preview: workflow-preview CLI (renders BPMN diagram from YAML)
  
  cli_commands:
    validate: "workflow-lint validate {file}"
    compile: "workflow-compile {file} --output {dir}"
    preview: "workflow-preview {file} --format svg|ascii"
    diff: "workflow-diff {file-v1} {file-v2}"   # breaking change analysis
```
