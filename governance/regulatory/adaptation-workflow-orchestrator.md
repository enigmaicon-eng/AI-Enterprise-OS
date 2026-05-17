# Adaptation Workflow Orchestrator
**ID:** RAD-AWO-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Governance Org + Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Orchestrates the end-to-end compliance adaptation lifecycle — from the moment a regulatory change is assessed to the moment new policies and controls are live, validated, and confirmed compliant. The Adaptation Workflow Orchestrator coordinates the sequenced handoffs between regulatory change detection, impact assessment, policy synthesis, legal review, staged deployment, and post-deployment validation. It maintains state for every in-flight adaptation, enforces authority gates, and ensures that parallel adaptations across jurisdictions do not interfere with each other.

---

## Adaptation Workflow Stages

```
ADAPTATION WORKFLOW (AWF-{NNN})

  Stage 1 — CHANGE_DETECTED
    Input: CHG-{NNN} from regulatory-change-detector
    Action: Create AWF record; route to assessment
    Gate: none (automatic)
    Duration: < 1 hour
    
  Stage 2 — IMPACT_ASSESSED
    Input: IAS-{NNN} from impact-assessment-engine
    Action: Verify assessment is APPROVED; classify track
    Gate: Assessment approval (Governance/Legal/Architecture/T4 per complexity)
    Duration: 4hr (CRITICAL) | 48hr (HIGH) | 7d (STANDARD)
    
  Stage 3 — POLICY_SYNTHESIZED
    Input: Draft policies from policy-synthesis-engine
    Action: Route for review; track open review items
    Gate: Constitutional screen passed; no unresolved conflicts
    Duration: 2hr (CRITICAL) | 48hr (HIGH) | 7d (STANDARD) for legal review
    
  Stage 4 — POLICY_APPROVED
    Input: Reviewed and approved DRAFT → CANDIDATE policies
    Action: Initiate staged rollout plan; prepare control updates
    Gate: All low-confidence fields resolved; legal sign-off
    Duration: 1hr staging prep
    
  Stage 5 — STAGING_ACTIVE
    Input: CANDIDATE policies
    Action: Execute staged rollout per policy-adaptation-engine protocol
    Gate: Canary metrics pass (FP rate < 0.02; effectiveness > 0.80)
    Duration: 24–72 hours (CANARY + PARTIAL stages)
    Parallel: Control updates executed simultaneously by control-effectiveness-monitor
    
  Stage 6 — VALIDATION
    Input: Fully deployed policies + updated controls
    Action: Run compliance validation suite against affected workflows and agents
    Gate: 48-hour monitoring clean (0 new violations attributable to policy; effectiveness maintained)
    Duration: 48 hours minimum; 7 days for COMPLEX+
    
  Stage 7 — COMPLETE
    Input: Validation passed
    Action: Close AWF; update regulatory calendar; archive change record
    Gate: Governance Org sign-off; Legal Org confirmation of compliance status
    Output: CLOSED AWF record; updated compliance posture
```

---

## Workflow Record Schema

```yaml
adaptation_workflow:
  awf_id: AWF-{NNN}
  change_id: CHG-{NNN}
  assessment_id: IAS-{NNN}
  urgency: CRITICAL | HIGH | MEDIUM | LOW | PLANNED
  
  stage: string                          # current stage
  stage_entered_at: ISO8601
  stage_deadline: ISO8601                # SLA deadline for this stage
  
  artifacts:
    impact_assessment: IAS-{NNN}
    policy_drafts: [POL-{NNN}]
    policy_candidates: [POL-{NNN}]
    policy_activated: [POL-{NNN}]
    control_updates: [CTL-{NNN}]
    tia: TIA-{NNN} | null
    
  approvals:
    assessment_approved_by: string | null
    policies_approved_by: string | null
    deployment_authorized_by: string | null
    completion_signed_off_by: string | null
    
  parallel_jurisdictions:
    enabled: boolean
    jurisdiction_tracks: [{jurisdiction, stage, status}]
    
  blocking_issues:
    - issue_id: string
      description: string
      raised_at: ISO8601
      resolved_at: ISO8601 | null
      
  status: ACTIVE | BLOCKED | COMPLETE | FAILED | CANCELLED
  
  timeline:
    created_at: ISO8601
    completed_at: ISO8601 | null
    sla_deadline: ISO8601              # compliance deadline from regulatory change
    sla_status: ON_TRACK | AT_RISK | BREACHED
```

---

## Parallel Jurisdiction Handling

```
plan_parallel_adaptation(awf_id):

  awf = load_awf(awf_id)
  assessment = load_assessment(awf.assessment_id)
  
  # Identify whether jurisdictions can be adapted independently
  for jurisdiction in assessment.jurisdictions_affected:
    
    jurisdiction_policies = [p for p in assessment.policy_drafts if jurisdiction in p.scope.jurisdictions]
    jurisdiction_controls = [c for c in assessment.control_updates if jurisdiction in c.jurisdictions]
    
    # Check for cross-jurisdiction dependencies
    dependencies = find_cross_jurisdiction_dependencies(jurisdiction_policies, all_policies)
    
    if not dependencies:
      # Can adapt independently
      create_jurisdiction_track(awf_id, jurisdiction, INDEPENDENT)
      
    else:
      # Must coordinate with dependency jurisdictions
      create_jurisdiction_track(awf_id, jurisdiction, COORDINATED, depends_on=dependencies)
      
  # Execute independent tracks in parallel; coordinated tracks sequentially
  [PARALLEL]: execute independent tracks
  [SEQUENTIAL]: execute coordinated tracks in dependency order
  
  # Track progress across all jurisdiction tracks
  monitor_track_progress(awf_id)
```

