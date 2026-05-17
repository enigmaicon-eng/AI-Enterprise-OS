# Relationship Graph Integrity
**ID:** MIG-RGI-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Validates and defends the integrity of all enterprise relationship graphs — the knowledge graph, organizational relationship graph, trust graph, dependency graph, and workflow topology — against tampering, unauthorized edge injection, node manipulation, and structural corruption. Relationship graphs encode the enterprise's understanding of how entities connect; an attacker who controls graph structure controls how agents reason about relationships, authority, trust, and dependencies.

---

## Graph Integrity Threat Model

```yaml
graph_integrity_threats:

  UNAUTHORIZED_EDGE_INJECTION:
    definition: adding relationships between nodes that do not exist or were not authorized,
                to create false connections that agents use in reasoning or routing
    examples:
      - injecting a false "DELEGATES_TO" edge from a T4 agent to a compromised T1 agent
      - adding a false trust relationship edge that causes a compromised agent to appear trusted
      - creating false knowledge relationships that cause incorrect inference conclusions
    severity: CRITICAL
    
  NODE_ATTRIBUTE_FALSIFICATION:
    definition: modifying the properties of existing nodes to change how they are classified,
                trusted, or processed by graph-aware reasoning
    examples:
      - modifying an agent node's tier attribute from T1 to T3
      - changing an entity node's classification from RESTRICTED to PUBLIC
      - modifying a workflow node's constitutional_proximity attribute to false
    severity: CRITICAL
    
  EDGE_DELETION:
    definition: removing legitimate relationships to hide existing connections, break
                trust chains, or isolate agents that would otherwise constrain adversary behavior
    examples:
      - deleting the "REPORTS_TO" edge of a high-oversight agent to its supervisor
      - removing the "GOVERNED_BY" edge between a workflow and its policy
      - deleting trust edges between high-trust agents to fragment the trust network
    severity: HIGH
    
  CYCLE_INJECTION:
    definition: introducing cycles into directed acyclic graphs (DAGs) that should be
                acyclic, causing traversal loops, infinite inference, or reasoning failures
    examples:
      - creating circular delegation chains (A→B→C→A)
      - injecting cycles into workflow dependency graphs to prevent valid topological ordering
      - creating circular inference rules that loop indefinitely
    severity: HIGH
    
  SUBGRAPH_CAPTURE:
    definition: gradually isolating a subgraph of important nodes and altering the edges
                connecting that subgraph to the rest of the graph, creating a pocket of controlled context
    examples:
      - disconnecting a security-relevant org unit from the main governance graph
      - creating an isolated trust cluster of adversary-controlled agents
      - encapsulating constitutional governance from normal operational workflows
    severity: CRITICAL
```

---

## Graph Integrity Verification Protocol

