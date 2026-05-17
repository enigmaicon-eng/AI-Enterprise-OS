---
layer: coordination-runtime
type: coordination-protocols
version: 1.0.0
created: 2026-05-10
owner: master-orchestrator-agent
authority: enterprise-architecture-council
---

# Coordination Protocols

Formal protocol definitions for all inter-agent communication in the Enterprise AI OS. Every message between agents follows one of these protocols.

---

## Protocol Catalog

| Protocol ID | Name | Direction | Used For |
|---|---|---|---|
| CP-001 | Task Dispatch | Orchestrator → Agent | Assigning a task to an agent |
| CP-002 | Artifact Delivery | Agent → Coordinator | Returning a completed artifact |
| CP-003 | Escalation | Agent → Higher-tier | Requesting authority above current tier |
| CP-004 | Question | Agent → Any-tier | Requesting information or decision |
| CP-005 | Context Request | Agent → CRE | Requesting additional context mid-step |
| CP-006 | Consensus Vote | Agent → Consensus Engine | Submitting a vote |
| CP-007 | Veto | Agent → Orchestrator | Blocking a coordination plan action |
| CP-008 | Heartbeat | Agent → Monitor | Proof of liveness during long execution |
| CP-009 | Gate Notification | Coordinator → Human | Notifying of pending human approval |
| CP-010 | Coordination Sync | Orchestrator → All | Broadcasting a state update |

---

## CP-001: Task Dispatch

Sent by the coordination engine to assign a task to an agent.

```yaml
cp-001-task-dispatch:
  protocol: "CP-001"
  message-id: "{UUID}"
  sent-at: "{ISO-8601}"
  
  from: "coordination-engine"
  to: "{agent-id}"
  
  task:
    task-id: "{UUID}"
    routing-key: "{key}"
    description: "{task description}"
    complexity-score: {N}
    model-tier: "T0|T1|T2-Sonnet|T2-Opus"
    
  workflow-context:
    workflow-instance-id: "{id}"
    step-number: {N}
    step-id: "{step-name}"
    
  inputs:
    - type: "{artifact-type}"
      path: "{path}"
      required: true|false
      
  output-schema:
    type: "{artifact-type}"
    path: "{output-path}"
    template: "{template-path}"
    
  constraints:
    time-budget-seconds: {N}
    confidence-threshold: {N}
    risk-level: "LOW|MEDIUM|HIGH|CRITICAL"
    
  escalation-chain:
    - tier: T{N}
      agent: "{agent-id}"
```

---

## CP-002: Artifact Delivery

Sent by an agent to return a completed artifact to the coordination engine.

```yaml
cp-002-artifact-delivery:
  protocol: "CP-002"
  message-id: "{UUID}"
  sent-at: "{ISO-8601}"
  in-response-to: "{CP-001 message-id}"
  
  from: "{agent-id}"
  to: "coordination-engine"
  
  artifact:
    type: "{artifact-type}"
    path: "{artifact-path}"
    created-at: "{ISO-8601}"
    
  quality:
    confidence-assessment:
      composite-score: {N}
      threshold: {N}
      passed: true|false
    schema-validation: "PASSED|FAILED"
    consistency-check: "PASSED|WARN|FAILED"
    
  metadata:
    steps-taken: {N}
    context-tokens-used: {N}
    
  status: "COMPLETED|PARTIAL|FAILED"
  failure-reason: "{if FAILED}"
  partial-reason: "{if PARTIAL}"
```

---

## CP-003: Escalation

Sent by an agent to escalate a decision or problem to a higher-tier agent.

```yaml
cp-003-escalation:
  protocol: "CP-003"
  message-id: "{UUID}"
  sent-at: "{ISO-8601}"
  
  from: "{agent-id}"
  to: "{higher-tier-agent-id}"
  
  escalation-type: "AUTHORITY|CONFIDENCE|RISK|SCOPE|CONSTITUTIONAL"
  priority: "CRITICAL|HIGH|NORMAL"
  
  task-context:
    workflow-instance-id: "{id}"
    step-id: "{step-name}"
    task-description: "{what was being worked on}"
    
  escalation-reason: "{specific reason — why this exceeds current agent's authority}"
  
  question-or-decision-needed: "{what the higher tier must provide}"
  
  current-agent-recommendation: "{what the escalating agent would do if it had authority}"
  
  evidence-attached:
    - path: "{artifact or analysis}"
    
  sla: "{ISO-8601 deadline}"
  if-not-resolved-by-sla: "ESCALATE_FURTHER|PAUSE_WORKFLOW|ABORT_STEP"
```

---

## CP-004: Question

Sent by an agent when it needs information that is not in its context package.

```yaml
cp-004-question:
  protocol: "CP-004"
  message-id: "{UUID}"
  sent-at: "{ISO-8601}"
  
  from: "{agent-id}"
  to: "{answering-agent-id}"
  
  question-type: "FACTUAL|CLARIFICATION|DECISION|GUIDANCE"
  
  question: "{specific question text}"
  
  context:
    why-this-question-is-blocking: "{explanation}"
    what-work-is-paused: "{step-id}"
    
  acceptable-answer-format: "FREE_TEXT|STRUCTURED|BINARY"
  
  urgency: "BLOCKING|NON_BLOCKING"  # if BLOCKING: pause step until answered
  sla: "{ISO-8601 deadline if BLOCKING}"
```

