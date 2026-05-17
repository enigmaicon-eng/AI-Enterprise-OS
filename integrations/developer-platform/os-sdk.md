# Enterprise AI OS SDK

## Role
Programmatic interface for interacting with the Enterprise AI OS. Provides typed clients for workflow submission, agent invocation, knowledge queries, and event subscriptions. The SDK is the primary integration surface for external applications, automation pipelines, and internal tooling.

## SDK Surface

### Core Clients

```python
# Workflow client
sdk.workflows.submit(
    workflow_type: str,
    intent: str,
    context: dict,
    priority: Priority = Priority.NORMAL,
    initiator_tier: Tier = Tier.T1,
    callback_url: Optional[str] = None
) -> WorkflowHandle

sdk.workflows.status(workflow_id: str) -> WorkflowStatus
sdk.workflows.output(workflow_id: str) -> WorkflowOutput
sdk.workflows.cancel(workflow_id: str) -> CancelResult

# Knowledge client
sdk.knowledge.query(
    query: str,
    domains: List[str] = None,
    confidence_threshold: float = 0.60,
    max_results: int = 10
) -> KnowledgeResults

sdk.knowledge.retrieve(knowledge_unit_id: str) -> KnowledgeUnit
sdk.knowledge.submit(unit: KnowledgeUnit) -> SubmitResult

# Agent client
sdk.agents.invoke(
    agent_id: str,
    task: Task,
    context: Context
) -> AgentResponse

sdk.agents.discover(task_type: str, tier: Tier = None) -> List[AgentProfile]

# Events client
sdk.events.subscribe(
    topic: str,
    filter: EventFilter = None,
    handler: Callable
) -> Subscription

sdk.events.publish(topic: str, event: Event) -> PublishResult
```

## Authentication and Authorization

```
AUTHENTICATION:
  method: API_KEY | OAUTH2 | MTLS
  api_key_format: "osk_{env}_{base64_random_32}"
  oauth2_scopes: [workflows.read, workflows.write, knowledge.read, agents.invoke, events.subscribe]

AUTHORIZATION:
  every SDK call is evaluated against: permissions/workflow-permission-system.md
  caller_tier: derived from API key + calling context
  permission_ceiling: API key tier ceiling (configurable per key, max T3 for external callers)
```

## SDK Response Patterns

```python
# Synchronous (short workflows, < 30s)
result = sdk.workflows.submit(...).wait(timeout=30)

# Async with polling
handle = sdk.workflows.submit(...)
while not handle.is_complete():
    time.sleep(5)
result = handle.output()

# Async with webhook
handle = sdk.workflows.submit(..., callback_url="https://your-app/webhook")
# OS posts WorkflowCompletedEvent to callback_url when done

# Streaming (real-time step updates)
for update in sdk.workflows.stream(workflow_id):
    print(update.step, update.status)
```

## SDK Error Types
```
OSPermissionError:      caller lacks required tier or permission
OSRateLimitError:       API rate limit exceeded; includes retry_after header
OSWorkflowError:        workflow failed; includes failure_reason and recovery_hint
OSValidationError:      input failed schema validation; includes field-level errors
OSTimeoutError:         workflow exceeded timeout; state preserved for continuation
OSConstitutionalError:  request blocked by constitutional principle; includes principle_id
```

## Rate Limits (per API key)
```
T1 keys:  100 workflow submits/hr, 1000 knowledge queries/hr
T2 keys:  500 workflow submits/hr, 5000 knowledge queries/hr
T3 keys:  2000 workflow submits/hr, unlimited knowledge queries
```

## SDK Versions
```
Current: v1.0 (released 2026-05-15)
Language support: Python 3.10+, TypeScript 5+, Go 1.21+
OpenAPI spec: developer-platform/api-specification.md
```

## Persistence
`memory/developer-platform/api-keys.yaml`
`memory/developer-platform/sdk-usage-stats.yaml`
