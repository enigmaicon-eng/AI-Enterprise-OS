# Threat Actor Registry
**ID:** TIP-TAR-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Maintains authoritative profiles of known threat actors — nation-state APT groups, criminal organizations, hacktivist collectives, and insider threat archetypes — including their motivations, targets, tools, techniques, and procedures (TTPs) mapped to the MITRE ATT&CK framework. The Threat Actor Registry enables defenders to move from indicator-based detection ("block this IP") to behavior-based detection ("block this TTP pattern"), dramatically improving detection rates against sophisticated adversaries who rotate infrastructure regularly.

---

## Threat Actor Schema

```yaml
threat_actor:
  actor_id: TA-{NNN}
  name: string                       # primary name
  aliases: [string]                  # alternative names across different sources
  
  classification:
    actor_type: NATION_STATE | CRIMINAL_ORG | HACKTIVIST | INSIDER | AI_ADVERSARY | UNKNOWN
    sophistication: MINIMAL | DEVELOPING | ADVANCED | EXPERT | INNOVATOR
    motivation: [FINANCIAL, ESPIONAGE, DISRUPTION, IDEOLOGY, AI_CAPABILITY_THEFT, DATA_THEFT]
    
  attribution:
    attributed_to: string | null     # country/organization (with confidence)
    attribution_confidence: HIGH | MEDIUM | LOW | UNATTRIBUTED
    last_confirmed_activity: ISO8601
    
  targeting:
    sectors: [string]                # e.g., ["finance", "healthcare", "AI_research"]
    jurisdictions: [JUR-{XX}]        # jurisdictions this actor targets or operates from
    known_targets: [string]          # organization types or named targets (public info only)
    ai_system_targeting: boolean     # does this actor specifically target AI/ML systems
    
  capabilities:
    tools: [string]                  # malware families, tools known to use
    mitre_attack_techniques: [string] # e.g., ["T1566", "T1055", "T1071.001"]
    mitre_attack_tactics: [string]   # e.g., ["Initial Access", "Execution", "C2"]
    zero_day_capability: boolean
    ai_attack_capability: boolean    # can attack AI/ML systems (prompt injection, poisoning, etc.)
    
  infrastructure:
    known_ip_ranges: [string]        # CIDR; may rotate
    known_domains: [string]          # domains used for C2 or phishing
    preferred_hosting: [string]      # bulletproof hosting providers, cloud providers abused
    
  iocs_linked: [IOC-{NNN}]          # indicators attributed to this actor
  
  campaigns: [CAMP-{NNN}]           # active or historical campaigns
  
  lifecycle:
    status: ACTIVE | DORMANT | DISBANDED | UNKNOWN
    first_observed: ISO8601
    last_observed: ISO8601
    profile_confidence: HIGH | MEDIUM | LOW
    
  intelligence_sources: [string]    # which TI sources attribute this actor profile
  tlp: AMBER                        # actor profiles are TLP:AMBER by default
```

---

## AI-Specific Threat Actor Profiles

```yaml
ai_targeting_actors:
  # Actors with known or assessed AI system targeting capability

  TA-AI-001:
    name: "AI Model Exfiltration Group"
    actor_type: CRIMINAL_ORG | NATION_STATE
    motivation: [AI_CAPABILITY_THEFT, ESPIONAGE]
    ai_attack_capability: true
    ai_attack_techniques:
      - PROMPT_INJECTION_INDIRECT: inject instructions via retrieved content
      - MODEL_EXTRACTION: query API to reconstruct proprietary model weights
      - TRAINING_DATA_POISONING: compromise upstream data sources
      - ADVERSARIAL_INPUT_EVASION: craft inputs to evade AI-based detectors
    detection_guidance:
      - monitor for high-volume LLM API queries from single source
      - detect prompt patterns containing instruction injection markers
      - baseline training data source integrity hashes
      
  TA-AI-002:
    name: "AI Safety Boundary Probers"
    actor_type: HACKTIVIST | CRIMINAL_ORG
    motivation: [IDEOLOGY, FINANCIAL]
    ai_attack_capability: true
    ai_attack_techniques:
      - JAILBREAK_SYSTEMATIC: systematic exploration of constitutional boundary bypasses
      - MULTI_TURN_MANIPULATION: build context over many turns to shift model behavior
      - ROLE_PLAYING_BYPASS: use fictional framing to elicit prohibited outputs
    detection_guidance:
      - monitor for multi-turn sessions with increasing constitutional proximity scores
      - detect role-playing framing combined with prohibited topic proximity > 0.60
      - alert on sessions with > 5 REQUIRE_REVIEW decisions in single interaction
      
  TA-AI-003:
    name: "Supply Chain Model Poisoners"
    actor_type: NATION_STATE
    motivation: [ESPIONAGE, DISRUPTION]
    ai_attack_capability: true
    ai_attack_techniques:
      - MALICIOUS_MODEL_UPLOAD: upload backdoored models to public repositories
      - DEPENDENCY_CONFUSION: use package name squatting in ML ecosystems
      - TRAINING_DATA_MANIPULATION: compromise public dataset repositories
    detection_guidance:
      - verify all model downloads against known-good hashes
      - sandbox-evaluate all third-party models before deployment
      - monitor public dataset sources for unexpected changes
```

