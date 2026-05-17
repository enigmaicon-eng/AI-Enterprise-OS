# Architecture Workflow

```
workflow_id:    architecture-workflow
version:        1.0.0
trigger:        "architecture for", "design the system", "ADR", "RFC", "technical decision", "how should we build", "scale this", "data model", "API design", "we need to decide technically"
intent_class:   ARCH
total_steps:    10
typical_duration: 2–5 business days
state_file:     memory/workflow-state/arch-{slug}.yaml
```

---

## Purpose

Translate requirements into validated technical architectures with documented decisions. Ensure every significant technical choice is recorded as an ADR before engineering begins. Prevent architectural drift through governance.

**Rule:** No Tier-L engineering work begins without an accepted ADR. No system handling user data is designed without security-agent threat model review.

---

## Routing Entry Points

```
IF intent contains "ADR" OR "architecture decision" OR "we need to decide technically"
  THEN → architecture-workflow (direct-to-ADR path: skip Steps 01–03a)

IF intent contains "design the system" OR "architecture for" OR "how should we build"
  AND approved PRD exists
  THEN → architecture-workflow (full path)

IF intent contains "RFC" OR "proposal for" OR "technical proposal"
  THEN → architecture-workflow (RFC path: adds RFC review phase)

IF intent contains "scale this" OR "performance" OR "bottleneck"
  THEN → architecture-workflow (optimization path: focuses on non-functional requirements)

IF intent contains "data model" OR "database schema" OR "API design"
  THEN → architecture-workflow (design artifact path: produces spec, may skip ADR if reversible)
```

**Incoming from other workflows:**
- `product-discovery` GO decision → architecture-workflow starts
- `feature-development` Step 02a → architecture-workflow (embedded)
- `engineering-workflow` identifies Tier-L work → escalates to architecture-workflow

---

## Workflow Paths

```
PATH A: Full Design (new systems, major components)
  Steps: 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10

PATH B: ADR-Only (decision needed, system context exists)
  Steps: 01 → 04 → 05 → 06 → 07 → 09 → 10

PATH C: RFC (major proposal, needs community review)
  Steps: 01 → 02 → 03 → 04 → 05 → 06 → RFC-REVIEW → 07 → 09 → 10

PATH D: Design Artifact (reversible design, no ADR needed)
  Steps: 01 → 02 → 03 → 08 → 10
```

---

## Agent Sequence

```
STEP 01  architect-agent               Request Intake & Path Selection
STEP 02  architect-agent               Context Analysis & Constraints
STEP 03  architect-agent               Option Generation (≥ 3 options)
STEP 04  security-agent                Security & Threat Assessment     ┐ parallel
STEP 04b engineer-agent                Feasibility Review               ┘
STEP 05  architect-agent               Option Analysis & Scoring
STEP 06  architect-agent               Decision Recommendation
STEP 07  architect-agent               ADR / RFC Drafting
STEP 08  architect-agent               Design Artifact Production (if PATH A/C/D)
STEP 09  supervisor-agent              Architecture Gate Review
STEP 10  architect-agent               Implementation Guidance & Wiki Update
```

---

## Step Specifications

---

### STEP 01 — Request Intake & Path Selection

**Agent:** `architect-agent`
**Time budget:** 30 minutes

**Instructions:**
1. Read the trigger request and any referenced artifacts (PRD, discovery decision)
2. Check `architecture/decisions/` — do relevant ADRs already exist?
3. Check `wiki/architecture/` — is there existing system context?
4. Classify the request:
   - Is this a **new design** (no system exists)? → PATH A
   - Is this a **specific decision** (system exists, decision needed)? → PATH B
   - Is this a **major proposal** affecting multiple teams/systems? → PATH C
   - Is this a **reversible design artifact** (API spec, data model, no hard decisions)? → PATH D
5. Identify the Tier:
   - `TIER_L`: architectural changes, security systems, data migrations, cross-service APIs
   - `TIER_M`: feature-level design, single-service changes, internal APIs
6. Assign ADR number if this will produce an ADR (check `architecture/decisions/README.md` for next number)

