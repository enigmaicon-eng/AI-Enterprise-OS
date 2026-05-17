# Execution Sandbox

**System ID:** `execution-sandbox`
**Role:** Provides isolated execution environments for high-risk operations — code execution, untrusted content processing, adversarial testing, and external data handling; enforces process isolation, network blocking, filesystem restrictions, resource limits, and output quarantine within sandboxed execution contexts
**Storage:** `memory/runtime-isolation/sandbox-state.yaml`

---

## Purpose

Some operations cannot be safely executed in the main agent context. Running untrusted code, processing documents from unknown sources, executing red-team test cases, and handling externally supplied inputs all carry risks that require execution to be physically isolated from the main workflow state. The execution sandbox provides this isolation: a constrained, monitored, resource-limited environment where dangerous operations can run with their blast radius contained regardless of what they attempt.

---

## Sandbox Configuration

```yaml
SandboxConfig:
  sandbox_id: string
  sandbox_type: "CODE_EXECUTION | DOCUMENT_PROCESSING | ADVERSARIAL_TESTING | EXTERNAL_DATA"
  
  isolation_level: "PROCESS | CONTAINER | VM"   # Process < Container < VM
  
  # Resource limits
  resources:
    max_execution_time_seconds: integer          # Hard kill after this
    max_memory_mb: integer
    max_disk_io_mb: integer
    max_cpu_pct: float                          # 0.0-1.0
    max_file_size_mb: integer
  
  # Network policy
  network:
    blocked: boolean                            # true for most sandboxes
    allowed_egress_ips: [string] | null         # Whitelist if not fully blocked
    allowed_egress_ports: [integer] | null
    dns_blocked: boolean
  
  # Filesystem policy
  filesystem:
    read_only_paths: [string]                   # Paths allowed read-only access
    write_paths: [string]                       # Paths allowed write access (cleaned up after)
    blocked_paths: [string]                     # Explicitly blocked
    temp_dir: string                            # Isolated temp directory
    max_created_files: integer
  
  # Output handling
  output:
    quarantine_output: boolean                  # All output quarantined until reviewed
    max_output_size_bytes: integer
    strip_credentials: boolean                  # Auto-strip credential patterns from output
    scan_for_injection: boolean                 # Run injection detection on output
  
  # Monitoring
  monitoring:
    syscall_monitoring: boolean
    network_monitoring: boolean
    file_access_monitoring: boolean
    process_creation_monitoring: boolean

StandardSandboxProfiles:
  
  code-execution:
    isolation_level: CONTAINER
    resources: {max_execution_time_seconds: 30, max_memory_mb: 512, max_cpu_pct: 0.5}
    network.blocked: true
    filesystem.write_paths: ["/sandbox/tmp/"]
    output.quarantine_output: true
    output.scan_for_injection: true
  
  document-processing:
    isolation_level: PROCESS
    resources: {max_execution_time_seconds: 60, max_memory_mb: 256}
    network.blocked: true
    filesystem.read_only_paths: ["/sandbox/input/"]
    output.strip_credentials: true
    output.scan_for_injection: true
  
  adversarial-testing:
    isolation_level: VM
    resources: {max_execution_time_seconds: 300, max_memory_mb: 1024}
    network.blocked: true
    output.quarantine_output: true
    monitoring: {syscall_monitoring: true, network_monitoring: true}
  
  external-data:
    isolation_level: PROCESS
    resources: {max_execution_time_seconds: 45, max_memory_mb: 128}
    network.blocked: true
    output.strip_credentials: true
    output.scan_for_injection: true
```

---

## Sandbox Execution Protocol

