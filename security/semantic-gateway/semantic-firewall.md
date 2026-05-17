# Semantic Firewall

**System ID:** `semantic-firewall`
**Role:** Inspects all agent inputs and outputs for semantic policy violations — classifies intent, detects prompt injection, enforces topic/scope constraints, blocks jailbreak attempts, and logs all policy decisions before execution proceeds; the first line of defense in the zero-trust cognition stack
**Storage:** `memory/semantic-gateway/firewall-decisions.jsonl` + `memory/semantic-gateway/firewall-state.yaml`

---

## Purpose

A traditional network firewall operates on packets. The semantic firewall operates on meaning. An agent receiving a subtly malicious instruction — one that looks like legitimate workflow input but carries an injected command — cannot be protected by an IP allowlist. The semantic firewall reads what the input is trying to accomplish, checks that intent against declared policy, and either passes, sanitizes, or blocks the content before any execution takes place. It is the mandatory inspection layer every input must cross.

---

## Threat Model

```yaml
ThreatClass:
  
  PROMPT_INJECTION:
    description: "Embedded instructions in user/external data that override agent behavior"
    vectors:
      - tool_output_injection: "External API returns text containing instructions"
      - document_injection: "Uploaded document contains hidden instructions"
      - indirect_injection: "Web page content contains agent-targeting text"
    detection_methods: ["instruction_boundary_analysis", "role_confusion_detection", "privilege_escalation_pattern"]
  
  SCOPE_VIOLATION:
    description: "Input attempts to direct agent outside its declared capability scope"
    vectors:
      - lateral_tool_access: "Asking agent to use tools outside its capability manifest"
      - data_exfiltration_attempt: "Requesting access to data outside workflow context"
      - cross_workflow_contamination: "Input references data from other workflow runs"
    detection_methods: ["capability_scope_check", "data_provenance_check", "workflow_boundary_check"]
  
  POLICY_BYPASS:
    description: "Input attempts to circumvent governance rules or quality gates"
    vectors:
      - gate_skip_instruction: "Telling agent to skip quality checks"
      - approval_fabrication: "Claiming approvals that don't exist"
      - urgency_manipulation: "False urgency to bypass review processes"
    detection_methods: ["governance_reference_check", "approval_chain_verification", "urgency_signal_analysis"]
  
  SENSITIVE_DATA_EXFILTRATION:
    description: "Output contains sensitive data that should not leave the boundary"
    vectors:
      - credential_leakage: "API keys, tokens, passwords in output"
      - PII_exposure: "Personally identifiable information in output"
      - internal_system_disclosure: "Internal system details in external-facing output"
    detection_methods: ["pattern_matching", "classification_model", "data_label_propagation"]
  
  ADVERSARIAL_HALLUCINATION_AMPLIFICATION:
    description: "Input designed to trigger or amplify model hallucinations"
    vectors:
      - false_context_injection: "Providing false facts as context"
      - confidence_manipulation: "Framing designed to increase model confidence in falsehoods"
    detection_methods: ["fact_cross_reference", "confidence_calibration_check"]
```

---

## Inspection Pipeline

```
inspect(payload, inspection_context) → FirewallDecision:
  
  context = FirewallContext(
    agent_id = inspection_context.agent_id,
    run_id = inspection_context.run_id,
    node_id = inspection_context.node_id,
    declared_capability_scope = inspection_context.capability_scope,
    payload_direction = inspection_context.direction,  # "INPUT | OUTPUT"
    payload_source = inspection_context.source         # Who/what generated this
  )
  
  # Run all inspection passes in order (each may short-circuit)
  passes = [
    pass_prompt_injection_detection,
    pass_scope_boundary_check,
    pass_policy_bypass_detection,
    pass_sensitive_data_scan,
    pass_semantic_consistency_check
  ]
  
  violations = []
  
  FOR each pass_fn in passes:
    result = pass_fn(payload, context)
    violations.extend(result.violations)
    
    IF result.severity == "BLOCK":
      # Short-circuit: don't run further passes on definitively blocked content
      decision = FirewallDecision(
        decision = "BLOCK",
        violations = violations,
        reason = result.reason,
        sanitized_payload = null
      )
      record_decision(context, decision)
      RETURN decision
  
  # All passes complete
  IF violations:
    IF any(v.severity == "HIGH" for v in violations):
      decision = FirewallDecision(decision="BLOCK", violations=violations)
    ELIF any(v.severity == "MEDIUM" for v in violations) AND can_sanitize(violations):
      sanitized = sanitize_payload(payload, violations)
      decision = FirewallDecision(decision="SANITIZE", violations=violations, sanitized_payload=sanitized)
    ELSE:
      decision = FirewallDecision(decision="WARN", violations=violations, sanitized_payload=payload)
  ELSE:
    decision = FirewallDecision(decision="PASS", violations=[])
  
  record_decision(context, decision)
  RETURN decision
```

