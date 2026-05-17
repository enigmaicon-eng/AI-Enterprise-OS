---
type: constitutional-questionnaire
version: 1.0.0
created: 2026-05-09
purpose: Elicit the organization-specific answers needed to ratify the Enterprise Constitution
owner: human-operator
---

# Enterprise Constitution Questionnaire

This questionnaire gathers the specific answers your organization needs to fill in the `[TO BE DEFINED]` sections of `enterprise-constitution.md` and resolve the open questions in `memory/open-questions.md`.

Complete this questionnaire before running any product initiative. Answers become authoritative organizational configuration — treat them with the same care as legal or policy documents.

**How to use:**
1. Answer every question in your section
2. Mark questions you cannot answer yet as DEFERRED (with a review date)
3. Hand the completed answers to the orchestrator with: "Ratify the constitution with these answers"
4. The system will fill in the constitution and update open questions

---

## Section 1: Organization Identity

**Q1.1** What is the name of this organization / product?
```
Answer: _______________
```

**Q1.2** What is the mission statement? (1–2 sentences: who you serve and what you do for them)
```
Answer: _______________
```

**Q1.3** What is the primary business model?
- [ ] B2B SaaS
- [ ] B2C consumer product
- [ ] B2B2C platform
- [ ] Marketplace
- [ ] Services / consulting
- [ ] Internal tool (no external customers)
- [ ] Other: _______________

**Q1.4** Who is the human operator / product owner for this OS instance?
```
Name/Role: _______________
Email: _______________
Availability for P0 escalations: _______________
```

**Q1.5** Is there a secondary approver for when the primary operator is unavailable?
```
Name/Role: _______________
Email: _______________
```

---

## Section 2: Business Constraints

**Q2.1** What markets or customer segments is this organization NOT authorized to serve?
```
Answer: _______________
```

**Q2.2** Are there any products or features this organization is constitutionally prohibited from building?
(Examples: gambling, weapons, tobacco, specific geographies)
```
Answer: _______________
```

**Q2.3** What is the budget allocation authority of the AI OS (i.e., what can agents recommend spending on)?
- [ ] Agents can recommend any spend — human always approves actuals
- [ ] Agents are restricted to recommending spend within $[___] per sprint
- [ ] No spend recommendations — agents must ask before even estimating

**Q2.4** Does the organization have any active competitive non-disclosure agreements that restrict what data agents can use?
```
Answer: _______________
```

**Q2.5** Are there any partnership or OEM agreements that restrict technology choices?
```
Answer: _______________
```

---

## Section 3: Technical Foundation (resolves Q-001, Q-003)

**Q3.1** What is the primary programming language?
```
Answer: _______________
(Examples: TypeScript, Python, Go, Java, Rust)
```

**Q3.2** What is the primary application framework?
```
Answer: _______________
(Examples: Next.js, FastAPI, Spring Boot, Rails, Express)
```

**Q3.3** What is the primary database?
```
Answer: _______________
(Examples: PostgreSQL, MySQL, MongoDB, DynamoDB)
```

**Q3.4** What cloud provider(s) does the organization use?
- [ ] AWS
- [ ] Google Cloud Platform
- [ ] Microsoft Azure
- [ ] Self-hosted / on-premise
- [ ] Multi-cloud: _______________
- [ ] Not decided yet

**Q3.5** Are there any cloud regions that are required or prohibited?
(Examples: EU-only for GDPR, US-only for data sovereignty)
```
Answer: _______________
```

**Q3.6** Are there any technology-level constraints from existing infrastructure or agreements?
(Examples: must use company SSO, must use approved container registry, must use FIPS-140 encryption)
```
Answer: _______________
```

**Q3.7** What is the CI/CD platform?
```
Answer: _______________
(Examples: GitHub Actions, GitLab CI, Jenkins, CircleCI, BuildKite)
```

**Q3.8** What is the code repository platform?
```
Answer: _______________
(Examples: GitHub, GitLab, Bitbucket, Azure DevOps)
```

---

## Section 4: User Base (resolves Q-002)

**Q4.1** Is this greenfield (no existing users) or does an existing user base exist?
- [ ] Greenfield — no existing users
- [ ] Existing user base: approximately _______ users
- [ ] Internal tool: approximately _______ internal users

**Q4.2** If existing users: what geography / jurisdiction are most users in?
```
Answer: _______________
```

**Q4.3** What user authentication method is in place or planned?
- [ ] Email + password
- [ ] SSO (specify provider): _______________
- [ ] Social login (Google, GitHub, etc.)
- [ ] Magic link
- [ ] Enterprise SAML
- [ ] Not yet decided

**Q4.4** Are users internal employees, external customers, or both?
```
Answer: _______________
```

---

