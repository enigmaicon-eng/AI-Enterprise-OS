# Threat Feed Aggregator
**ID:** TIP-TFA-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Ingests, normalizes, deduplicates, and quality-scores threat intelligence from 30+ external and internal sources — commercial feeds, OSINT, government sharing, and internal telemetry. The Feed Aggregator is the data ingestion pipeline for the Threat Intelligence Platform: it ensures that downstream consumers receive clean, consistent, enriched indicators regardless of the format or quality of the source feed, and that every indicator is traceable to its originating source.

---

## Feed Registry

```yaml
feed_registry:

  COMMERCIAL_FEEDS:
    - feed_id: FEED-001
      name: "Recorded Future"
      type: COMMERCIAL
      formats: [STIX_2.1, JSON]
      update_frequency: REAL_TIME (streaming)
      trust_rating: 0.90
      covers: [IP, DOMAIN, FILE_HASH, VULNERABILITY, THREAT_ACTOR]
      jurisdiction_restriction: none
      
    - feed_id: FEED-002
      name: "Mandiant Threat Intelligence"
      type: COMMERCIAL
      formats: [STIX_2.1, JSON]
      update_frequency: DAILY
      trust_rating: 0.92
      covers: [APT_ACTORS, MALWARE_FAMILIES, CAMPAIGNS, FILE_HASH]
      
    - feed_id: FEED-003
      name: "CrowdStrike Falcon Intelligence"
      type: COMMERCIAL
      formats: [JSON, CSV]
      update_frequency: HOURLY
      trust_rating: 0.90
      covers: [IP, DOMAIN, FILE_HASH, THREAT_ACTOR, MALWARE]
      
    - feed_id: FEED-004
      name: "IBM X-Force"
      type: COMMERCIAL
      formats: [STIX_2.1, JSON]
      update_frequency: DAILY
      trust_rating: 0.85
      covers: [IP, DOMAIN, FILE_HASH, VULNERABILITY]

  OSINT_FEEDS:
    - feed_id: FEED-010
      name: "AlienVault OTX"
      type: OSINT
      formats: [JSON, STIX_2.1]
      update_frequency: HOURLY
      trust_rating: 0.60        # OSINT; community-contributed; more false positives
      covers: [IP, DOMAIN, FILE_HASH, URL]
      
    - feed_id: FEED-011
      name: "Abuse.ch MalwareBazaar"
      type: OSINT
      formats: [JSON, CSV]
      update_frequency: REAL_TIME
      trust_rating: 0.75
      covers: [FILE_HASH, MALWARE_FAMILY]
      
    - feed_id: FEED-012
      name: "Abuse.ch URLhaus"
      type: OSINT
      formats: [CSV, JSON]
      update_frequency: REAL_TIME
      trust_rating: 0.70
      covers: [URL, DOMAIN]
      
    - feed_id: FEED-013
      name: "PhishTank"
      type: OSINT
      formats: [CSV, JSON]
      update_frequency: HOURLY
      trust_rating: 0.72
      covers: [URL, PHISHING]
      
    - feed_id: FEED-014
      name: "Emerging Threats (ProofPoint ET)"
      type: OSINT
      formats: [SNORT_RULES, SURICATA_RULES]
      update_frequency: DAILY
      trust_rating: 0.78
      covers: [IP, NETWORK_RULES]
      
    - feed_id: FEED-015
      name: "CIRCL.lu MISP Feeds"
      type: OSINT
      formats: [MISP_JSON, STIX_2.1]
      update_frequency: DAILY
      trust_rating: 0.68
      covers: [IP, DOMAIN, FILE_HASH, MALWARE]

  GOVERNMENT_SHARING:
    - feed_id: FEED-020
      name: "CISA AIS (Automated Indicator Sharing)"
      type: GOVERNMENT
      formats: [STIX_2.1, TAXII_2.1]
      update_frequency: REAL_TIME
      trust_rating: 0.88
      covers: [IP, DOMAIN, FILE_HASH, MALWARE, VULNERABILITY]
      tlp_default: TLP_GREEN
      
    - feed_id: FEED-021
      name: "NCSC UK Threat Intelligence"
      type: GOVERNMENT
      formats: [STIX_2.1]
      update_frequency: WEEKLY
      trust_rating: 0.88
      covers: [APT_ACTORS, MALWARE, CAMPAIGNS]
      jurisdiction: JUR-GB
      
    - feed_id: FEED-022
      name: "ENISA (EU Agency for Cybersecurity)"
      type: GOVERNMENT
      formats: [JSON, PDF_REPORTS]
      update_frequency: WEEKLY
      trust_rating: 0.82
      covers: [VULNERABILITY, THREAT_LANDSCAPE, SECTOR_THREATS]
      jurisdiction: JUR-EU
      
    - feed_id: FEED-023
      name: "CERT-IN (Indian CERT)"
      type: GOVERNMENT
      formats: [CSV, JSON]
      update_frequency: WEEKLY
      trust_rating: 0.78
      covers: [IP, MALWARE, VULNERABILITY]
      jurisdiction: JUR-IN

  AI_SPECIFIC_FEEDS:
    - feed_id: FEED-030
      name: "AI Vulnerability Database (AVID)"
      type: RESEARCH
      formats: [JSON]
      update_frequency: WEEKLY
      trust_rating: 0.80
      covers: [AI_MODEL_VULNERABILITIES, PROMPT_INJECTION, ADVERSARIAL_ATTACKS]
      
    - feed_id: FEED-031
      name: "HuggingFace Model Safety Reports"
      type: RESEARCH
      formats: [JSON]
      update_frequency: WEEKLY
      trust_rating: 0.75
      covers: [MALICIOUS_MODELS, POISONED_DATASETS, AI_SUPPLY_CHAIN]

  INTERNAL_FEEDS:
    - feed_id: FEED-040
      name: "Internal Detection Telemetry"
      type: INTERNAL
      formats: [JSONL]
      update_frequency: REAL_TIME
      trust_rating: 0.95        # internal detections are high-confidence
      covers: [ALL_TYPES]
      
    - feed_id: FEED-041
      name: "Honeypot Network"
      type: INTERNAL
      formats: [JSONL]
      update_frequency: REAL_TIME
      trust_rating: 0.90
      covers: [IP, ATTACK_PATTERNS, NETWORK_BEHAVIOR]
      
    - feed_id: FEED-042
      name: "Incident Response Artifacts"
      type: INTERNAL
      formats: [JSONL, STIX_2.1]
      update_frequency: ON_INCIDENT
      trust_rating: 0.95
      covers: [ALL_TYPES]
```

