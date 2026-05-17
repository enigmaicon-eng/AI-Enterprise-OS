# Orchestration Synergy Learning
**ID:** AC-CP-003 | **Tier:** T2 | **Class:** STANDARD
**Owner:** AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Learns which agent team compositions and pairings produce synergistic outcomes — where the combined performance exceeds what each agent would achieve independently. Synergy learning informs future orchestration decisions for similar task contexts.

---

## Synergy Definition

```
ORCHESTRATION SYNERGY:

  Synergy occurs when a team composition produces:
    combined_quality > max(individual_quality_A, individual_quality_B, ...)

  SYNERGY SCORE:
    synergy_score = combined_quality − max(individual_baseline_qualities)
    synergy_score > 0.10: meaningful synergy — worth recording and reusing
    synergy_score 0.05–0.10: marginal synergy — monitor across further samples
    synergy_score < 0.05: no measurable synergy — composition neutral
    synergy_score < 0: anti-synergy — this team composition is net negative

  INDIVIDUAL BASELINE:
    Derived from each agent's performance profile (AC-IE-002: behavioral persistence)
    Updated quarterly or on significant role change
```

---

## Synergy Record Schema

```yaml
synergy_record:
  record_id: SR-{ISO8601}-{hash6}
  team_composition: [agent_id, ...]
  task_domain: string
  task_complexity: LOW | MEDIUM | HIGH | CRITICAL
  coordination_pattern: SEQUENTIAL | PARALLEL | ITERATIVE | HIERARCHICAL | PEER
  combined_quality: float [0.0, 1.0]
  synergy_score: float
  contributing_factors:
    - factor: string        # observed reason for synergy or anti-synergy
      confidence: float
  workflow_id: WF-*
  timestamp: ISO8601
```

---

## Synergy Discovery Protocol

```
DISCOVERY PROCESS:

  1. BASELINE COLLECTION
     For each agent, maintain individual performance baseline by domain
     Minimum 10 solo samples before inclusion in synergy calculation
     Agents without baseline treated as UNKNOWN (synergy score not computed)

  2. TEAM PERFORMANCE TRACKING
     Every multi-agent workflow generates a combined_quality score
     Synergy score computed post-workflow via AC-RE-001 (post-execution reflection)

  3. PATTERN IDENTIFICATION
     After ≥ 5 samples for a given team composition + domain + pattern:
       If avg synergy_score > 0.10 across samples:
         → Register as SYNERGY_PAIR in synergy registry
       If avg synergy_score < -0.10 across samples:
         → Register as ANTI_SYNERGY_PAIR; flag for orchestration avoidance

  4. SYNERGY REGISTRY UPDATE
     New synergy registrations require 5-sample evidence base
     Anti-synergy registrations require 3-sample evidence base (faster because risk)
     Orchestration agents retrieve synergy registry before team composition decisions
```

---

## Synergy Registry

```
SYNERGY REGISTRY ENTRIES:

  SYNERGY PAIRS (sorted by synergy_score, descending):
    [Architecture Agent + Security Agent, domain=API design]:    +0.18 (n=12)
    [PM Agent + Analytics Agent, domain=product requirements]:   +0.15 (n=8)
    [QA Agent + Engineering Agent, domain=test design]:          +0.14 (n=21)
    [Research Agent + Strategy Agent, domain=competitive intel]: +0.11 (n=6)

  ANTI-SYNERGY PAIRS:
    (none registered yet — registry grows with operational history)

  COMPOSITION NOTES:
    Synergy is not transitive: A+B synergy and B+C synergy does not imply A+B+C synergy
    Team size effects: synergy often decreases as team size grows beyond 3 agents
    Domain specificity: A+B may synergize on domain X but anti-synergize on domain Y
```

---

## Orchestration Integration

```
HOW SYNERGY LEARNING FEEDS ORCHESTRATION:

  Before team composition decision:
    orchestrator QUERIES synergy registry:
      Input: task_domain, task_complexity, available_agents
      Output: ranked team compositions by expected synergy_score

  Synergy recommendations are ADVISORY:
    Orchestrator may override for availability, load balancing, or governance reasons
    Override reason is logged (for future synergy registry calibration)

  FEEDBACK LOOP:
    Post-execution synergy score fed back to registry
    Registry entries updated with rolling average
    Entries with n < 5 samples marked as LOW_CONFIDENCE in recommendations
```

---

## Governance

- Synergy registry is read-accessible to all orchestration-tier agents
- Anti-synergy designations require T3 review before becoming permanent
- Synergy data is anonymized in executive summaries; full detail T3+ only
- Quarterly synergy pattern review by AI-Native Org