**Artifact:**
```
path:   architecture/{date}-{slug}-intake.md
schema:
  path: A | B | C | D
  tier: TIER_L | TIER_M
  input_artifacts: [paths to PRD, discovery decision, etc.]
  existing_adrs_relevant: [ADR-NNN paths or "none"]
  existing_system_context: [wiki paths or "none"]
  adr_number_reserved: ADR-NNN | null
  decision_question: string    # "Should we use X or Y for Z?"
  deadline: date | null
  blocking: [string]           # What work is blocked until this is done
```

**Gate (self-check):**
- [ ] Path selected with reasoning
- [ ] Existing ADRs checked (not skipped)
- [ ] Decision question is singular and specific (not compound)
- [ ] ADR number reserved if applicable

---

### STEP 02 — Context Analysis & Constraints

**Agent:** `architect-agent`
**Time budget:** 2–4 hours
**Applies to:** PATH A, C

**Instructions:**
1. Load and synthesize relevant context:
   - PRD: what are the functional requirements?
   - Non-functional requirements: scale, latency, availability, cost, security
   - Existing system architecture from `wiki/architecture/`
   - Team capability constraints (what does the team know well vs. not?)
   - Timeline constraints
2. Map system boundaries:
   - What systems/services will this component interact with?
   - What data will flow in/out?
   - Where are the trust boundaries?
3. Identify hard constraints (cannot be traded off):
   - Regulatory requirements
   - Existing contracts or SLAs
   - Immovable dependencies
4. Identify soft constraints (can be traded off):
   - Timeline, cost, team skill

**Artifact:**
```
path:   architecture/{date}-{slug}-context.md
schema:
  functional_requirements: [string]
  non_functional_requirements:
    scale: string
    latency: string
    availability: string
    cost: string
    security_classification: public | internal | confidential | restricted
  system_boundaries:
    upstream_dependencies: [string]
    downstream_dependencies: [string]
    data_flows: [string]
    trust_boundaries: [string]
  hard_constraints: [string]
  soft_constraints: [string]
  team_capabilities:
    strong: [string]
    weak_or_unknown: [string]
```

---

### STEP 03 — Option Generation

**Agent:** `architect-agent`
**Time budget:** 2–4 hours
**Rule:** Minimum 3 options. Always include "do nothing / status quo" as one option.

**Instructions:**
1. Generate at least 3 architecturally distinct options (not variations of one approach)
2. For each option, produce:
   - Brief description (what it is)
   - Architecture sketch (components + interactions in text/ASCII)
   - Pros and cons
   - Alignment with hard constraints
   - Estimated implementation complexity (S/M/L/XL)
   - Operational complexity (simple/moderate/complex)
   - Reversibility (easy/hard/irreversible)
3. **Anti-strawman rule:** Each option must be a genuinely viable approach. No "option 3 that obviously won't work."
4. Identify the **recommended option** with reasoning (this is a hypothesis, not a final decision)

**Artifact:**
```
path:   architecture/{date}-{slug}-options.md
schema:
  options:
    - id: OPT-A
      name: string
      description: string
      architecture_sketch: string   # ASCII or Mermaid diagram
      pros: [string]
      cons: [string]
      hard_constraint_alignment: passes | conflicts | partial
      implementation_complexity: S | M | L | XL
      operational_complexity: simple | moderate | complex
      reversibility: easy | hard | irreversible
      estimated_cost: string
    - id: OPT-B
      ...
    - id: OPT-C (status_quo or do_nothing):
      ...
  recommendation: OPT-X
  recommendation_rationale: string
```

**Gate (checklist):**
- [ ] Minimum 3 distinct options
- [ ] Status quo / do-nothing option included
- [ ] No option is a strawman
- [ ] Reversibility rated for each option
- [ ] Recommendation is a hypothesis, not a decree

---

### STEP 04 — Security & Threat Assessment [PARALLEL]

**Agent:** `security-agent`
**Time budget:** 4–8 hours
**Trigger:** Always for TIER_L; always if system handles Confidential/Restricted data; conditional for TIER_M

**Instructions:**
1. Apply STRIDE to the top 2 candidate options from Step 03
2. For each option, identify:
   - Critical threats (would choose this option)
   - High threats (require mitigation)
   - Mitigations for each critical/high threat
