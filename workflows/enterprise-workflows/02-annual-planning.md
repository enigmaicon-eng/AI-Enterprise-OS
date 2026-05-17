# WF-002: Annual Planning

**Version:** 1.0.0 | **Owner:** Product + Engineering Org | **Tier:** T4 | **Class:** ELEVATED | **SLA:** 30 days

## Purpose
Produce the organization's annual operating plan: strategic themes, OKRs for all teams, resource allocation decisions, capacity commitments, and initiative portfolio prioritization — approved by executive team and ready to cascade into quarterly planning cycles.

## Inputs

```
REQUIRED:
  fiscal_year:          string — e.g., "FY2027"
  ceo_strategic_brief:  string — top-level strategic direction from CEO/board
  prior_year_results:   artifact_id — last year's OKR outcomes + retrospective
  team_roster:          [team_id] — all teams participating in planning

OPTIONAL:
  market_analysis:      artifact_id — market intelligence report
  competitive_signals:  [string] — competitive landscape changes
  regulatory_calendar:  [compliance_event] — known regulatory deadlines
  board_directives:     [string] — explicit board-level requirements
```

## Outputs / Artifacts

```
PRIMARY:
  ANNUAL_PLAN:          wiki/strategy/annual-plans/{fiscal_year}.md
  OKR_REGISTRY:         structured OKR tree: company → org → team → individual
  RESOURCE_PLAN:        headcount, budget allocation by team and initiative
  INITIATIVE_PORTFOLIO: prioritized initiative list with owners + Q-targets

SECONDARY:
  STRATEGIC_THEMES:     2–5 themes that anchor the year's work
  DEPENDENCY_MAP:       cross-org initiative dependencies
  RISK_REGISTER:        top 10 planning-horizon risks with owners
  CAPACITY_MODEL:       aggregate capacity vs. committed initiative load
```

## Lifecycle States

```
INITIATED
  ↓
VALIDATING ──── [G-AUTH: T4 required] ──→ REJECTED
  ↓
STRATEGIC_INPUT_COLLECTION
  ↓
THEME_SYNTHESIS
  ↓
OKR_DRAFTING ←──────────────────── (iterate until alignment)
  ↓
CAPACITY_MODELING
  ↓
PORTFOLIO_PRIORITIZATION
  ↓
RISK_ASSESSMENT
  ↓
INTERNAL_REVIEW ──── [comments] ──→ OKR_REVISION
  ↓
EXECUTIVE_ALIGNMENT ←──────────── (T5 alignment session)
  ↓
BOARD_PRESENTATION_PREP (if board approval required)
  ↓
EXEC_APPROVAL ──── [G-EXEC] ──→ PENDING_APPROVAL
  ↓
CASCADE_PREPARATION ──── emit to all teams for quarterly adoption
  ↓
COMPLETED
```

## Execution Graph

```
S-001  AUTH_CHECK             [GATE: G-AUTH T4+]          Root
S-002  PRIOR_YEAR_ANALYSIS    [AGENT: analytics-agent]    depends_on: S-001
         Analyze: OKR completion rates, DORA trends, capacity utilization, team health
S-003  STRATEGIC_CONTEXT_PULL [AGENT: research-agent]     depends_on: S-001
         Pull: market analysis, board directives, regulatory calendar
S-004  THEME_SYNTHESIS        [AGENT: pm-agent]           depends_on: S-002, S-003
         Output: 2–5 strategic themes with rationale, each linked to CEO brief
S-005  OKR_TREE_CONSTRUCTION  [AGENT: pm-agent]           depends_on: S-004
         Build: Company OKRs → Org OKRs → Team OKRs (SMART, measurable)
         Constraint: each team ≤ 5 OKRs; each OKR ≤ 5 KRs
S-006  CAPACITY_MODEL         [AGENT: delivery-agent]     depends_on: S-005
         Input: team_roster, velocity records, capacity-intelligence-engine
         Output: total_available_capacity vs. OKR_load (points); gap analysis
S-007  PORTFOLIO_SCORING      [AGENT: pm-agent]           depends_on: S-005, S-006
         Score each initiative: strategic_fit × impact × feasibility / effort
         Output: priority-ranked initiative list; go/no-go / defer decisions
S-008  DEPENDENCY_MAPPING     [AGENT: delivery-agent]     depends_on: S-007
         Build: cross-org dependency graph for all approved initiatives
         Trigger: WF-016 for any critical-path cross-team dependency
S-009  RISK_ASSESSMENT        [AGENT: governance-agent]   depends_on: S-007
         Output: top 10 risks, owners, likelihood × impact matrix
S-010  RESOURCE_ALLOCATION    [AGENT: delivery-agent]     depends_on: S-006, S-007
         Output: headcount by team, budget by initiative, hiring plan
S-011  QUALITY_GATE           [GATE: G-QUALITY]           depends_on: S-005–S-010
         Check: all OKRs measurable, capacity model balanced, no orphan initiatives
         Pass: 0.85+  |  Retry: 1  |  On fail: T4 review session
S-012  INTERNAL_REVIEW        [HUMAN: T3+ all org leads]  depends_on: S-011
         Reviewers: all T3 org leads; 5-business-day review window
         On feedback: loop back to S-005 (OKR revision) up to 2 times
S-013  EXECUTIVE_ALIGNMENT    [HUMAN: T5 session]         depends_on: S-012
         Format: live alignment session (2hr); PM + Eng + Design + Governance
         Outcome: exec edits incorporated; verbal alignment captured in notes
S-014  EXEC_APPROVAL          [GATE: G-EXEC]              depends_on: S-013
         Approvers: T5 CPO + CTO synchronous sign-off
         Board approval: if resource_plan > board_threshold → board slide deck
         SLA: 48hr (annual plan requires deliberate review)
S-015  CASCADE_PACKAGE        [AGENT: delivery-agent]     depends_on: S-014
         Create: quarterly planning kickoff package for each team
         Include: team OKRs, resource allocation, priority initiatives, dependencies
S-016  ARTIFACT_PERSIST       [INTEGRATION]               depends_on: S-015
S-017  MEMORY_UPDATE          [SYSTEM]                    depends_on: S-016
S-018  COMPLETION_EVENT       [SYSTEM]                    depends_on: S-017
         Emit WF-002.completed; trigger: WF-003 queue for Q1 planning
```