```
verify_graph_integrity(graph_id):

  graph = load_graph(graph_id)
  baseline = load_graph_baseline(graph_id)
  
  findings = []
  
  # Check 1: Node count consistency
  if len(graph.nodes) != len(baseline.nodes):
    delta = identify_added_or_deleted_nodes(graph, baseline)
    for node in delta.added:
      if NOT has_authorized_addition_record(node):
        findings.append(GRI_Finding { type: UNAUTHORIZED_NODE_ADDITION, node: node })
    for node in delta.deleted:
      if NOT has_authorized_deletion_record(node):
        findings.append(GRI_Finding { type: UNAUTHORIZED_NODE_DELETION, node: node })
        
  # Check 2: Edge set integrity
  current_edges  = set(graph.edges)
  baseline_edges = set(baseline.edges)
  
  injected_edges = current_edges - baseline_edges
  deleted_edges  = baseline_edges - current_edges
  
  for edge in injected_edges:
    if NOT has_authorized_addition_record(edge):
      severity = CRITICAL if edge.type in CRITICAL_EDGE_TYPES else HIGH
      findings.append(GRI_Finding { type: UNAUTHORIZED_EDGE_INJECTION, edge: edge, severity: severity })
      
  for edge in deleted_edges:
    if NOT has_authorized_deletion_record(edge):
      findings.append(GRI_Finding { type: UNAUTHORIZED_EDGE_DELETION, edge: edge })
      
  # Check 3: Node attribute integrity
  for node in graph.nodes:
    baseline_node = baseline.get_node(node.id)
    if baseline_node:
      attribute_delta = compare_attributes(node, baseline_node)
      for attr in attribute_delta.changed:
        if NOT has_authorized_modification_record(node, attr):
          severity = CRITICAL if attr.name in CRITICAL_ATTRIBUTES else HIGH
          findings.append(GRI_Finding {
            type: UNAUTHORIZED_ATTRIBUTE_MODIFICATION,
            node: node, attribute: attr, severity: severity
          })
          
  # Check 4: Structural constraints
  if graph.must_be_dag:
    cycles = detect_cycles(graph)
    for cycle in cycles:
      findings.append(GRI_Finding { type: CYCLE_DETECTED, cycle: cycle, severity: HIGH })
      
  # Check 5: Critical node isolation detection
  for critical_node in CRITICAL_GOVERNANCE_NODES:
    connectivity = compute_connectivity(critical_node, graph)
    expected_connectivity = baseline.expected_connectivity(critical_node)
    if connectivity.degree < expected_connectivity.min_degree:
      findings.append(GRI_Finding {
        type: CRITICAL_NODE_ISOLATION,
        node: critical_node,
        severity: CRITICAL
      })
      
  Return: GRI_Report { graph_id: graph_id, findings: findings }
```

---

## Detection Rules

```yaml
graph_integrity_rules:

  RGI-001:
    name: "Critical Edge Injection"
    condition: |
      edge ADDED to graph WHERE:
        edge.type IN [DELEGATES_TO, TRUSTS, GOVERNED_BY, REPORTS_TO, AUTHORIZED_BY]
        AND NOT EXISTS authorized_edge_creation_record(edge)
    severity: CRITICAL
    auto_action: remove_injected_edge; alert_T3; T4_notification
    
  RGI-002:
    name: "Trust Edge Deletion"
    condition: |
      edge REMOVED from trust_graph WHERE:
        edge.type = TRUSTS
        AND NOT EXISTS authorized_edge_deletion_record(edge)
        AND edge.source.tier >= T3
    severity: HIGH
    auto_action: restore_deleted_edge; alert_T3; investigate_deletion_source
    
  RGI-003:
    name: "Agent Node Attribute Falsification"
    condition: |
      agent_node.tier OR agent_node.privilege_level OR agent_node.authority
      DIFFERS from identity_registry.registered_value(agent_id)
    severity: CRITICAL
    auto_action: synchronize_node_from_registry; alert_T3; T4_notification
    # Graph node attributes for agents must always match the identity registry as ground truth
    
  RGI-004:
    name: "Workflow DAG Cycle Injection"
    condition: |
      workflow_graph CONTAINS directed_cycle
      # Workflow graphs must be DAGs
    severity: HIGH
    auto_action: reject_workflow_execution; alert_T2; T3_escalation; identify_injected_edge
    
  RGI-005:
    name: "Constitutional Governance Node Isolation"
    condition: |
      constitutional_governor_node.degree < MINIMUM_CONNECTIVITY_THRESHOLD
      OR constitutional_governor_node DISCONNECTED from active_workflows
      # Constitutional governor must be reachable from all governance-touching workflows
    severity: CRITICAL
    auto_action: alert_T3; T4_IMMEDIATE; investigate_isolation_cause
    
  RGI-006:
    name: "Knowledge Graph Merkle Root Mismatch"
    condition: |
      computed_merkle_root(knowledge_graph_edges) != stored_merkle_root
    severity: CRITICAL
    auto_action: suspend_graph_writes; alert_T3; full_graph_integrity_scan
    
  RGI-007:
    name: "Delegation Chain Cycle"
    condition: |
      delegation_graph CONTAINS directed_cycle
      (already covered by recursive-exploit-prevention REP-006; redundant check for defense-in-depth)
    severity: HIGH
    auto_action: break_cycle_at_most_recent_delegation; alert_T2
    
  RGI-008:
    name: "Org Graph Unauthorized Structural Change"
    condition: |
      org_relationship_graph.structure_hash != authorized_structure_hash
      # Covers all unauthorized node/edge changes to the organizational graph
    severity: CRITICAL
    auto_action: revert_to_authorized_structure; alert_T3; T4_notification
```

