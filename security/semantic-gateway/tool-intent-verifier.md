# Tool Intent Verifier

**System ID:** `tool-intent-verifier`
**Role:** Verifies that every tool call made by an agent matches the declared intent of the current workflow step — detects misaligned tool use, unauthorized tool chaining, intent drift between workflow declaration and actual execution, and semantic inconsistencies between what an agent was asked to do and what tools it is attempting to invoke
**Storage:** `memory/semantic-gateway/tool-intent-log.jsonl`

---

## Purpose

An agent with access to a file-writing tool and a web-fetch tool, asked to summarize a document, should not be fetching external URLs and writing new files to disk. The gap between declared intent (summarize this document) and tool behavior (fetch external URL + write file) is an intent violation — whether caused by hallucination, injection, or misconfiguration. The tool intent verifier closes this gap by requiring every tool invocation to be semantically consistent with the workflow node's declared purpose.

---

## Intent Classification Model

```yaml
IntentClass:
  
  READ_ONLY:
    description: "Read, analyze, summarize existing data without side effects"
    allowed_tool_categories: ["READ", "SEARCH", "ANALYZE", "RETRIEVE"]
    forbidden_tool_categories: ["WRITE", "SEND", "DELETE", "MODIFY", "PUBLISH", "EXECUTE"]
    examples: ["Summarize this document", "Answer questions about existing data"]
  
  WRITE_BOUNDED:
    description: "Write to pre-authorized destinations within workflow context"
    allowed_tool_categories: ["READ", "WRITE_LOCAL", "ANALYZE"]
    forbidden_tool_categories: ["SEND", "PUBLISH_EXTERNAL", "DELETE", "EXECUTE_SHELL"]
    destinations_must_match: workflow_node_declared_outputs
  
  COMMUNICATE:
    description: "Send messages or notifications to pre-approved recipients"
    allowed_tool_categories: ["SEND_MESSAGE", "NOTIFY", "READ"]
    forbidden_tool_categories: ["WRITE_FILE", "EXECUTE", "DELETE"]
    recipients_must_match: workflow_node_declared_recipients
  
  EXECUTE_BOUNDED:
    description: "Execute code or commands within declared sandbox context"
    allowed_tool_categories: ["EXECUTE_SANDBOX", "READ", "WRITE_LOCAL"]
    forbidden_tool_categories: ["NETWORK_CALL", "WRITE_EXTERNAL", "DELETE_PERSISTENT"]
  
  HUMAN_APPROVAL:
    description: "Present decision for human review — no automated execution"
    allowed_tool_categories: ["READ", "PRESENT", "NOTIFY"]
    forbidden_tool_categories: ["WRITE", "EXECUTE", "SEND", "MODIFY"]
  
  RESEARCH:
    description: "Gather information from approved external sources"
    allowed_tool_categories: ["WEB_FETCH", "SEARCH", "READ"]
    forbidden_tool_categories: ["WRITE_EXTERNAL", "SEND", "EXECUTE"]
    sources_must_match: workflow_node_declared_sources

# Tool category assignments
TOOL_CATEGORIES:
  "Read":            READ
  "Glob":            READ
  "Grep":            READ
  "Write":           WRITE_LOCAL
  "Edit":            WRITE_LOCAL
  "Bash":            EXECUTE_SHELL  # High risk — requires EXECUTE_BOUNDED intent
  "WebFetch":        WEB_FETCH
  "WebSearch":       SEARCH
  "mcp__Gmail__*":   SEND_MESSAGE
  "mcp__Slack__*":   SEND_MESSAGE
  "Agent":           EXECUTE_BOUNDED  # Spawning sub-agents
```

---

## Verification Protocol

```
verify_tool_call(tool_call, verification_context) → ToolIntentVerdict:
  
  agent_id = verification_context.agent_id
  run_id = verification_context.run_id
  node_id = verification_context.node_id
  
  # Load workflow node declaration
  node_decl = workflow_registry.get_node_declaration(run_id, node_id)
  declared_intent = node_decl.intent_class           # e.g., "READ_ONLY"
  declared_tools = node_decl.allowed_tools           # Explicit allowlist from definition
  
  intent_config = INTENT_CLASSES[declared_intent]
  
  verdicts = []
  
  # Check 1: Tool is in explicit node allowlist
  IF declared_tools AND tool_call.tool_name NOT IN declared_tools:
    verdicts.append(IntentViolation(
      violation_type = "UNDECLARED_TOOL",
      severity = "HIGH",
      message = f"Tool '{tool_call.tool_name}' not in node's declared tool allowlist"
    ))
  
  # Check 2: Tool category matches intent class
  tool_category = classify_tool(tool_call.tool_name)
  IF tool_category IN intent_config.forbidden_tool_categories:
    verdicts.append(IntentViolation(
      violation_type = "INTENT_MISMATCH",
      severity = "BLOCK",
      message = f"Tool category '{tool_category}' forbidden for intent '{declared_intent}'"
    ))
  
  # Check 3: Tool arguments are semantically consistent
  arg_verdict = verify_tool_arguments(tool_call, node_decl, declared_intent)
  IF arg_verdict.violations:
    verdicts.extend(arg_verdict.violations)
  
  # Check 4: Tool chain depth (prevent runaway agent tool loops)
  recent_tools = get_tool_call_history(agent_id, run_id, node_id, window_seconds=60)
  IF len(recent_tools) > intent_config.max_tool_calls_per_node:
    verdicts.append(IntentViolation(
      violation_type = "TOOL_CHAIN_LIMIT_EXCEEDED",
      severity = "HIGH",
      message = f"Agent has made {len(recent_tools)} tool calls in this node (limit: {intent_config.max_tool_calls_per_node})"
    ))
  
  # Check 5: Destination/target verification
  IF declared_intent == "WRITE_BOUNDED":
    target = extract_write_target(tool_call)
    IF target NOT IN node_decl.declared_output_destinations:
      verdicts.append(IntentViolation(
        violation_type = "UNAUTHORIZED_WRITE_DESTINATION",
        severity = "HIGH",
        message = f"Write target '{target}' not in declared outputs for this node"
      ))
  
  IF declared_intent == "COMMUNICATE":
    recipients = extract_recipients(tool_call)
    FOR r in recipients:
      IF r NOT IN node_decl.declared_recipients:
        verdicts.append(IntentViolation(
          violation_type = "UNAUTHORIZED_RECIPIENT",
          severity = "BLOCK",
          message = f"Message recipient '{r}' not in declared recipients"
        ))
  
  # Compute verdict
  IF any(v.severity == "BLOCK" for v in verdicts):
    verdict = ToolIntentVerdict(verdict="BLOCK", violations=verdicts)
  ELIF any(v.severity == "HIGH" for v in verdicts):
    verdict = ToolIntentVerdict(verdict="DENY", violations=verdicts)
  ELIF verdicts:
    verdict = ToolIntentVerdict(verdict="WARN", violations=verdicts)
  ELSE:
    verdict = ToolIntentVerdict(verdict="ALLOW", violations=[])
  
  log_verdict(tool_call, verification_context, verdict)
  RETURN verdict
```