## Approval Gates

```
G-AUTH:    initiator tier >= T4; fiscal year not already planned
G-QUALITY: OKR tree complete and measurable; capacity model balanced; all required artifacts present
G-EXEC:    T5 CPO + CTO synchronous approval; board approval if plan size warrants
```

## Routing Logic

```
ORCHESTRATOR:    pm-agent (primary)
ANALYTICS:       analytics-agent (prior year analysis, capacity modeling)
RESEARCH:        research-agent (market + competitive context)
DELIVERY:        delivery-agent (capacity, portfolio, dependency, cascade)
GOVERNANCE:      governance-agent (risk, compliance calendar)
ESCALATION:      T5 CEO for strategic theme disputes
DOWNSTREAM:      auto-triggers WF-003 (Quarterly Planning) for Q1 after completion
```

## Escalation Logic

```
TRIGGER                                   ACTION                        SLA
────────────────────────────────────────────────────────────────────────────────────────
OKR alignment deadlock (2+ orgs conflict) T5 CEO arbitration            24hr
Capacity gap > 30% of committed load      T4 workforce planning session  48hr
Regulatory deadline conflict identified   T4 DPO + CTO review           24hr
Board directive contradicts OKR           T5 escalation to CEO          4hr
G-EXEC > 48hr no response                 CEO notification              2hr
```

## Governance Checkpoints

```
C-001: Human oversight — T5 exec approval required
C-003: Artifact-first — annual plan document must exist before Q1 kickoff
C-004: Preserve decisions — portfolio prioritization decisions recorded in ADR
C-006: Privacy — any PII-touching initiative flagged for DPO review
EU AI Act: AI initiatives in plan reviewed for HIGH_RISK classification
BUDGET: resource allocation > board threshold → board notification
```

## Observability

```
HEALTH METRICS:
  planning_cycle_days:            target <= 30
  okr_coverage_pct:               target = 100% (all teams have OKRs)
  capacity_utilization_target:    target: 0.75–0.90
  strategic_alignment_score:      survey of T3+ post-session (target >= 4.0/5)
  initiative_feasibility_rate:    pct of initiatives with capacity backing target >= 0.90

SLA BREACHES:
  > 30 days: ALERT T5
  OKR coverage < 100% at cascade: BLOCK cascade until all teams have OKRs
```

## Telemetry Events

```
enterprise.workflows.WF-002.initiated       {fiscal_year, initiator_id}
enterprise.workflows.WF-002.gate.G-QUALITY  {result, coverage_pct, balance_score}
enterprise.workflows.WF-002.gate.G-EXEC     {result, approvers, board_required}
enterprise.workflows.WF-002.completed       {fiscal_year, team_count, initiative_count}
enterprise.workflows.WF-002.cascaded        {team_id, okr_count, capacity_hours}
```

## Rollback System

```
ROLLBACK WINDOW: 14 days (before Q1 sprint planning begins)
ROLLBACK TRIGGER: CEO strategic pivot; board rejection; material market change

ROLLBACK STEPS:
  R-016: mark annual plan SUPERSEDED; archive in wiki
  R-015: notify all T3 org leads of rollback and trigger date
  R-014: cancel cascade packages; clear Q1 kickoff queue
  R-013: schedule emergency re-planning (condensed 10-day protocol)
```

## Enterprise System Integrations

```
JIRA:        S-016 → create epics for each approved initiative; link to OKRs
CONFLUENCE:  S-016 → publish annual plan to Strategy space
SLACK:       S-018 → announce completion in #company-planning; notify all T3+
HR SYSTEM:   S-016 → submit hiring plan for approval and tracking
FINANCE:     S-016 → submit budget allocation for FY approval
```

## Wiki Updates

```
wiki/strategy/annual-plans/{fiscal_year}.md    ← full annual plan
wiki/strategy/okr-registry.md                 ← OKR tree (updated annually)
wiki/strategy/initiative-portfolio.md         ← approved initiative list
wiki/decisions/{fiscal_year}-planning.md      ← key planning decisions + rationale
```

## Memory Updates

```
memory/product/initiative-registry.yaml          ← all FY initiatives
memory/org-intelligence/org-performance-records.yaml ← planning targets set
memory/team-intelligence/capacity-forecasts.yaml ← annual capacity commitments
```
