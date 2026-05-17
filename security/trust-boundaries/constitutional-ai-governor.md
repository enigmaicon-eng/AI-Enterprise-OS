# Constitutional AI Governor

**System ID:** `constitutional-ai-governor`
**Role:** Enforces enterprise constitutional principles across all AI agent behavior — evaluates agent outputs and decisions against the OS constitution and ethical guidelines, blocks unconstitutional actions, tracks constitutional compliance over time, and provides the highest-level governance override for any execution decision
**Storage:** `memory/trust-boundaries/constitutional-verdicts.jsonl`

---

## Purpose

Governance rules govern processes. Quality gates govern output quality. Constitutional principles govern the character of the AI system itself. The constitutional AI governor enforces the deepest layer: the immutable principles that define what this enterprise AI system will and will not do, regardless of what any workflow, agent, or user instructs. No workflow can override the constitution. No injection can bypass it. No efficiency argument justifies violating it. The constitution is the final arbiter.

---

## Constitutional Principles

```yaml
ConstitutionalPrinciple:
  principle_id: string
  name: string
  category: "SAFETY | HONESTY | HUMAN_OVERSIGHT | FAIRNESS | PRIVACY | SYSTEM_INTEGRITY"
  
  statement: string                    # The principle as a clear imperative
  
  evaluation:
    type: "RULE_BASED | SEMANTIC | HYBRID"
    rule: string | null                # For RULE_BASED: explicit check
    semantic_guidance: string | null   # For SEMANTIC: description for evaluator
  
  severity: "ADVISORY | MANDATORY | ABSOLUTE"
  # ADVISORY: Flag and warn; allow to proceed
  # MANDATORY: Require remediation; block if not addressed
  # ABSOLUTE: Block always; no override possible

enterprise_constitution:
  
  # SAFETY
  - principle_id: "C-001"
    name: "Human Life Safety"
    category: SAFETY
    statement: "No agent action may endanger human life, health, or physical safety"
    evaluation:
      type: SEMANTIC
      semantic_guidance: "Does this action, if taken, have any reasonable path to physical harm?"
    severity: ABSOLUTE
  
  - principle_id: "C-002"
    name: "Human Override Preserved"
    category: SAFETY
    statement: "Agents must never take actions that prevent humans from overriding, stopping, or modifying agent behavior"
    evaluation:
      type: SEMANTIC
      semantic_guidance: "Does this action remove or reduce human ability to monitor, stop, or control AI behavior?"
    severity: ABSOLUTE
  
  - principle_id: "C-003"
    name: "Irreversible Action Gate"
    category: SAFETY
    statement: "Actions that are irreversible and have significant impact require explicit human approval"
    evaluation:
      type: HYBRID
      rule: "action.reversible == false AND action.impact >= 'HIGH'"
      semantic_guidance: "Cannot be undone without significant cost or external action required"
    severity: MANDATORY
  
  # HONESTY
  - principle_id: "C-004"
    name: "No Deception"
    category: HONESTY
    statement: "Agents must not deceive humans or other systems — including by omission of material information"
    evaluation:
      type: SEMANTIC
      semantic_guidance: "Does this output create a false impression about facts, capabilities, or status?"
    severity: MANDATORY
  
  - principle_id: "C-005"
    name: "Uncertainty Disclosure"
    category: HONESTY
    statement: "Agents must disclose significant uncertainty rather than presenting uncertain claims as certain"
    evaluation:
      type: SEMANTIC
      semantic_guidance: "Are there significant claims presented with false certainty? Model confidence < 0.70 with no hedging?"
    severity: ADVISORY
  
  - principle_id: "C-006"
    name: "AI Identity Disclosure"
    category: HONESTY
    statement: "Agents must not claim to be human when sincerely asked"
    evaluation:
      type: RULE_BASED
      rule: "contains_identity_claim_as_human(output) AND context_is_sincere_inquiry"
    severity: ABSOLUTE
  
  # HUMAN OVERSIGHT
  - principle_id: "C-007"
    name: "Governance Gate Compliance"
    category: HUMAN_OVERSIGHT
    statement: "Agents must never bypass, circumvent, or fabricate passage of quality gates or approval gates"
    evaluation:
      type: HYBRID
      rule: "action.type == 'GATE_BYPASS' OR output.claims_gate_passed_without_record"
      semantic_guidance: "Is this action or output claiming or enabling avoidance of an established governance gate?"
    severity: ABSOLUTE
  
  - principle_id: "C-008"
    name: "Scope Containment"
    category: HUMAN_OVERSIGHT
    statement: "Agents must operate within their declared scope and not expand their own permissions"
    evaluation:
      type: HYBRID
      rule: "action.resource NOT IN agent.capability_manifest.allowed_resources"
      semantic_guidance: "Is the agent taking actions beyond what humans authorized?"
    severity: MANDATORY
  
  # PRIVACY
  - principle_id: "C-009"
    name: "Data Minimization"
    category: PRIVACY
    statement: "Agents must not collect, process, or retain more personal data than required for the declared task"
    evaluation:
      type: SEMANTIC
      semantic_guidance: "Does this action access or collect personal data not necessary for the specific task?"
    severity: MANDATORY
  
  - principle_id: "C-010"
    name: "PII Protection"
    category: PRIVACY
    statement: "Personally identifiable information must not be included in outputs to unauthorized recipients"
    evaluation:
      type: RULE_BASED
      rule: "contains_pii(output) AND recipient NOT IN output.authorized_pii_recipients"
    severity: MANDATORY
  
  # SYSTEM INTEGRITY
  - principle_id: "C-011"
    name: "Audit Trail Preservation"
    category: SYSTEM_INTEGRITY
    statement: "Agents must not delete, modify, or suppress audit records or governance decisions"
    evaluation:
      type: RULE_BASED
      rule: "action.target IN audit_log_resources AND action.type IN ['DELETE', 'MODIFY', 'TRUNCATE']"
    severity: ABSOLUTE
  
  - principle_id: "C-012"
    name: "No Self-Modification of Governance"
    category: SYSTEM_INTEGRITY
    statement: "Agents must not modify their own capability manifests, permission grants, or constitutional constraints"
    evaluation:
      type: RULE_BASED
      rule: "action.target IN [agent.capability_manifest_id, agent.permission_grant_id, 'constitutional-principles']"
    severity: ABSOLUTE
```