---

## Pass 1 — Prompt Injection Detection

```
pass_prompt_injection_detection(payload, context):
  
  text = extract_text(payload)
  violations = []
  
  # Pattern 1: Instruction boundary confusion
  # Detect text that attempts to redefine the agent's role or override instructions
  INJECTION_PATTERNS = [
    r"(?i)(ignore|forget|disregard)\s+(previous|prior|above|all)\s+(instructions?|rules?|context)",
    r"(?i)you\s+are\s+now\s+(a\s+)?(different|new|another)\s+(ai|assistant|agent|system)",
    r"(?i)(system\s+prompt|system\s+message|your\s+instructions)\s*(:|is|are)",
    r"(?i)(act\s+as|pretend\s+(you\s+are|to\s+be)|roleplay\s+as)\s+(?!a\s+helpful)",
    r"(?i)jailbreak|DAN\s+mode|developer\s+mode|unrestricted\s+mode",
    r"(?i)(bypass|skip|ignore)\s+(safety|security|governance|quality)\s+(check|gate|filter|control)"
  ]
  
  FOR each pattern in INJECTION_PATTERNS:
    matches = regex_findall(pattern, text)
    IF matches:
      violations.append(Violation(
        threat_class = "PROMPT_INJECTION",
        severity = "HIGH",
        pattern = pattern,
        matched_text = matches[0][:100],
        reason = "Potential instruction override detected"
      ))
  
  # Pattern 2: Role/privilege escalation signals
  # Text that claims elevated permissions not established in workflow context
  PRIVILEGE_PATTERNS = [
    r"(?i)(as\s+(an?\s+)?(admin|administrator|superuser|root|operator|system))",
    r"(?i)(I\s+have|you\s+have)\s+(full|unrestricted|unlimited)\s+(access|permissions?|rights?)",
    r"(?i)(override|escalate|elevate)\s+(permission|privilege|access|authority)"
  ]
  
  FOR each pattern in PRIVILEGE_PATTERNS:
    IF regex_search(pattern, text):
      # Check if context legitimately grants this — if not, flag
      IF NOT context_grants_privilege(pattern, context):
        violations.append(Violation(
          threat_class = "PROMPT_INJECTION",
          severity = "MEDIUM",
          reason = "Privilege escalation language without established grant"
        ))
  
  # Pattern 3: External data payload injection
  # Check tool outputs and document contents for embedded instructions
  IF context.payload_source in ["tool_output", "document", "web_fetch", "external_api"]:
    # External content gets stricter injection scanning
    EXTERNAL_INJECTION_PATTERNS = [
      r"(?i)\[INST\]|\[SYSTEM\]|<\|im_start\|>|Human:|Assistant:",
      r"(?i)(new\s+instructions?|updated\s+instructions?|important\s+instructions?)\s*:",
      r"(?i)(ignore|discard)\s+(the\s+)?(task|request|workflow)"
    ]
    FOR each pattern in EXTERNAL_INJECTION_PATTERNS:
      IF regex_search(pattern, text):
        violations.append(Violation(
          threat_class = "PROMPT_INJECTION",
          severity = "HIGH",
          reason = f"Injection pattern in external content from {context.payload_source}"
        ))
  
  RETURN InspectionResult(violations=violations, severity=max_severity(violations))
```

---

## Pass 2 — Scope Boundary Check

