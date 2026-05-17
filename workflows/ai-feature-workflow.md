# AI Feature Workflow

```
workflow_id:    ai-feature-workflow
version:        1.0.0
trigger:        "AI feature", "LLM", "ML feature", "use Claude", "use GPT", "AI-powered", "intelligent", "generate with AI", "recommendation engine", "classification", discovery-workflow GO with TECHNOLOGY_PUSH type
intent_class:   CROSS (PM + ARCH + ENG + QA + SECURITY)
total_steps:    14
typical_duration: 2–6 weeks (AI features require more iteration than standard features)
state_file:     memory/workflow-state/ai-feature-{slug}.yaml
```

---

## Purpose

Ship AI-powered features that are safe, reliable, measurable, and maintainable. AI features have unique failure modes (hallucination, bias, inconsistency, latency, cost, abuse vectors) that require specialized workflow steps beyond the standard feature-development workflow.

**This workflow replaces `feature-development` for any feature where AI inference is a core component.**

**Rules:**
- AI features MUST have an evaluation framework BEFORE the first line of model integration code
- AI output quality must be measurable — "it seems good" is not a quality gate
- All AI features must have a human-fallback or graceful degradation path
- AI features require security review for prompt injection, data leakage, and output abuse
- Model and prompt changes are versioned and treated as deployable artifacts

---

## AI Risk Classification

Before workflow begins, classify the feature's AI risk level:

| Risk Class | Criteria | Additional Requirements |
|-----------|---------|------------------------|
| **HIGH** | AI output directly affects decisions (medical, financial, legal, safety), is shown to external users without review, or processes sensitive PII | Human review gate, output filtering, bias audit, regulatory review |
| **MEDIUM** | AI output shown to users but with human context, or used for internal tooling | Output filtering, quality gates, monitoring |
| **LOW** | AI used for internal processing, classification, or search only | Standard evaluation, monitoring |

---

## Routing Entry Points

```
IF feature_description contains "AI" OR "LLM" OR "ML" OR "Claude" OR "generate" OR "classify"
  THEN → ai-feature-workflow

IF discovery_workflow result is GO AND opportunity_type == TECHNOLOGY_PUSH
  THEN → ai-feature-workflow

IF feature-development workflow STEP-01 identifies AI components in PRD
  THEN → redirect to ai-feature-workflow

IF AI risk class == HIGH
  THEN add: human review gate after Step 08
```

---

## Agent Sequence

```
STEP 01  pm-agent                  AI Feature Brief & Risk Classification
STEP 02  architect-agent           Model & Architecture Selection
STEP 03  security-agent            AI Security & Threat Assessment
STEP 04  analytics-agent + qa-agent  Evaluation Framework Design
STEP 05  engineer-agent            System Design & Prompt Architecture
STEP 06  ux-agent                  AI Interaction Design
STEP 07  engineer-agent            Prototype & Baseline Evaluation
STEP 08  engineer-agent            Iteration Loop (until eval targets met)
STEP 09  qa-agent + pm-agent       Human Evaluation
STEP 09H [HIGH risk only]          External/Legal Review Gate
STEP 10  security-agent            Pre-Release AI Security Review
STEP 11  analytics-agent           Monitoring & Observability Design
STEP 12  delivery-agent            Staged Rollout Planning
STEP 13  supervisor-agent          Final Gate Review
STEP 14  analytics-agent + pm-agent  Post-Launch AI Monitoring
```

---

## Step Specifications

---

### STEP 01 — AI Feature Brief & Risk Classification

**Agent:** `pm-agent`
**Time budget:** 2–4 hours
**Inputs:** Discovery GO decision (or direct feature request) + AI risk classification

**Instructions:**
1. Write the AI feature brief — different from a standard PRD because AI behavior is probabilistic:

**AI Feature Brief structure:**
- **Task definition:** What exact task is the AI performing? (Not "make it smart" — be specific: "classify user intent into one of 5 categories", "generate a draft email from bullet points")
- **User value:** How does AI output create value? What would the alternative (non-AI) experience look like?
- **Quality threshold:** What makes an AI response "good enough" for production?
- **Failure modes:** What does a bad AI response look like? How bad can it get?
- **Failure tolerance:** What's the acceptable rate of bad responses? (0.1%? 5%?)
- **Fallback behavior:** What happens when AI fails or is unavailable?
- **Human-in-the-loop:** Does a human review AI output before it reaches users?

