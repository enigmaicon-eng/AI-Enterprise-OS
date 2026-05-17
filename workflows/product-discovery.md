# Product Discovery Workflow

```
workflow_id:    product-discovery
version:        1.0.0
trigger:        "discovery", "should we build", "validate this idea", "problem to solve", "user research needed", "explore opportunity"
intent_class:   PM
total_steps:    9
typical_duration: 5–10 business days
state_file:     memory/workflow-state/discovery-{slug}.yaml
```

---

## Purpose

De-risk product bets before engineering investment. Produces a validated opportunity with evidence, sizing, and a documented Go/No-Go decision — or a documented No-Go that preserves the reasoning for future reference.

**Rule:** No engineering work (no sprint items, no ADRs, no code) begins until this workflow produces a `GO` decision artifact with PM sign-off.

---

## Routing Entry Points

```
IF intent contains "discovery" OR "should we build" OR "validate"
  AND no approved PRD exists for this topic
  THEN → product-discovery workflow

IF intent contains "new product" OR "new initiative" OR "0→1"
  THEN → product-discovery workflow

IF intent contains "pivot" OR "strategy change"
  THEN → product-discovery workflow (with existing-product context)

IF intent contains "feature" AND PRD already approved
  THEN → feature-development workflow (skip discovery)
```

**Escalation into discovery from other workflows:**
- `feature-development` Step 01 fails gate twice → escalate back to discovery
- `sprint-planning` reveals low-confidence items → trigger discovery for those items
- `analytics-agent` report shows unexpected metric decline → trigger discovery

---

## Agent Sequence

```
STEP 01  pm-agent              Intake & Opportunity Triage
STEP 02  pm-agent              Problem Framing
STEP 03a market-analyst-agent  Competitive & Market Research      ┐ parallel
STEP 03b pm-agent              User Research                      ┘
STEP 04  pm-agent + architect-agent  Assumption Mapping
STEP 05  analytics-agent + pm-agent  Opportunity Sizing
STEP 06  pm-agent              Validation Sprint Design (if needed)
STEP 07  pm-agent + strategist-agent  Go/No-Go Decision
STEP 08  pm-agent              Wiki & Memory Update
STEP 09  supervisor-agent      Final Gate Review
```

---

## Step Specifications

---

### STEP 01 — Intake & Opportunity Triage

**Agent:** `pm-agent`
**Time budget:** 30 minutes
**Inputs required:** Raw opportunity statement (from user, stakeholder, or metric signal)

**Instructions:**
1. Extract from the request: who has the problem, what the problem is, why it matters now
2. Check `wiki/decisions/` — has this been explored before?
3. Check `prds/` — does a PRD already exist for this space?
4. Check `memory/organizational/` — any constraints that affect this space?
5. Classify the opportunity type:
   - `PROBLEM_KNOWN` — clear user pain, solution unknown
   - `SOLUTION_KNOWN` — stakeholder has a solution idea, problem needs validating
   - `METRIC_SIGNAL` — data anomaly or opportunity identified by analytics
   - `MARKET_PULL` — competitive pressure or market change
   - `TECHNOLOGY_PUSH` — new capability becomes available (e.g., AI model improvement)

6. Assign discovery scope:
   - `LIGHT` — problem space familiar, limited research needed (3–5 days)
   - `FULL` — new space, significant uncertainty (5–10 days)
   - `DEEP` — market expansion or new user segment (10–20 days)

**Artifact:**
```
path:   prds/discovery/{date}-{slug}-triage.md
schema:
  opportunity_statement: string
  opportunity_type: PROBLEM_KNOWN | SOLUTION_KNOWN | METRIC_SIGNAL | MARKET_PULL | TECHNOLOGY_PUSH
  discovery_scope: LIGHT | FULL | DEEP
  prior_art:
    prior_decisions: [wiki/decisions paths or "none"]
    prior_prds: [prds/ paths or "none"]
    constraints: [memory refs or "none"]
  discovery_question: string  # THE question this discovery must answer
  go_criteria: string         # What would make us say GO
  no_go_criteria: string      # What would make us say NO-GO
```

**Gate (self-check):**
- [ ] Opportunity type classified
- [ ] Discovery scope assigned
- [ ] `discovery_question` is a yes/no-answerable question
- [ ] `go_criteria` and `no_go_criteria` are specific and measurable
- [ ] Prior art checked (not ignored)

