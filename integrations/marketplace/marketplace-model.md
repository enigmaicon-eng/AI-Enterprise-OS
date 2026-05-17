# Marketplace Model

## Role
Defines what a marketplace item is, the item schema, the types of assets available, and the contract governing marketplace participation. The marketplace enables teams and the broader organization to share and reuse validated workflows, agents, templates, and extensions.

## Marketplace Item Types

```
TYPE                    DESCRIPTION                                 REUSE_MECHANISM
──────────────────────────────────────────────────────────────────────────────────────
WORKFLOW_TEMPLATE       Parameterized workflow with fill-in slots   instantiate with parameters
AGENT_BLUEPRINT         Reusable agent definition                   register in agent-registry
EVALUATION_RUBRIC       Quality scoring template                    add to evaluation catalog
KNOWLEDGE_PACKAGE       Curated knowledge unit collection           import to knowledge-base
PROMPT_TEMPLATE         Structured prompt patterns with slots       use in agent context
EXTENSION_PACKAGE       Pre-configured OS extension                 install via extension-registry
INTEGRATION_RECIPE      Connector configuration + workflow bundle   configure + activate
PLAYBOOK_TEMPLATE       Operational playbook for common scenarios   adapt and adopt
```

## Marketplace Item Schema

```yaml
marketplace_item:
  item_id: string                 # mkt_{type}_{slug}_{version}
  type: string
  name: string
  version: semver
  
  description:
    summary: string               # 1-2 sentences
    use_cases: [string]           # when to use this
    outcomes: [string]            # what it produces
    requirements: [string]        # what you need to use it
  
  content:
    primary_artifact: string      # path to main file
    supporting_files: [string]
    parameters: [{name, type, required, description, default}]
  
  quality:
    proven_uses: number           # times successfully used in production
    quality_gate_pass_rate: number
    avg_output_quality_score: number
    rating_avg: number
    rating_count: number
  
  authorship:
    author: string
    org: string
    team: string
    created_at: ISO8601
    last_updated: ISO8601
  
  governance:
    review_status: COMMUNITY | VERIFIED | OFFICIAL
    security_reviewed: boolean
    compliance_reviewed: boolean    # for items touching regulated data
  
  licensing:
    type: INTERNAL_ONLY | SHARE_WITHIN_ORG | OPEN
    attribution_required: boolean
```

## Item Quality Tiers

```
COMMUNITY:  submitted by any team; not formally reviewed; use at own risk
VERIFIED:   reviewed by marketplace governance team; security scanned
OFFICIAL:   maintained by OS core team; highest quality guarantee; SLA for updates

PROMOTION CRITERIA:
  COMMUNITY → VERIFIED:
    - security scan passed
    - >= 5 successful production uses
    - rating_avg >= 4.0 with >= 3 ratings
    - governance team review

  VERIFIED → OFFICIAL:
    - > 50 production uses
    - rating_avg >= 4.5 with >= 20 ratings
    - adopted by OS core team for maintenance
    - comprehensive documentation + migration guides
```

## Parameterization Contract

```
PARAMETER_TYPES: STRING | INTEGER | BOOLEAN | ENUM | REFERENCE | TEMPLATE_SLOT

RESOLUTION AT INSTANTIATION:
  required parameters: must be provided; error if missing
  optional parameters: defaults applied if not provided
  reference parameters: resolved from OS context (e.g., "use active sprint ID")
  template_slot parameters: filled by AI at runtime from context

VALIDATION: all parameters validated against schema before execution begins
```

## Persistence
`memory/workflow-marketplace/item-registry.yaml`
