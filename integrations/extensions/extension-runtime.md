# Extension Runtime

## Role
Manages how extensions execute within the OS: sandboxing, resource enforcement, capability interception, output validation, and invocation audit. Ensures extensions behave exactly as declared regardless of their internal logic.

## Execution Isolation

```
ISOLATION_LEVEL     APPLIES_TO                          CONTROLS
──────────────────────────────────────────────────────────────────────────────────
STANDARD            Internal org-authored extensions    Process isolation, resource limits
ENHANCED            External extensions (all)           Container isolation + capability intercept
STRICT              Extensions with Z3+ data access     VM isolation + air-gapped network
```

## Capability Interception Layer

All extension invocations pass through the capability interception layer:

```
INTERCEPT POINTS:
  file_access:      every file read/write intercepted and checked vs. declared scope
  network_call:     every outbound call verified against declared endpoint allow-list
  tool_call:        every tool invocation checked vs. declared tool list
  memory_access:    every memory read/write checked vs. declared classification ceiling
  event_emit:       every event publish checked vs. declared topic list
  agent_call:       BLOCKED — extensions cannot directly invoke agents

ON VIOLATION:
  1. BLOCK the call
  2. LOG: capability_violation_event to extension-governance audit
  3. SUSPEND extension immediately (no grace period)
  4. NOTIFY: governance team + extension author
```

## Resource Enforcement

```
HARD LIMITS (kill extension process if exceeded):
  max_tokens_per_invocation:   as declared (hard ceiling: 50,000 for external)
  max_execution_time_sec:      as declared (hard ceiling: 120s for external)
  max_memory_kb:               as declared (hard ceiling: 256MB for external)
  max_tool_calls_per_invoke:   as declared (hard ceiling: 20 for external)

SOFT LIMITS (warn but continue):
  approaching 80% of any limit: emit resource_pressure_event
```

## Invocation Lifecycle

```
[1] INVOKE REQUEST RECEIVED
[2] RETRIEVE capability manifest for extension version
[3] ESTABLISH isolated execution context
[4] INJECT approved inputs only (strip any context above classification ceiling)
[5] EXECUTE extension under capability interception
[6] VALIDATE output (schema check + classification scan)
[7] STRIP any data above output_classification_ceiling from response
[8] LOG invocation record (always, no exceptions)
[9] RETURN validated, stripped output to caller
```

## Output Validation

```
SCHEMA_CHECK: output matches declared response schema
CLASSIFICATION_SCAN: output does not contain data above declared classification ceiling
HALLUCINATION_CHECK: for AGENT extensions, output passes hallucination-detection-system
SIZE_CHECK: output <= max_response_size_kb (hard limit: 1MB for external extensions)

IF any check fails:
  - replace output with: {error: "EXTENSION_OUTPUT_VALIDATION_FAILED", details: ...}
  - log to governance audit
  - do NOT return raw unvalidated output
```

## Extension Invocation Record
```yaml
invocation_record:
  invocation_id: string
  extension_id: string
  extension_version: semver
  caller_workflow_id: string
  caller_agent_id: string
  
  input_classification: string
  output_classification: string
  
  capabilities_exercised: [string]
  resource_usage:
    tokens_used: number
    execution_time_ms: number
    memory_peak_kb: number
    tool_calls_made: number
  
  violations_detected: [string]
  output_validation: PASS | FAIL
  
  started_at: ISO8601
  completed_at: ISO8601
```

## Persistence
`memory/extension-registry/invocation-log.jsonl`
`memory/extension-registry/runtime-state.yaml`
