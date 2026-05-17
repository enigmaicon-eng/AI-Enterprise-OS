# Technical Investigation Workflow

**Workflow ID:** `technical-investigation`
**Scope:** Structured technical research for architecture decisions, technology evaluation, and pattern discovery
**Duration:** 2-8 hours
**Trigger:** ADR required, technology selection decision, architecture pattern research, technical risk assessment

---

## Purpose

The Technical Investigation Workflow produces evidence-backed technical intelligence for architecture and engineering decisions. It gathers production-scale evidence, evaluates technology trade-offs, and mines patterns from comparable systems.

---

## Workflow

```
[Technical Investigation Mandate]
          │
          ▼
STEP 01: Technical Question Architecture
  ├─ Define decision context
  ├─ Identify candidate options
  └─ Load prior architecture context
          │
          ▼
STEP 02: Capability Evidence Gathering
  ├─ Official documentation scan
  ├─ Feature/limitation matrix
  └─ API/integration surface mapping
          │
          ▼
STEP 03: Production Evidence Mining
  ├─ Engineering blog case studies
  ├─ Conference talk evidence
  └─ Post-mortem analysis
          │
          ▼
STEP 04: Community and Ecosystem Health
  ├─ GitHub / package registry signals
  ├─ Hiring and talent signals
  └─ Maintenance cadence assessment
          │
          ▼
STEP 05: Security and Risk Evidence
  ├─ CVE / vulnerability history
  ├─ Known failure modes
  └─ Operational complexity evidence
          │
          ▼
STEP 06: Cost Evidence Gathering
  ├─ Infrastructure cost at target scale
  ├─ Operational overhead estimates
  └─ Talent cost signals
          │
          ▼
STEP 07: Pattern Research
  ├─ Design pattern catalog for this problem type
  ├─ Reference architecture mining
  └─ Anti-pattern identification
          │
          ▼
STEP 08: Synthesis and Architecture Brief
  ├─ Technology comparison matrix
  ├─ Pattern analysis
  └─ Recommendation with evidence weight
          │
          ▼
STEP 09: ADR Input Package + Memory Flush
```

---

## Step Definitions

### STEP 01: Technical Question Architecture

```markdown
Decision Context: [What architecture decision this informs]
Decision type: [Technology selection | Pattern choice | Risk assessment | Reference mining]

Candidate options: [List 2-5 specific technologies or patterns]

Constraints (non-negotiable):
  - [Constraint 1: e.g., must run on AWS]
  - [Constraint 2: e.g., must support Python SDK]
  - [Constraint 3: e.g., open source required]

Decision criteria (weighted):
  - Capability fit: [weight]
  - Production scale evidence: [weight]
  - Operational complexity: [weight]
  - Ecosystem maturity: [weight]
  - Security posture: [weight]
  - Cost efficiency: [weight]
  - Talent availability: [weight]

Prior context:
  - Related ADRs: [link]
  - Prior technical investigations: [link]
  - Current stack: [relevant pieces]
```

### STEP 02: Capability Evidence Gathering

For each candidate technology:

```
Queries (concurrent):
  1. "[Technology] documentation"                  → official docs
  2. "[Technology] features capabilities"           → capability surface
  3. "[Technology] limitations OR does not support" → known gaps
  4. "[Technology] vs [main alternative]"           → comparison frames

Extract:
  - Core capabilities (must-have vs. nice-to-have)
  - Known limitations (documented and community-confirmed)
  - API surface (REST? SDK? CLI? GUI only?)
  - Configuration complexity (number of knobs)
  - Dependency surface (what does it require?)
```

**Capability Matrix (per option):**
| Capability | Required? | Candidate A | Candidate B | Notes |
|------------|-----------|-------------|-------------|-------|
| [Feature] | Must | ✓ | ✗ | |
| [Feature] | Should | ✓ | ~ | partial |
| [Feature] | Nice | ✗ | ✓ | |

Any "Must" requirement not met → eliminate candidate.

### STEP 03: Production Evidence Mining

High-signal sources for production evidence:

**Engineering Blogs (high credibility):**
```
Queries:
  1. "[Technology] at [scale] [company type]"
  2. "[Technology] production case study"
  3. "engineering.{stripe,uber,shopify,netflix,airbnb}.com [technology]"
  4. "highscalability.com [technology]"
  5. InfoQ "[technology]"
  6. QCon "[technology]"

Extract per case study:
  - Company (context: size, scale, domain)
  - Scale achieved (users, requests/sec, data volume)
  - Problems encountered (what broke or was hard)
  - Solution applied
  - Would they choose it again? (if mentioned)
```

**Conference Talks:**
```
Queries:
  1. "QCon [technology] [year]"
  2. "Strange Loop [technology]"
  3. "[Technology] conference talk lessons learned"

Extract:
  - Speaker company and scale context
  - Primary lessons learned
  - Failure modes encountered
  - Operational insights
```

**Post-Mortems:**
```
Queries:
  1. "[Technology] outage OR incident"
  2. "[Technology] post-mortem"
  3. "why we switched away from [technology]"

Extract:
  - Failure mode described
  - Root cause (technology-related vs. operational)
  - Whether problem is solvable or fundamental
```

