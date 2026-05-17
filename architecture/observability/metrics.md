---
layer: observability
type: metric-definitions
version: 1.0.0
created: 2026-05-09
owner: analytics-agent
review-cadence: quarterly
---

# Metric Definitions

All metrics the Enterprise AI OS tracks. Each metric has a canonical definition, target, measurement method, and owner.

---

## Category 1: Delivery Performance (DORA)

### D1 — Deployment Frequency
- **Definition:** Number of times the system deploys to production per unit time
- **Target (initial):** Weekly (classified: Medium performer per DORA)
- **Target (mature):** Daily or multiple times per day (Elite performer)
- **Measurement:** Count of entries in `wiki/releases/` per calendar week
- **Owner:** delivery-agent
- **Signal:** Low frequency → slow value delivery; High frequency → healthy CI/CD cadence

### D2 — Lead Time for Changes
- **Definition:** Time from first commit to production deployment
- **Target (initial):** < 1 week
- **Target (mature):** < 1 day (Elite: < 1 hour)
- **Measurement:** Timestamp delta: first artifact created in feature workflow → release artifact date
- **Owner:** delivery-agent
- **Signal:** Long lead time → process bottlenecks, large batch sizes

### D3 — Change Failure Rate
- **Definition:** Percentage of deployments that cause a production incident or require hotfix
- **Target:** < 15% (Medium), < 5% (Elite)
- **Measurement:** `incidents/` created within 24h of a release / total releases
- **Owner:** qa-agent
- **Signal:** High failure rate → insufficient QA, inadequate testing, weak pre-release gate

### D4 — Mean Time to Restore (MTTR)
- **Definition:** Time from incident detection to service restoration
- **Target:** < 1 day (Medium), < 1 hour (Elite)
- **Measurement:** Incident opened timestamp → incident resolved timestamp in `incidents/`
- **Owner:** delivery-agent
- **Signal:** Long MTTR → poor runbooks, unclear ownership, missing monitoring

---

## Category 2: Quality Metrics

### Q1 — Gate First-Pass Rate
- **Definition:** Percentage of artifacts that pass a quality gate on the first submission
- **Target:** > 80% per gate
- **Measurement:** Gate pass count / (gate pass + gate fail count) per gate per sprint
- **Owner:** supervisor-agent
- **Signal:** Low first-pass → unclear requirements, insufficient agent context, template gaps

### Q2 — Gate Cycle Count
- **Definition:** Average number of review cycles an artifact requires before passing
- **Target:** < 1.5 cycles average
- **Measurement:** Count of REVISION artifacts per workflow instance / total workflow instances
- **Owner:** supervisor-agent
- **Signal:** High cycles → poor upfront quality, unclear standards, context rot

### Q3 — Defect Escape Rate
- **Definition:** Percentage of defects found in production that were not caught by QA gate
- **Target:** < 5%
- **Measurement:** Production incidents attributable to shipped bugs / total bugs found (QA + prod)
- **Owner:** qa-agent
- **Signal:** High escape rate → QA test coverage gaps, regression blindness

### Q4 — Security Gate Block Rate
- **Definition:** Percentage of releases blocked by security gate (G3 or G6)
- **Target:** < 10% (indicates adequate pre-security design work)
- **Measurement:** Security gate FAIL count / total security gate evaluations
- **Owner:** security-agent
- **Signal:** High block rate → architects not applying security principles early

---

## Category 3: AI Quality Metrics

