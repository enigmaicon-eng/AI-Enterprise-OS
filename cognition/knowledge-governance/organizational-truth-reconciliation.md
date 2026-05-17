---
layer: knowledge-governance
type: organizational-truth-reconciliation
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-agent
authority: knowledge-systems-architect-agent
---

# Organizational Truth Reconciliation

The process by which distributed, fragmented organizational knowledge is periodically reconciled into a single, consistent, authoritative view of organizational truth.

Truth reconciliation is to knowledge what database reconciliation is to data — it is the mechanism that prevents the OS from developing multiple incompatible worldviews as it scales.

---

## When Reconciliation Is Needed

| Trigger | Frequency | Scope |
|---|---|---|
| Session start | Every session | Consistency anchor verification |
| New artifact created | Within 24h | Cross-link analysis for new artifact |
| Agent count/structure changed | Immediate | Full registry reconciliation |
| Wiki page updated | Within 24h | Related pages cross-reference check |
| Sprint completion | End of sprint | Full warm-tier memory reconciliation |
| Quarterly review | Quarterly | Full organizational truth audit |
| Post-incident | Within 72h | Incident-affected domain reconciliation |

---

## The Reconciliation Protocol

### Phase 1: Discovery
Gather all artifacts making claims about the subject domain.

```
Query scope: {domain-specific reconciliation or full OS}

For full OS reconciliation:
  1. Read MEMORY_INDEX.md → all warm-tier entries
  2. Read wiki/index.md → all hot-tier pages
  3. Read agents/MASTER-REGISTRY.md → structural ground truth
  4. Read integrations/MASTER-INTEGRATION-REGISTRY.md → integration ground truth
  5. Read memory/decisions.md → settled decisions
  6. Read memory/open-questions.md → unresolved questions

For domain reconciliation:
  1. Filter MEMORY_INDEX.md by domain
  2. Filter wiki pages by domain section
  3. Load domain-specific memory entries
```

### Phase 2: Extraction
For each artifact, extract the factual claims it makes:

```
For each artifact A in scope:
  Extract claims(A): list of {subject, predicate, object} triples
  Tag each claim with: {source_path, source_tier, timestamp, producing_agent}
```

**Example claim triples:**
- `{Enterprise AI OS, has, 144 agents}`
- `{Q-001, status, Open}`
- `{SAP, integration-mode, read-only}`
- `{GAP-INT-005, severity, CRITICAL}`

### Phase 3: Conflict Detection
For each unique {subject, predicate} pair, check if multiple sources claim different objects:

```
For each (subject, predicate) pair:
  values = all distinct objects claimed by different sources
  
  if len(values) == 1:
    → CONSISTENT. No action needed.
    
  if len(values) > 1:
    → CONFLICT. Record: {subject, predicate, conflicting_values, sources}
    → Classify conflict by type (see contradiction-resolution-system.md)
    → Resolve by source-of-truth hierarchy
```

### Phase 4: Resolution
Apply the source-of-truth hierarchy to each conflict:

```
For each conflict:
  higher_authority_source = argmax(tier) across conflicting sources
  authoritative_value = value from higher_authority_source
  
  For each lower-authority source claiming a different value:
    Update lower-authority artifact to align with authoritative_value
    Record update in contradiction-log.md
    Emit: knowledge.contradiction.resolved event
```

### Phase 5: Validation
After all conflicts are resolved:

```
1. Re-extract claims from all updated artifacts
2. Check for new conflicts introduced by updates (update cycles)
3. Verify no EWC violation (no unique knowledge lost)
4. Update: consistency-anchor with reconciled facts
5. Update: MEMORY_INDEX.md if memory entries changed
6. Write: reconciliation report to wiki/governance/reconciliation-{date}.md
```

---

## The Reconciliation Report

After each reconciliation, a report is written:

```markdown
# Organizational Truth Reconciliation — {date}

## Summary
- Artifacts scanned: {N}
- Claim triples extracted: {N}
- Conflicts detected: {N}
- Conflicts resolved: {N}
- Conflicts escalated: {N}
- Knowledge entries updated: {N}
- EWC violations blocked: {N}

## Resolved Conflicts
| Conflict | Authoritative Value | Updated Sources |
|---|---|---|
| agent-count | 144 | memory/MEMORY_INDEX.md |
| ...

## Escalated Conflicts (Require Human or RFC)
| Conflict | Nature | Escalation Target |
|---|---|---|
| ...

## Knowledge Updated
| Artifact | Old Claim | New Claim | Authority Source |
|---|---|---|---|
| ...
```

---

## Automated Reconciliation via Scheduled Agent

The `knowledge-systems-agent` runs a scheduled reconciliation workflow:

| Schedule | Scope | Duration |
|---|---|---|
| Daily (session start) | Consistency anchor + open contradictions | ~5 min |
| Weekly | Full warm-tier memory | ~20 min |
| Monthly | Full OS including cold tier | ~60 min |
| Quarterly | Including historical decision trail | ~120 min |

The weekly and monthly runs are initiated as cron workflow instances. Their run-contexts are tracked in `memory/workflow-state/` like any other workflow.

---

## Reconciliation Boundaries

Not everything is reconciled — only organizational truth claims:

**In scope for reconciliation:**
- Factual claims about the OS state (agent counts, integration counts, maturity scores)
- Decision status (settled vs. open, superseded vs. current)
- Question status (resolved vs. open)
- Risk status (active vs. closed)
- Capability gap status (open vs. resolved)

**Out of scope for reconciliation:**
- Code content (reconciled by git, not knowledge governance)
- Business logic (reconciled by PRD + ADR process, not knowledge governance)
- Metrics data (sourced from integrations, not reconciled)
- In-flight workflow state (managed by run-context, not reconciled)

---

## Multi-Business-Unit Reconciliation

When the OS serves multiple business units with separate memory namespaces:

1. **Intra-unit reconciliation** runs first: reconcile within each namespace
2. **Cross-unit reconciliation** runs second: reconcile shared facts that cross namespace boundaries
3. **Federated truth** is the set of facts that all units agree on: system-level ground truth from T3+ sources
4. **Unit-specific truth** may legitimately differ across units — it is not a contradiction

The distinction between a legitimate namespace difference and a genuine contradiction is determined by whether the claim is about a shared entity (global fact → must reconcile) or a unit-specific entity (local fact → no reconciliation needed).
