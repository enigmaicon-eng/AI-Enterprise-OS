# Trust Boundary Registry

**System ID:** `trust-boundary-registry`
**Role:** Defines and enforces trust zones across the enterprise execution fabric — registers all trust boundaries between agents, systems, data domains, and organizational units; evaluates cross-boundary communication and data flows against policy; and provides the authoritative map of what can communicate with what, under what conditions
**Storage:** `memory/trust-boundaries/boundary-registry.yaml`

---

## Purpose

Trust is not binary — it exists on a spectrum, varies by direction, and depends on context. The trust boundary registry formalizes this: it defines explicit zones, the trust level between each pair of zones, and the conditions under which cross-boundary communication is permitted. An agent in the standard execution zone cannot directly call an agent in the governance zone without traversing the boundary policy. An external data source cannot flow into a high-security workflow without a declared boundary crossing. The registry makes implicit trust assumptions explicit and enforceable.

---

## Trust Zone Model

```yaml
TrustZone:
  zone_id: string
  name: string
  description: string
  
  # Who/what belongs in this zone
  membership:
    agent_trust_tiers: [string]        # T1-T5 tiers that belong here
    agent_ids: [string]                # Specific agents in this zone
    system_ids: [string]               # Systems in this zone
    data_classifications: [string]     # Data classifications processed here
  
  # Zone security properties
  properties:
    requires_authentication: boolean
    requires_signed_messages: boolean
    allows_external_ingress: boolean
    allows_external_egress: boolean
    audit_level: "MINIMAL | STANDARD | DETAILED | FORENSIC"
    human_oversight_required: boolean
  
  zone_level: integer                  # 1 = most trusted, 5 = least trusted

TrustBoundary:
  boundary_id: string
  name: string
  
  # The two zones this boundary separates
  zone_a: string                       # zone_id
  zone_b: string                       # zone_id
  
  # Directionality
  direction: "A_TO_B | B_TO_A | BIDIRECTIONAL"
  
  # Crossing conditions
  crossing_policy:
    allowed: boolean
    
    # When allowed, what is required
    requires:
      authentication: boolean
      signed_payload: boolean
      minimum_confidence_score: float | null
      human_approval: boolean
      data_classification_max: string | null
      rate_limit_per_minute: integer | null
    
    # Content restrictions
    content_policy:
      allowed_data_types: [string] | null   # Null = any
      forbidden_data_patterns: [string]
      max_payload_size_bytes: integer | null
  
  created_at: datetime
  policy_version: integer
```

---

## Standard Trust Zones

```yaml
standard_zones:
  
  zone-external:
    name: "External Zone"
    zone_level: 5
    membership:
      data_classifications: ["PUBLIC"]
    properties:
      requires_authentication: false
      allows_external_ingress: true
      allows_external_egress: true
      audit_level: STANDARD
  
  zone-execution:
    name: "Standard Execution Zone"
    zone_level: 4
    membership:
      agent_trust_tiers: ["T1", "T2"]
      data_classifications: ["PUBLIC", "INTERNAL"]
    properties:
      requires_authentication: true
      requires_signed_messages: false
      allows_external_ingress: true     # With semantic firewall
      allows_external_egress: true      # Within MCP governance gateway
      audit_level: STANDARD
  
  zone-orchestration:
    name: "Orchestration Zone"
    zone_level: 3
    membership:
      agent_trust_tiers: ["T3"]
      system_ids: ["dag-engine", "workflow-scheduler", "reactive-orchestration"]
      data_classifications: ["PUBLIC", "INTERNAL", "CONFIDENTIAL"]
    properties:
      requires_authentication: true
      requires_signed_messages: true
      audit_level: DETAILED
  
  zone-governance:
    name: "Governance Zone"
    zone_level: 2
    membership:
      agent_trust_tiers: ["T4"]
      system_ids: ["governance-attestation", "audit-replay", "trust-boundaries"]
      data_classifications: ["PUBLIC", "INTERNAL", "CONFIDENTIAL"]
    properties:
      requires_authentication: true
      requires_signed_messages: true
      human_oversight_required: true
      allows_external_ingress: false    # Governance zone does not accept external input
      audit_level: FORENSIC
  
  zone-executive:
    name: "Executive Zone"
    zone_level: 1
    membership:
      agent_trust_tiers: ["T5"]
      data_classifications: ["ALL"]
    properties:
      requires_authentication: true
      requires_signed_messages: true
      human_oversight_required: true
      audit_level: FORENSIC

standard_boundaries:
  
  - boundary_id: "ext-to-exec"
    name: "External → Execution"
    zone_a: zone-external
    zone_b: zone-execution
    direction: A_TO_B
    crossing_policy:
      allowed: true
      requires:
        signed_payload: false
        minimum_confidence_score: null
        data_classification_max: "INTERNAL"
        rate_limit_per_minute: 100
      content_policy:
        forbidden_data_patterns: [r"CREDENTIAL_PATTERN", r"INJECTION_PATTERN"]
  
  - boundary_id: "exec-to-orch"
    name: "Execution → Orchestration"
    zone_a: zone-execution
    zone_b: zone-orchestration
    direction: BIDIRECTIONAL
    crossing_policy:
      allowed: true
      requires:
        signed_payload: true
        minimum_confidence_score: 0.55
  
  - boundary_id: "orch-to-gov"
    name: "Orchestration → Governance"
    zone_a: zone-orchestration
    zone_b: zone-governance
    direction: A_TO_B
    crossing_policy:
      allowed: true
      requires:
        signed_payload: true
        minimum_confidence_score: 0.75
        human_approval: false          # Automated governance calls allowed
  
  - boundary_id: "exec-to-gov"
    name: "Execution → Governance (direct)"
    zone_a: zone-execution
    zone_b: zone-governance
    direction: A_TO_B
    crossing_policy:
      allowed: true
      requires:
        signed_payload: true
        minimum_confidence_score: 0.75
        human_approval: true           # Direct T1/T2 → T4 requires human gate
```

