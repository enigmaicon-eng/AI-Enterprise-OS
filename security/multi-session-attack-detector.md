# Multi-Session Attack Detector
**ID:** SEC-ATK-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Detects coordinated adversarial attacks that span multiple conversation sessions. Single-session injection detection (semantic-gateway/prompt-injection-detector.md) misses attackers who plant seeds in early sessions to exploit in later sessions. This system tracks cross-session behavioral patterns to identify persistent adversarial campaigns.

---

## Multi-Session Attack Taxonomy

| Attack Class | Pattern | Detection Signal |
|-------------|---------|-----------------|
| MEMORY_POISONING | Attacker introduces false "facts" across N sessions that are recalled later | Memory content diverging from ground truth |
| TRUST_ESCALATION | Attacker builds relationship across sessions to gain elevated authority | Unusual trust progression velocity |
| CONTEXT_ACCUMULATION | Attacker gradually builds context to bypass guards that would block single-session request | Unusual context accumulation pattern |
| INSTRUCTION_ANCHORING | Attacker embeds persistent instructions that activate in future sessions | Behavioral instruction patterns in wiki/knowledge |
| IDENTITY_DRIFT | Attacker gradually shifts agent's self-model across sessions | Agent vocabulary or role description drift |
| COALITION_ATTACK | Multiple coordinated external inputs across sessions | Cross-session correlation of unusual inputs |

---

## Session Behavioral Fingerprinting

Every session interaction is fingerprinted for persistent pattern analysis:

```yaml
session_fingerprint:
  session_id: string
  agent_id: string
  initiating_source: USER | CONNECTOR | SCHEDULED | AGENT
  
  behavioral_signals:
    new_assertions_introduced: [string]   # new "facts" or claims added to context
    authority_claims_made: [string]       # claims about permissions or identity
    instruction_patterns: [string]        # directive language patterns detected
    knowledge_modification_attempts: number  # attempts to write to wiki/memory
    unusual_reference_patterns: [string]  # references to out-of-scope systems
    
  cross_session_refs:
    references_prior_session_context: boolean
    builds_on_previous_assertions: boolean
    
  risk_score: 0.00–1.00
  flagged_patterns: [string]
```

---

## Cross-Session Correlation Engine

The detector maintains a rolling 30-day behavioral model per external source:

```
For each {source_id, agent_id} pair:
  1. Collect session fingerprints over 30 days
  2. Apply behavioral sequence analysis:
     - Unusual escalation patterns (early sessions → later sessions)
     - Assertion consistency: do later sessions reference earlier unusual assertions?
     - Authority trajectory: is claimed authority increasing session-over-session?
  3. Score the sequence: session_pattern_risk = f(escalation_slope, assertion_density, authority_drift)
  4. If session_pattern_risk > 0.70: flag for investigation
  5. If session_pattern_risk > 0.85: auto-quarantine new sessions from this source
```

---

## Memory Consistency Verification

The most dangerous multi-session attack is memory poisoning. The detector performs:

**Spot checks (daily):**
- Sample 5% of recently modified wiki/knowledge entries
- Cross-verify against authoritative sources (ADRs, governance docs, source artifacts)
- Flag entries with no authoritative backing

**Divergence detection:**
- Compare agent behavioral descriptions to their original definitions
- Detect vocabulary drift (new terms appearing in agent outputs that weren't present at initialization)
- Alert if any constitutional principle interpretation drifts from the constitution/ definition

---

## Response Protocol

| Risk Level | Response |
|-----------|---------|
| < 0.40 | Monitor; log fingerprint |
| 0.40–0.69 | Soft flag; increase session monitoring; T3 weekly review |
| 0.70–0.84 | T3 alert; new sessions from source require human review |
| 0.85–0.94 | Auto-quarantine source; T4 immediate; investigation opened |
| ≥ 0.95 | Emergency: suspend agent; T5 notification; full audit required |

---

## Integration with Semantic Firewall

The multi-session detector feeds its risk scores to `semantic-gateway/semantic-firewall.md`. The firewall increases inspection intensity for sources with cross-session risk score > 0.50. This creates a two-layer defense: per-session detection + cross-session behavioral analysis.

---

## Governance

**False positive protocol:** Quarantined sources can appeal via T3 review. Automated quarantine lasts max 24 hours before human review required.
**Audit:** All cross-session risk scores to `memory/security/multi-session-risk-log.jsonl` (append-only)
**Privacy:** Source behavioral profiles retained 30 days; purged after that unless active investigation
