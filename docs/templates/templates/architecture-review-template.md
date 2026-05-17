---
type: architecture-review
version: "1.0"
id: ARCH-REVIEW-<YYYY-MM-DD>-<slug>
status: draft | in-review | approved | rejected | needs-revision
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
author: architect-agent
reviewer: <name or agent>
prd-ref: prds/<slug>.md
rfc-ref: rfc/<date>-<slug>.md
adr-ref: architecture/decisions/ADR-NNN.md
tier: L | M
review-deadline: <YYYY-MM-DD>
---

# Architecture Review: <Feature / System Name>

> **Status:** `DRAFT`
> **Review deadline:** `<YYYY-MM-DD>`
> **Linked ADR:** `architecture/decisions/ADR-NNN.md`
> **Linked RFC:** `rfc/<date>-<slug>.md` _(if applicable)_

---

## ① Review Purpose

**What is being reviewed:**
`<2–3 sentences: the system or feature design being evaluated, at what stage, and what decision this review is intended to make or validate>`

**Decision required:**
`<Approve for implementation | Approve with conditions | Reject and revise | Escalate for senior review>`

**Review scope:**
- [ ] New system design
- [ ] Significant modification to existing system
- [ ] Cross-team interface change
- [ ] Security-critical component
- [ ] Data architecture change
- [ ] Performance-critical path

---

## ② Design Summary

### 2.1 Problem Being Solved

`<What user, business, or technical problem does this design address? Reference PRD if applicable.>`

### 2.2 Proposed Design

`<3–5 sentences: the core technical approach at a level any senior engineer can understand>`

### 2.3 System Diagram

```
# ASCII diagram of the proposed architecture
# Show: components, data flows, external dependencies, boundaries

[Client] → [API Gateway] → [Service A]
                               ↓
                          [Service B] → [Database]
                               ↓
                          [Queue] → [Worker]
```

### 2.4 Key Design Decisions

| Decision | Options Evaluated | Chosen | Rationale |
|---------|------------------|--------|-----------|
| `<decision topic>` | A / B / C | A | `<why>` |

---

## ③ Quality Attribute Evaluation

Rate each attribute as: STRONG / ADEQUATE / WEAK / NOT ADDRESSED

### 3.1 Scalability

**Rating:** `STRONG | ADEQUATE | WEAK | NOT ADDRESSED`

| Dimension | Current | Design Target | Approach |
|-----------|---------|--------------|----------|
| Read throughput | `<current RPS>` | `<target RPS>` | `<horizontal scaling / caching / etc>` |
| Write throughput | | | |
| Data volume | `<current>` | `<target>` | |
| Concurrent users | | | |

**Scaling bottlenecks identified:**
- `<bottleneck and mitigation>`

**Review finding:** `<what the reviewer concludes>`

---

### 3.2 Reliability & Resilience

**Rating:** `STRONG | ADEQUATE | WEAK | NOT ADDRESSED`

**Failure mode analysis:**

| Failure Mode | Probability | Impact | Mitigation | Residual Risk |
|-------------|------------|--------|-----------|--------------|
| `<component>` fails | H/M/L | H/M/L | `<circuit breaker / retry / fallback>` | H/M/L |
| `<dependency>` unavailable | | | | |

**SLA targets:**
- Availability target: `<99.X%>`
- RTO (Recovery Time Objective): `<N minutes>`
- RPO (Recovery Point Objective): `<N minutes>`

**Review finding:** `<what the reviewer concludes>`

---

### 3.3 Security

**Rating:** `STRONG | ADEQUATE | WEAK | NOT ADDRESSED`

**STRIDE threat assessment:**

| Threat | Surface | Mitigation | Status |
|--------|---------|-----------|--------|
| Spoofing | `<auth entry points>` | `<JWT / mTLS / API keys>` | Addressed / Gap |
| Tampering | `<data in transit/rest>` | `<TLS / signing / checksums>` | |
| Repudiation | `<audit trail>` | `<immutable logs>` | |
| Information Disclosure | `<data exposure risk>` | `<encryption / masking>` | |
| Denial of Service | `<rate limiting>` | `<WAF / rate limits>` | |
| Elevation of Privilege | `<authz model>` | `<RBAC / least privilege>` | |

**Security gaps identified:**
- `<gap>` — remediation: `<action>`

**Security review required:** YES / NO

**Review finding:** `<what the reviewer concludes>`

---

### 3.4 Operability

**Rating:** `STRONG | ADEQUATE | WEAK | NOT ADDRESSED`

| Dimension | Coverage | Notes |
|-----------|---------|-------|
| Logging | structured JSON / plain text / none | `<what is logged>` |
| Metrics | `<key metrics exposed>` | `<tool>` |
| Tracing | distributed / local / none | `<tool>` |
| Alerting | `<alert coverage>` | `<tool>` |
| Runbook | exists / needs-writing / N/A | `<path>` |
| Debugging | `<how to debug in production>` | |

**Operational gaps:**
- `<gap>` — remediation: `<action>`

**Review finding:** `<what the reviewer concludes>`

---

