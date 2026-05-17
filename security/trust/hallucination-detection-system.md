# Hallucination Detection System

## Role
Multi-signal detection system that identifies, classifies, and contains AI hallucinations in workflow outputs before they propagate to downstream agents, artifacts, or human decisions. Extends and coordinates the hallucination-containment system in runtime-isolation.

## Detection Signal Taxonomy

```
SIGNAL CLASS            DETECTION METHOD                        WEIGHT
────────────────────────────────────────────────────────────────────────────────
FACTUAL_UNSUPPORTED     claim made without traceable evidence   0.35
CITATION_PHANTOM        reference to source that does not exist 0.30
NUMERICAL_IMPLAUSIBILITY value outside plausible domain bounds  0.20
INTERNAL_CONTRADICTION  claim contradicts earlier claim in same output  0.10
KNOWN_ENTITY_CONFUSION  wrong attributes for known named entity  0.05
```

## Hallucination Risk Score

```
hallucination_risk = Σ(signal_weight × signal_present)

SEVERITY BANDS:
  NONE:      0.00-0.15   output appears grounded
  LOW:       0.16-0.30   minor unsupported claims; flag in confidence score
  MEDIUM:    0.31-0.50   significant unsupported content; require review
  HIGH:      0.51-0.70   quarantine output; do not pass downstream
  CRITICAL:  > 0.70      block + alert + T3 notification + do not act
```

## Detection Protocol

### Pre-Output Scan (runs on every agent output)
```
STEP 1: CLAIM EXTRACTION
  parse output → extract all factual claims, citations, numerical values

STEP 2: EVIDENCE GROUNDING CHECK
  FOR each claim:
    search: execution context + knowledge graph + wiki
    compute: support_score = max(matching_evidence_strength)
    IF support_score < 0.40: increment FACTUAL_UNSUPPORTED signal

STEP 3: CITATION VERIFICATION
  FOR each citation:
    lookup: knowledge-repository + graph-query-engine
    IF not found: increment CITATION_PHANTOM signal (weight 0.30)

STEP 4: NUMERICAL PLAUSIBILITY
  FOR each numerical value:
    compare: against domain bounds (loaded from knowledge graph)
    IF > 3σ from historical range: increment NUMERICAL_IMPLAUSIBILITY

STEP 5: COHERENCE CHECK
  scan: output for contradictory claim pairs
  IF contradiction detected: increment INTERNAL_CONTRADICTION

STEP 6: COMPUTE + ROUTE
  compute hallucination_risk_score
  route based on severity band
```

## Containment Actions

```
NONE/LOW:   attach hallucination_risk metadata to output; no action
MEDIUM:     flag to workflow-confidence-framework; surface to human reviewer
HIGH:       quarantine output; re-run with explicit grounding instruction
CRITICAL:   block output; prevent any downstream action; alert T3; log to immutable audit
```

## Hallucination Learning Loop
```
WHEN human reviewer corrects hallucinated output:
  record: (claim_type, agent_id, task_type, detection_method_that_missed)
  update: detection weight for missed signal
  feed to: agent-performance-coach (behavioral correction)
```

## Integration Points
- `runtime-isolation/hallucination-containment.md` — shares detection engine
- `trust/workflow-confidence-framework.md` — feeds hallucination_risk_score
- `knowledge-inference/contradiction-detector.md` — shares contradiction detection
- `audit-and-evidence/audit-trail-governance.md` — CRITICAL events logged

## Persistence
`memory/trust/hallucination-events.jsonl`
`memory/trust/hallucination-detection-stats.yaml`
