# Extension Model

## Role
Defines what an OS extension is, what it can do, the permission boundaries it operates within, and the contract it must fulfill to participate in the OS ecosystem.

## Extension Types

```
TYPE                DESCRIPTION                                 CAPABILITY_CEILING
──────────────────────────────────────────────────────────────────────────────────────
AGENT_EXTENSION     New agent added to routing pool             T1-T2 tier max (external)
WORKFLOW_EXTENSION  New workflow definition                      STANDARD class max
CONNECTOR_EXTENSION New integration connector                   connector-permission-registry rules
KNOWLEDGE_EXTENSION New knowledge ingestion source              INTERNAL classification max
EVALUATION_EXTENSION New evaluation rubric or scoring model     can score; cannot block gates
TOOL_EXTENSION      New tool callable by agents                 declared capabilities only
TEMPLATE_EXTENSION  New artifact template                       no capability restrictions
```

## Extension Record Schema

```yaml
extension_record:
  extension_id: string            # ext_{type}_{slug}_{version}
  name: string
  type: string
  version: semver
  
  author:
    name: string
    organization: string
    contact: string
  
  capability_declaration:
    reads_classifications: [string]       # max INTERNAL for external extensions
    writes_to: [string]                   # explicit list of system areas
    calls_tools: [string]                 # tool names this extension may call
    emits_events: [string]                # event topics this extension publishes to
    requires_tiers: [string]              # minimum OS tier to invoke this extension
  
  resource_limits:
    max_tokens_per_invocation: number
    max_tool_calls_per_invocation: number
    max_execution_time_sec: number
    max_memory_kb: number
  
  governance:
    security_scan_passed: boolean
    security_scan_date: ISO8601
    review_status: PENDING | APPROVED | REJECTED | DEPRECATED
    approved_by: string
    approved_at: ISO8601
  
  runtime:
    isolation_level: STANDARD | ENHANCED    # external extensions: ENHANCED minimum
    sandbox_required: boolean
    audit_all_invocations: boolean          # always true for external extensions
  
  marketplace:
    listed: boolean
    downloads_total: number
    rating_avg: number
    tags: [string]
```

## Extension Contract

Every extension MUST:
1. Declare all capabilities at registration (no undeclared resource access)
2. Accept standard OS context envelope format
3. Return standard OS output envelope format
4. Not retain data beyond invocation (stateless unless explicitly permitted)
5. Honor cancellation signals within 5 seconds
6. Not directly invoke other extensions (must go through OS orchestrator)
7. Pass security scan before activation
8. Not claim T3+ tier authority (external extensions capped at T2)

## Versioning Contract
```
SEMVER: MAJOR.MINOR.PATCH
BREAKING CHANGE: major version bump required; existing installations warned
BACKWARD COMPATIBLE: minor/patch; existing installations auto-updated if compatibility confirmed
ROLLBACK: any extension can be rolled back to prior version within 30 days
```