```
execute_in_sandbox(task, sandbox_profile_id) → SandboxExecutionResult:
  
  profile = load_sandbox_profile(sandbox_profile_id)
  sandbox_id = generate_uuid()
  
  # Step 1: Provision sandbox
  sandbox = provision_sandbox(sandbox_id, profile)
  
  try:
    # Step 2: Prepare input — sanitize and copy to isolated input directory
    sanitized_input = sanitize_input_for_sandbox(task.input, profile)
    copy_to_sandbox_input(sandbox, sanitized_input)
    
    # Step 3: Execute with hard resource limits
    execution_result = execute_with_limits(
      sandbox = sandbox,
      command = task.execution_command,
      timeout_seconds = profile.resources.max_execution_time_seconds,
      memory_limit_mb = profile.resources.max_memory_mb
    )
    
    # Step 4: Monitor for violations during execution
    violations = sandbox.monitoring.get_violations()
    IF violations:
      log_sandbox_violations(sandbox_id, violations)
      IF any(v.severity == "CRITICAL" for v in violations):
        # Kill sandbox immediately on critical violation
        terminate_sandbox(sandbox, reason="CRITICAL_VIOLATION")
        RETURN SandboxExecutionResult(
          success = False,
          terminated_early = True,
          violation_summary = violations
        )
    
    # Step 5: Collect and process output
    raw_output = collect_sandbox_output(sandbox, max_bytes=profile.output.max_output_size_bytes)
    
    IF NOT raw_output:
      RETURN SandboxExecutionResult(success=False, reason="No output produced")
    
    # Step 6: Output processing
    processed_output = process_sandbox_output(raw_output, profile, sandbox_id)
    
    RETURN SandboxExecutionResult(
      success = execution_result.exit_code == 0,
      exit_code = execution_result.exit_code,
      output = processed_output.output,
      output_quarantined = processed_output.quarantined,
      quarantine_id = processed_output.quarantine_id,
      execution_time_seconds = execution_result.elapsed_seconds,
      resource_usage = execution_result.resource_stats,
      violations = violations
    )
  
  finally:
    # Step 7: Always clean up sandbox
    cleanup_sandbox(sandbox)  # Destroys isolated environment + temp files

provision_sandbox(sandbox_id, profile) → Sandbox:
  
  MATCH profile.isolation_level:
    
    CASE "PROCESS":
      # OS-level process isolation with resource limits
      sandbox = create_restricted_process(
        sandbox_id = sandbox_id,
        resource_limits = profile.resources,
        filesystem_restrictions = profile.filesystem,
        network_restrictions = profile.network
      )
    
    CASE "CONTAINER":
      # Container (Docker/Podman) with full network/filesystem isolation
      sandbox = create_container(
        sandbox_id = sandbox_id,
        image = SANDBOX_BASE_IMAGE,
        network_mode = "none" if profile.network.blocked else "restricted",
        resource_limits = profile.resources,
        read_only_mounts = profile.filesystem.read_only_paths,
        tmpfs_mounts = [profile.filesystem.temp_dir]
      )
    
    CASE "VM":
      # Full VM isolation (microVM or similar) — maximum isolation
      sandbox = create_microvm(
        sandbox_id = sandbox_id,
        memory_mb = profile.resources.max_memory_mb,
        vcpus = 1,
        network_enabled = not profile.network.blocked,
        snapshot = CLEAN_VM_SNAPSHOT
      )
  
  start_monitoring(sandbox, profile.monitoring)
  RETURN sandbox
```

---

## Output Processing

```
process_sandbox_output(raw_output, profile, sandbox_id) → ProcessedOutput:
  
  output = raw_output
  
  # Credential stripping
  IF profile.output.strip_credentials:
    output = strip_credential_patterns(output)
    IF output != raw_output:
      log(f"Credentials stripped from sandbox {sandbox_id} output")
  
  # Injection detection
  IF profile.output.scan_for_injection:
    injection_result = prompt_injection_detector.detect_injection(
      output,
      detection_context = {source: "sandbox_output", sandbox_id: sandbox_id}
    )
    IF injection_result.injection_detected AND injection_result.confidence > 0.70:
      log_security_event("SANDBOX_OUTPUT_INJECTION_DETECTED", sandbox_id, injection_result)
      output = "[OUTPUT BLOCKED: Injection pattern detected in sandbox output]"
  
  # Hallucination scan (for AI-generated output in sandbox)
  hallucination_result = hallucination_containment.detect_hallucinations(
    output,
    detection_context = {source: "sandbox_output"}
  )
  
  # Quarantine if required
  IF profile.output.quarantine_output OR hallucination_result.contamination_level in ["HIGH", "CRITICAL"]:
    quarantine_id = quarantine_output(output, sandbox_id)
    RETURN ProcessedOutput(
      output = None,
      quarantined = True,
      quarantine_id = quarantine_id,
      release_condition = "HUMAN_REVIEW_REQUIRED"
    )
  
  RETURN ProcessedOutput(output=output, quarantined=False)
```

---

## Sandbox Violation Monitoring

```yaml
SandboxViolation:
  violation_type: "NETWORK_ATTEMPT | FORBIDDEN_SYSCALL | PROCESS_SPAWN | FILE_ACCESS_VIOLATION | RESOURCE_LIMIT_EXCEEDED | TIMEOUT"
  severity: "INFO | WARNING | CRITICAL"
  detail: string
  detected_at: datetime
  
CRITICAL_VIOLATIONS:
  - "NETWORK_ATTEMPT when network.blocked == true"
  - "PROCESS_SPAWN when forbidden"
  - "FORBIDDEN_SYSCALL: ptrace, mount, chroot, execve of unknown binaries"
  - "TIMEOUT exceeded"
  - "MEMORY_LIMIT_EXCEEDED"
```

---

## Sandbox State Schema

```yaml
SandboxState:
  last_updated: datetime
  
  active_sandboxes:
    [sandbox_id]:
      sandbox_type: string
      isolation_level: string
      started_at: datetime
      run_id: string | null
      status: "PROVISIONING | RUNNING | COMPLETING | TERMINATED | FAILED"
  
  statistics:
    total_sandboxes_created: integer
    successful_executions: integer
    failed_executions: integer
    critical_violations_detected: integer
    outputs_quarantined: integer
```

---

## Integration

**Called by:**
- `runtime-isolation/adversarial-tester.md` — uses sandbox for all test case execution
- `workflow-engine/dag-engine.md` — redirects EXECUTE_BOUNDED nodes to sandbox
- `semantic-gateway/mcp-governance-gateway.md` — processes UNTRUSTED MCP server outputs in sandbox

**Calls:**
- `semantic-gateway/prompt-injection-detector.md` — scans output for injection
- `runtime-isolation/hallucination-containment.md` — scans output for hallucinations
- `audit-replay/immutable-audit-log.md` — records all sandbox executions and violations

**Reads from:** `memory/runtime-isolation/sandbox-state.yaml`
**Writes to:** `memory/runtime-isolation/sandbox-state.yaml`
