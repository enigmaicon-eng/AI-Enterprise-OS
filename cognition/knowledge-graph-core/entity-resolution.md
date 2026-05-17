# Entity Resolution
# Deduplication, canonical ID assignment, alias management, and merge protocols

## Resolution Index

The resolution index is a bidirectional lookup enabling label → entity_id and
entity_id → aliases queries in O(1). It is the primary mechanism for preventing
duplicate entities during ingestion.

```yaml
ResolutionIndex:
  # label_fingerprint → canonical_entity_id (primary deduplication lookup)
  label_to_id: {}
  # entity_id → [all known labels/aliases]
  id_to_labels: {}
  # entity_id → [formerly merged entity_ids]
  id_to_merged: {}
  # entity_type → label normalization config
  normalization_config:
    AGENT:     {lowercase: true, strip_punctuation: true, collapse_whitespace: true}
    WORKFLOW:  {lowercase: true, strip_punctuation: true, collapse_whitespace: true}
    WIKI_PAGE: {lowercase: false, use_path: true}   # wiki pages resolved by path, not label
    TOOL:      {lowercase: true, strip_punctuation: false}
```

## Label Normalization

```python
def normalize_label(label: str, entity_type: str) -> str:
    config = NORMALIZATION_CONFIG[entity_type]
    normalized = label.strip()
    if config.get("lowercase"):
        normalized = normalized.lower()
    if config.get("strip_punctuation"):
        normalized = re.sub(r"[^\w\s-]", "", normalized)
    if config.get("collapse_whitespace"):
        normalized = re.sub(r"\s+", " ", normalized)
    return normalized

def compute_fingerprint(label: str, entity_type: str) -> str:
    normalized = normalize_label(label, entity_type)
    return sha256(f"{entity_type}::{normalized}".encode()).hexdigest()[:16]
```

## Deduplication Protocol

During ingestion, every entity is checked against the resolution index before creation:

```python
def deduplicate_entity(canonical_label: str, entity_type: str,
                       properties: dict, confidence: float,
                       source: str) -> EntityVertex:
    fingerprint = compute_fingerprint(canonical_label, entity_type)
    existing_id = resolution_index.label_to_id.get(fingerprint)

    if existing_id:
        existing = graph_store.get_vertex(existing_id)
        if existing.lifecycle.status == "ACTIVE":
            return merge_properties(existing, properties, confidence, source)
        elif existing.lifecycle.status == "MERGED":
            # Follow the merge chain to canonical
            canonical_id = resolve_merge_chain(existing_id)
            return merge_properties(graph_store.get_vertex(canonical_id),
                                    properties, confidence, source)

    # Check aliases for fuzzy match (Levenshtein ≤ 2)
    fuzzy_match = resolution_index.fuzzy_lookup(canonical_label, entity_type, max_distance=2)
    if fuzzy_match and fuzzy_match.entity_type == entity_type:
        # Offer as alias candidate — don't auto-merge on fuzzy unless confidence delta < 0.1
        if abs(fuzzy_match.metadata.confidence_score - confidence) < 0.10:
            register_alias(canonical_label, fuzzy_match.entity_id, entity_type)
            return merge_properties(fuzzy_match, properties, confidence, source)

    # New entity — create fresh
    return entity_registry.register_entity(entity_type, canonical_label,
                                           properties, source, confidence)
```

## Property Merge Protocol

When two sources provide data about the same entity, properties are merged using
confidence-weighted arbitration:

```python
def merge_properties(existing: EntityVertex, new_props: dict,
                     new_confidence: float, source: str) -> EntityVertex:
    merged_props = dict(existing.properties)
    for key, new_value in new_props.items():
        if key not in merged_props:
            # New property — just add it
            merged_props[key] = new_value
        else:
            existing_confidence = existing.metadata.confidence_score
            if new_confidence > existing_confidence + 0.10:
                # Significantly higher confidence — override
                merged_props[key] = new_value
            elif new_confidence < existing_confidence - 0.10:
                # Significantly lower confidence — keep existing
                pass
            else:
                # Similar confidence — keep existing (stability preference)
                # Log for contradiction detection if values differ
                if merged_props[key] != new_value:
                    contradiction_detector.log_candidate(
                        entity_id=existing.entity_id,
                        property=key,
                        value_a=merged_props[key], confidence_a=existing_confidence,
                        value_b=new_value, confidence_b=new_confidence,
                        sources=[existing.metadata.ingestion_source, source]
                    )

    # Update confidence as weighted max
    existing.metadata.confidence_score = max(existing.metadata.confidence_score, new_confidence)
    existing.properties = merged_props
    existing.metadata.updated_at = now()
    existing.metadata.provenance_chain.append(source)
    graph_mutation_pipeline.write_vertex(existing)
    return existing
```

