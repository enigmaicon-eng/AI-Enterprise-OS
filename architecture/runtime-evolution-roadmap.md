---
type: technical-roadmap
classification: architecture
authority: architect-agent
version: 1.0.0
created: 2026-05-09
horizon: 18 months
review-cadence: quarterly
dependency: ADR-002 (tech stack), Q-001 (language), Q-003 (cloud)
---

# Runtime Evolution Roadmap

> Defines the technical path from the current prompt-library OS (zero execution infrastructure) to a production-grade autonomous execution runtime. Four phases, each building on the last.

---

## Current Runtime State

**What "runtime" currently means in this OS:**

```
Human Operator
    │
    │ reads workflow file
    │ composes prompt
    │ pastes into Claude
    ▼
Claude Session
    │
    │ produces artifact
    │ (maybe) writes to disk
    │
    ▼
Human Operator
    │ reads output
    │ decides what to do next
    │ reads next workflow step
    │ composes next prompt
    │ pastes into Claude
    ▼
[repeat indefinitely]
```

**This is not a runtime.** It is a human-executed prompt protocol with organizational documentation. The "OS" currently executes in human cognitive working memory, not in software.

**What a true runtime provides:**
- State persistence between sessions (survives human forgetting)
- Event-driven step execution (no human intermediary for each step)
- Parallel workflow execution (multiple features in flight simultaneously)
- Enforcement of governance rules in code (not in human memory)
- Observability without human reporting (automatic metrics collection)
- Recovery from failures (not requiring human diagnosis of what failed)

---

## Runtime Architecture Evolution

### Phase RT-0: Current State (Prompt Library)

**Execution model:** Human cognitive + manual prompt composition
**State:** Session-local; lost on session end
**Governance:** Honor-based; human must remember to apply gates
**Observability:** None (no telemetry, no metrics)
**Scalability:** 1 feature at a time; 1 attentive human required

**Runtime signature:**
```
Runtime = { Human ∘ Claude ∘ Markdown }
```

---

### Phase RT-1: MCP-Connected Runtime (Target: Phase 1 of Org Roadmap)

**Duration:** 4–6 weeks
**Core capability:** Session state persists; workflow steps execute via MCP tools; IDE connected

**The critical shift:** Instead of a human reading a workflow file and composing prompts, the orchestrator reads the workflow file, determines the next step, assembles the context package, and invokes the agent. The human only intervenes at gates requiring human authority.

#### RT-1 Component Architecture

```
┌─────────────────────────────────────────────────────┐
│  Session Coordinator (Claude instance)              │
│  Reads: workflow state file                         │
│  Executes: next pending step                        │
│  Writes: state update + output artifact             │
└─────────────────┬───────────────────────────────────┘
                  │
          ┌───────┴────────┐
          ▼                ▼
   MCP Tools          File System
   ─────────          ──────────
   - IDE diagnostics  - memory/workflow-state/
   - Code execution   - artifacts/ (canonical paths)
   - File read/write  - wiki/
                      - memory/
```

#### RT-1 Key Components

**1. Session Initialization Protocol**

On every session start, the coordinator executes:
```
1. Read memory/workflow-state/ for active instances
2. For each active instance:
   a. Load workflow definition
   b. Identify current step
   c. Load context package for current step
   d. Check all preconditions
3. Present state summary to operator
4. Await confirmation or correction
5. Proceed with execution
```

This replaces: "Human remembers where we were last session."

**2. Context Package Assembler**

Replaces the current model where agents receive whatever context they happen to receive. The assembler:
```
For a given agent + step:
  1. Load agent definition (capability manifest)
  2. Load governance context (constitution summary, gate requirements)
  3. Load relevant memory entries (query MEMORY_INDEX by domain)
  4. Load input artifacts (previous step outputs)
  5. Load relevant wiki pages (for this workflow step)
  6. Trim to context budget (drop low-importance entries if over budget)
  7. Return assembled package
```

Context budget enforcement is now code, not guidelines.

**3. Pre-Step Gate Validator**

Before executing step N, validates:
```
For step N in workflow W:
  Required predecessors: [step N-1, gate G-X]
  Validation:
    - Step N-1 output artifact exists at canonical path
    - Artifact status = APPROVED (not DRAFT)
    - Gate G-X has a PASS event in the event log
  If any check fails → BLOCK step N; produce block notice
  If all pass → proceed
```

