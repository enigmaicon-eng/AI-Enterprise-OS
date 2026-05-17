# Agent Continuity
**ID:** AC-IE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Preserves agent state across sessions, context window resets, and system restarts. An agent's accumulated knowledge, performance history, and behavioral calibrations persist between invocations — ensuring institutional continuity rather than cold-start behavior on every execution.

---

## Continuity Architecture

```
AGENT IDENTITY PROFILE (persistent across sessions)
  ├── execution_history_summary      (compressed; not full history)
  │     ├── total_executions_count
  │     ├── success_rate_30d / 90d / all_time
  │     ├── domain_execution_counts  (how many times in each domain)
  │     └── last_5_notable_executions (ids + brief outcomes)
  │
  ├── domain_strengths               (computed from execution history)
  │     ├── {domain}: confidence_score  (0.0–1.0)
  │     └── Updated after every execution in that domain
  │
  ├── calibration_state              (how agent's outputs are calibrated)
  │     ├── confidence_calibration_offset  (bias correction; bounded)
  │     ├── scope_estimation_accuracy      (does agent scope work correctly?)
  │     └── quality_consistency_score      (output quality variance)
  │
  ├── institutional_context          (what this agent knows about this org)
  │     ├── active_constraints       (governance constraints relevant to this agent)
  │     ├── current_priorities       (org priorities this agent should weight)
  │     └── key_decisions_aware_of   (major decisions this agent has been part of)
  │
  └── behavioral_flags               (anomalies or special states)
        ├── under_review: bool
        ├── performance_watch: bool
        └── trust_probation: bool
```

---

## Session Initialization Protocol

When an agent is invoked, the orchestration system provides its identity profile as part of the context package.

```
AGENT INVOCATION CONTEXT PACKAGE:
  1. Task specification (from handoff envelope)
  2. Agent identity profile (from identity-profiles.jsonl — latest version)
  3. Relevant institutional context (from collective memory, filtered by domain)
  4. Active heuristics applicable to this agent's role
  5. Current governance constraints for this agent's authority tier

The agent reads its identity profile to:
  - Understand its calibrated domain strengths
  - Apply its execution preferences
  - Recall relevant institutional context
  - Apply its behavioral calibrations

An agent MUST NOT modify its own identity profile during execution.
Profile updates are applied by the adaptive cognition layer after execution completes.
```

---

## Profile Update Protocol

```
AFTER EXECUTION COMPLETES:

1. Retrieve execution outcomes (from reflection_event)
2. Update domain_strengths:
   - For each domain exercised in execution:
     new_strength = (prior_strength × decay_weight) + (execution_score × (1 - decay_weight))
     decay_weight = execution_confidence_decay_rate (heuristic; default 0.02)
     Constraint: domain_strength bounded [0.10, 0.95]

3. Update calibration_state:
   - confidence_calibration_offset: adjusted if confidence vs. outcome divergence detected
   - scope_estimation_accuracy: adjusted based on actual vs. estimated scope
   - Constraint: calibration_offset bounded [-0.15, +0.15]

4. Update execution_history_summary:
   - Increment execution counts
   - Update rolling success rates
   - If execution is notable (very high or very low deviation_score): add to last_5_notable

5. Update institutional_context:
   - Add any new governance constraints encountered
   - Update key decisions this agent participated in

6. Write updated profile to identity-profiles.jsonl (versioned)
   - Version incremented monotonically
   - Previous version preserved for rollback
```

---

## Profile Health Checks

```yaml
profile_health_indicators:
  HEALTHY:
    - success_rate_30d > 0.70
    - No behavioral_flags active
    - Domain strengths showing positive or stable trend
    - Calibration offset within [-0.10, +0.10]

  WATCH:
    - success_rate_30d between 0.50–0.70
    - Single behavioral flag active
    - Domain strength declining > 0.10 in 30 days
    - Calibration offset exceeding ±0.10

  REVIEW:
    - success_rate_30d < 0.50
    - Multiple behavioral flags active
    - Consistent failure class pattern (same FC across multiple executions)
    - Calibration offset at bounds (±0.15)
    → T3 Agent Performance Review triggered

  SUSPENSION:
    - Governance breach attributed to this agent
    - trust_probation flag active
    → Agent suspended from autonomous execution until T3 review completes
```

---

## Governance

- Identity profiles may not be directly modified by the agent they describe
- Profile rollback available within 90 days (per governance.md INV-AC-03)
- Performance_watch and trust_probation flags require T3 authorization to set or clear
- Profile data is retained for the lifetime of the agent (not subject to 90-day rollback)