---

## Ingestion Pipeline

```
ingest_feed(feed_id, raw_data):

  feed = feed_registry.get(feed_id)
  
  # Stage 1: Parse and normalize
  indicators = parse_feed(raw_data, format=feed.formats[0])
  normalized = [normalize_indicator(i, feed) for i in indicators]
  
  # Stage 2: Deduplication
  new_indicators = []
  updated_indicators = []
  
  for indicator in normalized:
    dedup_key = sha256(indicator.object_type + ":" + indicator.value.lower())
    existing = ioc_store.get(dedup_key)
    
    if existing:
      # Update: add source, refresh confidence, update last_seen
      existing.source_ids.append(feed_id)
      existing.source_count += 1
      existing.confidence = recalculate_confidence(existing)
      existing.last_seen = now()
      if expired(existing): reset_expiry(existing)
      updated_indicators.append(existing)
    else:
      # New indicator
      indicator.ioc_id = generate_ioc_id()
      indicator.first_seen = now()
      indicator.confidence = feed.trust_rating
      new_indicators.append(indicator)
      
  # Stage 3: Basic quality filtering
  filtered = [i for i in (new_indicators + updated_indicators)
              if passes_quality_filter(i)]
  # Quality filter: rejects indicators with no value, malformed values, obvious false positives
  # (e.g., RFC1918 private IPs as external threat IOCs)
  
  # Stage 4: Enrich (async; does not block ingestion)
  for indicator in filtered:
    enrich_async(indicator)
    
  # Stage 5: Store and distribute
  ioc_store.upsert_batch(filtered)
  distribute_to_consumers(filtered, threshold=DISTRIBUTION_THRESHOLDS)
  
  log_ingestion(feed_id, total=len(indicators), new=len(new_indicators),
                updated=len(updated_indicators), filtered_out=len(indicators)-len(filtered))
```

---

## Feed Health Monitoring

```yaml
feed_health_monitoring:
  metrics_per_feed:
    - ingestion_rate: indicators per hour
    - dedup_rate: % of indicators already known (high = feed is stale; low = high novelty)
    - false_positive_rate: % of feed's IOCs later confirmed as false positives
    - freshness: age of newest indicator in feed
    - availability: % of scheduled ingestion runs that succeeded
    
  thresholds:
    feed_stale: no new indicators for 2× expected update frequency
    feed_unavailable: 3 consecutive failed ingestion attempts
    high_false_positive: feed FP rate > 20% in last 30 days
    
  response:
    feed_stale: alert Security Org; check source; suspend if > 7 days stale
    feed_unavailable: retry with backoff; alert Security Org at 6hr; suspend at 24hr
    high_false_positive: reduce feed trust_rating by 0.10; flag for manual review
    trust_rating_floor: if trust drops below 0.40, auto-suspend feed
    
  trust_rating_updates:
    cadence: monthly recalibration
    method: Bayesian update based on false positive + true positive rates
    floor: 0.00 (fully distrusted)
    ceiling: 0.95 (no single source is fully trusted)
```

---

## Integration

```
Feeds into:
  threat-intelligence-platform.md — normalized IOCs enter the platform here
  threat-intelligence-fusion.md — raw indicators available for correlation

Receives from:
  external feeds (per feed registry above)
  internal threat-detection/ systems (FEED-040/041/042)
  incident-response artifacts (FEED-042)
```

---

## Governance

**Feed provenance is immutable:** Every IOC retains its originating feed_id; provenance cannot be stripped  
**Internal feeds highest trust:** FEED-040/041/042 carry 0.90–0.95 trust; internal detections are authoritative  
**CN feed isolation:** Intelligence ingested via CN entity feeds is subject to CAC data classification before external distribution; CN internal feeds routed through CN data partition only  
**False positive feedback loop:** When an IOC is confirmed as a false positive, the originating feed's trust rating is adjusted; persistent high-FP feeds are suspended  
**Audit:** All ingestion events and feed health transitions to `memory/threat-intelligence/feed-audit.jsonl`
