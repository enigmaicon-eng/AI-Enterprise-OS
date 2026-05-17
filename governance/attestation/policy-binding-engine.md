# Policy Binding Engine

**System ID:** `policy-binding-engine`
**Role:** Cryptographically binds governance policies to specific executions — creates signed policy-binding records that prove which version of which policy governed a specific workflow run; enables forensic audit of "what rules applied at the time?" and detects policy drift where current policy differs from what was applied
**Storage:** `memory/governance-attestation/policy-bindings.jsonl`

---

## Purpose

Policies change. A gate threshold that was 70% in January may be 80% in June. A capability scope that permitted Bash access in Q1 may have been restricted in Q2. When a compliance auditor asks "what policy governed this workflow run from February?" the answer must be provable — not assumed. The policy binding engine creates a cryptographic seal between each workflow run and the exact policy versions that governed it, making the governance context of any historical execution independently verifiable.

---

## Policy Binding Schema

```yaml
PolicyBinding:
  binding_id: string
  
  # What execution this binding covers
  execution:
    run_id: string
    definition_id: string
    definition_version: integer
    started_at: datetime
  
  # Which policies were bound to this execution
  bound_policies: [BoundPolicy]
  
  # Integrity
  binding_hash: string                 # SHA-256 of (run_id + all policy versions + bound_at)
  signature: string                    # Ed25519 signed by governance-signing-key
  bound_at: datetime
  bound_by: string                     # Policy binding engine system identity

BoundPolicy:
  policy_id: string
  policy_name: string
  policy_category: "CAPABILITY_SCOPE | GATE_THRESHOLD | CONSTITUTIONAL | TRUST_BOUNDARY | APPROVAL_REQUIREMENT | DATA_CLASSIFICATION"
  
  policy_version: integer
  policy_hash: string                  # SHA-256 of policy content at binding time
  
  # Snapshot of the policy at binding time
  policy_snapshot: object              # Complete policy content — never just a reference
  
  effective_from: datetime             # When this policy version took effect
  effective_until: datetime | null     # Null = still current at binding time
```

---

## Binding Protocol

```
bind_policies_to_execution(run_id, workflow_definition) → PolicyBinding:
  
  # Load all policies currently in effect
  current_policies = collect_current_policies(workflow_definition)
  
  bound_policies = []
  
  FOR policy in current_policies:
    
    # Create a complete snapshot of the policy (not just a reference)
    policy_snapshot = policy.get_full_content()
    policy_hash = sha256(canonical_serialize(policy_snapshot))
    
    bound_policies.append(BoundPolicy(
      policy_id = policy.policy_id,
      policy_name = policy.name,
      policy_category = policy.category,
      policy_version = policy.version,
      policy_hash = policy_hash,
      policy_snapshot = policy_snapshot,
      effective_from = policy.effective_from,
      effective_until = policy.effective_until
    ))
  
  # Build the binding
  binding_content = {
    run_id: run_id,
    definition_id: workflow_definition.definition_id,
    definition_version: workflow_definition.version,
    started_at: now(),
    policy_hashes: {p.policy_id: p.policy_hash for p in bound_policies}
  }
  
  binding_hash = sha256(canonical_serialize(binding_content))
  
  signature = execution_signing.sign_artifact(
    {**binding_content, policy_binding_id: generate_uuid()},
    signing_context = {artifact_type: "POLICY_BINDING"}
  )
  
  binding = PolicyBinding(
    binding_id = generate_uuid(),
    execution = {
      run_id: run_id,
      definition_id: workflow_definition.definition_id,
      definition_version: workflow_definition.version,
      started_at: now()
    },
    bound_policies = bound_policies,
    binding_hash = binding_hash,
    signature = signature.signature,
    bound_at = now(),
    bound_by = "policy-binding-engine"
  )
  
  persist_binding(binding)
  immutable_audit_log.record(PolicyBindingAuditEvent(binding))
  
  RETURN binding

collect_current_policies(workflow_definition) → [Policy]:
  
  policies = []
  
  # 1. Capability manifests for all declared agents
  FOR agent_id in workflow_definition.agent_ids:
    manifest = capability_scope_controller.load_manifest(agent_id)
    IF manifest:
      policies.append(Policy(
        policy_id = manifest.manifest_id,
        category = "CAPABILITY_SCOPE",
        version = manifest.manifest_version,
        content = manifest
      ))
  
  # 2. Gate thresholds in effect
  FOR gate_id in extract_gate_ids(workflow_definition):
    gate_config = gate_registry.get_gate_config(gate_id)
    policies.append(Policy(
      policy_id = f"gate-{gate_id}",
      category = "GATE_THRESHOLD",
      version = gate_config.version,
      content = gate_config
    ))
  
  # 3. Constitutional principles (always included)
  constitution = constitutional_ai_governor.get_current_constitution()
  policies.append(Policy(
    policy_id = "enterprise-constitution",
    category = "CONSTITUTIONAL",
    version = constitution.version,
    content = constitution
  ))
  
  # 4. Trust boundary policies
  boundary_policy = trust_boundary_registry.get_current_boundary_policy()
  policies.append(Policy(
    policy_id = "trust-boundary-policy",
    category = "TRUST_BOUNDARY",
    version = boundary_policy.version,
    content = boundary_policy
  ))
  
  # 5. Approval requirements
  approval_policy = cryptographic_approval_engine.get_current_approval_policy()
  policies.append(Policy(
    policy_id = "approval-requirements",
    category = "APPROVAL_REQUIREMENT",
    version = approval_policy.version,
    content = approval_policy
  ))
  
  RETURN policies
```

