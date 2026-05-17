# Threat Intelligence Platform
**ID:** TIP-TIP-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

The Threat Intelligence Platform (TIP) is the central nervous system of the enterprise security intelligence operation. It ingests threat data from dozens of sources, normalizes and enriches indicators, correlates signals across feeds, and distributes actionable intelligence to detection systems, security operations, and defensive controls. The TIP transforms raw threat data — IP addresses, file hashes, domain names, malware signatures, adversary TTPs — into prioritized, contextualized intelligence that defenders can act on before threats materialize into incidents.

---

## Platform Architecture

```
THREAT INTELLIGENCE PLATFORM — ARCHITECTURE

Ingest Layer
  ├── threat-feed-aggregator.md       ← normalize + deduplicate 30+ feeds
  ├── OSINT collectors                ← automated open-source collection
  ├── government sharing (ISACs)      ← FS-ISAC, IT-ISAC, H-ISAC, CISA
  └── internal telemetry              ← detections, incidents, honeypot hits

Enrichment Layer
  ├── threat-actor-registry.md        ← TTP mapping (MITRE ATT&CK)
  ├── vulnerability-intelligence.md   ← CVE enrichment + exposure scoring
  ├── geolocation + ASN enrichment    ← IP context
  ├── passive DNS + WHOIS             ← domain context
  └── malware sandbox integration     ← dynamic analysis results

Fusion Layer
  ├── threat-intelligence-fusion.md   ← correlation + scoring + products
  └── confidence scoring engine       ← multi-source confidence calculation

Distribution Layer
  ├── → threat-detection/             ← detection rules + IOC blocklists
  ├── → security-operations/          ← alert context + investigation packages
  ├── → adaptive-compliance/          ← threat posture → risk score adjustment
  ├── → sovereign-execution-zones/    ← zone-specific threat blocking
  └── → external sharing (TLP)        ← trusted partner sharing (TLP:AMBER/GREEN)
```

---

## Intelligence Object Model

```yaml
intelligence_object:
  ioc_id: IOC-{NNN}                   # monotonically increasing; globally unique
  object_type: IP | DOMAIN | URL | FILE_HASH | EMAIL | CERTIFICATE | MUTEX | REGISTRY_KEY | YARA_RULE | SIGMA_RULE
  value: string                        # the actual indicator value
  
  classification:
    threat_type: MALWARE | PHISHING | C2 | RANSOMWARE | APT | INSIDER | DDOS | SUPPLY_CHAIN |
                 PROMPT_INJECTION | MODEL_POISONING | ADVERSARIAL_INPUT | AI_JAILBREAK
    confidence: float (0.00–1.00)      # multi-source confidence score
    severity: CRITICAL | HIGH | MEDIUM | LOW | INFO
    tlp: WHITE | GREEN | AMBER | RED   # Traffic Light Protocol
    
  threat_actor:
    actor_id: TA-{NNN} | null          # links to threat-actor-registry
    campaign_id: string | null
    
  context:
    first_seen: ISO8601
    last_seen: ISO8601
    source_count: integer              # number of sources reporting this IOC
    source_ids: [string]
    tags: [string]                     # e.g., ["ransomware", "LockBit", "healthcare-sector"]
    description: string (max 500 chars)
    
  ai_specific:                         # populated for AI-targeting threats
    target_model_type: string | null   # e.g., "LLM", "vision_model"
    attack_vector: string | null       # e.g., "prompt_injection", "gradient_attack"
    detection_guidance: string | null
    
  lifecycle:
    status: ACTIVE | EXPIRED | REVOKED | UNDER_REVIEW
    expiry: ISO8601                    # IOCs expire; stale indicators cause false positives
    revoked_reason: string | null
    
  integrity:
    entry_hash: sha256
    signed_by: string | null           # Ed25519 for CRITICAL IOCs
```

---

## Indicator Lifecycle