### 3.5 Maintainability

**Rating:** `STRONG | ADEQUATE | WEAK | NOT ADDRESSED`

| Dimension | Assessment | Notes |
|-----------|-----------|-------|
| Separation of concerns | `<clear / mixed>` | |
| Coupling | `<loose / tight>` — explain | |
| Testability | `<easy / difficult to unit test>` | |
| Documentation | `<complete / partial / missing>` | |
| Onboarding complexity | `<low / medium / high>` | |

**Technical debt introduced:**
- `<debt item>` — acceptable because: `<reason>` / remediation sprint: `<sprint>`

**Review finding:** `<what the reviewer concludes>`

---

### 3.6 Cost Efficiency

**Rating:** `STRONG | ADEQUATE | WEAK | NOT ADDRESSED`

| Resource | Current | Projected (new design) | Notes |
|---------|---------|----------------------|-------|
| Compute | `<$X/month>` | `<$Y/month>` | |
| Storage | | | |
| Network egress | | | |
| Third-party APIs | | | |
| Total | | | |

**Cost concerns:**
- `<concern>` — mitigation: `<action>`

**Review finding:** `<what the reviewer concludes>`

---

### 3.7 Data Architecture

**Rating:** `STRONG | ADEQUATE | WEAK | NOT ADDRESSED` / N/A

| Dimension | Assessment |
|-----------|-----------|
| Data model correctness | `<normalized / denormalized — appropriate?>` |
| Query performance | `<indexes adequate for access patterns?>` |
| Data integrity | `<constraints, foreign keys, validation>` |
| Migration safety | `<additive / breaking — migration plan exists?>` |
| Data retention | `<policy defined?>` |
| PII handling | `<classified / encrypted / masked as required?>` |

**Review finding:** `<what the reviewer concludes>`

---

## ④ Non-Functional Requirements Compliance

| NFR | Requirement | Design Meets It | Evidence | Gap |
|-----|-------------|----------------|---------|-----|
| Latency | P99 < `<Xms>` | YES / NO / PARTIALLY | `<design element that achieves this>` | `<if gap>` |
| Availability | `<SLA%>` | | | |
| Data durability | `<RPO>` | | | |
| Compliance | `<GDPR/SOC2/PCI>` | | | |

---

## ⑤ Design Risks

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|------|------------|--------|-----------|-------|
| R-01 | `<risk>` | H/M/L | H/M/L | `<mitigation>` | |
| R-02 | Design doesn't scale to `<N×>` current load | M | H | Load test before Phase 2 rollout | |

---

## ⑥ Open Design Questions

Questions that must be resolved before implementation begins.

| ID | Question | Impact if Unresolved | Owner | Due |
|----|---------|---------------------|-------|-----|
| Q-01 | `<design question>` | blocking / non-blocking | | |

---

## ⑦ Alternatives Evaluated

_Required: at least 2 alternatives must have been evaluated._

### Alternative A: `<Name>`

`<Brief description>`

**Rejected because:**
- `<specific technical or business reason>`

### Alternative B: `<Name>`

`<Brief description>`

**Rejected because:**
- `<specific technical or business reason>`

---

## ⑧ Implementation Guidance

Specific guidance the engineering team must follow during implementation.

### 8.1 Mandatory Patterns

- `<pattern that must be followed>` — reason: `<why>`
- `<pattern>` — reason:

### 8.2 Mandatory Constraints

- `<constraint>` — reason: `<why fixed>`

### 8.3 Recommended Patterns

- `<suggestion>` — reason: `<rationale>`

---

## ⑨ Review Verdict

**Overall verdict:** `APPROVED | APPROVED WITH CONDITIONS | NEEDS REVISION | REJECTED`

**Verdict date:** `<YYYY-MM-DD>`

**Issued by:** `<architect-agent | senior-architect | name>`

### Summary Ratings

| Attribute | Rating | Concern Level |
|-----------|--------|--------------|
| Scalability | STRONG / ADEQUATE / WEAK | H/M/L/None |
| Reliability | | |
| Security | | |
| Operability | | |
| Maintainability | | |
| Cost | | |
| Data Architecture | | |

### Conditions (if conditional approval)

These must be addressed before implementation begins or before a specified milestone:

| # | Condition | Due | Owner | Status |
|---|---------|-----|-------|--------|
| 1 | `<condition>` | Before coding | | Open |
| 2 | `<condition>` | Before Phase 2 | | Open |

### Blocking Issues (if NEEDS REVISION or REJECTED)

| # | Issue | Severity | Required Resolution |
|---|-------|---------|-------------------|
| 1 | `<issue>` | BLOCKING | `<what must change>` |

### Resulting ADR

`architecture/decisions/ADR-NNN-<slug>.md` — created / pending

---

## ⑩ Review Signatures

| Role | Name | Verdict | Date | Notes |
|------|------|---------|------|-------|
| Architect | architect-agent | Approved / Changes Needed | | |
| Security | security-agent | Approved / Not Required | | |
| Eng Lead | | Acknowledged | | |
| PM | | Acknowledged | | |