## Entity Merge (Explicit)

When two distinct entities are confirmed as representing the same real entity:

```python
def merge_entities(primary_id: str, secondary_id: str, merge_reason: str) -> EntityVertex:
    primary   = graph_store.get_vertex(primary_id)
    secondary = graph_store.get_vertex(secondary_id)

    # Redirect all secondary's edges to primary
    for edge in graph_store.get_all_edges(secondary_id):
        if edge.source_id == secondary_id:
            new_edge = edge.copy(source_id=primary_id)
        else:
            new_edge = edge.copy(target_id=primary_id)
        graph_mutation_pipeline.write_edge(new_edge)
        graph_store.delete_edge(edge.edge_id)

    # Register all secondary labels as aliases of primary
    for label in resolution_index.id_to_labels.get(secondary_id, []):
        register_alias(label, primary_id, primary.entity_type)

    # Merge properties (primary is authoritative)
    primary = merge_properties(primary, secondary.properties,
                               secondary.metadata.confidence_score,
                               secondary.metadata.ingestion_source)

    # Mark secondary as MERGED
    secondary.lifecycle.status = "MERGED"
    secondary.lifecycle.merged_into = primary_id
    graph_mutation_pipeline.write_vertex(secondary)

    # Update merge chain index
    resolution_index.id_to_merged.setdefault(primary_id, []).append(secondary_id)

    publish_enterprise_event("org.agent.lifecycle", {
        "event_subtype": "ENTITY_MERGED",
        "primary_id": primary_id, "secondary_id": secondary_id,
        "reason": merge_reason
    })
    return primary

def resolve_merge_chain(entity_id: str) -> str:
    vertex = graph_store.get_vertex(entity_id)
    if vertex.lifecycle.status != "MERGED":
        return entity_id
    return resolve_merge_chain(vertex.lifecycle.merged_into)   # follow chain
```

## Alias Management

```python
def register_alias(alias_label: str, canonical_id: str, entity_type: str):
    fingerprint = compute_fingerprint(alias_label, entity_type)
    if fingerprint in resolution_index.label_to_id:
        existing_canonical = resolution_index.label_to_id[fingerprint]
        if existing_canonical != canonical_id:
            raise AliasConflict(
                f"Alias '{alias_label}' already maps to {existing_canonical}, "
                f"cannot remap to {canonical_id}"
            )
        return  # Already registered correctly
    resolution_index.label_to_id[fingerprint] = canonical_id
    resolution_index.id_to_labels.setdefault(canonical_id, []).append(alias_label)

def get_all_labels(entity_id: str) -> list[str]:
    return resolution_index.id_to_labels.get(entity_id, [])

def find_entity_by_alias(alias: str, entity_type=None) -> EntityVertex | None:
    fingerprint = compute_fingerprint(alias, entity_type or "")
    canonical_id = resolution_index.label_to_id.get(fingerprint)
    if canonical_id:
        return graph_store.get_vertex(canonical_id)
    return None
```

## Resolution State Persistence

The resolution index is persisted to `memory/knowledge-graph-core/resolution-state.yaml`
after every merge and alias registration. This ensures entity identity survives OS restarts.

## Integration Points

- `graph-ingestion/ingestion-pipeline.md`: calls `deduplicate_entity()` before all entity writes
- `knowledge-inference/contradiction-detector.md`: receives contradiction candidates from `merge_properties()`
- `graph-observability/integrity-validator.md`: validates no dangling alias pointers
- `graph-query-engine/semantic-search.md`: queries `id_to_labels` for alias-aware search
