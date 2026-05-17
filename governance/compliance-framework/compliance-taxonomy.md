# Compliance Taxonomy

## Purpose
Defines the classification system that organizes all compliance artifacts — obligations, controls, risks, findings, policies, and evidence — into a coherent vocabulary. A shared taxonomy prevents the fragmentation where each team invents its own categories, enables cross-domain analysis, and makes compliance reporting consistent across regulators, auditors, and internal leadership.

---

## Domain Taxonomy

```yaml
compliance_domains:
  DATA_PRIVACY:
    code: PRIV
    description: Protection of personal and sensitive data; individual rights; data handling lawfulness
    sub_domains:
      - PRIV.CONSENT: lawful basis for processing; consent management
      - PRIV.RIGHTS: data subject rights fulfillment (access, deletion, portability, rectification)
      - PRIV.TRANSFERS: cross-border data transfer mechanisms (SCCs, adequacy decisions)
      - PRIV.RETENTION: data minimization and retention limit compliance
      - PRIV.BREACH: personal data breach management and notification
      - PRIV.IMPACT: data protection impact assessments
    primary_regulations: [GDPR, CCPA, HIPAA, PIPEDA]
    governing_role: Data Protection Officer | Privacy Officer
  
  INFORMATION_SECURITY:
    code: SEC
    description: Protecting information assets from unauthorized access, use, disclosure, disruption, modification, or destruction
    sub_domains:
      - SEC.ACCESS: identity, authentication, authorization, and access management
      - SEC.CRYPTO: cryptography, key management, encryption standards
      - SEC.VULN: vulnerability management, patch management, penetration testing
      - SEC.INCIDENT: security incident detection, response, and recovery
      - SEC.LOGGING: audit logging, monitoring, and log integrity
      - SEC.NETWORK: network security, segmentation, perimeter controls
      - SEC.SUPPLY_CHAIN: software supply chain security
    primary_regulations: [ISO27001, SOC2, NIST_CSF, GDPR_Art32]
    governing_role: Chief Information Security Officer | Information Security Lead
  
  AI_GOVERNANCE:
    code: AIGOV
    description: Responsible development, deployment, and oversight of AI systems; EU AI Act compliance
    sub_domains:
      - AIGOV.RISK_CLASS: AI system risk classification and conformity
      - AIGOV.TRANSPARENCY: AI transparency, explainability, and disclosure
      - AIGOV.OVERSIGHT: human oversight, override capability, and control
      - AIGOV.DATA: AI training data quality, bias, and governance
      - AIGOV.MONITORING: post-deployment AI system monitoring
      - AIGOV.DOCUMENTATION: technical documentation and registration
      - AIGOV.PROHIBITED: prohibited AI practices identification and avoidance
    primary_regulations: [EU_AI_ACT, ISO42001, NIST_AI_RMF]
    governing_role: Chief AI Officer | AI Governance Lead
  
  OPERATIONAL:
    code: OPS
    description: Process controls, change management, business continuity, and operational resilience
    sub_domains:
      - OPS.CHANGE: change management and release governance
      - OPS.CONTINUITY: business continuity and disaster recovery
      - OPS.CAPACITY: capacity planning and performance management
      - OPS.QUALITY: quality management and process controls
      - OPS.VENDOR: vendor management and third-party risk
    primary_regulations: [ISO9001, ISO22301, SOC2]
    governing_role: Chief Operating Officer | Operational Risk Lead
  
  FINANCIAL:
    code: FIN
    description: Financial reporting accuracy, internal controls, audit integrity
    sub_domains:
      - FIN.REPORTING: financial statement accuracy and disclosure
      - FIN.CONTROLS: internal controls over financial reporting
      - FIN.AUDIT: audit independence and audit committee governance
      - FIN.FRAUD: anti-fraud controls and detection
    primary_regulations: [SOX, IFRS, GAAP]
    governing_role: Chief Financial Officer | Financial Controller
  
  ETHICS_AND_CONDUCT:
    code: ETH
    description: Ethical behavior, conflicts of interest, anti-corruption, whistleblower protection
    sub_domains:
      - ETH.CONFLICT: conflicts of interest management
      - ETH.ANTI_CORRUPTION: anti-bribery and anti-corruption controls
      - ETH.WHISTLEBLOWER: whistleblower protection and reporting channels
      - ETH.AI_ETHICS: ethical use of AI; bias, fairness, and accountability
    primary_regulations: [FCPA, UK_BRIBERY_ACT, EU_WHISTLEBLOWER_DIRECTIVE]
    governing_role: Chief Ethics Officer | General Counsel
  
  CONTRACTUAL:
    code: CTR
    description: Compliance with contractual obligations to customers, partners, and regulators
    sub_domains:
      - CTR.CUSTOMER: customer contract compliance (SLAs, data processing agreements)
      - CTR.VENDOR: supplier contract compliance
      - CTR.REGULATORY: regulatory contractual obligations (DPAs, model contractual clauses)
    governing_role: General Counsel | Contract Management Office
  
  ENVIRONMENTAL_SOCIAL_GOVERNANCE:
    code: ESG
    description: Environmental impact, social responsibility, and governance disclosures
    sub_domains:
      - ESG.ENVIRONMENTAL: carbon footprint, energy consumption, waste
      - ESG.SOCIAL: diversity, inclusion, labor practices
      - ESG.GOVERNANCE: board governance, executive compensation disclosure
    primary_regulations: [EU_CSRD, SEC_ESG_Disclosure, GRI_Standards]
    governing_role: ESG Lead | Board Sustainability Committee
```

