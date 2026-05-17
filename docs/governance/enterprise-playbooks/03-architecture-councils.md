# PB-003: Architecture Councils

**Version:** 1.0.0 | **Owner:** Architecture Org | **Cadence:** Bi-weekly + On-demand | **Tier:** T3 | **Class:** ELEVATED

## Purpose
Govern all significant technical decisions through a structured council model — ensuring RFC/ADR quality, cross-system consistency, technical debt visibility, and binding architectural decisions with full traceability. The Architecture Council is the final arbiter of technical direction below the T5 CTO.

## Council Structure

```
COUNCIL TIER         AUTHORITY                               COMPOSITION
──────────────────────────────────────────────────────────────────────────────────────────
Principal Council    Binding decisions; all systems          3 Principal Architects (T4)
                     ADR approval                            + CTO (T5, chair)
                     Max scope: constitutional changes

Domain Council       Domain-scoped decisions                 Domain Architect (T3)
(per domain)         RFC review within domain                + 2 senior engineers
                     ADR recommendation (not binding)        + PM representative

Emergency Council    Urgent architecture decisions            CTO + 1 Principal Architect
                     (production impact; no time for full     (minimum quorum)
                     council cycle)                          Async decision permitted
```

### Domain Councils (active)
```
DOMAIN              DOMAIN ARCHITECT    SCOPE
───────────────────────────────────────────────────────────────────────────────────────────
Platform / Infra    T3 Arch             Kubernetes, databases, networking, cloud
AI / ML             T3 Arch             Model serving, AI pipelines, EU AI Act compliance
Data                T3 Arch             Data fabric, pipelines, schema governance
Security            T3 Arch + CISO      Auth, encryption, zero-trust, access control
API / Integration   T3 Arch             External APIs, integrations, contracts
Product Systems     T3 Arch             Core product services, business logic layers
```

---

## Bi-Weekly Architecture Council

**Cadence:** Every other Wednesday, 90 minutes
**Chair:** Principal Architect (rotating each session)
**Quorum:** 2 of 3 Principal Architects + CTO presence for constitutional decisions

### RFC/ADR Queue Management

**Intake (continuous)**
```
Submission channel: #architecture-rfc Slack + Jira ARCH project
PM-agent triages submissions daily:
  DOMAIN_REVIEW: domain council scope → route to domain council
  PRINCIPAL_REVIEW: cross-domain, constitutional, or high-risk → principal council queue
  EXPEDITE: production-blocking → emergency council
  DEFER: insufficient detail → return to submitter with feedback template
```

**Queue Priority**
```
P1 EXPEDITE:   Production blocking; security vulnerability; legal/compliance risk
P2 NEXT:       On critical delivery path (sprint-blocking within 2 weeks)
P3 SCHEDULED:  Important but not blocking; added to next available council slot
P4 DEFERRED:   Low urgency; backlogged; revisit when bandwidth available
```

### Council Session Agenda
```
TIME    TOPIC                                      OWNER              TYPE
──────────────────────────────────────────────────────────────────────────────────────────
0:00    Previous decisions — follow-up status      Chair              Accountability
0:10    RFC/ADR review: P1 items (max 2)           Submitter + Arch   Decision
0:40    RFC/ADR review: P2 items (max 2)           Submitter + Arch   Decision
1:10    Tech debt register: top 3 items review    Domain Architects   Visibility
1:20    Architectural drift alerts                 analytics-agent     Alert triage
1:25    Upcoming architecture dependencies        PM reps             Coordination
1:30    Close; action items                        Chair              -
```

### RFC Review Protocol

**Per RFC, the following must be evaluated:**
```
DIMENSION                           PASS CRITERIA
───────────────────────────────────────────────────────────────────────────────────────────
Problem statement                   Clear, bounded, validated (not solution-first)
Options considered                  ≥ 2 alternatives with trade-off analysis
Consistency                         Compatible with existing ADRs (no undeclared conflicts)
Scalability                         Works at 10× current load
Security posture                    No new attack surface; security arch consulted
Observability                       Metrics, tracing, alerting plan included
Operational burden                  Deployment, runbook, on-call impact assessed
Data governance                     Data classification and lineage plan
Rollback / reversibility            Can we undo this if it fails?
EU AI Act (if AI system)            Risk classification + compliance plan
```

### Decision Outcomes
```
OUTCOME         MEANING                                     NEXT STEP
───────────────────────────────────────────────────────────────────────────────────────────
APPROVED        RFC accepted; ADR created; proceed         → WF-005 step S-015 (publish ADR)
APPROVED_WITH   Approved with specific conditions          Conditions documented; re-review if not met
CONDITIONS
NEEDS_REVISION  Fundamental gaps; return to author         Feedback documented; re-submit in ≥ 1 sprint
REJECTED        Does not meet criteria; wrong approach     Rejection reason permanently recorded
DEFERRED        Correct idea; wrong time                   Defer date + trigger condition set
ESCALATED       Requires T5 CTO decision                   T5 brief prepared; 48hr decision SLA
```

### Vote Protocol (Principal Council)
```
MAJORITY:        2/3 Principal Architects for standard decisions
SUPERMAJORITY:   All 3 Principals + CTO for:
                   - Deprecation of existing systems
                   - New infrastructure tier additions
                   - Changes to core data models
                   - Constitutional-scope architectural changes

ABSTAIN allowed: with documented reason
DISSENT recorded: minority view permanently noted in ADR
EMERGENCY vote:  CTO + 1 Principal sufficient; full council post-review within 5 days
```

---

## Domain Council Cadence

**Cadence:** Monthly or on-demand when RFC queue has items
**Chair:** Domain Architect
**Format:** 60 min; informal but structured

