# Control Testing Engine

## Purpose
Governs how enterprise controls are tested — the protocols, evidence standards, sampling methods, and quality gates that determine whether a control is genuinely effective or merely exists on paper. The control testing engine transforms the control catalog from a static document into a living, continuously verified system where every control claim is backed by current, reliable evidence.

---

## Testing Architecture

```
Control Catalog (what must be tested)
        ↓
[Test Schedule Generation]    → compute when each control must next be tested
[Test Execution]              → automated tests run; manual tests assigned and completed
[Evidence Collection]         → evidence gathered per control's evidence_required spec
[Evidence Quality Assessment] → is the evidence sufficient, reliable, and complete?
[Effectiveness Determination] → EFFECTIVE | PARTIALLY_EFFECTIVE | INEFFECTIVE | NOT_TESTED
[Finding Generation]          → failures generate findings in finding-management.md
[Results Publication]         → effectiveness ratings update control catalog + risk register
```

---

## Test Types

```yaml
test_types:
  DESIGN_EFFECTIVENESS_TEST:
    purpose: verify the control is designed correctly — that if it operates as designed, it would prevent/detect the failure
    frequency: once (at control creation); re-run after material control changes
    method: walkthrough of control procedure; review of configuration; design documentation review
    output: DESIGN_ADEQUATE | DESIGN_GAP
    note: a control with design gaps cannot be EFFECTIVE regardless of operating performance
  
  OPERATING_EFFECTIVENESS_TEST:
    purpose: verify the control is actually operating as designed in practice
    frequency: per control.test_frequency in control catalog
    method: depends on control type (see test methods below)
    output: EFFECTIVE | PARTIALLY_EFFECTIVE | INEFFECTIVE
    note: this is the primary compliance evidence test
  
  INTEGRATION_TEST:
    purpose: verify controls work together to satisfy an obligation end-to-end
    frequency: annually (or after significant system changes)
    method: trace a transaction or data element through all relevant controls; verify each fires
    output: obligation_fully_satisfied | gap_identified
    use_when: HIGH+ obligation; before regulatory examinations
  
  REGRESSION_TEST:
    purpose: verify a previously effective control remains effective after a system or process change
    trigger: any change to the system, process, or personnel operating the control
    method: same as operating_effectiveness_test
    SLA: regression test completed within 7 days of change
```

---

## Test Methods by Control Type

```yaml
test_methods:
  AUTOMATED_CONTROL_TESTING:
    method: system query or API call that directly verifies control operation
    examples:
      - query database for records missing encryption → zero results = control EFFECTIVE
      - query access log for unauthorized access attempts → confirms detective control working
      - API call to verify TLS version on all endpoints → confirms encryption in transit
    evidence: system-generated report with timestamp; hash-protected; no human intervention needed
    frequency: daily or continuous where feasible
    advantage: no sampling error; complete population coverage; always current
  
  INQUIRY:
    method: structured questions to control owners and operators
    when_used: understanding control design; supplementing other evidence
    limitation: INQUIRY ALONE is insufficient evidence of operating effectiveness
    documentation: interview record with questions, responses, and interviewer/interviewee IDs
  
  OBSERVATION:
    method: direct observation of control execution by a tester (not the control operator)
    when_used: manual controls (e.g., change approval meetings, physical access reviews)
    strength: high reliability; tester sees the actual execution
    limitation: point-in-time; may not reflect typical operation
    documentation: observation record with date, location, what was observed, tester ID
  
  INSPECTION:
    method: examination of documents, records, or system configurations
    when_used: verifying policies are approved, procedures are followed, configurations are correct
    evidence: document references with access timestamps; configuration screenshots
  
  RE_PERFORMANCE:
    method: tester independently re-executes the control procedure and compares to control operator's result
    when_used: highest-assurance test; used for HIGH-risk controls and pre-audit preparation
    strength: highest reliability; directly verifies the control produces correct output
    limitation: most resource-intensive
    documentation: full re-performance record with tester's independent result
  
  SAMPLING:
    method: test a statistically representative sample of control executions
    use_when: control executes many times (e.g., access control for 10,000 transactions)
    sample_size_guidance:
      population <= 25: test all
      population 26–100: test 25
      population 101–250: test 40
      population > 250: test 60 minimum; statistical sampling justified above
    sampling_method: random selection from population; no cherry-picking
    documentation: population size, sample frame, random seed used, selected items, results per item
```

---

## Evidence Quality Standards

