# Artifact Extractor
# Extracts knowledge graph entities and relationships from workflow artifact events and artifact stores

## Extraction Sources

1. **Event stream** (real-time): subscribes to `runtime.workflow.lifecycle` for ARTIFACT_PRODUCED events
2. **Artifact store scan** (scheduled): crawls artifact metadata on ingestion pipeline schedule

## Artifact Entity Extraction

```python
def extract_artifact_from_event(event: EnterpriseEvent) -> ExtractionResult:
    if event.event_type != "ARTIFACT_PRODUCED":
        return ExtractionResult(entities_upserted=0, relationships_upserted=0)

    payload = event.payload
    # Register the artifact entity
    artifact = entity_resolution.deduplicate_entity(
        entity_type="ARTIFACT",
        canonical_label=f"{payload['artifact_type']}:{payload['artifact_id']}",
        properties={
            "artifact_type":    payload["artifact_type"],
            "schema_version":   payload.get("schema_version", "1.0"),
            "classification":   payload.get("classification", "INTERNAL"),
            "run_id":           payload.get("run_id"),
            "producing_agent_id": payload.get("agent_id"),
            "size_bytes":       payload.get("size_bytes"),
        },
        source="event-stream",
        confidence=0.95,
    )
    count = ArtifactRelationshipBuilder(artifact, payload).build_all()
    return ExtractionResult(entities_upserted=1, relationships_upserted=count)

class ArtifactRelationshipBuilder:
    def __init__(self, artifact: EntityVertex, payload: dict):
        self.artifact = artifact
        self.payload = payload
        self.count = 0

    def build_all(self) -> int:
        self._link_producing_run()
        self._link_producing_agent()
        self._link_producing_workflow()
        self._link_consuming_workflows()
        self._link_approval_if_attested()
        return self.count

    def _link_producing_run(self):
        run_id = self.payload.get("run_id")
        if not run_id:
            return
        run = entity_resolution.resolve_entity(run_id, "RUN")
        if run:
            create_relationship(run.entity_id, self.artifact.entity_id, "PRODUCES",
                                confidence=0.95, source_type="EXPLICIT")
            self.count += 1

    def _link_producing_agent(self):
        agent_id = self.payload.get("agent_id")
        if not agent_id:
            return
        agent = entity_resolution.resolve_entity(agent_id, "AGENT")
        if agent:
            create_relationship(agent.entity_id, self.artifact.entity_id, "PRODUCES",
                                confidence=0.90, source_type="EXPLICIT")
            self.count += 1

    def _link_producing_workflow(self):
        workflow_def = self.payload.get("workflow_definition_id")
        if not workflow_def:
            return
        workflow = entity_resolution.resolve_entity(workflow_def, "WORKFLOW")
        if workflow:
            create_relationship(workflow.entity_id, self.artifact.entity_id, "PRODUCES",
                                confidence=0.90, source_type="EXPLICIT")
            self.count += 1

    def _link_consuming_workflows(self):
        for consumer_id in self.payload.get("consumed_by_workflows", []):
            consumer = entity_resolution.resolve_entity(consumer_id, "WORKFLOW")
            if consumer:
                create_relationship(consumer.entity_id, self.artifact.entity_id, "CONSUMES",
                                    confidence=0.85, source_type="EXPLICIT")
                self.count += 1

    def _link_approval_if_attested(self):
        attestation = self.payload.get("attestation")
        if not attestation:
            return
        approval = entity_resolution.deduplicate_entity(
            entity_type="APPROVAL",
            canonical_label=f"APR:{attestation['approval_id']}",
            properties={
                "approver_id":   attestation["approver_id"],
                "subject_id":    self.artifact.entity_id,
                "subject_type":  "ARTIFACT",
                "authority_tier": attestation["authority_tier"],
                "outcome":       attestation["outcome"],
                "valid_until":   attestation.get("valid_until"),
            },
            source="event-stream",
            confidence=1.00,   # cryptographically attested
        )
        create_relationship(self.artifact.entity_id, approval.entity_id, "ATTESTED_BY",
                            confidence=1.00, source_type="EXPLICIT")
        self.count += 1
```

## Artifact Derivation Extraction

When an artifact is declared as derived from another artifact:

```python
def extract_artifact_derivation(source_artifact_id: str, derived_artifact_id: str,
                                 transformation: str):
    source = entity_resolution.resolve_entity(source_artifact_id, "ARTIFACT")
    derived = entity_resolution.resolve_entity(derived_artifact_id, "ARTIFACT")
    if not (source and derived):
        return
    create_relationship(
        derived.entity_id, source.entity_id, "DERIVED_FROM",
        weight=0.85, confidence=0.90, source_type="EXPLICIT",
        properties={"transformation": transformation}
    )
```

## Artifact Store Scan (Scheduled)

Complements event-driven extraction by scanning artifact metadata for artifacts that
arrived before the event consumer was active or that lacked event payloads:

```python
def scan_artifact_store() -> ExtractionResult:
    artifact_metadata_list = artifact_store.list_metadata(
        modified_since=ingestion_state.last_artifact_scan_at
    )
    total_entities = 0
    total_relations = 0
    for meta in artifact_metadata_list:
        content_hash = sha256(json_encode(meta).encode()).hexdigest()
        if ingestion_pipeline.should_skip_ingestion(meta["artifact_id"], content_hash):
            continue
        result = extract_artifact_from_metadata(meta)
        total_entities += result.entities_upserted
        total_relations += result.relationships_upserted
        ingestion_pipeline.record_ingestion_complete(meta["artifact_id"], content_hash)
    ingestion_state.last_artifact_scan_at = now()
    return ExtractionResult(entities_upserted=total_entities,
                            relationships_upserted=total_relations)
```

## Integration Points

- `enterprise-telemetry/enterprise-event-bus.md`: subscribes to `runtime.workflow.lifecycle` topic
- `event-stream-consumer.md`: delegates ARTIFACT_PRODUCED events to this extractor
- `knowledge-inference/inference-rules.md`: R012 (ORPHAN_ARTIFACT) fires when artifact has no PRODUCES edge
- `graph-observability/knowledge-gap-detector.md`: identifies UNLINKED_ARTIFACT gaps
