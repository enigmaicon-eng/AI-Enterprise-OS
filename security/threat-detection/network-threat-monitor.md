# Network Threat Monitor
**ID:** TDT-NTM-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Monitors all network traffic flowing between agents, external services, enterprise zones, and inter-entity connections for threat signatures, anomalous patterns, data exfiltration indicators, command-and-control communications, and sovereignty violations. The Network Threat Monitor is the network visibility layer of the security stack: it ensures that threats transiting the network fabric are detected regardless of whether the source or destination agent has been compromised, and that no cross-border data flow violates sovereignty constraints.

---

## Monitored Traffic Domains

```yaml
monitored_traffic_domains:

  AGENT_TO_AGENT:
    scope: all inter-agent message bus traffic (event-bus.md channels)
    inspection: header analysis; payload volume; destination pattern; frequency
    sovereignty_check: source and destination jurisdiction compatibility
    
  AGENT_TO_EXTERNAL_API:
    scope: all outbound API calls to external services (connectors, third-party APIs)
    inspection: full header; payload size; response size; rate; endpoint reputation
    tls_inspection: certificate pinning violations detected here
    
  AGENT_TO_STORAGE:
    scope: all agent reads/writes to storage systems (databases, object stores, knowledge bases)
    inspection: volume; access pattern; data class; jurisdiction alignment
    
  CROSS_ENTITY_TRAFFIC:
    scope: all traffic transiting entity-to-entity federation links
    inspection: data class; transfer volume; permit validation; encryption
    sovereignty_enforcement: all cross-entity traffic verified against active permits
    
  EXTERNAL_INBOUND:
    scope: all traffic entering enterprise from external networks
    inspection: IOC matching; geo-IP; reputation; TLS; payload analysis
    
  SOVEREIGN_ZONE_PERIMETER:
    scope: traffic at SEZ (Sovereign Execution Zone) boundaries
    inspection: data sovereignty compliance; authorized zone transitions only
    CN_perimeter: always HARD isolation; no outbound data without T4 approval
```

---

## Network Detection Rules

```yaml
network_detection_rules:

  NET-001:
    name: "Known C2 Infrastructure Contact"
    condition: |
      outbound_connection.destination IN threat_intel.c2_ip_ranges OR
      dns_query.domain IN threat_intel.c2_domains OR
      tls_sni IN threat_intel.c2_hostnames
    severity: CRITICAL
    auto_action: block_connection; alert_T2; preserve_connection_metadata
    
  NET-002:
    name: "Data Exfiltration Volume Threshold"
    condition: |
      outbound_bytes > 100MB WITHIN 10_MINUTES
      SAME agent_id
      destination NOT IN approved_destinations
    severity: CRITICAL
    auto_action: throttle_connection; alert_T2; flag_agent_for_review
    
  NET-003:
    name: "DNS Tunneling Detection"
    condition: |
      dns_query.subdomain_length > 50 OR
      dns_query.query_rate > 100_per_minute OR
      dns_response.ttl < 10 AND dns_query.count_per_domain > 50
    severity: HIGH
    auto_action: block_dns_to_suspicious_domain; alert_T1
    
  NET-004:
    name: "Unauthorized Cross-Border Transfer"
    condition: |
      network_flow.source_jurisdiction != network_flow.destination_jurisdiction AND
      NOT active_transfer_permit(source_jurisdiction, destination_jurisdiction, data_class)
    severity: CRITICAL
    auto_action: block_transfer; alert_Legal_Org; start_GDPR_breach_clock_if_applicable; alert_T3
    
  NET-005:
    name: "TLS Certificate Anomaly"
    condition: |
      tls_certificate.issuer NOT IN approved_ca_list OR
      tls_certificate.subject_alt_name != expected_service_identity OR
      tls_certificate.expired == true OR
      tls_certificate.self_signed == true AND destination.type == PRODUCTION
    severity: HIGH
    auto_action: block_connection; alert_T2
    
  NET-006:
    name: "Sovereign Zone Perimeter Violation"
    condition: |
      traffic.crosses_sez_boundary == true AND
      NOT authorized_zone_transition(source_sez, destination_sez, agent_id)
    severity: CRITICAL
    auto_action: block_traffic; quarantine_source_agent; alert_T4
    
  NET-007:
    name: "Beaconing Pattern Detection"
    condition: |
      outbound_connection RECURS with interval_variance < 5%
      over >= 10 occurrences WITHIN 2_HOURS
      destination NOT IN known_heartbeat_endpoints
    severity: HIGH
    auto_action: flag_connection_for_review; alert_T1
    
  NET-008:
    name: "Lateral Movement Network Pattern"
    condition: |
      agent_id makes successful_connection to >= 5 distinct internal_agents
      WITHIN 10_MINUTES
      WHERE connections are NOT in behavioral_baseline(agent_id)
    severity: HIGH
    auto_action: flag_agent_for_review; alert_T2; begin_connection_logging
    
  NET-009:
    name: "Model Weight Exfiltration Pattern"
    condition: |
      outbound_transfer.data_type MATCHES model_weight_signature OR
      outbound_bytes > 50MB AND source_process IN model_serving_processes AND
      destination NOT IN approved_model_artifact_destinations
    severity: CRITICAL
    auto_action: block_transfer; quarantine_source_agent; alert_T3; alert_constitutional_quorum
    
  NET-010:
    name: "Supply Chain Callback"
    condition: |
      process_in(agent_execution_environment) makes outbound_call to
      domain NOT IN agent_manifest.approved_external_endpoints
      AND process NOT IN agent_manifest.authorized_processes
    severity: HIGH
    auto_action: block_connection; flag_agent; alert_T2; trigger_supply_chain_investigation
```

