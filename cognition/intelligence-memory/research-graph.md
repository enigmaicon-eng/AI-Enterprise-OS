# Research Graph System

**System ID:** `research-graph`
**Role:** Maintains a graph of investigations, findings, sources, and their relationships — enables traversal, pattern detection, and accumulated intelligence
**Storage:** `intelligence-memory/research-graph.jsonl`

---

## Purpose

The Research Graph is the connective tissue of the intelligence memory system. Where the investigation index tracks individual investigations and the evidence retention system stores facts, the research graph stores the **relationships** between them — how findings from one investigation connect to, build on, contradict, or refine findings from another.

Over time, the research graph accumulates into a structured knowledge base of the organization's research history. It enables:
- Finding all prior investigations relevant to a new mandate
- Detecting when a new finding contradicts a prior finding
- Identifying clusters of related intelligence
- Discovering emergent patterns across investigations

---

## Graph Structure

### Node Types

**Investigation Node**
```json
{
  "node_id": "inv-[id]",
  "node_type": "investigation",
  "label": "[investigation topic]",
  "date": "2026-05-14",
  "confidence": 0.79,
  "domain": "[domain]",
  "package_path": "[path to intelligence package]"
}
```

**Claim Node**
```json
{
  "node_id": "cl-[id]",
  "node_type": "claim",
  "label": "[claim text, first 100 chars]",
  "full_claim": "[complete claim text]",
  "confidence": 0.87,
  "domain": "[domain]",
  "tags": ["[tag]"],
  "source_investigation": "inv-[id]"
}
```

**Source Node**
```json
{
  "node_id": "src-[id]",
  "node_type": "source",
  "label": "[source domain]",
  "url": "[url]",
  "credibility": 0.82,
  "type": "[source type]"
}
```

**Entity Node**
```json
{
  "node_id": "ent-[id]",
  "node_type": "entity",
  "label": "[entity name]",
  "entity_type": "competitor | market | technology | organization | person",
  "domain": "[domain]"
}
```

**Insight Node**
```json
{
  "node_id": "ins-[id]",
  "node_type": "insight",
  "label": "[insight headline]",
  "type": "[pattern | contradiction | gap | trajectory | structural]",
  "confidence": 0.84,
  "source_investigation": "inv-[id]"
}
```

---

### Edge Types

**INVESTIGATED**
An investigation investigated a topic/entity.
```json
{"from": "inv-[id]", "to": "ent-[id]", "type": "INVESTIGATED", "date": "2026-05-14"}
```

**PRODUCED**
An investigation produced a claim or insight.
```json
{"from": "inv-[id]", "to": "cl-[id]", "type": "PRODUCED", "date": "2026-05-14"}
```

**SUPPORTS**
A claim supports another claim or insight.
```json
{"from": "cl-[id1]", "to": "cl-[id2]", "type": "SUPPORTS", "strength": 0.78}
```

**CONTRADICTS**
A claim contradicts another claim.
```json
{"from": "cl-[id1]", "to": "cl-[id2]", "type": "CONTRADICTS", "resolution": "UNRESOLVED | RESOLVED:A | RESOLVED:B"}
```

**REFINES**
A newer claim refines (updates or qualifies) an older claim.
```json
{"from": "cl-[new]", "to": "cl-[old]", "type": "REFINES", "date": "2026-05-14"}
```

**SOURCED_FROM**
A claim is sourced from a specific source.
```json
{"from": "cl-[id]", "to": "src-[id]", "type": "SOURCED_FROM", "confidence": 0.82}
```

**BUILDS_ON**
An investigation builds on the findings of a prior investigation.
```json
{"from": "inv-[new]", "to": "inv-[old]", "type": "BUILDS_ON"}
```

**CONTRADICTS_INVESTIGATION**
A new investigation's findings contradict a prior investigation's conclusions.
```json
{"from": "inv-[new]", "to": "inv-[old]", "type": "CONTRADICTS_INVESTIGATION", "specific_claim": "cl-[id]"}
```

**ABOUT**
A claim or insight is about a specific entity.
```json
{"from": "cl-[id]", "to": "ent-[id]", "type": "ABOUT"}
```

**CITES**
One source cites another.
```json
{"from": "src-[id1]", "to": "src-[id2]", "type": "CITES", "citation_verified": true}
```

---

## Graph Operations

### Add Investigation
When a new investigation completes:
1. Add investigation node
2. Add entity nodes for all entities investigated (competitors, markets, technologies)
3. Add claim nodes for all high-confidence claims (confidence ≥ 0.70)
4. Add insight nodes for all validated insights
5. Add source nodes for all sources used
6. Add edges: INVESTIGATED, PRODUCED, ABOUT, SOURCED_FROM