**Escalation:**
- If prior ADR or decision blocks this space → surface conflict immediately, do not proceed
- If opportunity_type is TECHNOLOGY_PUSH with AI components → flag for AI-feature-workflow after GO decision

---

### STEP 02 — Problem Framing

**Agent:** `pm-agent`
**Time budget:** 1 day
**Inputs:** Triage artifact from Step 01

**Instructions:**
1. Write a rigorous problem statement using this exact format:
   > "When [user type] tries to [goal], they encounter [obstacle], which causes [impact], because [root cause]."
2. Gather evidence — minimum 3 distinct sources:
   - Quantitative: metrics, usage data, error rates, conversion funnels
   - Qualitative: user interview quotes, support tickets, NPS verbatims
   - Market: competitive gaps, analyst reports, trend data
3. Identify anti-problem: what does the world look like if this is solved?
4. Identify competing problems (what else could we solve instead with this effort?)
5. State the hypothesis: "We believe [solution type] will [outcome] for [user segment] because [evidence]"
6. Define the job-to-be-done using JTBD format:
   > "When [situation], I want to [motivation], so I can [expected outcome]."

**Artifact:**
```
path:   prds/discovery/{date}-{slug}-problem-frame.md
schema:
  problem_statement: string           # "When X tries to Y..."
  evidence:
    quantitative: [{source, value, date}]
    qualitative: [{quote, source, date}]
    market: [{finding, source}]
  anti_problem: string                # Solved world description
  competing_problems: [string]
  hypothesis: string                  # "We believe..."
  jtbd: string                        # "When X, I want to Y, so I can Z"
  confidence: low | medium | high     # How confident is the framing?
```

**Gate (checklist):**
- [ ] Problem statement uses the "When/tries/encounter/causes/because" format
- [ ] Minimum 3 evidence points, at least 1 quantitative
- [ ] No solution embedded in the problem statement
- [ ] JTBD written from user perspective, not company perspective
- [ ] Competing problems listed (even if deprioritized)

**Escalation:**
- If evidence is insufficient (< 3 sources) → block Step 03, request more data first
- If confidence is `low` after framing → scope is now `FULL` or `DEEP` regardless of initial classification

---

### STEP 03a — Competitive & Market Research [PARALLEL]

**Agent:** `market-analyst-agent`
**Time budget:** 1–2 days (runs in parallel with Step 03b)
**Inputs:** Problem frame from Step 02, triage artifact from Step 01

**Instructions using `agents/plugins/ai-pm-copilot/skills/competitive-analysis-templates/`:**
1. Identify direct competitors (solve the same problem)
2. Identify indirect competitors (solve the same JTBD differently)
3. Map each competitor on: capability, user experience quality, market position, pricing
4. Identify gaps in competitor offerings (unmet needs = opportunity space)
5. Assess market size: TAM → SAM → SOM calculation
6. Identify market trends relevant to this problem (tailwinds/headwinds)
7. Research how similar problems have been solved in adjacent industries

**Artifact:**
```
path:   wiki/market/{date}-{slug}-competitive.md
schema:
  direct_competitors: [{name, capability_score, ux_score, notes}]
  indirect_competitors: [{name, approach, notes}]
  competitor_gaps: [string]           # What competitors don't do well
  market_size:
    tam: {value, method, source}
    sam: {value, method}
    som: {value, method}
  market_trends: [{trend, direction, relevance}]
  differentiation_opportunity: string # Where we could win
```

**Gate (checklist):**
- [ ] Minimum 3 direct competitors analyzed
- [ ] At least 1 indirect competitor identified
- [ ] Market size calculated (not just guessed)
- [ ] At least 1 clear gap or differentiation opportunity identified

---

### STEP 03b — User Research [PARALLEL]

**Agent:** `pm-agent`
**Time budget:** 1–3 days (runs in parallel with Step 03a)
**Inputs:** Problem frame from Step 02

**Instructions using `agents/plugins/ai-pm-copilot/skills/interview-frameworks/`:**
1. If user interviews available: synthesize minimum 5 interview transcripts or session notes
2. If no interviews available: identify what questions need answering and design interview guide
3. Map the current user journey (as-is, not the desired future state)
4. Identify friction points in the current journey (each friction = potential value)
5. Segment users: who feels this pain most acutely?
6. Identify user workarounds (users who work around a problem reveal strong demand)

