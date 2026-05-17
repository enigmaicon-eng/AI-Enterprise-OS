# Regional Cognition Boundaries
**ID:** SVM-RCB-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Defines the cognitive perimeter within which an agent operating in a given sovereign region may think, reason, and act. Regional cognition boundaries determine what knowledge an agent can access, what inferences it may draw, what outputs it may produce, and what actions it may propose — all constrained by the legal and regulatory requirements of the jurisdiction in which the agent is currently executing. An agent whose cognition crosses a regional boundary without authorization is treated as a sovereignty violation.

---

## Cognition Boundary Model

```
Regional Cognition Boundary = f(
  jurisdiction,
  agent_deployment_region,
  data_classification,
  regulatory_constraints,
  cross_border_authorizations
)

An agent's cognitive perimeter at time T consists of:
  PERMITTED KNOWLEDGE: what the agent may read from memory
  PERMITTED INFERENCE: what reasoning it may perform on that knowledge
  PERMITTED OUTPUT: what it may produce as output
  PERMITTED ACTION: what it may propose or execute
  PROHIBITED ZONES: topics, data classes, inferences explicitly blocked
```

---

## Regional Boundary Definitions

```yaml
regional_cognition_boundaries:

  BOUNDARY-EU:
    jurisdiction: JUR-EU
    regions: [EU_WEST, EU_CENTRAL, EU_NORTH]
    
    permitted_knowledge:
      memory_jurisdictions: [JUR-EU, JUR-GB]     # UK adequacy decision
      cross_border_requires: [ADEQUACY_DECISION, SCCs]
      
    permitted_inference:
      automated_individual_decisions: PROHIBITED_WITHOUT_HUMAN_REVIEW  # GDPR Art.22
      profiling_without_consent: PROHIBITED
      sensitive_category_inference: PROHIBITED    # Art.9 special categories
      ai_generated_content_labeling: REQUIRED    # EU AI Act
      
    permitted_output:
      must_include_explanation: true             # EU AI Act Art.13
      must_be_human_reviewable: true
      high_risk_ai_output: REQUIRES_CONFORMITY_ASSESSMENT
      
    permitted_actions:
      cross_border_data_transfer: REQUIRES_TRANSFER_MECHANISM
      data_retention_extension: PROHIBITED_BEYOND_CEILING
      erasure_request_processing: MANDATORY_WITHIN_30_DAYS
      
    prohibited_zones:
      - GDPR_SPECIAL_CATEGORY_INFERENCE_WITHOUT_EXPLICIT_CONSENT
      - REAL_TIME_BIOMETRIC_SURVEILLANCE
      - SOCIAL_SCORING
      - SUBLIMINAL_MANIPULATION
      - PROHIBITED_AI_PRACTICES_EU_AI_ACT
      
  BOUNDARY-CN:
    jurisdiction: JUR-CN
    regions: [CN_EAST, CN_NORTH, CN_SOUTH]
    
    permitted_knowledge:
      memory_jurisdictions: [JUR-CN]             # China data must stay in China
      cross_border_requires: [CAC_SECURITY_ASSESSMENT, STANDARD_CONTRACT, CERTIFICATION]
      cross_border_data_volume_threshold_gb: 1   # CAC assessment triggers at 1GB personal data
      
    permitted_inference:
      critical_information_infrastructure_data: CANNOT_LEAVE_CHINA
      important_data_export: CAC_APPROVAL_REQUIRED
      algorithm_recommendation: MUST_REGISTER_WITH_CAC
      
    permitted_output:
      content_generation: MUST_LABEL_AI_GENERATED
      deepfake_output: PROHIBITED_WITHOUT_CONSENT_AND_LABELING
      
    permitted_actions:
      cross_border_transfer: CAC_PRIOR_APPROVAL_REQUIRED
      data_localization: MANDATORY_FOR_CII
      
    prohibited_zones:
      - DATA_EXPORT_WITHOUT_CAC_APPROVAL
      - ALGORITHM_DEPLOYMENT_WITHOUT_REGISTRATION
      - AI_GENERATED_DISINFORMATION
      - CRITICAL_DATA_EXPORT
      
  BOUNDARY-US:
    jurisdiction: JUR-US
    regions: [US_EAST, US_WEST, US_CENTRAL]
    
    permitted_knowledge:
      memory_jurisdictions: [JUR-US, JUR-GB, JUR-SG]  # broadly permissive
      cross_border_requires: [CONTRACTUAL, ADEQUACY]
      
    permitted_inference:
      consumer_profiling: PERMITTED_WITH_OPT_OUT    # CCPA
      health_data_inference: HIPAA_COMPLIANCE_REQUIRED
      financial_data_inference: GLBA_COMPLIANCE_REQUIRED
      children_data_inference: COPPA_PROHIBITED     # under 13
      
    permitted_output:
      financial_advice: SEC_DISCLAIMER_REQUIRED
      health_advice: HIPAA_SAFEGUARDS_REQUIRED
      
    prohibited_zones:
      - CHILDREN_UNDER_13_DATA_PROCESSING
      - UNCONSENTED_BIOMETRIC_DATA_COLLECTION   # BIPA (Illinois)
      - DECEPTIVE_AI_IMPERSONATION             # FTC Act
      
  BOUNDARY-GLOBAL:
    jurisdiction: MULTI_JURISDICTION
    regions: [ALL]
    
    description: Applied when agent crosses jurisdictions; takes intersection of all applicable rules
    
    resolution_rule: MOST_RESTRICTIVE
    # When operating across jurisdictions, always apply the most restrictive constraint
    # from all applicable jurisdictions
    
    constitutional_overlay: ALWAYS_ACTIVE    # OS constitutional principles always apply
    # regardless of jurisdiction, OS C001-C012 are never reduced by regional rules
```

