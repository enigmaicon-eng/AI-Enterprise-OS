# Orchestration Optimization
**ID:** AC-HA-002 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Identifies and refines orchestration patterns that improve multi-agent workflow execution. Where routing-refinement.md addresses individual routing decisions, orchestration-optimization operates at the workflow structure level — how tasks are sequenced, parallelized, handed off, and coordinated.

---

## Orchestration Pattern Categories

```yaml
optimizable_patterns:

  SEQUENCING:
    description: Order of agent invocations within a workflow
    optimization_target: minimize total execution time while preserving quality gates
    signal: execution duration logs + gate timing from execution-ledger.jsonl
    example_improvement: "ADR generation produces better outputs when preceded by
                          explicit research phase; adding research step reduces rework 23%"

  PARALLELIZATION:
    description: Which workflow steps can safely run in parallel
    optimization_target: reduce calendar time without creating dependency conflicts
    signal: dependency graph + concurrent execution outcomes
    example_improvement: "UX review and QA test planning can run in parallel for
                          feature development workflows with < 2% quality impact"

  DELEGATION_DEPTH:
    description: How many levels of delegation are appropriate before escalation
    optimization_target: maximum resolution before escalating; minimum unnecessary escalation
    signal: escalation outcomes, retry patterns, resolution_at_tier data
    maps_to_heuristic: orchestration_retry_depth

  HANDOFF_CADENCE:
    description: Timing of agent-to-agent transitions
    optimization_target: handoffs happen when outputs are complete; not too early or late
    signal: handoff_quality_scores, downstream rework rates, context completeness rates
    example_improvement: "Reducing handoff frequency by batching PM + BA outputs
                          before architecture handoff improved arch agent quality scores 18%"

  GATE_PLACEMENT:
    description: Where in a workflow governance gates are positioned
    optimization_target: gates at points of maximum information; minimum reachable harm
    signal: gate_verdict timing, rework after gate-fail, gate latency
    note: gate REMOVAL or RELAXATION requires constitutional review; this covers placement only
```

---

## Orchestration Pattern Learning Protocol

```
1. PATTERN EXTRACTION (weekly, from execution hindsight reviews)
   Run: workflow execution telemetry through pattern extractor
   Identify: workflows of same type; cluster by orchestration structure
   Compare: outcome quality across structural variants of same workflow type

2. VARIANT ANALYSIS
   For each identified structural variant of a workflow type:
     Compute: avg_outcome_quality, avg_execution_duration, escalation_rate
   Identify: variants with significantly better outcomes (> 15% quality improvement)

3. CAUSAL VALIDATION
   For each high-performing variant:
     Is the improvement caused by the structural difference?
     Or confounded by: better agents, simpler tasks, lower system load?
   Control for confounders; only flag causally attributed improvements

4. PATTERN PROPOSAL
   Propose: workflow structure update (not an automatic change — proposal only)
   Route: to Architecture Org for review
   Architecture Org: validates causality; approves or rejects
   If approved: workflow documentation updated; pattern activated

5. MONITORING
   Post-activation: measure 10 subsequent executions of that workflow type
   Confirm: quality improvement holds at scale
   If confirmed: mark pattern as VALIDATED; update orchestration patterns docs
```

---

## Orchestration Anti-Patterns (Detected and Flagged)

```yaml
anti_patterns:

  ORCHESTRATION_THRASHING:
    description: Workflow oscillates between agents without progress
    detection: same agent invoked > 3 times in same step without forward progress
    response: escalate to supervisor; flag workflow design for review

  OVER_DELEGATION:
    description: Task delegated through > 3 levels before being executed
    detection: delegation_depth > 3 in delegation-log.jsonl
    response: flag for orchestration design review; consider direct routing

  PREMATURE_HANDOFF:
    description: Agent hands off before output is complete
    detection: handoff_quality_score < 0.60 from sending agent
    response: add output completeness check to that agent's handoff protocol

  GHOST_DEPENDENCY:
    description: Workflow blocked waiting for a dependency that never materializes
    detection: wait_time > 2× expected; dependency still not resolved
    response: dependency timeout escalation; root cause investigation

  SILENT_FAILURE:
    description: Agent completes with SUCCESS status but output is unusable
    detection: downstream agent flags context_quality < 0.50 on received handoff
    response: add output validation gate to sending agent's execution
```

---

## Integration with Execution Runtime

```
Orchestration optimizations are applied through:
  1. Workflow documentation updates (Architecture Org approves)
  2. Runtime routing table updates (heuristic_record in heuristic-registry.jsonl)
  3. Agent capability profile updates (identity-profiles.jsonl)

NOT through:
  - Direct runtime code modification (that requires engineering workflow)
  - Governance gate relaxation (constitutional; not within AC scope)
  - Autonomy level changes (governance; not within AC scope)
```

---

## Governance

- Orchestration structural changes require Architecture Org approval before activation
- Gate placement changes require Governance Org review (gates are constitutional infrastructure)
- Anti-pattern flags are advisory; they require human validation before workflow changes