---

## Policy Drift Detection

```
detect_policy_drift(run_id) → PolicyDriftReport:
  
  # Load the policy binding from when the run started
  binding = load_policy_binding(run_id)
  IF NOT binding:
    RETURN PolicyDriftReport(
      run_id = run_id,
      binding_found = False,
      drift_detected = False
    )
  
  # Compare each bound policy against current version
  drifts = []
  
  FOR bound_policy in binding.bound_policies:
    
    # Get current version of this policy
    current_policy = get_current_policy(bound_policy.policy_id)
    
    IF current_policy is null:
      drifts.append(PolicyDrift(
        policy_id = bound_policy.policy_id,
        drift_type = "POLICY_REMOVED",
        severity = "HIGH",
        description = f"Policy '{bound_policy.policy_name}' has been removed since run started"
      ))
      CONTINUE
    
    current_hash = sha256(canonical_serialize(current_policy.get_full_content()))
    
    IF current_hash != bound_policy.policy_hash:
      # Policy has changed
      current_version = current_policy.version
      version_delta = current_version - bound_policy.policy_version
      
      drifts.append(PolicyDrift(
        policy_id = bound_policy.policy_id,
        drift_type = "POLICY_CHANGED",
        severity = "HIGH" if bound_policy.policy_category == "CONSTITUTIONAL" else "MEDIUM",
        description = f"Policy '{bound_policy.policy_name}' changed from v{bound_policy.policy_version} to v{current_version}",
        original_version = bound_policy.policy_version,
        current_version = current_version,
        diff_summary = compute_policy_diff_summary(bound_policy.policy_snapshot, current_policy.get_full_content())
      ))
  
  report = PolicyDriftReport(
    run_id = run_id,
    binding_id = binding.binding_id,
    bound_at = binding.bound_at,
    drift_detected = len(drifts) > 0,
    drift_count = len(drifts),
    drifts = drifts,
    assessment = classify_drift_impact(drifts),
    generated_at = now()
  )
  
  IF drifts:
    immutable_audit_log.record(PolicyDriftAuditEvent(report), urgency="HIGH")
  
  RETURN report

classify_drift_impact(drifts) → str:
  
  IF any(d.drift_type == "POLICY_REMOVED" for d in drifts):
    RETURN "SIGNIFICANT — Required policy removed during execution"
  IF any(d.severity == "HIGH" for d in drifts):
    RETURN "HIGH — Critical policy changed during execution; results may not reflect current standards"
  IF drifts:
    RETURN "MEDIUM — Non-critical policy changes detected during execution"
  RETURN "NONE"
```

---

## Historical Policy Reconstruction

```
reconstruct_policy_at_time(policy_id, target_time) → PolicySnapshot:
  
  # Find the policy binding that was active closest to target_time
  relevant_bindings = query_bindings_before_time(target_time, policy_id)
  
  IF NOT relevant_bindings:
    RETURN PolicySnapshot(found=False, reason=f"No policy binding found for '{policy_id}' before {target_time.isoformat()}")
  
  # Most recent binding before target_time
  most_recent = MAX(relevant_bindings, key=lambda b: b.bound_at)
  
  # Find bound policy
  bound = next((p for p in most_recent.bound_policies if p.policy_id == policy_id), null)
  
  IF NOT bound:
    RETURN PolicySnapshot(found=False)
  
  RETURN PolicySnapshot(
    found = True,
    policy_id = policy_id,
    policy_version = bound.policy_version,
    policy_hash = bound.policy_hash,
    policy_content = bound.policy_snapshot,
    effective_at = most_recent.bound_at
  )
```

---

## Integration

**Called by:**
- `workflow-engine/dag-engine.md` — binds policies at workflow start
- `audit-replay/governance-replay-engine.md` — reconstructs policy context for historical replay
- Compliance auditors — for historical policy verification

**Calls:**
- `execution-security/capability-scope-controller.md` — collects capability manifests
- `trust-boundaries/constitutional-ai-governor.md` — collects constitutional policy snapshot
- `execution-security/execution-signing.md` — signs policy bindings
- `audit-replay/immutable-audit-log.md` — records bindings and drift events

**Writes to:** `memory/governance-attestation/policy-bindings.jsonl`
