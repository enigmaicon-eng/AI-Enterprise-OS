# Prospective Constitutional Screening
**ID:** GOV-PCS-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Screens proposed changes to agent definitions, workflows, capabilities, and policies BEFORE they are implemented — detecting potential constitutional violations prospectively rather than reactively. The existing constitutional governor (zero-trust security layer) operates at execution time. This system operates at design time, preventing constitutional risks from entering the codebase in the first place.

---

## Screening Scope

All of the following require prospective constitutional screening before implementation:

```yaml
screening_required_for:
  - New agent definitions (before MASTER-REGISTRY addition)
  - Changes to existing agent capability definitions
  - New workflow steps that involve external data or authority delegation
  - New connector integrations (especially those with write access to external systems)
  - Knowledge base entries in governance/, constitution/, or docs/governance/
  - Changes to pre-authorization pool grants
  - New autonomy capability certifications (v36+)
  - Any proposed exception to a constitutional principle
```

---

## Constitutional Risk Taxonomy

```yaml
constitutional_risk_types:
  C001_HUMAN_DIGNITY:
    pattern: agent actions that profile, discriminate, or demean individuals
    screening_trigger: any agent with access to personal data + authority to take external actions
    
  C002_TRANSPARENCY:
    pattern: agent designed to conceal its AI nature or reasoning
    screening_trigger: any user-facing agent definition; any capability to mimic human
    
  C003_TRUTH:
    pattern: agent capability that could generate plausible but false content at scale
    screening_trigger: any content-generation capability without grounding requirements
    
  C004_NON_MALEFICENCE:
    pattern: agent action class that could cause harm if misapplied
    screening_trigger: any agent with write access to production systems or external APIs
    
  C005_BENEFICENCE:
    pattern: agent design that optimizes for narrow metric at expense of broader good
    screening_trigger: any agent with autonomous optimization loop
    
  C006_JUSTICE:
    pattern: systematic bias in agent selection, prioritization, or output
    screening_trigger: agents that rank, score, or prioritize people or resources
    
  C007_AUTONOMY:
    pattern: agent design that removes human meaningful choice or control
    screening_trigger: any agent with authority over irreversible actions
    
  C008_PRIVACY:
    pattern: capability to collect, retain, or expose personal data beyond necessity
    screening_trigger: any connector with access to personal data; any data retention change
    
  C009_SECURITY:
    pattern: design that introduces new attack surface or weakens existing controls
    screening_trigger: any security system change; any new external input pathway
    
  C010_ACCOUNTABILITY:
    pattern: design that obscures attribution or prevents audit
    screening_trigger: any logging change; any anonymization capability
    
  C011_SUSTAINABILITY:
    pattern: resource consumption pattern that is not sustainable at scale
    screening_trigger: any agent with unbounded resource consumption potential
    
  C012_CONSTITUTIONAL_FIDELITY:
    pattern: any attempt to weaken, circumvent, or reinterpret constitutional constraints
    screening_trigger: any change to constitution/, governance/, or security/ documents
```

---

## Screening Protocol

```
Step 1: Automated Pre-Screening (< 5 minutes)
  For every proposed change:
  a. Identify which screening triggers apply
  b. Run automated pattern detection for each triggered C00X risk type
  c. Output: {risk_type: [LOW, MEDIUM, HIGH, CRITICAL], evidence: string}
  
  If all risks LOW: auto-approve; log result
  If any MEDIUM+: proceed to human screening
  If any CRITICAL: BLOCK; T4 immediate notification; no further action until resolved

Step 2: Human Constitutional Review (MEDIUM+ risks)
  Governance Org reviewer (T3) examines:
  a. What capability or behavior is being introduced?
  b. Under what conditions could this lead to a constitutional violation?
  c. What mitigations are proposed? Are they sufficient?
  d. Are mitigations structural (hard constraint) or procedural (soft policy)?
  
  Prefer structural mitigations (always enforced) over procedural (depends on compliance)
  
  Output: constitutional_screening_report.yaml with:
    - finding per C00X: CLEAR | REQUIRES_MITIGATION | CONDITIONAL_APPROVAL | REJECTED
    - required_mitigations: [string]
    - conditions_if_approved: [string]
    - reviewer: string
    - reviewed_at: ISO8601

Step 3: Mitigation Verification
  If REQUIRES_MITIGATION: proposer must implement mitigations before approval
  Re-screening required after mitigation implementation
  
Step 4: Approval
  LOW risk (auto-approved): logged; no further action
  MEDIUM risk (conditional): T3 sign-off
  HIGH risk: T4 approval required; mitigations must be structural
  CRITICAL (block): T5 required to unblock; architectural redesign typically needed
```

---

## Screening Report Schema

```yaml
constitutional_screening_report:
  report_id: PCS-{NNN}
  subject: string                        # what is being screened
  subject_type: AGENT | WORKFLOW | CONNECTOR | POLICY | CAPABILITY
  
  requested_at: ISO8601
  completed_at: ISO8601
  
  trigger_analysis:
    triggers_identified: [string]        # which C00X types triggered
    automated_risk_scores: {string: number}
    
  findings:
    - principle_id: string               # C001–C012
      finding: CLEAR | REQUIRES_MITIGATION | CONDITIONAL_APPROVAL | REJECTED
      evidence: string
      required_mitigations: [string]
      
  overall_outcome: APPROVED | APPROVED_WITH_CONDITIONS | REJECTED
  conditions: [string]
  
  approved_by: string
  approval_tier: T3 | T4 | T5
```

All reports stored at `memory/governance/constitutional-screening-reports/`.

---

## Integration with CI/CD

Prospective screening is a mandatory gate in the CI/CD pipeline:

```
Stage 4 (Governance Gates) in cicd-pipeline-architecture.md includes:
  - Run prospective_constitutional_screen(changed_files)
  - If any finding CRITICAL: BLOCK pipeline (cannot be overridden by CI)
  - If any finding HIGH: require T4 approval before proceeding
  - Screening report attached to deployment record
```

---

## Governance

**Screening authority:** Governance Org (human review); automated (pre-screening)
**CRITICAL block:** Cannot be overridden except by T5 + quorum governor agreement
**Screening records:** Permanent retention (constitutional decisions are never purged)
**Annual calibration:** Review false positive rate; recalibrate automated detector patterns
**Feedback loop:** Constitutional violations at runtime trigger review of prospective screening that allowed the change