```
AGENDA:
  0:00  Open RFCs in domain: status check
  0:15  In-scope RFC reviews (domain decisions only)
  0:45  Tech debt and drift: top 3 in domain
  0:55  Escalations to Principal Council
  0:60  Close
```

---

## Emergency Architecture Council

**Trigger:** Production architecture decision needed within 24hr (e.g., hotfix requiring architecture sign-off, security incident needing architecture guidance)

```
STEP    ACTION                                    OWNER              SLA
────────────────────────────────────────────────────────────────────────────────────────────
1       Declare emergency; post in #architecture  Requestor          Immediate
2       CTO + 1 Principal paged                   System             < 15 min
3       Brief prepared (< 1 page)                 Requestor + AI     < 30 min
4       Async review + vote via Slack thread       CTO + Principal    < 2 hr
5       Decision recorded in ADR (expedited)       Principal Arch     Same day
6       Full council post-review                   Full council       Next scheduled session
7       ADR amended if full council disagrees      Chair              At session
```

---

## ADR Lifecycle

```
DRAFT → PROPOSED → IN_REVIEW → APPROVED | REJECTED | DEFERRED
  → [APPROVED] ACTIVE
  → [time passes / system changes] SUPERSEDED (new ADR replaces)
  → [system decommissioned] DEPRECATED

ADR REQUIRED FOR:
  ✓ New persistent data stores
  ✓ New external service dependencies
  ✓ API contract changes (breaking or additive with impact)
  ✓ Significant algorithm or model changes
  ✓ Security architecture changes
  ✓ Deployment topology changes
  ✓ Any change affecting > 2 teams
  ✓ Any AI/ML system addition (+ EU AI Act classification)

ADR NOT REQUIRED FOR:
  ✗ Dependency version bumps (no API change)
  ✗ Bug fixes with no design change
  ✗ Configuration changes within existing architecture
  ✗ Internal refactors with no external interface change
```

### ADR Format (canonical)
```
# ADR-{NNN}: {Title}
Status: PROPOSED | APPROVED | SUPERSEDED
Date: ISO8601
Deciders: [names + tiers]
Related ADRs: [ADR-NNN list]

## Context
[Why does this decision need to be made now?]

## Options Considered
[≥ 2 options with trade-offs]

## Decision
[What was decided and why]

## Consequences
[What becomes easier; what becomes harder; what new risks are introduced]

## Compliance
[EU AI Act / GDPR / SOC2 considerations if applicable]
```

---

## Architectural Drift Detection

**Cadence:** Weekly (automated, analytics-agent)
**Alert channel:** #architecture-alerts

```
DRIFT DETECTION CHECKS:
  - Services bypassing API gateway (direct DB calls)
  - New external dependencies not in registry
  - Schema changes without ADR
  - AI models deployed without risk classification
  - Data flows not matching lineage graph
  - Security posture regressions (new open ports, deprecated auth)

ON DRIFT DETECTED:
  LOW (cosmetic):  Logged; reviewed at next bi-weekly council
  MEDIUM (policy): Domain council notified within 48hr; remediation plan in 1 sprint
  HIGH (critical): Principal council emergency session; T3 escalation; block deploys if needed
```

---

## Tech Debt Governance

**Register:** `wiki/architecture/tech-debt-register.md`
**Review:** Monthly in domain council; quarterly in principal council

```
TECH DEBT CLASSIFICATION:
  CRITICAL: Blocking reliability, security, or compliance → must be in next sprint
  HIGH:     Significant performance or maintainability risk → within 2 quarters
  MEDIUM:   Code quality, test coverage → quarterly allocation
  LOW:      Style, minor refactor → batch when opportunity arises

ALLOCATION RULE:
  >= 20% of engineering capacity reserved for tech debt (enforced in sprint planning PB-002)
  If critical debt accumulated > 3 items: CPO + CTO must negotiate scope relief
```

---

## Governance Checkpoints

```
C-001: Architecture decisions made by human architects; AI provides analysis, not verdicts
C-004: All ADRs permanently recorded; superseded ADRs retained with replacement reference
ADR_REQUIRED: No RFC-scope system change deployed without approved ADR
VOTE_RECORD: All council votes (including dissents) permanently recorded
EU_AI_ACT: Any AI system addition must include risk classification in ADR; no exceptions
EMERGENCY: Emergency council decisions must be reviewed by full council within 5 days
```

## Health Metrics

```
METRIC                                  TARGET
──────────────────────────────────────────────────────────────────────────────
RFC review cycle time (P2)              <= 2 council sessions (4 weeks)
ADR approval rate                       >= 0.75 (high reject = poor RFC quality)
ADR coverage (systems with ADR)         >= 0.90
Tech debt critical items open           target = 0
Architectural drift incidents/quarter  target < 3 HIGH severity
Council quorum rate                     >= 0.95 of scheduled sessions
Emergency council usage                 < 1/month (high = upstream planning failure)
```

## Workflow Integrations

```
WF-005  Architecture Review → council is the governance body for WF-005 gate G-ARCH
WF-006  AI Feature Delivery → all AI systems require domain council (AI/ML) review
WF-007  API Development     → API contract changes require arch council ADR
WF-010  Release Governance  → G-ARCH gate consults ADR status from council
WF-021  Workflow Optimization → tech debt register input; optimization recommendations
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
RFC written as rubber stamp (post-hoc)     Council becomes theatre; trust collapses
Emergency council used for poor planning   Real emergencies lose credibility
ADR not updated when system changes         ADR becomes misleading; drift undetected
Domain council decisions not escalated     Principal council misses cross-domain risks
Tech debt never addressed                  Reliability incidents; engineering morale drop
Council runs without quorum; decisions made Accountability unclear; decisions contested later
```
