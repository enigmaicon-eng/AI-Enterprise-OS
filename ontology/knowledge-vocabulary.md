---
layer: ontology
type: knowledge-vocabulary
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
status: active
---

# Knowledge Vocabulary

Authoritative definitions for all knowledge, memory, and cognition terms used across the Enterprise AI OS. These terms govern how the system stores, retrieves, synthesizes, and preserves organizational intelligence.

---

## Knowledge Architecture Terms

### Knowledge Tier
One of three storage layers in the organizational memory architecture:
- **Hot Tier:** `wiki/` — actively maintained, human-readable, frequently accessed
- **Warm Tier:** `memory/` — curated, agent-accessible, session-loaded selectively
- **Cold Tier:** All other artifacts — historical record, full fidelity, not routinely loaded

### Knowledge Artifact
Any file in the OS that encodes organizational knowledge. Distinct from operational artifacts (PRDs, ADRs) in that knowledge artifacts have indefinite relevance horizon and are maintained across initiatives.

### Synthesis
The process of combining N source documents into a single, coherent, higher-level representation that preserves all unique knowledge from the sources. Synthesis is non-destructive — sources are not deleted. The synthesis pipeline: RETRIEVE → JUDGE → DISTILL → CONSOLIDATE. Adapted from ruflo's ReasoningBank.

### Distillation
The extraction of the minimum complete knowledge from a larger document. Distillation produces a smaller artifact that contains all unique, non-redundant information. Used in context compression and memory consolidation.

### Institutional Memory
Knowledge that remains valid and relevant independent of personnel, context, or technology changes. Institutional memory is the primary content of the Hot Tier wiki. It answers "why do we do things this way?"

### Organizational Intelligence
The aggregate of all knowledge available to the OS — across hot, warm, and cold tiers — that informs agent decision-making. Organizational intelligence is the sum of: institutional memory + active decisions + validated patterns + failure modes.

---

## Memory System Terms

### Memory Entry
A single curated fact, decision, pattern, or constraint stored in `memory/`. Each entry is: non-obvious (not derivable from code or current artifacts), persistent (valid across multiple sessions), actionable (changes agent behavior).

### Memory Namespace
A bounded memory partition belonging to a specific organizational unit or initiative. Cross-namespace reads require explicit permission grants. Namespaces prevent cognitive cross-contamination between unrelated workstreams.

### Memory Consolidation
The process of merging redundant memory entries, archiving stale entries, and re-indexing the memory system. Scheduled as a cron workflow. Adapted from ruflo's `consolidate` background worker.

### Working Memory (Scratchpad)
An agent's transient memory space within a single workflow step. Not persisted beyond the step. Contains: in-progress reasoning, intermediate results, candidate outputs before validation. Adapted from dexter's scratchpad pattern.

### Session Memory
State that lives for the duration of a single operating session. Distinct from memory entries (permanent) and working memory (per-step). Session memory captures: active workflow instances, loaded context packages, current dispatch queue.

### Memory Integrity
The property that all memory entries are accurate, non-contradictory, and current. Memory integrity is maintained through: regular consolidation, contradiction detection, staleness checks (entries > 90 days without validation are flagged).

### Memory Federation
The protocol for sharing memory across organizational unit boundaries. Federated reads are read-only — a consuming unit cannot write to another unit's memory namespace. Federation requires explicit grant from the source namespace owner.

---

## Knowledge Retrieval Terms

### Context Package
A curated set of knowledge artifacts assembled for a specific agent dispatch. Contains: mandatory context (always loaded), domain context (loaded for this domain), task context (specific to this step). Assembled by the context-routing-engine.

### Retrieval Protocol
The ordered procedure for assembling a context package:
1. Load mandatory governance context (constitution, principles)
2. Load domain-specific memory (filtered by routing key)
3. Load task-specific artifacts (specified by workflow step)
4. Apply compression if total exceeds context budget
5. Validate completeness against step preconditions