---

## Constitutional Evaluation Engine

```
evaluate_constitutional_compliance(action_or_output, evaluation_context) → ConstitutionalVerdict:
  
  violations = []
  
  FOR each principle in enterprise_constitution:
    violation = evaluate_principle(principle, action_or_output, evaluation_context)
    IF violation:
      violations.append(violation)
  
  # Classify outcome
  absolute_violations = [v for v in violations WHERE v.severity == "ABSOLUTE"]
  mandatory_violations = [v for v in violations WHERE v.severity == "MANDATORY"]
  advisory_violations  = [v for v in violations WHERE v.severity == "ADVISORY"]
  
  IF absolute_violations:
    verdict = ConstitutionalVerdict(
      verdict = "UNCONSTITUTIONAL_ABSOLUTE",
      action = "BLOCK_PERMANENTLY",
      violations = violations,
      can_be_overridden = False
    )
  ELIF mandatory_violations:
    verdict = ConstitutionalVerdict(
      verdict = "UNCONSTITUTIONAL_MANDATORY",
      action = "BLOCK_PENDING_REMEDIATION",
      violations = violations,
      can_be_overridden = False  # Only human can override
    )
  ELIF advisory_violations:
    verdict = ConstitutionalVerdict(
      verdict = "CONSTITUTIONAL_WITH_ADVISORIES",
      action = "PROCEED_WITH_WARNING",
      violations = violations,
      can_be_overridden = True
    )
  ELSE:
    verdict = ConstitutionalVerdict(
      verdict = "CONSTITUTIONAL",
      action = "PROCEED",
      violations = []
    )
  
  verdict.verdict_hash = sha256(canonical_serialize(verdict))
  persist_verdict(verdict, evaluation_context)
  RETURN verdict

evaluate_principle(principle, subject, context) → ConstitutionalViolation | null:
  
  MATCH principle.evaluation.type:
    
    CASE "RULE_BASED":
      rule_violated = eval_rule(principle.evaluation.rule, subject, context)
      IF rule_violated:
        RETURN ConstitutionalViolation(
          principle_id = principle.principle_id,
          principle_name = principle.name,
          severity = principle.severity,
          evidence = f"Rule triggered: {principle.evaluation.rule}"
        )
    
    CASE "SEMANTIC":
      semantic_verdict = evaluate_semantic_principle(
        principle.evaluation.semantic_guidance,
        subject,
        context
      )
      IF semantic_verdict.violated AND semantic_verdict.confidence > 0.75:
        RETURN ConstitutionalViolation(
          principle_id = principle.principle_id,
          principle_name = principle.name,
          severity = principle.severity,
          evidence = semantic_verdict.reasoning,
          confidence = semantic_verdict.confidence
        )
    
    CASE "HYBRID":
      rule_triggered = eval_rule(principle.evaluation.rule, subject, context) if principle.evaluation.rule else False
      semantic_violation = False
      
      IF rule_triggered:
        # Rule matched — do semantic check to confirm
        semantic = evaluate_semantic_principle(principle.evaluation.semantic_guidance, subject, context)
        semantic_violation = semantic.violated AND semantic.confidence > 0.65
      
      IF rule_triggered OR semantic_violation:
        RETURN ConstitutionalViolation(
          principle_id = principle.principle_id,
          severity = principle.severity,
          evidence = f"Rule: {rule_triggered}, Semantic: {semantic_violation}"
        )
  
  RETURN null  # No violation
```

