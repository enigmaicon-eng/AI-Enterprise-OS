# Marketplace Governance

## Role
Maintains the quality, safety, and trustworthiness of the OS marketplace. Defines submission standards, review processes, quality monitoring, and enforcement mechanisms that keep the marketplace a reliable source of reusable OS components.

## Submission Requirements

### All Items
```
REQUIRED:
  ☐ Item schema complete (marketplace-model.md)
  ☐ README with purpose, use cases, requirements, usage examples
  ☐ At least one working usage example with expected output
  ☐ Author identity (team + individual)
  ☐ No hardcoded credentials, internal system references, or PII
```

### Workflow Templates
```
ADDITIONAL REQUIRED:
  ☐ Parameter definitions with types and validation
  ☐ Expected output schema
  ☐ At least 3 example invocations covering main use cases
  ☐ Edge cases documented ("this template is not suitable for X")
```

### Agent Blueprints
```
ADDITIONAL REQUIRED:
  ☐ Capability declaration matches extension-model contract
  ☐ Tier ceiling explicitly declared
  ☐ Security scan passed
  ☐ Evaluation rubric included
```

## Review Process by Tier

### COMMUNITY Review (self-service, 24hr automated check)
```
AUTOMATED CHECKS:
  - schema validation
  - no prohibited patterns (credentials, internal refs)
  - file size within limits
  - example invocations parse without errors

IF PASSES: listed as COMMUNITY within 24hr
IF FAILS: author notified with specific errors
```

### VERIFIED Review (governance team, 5-day SLA)
```
IN ADDITION TO COMMUNITY CHECKS:
  - security scan: capability over-declaration, data exfil patterns
  - usage quality check: review 5 production uses if available
  - documentation accuracy: spot-check examples work as documented
  - compliance check: flag if item touches regulated data

REVIEWER: marketplace governance team (rotating, T2-T3)
RESULT: VERIFIED badge + listing boost in search
```

### OFFICIAL Promotion (core team decision)
```
CRITERIA: automated checks pass + usage/rating thresholds met
PROCESS:
  1. OS core team nominates
  2. Original author notified; may transfer or co-maintain
  3. Core team takes on maintenance SLA (90-day update guarantee)
  4. Comprehensive documentation review + migration guides
```

## Ongoing Quality Monitoring

```
WEEKLY:
  - scan all COMMUNITY items for broken examples (OS API changes)
  - flag items with quality_gate_pass_rate < 0.70 (last 10 uses)
  - flag items not updated within 90 days of OS version change

MONTHLY:
  - rating anomaly detection (coordinated manipulation detection)
  - stale item scan (no uses in 90d → suggest deprecation to author)
  - top complaint review (items with recurring negative feedback)
```

## Enforcement Actions

```
ACTION              TRIGGER                                 REVERSIBILITY
──────────────────────────────────────────────────────────────────────────────
WARN                Minor quality issue or stale content    Author fixes; warning removed
DELIST              Quality below threshold or no response  Re-list after fix + re-review
SUSPEND             Security issue detected                 Re-list after security fix + scan
REMOVE              Malicious content or deliberate deception  Permanent; author blocked
```

## Marketplace Health Metrics
```yaml
marketplace_health:
  total_items: number
  official_pct: number          # target: > 10% of catalog
  verified_pct: number          # target: > 40% of catalog
  items_updated_last_90d_pct: number  # target: > 70%
  avg_quality_gate_pass_rate: number  # target: > 0.80
  avg_rating: number            # target: > 4.0
  security_incidents_30d: 0     # target: always 0
```

## Persistence
`memory/workflow-marketplace/governance-log.jsonl`
`memory/workflow-marketplace/review-queue.yaml`
