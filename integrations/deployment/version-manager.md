# Version Manager

## Role
Manages semantic versioning for all OS components — agents, workflows, policies, extensions, and templates. Maintains the version registry, tracks compatibility, enforces the versioning contract, and enables point-in-time reconstruction of any prior OS state.

## Version Registry Schema

```yaml
version_record:
  component_id: string
  component_type: AGENT | WORKFLOW | POLICY | EXTENSION | TEMPLATE | CONNECTOR
  
  versions:
    - semver: string              # e.g. 1.4.2
      status: ACTIVE | STAGED | DEPRECATED | ARCHIVED
      deployed_at: ISO8601
      deployed_by: string
      
      changes:
        type: BREAKING | FEATURE | FIX | SECURITY | DEPRECATION
        summary: string
        breaking_changes: [string]    # if BREAKING: list of what changed
      
      compatibility:
        os_version_minimum: semver
        depends_on: [{component_id, version_range}]
        conflicts_with: [{component_id, version_range}]
      
      artifacts:
        definition_hash: sha256      # hash of component definition file
        test_suite_hash: sha256
        signed_by: string            # Ed25519 signature reference
  
  active_version: semver
  rollback_version: semver           # last known-good before current
```

## Versioning Rules

```
SEMANTIC VERSION MEANING:
  MAJOR (1.x.x → 2.x.x): breaking changes
    - agent: capability declaration changes, interface changes
    - workflow: input/output schema changes
    - policy: verdict logic changes that produce different outcomes for existing traffic
    - extension: API contract changes

  MINOR (1.4.x → 1.5.x): backward-compatible additions
    - new capabilities added
    - new workflow steps added (non-breaking)
    - new policy rules for previously uncovered cases

  PATCH (1.4.2 → 1.4.3): backward-compatible fixes
    - bug fixes, performance improvements
    - documentation updates
    - dependency security patches

ENFORCEMENT: automated semver validator blocks deployment if change type doesn't match version bump
```

## Multi-Version Operation

Support for running two versions simultaneously during rollout:

```
VERSION_ROUTING_MODES:
  SINGLE: all traffic → active_version
  CANARY: {canary_pct}% → new_version, remainder → active_version
  A_B: explicit routing rule determines version (for experiments)
  SHADOW: new_version receives copies but results discarded (validation only)

VERSION_PINNING:
  specific workflow_ids can be pinned to specific versions
  use case: testing against known-good version during regression investigation
```

## OS State Reconstruction

The version manager enables reconstruction of the exact OS configuration at any historical timestamp:

```
RECONSTRUCT_STATE(timestamp: ISO8601) → OS_STATE_SNAPSHOT:
  FOR each component:
    find: version active at timestamp
  ASSEMBLE: complete component version set
  VERIFY: sha256 hashes of all definitions
  RESULT: reproducible OS state record

USE CASES:
  - compliance audit ("what was deployed when incident occurred?")
  - regression root cause ("what changed between T1 and T2?")
  - governance replay (governance-policies/policy-replay-engine.md)
```

## Deprecation Management

```
DEPRECATION_PROCESS:
  1. mark version DEPRECATED (still active but flagged)
  2. emit deprecation_notice to all consumers (webhook + event bus)
  3. 30-day countdown: daily reminders
  4. day 30: ARCHIVED — component no longer invocable
  5. migration_guide published: how to move to replacement version
```

## Persistence
`memory/deployment-intelligence/version-registry.yaml`
`memory/deployment-intelligence/version-history.jsonl`
