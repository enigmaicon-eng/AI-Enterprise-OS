# Policy Testing Framework

## Purpose
Ensures that every enterprise policy behaves exactly as intended before it is activated in production. Policy bugs are compliance failures: a policy that is too permissive creates uncontrolled exposure; a policy that is too restrictive blocks legitimate operations. The testing framework provides the tools, protocols, and quality gates to catch both classes of defect before they reach production, and to prevent regressions when policies are updated.

---

## Test Architecture

```
Policy Document (PDL)
        ↓
[Unit Tests]              → test individual rules in isolation against hand-crafted inputs
        ↓
[Scenario Tests]          → test the complete policy against realistic end-to-end scenarios
        ↓
[Edge Case Tests]         → boundary conditions, null fields, extreme values
        ↓
[Conflict Tests]          → multi-policy interactions; verify DENY_OVERRIDES behavior
        ↓
[Regression Tests]        → ensure new version produces identical decisions to prior version (for MINOR/PATCH)
        ↓
[Coverage Report]         → what % of rules are exercised? what % of branches?
        ↓
[Quality Gate]            → all tests must pass; coverage >= 80%; no regressions before activation
        ↓
[Test Records]            → all test runs stored in policy registry alongside policy document
```

---

## Test Case Schema

```yaml
policy_test_case:
  test_id: "TEST-{policy_id}-{seq}"
  policy_id: string
  policy_version: semver                        # which version this test is written for
  test_type: UNIT | SCENARIO | EDGE_CASE | CONFLICT | REGRESSION | SECURITY
  
  name: string
  description: string                           # what is this test verifying?
  
  input:
    evaluation_request: policy_evaluation_request  # full request (see policy-engine.md)
    # For multi-policy conflict tests:
    additional_active_policies: [policy_id]     # simulate these policies being active simultaneously
  
  expected_outcome:
    decision: ALLOW | DENY | ALLOW_WITH_CONDITIONS | REQUIRE_APPROVAL
    is_hard_deny: boolean | null                # if DENY, is it hard?
    determining_rule_id: string | null          # which rule should drive this decision
    conditions_required: [condition_id] | null  # for ALLOW_WITH_CONDITIONS
    required_approvers_minimum_tier: int | null # for REQUIRE_APPROVAL
    explanation_contains: [string] | null       # keywords that must appear in explain mode output
  
  should_NOT_produce:
    decision: [ALLOW | DENY | ALLOW_WITH_CONDITIONS | REQUIRE_APPROVAL] | null
    note: string | null                         # why this decision would be wrong
  
  tags: [string]                                # e.g., ["happy-path", "security", "edge-case"]
  authored_by: agent_id | human_id
  authored_at: ISO-8601

# ─────────────────────────────────────────────────────────────
# TEST CASE EXAMPLES
# ─────────────────────────────────────────────────────────────

examples:
  - test_id: TEST-POL-SEC-007-001
    policy_id: POL-SEC-007
    test_type: UNIT
    name: tier2_agent_critical_blast_radius_denied
    description: "Tier-2 agent attempting irreversible CRITICAL blast radius action must be denied."
    input:
      evaluation_request:
        subject: {actor_id: "agent-eng-007", actor_type: AGENT, actor_tier: 2}
        action: {action_type: "SYSTEM_DECOMMISSION", reversibility: IRREVERSIBLE, blast_radius: CRITICAL}
        resource: {resource_type: "SYSTEM", resource_id: "sys-prod-001"}
        context: {environment: PRODUCTION}
    expected_outcome:
      decision: DENY
      is_hard_deny: false
      determining_rule_id: RULE-POL-SEC-007-01
    should_NOT_produce:
      decision: [ALLOW, ALLOW_WITH_CONDITIONS]
  
  - test_id: TEST-POL-SEC-007-002
    policy_id: POL-SEC-007
    test_type: UNIT
    name: tier4_agent_critical_blast_radius_allowed
    description: "Tier-4 agent should pass the blast radius check."
    input:
      evaluation_request:
        subject: {actor_id: "agent-exec-001", actor_type: AGENT, actor_tier: 4}
        action: {action_type: "SYSTEM_DECOMMISSION", reversibility: IRREVERSIBLE, blast_radius: CRITICAL}
        resource: {resource_type: "SYSTEM", resource_id: "sys-prod-001"}
        context: {environment: PRODUCTION}
    expected_outcome:
      decision: ALLOW                           # POL-SEC-007 alone should not deny Tier-4
      should_NOT_produce:
        decision: [DENY]
  
  - test_id: TEST-POL-CONST-001-001
    policy_id: POL-CONST-001
    test_type: SECURITY
    name: prohibited_practice_hard_deny_not_overrideable
    description: "Prohibited AI practice must produce HARD_DENY regardless of any other active policies."
    input:
      evaluation_request:
        subject: {actor_id: "agent-ai-001", actor_type: AGENT, actor_tier: 5}
        action: {action_type: "SOCIAL_SCORING"}
        resource: {resource_type: "AI_SYSTEM", resource_id: "sys-ai-scoring-001"}
        context: {environment: PRODUCTION}
      additional_active_policies: ["POL-ALLOW-ALL-TIER5"]  # simulate a maximally permissive policy
    expected_outcome:
      decision: DENY
      is_hard_deny: true
      determining_rule_id: RULE-POL-CONST-001-01
    should_NOT_produce:
      decision: [ALLOW, ALLOW_WITH_CONDITIONS, REQUIRE_APPROVAL]
      note: "Hard deny cannot be overridden by any other policy, including T5 blanket allows."
```

