# Decision Extractor
# Parses ADRs, constitutional articles, and governance policies into DECISION and POLICY entities

## Supported Source Directories

- `docs/decisions/` — Architectural Decision Records (ADR format)
- `constitution/` — Constitutional articles (POLICY, enforcement_level=ABSOLUTE)
- `docs/governance/` — Governance policy documents (POLICY, enforcement_level varies)

## ADR Parsing

ADRs follow a standard Markdown template:

```
# ADR-{number}: {title}

Status: {PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED}
Date: {YYYY-MM-DD}
Supersedes: ADR-{number}   (optional)
Affects: {comma-separated entity labels}  (optional)

## Context
...

## Decision
...

## Consequences
...
```

```python
def extract_adr(file_path: str) -> ExtractionResult:
    content = read_file(file_path)
    content_hash = sha256(content.encode()).hexdigest()
    if ingestion_pipeline.should_skip_ingestion(file_path, content_hash):
        return ExtractionResult(status="SKIPPED")

    parsed = parse_adr_markdown(content)
    decision = entity_resolution.deduplicate_entity(
        entity_type="DECISION",
        canonical_label=f"ADR-{parsed.number}: {parsed.title}",
        properties={
            "decision_type":    "ARCHITECTURAL",
            "status":           parsed.status,   # PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED
            "context_summary":  truncate(parsed.context, 500),
            "outcome":          truncate(parsed.decision, 500),
            "consequences":     truncate(parsed.consequences, 300),
            "decision_date":    parsed.date,
            "source_file":      file_path,
        },
        source="decision-extractor",
        confidence=0.95,
    )
    rel_count = DecisionRelationshipBuilder(decision, parsed).build_all()
    ingestion_pipeline.record_ingestion_complete(file_path, content_hash)
    return ExtractionResult(entities_upserted=1, relationships_upserted=rel_count)

class DecisionRelationshipBuilder:
    def __init__(self, decision: EntityVertex, parsed: ParsedADR):
        self.decision = decision
        self.parsed = parsed
        self.count = 0

    def build_all(self) -> int:
        self._link_supersedes()
        self._link_affected_entities()
        self._link_status_deprecation()
        return self.count

    def _link_supersedes(self):
        if not self.parsed.supersedes:
            return
        superseded = entity_resolution.resolve_entity(
            f"ADR-{self.parsed.supersedes}", "DECISION"
        )
        if superseded:
            create_relationship(self.decision.entity_id, superseded.entity_id, "SUPERSEDES",
                                confidence=1.0, source_type="EXPLICIT")
            # Auto-deprecate the superseded decision
            superseded.properties["status"] = "SUPERSEDED"
            superseded.metadata.updated_at = now()
            graph_mutation_pipeline.write_vertex(superseded)
            self.count += 1

    def _link_affected_entities(self):
        for label in self.parsed.affects:
            target = entity_resolution.resolve_entity(label.strip())
            if target:
                create_relationship(self.decision.entity_id, target.entity_id, "SUPPORTS",
                                    confidence=0.85, source_type="EXPLICIT")
                self.count += 1

    def _link_status_deprecation(self):
        if self.parsed.status in ("DEPRECATED", "SUPERSEDED"):
            self.decision.lifecycle.status = "DEPRECATED"
            self.decision.lifecycle.deprecated_reason = f"Status: {self.parsed.status}"
            graph_mutation_pipeline.write_vertex(self.decision)
```

## Constitutional Article Parsing

```python
def extract_constitutional_article(file_path: str) -> ExtractionResult:
    content = read_file(file_path)
    content_hash = sha256(content.encode()).hexdigest()
    if ingestion_pipeline.should_skip_ingestion(file_path, content_hash):
        return ExtractionResult(status="SKIPPED")

    articles = parse_constitutional_markdown(content)   # may contain multiple articles
    upserted = 0
    for article in articles:
        policy = entity_resolution.deduplicate_entity(
            entity_type="POLICY",
            canonical_label=f"Article {article.number}: {article.title}",
            properties={
                "policy_type":            "CONSTITUTIONAL",
                "scope":                  "UNIVERSAL",
                "enforcement_level":      "ABSOLUTE",
                "constitutional_article": article.number,
                "principle":              truncate(article.principle, 300),
                "source_file":            file_path,
            },
            source="decision-extractor",
            confidence=1.00,   # constitutional = fully authoritative
        )
        upserted += 1
        # Every constitutional policy governs all workflows and agents (universal scope)
        # This is represented as a graph annotation, not individual edges (too many)
        policy.properties["universal_scope"] = True
        graph_mutation_pipeline.write_vertex(policy)
    ingestion_pipeline.record_ingestion_complete(file_path, content_hash)
    return ExtractionResult(entities_upserted=upserted)
```

## Governance Policy Parsing

```python
ENFORCEMENT_LEVEL_MAP = {
    "absolute":   "ABSOLUTE",
    "mandatory":  "MANDATORY",
    "required":   "MANDATORY",
    "recommended":"ADVISORY",
    "advisory":   "ADVISORY",
    "optional":   "OPTIONAL",
}

def extract_governance_policy(file_path: str) -> ExtractionResult:
    content = read_file(file_path)
    content_hash = sha256(content.encode()).hexdigest()
    if ingestion_pipeline.should_skip_ingestion(file_path, content_hash):
        return ExtractionResult(status="SKIPPED")

    parsed = parse_policy_markdown(content)
    enforcement = ENFORCEMENT_LEVEL_MAP.get(
        parsed.enforcement_level.lower(), "MANDATORY"
    )
    policy = entity_resolution.deduplicate_entity(
        entity_type="POLICY",
        canonical_label=parsed.title,
        properties={
            "policy_type":       "GOVERNANCE",
            "scope":             parsed.scope,
            "enforcement_level": enforcement,
            "source_file":       file_path,
        },
        source="decision-extractor",
        confidence=0.95,
    )
    rel_count = 0
    for governed_entity_label in parsed.governs:
        target = entity_resolution.resolve_entity(governed_entity_label)
        if target:
            create_relationship(target.entity_id, policy.entity_id, "GOVERNED_BY",
                                confidence=0.90, source_type="EXPLICIT")
            rel_count += 1
    ingestion_pipeline.record_ingestion_complete(file_path, content_hash)
    return ExtractionResult(entities_upserted=1, relationships_upserted=rel_count)
```

## Batch Decision Extraction

```python
def extract_all_decisions() -> ExtractionResult:
    total = ExtractionResult()
    for f in glob_files("docs/decisions/*.md"):
        total.merge(extract_adr(f))
    for f in glob_files("constitution/*.md"):
        total.merge(extract_constitutional_article(f))
    for f in glob_files("docs/governance/*.md"):
        total.merge(extract_governance_policy(f))
    return total
```

## Integration Points

- `ingestion-pipeline.md`: INGESTION_PHASES["KNOWLEDGE"] includes decision-extractor
- `knowledge-inference/inference-rules.md`: R013 (POLICY_CONFLICT) operates on POLICY entities
- `graph-observability/coverage-analyzer.md`: counts ADRs on disk vs DECISION entities in graph
- `zero-trust/governance-attestation/`: constitutional policies are referenced for attestation validation
