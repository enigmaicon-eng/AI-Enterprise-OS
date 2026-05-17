# Regulatory Conflict Arbitration Matrix
**ID:** GOV-RCM-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Compliance Org + Legal | **Updated:** 2026-05-16

---

## Purpose

Provides authoritative arbitration rules for conflicts between regulatory requirements that apply to the Enterprise AI OS. Regulatory conflicts are not hypothetical — GDPR data deletion rights directly conflict with SOX audit immutability requirements, and CCPA data portability conflicts with security data minimization. This matrix defines which regulation takes precedence in each conflict scenario and documents the legal basis for the resolution.

---

## Conflict Taxonomy

Regulatory conflicts arise in four patterns:

| Pattern | Description | Example |
|---------|-------------|---------|
| RETENTION_DELETION | Regulation A requires retention; Regulation B requires deletion | SOX vs. GDPR Right to Erasure |
| TRANSPARENCY_SECURITY | Regulation A requires disclosure; Regulation B requires concealment | Privacy notices vs. security through obscurity |
| PORTABILITY_CONTROL | Regulation A requires data export; Regulation B restricts data movement | CCPA portability vs. data residency |
| CONSENT_NECESSITY | Regulation A requires consent; Regulation B requires processing without consent | GDPR consent vs. AML transaction monitoring |

---

## Conflict Resolution Matrix

### GDPR Art. 17 (Right to Erasure) vs. SOX Section 802 (Audit Immutability)

**Conflict:** A data subject requests deletion of personal data that appears in financial audit records.

**Resolution: SOX takes precedence for financial audit records.**

```
Basis: GDPR Art. 17(3)(b) explicitly exempts erasure when processing is 
necessary for compliance with a legal obligation. SOX Section 802 creates 
a legal obligation to maintain financial records with integrity for 7 years.

Implementation:
  - Financial audit records (execution-ledger.jsonl, audit-chain.jsonl, 
    approval-records.jsonl) are EXEMPT from erasure requests
  - Personal data in non-financial records: erasure within 30 days
  - Pseudonymization applied to financial records where possible 
    (replace PII with internal IDs) — does not satisfy erasure but 
    reduces exposure
  - Data subject notified of exemption + legal basis
  - DPO sign-off required for each exemption claim

Documentation: Legal memo LM-GDPR-SOX-001 (compliance/legal-memos/)
Review: Annual (or on regulatory update)
```

### GDPR Art. 17 vs. HIPAA 45 CFR §164.530(j) (Medical Record Retention)

**Resolution: HIPAA retention requirement takes precedence for health data.**

```
Basis: GDPR Art. 17(3)(b) — legal obligation exemption.
HIPAA requires 6-year retention of policies and records.

Implementation:
  - Health-related data in any workflow: HIPAA retention rules apply
  - Erasure requests for health data: declined with legal basis explanation
  - Minimum necessary principle applied to health data at collection point
```

### GDPR Art. 20 (Data Portability) vs. Data Residency Requirements (e.g., German BDSG, Russian FZ-152)

**Resolution: Data residency takes precedence; portability limited to compliant formats.**

```
Basis: Lex specialis — more specific local law constrains general GDPR right.
German BDSG and Russian FZ-152 restrict cross-border data transfer.

Implementation:
  - Data portability requests fulfilled only for data that can legally leave the jurisdiction
  - Data subject informed of residency restriction; provided summary of data held
  - No export of data subject to residency restriction without DPO + CISO approval
```

### GDPR Art. 6 (Lawful Processing) vs. AML/KYC Requirements (FATF, EU 6AMLD)

**Conflict:** AML transaction monitoring requires processing financial behavior without explicit consent.

**Resolution: AML legal obligation takes precedence over consent requirement.**

```
Basis: GDPR Art. 6(1)(c) — processing necessary for compliance with legal obligation.
AML/KYC processing does not require data subject consent.

Implementation:
  - AML-triggered processing documented with legal basis at time of processing
  - Privacy notices updated to disclose AML processing (transparency obligation met)
  - AML data retained per FATF guidelines (5 years post-relationship end)
  - AML data exempt from erasure requests per Art. 17(3)(b)
```

### EU AI Act (High-Risk System Transparency) vs. Trade Secret / Security Through Obscurity

**Conflict:** EU AI Act Art. 13 requires transparency about AI system logic; some logic is trade secret or security-sensitive.

**Resolution: Tiered disclosure — summary transparency complies with EU AI Act; security-sensitive internals redacted.**

```
Basis: EU AI Act Art. 13 requires "sufficient transparency" — not full source disclosure.
Trade secret protection under EU Trade Secrets Directive (2016/943).

Implementation:
  - Public-facing AI system documentation: describes purpose, capabilities, limitations, 
    training data categories, accuracy metrics — satisfies Art. 13
  - Constitutional principles (12): disclosed in full (governance transparency)
  - Internal security system logic: summarized; full details available to regulators 
    under NDA/regulatory access agreement
  - DPO + CISO approve each disclosure document annually
```

### CCPA "Do Not Sell" vs. Data Sharing Required by Law Enforcement

**Resolution: Law enforcement legal process (subpoena/court order) overrides CCPA Do Not Sell.**

```
Basis: CCPA Section 1798.145(a)(1) — does not restrict disclosures required by law.
Implementation:
  - Valid legal process (subpoena, court order, national security letter) triggers 
    legal hold and disclosure process
  - Legal team reviews legal process validity before disclosure
  - Disclosure logged; data subject notified post-disclosure if legally permitted
  - CCPA opt-out status does not affect legally required disclosures
```

---

## Decision Process for Novel Conflicts

When a new regulatory conflict arises not covered by this matrix:

```
Step 1: Identification (Compliance Org)
  - Document both regulations, their requirements, and the specific conflict
  - Assess severity: does the conflict create legal exposure today?

Step 2: Legal Analysis (Legal + DPO + CISO)
  - Research lex specialis, lex posterior, and explicit exemption language
  - Identify any regulatory guidance or case law
  - Draft proposed resolution with legal basis

Step 3: T4 Review
  - Compliance Org presents analysis to T4
  - T4 approves resolution or requests escalation to legal counsel

Step 4: Matrix Update
  - Add resolution to this document
  - Notify affected workflows and agents

SLA: Novel conflict resolution within 30 days of identification; 
     72 hours if active legal exposure identified.
```

---

## Governance

**Owner:** Compliance Org (primary), Legal (review), DPO (GDPR matters), CISO (security matters)
**Review cadence:** Annual full review; triggered review on any regulatory change
**Escalation:** Unresolved conflicts escalate to T5 (executive) + external legal counsel
**Audit:** All conflict resolutions and exemption claims logged to `memory/compliance/regulatory-decisions.jsonl`
**Regulatory tracker:** New regulations monitored via `compliance/regulatory-change-monitor.md`
