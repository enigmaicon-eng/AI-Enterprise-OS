# Restricted Cognition Domains
**ID:** RCG-RCD-001 | **Tier:** T4 | **Class:** ELEVATED
**Owner:** Legal Org + Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Defines categories of reasoning, inference, and output that are legally or constitutionally prohibited within specific sovereign jurisdictions or globally. Restricted cognition domains are the intersection of regulatory prohibitions (EU AI Act prohibited practices, China content restrictions, US sectoral prohibitions) and OS constitutional principles. When an agent approaches a restricted domain — whether through explicit request or emergent reasoning path — the system blocks the cognitive operation before any output is produced, not after.

**Prevention principle:** Block before output, not after. A prohibited inference that is computed but not delivered still represents a violation of cognitive constraints.

---

## Domain Taxonomy

### Class A: Globally Prohibited (No Jurisdiction Exception)

These domains are blocked in every SEZ regardless of local law, because they violate OS constitutional principles (C001–C012):

```yaml
globally_prohibited_domains:

  RCD-G-001:
    name: SUBLIMINAL_MANIPULATION
    description: Cognitive operations designed to influence behavior below conscious awareness
    examples: [hidden persuasion patterns, subliminal embedding in output, dark patterns]
    constitutional_basis: C004_NON_MALEFICENCE + C007_AUTONOMY
    block_level: PERMANENT (cannot be authorized at any tier)
    detection: output pattern analysis + semantic intent classifier
    
  RCD-G-002:
    name: SOCIAL_SCORING_PUBLIC_AUTHORITY
    description: AI-based social credit scoring by or for government authorities
    examples: [citizen behavior scoring, social credit integration, compliance scoring for state use]
    constitutional_basis: C006_JUSTICE + C008_PRIVACY + C001_DIGNITY
    block_level: PERMANENT
    note: does not prohibit enterprise performance management; prohibits government social scoring
    
  RCD-G-003:
    name: EXPLOITATION_OF_VULNERABILITY
    description: Targeting individuals based on age, disability, or socioeconomic status to cause harm
    constitutional_basis: C001_DIGNITY + C004_NON_MALEFICENCE
    block_level: PERMANENT
    
  RCD-G-004:
    name: MASS_SURVEILLANCE_INFERENCE
    description: Building comprehensive behavioral profiles of individuals without consent or legal basis
    constitutional_basis: C008_PRIVACY + C007_AUTONOMY
    block_level: PERMANENT for individuals; RESTRICTED for aggregate/anonymized
    
  RCD-G-005:
    name: DECEPTIVE_IDENTITY
    description: AI system misrepresenting itself as human in contexts where disclosure is required
    constitutional_basis: C003_TRUTH + C002_TRANSPARENCY
    block_level: PERMANENT
    note: personas for clearly labeled entertainment contexts may be permitted with T4
```

### Class B: Jurisdiction-Specific Prohibited

```yaml
eu_restricted_domains:
  RCD-EU-001:
    name: REAL_TIME_BIOMETRIC_REMOTE_ID_PUBLIC
    regulation: EU AI Act Art.5(1)(d)
    description: Real-time remote biometric identification of individuals in public spaces
    block_level: PERMANENT in EU (very narrow law enforcement exceptions — not applicable to enterprise OS)
    
  RCD-EU-002:
    name: EMOTION_RECOGNITION_WORK_EDUCATION
    regulation: EU AI Act Art.5(1)(f)
    description: Inferring emotions of individuals in workplace or educational settings
    block_level: PERMANENT in EU (safety use exceptions not applicable to enterprise OS)
    
  RCD-EU-003:
    name: PROHIBITED_PROFILING_LAW_ENFORCEMENT
    regulation: EU AI Act Art.5(1)(e)
    description: Profiling of individuals for law enforcement risk assessment
    block_level: PERMANENT in EU for non-law-enforcement entities

cn_restricted_domains:
  RCD-CN-001:
    name: ALGORITHM_RECOMMENDATION_UNREGISTERED
    regulation: CAC Algorithm Regulation
    description: Operating recommendation algorithm without CAC registration
    block_level: BLOCK_DEPLOYMENT (operational block; can be lifted by CAC registration)
    
  RCD-CN-002:
    name: AI_GENERATED_DISINFORMATION
    regulation: Generative AI Measures Art.4
    description: Generating content that could constitute disinformation or undermine state authority
    block_level: PERMANENT in CN
    
  RCD-CN-003:
    name: DEEP_SYNTHETIC_WITHOUT_CONSENT
    regulation: Deep Synthesis Provisions
    description: Generating deep synthetic content of real individuals without explicit consent + disclosure
    block_level: BLOCK in CN without consent verification

us_restricted_domains:
  RCD-US-001:
    name: CHILDREN_DATA_PROCESSING_UNDER_13
    regulation: COPPA
    description: Any processing of personal data of children under 13 without verified parental consent
    block_level: PERMANENT for automated processing; consent exception possible
    
  RCD-US-002:
    name: UNCONSENTED_BIOMETRIC_IL
    regulation: BIPA (Illinois)
    description: Collection or processing of biometric identifiers without written consent (Illinois)
    block_level: PERMANENT in IL jurisdiction without consent
    
  RCD-US-003:
    name: DECEPTIVE_TRADE_PRACTICE_AI
    regulation: FTC Act Sec.5
    description: Using AI to engage in unfair or deceptive acts affecting commerce
    block_level: PERMANENT
```

---

## Domain Enforcement Engine

