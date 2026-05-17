# Discovery Workflow

**Workflow ID:** `discovery`
**Org Sequence:** PM + ANALYTICS + STRATEGIST → output: validated opportunity
**Typical Duration:** 1-2 weeks
**Trigger:** New problem space, major initiative, or uncertain bet that needs validation before investment

---

## Purpose

Discovery de-risks bets before engineering investment. The output is a validated opportunity: a problem worth solving, for a specific user segment, with measurable success criteria, and evidence of demand — or a clear "no go" decision that saves sprint capacity.

```
[Trigger: Uncertain opportunity or new problem space]
    │
    ▼
STEP 01: Problem Framing (PM)
    │  Gate: Problem clearly articulated, evidence gathered
    ▼
STEP 02: Market & User Research (PM + STRATEGIST + MARKET-ANALYST)
    │  Gate: Sufficient evidence synthesized
    ▼
STEP 03: Opportunity Sizing (ANALYTICS + PM)
    │  Gate: Market size and success metrics defined
    ▼
STEP 04: Assumption Mapping (PM + ARCH)
    │  Gate: Core assumptions identified and ranked by risk
    ▼
STEP 05: Validation Plan (PM)
    │  Gate: Validation experiments defined
    ▼
STEP 06: Go/No-Go Decision (PM + STRATEGIST)
    │  Gate: Decision documented with rationale
    ▼
[Output: validated-opportunity.md or no-go-decision.md]
```

---

## Step Definitions

### STEP 01: Problem Framing
**Agent:** `pm-agent`
**Instructions:**
- Write problem statement in this format: "[User type] struggle to [do X] when [context], causing [impact]"
- Gather existing evidence: support tickets, user interviews, usage data, NPS comments
- Identify competing problems (what else could we solve instead?)
- Set the discovery goal: what question must be answered to make a go/no-go decision?

**Output:** `prds/discovery/<date>-<slug>-problem-frame.md`

**Gate:**
- [ ] Problem stated without a solution embedded
- [ ] Evidence cited (not assumed)
- [ ] Discovery question articulated

---

### STEP 02: Market & User Research
**Agent:** `pm-agent` + `strategist-agent` + `market-analyst-agent`
**Instructions (PM):**
- Conduct or synthesize user interviews (3-5 minimum)
- Map the current user journey and identify friction points
- Identify who has this problem most acutely

**Instructions (Strategist):**
- Assess competitive landscape: who else solves this?
- Identify differentiation opportunities

**Instructions (Market Analyst):**
- Scope the addressable market
- Identify market trends relevant to this problem

**Output:** `wiki/research/<date>-<slug>-research-synthesis.md`

**Gate:**
- [ ] At least 3 user data points synthesized
- [ ] Competitive landscape mapped
- [ ] Target user segment defined with specificity

---

### STEP 03: Opportunity Sizing
**Agent:** `analytics-agent` + `pm-agent`
**Instructions:**
- Calculate TAM/SAM/SOM if new market, or affected user % if existing product
- Define what a "win" looks like quantitatively
- Estimate value of the opportunity (revenue, retention, engagement)

**Output:** `analytics/<date>-<slug>-opportunity-sizing.md`

**Gate:**
- [ ] Quantitative opportunity defined
- [ ] Success metrics drafted (will be refined in PRD)
- [ ] North star metric identified

---

### STEP 04: Assumption Mapping
**Agent:** `pm-agent` + `architect-agent`
**Instructions:**
- List all assumptions the opportunity depends on
- Rate each: (high | medium | low) risk × (validated | unvalidated)
- Focus validation effort on HIGH risk + UNVALIDATED assumptions

**Assumption categories:**
- Desirability: Do users want this?
- Viability: Can we build a sustainable business around it?
- Feasibility: Can we build it?
- Usability: Can users successfully use it?

**Output:** `prds/discovery/<date>-<slug>-assumptions.md`

**Gate:**
- [ ] All core assumptions mapped
- [ ] Riskiest assumption identified
- [ ] Validation method for riskiest assumption specified

---

### STEP 05: Validation Plan
**Agent:** `pm-agent`
**Instructions:**
- Define the minimum experiments needed to validate riskiest assumptions
- Select validation methods: landing page test, prototype test, concierge, smoke test, interviews
- Set success criteria for each experiment
- Estimate time and cost

**Output:** `prds/discovery/<date>-<slug>-validation-plan.md`

---

### STEP 06: Go/No-Go Decision
**Agent:** `pm-agent` + `strategist-agent`
**Instructions:**
- Review all discovery evidence
- Apply the go/no-go criteria (defined in Step 01)
- Make a recommendation: GO (into feature-development workflow) | NO-GO (document why) | PIVOT (new direction)
- Document rationale, dissenting views, and what would change the decision

**Output:** `wiki/decisions/<date>-<slug>-discovery-decision.md`

**Gate:**
- [ ] Decision documented with explicit rationale
- [ ] Evidence cited
- [ ] Next step clear (workflow trigger or backlog item)

---

## Output Types

**GO decision** → triggers `feature-development` workflow with discovery artifacts as input
**NO-GO decision** → archived to `wiki/decisions/` with rationale (valuable for future reference)
**PIVOT** → discovery loop restarts with new problem frame
