# WF-014: Compliance Review

**Version:** 1.0.0 | **Owner:** Governance Org | **Tier:** T3 | **Class:** REGULATED | **SLA:** 21 days

## Purpose
Conduct structured compliance assessments for regulatory requirements, internal audits, and third-party certifications — producing evidence packages, gap analyses, remediation plans, and binding compliance decisions with full audit trail.

## Inputs

```
REQUIRED:
  review_type:        REGULATORY_AUDIT | INTERNAL_AUDIT | CERTIFICATION_PREP |
                      POLICY_COMPLIANCE | EU_AI_ACT | SOC2 | GDPR | CUSTOM
  scope:              string — systems, processes, or features in scope
  regulatory_refs:    [regulation_tag] — which regulations/frameworks apply
  requestor_id:       string — T3+ compliance officer or regulator

OPTIONAL:
  deadline:           ISO8601 — regulatory submission deadline
  prior_review_id:    string — previous review for comparison
  risk_level:         HIGH | MEDIUM | LOW
```

## Outputs / Artifacts

```
PRIMARY:
  COMPLIANCE_REPORT:     wiki/compliance/{review_id}.md
  EVIDENCE_PACKAGE:      structured evidence for each control
  GAP_ANALYSIS:          identified gaps with severity and remediation paths
  REMEDIATION_PLAN:      prioritized action items with owners and deadlines

SECONDARY:
  EXECUTIVE_SUMMARY:     T4+ summary (< 2 pages)
  REGULATORY_SUBMISSION: formatted for external submission (if regulatory_audit)
```

## Lifecycle States

```
INITIATED → VALIDATING → SCOPE_DEFINITION → CONTROL_MAPPING
  → EVIDENCE_COLLECTION → AUTOMATED_CHECKS → MANUAL_ASSESSMENT
  → GAP_ANALYSIS → REMEDIATION_PLAN → REVIEW_GATE
  → [REGULATORY] DPO_CISO_APPROVAL → REPORT_FINALIZATION
  → PUBLISHED → TRACKING → COMPLETED
```

## Execution Graph

```
S-001  AUTH_CHECK              [GATE: G-AUTH T3+]              Root
S-002  REGULATORY_FRAMEWORK    [AGENT: compliance-agent]       depends_on: S-001
         Map: each regulation_ref → applicable controls
         EU AI Act: Art.5 (prohibited), Art.6 (risk classification), Art.9–15 (HIGH_RISK)
         GDPR: Art.5–11 (principles), Art.13–15 (transparency), Art.17 (erasure)
         SOC2: CC criteria (Security, Availability, Confidentiality, Privacy, Processing Integrity)
S-003  SCOPE_INVENTORY         [AGENT: compliance-agent]       depends_on: S-001
         Pull: all systems, AI models, data entities, and processes in scope
         From: data-catalog, architecture diagrams, deployment records
S-004  CONTROL_MAPPING         [AGENT: compliance-agent]       depends_on: S-002, S-003
         Map each control → evidence type required → evidence source
         Output: control checklist (what evidence must be collected per control)
S-005  AUTOMATED_EVIDENCE      [AGENT: compliance-agent]       depends_on: S-004
         Collect from OS systems automatically:
           Access logs → access control evidence
           Deployment audit → change management evidence
           Quality gate records → testing evidence
           Constitutional alignment scores → AI governance evidence
           Data lineage records → data governance evidence
S-006  MANUAL_EVIDENCE         [HUMAN: compliance team T3]     depends_on: S-004
         Collect: interviews, policy documents, training records
         SLA: 5 business days
         Tracking: evidence collection checklist per control
S-007  EVIDENCE_QUALITY_CHECK  [AGENT: compliance-agent]       depends_on: S-005, S-006
         Verify: each control has sufficient, current evidence
         Flag: missing evidence; stale evidence (> 1 year); insufficient evidence
S-008  GAP_ANALYSIS            [AGENT: compliance-agent]       depends_on: S-007
         For each gap: severity (CRITICAL | HIGH | MEDIUM | LOW)
           CRITICAL: control fails; regulatory exposure or certification risk
           HIGH: control partially meets; significant evidence gap
           MEDIUM: minor gap; cosmetic or documentation issue
         Root cause classification per gap
S-009  AI_ACT_SPECIAL_CHECKS   [AGENT: compliance-agent]       depends_on: S-003
         Only if EU_AI_ACT in regulatory_refs:
         Check all AI systems for HIGH_RISK classification
         Verify: model cards exist; explainability endpoints live
         Verify: human oversight controls in place (production-safety-system.md)
         Enforcement deadline: 2026-08-02 — flag if any HIGH_RISK non-compliant
S-010  REMEDIATION_PLAN        [AGENT: compliance-agent]       depends_on: S-008
         Per gap: owner, remediation action, target date, effort estimate
         Priority: CRITICAL gaps target < 30 days; HIGH < 60 days; MEDIUM < 90 days
S-011  DPO_CISO_REVIEW         [HUMAN: T4 DPO + CISO]          depends_on: S-008–S-010
         Required for: REGULATORY_AUDIT, EU_AI_ACT, GDPR, SOC2
         DPO: data protection aspects; CISO: security aspects
         SLA: 5 business days
S-012  QUALITY_GATE            [GATE: G-QUALITY]               depends_on: S-011
         All controls assessed; all gaps have remediation plans with owners
         No CRITICAL gaps without escalation plan
S-013  EXECUTIVE_SUMMARY       [AGENT: pm-agent]               depends_on: S-012
         2-page summary: overall compliance posture, critical gaps, key risks, actions
S-014  REPORT_FINALIZATION     [AGENT: compliance-agent]       depends_on: S-012, S-013
         Assemble: full report with evidence index, gap analysis, remediation plan
S-015  DPO_FINAL_APPROVAL      [GATE: G-LEGAL]                 depends_on: S-014
         T4 DPO final sign-off on report
         REGULATORY_AUDIT: T5 approval required before submission
S-016  REGULATORY_SUBMISSION   [INTEGRATION]                   depends_on: S-015
         REGULATORY_AUDIT only: submit to regulator; track submission receipt
S-017  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-014–S-016
S-018  REMEDIATION_TRACKING    [SYSTEM]                        depends_on: S-010
         Schedule: follow-up checks at each remediation target date
S-019  MEMORY_UPDATE           [SYSTEM]                        depends_on: S-017
S-020  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-019
```

