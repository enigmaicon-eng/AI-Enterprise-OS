# Semantic Search
# Entity search by label, alias, property, and type with relevance scoring

## Search Modes

```yaml
search_modes:
  EXACT:
    description: Exact match on normalized canonical_label or alias
    confidence_score: 1.00
    lookup: resolution_index.label_to_id (O(1))

  PREFIX:
    description: Label starts with the query string (normalized)
    confidence_score: 0.85
    lookup: full_text_index prefix scan

  FUZZY:
    description: Levenshtein distance ≤ 2 from normalized label
    confidence_score: 0.70
    lookup: full_text_index fuzzy scan

  CONTAINS:
    description: Label contains the query string as a substring
    confidence_score: 0.65
    lookup: full_text_index substring scan

  PROPERTY:
    description: Match on a specific entity property value
    confidence_score: 0.60
    lookup: secondary_index.by_{property_name}
```

## Search Execution

```python
class SemanticSearch:
    def search(self, query: str, entity_type: str = None,
               property_filter: dict = None,
               mode: str = "AUTO",
               min_confidence: float = 0.50,
               limit: int = 20) -> SearchResult:
        normalized_query = normalize_label(query, entity_type or "")

        if mode == "AUTO":
            results = self._auto_search(normalized_query, entity_type)
        elif mode == "EXACT":
            results = self._exact_search(normalized_query, entity_type)
        elif mode == "PREFIX":
            results = self._prefix_search(normalized_query, entity_type)
        elif mode == "FUZZY":
            results = self._fuzzy_search(normalized_query, entity_type)
        elif mode == "CONTAINS":
            results = self._contains_search(normalized_query, entity_type)
        else:
            results = []

        # Apply property filter
        if property_filter:
            results = [r for r in results if matches_property_filter(r.entity, property_filter)]

        # Filter by confidence
        results = [r for r in results if r.entity.metadata.confidence_score >= min_confidence]

        # Exclude inactive
        results = [r for r in results if r.entity.lifecycle.status == "ACTIVE"]

        # Sort by relevance_score descending, then by confidence descending
        results.sort(key=lambda r: (r.relevance_score, r.entity.metadata.confidence_score),
                     reverse=True)

        return SearchResult(
            hits=results[:limit],
            total_found=len(results),
            query=query,
            entity_type=entity_type,
        )

    def _auto_search(self, query: str, entity_type: str) -> list[SearchHit]:
        # Try EXACT first (fastest), then CONTAINS, then FUZZY
        exact = self._exact_search(query, entity_type)
        if exact:
            return exact
        contains = self._contains_search(query, entity_type)
        fuzzy = self._fuzzy_search(query, entity_type)
        # Merge and deduplicate by entity_id
        seen = set()
        merged = []
        for hit in contains + fuzzy:
            if hit.entity.entity_id not in seen:
                seen.add(hit.entity.entity_id)
                merged.append(hit)
        return merged

    def _exact_search(self, query: str, entity_type: str) -> list[SearchHit]:
        entity_id = resolution_index.label_to_id.get(
            compute_fingerprint(query, entity_type or "")
        )
        if not entity_id:
            return []
        entity = graph_store.get_vertex(entity_id)
        if entity_type and entity.entity_type != entity_type:
            return []
        return [SearchHit(entity=entity, relevance_score=1.00, match_type="EXACT")]

    def _prefix_search(self, query: str, entity_type: str) -> list[SearchHit]:
        matches = full_text_index.prefix_scan(query, entity_type=entity_type)
        return [SearchHit(entity=m, relevance_score=0.85, match_type="PREFIX") for m in matches]

    def _fuzzy_search(self, query: str, entity_type: str) -> list[SearchHit]:
        matches = full_text_index.fuzzy_scan(query, entity_type=entity_type, max_distance=2)
        hits = []
        for entity, distance in matches:
            score = 0.70 - (distance * 0.05)   # distance=1 → 0.65, distance=2 → 0.60
            hits.append(SearchHit(entity=entity, relevance_score=score, match_type="FUZZY",
                                   match_distance=distance))
        return hits

    def _contains_search(self, query: str, entity_type: str) -> list[SearchHit]:
        matches = full_text_index.substring_scan(query, entity_type=entity_type)
        hits = []
        for entity in matches:
            normalized_label = normalize_label(entity.canonical_label, entity.entity_type)
            # Closer to start of label = higher score
            pos = normalized_label.find(query)
            score = 0.65 - (pos / max(len(normalized_label), 1)) * 0.10
            hits.append(SearchHit(entity=entity, relevance_score=max(0.50, score),
                                   match_type="CONTAINS"))
        return hits
```

## Alias-Aware Search

All search modes check aliases in addition to canonical_label:

```python
def search_with_aliases(query: str, entity_type: str = None) -> list[SearchHit]:
    # Direct search on canonical label
    primary_hits = semantic_search.search(query, entity_type=entity_type)

    # Also check alias registry for matches
    alias_hits = []
    alias_matches = full_text_index.fuzzy_scan_aliases(query, entity_type=entity_type,
                                                        max_distance=1)
    for canonical_id, alias_label, distance in alias_matches:
        canonical = graph_store.get_vertex(canonical_id)
        if canonical and canonical.lifecycle.status == "ACTIVE":
            if entity_type is None or canonical.entity_type == entity_type:
                alias_hits.append(SearchHit(
                    entity=canonical,
                    relevance_score=0.75 - (distance * 0.05),
                    match_type="ALIAS",
                    matched_alias=alias_label,
                ))

    # Merge: canonical match wins over alias match for same entity_id
    seen = set()
    merged = []
    for hit in primary_hits + alias_hits:
        if hit.entity.entity_id not in seen:
            seen.add(hit.entity.entity_id)
            merged.append(hit)
    return sorted(merged, key=lambda h: h.relevance_score, reverse=True)
```

## Wildcard and Type Listing

```python
def list_all_entities(entity_type: str, limit: int = 100, offset: int = 0) -> SearchResult:
    entity_ids = secondary_index.by_entity_type.get(entity_type, [])
    active_ids = [eid for eid in entity_ids
                  if graph_store.get_vertex(eid).lifecycle.status == "ACTIVE"]
    page = active_ids[offset:offset + limit]
    entities = graph_store.batch_get(page)
    return SearchResult(
        hits=[SearchHit(entity=e, relevance_score=1.0, match_type="LIST") for e in entities],
        total_found=len(active_ids),
    )
```

## Search Result Schema

```yaml
SearchHit:
  entity: EntityVertex
  relevance_score: float        # 0.50–1.00
  match_type: string            # EXACT | PREFIX | FUZZY | CONTAINS | ALIAS | LIST
  match_distance: integer | null  # Levenshtein distance for fuzzy matches
  matched_alias: string | null   # which alias matched, if ALIAS type

SearchResult:
  hits: [SearchHit]
  total_found: integer
  query: string
  entity_type: string | null
```

## Integration Points

- `query-interface.md`: handles SEARCH query type
- `entity-resolution.md`: resolution_index feeds exact and alias lookups
- `graph-analytics.md`: centrality scores can be used to re-rank search results (optional enhancement)
- `graph-query-engine/query-cache.md`: SEARCH queries are cached by (query, entity_type, property_filter)
