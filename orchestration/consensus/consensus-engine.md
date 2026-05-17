---
layer: consensus-frameworks
type: consensus-engine
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: enterprise-architecture-council
---

# Consensus Engine

The core multi-agent consensus protocol for the Enterprise AI OS. Manages how multiple agents reach binding agreement on contested decisions.

**Adapted from:**
- **TradingAgents:** Multi-agent debate framework — structured bull/bear analyst debate with explicit position-taking and evidence requirements before a portfolio manager decides
- **ruflo:** Raft consensus protocol adapted for domain truth arbitration — Raft leader as final authority within a knowledge domain

---

## Consensus Protocol Types

The consensus engine supports four protocol types, selected based on decision tier and time constraints:

| Protocol | When Used | How it Works | Time Limit |
|---|---|---|---|
| RAFT_LEADER | Domain facts, T2-T3 | Raft leader has final say; others may object | 5 min |
| WEIGHTED_VOTE | T3 strategic decisions | All eligible agents vote; weights by tier | 15 min |
| ARBITER | T2 contested artifacts | Panel produces positions; arbiter decides | 30 min |
| QUALIFIED_MAJORITY | T4 constitutional decisions | 2/3 of T4 agents must agree | 60 min |

---

## RAFT_LEADER Protocol

**Use case:** A domain fact is contested (two agents hold different values). The Raft leader for that domain has final authority.

```
Protocol flow:
1. Contradiction detected in domain {D}
2. Identify Raft leader for domain {D} (from cross-agent-consistency-protocol.md)
3. Raft leader reads both positions and all supporting evidence
4. Raft leader emits a RESOLUTION claim:
   - accepted-position: "{one of the two positions}"
   - rejected-position: "{the other}"
   - resolution-reason: "{why}"
5. Rejected agent updates its context to match Raft leader
6. Resolution logged in contradiction-log.md (CONT-NNN)
7. Consistency anchor updated if the resolved fact is anchor-level

Time limit: 5 minutes. If Raft leader cannot resolve: escalate to WEIGHTED_VOTE.
```

**Example:** master-orchestrator-agent (Raft leader for Organizational State) resolves: "there are 144 agents" vs. "there are 128 agents" by reading MASTER-REGISTRY.md and confirming 144.

---

## WEIGHTED_VOTE Protocol

**Use case:** Strategic or architectural decisions where multiple T3 agents have relevant expertise.

```
Protocol flow:
1. Coordinator packages the decision question with all relevant context
2. Each eligible voter receives: question + evidence set + their context package
3. Voters have TIME_LIMIT/2 to submit a Vote:
   vote:
     voter: "{agent-id}"
     tier: T{N}
     position: "{position}"
     confidence: 0-100
     reasoning: "{evidence-based argument, max 500 tokens}"
4. Votes collected and weighted:
   vote_weight = tier_weight × confidence_weight
   tier_weights = {T2: 1.0, T3: 2.0, T4: 4.0, T5: 8.0}
   confidence_weight = confidence / 100
5. Winning position: highest weighted vote total
6. If top two positions within 10% of each other: DEADLOCK → escalate to ARBITER
7. Winning position becomes binding decision
8. All votes + reasoning logged in decision record

Time limit: 15 minutes. Missing votes do not block (treat as abstain).
```

**Vote weight example:**
- T3 agent (weight 2.0) votes FOR with confidence 90 → weighted vote: 1.8
- T2 agent (weight 1.0) votes AGAINST with confidence 60 → weighted vote: 0.6
- Another T2 agent (weight 1.0) votes FOR with confidence 70 → weighted vote: 0.7
- FOR total: 2.5, AGAINST total: 0.6 → FOR wins

---

## ARBITER Protocol

**Use case:** Multiple T2 agents produce competing artifacts (tournament) or contested analysis. An arbiter reviews all positions.