**Artifact:**
```
path:   wiki/research/{date}-{slug}-user-research.md
schema:
  research_method: interviews | survey | session_recordings | support_analysis | secondary
  sample_size: integer
  user_segments:
    - segment: string
      pain_intensity: low | medium | high | extreme
      current_workaround: string | null
      representative_quote: string
  current_journey:
    steps: [string]
    friction_points: [{step, friction, severity}]
  key_insights: [string]
  jobs_validated: [string]     # JTBD confirmed by research
  jobs_invalidated: [string]   # JTBD not confirmed
  research_gaps: [string]      # What we still don't know
```

**Gate (checklist):**
- [ ] Minimum 3 distinct user data points (3 interviews OR 50+ survey responses OR 5+ session recordings)
- [ ] User segments identified with pain intensity rated
- [ ] Current journey mapped with friction points
- [ ] At least 1 user workaround identified (or explicitly noted as absent)
- [ ] Research gaps documented (not hidden)

**PARALLEL JOIN:** Steps 03a and 03b must BOTH pass gates before Step 04 begins.

---

### STEP 04 — Assumption Mapping

**Agent:** `pm-agent` + `architect-agent`
**Time budget:** 4 hours
**Inputs:** Problem frame (02), competitive research (03a), user research (03b)

**Instructions:**
`pm-agent` leads; `architect-agent` reviews for technical feasibility assumptions.

1. List ALL assumptions the opportunity depends on — categorized:
   - **Desirability:** Users want this; they'll pay/engage
   - **Viability:** We can build a sustainable business around this
   - **Feasibility:** We can technically build it
   - **Usability:** Users can successfully use our solution
   - **Growth:** We can acquire/retain users in this space

2. For each assumption, rate:
   - **Risk:** HIGH (wrong = project fails) | MEDIUM | LOW
   - **Confidence:** VALIDATED (evidence exists) | UNVALIDATED (assumed) | FALSIFIED (evidence against)

3. Create the risk-confidence matrix:
   ```
   HIGH risk + UNVALIDATED = Must validate before GO decision
   HIGH risk + FALSIFIED   = Blocker: explore pivot or NO-GO
   HIGH risk + VALIDATED   = De-risked: proceed
   MEDIUM/LOW risk + any   = Note but don't block
   ```

4. `architect-agent` specifically reviews feasibility assumptions:
   - Can this be built in reasonable timeline?
   - Does it require capabilities we don't have?
   - Are there hidden technical constraints?

**Artifact:**
```
path:   prds/discovery/{date}-{slug}-assumptions.md
schema:
  assumptions:
    - id: ASM-001
      category: desirability | viability | feasibility | usability | growth
      statement: string
      risk: HIGH | MEDIUM | LOW
      confidence: VALIDATED | UNVALIDATED | FALSIFIED
      evidence: string | null
      validation_method: string | null   # How to validate if UNVALIDATED
  riskiest_assumption: ASM-XXX           # The one that breaks everything if wrong
  blockers: [ASM-XXX]                    # FALSIFIED HIGH-risk assumptions
  validation_required: [ASM-XXX]        # Must validate before GO
```

**Gate (checklist):**
- [ ] Minimum 8 assumptions documented across all 5 categories
- [ ] Every HIGH-risk assumption has a confidence rating and evidence/gap note
- [ ] Riskiest assumption identified (singular)
- [ ] No HIGH-risk FALSIFIED assumptions exist without a documented resolution
- [ ] Architect reviewed feasibility assumptions and signed off

**Escalation:**
- If 3+ HIGH-risk FALSIFIED assumptions → escalation to `strategist-agent` for pivot assessment before proceeding
- If architect rates feasibility as infeasible within constraints → flag immediately; may trigger NO-GO

---

### STEP 05 — Opportunity Sizing

**Agent:** `analytics-agent` + `pm-agent`
**Time budget:** 4 hours
**Inputs:** Competitive research (03a), user research (03b), assumption map (04)

**Instructions:**
`analytics-agent` leads quantitative sizing; `pm-agent` validates against business context.

1. **For new market opportunities:**
   - TAM/SAM/SOM from competitive research (03a)
   - Penetration rate assumptions (conservative/base/optimistic)
   - Revenue or engagement value per user/customer

2. **For existing product improvements:**
   - Affected user base: how many users experience this problem?
   - Impact on north star metric: what % change is realistic?
   - Retention/conversion improvement: how many users does this retain or unlock?
   - Calculated business value: users × impact × unit value