---

## Risk Taxonomy

```yaml
risk_taxonomy:
  likelihood_scale:
    1_RARE: may occur in exceptional circumstances (< 5% probability in 12 months)
    2_UNLIKELY: could occur at some time (5–20%)
    3_POSSIBLE: might occur at some time (20–50%)
    4_LIKELY: will probably occur in most circumstances (50–80%)
    5_ALMOST_CERTAIN: expected to occur in most circumstances (> 80%)
  
  impact_scale:
    1_NEGLIGIBLE:
      financial: < $10,000
      regulatory: no regulatory action expected
      reputational: no media coverage; minimal stakeholder impact
      operational: minor disruption; resolved within hours
    
    2_MINOR:
      financial: $10K–$100K
      regulatory: regulatory inquiry possible; no formal action expected
      reputational: limited media coverage; manageable stakeholder concern
      operational: moderate disruption; resolved within days
    
    3_MODERATE:
      financial: $100K–$1M
      regulatory: formal regulatory action possible; warning or minor fine
      reputational: significant media coverage; meaningful stakeholder impact
      operational: significant disruption; resolved within weeks
    
    4_MAJOR:
      financial: $1M–$10M
      regulatory: substantial regulatory action; significant fine; investigation
      reputational: widespread negative media; serious reputational damage
      operational: severe disruption; affects core business operations
    
    5_CATASTROPHIC:
      financial: > $10M or existential
      regulatory: maximum regulatory penalties; operating license at risk
      reputational: existential reputational damage; loss of market trust
      operational: inability to operate; business continuity threat
  
  risk_rating_matrix:
    CRITICAL: score >= 15 (likelihood × impact)
    HIGH: score 8–14
    MEDIUM: score 4–7
    LOW: score 1–3
  
  risk_appetite_by_domain:
    DATA_PRIVACY: LOW (zero tolerance for breaches; regulatory consequences are severe)
    INFORMATION_SECURITY: LOW (attacks are escalating; breach costs are high)
    AI_GOVERNANCE: LOW (regulatory scrutiny is increasing; reputational stakes are high)
    OPERATIONAL: MEDIUM (some operational risk acceptable with controls)
    FINANCIAL: LOW (regulatory and investor scrutiny demands high accuracy)
    ETHICS: LOW (zero tolerance for ethical violations; existential reputational risk)
```

---

## Finding Severity Taxonomy