## Section 5: Compliance Requirements (resolves Q-004)

**Q5.1** Which regulatory frameworks apply to this organization?

| Framework | Applies? | Scope |
|---------|---------|-------|
| GDPR (EU data protection) | Yes / No / Unsure | _____ |
| CCPA (California privacy) | Yes / No / Unsure | _____ |
| SOC 2 Type II | Yes / No / Unsure | _____ |
| HIPAA (health data) | Yes / No / Unsure | _____ |
| PCI DSS (payment cards) | Yes / No / Unsure | _____ |
| ISO 27001 | Yes / No / Unsure | _____ |
| FedRAMP (US federal) | Yes / No / Unsure | _____ |
| Other: _______ | Yes / No / Unsure | _____ |

**Q5.2** Does the organization handle any of the following sensitive data types?
- [ ] Health / medical information
- [ ] Financial / payment data
- [ ] Government / national security data
- [ ] Biometric data
- [ ] Data about minors (under 18)
- [ ] Criminal records
- [ ] None of the above

**Q5.3** What data retention requirements apply?
```
Answer: _______________
(Example: financial data retained 7 years, user data deleted on request within 30 days)
```

**Q5.4** Are there data residency requirements (data must stay in specific geography)?
```
Answer: _______________
```

**Q5.5** Is there a current security audit, penetration test, or compliance assessment in progress?
```
Answer: _______________
```

---

## Section 6: Risk Posture

**Q6.1** How would you characterize your organization's risk appetite for security incidents?
- [ ] Zero tolerance — any incident is a constitutional crisis
- [ ] Low tolerance — incidents trigger formal review
- [ ] Moderate — incidents are managed operationally
- [ ] (Security incidents should always be Zero tolerance; this is a constitutional hard rule)

**Q6.2** How would you characterize your risk appetite for delivery speed vs. governance adherence?
- [ ] Speed-first — willing to accept more risk to ship faster
- [ ] Balanced — standard governance, standard speed
- [ ] Governance-first — willing to accept slower delivery to maintain stricter governance

**Q6.3** What is your organization's tolerance for AI-generated outputs that may be incorrect?
- [ ] Very low — AI outputs are reviewed by a human before any user sees them
- [ ] Low — AI outputs are spot-checked; automated eval is the primary control
- [ ] Moderate — AI outputs are monitored in production; issues addressed reactively
- [ ] Context-dependent: _______________

**Q6.4** What is the maximum acceptable time for the organization to be in a degraded state (partial outage)?
```
Answer: _______________
(Example: < 4 hours degraded; < 30 minutes full outage)
```

**Q6.5** What is the organization's data backup and recovery requirement?
```
Answer: _______________
(Example: RTO < 4 hours, RPO < 1 hour)
```

---

## Section 7: Operational Expectations

**Q7.1** What are the expected operating hours for the product?
- [ ] 24/7 (always-on)
- [ ] Business hours (8am–6pm, specify timezone: _______)
- [ ] Specified schedule: _______________

**Q7.2** What is the target uptime SLA?
- [ ] 99.99% (< 53 minutes downtime/year)
- [ ] 99.9% (< 8.7 hours downtime/year)
- [ ] 99.5% (< 44 hours downtime/year)
- [ ] 99% (< 87 hours downtime/year)
- [ ] Other: _______________

**Q7.3** What is the P0 incident response requirement?
```
Answer: _______________
(Example: acknowledge within 15 minutes, resolve within 2 hours)
```

**Q7.4** Is there a defined maintenance window?
```
Answer: _______________
(Example: Sundays 2am–4am UTC)
```

**Q7.5** Who is responsible for on-call rotation?
```
Answer: _______________
```

---

## Section 8: Delivery Expectations (resolves Q-007)

**Q8.1** What is the target deployment cadence?
- [ ] Continuous deployment (multiple times per day)
- [ ] Daily deployment
- [ ] Weekly deployment
- [ ] Bi-weekly (per sprint)
- [ ] Monthly
- [ ] On-demand (no fixed cadence)

**Q8.2** What is the sprint length?
- [ ] 1 week
- [ ] 2 weeks (recommended)
- [ ] 3 weeks
- [ ] 4 weeks
- [ ] No fixed sprints

**Q8.3** What is the minimum acceptable QA coverage for a feature before release?
- [ ] All happy-path cases + top 5 edge cases
- [ ] Full test plan as defined in QA plan template
- [ ] Automated tests only
- [ ] Manual + automated (specify ratio): _______________

**Q8.4** What is the maximum acceptable change failure rate?
- [ ] < 5% (elite)
- [ ] < 15% (high)
- [ ] < 30% (medium)
- [ ] Other: _______________

---

## Section 9: AI Autonomy Preferences

