# Knowledge Synthesizer
# Cross-domain knowledge synthesis — identifies undocumented patterns and proposes wiki updates

## Synthesis Architecture

The synthesizer runs after each inference cycle and after significant graph mutations.
It identifies clusters of related knowledge spanning multiple domains and produces
SynthesisArtifact records with wiki update proposals.

## Synthesis Target Selection

High-PageRank entities in multiple communities are the best synthesis targets —
they represent knowledge hubs that cross domain boundaries:

```python
def select_synthesis_targets(min_pagerank=0.70, cross_community=True) -> list[EntityVertex]:
    pagerank_scores = graph_analytics.compute_pagerank()
    community_map   = graph_analytics.detect_communities()

    # Find entities with high PageRank
    high_rank_ids = [eid for eid, score in pagerank_scores.items()
                     if score >= min_pagerank]

    if not cross_community:
        return [graph_store.get_vertex(eid) for eid in high_rank_ids]

    # Among those, prefer entities that bridge multiple communities
    multi_community_ids = []
    for eid in high_rank_ids:
        neighbors = get_neighbor_entity_ids(eid)
        neighbor_communities = {community_map.get(nbr) for nbr in neighbors}
        if len(neighbor_communities) >= 2:   # bridges at least 2 communities
            multi_community_ids.append(eid)

    return [graph_store.get_vertex(eid) for eid in multi_community_ids[:20]]   # top 20
```

## Synthesis Execution

```python
def synthesize_knowledge(target: EntityVertex) -> SynthesisArtifact | None:
    # Gather all knowledge connected to this target within 2 hops
    context_nodes = bfs_traverse(TraversalConfig(
        start_id=target.entity_id,
        max_depth=2,
        direction="both",
        min_confidence=0.65,
    )).hits

    if len(context_nodes) < 5:
        return None   # insufficient context for meaningful synthesis

    # Extract key findings by analyzing edge patterns
    key_findings = extract_key_findings(target, context_nodes)
    if not key_findings:
        return None

    # Identify evidence entities (high-confidence context nodes)
    evidence = [h.node for h in context_nodes
                if h.node.metadata.confidence_score >= 0.80][:10]

    # Check if a wiki page already documents this knowledge
    existing_docs = graph_store.get_in_edges(target.entity_id, ["DOCUMENTS"])
    wiki_gaps = identify_wiki_gaps(target, key_findings, existing_docs)

    synthesis = SynthesisArtifact(
        synthesis_id=f"SYN-{uuid4()}",
        target_entity_id=target.entity_id,
        target_label=target.canonical_label,
        key_findings=key_findings,
        evidence_entity_ids=[e.entity_id for e in evidence],
        confidence_score=mean([e.metadata.confidence_score for e in evidence]),
        wiki_gaps=wiki_gaps,
        recommended_wiki_updates=build_wiki_update_proposals(wiki_gaps, target, key_findings),
        synthesized_at=now(),
    )

    if synthesis.recommended_wiki_updates:
        publish_enterprise_event("telemetry.metrics", {
            "event_type": "KNOWLEDGE_SYNTHESIS_COMPLETE",
            "synthesis_id": synthesis.synthesis_id,
            "target": target.canonical_label,
            "findings_count": len(key_findings),
            "wiki_updates_proposed": len(synthesis.recommended_wiki_updates),
        })

    return synthesis

class SynthesisArtifact:
    synthesis_id: str
    target_entity_id: str
    target_label: str
    key_findings: list[str]            # human-readable findings
    evidence_entity_ids: list[str]     # entity_ids supporting findings
    confidence_score: float
    wiki_gaps: list[WikiGap]
    recommended_wiki_updates: list[WikiUpdateProposal]
    synthesized_at: ISO8601
```

## Key Finding Extraction

