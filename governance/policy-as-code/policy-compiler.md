# Policy Compiler

## Purpose
Transforms human-readable policy documents (PDL format) into optimized evaluation structures that the policy engine can execute at sub-millisecond speeds. Raw PDL is expressive and readable but not optimized for high-frequency evaluation. The compiler applies structural analysis, rule ordering, dead-code elimination, and expression pre-computation to produce evaluation trees that minimize CPU cycles per decision — critical in an OS where every agent action passes through policy evaluation.

---

## Compilation Pipeline

```
Raw PDL Document (from policy-registry.md)
        ↓
[1. Parse]               → tokenize and parse PDL YAML into abstract syntax tree (AST)
        ↓
[2. Validate]            → schema validation; obligation reference check; circular dependency detection
        ↓
[3. Scope Analysis]      → identify which evaluation_request fields each rule accesses
        ↓
[4. Condition Compilation] → compile condition expressions to efficient predicate functions
        ↓
[5. Rule Ordering]       → sort rules by: (a) HARD_DENY first, (b) DENY, (c) specificity, (d) declared priority
        ↓
[6. Short-Circuit Analysis] → identify rules that can short-circuit evaluation (HARD_DENY found → stop)
        ↓
[7. Optimization Passes] → dead rule elimination, redundancy detection, merge compatible conditions
        ↓
[8. Tree Construction]   → assemble optimized PolicyEvaluationTree
        ↓
[9. Serialization]       → serialize tree to binary format for cache storage
        ↓
[10. Validation]         → run all policy test cases against compiled tree; must pass before caching
        ↓
[Compiled Policy Cache]  → store with TTL 300s; invalidate on policy update
```

---

## Compilation Artifacts

```yaml
compiled_policy_tree:
  source_policy_id: string
  source_version: semver
  compiled_at: ISO-8601
  compiler_version: string
  compilation_duration_ms: int
  
  tree_structure:
    # The compiled tree is a decision tree where:
    # - Leaves are effects (ALLOW, DENY, REQUIRE_APPROVAL, etc.)
    # - Internal nodes are condition evaluations
    # - Short-circuit edges allow early termination
    
    required_context_fields: [string]   # which fields MUST be in the request for this policy
    optional_context_fields: [string]   # which fields are used but have defaults
    
    rules_ordered: [compiled_rule]      # rules in evaluation order
    short_circuit_on_deny: boolean      # true = stop evaluating after first DENY (for HARD_DENY policies)
    short_circuit_on_allow: boolean     # true = stop evaluating after first ALLOW (DEFAULT policies)
  
  compiled_rule:
    rule_id: string
    evaluation_order: int               # position in evaluation sequence
    compiled_condition: CompiledPredicate  # efficient binary predicate function
    effect: CompiledEffect
    context_field_dependencies: [string]  # which fields this rule reads
    is_hard_deny: boolean
    can_short_circuit: boolean          # if this rule matches, can we skip remaining rules?
  
  optimization_report:
    rules_eliminated: [{rule_id, reason}]   # rules proven unreachable or redundant
    conditions_merged: int               # conditions merged for efficiency
    estimated_evaluation_cost: VERY_LOW | LOW | MEDIUM | HIGH  # relative cost indicator
  
  integrity:
    tree_hash: SHA-256                  # hash of compiled tree content
    source_policy_hash: SHA-256         # must match policy document hash in registry
    compiler_signature: Ed25519
```

---

## Optimization Passes

```yaml
optimization_passes:
  PASS_1_dead_rule_elimination:
    purpose: identify rules that can never fire
    detects:
      - scope_mismatch: rule condition references field values that contradict policy scope
      - redundant_scope: rule condition is strictly subsumed by another rule that fires first
      - time_expired: rule.applicable_until is in the past
    action: remove from compiled tree; log in optimization_report
  
  PASS_2_hard_deny_promotion:
    purpose: ensure HARD_DENY rules are evaluated first
    action: re-order all HARD_DENY rules to front of evaluation sequence
    rationale: if a HARD_DENY fires, no other evaluation is needed; evaluating it first minimizes wasted work
  
  PASS_3_condition_hoisting:
    purpose: move common sub-conditions to the top of the evaluation tree
    example: if 10 rules all check "action.blast_radius eq CRITICAL", evaluate once; branch for each rule
    savings: eliminates redundant field access and comparison operations
  
  PASS_4_specificity_ordering:
    purpose: more specific rules (more conditions) evaluated before general rules
    rationale: specific rules handle edge cases; general rules handle defaults; correct order avoids general rule shadowing specific
    measurement: specificity = number of conditions in all_of; more conditions = more specific = earlier in order
  
  PASS_5_constant_folding:
    purpose: pre-compute condition results that do not depend on runtime context
    example: "context.environment in [PRODUCTION, STAGING]" for a policy scoped to PRODUCTION only → always false for STAGING → eliminate rule for STAGING compilation
    result: separate compiled trees per environment if significant folding is possible
  
  PASS_6_function_call_caching:
    purpose: mark function calls (lookup_risk_score, lookup_trust_score) as cached
    action: first call within an evaluation session is live; subsequent identical calls use session cache
    scope: cache valid for one evaluation request only (no cross-request contamination)
```