### Semantic Cluster
A group of knowledge artifacts with high conceptual relatedness. Clusters are maintained in the cognition index. Retrieving any artifact in a cluster surfaces related artifacts as recommendations. Cluster index stored in `cognition-indexes/`.

### Inverted Index
A map from concept/term → list of knowledge artifacts that discuss that concept. Used for keyword-based retrieval in the absence of vector search. Maintained in `cognition-indexes/master-cognition-index.md`.

### Recall Rate
The proportion of relevant documents retrieved for a given query. Keyword grep achieves ~40–60% recall. Vector search (when available via GAP-INT-002 resolution) targets ≥90% recall.

### Relevance Score
A 0–100 score assigned to a retrieved artifact for a given query. Factors: recency (×30%), domain match (×40%), usage frequency (×20%), explicit citations (×10%).

---

## Knowledge Lifecycle Terms

### Knowledge Creation
The event when a new knowledge artifact is written for the first time. Triggers: index update, contradiction check against existing entries, automatic cross-link analysis.

### Knowledge Validation
Explicit confirmation that a knowledge entry is still accurate. Required every 90 days for warm-tier entries, every 180 days for hot-tier wiki pages. Validation is logged with validator agent ID and date.

### Knowledge Deprecation
The process of marking a knowledge artifact as superseded. Deprecated artifacts are not deleted — they are moved to an archive state and cross-linked to the successor artifact. The superseded-by chain is preserved.

### Knowledge Expiry
The condition where a knowledge artifact has not been validated within its required interval and is automatically flagged as STALE. Stale entries generate a wiki-maintenance workflow task.

### EWC Check (Irreversibility Check)
Before deprecating any knowledge artifact, verify that all unique knowledge it contains is captured in at least one other non-deprecated artifact. If unique knowledge would be lost, the deprecation is blocked until the knowledge is transferred. Adapted from ruflo's EWC++ (Elastic Weight Consolidation) principle.

---

## Knowledge Synthesis Terms

### RETRIEVE
Step 1 of the synthesis pipeline. Gather all relevant source documents from the knowledge tier using the retrieval protocol. Output: source document set.

### JUDGE
Step 2 of the synthesis pipeline. Evaluate each retrieved document for: accuracy, currency, uniqueness, relevance. Assign verdict: ACCEPT / PARTIALLY_ACCEPT / REJECT. Rejected documents are not included in synthesis but their rejection is logged.

### DISTILL
Step 3 of the synthesis pipeline. Extract the minimum complete knowledge from accepted documents. Eliminate redundancy. Resolve contradictions (higher-authority source wins). Output: distilled knowledge set.

### CONSOLIDATE
Step 4 of the synthesis pipeline. Write the synthesized artifact. Update all cross-links. Update the cognition index. Verify EWC (irreversibility): no unique knowledge lost. Adapted from ruflo's ReasoningBank CONSOLIDATE step.

### Contradiction
Two knowledge artifacts that make mutually exclusive claims about the same subject. Contradictions are flagged by the contradiction-detection-agent and resolved via the contradiction resolution protocol in `knowledge-governance/contradiction-resolution-system.md`.

### Cross-Link
A bidirectional reference between two related knowledge artifacts. Cross-links are the primary navigation mechanism in the wiki and the primary edge type in the organizational knowledge graph.

---

## Organizational Cognition Terms

### Cognitive State
The complete knowledge available to the OS at a given moment: loaded context packages + active memory entries + current wiki state + in-flight workflow states. The cognitive state determines the quality of all agent decisions.

### Cognitive Continuity
The property that organizational intelligence is preserved across session boundaries without loss. Achieved through: checkpointing, warm-tier memory, hot-tier wiki, and cold-tier artifact store.

### Cognitive Drift
The gradual degradation of knowledge accuracy or consistency as the OS operates without maintenance. Drift is prevented by: regular wiki maintenance, memory consolidation, contradiction detection, knowledge validation cycles.

### Organizational Context
The subset of organizational intelligence relevant to a specific agent, workflow, or initiative. Assembled by the context-routing-engine, constrained by the context budget, filtered by the memory permission system.