### Add BUILDS_ON Edge
At investigation start, when prior investigations are loaded:
1. Identify related prior investigations (by domain, entity, or topic match)
2. Add BUILDS_ON edge from new investigation to all loaded prior investigations

### Add CONTRADICTS Edge
When contradiction reconciler identifies a claim that contradicts a prior validated fact:
1. Find the prior claim node in the graph
2. Add CONTRADICTS edge between new claim and prior claim
3. Update resolution field when reconciler resolves the contradiction

### Query: Prior Context for New Mandate
Given a new mandate, find relevant prior investigations:
```
MATCH investigations WHERE:
  entity.label CONTAINS [mandate keywords]
  OR investigation.label CONTAINS [mandate keywords]
  OR claim.tags CONTAINS [mandate domain]
ORDER BY investigation.date DESC
LIMIT 5
```

### Query: All Claims About Entity
Find all what the research graph knows about a specific entity:
```
MATCH (cl:claim)-[ABOUT]->(ent:entity {label: "[entity name]"})
RETURN cl, cl.confidence, cl.source_investigation
ORDER BY cl.confidence DESC
```

### Query: Contradiction Cluster
Find all unresolved contradictions in a domain:
```
MATCH (a:claim)-[CONTRADICTS {resolution: "UNRESOLVED"}]->(b:claim)
WHERE a.domain = "[domain]"
RETURN a, b
```

### Query: Source Influence
Find which sources have most influenced the research graph:
```
MATCH (src:source)<-[SOURCED_FROM]-(cl:claim)
RETURN src.label, COUNT(cl) as claims_contributed
ORDER BY claims_contributed DESC
```

---

## Graph Storage Format

JSONL file with mixed node and edge records:

```jsonl
{"record_type": "node", "node_id": "inv-001", "node_type": "investigation", "label": "Async voice notes market", "date": "2026-05-14", "confidence": 0.79, "domain": "market"}
{"record_type": "node", "node_id": "ent-042", "node_type": "entity", "entity_type": "market", "label": "async collaboration tools"}
{"record_type": "edge", "edge_id": "e-0012", "from": "inv-001", "to": "ent-042", "type": "INVESTIGATED", "date": "2026-05-14"}
{"record_type": "node", "node_id": "cl-0091", "node_type": "claim", "label": "Async voice note market growing 23% CAGR", "confidence": 0.84, "domain": "market", "tags": ["growth", "market-sizing", "async-voice"]}
{"record_type": "edge", "edge_id": "e-0013", "from": "inv-001", "to": "cl-0091", "type": "PRODUCED", "date": "2026-05-14"}
{"record_type": "edge", "edge_id": "e-0014", "from": "cl-0091", "to": "ent-042", "type": "ABOUT"}
```

---

## Graph Intelligence Patterns

As the research graph grows, emergent patterns become detectable:

### Knowledge Accumulation Map
Domains with many investigation nodes = well-researched areas.
Domains with few nodes = intelligence gaps.

### Contradiction Clusters
Multiple unresolved contradictions about the same entity = contested domain needing special scrutiny.

### Source Influence Map
Sources that appear in many investigations = influential sources (high trust if credible, high risk if low-credibility).

### Staleness Map
Claim nodes with old dates and no REFINES edges = potentially stale knowledge.

### Investigation Dependency Chains
Long BUILDS_ON chains = deep accumulated knowledge. These are the areas where the organization has competitive research advantage.

---

## Graph Maintenance

### Monthly Sweep
1. Flag claim nodes older than TTL for their class
2. Identify investigation nodes with no outgoing BUILDS_ON edges (orphan investigations)
3. Flag contradiction nodes that have been UNRESOLVED for > 90 days

### After Each Investigation
1. Add all new nodes and edges
2. Check for contradictions with existing claim nodes
3. Update REFINES edges where new claims update old ones

---

## Integration

**Written to by:**
- `synthesis-systems/research-memory-synthesizer.md` → adds nodes and edges at investigation completion
- `synthesis-systems/contradiction-reconciler.md` → adds CONTRADICTS edges

**Read by:**
- `research-intelligence/orchestrator.md` → prior context query at mandate intake
- `research-intelligence/discovery-agent.md` → loads relevant prior claims
- `intelligence-memory/investigation-continuity.md` → finds related investigations

**Storage:** `intelligence-memory/research-graph.jsonl`
