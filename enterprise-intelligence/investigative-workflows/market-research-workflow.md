# Market Research Workflow

**Workflow ID:** `market-research`
**Scope:** Structured market investigation for opportunity assessment, sizing, and trend analysis
**Duration:** 2-8 hours
**Trigger:** New market exploration, opportunity validation, strategic planning, investment decision

---

## Purpose

The Market Research Workflow produces structured market intelligence through systematic evidence gathering from industry reports, buyer signals, trend data, and market structure analysis. It feeds TAM/SAM/SOM models, go-to-market decisions, and strategic planning.

---

## Workflow

```
[Market Research Mandate]
         │
         ▼
STEP 01: Market Definition
  ├─ Define market boundaries
  ├─ Identify buyer segments
  └─ Load prior market context
         │
         ▼
STEP 02: Market Sizing Evidence
  ├─ Top-down: industry reports, analyst data
  ├─ Bottom-up: buyer count × ACV signals
  └─ Value theory: problem cost estimation
         │
         ▼
STEP 03: Growth Trajectory Evidence
  ├─ Historical CAGR data
  ├─ Current velocity signals (search, investment)
  └─ S-curve positioning assessment
         │
         ▼
STEP 04: Buyer Intelligence
  ├─ Buyer persona evidence
  ├─ Purchase process mapping
  └─ Evaluation criteria research
         │
         ▼
STEP 05: Trend Signal Analysis
  ├─ Secular tailwind identification
  ├─ Cyclical headwind assessment
  └─ Wild card scenario mapping
         │
         ▼
STEP 06: Market Structure Analysis
  ├─ Value chain mapping
  ├─ Distribution channel structure
  └─ Competitive density assessment
         │
         ▼
STEP 07: Synthesis and Market Brief
  ├─ Market sizing model
  ├─ Opportunity assessment
  └─ Entry strategy signals
         │
         ▼
STEP 08: Memory Flush and Knowledge Update
```

---

## Step Definitions

### STEP 01: Market Definition

Define market scope with precision before gathering:

```markdown
Market: [Name and description]
Geographic scope: [Global | Regional | Country]
Time frame: [Current state + 3-5 year horizon]

Buyer definition:
  Who buys: [role / title / org type]
  Who uses: [if different from buyer]
  Company size range: [employee count or revenue range]

Market boundaries:
  Includes: [what's in scope]
  Excludes: [adjacent markets we're explicitly not counting]

Key questions to answer:
  1. [Market size question]
  2. [Growth trajectory question]
  3. [Buyer behavior question]
  4. [Structural question]
```

### STEP 02: Market Sizing Evidence

Run all three sizing methodologies and triangulate.

**Top-Down Evidence Gathering:**
```
Queries:
  1. "[Market name] market size [current year]"
  2. "[Market name] TAM [analyst firm]"
  3. "[Market category] industry report"
  
Extract from reports:
  - Reported market size (note methodology)
  - CAGR (note base year and projection year)
  - Segment breakdowns
  - Geographic distribution
  
Quality check:
  - Who funded the report? (vendor-funded = bias risk)
  - What is the base year for the estimate?
  - What is the methodology (primary survey vs. secondary)?
```

**Bottom-Up Evidence Gathering:**
```
Queries:
  1. "number of [buyer type] [geography]"
  2. "average contract value [market] software"
  3. "[comparable product] pricing"
  
Steps:
  1. LinkedIn: search buyer title + geography → total count estimate
  2. Review sites: extract pricing from plans + "seats" signals
  3. Public company filings: revenue per customer if public comps exist
  
Calculate:
  Bottom-up TAM = [buyer count] × [penetration rate] × [ACV]
  Penetration rate: typically 10-30% for software TAM
```

**Value Theory Evidence Gathering:**
```
Queries:
  1. "cost of [problem this solves]"
  2. "[problem] productivity loss"
  3. "[problem] compliance fine OR penalty"
  
Calculate:
  Value TAM = [number of buyers] × [problem cost] × [fraction they'd pay]
  Fraction they'd pay: typically 10-30% of problem cost for software
```

**Triangulation:**
```
| Method | TAM Estimate | Confidence | Notes |
|--------|-------------|------------|-------|
| Top-down | $XB | M | [analyst, year] |
| Bottom-up | $XB | H | [methodology] |
| Value theory | $XB | M | [problem cost source] |
| Triangulated range | $X–$YB | | |
```

### STEP 03: Growth Trajectory Evidence

