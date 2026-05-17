---
layer: wiki
section: knowledge
type: reference
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: knowledge-systems-architect-agent
last-reviewed: 2026-05-10
status: active
---

# Contradiction Detection

How the Enterprise AI OS detects, classifies, and routes contradictions in organizational knowledge.

**Key principle:** Contradictions are inevitable in a large distributed knowledge system. The goal is not to prevent them but to detect them quickly and resolve them with authority.

---

## When Contradictions Arise

Contradictions enter the knowledge system through five primary paths:

1. **Parallel agent work:** Two agents update different entries with incompatible claims simultaneously
2. **Knowledge staleness:** An entry was true at time T1 but reality changed; the entry was not updated
3. **Scope mismatch:** Two entries are both correct but apply to different conditions (the contradiction is apparent, not real)
4. **Synthesis error:** A synthesis produced a conclusion that contradicts a source it didn't consider
5. **External source conflict:** Two external research sources (e.g., ruflo vs. TradingAgents) recommend different patterns for the same problem

---

## Detection Methods

### Method 1: Post-Output Consistency Check (Real-Time)
After every major artifact is produced by an agent, the post-output check runs:
1. Extract all claims with organizational implications from the artifact
2. Query master-cognition-index.md for related entries
3. Compare claims against ACTIVE entries in the same concept space
4. Score contradictions: 0 = PASS, 1-2 = WARN, 3+ = FAIL

**Latency:** Runs in the same session, before the artifact is marked as accepted.

### Method 2: Index Scan (Weekly)
`knowledge-systems-engineer-agent` weekly maintenance:
1. Load all ACTIVE entries by domain
2. For each pair of entries sharing ≥3 concept tags, check for conflicting statements
3. Flag detected contradictions to knowledge-systems-architect-agent

### Method 3: Truth Reconciliation (Triggered)
When a new ADR supersedes an existing one, or a major initiative completes:
1. `organizational-learning-agent` triggers organizational-truth-reconciliation.md protocol
2. Protocol extracts {subject, predicate, object} triples from all affected entries
3. Compares all triples for contradictions within the affected domain

### Method 4: Agent Self-Report (Continuous)
When any agent encounters information that contradicts its context package during execution:
1. Agent must NOT silently ignore the contradiction
2. Agent MUST emit a contradiction report:
   ```yaml
   event: knowledge.contradiction.detected
   detected-by: "{agent-id}"
   claim-a: "{entry-path}" — "{claim}"
   claim-b: "{source}" — "{conflicting-claim}"
   severity: CRITICAL|HIGH|NORMAL
   ```
3. Contradiction is routed to knowledge-systems-architect-agent for resolution

---

## Contradiction Classification

Per `knowledge-governance/contradiction-resolution-system.md`:

| Type | Example | Resolution Approach |
|---|---|---|
| FACTUAL | Entry A says 144 agents, Entry B says 128 | Check source of truth (MASTER-REGISTRY.md) |
| PROCEDURAL | Two entries describe different approval processes | Authority analysis: which entry has higher tier? |
| TEMPORAL | Entry accurate in Q1 but outdated in Q2 | Stale entry superseded by current facts |
| ARCHITECTURAL | Two ADRs recommend incompatible patterns | Architecture council arbitration |
| AUTHORITY | Same entry claims different owners | MASTER-REGISTRY.md and artifact-authority-system.md |
| ONTOLOGICAL | Terms used with different meanings | Ontology disambiguation, add qualifier to term |

---

## Severity Classification

| Severity | Condition | SLA |
|---|---|---|
| CRITICAL | Contradicts a P0 binding constraint or constitutional rule | Resolve within same session |
| HIGH | Contradicts a CRITICAL or HIGH memory entry | Resolve within 24 hours |
| NORMAL | Contradicts a NORMAL entry or is apparent (scope mismatch) | Resolve within 7 days |

---

## What Agents Must Do When They Detect a Contradiction

**DO:**
- Report immediately using the `knowledge.contradiction.detected` event
- Include both sources: the entry in memory and the conflicting claim
- Continue work using the higher-authority source (per 7-tier hierarchy)
- Note the contradiction in the artifact they're producing

**DON'T:**
- Silently choose one source and ignore the other
- Attempt to resolve CRITICAL or HIGH contradictions independently (requires T3+ authority)
- Block the workflow waiting for resolution (use the higher-authority source, continue)
- Propagate the contradictory claim into new artifacts

---

## Contradiction Log Format

Contradictions are logged to `memory/contradiction-log.md`:

```yaml
CONT-{NNN}:
  detected-at: "{ISO-8601}"
  detected-by: "{agent-id}"
  type: FACTUAL|PROCEDURAL|TEMPORAL|ARCHITECTURAL|AUTHORITY|ONTOLOGICAL
  severity: CRITICAL|HIGH|NORMAL
  claim-a:
    source: "{file-path}"
    claim: "{statement}"
    tier: T{N}
  claim-b:
    source: "{file-path or description}"
    claim: "{conflicting statement}"
    tier: T{N}
  resolution-status: OPEN|IN_PROGRESS|RESOLVED
  resolution-approach: "{if resolved}"
  resolved-at: "{if resolved}"
  resolved-by: "{if resolved}"
```

---

## Known Structural Contradiction Prevention

These structures prevent common contradiction types:

| Prevention Mechanism | Prevents |
|---|---|
| Consistency anchor (loaded every session) | Factual drift on key organizational facts |
| Raft leader per domain | Multiple agents making incompatible domain updates |
| Post-output check | New artifacts contradicting existing memory |
| Weekly index scan | Long-lived contradictions that escaped real-time detection |
| EWC before archival | Valuable knowledge being "contradicted out" by archiving the wrong entry |

---

## Related Pages

- `knowledge-governance/contradiction-resolution-system.md` — Full resolution protocol
- `knowledge-governance/organizational-truth-reconciliation.md` — Truth reconciliation
- `knowledge-governance/cross-agent-consistency-protocol.md` — Anti-drift controls
- `wiki/knowledge/synthesis-workflow.md` — Stage 2 JUDGE (detects contradictions in synthesis)
