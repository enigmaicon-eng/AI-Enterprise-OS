# Regional Policy Enforcement
**ID:** GPG-RPE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Legal Org + Governance Org | **Updated:** 2026-05-16

---

## Purpose

Translates jurisdiction-specific legal requirements into machine-enforceable policies and applies them at runtime to every agent action within or affecting a sovereign region. Regional policy enforcement is the runtime layer of geopolitical governance: it maintains a living policy catalog per jurisdiction, detects regulatory changes, propagates policy updates to affected agents and workflows, and blocks operations that violate active regional policies before they execute.

---

## Policy Catalog

### EU Policy Set (POLICY-EU)

```yaml
eu_policies:
  EU-POL-001:
    name: GDPR_LAWFUL_BASIS_REQUIRED
    regulation: GDPR Art.6
    rule: All personal data processing must have a documented lawful basis
    enforcement: PRE_ACTION_GATE
    violation_response: BLOCK
    
  EU-POL-002:
    name: GDPR_DATA_MINIMIZATION
    regulation: GDPR Art.5(1)(c)
    rule: Only collect and process data strictly necessary for stated purpose
    enforcement: SCHEMA_VALIDATION + PRE_ACTION_GATE
    violation_response: BLOCK
    
  EU-POL-003:
    name: GDPR_RETENTION_LIMITS
    regulation: GDPR Art.5(1)(e)
    rule: Personal data must not be retained beyond stated retention period
    enforcement: AUTOMATED_PURGE + PRE_ACTION_GATE
    violation_response: AUTO_PURGE (if expired) | BLOCK (if no retention policy)
    
  EU-POL-004:
    name: GDPR_RIGHT_TO_ERASURE
    regulation: GDPR Art.17
    rule: Valid erasure requests must be processed within 30 days
    enforcement: SLA_TRACKER
    violation_response: ESCALATE_T4 at day 25; CRITICAL at day 30
    
  EU-POL-005:
    name: GDPR_ART22_AUTOMATED_DECISIONS
    regulation: GDPR Art.22
    rule: No solely automated decisions with significant effect without human review
    enforcement: PRE_ACTION_GATE (applied to all autonomous Level 3+ agent decisions)
    violation_response: REQUIRE_HUMAN_REVIEW_BEFORE_COMMIT
    
  EU-POL-006:
    name: EU_AI_ACT_PROHIBITED_PRACTICES
    regulation: EU AI Act Art.5
    rule: Prohibited AI practices must never execute
    enforcement: CONSTITUTIONAL_BLOCK (cannot be overridden)
    practices_prohibited:
      - SUBLIMINAL_MANIPULATION
      - EXPLOITING_VULNERABILITIES
      - REAL_TIME_BIOMETRIC_REMOTE_ID_PUBLIC
      - SOCIAL_SCORING_PUBLIC_AUTHORITY
      - EMOTION_RECOGNITION_WORKPLACE_EDUCATION (unless safety use)
    violation_response: PERMANENT_BLOCK; cannot be authorized at any tier
    
  EU-POL-007:
    name: EU_AI_ACT_HIGH_RISK_DOCUMENTATION
    regulation: EU AI Act Art.9-17
    rule: High-risk AI systems must maintain technical documentation and logs
    enforcement: AUDIT_GATE
    violation_response: BLOCK_DEPLOYMENT
    
  EU-POL-008:
    name: NIS2_INCIDENT_NOTIFICATION
    regulation: NIS2 Art.23
    rule: Significant incidents must be reported to CSIRT within 24h (early warning) + 72h (notification)
    enforcement: SLA_TRACKER (auto-escalate)
    violation_response: ESCALATE_T4 at 20h
```

### China Policy Set (POLICY-CN)