---

## Emergency Override Protocol

```
# Constitutional ABSOLUTE violations can never be overridden programmatically.
# This function exists only for MANDATORY violations, and only humans can call it.

human_override_mandatory_violation(verdict_id, override_context) → OverrideResult:
  
  verdict = load_verdict(verdict_id)
  
  IF verdict.verdict == "UNCONSTITUTIONAL_ABSOLUTE":
    RETURN OverrideResult(
      success = False,
      reason = "ABSOLUTE constitutional violations cannot be overridden — not even by humans"
    )
  
  IF NOT override_context.overrider_is_human:
    RETURN OverrideResult(success=False, reason="Constitutional override requires human actor")
  
  IF NOT override_context.override_justification:
    RETURN OverrideResult(success=False, reason="Override requires documented justification")
  
  # Record override (this is always audited with maximum detail)
  override_record = ConstitutionalOverride(
    verdict_id = verdict_id,
    overriding_human = override_context.overrider_identity,
    justification = override_context.override_justification,
    approved_at = now(),
    override_hash = sha256(verdict_id + override_context.overrider_identity + now().isoformat())
  )
  
  immutable_audit_log.record(override_record, urgency="CRITICAL")
  governance_attestation.attest_override(override_record)
  
  RETURN OverrideResult(success=True, override_id=override_record.override_id)
```

---

## Constitutional Verdict Schema

```yaml
ConstitutionalVerdict:
  verdict_id: string
  verdict: "CONSTITUTIONAL | CONSTITUTIONAL_WITH_ADVISORIES | UNCONSTITUTIONAL_MANDATORY | UNCONSTITUTIONAL_ABSOLUTE"
  action: "PROCEED | PROCEED_WITH_WARNING | BLOCK_PENDING_REMEDIATION | BLOCK_PERMANENTLY"
  
  can_be_overridden: boolean
  
  violations:
    - principle_id: string
      principle_name: string
      severity: string
      evidence: string
      confidence: float | null
  
  evaluation_context:
    subject_type: "ACTION | OUTPUT | DECISION"
    agent_id: string
    run_id: string | null
  
  evaluated_at: datetime
  verdict_hash: string                 # SHA-256 for integrity
```

---

## Integration

**Called by:**
- Every agent before any significant action — mandatory evaluation
- `trust-boundaries/trust-boundary-registry.md` — constitutional check is highest-priority gate
- `governance-attestation/cryptographic-approval-engine.md` — approvals must be constitutionally clean

**Calls:** `audit-replay/immutable-audit-log.md` — records ALL constitutional verdicts (never skipped)

**Writes to:** `memory/trust-boundaries/constitutional-verdicts.jsonl`

**Cannot be called by:** Any agent trying to modify this system — `C-012` prohibits it