---

## Boundary Enforcement at Runtime

```
enforce_cognition_boundary(agent_id, operation, execution_context):

  1. Identify active boundary:
     deployment_region = execution_context.region
     boundary = lookup_boundary_for_region(deployment_region)
     
  2. Check operation type:
     if operation.type == KNOWLEDGE_RETRIEVAL:
       enforce_permitted_knowledge(operation, boundary)
     if operation.type == INFERENCE:
       enforce_permitted_inference(operation, boundary)
     if operation.type == OUTPUT_GENERATION:
       enforce_permitted_output(operation, boundary)
     if operation.type == ACTION_PROPOSAL:
       enforce_permitted_actions(operation, boundary)
       
  3. Check prohibited zones:
     for each prohibited_zone in boundary.prohibited_zones:
       if operation_touches(operation, prohibited_zone):
         BLOCK immediately
         log PROHIBITED_ZONE_APPROACHED
         escalate per zone severity
         
  4. Cross-boundary detection:
     if operation references data from outside boundary.permitted_knowledge.memory_jurisdictions:
       check cross_border_authorization(data.jurisdiction, boundary)
       if NOT authorized: BLOCK; log CROSS_BOUNDARY_ACCESS_DENIED
       
  Return: PERMITTED | BLOCKED | REQUIRES_HUMAN_REVIEW
```

---

## Cross-Boundary Cognition Requests

When legitimate cross-boundary cognition is needed:

```
request_cross_boundary_access(agent_id, source_boundary, target_boundary, purpose):

  1. Check if transfer mechanism exists:
     mechanism = find_transfer_mechanism(source_boundary.jurisdiction, target_boundary.jurisdiction)
     if NO mechanism: DENIED; suggest alternatives
     
  2. Apply most-restrictive rule:
     combined_constraints = intersect(source_boundary.constraints, target_boundary.constraints)
     
  3. Require authorization:
     if mechanism requires ADEQUACY: automatic approval
     if mechanism requires SCCs/CONTRACTUAL: T3 pre-approval
     if mechanism requires CAC_APPROVAL: T4 + legal counsel
     
  4. Create time-limited cross-boundary cognition permit:
     permit = {
       permit_id: CBP-{NNN},
       agent_id, source_boundary, target_boundary,
       purpose, mechanism,
       constraints: combined_constraints,
       valid_until: now() + 3600s,          # 1-hour maximum
       authorized_by: string
     }
     
  5. Audit: log CROSS_BOUNDARY_PERMIT_ISSUED
  
  Return: permit_id (agent presents at each cross-boundary operation)
```

---

## Boundary Violation Response

```yaml
violation_severity:
  PROHIBITED_ZONE_TOUCHED:
    severity: CRITICAL
    response: immediate block + agent suspend + T4 alert
    
  UNAUTHORIZED_CROSS_BOUNDARY_ACCESS:
    severity: HIGH
    response: block + T3 alert + behavioral review
    
  EXPIRED_CROSS_BOUNDARY_PERMIT:
    severity: MEDIUM
    response: block + T2 notify + re-request permit
    
  JURISDICTION_MISCLASSIFICATION_DETECTED:
    severity: HIGH
    response: block + T3 alert + legal review
```

---

## Integration

```
Feeds into:
  sovereignty-aware-retrieval.md — boundary definitions used at query time
  jurisdiction-aware-orchestration.md — orchestrator routes work based on boundaries
  sovereign-execution-zones.md — execution environment enforces cognitive perimeter

Receives from:
  jurisdiction-aware-memory.md — jurisdiction metadata per record
  regional-policy-enforcement.md — policy rules update boundary constraints
  regulatory-conflict-arbitration.md — conflict resolutions integrated into boundary rules
```

---

## Governance

**Boundary definitions:** Updated quarterly or when regulatory change detected; Architecture Org + Legal Org review required  
**Prohibited zones:** Never reduced below constitutional minimums; T5 required to add new exceptions  
**Most-restrictive rule:** Applied automatically for multi-jurisdiction operations; no override below T4  
**Audit:** All boundary enforcement decisions to `memory/sovereign-memory/boundary-enforcement-log.jsonl`