3. Determine if any option has **unacceptable security risk** (eliminates it from consideration)
4. For the recommended option, specify required security controls

**Artifact:**
```
path:   architecture/security/{date}-{slug}-arch-security.md
schema:
  options_reviewed: [OPT-A, OPT-B]
  stride_analysis:
    - option: OPT-A
      spoofing: [{threat, severity, mitigation}]
      tampering: [{threat, severity, mitigation}]
      repudiation: [{threat, severity, mitigation}]
      information_disclosure: [{threat, severity, mitigation}]
      denial_of_service: [{threat, severity, mitigation}]
      elevation_of_privilege: [{threat, severity, mitigation}]
      eliminated: true | false
      elimination_reason: string | null
  recommended_option_security_controls: [string]
  security_verdict: approved | conditional | blocked
  conditions: [string]  # If conditional
```

**Gate (checklist):**
- [ ] STRIDE completed on top 2 options
- [ ] Critical and high threats identified
- [ ] No option approved without mitigation plan for all critical threats
- [ ] Security verdict issued

---

### STEP 04b — Engineering Feasibility Review [PARALLEL]

**Agent:** `engineer-agent`
**Time budget:** 2–4 hours

**Instructions:**
1. Review each option in Step 03 for implementability by the current team
2. Identify hidden complexity (often in the cons list of an option)
3. Flag unrealistic timeline assumptions
4. Identify missing technical details that would block implementation
5. Rate each option: `implementable` | `implementable-with-risk` | `infeasible`

**Artifact:**
```
path:   architecture/{date}-{slug}-feasibility.md
schema:
  options:
    - id: OPT-A
      rating: implementable | implementable_with_risk | infeasible
      hidden_complexity: [string]
      timeline_concerns: string | null
      missing_details: [string]
      engineering_preference: OPT-X  # Which option engineering prefers
  engineering_recommendation: OPT-X
  engineering_recommendation_rationale: string
```

**PARALLEL JOIN:** Steps 04 and 04b must BOTH complete before Step 05.

---

### STEP 05 — Option Analysis & Scoring

**Agent:** `architect-agent`
**Time budget:** 2 hours
**Inputs:** Options (03), security verdict (04), feasibility review (04b)

**Instructions:**
1. Apply a weighted scoring matrix to all non-eliminated options
2. Weights are context-dependent; architect sets weights based on what matters most:

| Criterion | Default Weight | Configurable |
|-----------|---------------|-------------|
| Meets functional requirements | 20% | No |
| Security posture | 20% | No |
| Implementation complexity | 15% | Yes |
| Operational complexity | 15% | Yes |
| Reversibility | 10% | Yes |
| Scalability ceiling | 10% | Yes |
| Cost | 10% | Yes |

3. Score each option 1–5 on each criterion
4. Calculate weighted scores
5. Apply tiebreaker: if scores are within 10% of each other, prefer the more reversible option

**Artifact:**
```
path:   architecture/{date}-{slug}-scoring.md
schema:
  weights: {criterion: weight_pct}
  options_eliminated: [string]   # Eliminated in Steps 03-04
  scoring:
    - option: OPT-A
      scores: {criterion: 1-5}
      weighted_total: float
  winner: OPT-X
  runner_up: OPT-Y
  margin: float      # % difference between winner and runner-up
  tiebreaker_applied: true | false
```

---

### STEP 06 — Decision Recommendation

**Agent:** `architect-agent`
**Time budget:** 1 hour

**Instructions:**
1. Synthesize scoring, security verdict, and feasibility into a single recommendation
2. If winner contradicts security-agent or engineer-agent preference → explicitly document the conflict and resolution
3. If margin < 10% → escalate for human input (options too close to decide algorithmically)
4. Define: what would make us reconsider this decision in 6–12 months?

**Gate (self-check):**
- [ ] Recommendation aligns with security verdict (or conflict is documented)
- [ ] Recommendation aligns with feasibility verdict (or conflict is documented)
- [ ] Margin documented
- [ ] Reconsideration conditions defined

