# Architecture Review Workflow

**Workflow ID:** `architecture-review`
**Trigger:** New system, significant change, RFC submitted, ADR proposed
**Orgs:** ARCH → SECURITY → ENG (feedback) → SUPERVISOR
**Output:** Approved ADR or RFC + architecture doc

---

## When to Trigger This Workflow

- New service or major system component
- Cross-service data model change
- Authentication or authorization model change
- Infrastructure topology change
- Any decision that would be hard or expensive to reverse
- Explicit `RFC` or `ADR` request

---

## Steps

### STEP 01: Problem Statement & Options
**Agent:** `architect-agent`
- Define the decision to be made (not the solution)
- List at least 3 options including "do nothing" or "use existing approach"
- Document constraints (cost, timeline, team skills, existing systems)

**Gate:** Options are genuinely different alternatives, not variations of one answer

---

### STEP 02: Option Analysis
**Agent:** `architect-agent`
For each option, evaluate:
- Implementation complexity
- Operational complexity  
- Scalability ceiling
- Security implications
- Cost (build + run + maintain)
- Reversibility
- Team knowledge/risk

Use a scoring matrix (weights per context).

---

### STEP 03: Security Review
**Agent:** `security-agent`
- Review proposed architecture for STRIDE threats
- Identify any option that introduces unacceptable security risk
- Recommend security controls for the preferred option

**Gate:** No critical security finding blocks the recommended option

---

### STEP 04: Engineering Feedback
**Agent:** `engineer-agent`
- Review for implementability
- Identify hidden complexity
- Flag if timeline assumptions are unrealistic
- Note missing technical details

**Gate:** Implementing team understands and agrees with the approach

---

### STEP 05: Decision & ADR
**Agent:** `architect-agent`
- Select the option with best risk-adjusted value
- Document the decision using `templates/adr-template.md`
- Include: context, decision, status, consequences (positive AND negative)
- Set ADR status: `accepted`

**Output:** `architecture/decisions/ADR-<NNN>-<slug>.md`

---

### STEP 06: Supervisor Review
**Agent:** `supervisor-agent`
- Verify ADR is complete and non-contradictory
- Check against existing ADRs in `architecture/decisions/`
- Issue approval

**Gate:** ADR approved → triggers `feature-development` Step 03 or unblocks engineering

---

## ADR Numbering

ADRs are numbered sequentially. Check `architecture/decisions/` for the next number.
Format: `ADR-NNN` (e.g., ADR-001, ADR-042)

## RFC → ADR Lifecycle

RFCs (`rfc/`) are proposals that may result in ADRs.
- RFC = "here's a proposal; let's discuss"
- ADR = "here's the decision we made"
- An RFC that gets accepted becomes an ADR
- An RFC that gets rejected is archived with rejection rationale