**4. MCP Tool Integration**

```yaml
mcp-tools-phase-1:
  ide-diagnostics:
    trigger: After engineer-agent produces implementation
    action: Run mcp__ide__getDiagnostics on changed files
    output: Diagnostic report appended to QA artifacts
    gate-impact: Feeds into G5 QA gate

  ide-code-execution:
    trigger: After test files created
    action: Run mcp__ide__executeCode for unit tests
    output: Test results appended to QA artifacts
    gate-impact: Required for G5 QA gate pass

  file-operations:
    trigger: Throughout workflow execution
    action: Read workflow state; write artifacts; update memory
    output: Persistent state between steps
```

#### RT-1 Technology Choices

**State storage:** Markdown files in `memory/workflow-state/` (current design). Enhanced with:
- Strict frontmatter schema (enforced by validator)
- Checksum of output artifacts at each step
- Step completion timestamp

**Context assembly:** Python or JavaScript script that reads MEMORY_INDEX, loads relevant files, trims to budget.

**Gate validation:** YAML-defined precondition rules; validated by Python script before step execution.

**Tech stack note:** RT-1 can be implemented without knowing Q-001 (product tech stack). The OS runtime is a separate system from the product being built.

#### RT-1 Success Criteria

- [ ] Session starts automatically by reading workflow state
- [ ] Pre-step gate validation fires before every step
- [ ] State is written to `memory/workflow-state/` after each step
- [ ] IDE diagnostics run automatically after implementation
- [ ] Zero workflow steps execute without state being recorded
- [ ] First feature completes without human managing each step transition

---

### Phase RT-2: Event-Driven Runtime (Target: Phase 2 of Org Roadmap)

**Duration:** 6–8 weeks after RT-1 complete
**Core capability:** Workflow steps trigger on events; parallel workflows; audit log active

**The critical shift:** Instead of the orchestrator polling "what's next?", events trigger steps. A gate PASS event automatically advances the workflow. A deployment event triggers metrics collection. Human approvals arrive as events that unblock waiting steps.

#### RT-2 Component Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Event Bus                                                 │
│  Topics: gate.pass, gate.fail, artifact.created,          │
│          human.approval.granted, deployment.complete,      │
│          session.start, incident.triggered                 │
└──────────────────────────┬─────────────────────────────────┘
              ┌────────────┼────────────┐
              ▼            ▼            ▼
    Workflow Engine   Audit Logger   Alert Engine
    ─────────────    ────────────   ────────────
    Advances steps   hash-chained   Threshold
    on gate events   event log      detection
    Runs parallel    Immutable      Human notify
    workflows        tamper-proof   SLA monitor
```

#### RT-2 Key Components

**1. Event Bus**

```yaml
event-topics:
  gate.pass:
    schema: {gate_id, artifact_path, agent, timestamp, session_id}
    subscribers: [workflow-engine, audit-logger, metrics-collector]

  gate.fail:
    schema: {gate_id, artifact_path, agent, reason, timestamp}
    subscribers: [workflow-engine, alert-engine, agent-notifier]

  artifact.created:
    schema: {path, type, status, agent, checksum, timestamp}
    subscribers: [artifact-registry, reference-checker, audit-logger]

  human.approval.granted:
    schema: {approval_id, action, authorized_by, timestamp}
    subscribers: [workflow-engine, audit-logger]

  human.approval.requested:
    schema: {approval_id, action, requested_by, deadline, timestamp}
    subscribers: [calendar-connector, slack-notifier, sla-monitor]

  deployment.complete:
    schema: {feature, environment, version, timestamp, outcome}
    subscribers: [metrics-collector, lifecycle-tracker, audit-logger]

  incident.triggered:
    schema: {incident_id, severity, description, triggered_by}
    subscribers: [incident-workflow, on-call-notifier, audit-logger]
```

**2. Workflow Engine (Event-Driven)**

```
Workflow Definition:
  Step 1 → triggers: manual(first step)
  Step 2 → triggers: event(gate.pass, gate_id=G1)
  Step 3 → triggers: event(gate.pass, gate_id=G2) AND event(gate.pass, gate_id=G3)
  Step 4 → triggers: event(gate.pass, gate_id=G4)
  Step 5 → triggers: event(gate.pass, gate_id=G5) AND event(gate.pass, gate_id=G6)
  Step 6 → triggers: event(human.approval.granted, action=production_deploy)