**Reference Architecture:**
```
Production Evidence Summary:
  Technology: [name]
  Case studies found: [N]
  Scale evidence range: [min–max scale observed]
  Most common praise: [theme]
  Most common problem: [theme]
  Critical failures reported: [Y/N + description]
  Overall production signal: [Strong | Moderate | Weak | None]
```

### STEP 04: Community and Ecosystem Health

```
GitHub signals:
  - Stars: [N] (absolute + trend)
  - Open issues: [N] (relative to stars = health signal)
  - PR merge latency: [days] (maintenance responsiveness)
  - Last release: [date] (activity signal)
  - Contributor count: [N] (bus factor)
  - License: [license] (commercial use risk?)

Package registry:
  - npm/PyPI/Maven downloads: [N/month] (adoption volume)
  - Download trend (6-month): [growing | stable | declining]

Community:
  - Stack Overflow questions: [N] (adoption signal)
  - Resolution rate: [%] (ecosystem support quality)
  - Dedicated Discord/Slack: [Y/N] (community investment)

Hiring signals:
  - LinkedIn job postings mentioning [technology]: [N]
  - Company types posting (startup? enterprise?) → adoption segment
  - Seniority required (senior-only = immature, all levels = mature)
```

### STEP 05: Security and Risk Evidence

```
CVE history:
  Query: "[Technology] CVE" OR site:nvd.nist.gov "[technology]"
  Extract:
    - Total CVEs last 3 years: [N]
    - Critical/High severity: [N]
    - Average time to patch: [days]
    - Most common vulnerability type

Known failure modes:
  Query: "[Technology] failure mode OR pitfall"
  Extract:
    - Common operational mistakes
    - Scalability cliffs (at what point does it break?)
    - Data loss scenarios (if applicable)
    - Consistency or availability trade-offs

Operational complexity:
  Evidence: runbook length, common troubleshooting guides
  Signal: "simple" = rare troubleshooting docs; "complex" = extensive guides needed
  
Vendor dependency:
  - Open source with corporate sponsor: [who? exit risk?]
  - SaaS/proprietary: [vendor lock-in depth]
  - Standard protocol: [can switch vendors easily?]
```

### STEP 06: Cost Evidence Gathering

```
Infrastructure cost:
  Query: "[Technology] cost at scale" "[Technology] AWS/GCP/Azure pricing"
  Extract:
    - Cost at target scale (estimate 3 scenarios: low/mid/high)
    - Cost cliff signals (where does it get expensive?)
    - Cost comparison vs. main alternative

Operational overhead:
  Signal: engineering hours per month for maintenance
  Evidence: hiring signals (dedicated ops role required?)
  Evidence: community reports on ops burden

Talent cost:
  Query: "[Technology] average salary" OR LinkedIn job salary ranges
  Signal: scarcity premium for rare expertise
```

### STEP 07: Pattern Research

For the problem class this decision addresses:

```
Problem Class: [description]

Applicable patterns:
  1. [Pattern name]
     Description: [what it does]
     When to use: [conditions]
     Trade-offs: [pros/cons]
     Reference implementations: [companies using it]
     
  2. [Pattern name]
     [same structure]

Anti-patterns (what has failed in this problem class):
  1. [Anti-pattern]
     Why it fails: [evidence]
     Who learned this hard way: [company/case]
```

### STEP 08: Synthesis and Architecture Brief

Produce using `research-intelligence/architecture-intelligence.md` output format.

Run technology comparison matrix with weighted scores.

**Recommendation structure:**
```
Primary recommendation: [Technology / Pattern]
Evidence strength: [Strong | Moderate | Weak]
Key reason: [Most important evidence point]
Key condition: [What must be true for this to be right]
Confidence: [0.0–1.0]

What to investigate further:
  - [Specific proof-of-concept to run]
  - [Scale test to validate]

Watchouts:
  - [Risk 1 with mitigation]
  - [Risk 2 with mitigation]
```

### STEP 09: ADR Input Package

Produce a structured input for the ADR author:

```markdown
# ADR Input Package: [Decision]

**Evidence weight:** [Strong | Moderate | Weak]
**Recommended option:** [Technology/Pattern]
**Confidence:** [0.0–1.0]

## Decision Context
[What the ADR is deciding and why]

## Options Evaluated
[Brief description of each, with elimination reason for discarded options]

## Evidence Summary
[Key evidence for and against each option]

## Recommendation
[Recommended option with rationale]

## Key Risks and Mitigations
[Top 3 risks with mitigation approach]

## Production References
[Companies using recommended option at comparable scale]

## What to Validate Before Committing
[Proof-of-concept or spike to run]
```

---

## Output Destinations

- `wiki/intelligence/[date]-[topic]-technical-brief.md` — full technical brief
- `docs/governance/adr-[number]-[slug].md` — ADR (written by architect, using this as input)
- `intelligence-memory/` — technology evaluation data with 3-month TTL