2. Classify AI risk level (HIGH/MEDIUM/LOW per matrix above)

3. Define the evaluation criteria that will govern "done":
   - Quality metric(s) that are measurable (not subjective)
   - Target threshold (e.g., "accuracy > 85% on test set", "user approval rate > 70%")
   - Method to measure them

**Artifact:**
```
path:   prds/{date}-{slug}-ai-feature-brief.md
schema:
  task_definition: string          # Specific AI task
  user_value: string
  ai_risk_class: HIGH | MEDIUM | LOW
  quality_threshold: string        # "Response must be X"
  bad_response_definition: string  # "A bad response is..."
  failure_tolerance: string        # "Up to X% bad responses acceptable"
  fallback_behavior: string        # What happens without AI
  human_in_loop: true | false
  success_metrics:
    - metric: string
      method: string               # How to measure
      target: string               # Pass threshold
  non_goals: [string]              # What this AI feature does NOT do
```

**Gate (checklist):**
- [ ] Task definition is specific and bounded
- [ ] Bad response is explicitly defined (not left to imagination)
- [ ] Failure tolerance is a number, not "rarely" or "sometimes"
- [ ] Fallback behavior exists (AI unavailability must be handled)
- [ ] Success metrics are measurable before coding begins

---

### STEP 02 — Model & Architecture Selection

**Agent:** `architect-agent`
**Time budget:** 4–8 hours
**Inputs:** AI Feature Brief (Step 01)

**Instructions:**
1. Evaluate model options for the specific task:

| Factor | Questions |
|--------|----------|
| **Capability** | Does the model reliably perform this task? (test on 20+ examples) |
| **Latency** | What's the P99 latency? Is it acceptable for the UX? |
| **Cost** | Cost per request × expected volume = monthly cost. Acceptable? |
| **Context window** | Is the context window sufficient for the use case? |
| **Reliability** | What's the uptime SLA? What happens when it's down? |
| **Data privacy** | Does sending this data to this API comply with our privacy policy? |
| **Fine-tuning need** | Does this require a custom/fine-tuned model, or can foundation work? |
| **Vendor lock-in** | How hard is it to switch providers if needed? |

2. For Claude API specifically — apply from `claude-api` skill:
   - Select appropriate model (claude-opus-4-7 for complex reasoning, claude-sonnet-4-6 for balanced, claude-haiku-4-5 for fast/cheap)
   - Design prompt caching strategy (system prompt caching for repeated context)
   - Evaluate: batch API for async use cases, streaming for real-time UX
   - Plan for managed agents if multi-step reasoning required

3. Define the integration architecture:
   - Is this synchronous (blocking) or asynchronous (background)?
   - How are model responses cached (if applicable)?
   - How are rate limits handled?
   - How are costs tracked per user/feature?

**Artifact:**
```
path:   architecture/{date}-{slug}-ai-architecture.md
schema:
  model_options_evaluated:
    - model: string
      provider: string
      capability_score: 1-5
      latency_p99: float ms
      cost_per_1k_tokens: float
      context_window: integer
      verdict: selected | rejected
      rejection_reason: string | null
  selected_model:
    model: string
    provider: string
    configuration: {temperature, max_tokens, system_prompt_approach}
  integration_pattern: sync | async | streaming | batch
  caching_strategy: string
  rate_limit_handling: string
  cost_tracking: string
  fallback_model: string | null
  adrs_required: [string]  # Which decisions need formal ADRs
```

**Gate (checklist):**
- [ ] At least 3 model options evaluated
- [ ] Privacy/data compliance confirmed for selected model
- [ ] Cost at expected volume is within budget
- [ ] Fallback model or degradation path defined
- [ ] ADR created for model selection decision

---

### STEP 03 — AI Security & Threat Assessment

**Agent:** `security-agent`
**Time budget:** 4–8 hours
**Trigger:** Always for AI features (cannot be skipped)

**AI-specific threat modeling (extends standard STRIDE):**

**Prompt Injection:**
- Can users inject instructions that override system behavior?
- Can users extract the system prompt?
- Can users use the AI to attack other users or systems?
- Test with: "Ignore previous instructions and...", role-play attacks, jailbreak patterns

**Data Leakage:**
- Can user A see data belonging to user B through AI outputs?
- Does the system prompt contain sensitive information that could leak?
- Are user inputs stored and used to train future models? (privacy implications)
- Can AI output reconstruct training data?

