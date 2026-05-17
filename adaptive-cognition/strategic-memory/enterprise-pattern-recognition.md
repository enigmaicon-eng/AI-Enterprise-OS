# Enterprise Pattern Recognition
**ID:** AC-SM-003 | **Tier:** T4 | **Class:** ELEVATED
**Owner:** Executive Org + Architecture Org | **Updated:** 2026-05-17

---

## Purpose

Identifies and encodes enterprise-wide behavioral and structural patterns — recurring dynamics in how the organization operates, adapts, and performs over extended time periods. Enterprise patterns are the highest-level organizational intelligence, visible only across the full operational history of the system.

---

## Enterprise Pattern Classes

```
ENTERPRISE PATTERN TAXONOMY:

  STRUCTURAL PATTERNS:
    How the organization tends to structure work, teams, and authority
    Example: "Cross-functional teams consistently outperform functional silos
              for discovery-phase work; functional specialization dominates
              in execution-phase work"

  ADAPTIVE PATTERNS:
    How the organization responds to new challenges or pressures
    Example: "When governance friction increases, the organization tends to
              create parallel informal processes — signal to simplify formal ones"

  FAILURE PATTERNS:
    Recurring modes of failure that appear despite interventions
    Example: "Late-stage specification ambiguity (FC-04) resurfaces every
              major platform transition — pre-transition spec reviews needed"

  CAPABILITY PATTERNS:
    Which capabilities emerge, plateau, or degrade over time
    Example: "Security review quality improves with each major compliance cycle;
              estimation accuracy improves slowly and degrades when teams turn over"

  CULTURAL PATTERNS:
    How decision-making norms and behavioral expectations evolve
    (Documented carefully; not used for individual evaluation)

  TECHNOLOGY PATTERNS:
    How the organization adopts, adapts, and retires technology
    Which technology adoption patterns have led to successful outcomes
```

---

## Pattern Recognition Engine

```
ENTERPRISE PATTERN DETECTION:

  DATA SOURCES:
    - Portfolio learning records (AC-SM-002) — supply quarterly pattern signals
    - Organizational learning records (AC-OL-001 through AC-OL-005)
    - Execution ledger statistical summaries (anonymized)
    - Quality gate analytics (aggregate, not individual)
    - Strategic decision archive (AC-SM-001 Layer 1)

  DETECTION THRESHOLD FOR ENTERPRISE-CLASS:
    Pattern must be:
      (a) visible across ≥ 2 complete annual planning cycles, OR
      (b) demonstrably present across ≥ 5 major delivery programs, OR
      (c) corroborated by ≥ 3 independent data sources

  PATTERN QUALITY CRITERIA:
    STABLE:        pattern has held for ≥ 12 consecutive months
    SIGNIFICANT:   effect size > 15% (practically meaningful, not just statistical)
    ACTIONABLE:    clear organizational response can be derived from the pattern
    HONEST:        includes counter-examples and known exceptions
```

---

## Enterprise Pattern Record Schema

```yaml
enterprise_pattern_record:
  pattern_id: EP-{YYYY}-{seq3}
  pattern_class: STRUCTURAL | ADAPTIVE | FAILURE | CAPABILITY | CULTURAL | TECHNOLOGY
  title: string
  description: string         # 3–6 sentences; complete and precise
  evidence_summary:
    time_range: ISO8601/ISO8601
    data_sources: [string, ...]
    corroboration_count: integer   # ≥ 3 required
  stability: EMERGING | STABLE | DEGRADING | CONTEXT_DEPENDENT
  effect_size: float
  implications:
    - implication: string
      confidence: float
  known_exceptions: [string, ...]
  organizational_response: string  # what should the org do given this pattern?
  pattern_owner: org_name
  confidence: float [0.75, 1.00]   # enterprise patterns require ≥ 0.75
  created: ISO8601
  last_reviewed: ISO8601
  status: ACTIVE | UNDER_REVIEW | ARCHIVED
```

---

## Pattern Library and Application

```
PATTERN LIBRARY ACCESS:

  WHO ACCESSES:
    Executive Org: all patterns for strategic context
    Strategy Org: all patterns for planning
    Architecture Org: STRUCTURAL + TECHNOLOGY + CAPABILITY patterns
    All orchestration-tier agents: FAILURE patterns (for risk mitigation)

  APPLICATION CONTEXTS:
    Annual planning: all relevant ACTIVE patterns surfaced
    Major program launches: FAILURE + STRUCTURAL patterns surfaced
    Governance design changes: ADAPTIVE + CULTURAL patterns surfaced
    Technology decisions: TECHNOLOGY + CAPABILITY patterns surfaced

PATTERN LIBRARY HEALTH:
  target: ≥ 1 active pattern per class after 24 months operation
  avg confidence: target > 0.80
  stale patterns (not reviewed in >18 months): target 0
```

---

## Pattern Evolution Tracking

```
PATTERNS CHANGE OVER TIME:

  A pattern is not necessarily permanent. Organizations learn and adapt.

  PATTERN EVOLUTION STATES:
    EMERGING:          recently identified; < 2 full cycles of evidence
    STABLE:            well-evidenced; > 12 months consistent
    DEGRADING:         pattern weakening; organization may be successfully adapting
    CONTEXT_DEPENDENT: pattern holds in some contexts but not others
    ARCHIVED:          pattern no longer active; preserved for historical record

  DEGRADATION AS SUCCESS SIGNAL:
    When a FAILURE or ADAPTIVE pattern transitions to DEGRADING, this may indicate
    the organization has successfully addressed the underlying dynamic.
    → Escalate to Executive Org as positive signal; document intervention that caused shift.

  SUCCESSION TRACKING:
    If a pattern is superseded by a new understanding:
      New pattern record references prior pattern as lineage_parent
      Prior pattern archived with reason and successor pointer
```

---

## Governance

- Enterprise pattern records require T4 Executive Org + Architecture Org approval
- Pattern library reviewed semi-annually by Executive Org
- Pattern records are permanent; archival with succession chain only
- Cultural patterns reviewed by HR/People function before activation to ensure appropriate framing