## Approval Gates

```
G-AUTH:    requestor >= T3; scope clearly defined
G-QUALITY: all controls assessed; all gaps have remediation plans; evidence quality verified
G-LEGAL:   T4 DPO sign-off; T5 required for external regulatory submissions
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
CRITICAL gap with no remediation plan    T4 DPO + executive alert    4hr
EU AI Act HIGH_RISK non-compliant        T4 DPO + T5 CTO             2hr
Regulatory deadline < 30 days           T4 DPO escalation; fast-track Immediate
Manual evidence SLA breach (5d)          T3 escalation; DPO reminder  2hr
CRITICAL gap remediation missed          T4 escalation; risk accepted flag 24hr
```

## Governance Checkpoints

```
C-001: human DPO review on all compliance reports
C-004: all gap findings and decisions permanently recorded
C-006: GDPR reviews require DPO; personal data inventory verified
EU_AI_ACT: enforcement date 2026-08-02; HIGH_RISK systems must achieve compliance before
EVIDENCE_RETENTION: compliance evidence retained 7 years; HIGH_RISK AI: 10 years
REGULATORY_SUBMISSION: T5 approval required; submission acknowledgment tracked
```

## Observability

```
HEALTH METRICS:
  avg_review_cycle_days:        target <= 21
  critical_gap_remediation_rate: within deadline target >= 0.90
  control_coverage_pct:         target = 100%
  evidence_quality_score:       target >= 0.80
  recurrence_finding_rate:      same gap in successive reviews → process failure

EU AI ACT SPECIFIC:
  high_risk_compliant_pct:      target = 100% by 2026-08-01
  model_card_coverage:          target = 100% for registered models
```

## Telemetry Events

```
enterprise.workflows.WF-014.initiated    {review_type, scope, regulatory_refs}
enterprise.workflows.WF-014.gaps_found   {critical, high, medium, low}
enterprise.workflows.WF-014.gate.G-LEGAL {result, approver}
enterprise.workflows.WF-014.submitted    {submission_id, regulator, date}
enterprise.workflows.WF-014.completed    {review_id, overall_posture, open_gaps}
```

## Rollback System

```
ROLLBACK: compliance reviews are not rolled back; findings stand
INCORRECT_FINDING: compliance team submits correction; DPO approves; report amended with addendum
EVIDENCE_UPDATE: new evidence collected; report updated; version incremented
```

## Enterprise System Integrations

```
JIRA:         S-010 → create remediation tickets with owners and deadlines
COMPLIANCE_SYSTEM: S-017 → file compliance report in compliance management system
GRC_TOOL:     S-016 → update GRC tool with control status
SLACK:        S-020 → notify #compliance with summary and open critical gaps
```

## Wiki Updates

```
wiki/compliance/{review_id}.md            ← full compliance report
wiki/compliance/compliance-posture.md     ← update overall posture summary
wiki/compliance/eu-ai-act/               ← EU AI Act section updates
wiki/compliance/open-findings.md         ← update open findings tracker
```

## Memory Updates

```
memory/compliance/compliance-reports.yaml ← link new report
memory/compliance/open-findings.yaml     ← update with new gaps
memory/data-fabric/governance-policy-state.yaml ← update compliance status
```