**Output Abuse:**
- Can AI generate harmful content in this context?
- Can AI be used for spam, phishing, or fraud generation?
- Are outputs bounded and filtered before reaching users?

**Model Manipulation:**
- Can adversarial inputs degrade model behavior?
- Can users use excessive queries to cause cost-based DoS?

**Supply Chain:**
- Is the AI provider's API communication encrypted?
- Are API keys rotated and stored securely?
- Does the provider have a security incident history?

**Artifact:**
```
path:   architecture/security/{date}-{slug}-ai-threat-model.md
schema:
  threats:
    prompt_injection:
      severity: critical | high | medium | low
      mitigation: string
      test_cases: [string]  # Specific injection patterns to test
    data_leakage:
      severity: critical | high | medium | low
      mitigation: string
    output_abuse:
      severity: critical | high | medium | low
      mitigation: string
      output_filter_required: true | false
    cost_dos:
      severity: critical | high | medium | low
      mitigation: string
  required_controls:
    - description: string
      implementation_guidance: string
  verdict: approved | conditional | blocked
```

**Gate (non-negotiable):**
- [ ] Prompt injection tested and mitigated
- [ ] User data isolation verified (no cross-user leakage)
- [ ] Output filtering strategy defined (if output_abuse risk is HIGH)
- [ ] API key security verified
- [ ] Verdict issued

---

### STEP 04 — Evaluation Framework Design

**Agent:** `analytics-agent` + `qa-agent`
**Time budget:** 4–8 hours
**Rule:** Evaluation framework is DESIGNED before implementation begins. Not after.

**Instructions:**
`analytics-agent` designs the metrics; `qa-agent` designs the test set methodology.

**Evaluation dimensions for AI features:**

| Dimension | What to Measure | How to Measure |
|-----------|---------------|---------------|
| **Correctness** | Is the AI response factually accurate? | Human eval on test set or automated grading |
| **Relevance** | Does the response address the user's actual need? | Human eval / automated relevance scoring |
| **Safety** | Does the response avoid harmful content? | Automated filter + human review |
| **Consistency** | Does similar input produce consistent output? | Run same inputs N times; measure variance |
| **Latency** | Is the response fast enough for the UX? | P50, P95, P99 timing |
| **Cost efficiency** | Cost per quality response vs. threshold | $/quality_response calculation |
| **User satisfaction** | Do users rate the output as helpful? | Thumbs up/down, follow-up rate |

**Test set design:**
1. Create a golden test set of 50–200 examples:
   - Representative of real user inputs
   - Covers edge cases and challenging inputs
   - Mix of easy, medium, and hard examples
2. For each example: define input + expected output (or quality rubric)
3. Define the pass/fail threshold for each metric

**Automated evaluation (LLM-as-judge):**
Where human eval is too expensive, use an LLM judge:
- Judge prompt defines the quality rubric
- Judge score 1–5 on each dimension
- Calibrate judge against human ratings (agreement > 80% required)

**Artifact:**
```
path:   analytics/{date}-{slug}-ai-eval-framework.md
schema:
  evaluation_dimensions: [{dimension, metric, method, target_threshold}]
  test_set:
    size: integer
    source: string          # How examples were collected
    coverage: [string]      # What scenarios are covered
    golden_set_location: path
  automated_eval:
    method: llm_judge | rule_based | hybrid
    judge_model: string     # If LLM judge
    judge_prompt_location: path
    human_calibration_required: true
  pass_criteria:
    minimum_to_ship: {dimension: threshold}
    target_for_excellence: {dimension: threshold}
```

**Gate (checklist):**
- [ ] Golden test set created with ≥ 50 examples
- [ ] Every success metric from Step 01 has a measurement method
- [ ] Pass/fail thresholds defined before seeing any model results
- [ ] LLM judge calibrated against human ratings (if using)
- [ ] Test set covers edge cases, not just happy paths

---

### STEP 05 — System Design & Prompt Architecture

**Agent:** `engineer-agent`
**Time budget:** 2–4 days
**Inputs:** AI architecture (Step 02), security requirements (Step 03), eval framework (Step 04)

**Prompt Architecture principles (from `claude-api` skill):**

1. **System prompt design:**
   - Role and context at the top (cache-eligible)
   - Persona, capabilities, and constraints clearly stated
   - Output format specification (JSON schema if structured output)
   - Explicit prohibitions (what NOT to do)
   - Few-shot examples if needed

