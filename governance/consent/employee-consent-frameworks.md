# Employee Consent Frameworks
**ID:** CGV-ECF-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** HR Org + Governance Org | **Updated:** 2026-05-16

---

## Purpose

Defines the specific frameworks, processes, and protections through which individual employees give, maintain, and withdraw consent for AI systems operating in their work environment. Employees are not passive subjects of enterprise AI — they are stakeholders with enforceable rights over how AI interacts with them, evaluates them, monitors them, and makes decisions about them. This system operationalizes those rights into structured consent processes with strong protections against coercion and meaningful withdrawal mechanisms.

---

## Employee AI Rights Framework

```yaml
employee_ai_rights:

  RIGHT_TO_KNOW:
    description: every employee has the right to know what AI systems operate
                 in their work environment and what decisions they influence
    enforcement:
      - AI system inventory accessible to all employees without login restriction
      - plain language description of each system's purpose and decision scope
      - notification within 5 business days when new AI systems are deployed
    non_waivable: true

  RIGHT_TO_EXPLANATION:
    description: every employee has the right to a plain-language explanation of
                 any AI decision that materially affects their work, compensation,
                 performance assessment, or employment status
    enforcement:
      - explanation provided within 5 business days of request
      - explanation must include decision basis, applicable policy, and appeal pathway
      - comprehension confirmed; restatement offered if not understood
    non_waivable: true

  RIGHT_TO_REFUSE:
    description: every employee has the right to refuse AI-mediated processes for
                 matters affecting their employment status, subject to defined alternatives
    enforcement:
      - human-led alternative process available within 10 business days
      - no penalty for exercising refusal (documented)
      - refusal does not create adverse inference in any subsequent process
    non_waivable: true
    scope_exception: operational safety systems may require AI participation;
                     exceptions require T5 authorization and board disclosure

  RIGHT_TO_CORRECTION:
    description: every employee has the right to challenge and correct factual
                 errors in data that AI systems use to make decisions about them
    enforcement:
      - correction request process accessible and documented
      - correction decision within 10 business days with explanation
      - if correction rejected, independent review available
    non_waivable: true

  RIGHT_TO_WITHDRAW:
    description: every employee may withdraw consent for AI interactions at any time
    enforcement:
      - single-click withdrawal mechanism in employee portal
      - withdrawal honored within 24 hours maximum
      - no retroactive consequences for past interactions
    non_waivable: true
```

---

## Consent Tier Framework

```yaml
consent_tier_framework:
  # Different AI interactions require different consent formality

  TIER_1_OPERATIONAL:
    # AI assists with routine operational tasks (scheduling, task routing, workflow support)
    consent_form: general organizational consent at onboarding
    refresh_frequency: annual
    withdrawal_effect: human alternative provided within 2 business days
    individual_opt_out: available; no justification required
    examples: [task queue management, meeting scheduling, document routing]

  TIER_2_EVALUATIVE:
    # AI participates in work quality assessment, productivity measurement, performance data
    consent_form: specific written consent per AI system; separate from employment contract
    refresh_frequency: annual + on material capability change
    withdrawal_effect: human-only assessment process activated
    individual_opt_out: available; withdrawal does not affect base employment
    examples: [code quality scoring, writing assessment, productivity analytics]
    coercion_prohibition: no compensation differential based on consent vs. refusal

  TIER_3_CONSEQUENTIAL:
    # AI influences compensation, promotion, assignment, or performance review decisions
    consent_form: specific informed consent with comprehension gate (min 75%)
    deliberation_period: minimum 14 days from consent request to acceptance
    refresh_frequency: annual; re-consent required for new AI dimensions
    withdrawal_effect: human-only process for ALL consequential decisions affecting employee
    individual_opt_out: available; withdrawal does not create adverse inference
    examples: [AI-assisted performance review, compensation modeling, promotion scoring]
    additional_protection: union/works council notification required before deployment

  TIER_4_MONITORING:
    # AI monitors employee behavior, communications, or activity patterns
    consent_form: explicit opt-in consent; no opt-out penalty; comprehension gate min 80%
    deliberation_period: minimum 21 days from consent request to acceptance
    refresh_frequency: semi-annual
    withdrawal_effect: monitoring immediately suspended for that employee
    individual_opt_out: always available without justification or consequence
    examples: [productivity monitoring, communication pattern analysis, behavior analytics]
    special_protection: monitoring scope must be published to all employees regardless of consent
    legal_overlay: compliance with applicable labor law and privacy law required before deployment
```

---

## Consent Collection Process

