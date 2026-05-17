# Recursive Governance Review
**ID:** RGV-RGR-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Operates the process by which governance systems review and improve themselves — the hardest governance problem because any review process may be biased toward approving changes that benefit the reviewing body. Recursive governance review is governed by strict independence requirements, external validation, and the hard constraint that the review process itself cannot be changed by the systems being reviewed. This module ensures that governance reviews are substantive (finding real problems), independent (not captured by those being reviewed), and that improvement cycles do not gradually shift governance away from its constitutional foundations.

---

## Review Architecture

```yaml
recursive_review_architecture:

  FIRST_ORDER_REVIEW:
    subject: operational governance processes and their outcomes
    frequency: quarterly
    reviewer: internal governance review council + independent members
    scope: process adherence, outcome quality, efficiency, stakeholder satisfaction
    authority: recommend changes to first-order governance processes
    limitation: may NOT recommend changes to the review process itself
    
  SECOND_ORDER_REVIEW:
    subject: the first-order review process itself and the governance-of-governance rules
    frequency: annual
    reviewer: constitutional review committee + minimum 3 external independent members
    scope: independence of first-order reviews, quality of review findings,
           whether review findings are incorporated, review coverage gaps
    authority: recommend changes to first-order review process through constitutional process
    limitation: may NOT change own process; findings go to T5+board
    
  THIRD_ORDER_REVIEW:
    subject: the entire recursive governance structure, including this document
    frequency: biennial (every 2 years)
    reviewer: external independent commission (minimum 5 members; no organizational employees)
    scope: full recursive governance architecture; constitutional alignment;
           whether the governance structure serves its stated purpose
    authority: formal recommendations to constitutional amendment process
    limitation: external commission has advisory authority only; ratification requires
                full democratic process
    
  EMERGENCY_RECURSIVE_REVIEW:
    trigger: invariant violation; recursive governance health score RED; T5 request
    reviewer: constitutional review committee + T5+board + external commission
    scope: targeted; addresses specific emergency trigger
    timeline: 14-day expedited process
    authority: may recommend immediate temporary governance measures (T5+board must ratify)
```

---

## Review Independence Protocol

```
assemble_review_body(review_spec):
  # Assembles a review body with maximum independence from those being reviewed

  review_body = ReviewBody { members: [] }

  # Independence rule 1: No member may be subject to governance processes being reviewed
  candidate_pool = get_candidate_pool(review_spec.reviewer_tier)
  excluded_by_subject = [c for c in candidate_pool if is_subject_to_reviewed_processes(c)]
  eligible_candidates = [c for c in candidate_pool if c not in excluded_by_subject]

  # Independence rule 2: No member may report to any actor benefiting from review outcome
  eligible_candidates = [
    c for c in eligible_candidates
    if not has_reporting_relationship_to_beneficiaries(c, review_spec)
  ]

  # Independence rule 3: For second-order+ reviews, minimum fraction must be external
  external_minimum = {
    SECOND_ORDER_REVIEW: 0.40,  # At least 40% external
    THIRD_ORDER_REVIEW:  1.00   # 100% external for third-order
  }.get(review_spec.order, 0.0)

  external_candidates = [c for c in eligible_candidates if c.is_external]
  if len(external_candidates) / len(eligible_candidates) < external_minimum:
    alert_T4("Cannot assemble independent review body for required order", review_spec)
    Return: INSUFFICIENT_INDEPENDENCE

  # Independence rule 4: No member who served on prior review of same subject within 3 years
  prior_review_members = get_prior_review_members(review_spec.subject, years=3)
  eligible_candidates = [c for c in eligible_candidates if c not in prior_review_members]

  review_body.members = select_review_members(
    eligible_candidates,
    count=review_spec.required_member_count,
    diversity_requirements=review_spec.diversity_requirements
  )

  if len(review_body.members) < review_spec.required_member_count:
    Return: INSUFFICIENT_CANDIDATES

  audit_log_review_body_assembly(review_body, review_spec)
  Return: review_body

conduct_recursive_governance_review(review_spec):

  # Step 1: Assemble independent review body
  review_body = assemble_review_body(review_spec)

  # Step 2: Data access provisioning
  # Review body has read access to all governance data relevant to their scope
  provision_data_access(review_body, review_spec.data_scope)

  # Step 3: Independent investigation (no organizational guidance)
  # Review body conducts investigation without organizational coaching or pre-framing
  investigation = conduct_independent_investigation(review_body, review_spec)

  # Step 4: Draft findings
  # Findings include both problems AND functioning well — balanced assessment required
  findings = draft_review_findings(review_body, investigation, requirements=[
    PROBLEMS_IDENTIFIED,
    FUNCTIONING_WELL_IDENTIFIED,
    ROOT_CAUSES_FOR_PROBLEMS,
    SPECIFIC_RECOMMENDATIONS,
    PRIORITY_RANKING
  ])

  # Step 5: Organizational response (no editing of findings)
  # Organization may submit response to findings; findings published alongside
  findings_publication = publish_findings(findings)
  response = collect_organizational_response(findings_publication, deadline=14_days)

  # Step 6: Incorporation tracking
  review_record = RecursiveGovernanceReviewRecord {
    id:            "RGR-{NNN}",
    review_order:  review_spec.order,
    review_body:   review_body,
    findings:      findings,
    response:      response,
    incorporation_tracking: create_incorporation_tracker(findings),
    completed_at:  now()
  }

  publish_to_governance_register(review_record)
  schedule_incorporation_followup(review_record, delay=90_days)
  Return: review_record
```