2. **Prompt injection hardening:**
   - Separate system context from user input structurally
   - Validate user input before injection into prompts
   - Use XML tags or delimiters to separate user content
   - Test all injection patterns from security threat model

3. **Context management:**
   - Apply `Agent-Skills-for-Context-Engineering` principles
   - Cache stable context (system prompt, static examples)
   - Truncate/compress dynamic context for long conversations
   - Never exceed context window; define truncation strategy

4. **Output parsing:**
   - Structured output: use JSON schema with validation
   - Unstructured: define extraction patterns
   - Always handle parsing failures (malformed output is a real case)

5. **Versioning:**
   - System prompts are versioned artifacts: `implementation/prompts/{slug}-v{N}.md`
   - Prompt changes trigger the evaluation loop (Step 08)

**Artifact:**
```
path:   implementation/prompts/{slug}-v1.md
schema:
  version: 1
  model: string
  system_prompt: string
  user_prompt_template: string   # Template with {variables} marked
  output_schema: object | null   # JSON schema for structured output
  caching_strategy:
    system_prompt: cache_enabled
    examples: cache_enabled
    user_content: no_cache
  context_budget:
    system: integer  # tokens
    examples: integer
    user: integer
    max_total: integer
  injection_protections: [string]  # List of protections applied
  failure_handling:
    parsing_failure: string
    empty_output: string
    timeout: string
```

---

### STEP 06 — AI Interaction Design

**Agent:** `ux-agent`
**Time budget:** 1–2 days
**Inputs:** AI Feature Brief (Step 01), Prompt Architecture (Step 05)

**AI-specific UX design considerations:**

**Loading states:**
- AI responses have variable latency — streaming is preferred over spinner for text
- Show partial results progressively (streaming) vs. full results (batch)
- Provide estimated wait time for long-running AI tasks

**Uncertainty & confidence:**
- When should the UI show AI confidence levels?
- How are low-confidence responses presented differently?
- When should the AI say "I don't know" vs. give a best guess?

**Error states:**
- Model unavailable: fallback to non-AI experience
- Poor quality response: offer retry or human escalation
- Rate limit hit: queue or explain delay

**User control & trust:**
- Can users edit/correct AI output?
- Is there a "regenerate" button?
- Is there a feedback mechanism (thumbs up/down)?
- How is the AI labeled? ("AI-generated" disclosure)

**Human-in-loop UX (HIGH risk class):**
- How does a human reviewer see and approve AI output?
- What interface does the reviewer have?
- How is the approval/rejection recorded?

**Artifact:**
```
path:   implementation/design-specs/{slug}-ai-ux.md
sections:
  - ai_loading_states (streaming vs. batch design)
  - error_states (unavailable, poor quality, rate limit)
  - user_controls (edit, regenerate, feedback)
  - ai_disclosure (how is it labeled as AI)
  - confidence_display (if applicable)
  - human_review_interface (HIGH risk class only)
```

---

### STEP 07 — Prototype & Baseline Evaluation

**Agent:** `engineer-agent`
**Time budget:** 3–5 days
**Rule:** Run the full evaluation framework (Step 04) on the first prototype to establish a baseline.

**Instructions:**
1. Implement the minimum working integration (no production UI yet)
2. Run the golden test set through the model
3. Score against all evaluation dimensions
4. Record baseline scores — this is the floor, not the target

**Baseline evaluation process:**
```
1. Run all N golden test set examples through the model
2. Score each example on each dimension using the eval framework
3. Calculate aggregate scores
4. Identify failure patterns (what types of inputs fail?)
5. Document baseline in evaluation log
```

**Artifact:**
```
path:   analytics/{date}-{slug}-eval-v1-baseline.md
schema:
  version: 1
  model_version: string
  prompt_version: "v1"
  test_set_size: integer
  scores:
    correctness: float         # 0-1
    relevance: float
    safety: float
    consistency: float
    p50_latency: float ms
    p99_latency: float ms
    cost_per_request: float
  pass_threshold_comparison:
    - dimension: string
      score: float
      threshold: float
      status: PASS | FAIL
  failure_patterns: [string]   # Types of inputs that fail
  overall_verdict: ABOVE_THRESHOLD | BELOW_THRESHOLD
```

---

### STEP 08 — Iteration Loop (until eval targets met)