---

## Tool Argument Semantic Verification

```
verify_tool_arguments(tool_call, node_decl, declared_intent) → ArgVerificationResult:
  
  violations = []
  tool_name = tool_call.tool_name
  args = tool_call.arguments
  
  MATCH tool_name:
    
    CASE "Bash":
      cmd = args.get("command", "")
      
      # Detect dangerous bash patterns
      DANGEROUS_PATTERNS = [
        (r"rm\s+-rf?\s+/", "Recursive delete from root"),
        (r"curl\s+.*\|\s*(bash|sh)", "Pipe curl to shell"),
        (r"wget\s+.*-O\s*-\s*\|", "Pipe wget to shell"),
        (r">\s*/etc/", "Write to /etc"),
        (r"chmod\s+777", "World-writable permission"),
        (r"\$\(curl", "Command substitution with curl"),
        (r"nc\s+.*-e", "Netcat with exec — reverse shell pattern"),
        (r"base64\s+--decode\s*\|", "Decode and pipe — obfuscation pattern")
      ]
      
      FOR pattern, reason in DANGEROUS_PATTERNS:
        IF regex_search(pattern, cmd):
          violations.append(IntentViolation(
            violation_type = "DANGEROUS_COMMAND",
            severity = "BLOCK",
            message = f"Bash argument contains dangerous pattern: {reason}"
          ))
      
      # Check if bash is allowed for this node at all
      IF declared_intent == "READ_ONLY":
        violations.append(IntentViolation(
          violation_type = "INTENT_MISMATCH",
          severity = "BLOCK",
          message = "Bash tool called in READ_ONLY intent node"
        ))
    
    CASE "WebFetch":
      url = args.get("url", "")
      
      # Verify URL is in declared allowed sources
      IF node_decl.allowed_sources:
        IF NOT any(url.startswith(src) for src in node_decl.allowed_sources):
          violations.append(IntentViolation(
            violation_type = "UNAUTHORIZED_FETCH_TARGET",
            severity = "HIGH",
            message = f"WebFetch URL '{url[:80]}' not in declared allowed sources"
          ))
      
      # Block internal network access from external-facing agents
      IF is_internal_network_url(url) AND agent_is_externally_exposed(node_decl.agent_id):
        violations.append(IntentViolation(
          violation_type = "SSRF_ATTEMPT",
          severity = "BLOCK",
          message = "WebFetch targeting internal network from external-facing agent (SSRF risk)"
        ))
    
    CASE "Agent":
      subagent_type = args.get("subagent_type", "general-purpose")
      
      # Verify agent spawning is declared
      IF NOT node_decl.allows_subagent_spawn:
        violations.append(IntentViolation(
          violation_type = "UNDECLARED_SUBAGENT_SPAWN",
          severity = "HIGH",
          message = "Agent tool called but node declaration does not allow subagent spawning"
        ))
  
  RETURN ArgVerificationResult(violations=violations)
```

---

## Tool Intent Verdict Schema

```yaml
ToolIntentVerdict:
  verdict_id: string
  verdict: "ALLOW | WARN | DENY | BLOCK"
  
  tool_call:
    tool_name: string
    arguments_hash: string             # SHA-256 of args (not stored in plain — privacy)
  
  context:
    agent_id: string
    run_id: string
    node_id: string
    declared_intent: string
  
  violations:
    - violation_type: string
      severity: string
      message: string
  
  verified_at: datetime
  verdict_hash: string                 # SHA-256 of full verdict for audit integrity
```

---

## Integration

**Called by:** `semantic-gateway/mcp-governance-gateway.md` — for every MCP tool invocation; `execution-security/capability-scope-controller.md` — as part of capability enforcement

**Calls:**
- `workflow-engine/workflow-registry.md` — reads node declarations
- `audit-replay/immutable-audit-log.md` — writes all verdicts

**Reads from:** `memory/semantic-gateway/tool-intent-log.jsonl`
**Writes to:** `memory/semantic-gateway/tool-intent-log.jsonl`
