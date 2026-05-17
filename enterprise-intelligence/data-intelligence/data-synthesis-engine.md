# Data Synthesis Engine

## Role
Generates structured analytical outputs, summaries, and intelligence reports from raw OS data using AI. Bridges the gap between raw data and actionable human insight — producing weekly digests, sprint analysis, executive summaries, trend narratives, and on-demand data stories.

## Synthesis Types

```
TYPE                     AUDIENCE     CADENCE       AI MODEL
──────────────────────────────────────────────────────────────────────────
EXECUTIVE_SUMMARY        T4+          Weekly        claude-sonnet-4-6
SPRINT_INTELLIGENCE      T2+          Per sprint    claude-sonnet-4-6
QUALITY_NARRATIVE        T2+          Daily         claude-haiku-4-5-20251001
ANOMALY_DIGEST           T2+          Daily         claude-haiku-4-5-20251001
PATTERN_INSIGHT          T3+          Weekly        claude-sonnet-4-6
COMPLIANCE_SUMMARY       DPO/T4+      Monthly       claude-sonnet-4-6
INCIDENT_SYNTHESIS       T3+          Per incident  claude-sonnet-4-6
DATA_STORY               Any          On-demand     claude-sonnet-4-6
```

## Synthesis Protocol

```
SYNTHESIS PIPELINE:
  1. DATA COLLECTION
     - Identify required entities + metrics for synthesis type
     - Verify quality tier: SILVER minimum (GOLD for EXECUTIVE_SUMMARY)
     - Apply time window (daily/weekly/sprint-aligned)
  
  2. CONTEXT ASSEMBLY
     - Include: prior synthesis for comparison
     - Include: known events (deployments, incidents, sprints)
     - Include: relevant patterns from pattern-recognition-engine.md
     - Max context: 50K tokens (clip oldest history if exceeded)
  
  3. AI SYNTHESIS (model per synthesis type)
     - System prompt: role + output format + quality standards
     - Input: assembled data + context
     - Output format: structured markdown with explicit sections
     - Temperature: 0.3 (low variance; consistent reporting style)
  
  4. QUALITY VALIDATION
     - Factual check: all quantitative claims cross-verified against source data
     - Hallucination check applied
     - Completeness check: all required sections present
     - IF quality < 0.80: retry once with expanded context; else escalate to human
  
  5. DELIVERY
     - Push to event bus: enterprise.synthesis.{type}
     - Store in knowledge-management system
     - Notify intended audience
     - Retain: per synthesis type retention policy (EXECUTIVE_SUMMARY: 3yr)
```

## Synthesis Output Schema

```yaml
synthesis_output:
  synthesis_id: string
  type: SYNTHESIS_TYPE
  generated_at: ISO8601
  time_window: {from: ISO8601, to: ISO8601}
  
  quality:
    factual_accuracy_score: number
    completeness_score: number
    hallucination_check: CLEAN | FLAGGED
    human_reviewed: boolean
  
  content:
    title: string
    executive_summary: string    # 3–5 sentence overview
    sections: [{heading, body}]  # structured content
    key_metrics: [{name, value, trend, interpretation}]
    recommendations: [{priority, action, rationale}]
    data_sources: [entity_id]    # sources used; enables traceability
  
  distribution:
    audience_tiers: [T1..T5]
    delivered_to: [user_id]
    event_bus_topic: string
```

## On-Demand Data Stories

```
REQUEST: {question, data_scope, audience_tier}

PROCESS:
  1. Interpret question → identify relevant entities
  2. Check: requestor tier >= entity tier_required for all identified entities
  3. Fetch + assemble data context
  4. Generate narrative with: answer, evidence, caveats, confidence
  5. Return synthesis + source entity list

EXAMPLES:
  "Why did deployment frequency drop last week?"
  "What's driving the increase in governance escalations?"
  "Which teams are using the most tokens this sprint?"
  "Show me the quality trend for the Jira connector data"
```

## Synthesis Quality Standards

```
EXECUTIVE_SUMMARY requirements:
  - No unsupported claims (every metric traceable to source entity)
  - YoY or MoM comparison for all key metrics
  - At least one actionable recommendation
  - Max 1000 words; min 300 words

COMPLIANCE_SUMMARY requirements:
  - Every finding linked to specific regulation + control
  - Zero tolerance for factual errors (DPO reviews before delivery)
  - Must include: open findings count, overdue findings, risk trend
```

## Persistence
`memory/data-intelligence/synthesis-registry.yaml`
`memory/data-intelligence/synthesis-history.jsonl`
`memory/data-intelligence/synthesis-quality-scores.yaml`
