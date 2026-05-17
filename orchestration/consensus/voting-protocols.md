---
layer: consensus-frameworks
type: voting-protocols
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: enterprise-architecture-council
---

# Voting Protocols

Formal voting mechanisms used in the Enterprise AI OS consensus framework. Each protocol has specific authority requirements, quorum rules, and outcome binding.

---

## Protocol V-1: Simple Majority Vote

The fastest and most permissive voting protocol.

```
Eligible voters: All agents with relevant domain expertise at T2+
Quorum: ≥50% of eligible voters must cast a non-ABSTAIN vote
Winning condition: Position receives >50% of non-ABSTAIN votes
Binding level: Domain-level (not organizational)
Used for: Operational decisions, pattern selection, team-level priorities
Time limit: 10 minutes
```

### Process
1. Coordinator announces vote: topic + options + eligible voters + deadline
2. Each voter submits: `{position, confidence, one-sentence reasoning}`
3. At deadline OR when quorum reached: count votes
4. If winning condition met: position adopted
5. If no majority: escalate to WEIGHTED_VOTE

### Record
```yaml
v1-result:
  vote-id: "VOTE-{NNN}"
  topic: "{decision question}"
  eligible-voters: N
  votes-cast: N
  quorum-met: true|false
  winning-position: "{position}"
  vote-distribution: {"position-A": N, "position-B": N, "ABSTAIN": N}
  binding-at: "DOMAIN"
```

---

## Protocol V-2: Weighted Vote

Authority-sensitive voting where tier determines vote weight.

```
Eligible voters: All agents with relevant domain expertise at T2+
Quorum: ≥60% of weighted votes must be cast (by weight, not count)
Winning condition: Position receives >50% of total weighted votes cast
Weight formula: tier_weight × confidence_weight
  tier_weights: {T2: 1.0, T3: 2.0, T4: 4.0, T5: 8.0}
  confidence_weight: confidence_score / 80 (capped at 1.25 for >100%)
Binding level: Organizational
Used for: ADR adoption, cross-domain decisions, strategic tradeoffs
Time limit: 15 minutes
```

### Weight Examples
| Agent Tier | Confidence | Weight |
|---|---|---|
| T2 | 90% | 1.125 |
| T3 | 80% | 2.0 |
| T3 | 50% | 1.25 |
| T4 | 95% | 4.75 |
| T5 | 100% | 10.0 |

### Deadlock Resolution
If top two positions have weighted votes within 10% of each other:
1. All voters have 5 minutes to shift position or modify confidence (optional)
2. If still within 10%: escalate to ARBITER with both positions

### Record
```yaml
v2-result:
  vote-id: "VOTE-{NNN}"
  protocol: "WEIGHTED_VOTE"
  topic: "{decision question}"
  
  votes:
    - agent: "{agent-id}"
      tier: T{N}
      position: "{position}"
      confidence: {N}
      weight: {N}
      
  weighted-totals:
    position-A: {N}
    position-B: {N}
    
  winning-position: "{position}"
  margin-pct: "{N}%"
  binding-at: "ORGANIZATIONAL"
```

---

## Protocol V-3: Qualified Majority

Supermajority required for high-stakes decisions that should not be made with bare majorities.

```
Eligible voters: All agents at T4+ (constitutional decisions: T5 only)
Quorum: 100% participation required (no quorum exceptions for this level)
Winning condition: ≥2/3 of non-ABSTAIN votes must be APPROVE
Veto right: Any T5 agent may veto (rare power — requires documented rationale)
Binding level: Constitutional / Governance
Used for: Governance principle changes, new constitutional articles, 
          strategic direction pivots, enterprise-wide policy
Time limit: 60 minutes (extensions require T5 approval)
```

### Deliberation Phase
Before formal voting, a deliberation phase occurs:
1. Proposal is circulated with: full text, impact analysis, implementation path
2. 30 minutes of structured deliberation: questions, clarifications, amendments
3. Amendments to the proposal require unanimous consent of all eligible voters
4. After deliberation: formal vote is cast (no further changes permitted)

### Dissent Preservation
Even when a qualified majority is achieved, the losing positions are formally recorded:

```yaml
qualified-majority-dissent:
  proposal: "{title}"
  vote-result: "ADOPTED"
  
  dissenting-voters:
    - agent: "{agent-id}"
      tier: T{N}
      dissent-reason: "{why they voted against}"
      concerns-for-record: "{specific concerns future agents should know}"
```

