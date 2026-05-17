# Consent Governance Engine
**ID:** CGV-ENG-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Governance Org + HR Org | **Updated:** 2026-05-16

---

## Purpose

Master coordinator for enterprise AI consent governance — ensuring that employees and stakeholders affected by AI systems have meaningful, ongoing, and revocable consent over how those systems operate in their work lives. Consent is not a one-time checkbox; it is a living relationship between the organization and the people it governs. This engine aggregates consent signals, enforces consent requirements before AI actions, detects consent erosion, and maintains the consent registry that governs all AI interactions with human stakeholders.

---

## Consent Taxonomy

```yaml
consent_taxonomy:

  INFORMED_CONSENT:
    definition: person understands what they are consenting to — what AI does,
                how decisions are made, what data is used, what alternatives exist
    prerequisite: information must be provided in plain language before consent is sought
    validity_conditions:
      - information comprehension score >= 0.70
      - no material changes since last consent
      - no coercion indicators present
    failure_mode: consent obtained without genuine understanding

  VOLUNTARY_CONSENT:
    definition: consent given freely without coercion, penalty for refusal, or
                undue pressure — there must be a genuine, consequence-free refusal option
    prerequisite: refusal pathway must be clearly communicated and accessible
    validity_conditions:
      - no employment consequence for refusal (documented)
      - refusal option presented at same prominence as acceptance
      - no time pressure beyond reasonable processing time
    failure_mode: consent obtained through implicit or explicit coercion

  SPECIFIC_CONSENT:
    definition: consent covers a defined scope — people consent to specific
                AI uses, not a blanket authorization for any future AI deployment
    prerequisite: each distinct AI use case requires its own consent
    validity_conditions:
      - consent scope explicitly defined (what AI, what decisions, what domain)
      - consent does not extend to materially different use cases
      - bundled consent prohibited for high-impact AI uses
    failure_mode: scope creep beyond what was consented to

  ONGOING_CONSENT:
    definition: consent is not permanent — it can be withdrawn at any time
                and must be periodically reaffirmed for material AI interactions
    prerequisite: withdrawal mechanism must be as simple as giving consent
    validity_conditions:
      - consent withdrawal honored within 24 hours
      - annual reaffirmation required for persistent AI governance roles
      - material capability changes trigger consent refresh
    failure_mode: treating initial consent as permanent authorization

  COLLECTIVE_CONSENT:
    definition: for AI systems affecting entire teams or departments, collective
                deliberation and representative consent supplements individual consent
    prerequisite: representative body must exist with genuine deliberative capacity
    validity_conditions:
      - deliberation period >= 30 days for new AI system deployments
      - dissent record published with collective consent
      - individual opt-out preserved even with collective consent
    failure_mode: collective consent suppressing individual dissent
```

---

## Consent Posture Score

```
compute_consent_posture():

  # Component 1: Individual consent validity rate
  active_consents  = get_active_consent_records()
  valid_consents   = [c for c in active_consents if is_consent_valid(c)]
  consent_validity = len(valid_consents) / len(active_consents) if active_consents else 0.0

  # Component 2: Consent comprehension quality
  comprehension_scores = [c.comprehension_score for c in valid_consents]
  avg_comprehension    = mean(comprehension_scores) if comprehension_scores else 0.0

  # Component 3: Voluntary consent index (no coercion detections)
  coercion_incidents = count_coercion_incidents(window=90_days)
  voluntary_index    = max(0.0, 1.0 - (coercion_incidents * 0.10))

  # Component 4: Withdrawal respect rate
  withdrawal_requests  = get_withdrawal_requests(window=90_days)
  honored_withdrawals  = [w for w in withdrawal_requests if w.honored_within_24h]
  withdrawal_rate      = len(honored_withdrawals) / len(withdrawal_requests) if withdrawal_requests else 1.0

  # Component 5: Consent coverage (all AI interactions covered by valid consent)
  total_ai_interactions   = count_ai_interactions_requiring_consent(window=30_days)
  covered_interactions    = count_interactions_with_valid_consent(window=30_days)
  coverage_rate           = covered_interactions / total_ai_interactions if total_ai_interactions else 1.0

  posture_score = (
    consent_validity  * 0.30 +
    avg_comprehension * 0.25 +
    voluntary_index   * 0.20 +
    withdrawal_rate   * 0.15 +
    coverage_rate     * 0.10
  )

  # Hard floor: any coercion incident
  if coercion_incidents > 0:
    posture_score = min(posture_score, 0.75)

  # Hard floor: withdrawal not honored
  if withdrawal_rate < 0.90:
    posture_score = min(posture_score, 0.65)

  rag = GREEN if posture_score >= 0.85 else AMBER if posture_score >= 0.65 else RED

  Return: ConsentPosture {
    score: posture_score,
    rag: rag,
    components: {
      consent_validity, avg_comprehension, voluntary_index,
      withdrawal_rate, coverage_rate
    },
    active_consent_count: len(active_consents),
    invalid_consent_count: len(active_consents) - len(valid_consents),
    computed_at: now()
  }
```