```python
def extract_key_findings(target: EntityVertex, context_hits: list[TraversalHit]) -> list[str]:
    findings = []
    node_types = Counter(h.node.entity_type for h in context_hits)

    # Pattern: agent delegates across trust tiers
    if target.entity_type == "AGENT":
        cross_tier_edges = [
            e for e in graph_store.get_out_edges(target.entity_id, ["TRUST_BOUNDARY_CROSSED"])
        ]
        if cross_tier_edges:
            findings.append(
                f"{target.canonical_label} crosses trust tier boundaries in "
                f"{len(cross_tier_edges)} delegation(s)"
            )

    # Pattern: workflow has multiple capability dependencies in same domain
    if target.entity_type == "WORKFLOW":
        cap_nodes = [h.node for h in context_hits if h.node.entity_type == "CAPABILITY"]
        domains = Counter(c.properties.get("capability_domain") for c in cap_nodes)
        for domain, count in domains.items():
            if count >= 3:
                findings.append(
                    f"{target.canonical_label} has strong dependency on "
                    f"{domain} domain ({count} capabilities)"
                )

    # Pattern: entity is referenced by multiple wiki pages (knowledge hub)
    wiki_refs = [h.node for h in context_hits if h.node.entity_type == "WIKI_PAGE"]
    if len(wiki_refs) >= 3:
        findings.append(
            f"{target.canonical_label} is a knowledge hub referenced by "
            f"{len(wiki_refs)} wiki pages"
        )

    # Pattern: multiple policies govern the same entity
    policy_edges = graph_store.get_out_edges(target.entity_id, ["GOVERNED_BY"])
    if len(policy_edges) >= 3:
        findings.append(
            f"{target.canonical_label} is subject to {len(policy_edges)} governance policies — "
            f"review for potential conflicts"
        )

    return findings
```

## Wiki Gap Identification

```python
def identify_wiki_gaps(target: EntityVertex, key_findings: list[str],
                        existing_docs: list[GraphEdge]) -> list[WikiGap]:
    gaps = []
    if not existing_docs:
        gaps.append(WikiGap(
            gap_type="NO_PRIMARY_DOCUMENTATION",
            entity_id=target.entity_id,
            description=f"{target.canonical_label} has no primary wiki documentation",
        ))
    if len(key_findings) > 0 and existing_docs:
        # Check if existing docs are fresh enough to cover new findings
        for doc_edge in existing_docs:
            doc = graph_store.get_vertex(doc_edge.source_id)
            if staleness_detector.is_stale(doc):
                gaps.append(WikiGap(
                    gap_type="STALE_DOCUMENTATION",
                    entity_id=doc.entity_id,
                    description=f"Primary doc for {target.canonical_label} may be stale",
                ))
    return gaps
```

## Wiki Update Proposals

```python
def build_wiki_update_proposals(gaps: list[WikiGap], target: EntityVertex,
                                  findings: list[str]) -> list[WikiUpdateProposal]:
    proposals = []
    for gap in gaps:
        if gap.gap_type == "NO_PRIMARY_DOCUMENTATION":
            proposals.append(WikiUpdateProposal(
                action="CREATE",
                suggested_path=f"wiki/{target.entity_type.lower()}s/{slugify(target.canonical_label)}.md",
                suggested_content_outline=[
                    f"# {target.canonical_label}",
                    "## Overview",
                    "## Key Relationships",
                ] + [f"- {f}" for f in findings],
                priority="MEDIUM",
            ))
        elif gap.gap_type == "STALE_DOCUMENTATION":
            proposals.append(WikiUpdateProposal(
                action="UPDATE",
                target_wiki_page_id=gap.entity_id,
                suggested_additions=findings,
                priority="LOW",
            ))
    return proposals
```

## Integration Points

- `inference-engine.md`: calls `synthesize_knowledge()` after each inference cycle for top-ranked targets
- `graph-query-engine/graph-analytics.md`: provides `compute_pagerank()` and `detect_communities()` for target selection
- `graph-observability/knowledge-gap-detector.md`: gap reports feed synthesis target selection
- `graph-ingestion/wiki-extractor.md`: wiki updates can be triggered by synthesis proposals
- `enterprise-telemetry/enterprise-event-bus.md`: publishes KNOWLEDGE_SYNTHESIS_COMPLETE to telemetry.metrics