Dissent records are reviewed at the next applicable governance checkpoint. If the dissent concerns prove correct, the record establishes that the concern was raised — useful for learning without assigning blame.

---

## Protocol V-4: Ranked Choice

Used when more than two options exist and preference ordering matters.

```
Eligible voters: All agents with relevant domain expertise at T2+
Quorum: ≥50% of eligible voters
Winning condition: IRV (Instant Runoff Voting) — last-place option eliminated each round
Binding level: Domain or Organizational (depends on topic)
Used for: Priority ranking (which risks to address first),
          architecture pattern selection (3+ options),
          roadmap sequencing
Time limit: 20 minutes
```

### Ballot Format
```yaml
ranked-choice-ballot:
  voter: "{agent-id}"
  rankings:
    - rank: 1
      option: "{option-A}"
      reasoning: "{brief}"
    - rank: 2
      option: "{option-B}"
    - rank: 3
      option: "{option-C}"
```

### Instant Runoff Process
```python
def instant_runoff(ballots, options):
    remaining_options = list(options)
    
    while True:
        # Count first-choice votes for remaining options
        first_choice_counts = {opt: 0 for opt in remaining_options}
        for ballot in ballots:
            for rank, option in sorted(ballot.rankings.items()):
                if option in remaining_options:
                    first_choice_counts[option] += 1
                    break  # count only the top remaining choice
        
        # Check for majority
        total_votes = sum(first_choice_counts.values())
        winner = max(first_choice_counts, key=first_choice_counts.get)
        if first_choice_counts[winner] > total_votes / 2:
            return winner
        
        # Eliminate last-place option
        loser = min(first_choice_counts, key=first_choice_counts.get)
        remaining_options.remove(loser)
        
        if len(remaining_options) == 1:
            return remaining_options[0]
```

---

## Protocol V-5: Consent Vote (Modified)

Not consensus, not majority — consent. Used when speed matters and objections are the important signal.

```
Eligible voters: All agents in the affected domain
Quorum: 70% participation (ABSTAIN counts as quorum)
Winning condition: No BLOCK votes from T3+ agents
Binding level: Domain
Used for: Operational decisions, sprint plans, delegation choices
  where blocking objections are more important than positive approval
Time limit: 5 minutes (fast!)
```

### The BLOCK Vote
A BLOCK vote is different from a REJECT vote:
- REJECT: "I don't prefer this option"
- BLOCK: "I cannot live with this — it violates a binding constraint or creates unacceptable risk"

BLOCK votes must be justified with a specific constraint citation. Unjustified BLOCKs are overruled. A T2 BLOCK can be overruled by T3+. A T3 BLOCK cannot be overruled within the same tier — it escalates.

### Consent Process
1. Proposal announced with: text + impact + reversibility
2. 5-minute response window
3. Agents respond: APPROVE | ABSTAIN | BLOCK (with reason if BLOCK)
4. If no T3+ BLOCK: adopted immediately
5. If T3+ BLOCK: pause, apply BLOCK resolution (attempt amendment, or escalate)

---

## Voting Protocol Selection Guide

| Decision Characteristic | Recommended Protocol |
|---|---|
| Operational, low stakes, need speed | V-5 Consent |
| 2 options, domain-level | V-1 Simple Majority |
| 2+ options, cross-domain or organizational | V-2 Weighted Vote |
| 3+ options, preference ordering matters | V-4 Ranked Choice |
| Governance change, constitutional impact | V-3 Qualified Majority |
| One agent is clearly the domain authority | Raft Leader (not a vote) |
| Competing implementations need an expert judge | Arbiter (not a vote) |

---

## Vote Integrity Rules

1. **No ex-post adjustments:** Votes cannot be changed after the deadline
2. **No anonymous voting:** Every vote is attributed to the submitting agent (non-anonymous by design — accountability matters)
3. **No double-voting:** Each agent casts exactly one vote per protocol instance
4. **No abstain-then-object:** An agent that abstained may not challenge the outcome as if they voted
5. **No retroactive blocking:** A BLOCK raised after the V-5 consent window closes is not valid
6. **Evidence requirement:** Votes without stated reasoning in WEIGHTED_VOTE or QUALIFIED_MAJORITY protocols carry 50% of their normal weight