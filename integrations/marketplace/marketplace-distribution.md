# Marketplace Distribution

## Role
Manages the installation, update, and removal of marketplace items in the OS environment. Handles dependency resolution, version compatibility checking, conflict detection, and rollback for marketplace items.

## Installation Protocol

```
INSTALL REQUEST: {item_id, version (optional), parameters (optional)}

STEP 1: COMPATIBILITY CHECK
  verify: item.os_version_minimum <= current_os_version
  verify: item.os_version_maximum >= current_os_version (if set)
  verify: no conflicts_with items currently installed

STEP 2: DEPENDENCY RESOLUTION
  FOR each required dependency:
    IF already installed at compatible version: skip
    IF not installed: queue for installation (recursive)
    IF version conflict: FAIL with conflict explanation

STEP 3: PERMISSION REVIEW
  IF item requires capabilities above caller tier: BLOCK + explain
  IF item touches regulated data: require compliance_reviewed = true

STEP 4: STAGING (24hr)
  deploy item to staging environment
  run item's example invocations
  verify no regression in related workflows

STEP 5: ACTIVATE
  deploy to production
  add to item-registry as ACTIVE
  notify requesting team with activation confirmation
```

## Update Management

```
UPDATE TYPES:
  PATCH update:  auto-apply if staging tests pass (no human required)
  MINOR update:  notify owner, apply after 48hr if no objection
  MAJOR update:  full install protocol (manual trigger required)

AUTO-UPDATE POLICY:
  OFFICIAL items:  auto-apply patch updates (security fixes always immediate)
  VERIFIED items:  notify + apply after 72hr if no objection
  COMMUNITY items: never auto-update; manual trigger only

BREAKING CHANGE HANDLING:
  IF MAJOR version: both versions installed side-by-side for 30d
  MIGRATION: operator must explicitly migrate to new version
  OLD version: deprecated after 30d; removed after 60d
```

## Dependency Graph Management

```
DEPENDENCY_GRAPH: maintained for all installed items
  nodes: installed marketplace items
  edges: depends_on relationships

ON REMOVAL REQUEST:
  check: any other installed item depends_on this item?
  IF yes: BLOCK removal until dependents updated or removed
  IF no: proceed with removal

CIRCULAR_DEPENDENCY: detected at install time; blocked with explanation

DEPENDENCY_HEALTH: weekly scan for items depending on deprecated versions
```

## Rollback Protocol

```
ROLLBACK WINDOW: 30 days after installation
ROLLBACK TRIGGER: manual request OR regression detected in dependent workflows

ROLLBACK STEPS:
  1. deactivate current version
  2. restore previous version from version-manager rollback_version
  3. re-run example invocations on restored version
  4. IF passes: activate restored version
  5. record rollback event to deployment-audit

POST-ROLLBACK: item flagged for investigation before re-installing current version
```

## Distribution Statistics
```yaml
distribution_stats:
  total_installed_items: number
  items_with_active_users: number
  avg_install_time_min: number      # target: < 30min for staging + activate
  auto_update_success_rate: number  # target: > 0.98
  rollback_rate_30d: number         # target: < 0.02
  dependency_resolution_failure_rate: number  # target: 0
```

## Persistence
`memory/workflow-marketplace/installed-items.yaml`
`memory/workflow-marketplace/dependency-graph.yaml`
`memory/workflow-marketplace/distribution-history.jsonl`
