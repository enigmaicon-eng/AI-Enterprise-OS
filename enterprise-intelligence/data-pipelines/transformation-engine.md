# Transformation Engine

## Role
Provides the transformation primitives, AI-powered enrichment capabilities, and schema mapping tools that all data pipelines use to convert, enrich, and reshape data. Decouples transformation logic from pipeline orchestration so transformations are reusable, testable, and version-controlled.

## Transformation Types

```
TYPE              DESCRIPTION                                     AI-POWERED
────────────────────────────────────────────────────────────────────────────
SCHEMA_MAP        Field renaming, type casting, nesting changes    No
FILTER_ROWS       Predicate-based row filtering                    No
DERIVE_FIELD      Compute new field from existing fields           Optional
NORMALIZE         Standardize formats (dates, phone, address)      No
ENRICH            Augment with data from reference entities        No
CLASSIFY          Classify text, documents, or records by type     Yes (AI)
EXTRACT_ENTITIES  Extract named entities from unstructured text    Yes (AI)
SUMMARIZE         Generate summaries from long-form content        Yes (AI)
SCORE             Compute quality/risk/sentiment scores            Yes (AI)
TRANSLATE         Language translation for multilingual content    Yes (AI)
ANONYMIZE         PII removal/masking/pseudonymization             Yes (AI)
CUSTOM            Arbitrary Python/TS function via extension        Optional
```

## Transformation Definition Schema

```yaml
transformation:
  transform_id: string           # Unique; reusable across pipelines
  version: semver
  name: string
  type: TRANSFORMATION_TYPE
  
  ai_powered: boolean
  ai_config:
    model: claude-haiku-4-5-20251001    # default for transforms (cost-efficient)
    max_tokens: 2000
    tier_required: T2            # AI transforms require T2+
    quality_check: boolean       # validate AI output before writing
  
  input_schema_ref: schema_id
  output_schema_ref: schema_id
  
  definition:
    # Type-specific definition object
    # SCHEMA_MAP: {field_mappings: [{from, to, type_cast}]}
    # FILTER_ROWS: {predicate: expression}
    # DERIVE_FIELD: {output_field, expression}
    # CLASSIFY: {prompt_template, output_field, categories}
    # EXTRACT_ENTITIES: {entity_types, output_schema}
    # ANONYMIZE: {pii_fields, strategy: MASK|PSEUDONYMIZE|REMOVE}
  
  test_cases:
    - input: {}
      expected_output: {}
      description: string
  
  performance:
    avg_throughput_records_per_sec: number
    avg_latency_ms: number
    quality_score: number         # based on test case outcomes
```

## AI Transformation Governance

```
ALL AI-POWERED TRANSFORMATIONS:
  - Input/output schema enforced before AI call
  - Output quality gate: validates structure + spot-checks content
  - Hallucination check applied to EXTRACT + CLASSIFY + SUMMARIZE outputs
  - Transformation record logged (what AI did, to what data, confidence)

PII IN AI TRANSFORMATIONS:
  - RESTRICTED+ data: never sent to AI for CLASSIFY/SUMMARIZE/EXTRACT
  - PII fields: masked before AI sees them; unmasked after if ANONYMIZE
  - ANONYMIZE transform: the only transform that may receive and process PII directly
  - All AI-PII interactions: logged to data-access-audit.jsonl

QUALITY ASSURANCE:
  Every AI transformation: sampled 10% for human quality check (weekly batch)
  If sample quality < 0.80: transformation flagged for review; T3 notified
  If sample quality < 0.65: transformation suspended until improved
```

## Transformation Library (Built-in)

```
OFFICIAL TRANSFORMATIONS (OFFICIAL tier, pre-installed):
  XFORM-001: ISO Date Normalizer       — standardize date strings to ISO8601
  XFORM-002: Email Masker              — mask email to first@domain.*** format
  XFORM-003: Phone Normalizer          — standardize phone to E.164 format
  XFORM-004: Null Imputer              — fill nulls with field median/mode/default
  XFORM-005: JSON Flattener            — flatten nested JSON to flat schema
  XFORM-006: Text Summarizer (AI)      — 3-sentence summary of long text fields
  XFORM-007: Sentiment Scorer (AI)     — POSITIVE/NEUTRAL/NEGATIVE + confidence
  XFORM-008: Entity Extractor (AI)     — extract PERSON/ORG/LOCATION/DATE entities
  XFORM-009: PII Anonymizer (AI)       — detect + pseudonymize PII fields
  XFORM-010: Schema Version Migrator   — upgrade records from schema v(N) to v(N+1)
```

## Transformation Testing

```
TEST PROTOCOL (before activation):
  1. Unit tests: run all test_cases; 100% pass required
  2. Performance test: process 10K records; measure throughput + latency
  3. Quality test (AI transforms): evaluate 100-record sample; min score 0.85
  4. Schema compatibility: verify input/output schema compliance
  5. IF ANONYMIZE: verify no PII remains in output (dedicated PII scanner)
```

## Persistence
`memory/data-pipelines/transformation-library.yaml`
`memory/data-pipelines/transformation-execution-log.jsonl`
`memory/data-pipelines/ai-transform-quality-samples.yaml`
