# Marketplace Catalog

## Role
Searchable, curated catalog of all marketplace items. Provides discovery, compatibility filtering, quality rankings, and direct install access for teams building on or with the OS.

## Starter Catalog (Official Items)

### Workflow Templates
```
OFFICIAL-WF-001: Feature Development Starter
  type: WORKFLOW_TEMPLATE
  summary: End-to-end feature workflow from discovery to release with all quality gates
  parameters: [feature_name, team_id, priority, target_sprint]
  quality_gate_pass_rate: 0.92  rating: 4.8/5  installs: 47

OFFICIAL-WF-002: Sprint Planning Assistant
  type: WORKFLOW_TEMPLATE
  summary: Sprint planning with backlog analysis, capacity calculation, and commitment
  parameters: [team_id, sprint_number, capacity_hours]
  quality_gate_pass_rate: 0.95  rating: 4.9/5  installs: 52

OFFICIAL-WF-003: Architecture Review Accelerator
  type: WORKFLOW_TEMPLATE
  summary: RFC/ADR review with stakeholder analysis, risk assessment, and decision record
  parameters: [rfc_id, decision_type, stakeholders]
  quality_gate_pass_rate: 0.89  rating: 4.7/5  installs: 31

OFFICIAL-WF-004: Incident Investigation Workflow
  type: WORKFLOW_TEMPLATE
  summary: Structured incident response: detect → triage → investigate → resolve → post-mortem
  parameters: [incident_description, severity, affected_systems]
  quality_gate_pass_rate: 0.94  rating: 4.8/5  installs: 28
```

### Evaluation Rubrics
```
OFFICIAL-EVAL-001: PRD Quality Rubric
  type: EVALUATION_RUBRIC
  summary: Scores PRDs on completeness, specificity, alignment, and testability
  installs: 62  rating: 4.9/5

OFFICIAL-EVAL-002: Code Review Rubric
  type: EVALUATION_RUBRIC
  summary: Scores code review outputs on coverage, accuracy, and actionability
  installs: 41  rating: 4.7/5
```

### Knowledge Packages
```
OFFICIAL-KP-001: Enterprise AI Governance Starter Pack
  type: KNOWLEDGE_PACKAGE
  summary: 50 curated knowledge units covering EU AI Act, AI governance frameworks, risk management
  installs: 38  rating: 4.8/5

OFFICIAL-KP-002: Engineering Best Practices Library
  type: KNOWLEDGE_PACKAGE
  summary: 100+ engineering patterns, anti-patterns, and architectural principles
  installs: 55  rating: 4.6/5
```

## Catalog Search and Filters

```
SEARCH INTERFACE:
  GET /marketplace/catalog
  
  QUERY PARAMS:
    q:          full-text search (name, description, tags)
    type:       filter by item type
    tier:       COMMUNITY | VERIFIED | OFFICIAL
    tag:        filter by tag
    min_rating: minimum rating
    compatible: items compatible with current OS version
    installed:  show only installed items
    team:       show items from a specific team
  
  SORT:
    best_match:  relevance × quality × popularity (default)
    popular:     installs DESC
    rating:      rating DESC
    recent:      last_updated DESC
    quality:     quality_gate_pass_rate DESC
```

## Catalog Categories and Tag Taxonomy

```
PRIMARY TAGS:       product, engineering, qa, design, delivery, governance, compliance, research
FUNCTION TAGS:      planning, review, analysis, generation, monitoring, reporting, automation
DOMAIN TAGS:        ai, security, data, infrastructure, mobile, web, api
INTEGRATION TAGS:   jira, github, slack, salesforce, confluence, snowflake
```

## Catalog Update Cadence
- Real-time: new submissions and installs reflected immediately
- Hourly: quality metrics and usage stats refreshed
- Daily: ratings recalculated; featured items reviewed
- Weekly: category curation reviewed; stale items flagged

## Persistence
`memory/workflow-marketplace/catalog-index.yaml`
