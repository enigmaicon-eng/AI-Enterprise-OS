# Query Interface
# GKQL — Graph Knowledge Query Language; query validation, execution, and response schemas

## GKQL Query Language

GKQL is a Cypher-inspired DSL for traversing and searching the enterprise knowledge graph.
Four query types are supported: MATCH, SEARCH, PATH, and AGGREGATE.

### MATCH — Pattern Matching

```
MATCH (n:AgentType)-[:EDGE_TYPE*min..max]->(m:TargetType)
WHERE n.property operator value [AND|OR condition]
RETURN n, m, [relationship]
[LIMIT N]
[CONFIDENCE >= 0.70]
[KNOWLEDGE_TYPE IN (EXPLICIT, DERIVED)]
```

Examples:
```gkql
# All agents in the PM organization
MATCH (a:AGENT) WHERE a.org_id = "pm-org" AND a.status = "ACTIVE" RETURN a

# Agents that delegate to a specific agent (up to 3 hops)
MATCH (src:AGENT)-[:DELEGATES_TO*1..3]->(tgt:AGENT)
WHERE tgt.entity_id = "AGT-abc123" RETURN src, tgt

# Workflows governed by absolute policies
MATCH (w:WORKFLOW)-[:GOVERNED_BY]->(p:POLICY)
WHERE p.enforcement_level = "ABSOLUTE" RETURN w, p

# Wiki pages that reference a specific agent
MATCH (pg:WIKI_PAGE)-[:REFERENCES]->(a:AGENT)
WHERE a.canonical_label CONTAINS "analyst" RETURN pg, a
```

### SEARCH — Entity Lookup

```
SEARCH ENTITY [TYPE EntityType] WHERE label [CONTAINS|STARTS_WITH|=] "value"
[AND property operator value]
[RETURN entity, aliases]
[LIMIT N]
```

Examples:
```gkql
SEARCH ENTITY TYPE AGENT WHERE label CONTAINS "research"
SEARCH ENTITY WHERE label = "Master Orchestrator"
SEARCH ENTITY TYPE WORKFLOW WHERE label STARTS_WITH "Research"
SEARCH ENTITY TYPE POLICY WHERE enforcement_level = "ABSOLUTE"
```

### PATH — Path Finding

```
PATH FROM (source_id) TO (target_id)
[VIA edge_types]
[MAX_DEPTH N]
[MODE SHORTEST|ALL|WEIGHTED]
[RETURN path, total_weight, hop_count]
```

Examples:
```gkql
PATH FROM "AGT-001" TO "AGT-050" VIA ESCALATES_TO MAX_DEPTH 5 MODE SHORTEST
PATH FROM "WFL-research" TO "CAP-synthesis" VIA REQUIRES_CAPABILITY,SPECIALIZES_IN MODE ALL
PATH FROM "ART-report-001" TO "AGENT-pm-lead" MAX_DEPTH 10 MODE WEIGHTED
```

### AGGREGATE — Analytics Queries

```
AGGREGATE [metric] ON [entity_type|edge_type]
[GROUP BY property]
[WHERE condition]
[RETURN result]
```

Examples:
```gkql
AGGREGATE COUNT ON AGENT GROUP BY org_id WHERE status = "ACTIVE"
AGGREGATE AVG(confidence) ON WORKFLOW
AGGREGATE CENTRALITY ON AGENT RETURN top_10
```

## Query Execution Engine