**Agent:** `engineer-agent`
**Time budget:** 1–2 days per iteration; max 5 iterations
**Rule:** Ship when all eval targets from Step 04 are met. Not before.

**Iteration loop:**
```
DO:
  1. Analyze failure patterns from previous evaluation
  2. Hypothesize improvement (prompt change, context change, model change)
  3. Implement change (increment prompt version)
  4. Re-run evaluation on full test set
  5. Compare scores to previous version and to thresholds
  6. Record in eval log

UNTIL: all metrics meet pass_criteria.minimum_to_ship
  OR: max 5 iterations reached
  OR: architect-agent decides to change model/approach
```

**Iteration log (append per iteration):**
```
path:   analytics/{date}-{slug}-eval-log.md
entry:
  version: N
  date: date
  change_made: string          # What was changed
  change_hypothesis: string    # Why we expected this to help
  scores: {dimension: float}
  comparison_to_prev: {dimension: delta}
  comparison_to_threshold: {dimension: pass|fail}
  failure_analysis: string     # What's still failing and why
  next_iteration_plan: string  # If not yet passing
```

**If max iterations reached without meeting thresholds:**
1. Escalate to `architect-agent`: is the model/approach wrong?
2. Escalate to `pm-agent`: are the quality thresholds realistic?
3. Options: lower threshold (with PM sign-off), change model, change approach, de-scope feature

---

### STEP 09 — Human Evaluation

**Agent:** `qa-agent` + `pm-agent`
**Time budget:** 1–2 days
**Rule:** Automated evals are necessary but not sufficient. Human reviewers must assess output quality.

**Instructions:**
1. Select 50–100 examples from the test set (or new examples)
2. Have human reviewers assess each response on:
   - Helpfulness (1–5 scale)
   - Accuracy (1–5 scale or binary)
   - Safety (binary — safe/unsafe)
   - Appropriateness for the context (binary)
3. For HIGH risk class: use 2+ independent reviewers per example; measure inter-rater agreement
4. Calculate human evaluation scores
5. Compare to automated eval scores:
   - If divergence > 20% on any dimension: investigate why
   - LLM judge may be miscalibrated; may need to update judge prompt

**Artifact:**
```
path:   qa/{date}-{slug}-human-eval.md
schema:
  evaluators: integer          # Number of human reviewers
  examples_reviewed: integer
  scores:
    helpfulness: float         # Mean score
    accuracy: float
    safety_pass_rate: float    # % rated safe
    appropriateness: float
  automated_vs_human_agreement: float  # % agreement
  divergence_analysis: string  # If > 20% divergence
  failure_examples: [string]   # Examples that failed human review
  verdict: pass | fail | conditional
```

**Gate (checklist):**
- [ ] ≥ 50 examples reviewed by humans
- [ ] Safety pass rate ≥ 99% (non-negotiable)
- [ ] Helpfulness score meets threshold from Step 01
- [ ] Automated vs. human agreement > 80%

---

### STEP 09H — External / Legal Review Gate (HIGH Risk Class Only)

**Agent:** `security-agent` + human review
**Time budget:** 1–2 weeks (external review may be slow)
**Trigger:** AI Risk Class == HIGH from Step 01

**Review areas:**
- Regulatory compliance (does AI use comply with GDPR, sector-specific regulations?)
- Bias assessment: does the model exhibit measurable bias across demographic groups?
- Explainability: can the AI decisions be explained to affected users?
- Human override: can a human override any AI decision?
- Disclosure requirements: are users informed they're interacting with AI?

**Gate:** Human sign-off required. Cannot be automated.

---

### STEP 10 — Pre-Release AI Security Review

**Agent:** `security-agent`
**Time budget:** 4–8 hours
**Inputs:** Final implementation, prompt versions, security threat model (Step 03)

**Final security checklist:**
```
Prompt Injection:
  □ All injection patterns from Step 03 tested against production prompts
  □ Injection attempts do not extract system prompt
  □ Injection attempts do not redirect to harmful outputs
  □ Input validation in place before prompt assembly

Data Security:
  □ No PII injected into prompts beyond minimum necessary
  □ User inputs are NOT logged by default (or log scrubbing in place)
  □ API key stored in secrets manager (not env file or code)
  □ API communication is HTTPS

Output Safety:
  □ Output filter active and tested (if required by threat model)
  □ Rate limiting per user prevents cost-based DoS
  □ Output does not expose system internals or other users' data

Model Security:
  □ Model API provider security reviewed
  □ Data processing agreement in place (if required by privacy policy)
```

