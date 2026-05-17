# Threat Intelligence Fusion
**ID:** TIP-TIF-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Correlates threat signals across feeds, actors, campaigns, and internal detections to produce fused intelligence products that are more than the sum of their parts. While individual indicators show point-in-time threat data, fusion reveals patterns: campaigns targeting the same sector, infrastructure reuse across actors, coordinated multi-vector attacks, and emerging threat trajectories before they materialize. Fusion is what transforms a security operation from reactive (respond to alerts) to anticipatory (pre-position defenses before the attack arrives).

---

## Fusion Architecture

```
THREAT INTELLIGENCE FUSION ENGINE

Input Streams:
  IOC Store (30+ feeds, normalized)
  Threat Actor Registry (TA-{NNN} profiles)
  Campaign Tracker (CAMP-{NNN})
  Vulnerability Intelligence (VULN-{NNN})
  Internal Detection Events (FEED-040/041/042)
  Security Operations Alerts (security-operations/)

Correlation Engines:
  Infrastructure Clustering    ← group IOCs by shared hosting, ASN, certificate
  TTP Behavioral Matching      ← match event sequences to MITRE ATT&CK patterns
  Campaign Graph Builder       ← connect IOCs, actors, victims into campaign graph
  Temporal Pattern Analyzer    ← identify coordinated timing across IOC sightings
  AI Attack Pattern Detector   ← correlate AI-specific threat signals

Fusion Products:
  THREAT_BULLETIN              ← urgent actionable intelligence
  CAMPAIGN_ALERT               ← active campaign relevant to enterprise
  THREAT_LANDSCAPE_REPORT      ← weekly/monthly sector intelligence
  STRATEGIC_ASSESSMENT         ← quarterly geopolitical threat context
  AI_THREAT_BRIEFING           ← AI-specific threat intelligence product
```

---

## Correlation Engines

### Infrastructure Clustering
```
cluster_by_infrastructure(ioc_batch):

  # Group IOCs sharing infrastructure indicators
  clusters = {}
  
  for ioc in ioc_batch.filter(type=[IP, DOMAIN, CERTIFICATE]):
    # ASN clustering: same ASN may indicate shared hosting infrastructure
    asn = enrich.get_asn(ioc.value)
    if asn in known_malicious_asns or asn in asn_clusters:
      add_to_cluster(clusters, key=f"ASN:{asn}", ioc=ioc)
      
    # Certificate clustering: same TLS cert = same operator
    cert = enrich.get_tls_certificate(ioc.value)
    if cert:
      add_to_cluster(clusters, key=f"CERT:{cert.fingerprint}", ioc=ioc)
      
    # Registrar/registration pattern clustering
    whois = enrich.get_whois(ioc.value)
    if whois and whois.registrar in known_malicious_registrars:
      add_to_cluster(clusters, key=f"REGISTRAR:{whois.registrar}", ioc=ioc)
      
  # Clusters with >= 3 IOCs and no actor attribution → potential new campaign
  unattributed_clusters = [c for c in clusters.values()
                           if len(c.iocs) >= 3 and not c.actor_id]
  if unattributed_clusters:
    create_unattributed_campaign_alert(unattributed_clusters)
    
  Return: clusters
```

### TTP Behavioral Matching
```
match_ttp_patterns(event_sequence, window_hours=24):

  # Map internal detection events to MITRE ATT&CK techniques
  technique_sequence = [map_to_mitre(event) for event in event_sequence]
  
  # Match against known actor TTP sequences
  for actor in actor_registry.get_active_actors():
    actor_sequence = actor.capabilities.mitre_attack_techniques
    
    # Sequence similarity (longest common subsequence)
    lcs_score = lcs_similarity(technique_sequence, actor_sequence)
    
    if lcs_score >= 0.60:
      return AttributionCandidate {
        actor_id: actor.actor_id,
        confidence: lcs_score,
        matching_techniques: intersection(technique_sequence, actor_sequence),
        recommended_action: f"Investigate for {actor.name} intrusion"
      }
      
  Return: None  # no actor match
```

