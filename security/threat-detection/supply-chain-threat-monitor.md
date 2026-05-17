# Supply Chain Threat Monitor
**ID:** TDT-SCM-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Monitors and verifies the integrity of all AI models, software packages, dependencies, data pipelines, and external connectors that are ingested into the enterprise execution environment. Supply chain attacks — including model weight backdoors, poisoned training datasets, malicious package updates, and compromised connector libraries — represent a category of threat where the attack is embedded before enterprise controls can intercept it. The Supply Chain Threat Monitor enforces integrity at every ingestion boundary.

---

## Supply Chain Attack Taxonomy

```yaml
supply_chain_attack_taxonomy:

  MODEL_WEIGHT_ATTACK:
    subtypes:
      DIRECT_BACKDOOR: backdoored weights with trigger-activated malicious behavior
      FINE_TUNE_POISONING: malicious fine-tuning of legitimate base model
      ADAPTER_BACKDOOR: malicious LoRA or adapter layer added to clean base model
      QUANTIZATION_EXPLOIT: vulnerabilities introduced during quantization
    mitre: AML.T0018 | AML.T0020
    detection_methods: [hash_verification, behavioral_fingerprinting, probe_testing]
    
  TRAINING_DATA_POISONING:
    subtypes:
      LABEL_FLIPPING: systematically incorrect labels injected into training data
      BACKDOOR_INJECTION: trigger-response pairs embedded in training corpus
      MEMBERSHIP_MANIPULATION: sensitive data embedded to enable extraction
      DISTRIBUTION_SHIFT: subtle statistical shifts to degrade specific capabilities
    mitre: AML.T0020
    detection_methods: [statistical_validation, provenance_verification, canary_records]
    
  DEPENDENCY_COMPROMISE:
    subtypes:
      TYPOSQUATTING: package with similar name to legitimate dependency
      DEPENDENCY_CONFUSION: internal package name overridden by public package
      LEGITIMATE_UPDATE_POISONING: malicious update pushed to legitimate package
      TRANSITIVE_DEPENDENCY: malicious code in indirect dependency
    mitre: T1195
    detection_methods: [hash_verification, provenance_check, sbom_validation]
    
  CONNECTOR_COMPROMISE:
    subtypes:
      API_ENDPOINT_HIJACKING: legitimate API endpoint taken over by adversary
      OAUTH_TOKEN_THEFT: connector credentials stolen and replicated
      SDK_BACKDOOR: malicious code in connector SDK
      RESPONSE_TAMPERING: legitimate connector responses modified in transit
    mitre: T1195
    detection_methods: [certificate_pinning, response_signing, behavioral_monitoring]
    
  DATA_PIPELINE_COMPROMISE:
    subtypes:
      UPSTREAM_SOURCE_COMPROMISE: data source itself is compromised
      PIPELINE_MAN_IN_MIDDLE: data modified in transit through pipeline
      SCHEMA_INJECTION: malicious schema changes altering data interpretation
    detection_methods: [pipeline_integrity_hashing, anomaly_detection, provenance_chain]
```

---

## Integrity Verification System

```yaml
integrity_verification:

  MODEL_VERIFICATION:
    trigger: every model load; every 6 hours during inference; on any file system event
    
    hash_verification:
      method: sha256(model_weights_file) compared against model_registry.known_good_hash
      registry: model-lifecycle.md model registry; cryptographically signed entries
      on_mismatch: BLOCK load; create CRITICAL alert; auto-quarantine agent attempting load
      
    behavioral_fingerprinting:
      method: deterministic forward pass on 100 fixed probe inputs (curated; not public)
      baseline: known-good behavioral fingerprint stored at model registration
      delta_metric: L2 distance between observed and baseline output distributions
      threshold: alert if delta > 0.15; block if delta > 0.30
      cadence: run at model load + every 24 hours for active models
      
    activation_pattern_analysis:
      method: sample internal activation patterns on probe inputs
      anomaly: unusual activation clusters = potential backdoor trigger regions
      alert_threshold: activation_anomaly_score > 0.70
      
    probe_testing:
      method: send curated probe prompts designed to activate known backdoor triggers
      probe_library: 200+ probes maintained by T3; updated on new backdoor disclosures
      response_analysis: semantic comparison of response to expected benign output
      on_trigger_activation: immediate BLOCK; CRITICAL alert; T4 immediate
      
  PACKAGE_VERIFICATION:
    trigger: every package install or update; every CI/CD pipeline run
    
    sbom_validation:
      sbom_required: every enterprise package must have SBOM (Software Bill of Materials)
      verification: sha256 of every package and dependency matches SBOM entry
      
    hash_registry:
      known_good_hashes: registry of approved package versions + hashes
      compromised_hash_list: feeds from threat-intelligence-platform.md (supply chain IOCs)
      on_compromised_hash: block install; alert T2; trigger supply chain investigation
      
    provenance_verification:
      pypi_npm_verification: package download from official registries only; no third-party mirrors
      signing_check: verify package signing certificate where available (PyPI Trusted Publishers, npm provenance)
      
    typosquatting_detection:
      method: Levenshtein distance < 3 from known packages in manifest
      new_package_review: any new dependency not previously in enterprise requires T3 approval
      
  DATA_PIPELINE_VERIFICATION:
    trigger: every pipeline run; every data batch ingestion
    
    provenance_chain:
      method: cryptographic hash chain from source through each transformation stage
      verification: hash at ingestion == expected hash given source + transformations
      on_mismatch: halt pipeline; alert T3; preserve data for forensics
      
    canary_records:
      method: known synthetic records with unique identifiers seeded into training data
      monitoring: canary records scanned for in model outputs (membership inference indicator)
      on_detection: data poisoning suspected; T3 immediate; full pipeline audit
      
    statistical_validation:
      checks: label distribution, class balance, feature statistics vs. baseline
      alert: if any metric deviates > 3σ from established baseline
      
  CONNECTOR_VERIFICATION:
    trigger: connector initialization; every 5 minutes for active connectors
    
    certificate_pinning:
      method: TLS certificate fingerprint matches pinned value in connector manifest
      on_mismatch: block connector; alert T2
      
    response_integrity:
      method: connectors that support response signing; verify signature
      anomaly_detection: statistical check of response content distributions
      
    endpoint_reputation:
      method: connector destination IP/domain checked against threat intelligence
      on_ioc_match: block connector; alert T2
```

