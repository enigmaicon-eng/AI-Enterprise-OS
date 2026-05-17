# Skill Graph

## Role
Maintains a live, evidence-based map of skills and capabilities across all agents and human team members in the OS. Powers intelligent routing, gap detection, growth planning, and team formation recommendations. Built from declared capabilities + inferred evidence from actual work outcomes.

## Skill Taxonomy

```
SKILL DOMAIN          SUBDOMAINS (examples)
──────────────────────────────────────────────────────────────────────────────
PRODUCT               Discovery, PRD writing, roadmapping, stakeholder management, analytics
ENGINEERING           Frontend, backend, infrastructure, data engineering, security
ARCHITECTURE          System design, distributed systems, API design, cloud, performance
QA                    Test strategy, automation, exploratory, performance testing
DATA                  Analytics, ML, data pipelines, visualization, statistics
GOVERNANCE            Compliance, risk, policy, audit, regulatory
DELIVERY              Sprint facilitation, estimation, dependency management
DESIGN                UX research, interaction design, visual design, design systems
LEADERSHIP            Technical leadership, people management, strategy, hiring

SKILL LEVELS:
  NOVICE:       aware; learning; needs guidance
  PRACTITIONER: can do independently with occasional review
  EXPERT:       go-to person; produces high-quality output reliably
  AUTHORITY:    sets standards; mentors others; strategic contributor
```

## Skill Evidence Model

```yaml
skill_evidence:
  skill_id: string               # domain.subdomain.specific_skill
  agent_or_person_id: string
  
  declared_level: SKILL_LEVEL    # self-reported or formally assessed
  
  evidence:
    - type: WORKFLOW_OUTCOME | EVALUATION_SCORE | PEER_RECOGNITION | FORMAL_ASSESSMENT | CERTIFICATION
      timestamp: ISO8601
      workflow_run_id: string     # if WORKFLOW_OUTCOME
      quality_score: number       # evaluation score if applicable
      notes: string
  
  inferred_level: SKILL_LEVEL    # computed from evidence
  inferred_confidence: number    # 0.0–1.0 (how confident we are in inferred level)
  evidence_count: number
  last_evidence: ISO8601
  
  staleness:
    days_since_last_evidence: number
    FRESH: < 60 days; AGING: 60–180 days; STALE: > 180 days
    stale_skills: downgraded one level for routing purposes
```

## Skill Graph Construction

```
EVIDENCE SOURCES:
  WORKFLOW OUTCOMES:
    Agent or person completes workflow → quality_score evaluated
    IF quality_score >= 0.85 for skill-relevant workflow: +1 EXPERT evidence
    IF quality_score >= 0.70: +1 PRACTITIONER evidence
    IF quality_score < 0.60: -1 evidence (skill may be overstated)
  
  GATE PASS RATES:
    Gate pass rate for work type X: evidence for skill in X
    High pass rate → higher inferred level; low pass rate → lower
  
  PEER RECOGNITION:
    When reviewer marks work as "exemplary" or cites author expertise: +evidence
  
  FORMAL ASSESSMENT:
    skill-assessment outputs (agent-intelligence/capability-assessment.md): direct level setting
  
  DECLARATION:
    Agent or human declares skill level: treated as NOVICE evidence pending actual evidence
    Declaration without evidence: inferred_confidence = 0.40
    10 workflow outcomes: inferred_confidence = 0.85+
```

## Skill Graph Queries

```
WHO HAS SKILL X at level >= PRACTITIONER?
  → returns: agent/person list sorted by inferred_level DESC, inferred_confidence DESC

SKILL GAP: what skills does team T lack?
  → returns: skills required by team's workflow types with no EXPERT holder

SKILL CONCENTRATION: single point of failure detection
  → returns: skills where only 1 person is EXPERT (concentration risk)

GROWTH PATH: what skills should person P develop next?
  → returns: skills adjacent to current skills with highest strategic value

TEAM FORMATION: who can do project X (requires skills A, B, C)?
  → returns: optimal team composition with coverage + redundancy
```

## Persistence
`memory/people-intelligence/skill-graph.yaml`
`memory/people-intelligence/skill-evidence-log.jsonl`
`memory/people-intelligence/skill-gap-reports.yaml`