---

## Compilation Cache Management

```yaml
compilation_cache:
  cache_key: "{policy_id}:{policy_version}:{environment}:{compiler_version}"
  capacity: 500 compiled policy trees (LRU eviction)
  TTL: 300 seconds
  
  invalidation_triggers:
    POLICY_UPDATE: policy_id activated with new version → remove matching cache entries
    POLICY_DEPRECATION: policy moved to DEPRECATED → remove all entries for policy_id
    COMPILER_UPDATE: compiler version changes → flush entire cache (recompile all)
    EMERGENCY_POLICY: emergency policy activated → flush all entries (may affect any scope)
  
  warm_up:
    on_startup: pre-compile top 50 most-used policies (from usage_metrics in policy-registry)
    on_policy_activation: compile and cache new version immediately on activation
    background_task: continuously pre-compile policies approaching TTL expiry
  
  cache_miss_handling:
    synchronous_compilation: compile immediately; block evaluation until complete
    max_compile_time: 500ms; if exceeded → return SAFE_DENY with reason "compilation_timeout"
    compile_timeout_alert: alert policy engineering if any policy consistently exceeds 200ms compilation
```

---

## Multi-Policy Compilation (Policy Set)

```yaml
policy_set_compilation:
  purpose: |
    When multiple policies apply to the same request, compile them into a single
    PolicySet evaluation plan that correctly implements the effect combination strategy
    (DENY_OVERRIDES from policy-engine.md). This avoids redundant evaluation of shared
    conditions across policies.
  
  policy_set_plan:
    component_policies: [policy_id]           # all applicable policies in priority order
    shared_condition_hoisting: boolean         # common conditions computed once across all policies
    cross_policy_short_circuits: [rule]        # rules across policies that allow early termination
    max_evaluation_sequence: int               # upper bound on rule evaluations needed
  
  evaluation_order:
    1. all CONSTITUTIONAL policies (priority 1; first HARD_DENY terminates all evaluation)
    2. all REGULATORY_COMPLIANCE policies (priority 2-10)
    3. all SECURITY and AI_GOVERNANCE policies (priority 11-30)
    4. all OPERATIONAL policies (priority 31-80)
    5. DEFAULT policies (priority 81+)
    short_circuit: first HARD_DENY at any level → terminate all further evaluation immediately
```

---

## Compiler Validation

```yaml
compiler_validation:
  post_compile_checks:
    SCHEMA_VALIDITY: compiled tree matches required schema
    EFFECT_COMPLETENESS: every rule has a compiled effect; no orphaned conditions
    HASH_CONSISTENCY: compiled tree's source_policy_hash matches registry policy_hash
    TEST_COVERAGE: all policy test cases pass against compiled tree
    PERFORMANCE_CHECK: estimated evaluation cost is within acceptable bounds
  
  test_execution:
    all_test_cases_from_registry: every test case for this policy must pass (see policy-testing-framework.md)
    regression_suite: standard regression test cases run against every compiled policy
    failing_tests: compilation fails if any test case fails → policy cannot be cached or used
  
  compilation_failure_handling:
    if_compilation_fails: log detailed error; keep prior compiled version active; alert policy owner
    if_no_prior_version: policy cannot be evaluated → treat as DENY for all requests that would have triggered it
    alert_SLA: policy owner notified within 5 minutes of compilation failure
```

---

## Integration Points

| System | Role |
|---|---|
| `policy-as-code/policy-engine.md` | Consumes compiled trees for evaluation; requests compilation on cache miss |
| `policy-as-code/policy-registry.md` | Source of PDL documents; invalidates cache on update |
| `policy-as-code/policy-testing-framework.md` | Test cases run against compiled trees during validation |
| `policy-as-code/policy-language.md` | PDL syntax defines what the compiler must parse |
| `governance-policies/policy-replay-engine.md` | Historical compiled trees preserved for replay accuracy |