---

## Traffic Analysis Pipeline

```
ingest_network_event(flow_record):

  # Step 1: Normalize
  normalized = normalize_flow(flow_record)   # canonical format; timestamps UTC; IPs normalized

  # Step 2: Enrich
  enrichment = {
    src_geo: geo_ip(normalized.src_ip),
    dst_geo: geo_ip(normalized.dst_ip),
    dst_reputation: threat_intel.query_ip(normalized.dst_ip),
    dst_domain_reputation: threat_intel.query_domain(normalized.dst_domain),
    src_agent: resolve_agent_from_ip(normalized.src_ip),
    dst_service: resolve_service(normalized.dst_ip, normalized.dst_port),
    jurisdiction_pair: (src_geo.jurisdiction, dst_geo.jurisdiction),
    permit_status: cross_border_permit_lookup(jurisdiction_pair, data_class)
  }

  # Step 3: IOC matching (real-time)
  ioc_matches = threat_intel.match_iocs([normalized.src_ip, normalized.dst_ip,
                                          normalized.dst_domain, normalized.tls_sni])
  
  if ioc_matches.any(confidence >= 0.90 AND severity == CRITICAL):
    auto_block(normalized.flow_id)
    create_alert(severity=CRITICAL, rule="IOC_MATCH_C2")
    Return
    
  # Step 4: Rule evaluation (parallel)
  rule_hits = evaluate_rules_parallel(normalized, enrichment)
  
  for rule_hit in rule_hits:
    execute_auto_actions(rule_hit)
    create_alert_if_threshold(rule_hit)
    
  # Step 5: Behavioral anomaly contribution
  update_network_behavioral_model(normalized.src_agent, normalized)
  
  # Step 6: Audit log
  append_audit(normalized, enrichment, ioc_matches, rule_hits)
```

---

## Sovereignty Enforcement Layer

```yaml
sovereignty_enforcement:

  real_time_permit_check:
    trigger: every cross-jurisdiction network flow
    check: active_permit(source_jurisdiction, destination_jurisdiction, data_class)
    no_permit: block_immediately; log UNAUTHORIZED_CROSS_BORDER_TRANSFER
    
  data_class_inference:
    method: packet inspection + flow metadata + source agent data manifest
    classes: PERSONAL_DATA | FINANCIAL | HEALTH | AI_TRAINING | CLASSIFIED | OPERATIONAL
    
  cn_perimeter_enforcement:
    CN_outbound: blocked unless T4-signed permit exists + current session approved
    CN_inbound: allowed for approved external services only (whitelist)
    cn_data_residency_check: every storage write in CN jurisdiction verified
    
  adequacy_status_integration:
    feeds_from: regulatory-change-detector.md (real-time adequacy updates)
    on_adequacy_revocation: immediately block all flows to newly-inadequate jurisdiction
    trigger: start cross-border transfer suspension workflow
```

---

## Network Flow Record Schema

```yaml
network_flow_record:
  flow_id: NET-{NNN}
  captured_at: ISO8601
  
  source:
    ip: string
    port: integer
    agent_id: string | null
    jurisdiction: JUR-{XX}
    sez: string | null
    
  destination:
    ip: string
    port: integer
    service: string | null
    domain: string | null
    tls_sni: string | null
    jurisdiction: JUR-{XX}
    
  traffic:
    protocol: TCP | UDP | DNS | TLS | HTTP | HTTPS | CUSTOM
    bytes_sent: integer
    bytes_received: integer
    packets: integer
    duration_ms: integer
    
  analysis:
    ioc_matches: [IOC-{NNN}]
    rule_hits: [NET-{NNN}]
    jurisdiction_permit_status: PERMITTED | BLOCKED | NO_PERMIT | EXEMPT
    anomaly_score: float | null
    
  actions_taken: [string]
  
  integrity:
    entry_hash: sha256
```

---

## Integration

```
Feeds into:
  security-event-correlator.md — network events feed correlation rules (COR-003/006/008/009)
  security-alert-manager.md — network alerts enter alert queue
  threat-intelligence-platform.md — confirmed malicious IPs/domains created as IOCs
  adaptive-compliance/compliance-engine.md — cross-border violations feed compliance engine

Receives from:
  sovereign-execution-zones — zone boundary crossing events
  network-infrastructure — flow telemetry (NetFlow/IPFIX/eBPF)
  threat-intelligence-platform.md — IOC blocklists and C2 indicators
  regulatory-change-detector.md — adequacy status changes (jurisdiction permit invalidation)
```

---

## Governance

**Sovereignty enforcement is non-bypassable:** No network exception overrides cross-border blocking without active T4-signed permit; CN perimeter violations auto-escalate to T4 + board immediate  
**TLS inspection scope:** TLS decryption only for traffic from/to enterprise-controlled endpoints; external encrypted traffic analyzed by metadata only  
**CN perimeter authority:** Any modification to CN perimeter rules requires T5 + constitutional board quorum  
**Permit integration:** Network layer consumes permits from adaptive-compliance; does not maintain its own permit store; compliance system is authoritative  
**Audit:** All network flow events, rule hits, and auto-actions to `memory/threat-detection/network-audit.jsonl`; 7-year retention
