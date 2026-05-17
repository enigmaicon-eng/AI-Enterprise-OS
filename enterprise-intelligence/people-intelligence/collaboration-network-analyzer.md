# Collaboration Network Analyzer

## Role
Maps and analyzes the collaboration graph of the organization — who works with whom, which teams have strong vs. weak connections, and where collaboration patterns indicate healthy information flow vs. siloing. Used for org design insights, team formation, and identifying informal connectors.

## Collaboration Graph Model

```
GRAPH:
  nodes: agents + human team members + teams
  edges: collaboration events (weighted by recency + intensity)

EDGE WEIGHT FORMULA:
  weight = Σ(collaboration_events in past 90 days) × recency_decay
  recency_decay: events in last 30d × 1.0; 31–60d × 0.6; 61–90d × 0.3

COLLABORATION EVENTS (tracked):
  WORKFLOW_HANDOFF:      one node passes work to another
  JOINT_DECISION:        two+ nodes in same approval event
  CO_AUTHORED_WIKI:      two+ nodes edit same wiki page in same week
  SHARED_WORKFLOW_RUN:   two nodes both contribute to same workflow run
  ESCALATION_LOOP:       escalation passed between nodes
  REVIEW_EVENT:          one node reviews artifact created by another
```

## Network Metrics

```
PER NODE:
  degree_centrality:      number of unique collaboration partners (last 90d)
  betweenness_centrality: how often this node is on shortest path between others
                          (high = information broker / connector)
  clustering_coefficient: how well-connected this node's neighbors are to each other
                          (high = part of tight cluster; low = bridging different groups)

PER TEAM:
  internal_density:       edges within team / possible internal edges
  external_density:       edges to other teams / possible external edges
  isolation_score:        low external_density for non-leaf team → silo risk

NETWORK-LEVEL:
  modularity:            how strongly the network clusters into sub-communities
                          (high modularity = silos; low = well-connected org)
  avg_path_length:       avg hops between any two nodes (shorter = better connected)
  hub_nodes:             nodes with betweenness_centrality > 2× avg (key connectors)
```

## Collaboration Pattern Detection

```
SILO DETECTION:
  IF team's external_density < 0.15 AND team is not a leaf team:
    → SILO warning
    → Investigate: intentional autonomy or organizational gap?
    → T3 review recommended

OVER-CONCENTRATION ON HUBS:
  IF single hub node handles > 40% of cross-team communication:
    → HUB_OVERLOAD risk
    → Bus factor risk (see knowledge-concentration-detector)
    → Recommend: redistribute connector role; cross-train others

COLLABORATION DECLINE:
  IF collaboration edge between teams drops > 50% over 30d:
    → COLLABORATION_DECLINE alert
    → Could indicate: team conflict, reorganization, changing work streams
    → T3 awareness notification

EMERGING CLUSTER:
  IF two previously unconnected teams develop strong collaboration (weight > 0.40 in 30d):
    → EMERGING_COLLABORATION signal
    → Potentially positive: new cross-functional work
    → Suggest: formalize collaboration with explicit dependency agreement
```

## Org Design Insights

```
QUARTERLY ORG DESIGN REPORT (T4+):
  1. Collaboration network visualization (abstract, no names at T3)
  2. Modularity trend (increasing silo? decreasing?)
  3. Hub nodes identified (key connectors; bus factor risk)
  4. Isolated teams with recommendations
  5. Strongest collaboration pairs (may indicate natural team merging opportunity)
  6. Weakest critical collaboration pairs (may need structural fix)
  
TEAM FORMATION RECOMMENDATIONS:
  Given: project requires collaboration between domains A + B
  Find: people with edges to both domains (natural connectors)
  Recommend: include connector in project team for knowledge bridge
```

## Persistence
`memory/people-intelligence/collaboration-graph.yaml`
`memory/people-intelligence/collaboration-events.jsonl`
`memory/people-intelligence/network-metrics.yaml`
`memory/people-intelligence/silo-alerts.yaml`
