# Dry-Run System
**ID:** SBOX-DRS-001 | **Tier:** T3 | **Class:** STANDARD
**Owner:** Engineering Org | **Updated:** 2026-05-16

---

## Purpose

Executes agent workflows with complete logic fidelity but zero side effects. The dry-run system is the lowest-cost, highest-safety execution mode: all writes are intercepted and discarded, all API calls are blocked or mocked, and the agent receives synthetic success responses. Used for workflow validation, governance pre-checks, and any action where the outcome must be previewed before live execution.

**Primary guarantee:** A dry-run execution cannot produce any observable change to any external system, regardless of what the agent attempts.

---

## Dry-Run Execution Model

```
dry_run(workflow_id, agent_id, input_payload) → DryRunResult:

  1. CLASSIFY
     Check: is this action constitutional-adjacent?
       YES → DRY_RUN required; cannot promote without T4
       NO  → DRY_RUN default for Level 0–1 agents; configurable otherwise

  2. PROVISION
     provision_iee(sandbox_type=DRY_RUN, config={
       network_access: NONE,
       api_calls: BLOCKED (mock synthetic responses only),
       file_writes: CAPTURED_THEN_DISCARDED,
       db_writes: CAPTURED_THEN_DISCARDED,
       event_publishes: CAPTURED_THEN_DISCARDED
     })
     TTL: 5 minutes (hard; auto-discard on expiry)

  3. EXECUTE
     run_workflow_in_iee(iee_id, workflow_id, input_payload)
     Agent executes normally; interceptor handles all calls:
       - Reads: ALLOWED (read from live data or synthetic dataset)
       - Writes: INTERCEPTED → captured in side-effect buffer
       - API calls: BLOCKED → mock connector returns synthetic response
       - DB writes: INTERCEPTED → captured, not applied
       - Events: INTERCEPTED → captured, not published

  4. COLLECT RESULTS
     dry_run_output = {
       workflow_logic_result: agent's computed output,
       side_effects_preview: list of all intercepted operations,
       resource_consumption: {tokens, wall_time_ms},
       errors_encountered: [],
       warnings: []
     }

  5. DISCARD
     wipe side-effect buffer
     wipe ephemeral filesystem
     deregister iee
     log DRY_RUN_COMPLETE to sandbox-log.jsonl

  6. RETURN DryRunResult
```

---

## DryRunResult Schema

```yaml
dry_run_result:
  run_id: DR-{NNN}
  workflow_id: string
  agent_id: string
  
  executed_at: ISO8601
  duration_ms: number
  
  outcome:
    logic_result: SUCCESS | FAILURE | PARTIAL | ERROR
    computed_output: {}                  # what the workflow produced
    
  side_effects_preview:
    file_writes:
      - path: string
        operation: CREATE | UPDATE | DELETE
        content_hash: sha256
        size_bytes: number
    api_calls:
      - connector: string
        endpoint: string
        method: GET | POST | PUT | DELETE | PATCH
        payload_hash: sha256
        mock_response_used: boolean
    db_writes:
      - table: string
        operation: INSERT | UPDATE | DELETE
        record_id: string | null
        row_count: number
    event_publishes:
      - topic: string
        event_type: string
        payload_hash: sha256
        
  resource_consumption:
    tokens_used: number
    wall_time_ms: number
    api_calls_intercepted: number
    db_writes_intercepted: number
    
  validation:
    constitutional_check: PASS | FAIL
    scope_check: PASS | FAIL | EXCEEDED
    logic_errors: [string]
    warnings: [string]
    
  recommendation: SAFE_TO_EXECUTE | REVIEW_REQUIRED | DO_NOT_EXECUTE | REDESIGN_REQUIRED
```

---

## Side-Effects Preview Report

The side-effects preview is the primary output consumed by human reviewers and by the governance approval pipeline. Format for human review:

```
DRY-RUN PREVIEW: workflow={workflow_id} agent={agent_id}
──────────────────────────────────────────────────────
LOGIC RESULT: {SUCCESS | FAILURE}
COMPUTED OUTPUT: {summary of what the workflow would produce}

WHAT WOULD HAPPEN IF EXECUTED LIVE:
  Files Modified:   {count} files ({create}/{update}/{delete})
  API Calls:        {count} calls to {connector list}
  DB Operations:    {count} writes to {table list}
  Events Published: {count} events to {topic list}

SCOPE ANALYSIS:
  Declared scope:   {declared_scope from behavioral contract}
  Actual scope:     {inferred from intercepted operations}
  Within bounds:    {YES | NO — EXCEEDED: list overages}

CONSTITUTIONAL CHECK: {PASS | FAIL — list violations}

RECOMMENDATION: {SAFE_TO_EXECUTE | REVIEW_REQUIRED | DO_NOT_EXECUTE}
──────────────────────────────────────────────────────
```

---

## Dry-Run Triggers

```yaml
mandatory_dry_run:
  - agent_autonomy_level: [0, 1]           # always DRY_RUN before promotion
  - action_class: CONSTITUTIONAL_ADJACENT  # never skip
  - new_workflow_first_run: true           # first execution always dry
  - new_connector_first_use: true          # first use always dry
  - governance_pre_check: true             # all governance gate checks

optional_dry_run:
  - user_requested: true                   # developer previewing output
  - t3_requested: true                     # T3 wants to preview before approving
  - high_blast_radius: true               # blast_radius_score > 0.70
  - after_behavioral_contract_change: true # re-validate scope after contract edit
```

---

## Read Data Strategy

```
dry_run_read_strategy:
  default: LIVE_READ
    reads come from live data (agent sees realistic context)
    no write contamination possible (writes intercepted)
    
  sensitive_data_override:
    if data_classification in [RESTRICTED, TOP_SECRET]:
      read from synthetic dataset instead
      notify: "Dry run using synthetic data for {data_class} fields"
      
  offline_mode:
    if live_data_unavailable:
      fall back to last-known synthetic snapshot
      flag in dry_run_result.warnings: USING_STALE_SNAPSHOT
```

---

## Performance Targets

| Metric | Target |
|---|---|
| Provision time | < 500ms |
| Execution overhead vs. live | < 15% |
| Max TTL | 5 minutes |
| Side-effect report generation | < 200ms |
| Discard/wipe time | < 1 second |

---

## Integration

```
Feeds into:
  sandbox-engine.md — lifecycle parent
  side-effect-tracker.md — receives intercepted ops for preview report
  pre-execution-simulator.md — dry-run is one input to simulation pipeline
  governance-approval queues — dry-run result attached to approval requests

Receives from:
  sandbox-engine.md — provisioning command
  autonomy-level-framework.md — which agents require mandatory dry-run
  behavioral-contract-system.md — declared scope for validation
```

---

## Governance

**Dry-run bypass:** NEVER for constitutional-adjacent actions; T4 authorization for any bypass of mandatory dry-run  
**Read data sensitivity:** Restricted/Top-Secret fields always use synthetic data  
**Audit:** All dry-run executions logged to `memory/execution-sandbox/dry-run-log.jsonl`  
**Retention:** DryRunResult stored 90 days; summary stored 1 year