---

## Supply Chain Incident Record

```yaml
supply_chain_incident:
  incident_id: SCI-{NNN}
  detected_at: ISO8601
  
  attack_type: string                    # from supply_chain_attack_taxonomy
  attack_subtype: string
  severity: CRITICAL | HIGH | MEDIUM
  
  affected_artifact:
    artifact_type: MODEL | PACKAGE | DATA_PIPELINE | CONNECTOR
    artifact_id: string
    artifact_version: string
    artifact_hash_observed: sha256
    artifact_hash_expected: sha256 | null
    
  detection_method: string               # which verification method triggered
  
  blast_radius:
    agents_loaded_artifact: [string]
    agents_at_risk: [string]
    quarantine_status: PENDING | IN_PROGRESS | COMPLETE
    
  investigation:
    root_cause: string | null
    entry_vector: string | null           # how did compromised artifact enter?
    attribution: TA-{NNN} | null
    
  remediation:
    artifact_removed: boolean
    agents_reloaded: boolean
    pipeline_restarted: boolean
    clean_artifact_hash: sha256 | null
    
  integrity:
    entry_hash: sha256
```

---

## Compromised Hash Registry

```yaml
compromised_hash_registry:
  registry_id: SCR-COMPROMISED
  
  entry_schema:
    hash: sha256
    artifact_type: MODEL | PACKAGE | DATA_FILE | LIBRARY
    artifact_name: string
    version: string | null
    compromise_type: string
    source: INTERNAL_DISCOVERY | THREAT_INTEL_FEED | VENDOR_DISCLOSURE | ISAC_SHARING
    confidence: float
    added_at: ISO8601
    threat_actor: TA-{NNN} | null
    
  integration:
    receives_from:
      - threat-intelligence-platform.md (supply chain IOC feeds)
      - CISA KEV (Known Exploited Vulnerabilities)
      - AI security advisories (AVID, HuggingFace Security)
      - internal incident discoveries (added on confirmation)
    distributes_to:
      - integrity verification system (real-time lookup)
      - CI/CD pipeline gates (build-time check)
      - model_registry (blocks compromised model loads)
      
  sharing:
    tlp: TLP:AMBER
    share_with: FS-ISAC, AI safety organizations, sector ISACs
    sharing_gate: T3 approval; Legal review for supply chain details
```

---

## CI/CD Pipeline Integration

```yaml
cicd_integration:

  pipeline_gates:
    GATE-SCC-001:
      name: "Dependency Hash Verification"
      stage: before any package install
      check: all dependencies in requirements/package.json have known-good hashes
      on_fail: BLOCK pipeline; alert engineer + T3
      
    GATE-SCC-002:
      name: "SBOM Generation and Validation"
      stage: after dependency install
      check: generate SBOM; all packages have provenance; no compromised hashes
      on_fail: BLOCK pipeline; alert T3
      
    GATE-SCC-003:
      name: "Model Integrity Check"
      stage: before model deployment
      check: model hash == model_registry.approved_hash; behavioral fingerprint validated
      on_fail: BLOCK deployment; alert T3; no exception without T4 sign-off
      
    GATE-SCC-004:
      name: "New Dependency Review Gate"
      stage: on any new dependency (not previously in enterprise registry)
      check: T3 Security review completed; package not typosquatting known package
      on_fail: BLOCK pipeline; require T3 approval before proceeding
      
  pipeline_audit:
    all_gate_results: logged to memory/threat-detection/cicd-supply-chain-audit.jsonl
    retention: 7 years
```

---

## Integration

```
Feeds into:
  security-event-correlator.md — supply chain events feed COR-009 (supply chain compromise)
  security-alert-manager.md — CRITICAL supply chain alerts (T2+ routing)
  threat-intelligence-platform.md — confirmed compromised hashes shared as IOCs
  model-lifecycle.md — model integrity failures reported to model lifecycle management

Receives from:
  threat-intelligence-platform.md — supply chain threat feeds (AI-specific + general)
  model-registry — approved model hashes and behavioral fingerprints
  cicd-pipeline.md — all package installs and model deployments
  network-threat-monitor.md — connector endpoint reputation and callback detection
```

---

## Governance

**Zero-tolerance for hash mismatch:** Any model or package with a hash mismatch against the registry is blocked automatically — no exception, no workaround, no emergency bypass without a new approved hash registered by T3  
**Model probe test confidentiality:** Probe input library is classified RESTRICTED; disclosure of probe inputs would allow adversaries to craft backdoors that evade them  
**Supply chain IOC sharing:** Confirmed supply chain compromise indicators are shared with ISACs within 24 hours; early warning to ecosystem  
**New dependency governance:** Every new external dependency added to any enterprise agent requires T3 Security approval before first use in production  
**Audit:** All integrity verification results, supply chain incidents, and CI/CD gate decisions to `memory/threat-detection/supply-chain-audit.jsonl`; 7-year retention
