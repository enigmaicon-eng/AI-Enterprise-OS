# Execution Preference Accumulation
**ID:** AC-IE-003 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Models how execution preferences form, accumulate, and influence future execution decisions for individual agents. An execution preference is an evidence-backed operational tendency that has been validated as improving outcomes for a specific agent in a specific context.

---

## Preference Formation Model

```
A preference forms when:
  1. An agent makes the same choice in similar contexts multiple times (≥ 3 observations)
  2. That choice consistently correlates with better outcomes (effect_size > 0.15)
  3. The preference is scoped to a specific context class (not applied universally)
  4. The preference does not conflict with active governance constraints

A preference is REJECTED when:
  - It would override a governance constraint
  - It affects T3/T4 decision authority
  - It generalizes across context classes with < 0.60 accuracy
  - Confidence falls below 0.65 at time of proposal
```

---

## Preference Vector Structure

```yaml
preference_vector_entry:
  preference_id: string              # PV-{agent_id}-{domain}-{NNN}
  preference_type:
    TOOL_SELECTION       # preference for specific tools in specific contexts
    DELEGATION_PATTERN   # tendency to delegate vs. execute certain task types
    OUTPUT_FORMAT        # preferred output structure for specific deliverable types
    SEQUENCING           # preferred ordering of sub-tasks within execution
    VERIFICATION_DEPTH   # depth of self-verification before delivering output
    CONTEXT_LOADING      # which context sources to prioritize loading first
  context_class: string              # when does this preference apply?
  preferred_choice: string           # what choice does this preference encode?
  alternative_considered: string     # what was the alternative?
  effect_size: float                 # outcome improvement [0.0, 1.0]
  observation_count: int             # how many times this was observed
  confidence: float                  # [0.0, 1.0]
  activated_at: ISO8601
  last_updated: ISO8601
  status: ACTIVE | UNDER_REVIEW | RETIRED
```

---

## Preference Application Protocol

```
BEFORE EXECUTION:
  1. Load agent identity profile (including preference_vector)
  2. For each active preference: check if current context matches preference's context_class
  3. If context matches: apply preference as a weighted suggestion to execution
     - Preference does not mandate the choice; it weights the options
     - Preference weight = confidence × effect_size
     - If multiple preferences apply: they are additive, not overriding

DURING EXECUTION:
  4. Agent executes with preferences as weighted inputs
  5. Track: which preferences were applied; what choices were made

AFTER EXECUTION:
  6. Evaluate: did applied preferences contribute to positive outcomes?
     - Outcome improved vs. baseline → preference reinforced
     - Outcome unchanged → preference weight slightly decayed
     - Outcome degraded → preference flagged for review; confidence decayed -0.10
  7. Update preference_vector with new observation
```

---

## Preference Lifecycle

```
CANDIDATE → PROPOSED → VALIDATED → ACTIVE → UNDER_REVIEW → RETIRED

CANDIDATE: 1-2 observations; not yet active; being monitored
PROPOSED:  3+ observations; proposed for activation; confidence check pending
VALIDATED: confidence ≥ 0.65, effect_size > 0.15; ready for activation
ACTIVE:    being applied to execution; outcomes monitored
UNDER_REVIEW: effectiveness declining or anomaly detected; not applied until cleared
RETIRED:   preference no longer valid; preserved in history but not applied
```

---

## Preference Diversity and Coverage

```
A healthy preference vector:
  - Has preferences across multiple context classes (not over-concentrated)
  - Does not have conflicting preferences for the same context class
  - Total active preferences: typically 5–20 (more than 30 suggests over-fitting)
  - Coverage: at least one preference for the agent's primary domain

Preference concentration check (weekly):
  - If > 40% of preferences are for same context class → flag for review
  - Concentrated preferences may indicate the agent is being over-exposed to
    one task type; routing diversification may be appropriate
```

---

## Governance

- Preference accumulation is bounded: no preference may override a governance constraint
- Preferences affecting escalation behavior require T3 review before activation (per governance.md P5)
- Preference rollback: any individual preference can be retired by T3 command
- Preference transparency: any human reviewer can retrieve full preference vector for any agent
