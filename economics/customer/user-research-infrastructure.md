# User Research Infrastructure
**ID:** CI-URX-001 | **Tier:** T2 | **Class:** STANDARD
**Owner:** UX Org + PM Org | **Updated:** 2026-05-16

---

## Purpose

Provides the systematic infrastructure for continuous qualitative user research. Quantitative signals (usage metrics, NPS) tell you WHAT customers do; user research tells you WHY. Without structured research infrastructure, qualitative insights are ad hoc, poorly documented, and never reach product decisions. This system makes user research a continuous, compounding organizational capability.

---

## Research Program Structure

```yaml
research_cadence:
  continuous:
    - Usability testing: 2 sessions per sprint (new features before ship)
    - Customer discovery calls: 4 per month (rotating segments)
    - Support ticket qualitative review: weekly (top 10 tickets per topic)
    
  monthly:
    - Segment deep-dive: 1 segment per month, 6-8 interviews
    - JTBD mapping update: new jobs discovered → JTBD framework update
    - Research synthesis: findings → actionable PM insights
    
  quarterly:
    - Annual customer advisory board: 10-15 customers, full-day session
    - Competitive experience audit: benchmark against top 3 competitors
    - Unmet needs analysis: cross-segment synthesis of qualitative findings
```

---

## Research Artifact Schema

Every research session produces a structured artifact:

```yaml
research_session:
  session_id: RS-{NNN}
  session_type: DISCOVERY | USABILITY | JTBD | ADVISORY | COMPETITIVE
  
  metadata:
    conducted_by: agent_id               # UX researcher agent
    conducted_at: ISO8601
    duration_minutes: number
    participant_segment_id: string
    participant_id_hash: string          # pseudonymized
    
  protocol:
    research_questions: [string]         # what we were trying to learn
    tasks_given: [string]               # for usability sessions
    stimuli_used: [string]              # prototypes, screenshots, etc.
    
  findings:
    key_observations: [string]           # what we observed
    quotes: [{text: string, context: string, sentiment: string}]
    jobs_discovered: [string]            # new JTBD identified
    pain_points: [{description: string, severity: LOW|MEDIUM|HIGH|CRITICAL}]
    mental_model_gaps: [string]         # where user model ≠ product model
    
  synthesis:
    key_insight: string                  # single most important finding (1 sentence)
    implications: [string]              # what this means for product
    confidence: LOW | MEDIUM | HIGH      # how confident in this insight
    
  routing:
    pm_tickets_created: [string]
    jtbd_updates: [string]
    knowledge_units_created: [string]
```

---

## JTBD (Jobs-to-be-Done) Framework

The JTBD library captures functional, emotional, and social jobs customers hire the product for:

```yaml
job_entry:
  jtbd_id: JTBD-{NNN}
  job_statement: string                  # "When [situation], I want to [motivation], so I [outcome]"
  
  job_type: FUNCTIONAL | EMOTIONAL | SOCIAL
  
  segments_with_job: [segment_id]
  frequency: RARE | OCCASIONAL | FREQUENT | CONSTANT
  importance: LOW | MEDIUM | HIGH | CRITICAL  # how important to the customer
  satisfaction: 0.00–1.00               # how well product satisfies this job
  
  evidence: [session_id]               # which research sessions surfaced this
  
  product_coverage:
    features_serving_job: [string]
    coverage_score: 0.00–1.00          # 1.0 = job fully served
    gaps: [string]                     # what's missing to fully serve the job
    
  priority_score:
    # High importance × low satisfaction = highest priority for product investment
    value = importance_score × (1 - satisfaction)
```

Current JTBD library stored at: `memory/customer-intelligence/jtbd-library.yaml`

---

## Research Repository

All research artifacts are stored and indexed for retrieval:

```
memory/customer-intelligence/research/
  sessions/
    RS-001.yaml
    RS-002.yaml
    ...
  syntheses/
    synthesis-2026-Q2.md              ← quarterly cross-session synthesis
    synthesis-2026-Q1.md
  jtbd-library.yaml                  ← live JTBD model
  research-calendar.yaml             ← upcoming + completed sessions
```

**Knowledge unit creation:** Key insights automatically proposed as KU entries in the knowledge base for retrieval by PM/UX agents in future sessions.

---

## Insight Routing

Research insights are not filed and forgotten:

```
On session completion:
  1. Key insight → PM Org inbox (daily digest)
  2. Pain points (HIGH/CRITICAL) → Engineering backlog ticket auto-created
  3. New JTBDs → JTBD library update + PM notification
  4. Mental model gaps → UX redesign trigger (if ≥ 3 participants have same gap)
  5. Segment churn signals → Customer twin update (churn_risk indicator)
  
On quarterly synthesis:
  1. Unmet needs → Roadmap planning session input
  2. JTBD priority scores → Portfolio strategy alignment review input
  3. Competitive insights → Competitive intelligence hub update
```

---

## Research Quality Standards

- **Sample size:** Minimum 5 participants per insight claim (usability: 3 is sufficient for major issues)
- **Participant diversity:** Research plan must represent all active segments proportionally
- **Confirmation bias prevention:** UX researcher should not conduct research on features they designed
- **Synthesis review:** All quarterly syntheses reviewed by PM Org lead before routing to roadmap

---

## Governance

**Session scheduling:** UX Org lead approves research calendar
**Participant recruitment:** CS Org nominates participants; UX Org confirms consent
**Data retention:** Session recordings (if any) deleted after synthesis (max 30 days); text artifacts 3 years
**PII:** Participant identities stored only with consent; pseudonymized in all artifact references
**JTBD library ownership:** PM Org + UX Org joint stewardship; changes require both to approve