```
Primary signals (gather all):
  1. Google Trends: [market terms] — note 5yr trajectory
  2. Investment velocity: Crunchbase funding in this market YoY
  3. Job posting volume: LinkedIn [market keywords] postings YoY
  4. Analyst CAGR consensus: 3+ analyst report CAGRs

Secondary signals:
  1. Conference talk volume (new conferences emerging = growth signal)
  2. Media coverage volume YoY
  3. Search volume for market category

S-curve assessment:
  - <5% penetration of TAM: Emerging
  - 5-30% penetration: Growth
  - 30-70% penetration: Mature
  - >70% penetration: Declining
```

### STEP 04: Buyer Intelligence

**Buyer Persona Evidence:**
```
Queries:
  1. "who buys [product type]" → identify buyer role
  2. "[buyer title] [problem domain] challenges"
  3. "[buyer title] priorities [current year]"
  4. "[product type] decision maker"

Extract:
  - Buyer title and seniority
  - Their success metrics (KPIs they're measured on)
  - Their pain points in this domain
  - Their current solutions / workarounds
  - Budget authority (do they control budget or need approval?)
```

**Purchase Process Mapping:**
```
Queries:
  1. "[product type] software evaluation process"
  2. "how to buy [product type]"
  3. "[product type] RFP OR procurement"
  4. "[product type] buyer journey"

Extract:
  - Number of stakeholders typically involved
  - Evaluation timeline (weeks / months)
  - Key evaluation criteria
  - Common objections / deal-blockers
  - Typical contract length and structure
```

**Evaluation Criteria Research:**
```
From G2/Capterra categories for this market:
  - Sort by "Ease of Use", "Value for Money", "Customer Support"
  - Note which dimensions have highest spread (= buyers disagree = opportunity)
  
From reviews:
  - Note most frequently cited reasons for choosing a product
  - Note most frequently cited reasons for not choosing alternatives
```

### STEP 05: Trend Signal Analysis

For each trend signal identified:

```
Signal: [description]
Type: [demand | supply | regulatory | technology | demographic]

Evidence:
  - Primary: [source with data and date]
  - Secondary: [corroborating source]
  - Velocity: [is it accelerating, stable, decelerating?]

Duration assessment:
  - Secular (structural, 5+ years): [evidence]
  - Cyclical (macro-driven, 1-2 years): [evidence]
  - Transient (<1 year): [evidence]

Our position: [ahead | aligned | behind | unaffected]
Action signal: [invest now | monitor | hedge | avoid]
```

### STEP 06: Market Structure Analysis

**Value Chain Mapping:**
```
Identify who participates in the market and where value is captured:

[Input suppliers] → [Product/Service creators] → [Distribution channels] → [Buyers]

For each node:
  - Who are the players?
  - What margin do they capture?
  - What is their power relative to adjacent nodes?
  - Where are new entrants attacking?
```

**Competitive Density:**
```
Market leader concentration:
  - Number of players with >10% market share: [N]
  - Top 3 player combined share: [%]
  - Herfindahl–Hirschman Index category: [Highly concentrated | Concentrated | Competitive]

Entry barrier assessment:
  - Capital requirements: [Low | Medium | High]
  - Switching costs for buyers: [Low | Medium | High]
  - Network effects: [None | Weak | Strong]
  - Data moat: [None | Weak | Strong]
```

### STEP 07: Synthesis and Market Brief

Produce `wiki/intelligence/[date]-[market]-market-brief.md` using the format from `research-intelligence/market-intelligence.md`.

### STEP 08: Memory Flush

Write to `intelligence-memory/`:
- Market sizing model (180-day TTL)
- Buyer intelligence (indefinite — structural)
- Trend signals (90-day TTL for cyclical, indefinite for secular)
- Value chain structure (indefinite — structural)

---

## Output: Market Brief Summary

```markdown
# Market Research Brief: [Market Name]

## Market at a Glance
| Metric | Value | Confidence |
|--------|-------|------------|
| TAM | $X (range $A–$B) | H/M/L |
| SAM | $X | H/M/L |
| CAGR | X% | H/M/L |
| S-curve stage | [stage] | H/M/L |
| Market concentration | [HHI category] | H/M/L |

## Primary Buyer: [Title/Role]
[3 sentences on who buys, why, and how]

## Top 3 Secular Tailwinds
1. [Trend] — [Evidence] — [Our position]
2. [Trend] — [Evidence] — [Our position]
3. [Trend] — [Evidence] — [Our position]

## Entry Opportunity Assessment
[White space identified, timing signals, our differentiation potential]

## Sources
[Full evidence list]
```
