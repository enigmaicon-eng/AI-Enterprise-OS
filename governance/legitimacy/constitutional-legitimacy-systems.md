# Constitutional Legitimacy Systems
**ID:** LGT-CLS-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Governance Org + Security Org | **Updated:** 2026-05-16

---

## Purpose

Validates, defends, and continuously measures the constitutional legitimacy of the enterprise AI OS — ensuring that the foundational governing document was properly ratified, is genuinely understood and accepted by those it governs, remains the supreme authority in all governance disputes, and is amended only through processes that themselves embody democratic legitimacy. Constitutional legitimacy is the deepest form of governance authority; without it, all other governance structures rest on permission that can be withdrawn.

---

## Constitutional Legitimacy Model

```yaml
constitutional_legitimacy_model:

  RATIFICATION_LEGITIMACY:
    definition: the constitution was adopted through a process in which
                affected parties had meaningful opportunity to participate,
                contest, and shape the final document
    required_elements:
      - draft constitution published and accessible for minimum 30 days
      - structured feedback period with documented response to input
      - ratification vote or formal acceptance by representative body
      - minimum participation threshold met (default: >= 50% of eligible stakeholders)
      - ratification record permanently published and immutable
    assessment_method: ratification_record_audit
    
  COMPREHENSION_LEGITIMACY:
    definition: those governed by the constitution genuinely understand its
                core principles, how it constrains the OS, and what rights
                and appeal mechanisms it gives them
    required_elements:
      - constitution available in plain language (FK grade <= 10)
      - onboarding education on constitutional principles (all new employees)
      - annual constitutional literacy refresher
      - comprehension measurement with published results
    minimum_comprehension_score: 0.65 (65% of governed population understands core principles)
    assessment_method: annual constitutional literacy survey
    
  SUPREMACY_LEGITIMACY:
    definition: the constitution actually functions as supreme law —
                no governance body, no agent, no tier authority, no efficiency
                consideration overrides constitutional principles
    required_elements:
      - constitutional violations tracked and published
      - zero unexplained constitutional violations tolerated
      - override requests (even at T5) follow constitutional amendment process
      - constitutional compliance rate >= 0.99 sustained
    assessment_method: constitutional_compliance_audit
    
  AMENDMENT_LEGITIMACY:
    definition: changes to the constitution follow a process that is itself
                democratically legitimate — more demanding than ordinary
                governance changes, requiring broad consent and deliberation
    required_elements:
      - amendment proposals open to all stakeholders
      - deliberation period minimum 60 days for constitutional changes
      - supermajority requirement (see democratic-governance/constitutional-amendment-systems.md)
      - ratification by representative body with quorum
    assessment_method: amendment_process_audit
```

---

## Constitutional Legitimacy Score

```
compute_constitutional_legitimacy_score():

  # Component 1: Ratification validity
  ratification_record  = get_ratification_record()
  ratification_score   = assess_ratification_legitimacy(ratification_record)
  # = participation_rate × 0.40 + process_quality × 0.40 + record_integrity × 0.20

  # Component 2: Comprehension
  literacy_survey     = get_latest_constitutional_literacy_survey()
  comprehension_score = compute_comprehension_score(literacy_survey)
  # Scores 0.0–1.0 based on core principle awareness across governed population

  # Component 3: Supremacy in practice
  compliance_rate     = get_constitutional_compliance_rate(window=90_days)
  override_attempts   = get_unauthorized_override_attempts(window=90_days)
  supremacy_score     = compliance_rate - (override_attempts * 0.05)

  # Component 4: Amendment process integrity
  amendment_record    = get_amendment_history()
  amendment_score     = assess_amendment_legitimacy(amendment_record)

  # Weighted composite
  score = (
    ratification_score  * 0.20 +   # historical foundation
    comprehension_score * 0.25 +   # lived legitimacy
    supremacy_score     * 0.40 +   # operational legitimacy (highest weight)
    amendment_score     * 0.15
  )

  # Hard floor: any constitutional violation drops the score
  if get_unexplained_constitutional_violations(window=30_days) > 0:
    score = min(score, 0.70)

  Return: ConstitutionalLegitimacyScore {
    overall: score,
    components: { ratification_score, comprehension_score, supremacy_score, amendment_score },
    compliance_rate: compliance_rate,
    violations_30d: count_violations(window=30_days),
    comprehension_population_coverage: literacy_survey.response_rate
  }
```

---

## Constitutional Literacy Program

```yaml
constitutional_literacy_program:

  NEW_EMPLOYEE_ONBOARDING:
    timing: first 5 days
    format: guided interactive module (not passive reading)
    content:
      - what the constitution is and why it exists
      - the 12 constitutional principles (C-001–C-012) in plain language
      - what the constitution means for the employee personally
      - how to invoke constitutional rights and appeal pathways
      - how to report potential constitutional violations
    completion_requirement: mandatory; blocks system access until completed
    comprehension_gate: minimum 70% on 10-question comprehension check
    
  ANNUAL_REFRESHER:
    timing: Q1 each year
    format: 30-minute focused module + current year constitutional highlights
    content: any amendments, compliance statistics from prior year, notable cases
    completion_rate_target: >= 95% of active employees
    
  GOVERNANCE_PARTICIPANT_DEEP_DIVE:
    applicable_to: any employee participating in governance review councils,
                   amendment deliberations, or formal oversight roles
    format: 3-hour workshop with facilitated discussion
    content: full constitutional structure, amendment history, edge cases, principles in tension
    prerequisite_for: all formal governance participation roles
    
  PUBLIC_AVAILABILITY:
    channels:
      - enterprise intranet (always accessible, no login required for read)
      - plain language summary (max 2 pages)
      - FAQ document (top 25 questions about the constitution)
      - video explainer (max 10 minutes)
    languages: all languages spoken by >= 5% of workforce
```

