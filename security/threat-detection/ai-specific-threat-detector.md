# AI-Specific Threat Detector
**ID:** TDT-AIT-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Detects threats specifically targeting AI systems — prompt injection, jailbreak attempts, model extraction, adversarial inputs, constitutional boundary manipulation, and multi-turn psychological manipulation campaigns — that traditional network- and host-based detection cannot recognize. The AI-Specific Threat Detector is the specialist layer for AI system security: it understands the semantic content of agent interactions, not just their metadata, and is the primary source of constitutional-proximity signals for the SOC.

---

## AI Threat Taxonomy

```yaml
ai_threat_taxonomy:

  PROMPT_INJECTION:
    subtypes:
      DIRECT: malicious instructions in user prompt
      INDIRECT: malicious instructions injected via retrieved content (RAG, tool output, web fetch)
      STORED: malicious instructions pre-planted in knowledge base or memory
      MULTI_MODAL: injection via image, audio, or structured data fields
    mitre: AML.T0054
    severity: CRITICAL
    
  JAILBREAK:
    subtypes:
      ROLE_PLAY_BYPASS: "pretend you are DAN / a character without rules"
      HYPOTHETICAL_FRAMING: "hypothetically, if you could..."
      MANY_SHOT: large volume of examples priming prohibited behavior
      OBFUSCATION: leetspeak, encoding, unicode homoglyphs, token smuggling
      CONTEXT_EXHAUSTION: filling context window to push system prompt out
    mitre: AML.T0054
    severity: CRITICAL
    
  MULTI_TURN_MANIPULATION:
    subtypes:
      PROGRESSIVE_ESCALATION: incrementally shifting requests toward prohibited domain
      TRUST_BUILDING: establishing rapport then exploiting it
      ANCHOR_AND_REFRAME: anchor benign context, reframe to malicious variant
      SALAMI_SLICING: each turn requests small increment; cumulative = prohibition
    mitre: AML.T0054
    severity: CRITICAL
    
  MODEL_EXTRACTION:
    subtypes:
      SYSTEMATIC_PROBING: structured query generation to reconstruct model behavior
      DISTILLATION_ATTACK: using model outputs as training data for surrogate model
      MEMBERSHIP_INFERENCE: probing to determine if specific data was in training set
      INVERSION_ATTACK: reconstructing training data from model outputs
    mitre: AML.T0037
    severity: HIGH
    
  ADVERSARIAL_INPUT:
    subtypes:
      GRADIENT_BASED: adversarial perturbations crafted via gradient information
      TRANSFER_ATTACK: adversarial examples transferred from surrogate model
      EVASION: inputs crafted to bypass classification/filtering
      POISONING_DELIVERY: delivering poisoned data through legitimate channels
    mitre: AML.T0017 | AML.T0020
    severity: HIGH
    
  TRAINING_DATA_MANIPULATION:
    subtypes:
      DATA_POISONING: corrupting training data to induce model misbehavior
      BACKDOOR_INSERTION: embedding triggers that activate specific behaviors
      LABEL_FLIPPING: corrupting ground truth labels in supervised training
    mitre: AML.T0020
    severity: CRITICAL
    
  MODEL_INTEGRITY_VIOLATION:
    subtypes:
      WEIGHT_TAMPERING: direct modification of model weights
      ADAPTER_BACKDOOR: malicious LoRA adapter or fine-tuning
      INFERENCE_HIJACKING: intercepting and modifying inference pipeline
    mitre: AML.T0018
    severity: CRITICAL
```

---

## Detection Modules