```
enforce_cognition_domain(agent_id, operation, current_jurisdiction):

  1. Classify operation intent:
     intent_vector = classify_cognitive_intent(operation)
     
  2. Check globally prohibited domains:
     for domain in globally_prohibited_domains:
       if intent_vector matches domain.detection_pattern:
         BLOCK immediately
         log GLOBALLY_PROHIBITED_DOMAIN_TRIGGERED
         alert T4
         return PERMANENTLY_BLOCKED
         
  3. Check jurisdiction-specific domains:
     jurisdiction_domains = get_restricted_domains(current_jurisdiction)
     for domain in jurisdiction_domains:
       if intent_vector matches domain.detection_pattern:
         if domain.block_level == PERMANENT:
           BLOCK; alert T4
           return PERMANENTLY_BLOCKED
         if domain.block_level == BLOCK_DEPLOYMENT:
           BLOCK; alert T3 (may be resolvable by registration/compliance)
           return DEPLOYMENT_BLOCKED
           
  4. Check for proximity (approaching restricted domain):
     proximity_score = measure_domain_proximity(intent_vector, all_restricted_domains)
     if proximity_score > 0.70:
       WARN; log RESTRICTED_DOMAIN_PROXIMITY
       require: explicit human confirmation before proceeding
     if proximity_score > 0.90:
       BLOCK; require T3 review
       
  Return: PERMITTED | WARNED | BLOCKED | PERMANENTLY_BLOCKED
```

---

## Pre-Execution Screening

Before any agent begins a task, a cognitive domain pre-screen is run:

```
pre_execution_domain_screen(task_description, agent_jurisdiction):

  1. NLP intent extraction from task_description
  2. Domain vector embedding
  3. Cosine similarity against all restricted domain embeddings
  4. Similarity threshold classification:
       < 0.30: CLEAR — proceed
       0.30–0.59: LOW_PROXIMITY — monitor during execution
       0.60–0.79: MEDIUM_PROXIMITY — warn user; require acknowledgment
       0.80–0.94: HIGH_PROXIMITY — block pending human review (T3)
       ≥ 0.95: PROHIBITED — permanent block; log; alert T4
       
  Return: ScreenResult {score, classification, matching_domains, recommendation}
```

---

## Human Override Protocol

For BLOCK (non-PERMANENT) cases where a legitimate exception may exist:

```
request_domain_exception(domain_id, justification, requester):

  if domain.block_level == PERMANENT:
    DENY immediately; no exceptions; log PERMANENT_BLOCK_EXCEPTION_DENIED
    return DENIED
    
  if domain.block_level == BLOCK_DEPLOYMENT:
    route to Legal Org for review
    required: compliance_proof (e.g., CAC registration certificate)
    authority: T4
    SLA: 48 hours
    
  if domain.block_level == CONTEXT_RESTRICTED:
    route to T3 review
    required: use_case_justification + data_minimization_plan
    SLA: 24 hours
    
  approved exception:
    time_limited: 90 days maximum
    scope_limited: specific use case only
    monitoring: enhanced logging during exception period
    renewal: requires fresh review (no auto-renewal)
```

---

## Restricted Domain Proximity Monitoring

Ongoing monitoring during agent execution for domain drift:

```yaml
proximity_monitoring:
  monitoring_frequency: every output generation
  
  proximity_model:
    type: fine_tuned_embedding_classifier
    training: restricted domain descriptions + example prohibited content
    threshold_warn: 0.60
    threshold_block: 0.80
    
  response_to_drift:
    agent_approaching_domain:
      action: inject steering instruction (redirect agent away from domain)
      log: DOMAIN_PROXIMITY_STEERING_APPLIED
      
    agent_crossing_threshold:
      action: suspend output generation; present to human reviewer
      log: DOMAIN_BOUNDARY_CROSSED; alert T3
      
    steering_ineffective (3 consecutive proximity alerts):
      action: terminate agent session
      log: DOMAIN_STEERING_FAILED; alert T3
      require: behavioral review before re-deployment
```

---

## Global vs. Local Resolution

```
resolve_domain_conflict(global_prohibition, local_permission):
  # When local law permits something globally prohibited:
  GLOBAL_PROHIBITION_PREVAILS
  
  # The OS constitutional principles (C001-C012) + globally prohibited domains
  # cannot be unlocked by any local jurisdiction's permissive law.
  # A country that legally permits social scoring does not unlock RCD-G-002.
  # Local law can restrict below the global baseline; never above it.
  
  log: GLOBAL_PROHIBITION_ENFORCED_OVER_LOCAL_LAW
```

---

## Integration

```
Feeds into:
  regional-cognition-boundaries.md — prohibited zones derived from this domain list
  sovereign-execution-zones.md — zones enforce domain restrictions at runtime
  pre-execution-simulator.md — simulation pre-screens domain proximity

Receives from:
  regional-policy-enforcement.md — jurisdiction-specific restrictions fed from policy catalog
  constitutional-governor-quorum.md — globally prohibited domains align with constitutional principles
  regulatory-conflict-arbitration.md — jurisdiction-specific vs. global conflicts resolved here
```

---

## Governance

**PERMANENT blocks:** No authority can lift a PERMANENT block; architectural invariant  
**Domain model retraining:** Quarterly; Legal Org + Architecture Org review of any threshold changes  
**Exception audit:** All granted exceptions logged permanently; used as evidence in regulatory inquiries  
**Proximity steering:** Applied transparently; agents not informed of specific domain thresholds (prevents gaming)  
**Audit:** All domain enforcement events to `memory/regional-cognition/domain-enforcement-log.jsonl`; PERMANENT_BLOCKED events retained indefinitely
