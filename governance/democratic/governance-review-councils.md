# Governance Review Councils
**ID:** DGV-GRC-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Establishes and operates the enterprise governance review councils — the standing deliberative bodies that provide ongoing human oversight, cross-functional challenge, and democratic accountability for AI governance decisions. Councils are not rubber-stamp bodies; they are constituted with genuine authority to challenge, delay, or block governance decisions, surface systemic concerns, and require remediation. Their legitimacy derives from their constitution (who sits on them), their process (how they deliberate), and their independence (their freedom to reach inconvenient conclusions).

---

## Council Structure

```yaml
council_structure:

  AI_GOVERNANCE_REVIEW_COUNCIL:
    purpose: primary governance oversight body for AI policy, deployments, and operations
    composition:
      total_seats: 9
      seats:
        - employee_representatives: 3  # T2 representatives from major domains
        - independent_members:     2  # External; no employment relationship with org
        - governance_specialists:   2  # Governance Org; non-voting on employee matters
        - hr_representative:        1  # HR Org; non-voting on governance matters
        - executive_sponsor:        1  # T4; non-voting (except tie-breaking)
    human_majority: required; AI systems never hold seats
    quorum: 6 of 9 members
    meeting_frequency: monthly (routine); emergency sessions as required
    authorities:
      - approve or block major AI system deployments (> SIGNIFICANT impact)
      - require governance audits for identified concerns
      - publish independent governance assessments
      - recommend constitutional review to T5
      - approve exceptions to standard governance processes (require 2/3 majority)
    
  CONSTITUTIONAL_REVIEW_COMMITTEE:
    purpose: specialized body for constitutional matters; amendment deliberations
    composition:
      total_seats: 7
      seats:
        - enterprise_representatives: 3  # T3 employee representatives
        - independent_constitutional_experts: 2  # External; constitutional law or governance
        - governance_org:               1  # Non-voting
        - employee_advocate:            1  # Voting
    quorum: 5 of 7 members
    convened_by: T5 request; constitutional amendment proposal; L3 appeal escalation
    authorities:
      - deliberate constitutional amendments (cannot ratify; recommends to general vote)
      - adjudicate constitutional interpretation disputes
      - issue constitutional compliance findings
      - require T5 justification for any T5 authority exercise affecting constitutional principles
    
  AI_ETHICS_ADVISORY_COUNCIL:
    purpose: advisory body for ethics, fairness, and societal impact considerations
    composition:
      total_seats: 7
      seats:
        - external_ethics_experts:  3  # Academia or civil society; rotating
        - employee_representatives: 2  # From employee group with AI ethics concerns
        - technical_specialists:    1  # AI safety specialist; non-voting
        - governance_liaison:       1  # Non-voting
    advisory_only: true
    # Recommendations must be addressed by AI Governance Review Council within 30 days
    meeting_frequency: quarterly; extraordinary sessions at council or T4 request
```

---

## Council Deliberation Standards

```yaml
council_deliberation_standards:

  PREPARATION_STANDARD:
    # Materials distributed minimum 7 days before session
    required_materials:
      - full decision package (data, recommendations, alternatives, risks)
      - AI analysis clearly labeled as AI-generated with confidence scores
      - minority analysis if any member requests it
      - comparable prior decisions with outcomes
    prohibited: distributing materials day-of except for genuine emergency sessions

  DELIBERATION_STANDARD:
    required_elements:
      - each substantive agenda item: minimum 20 minutes discussion
      - dissent recorded: any member may record dissent with brief rationale
      - independent analysis: council conclusions must not simply restate AI recommendations
      - conflict declarations: before any vote, members must declare conflicts
    ai_role: AI may provide analytical support; may not facilitate deliberation
    
  DECISION_STANDARD:
    routine_decisions:   simple majority (5 of 9 for AI Governance Review Council)
    significant_decisions: two-thirds majority (6 of 9)
    # Significant: new AI system deployment; governance exception; emergency measure
    constitutional_matters: unanimous or near-unanimous (see constitutional-amendment-systems.md)
    
  INDEPENDENCE_STANDARD:
    executive_attendance: executive sponsor is non-voting; may not attend deliberation portions
    AI_attendance: AI participation requires full council consent; advisory only
    minimum_independent_content: >= 30% of council deliberation content must originate
                                  from non-organizational members
```

---

## Council Operations

