# Query Cache
# LRU cache with TTL, entity-targeted invalidation, and hit-rate monitoring

## Cache Configuration

```python
CACHE_TTL_SECONDS = 300       # 5-minute TTL matches event bus cache warm window
CACHE_MAX_SIZE    = 5000      # max cached query results
HIT_RATE_TARGET   = 0.70      # alert if sustained hit rate < 70%

class QueryCacheConfig:
    ttl_by_query_type: dict = {
        "SEARCH":    600,    # search results stable for 10 minutes
        "MATCH":     300,    # traversal results stable for 5 minutes
        "PATH":      120,    # path results may change faster
        "AGGREGATE": 900,    # analytics stable for 15 minutes
    }
    # Invalidation segments for targeted cache clearing
    segment_by_entity_type: bool = True
```

## Cache Key Generation

```python
def compute_key(query_str: str, filter: QueryFilter) -> str:
    filter_repr = json_encode_stable(filter.__dict__)   # deterministic serialization
    return sha256(f"{query_str}::{filter_repr}".encode()).hexdigest()[:32]
```

## Cache Operations

```python
class QueryCache:
    def __init__(self):
        self._store = TTLCache(maxsize=CACHE_MAX_SIZE, ttl=CACHE_TTL_SECONDS)
        self._entity_index = defaultdict(set)   # entity_id → {cache_keys}
        self._type_index   = defaultdict(set)   # entity_type → {cache_keys}
        self._stats = CacheStats()

    def get(self, key: str) -> QueryResult | None:
        result = self._store.get(key)
        if result is not None:
            self._stats.hits += 1
            return result
        self._stats.misses += 1
        return None

    def set(self, key: str, result: QueryResult):
        ttl = CACHE_CONFIG.ttl_by_query_type.get(result.metadata.query_type, CACHE_TTL_SECONDS)
        self._store.set(key, result, ttl=ttl)

        # Register entity-to-key mappings for targeted invalidation
        for node in result.nodes:
            self._entity_index[node.entity_id].add(key)
            self._type_index[node.entity_type].add(key)

    def invalidate_entity(self, entity_id: str):
        keys_to_evict = self._entity_index.pop(entity_id, set())
        for key in keys_to_evict:
            self._store.pop(key, None)
            self._stats.invalidations += 1

    def invalidate_for_entities(self, entity_ids: list[str]):
        for entity_id in entity_ids:
            self.invalidate_entity(entity_id)

    def invalidate_by_entity_type(self, entity_type: str):
        keys_to_evict = self._type_index.pop(entity_type, set())
        for key in keys_to_evict:
            self._store.pop(key, None)
            self._stats.invalidations += 1

    def invalidate_all(self):
        self._store.clear()
        self._entity_index.clear()
        self._type_index.clear()
        self._stats.full_invalidations += 1
```

## Cache Statistics

```python
class CacheStats:
    hits: int = 0
    misses: int = 0
    invalidations: int = 0
    full_invalidations: int = 0
    evictions: int = 0   # TTL-based evictions counted by TTLCache

    @property
    def total_requests(self) -> int:
        return self.hits + self.misses

    @property
    def hit_rate(self) -> float:
        return self.hits / max(1, self.total_requests)

def get_cache_health() -> CacheHealthReport:
    stats = query_cache.stats
    hit_rate = stats.hit_rate
    return CacheHealthReport(
        hit_rate=hit_rate,
        status="HEALTHY" if hit_rate >= HIT_RATE_TARGET else "DEGRADED",
        total_requests=stats.total_requests,
        current_size=len(query_cache._store),
        max_size=CACHE_MAX_SIZE,
        invalidations_since_reset=stats.invalidations,
        warning=None if hit_rate >= HIT_RATE_TARGET else
                f"Cache hit rate {hit_rate:.1%} below target {HIT_RATE_TARGET:.0%}",
    )
```

## Segment-Level Invalidation Strategy

Different event types trigger invalidation at different scope levels:

```python
INVALIDATION_TRIGGERS = {
    # Entity mutation → invalidate that specific entity's cached queries
    "VERTEX_UPSERT":       lambda entity_id: query_cache.invalidate_entity(entity_id),
    "EDGE_UPSERT":         lambda *ids: query_cache.invalidate_for_entities(ids),

    # Policy change → invalidate all POLICY-related cached queries
    "POLICY_UPDATED":      lambda: query_cache.invalidate_by_entity_type("POLICY"),

    # Agent lifecycle → invalidate AGENT + WORKFLOW queries (may affect capability paths)
    "AGENT_SUSPENDED":     lambda: (query_cache.invalidate_by_entity_type("AGENT"),
                                    query_cache.invalidate_by_entity_type("WORKFLOW")),

    # Full inference cycle → clear all INFERRED cached paths
    "INFERENCE_CYCLE_COMPLETE": lambda: query_cache.invalidate_by_edge_source_type("INFERRED"),
}

def handle_invalidation_trigger(trigger_type: str, *args):
    handler = INVALIDATION_TRIGGERS.get(trigger_type)
    if handler:
        handler(*args)
```

## Most-Frequently-Requested Query Tracking

For cache warming and optimization analysis:

```python
class QueryFrequencyTracker:
    def __init__(self):
        self._counter = Counter()

    def record(self, query_str: str):
        self._counter[normalize_query(query_str)] += 1

    def get_top_queries(self, n=20) -> list[tuple[str, int]]:
        return self._counter.most_common(n)

    def get_slowest_queries(self, n=10) -> list[tuple[str, float]]:
        # Populated from query_analytics.yaml via metrics publisher
        return query_analytics_store.get_slowest(n)
```

## Integration Points

- `query-interface.md`: every query checks cache before execution and populates on miss
- `graph-schema.md`: GraphMutationPipeline calls `query_cache.invalidate_entity()` on every write
- `event-stream-consumer.md`: governance events trigger `invalidate_by_entity_type("POLICY")`
- `graph-observability/graph-metrics-publisher.md`: publishes cache hit rate to telemetry.metrics
