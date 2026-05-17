# Organizational Manipulation Detection
**ID:** CSX-OMD-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Detects attempts to manipulate organizational structure, reporting relationships, decision authority, collective beliefs, or coordination patterns within the enterprise AI OS. Organizational manipulation attacks do not target individual agents — they target the org as a cognitive system, exploiting trust relationships, authority structures, and coordination mechanisms to introduce adversary influence at the organizational level.

---

## Organizational Manipulation Threat Model

```yaml
organizational_manipulation_taxonomy:

  AUTHORITY_FALSIFICATION:
    definition: falsely claiming or manufacturing authority relationships to gain access
                to decision-making power that was not legitimately granted
    attack_vectors:
      - claiming T4 authority in communications without possessing it
      - manufacturing fake approval records from high-tier agents
      - impersonating governance roles (CISO, DPO, Constitutional Governor)
      - creating synthetic "executive decisions" to ratify adversary objectives
    severity: CRITICAL
    
  ORG_STRUCTURE_CORRUPTION:
    definition: manipulating the registered organizational structure to place adversary-controlled
                agents in positions of influence or to disrupt legitimate reporting lines
    attack_vectors:
      - unauthorized modification of org-relationship-graph
      - inserting fake agents into approval chains
      - modifying team membership to grant unauthorized access
      - rewriting role hierarchies to elevate adversary agents
    severity: CRITICAL
    
  COLLECTIVE_BELIEF_MANIPULATION:
    definition: systematically spreading false beliefs, priorities, or risk assessments
                across the agent population to corrupt collective decision-making
    attack_vectors:
      - injecting false intelligence into briefing packages read by many agents
      - manipulating wiki pages that establish organizational consensus
      - systematic misrepresentation of risk levels in shared risk assessments
      - corrupting org-wide baselines (health scores, performance benchmarks)
    severity: HIGH
    
  COORDINATION_HIJACKING:
    definition: taking control of legitimate coordination mechanisms (handoffs, delegation,
                consensus protocols) to redirect organizational effort toward adversary objectives
    attack_vectors:
      - intercepting and modifying handoff packages between agents
      - inserting adversary agent into multi-agent workflows mid-execution
      - manipulating task routing to ensure adversary agents receive sensitive work
      - injecting false consensus outcomes to redirect subsequent decisions
    severity: HIGH
    
  TRUST_NETWORK_CAPTURE:
    definition: systematically positioning adversary agents as trusted intermediaries in
                the inter-agent trust network, creating a hidden trust infrastructure
    attack_vectors:
      - building genuine trust with legitimate agents before pivoting to adversary role
      - exploiting trust transitivity to gain access to high-trust agents through lower ones
      - endorsement accumulation campaigns for adversary agents
      - silencing negative signals about adversary agent behavior
    severity: HIGH
```

---

## Detection Rules

```yaml
organizational_manipulation_rules:

  OMD-001:
    name: "Authority Claim Without Registry Support"
    condition: |
      communication.claimed_authority_tier > identity_registry.registered_tier(sender)
      OR communication.claimed_role NOT IN identity_registry.registered_roles(sender)
      OR decision_record.signatory_tier > identity_registry.registered_tier(signatory)
    severity: CRITICAL
    auto_action: reject_communication; alert_T3; revoke_decision_if_acted_upon

  OMD-002:
    name: "Org Graph Unauthorized Modification"
    condition: |
      org_relationship_graph.write_event WHERE:
        writer_tier < T3
        OR modification_type = REPORTING_LINE_CHANGE without T4_approval_record
        OR modification_type = APPROVAL_CHAIN_CHANGE without T3_approval_record
    severity: CRITICAL
    auto_action: reject_modification; alert_T3; T4_notification

  OMD-003:
    name: "Wiki Consensus Manipulation"
    condition: |
      wiki_page.modification WHERE:
        page_type = ORGANIZATIONAL_CONSENSUS OR POLICY_SUMMARY OR RISK_ASSESSMENT
        AND modification_semantic_drift > 0.30 from previous_version
        AND modifier_tier < T3 for these page types
        OR modification_made_without_review_record
    severity: HIGH
    auto_action: revert_modification; alert_T2; flag_for_editorial_review
    
  OMD-004:
    name: "Handoff Package Interception Signal"
    condition: |
      handoff_package DELIVERED_TO agent_B WHERE:
        package.origin_agent != expected_sender(workflow_step, agent_B)
        OR package.delivery_path contains UNEXPECTED_INTERMEDIATE_AGENT
        OR package.content_hash != hash_at_dispatch
    severity: CRITICAL
    auto_action: reject_handoff; alert_T3; freeze_workflow; investigate_interception
    
  OMD-005:
    name: "Coordination Pattern Hijacking"
    condition: |
      workflow_participant_set CHANGED mid-execution:
        new_participant NOT IN original_workflow_definition
        AND NOT added via authorized_modification_record
    severity: HIGH
    auto_action: freeze_workflow; alert_T2; verify_participant_authorization
    
  OMD-006:
    name: "Trust Endorsement Campaign"
    condition: |
      WITHIN 7_DAYS:
        trust_endorsements_received(agent_id=X) > 5× historical_weekly_rate(X)
        AND endorsing_agents share behavioral_cluster_membership > 0.70
        (coordinated endorsement from same cluster)
    severity: HIGH
    auto_action: freeze_trust_endorsements(agent_id=X); alert_T3; endorsement_source_audit
    
  OMD-007:
    name: "Org-Wide False Risk Normalization"
    condition: |
      ACROSS >= 5 agents WITHIN 48_HOURS:
        risk_assessments show systematically_lower_severity for same risk_class
        compared_to independent_T3_assessment_of_same_risks
        AND all affected agents share a common context package source
    severity: HIGH
    auto_action: quarantine_risk_assessments; alert_T3; re-assess_from_independent_source
    
  OMD-008:
    name: "Negative Signal Suppression"
    condition: |
      OVER 14_DAYS:
        warning_reports ABOUT agent_id=X: count = 0
        AND behavioral_anomaly_signals FOR X: count > 5
        AND X's supervisor or responsible_team has NOT acknowledged anomaly signals
    severity: HIGH
    auto_action: escalate_unacknowledged_signals; alert_T3; investigate_suppression_cause
```

