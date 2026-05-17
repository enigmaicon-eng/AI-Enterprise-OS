# Knowledge Concentration Detector

## Role
Identifies single points of failure in the organization's knowledge and capability landscape. Detects when critical skills, decisions, or processes are concentrated in a single person or team — creating bus-factor risk — and triggers knowledge transfer recommendations before the risk materializes.

## Concentration Risk Types

```
RISK TYPE               DESCRIPTION                                SEVERITY BASIS
──────────────────────────────────────────────────────────────────────────────────────
SKILL_MONOPOLY          Only 1 person holds EXPERT level for critical skill   CRITICAL
DECISION_MONOPOLY       One person makes 80%+ of decisions in a domain        HIGH
PROCESS_KNOWLEDGE       Undocumented process known only to 1 person           HIGH
CONNECTOR_DEPENDENCY    Only 1 person can operate a RESTRICTED+ connector      HIGH
ARCHITECTURE_AUTHORITY  1 person is sole architecture approver for domain      MEDIUM
WIKI_ORPHAN             Wiki sections with single author, not reviewed in 90d  MEDIUM
APPROVAL_BOTTLENECK     1 person handles 70%+ of T3+ approvals                 MEDIUM
```

## Detection Methods

```
SKILL_MONOPOLY DETECTION:
  skill_graph query: skills with expert_count == 1
  critical_skills: skills required by 3+ active workflows
  bus_factor = min(expert_count) for critical_skills
  IF bus_factor == 1: SKILL_MONOPOLY for that skill

DECISION_MONOPOLY DETECTION:
  From governance telemetry: decision count per person per domain (30d window)
  IF person X makes > 80% of decisions in domain D: flag
  IF person X is the only T3 in a subdomain: escalate

PROCESS_KNOWLEDGE DETECTION:
  Wiki pages with single author + age > 90 days + no co-contributors
  Workflows with no documented owner transfer protocol
  Runbooks edited by only 1 person in past 6 months

APPROVAL_BOTTLENECK:
  governance telemetry: approval distribution per approval type
  IF single approver handles > 70% of a category → concentration risk
```

## Concentration Risk Record

```yaml
concentration_risk:
  risk_id: string
  type: RISK_TYPE
  severity: CRITICAL | HIGH | MEDIUM | LOW
  
  affected_domain: string        # skill, workflow, process, approval type
  concentrated_in:
    type: PERSON | TEAM | AGENT
    id: string
    name: string
  
  bus_factor: number             # how many people can cover this; 1 = highest risk
  
  impact_if_unavailable:
    workflows_blocked: [workflow_id]
    decisions_blocked: [domain]
    estimated_recovery_time_days: number
  
  mitigation:
    status: OPEN | IN_PROGRESS | MITIGATED
    recommended_action: string
    deadline: ISO8601
    owner: string
```

## Knowledge Transfer Recommendations

```
SEVERITY ROUTING:
  CRITICAL bus_factor == 1 for critical_skill:
    → T3 alert immediately
    → Recommend: cross-training session scheduled within 14 days
    → Require: knowledge transfer article in wiki within 30 days
    → Track: completion on 30-day deadline

  HIGH decision or process monopoly:
    → T3 advisory
    → Recommend: documentation sprint + peer review
    → Target: reduce monopoly to < 60% of decisions
    → Track: 60-day review

  MEDIUM:
    → Add to team health report as improvement area
    → Recommend: wiki contribution goal for next sprint
```

## Bus Factor Dashboard

```
BUS FACTOR SUMMARY:
  Skills with bus_factor == 1: {N} ({N}% of critical skills)
  Decision monopolies: {N} domains
  Process knowledge orphans: {N} wiki pages
  Open knowledge transfer tasks: {N}
  
TREND:
  bus_factor improving (more cross-training happening): GREEN
  bus_factor stable: YELLOW
  bus_factor worsening (attrition without transfer): RED → CRITICAL alert
```

## Persistence
`memory/people-intelligence/concentration-risks.yaml`
`memory/people-intelligence/concentration-history.jsonl`
`memory/people-intelligence/knowledge-transfer-tasks.yaml`