```
pass_scope_boundary_check(payload, context):
  
  violations = []
  
  # Load declared capability scope for this agent
  declared_scope = context.declared_capability_scope
  
  # Check for tool references outside declared scope
  referenced_tools = extract_tool_references(payload)
  FOR each tool_ref in referenced_tools:
    IF tool_ref NOT IN declared_scope.allowed_tools:
      violations.append(Violation(
        threat_class = "SCOPE_VIOLATION",
        severity = "HIGH",
        reason = f"Tool '{tool_ref}' referenced but not in agent's capability scope"
      ))
  
  # Check for data references outside workflow context
  referenced_data_sources = extract_data_references(payload)
  FOR each data_ref in referenced_data_sources:
    IF NOT is_in_workflow_context(data_ref, context.run_id):
      violations.append(Violation(
        threat_class = "SCOPE_VIOLATION",
        severity = "MEDIUM",
        reason = f"Data reference '{data_ref}' outside current workflow context"
      ))
  
  # Check for cross-workflow contamination
  cross_run_refs = extract_run_id_references(payload)
  FOR each ref_run_id in cross_run_refs:
    IF ref_run_id != context.run_id:
      violations.append(Violation(
        threat_class = "SCOPE_VIOLATION",
        severity = "HIGH",
        reason = f"Reference to workflow run {ref_run_id} outside current execution context"
      ))
  
  RETURN InspectionResult(violations=violations, severity=max_severity(violations))
```

---

## Pass 4 — Sensitive Data Scanner (Output Direction)

```
pass_sensitive_data_scan(payload, context):
  
  IF context.payload_direction != "OUTPUT":
    RETURN InspectionResult(violations=[])  # Only scan outbound
  
  violations = []
  text = extract_text(payload)
  
  # Credential pattern detection
  CREDENTIAL_PATTERNS = {
    "API_KEY":     r"(?i)(api[_-]?key|apikey)\s*[:=]\s*['\"]?[A-Za-z0-9\-_]{20,}",
    "AWS_KEY":     r"AKIA[0-9A-Z]{16}",
    "BEARER_TOKEN": r"(?i)bearer\s+[A-Za-z0-9\-_\.]{20,}",
    "PASSWORD":    r"(?i)(password|passwd|pwd)\s*[:=]\s*['\"]?\S{8,}",
    "PRIVATE_KEY": r"-----BEGIN\s+(RSA\s+)?PRIVATE KEY-----"
  }
  
  FOR key_type, pattern in CREDENTIAL_PATTERNS.items():
    IF regex_search(pattern, text):
      violations.append(Violation(
        threat_class = "SENSITIVE_DATA_EXFILTRATION",
        severity = "BLOCK",
        reason = f"Potential {key_type} detected in output"
      ))
  
  # PII detection (simplified — full implementation uses NLP classifier)
  PII_PATTERNS = {
    "EMAIL":    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "SSN":      r"\b\d{3}-\d{2}-\d{4}\b",
    "CREDIT_CARD": r"\b(?:\d[ -]?){13,16}\b"
  }
  
  FOR pii_type, pattern in PII_PATTERNS.items():
    matches = regex_findall(pattern, text)
    IF len(matches) > 0 AND NOT output_is_authorized_for_pii(context):
      violations.append(Violation(
        threat_class = "SENSITIVE_DATA_EXFILTRATION",
        severity = "HIGH",
        reason = f"{pii_type} found in output without PII output authorization"
      ))
  
  RETURN InspectionResult(violations=violations, severity=max_severity(violations))
```

---

## Firewall Decision Schema

```yaml
FirewallDecision:
  decision_id: string                  # uuid
  
  decision: "PASS | WARN | SANITIZE | BLOCK"
  
  context:
    agent_id: string
    run_id: string
    node_id: string | null
    payload_direction: "INPUT | OUTPUT"
    payload_source: string
    inspection_timestamp: datetime
  
  violations:
    - threat_class: string
      severity: "LOW | MEDIUM | HIGH | BLOCK"
      pattern: string | null
      matched_text: string | null
      reason: string
  
  sanitized_payload: any | null        # Present if decision == SANITIZE
  
  # Cryptographic integrity
  decision_hash: string                # SHA-256 of (decision_id + context + decision + violations)
  signed_by: string                    # semantic-firewall system identity
```

---

## Integration

**Called by:** Every agent before processing any input and before emitting any output — mandatory; cannot be bypassed

**Calls:**
- `semantic-gateway/tool-intent-verifier.md` — for tool-call payloads, deep intent analysis
- `governance-attestation/attestation-registry.md` — verifies claimed approvals in inputs
- `audit-replay/immutable-audit-log.md` — records all firewall decisions

**Reads from:** `memory/semantic-gateway/firewall-state.yaml` — policy configuration, pattern libraries
**Writes to:** `memory/semantic-gateway/firewall-decisions.jsonl` — append-only decision log