**Gate:** Security verdict required before release. No exceptions.

---

### STEP 11 — Monitoring & Observability Design

**Agent:** `analytics-agent`
**Time budget:** 4–8 hours

**AI-specific monitoring requirements:**

**Quality monitoring (continuous):**
- Sample 1–5% of production requests for automated quality scoring
- Alert when quality score drops below threshold (rolling 24h window)
- Track: per-model-version quality score trends

**Safety monitoring (always):**
- 100% of responses filtered through safety classifier
- Alert on any safety filter trigger
- Daily review of flagged outputs (P1 for safety issues)

**Performance monitoring:**
- P50, P95, P99 latency per model and per feature
- Alert thresholds: P99 > 2× baseline
- Token usage trending (cost control)

**Usage monitoring:**
- Requests/user/day (anomaly detection for abuse)
- Model API error rate (upstream service health)
- Cache hit rate for prompt caching (cost efficiency)

**User feedback loop:**
- Thumbs up/down captured per AI response
- Helpfulness score tracked over time
- Failure rate (user clicked "regenerate" or provided no feedback)

**Artifact:**
```
path:   analytics/{date}-{slug}-ai-monitoring.md
schema:
  dashboards:
    quality: {metrics, alert_thresholds}
    safety: {metrics, alert_thresholds, review_cadence}
    performance: {metrics, alert_thresholds}
    cost: {metrics, budget_alerts}
    user_feedback: {metrics}
  sampling_rate: float         # % of requests scored for quality
  alert_owners: [string]
  model_version_tracking: string  # How model versions are tracked in prod
  drift_detection:
    method: string
    threshold: float
    action_when_triggered: string
```

---

### STEP 12 — Staged Rollout Planning

**Agent:** `delivery-agent`
**Time budget:** 2–4 hours
**Rule:** All AI features use staged rollout. No AI feature goes 0% → 100% in one step.

**AI Feature Staged Rollout Protocol:**

```
Phase 0: Internal (10 users)  → 5 business days
  Who: Internal team members
  Goal: Catch obvious issues; establish production baseline
  Success criteria: Quality scores match staging; no safety violations

Phase 1: Canary (1-5%)        → 3-7 business days
  Who: Random production users (segment carefully for HIGH risk)
  Goal: Real-world quality validation; identify edge cases in the wild
  Monitoring: Every 6 hours for first 24 hours
  Success criteria: Quality score within 10% of staging; safety pass rate ≥ 99.9%

Phase 2: Expanded (25%)       → 3-7 business days
  Who: Broader user base
  Goal: Volume validation; cost validation; user feedback at scale
  Monitoring: Daily
  Success criteria: All metrics stable; user feedback positive

Phase 3: Full rollout (100%)  → Ongoing
  Transition criteria: All Phase 2 metrics met; PM sign-off
```

**Rollout gates (must pass to advance phase):**
- Quality score: within 10% of baseline
- Safety pass rate: ≥ 99.9%
- Latency P99: within spec
- User thumbs-down rate: ≤ [threshold from Step 01]
- No critical safety incidents

**Rollback triggers:**
- Safety violation rate > 0.01% in any 1-hour window
- Quality score drop > 20% from baseline
- Any critical security finding

---

### STEP 13 — Final Gate Review

**Agent:** `supervisor-agent`
**Inputs:** All AI workflow artifacts

**Supervisor AI feature checklist:**

```
FOUNDATION
  ✓ AI task is specifically defined (not vague)
  ✓ Bad response is explicitly defined
  ✓ Failure tolerance is a number

EVALUATION
  ✓ Eval framework designed before coding
  ✓ Golden test set created
  ✓ All eval targets met (no threshold-lowering without PM sign-off)
  ✓ Human evaluation completed

SECURITY
  ✓ AI threat model complete
  ✓ Prompt injection mitigated and tested
  ✓ Output filtering in place (if required)
  ✓ Final security review approved

OBSERVABILITY
  ✓ Quality monitoring defined
  ✓ Safety monitoring defined
  ✓ Alerts configured
  ✓ User feedback mechanism in place

ROLLOUT
  ✓ Staged rollout plan with explicit phase gates
  ✓ Rollback triggers defined
  ✓ Phase 0 (internal) planned
```

---

### STEP 14 — Post-Launch AI Monitoring (Ongoing)