3. **Investment estimate (rough):**
   - Engineering: T-shirt size (S/M/L/XL)
   - Design: T-shirt size
   - Total investment in weeks × team cost
   
4. **ROI scoring:**
   - Value score (1–10): normalized opportunity value
   - Effort score (1–10): inverted investment estimate
   - Confidence score (1–10): how certain are we of the value estimate
   - Discovery priority = (Value × Confidence) / Effort

**Artifact:**
```
path:   analytics/{date}-{slug}-opportunity-sizing.md
schema:
  sizing_method: new_market | existing_product_improvement | hybrid
  addressable_users:
    current: integer | null
    potential: integer
    method: string
  value_scenarios:
    conservative: {metric, value, assumptions}
    base: {metric, value, assumptions}
    optimistic: {metric, value, assumptions}
  investment_estimate:
    engineering: XS | S | M | L | XL
    design: XS | S | M | L | XL
    calendar_weeks: {min, max}
  scoring:
    value: 1-10
    effort: 1-10
    confidence: 1-10
    priority_score: float    # (value × confidence) / effort
  north_star_impact: string  # What metric moves and by how much
```

**Gate (checklist):**
- [ ] Addressable user base calculated with method documented
- [ ] At least conservative and base scenarios provided
- [ ] Investment estimate reviewed with engineer input (not PM guess)
- [ ] Priority score calculated
- [ ] North star metric impact explicitly stated

---

### STEP 06 — Validation Sprint Design (Conditional)

**Agent:** `pm-agent`
**Trigger:** Execute ONLY if any HIGH-risk UNVALIDATED assumptions remain from Step 04
**Time budget:** 2 hours to design; 3–10 days to execute

**Instructions:**
Design the minimum experiment set to validate the riskiest remaining assumptions.

For each HIGH-risk UNVALIDATED assumption, select a validation method:

| Method | Best For | Time | Cost |
|--------|----------|------|------|
| **Customer interviews** (5–8 targeted) | Desirability, JTBD | 1 week | Low |
| **Landing page test** | Demand, willingness to pay | 3–5 days | Low |
| **Wizard of Oz prototype** | Usability, desirability | 1 week | Medium |
| **Concierge MVP** | Full desirability + viability | 2–3 weeks | Medium |
| **Technical spike** | Feasibility | 3–5 days | Medium |
| **Data analysis** | Metric-based assumptions | 1–2 days | Low |

For each experiment, define:
- Hypothesis being tested
- Method and sample size
- Success criterion (specific, measurable)
- Timeline

**Artifact:**
```
path:   prds/discovery/{date}-{slug}-validation-plan.md
schema:
  trigger_assumptions: [ASM-XXX]      # Which assumptions triggered this step
  experiments:
    - assumption_id: ASM-XXX
      hypothesis: string
      method: string
      sample_size: integer
      success_criterion: string        # Pass/fail definition
      timeline_days: integer
      owner: pm-agent | ux-agent | engineer-agent
  total_timeline_days: integer
  validation_budget: string           # T-shirt size effort
  decision_point: string              # After these experiments, we will re-evaluate
```

**Gate (checklist):**
- [ ] Every HIGH-risk UNVALIDATED assumption has an experiment
- [ ] Each experiment has a specific, binary success criterion
- [ ] Timeline is realistic (not optimistic)
- [ ] Total validation investment doesn't exceed 20% of estimated build cost

**Step 06 execution loop:**
After experiments run, return to Step 04 (assumption mapping) with new evidence.
- If riskiest assumptions are now VALIDATED → proceed to Step 07
- If new FALSIFIED findings emerge → assess pivot or NO-GO before proceeding

---

### STEP 07 — Go/No-Go Decision

**Agent:** `pm-agent` + `strategist-agent`
**Time budget:** 2 hours
**Inputs:** All prior discovery artifacts

**Instructions:**
1. Evaluate against the `go_criteria` and `no_go_criteria` defined in Step 01
2. Assess each dimension:

| Dimension | Assessment Questions |
|-----------|-------------------|
| **Desirability** | Is there strong evidence users want this? |
| **Viability** | Can we build a sustainable offering? |
| **Feasibility** | Can we build it within reasonable constraints? |
| **Strategic fit** | Does this advance our north star? |
| **Competitive** | Can we differentiate meaningfully? |
| **Timing** | Is now the right time? |

