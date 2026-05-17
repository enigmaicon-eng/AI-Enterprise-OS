# Execution Pattern Memory
**ID:** AC-OL-003 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Preserves proven execution patterns — sequences of decisions, orchestration structures, agent compositions, and handoff protocols that have demonstrated consistent high-quality outcomes. Execution pattern memory makes "what works" retrievable rather than rediscovered on every project.

---

## Pattern Categories

```yaml
pattern_types:

  WORKFLOW_STRUCTURE:
    description: Proven sequencing and orchestration patterns for specific workflow types
    example: "For feature development workflows, front-loading research before architecture
              design reduces rework by 31% across 8 measured projects"
    storage: memory/patterns/ (existing) + adaptive-cognition/store/learning-events.jsonl

  AGENT_COMPOSITION:
    description: Agent team configurations that produce consistently strong outcomes
    example: "Architect + Senior PM + QA Lead composition for ADR-intensive workflows
              produces 0.84 avg quality vs. 0.71 for other compositions"
    storage: routing intelligence matrix (AC-HA-003)

  HANDOFF_PROTOCOL:
    description: Specific handoff preparation steps that improve downstream quality
    example: "Including explicit constraints list (not just outputs) in PM → Architecture
              handoffs reduces architecture revision cycles by 40%"
    storage: collaboration patterns (AC-CP-004)

  GATE_PREPARATION:
    description: Preparation steps that reliably result in governance gate passage
    example: "Security gate pass rate increases to 94% when security ADR is completed
              before implementation begins"
    storage: adaptive-cognition/store/learning-events.jsonl

  CONTEXT_LOADING:
    description: Which context sources produce the highest-quality agent execution
    example: "Loading the previous ADR + current sprint objectives increases
              architecture agent output quality by 0.12 on average"
    storage: identity-profiles.jsonl (agent execution preferences)

  ERROR_RECOVERY:
    description: Recovery patterns that reliably restore workflow progress after failures
    example: "FC-04 (specification ambiguity) resolves fastest with structured
              clarification session before re-attempting, not immediate retry"
    storage: memory/patterns/ + learning-events.jsonl
```

---

## Pattern Qualification Criteria

```
A pattern is qualified for storage when:
  1. Observed in ≥ 3 distinct executions (minimum evidence threshold)
  2. Outcome quality improvement ≥ 0.10 (effect size significant)
  3. Pattern is causally attributed (not confounded; see AC-OL-001 validation)
  4. Pattern is actionable (can be encoded in heuristic, workflow update, or guide)
  5. Pattern is generalizable (not specific to a single project or team)

Disqualification criteria:
  - Single project or single agent team source (not generalizable)
  - Quality improvement < 0.05 (marginal; not worth encoding)
  - Causal attribution failed (correlation not causation)
  - Pattern conflicts with governance constraints
```

---

## Pattern Retrieval

```
Execution patterns are retrieved at:
  1. WORKFLOW KICKOFF: orchestrator loads relevant patterns for the workflow type
  2. AGENT INITIALIZATION: agent receives applicable patterns for its domain
  3. HANDOFF PREPARATION: relevant handoff patterns loaded for recipient agent
  4. FAILURE RECOVERY: recovery patterns loaded when failure class detected

Retrieval mechanism:
  - Primary: semantic search over learning-events.jsonl by workflow_type, domain, context
  - Secondary: exact lookup by pattern_id if known
  - Relevance scoring: recency × confidence × domain_match
  - Max patterns loaded per context: 5 (avoid context flooding)
```

---

## Pattern Decay and Refresh

```
Patterns are not permanent facts — they can become stale as the system evolves:

DECAY SIGNALS:
  - Pattern effectiveness declining (outcomes not matching predicted improvement)
  - Pattern not being accessed (may be superseded by better patterns)
  - System changes that affect the pattern's context (new agents, new workflows)

DECAY MANAGEMENT:
  - Patterns reviewed quarterly (as part of strategy retrospective)
  - Patterns with < 0.50 current effectiveness score: flag for review
  - Patterns not accessed in 6 months: candidate for archival
  - Archived patterns preserved but not surfaced in retrieval (preserved history)

PATTERN REFRESH:
  - If conditions that made pattern valid have changed: create successor pattern
  - Successor pattern linked to predecessor via lineage pointer
  - Predecessor archived (not deleted)
```

---

## Integration with Knowledge Base

```
HIGH-VALUE PATTERNS → KNOWLEDGE BASE ENTRIES:
  Execution patterns with confidence > 0.85 AND enterprise scope:
    → Proposed as Knowledge Unit (KU) entries
    → Route: T3 Knowledge Management review
    → If approved: permanent entry in cognition/knowledge-base/
    → Cross-reference maintained between KU and source pattern records
```

---

## Governance

- Execution pattern memory is additive: patterns are archived, never deleted
- Pattern promotion to knowledge base requires T3 Knowledge Management approval
- Patterns that constrain future behavior must be explicitly labeled as constraints (not just suggestions)
