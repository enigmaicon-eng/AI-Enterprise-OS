# Risk-Aware Routing

**Layer:** Governance-Gated Delegation and Escalation  
**Version:** 1.0.0  
**Depends on:** coordination-runtime/, consensus-frameworks/, agents/MASTER-REGISTRY.md, constitution/

---

## Purpose

Risk-Aware Routing intercepts every delegation decision and applies a risk filter before the task reaches an agent. High-risk tasks are routed to more authoritative agents, require additional consensus, trigger governance gates, or block pending human approval — all without manual orchestration.

This layer operationalizes the Enterprise Constitution (§6.3, §7.1), the Human Approval Constitution (26 H-NNN rules), and the 8 quality gates (G1-G8) into a live routing filter.

---

## Components

| File | Responsibility |
|------|----------------|
| `risk-router.md` | Risk scoring, risk-based agent selection, gate injection |
| `governance-delegate.md` | Constitutional compliance, H-NNN rule matching, governance agent routing |
| `escalation-thresholds.md` | Threshold definitions, escalation triggers, auto-escalation logic |
| `approval-coordinator.md` | Human approval workflow, blocking gates, timeout handling |

---

## Risk-Aware Routing Flow

```
INCOMING TASK
      ↓
┌─────────────────┐
│  RISK SCORER    │ ← Score task on 5 risk dimensions
└────────┬────────┘
         ↓
┌─────────────────────┐
│  GOVERNANCE FILTER  │ ← Check constitution, H-NNN rules
└────────┬────────────┘
         │
    ┌────┴──────────────────────────────────────┐
    │ Risk Level      │ Action                  │
    ├─────────────────┼─────────────────────────┤
    │ NEGLIGIBLE      │ Route normally           │
    │ LOW             │ Route + log              │
    │ MEDIUM          │ Route to risk-aware agent│
    │ HIGH            │ Require consensus vote   │
    │ CRITICAL        │ Block → human approval   │
    │ CONSTITUTIONAL  │ Immediate halt           │
    └─────────────────┴─────────────────────────┘
```

---

## Risk Categories

| Category | Dimensions Scored |
|----------|------------------|
| Decision Risk | Reversibility, blast radius, financial impact |
| Governance Risk | Constitution proximity, H-NNN rule matches |
| Execution Risk | Agent failure rate, complexity vs capacity |
| Security Risk | PII exposure, credential access, audit bypass |
| Coordination Risk | Cross-org dependency, deadline pressure |