---

## Emergency Adaptation Protocol

```
emergency_adaptation(change_id):
  # Used for CRITICAL urgency changes (e.g., adequacy revocation, immediate new prohibition)
  
  awf = create_awf(change_id, urgency=CRITICAL)
  
  # Immediate protective action (before full adaptation completes)
  apply_precautionary_posture(change):
    suspend_affected_transfers()                    # if transfer mechanism affected
    elevate_to_REQUIRE_REVIEW(affected_domains)     # prevent blind PERMIT decisions
    activate_compensating_controls(affected_domains) # bridge until new controls deployed
    notify_T4_and_Legal(awf)
    
  # Compress timeline
  # Stage 2 (Impact): 4hr → 2hr
  # Stage 3 (Synthesis): Legal review 4hr target
  # Stage 4-5 (Approve + Stage): combined to 12hr (CANARY only; no PARTIAL stage)
  # Stage 6 (Validation): 24hr (reduced from 48hr)
  
  # Board notification if implementation will take > 7 days
  if estimated_completion_date > now() + 7_days:
    notify_board(awf, reason="CRITICAL regulatory change requiring extended adaptation")
    request_exception_grant(affected_domains, duration=estimated_completion_date)
    
  Return: awf
```

---

## SLA Monitoring

```yaml
sla_monitoring:
  tracked_per_stage:
    evaluation_frequency: every 30 minutes
    
  alerts:
    SLA_75_PERCENT_CONSUMED: T3 notification
    SLA_90_PERCENT_CONSUMED: T4 notification + escalation if no human action taken
    SLA_BREACHED: T4 + Legal Org immediate alert; board notification for CRITICAL
    
  sla_breach_response:
    CRITICAL_SLA_BREACH:
      - auto-extend exception for affected domains (max 24hr extension; T4 must confirm)
      - activate all available compensating controls
      - T4 emergency session within 2 hours
      
    HIGH_SLA_BREACH:
      - T3 escalation review within 4 hours
      - assess whether partial deployment is possible (deploy ready policies; defer complex ones)
      
  sla_reporting:
    daily: AWF SLA status in daily compliance digest
    weekly: AWF on-time completion rate in weekly report
    monthly: SLA performance trend in governance digest
```

---

## Rollback Protocol

```
rollback_adaptation(awf_id, reason):

  awf = load_awf(awf_id)
  
  # Determine rollback scope
  if awf.stage in [STAGING_ACTIVE, VALIDATION]:
    # Policies are live; rollback via policy-adaptation-engine
    for policy_id in awf.artifacts.policy_activated:
      policy_adaptation_engine.initiate_rollback(policy_id, reason=reason)
      
  # Control rollback (revert to previous control configuration)
  for control_id in awf.artifacts.control_updates:
    control_effectiveness_monitor.revert_control(control_id)
    
  # Protective posture during rollback
  elevate_to_REQUIRE_REVIEW(awf.assessment.domains_affected)
  
  # Authority for rollback
  # Stage < STAGING_ACTIVE: T3 can cancel without rollback
  # Stage >= STAGING_ACTIVE: T4 must authorize rollback
  
  log_rollback(awf_id, reason, authorized_by)
  update_awf_status(awf_id, status=CANCELLED)
```

---

## Integration

```
Feeds into:
  policy-adaptation-engine.md — CANDIDATE policies passed here for deployment
  control-effectiveness-monitor.md — control updates coordinated during Stage 5
  regulatory-calendar.md — AWF deadlines tracked in calendar
  compliance-dashboard.md — in-flight AWFs visible on dashboard

Receives from:
  regulatory-change-detector.md — CHG-{NNN} initiates AWF creation
  impact-assessment-engine.md — IAS-{NNN} approval completes Stage 2
  policy-synthesis-engine.md — synthesized draft policies complete Stage 3
  Legal Org — policy approvals and sign-offs
```

---

## Governance

**No self-approval:** Agents that synthesize a policy cannot be the approver of that same policy; synthesis and approval are always different actors  
**Stage skip prohibited:** Stages cannot be skipped even under emergency conditions; emergency protocol compresses timelines, not structure  
**Rollback authority:** Post-deployment rollback always requires T4 authorization; pre-deployment cancellation requires T3  
**Completion sign-off:** AWF is never marked COMPLETE by automation alone; Governance Org + Legal Org sign-off required  
**Audit:** All AWF state transitions, approvals, and rollbacks to `memory/regulatory-adaptation/adaptation-audit.jsonl`; permanent retention