```yaml
finding_severity:
  CRITICAL:
    definition: Control failure that creates immediate significant regulatory risk or has caused actual harm
    examples:
      - unencrypted personal data exposed
      - AI system deployed without required conformity assessment
      - mandatory regulatory report not filed
      - access control bypassed allowing unauthorized data access
    response_SLA: resolution plan within 24 hours; Tier-4+ notification immediately
    escalation: always escalated; board notification if regulatory penalty exposure > $1M
  
  HIGH:
    definition: Control failure creating material regulatory risk or significant weakness in compliance posture
    examples:
      - encryption key management deficiency
      - data subject request SLA breach
      - missing AI transparency disclosure
      - vendor without required DPA
    response_SLA: resolution plan within 7 days; compliance lead notification within 24 hours
  
  MEDIUM:
    definition: Control gap or weakness with moderate risk that requires remediation but is not creating immediate exposure
    examples:
      - overdue control test
      - incomplete policy documentation
      - control coverage gap in low-risk area
      - minor process deviation
    response_SLA: resolution plan within 30 days
  
  LOW:
    definition: Minor gap or enhancement opportunity; no immediate risk
    examples:
      - documentation improvement needed
      - process inefficiency identified
      - best practice not followed (not regulatory requirement)
    response_SLA: resolution plan within 90 days
  
  INFORMATIONAL:
    definition: Observation for awareness; no remediation required
    examples:
      - process working but could be more efficient
      - industry trend relevant to future planning
    response_SLA: no SLA; reviewed at next relevant review cycle
```

---

## Control Effectiveness Taxonomy

```yaml
control_effectiveness:
  EFFECTIVE:
    definition: Control is designed properly and operating as intended; obligation fully satisfied
    evidence_quality: complete and reliable evidence collected on schedule
    test_result: all test criteria met
    compliance_rate: >= 98%
  
  PARTIALLY_EFFECTIVE:
    definition: Control is operating but with deficiencies; obligation partially satisfied
    evidence_quality: evidence collected but with gaps or reduced reliability
    test_result: some test criteria met; some failures
    compliance_rate: 80–97%
    action_required: remediation plan required within 30 days
  
  INEFFECTIVE:
    definition: Control is not operating as intended; obligation not being satisfied
    evidence_quality: evidence missing, unreliable, or showing failure
    test_result: material test failures
    compliance_rate: < 80%
    action_required: remediation plan within 7 days (HIGH finding); escalation to compliance lead
  
  NOT_TESTED:
    definition: Control has not been tested in the required period
    action_required: test must be scheduled immediately; control treated as UNKNOWN risk
    finding_generated: yes (MEDIUM severity for overdue tests)
  
  COMPENSATING:
    definition: Primary control not in place; compensating control in operation
    action_required: compensating control effectiveness must be demonstrated; approved as exception
    review_frequency: more frequent than primary control would require
```

---

## Compliance Maturity Taxonomy

```yaml
compliance_maturity:
  levels:
    LEVEL_1_INITIAL:
      description: Compliance is ad hoc and reactive; depends on individual heroics; no documented processes
      characteristics: [undocumented controls, reactive-only, high incident rate, no metrics]
    
    LEVEL_2_DEVELOPING:
      description: Basic controls documented; some processes repeatable; compliance is manual
      characteristics: [documented policies, manual testing, some evidence, reactive monitoring]
    
    LEVEL_3_DEFINED:
      description: Standardized and documented compliance processes; defined roles; proactive monitoring
      characteristics: [complete control catalog, scheduled testing, automated monitoring, defined ownership]
    
    LEVEL_4_MANAGED:
      description: Compliance measured and controlled using metrics; risk-based prioritization; continuous improvement
      characteristics: [compliance metrics tracked, risk-based decisions, trend analysis, executive reporting]
    
    LEVEL_5_OPTIMIZED:
      description: Continuous compliance optimization; predictive risk management; compliance as competitive advantage
      characteristics: [predictive risk models, automated remediation, real-time posture, regulatory leadership]
  
  target_maturity: LEVEL_4 (for all primary domains by end of current fiscal year)
  current_maturity_by_domain:
    DATA_PRIVACY: LEVEL_3
    INFORMATION_SECURITY: LEVEL_3
    AI_GOVERNANCE: LEVEL_2 (EU AI Act compliance in progress)
    OPERATIONAL: LEVEL_3
    FINANCIAL: LEVEL_3
    ETHICS: LEVEL_2
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/compliance-model.md` | Taxonomy terms used in all entity schemas |
| `compliance-framework/regulatory-registry.md` | Domain taxonomy applied to regulations |
| `compliance-framework/control-catalog.md` | Control classification uses this taxonomy |
| `risk-and-controls/enterprise-risk-register.md` | Risk taxonomy applied to all risk entries |
| `audit-and-evidence/finding-management.md` | Finding severity taxonomy governs SLAs |
| `governance-operations/governance-executive-reporting.md` | Maturity taxonomy used in executive reporting |
