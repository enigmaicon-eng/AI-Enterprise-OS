---
layer: knowledge-governance
type: contradiction-resolution-system
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-agent
authority: knowledge-systems-architect-agent
---

# Contradiction Resolution System

The formal protocol for detecting, classifying, and resolving contradictory knowledge in the Enterprise AI OS. A contradiction is any state where two knowledge artifacts make mutually exclusive claims about the same subject.

---

## Why Contradictions Occur

1. **Session boundary drift** — an artifact updated in session N+1 conflicts with one from session N
2. **Parallel agent divergence** — two agents working concurrently reach different conclusions
3. **Tier propagation lag** — a higher-tier document was updated but lower-tier references weren't
4. **External system conflict** — external data contradicts internal organizational knowledge
5. **Evolution without supersession** — a fact changed but the original was not marked superseded

---

## Contradiction Types

| Type | Description | Example |
|---|---|---|
| FACTUAL | Two documents claim different values for the same fact | Agent count: 128 vs. 144 |
| PROCEDURAL | Two documents describe different steps for the same process | ADR says gate G2 mandatory; workflow file skips it |
| TEMPORAL | A historical claim conflicts with a current claim (stale data) | Memory says Q-001 is Open; it was resolved |
| ARCHITECTURAL | Two design decisions are mutually exclusive | Two ADRs choose different database technologies |
| AUTHORITY | Two documents claim authority over the same domain | Two agents both claim to own the integration registry |
| ONTOLOGICAL | A term is used with different meanings in two documents | "Workflow" used as both specification and instance |

---

## Detection Methods

### Method 1: Active Detection (Real-Time)
The `hallucination-detection-agent` runs a consistency check when:
- A new artifact is written (cross-reference against active memory and T3+ sources)
- An agent output directly cites a fact that can be verified against a T3+ source
- A wiki page is updated (check incoming cross-links for consistency)

### Method 2: Synthesis Detection
During any synthesis workflow (RETRIEVE → JUDGE → DISTILL → CONSOLIDATE), the JUDGE step explicitly identifies conflicts among retrieved documents.

### Method 3: Scheduled Scan
A weekly cron workflow scans all warm-tier memory entries and wiki pages for:
- Claims about agent counts, workflow counts, integration counts (verifiable facts)
- Claims referencing open questions that may now be resolved
- Claims about "current state" that reference timestamps >90 days old

### Method 4: Agent Self-Report
Any agent that encounters a contradiction during its task must:
1. Resolve it using the hierarchy (higher tier wins)
2. Log the contradiction to the contradiction log
3. Include the contradiction and resolution in its output artifact

---

## Contradiction Classification and Severity

| Severity | Criteria | SLA | Escalation |
|---|---|---|---|
| CRITICAL | Contradicts constitution or active ADR | 4 hours | enterprise-architecture-council |
| HIGH | Contradicts master registry or quality gates | 24 hours | knowledge-systems-architect-agent |
| MEDIUM | Contradicts wiki page or memory entry | 48 hours | knowledge-systems-agent |
| LOW | Minor inconsistency in secondary documentation | 7 days | domain-custodian |

---

## Resolution Protocol

```
STEP 1: DETECT
  Agent or system detects a contradiction.
  Evidence captured: [artifact_A, artifact_B, conflicting_claim, detection_method]

STEP 2: LOG
  Create entry in knowledge-governance/contradiction-log.md:
    - contradiction_id: CONT-NNN
    - detected_by: {agent-id}
    - detected_at: {timestamp}
    - artifact_a: {path + claim}
    - artifact_b: {path + claim}
    - contradiction_type: {FACTUAL|PROCEDURAL|TEMPORAL|ARCHITECTURAL|AUTHORITY|ONTOLOGICAL}
    - severity: {CRITICAL|HIGH|MEDIUM|LOW}
    - status: OPEN

STEP 3: CLASSIFY
  knowledge-systems-agent determines:
  - What tier is each artifact? (From source-of-truth-hierarchy.md)
  - Which has higher authority?
  - Is this a genuine contradiction or a version mismatch?
  - Does resolving it require an RFC/ADR?

STEP 4: RESOLVE
  Based on classification:

  Case A — Clear authority difference:
    Higher-tier artifact is authoritative.
    Lower-tier artifact is updated to align.
    No further process required.

  Case B — Same-tier artifacts conflict:
    domain-custodian arbitrates (or knowledge-systems-architect-agent if cross-domain).
    The arbiter's decision is documented as a micro-decision in memory/decisions.md.
    Both artifacts updated to reference the micro-decision.

  Case C — Higher-tier artifact is itself wrong:
    Evidence must be gathered that the higher-tier artifact needs correction.
    RFC opened to update higher-tier artifact.
    Lower-tier artifact is frozen until RFC resolves.
    RFC result: new ADR or wiki update supersedes the incorrect artifact.

  Case D — Ontological contradiction (term redefinition needed):
    ontology/core-concepts.md or relevant vocabulary file updated via ADR.
    All documents using the old definition flagged for update.
    knowledge-systems-engineer-agent executes the update sweep.

STEP 5: VERIFY
  knowledge-systems-agent confirms:
  - Both artifacts now consistent
  - No downstream artifacts reference the incorrect version
  - Knowledge graph edges updated if needed
  - Contradiction log entry updated: status → RESOLVED, resolved_at, resolution_summary

STEP 6: PREVENT RECURRENCE
  organizational-learning-agent logs the contradiction as a failure mode in memory/failures/.
  Pattern analysis: if 3+ contradictions of the same type occur, trigger a systemic prevention RFC.
```

---

## CRDT-Inspired Merge for Concurrent Updates

When two agents update the same artifact concurrently (both legitimate, neither wrong), a merge protocol applies:

1. **Set union for lists:** Capability lists, routing keys, agent lists — take all elements from both versions
2. **Max for monotonic values:** Sequence numbers, version numbers — take the higher value
3. **Timestamp for scalar facts:** The more recent update wins for single-value facts
4. **Arbiter for incompatible changes:** If a scalar fact changed to two different values simultaneously, the domain Raft leader arbitrates

This CRDT-inspired approach ensures concurrent updates are always mergeable without manual intervention for common cases.

---

## Contradiction Log Format

Maintained at: `knowledge-governance/contradiction-log.md`

```markdown
| ID | Detected | Artifact A | Artifact B | Type | Severity | Status | Resolved |
|----|---------|-----------|-----------|------|----------|--------|---------|
| CONT-001 | 2026-05-10 | memory/MEMORY_INDEX.md (128 agents) | agents/MASTER-REGISTRY.md (144 agents) | FACTUAL | HIGH | RESOLVED | 2026-05-10 |
```

---

## Systemic Contradiction Prevention

If the same type of contradiction occurs ≥3 times, a systemic fix is required:

| Pattern | Root Cause | Prevention |
|---|---|---|
| Agent count mismatch | MEMORY_INDEX not updated when agents added | Require MEMORY_INDEX update as step in agent addition workflow |
| Version mismatch between files | No automated version propagation | Create version propagation protocol in registry update workflow |
| Stale memory entries | No validation schedule | Cron-based validation workflow (weekly) |
| Term definition drift | No ontology enforcement | Add ontology check to agent dispatch context assembly |