### Temporal Pattern Analysis
```
detect_coordinated_activity(ioc_store, window_hours=6):

  # Find IOCs with first_seen clustering in the same time window
  recent_iocs = ioc_store.get_new_since(hours=window_hours)
  
  # Group by source (multi-source simultaneous emergence = coordinated campaign)
  by_source = group_by(recent_iocs, key=lambda i: i.source_ids[0])
  
  # Cross-source correlation: if same IOC appears in 3+ feeds within 6hr = high confidence campaign launch
  cross_source = [ioc for ioc in recent_iocs if ioc.source_count >= 3]
  
  if len(cross_source) >= 10:
    create_campaign_alert(
      iocs=cross_source,
      confidence=HIGH,
      description="Coordinated IOC emergence across 3+ sources suggests active campaign launch"
    )
```

---

## Fusion Products

### Threat Bulletin
```yaml
threat_bulletin:
  bulletin_id: TIB-{NNN}
  created_at: ISO8601
  tlp: AMBER
  
  threat_type: string                 # e.g., "Active ransomware campaign targeting finance"
  severity: CRITICAL | HIGH | MEDIUM
  urgency: IMMEDIATE | 24H | 72H
  
  summary: string (max 300 chars)
  
  indicators:
    iocs: [IOC-{NNN}]                 # actionable blocklist items
    detection_rules: [rule_id]        # Sigma/YARA rules to deploy immediately
    
  threat_actor:
    actor_id: TA-{NNN} | null
    confidence: HIGH | MEDIUM | LOW | UNATTRIBUTED
    
  enterprise_relevance:
    affected_jurisdictions: [JUR-{XX}]
    affected_agent_classes: [string]
    affected_workflows: [string]
    
  recommended_actions:
    immediate: [string]               # block, isolate, patch
    short_term: [string]              # 24–72hr actions
    
  distribution: [string]             # who receives this bulletin
```

---

## Threat Scoring

```yaml
threat_scoring:
  enterprise_threat_score:
    description: Overall threat level score for the enterprise (0.00–1.00)
    components:
      active_campaigns_targeting_sector: float
      vulnerability_exposure: float
      recent_high_confidence_ioc_volume: float
      actor_activity_level: float
      ai_specific_threat_level: float
    
    aggregation: weighted average
    
    threat_levels:
      ELEVATED (>= 0.70): heightened monitoring; pre-position defenses
      HIGH (>= 0.50): proactive hunting; additional controls active
      MODERATE (>= 0.30): standard operations; monitor threat bulletin
      LOW (< 0.30): routine operations
      
    distribution:
      real_time: updated every 15 minutes
      consumers: security-operations-center; compliance-dashboard; T4 security brief
```

---

## AI Threat Intelligence Product

```yaml
ai_threat_intelligence:
  cadence: WEEKLY bulletin + ON_DISCOVERY for novel vectors
  
  tracked_dimensions:
    - active_jailbreak_techniques: systematic boundary-probing patterns in the wild
    - prompt_injection_campaigns: organized injection attempts against LLM services
    - model_extraction_attempts: API abuse patterns consistent with model stealing
    - adversarial_dataset_threats: known poisoned dataset campaigns
    - ai_supply_chain_threats: malicious models in public repositories
    
  distribution:
    primary: ai-specific-threat-detector.md
    secondary: constitutional-governor-quorum.md (for constitutional boundary threats)
    tertiary: T4 Security + Governance Org
    
  classification: TLP:AMBER_STRICT (internal only; AI threat detail not shared externally)
```

---

## Integration

```
Feeds into:
  security-operations-center.md — threat bulletins surface as SOC alerts
  detection-engineering.md — fusion products drive new detection rules
  ai-specific-threat-detector.md — AI threat intelligence products delivered here
  threat-intelligence-platform.md — fused intelligence updates IOC confidence scores

Receives from:
  threat-feed-aggregator.md — normalized IOC stream
  threat-actor-registry.md — actor TTP profiles for behavioral matching
  vulnerability-intelligence.md — CVE data for vulnerability correlation
  internal detections (FEED-040/041/042) — internal events drive correlation
```

---

## Governance

**Fusion products are TLP:AMBER by default:** Internal distribution only; external sharing of fused intelligence requires Legal Org approval  
**AI threat intel is constitutional-sensitive:** AI-targeting threat intelligence (prompt injection campaigns, jailbreak techniques) is shared with constitutional quorum without requiring separate approval  
**Attribution caution:** Fusion-based actor attribution carries explicit confidence level; high-confidence attribution requires 2+ independent corroborating techniques  
**Retention:** All fusion products retained 7 years; threat bulletins retained permanently as security evidence  
**Audit:** All fusion product creation and distribution events to `memory/threat-intelligence/fusion-audit.jsonl`
