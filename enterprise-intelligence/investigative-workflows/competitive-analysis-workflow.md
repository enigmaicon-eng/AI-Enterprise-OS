# Competitive Analysis Workflow

**Workflow ID:** `competitive-analysis`
**Scope:** Structured competitive investigation for a specific competitor or competitive landscape
**Duration:** 2-8 hours (competitor deep dive: 2-4h, landscape scan: 4-8h)
**Trigger:** New competitor identified, competitive threat signal, before major product decision, quarterly refresh

---

## Purpose

The Competitive Analysis workflow produces structured competitive intelligence through systematic evidence gathering across all public signal sources. It feeds battle cards, positioning decisions, and competitive response planning.

---

## Workflow

```
[Competitive Analysis Mandate]
        │
        ▼
STEP 01: Scope Definition
  ├─ Identify: target competitor(s)
  ├─ Set: analysis type (single | landscape)
  └─ Load: prior competitive context from memory
        │
        ▼
STEP 02: Product Surface Intelligence
  ├─ Scrape product page, features, pricing
  ├─ App store / marketplace presence
  └─ Integration ecosystem mapping
        │
        ▼
STEP 03: Review Mining
  ├─ G2, Capterra, Product Hunt reviews
  ├─ App store reviews
  └─ Extract: love themes, complaint themes, segment patterns
        │
        ▼
STEP 04: Changelog and Blog Analysis
  ├─ Product changelog / release notes
  ├─ Engineering and product blog
  └─ Extract: recent ships, roadmap signals, philosophy
        │
        ▼
STEP 05: Strategic Signal Gathering
  ├─ Job postings analysis (hiring = investment signals)
  ├─ Funding and financial signals
  ├─ Press and news aggregation
  └─ Social and community signals
        │
        ▼
STEP 06: Synthesis and Positioning Analysis
  ├─ Competitive positioning matrix
  ├─ Feature gap matrix
  ├─ SWOT vs. each competitor
  └─ Battle card generation
        │
        ▼
STEP 07: Threat Assessment and Recommendations
  ├─ Threat level assignment
  ├─ Time horizon mapping
  └─ Defensive response options
        │
        ▼
STEP 08: Intelligence Package + Memory Update
  ├─ Competitive brief
  ├─ Update competitor registry
  └─ Memory flush (competitive signals with TTL)
```

---

## Step Definitions

### STEP 01: Scope Definition

**Agent:** `research-intelligence/competitive-intelligence.md`

Define scope before gathering:
```markdown
Analysis Type: [Single competitor | Competitive landscape | Feature gap analysis | Threat signal]
Target: [Competitor name(s) or landscape description]
Context: [What decision this informs]
Prior investigations: [Link to any prior competitive briefs]
Depth: [Shallow (2h) | Standard (4h) | Deep (8h)]
```

Load from `intelligence-memory/`:
- Prior competitor cards
- Stale signals needing refresh
- Open threads on this competitor

### STEP 02: Product Surface Intelligence

**Queries to run (concurrent):**
```
1. "[Competitor] features 2024"               → homepage/features page
2. "[Competitor] pricing"                      → pricing page
3. "[Competitor] integrations OR API"          → ecosystem
4. "[Competitor] vs [us] OR comparison"        → how they position vs us
5. site:[competitor.com] changelog OR updates  → release cadence
```

**Extract:**
- Core value proposition (from homepage hero)
- Feature list (features page or comparison page)
- Pricing tiers (exact pricing if public, "custom" if not)
- Integration list (their ecosystem breadth)
- Target segments (from messaging and use case pages)

### STEP 03: Review Mining

**Queries to run (concurrent):**
```
1. "[Competitor] reviews" → G2, Capterra
2. "[Competitor] Product Hunt"
3. "[Competitor] alternatives Reddit"
4. "[Competitor] [app store] reviews" (if consumer)
```

**Extract from reviews:**
- Top 5 most praised features / capabilities
- Top 5 most complained-about limitations
- Most common comparison points ("better than X because...")
- Segment patterns (which user types love / hate)
- Price sensitivity signals ("too expensive for...")
- Support quality signals

**Review Mining Template:**
```
Source: G2 | Capterra | Product Hunt | App Store | Reddit
Sample size: [N reviews analyzed]
Date range: [timeframe]
Rating: [average]

Love themes (mentioned by ≥20% of reviewers):
  - [Theme] — [Example quote]

Complaint themes (mentioned by ≥20% of reviewers):
  - [Theme] — [Example quote]

Segment patterns:
  - [Segment] uses for [use case] and [loves/hates] [aspect]
```

### STEP 04: Changelog and Blog Analysis

**Queries to run:**
```
1. "[Competitor] changelog"
2. "[Competitor] what's new"
3. "[Competitor] engineering blog"
4. "[Competitor] product update 2024"
```