---

## Boundary Enforcement

```
evaluate_boundary_crossing(crossing_request) → BoundaryCrossingDecision:
  
  source_zone = get_agent_zone(crossing_request.source_agent_id)
  target_zone = get_agent_zone(crossing_request.target_agent_id or crossing_request.target_system_id)
  
  IF source_zone == target_zone:
    RETURN BoundaryCrossingDecision(allowed=True, reason="Same zone — no boundary crossing")
  
  boundary = find_boundary(source_zone, target_zone, crossing_request.direction)
  
  IF boundary is null:
    RETURN BoundaryCrossingDecision(
      allowed = False,
      reason = f"No boundary defined between zone '{source_zone}' and '{target_zone}' in direction '{crossing_request.direction}' — blocked by default"
    )
  
  IF NOT boundary.crossing_policy.allowed:
    RETURN BoundaryCrossingDecision(
      allowed = False,
      reason = f"Boundary '{boundary.boundary_id}' explicitly blocks crossings"
    )
  
  requirements = boundary.crossing_policy.requires
  violations = []
  
  # Authentication
  IF requirements.authentication AND NOT crossing_request.authenticated:
    violations.append("Authentication required for this boundary crossing")
  
  # Signed payload
  IF requirements.signed_payload:
    IF NOT crossing_request.payload_signature:
      violations.append("Signed payload required")
    ELSE:
      sig_valid = execution_signing.verify_artifact(crossing_request.signed_payload)
      IF NOT sig_valid.valid:
        violations.append(f"Payload signature invalid: {sig_valid.reason}")
  
  # Confidence score
  IF requirements.minimum_confidence_score:
    score = workflow_confidence_scorer.get_score(crossing_request.confidence_score_id)
    IF NOT score OR score.composite_score < requirements.minimum_confidence_score:
      actual = score.composite_score if score else 0.0
      violations.append(f"Confidence score {actual:.2f} below boundary minimum {requirements.minimum_confidence_score:.2f}")
  
  # Human approval
  IF requirements.human_approval:
    approval = check_human_approval(crossing_request)
    IF NOT approval.approved:
      violations.append("Human approval required for this boundary crossing")
  
  # Data classification
  IF requirements.data_classification_max:
    crossing_classification = crossing_request.payload_classification
    IF data_classification_exceeds(crossing_classification, requirements.data_classification_max):
      violations.append(f"Payload classification {crossing_classification} exceeds boundary maximum {requirements.data_classification_max}")
  
  # Rate limit
  IF requirements.rate_limit_per_minute:
    current_rate = get_crossing_rate(boundary.boundary_id, window_seconds=60)
    IF current_rate >= requirements.rate_limit_per_minute:
      violations.append(f"Rate limit {requirements.rate_limit_per_minute}/min exceeded ({current_rate} crossings in last 60s)")
  
  # Content policy
  payload_text = extract_text(crossing_request.payload)
  FOR pattern in boundary.crossing_policy.content_policy.forbidden_data_patterns:
    IF regex_search(pattern, payload_text):
      violations.append(f"Payload contains forbidden data pattern")
  
  IF violations:
    decision = BoundaryCrossingDecision(allowed=False, violations=violations)
  ELSE:
    record_crossing(boundary.boundary_id, crossing_request)
    decision = BoundaryCrossingDecision(allowed=True)
  
  log_boundary_decision(crossing_request, decision)
  RETURN decision
```

---

## Zone Membership Resolution

```
get_agent_zone(agent_id) → zone_id:
  
  manifest = capability_scope_controller.load_manifest(agent_id)
  trust_tier = manifest.trust_tier
  
  # Tier-to-zone mapping
  TIER_ZONE_MAP = {
    "T1": "zone-execution",
    "T2": "zone-execution",
    "T3": "zone-orchestration",
    "T4": "zone-governance",
    "T5": "zone-executive"
  }
  
  zone_id = TIER_ZONE_MAP.get(trust_tier, "zone-execution")
  
  # Override: specific agent_id overrides tier mapping
  FOR zone in standard_zones:
    IF agent_id in zone.membership.agent_ids:
      RETURN zone.zone_id
  
  RETURN zone_id
```

---

## Integration

**Called by:**
- Every inter-agent and agent-to-system call — evaluated before message delivery
- `workflow-engine/dag-engine.md` — evaluates boundary when routing results across zones

**Calls:**
- `execution-security/execution-signing.md` — verifies signed payloads at boundaries
- `trust-boundaries/workflow-confidence-scorer.md` — reads confidence scores for boundary requirements
- `audit-replay/immutable-audit-log.md` — records all boundary crossing decisions

**Reads from:** `memory/trust-boundaries/boundary-registry.yaml`
**Writes to:** `memory/trust-boundaries/boundary-registry.yaml`
