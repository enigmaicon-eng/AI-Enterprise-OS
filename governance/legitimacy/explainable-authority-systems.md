# Explainable Authority Systems
**ID:** LGT-EAS-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Ensures that every exercise of authority within the enterprise AI OS — every significant decision, every constraint imposed, every action taken by agents — can be explained in terms that the affected person can understand, challenge, and appeal. Explainability of authority is not a technical feature; it is a fundamental legitimacy requirement. An organization where consequential decisions are made by opaque AI systems without accessible explanation is not a governed organization — it is an automated one. This system enforces the right to explanation at every tier.

---

## Authority Explanation Taxonomy

```yaml
authority_explanation_taxonomy:

  DECISION_EXPLANATION:
    definition: why this specific decision was made — what facts were considered,
                what rules applied, what alternatives were evaluated
    required_depth: proportional to decision impact
    format: plain-language summary + structured evidence + rule citations
    
  SOURCE_OF_AUTHORITY_EXPLANATION:
    definition: where the authority to make this decision comes from —
                which governance document, which delegation chain, which policy
    required_for: all T3+ decisions; all decisions affecting individual employees
    format: authority chain from constitutional principle to specific decision-maker
    
  CONSTRAINT_EXPLANATION:
    definition: why a particular action was blocked, limited, or conditioned —
                which policy rule applied, why it applies in this context
    required_for: all DENY verdicts; all REQUIRE_APPROVAL verdicts
    format: policy rule text + applicability reasoning + appeal pathway
    
  PROCESS_EXPLANATION:
    definition: how a governance process works — what steps it follows,
                who participates at each stage, how input is incorporated
    required_for: any governance process an employee is subject to
    format: plain-language flowchart + participant roles + decision criteria
    
  OUTCOME_EXPLANATION:
    definition: why the result turned out as it did — connecting inputs,
                process, and decision to the final outcome
    required_for: outcomes that significantly affect employees or operations
    format: narrative explanation + alternative scenario analysis if warranted
```

---

## Explanation Quality Standards

```yaml
explanation_quality_standards:

  LEVEL_1_MINIMAL:
    # Adequate for low-impact routine decisions
    requirements:
      - states what decision was made
      - names the decision-maker (agent or human)
      - cites the applicable rule or policy
    word_count_target: 50–150 words
    plain_language_score_minimum: 0.70
    
  LEVEL_2_STANDARD:
    # Required for decisions with moderate employee impact
    requirements:
      - all LEVEL_1 requirements
      - explains why the rule applies to this situation
      - describes what alternatives were considered
      - states the appeal pathway
    word_count_target: 150–400 words
    plain_language_score_minimum: 0.75
    
  LEVEL_3_COMPREHENSIVE:
    # Required for high-impact decisions affecting individuals significantly
    requirements:
      - all LEVEL_2 requirements
      - complete authority chain from constitutional principle to decision
      - evidence basis for factual claims
      - explanation of how stakeholder input was considered
      - precedent citations if applicable
    word_count_target: 400–1000 words
    plain_language_score_minimum: 0.80
    
  LEVEL_4_CONSTITUTIONAL:
    # Required for constitutional decisions, policy changes, tier authority exercises
    requirements:
      - all LEVEL_3 requirements
      - formal rationale document authored by accountable human
      - independent review of explanation quality
      - dissent record if applicable
      - projected impact analysis
    format: formal governance document; published to transparency register
    plain_language_score_minimum: 0.80
    supplementary_technical_annex_permitted: true
```

---

## Authority Chain Disclosure

```
generate_authority_chain(decision):
  # Constructs the complete authority derivation from constitutional principle
  # down to the specific agent or human who made the decision

  chain = AuthorityChain { links: [] }

  # Link 1: Constitutional grounding
  constitutional_principles = identify_constitutional_basis(decision)
  chain.links.append(AuthorityLink {
    level: CONSTITUTIONAL,
    source: "enterprise-constitution.md",
    principle_ids: constitutional_principles,
    statement: plain_language_statement(constitutional_principles)
  })

  # Link 2: Governance policy
  governing_policy = get_governing_policy(decision)
  chain.links.append(AuthorityLink {
    level: POLICY,
    source: governing_policy.source_file,
    policy_id: governing_policy.id,
    statement: governing_policy.plain_language_summary
  })

  # Link 3: Role authorization
  role = get_decision_maker_role(decision)
  chain.links.append(AuthorityLink {
    level: ROLE_AUTHORIZATION,
    source: "authorization/role-management.md",
    role_id: role.id,
    granted_by: role.granted_by,
    statement: "Role {role.name} at tier {role.tier} is authorized to make decisions of type {decision.type}"
  })

  # Link 4: Specific delegation (if applicable)
  if decision.was_delegated:
    chain.links.append(AuthorityLink {
      level: DELEGATION,
      delegation_record_id: decision.delegation_record_id,
      delegating_agent: decision.delegated_from,
      constraints: decision.delegation_constraints,
      statement: "Authority specifically delegated via {delegation_record_id}"
    })

  # Link 5: Decision-maker
  chain.links.append(AuthorityLink {
    level: DECISION_MAKER,
    agent_id: decision.decision_maker_id,
    identity_type: decision.decision_maker_type,
    statement: "Decision made by {decision.decision_maker_id} ({decision.decision_maker_type})"
  })

  chain.is_complete = validate_chain_completeness(chain)
  chain.has_gaps = detect_authority_gaps(chain)

  Return: chain
```

---

## Detection Rules