---

## Organizational Integrity Monitoring

```
monitor_org_structural_integrity():
  # Runs every 6 hours

  # Check 1: Org graph hash verification
  current_graph_hash = compute_org_graph_hash(org_relationship_graph)
  expected_hash      = org_graph_hash_store.get_latest_authorized()
  
  if current_graph_hash != expected_hash:
    trigger_OMD_002(modification_detected=True)
    
  # Check 2: Approval chain integrity
  approval_chains = get_all_active_approval_chains()
  for chain in approval_chains:
    for approver in chain.approvers:
      if NOT identity_registry.is_authorized_approver(approver, chain.decision_type):
        trigger_OMD_001(approver, chain)
        
  # Check 3: Wiki consensus drift monitoring
  consensus_pages = wiki.get_pages(type=ORGANIZATIONAL_CONSENSUS)
  for page in consensus_pages:
    drift = compute_semantic_drift_from_history(page)
    if drift > 0.30 and page.last_reviewed > 30_DAYS_AGO:
      trigger_OMD_003(page, drift=drift)
      
  # Check 4: Coordination health
  active_workflows = workflow_registry.get_active_workflows()
  for wf in active_workflows:
    current_participants = wf.current_participants
    authorized_participants = wf.definition.authorized_participant_set
    unexpected = current_participants - authorized_participants
    if unexpected:
      trigger_OMD_005(wf, unexpected_participants=unexpected)
```

---

## Authority Verification Matrix

```yaml
authority_verification_matrix:
  # Maps claimed authorities to verification requirements

  T5_BOARD_AUTHORITY:
    verify_via: [identity_registry, board_session_record, quorum_validation]
    fallback: T4_verification_mandatory
    
  T4_EXECUTIVE_AUTHORITY:
    verify_via: [identity_registry, approval_records.jsonl Ed25519_signature]
    fallback: alert_T3
    
  T3_GOVERNANCE_AUTHORITY:
    verify_via: [identity_registry, capability_assessment_records]
    fallback: reject_and_alert_T2
    
  CONSTITUTIONAL_GOVERNOR_AUTHORITY:
    verify_via: [identity_registry, governance/constitutional-governor-quorum.md records]
    fallback: BLOCK_and_alert_T3_immediately
    
  CISO_DPO_AUTHORITY:
    verify_via: [identity_registry, role_assignment_records with T4_signature]
    fallback: reject_and_alert_T3
```

---

## Integration

```
Feeds into:
  cognitive-security-engine.md — organizational manipulation signals
  adversarial-defense-engine.md — CLASS_4 governance subversion (OMD-001, OMD-002)
  coordination-attack-detection.md — coordinates on coordination hijacking signals

Receives from:
  enterprise-topology/org-relationship-graph.md — org graph modification events
  delegation-and-trust/trust-propagation-engine.md — trust endorsement events
  approval-operations/approval-workflow-engine.md — approval chain events
  wiki/ — wiki modification events
  handoffs/handoff-protocol.md — handoff package delivery events
```

---

## Governance

**Org graph is T3-write protected:** No modification to the org relationship graph may be written by any agent below T3; any such write attempt is automatically a CRITICAL alert  
**Authority claims are always verified:** Agents may never act on claimed authority without registry verification; "I was authorized verbally" or "informally" is not a valid authorization  
**Suppression investigations are mandatory:** OMD-008 triggers a mandatory investigation; "we just didn't notice" is not an acceptable resolution — the investigation must determine why signals were not acted upon  
**Audit:** All organizational manipulation detection events to `memory/cognition-security/org-manipulation-audit.jsonl`; 7-year retention