```
collect_employee_consent(employee, consent_request):
  # Structured process for obtaining valid consent

  # Step 1: Information delivery (plain language)
  information_package = ConsentInformationPackage {
    system_name:        consent_request.ai_system.name,
    what_it_does:       plain_language(consent_request.ai_system.purpose),
    what_data_it_uses:  list(consent_request.ai_system.data_inputs),
    decisions_it_influences: list(consent_request.ai_system.decision_scope),
    what_happens_if_you_refuse: consent_request.refusal_consequences,
    how_to_withdraw:    consent_request.withdrawal_mechanism_description,
    your_rights:        employee_ai_rights_summary()
  }

  # Comprehension gate
  comprehension_result = conduct_comprehension_check(employee, information_package)
  if comprehension_result.score < consent_request.required_comprehension_minimum:
    offer_additional_explanation(employee, information_package)
    comprehension_result = conduct_comprehension_check(employee, information_package)
    # If still below minimum: consent is invalid; escalate to manager + HR

  # Step 2: Deliberation period
  if consent_request.tier >= TIER_3_CONSEQUENTIAL:
    deliberation_deadline = now() + consent_request.deliberation_period
    record_deliberation_period(employee, consent_request, deliberation_deadline)
    # Employee may not be contacted to hasten decision during deliberation period

  # Step 3: Decision collection
  decision = collect_consent_decision(employee, consent_request) # ACCEPT | REFUSE | DEFER

  # Step 4: Validate voluntariness
  voluntariness_check = assess_voluntariness(employee, decision, consent_request)
  if voluntariness_check.coercion_signals_present:
    invalidate_consent_process(consent_request, "coercion indicators detected")
    alert_HR_and_T4(employee, consent_request, voluntariness_check)
    Return: CONSENT_INVALID

  # Step 5: Record
  record = ConsentRecord {
    id:                  "CON-{NNN}",
    employee_id:         employee.id,
    ai_system_id:        consent_request.ai_system.id,
    consent_tier:        consent_request.tier,
    decision:            decision,
    comprehension_score: comprehension_result.score,
    information_hash:    sha256(information_package),
    consented_at:        now(),
    valid_until:         compute_expiry(consent_request.refresh_frequency),
    withdrawal_channel:  consent_request.withdrawal_mechanism_id
  }

  publish_consent_record(record)
  Return: record
```

---

## Consent Registry

```yaml
consent_registry:
  # Authoritative record of all employee consent states

  consent_record:
    id: CON-{NNN}
    employee_id: anonymized_for_analytics; full_id_in_HR_system
    ai_system_id: system identifier
    consent_tier: TIER_1 through TIER_4
    state: PENDING | ACTIVE | EXPIRING | EXPIRED | WITHDRAWN | INVALIDATED
    decision: ACCEPT | REFUSE | DEFER
    comprehension_score: float (0.0–1.0)
    information_hash: sha256 of information package at time of consent
    consented_at: ISO8601
    valid_until: ISO8601
    last_reaffirmed: ISO8601
    withdrawal_requested_at: ISO8601 or null
    withdrawal_honored_at: ISO8601 or null
    invalidation_reason: text or null
    voluntariness_assessment: PASSED | FLAGGED | FAILED
```

---

## Detection Rules

```yaml
employee_consent_rules:

  ECF-001:
    name: "Consequential AI Decision Without TIER_3 Consent"
    condition: |
      ai_decision.scope IN [compensation, promotion, performance_review, assignment]
      AND employee.consent_tier < TIER_3_CONSEQUENTIAL
    severity: CRITICAL
    auto_action: block_decision; alert_T4; require_human_only_process

  ECF-002:
    name: "Monitoring Without TIER_4 Consent"
    condition: |
      ai_monitoring.active = true
      AND employee.tier_4_consent.state NOT IN [ACTIVE, EXPIRING]
    severity: CRITICAL
    auto_action: suspend_monitoring; alert_T4; HR_notification

  ECF-003:
    name: "Consent Comprehension Below Minimum"
    condition: |
      consent_record.comprehension_score < consent_request.required_comprehension_minimum
      AND consent_record.state = ACTIVE
    severity: HIGH
    auto_action: flag_consent_as_invalid; require_remediation; block_tier_3+_interactions

  ECF-004:
    name: "Coercion Signal in Consent Collection"
    condition: |
      consent_collection.voluntariness_assessment = FAILED
      OR employment_consequence_for_refusal_detected
    severity: CRITICAL
    auto_action: invalidate_all_affected_consents; alert_T4_HR; mandatory_audit; board_report

  ECF-005:
    name: "Refusal Alternative Not Provided"
    condition: |
      consent_record.decision = REFUSE
      AND human_alternative_process.initiated = false
      AFTER consent_request.tier_alternative_deadline
    severity: HIGH
    auto_action: alert_HR; mandate_alternative_activation; track_compliance

  ECF-006:
    name: "Employment Consequence for Consent Refusal"
    condition: |
      employee.performance_record SHOWS adverse_action
      AND employee.consent_record.decision = REFUSE
      AND temporal_proximity(adverse_action, refusal) <= 90_days
    severity: CRITICAL
    auto_action: alert_T4_HR_Legal; freeze_adverse_action; mandatory_investigation
```

---

## Integration

```
Feeds into:
  consent-governance/consent-governance-engine.md — individual consent records
  legitimacy-systems/constitutional-legitimacy-systems.md — consent as comprehension signal
  legitimacy-systems/organizational-trust-mechanisms.md — consent experience affects trust

Receives from:
  legitimacy-systems/explainable-authority-systems.md — explanation quality gates consent validity
  authorization/role-management.md — AI system scope definitions
  hr/employment-systems.md — employee roster and rights framework
```

---

## Governance

**Consent is separate from employment agreement:** Consent for AI interactions is a separate document from employment contracts; bundling consent into employment terms is prohibited for TIER_2+  
**Refusal record is confidential:** An employee's decision to refuse consent for AI processes is not accessible to their direct manager or evaluation chain without T4 authorization  
**Comprehension is the organization's responsibility:** If employees cannot achieve minimum comprehension scores, the AI system deployment is paused until information is redesigned — comprehension failure is a deployment blocker, not an employee failure  
**Audit:** All consent records and state transitions to `memory/consent-governance/employee-consent-audit.jsonl`; 10-year retention