```yaml
evidence_quality_standards:
  MINIMUM_EVIDENCE_REQUIREMENTS:
    for_EFFECTIVE_rating:
      - evidence covers the entire testing period (no gaps > 20% of period)
      - evidence is produced by the control itself (not by a related system)
      - evidence quality rating: HIGH or MEDIUM
      - reviewer has approved evidence (except fully automated evidence)
    
    for_PARTIALLY_EFFECTIVE_rating:
      - evidence demonstrates control operates but with deficiencies
      - deficiency scope is characterized (affects X% of population or Y% of testing period)
    
    for_INEFFECTIVE_rating:
      - evidence demonstrates control is not operating (or not operating for material portion)
  
  evidence_reliability_hierarchy:
    VERY_HIGH: system-generated, hash-verified, no human intervention possible
    HIGH: system-generated with human review; direct observation by independent tester; re-performance
    MEDIUM: inspection of original documents; inquiry corroborated by other evidence
    LOW: inquiry alone; copies (not originals); self-attestation without corroboration
  
  evidence_sufficiency_rules:
    RULE-ET-001: inquiry_alone_insufficient
      no_single_piece_of_INQUIRY_evidence can support an EFFECTIVE rating
      inquiry must be corroborated by inspection, observation, or system evidence
    
    RULE-ET-002: coverage_period_requirement
      evidence must cover the entire period being tested; not just a point in time
      for annual tests: evidence must span full 12 months
      for quarterly tests: evidence must span full quarter
    
    RULE-ET-003: independence_requirement
      evidence reviewer must be independent of control owner
      control owner cannot approve their own evidence
    
    RULE-ET-004: timeliness_requirement
      evidence must be collected within the testing period (cannot be retroactively fabricated)
      exception: certain regulatory inspections may request historical evidence; document explicitly
    
    RULE-ET-005: ai_control_evidence_standards
      for AI governance controls: evidence must include system outputs not just configuration
      AI monitoring controls: evidence must show actual monitoring firing, not just setup
```

---

## Test Scheduling

```yaml
test_scheduling:
  schedule_generation:
    inputs: [control.test_frequency, control.last_tested, regulatory_examination_dates, audit_plan]
    method: backward scheduling from regulatory examination date; ensure all controls tested before examination
    priority_weighting:
      CRITICAL obligation coverage: test first in each cycle
      NOT_TESTED controls: highest immediate priority
      AT_RISK KRI controls: elevated frequency
  
  test_calendar:
    monthly_tests: all controls with test_frequency: MONTHLY
    quarterly_tests: all controls with test_frequency: QUARTERLY
    annual_tests: all controls (comprehensive annual cycle)
    triggered_tests: REGRESSION tests (7-day SLA from trigger); INCIDENT-triggered tests (immediate)
  
  test_overdue_escalation:
    overdue_by_7d: notify control owner
    overdue_by_14d: notify compliance governance lead; control status → AT_RISK
    overdue_by_30d: MEDIUM finding generated; Tier-3+ notification
    overdue_by_60d: HIGH finding generated; control status → INEFFECTIVE for residual risk purposes
  
  pre_audit_testing:
    trigger: 90 days before any scheduled regulatory examination or external audit
    action: complete test cycle for all controls in examination scope
    target: all in-scope controls tested with EFFECTIVE evidence before audit begins
    escalation: any INEFFECTIVE control found pre-audit → immediate remediation + compliance lead alert
```

---

## Testing Quality Assurance

```yaml
testing_quality_assurance:
  test_plan_review:
    before_each_test_cycle: test plan reviewed by compliance governance lead
    new_controls: design effectiveness test reviewed before operating test begins
  
  test_execution_review:
    automated_controls: daily automated quality check (did test run? did evidence generate? was hash valid?)
    manual_controls: evidence reviewed within 5 business days of collection
    reviewer_independence: enforced (control owner cannot approve own evidence)
  
  test_result_challenges:
    who_can_challenge: control owner (if rated INEFFECTIVE or PARTIALLY_EFFECTIVE)
    challenge_window: 10 business days from rating publication
    challenge_resolution: compliance governance lead reviews evidence and rating; decision is final
    note: challenges cannot be used to delay finding generation; findings are issued on original rating
  
  testing_metrics:
    test_completion_rate: target 100% before each quarterly review cycle
    evidence_rejection_rate: target < 5% (high rejection suggests evidence standard communication gap)
    first_pass_effective_rate: what % of controls are EFFECTIVE on first test? (trending metric)
    false_positive_rate: challenges that result in rating upgrade (calibration metric)
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/control-catalog.md` | Defines what must be tested and evidence required |
| `risk-and-controls/control-effectiveness-monitor.md` | Receives test results; updates effectiveness ratings |
| `audit-and-evidence/evidence-collection-engine.md` | Automated evidence collection per control spec |
| `audit-and-evidence/finding-management.md` | INEFFECTIVE or NOT_TESTED generates findings |
| `risk-and-controls/enterprise-risk-register.md` | Effectiveness changes update residual risk scores |
| `governance-operations/compliance-operations-dashboard.md` | Test completion metrics displayed |