```
run_council_session(council, agenda):

  session = CouncilSession {
    id:          "CSN-{NNN}",
    council_id:  council.id,
    agenda:      agenda,
    date:        agenda.scheduled_date,
    attendees:   [],
    decisions:   [],
    dissents:    [],
    state:       SCHEDULED
  }

  # Quorum check
  if not meets_quorum(council, session.attendees):
    reschedule_session(session)
    Return: RESCHEDULED

  session.state = IN_SESSION

  for item in agenda.items:

    # Conflict check
    conflicts = check_member_conflicts(item, session.attendees)
    for conflict in conflicts:
      record_conflict(session, conflict)
      recuse_conflicted_member_from_vote(conflict.member, item)

    # Deliberation (human-led)
    deliberation = conduct_item_deliberation(item, session.attendees, min_time=20_minutes)
    session.deliberation_records.append(deliberation)

    # Record dissents
    dissents = collect_dissents(item, session.attendees)
    session.dissents.extend(dissents)

    # Vote
    vote = conduct_vote(item, eligible_voters(session.attendees))
    decision = CouncilDecision {
      item_id:         item.id,
      outcome:         vote.outcome,
      vote_tally:      vote.tally,
      dissents:        dissents,
      decision_rationale: summarize_deliberation(deliberation)
    }
    session.decisions.append(decision)

  session.state = CLOSED

  # Publish (no cherry-picking)
  session_record = CouncilSessionRecord {
    session:   session,
    published_at: now()
  }
  publish_to_governance_register(session_record)

  audit_log(session_record)
  Return: session_record
```

---

## Council Independence Protections

```yaml
council_independence_protections:

  EXECUTIVE_LIMITATION:
    rule: executive sponsor holds no vote on substantive decisions
    rule: executive sponsor may not attend closed deliberation sessions
    rule: executive sponsor may not review decision documents before they are finalized
    enforcement: session facilitator enforces; any violation invalidates session

  EXTERNAL_MEMBER_INDEPENDENCE:
    rule: external members may not be employed by organization or material suppliers
    rule: external members serve fixed terms (3 years max) with no renewals
    rule: external members have access to all governance data for their council scope
    compensation: fixed; not performance-linked; not revocable for inconvenient findings

  FINDING_PROTECTION:
    rule: council findings are published as written; governance bodies may not edit
          or delay publication of council findings they disagree with
    rule: governance responses to council findings are published alongside findings
    rule: council may publish addendum if organizational response is inadequate

  AI_INFLUENCE_LIMITS:
    rule: AI-generated content presented to council must be clearly labeled
    rule: council may not delegate deliberation to AI systems
    rule: council deliberation minutes may not be AI-generated; human secretary required
```

---

## Detection Rules

```yaml
governance_review_council_rules:

  GRC-001:
    name: "Council Session Quorum Not Met"
    condition: |
      council_session.quorum_met = false
      AND session.proceeded = true
    severity: HIGH
    auto_action: invalidate_session_decisions; alert_T3; reschedule_with_full_quorum

  GRC-002:
    name: "Material Distributed Less Than 7 Days Before Session"
    condition: |
      material.distributed_at > session.date - 7_days
      AND material.type = SUBSTANTIVE_DECISION_PACKAGE
    severity: MEDIUM
    auto_action: flag_preparation_failure; offer_session_delay; alert_council_chair

  GRC-003:
    name: "Council Deliberation Below Minimum Time"
    condition: |
      agenda_item.deliberation_time_minutes < 20
      AND agenda_item.type = SUBSTANTIVE_GOVERNANCE_DECISION
    severity: HIGH
    auto_action: flag_deliberation_inadequacy; require_continued_deliberation

  GRC-004:
    name: "Executive Interference in Deliberation"
    condition: |
      executive_sponsor.attended_closed_deliberation = true
      OR executive_sponsor.voted_on_substantive_decision = true
    severity: CRITICAL
    auto_action: invalidate_affected_decisions; alert_T5; publish_interference_record

  GRC-005:
    name: "Council Finding Publication Delayed"
    condition: |
      council_session.state = CLOSED
      AND session_record.published = false
      AFTER session.date + 5_days
    severity: HIGH
    auto_action: alert_T3; mandate_immediate_publication; investigate_delay_cause

  GRC-006:
    name: "AI Recommendation Adopted Without Council Deliberation"
    condition: |
      council.decision.type = SIGNIFICANT
      AND decision.independent_deliberation_content < 0.30
    severity: HIGH
    auto_action: flag_decision; require_supplementary_deliberation; alert_council_chair
```

---

## Integration

```
Feeds into:
  democratic-governance/democratic-governance-engine.md — deliberation quality scores
  legitimacy-systems/constitutional-legitimacy-systems.md — constitutional review findings
  legitimacy-systems/explainable-authority-systems.md — council-level explanation requirements

Receives from:
  democratic-governance/participatory-governance-systems.md — forum outputs for council deliberation
  democratic-governance/representative-oversight.md — T2/T3 representatives on councils
  democratic-governance/constitutional-amendment-systems.md — amendments requiring council deliberation
  consent-governance/escalation-appeal-systems.md — L3 appeals to Constitutional Review Committee
```

---

## Governance

**Council findings are published unedited:** No governance body may edit, delay, or suppress council findings — governance responses are published alongside findings; councils may publish addenda if responses are inadequate  
**Deliberation is not optional:** Sessions that proceed without adequate quorum, preparation time, or deliberation time produce decisions of questionable legitimacy; such decisions are flagged and may be returned for re-deliberation  
**Independence is structural, not behavioral:** Council independence is enforced through structural rules (who attends what, who votes on what) rather than relying on behavioral norms that can erode under pressure  
**Audit:** All council session records, votes, dissents, findings, and independence events to `memory/democratic-governance/council-audit.jsonl`; permanent retention