**Q9.1** How much should AI agents operate without checking in with you?

| Scenario | Autonomous OK | Check in First |
|---------|--------------|----------------|
| Write a draft PRD | ☐ | ☐ |
| Make architecture recommendations | ☐ | ☐ |
| Run a full feature development cycle | ☐ | ☐ |
| Deploy to staging environment | ☐ | ☐ |
| Deploy to production (1%) | ☐ | ☐ |
| Deploy to production (100%) | ☐ | ☐ |
| Send any external communication | ☐ | ☐ |
| Create a new agent or workflow | ☐ | ☐ |
| Modify governance documents | ☐ | ☐ |

**Q9.2** Are there any autonomous agent actions you are explicitly uncomfortable with beyond the constitutional defaults?
```
Answer: _______________
```

**Q9.3** How do you want to be notified for human-required decisions?
- [ ] Message in the current Claude session
- [ ] Email notification
- [ ] Both
- [ ] Other: _______________

**Q9.4** What is the maximum number of automated steps you are comfortable with between human checkpoints for L-tier work?
- [ ] 3 steps
- [ ] 5 steps
- [ ] 10 steps (constitutional default)
- [ ] No limit

---

## Section 10: Security Preferences

**Q10.1** What secrets management system should agents reference for credentials?
```
Answer: _______________
(Examples: AWS Secrets Manager, HashiCorp Vault, 1Password, environment variables)
```

**Q10.2** What is the password/credential rotation policy?
```
Answer: _______________
(Example: rotate every 90 days; immediately on suspected compromise)
```

**Q10.3** Is multi-factor authentication required for all human operator accounts?
- [ ] Yes (required)
- [ ] No
- [ ] Not yet

**Q10.4** What is the approved list of external services that agents may recommend integrating with?
```
Answer: _______________
(Examples: Stripe, Twilio, SendGrid, Auth0, Cloudflare)
```

**Q10.5** Are there any external services that are explicitly prohibited?
```
Answer: _______________
```

---

## Section 11: Autonomous Workflow Preferences (resolves Q-008)

**Q11.1** Should any workflows run on a schedule without human initiation?
- [ ] No — all workflows are human-initiated
- [ ] Yes — specify which:
  - [ ] Wiki maintenance (weekly)
  - [ ] Memory freshness check (weekly)
  - [ ] Risk registry review (monthly)
  - [ ] Metrics report generation (per sprint)
  - [ ] Other: _______________

**Q11.2** If autonomous workflows are enabled, what is the maximum impact they may have without human confirmation?
- [ ] Read-only only (no file writes)
- [ ] Write to wiki and memory only
- [ ] Write to any file in the OS
- [ ] Other: _______________

---

## Section 12: Organizational Learning Preferences

**Q12.1** How should the organization handle post-incident reviews?
- [ ] Required for P0 only
- [ ] Required for P0 and P1 (recommended)
- [ ] Required for all incidents
- [ ] Recommended but not required

**Q12.2** How should sprint retrospectives be structured?
- [ ] Formal (full retro doc, action items tracked)
- [ ] Lightweight (brief summary, lessons captured)
- [ ] As-needed (only when the sprint had issues)

**Q12.3** How should architectural decisions be preserved?
- [ ] Full ADR for all L-tier decisions (required by constitution)
- [ ] ADR for L-tier; brief decision note for M-tier
- [ ] ADR for all decisions (more strict than constitutional default)

---

## Completion Checklist

Before submitting this questionnaire:

- [ ] All Section 1 questions answered (organization identity)
- [ ] All Section 3 questions answered or marked DEFERRED (tech stack)
- [ ] All Section 4 questions answered or marked DEFERRED (user base)
- [ ] All Section 5 questions answered or marked DEFERRED (compliance)
- [ ] Section 9 preferences reviewed (AI autonomy)
- [ ] Human operator identified (Q1.4)
- [ ] P0 escalation contact confirmed (Q1.4 + Q1.5)

**Minimum viable answers to start the first initiative:**
- Q1.1 (org name), Q1.4 (operator), Q3.1 (language), Q3.4 (cloud), Q4.1 (greenfield?), Q5.1 (compliance)

---

## Submission Instructions

Once completed, provide this questionnaire to the OS with:

> "I've completed the constitutional questionnaire. Use these answers to ratify the Enterprise Constitution and resolve all open questions. Here are my answers: [paste completed answers]"

The orchestrator will:
1. Update `memory/open-questions.md` Q-001 through Q-005
2. Fill in `[TO BE DEFINED]` sections in `constitution/enterprise-constitution.md`
3. Update `constitution/enterprise-constitution.md` status to ACTIVE
4. Create ADR-002 for the technology stack decisions
5. Update `memory/decisions.md` with ratified constitutional decisions
