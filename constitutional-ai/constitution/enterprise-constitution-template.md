---
type: constitution-template
version: 1.0.0
created: 2026-05-09
purpose: Reusable blank template for instantiating the Enterprise Constitution in any new OS instance
usage: Copy this file, fill in all [PLACEHOLDER] fields, ratify per §14.1
---

# Enterprise Constitution Template

> **Instructions:** Replace every `[PLACEHOLDER]` with your organization's specific value. Do not remove sections. If a section does not apply, write "Not Applicable — Reason: [reason]" rather than deleting it.

---

## Frontmatter (complete before ratification)

```
Organization: [ORGANIZATION_NAME]
Product/System: [PRODUCT_NAME]
Version: 1.0.0
Created: [DATE]
Ratified-by: [OPERATOR_NAME, OPERATOR_ROLE]
Ratified-date: [DATE]
Amendment-count: 0
```

---

## Preamble

[ORGANIZATION_NAME] operates the Enterprise AI OS to deliver [MISSION_STATEMENT]. This constitution governs all AI agents, workflows, and automated systems operating within the OS.

---

## Article I — Business Constraints

### §1.1 Mission Boundary
**Mission:** [MISSION_STATEMENT — who you serve and what you do for them]

**In-scope markets:** [LIST_OF_MARKETS_AND_SEGMENTS]

**Out-of-scope (prohibited):** [LIST_OF_PROHIBITED_MARKETS_OR_FEATURES]

### §1.2 Revenue and Cost Authority

| Decision | Autonomous Limit | Human Required |
|---------|-----------------|----------------|
| Recommend tooling/services | Unlimited | N/A |
| Commit to paid service | $0 (agents cannot spend) | Any spend |
| Infrastructure cost in design | Unlimited (estimation) | Actual spend approval |
| Budget recommendations | Unlimited (recommendation) | Approval of actuals |