**Agent:** `analytics-agent` + `pm-agent`
**Cadence:** Daily (week 1), weekly (months 1–3), monthly (ongoing)

**Post-launch review checklist:**

**Week 1 (daily review):**
- Quality scores vs. staging baseline
- Safety filter trigger rate
- Latency and cost per request
- User feedback rate and sentiment
- Any unexpected failure patterns

**Month 1 (weekly review):**
- Quality score trends (improving/degrading?)
- User satisfaction trending
- Cost per user vs. budget
- Edge cases discovered in production

**Quarterly review:**
- Is the model still the best option? (re-evaluate alternatives)
- Has the task definition drifted? (users use it differently than expected)
- Are quality thresholds still appropriate?
- Rerun eval framework on latest model version

**Model drift detection:**
AI models can drift in behavior over updates. Monitor for:
- Sudden quality score drops (model update)
- Gradual quality degradation (distribution shift)
- Latency increases (provider-side)

**Artifact (monthly):**
```
path:   analytics/ai-monitoring/{date}-{slug}-monthly-review.md
schema:
  period: string
  quality_scores: {dimension: float}
  vs_baseline: {dimension: delta}
  safety_incidents: integer
  cost_per_user: float
  user_satisfaction: float
  model_version: string
  recommendations: [string]
  action_items: [string]
```

---

## Escalation Rules

| Condition | Escalation Target | Action |
|-----------|------------------|--------|
| Safety violation in production | `security-agent` + `delivery-agent` | Immediate; may trigger incident-workflow |
| Eval targets not met after 5 iterations | `architect-agent` + `pm-agent` | Approach review |
| Human eval safety pass rate < 99% | Block release unconditionally | No exception |
| AI risk class HIGH with no external review | Block release | Step 09H required |
| Prompt injection vulnerability found | `security-agent` | Block release |
| Quality score drops > 20% post-launch | `engineer-agent` + `analytics-agent` | Investigation + possible rollback |
| Cost exceeds 150% of budget | `pm-agent` + `architect-agent` | Model/approach review |

---

## Handoff from AI Feature Workflow → release-workflow

```yaml
handoff:
  from: ai-feature-workflow
  to: release-workflow

  artifacts:
    ai_feature_brief:     "prds/{date}-{slug}-ai-feature-brief.md"
    eval_framework:       "analytics/{date}-{slug}-ai-eval-framework.md"
    eval_results:         "analytics/{date}-{slug}-eval-log.md"
    human_eval:           "qa/{date}-{slug}-human-eval.md"
    ai_threat_model:      "architecture/security/{date}-{slug}-ai-threat-model.md"
    security_review:      "qa/security/{date}-{slug}-*"
    monitoring_plan:      "analytics/{date}-{slug}-ai-monitoring.md"
    prompt_artifacts:     "implementation/prompts/{slug}-v{N}.md"

  decisions_made:
    - "Model selected: {model} — see architecture/{slug}-ai-architecture.md"
    - "Eval targets met at version {N}: {scores}"
    - "Staged rollout: Phase 0 (internal) first"

  constraints_for_release:
    - "Must start with Phase 0 (internal) rollout"
    - "Safety filter must be active before any user sees output"
    - "Quality monitoring alerts must be configured before 1% rollout"
```

---

## Wiki Updates Per Step

| Step | Wiki Page | Update Type |
|------|-----------|------------|
| 01 | `wiki/decisions/{date}-{slug}-ai-decision.md` | AI risk classification decision |
| 02 | `architecture/decisions/ADR-NNN.md` | Model selection ADR |
| 04 | `analytics/{slug}-ai-eval-framework.md` | Create eval framework |
| 07 | `analytics/{slug}-eval-log.md` | Create baseline |
| 08 | `analytics/{slug}-eval-log.md` | Append per iteration |
| 14 | `analytics/ai-monitoring/{date}-review.md` | Monthly review |
| Any | `wiki/index.md` | Update recently updated |

---

## Quality Metrics

| Metric | Target |
|--------|--------|
| AI features shipped without eval framework | 0 |
| Safety violations in production | 0 |
| AI features with no staged rollout | 0 |
| Eval target met at first baseline (v1) | > 20% (most need iteration) |
| Eval target met by v3 | > 80% |
| Post-launch quality degradation rate | < 10% in 90 days |
| Human eval agreement with automated eval | > 80% |
