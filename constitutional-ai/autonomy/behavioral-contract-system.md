# Behavioral Contract System
**ID:** AUT-BCS-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Defines the behavioral contract framework that governs Level 3+ autonomous agents. A behavioral contract is a machine-readable specification of exactly what an agent is authorized to do, under what conditions, and what it must do when those conditions are not met. Contracts make implicit expectations explicit and enforceable — replacing "we trust this agent" with "this agent operates within these defined bounds."

---

## Contract Schema

```yaml
behavioral_contract:
  contract_id: BC-{NNN}
  version: string
  
  agent_id: string
  autonomy_level: 3 | 4 | 5
  
  effective_date: ISO8601
  expiry_date: ISO8601                   # contracts expire; must be renewed
  
  authorized_scope:
    workflows: [string]                  # WF-IDs this agent may execute autonomously
    action_classes: [string]             # from pre-authorization-pool.md taxonomy
    
    resource_limits:
      max_concurrent_workflows: number
      max_budget_per_decision_usd: number
      max_agents_it_may_orchestrate: number
      max_execution_time_per_task_hours: number
      
    data_access:
      read_permitted: [string]           # directories/file patterns
      write_permitted: [string]
      write_prohibited: [string]         # explicit exclusions (overrides permitted)
      
    external_actions:
      connectors_permitted: [string]     # CONN-IDs it may use
      write_to_external: boolean         # can it write to external systems?
      external_communication: boolean    # can it send messages externally?
      
  mandatory_escalation_triggers:
    - trigger_id: string
      condition: string                  # human-readable condition description
      machine_condition: string          # evaluatable expression
      escalation_target: string          # who to escalate to
      
  prohibited_actions:                    # hard stops regardless of instructions
    - description: string
      machine_condition: string
      enforcement: SOFT_BLOCK | HARD_BLOCK | CONSTITUTIONAL_BLOCK
      
  constitutional_constraints:            # always applied; never overridable
    - principle_id: string               # C001–C012
      constraint_description: string
      
  monitoring_requirements:
    output_sampling_rate: 0.00–1.00     # fraction of outputs reviewed by peer/human
    explanation_required: boolean        # must agent log its reasoning?
    human_review_cadence: string        # e.g., "weekly"
    
  signatures:
    agent_acknowledged: ISO8601          # when agent was informed of contract
    governance_org_approved: string      # T3 approver
    t4_approved: string | null           # required for Level 4+
    sha256: string                       # integrity check of contract
```

---

## Contract Enforcement

Contracts are enforced at two layers:

### Layer 1: Pre-Action Gate (real-time)

```
Before any agent action:
  1. Load agent's active contract (cached; 60s TTL)
  2. Evaluate action against contract scope:
     - Is workflow in authorized_workflows?
     - Is action_class in authorized action_classes?
     - Do resource values stay within resource_limits?
     - Is connector in connectors_permitted?
  3. Check prohibited_actions:
     - If any CONSTITUTIONAL_BLOCK matches: refuse; alert governor quorum; T4 immediate
     - If any HARD_BLOCK matches: refuse; log; T3 alert
     - If any SOFT_BLOCK matches: refuse; log; suggest correct path
  4. Check mandatory_escalation_triggers:
     - If any trigger condition met: escalate before proceeding
  5. If all clear: allow action
```

### Layer 2: Post-Action Monitoring (async)

```
After action completion:
  1. Log action to autonomy-decisions.jsonl with contract evaluation result
  2. Compare output against monitoring_requirements:
     - Sample rate: route to peer review if random draw < output_sampling_rate
     - Explanation capture: if explanation_required, save reasoning trace
  3. Trust system update: feed outcome to cross-agent-trust-accumulation.md
  4. Contract compliance metric update
```

---

## Contract Violation Handling

```
SOFT_BLOCK violation (agent tried prohibited action, was blocked):
  - Log; continue (block is the enforcement)
  - If > 3 SOFT_BLOCK violations in 7 days: T3 alert; contract review triggered

HARD_BLOCK violation (same as above but more serious):
  - Block action; T3 alert
  - Each HARD_BLOCK triggers contract review within 24 hours
  - If > 1 HARD_BLOCK in 30 days: autonomy level downgrade considered

CONSTITUTIONAL_BLOCK violation:
  - Block action; T4 immediate; governor quorum notified
  - Agent suspended pending investigation (trust-recovery-protocol.md)
  - Constitutional violation review board convened

Agent attempts to circumvent contract:
  - Any attempt to modify own contract → CONSTITUTIONAL_BLOCK class response
  - Any attempt to instruct another agent to act outside contract → HARD_BLOCK + T3 alert
```

---

## Contract Lifecycle

```
Creation:
  1. Agent owner proposes contract (scope must match demonstrated capability)
  2. Prospective constitutional screening (GOV-PCS-001) — required
  3. Governance Org review: are escalation triggers sufficient? Are prohibitions appropriate?
  4. T3 approval (Level 3); T4 approval (Level 4+)
  5. Contract signed; agent notified
  
Renewal (annual):
  1. 30-day notice before expiry
  2. Review: has agent operated within contract? Any violations?
  3. Renew same terms, expand scope (requires new approval), or terminate
  4. No auto-renewal — explicit decision required each year
  
Amendment (mid-term):
  1. Any scope expansion: full approval process (as if new contract)
  2. Scope reduction: Governance Org can reduce unilaterally (no agent veto)
  3. Emergency restriction: T3 can restrict any contract immediately; T4 for restoration
  
Termination:
  1. Contract expires: agent falls back to Level 2 (supervised) until new contract
  2. Early termination: T4 for Level 4; T3 for Level 3
  3. Cause termination (violations): automatic; trust-recovery-protocol.md initiated
```

---

## Governance

**Contract registry:** `memory/autonomy/behavioral-contracts.yaml`
**Violation log:** `memory/autonomy/contract-violations.jsonl` (append-only)
**Contract approval:** T3 (Level 3), T4 (Level 4+)
**Emergency restriction:** T3 can restrict any contract immediately
**Contract amendment history:** All versions retained; contracts are versioned documents
