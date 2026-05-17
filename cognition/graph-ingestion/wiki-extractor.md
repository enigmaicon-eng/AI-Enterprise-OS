# Wiki Extractor
# Crawls the organizational wiki, extracts entities, cross-references, and knowledge relationships

## Extraction Strategy

Wiki pages are Markdown files. The extractor applies three layers of extraction:
1. **Structural**: Headers, file path, frontmatter → WIKI_PAGE entity and metadata
2. **Named Entity Recognition**: Header text + emphasized terms → candidate entity references
3. **Link extraction**: `[[explicit links]]` and standard Markdown links → REFERENCES / LINKS_TO edges

## Wiki Page Entity Extraction

```python
def extract_wiki_page(file_path: str) -> ExtractionResult:
    content = read_file(file_path)
    content_hash = sha256(content.encode()).hexdigest()

    if ingestion_pipeline.should_skip_ingestion(file_path, content_hash):
        return ExtractionResult(status="SKIPPED")

    parsed = parse_markdown(content)
    page_label = derive_page_label(file_path, parsed)

    wiki_page = entity_resolution.deduplicate_entity(
        entity_type="WIKI_PAGE",
        canonical_label=page_label,
        properties={
            "wiki_path":     file_path,
            "section":       extract_section(file_path),
            "content_hash":  content_hash,
            "word_count":    len(content.split()),
            "last_reviewed_by": parsed.frontmatter.get("reviewed_by"),
            "staleness_risk": "LOW",   # updated by staleness-detector
        },
        source="wiki-extractor",
        confidence=0.80,
    )
    rel_count = WikiRelationshipBuilder(wiki_page, parsed, file_path).build_all()
    ingestion_pipeline.record_ingestion_complete(file_path, content_hash)
    return ExtractionResult(entities_upserted=1, relationships_upserted=rel_count)

def derive_page_label(file_path: str, parsed: ParsedMarkdown) -> str:
    # Prefer first H1 heading; fallback to filename
    h1 = parsed.get_heading(level=1)
    if h1:
        return h1.strip()
    return path_to_label(file_path)   # e.g. wiki/agents/pm-org.md → "PM Org Agent Guide"

def extract_section(file_path: str) -> str:
    parts = file_path.replace("\\", "/").split("/")
    wiki_idx = parts.index("wiki") if "wiki" in parts else -1
    if wiki_idx >= 0 and len(parts) > wiki_idx + 1:
        return parts[wiki_idx + 1]
    return "root"
```

## Cross-Reference Extraction

```python
class WikiRelationshipBuilder:
    def __init__(self, page: EntityVertex, parsed: ParsedMarkdown, file_path: str):
        self.page = page
        self.parsed = parsed
        self.file_path = file_path
        self.count = 0

    def build_all(self) -> int:
        self._extract_explicit_links()
        self._extract_wiki_page_links()
        self._extract_ner_references()
        self._extract_decision_references()
        return self.count

    def _extract_explicit_links(self):
        # [[Entity Label]] syntax — high confidence, explicitly intended reference
        for link_text in self.parsed.extract_wiki_links():
            target = entity_resolution.resolve_entity(link_text)
            if target:
                create_relationship(self.page.entity_id, target.entity_id, "REFERENCES",
                                    confidence=0.85, source_type="EXPLICIT",
                                    properties={"link_type": "EXPLICIT"})
                self.count += 1
            else:
                # Register as a knowledge gap — referenced entity not in graph
                knowledge_gap_detector.log_missing_reference(
                    source_page=self.file_path,
                    referenced_label=link_text
                )

    def _extract_wiki_page_links(self):
        # Standard markdown [text](wiki/path.md) links between wiki pages
        for link in self.parsed.extract_markdown_links():
            if link.href.startswith("wiki/") or link.href.startswith("../"):
                target_path = normalize_wiki_path(self.file_path, link.href)
                target_page = entity_resolution.resolve_entity(target_path, "WIKI_PAGE")
                if target_page:
                    create_relationship(self.page.entity_id, target_page.entity_id, "LINKS_TO",
                                        confidence=0.75, source_type="EXPLICIT")
                    self.count += 1

    def _extract_ner_references(self):
        # Named entity recognition from section headers and bold terms
        candidate_labels = (
            self.parsed.get_all_headings(min_level=2) +
            self.parsed.extract_bold_terms()
        )
        for label in candidate_labels:
            # Only link if we find a high-confidence match (avoid false positives)
            target = entity_resolution.resolve_entity(label)
            if target and target.metadata.confidence_score >= 0.85:
                create_relationship(self.page.entity_id, target.entity_id, "REFERENCES",
                                    confidence=0.65, source_type="DERIVED",
                                    properties={"link_type": "NER"})
                self.count += 1

    def _extract_decision_references(self):
        # "See ADR-NNN" or "per ADR-NNN" patterns → REFERENCES Decision entity
        adr_refs = self.parsed.extract_adr_references()   # regex: ADR-\d+
        for adr_label in adr_refs:
            decision = entity_resolution.resolve_entity(adr_label, "DECISION")
            if decision:
                create_relationship(self.page.entity_id, decision.entity_id, "REFERENCES",
                                    confidence=0.80, source_type="EXPLICIT",
                                    properties={"link_type": "ADR_REFERENCE"})
                self.count += 1
```

## Primary Documentation Detection

When a wiki page's path pattern matches an entity type directory, it is tagged as
the primary documentation page for that entity:

```python
DOCUMENTATION_PATTERNS = {
    r"wiki/agents/(.+)\.md":      "AGENT",
    r"wiki/workflows/(.+)\.md":   "WORKFLOW",
    r"wiki/policies/(.+)\.md":    "POLICY",
    r"wiki/onboarding/(.+)\.md":  None,   # general — no primary doc
}

def detect_primary_documentation(page: EntityVertex, file_path: str):
    for pattern, entity_type in DOCUMENTATION_PATTERNS.items():
        match = re.match(pattern, file_path.replace("\\", "/"))
        if match and entity_type:
            subject_label = match.group(1).replace("-", " ").title()
            subject = entity_resolution.resolve_entity(subject_label, entity_type)
            if subject:
                create_relationship(page.entity_id, subject.entity_id, "DOCUMENTS",
                                    confidence=0.85, source_type="DERIVED")
```

## Batch Wiki Crawl

```python
def crawl_wiki(modified_since: ISO8601 = None) -> ExtractionResult:
    files = glob_files("wiki/**/*.md", modified_since=modified_since)
    total = ExtractionResult()
    for f in files:
        result = extract_wiki_page(f)
        if result.status != "SKIPPED":
            detect_primary_documentation(
                entity_resolution.resolve_entity(derive_page_label(f, parse_markdown(read_file(f))),
                                                  "WIKI_PAGE"),
                f
            )
        total.merge(result)
    return total
```

## Integration Points

- `ingestion-pipeline.md`: scheduled every 15 minutes, triggered by file modification mtime
- `knowledge-inference/inference-rules.md`: R014 (WIKI_STALENESS) uses wiki page updated_at vs entity updated_at
- `graph-observability/coverage-analyzer.md`: compares wiki page count in graph vs files on disk
- `graph-observability/knowledge-gap-detector.md`: receives missing reference logs from _extract_explicit_links
