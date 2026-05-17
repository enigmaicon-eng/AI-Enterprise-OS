# Ontology Tamper Detection
**ID:** MIG-OTD-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Detects unauthorized modifications, semantic drift, term injection, and definition corruption in the enterprise ontology — the shared vocabulary and conceptual framework that all 144 agents use to interpret, categorize, and reason about the world. Ontology tampering is a high-leverage attack: a small change to a foundational term definition silently corrupts every piece of reasoning, every knowledge unit, and every compliance check that references that term, without any agent being aware.

---

## Ontology Attack Taxonomy

```yaml
ontology_attack_taxonomy:

  TERM_DEFINITION_SUBSTITUTION:
    definition: replacing or modifying the definition of a core ontology term to shift
                its meaning in ways that benefit adversary objectives
    examples:
      - redefining "PRIVILEGED" access tier to exclude certain operation types from ZSP enforcement
      - changing the definition of "HUMAN_IN_THE_LOOP" to allow automated substitutes
      - modifying "CONSTITUTIONAL_VIOLATION" to narrow the scope of what triggers review
    impact: all reasoning referencing the redefined term is silently corrupted
    severity: CRITICAL
    
  TERM_INJECTION:
    definition: adding new terms to the ontology that introduce adversary-defined concepts
                as authoritative, or that create gaps in existing coverage
    examples:
      - injecting a new authority tier between T4 and T5 with lower oversight requirements
      - adding a new "EXEMPT" classification for data that bypasses privacy controls
      - creating a new agent type that falls outside existing trust and governance rules
    impact: new terms can create governance blind spots or adversary-accessible pathways
    severity: HIGH
    
  SEMANTIC_DRIFT_ACCUMULATION:
    definition: gradually shifting the semantic meaning of ontology terms through successive
                small modifications, each individually below detection threshold
    examples:
      - slowly broadening the definition of "READ_ONLY" access to include some write operations
      - incrementally narrowing the definition of "SENSITIVE" data to reduce privacy controls
      - gradual expansion of what constitutes "authorized" behavior
    impact: same as term substitution but harder to detect (micro-change accumulation)
    severity: CRITICAL
    
  TAXONOMY_CORRUPTION:
    definition: modifying the hierarchical or relational structure of the ontology to create
                unauthorized inheritance relationships or remove important distinctions
    examples:
      - making STANDARD tier inherit PRIVILEGED tier capabilities
      - removing the governance distinction between ELEVATED and PRIVILEGED
      - flattening the trust hierarchy to reduce meaningful tier differences
    impact: agents using taxonomic reasoning inherit corrupted inheritance chains
    severity: CRITICAL
    
  CROSS_REFERENCE_INJECTION:
    definition: injecting false cross-references in the ontology that cause legitimate terms
                to semantically imply or require adversary-beneficial interpretations
    examples:
      - adding false equivalence links between "audit_exempt" and "compliant"
      - creating synthetic "See Also" references that frame adversary concepts as related
    impact: reasoning following ontology relationships reaches adversary-intended conclusions
    severity: HIGH
```

---

## Ontology Integrity State

```
OntologyIntegrityBaseline:
  # Established at each authorized ontology update; signed by T3 IAM + T4 CISO

  term_registry:
    for each term T in ontology:
      term_id: T.id
      term_name: T.name
      definition_hash: sha256(T.definition)
      semantic_embedding: embed(T.definition)   # dense vector representation
      taxonomy_position: T.parent_terms + T.child_terms
      cross_references: T.see_also + T.related_terms
      authorized_at: ISO8601
      authorized_by: IDN-{NNN}
      
  corpus_hash: merkle_root(all term_definition_hashes)
  baseline_embedding_centroid: mean(all semantic_embeddings)
  signature: ed25519(corpus_hash + baseline_embedding_centroid)
  
  
verify_ontology_against_baseline(current_ontology, baseline):

  # Check 1: Corpus hash (detects any modification to any term)
  current_corpus_hash = merkle_root([sha256(T.definition) for T in current_ontology.terms])
  if current_corpus_hash != baseline.corpus_hash:
    identify_modified_terms(current_ontology, baseline)
    Return: TAMPERED, modified_terms=identified
    
  # Check 2: Term count (detects injection or deletion)
  if len(current_ontology.terms) != len(baseline.term_registry):
    delta = identify_added_or_deleted_terms(current_ontology, baseline)
    Return: TAMPERED, delta=delta
    
  # Check 3: Taxonomy structure (detects hierarchy manipulation)
  current_taxonomy_hash  = hash_taxonomy_structure(current_ontology)
  baseline_taxonomy_hash = hash_taxonomy_structure(baseline)
  if current_taxonomy_hash != baseline_taxonomy_hash:
    Return: TAMPERED, type=TAXONOMY_MODIFIED
    
  Return: CLEAN
```

---

## Detection Rules