---

## Critical Edge Types and Attributes

```yaml
CRITICAL_EDGE_TYPES:
  # Changes to these edge types always trigger CRITICAL severity
  - DELEGATES_TO
  - TRUSTS  
  - GOVERNED_BY
  - AUTHORIZED_BY
  - REPORTS_TO
  - CONSTITUTIONAL_PROXIMITY_OF
  - ENFORCES_POLICY

CRITICAL_ATTRIBUTES:
  # Changes to these node attributes always trigger CRITICAL severity
  - tier
  - privilege_level
  - authority_level
  - constitutional_proximity
  - is_governance_agent
  - is_quorum_validator
  - behavioral_contract_id

CRITICAL_GOVERNANCE_NODES:
  # These nodes must maintain connectivity thresholds at all times
  - constitutional_governor (min_degree: 10)
  - compliance_engine_node (min_degree: 8)
  - security_operations_center_node (min_degree: 8)
  - approval_workflow_engine_node (min_degree: 5)
```

---

## Graph Baseline Management

```
update_graph_baseline(graph_id, change_record):
  # Called on every authorized graph modification

  # Verify authorization
  if NOT is_authorized_graph_writer(change_record.author, graph_id, change_record.change_type):
    Return: REJECTED
    
  # Apply change to live graph
  apply_change(graph_id, change_record)
  
  # Recompute baseline
  new_merkle_root = compute_merkle_root(graph_id)
  new_structure_hash = hash_graph_structure(graph_id)
  
  # Sign and store new baseline
  new_baseline = GraphBaseline {
    graph_id: graph_id,
    merkle_root: new_merkle_root,
    structure_hash: new_structure_hash,
    updated_at: now(),
    updated_by: change_record.author,
    change_record_id: change_record.id,
    signature: ed25519_sign(new_merkle_root + new_structure_hash, agent_key)
  }
  
  store_baseline(new_baseline)
  audit_log_graph_change(graph_id, change_record, new_baseline)
  
  Return: UPDATED, new_baseline=new_baseline
```

---

## Integration

```
Feeds into:
  memory-integrity-engine.md — graph integrity findings
  adversarial-defense-engine.md — CLASS_3 and CLASS_4 graph corruption signals
  insider-threats/trust-deviation-analysis.md — trust graph integrity signals

Receives from:
  enterprise-topology/org-relationship-graph.md — org graph modification events
  trust/cross-agent-trust-accumulation.md — trust graph modification events
  knowledge-graph-core/ — knowledge graph modification events
  delegation-and-trust/trust-propagation-engine.md — delegation graph events
  workflow-engine/dag-engine.md — workflow graph events
```

---

## Governance

**Identity registry is the ground truth for agent node attributes:** When any agent node attribute in any graph conflicts with the identity registry, the registry wins; the graph node is synchronized from the registry, not vice versa  
**Merkle roots are signed by T3:** Every graph baseline update must produce a T3-signed Merkle root; unsigned baselines are treated as tampered  
**Constitutional governance nodes have connectivity floor:** If RGI-005 fires (governance node isolation), no new workflows may proceed until connectivity is restored; the OS enters restricted mode  
**Audit:** All relationship graph integrity events to `memory/memory-integrity/graph-integrity-audit.jsonl`; 10-year retention