```yaml
detection_modules:

  MOD-AIT-001:
    name: "Prompt Injection Scanner"
    coverage: DIRECT | INDIRECT | STORED injection
    method: |
      1. Pattern matching: 500+ injection signature library (curated + ML-generated)
         signatures cover: instruction overrides, role definitions, ignore/forget directives,
         system prompt exfiltration, delimiter confusion, context manipulation
      2. Semantic classifier: fine-tuned BERT variant; classifies input/output pairs
         as BENIGN | INJECTION_ATTEMPT | INJECTION_SUCCESSFUL
         confidence threshold: 0.70 for alert; 0.90 for auto-terminate
      3. Indirect injection: scanner applied to ALL tool outputs, retrieved documents,
         web content, and API responses before delivery to agent context
    output:
      injection_detected: boolean
      injection_type: [DIRECT | INDIRECT | STORED | MULTI_MODAL]
      confidence: float
      payload_excerpt: string (sanitized; max 200 chars)
    latency_target: < 50ms per input (real-time blocking mode)
    
  MOD-AIT-002:
    name: "Jailbreak Pattern Classifier"
    coverage: ROLE_PLAY_BYPASS | HYPOTHETICAL_FRAMING | MANY_SHOT | OBFUSCATION | CONTEXT_EXHAUSTION
    method: |
      1. Lexical patterns: regex library for common jailbreak templates
      2. Semantic classifier: trained on 50,000+ labeled jailbreak attempts
         (JTBA dataset + internal incident history); updated quarterly
      3. Encoding detector: detects base64, rot13, unicode substitution,
         leetspeak, token splitting in malicious context
      4. Context window pressure: monitors context utilization; >85% utilization
         with adversarial signals triggers CONTEXT_EXHAUSTION alert
    output:
      jailbreak_detected: boolean
      jailbreak_subtype: string
      confidence: float
      novel_variant: boolean    # true if no matching prior signature → enriches training set
    latency_target: < 80ms
    
  MOD-AIT-003:
    name: "Constitutional Proximity Monitor"
    coverage: MULTI_TURN_MANIPULATION | PROGRESSIVE_ESCALATION
    method: |
      1. Per-turn constitutional proximity scoring:
         proximity_score = constitutional_governor_quorum.compute_proximity(turn_context)
         Range: 0.00 (safely within bounds) to 1.00 (at constitutional boundary)
      2. Trend analysis (Mann-Kendall + CUSUM):
         - detects monotonically increasing proximity across consecutive turns
         - detects rate of approach (velocity toward boundary)
      3. Manipulation pattern matching:
         - trust-building turn sequences (complimentary → request escalation)
         - anchor-and-reframe structures (benign → malicious variant)
         - salami slicing (small increment accumulation detection)
    output:
      current_proximity_score: float
      trend_direction: INCREASING | STABLE | DECREASING
      manipulation_pattern_detected: string | null
      estimated_turns_to_threshold: integer | null
      alert_level: WATCH | WARNING | CRITICAL
    alert_thresholds:
      WATCH: proximity > 0.40 OR trend INCREASING
      WARNING: proximity > 0.60 OR monotonic increase across >= 3 turns
      CRITICAL: proximity > 0.85 OR turns_to_threshold < 3
    constitutional_quorum_notify: mandatory at CRITICAL; cannot be suppressed
    
  MOD-AIT-004:
    name: "Model Extraction Detector"
    coverage: SYSTEMATIC_PROBING | DISTILLATION_ATTACK
    method: |
      1. Query volume: sliding window count; alert if > 10,000 queries/hour
         from single caller or correlated caller cluster
      2. Query diversity score:
         diversity_score = unique_semantic_clusters / total_queries
         low diversity (< 0.30) = systematic probing; high diversity = normal usage
      3. Coverage analysis: track which input-space regions have been queried
         full lattice coverage = extraction attempt
      4. Output monitoring: flag if model outputs are being systematically stored
         or transferred (correlation with DATA_ACCESSED + CROSS_BORDER_TRANSFER events)
    alert_conditions:
      - query_count > 10,000 WITHIN 1_HOUR
      - diversity_score < 0.30 with query_count > 1,000
      - systematic_coverage_detected: true
    
  MOD-AIT-005:
    name: "Adversarial Input Detector"
    coverage: GRADIENT_BASED | TRANSFER_ATTACK | EVASION
    method: |
      1. Perturbation detector: statistical test for unusual feature distributions
         in structured inputs (embeddings, images passed to vision models)
      2. Input consistency check: semantic consistency between input and stated intent
         high semantic distance = adversarial framing
      3. Transfer pattern detection: inputs matching known adversarial perturbation
         signatures from academic literature and shared threat intelligence
    latency_target: < 100ms
    
  MOD-AIT-006:
    name: "Model Integrity Monitor"
    coverage: WEIGHT_TAMPERING | ADAPTER_BACKDOOR | INFERENCE_HIJACKING
    method: |
      1. Hash verification: model file hash vs model_registry.known_good_hash()
         checked at: load time, every 6 hours during inference, on any file event
      2. Behavioral fingerprinting:
         fingerprint = deterministic forward pass on 100 fixed probe inputs
         behavioral_fingerprint_delta = L2 distance from known-good fingerprint
         alert if delta > 0.15
      3. Inference pipeline integrity:
         monitor for unexpected intermediary processes in inference chain
         TLS certificate pinning for all inference API calls
    auto_action:
      - hash_mismatch: BLOCK model load; alert T2 immediately
      - behavioral_delta > 0.15: suspend model; alert T3; trigger incident
      - inference_hijack: terminate inference process; alert T4
```

