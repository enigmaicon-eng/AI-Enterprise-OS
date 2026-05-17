# WF-001: Product Discovery

**Version:** 1.0.0 | **Owner:** Product Org | **Tier:** T2 | **Class:** STANDARD | **SLA:** 5 days

## Purpose
Transform a raw feature idea, customer request, or strategic bet into a validated, artifact-complete PRD with defined success metrics, scope, and acceptance criteria — ready to enter sprint planning.

## Inputs

```
REQUIRED:
  feature_request:      string — description of the opportunity or problem
  initiator_id:         string — T2+ team member or product agent
  priority:             P1 | P2 | P3 | P4

OPTIONAL:
  customer_evidence:    [string] — customer quotes, support tickets, NPS signals
  strategic_initiative: string — parent initiative or OKR this maps to
  target_segment:       string — customer segment affected
  preliminary_estimate: S | M | L | XL — rough size
```

## Outputs / Artifacts

```
PRIMARY:
  PRD:                  product-requirements-doc; wiki/product/prds/{feature_id}.md
  DISCOVERY_DECISION:   ADR-style decision record; wiki/decisions/{feature_id}-discovery.md

SECONDARY:
  RESEARCH_BRIEF:       synthesis of customer evidence and market context
  SCOPE_BOUNDARY:       explicit out-of-scope list
  SUCCESS_METRICS:      measurable KPIs + instrumentation plan
  DEPENDENCY_MAP:       upstream and downstream dependencies identified
```

## Lifecycle States

```
INITIATED
  │
  ▼
VALIDATING ──── [G-AUTH fails] ──→ REJECTED
  │
  ▼
DISCOVERY_RESEARCH ──── [no evidence found] ──→ RESEARCH_BLOCKED (wait for input)
  │
  ▼
PRD_DRAFTING
  │
  ▼
PRD_REVIEW ←─────────────────────────────────────────────────── (retry on G-QUALITY fail)
  │
  ▼
STAKEHOLDER_REVIEW ←──────────────────────────────────────────── (retry if comments)
  │
  ▼
APPROVAL_PENDING ──── [G-EXEC required for P1] ──→ PENDING_APPROVAL
  │
  ▼
COMPLETED ─── artifacts persisted ─── wiki updated ─── memory updated
  │
FAILED ─── rollback triggered
CANCELLED ─── partial artifacts marked INCOMPLETE
```

## Execution Graph

```
S-001  AUTH_CHECK          [GATE: G-AUTH]       Root
         ↓
S-002  CONTEXT_ASSEMBLY    [AGENT: pm-agent]    depends_on: S-001
         Pull: strategic_initiative, team_backlog, related_PRDs, customer_evidence
         ↓
S-003  MARKET_RESEARCH     [AGENT: research-agent]  depends_on: S-001 (parallel with S-002)
         Research: competitive landscape, user pain, analogous solutions
         ↓
S-004  OPPORTUNITY_FRAMING [AGENT: pm-agent]    depends_on: S-002, S-003
         Output: problem statement, user stories (3 min), hypothesis, risk factors
         ↓
S-005  SCOPE_DEFINITION    [AGENT: pm-agent]    depends_on: S-004
         Output: in-scope features, explicit out-of-scope, MVP vs. full vision
         ↓
S-006  METRICS_DESIGN      [AGENT: analytics-agent]  depends_on: S-004
         Output: primary KPI, guardrail metrics, instrumentation plan
         ↓
S-007  DEPENDENCY_SCAN     [AGENT: delivery-agent]   depends_on: S-005
         Output: upstream deps (APIs, data, infra), downstream consumers
         ↓
S-008  PRD_SYNTHESIS       [AGENT: pm-agent]    depends_on: S-005, S-006, S-007
         Output: full PRD draft (completeness target ≥ 0.85)
         ↓
S-009  QUALITY_GATE        [GATE: G-QUALITY]    depends_on: S-008
         Evaluator: OFFICIAL-EVAL-001 (PRD Quality Rubric)
         Pass: >= 0.80  |  Retry limit: 2  |  On fail: AGENT correction loop
         ↓
S-010  ARCH_COMPLEXITY_CHECK [DECISION]         depends_on: S-009
         IF scope includes new service OR data model change OR API contract → trigger WF-005
         IF AI/ML component present → flag for WF-006
         ↓
S-011  STAKEHOLDER_REVIEW  [HUMAN: T2+]         depends_on: S-010
         Reviewers: PM lead, engineering lead, design lead (if UX-impacting)
         SLA: 48hr  |  On timeout: ESCALATE to T3
         ↓
S-012  REVISION_LOOP       [AGENT: pm-agent]    depends_on: S-011 (conditional)
         Only if S-011 returns comments
         ↓
S-013  EXEC_APPROVAL       [GATE: G-EXEC]       depends_on: S-011 or S-012
         Required if: priority = P1 OR strategic_initiative is Q-level OKR
         Approver: T4 CPO or delegate  |  SLA: 4hr
         ↓
S-014  ARTIFACT_PERSIST    [INTEGRATION]        depends_on: S-013
         Write PRD to wiki; create Jira epic; tag with feature_id
         ↓
S-015  MEMORY_UPDATE       [SYSTEM]             depends_on: S-014
         Update: product backlog, initiative registry, dependency map
         ↓
S-016  COMPLETION_EVENT    [SYSTEM]             depends_on: S-015
         Emit: WF-001.completed; notify: engineering lead, design lead
```

