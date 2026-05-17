# Post-Incident Analysis
**ID:** IRS-PIA-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Drives structured learning from every security incident — identifying root causes, detection gaps, response failures, and control weaknesses — and translating findings into concrete improvements across detection rules, response playbooks, compliance controls, and agent behavioral contracts. Post-Incident Analysis is the improvement engine of the security program: without it, incidents repeat; with it, each incident makes the enterprise harder to attack.

---

## Post-Incident Review (PIR) Process

```yaml
pir_process:

  trigger: incident_status reaches CLOSED (recovery complete; regulatory notifications filed)
  
  PIR_types:
    CRITICAL_INCIDENT_PIR:
      scope: all CRITICAL severity incidents
      format: full structured PIR (all sections)
      facilitator: T3 IR lead (cannot be analyst who led response)
      participants: [IR team, detection engineers, T4 CISO, Legal Org representative, affected team leads]
      timeline: PIR initiated within 48hr of close; draft completed within 7 days; final report within 14 days
      
    HIGH_INCIDENT_PIR:
      scope: HIGH severity incidents; all AI-specific incidents regardless of severity
      format: abbreviated PIR (root cause + detection gaps + 5 action items max)
      facilitator: T2 IR lead or T3 SOC lead
      timeline: completed within 14 days of incident close
      
    MEDIUM_INCIDENT_PIR:
      scope: sampled 25% of MEDIUM incidents; all MEDIUM with novel patterns
      format: detection tuning review (was rule correct? playbook optimal?)
      timeline: completed within 30 days
      
    CONSTITUTIONAL_INCIDENT_PIR:
      scope: ALL incidents with constitutional_adjacent flag
      format: full PIR + constitutional quorum review section
      participants: includes constitutional quorum members
      timeline: PIR within 48hr; constitutional quorum review within 7 days
      distribution: T4 + constitutional quorum; restricted distribution
```

---

## PIR Structure

```yaml
pir_sections:

  SECTION_1_INCIDENT_SUMMARY:
    contents:
      - incident_id and classification
      - timeline: detected → contained → eradicated → recovered → closed
      - brief narrative (5 sentences max)
      - key metrics: MTTD, MTTR, MTTRR, data_subjects_affected (if applicable)
      
  SECTION_2_ROOT_CAUSE_ANALYSIS:
    method: 5-Whys + Fishbone (Ishikawa) diagram
    output:
      primary_root_cause: string         # the deepest causal factor
      contributing_factors: [string]     # conditions that made compromise possible
      attack_vector: string              # how attacker entered
      attacker_objective: string         # what attacker was trying to achieve
      attacker_dwell_time: duration      # time between entry and detection
      
  SECTION_3_DETECTION_GAP_ANALYSIS:
    questions:
      - "Was there a detection rule that should have fired earlier? Why didn't it?"
      - "What was the MTTD? Was it within target? If not, what caused the delay?"
      - "Were there leading indicators in logs that were not acted on?"
      - "Is there an ATT&CK technique used that lacks a detection rule?"
    output:
      detection_gaps: [string]
      mttd_root_cause: string | null
      new_detection_hypotheses: [string]  # fed to detection-engineering.md
      
  SECTION_4_RESPONSE_GAP_ANALYSIS:
    questions:
      - "Did playbooks work as designed? Where did they fail or slow down?"
      - "Were human gates at the right points? Too many or too few?"
      - "Did containment actions have unintended side effects?"
      - "Were the right people notified at the right times?"
      - "Were evidence collection and chain of custody adequate?"
    output:
      playbook_gaps: [string]
      human_gate_issues: [string]
      containment_issues: [string]
      notification_gaps: [string]
      
  SECTION_5_CONTROL_EFFECTIVENESS:
    for_each_control_that_should_have_prevented_or_detected:
      control_id: string
      expected_behavior: string
      actual_behavior: string
      effectiveness_verdict: WORKED | PARTIALLY_WORKED | FAILED | NOT_DEPLOYED
      failure_reason: string | null
    output:
      failed_controls: [string]          # fed to adaptive-compliance/control-effectiveness-monitor
      control_improvement_recommendations: [string]
      
  SECTION_6_ACTION_ITEMS:
    format: each action item must have owner, deadline, and success metric
    categories:
      DETECTION: new or modified detection rules
      PLAYBOOK: new or modified response playbooks
      CONTROL: compliance control improvements
      TOOLING: detection or response tooling improvements
      TRAINING: analyst training or awareness improvements
      ARCHITECTURE: structural security improvements
      POLICY: compliance policy changes
    priority: P0 (24hr), P1 (7d), P2 (30d), P3 (90d)
    
  SECTION_7_CONSTITUTIONAL_REVIEW:
    required_for: all constitutional_adjacent incidents
    questions:
      - "Did the constitutional governor fire at the right threshold?"
      - "Were constitutional proximity alerts routed correctly?"
      - "Did the constitutional quorum review the incident? Were decisions appropriate?"
      - "Are there new constitutional risk patterns identified?"
    output:
      constitutional_boundary_assessment: string
      quorum_review_findings: [string]
      constitutional_detection_improvements: [string]
    distribution: T4 + constitutional quorum; not in general security dashboard
```

---

## Action Item Tracking