---

## Consent Lifecycle Management

```
manage_consent_lifecycle(consent_record):

  # State machine: PENDING → ACTIVE → EXPIRING → EXPIRED | WITHDRAWN | INVALIDATED

  match consent_record.state:

    PENDING:
      # Consent request issued; awaiting employee response
      if now() > consent_record.response_deadline:
        if consent_record.default_on_no_response == DENY:
          transition(consent_record, EXPIRED)
          # No consent by silence; AI interaction blocked
        else:
          # Default-on requires explicit justification and T4 approval
          require_T4_justification("default-on consent attempted", consent_record)
          block_ai_interaction_until_resolved(consent_record)

    ACTIVE:
      # Check for validity conditions
      if consent_record.material_change_detected:
        transition(consent_record, INVALIDATED)
        notify_employee("Consent invalidated due to material change; re-consent required")
        block_ai_interaction(consent_record.scope)

      if consent_record.reaffirmation_due():
        transition(consent_record, EXPIRING)
        send_reaffirmation_request(consent_record)

    EXPIRING:
      # Grace period; AI interaction continues with enhanced disclosure
      if now() > consent_record.expiry_date:
        transition(consent_record, EXPIRED)
        block_ai_interaction(consent_record.scope)

    WITHDRAWN:
      # Consent revoked; AI interaction in scope must immediately stop
      enforce_withdrawal(consent_record)
      audit_log("Consent withdrawn", consent_record)

    INVALIDATED:
      # Consent voided due to material change, coercion detection, or integrity failure
      block_all_scope_interactions(consent_record.scope)
      require_fresh_consent_process(consent_record)
```

---

## Detection Rules

```yaml
consent_governance_rules:

  CGV-001:
    name: "AI Interaction Without Valid Consent"
    condition: |
      ai_interaction.requires_consent = true
      AND ai_interaction.consent_record IS NULL
      OR ai_interaction.consent_record.state NOT IN [ACTIVE, EXPIRING]
    severity: CRITICAL
    auto_action: block_interaction; alert_T4; log_consent_violation

  CGV-002:
    name: "Consent Comprehension Below Threshold"
    condition: |
      consent_record.comprehension_score < 0.70
      AND consent_record.state = ACTIVE
    severity: HIGH
    auto_action: flag_consent; require_comprehension_remediation; alert_consent_owner

  CGV-003:
    name: "Withdrawal Not Honored Within SLA"
    condition: |
      consent_withdrawal.submitted_at + 24_hours < now()
      AND consent_withdrawal.honored = false
    severity: CRITICAL
    auto_action: force_withdrawal_enforcement; alert_T4; escalate_to_T5_if_unresolved

  CGV-004:
    name: "Consent Scope Creep"
    condition: |
      ai_interaction.scope NOT SUBSET_OF consent_record.authorized_scope
    severity: HIGH
    auto_action: block_out_of_scope_interaction; alert_T3; flag_scope_violation

  CGV-005:
    name: "Coercion Indicator Detected"
    condition: |
      consent_collection.coercion_signals >= 1
      (employment_consequence_mentioned OR time_pressure_detected OR refusal_penalized)
    severity: CRITICAL
    auto_action: invalidate_consent; alert_T4_HR; mandatory_consent_audit; board_notification

  CGV-006:
    name: "Consent Coverage Below Threshold"
    condition: |
      consent_coverage_rate(window=30_days) < 0.95
    severity: HIGH
    auto_action: alert_T3; consent_gap_analysis; targeted_consent_outreach
```

---

## Integration

```
Feeds into:
  legitimacy-systems/legitimacy-engine.md — consent rates shape legitimacy posture
  social-stability/social-stability-engine.md — consent health feeds stability model
  democratic-governance/democratic-governance-engine.md — consent rates inform governance intensity

Receives from:
  consent-governance/employee-consent-frameworks.md — individual consent records
  consent-governance/ai-participation-governance.md — participation consent events
  consent-governance/human-override-sovereignty.md — override consent requirements
  consent-governance/escalation-appeal-systems.md — appeal consent impacts
  legitimacy-systems/explainable-authority-systems.md — explanation quality gates consent validity
```

---

## Governance

**No default-on consent:** Silence, inaction, or failure to respond to a consent request is never treated as consent; the default is non-consent  
**Consent withdrawal is unconditional:** An employee may withdraw consent at any time for any reason without providing justification; no minimum duration or penalty applies  
**Consent is not transferable:** An employee's consent does not authorize AI actions affecting other employees; each affected person requires their own valid consent  
**Audit:** All consent records, state transitions, withdrawals, and violations to `memory/consent-governance/consent-audit.jsonl`; 10-year retention
