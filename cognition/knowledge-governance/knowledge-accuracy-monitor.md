# Knowledge Accuracy Monitor

## Purpose
Continuously verifies that published knowledge units remain accurate, and detects when knowledge has become incorrect, outdated, or misleading. Knowledge accuracy is not a one-time review — it degrades as the world changes, as new evidence accumulates, and as organizational practice evolves. This system is the ongoing quality assurance layer for the living knowledge base.

---

## Accuracy Monitoring Architecture

```
Continuous Monitoring
├── outcome tracking (application_count, positive/negative outcomes)
├── external change detection (policy updates, org changes, system changes)
├── usage pattern analysis (retrieval without application, not-relevant signals)
├── cross-reference integrity (are linked units still accurate?)
└── scheduled review triggers
        ↓
[Accuracy Signal Aggregation]
        ↓
[Risk Scoring per KU]          → likelihood that KU is inaccurate right now
        ↓
[Alert & Action Dispatch]      → notify, review, update, contest, deprecate
```

---

## Accuracy Signal Types

```yaml
accuracy_signals:
  outcome_signals:
    NEGATIVE_OUTCOME:
      source: knowledge-query-api.md feedback endpoint (feedback_type=INCORRECT)
      description: agent applied the KU and got a bad result
      weight: HIGH (direct evidence of inaccuracy)
      action: immediate flag for accuracy review; alert owner
    
    REPEATED_NEGATIVE_OUTCOMES:
      source: outcome tracking over 30 days
      threshold: >= 3 negative outcomes in 30-day window
      weight: CRITICAL
      action: auto-mark CONTESTED; halt high-confidence delivery; escalate
    
    INCORRECT_FEEDBACK:
      source: feedback_type = INCORRECT from retrieval
      weight: MEDIUM (may be misapplication, not inaccuracy)
      action: flag for steward triage; investigate within 5 days
    
    OUTDATED_FEEDBACK:
      source: feedback_type = OUTDATED from retrieval
      weight: MEDIUM
      action: flag for scheduled review; alert owner if review_date > 30 days away
  
  external_change_signals:
    GOVERNING_POLICY_UPDATED:
      source: enterprise event bus (policy.updated event)
      description: a policy that POLICY_KNOWLEDGE units reference has been updated
      scope: all KUs that cite the updated policy via origin_refs or content references
      action: immediately trigger accuracy review for all affected KUs
    
    ORG_RESTRUCTURING:
      source: enterprise event bus (org.restructuring.complete)
      description: organizational changes may invalidate ORGANIZATIONAL_KNOWLEDGE or PROCESS_KNOWLEDGE
      action: flag all KUs with affected org in scope; steward review required
    
    SYSTEM_ARCHITECTURE_CHANGE:
      source: ADR published in TECHNICAL domain
      description: new architectural decisions may invalidate prior TECHNICAL KUs
      action: traverse APPLIES_TO and SUPPORTS relationships from the changed system; flag affected KUs
    
    EXTERNAL_REGULATION_CHANGE:
      source: manual signal from compliance team OR external intelligence feed
      action: flag all POLICY_KNOWLEDGE + GOVERNANCE KUs with expires_at or regulatory references
  
  usage_pattern_signals:
    ZERO_RETRIEVAL_ACTIVE_UNIT:
      description: ACTIVE unit never retrieved in 90 days despite high domain query volume
      weight: LOW (may still be accurate; just not accessed)
      action: flag as candidate for archival; owner notification
    
    RETRIEVAL_WITHOUT_APPLICATION_TREND:
      description: unit retrieved frequently but application_count is < 5% of retrieval_count
      weight: LOW-MEDIUM (suggests applicability or relevance issue)
      action: flag for applicability review; potential reclassification or rewrite
    
    CONSISTENTLY_NOT_RELEVANT_FEEDBACK:
      source: not_relevant_signal_count >= 5 in 14 days
      weight: MEDIUM
      action: review taxonomy classification; may be misfiled rather than inaccurate
  
  structural_signals:
    LINKED_UNIT_DEPRECATED:
      description: a KU that this unit SUPPORTS or is SUPPORTED_BY has been deprecated
      weight: MEDIUM (the dependency may now be broken)
      action: owner review within 14 days; update relationship or content accordingly
    
    SUPERSEDED_BY_NOT_READ:
      description: unit is DEPRECATED with superseded_by set, but superseding unit quality < 0.50
      weight: MEDIUM (the replacement isn't ready; deprecated unit may need to stay active longer)
      action: alert owner of superseding unit; may need to restore deprecated unit temporarily
    
    HASH_CHAIN_INTEGRITY_FAILURE:
      description: audit chain for a KU has a broken hash link
      weight: CRITICAL (integrity violation; possible tampering)
      action: immediate alert to knowledge-governance-lead; unit quarantined from delivery
```

