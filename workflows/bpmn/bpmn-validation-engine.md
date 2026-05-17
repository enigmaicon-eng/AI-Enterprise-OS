# BPMN Validation Engine

## Purpose
Validates BPMN process definitions before compilation and deployment. All validation is static (pre-runtime). A process that fails validation cannot be compiled by the BPMN Orchestration Bridge.

---

## Validation Levels

| Level | When Applied | Blocks Deployment? |
|---|---|---|
| SCHEMA | On file save | Yes — malformed BPMN cannot be stored |
| STRUCTURAL | On compile | Yes — invalid topology cannot execute |
| SEMANTIC | On compile | Yes — logical contradictions cannot execute |
| GOVERNANCE | On compile | Yes — policy violations cannot deploy |
| QUALITY | On review | No — warnings only, must be acknowledged |

---

## Schema Validation Rules (Level 1)

```yaml
rules:
  SCHEMA-001:
    description: All required fields present (id, name, type, documentation)
    severity: ERROR
  SCHEMA-002:
    description: element.id is unique within process scope
    severity: ERROR
  SCHEMA-003:
    description: timeout_ms is positive integer for all Service Tasks
    severity: ERROR
  SCHEMA-004:
    description: tier_required is integer 0–5
    severity: ERROR
  SCHEMA-005:
    description: error_codes follow ERR_DOMAIN_DESCRIPTION pattern
    severity: ERROR
  SCHEMA-006:
    description: governance.audit_level is one of NONE | STANDARD | ENHANCED
    severity: ERROR
```

---

## Structural Validation Rules (Level 2)

```yaml
rules:
  STRUCT-001:
    description: Process has exactly one Start Event
    severity: ERROR
    check: "count(elements where type==StartEvent) == 1"

  STRUCT-002:
    description: All flow objects reachable from Start Event via forward traversal
    severity: ERROR
    algorithm: BFS from Start Event; unreachable nodes = violation

  STRUCT-003:
    description: All End Events reachable from Start Event
    severity: ERROR
    check: "every End Event in forward-reachable set"

  STRUCT-004:
    description: No cycles in sequence flow (BPMN 2.0 acyclic requirement)
    algorithm: DFS cycle detection; exception for looping sub-processes with explicit loop marker

  STRUCT-005:
    description: Every parallel split (AND) has matching parallel join
    severity: ERROR
    algorithm: |
      For each AND-split node S with N outbound edges:
        trace each branch; they must converge at a single AND-join node J
        with exactly N inbound edges

  STRUCT-006:
    description: Exclusive gateways must have a default flow
    severity: ERROR
    check: "every XOR gateway has default_flow set"

  STRUCT-007:
    description: Message flows only cross pool boundaries
    severity: ERROR
    check: "source.pool != target.pool for all message flows"

  STRUCT-008:
    description: Error boundary events attached to exactly one activity
    severity: ERROR
```

---

## Semantic Validation Rules (Level 3)

```yaml
rules:
  SEM-001:
    description: XOR gateway conditions are mutually exclusive and cover all cases
    severity: WARNING   # hard to prove statically; flag for human review
    check: |
      Parse CEL expressions; detect obvious overlaps (same variable, different literal)

  SEM-002:
    description: Compensation handler exists for every Task inside a Transaction subprocess
    severity: ERROR
    check: |
      For each Transaction boundary:
        every Service/User Task must have compensation_handler reference
        referenced handler must exist in process

  SEM-003:
    description: Escalation events have reachable escalation target
    severity: ERROR
    check: |
      Escalation event must either:
        a) have parent process that catches it (boundary on subprocess), OR
        b) route to escalation-case-system.md via configured escalation tier

  SEM-004:
    description: Call Activity subprocess IDs exist in BPMN process catalog
    severity: ERROR
    check: "subprocess.id in bpmn-process-catalog.registered_processes"

  SEM-005:
    description: Business Rule Tasks reference existing decision model IDs
    severity: ERROR
    check: "decision_model_id in decision-models/decision-model-standard.catalog"

  SEM-006:
    description: Timer durations are valid ISO 8601 duration strings
    severity: ERROR
    pattern: "^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?$"
```

---

## Governance Validation Rules (Level 4)

```yaml
rules:
  GOV-001:
    description: User Tasks with tier_required > 2 have explicit escalation path
    severity: ERROR
    check: |
      For each UserTask where tier_required > 2:
        must have SLA timeout AND escalation_target defined

  GOV-002:
    description: Processes classified GOVERNANCE have audit_level ENHANCED
    severity: ERROR
    check: "if classification == GOVERNANCE then audit_level == ENHANCED"

  GOV-003:
    description: Constitutional_check processes include PROC-GOV-005 as subprocess
    severity: ERROR
    check: |
      if process.constitutional_check == true:
        PROC-GOV-005 must appear as Call Activity in process

  GOV-004:
    description: Service Tasks with trust_tier_min > 3 require explicit approval gate before execution
    severity: ERROR
    check: |
      For each ServiceTask where trust_tier_min > 3:
        immediately preceding element must be UserTask or BusinessRuleTask with tier >= trust_tier_min

  GOV-005:
    description: INCIDENT processes must have postmortem subprocess for P1/P2
    severity: WARNING
    check: |
      if classification == INCIDENT and severity in [P1, P2]:
        PROC-INCIDENT-003 must be reachable from all terminal paths

  GOV-006:
    description: No process may bypass constitutional review for ENTERPRISE complexity
    severity: ERROR
    check: |
      if complexity == ENTERPRISE:
        constitutional_check must be true
```

---

## Quality Rules (Level 5 — Warnings)

```yaml
rules:
  QUAL-001:
    description: All elements have non-generic documentation (> 20 characters)
    severity: WARNING

  QUAL-002:
    description: Naming conventions followed (bpmn-standards.md conventions table)
    severity: WARNING

  QUAL-003:
    description: Average path length > 20 nodes (complexity smell)
    severity: WARNING
    suggestion: "Consider extracting to Call Activities"

  QUAL-004:
    description: Process has no error codes defined
    severity: WARNING

  QUAL-005:
    description: Process owner org not registered in agents/
    severity: WARNING
```

---

## Validation Report Schema

```yaml
validation_report:
  process_id: "PROC-XXX-NNN"
  process_version: "1.0.0"
  validated_at: "ISO-8601"
  overall_result: PASS | FAIL | PASS_WITH_WARNINGS
  errors: []           # blocks compilation
  warnings: []         # requires acknowledgment
  quality_flags: []    # informational only
  acknowledged_warnings: []   # human-signed acknowledgments
  compiled_artifact_id: "dag-PROC-XXX-NNN-1.0.0"   # null if FAIL
```

---

## Validation Execution

```
validate(process_definition):
  errors = []
  warnings = []
  
  run_schema_validation()      → errors
  if errors: return FAIL early
  
  run_structural_validation()  → errors
  if errors: return FAIL early
  
  run_semantic_validation()    → errors + warnings
  run_governance_validation()  → errors
  if errors: return FAIL
  
  run_quality_checks()         → warnings
  
  if warnings and not all_acknowledged:
    return PASS_WITH_WARNINGS  # cannot deploy until acknowledged
  
  return PASS
```