```
Protocol flow:
1. Coordinator dispatches N agents to produce independent positions on the same question
   - Agents do NOT see each other's outputs while producing their own
   - This preserves independence (from TradingAgents: analyst independence)
2. All positions collected by coordinator
3. Arbiter (designated T3+ agent) receives all N positions as context
4. Arbiter evaluates using structured rubric:
   arbiter-evaluation:
     position-{N}:
       internal-consistency: 0-10
       evidence-quality: 0-10
       risk-awareness: 0-10
       completeness: 0-10
       total-score: {sum}
5. Arbiter selects winning position OR produces synthesized position combining best elements
6. Arbiter's decision is binding at T2 level
7. All positions + arbiter reasoning logged in decision record

Time limit: 30 minutes total (N×10 minutes for positions + 10 for arbiter review).
```

**Example from TradingAgents adaptation:**
Three architecture proposals (proposal A: microservices, B: modular monolith, C: serverless). chief-architect-agent as arbiter reviews all three and selects or synthesizes the best approach.

---

## QUALIFIED_MAJORITY Protocol

**Use case:** Constitutional changes, new governance principles, strategic direction changes.

```
Protocol flow:
1. Proposal formally submitted with: rationale, affected parties, reversibility assessment
2. All T4 agents are eligible voters (T5 breaks ties if needed)
3. Deliberation period: TIME_LIMIT/2 for agents to review and form positions
4. Formal vote with APPROVE|REJECT|ABSTAIN
5. Qualified majority = 2/3 of non-ABSTAIN votes must be APPROVE
6. If qualified majority achieved: proposal ADOPTED
7. If not achieved: proposal REJECTED (can be resubmitted after 30 days with revisions)
8. All deliberation and voting recorded in constitution/voting-records.md

Time limit: 60 minutes. Extensions require T5 approval.
```

---

## Consensus Failure Modes

| Failure | Condition | Response |
|---|---|---|
| TIMEOUT | Time limit exceeded without consensus | Escalate to next-tier protocol |
| DEADLOCK | Top positions within 10% weight | Force ARBITER with T3+ arbiter |
| QUORUM_FAILURE | <50% eligible voters responded | Reschedule with extended deadline |
| SINGLE_VOTER | Only 1 agent voted | Cannot make consensus decision; escalate |
| CONTRADICTORY_EVIDENCE | Voters use incompatible evidence | Run truth reconciliation first, then re-vote |

---

## Consensus Record Format

Every consensus decision is recorded:

```yaml
# Appended to memory/decisions.md
consensus-record:
  consensus-id: "CONS-{NNN}"
  created-at: "{ISO-8601}"
  completed-at: "{ISO-8601}"
  protocol: "RAFT_LEADER|WEIGHTED_VOTE|ARBITER|QUALIFIED_MAJORITY"
  question: "{decision question}"
  context-source: "{workflow-instance-id or task}"
  
  participants:
    - agent: "{agent-id}"
      tier: T{N}
      vote: "{position or ABSTAIN}"
      confidence: {N}
      weight: {N}
  
  result:
    winning-position: "{position}"
    total-weighted-votes: {N}
    margin: "{N}% over next position"
    outcome: "ADOPTED|REJECTED|DEADLOCKED|ESCALATED"
    
  binding-constraint-created: true|false
  binding-constraint-path: "{path if created}"
  
  escalation-details: "{if escalated}"
```

---

## Consensus Authority Matrix

| Decision Type | Required Protocol | Minimum Tier | Binding At |
|---|---|---|---|
| Domain fact dispute | RAFT_LEADER | T2 (Raft leader) | Domain |
| Architecture pattern selection | ARBITER | T2 + T3 arbiter | Workflow |
| ADR adoption | WEIGHTED_VOTE | T3+ | Organization |
| New governance principle | QUALIFIED_MAJORITY | T4+ | Constitutional |
| Capability gap prioritization | WEIGHTED_VOTE | T3+ | Strategic |
| Security policy change | WEIGHTED_VOTE + human gate | T3+ + human | Constitutional |