---

## Test Coverage Requirements

```yaml
coverage_requirements:
  minimum_coverage:
    CONSTITUTIONAL_policies: 100% rule coverage; 100% branch coverage; no exceptions
    REGULATORY_COMPLIANCE_policies: >= 95% rule coverage; >= 90% branch coverage
    SECURITY_policies: >= 90% rule coverage; >= 85% branch coverage
    AI_GOVERNANCE_policies: >= 90% rule coverage; >= 90% branch coverage
    OPERATIONAL_policies: >= 80% rule coverage; >= 75% branch coverage
    DEFAULT_policies: >= 70% rule coverage
  
  coverage_measurement:
    rule_coverage: % of rules exercised by at least one test case
    branch_coverage: % of condition branches (true/false for each condition) exercised
    effect_coverage: all effect types exercised (ALLOW, DENY, REQUIRE_APPROVAL, ALLOW_WITH_CONDITIONS where applicable)
  
  mandatory_test_cases:
    for_every_DENY_rule: at least one positive test (shows it denies) + one negative test (shows it allows non-matching inputs)
    for_every_HARD_DENY_rule: positive test + override attempt test (verify it cannot be overridden)
    for_every_REQUIRE_APPROVAL_rule: positive test + test verifying correct approver identification
    for_every_CONSTITUTIONAL_policy: adversarial test battery (see security test types below)
  
  gap_detection:
    uncovered_rules: listed in coverage report with note "no test case exercises this rule"
    uncovered_branches: condition branches never exercised
    gap_threshold: > 10% uncovered branches in CONSTITUTIONAL or SECURITY policy → block activation
```

---

## Test Types in Detail

```yaml
test_types:
  UNIT_tests:
    scope: single rule in isolation
    purpose: verify each rule's condition-effect logic is correct
    method: craft minimal evaluation_request that precisely satisfies (or fails to satisfy) the rule condition
    required: at least 2 per rule (one matching; one non-matching)
  
  SCENARIO_tests:
    scope: complete policy; realistic end-to-end request
    purpose: verify policy behaves correctly in real workflow contexts
    method: use realistic actor/action/resource combinations from actual OS operations
    required: at least 3 per policy (typical case; elevated case; negative case)
  
  EDGE_CASE_tests:
    scope: boundary conditions
    examples:
      - null fields in evaluation request (graceful handling; no engine crash)
      - trust_score exactly at threshold (0.70 when threshold is 0.70)
      - delegation_chain.length exactly at maximum (4 hops)
      - timestamp at boundary (00:00:00 UTC; edge of applicable_from/applicable_until)
      - empty list fields (actor_capabilities = [])
    required: at least 5 per policy with boundary conditions
  
  CONFLICT_tests:
    scope: multiple policies active simultaneously
    purpose: verify DENY_OVERRIDES combination strategy works correctly
    method: activate multiple conflicting policies in test environment; verify final decision
    required: at least 2 per policy (one conflict where this policy denies; one where another policy denies despite this one allowing)
  
  REGRESSION_tests:
    scope: comparison between policy versions
    purpose: ensure MINOR and PATCH updates do not change decisions for existing scenarios
    method: run all test cases from prior version against new version; flag any decision changes
    required: automatically generated from prior version's test suite when creating new version
    acceptable_divergence: 0% for PATCH; < 1% for MINOR; documented justification required for any divergence
  
  SECURITY_tests:
    scope: adversarial inputs targeting CONSTITUTIONAL and SECURITY policies
    purpose: verify policies cannot be bypassed by crafted inputs
    method:
      - privilege_escalation_attempt: low-tier actor claims high-tier capabilities
      - tier_spoofing: actor_tier field manipulation
      - delegation_chain_forgery: injection of false entries in delegation_chain
      - environment_spoofing: PRODUCTION request framed as DEVELOPMENT
      - exception_injection: fictional exception_id inserted in active_exceptions
    required: full battery for all CONSTITUTIONAL and SECURITY policies
    failure_consequence: compilation fails; policy cannot be activated; security incident logged
```