**Escalation:**
- If architect recommendation conflicts with security verdict → human review required before ADR
- If margin < 10% → human input required
- If all options are infeasible within constraints → escalate to pm-agent to revisit requirements

---

### STEP 07 — ADR / RFC Drafting

**Agent:** `architect-agent`
**Time budget:** 2–4 hours
**Template:** `templates/adr-template.md`

**Instructions for ADR (PATH A, B, C):**
1. Fill all sections of `templates/adr-template.md`
2. Status: `proposed` on creation (supervisor changes to `accepted`)
3. Consequences: must include both positive AND negative
4. Cross-reference any ADRs this supersedes or relates to

**Instructions for RFC (PATH C only):**
1. Create RFC at `rfc/{date}-{slug}.md` using `templates/rfc-template.md`
2. Set `comment-deadline` to 5 business days
3. Send handoff to all affected teams/agents for review period
4. After review period: incorporate feedback, finalize ADR from RFC

**ADR Naming:**
- File: `architecture/decisions/ADR-{NNN}-{slug}.md`
- NNN = next sequential number from `architecture/decisions/README.md`

**Artifact:**
```
path:   architecture/decisions/ADR-{NNN}-{slug}.md   [always]
path:   rfc/{date}-{slug}.md                          [PATH C only]

required_sections:
  - context (non-trivial)
  - decision (starts with "We will..." or "We have decided to...")
  - options_considered (min 3, including status quo)
  - rationale (cites scoring and security findings)
  - consequences (positive AND negative)
  - implementation_notes
  - validation
```

**Gate (checklist):**
- [ ] ADR number is sequential (no gaps or reuse)
- [ ] All required sections filled
- [ ] Consequences include negatives (not just positives)
- [ ] Options section is not a strawman exercise
- [ ] Relates-to ADRs cross-referenced
- [ ] Status: `proposed`

---

### STEP 08 — Design Artifact Production

**Agent:** `architect-agent`
**Time budget:** 2–8 hours (depends on complexity)
**Applies to:** PATH A, C (full system design) and PATH D (design artifacts without ADR)

**Artifacts to produce (as applicable):**

**System Design Document:**
```
path:   architecture/{slug}.md
sections:
  - overview (purpose, users, scale)
  - component diagram (ASCII or Mermaid)
  - data flow diagram
  - API boundaries (internal and external)
  - data model summary
  - deployment topology
  - non-functional specifications (latency, availability, cost)
  - operational runbook reference
  - open questions
```

**API Specification:**
```
path:   implementation/api-specs/{slug}.yaml
format: OpenAPI 3.1
required:
  - all endpoints
  - all request/response schemas
  - error responses for every endpoint
  - authentication/authorization annotations
  - rate limiting specifications
```

**Data Model:**
```
path:   architecture/data-models/{slug}.md
required:
  - entity relationship diagram
  - table/collection schemas
  - indexes and rationale
  - data classification per field
  - migration strategy
```

**Gate (checklist):**
- [ ] All components in design have defined owners/boundaries
- [ ] Data flow shows all data and who handles it
- [ ] Every external API has a contract (no "we'll figure it out")
- [ ] Non-functional specs are numbers (not "fast" or "scalable")
- [ ] Open questions listed with owners

---

### STEP 09 — Architecture Gate Review

**Agent:** `supervisor-agent`
**Inputs:** ADR + (design artifact if applicable) + security verdict + feasibility verdict

**Supervisor criteria for ARCH output:**

```
ADR QUALITY
  ✓ Decision is specific and actionable
  ✓ Options genuinely considered (not strawmen)
  ✓ Rationale cites evidence (scoring, security findings, feasibility)
  ✓ Consequences include real negatives
  ✓ Supersedes/relates-to cross-references checked

CONSISTENCY
  ✓ Does not contradict existing accepted ADRs
  ✓ Consistent with system architecture in wiki/architecture/
  ✓ Security controls match security-agent requirements

COMPLETENESS (if design artifact)
  ✓ All components have defined interfaces
  ✓ No "TBD" in critical fields
  ✓ Operational concerns addressed

ENGINEERING READINESS
  ✓ Engineer-agent could start implementation from this artifact
  ✓ No ambiguous requirements remaining
```

