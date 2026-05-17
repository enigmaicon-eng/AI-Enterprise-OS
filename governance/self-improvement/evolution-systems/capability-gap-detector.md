# Capability Gap Detector

**Component:** RSI-EVO-002 | **Owner:** Meta-Org | **Tier:** T3 | **Class:** ELEVATED

## Role
Systematically identifies gaps between what the Enterprise AI OS can currently do and what it needs to do to execute the strategic roadmap, serve customers, and meet regulatory obligations. Produces a prioritized capability gap register and routes gaps to appropriate development, hiring, integration, or workaround proposals.

---

## Gap Detection Methods

### Method 1: Roadmap-to-Capability Matching
```
PROCESS:
  1. Load active roadmap items from WF-004 (roadmap governance) + wiki/roadmap/
  2. For each roadmap item: decompose into required capabilities
     (AI decomposition → human PM review)
  3. Map each required capability to current capability registry
     (agent-capabilities/agent-skill-registry.md)
  4. Gaps = required capabilities not found in registry at required proficiency level

EXAMPLE:
  Roadmap item: "Add real-time document collaboration"
  Required capabilities: WebSocket management, CRDTs, conflict resolution
  Registry check: WebSocket → FOUND (T2, proficiency INTERMEDIATE); CRDTs → NOT FOUND
  Gap: CRDT capability at INTERMEDIATE+ level

OUTPUT: roadmap_capability_gaps (priority = roadmap item priority)
```

### Method 2: Workflow Failure Analysis
```
PROCESS:
  1. Load: step failure events from workflow execution logs (last 90d)
  2. For each failure: classify as CAPABILITY_GAP if failure reason = "no agent with required skill"
     or "agent attempted task but quality below threshold for required skill"
  3. Cluster: group failures by skill/capability area
  4. Frequency: capability with > 3 failures/month = confirmed gap

FAILURE TYPES INDICATING CAPABILITY GAP:
  AGENT_CAPABILITY_MISMATCH: routed to agent without required skill
  QUALITY_BELOW_THRESHOLD: agent attempted but output quality < 0.65
  WORKAROUND_PATTERN: same workaround used > 5 times in 30d (indicates a gap)
  FALLBACK_OVERUSE: fallback path used > 30% of attempts

OUTPUT: operational_capability_gaps (priority = failure frequency × business impact)
```

### Method 3: Regulatory Obligation Mapping
```
PROCESS:
  1. Load: regulatory obligation catalog (compliance-framework/regulatory-registry.md)
  2. For each obligation: identify required system capability
     (e.g., GDPR Art.17 = data erasure capability in all data systems)
  3. Verify capability exists AND is tested AND has evidence trail
  4. Gaps = obligations without verified, tested capabilities

REGULATORY CAPABILITY DOMAINS:
  GDPR: erasure, portability, consent management, breach notification
  EU AI Act: conformity assessment, human oversight, transparency, audit logs
  DORA: ICT risk management, incident reporting, resilience testing
  PCI-DSS: cardholder data protection, access logging, encryption
  AML: transaction monitoring, SAR filing, customer due diligence

OUTPUT: regulatory_capability_gaps (priority = compliance deadline proximity)
```

### Method 4: Benchmark Comparison
```
PROCESS:
  1. Load: capability benchmarks from agent-performance/agent-performance-benchmarks.md
  2. For each benchmark task type:
     - Expected proficiency level for this OS tier
     - Actual measured proficiency across available agents
     - Delta: expected - actual
  3. Gaps = significant delta (> 0.15 in proficiency score)

BENCHMARK SOURCES:
  Internal: historical performance on same task class
  Cross-agent: peer comparison within same tier
  Baseline: defined minimum proficiency per capability class

OUTPUT: performance_capability_gaps (priority = frequency of use × proficiency delta)
```

### Method 5: External Signal Detection
```
PROCESS:
  1. Monitor: customer escalations for patterns requiring new capabilities
  2. Monitor: competitor capabilities that customers request
  3. Monitor: research publications indicating new technique adoption
  4. Monitor: regulatory consultations (upcoming requirements)

SIGNALS:
  Customer escalation pattern: "can't do X" recurrence >= 3 in 30d → capability gap
  Feature request cluster: PM feature requests for same capability >= 5 → investigate
  Regulatory consultation: new obligation with 18-month+ runway → plan development

OUTPUT: strategic_capability_gaps (priority = strategic importance × lead time required)
```

---

## Gap Register Schema

```yaml
capability_gap:
  gap_id: GAP-{NNN}
  gap_type: ROADMAP | OPERATIONAL | REGULATORY | PERFORMANCE | STRATEGIC
  capability_name: string
  capability_domain: COGNITIVE | DOMAIN | OPERATIONAL | INTERPERSONAL | GOVERNANCE
  description: what capability is missing or insufficient
  detection_method: which method(s) detected this gap
  evidence:
    - source: string
      observation: string
      frequency: integer (occurrences in detection window)
  business_impact: LOW | MEDIUM | HIGH | CRITICAL
  regulatory_obligation: string | null
  priority_score: float (0.0–5.0)
  resolution_options:
    - option: DEVELOP | HIRE | INTEGRATE | WORKAROUND | ACCEPT
      description: string
      effort: TRIVIAL | SMALL | MEDIUM | LARGE
      timeline_weeks: integer
  recommended_resolution: option
  status: OPEN | IN_PROGRESS | RESOLVED | ACCEPTED_RISK
  opened: ISO8601
  target_resolution: ISO8601 | null
```

---

## Gap Resolution Routing

```
REGULATORY gap (compliance deadline < 6 months): P0 → immediate T4 attention
REGULATORY gap (compliance deadline 6–18 months): P1 → quarterly planning input
OPERATIONAL gap (failure rate > 10%): P1 → workflow optimization + capability development
ROADMAP gap (required for Q+1 roadmap): P2 → planning cycle input
PERFORMANCE gap (proficiency < 0.70): P2 → agent learning + training
STRATEGIC gap (required for 12+ months): P3 → annual planning input

RESOLUTION TYPES:
  DEVELOP: agent capability development (agent-learning/) + training
  HIRE: headcount request (→ org-evolution-engine.md proposal)
  INTEGRATE: connect to external system with capability (→ integration fabric)
  WORKAROUND: document interim workaround in playbook; track for permanent fix
  ACCEPT: conscious decision to not close gap (with risk acceptance from T4)
```

---

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Gap detection cycle completeness        = 100% (all 5 methods run each cycle)
Regulatory gaps with compliance date    = 0 open at compliance deadline
Operational gaps with failure rate >10% <= 3 open at any time
Gap-to-proposal lead time (P1 gaps)     < 7 days
Gap register accuracy                   >= 0.85 (validated by post-resolution review)
Gap closure rate (quarterly)            >= 0.60 of open gaps
```