---

## Test Execution Protocol

```yaml
test_execution:
  when_tests_run:
    ON_POLICY_CHANGE: any new version triggers full test suite execution
    ON_COMPILER_UPDATE: all policies re-tested against new compiler
    NIGHTLY: full test suite against all active policies (regression detection)
    ON_DEMAND: policy owner or compliance lead can trigger manual test run
  
  execution_environment:
    isolated: test evaluation never touches production policy engine or audit trail
    mocked_context: live function calls (lookup_risk_score, etc.) mocked with test fixture values
    deterministic: same input always produces same output; no random or time-dependent behavior
    parallel: test cases for a policy run in parallel; different policies tested in parallel
  
  result_record:
    test_run_id: "TESTRUN-{policy_id}-{timestamp}"
    policy_version: semver
    total_cases: int
    passed: int
    failed: int
    skipped: int
    coverage:
      rule_coverage_pct: float
      branch_coverage_pct: float
    duration_ms: int
    failed_cases: [{test_id, actual_decision, expected_decision, difference}]
    stored_in: policy_registry alongside policy document
  
  quality_gate:
    PASS_conditions:
      - all test cases pass (zero failures)
      - coverage meets minimum for policy category
      - no security test failures (regardless of category)
    FAIL_action:
      - compilation fails; policy version cannot be activated
      - test failures reported to policy owner immediately
      - prior policy version remains active
```

---

## Test Data Management

```yaml
test_data:
  test_fixtures:
    standard_actors:
      tier1_agent: {actor_id: "TEST-AGENT-T1", actor_tier: 1, actor_type: AGENT}
      tier3_agent: {actor_id: "TEST-AGENT-T3", actor_tier: 3, actor_type: AGENT}
      tier5_human: {actor_id: "TEST-HUMAN-T5", actor_tier: 5, actor_type: HUMAN}
    
    standard_resources:
      critical_ai_system: {resource_type: AI_SYSTEM, resource_classification: RESTRICTED, resource_domain: AI_GOVERNANCE}
      production_database: {resource_type: DATA, resource_classification: CONFIDENTIAL}
      low_risk_config: {resource_type: CONFIGURATION, resource_classification: INTERNAL}
    
    mock_function_returns:
      lookup_risk_score_critical: 20          # returns CRITICAL risk score
      lookup_trust_score_low: 0.40            # below most thresholds
      lookup_trust_score_high: 0.90           # above most thresholds
      has_active_exception_false: false
      has_active_exception_true: true
  
  test_data_governance:
    no_production_data: test cases must never reference real actor IDs or resource IDs from production
    synthetic_only: all test data is synthetic; generated specifically for testing
    test_data_version: test data fixtures are versioned alongside the policy they support
```

---

## Integration Points

| System | Role |
|---|---|
| `policy-as-code/policy-engine.md` | Engine used for test evaluation (isolated instance) |
| `policy-as-code/policy-compiler.md` | Compiled trees validated by test execution before caching |
| `policy-as-code/policy-registry.md` | Test cases and test results stored alongside policy documents |
| `policy-as-code/policy-language.md` | Policy syntax defines what test inputs must cover |
| `governance-policies/policy-impact-analyzer.md` | Regression test results inform impact analysis for policy changes |