**Extract:**
- Last 10 product changes (date + feature)
- Inferred roadmap themes (what areas are they investing in?)
- Philosophy shifts (new principles, new target segments)
- Engineering investment signals (blog posts reveal deep work)

### STEP 05: Strategic Signal Gathering

**Job Posting Analysis:**
```
Query: site:linkedin.com "[Competitor]" jobs
       OR "[Competitor] careers"
Extract:
  - Volume by department (Engineering / Sales / Marketing / Product)
  - New/unusual roles (signal new directions)
  - Geographic expansion (new city/country hires)
  - Seniority level shift (senior hiring = execution, junior = scaling)
```

**Funding and Financial:**
```
Query: "[Competitor] funding 2024"
       "[Competitor] revenue"
       "[Competitor] valuation"
Extract:
  - Last funding round (date, amount, investors)
  - Total raised
  - Public revenue signals if available
  - Runway estimate (if startup)
```

**Press and News:**
```
Query: "[Competitor]" site:techcrunch.com OR site:venturebeat.com
       "[Competitor] announcement"
       "[Competitor] partnership"
       "[Competitor] acquisition"
Extract:
  - Major announcements (partnerships, acquisitions, new markets)
  - Executive changes (leadership = strategy shifts)
  - Regulatory or legal signals
```

### STEP 06: Synthesis and Positioning Analysis

**Positioning Matrix:**
Map competitor(s) on 2 axes relevant to the mandate:
- Default axes: Price (Low→High) × Capability Breadth (Narrow→Wide)
- Adjust axes based on what matters for the specific decision

**Feature Gap Matrix:**
For a specific capability domain:
| Feature | Us | Competitor A | Competitor B | Gap Direction |
|---------|-----|------------|--------------|--------------|
[table with ✓, ✗, ~ (partial)]

**Battle Card (per competitor):**
```markdown
## Battle Card: [Competitor]

**Headline:** [How to position against them in one sentence]

**Win themes (evidence-backed):**
- [Feature/advantage] → [Evidence from reviews or product analysis]

**Lose themes (evidence-backed):**
- [Feature/advantage they have] → [Evidence]

**When they come up:**
[Typical sales context, segment, deal size]

**Discovery questions:**
- "[Question to uncover their pain with competitor]"

**Our key differentiators:**
1. [Differentiator] → [Proof point]

**Their vulnerabilities:**
1. [Vulnerability] → [Evidence from their reviews]

**What to avoid saying:**
- [Claim that sounds good but isn't defensible]
```

### STEP 07: Threat Assessment

For each competitor, assign:

```
Threat Profile: [Competitor]
  Overall threat level: [Critical | High | Medium | Low | Monitor]
  
  Time horizon breakdown:
    Immediate (0-3 months): [specific threat]
    Near-term (3-6 months): [inferred from roadmap signals]
    Strategic (6-12 months): [inferred from hiring and funding]
  
  Our strongest defensive positions:
    1. [Position] — [Why competitor can't easily match]
  
  Our most exposed positions:
    1. [Exposure] — [Why we're vulnerable here]
  
  Recommended responses:
    Immediate: [action]
    Near-term: [action]
```

### STEP 08: Intelligence Package + Memory Update

**Intelligence Package:** `wiki/intelligence/[date]-[competitor]-competitive-brief.md`

**Competitor Registry Update:**
Update the competitor card in `intelligence-memory/competitive-signals.jsonl`:
- Refresh all fields with new evidence
- Update "Last Updated" timestamp
- Set TTL on time-sensitive signals

**Memory Flush:**
Write competitive signals with TTL:
- Pricing: 30-day TTL
- Feature list: 30-day TTL
- Strategic signals: 90-day TTL
- Structural facts: 12-month TTL

---

## Output Format

```markdown
# Competitive Intelligence Brief: [Competitor / Landscape]

**Date:** [date]
**Scope:** [single competitor | landscape]
**Confidence:** [0.0–1.0]

## Quick Assessment
| Metric | Value |
|--------|-------|
| Threat Level | [Critical/High/Medium/Low] |
| Market Position | [Leader/Challenger/Follower/Niche] |
| Momentum | [Accelerating/Stable/Declining] |
| Our Position vs. Them | [Stronger/Parity/Weaker] |

## Product Intelligence
[Surface intelligence summary]

## Review Intelligence
[Love/complaint themes with evidence]

## Strategic Signals
[Job postings, funding, news synthesis]

## Competitive Positioning Matrix
[Matrix]

## Feature Gap Analysis
[Gap matrix for relevant domain]

## Battle Cards
[Per-competitor battle cards]

## Threat Assessment
[Threat profiles]

## Recommended Actions
[Prioritized response options]
```