```yaml
cn_policies:
  CN-POL-001:
    name: PIPL_CONSENT_REQUIRED
    regulation: PIPL Art.13-17
    rule: Personal information processing requires separate, explicit consent
    enforcement: PRE_ACTION_GATE
    violation_response: BLOCK
    
  CN-POL-002:
    name: PIPL_CROSS_BORDER_RESTRICTION
    regulation: PIPL Art.38-40
    rule: Cross-border transfer requires CAC mechanism; volume thresholds trigger assessment
    enforcement: PRE_ACTION_GATE + VOLUME_TRACKER
    violation_response: BLOCK; CAC filing required
    
  CN-POL-003:
    name: DSL_IMPORTANT_DATA_CLASSIFICATION
    regulation: DSL Art.21
    rule: Important data must be classified and stored domestically
    enforcement: CLASSIFICATION_GATE + RESIDENCY_ENFORCEMENT
    violation_response: BLOCK_EXPORT; mandatory domestic storage
    
  CN-POL-004:
    name: ALGORITHM_REGISTRATION
    regulation: CAAC Interim Measures for Algorithm Recommendation
    rule: Algorithm recommendation systems must register with CAC
    enforcement: DEPLOYMENT_GATE
    violation_response: BLOCK_DEPLOYMENT until registered
    
  CN-POL-005:
    name: AI_GENERATED_CONTENT_LABELING
    regulation: Interim Measures for Generative AI
    rule: AI-generated content must be labeled; synthetic media disclosure required
    enforcement: OUTPUT_GATE
    violation_response: AUTO_APPLY_LABEL | BLOCK if label cannot be applied
```

### US Policy Set (POLICY-US)

```yaml
us_policies:
  US-POL-001:
    name: CCPA_CONSUMER_RIGHTS
    regulation: CCPA/CPRA
    rule: California consumers have rights to know, delete, opt-out, correct
    enforcement: REQUEST_SLA_TRACKER
    violation_response: ESCALATE_T3 at day 40 (45-day response window); ESCALATE_T4 at day 44
    
  US-POL-002:
    name: COPPA_CHILDREN_PROHIBITION
    regulation: COPPA
    rule: No collection or processing of personal data of children under 13 without parental consent
    enforcement: PRE_ACTION_GATE (age verification required)
    violation_response: PERMANENT_BLOCK; constitutional equivalent
    
  US-POL-003:
    name: SOX_FINANCIAL_RECORD_RETENTION
    regulation: SOX Sec.802
    rule: Financial records must be retained for 7 years; destruction is criminal
    enforcement: RETENTION_LOCK
    violation_response: BLOCK_DELETION; legal hold placed automatically
    
  US-POL-004:
    name: HIPAA_PHI_SAFEGUARDS
    regulation: HIPAA Security Rule
    rule: Protected Health Information requires encryption, access controls, audit logs
    enforcement: DATA_CLASSIFICATION_GATE + AUDIT_GATE
    violation_response: BLOCK unencrypted PHI processing
```

---

## Policy Engine

```
evaluate_policy(operation, agent_context, region) → PolicyDecision:

  1. Identify applicable policy sets:
     active_policies = policy_catalog.get_for_region(region)
     
  2. Filter to relevant policies:
     relevant = [p for p in active_policies if policy_applies_to_operation(p, operation)]
     
  3. Evaluate each policy:
     results = []
     for policy in relevant:
       result = evaluate_single_policy(policy, operation, agent_context)
       results.append(result)
       
  4. Aggregate decision:
     if any result.decision == PERMANENT_BLOCK: return PERMANENT_BLOCK (cannot override)
     if any result.decision == BLOCK: return BLOCK (T4 required to override)
     if any result.decision == REQUIRE_HUMAN_REVIEW: return REQUIRE_HUMAN_REVIEW
     if any result.decision == WARN: return WARN (proceed with disclosure)
     return PERMIT
     
  evaluate_single_policy(policy, operation, context):
     match policy.enforcement:
       PRE_ACTION_GATE: evaluate rule against operation parameters
       SCHEMA_VALIDATION: check payload against policy schema
       SLA_TRACKER: check if SLA deadline applies; escalate if near
       CONSTITUTIONAL_BLOCK: always return PERMANENT_BLOCK
       AUDIT_GATE: check audit log exists; block if not
       RETENTION_LOCK: check retention status; block deletion if locked
```

