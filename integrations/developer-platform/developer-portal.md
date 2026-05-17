# Developer Portal

## Role
Central resource hub for teams and individuals who build on, extend, or integrate with the Enterprise AI OS. Provides documentation, interactive tooling, onboarding paths, and feedback channels.

## Portal Sections

### 1. Quick Start
```
PATH A: "I want to submit a workflow via the API"
  → api-specification.md → os-sdk.md → first workflow example → live sandbox

PATH B: "I want to build an extension for the OS"
  → extension-registry/extension-model.md → extension-lifecycle.md → example extension

PATH C: "I want to use natural language to interact with the OS"
  → intent-interface.md → intent examples → shortcut cheatsheet

PATH D: "I want to query organizational knowledge"
  → os-sdk.md (knowledge client) → knowledge-base/knowledge-query-api.md

PATH E: "I want to subscribe to OS events"
  → api-specification.md (events) → enterprise-telemetry/ topic catalog
```

### 2. Reference Documentation
```
API Reference:        api-specification.md (auto-generated from OpenAPI spec)
SDK Reference:        os-sdk.md (language-specific API docs)
Workflow Catalog:     workflows/ (all workflow types, inputs, outputs)
Agent Catalog:        agents/MASTER-REGISTRY.md (all 144+ agents)
Event Bus Topics:     enterprise-telemetry/ (15 standard topics + custom)
Knowledge Schema:     knowledge-base/knowledge-model.md
Extension Guide:      extension-registry/extension-model.md
```

### 3. Interactive Sandbox
```
SANDBOX ENVIRONMENT:
  - isolated OS instance; no production data
  - pre-loaded with synthetic organizational data
  - full API access at T2 tier
  - workflow results returned in < 10s (simulated execution)
  - sandbox API key: issued on registration; 30-day TTL

SANDBOX TOOLS:
  - API Explorer: try any endpoint interactively
  - Intent Playground: test natural language inputs
  - Workflow Tracer: visual DAG of workflow execution
  - Event Monitor: real-time event stream viewer
```

### 4. Developer Onboarding Journey
```
WEEK 1: Core concepts
  Day 1: OS architecture overview (SYSTEM.md summary)
  Day 2: Authentication + first API call
  Day 3: Submit and monitor a workflow
  Day 4: Query knowledge base
  Day 5: Subscribe to events

WEEK 2: Building on the OS
  Day 6-7: Build a simple extension
  Day 8-9: Integration with external systems
  Day 10: Production readiness checklist
```

### 5. Developer Feedback and Support
```
CHANNELS:
  Bug reports:      GitHub Issues in os-extensions repo
  Feature requests: OS improvement proposal form → improvement-proposal-engine
  Questions:        #os-developers Slack channel
  Security issues:  security@enterprise.internal (private disclosure)

SLA:
  Critical bugs:    24hr acknowledgment
  Feature requests: 7-day triage
  Questions:        48hr response
```

### 6. Change Log and Announcements
```
API_CHANGELOG: tracked per version; breaking changes highlighted
DEPRECATION_NOTICES: 12 months advance notice
NEW_FEATURES: weekly developer digest
MIGRATION_GUIDES: published for each major version upgrade
```

## Developer Success Metrics
```yaml
portal_health:
  documentation_coverage_pct: number     # % of public API endpoints documented
  sandbox_uptime_pct: number             # target: 99%
  onboarding_completion_rate: number     # % of registered devs completing week 1
  time_to_first_successful_call_min: number  # target: < 15min
  developer_satisfaction_score: number   # quarterly survey, target: >= 4.0/5
```

## Persistence
`memory/developer-platform/portal-analytics.yaml`
