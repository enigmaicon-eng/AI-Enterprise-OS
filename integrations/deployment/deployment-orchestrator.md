# Deployment Orchestrator

## Role
Master controller for all OS component deployments: new agent versions, workflow definition updates, policy changes, extension installations, and infrastructure changes. Enforces the deployment pipeline, coordinates approvals, and maintains the deployment state machine.

## Deployment Types

```
DEPLOYMENT_TYPE         COMPONENT                           APPROVAL_CLASS
────────────────────────────────────────────────────────────────────────────────
AGENT_VERSION           Agent definition update             STANDARD (T3 review if T3+ agent)
WORKFLOW_DEFINITION     New or updated workflow             STANDARD
POLICY_ACTIVATION       New policy version goes live        Per policy-evolution-engine.md
EXTENSION_INSTALL       New extension activated             Per extension lifecycle
CONNECTOR_UPDATE        Integration connector update        T3 review + security scan
INFRASTRUCTURE_CHANGE   Worker pool, event bus config       T4 approval
CONSTITUTIONAL_CHANGE   OS core principles                  T5 + board (irreversible process)
```

## Deployment State Machine

```
PLANNED → VALIDATED → APPROVED → STAGED → CANARY → ROLLING_OUT → DEPLOYED
                                                              ↘ ROLLED_BACK
PLANNED → VALIDATION_FAILED (stays here; must fix before re-submitting)
STAGED  → STAGED_FAILED (staging regression detected)
CANARY  → CANARY_FAILED (canary metrics failed; auto-rollback)
```

## Deployment Pipeline Execution

### Phase 1: Validation (automated, < 5min)
```
1. schema validation: component definition is syntactically valid
2. dependency check: all declared dependencies present and compatible
3. conflict check: no active deployment for same component
4. test execution: component test suite passes
5. policy feasibility: policy-feasibility-checker for any permission changes
```

### Phase 2: Approval Gate
```
STANDARD: T2+ auto-approved if validation passed + no conflicts
ELEVATED: T3 review required (24hr SLA)
PRODUCTION: T4 sign-off (permissions/production-safety-system.md step 5)
CONSTITUTIONAL: T5 + board (non-automated)
```

### Phase 3: Staging (24hr minimum)
```
1. deploy to staging environment
2. run full integration test suite against staging
3. snapshot: record all baseline metrics before deployment
4. smoke test: validate component behaves as expected in context
5. IF any failure: STAGED_FAILED; block production promotion
```

### Phase 4: Canary
```
1. route {canary_pct}% of traffic to new version (default: 5%)
2. monitor for canary_duration (default: 30min)
3. compare: key metrics vs. pre-deployment baseline
4. IF metrics within tolerance: promote; IF not: auto-rollback
(see: deployment-intelligence/canary-intelligence.md)
```

### Phase 5: Full Rollout
```
1. increment traffic: 5% → 25% → 50% → 100% (per rollout-controller.md)
2. monitor continuously; auto-rollback if regression detected
3. on completion: DEPLOYED; record deployment to deployment-audit.md
```

## Deployment Record
```yaml
deployment_record:
  deployment_id: string
  deployment_type: string
  component_id: string
  from_version: semver
  to_version: semver
  initiated_by: string
  initiated_at: ISO8601
  
  phases_completed: [string]
  current_phase: string
  current_status: string
  
  approvals: [{approver, tier, decided_at, decision}]
  canary_metrics: {metric: {before, during, verdict}}
  
  deployed_at: ISO8601
  rollback_point: string
```

## Persistence
`memory/deployment-intelligence/active-deployments.yaml`
`memory/deployment-intelligence/deployment-history.jsonl`