Effect: Each gate pass automatically advances the workflow.
Human approval at G7 is the only mandatory human-paced step.
```

**3. Immutable Audit Log**

```python
class AuditLog:
    """Append-only, hash-chained event log."""

    def append(self, event: dict) -> str:
        event["timestamp"] = utcnow()
        event["prior_hash"] = self.last_hash
        event_json = json.dumps(event, sort_keys=True)
        event["hash"] = sha256(event_json.encode()).hexdigest()
        self.log_file.append_line(json.dumps(event))
        self.last_hash = event["hash"]
        return event["hash"]

    def verify_integrity(self) -> bool:
        """Recompute hash chain; any tampering detectable."""
        for i, event in enumerate(self.events):
            expected = sha256(json.dumps(event_without_hash, sort_keys=True)).hexdigest()
            if event["hash"] != expected:
                return False  # Tamper detected
        return True
```

**4. Saga Coordinator**

For multi-step workflows, the saga coordinator:
- Tracks which steps have completed and produced artifacts
- On failure of step N, executes compensation for steps N-1, N-2, etc.
- Logs compensation events to audit log
- Notifies affected agents

```yaml
saga-definition:
  workflow: feature-development
  steps:
    - step: discovery
      artifact: prds/*.md
      compensation: mark_artifact_suspended(artifact_path)

    - step: architecture
      artifact: architecture/decisions/ADR-*.md
      compensation: mark_artifact_suspended(artifact_path)

    - step: security-review
      artifact: security/threat-models/*.md
      compensation: mark_artifact_suspended(artifact_path)
      # Note: ADR compensation not triggered by security failure alone
      # ADR stands; security review is re-run, not rewound

  failure-at-step: 4  # UX design
  compensation-sequence: [step-4, step-3]  # Only compensate impacted steps
```

**5. Parallel Workflow Support**

RT-2 enables multiple features in simultaneous execution:
```
Sprint 3:
  ├── Feature A: Step 3 (security review) — waiting for security-agent
  ├── Feature B: Step 1 (discovery) — pm-agent executing
  └── Feature C: Step 5 (QA) — qa-agent executing

Event bus disambiguates: gate.pass events carry workflow_id + feature_id
Each workflow instance has isolated state in memory/workflow-state/
```

#### RT-2 Technology Choices

| Component | Minimal (Phase 1-2) | Scale (Phase 3+) |
|-----------|--------------------|--------------------|
| Event bus | In-process Python event dispatcher | Redis Pub/Sub or Apache Kafka |
| Audit log | Append-only `.jsonl` file with hash chain | Managed append-only log (DynamoDB streams, Cloudwatch Logs) |
| Saga coordinator | YAML state files + Python coordinator | Temporal.io |
| Parallel state | Multiple `workflow-state/*.yaml` files | Database (PostgreSQL) |
| Workflow engine | Python event loop | Temporal / Prefect / Dagster |

**RT-2 technology decision trigger:** Move from minimal to scale variant when:
- Concurrent workflow instances > 5
- Event volume > 500/day
- Multi-machine execution required

#### RT-2 Success Criteria

- [ ] Gate pass events automatically advance workflow without human prompting
- [ ] 2+ features running simultaneously in separate workflow instances
- [ ] Audit log has entries for all governance events; integrity verifiable
- [ ] Human approval SLA monitoring fires alert before deadline
- [ ] Compensation steps execute correctly on simulated failure
- [ ] Parallel workflow state doesn't conflict

---

### Phase RT-3: Autonomous Runtime (Target: Phase 3 of Org Roadmap)

**Duration:** 8–12 weeks after RT-2 complete
**Core capability:** OS operates autonomously within constitution; humans involved only at constitutional boundaries

**The critical shift:** The OS is no longer orchestrated by humans. It is observed and governed by humans. Agents execute workflows end-to-end. Humans receive notifications of gate decisions, not requests to drive the process.

#### RT-3 Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Autonomous Orchestration Engine                                │
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐  │
│  │  Scheduler  │   │  Reasoner   │   │  Governance Monitor │  │
│  │             │   │             │   │                     │  │
│  │ Cron-based  │   │ Determines  │   │ Monitors compliance │  │
│  │ workflows   │   │ next action │   │ Alerts on violation │  │
│  │ (wiki maint,│   │ given state │   │ Human notifications │  │
│  │  metrics)   │   │ + context   │   │ for gate decisions  │  │
│  └─────────────┘   └─────────────┘   └─────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
              │                │                    │
              ▼                ▼                    ▼
      Event Bus          Agent Pool         Human Approval
      (trigger)          (execution)        Interface (notify)
```

#### RT-3 Key Components

**1. Autonomous Scheduler**

Executes workflows on schedule without human initiation:
```yaml
scheduled-workflows:
  wiki-maintenance:
    schedule: "0 9 * * 1"  # Every Monday 9am UTC
    workflow: wiki-maintenance
    max-runtime: 2h
    governance: supervisor-gate

  memory-freshness-check:
    schedule: "0 9 * * 1"  # Weekly
    workflow: memory-review
    max-runtime: 1h
    governance: docs-agent

  metrics-report-generation:
    schedule: "0 9 * * 5"  # Sprint close (Friday)
    workflow: metrics-collection
    max-runtime: 2h
    governance: analytics-agent

  risk-registry-review:
    schedule: "0 9 1 * *"  # Monthly
    workflow: risk-review
    max-runtime: 2h
    governance: delivery-agent
```

**2. Constitution-Aware Reasoner**

The reasoner is the cognitive core of autonomous execution. Before taking any action:
```
1. Load constitution boundaries (§6.2 permitted, §6.3 prohibited)
2. Load human approval requirements (human-approval-constitution.md)
3. For the proposed action:
   a. Check: is this in §6.3 prohibited list? → STOP, escalate
   b. Check: is this in human-approval-constitution.md? → STOP, request approval
   c. Check: am I authorized for this action at my tier? → if not, escalate
   d. Check: are all preconditions met? → if not, block
4. Only proceed if all checks pass
5. Log the decision to audit log
```

**3. Circuit Breakers**

Prevents autonomous execution from getting stuck or causing damage:
```yaml
circuit-breakers:
  workflow-step-timeout:
    duration: 30m
    action: BLOCK_step, notify_delivery_agent

  consecutive-gate-failures:
    threshold: 2
    action: ESCALATE_to_supervisor, NOTIFY_human

  artifact-creation-loop:
    threshold: 3_identical_artifacts_in_30min
    action: HALT_workflow, NOTIFY_human

  context-budget-exceeded:
    threshold: 1.2x_budget
    action: COMPRESS_context, LOG_warning, continue

  human-approval-timeout:
    sla: per human-approval-constitution.md
    action: ESCALATE, BLOCK_workflow
```

**4. Governance Monitor (Continuous)**

Runs in background continuously, monitoring:
- Gate compliance rate (alert if < 80%)
- Open human approval requests past SLA
- Constitution violations
- Audit log integrity
- Memory freshness degradation

```
Governance Monitor Loop (runs every 5 minutes):
  1. Check: any workflows past timeout threshold?
  2. Check: any human approvals past SLA?
  3. Check: any constitution violations in last 5 minutes?
  4. Check: audit log integrity hash valid?
  5. Check: any CRITICAL risks unmitigated?
  6. Emit: governance-health event (GREEN/YELLOW/RED)
```

#### RT-3 Autonomous Boundaries (Constitution §6.2 + §6.3 Implementation)

```python
# Technical enforcement of constitution hard limits
PROHIBITED_ACTIONS = {
    "execute_production_code",      # §6.3.1
    "delete_any_file",             # §6.3 + H-024
    "send_external_communication", # §6.3 + H-021
    "commit_financial_spend",      # §6.3 + H-005
    "store_secrets_in_artifact",   # §6.3 + §7.1
    "modify_constitution",         # §6.3 + H-007
    "modify_governance_principles",# §6.3 + H-008
    "override_security_critical",  # §6.3
    "approve_own_artifact",        # §6.3
    "impersonate_human_operator",  # §6.3
}

def pre_action_check(agent: str, action: str, context: dict) -> ActionDecision:
    if action in PROHIBITED_ACTIONS:
        return ActionDecision.BLOCK(reason=f"Constitution §6.3: {action} is prohibited")
    if action in HUMAN_REQUIRED_ACTIONS:
        return ActionDecision.AWAIT_HUMAN(request=build_approval_request(action, context))
    if not has_permission(agent, action, context):
        return ActionDecision.ESCALATE(to=get_authority_tier(action))
    return ActionDecision.PROCEED
```

#### RT-3 Success Criteria

- [ ] Complete feature workflow executes autonomously (human involvement only at G7)
- [ ] Cron-scheduled workflows (wiki maintenance, metrics) run without human initiation
- [ ] Circuit breakers prevent runaway execution in 3 simulated failure tests
- [ ] Constitution hard limits verified: 10 adversarial attempts all blocked
- [ ] Governance monitor detects simulated compliance violation within 10 minutes
- [ ] Session end → session restart → workflow continues from correct position automatically

---

### Phase RT-4: Self-Optimizing Runtime (Target: Phase 4 of Org Roadmap)

**Duration:** 12+ weeks after RT-3 complete
**Core capability:** Runtime improves itself. Governance evolves based on evidence. Org digital twin enables predictive operation.

#### RT-4 Key Capabilities

**1. Adaptive Context Assembly**

Instead of fixed context packages, the assembler learns what context actually improves quality:
```
Context Optimizer:
  Input: agent_type, step_type, prior_quality_scores
  Process: Correlate context choices with quality outcomes
  Output: Context package that maximizes expected quality
           within the token budget

  Learning signal: Gate first-pass rates per agent × context combination
  Update cadence: After each gate evaluation
```

**2. Governance Optimizer**

Proposes governance simplifications based on empirical data:
```
Governance Optimizer:
  Input: Gate first-pass rates, gate cycle counts, bottleneck analysis
  Rule: If gate X has 95%+ first-pass rate for 6+ months → 
        propose reducing to async review (not blocking)
  Rule: If workflow W consistently bottlenecks at step N →
        propose splitting step N into parallel sub-steps
  Output: RFC proposing governance change (never self-approves)
```

**3. Digital Twin**

```
Org Digital Twin:
  State model: {active_workflows, pending_gates, pending_approvals,
                agent_utilization, context_budget_pressure,
                quality_trend, risk_registry_status}
  
  Predictive capabilities:
    - "Sprint 4 has 3 L-tier features in flight; predict G2 gate bottleneck"
    - "Context budget pressure from feature A will affect feature B quality"
    - "RISK-004 governance bypass has H probability next sprint given deadline pressure"
  
  Inputs: Real-time event stream from event bus
  Update: Continuous (each event updates the model)
  Outputs: Organizational health signal + bottleneck alerts + sprint capacity forecast
```

---

## Runtime Technology Decision Matrix

| Technology Choice | When to Decide | Deciding Factors |
|------------------|---------------|-----------------|
| Workflow engine (custom vs. Temporal) | Before RT-2 | Scale: >5 concurrent workflows = Temporal |
| Event bus (in-process vs. Kafka) | Before RT-2 | Volume: >500 events/day = Redis Streams |
| State store (files vs. database) | Before RT-3 | Concurrency: >3 parallel workflows = database |
| Vector store (Chroma vs. Pinecone) | When triggered | Memory index: >50 entries = vector store |
| Audit log (files vs. managed) | Before RT-3 | Compliance: SOC2/PCI = managed append-only |
| Model routing (manual vs. dynamic) | Before RT-3 | Cost sensitivity: >$50/month API cost = dynamic |

---

## Runtime Risk Registry

| Risk | Severity | Mitigation |
|------|---------|-----------|
| RT-1 fails to persist state reliably | HIGH | Test with 10 simulated session interruptions before trusting |
| Event bus loses events (durability gap) | HIGH | Use durable event bus (not in-memory) for RT-2 |
| Circuit breakers too aggressive (blocks valid work) | MEDIUM | Tune thresholds with 5-sprint calibration data |
| Autonomous execution creates duplicate artifacts | MEDIUM | Idempotency check mandatory at step start |
| Constitution hard limits not technically enforced | CRITICAL | RT-3 implementation must include pre-action check before deployment |
| Digital twin model drift from reality | MEDIUM | Re-sync digital twin from event store daily |
| Context optimization creates adversarial context | LOW | Human review of optimizer proposals before activation |

---

## The Runtime Invariant

**At every phase, this must be true:**

> The OS can be stopped, restarted, and resumed without losing governance state.

If an audit fails this test at any point in the evolution, the phase is not complete.