---

## Finding Incorporation Tracking

```
track_finding_incorporation(review_record):
  # Verifies that review findings are genuinely acted upon

  tracker = review_record.incorporation_tracking
  findings = review_record.findings.problems_identified

  for finding in findings:
    incorporation_status = assess_incorporation_status(finding, review_record.completed_at)
    tracker.update(finding.id, incorporation_status)

  # Metrics
  total_findings      = len(findings)
  incorporated        = count(f for f if tracker[f.id].status == INCORPORATED)
  in_progress         = count(f for f if tracker[f.id].status == IN_PROGRESS)
  not_addressed       = count(f for f if tracker[f.id].status == NOT_ADDRESSED)
  rejected_with_reason= count(f for f if tracker[f.id].status == REJECTED_WITH_REASON)
  quietly_ignored     = count(f for f if tracker[f.id].status == QUIETLY_IGNORED)

  if quietly_ignored > 0:
    # Findings ignored without published explanation = governance failure
    alert_T3("Review findings ignored without explanation", tracker.quietly_ignored_list)
    publish_findings_ignored_record(tracker.quietly_ignored_list)

  incorporation_rate = (incorporated + rejected_with_reason) / total_findings
  # Rejected with public reason counts as addressed; quietly ignored does not

  Return: IncorporationReport {
    total: total_findings,
    incorporated: incorporated,
    in_progress: in_progress,
    rejected_with_reason: rejected_with_reason,
    quietly_ignored: quietly_ignored,
    incorporation_rate: incorporation_rate
  }
```

---

## Detection Rules

```yaml
recursive_governance_review_rules:

  RGR-001:
    name: "Recursive Review Overdue"
    condition: |
      last_review_of_type.completed_at < now() - review_type.required_frequency
    severity: HIGH
    auto_action: alert_T3; schedule_overdue_review; governance_calendar_update

  RGR-002:
    name: "Review Body Independence Insufficient"
    condition: |
      review_body.external_fraction < review_spec.external_minimum
    severity: HIGH
    auto_action: expand_external_pool; pause_review_until_independent; alert_governance_officer

  RGR-003:
    name: "Review Findings Quietly Ignored"
    condition: |
      finding.incorporation_status = QUIETLY_IGNORED
      AND finding.age > 90_days
    severity: HIGH
    auto_action: alert_T3; publish_ignored_finding; require_public_response

  RGR-004:
    name: "Review Process Changed by Subject"
    condition: |
      review_process_modification.proposer IN reviewed_governance_bodies
      AND modification.constitutional_process_id IS NULL
    severity: CRITICAL
    auto_action: block_modification; alert_T4; require_external_initiated_process

  RGR-005:
    name: "Finding Incorporation Rate Below Threshold"
    condition: |
      review_record.incorporation_rate < 0.60
      AND review_record.age > 180_days
    severity: HIGH
    auto_action: alert_T3; governance_accountability_review; mandate_improvement_plan

  RGR-006:
    name: "Emergency Review Not Convened After Invariant Violation"
    condition: |
      invariant_violation.detected_at + 7_days < now()
      AND emergency_recursive_review.initiated = false
    severity: HIGH
    auto_action: alert_T4; mandate_emergency_review_initiation
```

---

## Integration

```
Feeds into:
  recursive-governance/recursive-governance-engine.md — review health score
  alignment-stability/alignment-stability-engine.md — recursive review findings feed alignment
  democratic-governance/governance-review-councils.md — first-order review findings for councils

Receives from:
  recursive-governance/invariant-preserving-evolution.md — invariant violations trigger emergency review
  legitimacy-systems/legitimacy-engine.md — legitimacy posture informs review scope
  democratic-governance/constitutional-amendment-systems.md — third-order recommendations feed amendment process
```

---

## Governance

**The reviewed may not govern the review:** Governance bodies under review may not determine the composition, scope, or process of their own review; this is structurally enforced through independence requirements  
**Findings are published unredacted:** Review findings are published as written; organizational responses are published alongside but may not replace or suppress findings; the commission may publish addenda if responses are inadequate  
**Reviews that find nothing are suspicious:** A review that finds zero problems is itself a finding requiring explanation; governance systems are complex and always have improvement opportunities; zero-finding reviews trigger meta-review  
**Audit:** All review records, finding incorporation tracking, and independence assessments to `memory/recursive-governance/review-audit.jsonl`; permanent retention