---

## Accuracy Risk Scoring

```yaml
accuracy_risk_scoring:
  risk_score: 0.0–1.0 (higher = more likely to be inaccurate)
  
  components:
    days_since_last_review:
      0–30 days: 0.0
      31–90 days: 0.1
      91–180 days: 0.2
      181–365 days: 0.3
      > 365 days: 0.5
    
    negative_outcome_rate:
      0 negative outcomes: 0.0
      1 negative outcome: 0.10
      2 negative outcomes: 0.20
      3+ negative outcomes: 0.40
    
    external_dependency_change_detected:
      no dependencies changed: 0.0
      minor dependency change: 0.15
      major dependency change: 0.30
    
    evidence_strength:
      PROVEN: −0.05 (reduces risk; hard evidence ages better)
      VALIDATED: 0.0
      OBSERVED: +0.05 (observation may have been situational)
      ANECDOTAL: +0.15 (highest inherent uncertainty)
    
    knowledge_type_decay_rate:
      POLICY_KNOWLEDGE: +0.10 (policies change)
      PROCESS_KNOWLEDGE: +0.05 (processes evolve)
      INCIDENT_KNOWLEDGE: +0.05 (prevention measures may lose effectiveness)
      PATTERN_KNOWLEDGE: 0.0 (patterns are stable)
      DOMAIN_KNOWLEDGE: −0.05 (foundational facts decay slowly)
      CONTEXT_KNOWLEDGE: +0.15 (context changes fastest)
  
  risk_thresholds:
    LOW: 0.0–0.30 → no action required
    MEDIUM: 0.31–0.55 → schedule review at next cycle
    HIGH: 0.56–0.75 → accelerate review within 14 days
    CRITICAL: 0.76–1.00 → immediate review; consider interim CONTESTED flag
```

---

## Monitor Schedule

```yaml
monitor_schedule:
  continuous: outcome feedback signals → processed within 5 minutes of receipt
  
  daily_scan:
    check: all ACTIVE units for new external_change_signals
    check: units with 3+ not_relevant or incorrect feedback this week
    report: new HIGH and CRITICAL risk units to domain_stewards
  
  weekly_scan:
    risk_rescore: all ACTIVE units (full risk scoring run)
    alert: MEDIUM risk units to domain_stewards (digest)
    report: accuracy health metrics to knowledge-governance-lead
  
  monthly_scan:
    full_dependency_audit: traverse all SUPPORTS, APPLIES_TO, CITES relationships; check source accuracy
    expiry_check: units with expires_at within 30 days → alert owner + steward
    orphaned_unit_check: units with no owner; escalate all found
```

---

## Accuracy Dispute Process

```yaml
accuracy_dispute:
  filing:
    who_can_file: any agent or human with retrieval access
    required: {dispute_type, evidence, description}
    not_required: proposing a correction (can be a flag only)
  
  triage_sla: owner must triage within 3 business days
    triage_outcomes:
      ACKNOWLEDGED_VALID: enter investigation; mark CONTESTED
      ACKNOWLEDGED_SCOPE: "not inaccurate, but I'll improve clarity" → minor update; no CONTESTED
      DISPUTED: owner believes KU is correct; requires counter-evidence
      ESCALATED: complex; forward to domain_steward or knowledge-governance-lead
  
  investigation:
    assigned_to: steward (simple) or domain_steward (complex) or knowledge-governance-lead (policy)
    sla: 14 days for FACTUAL disputes; 21 days for METHODOLOGY or POLICY disputes
    
    resolution_outcomes:
      CORRECT: update KU; clear CONTESTED; note correction in change_log
      OUTDATED: create MINOR or MAJOR update; publish; previous version → DEPRECATED
      CONTESTED_SUSTAINED: create new KU superseding with evidence; old KU → DEPRECATED
      FALSE_POSITIVE: clear CONTESTED; no change; document false positive for signal calibration
  
  appeal:
    who: original disputer can appeal within 7 days of resolution
    appeal_authority: knowledge-governance-lead
    final: knowledge-governance-lead decision is final
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-base/knowledge-quality-system.md` | Accuracy dimension updates |
| `knowledge-base/knowledge-lifecycle.md` | CONTESTED state transitions |
| `knowledge-retrieval/knowledge-query-api.md` | Feedback signal ingestion |
| `knowledge-governance/knowledge-ownership-system.md` | Owner notification and accountability |
| `knowledge-governance/knowledge-operations-dashboard.md` | Accuracy health reporting |
| `enterprise-telemetry/enterprise-event-bus.md` | External change event signals |
