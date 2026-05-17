# Isolated Execution Environment
**ID:** SBOX-IEE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + Engineering Org | **Updated:** 2026-05-16

---

## Purpose

Defines the structural isolation boundary for sandboxed agent execution. Each isolated execution environment (IEE) provides a hermetic container within which agent actions run without access to live enterprise systems. The IEE enforces namespace separation, intercepts all system calls, and ensures no side effect escapes to the production environment unless explicitly committed after validation.

---

## Isolation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    IEE Boundary (SBOX-{NNN})                │
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ Agent       │───▶│ IEE          │───▶│ Side-Effect   │  │
│  │ Runtime     │    │ Interceptor  │    │ Buffer        │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
│         │                  │                    │           │
│         │           Intercepts:          Captures:          │
│         │           - File writes        - Write ops        │
│         │           - API calls          - API calls        │
│         │           - DB writes          - DB mutations     │
│         │           - Event publishes    - Events           │
│         │                                                   │
│  ┌─────────────┐    ┌──────────────┐                       │
│  │ Ephemeral   │    │ Mock         │                       │
│  │ Filesystem  │    │ Connector    │                       │
│  │ (TEMP_ONLY) │    │ Layer        │                       │
│  └─────────────┘    └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                              │
                    Commit Gate (explicit only)
                              │
                    ┌─────────▼────────┐
                    │ Live Enterprise   │
                    │ Systems          │
                    └──────────────────┘
```

---

## IEE Configuration Schema

```yaml
isolated_execution_environment:
  iee_id: IEE-{NNN}                        # unique instance ID
  sandbox_id: SBOX-{NNN}                   # parent sandbox
  
  namespace_config:
    process_namespace: isolated            # no host process visibility
    network_namespace: controlled          # egress via controlled proxy only
    filesystem_namespace: ephemeral        # temp mount; wiped on discard
    ipc_namespace: isolated               # no host IPC
    
  interceptor_config:
    file_io:
      mode: CAPTURE                        # CAPTURE | PASSTHROUGH | BLOCK
      target: side-effect-buffer
      allow_reads: true
      allow_writes: CAPTURED_ONLY
    api_calls:
      mode: CAPTURE                        # CAPTURE | MOCK | BLOCK
      target: side-effect-buffer
      real_network_allowed: false          # never in DRY_RUN / SYNTHETIC
    database_writes:
      mode: CAPTURE
      target: side-effect-buffer
    event_publishes:
      mode: CAPTURE
      target: side-effect-buffer
      
  ephemeral_filesystem:
    mount_point: /tmp/iee/{iee_id}/
    max_size_mb: 512
    wiped_on: DISCARD | EXPIRY
    
  mock_connector_layer:
    enabled: true                          # always true for DRY_RUN / SYNTHETIC
    connector_set: synthetic-connectors-v{N}
    latency_profile: realistic             # ZERO | REALISTIC | DEGRADED
    failure_rate: 0.00                     # configurable for chaos testing
    
  resource_limits:
    max_tokens: 100000
    max_wall_time_ms: 120000
    max_memory_mb: 1024
    max_file_ops: 10000
    max_api_calls: 500
    
  status: PROVISIONING | ACTIVE | SUSPENDED | COMMITTED | DISCARDED | EXPIRED
```

---

## Interceptor Operation

```
intercept_system_call(call_type, call_payload, iee_id):

  1. Lookup iee_config from iee_registry[iee_id]
  
  2. Evaluate call_type:
     FILE_WRITE:
       mode = iee_config.interceptor_config.file_io.mode
       if mode == CAPTURE:
         capture_to_buffer(call_payload, type=FILE_WRITE)
         return SYNTHETIC_OK              # agent sees success; nothing committed
       if mode == BLOCK:
         return PERMISSION_DENIED
     
     API_CALL:
       if iee_config.api_calls.real_network_allowed == false:
         route_to_mock_connector(call_payload)
         capture_to_buffer(call_payload, type=API_CALL)
         return mock_response
       else:
         execute_real_call(call_payload)  # SCOPED / REVERSIBLE only
         capture_to_buffer(call_payload, type=API_CALL_REAL)
     
     DATABASE_WRITE:
       capture_to_buffer(call_payload, type=DB_WRITE)
       return SYNTHETIC_OK
     
     EVENT_PUBLISH:
       capture_to_buffer(call_payload, type=EVENT_PUBLISH)
       return SYNTHETIC_OK
     
     READ:
       allow_passthrough()               # reads always allowed; logged
  
  3. Update resource counters
  4. Check resource_limits; if exceeded → SUSPEND iee, alert sandbox-engine
```

---

## Isolation Levels by Sandbox Type

| Sandbox Type | Network Access | Filesystem | DB Writes | API Calls | Events |
|---|---|---|---|---|---|
| DRY_RUN | NONE | EPHEMERAL | CAPTURED | BLOCKED | CAPTURED |
| SYNTHETIC | MOCK_ONLY | EPHEMERAL | CAPTURED | MOCK | CAPTURED |
| SHADOW | SCOPED_REAL | EPHEMERAL | SHADOW_COPY | SCOPED_REAL | SHADOW_BUS |
| SCOPED | SCOPED_REAL | SCOPED | LIVE_SCOPED | SCOPED_REAL | LIVE |
| REVERSIBLE | SCOPED_REAL | SCOPED | LIVE+LOGGED | SCOPED_REAL | LIVE |

---

## Lifecycle

```
provision_iee(sandbox_id, iee_config):
  1. Allocate namespace (process / network / filesystem / IPC)
  2. Mount ephemeral filesystem at /tmp/iee/{iee_id}/
  3. Start interceptor process, bind to agent runtime socket
  4. Load mock connector layer (if applicable)
  5. Initialize side-effect buffer
  6. Register in iee-registry
  7. Return iee_id

tear_down_iee(iee_id, disposition):
  COMMIT:
    flush side-effect buffer → rollback-coordinator for application
    unmount ephemeral filesystem (retain captured ops log)
    deregister interceptor
  DISCARD:
    wipe side-effect buffer (no log retained)
    wipe ephemeral filesystem securely (overwrite with zeros)
    deregister interceptor
  EXPIRED:
    same as DISCARD; log EXPIRY event to sandbox-log.jsonl
```

---

## Integration

```
Feeds into:
  side-effect-tracker.md — receives all captured operations
  sandbox-engine.md — lifecycle managed by sandbox engine
  rollback-coordinator.md — committed side effects sent here

Receives from:
  sandbox-engine.md — provisioning and teardown commands
  privilege-containment-engine.md — permission scope for SCOPED/REVERSIBLE
  blast-radius-analyzer.md — scope validation before activation
```

---

## Governance

**Ephemeral filesystem wipe:** Mandatory on DISCARD and EXPIRY; verified by teardown audit  
**Namespace escape:** Detection via kernel audit log; immediate CRITICAL alert + iee suspended  
**Side-effect buffer overflow:** Alert at 80% capacity; SUSPEND at 100%  
**Audit:** All intercepted operations logged to `memory/execution-sandbox/iee-intercept.jsonl`
