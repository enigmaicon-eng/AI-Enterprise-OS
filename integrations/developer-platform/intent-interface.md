# Intent Interface

## Role
Natural language interface layer that translates human intent statements into structured OS workflow submissions. Enables non-technical operators and executives to interact with the OS using plain language without knowledge of workflow types, agent IDs, or routing rules.

## Intent Translation Pipeline

```
HUMAN INPUT (natural language)
      ↓
[1] INTENT CLASSIFICATION
      ↓
[2] PARAMETER EXTRACTION
      ↓
[3] AMBIGUITY RESOLUTION (interactive if needed)
      ↓
[4] PERMISSION CHECK (caller tier vs. workflow class)
      ↓
[5] WORKFLOW CONSTRUCTION
      ↓
STRUCTURED WORKFLOW SUBMISSION → OS orchestrator
```

## Intent Classification

### Intent Taxonomy
```
CATEGORY            EXAMPLES                                        WORKFLOW_CLASS
─────────────────────────────────────────────────────────────────────────────────────
BUILD               "build a feature for X", "create Y"             STANDARD
DISCOVER            "research X", "what do we know about Y"         STANDARD
DECIDE              "should we build X", "what's the tradeoff"      ELEVATED
REVIEW              "review the architecture for X"                 ELEVATED
RELEASE             "release X to production"                       RELEASE
INCIDENT            "there's a problem with X", "!incident"         ELEVATED
PLAN                "plan sprint N", "prioritize backlog"           STANDARD
GOVERN              "run compliance check", "review risk for X"     COMPLIANCE
ANALYZE             "why is X happening", "what's the trend for Y"  STANDARD
```

### Classification Model
```
METHOD: keyword extraction + semantic similarity to intent templates
CONFIDENCE_THRESHOLD: 0.75 to proceed; below → clarification prompt
AMBIGUITY: if top-2 intents within 0.10 of each other → ask to clarify
```

## Parameter Extraction

```
FROM INTENT STATEMENT, EXTRACT:
  subject:        what/who is the focus (feature name, system, person)
  action:         what should happen
  constraints:    any stated constraints ("within 2 days", "for mobile only")
  context:        referenced prior work, documents, or decisions
  urgency:        "urgent", "ASAP", "whenever", "by Friday" → mapped to Priority
  scope:          "quick look", "thorough analysis", "full review" → depth signal
```

## Ambiguity Resolution

When parameters are underspecified:
```
PROMPT STYLE: specific, single-question clarification
EXAMPLE:
  Input: "review authentication"
  Extracted: subject=authentication, action=review
  Missing: review_type (security? architecture? code?)
  Clarification: "What kind of review — security audit, architecture review, or code review?"

MAX CLARIFICATION ROUNDS: 2
IF still ambiguous after 2 rounds: submit as STANDARD with subject + action; let orchestrator route
```

## Operator Shortcuts

```
SHORTCUT    EXPANDS TO
!incident   Incident response workflow; extracts description from remainder
!adr        Architecture Decision Record initiation
!prd        PRD creation workflow
!sprint     Sprint planning workflow
!release    Release workflow initiation
!research   Research intelligence workflow
!review     Architecture/security/code review (asks which)
/status     Current OS health and active workflows summary
/help       List available shortcuts and intent examples
```

## Intent → Workflow Mapping Log
```yaml
intent_translation_record:
  input: string
  classified_intent: string
  confidence: number
  parameters_extracted: {key: value}
  clarifications_needed: [string]
  final_workflow_type: string
  final_workflow_id: string
  translation_duration_ms: number
  submitted_at: ISO8601
```

## Persistence
`memory/developer-platform/intent-translations.jsonl`