```yaml
action_item_tracking:

  action_item_schema:
    action_id: PIA-ACT-{NNN}
    pia_id: PIA-{NNN}
    incident_id: INC-{NNN}
    
    category: string                     # from SECTION_6 categories
    priority: P0 | P1 | P2 | P3
    
    description: string
    owner_org: string
    owner_agent: string
    
    due_date: ISO8601
    status: OPEN | IN_PROGRESS | COMPLETE | OVERDUE | CANCELLED
    
    success_metric: string               # how do we know this is done?
    completion_evidence: string | null   # proof of completion
    
    completed_at: ISO8601 | null
    
  routing:
    DETECTION actions: → detection-engineering.md (creates DET-{NNN} hypothesis)
    PLAYBOOK actions: → soc-playbook-engine.md (creates playbook change request)
    CONTROL actions: → adaptive-compliance/compliance-engine.md (creates control review)
    ARCHITECTURE actions: → Architecture Org (creates ADR)
    POLICY actions: → regulatory-adaptation/policy-synthesis-engine.md
    
  escalation:
    P0_overdue: T4 immediate escalation
    P1_overdue_7d: T3 escalation + T4 notification
    P2_overdue_14d: T3 escalation
    
  closure_metrics:
    target: 90% of P1 items closed within 7 days; 85% of P2 within 30 days
    tracking: weekly action item status report to T3 SOC lead
```

---

## PIR Record Schema

```yaml
pir_record:
  pia_id: PIA-{NNN}
  incident_id: INC-{NNN}
  
  pir_type: string
  
  timeline:
    initiated_at: ISO8601
    draft_completed_at: ISO8601 | null
    final_report_at: ISO8601 | null
    quorum_review_at: ISO8601 | null     # constitutional incidents only
    
  participants: [string]
  facilitator: string
  
  findings:
    primary_root_cause: string
    contributing_factors: [string]
    detection_gaps: [string]
    response_gaps: [string]
    failed_controls: [string]
    
  action_items: [PIA-ACT-{NNN}]
  
  metrics:
    mttd: duration
    mttr: duration
    mttrr: duration
    data_subjects_affected: integer | null
    control_failures: integer
    new_detection_hypotheses: integer
    
  constitutional_section:
    included: boolean
    quorum_reviewed: boolean | null
    quorum_findings: [string] | null
    
  distribution:
    access_level: INTERNAL | RESTRICTED | CONSTITUTIONAL_RESTRICTED
    distributed_to: [string]
    
  integrity:
    entry_hash: sha256
```

---

## Organizational Learning Loop

```yaml
organizational_learning_loop:

  knowledge_propagation:
    detection_hypotheses:
      destination: detection-engineering.md
      format: hypothesis record (HYP-{NNN}) with technique, behavior, data source
      SLA: P0 hypotheses within 24hr; P1 within 7 days
      
    playbook_improvements:
      destination: soc-playbook-engine.md
      format: playbook change request with specific step modifications
      review: T3 approval required
      
    control_improvements:
      destination: adaptive-compliance/control-effectiveness-monitor.md
      format: control review record with failure analysis and recommended improvement
      
    wiki_publication:
      destination: wiki/security/incident-learnings/
      format: sanitized case study (no agent IDs; no IOC specifics; pattern + lesson)
      audience: all security org members for training
      
    constitutional_learnings:
      destination: constitutional-governor-quorum.md
      format: constitutional pattern record for quorum review
      access: T4 + quorum only
      
  quarterly_learning_digest:
    format: aggregate PIR findings across all incidents in quarter
    contents:
      - top 5 root cause patterns
      - detection coverage improvements delivered
      - control effectiveness trend
      - open action items aging report
      - constitutional proximity incident trend
    audience: T4 CISO + Security Leadership
    
  annual_threat_model_update:
    trigger: year-end PIR digest reviewed
    output: updated enterprise threat model; MITRE ATT&CK coverage gap update
    drives: next-year detection engineering roadmap
```

---

## Integration

```
Feeds into:
  detection-engineering.md — new detection hypotheses from PIR SECTION_3
  soc-playbook-engine.md — playbook improvement requests
  adaptive-compliance/control-effectiveness-monitor.md — control failure records
  adaptive-compliance/compliance-learning-system.md — compliance-specific learnings
  wiki/security/ — sanitized case studies for organizational learning
  constitutional-governor-quorum.md — constitutional incident learnings

Receives from:
  incident-response-orchestrator.md — incident close triggers PIR initiation
  forensic-evidence-collector.md — evidence access for root cause analysis
  security-metrics-dashboard.md — incident metrics for PIR SECTION_1
  security-event-correlator.md — correlation event history for detection gap analysis
```

---

## Governance

**PIR is mandatory for all CRITICAL and HIGH incidents:** No exception; incident is not fully closed until PIR is complete and action items are created  
**PIR facilitator independence:** The analyst who led the incident response cannot facilitate the PIR for that incident; independence is required for honest root cause analysis  
**Action item tracking is enforced:** Overdue P0 and P1 action items trigger automatic T4 escalation; the PIR owner is accountable for action item closure  
**Constitutional incident PIRs are restricted:** Distribution limited to T4 + constitutional quorum; not included in general security dashboards or wiki  
**No-blame culture requirement:** PIRs focus on systemic causes and control failures, not individual agent performance; PIR findings cannot be used in performance reviews  
**Audit:** All PIR records and action items to `memory/incident-response/pir-audit.jsonl`; permanent retention
