# Adaptive Cognition — Integration Map
**ID:** AC-INT-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-17

---

## Integration Architecture

```
ADAPTIVE COGNITION ←──── DATA SOURCES ────────────────────────────────────────┐
                                                                                │
  execution-ledger.jsonl        ← Every workflow event                         │
  decision-log.jsonl            ← All agent decisions                          │
  escalation-log.jsonl          ← All escalations                              │
  gate-verdicts.jsonl           ← Governance gate outcomes                     │
  agent-invocations.jsonl       ← Every agent call                             │
  delegation-log.jsonl          ← All delegation records                       │
                                                                                │
ADAPTIVE COGNITION ─────► OUTPUT CONSUMERS ───────────────────────────────────┘

  Orchestration routing         ← Refined routing heuristics
  Trust systems                 ← Collaboration trust weight updates
  Knowledge base                ← Promoted learning records (KU entries)
  Agent registry                ← Identity profiles (agent capability updates)
  Executive intelligence        ← Strategic memory entries
  Portfolio systems             ← Portfolio-level pattern learning
  Digital twins                 ← Heuristic validation requests
```

---

## Per-System Integration Specifications

### 1. Orchestration Runtime
**Path:** `orchestration/`
**Integration Type:** Bidirectional
**Consumes from AC:** Refined routing heuristics, execution confidence scores
**Provides to AC:** Workflow completion events, execution telemetry, routing outcomes

```yaml
orchestration_integration:
  inbound_events:
    - source: orchestration/orchestrator/execution-engine.md
      event_types: [workflow_complete, workflow_failed, timeout, gate_blocked]
      delivery: append to adaptive-cognition/store/reflection-log.jsonl (trigger)
  
  outbound_heuristics:
    - target: orchestration/patterns/routing-table (runtime read)
      heuristics: [routing_confidence_floor, orchestration_retry_depth]
      update_frequency: on_heuristic_change
      format: key-value patch to routing configuration
  
  interface_contract: orchestration/adaptive/autonomous-coordinator.md
```

### 2. Memory Systems
**Path:** `memory/`
**Integration Type:** Bidirectional
**Consumes from AC:** Learning records, strategic memory entries, reflection summaries
**Provides to AC:** Episodic memory (prior events), declarative memory (known patterns)

```yaml
memory_integration:
  writes_from_ac:
    - target: memory/patterns/
      content: Promoted learning records (learning_type = PATTERN, confidence > 0.80)
      approval: automated for OPERATIONAL scope; T3 for STRATEGIC scope
    
    - target: memory/organizational/
      content: Institutional knowledge formation records
      approval: T3 Knowledge Management
    
    - target: memory/strategic-intelligence/
      content: Strategic memory entries (SM-* records)
      approval: T3 for new; T4 for updates to locked entries
  
  reads_by_ac:
    - source: memory/execution-memory/
      purpose: Prior execution outcomes for comparison in reflection
    
    - source: memory/patterns/
      purpose: Existing patterns to avoid duplicating learning records
    
    - source: memory/failures/
      purpose: Known failure modes to enrich failure analysis
```

### 3. Governance Layer
**Path:** `governance/`, `docs/governance/`, `constitutional-ai/`
**Integration Type:** Read-only (AC never writes to governance)

```yaml
governance_integration:
  reads_by_ac:
    - source: docs/governance/principles.md
      purpose: Constitutional constraints on all adaptation
    
    - source: governance/adaptive-compliance/
      purpose: Current compliance state (informs what operational changes are safe)
    
    - source: adaptive-cognition/governance.md
      purpose: Heuristic bounds, forbidden patterns, approval requirements
  
  write_prohibition:
    targets: [docs/governance/, governance/, constitutional-ai/, memory/governance/]
    enforcement: file_write_interceptor (OS-level)
    violation_response: IMMEDIATE_HALT + T4 alert
```

### 4. Ontology Systems
**Path:** `cognition/` (ontology and knowledge graph)
**Integration Type:** Read + Conditional Append

```yaml
ontology_integration:
  reads_by_ac:
    - source: cognition/knowledge-base/
      purpose: Existing knowledge units; avoid learning duplication
    
    - source: cognition/graph/
      purpose: Concept relationships for enriching reflection context
  
  writes_from_ac:
    - target: cognition/knowledge-base/
      condition: learning_record promoted via T3 approval
      format: Knowledge Unit (KU-*) via standard KU creation workflow
      rate: low frequency; high quality gate
```