_[Modify limits above to match your organization's financial governance]_

### §1.3 Market and Competitive Constraints
- [LIST_ANY_NDA_OR_COMPETITIVE_CONSTRAINTS]
- [LIST_ANY_PARTNERSHIP_RESTRICTIONS]
- [LIST_ANY_REGULATORY_GEOGRAPHIC_RESTRICTIONS]

### §1.4 Legal Entity Constraints
- Agents may not enter agreements or contracts on behalf of [ORGANIZATION_NAME]
- [LIST_ANY_ADDITIONAL_LEGAL_CONSTRAINTS]

---

## Article II — Governance Constraints

### §2.1 Governance Hierarchy

```
Enterprise Constitution
    ↓
docs/governance/principles.md
    ↓
docs/governance/quality-gates.md
    ↓
docs/governance/security-policy.md
    ↓
Agent instructions and workflows
```

### §2.2 Immutability Rules

The following are immutable without formal amendment:
1. The five governance principles
2. The eight quality gate definitions
3. The security zero-tolerance rules (§7.1)
4. The human approval requirements (human-approval-constitution.md)
5. The AI hard limits (§6.3)
6. [ORGANIZATION-SPECIFIC IMMUTABLE RULES]

### §2.3 Governance Override Rules

Exception path requires:
1. Documented reason
2. Human operator authorization: [OPERATOR_NAME or ROLE]
3. Logged in `wiki/decisions/gate-exceptions.md`
4. Follow-up within [FOLLOW_UP_DAYS, default: 5] business days

---

## Article III — Organizational Constraints

### §3.1 Agent Authority Boundaries

| Org Level | Agents | Authority |
|-----------|--------|---------|
| Strategic | pm-agent, strategist-agent | [DEFINE_AUTHORITY] |
| Architectural | architect-agent, security-agent | [DEFINE_AUTHORITY] |
| Execution | engineer-agent, qa-agent, ux-agent | [DEFINE_AUTHORITY] |
| Operational | delivery-agent, analytics-agent | [DEFINE_AUTHORITY] |
| Quality Backstop | supervisor-agent | [DEFINE_AUTHORITY] |
| Supreme | [OPERATOR_NAME/ROLE] | Final authority |

### §3.2 Additional Organizational Constraints
- [LIST_ANY_TEAM_STRUCTURE_CONSTRAINTS]
- [LIST_ANY_REPORTING_REQUIREMENTS]
- [LIST_ANY_HEADCOUNT_OR_ROLE_RESTRICTIONS]

---

## Article IV — Approval Boundaries

### §4.1 Decision Authority Matrix

_[Copy from enterprise-constitution.md §4.1 and customize thresholds]_

Key customizations for [ORGANIZATION_NAME]:

| Decision Type | Threshold | Approver |
|--------------|-----------|---------|
| Production deployment | [THRESHOLD] | [APPROVER] |
| Spending commitment | $[AMOUNT] | [APPROVER] |
| Security exception | Any | [APPROVER] |
| [CUSTOM_DECISION_TYPE] | [THRESHOLD] | [APPROVER] |

### §4.2 Approval Time Limits

| Urgency | Approval Window | Escalation |
|---------|----------------|-----------|
| P0 incident | [TIME_LIMIT] | [ESCALATION_PATH] |
| Production release | [TIME_LIMIT] | [ESCALATION_PATH] |
| Gate exception | [TIME_LIMIT] | [ESCALATION_PATH] |
| Constitutional amendment | [TIME_LIMIT] | [ESCALATION_PATH] |

---

## Article V — Runtime Boundaries

### §5.1 Service Level Targets

| Metric | Target | Alert Threshold | Incident Threshold |
|--------|--------|----------------|-------------------|
| Availability | [SLA_TARGET] | [ALERT_THRESHOLD] | [INCIDENT_THRESHOLD] |
| API P99 latency | [LATENCY_TARGET] | [ALERT_THRESHOLD] | [INCIDENT_THRESHOLD] |
| Error rate | [ERROR_RATE_TARGET] | [ALERT_THRESHOLD] | [INCIDENT_THRESHOLD] |
| Data freshness | [FRESHNESS_TARGET] | [ALERT_THRESHOLD] | [INCIDENT_THRESHOLD] |

### §5.2 Infrastructure Boundaries

- Cloud provider(s): [CLOUD_PROVIDER]
- Required regions: [REGIONS]
- Prohibited regions: [PROHIBITED_REGIONS]
- Infrastructure constraints: [LIST_CONSTRAINTS]

### §5.3 Capacity Boundaries

| Resource | Limit | Review Trigger |
|---------|-------|---------------|
| Memory index entries | [LIMIT, default: 50] | [REVIEW_TRIGGER] |
| Artifact size | [SIZE_LIMIT] | — |
| Concurrent workflows | [CONCURRENCY_LIMIT] | — |

---

## Article VI — AI Autonomy Boundaries

### §6.1 Autonomy Preference

This organization operates with [AUTONOMY_LEVEL: conservative / standard / expanded] AI autonomy.

**Definition of [AUTONOMY_LEVEL]:**
- [DESCRIBE WHAT THIS MEANS IN PRACTICE]

### §6.2 Permitted Autonomous Actions

Standard permits (from base constitution) PLUS organization-specific expansions:
- [LIST_ANY_ADDITIONAL_AUTONOMOUS_ACTIONS_PERMITTED]

Standard permits minus organization-specific restrictions:
- [LIST_ANY_STANDARD_AUTONOMOUS_ACTIONS_THAT_ARE_FURTHER_RESTRICTED]

### §6.3 AI Hard Limits

Standard hard limits (from base constitution) PLUS:
- [LIST_ANY_ORGANIZATION-SPECIFIC_PROHIBITED_ACTIONS]

### §6.4 Agentic Loop Constraints

- Maximum consecutive agent steps before human checkpoint: [NUMBER, default: 10]
- Maximum artifacts modified in one loop before pause and report: [NUMBER, default: 5]
- [LIST_ANY_ADDITIONAL_LOOP_CONSTRAINTS]

---

## Article VII — Security Boundaries

### §7.1 Zero-Tolerance Rules

Standard zero-tolerance rules (from base constitution) PLUS:
- [LIST_ANY_ORGANIZATION-SPECIFIC_ZERO-TOLERANCE_RULES]

### §7.2 Data Classification

| Classification | Definition | Examples | Agent Handling |
|---------------|-----------|---------|----------------|
| Public | [DEFINE] | [EXAMPLES] | No restrictions |
| Internal | [DEFINE] | [EXAMPLES] | [HANDLING_RULES] |
| Confidential | [DEFINE] | [EXAMPLES] | [HANDLING_RULES] |
| Restricted | [DEFINE] | [EXAMPLES] | [HANDLING_RULES] |

### §7.3 Compliance Requirements

The following regulatory frameworks apply and their requirements are incorporated by reference:
- [FRAMEWORK_1]: [SPECIFIC_REQUIREMENTS_THAT_AFFECT_AGENTS]
- [FRAMEWORK_2]: [SPECIFIC_REQUIREMENTS_THAT_AFFECT_AGENTS]
- [Note: Answer Q5.1 in the questionnaire to determine which apply]

### §7.4 Secrets Management

Approved secrets management system: [SECRETS_MANAGER]
Credential rotation policy: [ROTATION_POLICY]
MFA requirement: [YES/NO]

---

## Article VIII — Memory Boundaries

### §8.1 Memory Retention Policy

| Memory Type | Retention Period | Archive Trigger |
|------------|-----------------|----------------|
| Organizational context | [PERIOD] | [TRIGGER] |
| Patterns | [PERIOD] | [TRIGGER] |
| Decisions | [PERIOD] | [TRIGGER] |
| Session handoffs | [PERIOD, default: 6 months] | [TRIGGER] |
| [OTHER] | [PERIOD] | [TRIGGER] |

### §8.2 Memory Access Restrictions

Beyond base constitution defaults:
- [LIST_ANY_ADDITIONAL_MEMORY_ACCESS_RESTRICTIONS]
- [LIST_ANY_MEMORY_CONTENT_RESTRICTIONS]

### §8.3 Memory Growth Trigger

Vector store migration evaluation triggered at: [ENTRY_COUNT, default: 50] memory entries

---

## Article IX — Enterprise Risk Posture

### §9.1 Risk Appetite

| Domain | Risk Appetite | Rationale |
|--------|--------------|-----------|
| Security incidents | [Zero / Low / Moderate] | [RATIONALE] |
| Data loss | [Zero / Low / Moderate] | [RATIONALE] |
| Regulatory violations | [Zero / Low / Moderate] | [RATIONALE] |
| Delivery speed | [Conservative / Balanced / Aggressive] | [RATIONALE] |
| Product innovation | [Conservative / Balanced / Aggressive] | [RATIONALE] |
| Technology choices | [Conservative / Balanced / Aggressive] | [RATIONALE] |

### §9.2 Risk Escalation Thresholds

| Risk Level | Escalation Required | Mitigation Required | Review Cadence |
|-----------|--------------------|--------------------|----------------|
| CRITICAL | [ESCALATION_PATH] | Within [DAYS] | [CADENCE] |
| HIGH | [ESCALATION_PATH] | Within [DAYS] | [CADENCE] |
| MEDIUM | [ESCALATION_PATH] | Within [DAYS] | [CADENCE] |
| LOW | [ESCALATION_PATH] | [REQUIREMENT] | [CADENCE] |

### §9.3 Risk Acceptance Authority

| Risk Level | Authority |
|-----------|---------|
| CRITICAL | [AUTHORITY] |
| HIGH | [AUTHORITY] |
| MEDIUM | [AUTHORITY] |
| LOW | [AUTHORITY] |

---

## Article X — Operational Expectations

### §10.1 Service Levels

| Metric | Target | Owner |
|--------|--------|-------|
| System availability | [TARGET] | [OWNER] |
| P0 incident response | [TARGET] | [OWNER] |
| P1 incident response | [TARGET] | [OWNER] |
| Gate turnaround | [TARGET] | [OWNER] |
| On-call coverage | [HOURS_AND_TIMEZONE] | [OWNER] |

### §10.2 Operational Reviews

| Review | Cadence | Owner |
|--------|---------|-------|
| Sprint review | [CADENCE] | [OWNER] |
| Risk registry | [CADENCE] | [OWNER] |
| Wiki audit | [CADENCE] | [OWNER] |
| Security posture | [CADENCE] | [OWNER] |
| Constitutional review | [CADENCE, default: annual] | Human operator |

---

## Article XI — Delivery Expectations

### §11.1 DORA Targets

| Metric | Initial Target | Mature Target |
|--------|---------------|--------------|
| Deployment frequency | [FREQUENCY] | [FREQUENCY] |
| Lead time | [DURATION] | [DURATION] |
| Change failure rate | [PERCENT] | [PERCENT] |
| MTTR | [DURATION] | [DURATION] |

### §11.2 Release Requirements

Standard release requirements (from base constitution) PLUS:
- [LIST_ANY_ADDITIONAL_RELEASE_REQUIREMENTS]

Custom release process for [ORGANIZATION_NAME]:
- [DESCRIBE_ANY_CUSTOM_RELEASE_STEPS]

### §11.3 Definition of Done

Standard definition of done PLUS:
- [LIST_ANY_ADDITIONAL_DONE_CRITERIA]

---

## Article XII — Escalation Chains

### §12.1 Functional Escalation

```
[Describe your organization's specific escalation chain, following the base constitution pattern]

Agent → supervisor-agent → [SECURITY_CONTACT] (if security) → [OPERATOR_NAME/ROLE]
```

### §12.2 Incident Escalation

P0/P1 notification: [HOW_TO_REACH_OPERATOR_FOR_INCIDENTS]
P2/P3 management: [PROCESS]

Primary on-call: [NAME/CONTACT]
Secondary on-call: [NAME/CONTACT]

### §12.3 Escalation SLAs

| Escalation Type | Response Required From | Time Limit |
|----------------|----------------------|-----------|
| P0 incident | [AUTHORITY] | [TIME] |
| Security critical | [AUTHORITY] | [TIME] |
| Constitutional conflict | [AUTHORITY] | [TIME] |
| Blocked workflow | [AUTHORITY] | [TIME] |

---

## Article XIII — Constitutional Governance Rules

### §13.1 Constitutional Review Cadence
- Scheduled review: [CADENCE, default: annual]
- Trigger reviews: [LIST_TRIGGERS]

### §13.2 Amendment Process
Standard amendment process (from base constitution) with these organizational modifications:
- Amendment review period: [PERIOD, default: 48 hours]
- Additional approvers required: [LIST]

---

## Article XIV — Amendment Procedure

### §14.1 Ratification

This constitution enters into force when:
1. All [PLACEHOLDER] fields are filled in
2. Compliance with §5.1 compliance requirements is confirmed
3. [OPERATOR_NAME] signs off by updating frontmatter
4. Status is updated from `draft` to `active`

Ratification date: [DATE]
Ratified by: [NAME, ROLE]

---

## Appendix A — Organization-Specific Addenda

_[Add any organization-specific rules that don't fit the standard articles above]_

### Addendum 1 — [TITLE]
[CONTENT]

### Addendum 2 — [TITLE]
[CONTENT]

---

## Template Usage Notes

**To create a constitution for a new project:**
1. Copy this template to `constitution/enterprise-constitution.md`
2. Complete `constitution/enterprise-questionnaire.md`
3. Use questionnaire answers to fill all [PLACEHOLDER] fields
4. Review all articles for completeness
5. Ratify per §14.1

**Version history:**
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-05-09 | Initial template | architect-agent |
