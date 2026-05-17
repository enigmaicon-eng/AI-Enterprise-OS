# Organizational Evolution Engine

**Component:** RSI-EVO-001 | **Owner:** Meta-Org | **Tier:** T4 | **Class:** SENSITIVE

## Role
Detects when the organizational structure of the Enterprise AI OS is misaligned with its workload, throughput patterns, or strategic direction — and generates evolution proposals to restructure teams, realign OKRs, adjust reporting structures, or rebalance capacity. All proposals involving human organization require T4 authorization and follow PB-017 (Organizational Evolution).

## Organizational Misalignment Signals

```
SIGNAL TYPE                 MISALIGNMENT INDICATOR          THRESHOLD
──────────────────────────────────────────────────────────────────────────────────────────────
Conway's Law violation      Teams organized differently       > 5 cross-team handoffs/sprint
                            than system architecture          for a single workflow
Coupling anomaly            Over-coupled teams (DBSCAN        coupling_score > 0.8 for 30d
                            cluster with unhealthy coupling)
Bottleneck team             Single team on critical path      > 60% of CRITICAL_PATH deps
                            of > 60% of active initiatives    pointing to one team
Span of control violation   Manager with < 4 or > 10          span < 4 OR span > 10
                            direct reports
Bus factor = 1              Critical knowledge in one person   bus_factor = 1 for any critical system
Velocity collapse           Team velocity decline > 30%        velocity_30d / velocity_90d < 0.70
                            not explained by scope change
Knowledge silo              Teams with zero cross-team         collaboration_score < 0.15
                            collaboration in 30d
OKR misalignment            Team OKRs diverging from          team_okr_alignment_score < 0.60
                            company direction
```

---

## Evolution Proposal Types

### 1. Team Structure Proposals
```
PROPOSAL: TEAM_SPLIT
  Trigger: team velocity collapse + coupling_score high + team_size > 9
  Action: split team by domain boundary (Conway's Law alignment)
  Constraints: both sub-teams must have >= 4 members post-split
  Authorization: T4 (> 5 people affected = PB-017 MODERATE class)

PROPOSAL: TEAM_MERGE
  Trigger: two teams with low velocity, high inter-dependency, combined size < 6
  Action: merge into one team with shared charter
  Constraints: combined size <= 9; shared OKR must be definable
  Authorization: T4

PROPOSAL: TEAM_REBALANCE
  Trigger: one team overloaded (> 1.2× avg velocity), adjacent team underloaded (< 0.8×)
  Action: move 1–2 members to balance capacity
  Constraints: moved members must have relevant skill graph overlap with destination team
  Authorization: T3 (small move) / T4 (> 3 people)
```

### 2. OKR Realignment Proposals
```
PROPOSAL: OKR_REALIGN
  Trigger: team_okr_alignment_score < 0.60 for 2 consecutive quarters
  Action: propose revised team OKRs that better align with company OKRs
  Constraints: realignment requires PM + Team Lead co-authorship; not AI-generated OKRs
  Authorization: T3 (PM Director approves OKR changes)

PROPOSAL: OKR_ELEVATION
  Trigger: team consistently exceeds OKRs (> 1.20× for 2 quarters)
  Action: propose stretch OKRs with raised targets
  Note: AI proposes; human team sets final numbers (C-001)
```

### 3. Ownership and Boundary Proposals
```
PROPOSAL: OWNERSHIP_TRANSFER
  Trigger: team A owns system X but team B modifies X in > 60% of PRs
  Action: transfer ownership to team B (align ownership with custody)
  Constraints: team A + B leadership agreement required; no covert transfers
  Authorization: T3

PROPOSAL: DOMAIN_BOUNDARY_CLARIFICATION
  Trigger: > 3 conflicts/sprint over "who owns this?" in a domain
  Action: write domain charter; define explicit ownership boundaries
  Authorization: T3 Architecture Council

PROPOSAL: RESPONSIBILITY_ASSIGNMENT
  Trigger: artifact or system with no assigned owner (orphan detected)
  Action: assign ownership based on skill graph + historical contribution
  Authorization: T3 Engineering Director
```

### 4. Capacity Evolution Proposals
```
PROPOSAL: CAPACITY_GAP
  Trigger: team consistently unable to complete planned work (carry-over > 20% for 6 weeks)
  Action: propose headcount increase (feeds to WF-020 headcount planning)
  Note: AI identifies gap; hiring decision is human (C-001)
  Authorization: T4

PROPOSAL: SKILL_REBALANCE
  Trigger: team skill graph shows concentration > 60% in one skill area with another area empty
  Action: propose cross-training or specialized hire
  Authorization: T3 (training) / T4 (hire)
```

---

## Evolution Impact Assessment

```
BEFORE GENERATING EVOLUTION PROPOSAL:
  1. Delivery impact: will the change disrupt any active initiatives?
     → Model: velocity recovery curve (typically 4–8 weeks to recover)
     → If critical release in < 8 weeks: defer proposal
  2. Knowledge transfer: is there a transition plan for knowledge transfer?
     → Minimum: 2-week overlap period for any ownership transfer
  3. Human impact: are affected individuals informed before public proposal?
     → Required: proposal is DRAFT until affected leads are briefed
  4. Dependency map: does the restructure change who is responsible for critical dependencies?
     → Update dependency register (PB-015) as part of proposal

RISK SCORING:
  delivery_risk: probability of delivery impact × sprint weeks of disruption
  people_risk: number of people affected × disruption per person
  knowledge_risk: bus_factor change (does this create new single points of failure?)
  combined_risk: max(delivery_risk, people_risk, knowledge_risk)

MINIMUM ROI TO PROPOSE: ROI > 2.0 AND combined_risk < HIGH
```

---

## Governance

```
HUMAN IN THE LOOP (C-001 binding):
  No organizational change executes without human authorization
  Proposals are recommendations; humans decide
  AI never communicates with affected individuals directly about org changes

PB-017 INTEGRATION:
  All proposals feeding human org changes route through PB-017 (Organizational Evolution)
  MINOR proposals (< 5 people): T3 + Chief People Officer
  MODERATE proposals (5–15 people): T4 approval
  MAJOR proposals (> 15 people): CEO + T4

RECORD KEEPING:
  All proposals (accepted or rejected) recorded permanently
  Rejected proposals include reason (for future improvement of proposal quality)
```

---

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Conway's Law alignment score            >= 0.80 (structure matches architecture)
Average team coupling score             < 0.60
Bus factor = 1 instances               = 0 (all mitigated)
OKR alignment score (avg)              >= 0.75
Velocity recovery time post-change      < 6 weeks average
Evolution proposals accepted/year      >= 2
Proposals triggering positive outcome  >= 0.70
```