### A1 — Eval Score (per feature)
- **Definition:** Average score on the feature's evaluation suite, as defined in `evaluations/criteria.md`
- **Target:** > 0.85 (feature-specific thresholds may override)
- **Measurement:** Automated eval run on golden test set before each release
- **Owner:** analytics-agent (per feature, the feature's eval framework)
- **Signal:** Below threshold → do not ship; rollback if post-release

### A2 — LLM-as-Judge Agreement Rate
- **Definition:** Percentage of AI outputs where LLM judge and human rater agree
- **Target:** > 80% agreement (calibration pass threshold)
- **Measurement:** Periodic calibration runs defined in `evaluations/golden-tests.md`
- **Owner:** analytics-agent
- **Signal:** Low agreement → judge is miscalibrated; outputs are unreliable proxy metrics

### A3 — Quality Degradation Signal
- **Definition:** Rolling 7-day average eval score vs. 30-day baseline
- **Alert threshold:** > 10% degradation triggers RISK-008 review
- **Measurement:** Automated sampling 1–5% of production outputs per `ai-feature-workflow.md §safety`
- **Owner:** analytics-agent
- **Signal:** Degradation → model update, prompt drift, or distribution shift

### A4 — Safety Filter False Positive Rate
- **Definition:** Percentage of legitimate outputs incorrectly blocked by safety filters
- **Target:** < 2%
- **Measurement:** Human-reviewed sample of filtered outputs
- **Owner:** security-agent, analytics-agent
- **Signal:** High false positive → over-tuned filters hurting user experience

---

## Category 4: Governance Metrics

### G1 — Governance Compliance Rate
- **Definition:** Percentage of workflows that complete all required quality gates without exception
- **Target:** > 95%
- **Measurement:** (Workflows with all gates passed / total workflows) per sprint
- **Owner:** supervisor-agent
- **Signal:** Low compliance → governance bypass under pressure (RISK-004 materializing)

### G2 — Gate Exception Rate
- **Definition:** Number of documented gate exceptions per sprint
- **Target:** < 2 exceptions per sprint (any more → root cause review)
- **Measurement:** Entries in `wiki/decisions/gate-exceptions.md` per sprint period
- **Owner:** supervisor-agent
- **Signal:** High exception rate → deadline pressure overriding governance

### G3 — ADR Coverage Rate
- **Definition:** Percentage of L-tier engineering decisions backed by an ADR
- **Target:** 100% (non-negotiable)
- **Measurement:** L-tier PRs in sprint / ADRs created in same period
- **Owner:** architect-agent
- **Signal:** Coverage below 100% → ADR creation being skipped (governance violation)

---

## Category 5: Memory and Knowledge Health

### M1 — Open Question Age
- **Definition:** Average number of days a question in `memory/open-questions.md` has been open
- **Target:** < 14 days for high-priority; < 30 days for normal
- **Alert threshold:** Any blocking question open > 7 days → escalate to human
- **Owner:** orchestrator
- **Signal:** Stale questions → organizational paralysis on affected domains

### M2 — Memory Freshness Score
- **Definition:** Percentage of memory entries updated within their defined review cadence
- **Target:** > 90%
- **Measurement:** Count entries past review date / total entries in MEMORY_INDEX
- **Owner:** orchestrator, docs-agent
- **Signal:** Low freshness → agents acting on stale organizational knowledge

### M3 — Wiki Coverage
- **Definition:** Percentage of workflows that have a corresponding wiki page in `wiki/processes/`
- **Target:** 100%
- **Measurement:** Workflow files in `workflows/` / corresponding pages in `wiki/processes/`
- **Owner:** docs-agent
- **Signal:** Low coverage → knowledge not accessible to agents without reading raw workflow files

### M4 — Risk Registry Staleness
- **Definition:** Number of risks in `memory/known-risks.md` past their review date
- **Target:** 0 overdue
- **Owner:** delivery-agent
- **Signal:** Overdue risks → risk management is theater

---

## Metric Collection Cadence

| Category | Frequency | Trigger | Reporter |
|---------|-----------|---------|---------|
| DORA | Per sprint close | Sprint retrospective | delivery-agent |
| Quality | Per gate evaluation | Each gate pass/fail | supervisor-agent |
| AI Quality | Per release + sampling | Release workflow + scheduled | analytics-agent |
| Governance | Per sprint | Sprint close | supervisor-agent |
| Memory Health | Weekly | wiki-maintenance workflow | docs-agent |

---

## Baseline Period

No baseline exists yet (system pre-operational). The first 3 sprints are the baseline period. Do not set performance improvement targets until baseline data exists.