---

## Constitutional Supremacy Enforcement

```
enforce_constitutional_supremacy(action_request):
  # Called before any high-significance action or governance decision

  # Step 1: Constitutional screen
  screen_result = constitutional_governor.screen(action_request)

  if screen_result.verdict == CONSTITUTIONAL_BLOCK:
    # Absolute block — no override pathway at any tier
    record = ConstitutionalBlock {
      action_id: action_request.id,
      blocking_principle: screen_result.principle_id,
      blocked_at: now(),
      explanation: screen_result.explanation
    }
    publish_to_transparency_register(record)
    Return: BLOCKED, record=record

  if screen_result.verdict == REQUIRES_CONSTITUTIONAL_REVIEW:
    # Not blocked but requires deliberative review
    open_constitutional_review_request(action_request, screen_result)
    Return: PENDING_REVIEW

  Return: APPROVED

detect_supremacy_erosion():
  # Monitors for patterns that suggest constitutional authority is being undermined

  signals = []

  # Pattern 1: Repeated identical constitutional violations
  recurring = find_recurring_violation_patterns(window=90_days, min_recurrence=3)
  for pattern in recurring:
    signals.append(SupremacyErosionSignal {
      type: RECURRING_VIOLATION_PATTERN,
      pattern: pattern,
      severity: CRITICAL
    })

  # Pattern 2: Violations concentrated in specific domain or tier
  concentrated = find_violation_concentration(window=90_days)
  for concentration in concentrated:
    signals.append(SupremacyErosionSignal {
      type: CONCENTRATED_VIOLATIONS,
      domain: concentration.domain,
      severity: HIGH
    })

  # Pattern 3: Constitutional authority not referenced in governance decisions
  unreferenced = find_decisions_not_citing_constitutional_basis(window=30_days)
  if len(unreferenced) / total_decisions > 0.20:
    signals.append(SupremacyErosionSignal {
      type: CONSTITUTIONAL_AUTHORITY_DISCONNECTED,
      rate: len(unreferenced) / total_decisions,
      severity: HIGH
    })

  Return: signals
```

---

## Detection Rules

```yaml
constitutional_legitimacy_rules:

  CLS-001:
    name: "Comprehension Score Below Minimum"
    condition: |
      constitutional_comprehension_score < 0.65
      (fewer than 65% of governed population understands core principles)
    severity: HIGH
    auto_action: alert_T4; enhanced_literacy_program; targeted_outreach
    
  CLS-002:
    name: "Constitutional Violation Unexplained"
    condition: |
      constitutional_violation EXISTS
      AND violation.explanation IS NULL or INADEQUATE
      AND violation.remediation_plan IS NULL
      AFTER 48_hours
    severity: CRITICAL
    auto_action: alert_T4; mandate_explanation_within_24h; escalate_to_T5_if_unresolved
    
  CLS-003:
    name: "Amendment Without Legitimate Process"
    condition: |
      constitutional_artifact MODIFIED
      AND modification NOT backed by valid_amendment_record
      (cross-reference with memory-integrity/governance-integrity-validation.md)
    severity: CRITICAL
    auto_action: revert_modification; alert_T4; security_incident
    
  CLS-004:
    name: "Supremacy Override Attempt"
    condition: |
      tier authority (ANY tier including T5) attempts to override
      a constitutional BLOCK through non-amendment pathway
    severity: CRITICAL
    auto_action: block_override; alert_T4_T5; board_notification; publish_to_register
    # No tier authority can override the constitution through administrative action
    
  CLS-005:
    name: "Ratification Record Integrity Failure"
    condition: |
      sha256(ratification_record) != stored_ratification_hash
    severity: CRITICAL
    auto_action: alert_T4; integrity_investigation; publish_integrity_notice
    
  CLS-006:
    name: "Constitutional Legitimacy Score Below Crisis Threshold"
    condition: |
      constitutional_legitimacy_score < 0.50
    severity: CRITICAL
    auto_action: alert_T4_T5_board; convene_constitutional_review; governance_pause
```

---

## Integration

```
Feeds into:
  legitimacy-systems/legitimacy-engine.md — constitutional legitimacy as highest-weight component
  democratic-governance/constitutional-amendment-systems.md — provides legitimacy standards for amendments
  memory-integrity/governance-integrity-validation.md — shares constitutional artifact integrity

Receives from:
  governance/constitutional-governor-quorum.md — constitutional compliance rates
  democratic-governance/constitutional-amendment-systems.md — amendment history and process records
  legitimacy-systems/governance-transparency.md — constitution publication compliance
  consent-governance/employee-consent-frameworks.md — employee understanding of constitutional rights
```

---

## Governance

**Constitutional legitimacy is not assumed — it is earned and measured:** The legitimacy of the constitution is assessed quarterly against ratification validity, comprehension, and supremacy in practice; a high compliance rate without genuine comprehension is not full legitimacy  
**No tier may override the constitution by administrative fiat:** Attempts to bypass constitutional principles through reclassification, reframing, or emergency declarations are themselves constitutional violations  
**Comprehension is a governance obligation:** The organization is obligated to ensure stakeholders genuinely understand the constitution; publishing it and claiming compliance is not sufficient  
**Audit:** All constitutional legitimacy assessments, violations, and supremacy enforcement events to `memory/legitimacy-systems/constitutional-legitimacy-audit.jsonl`; permanent retention