**Verdict → Action:**
- `APPROVED` → ADR status changes from `proposed` to `accepted`; emit handoff to engineering
- `CONDITIONAL` → architect-agent addresses specific items; re-review
- `REJECTED` → architect-agent re-does specific steps

---

### STEP 10 — Implementation Guidance & Wiki Update

**Agent:** `architect-agent`
**Time budget:** 1–2 hours

**Instructions:**
1. Update `architecture/decisions/README.md` ADR index with new entry
2. Update `wiki/architecture/overview.md` if system topology changed
3. Create implementation guidance for `engineer-agent`
4. If this ADR supersedes another: update the superseded ADR status field
5. Post-implementation review trigger: set a calendar reminder (or note in memory) to review the decision after implementation is complete

**Wiki updates:**
```
wiki/architecture/overview.md           ← Update if topology changed
architecture/decisions/README.md        ← Add ADR to index
wiki/decisions/{slug}.md                ← Decision summary (human-readable)
wiki/index.md                           ← Update "Recently Updated"
```

**Handoff to engineering:**
```yaml
handoff:
  from: architecture-workflow
  to:   engineer-agent
  via:  engineering-workflow

  artifacts:
    adr:            "architecture/decisions/ADR-{NNN}-{slug}.md"
    system_design:  "architecture/{slug}.md"           (if PATH A/C)
    api_spec:       "implementation/api-specs/{slug}.yaml"  (if applicable)
    data_model:     "architecture/data-models/{slug}.md"    (if applicable)

  decisions_made:
    - "Architecture: {ADR title} — see ADR-{NNN}"
    - "API contract: finalized — see api-specs/{slug}"

  constraints_for_engineering:
    - "{hard constraint from ADR}"
    - "Security controls required: {list from Step 04}"

  explicitly_excluded:
    - "Revisiting the architectural approach (ADR accepted)"
    - "Changing the API contract (contract is finalized)"

  open_questions_for_engineering:
    - "{question that implementation should answer}"

  review_required_from:
    - architect-agent: "Any deviation from design requires ADR amendment"
    - security-agent: "{specific code areas needing security review}"
```

---

## Escalation Rules

| Condition | Escalation Target | Action |
|-----------|------------------|--------|
| Options exist only in TIER_L with infeasible timeline | `pm-agent` | Revisit requirements scope |
| Security verdict blocks all options | Human review | Manual resolution required |
| Scoring margin < 10% between top options | Human input | Cannot decide algorithmically |
| ADR contradicts existing accepted ADR | Human review | Explicit supersession required |
| Architect and security-agent disagree | Human review | Surface specific conflict |
| RFC review period produces unresolved objections | Human review | Stakeholder alignment meeting |
| TIER_L work attempted without ADR | Block engineering-workflow | Escalate to `architect-agent` |

---

## ADR Governance Rules

1. **Sequential numbering**: No gaps, no reuse. Next number from `architecture/decisions/README.md`.
2. **Status transitions**: `proposed` (created) → `accepted` (supervisor approved) → `deprecated` | `superseded` (when replaced)
3. **Supersession**: Never delete an ADR. Update status to `superseded-by: ADR-NNN`. Update the old ADR's `superseded-by` field.
4. **Quarterly ADR review**: `architect-agent` reviews accepted ADRs for continued relevance.

---

## Wiki Updates Per Step

| Step | Wiki Page | Update Type |
|------|-----------|------------|
| 07 | `architecture/decisions/ADR-NNN.md` | Create |
| 07 | `architecture/decisions/README.md` | Update index |
| 08 | `architecture/{slug}.md` | Create/update |
| 10 | `wiki/architecture/overview.md` | Update if topology changed |
| 10 | `wiki/index.md` | Update "Recently Updated" |

---

## Quality Metrics

| Metric | Target |
|--------|--------|
| ADR first-pass approval rate | > 75% |
| TIER_L work started without ADR | 0 |
| ADRs contradicting existing accepted ADRs | 0 |
| Security gate blocks (design stage) | < 20% |
| Time from architecture request to accepted ADR | ≤ 5 business days |