```yaml
indicator_lifecycle:

  INGESTION:
    normalization: value canonicalized (lowercase domains, uppercase hashes, CIDR for IPs)
    deduplication: SHA-256 of (object_type + normalized_value) as dedup key
    source_tracking: every source reporting the IOC tracked
    
  ENRICHMENT:
    passive_dns: domain→IP history + reverse lookups
    geolocation: country, ASN, hosting provider
    threat_actor_mapping: map to TA-{NNN} if TTP signature matches
    vulnerability_link: for IP IOCs, check if associated with known vulnerable services
    malware_family: for hashes, identify malware family via signature matching
    
  CONFIDENCE_SCORING:
    base_score: per source trust rating
    multi_source_bonus: +0.10 per additional corroborating source (cap at 0.95)
    recency_factor: score decays 0.05/week for non-refreshed IOCs
    community_validation: positive community reports +0.05; false positive reports -0.15
    
  DISTRIBUTION:
    threshold_for_blocking: confidence >= 0.70 AND severity >= HIGH
    threshold_for_alerting: confidence >= 0.50 AND severity >= MEDIUM
    threshold_for_logging: confidence >= 0.30
    
  EXPIRY:
    IP_IOC: 30 days (dynamic; IPs reassigned)
    DOMAIN_IOC: 90 days
    FILE_HASH_IOC: 365 days (hashes don't change)
    URL_IOC: 14 days
    AI_SPECIFIC_IOC: 180 days
    refresh_on_resighting: expiry reset to full TTL on new sighting
```

---

## Intelligence Products

```yaml
intelligence_products:

  TACTICAL_INTELLIGENCE:
    description: Actionable IOCs for immediate defensive use
    format: STIX 2.1 bundles; structured blocklist exports
    consumers: threat-detection/ (IOC blocklists); network-threat-monitor
    cadence: continuous (streaming); daily bulk export
    
  OPERATIONAL_INTELLIGENCE:
    description: Campaign tracking, threat actor analysis, attack pattern intelligence
    format: Campaign report; Threat Actor Profile update
    consumers: security-operations-center; incident-response-orchestrator
    cadence: weekly for active campaigns; on-event for new actors
    
  STRATEGIC_INTELLIGENCE:
    description: Threat landscape trends, sector-specific threat forecasts, geopolitical threat context
    format: Monthly Threat Landscape Report; Quarterly Strategic Threat Assessment
    consumers: T4 Security; Governance Org; board security briefing
    cadence: monthly (landscape); quarterly (strategic)
    
  AI_THREAT_INTELLIGENCE:
    description: Intelligence specific to threats targeting AI/ML systems in the enterprise
    format: AI Threat Bulletin; model-specific attack indicators
    consumers: ai-specific-threat-detector; constitutional-governor-quorum
    cadence: weekly; on-discovery for novel AI attack vectors
```

---

## External Sharing Framework

```yaml
external_sharing:
  framework: Traffic Light Protocol (TLP 2.0)
  
  TLP_RED: recipients only; no sharing beyond named recipients
  TLP_AMBER: sharing within organization and specific partners
  TLP_AMBER_STRICT: organization only
  TLP_GREEN: community sharing (ISACs, trusted CERTs)
  TLP_CLEAR: unrestricted sharing; public
  
  sharing_agreements:
    FS_ISAC: financial sector; TLP:AMBER
    IT_ISAC: technology sector; TLP:AMBER
    H_ISAC: healthcare sector; TLP:AMBER
    CISA: US government; TLP:GREEN for non-sensitive IOCs
    FIRST_NETWORK: global; TLP:GREEN for vetted IOCs
    
  outbound_controls:
    strip_internal_context: remove internal asset references before sharing
    jurisdiction_check: CN-sourced intelligence not shared externally without legal review
    confidence_gate: only confidence >= 0.60 shared externally
    legal_review: TLP:RED sharing requires Legal Org approval
```

---

## Integration

```
Feeds into:
  threat-feed-aggregator.md — raw feeds normalized here
  threat-intelligence-fusion.md — fusion products distributed from here
  threat-detection/ — IOC blocklists; detection context
  security-operations-center.md — alert enrichment packages
  incident-response-orchestrator.md — incident context packages

Receives from:
  threat-feed-aggregator.md — normalized indicators
  threat-actor-registry.md — actor attribution
  vulnerability-intelligence.md — CVE context
  internal detections — honeypot hits, detection matches feed back as intel
```

---

## Governance

**TLP compliance is mandatory:** All intelligence objects carry TLP classification; distribution is enforced by TLP level  
**IOC expiry is non-negotiable:** Expired IOCs are automatically suppressed from active blocking; stale IOCs cause false positives  
**AI threat intel is constitutional-adjacent:** Intelligence about threats to AI systems (prompt injection, jailbreak, model poisoning) is routed to constitutional quorum for awareness  
**CN jurisdiction:** Intelligence originating from CN entity is subject to CAC data classification review before external sharing  
**Audit:** All IOC ingestion, enrichment, and distribution events to `memory/threat-intelligence/tip-audit.jsonl`; 7-year retention