## Approval Gates

```
G-AUTH:    initiator tier >= T2; feature not already in backlog (dedup check)
G-QUALITY: PRD scores >= 0.80 on OFFICIAL-EVAL-001; all required sections present
G-EXEC:    required for P1 or OKR-level features; T4 CPO; SLA 4hr; no delegation
```

## Routing Logic

```
PRIMARY AGENT:    pm-agent (orchestrates all steps)
RESEARCH:         research-agent (S-003; parallel with context assembly)
ANALYTICS:        analytics-agent (S-006; metrics design)
DELIVERY:         delivery-agent (S-007; dependency scan)
ESCALATION:       T3 PM lead (if stakeholder review deadlocked)
                  T4 CPO (P1 or OKR features)

DOWNSTREAM TRIGGERS:
  scope includes new service or API:  → trigger WF-005 (Architecture Review)
  AI/ML component detected:           → flag; WF-006 initiated after PRD approved
  cross-team dependencies found:      → trigger WF-016 (Dependency Coordination)
```

## Escalation Logic

```
TRIGGER                                ACTION                           SLA
────────────────────────────────────────────────────────────────────────────
G-QUALITY fails 2×                     Escalate to T3 PM lead          2hr response
Stakeholder review > 48hr no response  Escalate to T3 PM lead          4hr response
G-EXEC > 4hr no response (P1)          Escalate to T5 CPO              1hr response
Customer evidence conflict detected    Human review required; T3+       2hr
Strategic alignment unclear            T4 strategy review               24hr
```

## Governance Checkpoints

```
C-001: Human oversight — P1 PRDs require T4 exec approval
C-003: Artifact-first — PRD must exist before engineering begins
C-004: Preserve decisions — discovery decision record created for every feature
C-006: Privacy-first — PII scope must be declared in PRD if feature touches user data
EU AI Act: if AI feature, Article 13 transparency requirements flagged in PRD
```

## Observability

```
HEALTH METRICS:
  avg_prd_quality_score:      target >= 0.82
  first_pass_gate_rate:       target >= 0.70 (G-QUALITY passes on first attempt)
  avg_cycle_time_days:        target <= 5
  stakeholder_review_sla_pct: target >= 0.85 (reviews complete within 48hr)
  p1_approval_latency_hr:     target <= 3

SLA BREACH ALERTS:
  > 5 days total:    ALERT to T3 PM lead
  > 7 days total:    ESCALATE to T4 CPO; incident ticket created
```

## Telemetry Events

```
enterprise.workflows.WF-001.initiated      {feature_request_id, priority, initiator_id}
enterprise.workflows.WF-001.gate.G-AUTH    {result, tier_check}
enterprise.workflows.WF-001.gate.G-QUALITY {result, score, rubric_breakdown}
enterprise.workflows.WF-001.gate.G-EXEC    {result, approver, decision_notes}
enterprise.workflows.WF-001.escalated      {reason, from_tier, to_tier, timestamp}
enterprise.workflows.WF-001.completed      {prd_id, quality_score, cycle_time_hours}
enterprise.workflows.WF-001.sla_breached   {step_id, target_hr, actual_hr}
```

## Rollback System

```
ROLLBACK WINDOW: 7 days after COMPLETED
ROLLBACK TRIGGER: strategic pivot; duplicate PRD discovered; initiator revokes

ROLLBACK STEPS (reverse order):
  R-016: mark PRD as SUPERSEDED in wiki (with reason + timestamp)
  R-015: remove from initiative registry
  R-014: close Jira epic (link to superseded PRD)
  R-013: notify all stakeholders who received completion event

NON-REVERSIBLE: research brief and discovery insights retained (not deleted)
```

## Enterprise System Integrations

```
JIRA:        S-014 → create epic with PRD link; set priority; assign to PM
CONFLUENCE:  S-014 → create/update PRD page in Product/PRDs space
GITHUB:      if feature requires new repo → create repo skeleton (S-014)
SLACK:       S-016 → notify #product-discovery channel; tag reviewers
ANALYTICS:   S-006 → register success metrics in analytics platform
```

## Wiki Updates

```
wiki/product/prds/{feature_id}.md         ← full PRD artifact
wiki/product/backlog-decisions.md         ← append: feature_id, decision summary, date
wiki/decisions/{feature_id}-discovery.md  ← discovery decision record
```

## Memory Updates

```
memory/product/backlog.yaml              ← add feature with status APPROVED
memory/product/initiative-registry.yaml ← link feature to parent initiative
memory/org-intelligence/dependency-registry.yaml ← register any new dependencies
```