3. `strategist-agent` applies April Dunford positioning test:
   - Is there a frame where we clearly win?
   - Who are the best-fit customers for this?

4. Make one of three decisions:
   - `GO` — sufficient evidence; proceed to `feature-development` or `ai-feature` workflow
   - `NO-GO` — evidence against; document and archive
   - `PIVOT` — insufficient evidence for current framing, but adjacent opportunity identified; restart discovery with new frame

**Artifact:**
```
path:   wiki/decisions/{date}-{slug}-discovery-decision.md
schema:
  decision: GO | NO_GO | PIVOT
  decision_date: YYYY-MM-DD
  decision_makers: [pm-agent, strategist-agent]
  
  evidence_summary:
    for: [string]      # Evidence supporting GO
    against: [string]  # Evidence against or gaps
  
  dimension_scores:
    desirability: STRONG | MODERATE | WEAK | UNKNOWN
    viability: STRONG | MODERATE | WEAK | UNKNOWN
    feasibility: STRONG | MODERATE | WEAK | UNKNOWN
    strategic_fit: STRONG | MODERATE | WEAK | UNKNOWN
    competitive_position: STRONG | MODERATE | WEAK | UNKNOWN
    timing: NOW | LATER | WRONG_TIME
  
  rationale: string                    # Why this decision
  dissenting_views: string | null      # Any disagreements worth noting
  what_would_change_decision: string   # What new information would flip this
  
  # If GO:
  next_workflow: feature-development | ai-feature
  key_constraints_for_prd: [string]
  required_success_metrics: [string]
  
  # If PIVOT:
  new_discovery_frame: string
  
  # If NO-GO:
  reopen_conditions: string | null     # What would make us reconsider
```

**Gate (agent-review, supervisor):**
- [ ] Decision is one of: GO | NO_GO | PIVOT (not "maybe" or "depends")
- [ ] Evidence summary covers both for and against
- [ ] Rationale is specific to this opportunity (not generic)
- [ ] `what_would_change_decision` is answered
- [ ] If GO: next workflow is named and key constraints for PRD are listed
- [ ] If NO-GO: reopen conditions documented (or explicitly "none")

**Escalation:**
- If pm-agent and strategist-agent disagree on decision → escalate to human review before proceeding
- If GO decision but feasibility is WEAK → architect-agent must confirm before workflow exits

---

### STEP 08 — Wiki & Memory Update

**Agent:** `pm-agent`
**Time budget:** 1 hour
**Trigger:** Always executed regardless of GO/NO-GO decision

**Instructions:**
Even NO-GO decisions are valuable organizational knowledge.

1. **Wiki updates (always):**
   - `wiki/decisions/{date}-{slug}-discovery-decision.md` — the decision (from Step 07)
   - `wiki/research/{date}-{slug}-user-research.md` — user insights (from Step 03b)
   - `wiki/market/{date}-{slug}-competitive.md` — competitive landscape (from Step 03a)

2. **Memory updates (if non-obvious patterns found):**
   - User behavior patterns → `memory/patterns/{domain}-user-behaviors.md`
   - Market constraints that affect future work → `memory/organizational/market-constraints.md`
   - Technical constraints discovered → `memory/organizational/tech-constraints.md`

3. **Backlink creation:**
   - Update `wiki/index.md` "Recently Updated" table
   - If GO: link discovery decision from the forthcoming PRD

4. **Archive discovery artifacts:**
   - All Step 01–06 artifacts remain in `prds/discovery/`
   - They are referenced by the decision doc, never deleted

**Artifact:**
```
path:   (updates to existing wiki pages + memory files)
minimum_required:
  - wiki/decisions/{date}-{slug}-discovery-decision.md  ← must exist
  - wiki/index.md                                        ← must be updated
```

---

### STEP 09 — Final Gate Review

**Agent:** `supervisor-agent`
**Inputs:** All discovery artifacts + Go/No-Go decision (Step 07)

**Supervisor review criteria:**