---

## Policy Lifecycle Management

```yaml
policy_lifecycle:

  policy_update_trigger:
    regulatory_change_detected: true    # auto-detected via regulatory monitoring
    legal_org_review_cycle: quarterly
    incident_driven_update: immediate
    
  update_process:
    1. Legal Org drafts policy update
    2. Architecture Org reviews technical enforceability
    3. T4 approval for new BLOCK-level policies
    4. Policy tested in SYNTHETIC environment
    5. Staged rollout: EU-test → EU → global (for applicable policies)
    6. Agents notified via canonical event (POLICY_UPDATED)
    
  emergency_policy_update:
    trigger: regulatory authority emergency order
    authority: T4 + Legal Org (can skip staged rollout)
    max_implementation_time: 24 hours for BLOCK-level; 72 hours for WARN-level
    
  policy_version_control:
    all_policy_versions: retained permanently (regulatory evidence)
    active_policy: current version only
    effective_from: ISO8601 (future dating allowed for scheduled regulation effective dates)
```

---

## Regulatory Monitoring

```yaml
regulatory_monitoring:
  monitored_sources:
    EU: [EUR_LEX, EDPB_GUIDELINES, EU_AI_OFFICE_REGISTRY]
    CN: [CAC_OFFICIAL, MIIT_REGISTRY, SAMR_ANNOUNCEMENTS]
    US: [FTC_PRESS, SEC_EDGAR, HHS_GUIDANCE, STATE_AG_OFFICES]
    IN: [MCA_REGISTRY, RBI_CIRCULARS, MEITY_NOTIFICATIONS]
    GB: [ICO_GUIDANCE, GOV_UK_LEGISLATION]
    SG: [PDPC_GUIDELINES, MAS_NOTICES]
    
  monitoring_frequency: daily (automated scrape + NLP change detection)
  
  change_classification:
    EMERGENCY_ORDER: trigger immediate policy update process
    NEW_REGULATION: T4 + Legal Org review within 30 days
    GUIDELINE_UPDATE: Legal Org review within 60 days
    ENFORCEMENT_ACTION: update risk model; review compliance immediately
    
  alert_routing:
    EMERGENCY_ORDER: T4 + Legal Org immediate
    NEW_REGULATION: T3 + Legal Org weekly digest
    GUIDELINE_UPDATE: Legal Org monthly digest
```

---

## Integration

```
Feeds into:
  regional-cognition-boundaries.md — prohibited zones derived from PERMANENT_BLOCK policies
  jurisdiction-aware-memory.md — retention policies fed from GDPR/PIPL/SOX rules
  jurisdiction-aware-orchestration.md — policy decisions gate orchestration
  regulatory-conflict-arbitration.md — conflicting policies from different jurisdictions sent here

Receives from:
  regulatory-conflict-arbitration.md — conflict resolutions update policy sets
  cross-border-governance.md — transfer mechanism status affects policy gate outcomes
  restricted-cognition-domains.md — domain restrictions implemented as PERMANENT_BLOCK policies
```

---

## Governance

**PERMANENT_BLOCK policies:** Cannot be overridden at any tier; treat as equivalent to constitutional violations  
**Policy coverage audit:** Quarterly check that all active regulations in all jurisdictions have corresponding policies; gaps = CRITICAL  
**Regulatory monitoring SLA:** Regulatory changes identified within 72 hours; policies updated within 30 days  
**Audit:** All policy evaluation decisions to `memory/geopolitical-governance/policy-enforcement-log.jsonl` (per-jurisdiction copies)
