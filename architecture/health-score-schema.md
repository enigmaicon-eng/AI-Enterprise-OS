# Canonical Health Score Schema
**ID:** ARCH-HS-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Defines the single canonical health score schema that ALL health-scoring systems in the Enterprise AI OS must conform to. Eliminates the 7+ conflicting health score definitions identified in the architecture review. Establishes a unified observability contract.

---

## Canonical Schema

```yaml
health_score:
  # Identity
  score_id: HS-{subject_type}-{subject_id}-{timestamp_epoch}
  subject_type: WORKFLOW | AGENT | ORG | SYSTEM | GOVERNANCE | PLATFORM
  subject_id: string                       # e.g., WF-005, agent-pm-001, delivery-org
  scope: INSTANCE | ROLLING_7D | ROLLING_30D
  
  # Four universal dimensions (all systems must populate all four)
  dimensions:
    operational:
      score: 0.00–1.00
      weight: 0.00–1.00                    # declared by the reporting system
      components: [string]                  # what was measured
      
    governance:
      score: 0.00–1.00
      weight: 0.00–1.00
      components: [string]
      
    quality:
      score: 0.00–1.00
      weight: 0.00–1.00
      components: [string]
      
    reliability:
      score: 0.00–1.00
      weight: 0.00–1.00
      components: [string]
  
  # Hard-cap penalties (applied BEFORE composite calculation)
  # Penalties list what was applied; absence means none applied
  penalties:
    - penalty_id: string                    # e.g., BUS_FACTOR_1, CONSTITUTIONAL_VIOLATION
      deduction: 0.00–1.00
      reason: string
      
  # Composite score
  # composite = sum(dimension.score × dimension.weight) − sum(penalty.deduction)
  # composite is clamped to [0.00, 1.00]
  composite: 0.00–1.00
  
  # Classification band
  band: THRIVING | HEALTHY | DEGRADED | IMPAIRED | CRITICAL
  # Thresholds: THRIVING ≥ 0.85, HEALTHY 0.70–0.84, DEGRADED 0.55–0.69, 
  #             IMPAIRED 0.40–0.54, CRITICAL < 0.40
  
  # Metadata
  source_system: string                    # which system generated this score
  calculated_at: ISO8601
  next_recalculation: ISO8601
  data_freshness_ok: boolean               # false if any input data is stale
```

---

## Standard Weight Profiles by Subject Type

Systems SHOULD use these standard profiles unless a justified deviation is documented:

| Subject Type | Operational | Governance | Quality | Reliability |
|-------------|------------|-----------|---------|------------|
| WORKFLOW | 0.30 | 0.25 | 0.25 | 0.20 |
| AGENT | 0.25 | 0.25 | 0.30 | 0.20 |
| ORG | 0.30 | 0.20 | 0.25 | 0.25 |
| SYSTEM | 0.35 | 0.20 | 0.20 | 0.25 |
| GOVERNANCE | 0.15 | 0.50 | 0.20 | 0.15 |
| PLATFORM | 0.35 | 0.20 | 0.15 | 0.30 |

Deviations require Architecture Org approval and documentation in the source system's README.

---

## Standard Hard-Cap Penalties

| Penalty ID | Trigger | Deduction | Uncappable? |
|------------|---------|-----------|------------|
| CONSTITUTIONAL_VIOLATION | Any constitutional violation | −0.30 | Yes — always applied |
| BUS_FACTOR_1 | Critical knowledge held by single agent | −0.30 | No |
| APPROVAL_SLA_BREACH_CRITICAL | P0 escalation SLA missed | −0.20 | No |
| SECURITY_CONTROL_FAILED | Any FAILED/BYPASSED control | −0.25 | No |
| DATA_LOSS_CONFIRMED | Any confirmed unrecoverable data loss | −0.40 | Yes |
| QUORUM_FAILED | Constitutional quorum non-operational | −0.40 | Yes |

CONSTITUTIONAL_VIOLATION penalty caps the maximum composite at 0.70 regardless of other scores. DATA_LOSS and QUORUM penalties cap at 0.60.

---

## Migration Requirements

All existing health-scoring systems must migrate to this schema:

| System | Migration Priority | Deadline |
|--------|------------------|---------|
| operational-health-scorer.md (nervous system) | P1 | Q3 2026 |
| governance-health-scorer.md (nervous system) | P1 | Q3 2026 |
| orchestration-health-scorer.md (nervous system) | P1 | Q3 2026 |
| org-health-scorer.md (RSI system) | P1 | Q3 2026 |
| team-health-scorer.md (org intelligence) | P2 | Q3 2026 |
| workflow-health-hub.md (governance trust) | P1 | Q3 2026 |
| executive-intelligence-dashboard.md (strategic intel) | P2 | Q4 2026 |

Migration: Each system adds a `canonical_hs:` block alongside its existing output. After all systems migrated, legacy fields deprecated and removed.

---

## Aggregation Rules

When aggregating multiple health scores into a composite view:
- WORKFLOW-level: use operational-weighted (0.40 operational, 0.30 governance, 0.20 quality, 0.10 reliability)
- ORG-level: use equal-weighted average across all team scores
- PLATFORM-level: weighted by subject criticality (CRITICAL workflows count 3×)
- NEVER: average composite scores directly — always re-derive from dimensional scores

---

## Publisher Contract

Any system publishing health scores to `enterprise.health.scores` event bus topic MUST:
1. Use this exact schema (validator rejects malformed scores)
2. Declare all dimension weights (weights must sum to 1.00 ± 0.01)
3. Apply standard hard-cap penalties before publishing composite
4. Set `data_freshness_ok: false` if any input is > 2× its expected refresh rate