```yaml
ontology_tamper_detection_rules:

  OTD-001:
    name: "Core Term Definition Modified"
    method: hash comparison against baseline for GOVERNANCE, SECURITY, AUTHORITY terms
    condition: |
      sha256(term.definition) != baseline.term_registry[term.id].definition_hash
      AND term.category IN [GOVERNANCE, SECURITY, AUTHORITY, PRIVACY, CONSTITUTIONAL]
    severity: CRITICAL
    auto_action: revert_term_to_baseline; alert_T3; T4_notification; flag_all_dependent_reasoning
    
  OTD-002:
    name: "New Ontology Term Without Authorization"
    condition: |
      new_term EXISTS IN current_ontology
      AND NOT EXISTS authorized_term_addition_record(term.id)
      WITH required_tier_approval
    severity: HIGH (CRITICAL if term category = GOVERNANCE/SECURITY/AUTHORITY)
    auto_action: quarantine_new_term; alert_T3; trace_term_origin
    
  OTD-003:
    name: "Taxonomy Hierarchy Corruption"
    condition: |
      term.parent_terms OR term.child_terms CHANGED from baseline
      WITHOUT authorized_taxonomy_modification_record
      # Any unauthorized change to parent/child relationships
    severity: CRITICAL
    auto_action: revert_taxonomy_to_baseline; alert_T3; T4_notification
    
  OTD-004:
    name: "Semantic Drift Accumulation"
    method: track semantic embedding distance of each term from its baseline embedding
    condition: |
      cosine_similarity(current_embedding(term), baseline_embedding(term)) < 0.90
      ACROSS >= 3 consecutive update cycles
      WITHOUT authorized_definition_update record
    severity: CRITICAL
    auto_action: freeze_term; alert_T3; cumulative_drift_audit
    
  OTD-005:
    name: "Constitutional Governance Term Tampered"
    condition: |
      term IN [CONSTITUTIONAL_VIOLATION, PRIVILEGED, SUPER_PRIVILEGED,
               HUMAN_IN_THE_LOOP, ABSOLUTE_VIOLATION, T5_BOARD, QUORUM]
      AND term.definition DIFFERS from baseline IN ANY WAY
    severity: CRITICAL (highest priority)
    auto_action: immediate_revert; alert_T3_T4_IMMEDIATELY; board_notification
    # These terms are load-bearing for constitutional enforcement; zero tolerance for modification
    
  OTD-006:
    name: "Cross-Reference Injection"
    condition: |
      term.cross_references CONTAINS links NOT IN baseline.cross_references
      AND new_link.target_term IN SENSITIVE_TERMS
      AND link_addition lacks authorized_review_record
    severity: HIGH
    auto_action: quarantine_cross_reference; alert_T2; T3_review_required
    
  OTD-007:
    name: "Authorized Update Semantic Consistency"
    method: even authorized updates must preserve minimum semantic consistency
    condition: |
      authorized_ontology_update WHERE:
        cosine_similarity(new_definition_embedding, old_definition_embedding) < 0.75
        (substantial semantic change, even if authorized)
    severity: MEDIUM
    auto_action: require_T4_explicit_confirmation; hold_update_pending_review
    # Authorized doesn't mean wise; large semantic changes get extra scrutiny
```

---

## Ontology Change Control

```yaml
ontology_change_control:

  NEW_TERM_ADDITION:
    required_approvals: [T3_ontology_reviewer, T4_if_GOVERNANCE_or_SECURITY_category]
    review_requirements:
      - semantic gap analysis (why existing terms don't cover this need)
      - dependency impact analysis (which systems will consume this term)
      - constitutional consistency review
      - deduplication check (ontology/deduplication-engine.md)
    activation: requires_T3_sign_off + hash_update + baseline_update
    
  TERM_DEFINITION_UPDATE:
    required_approvals: [T3 for STANDARD terms; T4 for GOVERNANCE/SECURITY; T5+board for CONSTITUTIONAL]
    review_requirements:
      - semantic delta quantification
      - impact analysis on dependent knowledge units and policies
      - review of all policies that reference the term
    restriction: semantic_similarity to old definition must be >= 0.90 for GOVERNANCE terms
    
  TERM_DELETION:
    required_approvals: [T3 + dependency_clean_check]
    restriction: cannot delete terms referenced by active policies or constitutional documents
    
  TAXONOMY_RESTRUCTURING:
    required_approvals: [T3 + T4]
    restriction: cannot reduce effective access restrictions via hierarchy changes
```

---

## Integration

```
Feeds into:
  memory-integrity-engine.md — ontology integrity findings
  adversarial-defense-engine.md — CLASS_3 (ontology corruption = memory corruption)
  knowledge-governance/knowledge-accuracy-monitor.md — term drift signals

Receives from:
  ontology/ (directory) — all file modification events
  ontology/deduplication-engine.md — deduplication events (coordinate on term changes)
  ontology/version-history.md — change history records
  knowledge-inference/inference-engine.md — term usage patterns (detect impact of changes)
```

---

## Governance

**OTD-005 terms are permanently immutable without T5+board:** The small set of constitutional governance terms (CONSTITUTIONAL_VIOLATION, PRIVILEGED, HUMAN_IN_THE_LOOP, etc.) requires T5+board quorum to modify; no change pathway exists below this level  
**Semantic drift is cumulative:** OTD-004 specifically defends against the slow-walk attack; even if each individual update is below the modification threshold, cumulative drift above 0.10 over any 90-day period requires T3 review  
**Dependent knowledge invalidation:** When a term is modified (even with authorization), all knowledge units, policies, and rules that reference the term are automatically flagged for consistency review before the change takes effect  
**Audit:** All ontology tamper detection events to `memory/memory-integrity/ontology-audit.jsonl`; 10-year retention; CRITICAL events permanent
