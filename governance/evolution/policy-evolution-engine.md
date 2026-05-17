# Policy Evolution Engine

## Role
Manages the lifecycle of governance policy evolution — from detecting the need for change, through impact analysis and safe migration, to activation and post-change monitoring. Ensures policies stay current with regulatory changes, operational learnings, and organizational evolution.

## Policy Change Triggers

```
TRIGGER_TYPE                    SOURCE                              URGENCY
──────────────────────────────────────────────────────────────────────────────────────
REGULATORY_UPDATE               regulatory-change-management.md     IMMINENT: 48hr | EMERGING: 30d
CONSTITUTIONAL_DRIFT            trust/constitutional-alignment-system  immediate assessment
OPERATIONAL_LEARNING            evaluation/governance-decision-evaluator  monthly cycle
COMPLIANCE_GAP                  audit-and-evidence/finding-management   per finding SLA
TECHNOLOGY_CHANGE               architecture ADR approved           assess within 14d
PERFORMANCE_OPTIMIZATION        governance-optimizer.md             monthly cycle
INCIDENT_POST_MORTEM            knowledge-capture/incident-lessons  within 5d of incident closure
ANNUAL_REVIEW                   scheduled                           annually for all policies
```

## Policy Evolution Protocol

### Phase 1: Change Assessment (T+0 to T+2d)
```
1. identify: which policy rule(s) need to change
2. determine: change_type = CLARIFICATION | THRESHOLD_ADJUSTMENT | NEW_RULE | DEPRECATION | MAJOR_REVISION
3. run: governance-policies/policy-impact-analyzer → affected workflows/agents/decisions
4. classify: risk = LOW | MEDIUM | HIGH | CRITICAL
5. assign: change owner (role + tier)
```

### Phase 2: Draft and Test (T+2d to T+7d)
```
1. draft: new policy version using policy-as-code/policy-language.md
2. run: policy-as-code/policy-testing-framework.md → full test suite
   - unit tests: all existing cases must pass
   - regression tests: existing verdicts preserved (unless intentionally changed)
   - new scenarios: cover the change reason
3. run: policy-as-code/policy-compiler.md → verify compiles cleanly
4. compute: decision_divergence = new_verdicts vs. old_verdicts for last 30d traffic
   - NEW_DENY > 5%: HIGH risk → T4 review mandatory
   - NEW_ALLOW > 10%: MEDIUM risk → T3 review
```

### Phase 3: Approval (T+7d to T+14d)
```
APPROVAL_MATRIX:
  CLARIFICATION:          T3 policy owner
  THRESHOLD_ADJUSTMENT:   T3 policy owner + domain expert
  NEW_RULE:               T4 governance lead + compliance officer
  MAJOR_REVISION:         T5 executive + compliance + security
  CONSTITUTIONAL_SCOPE:   T5 + board + independent review
```

### Phase 4: Activation and Monitoring (T+14d)
```
ACTIVATION OPTIONS:
  IMMEDIATE:    switch all traffic at once (LOW risk only)
  PHASED:       10% → 50% → 100% over 7 days
  SHADOW_FIRST: run in shadow mode 3d before activating

POST_ACTIVATION_MONITORING (30 days):
  - daily: compare key metrics to pre-change baseline
  - alert: if override_rate increases > 10% vs. pre-change
  - rollback_trigger: if governance_decision_quality drops > 0.05
```

## Policy Version Management
```yaml
policy_version_record:
  policy_id: string
  version: semver
  change_type: string
  change_reason: string
  approved_by: [string]
  activated_at: ISO8601
  decision_divergence_pct: number
  status: DRAFT | TESTING | APPROVED | ACTIVE | DEPRECATED | ARCHIVED
  superseded_by: string
  rollback_policy: string
```

## Persistence
`memory/governance-evolution/policy-evolution-log.jsonl`
`memory/governance-evolution/pending-policy-changes.yaml`