---

## TTP Mapping (MITRE ATT&CK for Enterprise + AI)

```yaml
mitre_attack_coverage:
  framework_versions:
    enterprise: "ATT&CK Enterprise v15"
    ics: "ATT&CK for ICS v3"
    ai_supplement: "ATLAS (Adversarial Threat Landscape for AI Systems) v1.0"
    
  high_priority_techniques_for_OS:
    INITIAL_ACCESS:
      - T1566: Phishing (email-based; agents with email integration)
      - T1195: Supply Chain Compromise (model/package supply chain)
      - T1190: Exploit Public-Facing Application (API endpoints)
      
    EXECUTION:
      - T1059: Command and Scripting Interpreter (code execution via agent tools)
      - AML.T0043: Craft Adversarial Data (AI-specific; adversarial inputs)
      
    PERSISTENCE:
      - T1078: Valid Accounts (compromised agent credentials)
      - AML.T0018: Backdoor ML Model (poisoned model persists)
      
    PRIVILEGE_ESCALATION:
      - T1548: Abuse Elevation Control Mechanism (bypass autonomy level gates)
      
    DEFENSE_EVASION:
      - AML.T0054: LLM Prompt Injection (bypass detection via injected instructions)
      - T1036: Masquerading (impersonate legitimate agent)
      
    COLLECTION:
      - T1530: Data from Cloud Storage (access memory partitions)
      - AML.T0037: Model Extraction (steal proprietary model)
      
    EXFILTRATION:
      - T1041: Exfiltration Over C2 Channel (via compromised agent API calls)
      - T1048: Exfiltration Over Alternative Protocol
      
    IMPACT:
      - T1486: Data Encrypted for Impact (ransomware on agent state/memory)
      - AML.T0017: Evade ML Model (bypass AI-based security controls)
```

---

## Actor-Based Detection Rules

```
generate_actor_detection_rules(actor_id):

  actor = load_actor(actor_id)
  rules = []
  
  for technique in actor.capabilities.mitre_attack_techniques:
    # Generate Sigma rule skeleton for each technique
    rule = SigmaRule {
      title: f"{actor.name} - {technique}",
      actor_id: actor_id,
      mitre_technique: technique,
      condition: build_detection_condition(technique, actor.infrastructure),
      severity: map_sophistication_to_severity(actor.classification.sophistication),
      tags: [f"actor.{actor.actor_id}", f"technique.{technique}"]
    }
    rules.append(rule)
    
  # Push to detection-engineering for validation and deployment
  detection_engineering.submit_actor_rules(rules, actor_id=actor_id)
  
  Return: rules
```

---

## Campaign Tracking

```yaml
campaign_schema:
  campaign_id: CAMP-{NNN}
  name: string
  actor_id: TA-{NNN}
  
  timeline:
    first_activity: ISO8601
    last_activity: ISO8601
    status: ACTIVE | CONCLUDED | SUSPECTED_PAUSED
    
  targeting:
    sectors_targeted: [string]
    jurisdictions_targeted: [JUR-{XX}]
    enterprise_relevance: HIGH | MEDIUM | LOW | NONE
    
  iocs: [IOC-{NNN}]
  techniques: [string]               # MITRE ATT&CK technique IDs
  
  enterprise_impact_assessment:
    threat_to_entity: {entity_id: risk_level}
    recommended_actions: [string]
    detection_rules_deployed: [string]
```

---

## Integration

```
Feeds into:
  threat-intelligence-platform.md — actor profiles enrich IOC context
  ai-specific-threat-detector.md — AI actor TTPs drive AI-specific detection rules
  detection-engineering.md — actor-based Sigma rules generated here
  security-operations-center.md — actor profiles surface in alert context

Receives from:
  threat-feed-aggregator.md — actor attribution from commercial feeds
  incident-response artifacts — post-incident forensics may reveal actor attribution
  security-event-correlator.md — TTP pattern matches confirm actor attribution
```

---

## Governance

**Attribution requires confidence declaration:** Actor profiles always carry attribution_confidence; UNATTRIBUTED is valid and preferable to false attribution  
**AI actor profiles are constitutional-adjacent:** TA-AI-* profiles are shared with constitutional-governor-quorum for awareness of AI-targeting adversaries  
**TLP:AMBER:** All threat actor profiles are TLP:AMBER by default; distribution limited to security org and need-to-know recipients  
**Profile review:** Actor profiles reviewed quarterly; dormant actors (no activity > 1 year) moved to DORMANT but retained  
**Audit:** All actor profile updates and campaign changes to `memory/threat-intelligence/actor-registry-audit.jsonl`
