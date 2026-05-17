# Extension Catalog

## Role
Searchable, curated catalog of all active and available extensions for the OS. Provides discovery, compatibility checking, ratings, and install management.

## Catalog Entry Schema

```yaml
catalog_entry:
  extension_id: string
  name: string
  type: AGENT | WORKFLOW | CONNECTOR | KNOWLEDGE | EVALUATION | TOOL | TEMPLATE
  version: semver
  
  summary: string                   # 1-2 sentence description
  tags: [string]                    # searchable tags
  
  compatibility:
    os_version_minimum: semver
    os_version_maximum: semver       # null = no upper bound
    conflicts_with: [extension_id]
    requires: [extension_id]
  
  quality:
    security_scan_grade: A | B | C | D   # A=clean, D=minor issues accepted
    test_coverage_pct: number
    rating_avg: number               # 1.0-5.0 from user ratings
    rating_count: number
    downloads_total: number
    installs_active: number
  
  author:
    name: string
    organization: string
    verified: boolean                # organization identity verified
  
  support:
    docs_url: string
    issues_url: string
    last_updated: ISO8601
  
  install_status: NOT_INSTALLED | STAGED | ACTIVE | DEPRECATED
```

## Catalog Categories

```
PRODUCTIVITY
  - workflow templates for common patterns
  - document generation extensions
  - reporting extensions

INTELLIGENCE
  - domain-specific knowledge ingestion sources
  - specialized evaluation rubrics
  - domain-specific research agents

INTEGRATIONS
  - additional connector extensions
  - data source connectors
  - notification and alerting connectors

GOVERNANCE
  - compliance framework extensions
  - audit reporting extensions
  - regulatory update feed extensions

DEVELOPER TOOLS
  - SDK extension for new languages
  - debugging and trace tools
  - testing utilities
```

## Discovery API

```
SEARCH:
  GET /extensions/catalog?q={query}&type={type}&tag={tag}&min_rating={N}

FILTER OPTIONS:
  type:       AGENT | WORKFLOW | CONNECTOR | KNOWLEDGE | EVALUATION | TOOL | TEMPLATE
  tag:        any registered tag
  min_rating: 1.0-5.0
  os_version: returns compatible extensions for specified OS version
  status:     ACTIVE | DEPRECATED

SORT OPTIONS:
  popular:    by downloads_total DESC
  rating:     by rating_avg DESC
  recent:     by last_updated DESC
  relevant:   BM25 relevance to search query
```

## Featured Extensions
```
FEATURED_CRITERIA:
  - security_scan_grade = A
  - rating_avg >= 4.5
  - rating_count >= 10
  - author.verified = true
  - actively maintained (last_updated within 90d)

FEATURED_SLOTS: up to 6 extensions per category
FEATURED_REVIEW: monthly curation by extension governance team
```

## Extension Rating System
```
RATING:
  - 1-5 stars per extension per organization (one rating per org)
  - required: written review if rating <= 2 stars (helps author improve)
  - moderated: reviews that appear coordinated or inauthentic removed

QUALITY_SCORE = (
  security_scan_grade_score × 0.40
  + test_coverage_score     × 0.30
  + rating_avg_score        × 0.20
  + maintenance_score       × 0.10    # recency of updates
)
```

## Persistence
`memory/extension-registry/catalog.yaml`