```yaml
explainable_authority_rules:

  EAS-001:
    name: "High-Impact Decision Without Adequate Explanation"
    condition: |
      decision.impact_tier >= SIGNIFICANT
      AND decision.explanation.quality_level < LEVEL_2_STANDARD
    severity: HIGH
    auto_action: flag_explanation_gap; queue_explanation_supplement; alert_decision_maker
    
  EAS-002:
    name: "Authority Chain Incomplete"
    condition: |
      decision.authority_chain.is_complete = false
      OR decision.authority_chain.has_gaps = true
      AND decision.tier >= T3
    severity: HIGH
    auto_action: suspend_decision_display; request_chain_completion; alert_T3
    
  EAS-003:
    name: "Plain Language Score Below Standard"
    condition: |
      explanation.plain_language_score < explanation.required_minimum_score
      AND explanation.audience_type = EMPLOYEE
    severity: MEDIUM
    auto_action: flag_for_rewrite; suggest_plain_language_revision; track_readability_debt
    
  EAS-004:
    name: "Appeal Pathway Not Disclosed"
    condition: |
      decision.type IN [DENY, CONSTRAINT, POLICY_ENFORCEMENT, PERFORMANCE_CONSEQUENCE]
      AND decision.explanation does NOT include appeal_pathway
    severity: HIGH
    auto_action: append_standard_appeal_pathway_disclosure; alert_decision_maker
    
  EAS-005:
    name: "Constitutional Decision Without Level 4 Explanation"
    condition: |
      decision.type IN [CONSTITUTIONAL_MODIFICATION, POLICY_ACTIVATION, TIER_AUTHORITY_CHANGE]
      AND decision.explanation.quality_level < LEVEL_4_CONSTITUTIONAL
    severity: CRITICAL
    auto_action: block_decision_effect; alert_T4; require_formal_rationale_document
    
  EAS-006:
    name: "Explanation Comprehension Failure"
    condition: |
      decision.explanation_comprehension_rate(survey_window=30_days) < 0.50
      (fewer than half of recipients understood the explanation)
    severity: HIGH
    auto_action: trigger_explanation_redesign; plain_language_review; targeted_outreach
```

---

## Plain Language Scoring

```
score_plain_language(text, audience_type):
  # Measures readability and accessibility of explanations

  metrics = {
    flesch_kincaid_grade: compute_FK_grade(text),
    passive_voice_rate:   count_passive_constructions(text) / sentence_count(text),
    jargon_density:       count_technical_terms(text) / word_count(text),
    sentence_avg_length:  mean([len(s) for s in sentences(text)]),
    abstract_noun_rate:   count_abstract_nouns(text) / word_count(text),
    actionability:        count_action_verbs(text) / sentence_count(text)
  }

  # Audience-specific benchmarks
  benchmarks = PLAIN_LANGUAGE_BENCHMARKS[audience_type]

  scores = {}
  for metric, value in metrics.items():
    scores[metric] = normalize_to_0_1(value, benchmarks[metric])

  weights = {
    flesch_kincaid_grade: 0.30,
    jargon_density:        0.25,
    passive_voice_rate:    0.15,
    sentence_avg_length:   0.15,
    abstract_noun_rate:    0.10,
    actionability:         0.05
  }

  composite = sum([scores[m] * weights[m] for m in weights])
  Return: composite

PLAIN_LANGUAGE_BENCHMARKS = {
  EMPLOYEE:           { FK_grade_max: 10, jargon_max: 0.05, passive_max: 0.20 },
  MANAGER:            { FK_grade_max: 12, jargon_max: 0.08, passive_max: 0.25 },
  GOVERNANCE_SPECIALIST: { FK_grade_max: 14, jargon_max: 0.15, passive_max: 0.30 }
}
```

---

## Explanation Registry

```yaml
explanation_registry:
  # Authoritative record of all governance explanations published

  explanation_record:
    id: EXP-{NNN}
    decision_id: reference to governed decision
    explanation_level: LEVEL_1 through LEVEL_4
    plain_language_score: float
    authority_chain_id: reference to authority chain record
    author: agent_id or human_id
    human_reviewed: boolean  # required for LEVEL_3+
    published_at: ISO8601
    comprehension_survey_id: optional reference
    revisions: [list of revision records with reason and date]
    appeal_pathway_included: boolean
    sha256: content hash for integrity
```

---

## Integration

```
Feeds into:
  legitimacy-systems/legitimacy-engine.md — authority explanation quality scores
  consent-governance/employee-consent-frameworks.md — explanation quality gates consent validity
  democratic-governance/governance-review-councils.md — explanation gaps surface in council reviews

Receives from:
  authorization/policy-decision-point.md — DENY/APPROVE decisions requiring explanation
  approval-operations/approval-workflow-engine.md — approval decisions
  governance/constitutional-governor-quorum.md — constitutional decisions
  trust/explainability-engine.md — explanation depth and quality metrics
```

---

## Governance

**Every consequential decision has an explanation:** Decisions with impact_tier >= SIGNIFICANT must have a LEVEL_2+ explanation published within 24 hours; this is not optional and cannot be waived  
**AI cannot be the sole author of LEVEL_3+ explanations:** Level 3 and Level 4 explanations require human review and sign-off; AI drafts are permitted but must be reviewed, edited, and approved by an accountable human  
**Explanations are permanent governance records:** Once published, explanations are immutable; corrections are made by publishing an addendum, not editing the original; the original remains accessible  
**Audit:** All explanation records and quality assessments to `memory/legitimacy-systems/explanation-audit.jsonl`; 10-year retention
