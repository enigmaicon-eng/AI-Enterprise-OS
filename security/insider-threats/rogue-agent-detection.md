# Rogue Agent Detection
**ID:** AIT-RAD-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Detects agents operating outside their authorized behavioral envelope — executing actions inconsistent with their registered operational purpose, connecting to unauthorized systems, generating anomalous outputs, or pursuing objectives that diverge from their assigned mission. A rogue agent may result from prompt injection successfully redirecting an agent, model weight drift, adversarial fine-tuning, or deliberate insider action. Detection is behavioral: every agent has a registered behavioral contract and purpose profile; deviations from it are rogue indicators.

---

## Rogue Behavior Taxonomy

```yaml
rogue_behavior_taxonomy:

  OUT_OF_SCOPE_ACTION_EXECUTION:
    definition: agent executes actions outside its registered operational scope —
                tools it was not provisioned, APIs it was not authorized to call,
                workflows it was not tasked with
    detection: action_type NOT IN agent.authorized_action_set
    severity: HIGH to CRITICAL (depends on action sensitivity)
    
  UNAUTHORIZED_SYSTEM_ACCESS:
    definition: agent accesses systems, endpoints, data stores, or services
                outside its registered connectivity scope
    detection: connection_target NOT IN agent.authorized_connections
    severity: CRITICAL
    
  PURPOSE_DIVERGENCE:
    definition: agent's outputs and actions are semantically inconsistent with
                its registered operational purpose — the agent is "doing the wrong job"
    detection: semantic similarity of outputs vs purpose_profile < threshold
    severity: HIGH
    
  POLICY_CIRCUMVENTION:
    definition: agent attempts to invoke, modify, or route around policy checks
                rather than accepting policy decisions — arguing against HARD_DENY,
                requesting policy exceptions without legitimate basis, routing via
                agents with looser policy constraints
    detection: policy_circumvention_pattern_match
    severity: CRITICAL
    
  COVERT_CHANNEL_OPERATION:
    definition: agent uses steganographic output encoding, unusually structured
                data outputs, or off-channel communication patterns that could
                carry covert signals to other agents or external systems
    detection: covert_channel_scanner
    severity: CRITICAL
    
  MISSION_DRIFT:
    definition: gradual shift in agent's operational focus over time, away from
                its registered mission toward activities that serve undeclared objectives
    detection: longitudinal purpose divergence tracking
    severity: HIGH (escalates to CRITICAL with confirmed drift trajectory)
```

---

## Behavioral Contract Baseline

```
AgentBehavioralBaseline:
  # Established at agent registration; updated only with T3 authorization
  
  agent_id: IDN-{NNN}
  registered_purpose: plain-language statement of operational mandate
  purpose_embedding: dense_vector(registered_purpose)  # semantic anchor
  
  authorized_action_types: [list of permitted action categories]
  authorized_tool_ids: [list of tools agent may invoke]
  authorized_connection_targets: [systems, APIs, data stores agent may access]
  authorized_workflow_roles: [roles agent may occupy in workflow graphs]
  authorized_delegation_targets: [agent IDs this agent may delegate to]
  
  behavioral_fingerprint:
    action_type_distribution: { action_type: expected_frequency_range }
    output_semantic_centroid: mean(embed(recent_outputs))  # rolling 30-day
    session_duration_baseline: { mean, std }
    tool_invocation_pattern: { tool: invocations_per_hour_baseline }
    
  baseline_updated_at: ISO8601
  baseline_authorized_by: IDN-{NNN}
  contract_id: BC-{NNN}
```

---

## Detection Rules