---

## CP-005: Context Request

Sent by an agent mid-step to request additional context from the context-routing-engine.

```yaml
cp-005-context-request:
  protocol: "CP-005"
  message-id: "{UUID}"
  sent-at: "{ISO-8601}"
  
  from: "{agent-id}"
  to: "context-routing-engine"
  
  current-step:
    workflow-instance-id: "{id}"
    step-id: "{step-name}"
    
  missing-context:
    - type: "MEMORY_ENTRY|WIKI_PAGE|ARTIFACT|ADR"
      description: "{what is needed}"
      keywords: ["{search terms}"]
      priority: "P0|P1|P2"
      
  current-budget-remaining: {N}  # tokens available for additional context
```

---

## CP-006: Consensus Vote

Sent by an agent participating in a consensus protocol.

```yaml
cp-006-consensus-vote:
  protocol: "CP-006"
  message-id: "{UUID}"
  sent-at: "{ISO-8601}"
  
  from: "{agent-id}"
  to: "consensus-engine"
  
  consensus-id: "{UUID}"
  consensus-protocol: "WEIGHTED_VOTE|ARBITER|QUALIFIED_MAJORITY"
  
  vote:
    position: "{position or option ID}"
    stance: "APPROVE|REJECT|ABSTAIN|ALTERNATIVE"
    confidence: {0-100}
    
  reasoning:
    thesis: "{one sentence}"
    supporting-evidence:
      - claim: "{claim}"
        source: "{path}"
    key-risk-if-rejected: "{risk}"
    
  constraints-honored:
    - "{binding constraint this vote respects}"
```

---

## CP-007: Veto

Sent by an agent to block a specific coordination plan action. Rare — requires justification.

```yaml
cp-007-veto:
  protocol: "CP-007"
  message-id: "{UUID}"
  sent-at: "{ISO-8601}"
  
  from: "{agent-id}"
  to: "coordination-engine"
  
  veto-target:
    coordination-plan-id: "{id}"
    step-id: "{step being vetoed}"
    action: "{specific action being blocked}"
    
  veto-grounds: "CONSTITUTIONAL|GOVERNANCE|SECURITY|AUTHORITY_VIOLATION|RISK_UNACCEPTABLE"
  
  specific-rule-violated: "{which principle, ADR, or constitutional rule}"
  
  evidence: "{what the agent observed that triggered the veto}"
  
  proposed-alternative: "{what should happen instead}"
  
  authority-check:
    # Veto authority: T2 agents may veto T1 steps; T3+ may veto any step
    vetoing-agent-tier: T{N}
    target-step-tier: T{N}
    authority-valid: true|false
```

**Note:** A veto from an agent without sufficient authority (e.g., T1 trying to veto a T2 decision) is rejected by the coordination engine and escalated as a potential governance issue.

---

## CP-008: Heartbeat

Sent by long-running agents to indicate they are still alive and making progress.

```yaml
cp-008-heartbeat:
  protocol: "CP-008"
  message-id: "{UUID}"
  sent-at: "{ISO-8601}"
  
  from: "{agent-id}"
  to: "execution-monitor"
  
  workflow-instance-id: "{id}"
  step-id: "{step-name}"
  
  progress-indicator: "{brief: what is being worked on right now}"
  estimated-completion: "{ISO-8601}"
  context-tokens-used-so-far: {N}
  concerns: "{any issues emerging, or null}"
```

**Frequency:** Every 10 minutes for T2-Opus dispatches; every 5 minutes for T2-Sonnet; not required for T1.

---

## CP-009: Gate Notification

Sent by the coordination engine to notify a human that approval is required.

```yaml
cp-009-gate-notification:
  protocol: "CP-009"
  message-id: "{UUID}"
  sent-at: "{ISO-8601}"
  
  to: "human-operator"
  
  gate-type: "HUMAN_APPROVAL|HUMAN_REVIEW|HUMAN_DECISION"
  priority: "CRITICAL|HIGH|NORMAL"
  
  artifact-requiring-approval:
    type: "{artifact-type}"
    path: "{path}"
    produced-by: "{agent-id}"
    confidence: {N}
    
  what-approval-means: "{what will happen if approved}"
  what-rejection-means: "{what happens if rejected}"
  
  context-summary: "{max 500 tokens — what the human needs to know}"
  
  sla-deadline: "{ISO-8601}"
  action-if-no-response: "ESCALATE|PAUSE_INDEFINITELY"
  
  approve-instruction: "{how to approve: command or action}"
  reject-instruction: "{how to reject with feedback}"
```

---

## CP-010: Coordination Sync

Broadcast from orchestrator to all active agents to synchronize on a state change.

```yaml
cp-010-coordination-sync:
  protocol: "CP-010"
  message-id: "{UUID}"
  sent-at: "{ISO-8601}"
  
  from: "master-orchestrator-agent"
  to: "all-active-agents"
  
  sync-type: "RISK_LEVEL_CHANGE|CONSISTENCY_ANCHOR_UPDATE|WORKFLOW_ABORT|EMERGENCY_PAUSE"
  
  payload:
    change-description: "{what changed}"
    effective-immediately: true|false
    action-required: "{what active agents should do}"
    
  new-state:
    "{relevant state fields that changed}"
```