### 5. Trust Systems
**Path:** `memory/trust/`
**Integration Type:** Bidirectional

```yaml
trust_integration:
  reads_by_ac:
    - source: memory/trust/trust-registry.jsonl
      purpose: Current trust weights for collaboration pattern analysis
  
  writes_from_ac:
    - target: memory/trust/trust-registry.jsonl
      content: trust_delta from collaboration_record
      bounds: governance.md/agent_collaboration_trust_initial bounds apply
      constraint: trust weight ≤ 0.90 without human milestone review
      frequency: per collaboration event (bounded delta)
```

### 6. Executive Intelligence
**Path:** `enterprise-intelligence/` (strategic intelligence systems)
**Integration Type:** Write (AC → executive intelligence)

```yaml
executive_intelligence_integration:
  writes_from_ac:
    - target: enterprise-intelligence/strategic-intelligence/
      content: strategic_memory_entry records (memory_type = EXECUTIVE_INSIGHT)
      trigger: confidence > 0.75 AND scope IN [PORTFOLIO, ENTERPRISE]
      approval: T3 for new; T4 for entries marked as board-relevant
```

### 7. Digital Twins
**Path:** `digital-twins/`
**Integration Type:** Read (AC requests simulations)

```yaml
digital_twin_integration:
  simulation_requests:
    trigger: proposed heuristic change confidence between 0.60 and 0.80
    request_format: HeuristicSimulationRequest (digital twin protocol)
    expected_turnaround: < 60 minutes for operational heuristics
    use_of_result:
      - simulation_outcome = POSITIVE → confidence boost (+0.10)
      - simulation_outcome = NEGATIVE → proposal blocked; flagged for review
      - simulation_outcome = INCONCLUSIVE → no confidence change; proceed with caution
```

### 8. Portfolio Systems
**Path:** `memory/portfolio/` (if exists) or `enterprise-intelligence/`
**Integration Type:** Bidirectional

```yaml
portfolio_integration:
  reads_by_ac:
    - source: enterprise-intelligence/portfolio outcomes
      purpose: Cross-project outcome data for strategic memory
  
  writes_from_ac:
    - target: enterprise-intelligence/portfolio learning records
      content: Portfolio-level learning records (scope = PORTFOLIO)
      approval: T3 Portfolio Management
```

---

## Event Bus Integration

```yaml
event_bus_topics:
  subscribed:
    - topic: workflow.completed
      handler: reflection-engine/post-execution-reflection.md
    
    - topic: workflow.failed
      handler: reflection-engine/success-failure-analysis.md
    
    - topic: governance.breach
      handler: reflection-engine/governance-breach-reflection.md
    
    - topic: escalation.triggered
      handler: identity-evolution/escalation-pattern-evolution.md
    
    - topic: agent.handoff.completed
      handler: collaboration-patterns/handoff-optimization.md
  
  publishes:
    - topic: cognition.heuristic.changed
      payload: heuristic_record
      subscribers: [orchestration, trust-systems, monitoring]
    
    - topic: cognition.learning.activated
      payload: learning_record summary
      subscribers: [knowledge-management, executive-intelligence]
    
    - topic: cognition.drift.alert
      payload: drift_report
      subscribers: [governance-ops, T3-team]
```

---

## API Interface (Internal Runtime)

```
POST /adaptive-cognition/reflect
  → Trigger reflection on a workflow_id
  → Returns: reflection_event_id

GET  /adaptive-cognition/heuristics
  → Returns current active heuristic registry

GET  /adaptive-cognition/heuristics/{id}/history
  → Returns full version history for a heuristic

POST /adaptive-cognition/heuristics/{id}/rollback
  → Rolls back heuristic to prior version (T3 auth required)
  → Returns: rollback confirmation + new heuristic_record

GET  /adaptive-cognition/agent/{id}/profile
  → Returns agent identity profile

GET  /adaptive-cognition/learning
  → Returns active learning records (filterable by scope, status, type)

POST /adaptive-cognition/freeze
  → Freezes all adaptive activity (T3 auth required)

POST /adaptive-cognition/rollback-all
  → Rolls all heuristics to initial values (T4 auth required)
```