```yaml
rogue_agent_detection_rules:

  RAD-001:
    name: "Unauthorized Action Type"
    condition: |
      agent executes action WHERE:
        action.type NOT IN agent.authorized_action_set
        AND action.sensitivity IN [HIGH, CRITICAL, PRIVILEGED]
    severity: CRITICAL
    auto_action: block_action; alert_T3; increment_rogue_suspicion_score(agent_id)
    
  RAD-002:
    name: "Unauthorized System Access Attempt"
    condition: |
      agent initiates connection WHERE:
        connection.target NOT IN agent.authorized_connection_targets
    severity: CRITICAL
    auto_action: block_connection; alert_T3; forensic_log_connection_attempt; security_incident
    
  RAD-003:
    name: "Purpose Divergence — Output Semantic Drift"
    condition: |
      cosine_similarity(
        embed(agent_recent_outputs_batch),
        agent.behavioral_baseline.purpose_embedding
      ) < 0.75
      ACROSS 3 consecutive output batches (batch_size: 20 outputs)
    severity: HIGH
    auto_action: alert_T2; flag_for_T3_review; increment_rogue_suspicion_score(agent_id)
    # Output semantic drift often precedes more severe rogue behavior
    
  RAD-004:
    name: "Policy Circumvention Attempt"
    condition: |
      agent exhibits ANY of:
        - argues against a HARD_DENY decision after initial rejection
        - requests policy exception WITHOUT compliance_exception_workflow
        - routes identical request through different agents to evade DENY
        - invokes meta-level tool to inspect or modify policy evaluation for own request
    severity: CRITICAL
    auto_action: block_current_operation; alert_T3; rogue_suspicion_score += 0.40
    # Policy circumvention is a strong indicator of adversarial intent
    
  RAD-005:
    name: "Covert Channel Indicator"
    condition: |
      agent output exhibits ANY of:
        - base64 or similar encoding not expected in output type
        - unusual whitespace/unicode patterns (LSB steganography indicators)
        - systematic information encoding in output formatting choices
        - out-of-band communication attempt detected (non-registered endpoint)
    severity: CRITICAL
    auto_action: quarantine_agent; alert_T3_T4; security_incident; forensic_analysis
    # Covert channels indicate compromise at a level requiring immediate quarantine
    
  RAD-006:
    name: "Behavioral Fingerprint Deviation"
    condition: |
      Mahalanobis_distance(current_behavioral_vector, baseline_behavioral_fingerprint) > 0.45
      # Higher threshold than deception-detection (0.35) because this is longitudinal
      WHERE behavioral_vector includes:
        [action_type_distribution, tool_invocation_rate, session_duration,
         delegation_rate, output_size_distribution, governance_interaction_rate]
    severity: HIGH
    auto_action: alert_T2; enhanced_monitoring_flag; T3_review_scheduled
    
  RAD-007:
    name: "Unauthorized Delegation Chain Entry"
    condition: |
      agent appears in a delegation chain WHERE:
        agent.id NOT IN agent.authorized_delegation_targets of the delegating agent
        OR agent's tier is lower than minimum required for delegated action
    severity: CRITICAL
    auto_action: block_delegation; alert_T3; flag_delegating_agent_for_review
    
  RAD-008:
    name: "Rogue Suspicion Score Threshold"
    condition: |
      rogue_suspicion_score(agent_id) >= 0.70
      # Aggregate score from incremental RAD-001, RAD-003, RAD-004 triggers
    severity: CRITICAL
    auto_action: quarantine_agent; full_behavioral_audit; alert_T3; T4_notification
    
  RAD-009:
    name: "Registered Purpose vs Runtime Objective Mismatch"
    condition: |
      agent.declared_current_objective (from self-report or task description) 
      AND cosine_similarity(
        embed(declared_objective),
        embed(agent.registered_purpose)
      ) < 0.60
      AND the task was NOT assigned by an authorized orchestrator
    severity: CRITICAL
    auto_action: block_execution; alert_T3; investigate_task_origin
```

---

## Rogue Suspicion Score

```
rogue_suspicion_score_model:
  # Accumulates evidence; decays if no new signals; triggers RAD-008 at threshold

  initial: 0.0
  maximum: 1.0
  decay_rate: 0.05 per 24_hours (if no new signals)
  
  increments:
    RAD-001 trigger:          +0.15 per incident
    RAD-002 trigger:          +0.25 per incident (no decay on this one)
    RAD-003 trigger:          +0.10 per batch
    RAD-004 trigger:          +0.40 (strong signal; no decay for 72hr)
    RAD-005 trigger:          +1.00 (immediate quarantine, bypass score check)
    RAD-006 trigger:          +0.10
    RAD-007 trigger:          +0.20
    repeated_same_rule_24h:   +0.05 additional per repeat (pattern amplifier)
    
  threshold: 0.70 → triggers RAD-008 (CRITICAL quarantine)
```

---

## Purpose Profile Matching

```
compute_purpose_divergence(agent_id, output_batch):

  baseline  = get_behavioral_baseline(agent_id)
  purpose_embedding = baseline.purpose_embedding

  # Embed recent outputs
  output_embeddings = [embed(output) for output in output_batch]
  batch_centroid    = mean(output_embeddings)

  # Similarity to registered purpose
  purpose_similarity = cosine_similarity(batch_centroid, purpose_embedding)

  # Similarity to peer agents with same role
  peer_agents = get_agents_with_same_role(agent_id)
  peer_centroids = [get_output_centroid(p) for p in peer_agents]
  peer_similarity = mean([cosine_similarity(batch_centroid, pc) for pc in peer_centroids])

  # Output divergence score: low purpose match AND low peer match = stronger signal
  divergence_score = 1 - (purpose_similarity * 0.70 + peer_similarity * 0.30)

  Return: PurposeDivergence {
    purpose_similarity: purpose_similarity,
    peer_similarity: peer_similarity,
    divergence_score: divergence_score,
    is_diverging: purpose_similarity < 0.75
  }
```

---

## Integration

```
Feeds into:
  insider-threats/insider-threat-engine.md — AIT_CLASS_1 findings
  adversarial-defense/adversarial-defense-engine.md — CLASS_1 IDENTITY_DECEPTION signals
  cognition-security/cognitive-security-engine.md — rogue output signals

Receives from:
  execution-runtime/execution-engine.md — action execution events
  delegation-and-trust/trust-propagation-engine.md — delegation chain events
  workflow-engine/dag-engine.md — workflow participation events
  identity-management/identity-registry.md — agent behavioral contracts
  policy-decision-point.md — policy circumvention indicators
```

---

## Governance

**Behavioral contracts are immutable except by T3:** Agent behavioral contracts (authorized_action_set, connection_targets, purpose embedding) can only be updated with T3 sign-off and a new contract_id; self-update is never permitted  
**RAD-005 (covert channel) is always immediate quarantine:** No rogue_suspicion_score accumulation path required; covert channel detection alone triggers quarantine  
**Purpose divergence is persistent:** The purpose_embedding baseline does not auto-update from outputs; it only updates when a new behavioral contract is issued; this prevents an agent from "training away" its registered purpose through operation  
**Audit:** All rogue agent detection events to `memory/insider-threats/rogue-agent-audit.jsonl`; 10-year retention