```python
class QueryExecutor:
    def execute(self, query_str: str, filter: QueryFilter = None) -> QueryResult:
        filter = filter or DEFAULT_QUERY_FILTER
        parsed = QueryParser.parse(query_str)

        # Validate query
        validation = QueryValidator.validate(parsed)
        if not validation.valid:
            return QueryResult(error=f"Invalid query: {validation.errors}")

        # Apply depth limit enforcement
        if parsed.query_type == "MATCH" and parsed.max_depth > MAX_QUERY_DEPTH:
            return QueryResult(error=f"max_depth {parsed.max_depth} exceeds limit {MAX_QUERY_DEPTH}")

        # Check cache
        cache_key = query_cache.compute_key(query_str, filter)
        cached = query_cache.get(cache_key)
        if cached:
            return cached.with_metadata(cache_hit=True)

        # Execute
        start_ms = now_ms()
        if parsed.query_type == "MATCH":
            raw_result = self._execute_match(parsed, filter)
        elif parsed.query_type == "SEARCH":
            raw_result = self._execute_search(parsed, filter)
        elif parsed.query_type == "PATH":
            raw_result = self._execute_path(parsed, filter)
        elif parsed.query_type == "AGGREGATE":
            raw_result = self._execute_aggregate(parsed, filter)
        else:
            return QueryResult(error=f"Unknown query type: {parsed.query_type}")

        result = QueryResult(
            nodes=raw_result.nodes,
            edges=raw_result.edges,
            paths=raw_result.paths,
            metadata=QueryMetadata(
                execution_ms=now_ms() - start_ms,
                cache_hit=False,
                result_count=len(raw_result.nodes),
                query_type=parsed.query_type,
            )
        )
        query_cache.set(cache_key, result)
        return result

    def _execute_match(self, parsed: ParsedMatchQuery, filter: QueryFilter) -> RawResult:
        # Start from anchor nodes (WHERE clause on source node)
        anchor_nodes = graph_store.find_vertices(
            entity_type=parsed.source_type,
            property_filter=parsed.source_filter,
            status_filter=filter.exclude_statuses,
            min_confidence=filter.min_confidence,
        )
        results = []
        for anchor in anchor_nodes:
            traversal_results = traversal_engine.traverse(
                start_id=anchor.entity_id,
                edge_types=parsed.edge_types,
                target_type=parsed.target_type,
                min_depth=parsed.min_depth,
                max_depth=parsed.max_depth,
                target_filter=parsed.target_filter,
                direction=parsed.direction,
            )
            results.extend(traversal_results)
        return apply_limit(results, parsed.limit or DEFAULT_RESULT_LIMIT)
```

## Query Limits and Safety

```python
MAX_QUERY_DEPTH = 10
DEFAULT_RESULT_LIMIT = 100
MAX_RESULT_LIMIT = 1000

QUERY_TIMEOUT_MS = 5000   # 5 seconds max per query

class QueryValidator:
    @staticmethod
    def validate(parsed: ParsedQuery) -> ValidationResult:
        errors = []
        if parsed.query_type == "MATCH":
            if parsed.max_depth and parsed.max_depth > MAX_QUERY_DEPTH:
                errors.append(f"max_depth {parsed.max_depth} > limit {MAX_QUERY_DEPTH}")
            if parsed.limit and parsed.limit > MAX_RESULT_LIMIT:
                errors.append(f"LIMIT {parsed.limit} > max {MAX_RESULT_LIMIT}")
            if not parsed.source_type and not parsed.source_filter:
                errors.append("MATCH query must have at least one anchor condition")
        if parsed.query_type == "PATH":
            if not parsed.source_id or not parsed.target_id:
                errors.append("PATH query requires FROM and TO entity IDs")
        return ValidationResult(valid=len(errors) == 0, errors=errors)
```

## Query Result Schema

```yaml
QueryResult:
  nodes: [EntityVertex]        # matched/traversed entities
  edges: [GraphEdge]           # traversed relationships
  paths: [GraphPath]           # for PATH queries
  metadata:
    execution_ms: integer
    cache_hit: boolean
    result_count: integer
    query_type: string
    truncated: boolean         # true if result_count hit limit
  error: string | null

GraphPath:
  nodes: [EntityVertex]        # ordered list of nodes in path
  edges: [GraphEdge]           # ordered list of edges in path
  total_weight: float          # sum of edge weights
  hop_count: integer
```

## Integration Points

- `traversal-engine.md`: handles MATCH query execution
- `path-finder.md`: handles PATH query execution
- `semantic-search.md`: handles SEARCH query execution
- `graph-analytics.md`: handles AGGREGATE query execution
- `query-cache.md`: caching layer for all query types
- `knowledge-types.md`: DEFAULT_QUERY_FILTER applied to all executions
