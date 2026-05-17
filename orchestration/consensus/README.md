# Consensus Frameworks

**Layer:** Multi-Agent Consensus and Disagreement Resolution  
**Version:** 1.0.0  
**Depends on:** coordination-runtime/, delegation-systems/

---

## Purpose

Consensus Frameworks resolve multi-agent disagreements into authoritative decisions. They implement structured debate, Byzantine fault-tolerant voting, quorum-based agreement, and confidence-scored synthesis — replacing ad-hoc "let's ask another agent" with principled resolution protocols.

---

## When Consensus is Required

Not every agent interaction needs formal consensus. Consensus is triggered by:

| Trigger | Example | Protocol |
|---------|---------|----------|
| Contested architectural direction | Microservices vs monolith | Multi-perspective debate |
| High-stakes irreversible decision | Production architecture change | BFT + quorum |
| Multiple valid interpretations | Ambiguous PRD requirement | 2-perspective debate + judge |
| Risk disagreement | Aggressive vs conservative timeline | 3-perspective risk analysis |
| Cross-org authority conflict | PM wants X, Architect blocks | Escalation to shared authority |
| Agent output quality dispute | QA rejects Engineering output | Gate-based resolution |

---

## Components

| File | Responsibility |
|------|----------------|
| `multi-perspective-debate.md` | Bull/Bear + Aggressive/Conservative/Neutral debate patterns |
| `byzantine-consensus.md` | pBFT three-phase protocol for fault-tolerant agreement |
| `quorum-manager.md` | Quorum strategies: Network / Performance / Fault-Tolerance / Hybrid |
| `disagreement-resolution.md` | Conflict taxonomy, resolution strategies, escalation paths |
| `confidence-scoring.md` | 5-tier signal normalization, agreement quantification |

---

## Consensus Protocol Selection

```
CONSENSUS PROTOCOL SELECTION
─────────────────────────────────────────────────────────
           Is decision reversible?
           /                   \
          NO                   YES
          ↓                     ↓
   BFT + Quorum           Multi-Perspective Debate
   (highest confidence     (lower overhead, judge
    requirement)            synthesizes result)
          ↓                     ↓
   f < n/3 faulty nodes   Max 2N rounds, then judge
   required for safety     produces verdict
```

---

## Output Format

Every consensus protocol produces a `ConsensusDecision`:

```typescript
interface ConsensusDecision {
  decision_id: string;
  protocol_used: "debate" | "bft" | "quorum" | "raft" | "escalation";
  signal: "strong_build" | "build" | "defer" | "reject" | "escalate";
  confidence: number;          // 0.0–1.0
  judge_agent: string;
  perspectives_heard: string[];
  dissenting_agents: string[];
  decision_summary: string;
  rationale: string;
  requires_human_approval: boolean;
  artifact_ref: string;        // points to decision log entry
  reversibility: "reversible" | "partially_reversible" | "irreversible";
}
```