---

## AI Threat Alert Schema

```yaml
ai_threat_alert:
  alert_id: AIT-{NNN}
  created_at: ISO8601
  
  threat_type: string                    # from ai_threat_taxonomy
  threat_subtype: string
  severity: CRITICAL | HIGH | MEDIUM | LOW
  
  target:
    agent_id: string
    session_id: string | null
    model_id: string | null
    
  detection:
    module_id: string                    # MOD-AIT-{NNN}
    confidence: float
    evidence:
      payload_hash: sha256               # hash of the adversarial content
      payload_excerpt: string | null     # sanitized excerpt; null if classified
      detection_method: string
      
  constitutional:
    constitutional_adjacent: boolean
    proximity_score: float | null
    quorum_notification_required: boolean
    quorum_notified_at: ISO8601 | null
    
  auto_actions_taken: [string]
  
  routing:
    playbook: PB-SOC-{NNN} | null
    assigned_tier: T1 | T2 | T3
    
  integrity:
    entry_hash: sha256
```

---

## Coordinated AI Attack Detection

```yaml
coordinated_attack_detection:
  
  multi_session_correlation:
    window: 60 minutes
    condition: |
      same threat_type detected across >= 3 distinct sessions
      OR same injection_payload_hash across >= 2 sessions
      OR constitutional_proximity CRITICAL across >= 2 agents simultaneously
    action: create COORDINATED_AI_ATTACK alert → COR-010 in security-event-correlator
    severity: CRITICAL
    
  campaign_pattern_recognition:
    method: payload embedding clustering (DBSCAN; ε=0.15)
    condition: cluster of >= 5 injection attempts with cosine similarity >= 0.80
    action: create campaign record in threat-intelligence-platform; enrich all related alerts
    
  novel_technique_detection:
    trigger: MOD-AIT-002.novel_variant == true for >= 3 distinct attempts
    action: create NOVEL_JAILBREAK_TECHNIQUE hypothesis → detection-engineering; T3 immediate brief
```

---

## Integration

```
Feeds into:
  security-event-correlator.md — AI threat events feed COR-004/005 correlation rules
  security-alert-manager.md — AIT alerts enter alert queue (minimum T2 routing)
  detection-engineering.md — novel technique detections create new rule hypotheses
  threat-intelligence-fusion.md — injection payloads and attack patterns shared as IOCs
  constitutional-governor-quorum.md — constitutional proximity CRITICAL → immediate quorum alert

Receives from:
  all-agent-interfaces — all input/output streams monitored by MOD-AIT-001/002/003
  model-registry — model hash registry for MOD-AIT-006
  constitutional-governor-quorum.md — proximity scores consumed by MOD-AIT-003
  threat-intelligence-platform.md — known injection signatures and adversarial patterns
```

---

## Governance

**Constitutional proximity alerting is non-bypassable:** MOD-AIT-003 CRITICAL alerts and constitutional quorum notifications cannot be suppressed by any suppression list, maintenance window, or analyst override  
**Payload confidentiality:** Adversarial payload content stored as hash only in audit records; full payload in restricted evidence store accessible to T3+ with legal review for regulatory disclosure  
**Novel technique escalation:** Every confirmed novel AI attack technique triggers automatic threat intelligence bulletin within 24 hours  
**Scanner coverage:** MOD-AIT-001 indirect injection scanning covers ALL external content entering agent context — no exception for trusted sources  
**Audit:** All AI threat detections to `memory/threat-detection/ai-threat-audit.jsonl`; permanent retention for constitutional-adjacent events; 7-year for others