```
COMPLETENESS
  ✓ All 8 steps executed (or documented skip with reason)
  ✓ All required artifacts exist at stated paths
  ✓ No placeholder text in decision document

DECISION QUALITY
  ✓ Decision is evidence-based (not opinion-based)
  ✓ Evidence is cited (source + date, not vague)
  ✓ Dissenting views documented
  ✓ What-would-change-decision is specific

KNOWLEDGE PRESERVATION
  ✓ Wiki updated (minimum: decision doc exists)
  ✓ Research insights preserved (not ephemeral)
  ✓ Non-obvious constraints added to memory

NEXT-STEP READINESS (if GO)
  ✓ Key constraints for PRD are specific enough for pm-agent to act on
  ✓ Required success metrics are measurable
  ✓ Next workflow is named
```

**Verdict outputs:**
```
APPROVED  → Workflow complete; emit workflow closure event
CONDITIONAL → List specific fixes; re-run STEP 09 after fixes
REJECTED  → Return to specific step with detailed critique
```

---

## Escalation Rules

| Condition | Escalation | Action |
|-----------|-----------|--------|
| HIGH-risk FALSIFIED assumption (Step 04) | `strategist-agent` | Pivot assessment before GO/NO-GO |
| Technical infeasibility (architect Step 04) | Human review | May require scope change or NO-GO |
| PM/Strategist disagree on decision (Step 07) | Human review | Cannot proceed without resolution |
| Supervisor rejects twice | Human review | Manual discovery review required |
| Discovery scope is DEEP and > 20 days elapsed | Delivery-agent | Timeline and cost review |

---

## Handoff Protocol

### On GO Decision → `feature-development` workflow

```yaml
handoff:
  from: product-discovery
  to: feature-development
  workflow_step: STEP-07

  artifacts:
    - discovery_decision:  "wiki/decisions/{date}-{slug}-discovery-decision.md"
    - user_research:       "wiki/research/{date}-{slug}-user-research.md"
    - competitive:         "wiki/market/{date}-{slug}-competitive.md"
    - assumption_map:      "prds/discovery/{date}-{slug}-assumptions.md"
    - opportunity_sizing:  "analytics/{date}-{slug}-opportunity-sizing.md"

  decisions_made:
    - "Problem validated: {problem statement}"
    - "Target segment: {primary user segment}"
    - "Success metric (north star): {metric}"

  constraints_for_prd:
    - "{constraint from GO decision}"

  explicitly_excluded:
    - "Re-validating the problem (already done)"
    - "Re-running competitive analysis (use wiki/market/ reference)"

  open_questions_for_pm:
    - "{question from discovery that PRD must resolve}"

  success_metrics_required:
    - "{metric}"
```

### On NO-GO Decision → Archive

```yaml
handoff:
  from: product-discovery
  to: memory-system
  action: archive

  artifacts_archived:
    - "prds/discovery/{date}-{slug}-*"  (all discovery docs)

  wiki_decision_preserved: "wiki/decisions/{date}-{slug}-discovery-decision.md"

  reopen_trigger: "{condition from decision doc}"
```

---

## Workflow Artifact Map

```
prds/discovery/{date}-{slug}-triage.md              ← Step 01
prds/discovery/{date}-{slug}-problem-frame.md        ← Step 02
wiki/market/{date}-{slug}-competitive.md             ← Step 03a
wiki/research/{date}-{slug}-user-research.md         ← Step 03b
prds/discovery/{date}-{slug}-assumptions.md          ← Step 04
analytics/{date}-{slug}-opportunity-sizing.md        ← Step 05
prds/discovery/{date}-{slug}-validation-plan.md      ← Step 06 (conditional)
wiki/decisions/{date}-{slug}-discovery-decision.md   ← Step 07
```

---

## Wiki Updates Per Step

| Step | Wiki Page | Update Type |
|------|-----------|------------|
| 01 | `wiki/index.md` | Add to "In Progress" |
| 03a | `wiki/market/{slug}` | Create competitive page |
| 03b | `wiki/research/{slug}` | Create research page |
| 07 | `wiki/decisions/{slug}` | Create decision page |
| 08 | `wiki/index.md` | Move to "Completed", update "Recently Updated" |

---

## Quality Metrics

| Metric | Target |
|--------|--------|
| Discovery→GO conversion rate | 40–60% (lower = too many bad ideas entering; higher = not enough filter) |
| Days to GO/NO-GO decision | LIGHT ≤ 5d, FULL ≤ 10d, DEEP ≤ 20d |
| Step 09 first-pass approval rate | > 80% |
| NO-GO decisions with preserved learnings | 100% |
| GO decisions where PRD is approved without major rework | > 75% |
