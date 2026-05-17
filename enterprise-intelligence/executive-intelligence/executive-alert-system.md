# Executive Alert System
**ID:** SI-EXEC-003 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Executive Org | **Updated:** 2026-05-16

---

## Purpose

Real-time alert system for strategic-level events requiring executive attention. Bridges the gap between ongoing intelligence monitoring and executive action by delivering timely, appropriately escalated alerts with context, urgency, and recommended responses.

---

## Alert Categories

| Category | Threshold | SLA | Channel |
|----------|-----------|-----|---------|
| STRATEGIC_THREAT | P0 radar item | 15 minutes | Push to T4+ |
| CONSTITUTIONAL_BREACH | Any constitutional violation | Immediate | Push to T5 + board |
| COMPETITIVE_MOVE | Competitor P0 action detected | 30 minutes | Push to T4+ |
| REGULATORY_BREACH | Compliance control FAILED/BYPASSED | 15 minutes | Push to T4+ + Legal |
| SCENARIO_SHIFT | World probability shift > 0.20 | 2 hours | Push to T3+ |
| EXECUTION_CRITICAL | OS operational health = CRITICAL | 30 minutes | Push to T4+ |
| TALENT_CRITICAL | bus_factor = 1 in critical domain | 4 hours | Push to T3+ |
| CUSTOMER_CRITICAL | Top-tier customer escalation ESC1 | 30 minutes | Push to T3+ |
| FINANCIAL_ALERT | Spend > 110% of budget in current period | 2 hours | Push to T3+ |
| GOVERNANCE_CRITICAL | Approval SLA breach CRITICAL tier | 1 hour | Push to T4+ |

---

## Alert Schema

```yaml
alert:
  alert_id: ALT-{YYYYMMDD}-{seq}
  category: [see categories above]
  severity: P0_IMMEDIATE | P1_URGENT | P2_IMPORTANT | P3_INFORMATIONAL
  
  title: string                        # 60-char max; action-oriented
  situation: string                    # 100 words max: what happened
  urgency_statement: string            # why this can't wait
  
  # Context refs
  source_signal: RAD-* | UIU-* | SS-* | system_event
  supporting_evidence: [ref_ids]
  
  # Recommended Action
  recommended_action: string           # 50-word max: what to do right now
  decision_needed_by: ISO8601
  decision_authority: T3 | T4 | T5 | T5+BOARD
  
  # Routing
  primary_recipient: agent_id
  cc_recipients: [agent_ids]
  escalation_if_unacknowledged_by: ISO8601
  escalation_to: agent_id
  
  # Status
  status: SENT | ACKNOWLEDGED | IN_PROGRESS | RESOLVED | ESCALATED | EXPIRED
  sent_at: ISO8601
  acknowledged_at: ISO8601 | null
  acknowledged_by: agent_id | null
  resolved_at: ISO8601 | null
  resolution_summary: string | null
```

---

## Alert Deduplication and Grouping

To prevent alert fatigue:

1. **Deduplication:** Alerts on the same root event within 1 hour are merged (most severe kept)
2. **Grouping:** Multiple P3/P2 alerts in same category within 4 hours → single digest
3. **Escalation suppression prevention:** If alert is acknowledged within SLA, escalation is automatically cancelled
4. **Night-time hold:** P2/P3 alerts generated between 22:00–07:00 local time are held until 07:00 unless P1/P0

---

## Alert Rate Governance

If alert rate exceeds thresholds, the system has a problem (signal noise, not real events):

| Alert Rate | Response |
|------------|---------|
| > 5 P0 alerts in 24 hours | Trigger root cause analysis |
| > 10 P1 alerts per day (rolling 7 days) | Review threshold calibration |
| > 50 P2/P3 alerts per day | Review aggregation and deduplication rules |
| Acknowledged-within-SLA rate < 70% | Routing review |

Alert rate metrics published to `memory/strategic-intelligence/alert-metrics.yaml`.

---

## Escalation Chains

Each alert has a pre-defined escalation chain:

```
Primary recipient → (SLA passes without ACK) → escalation_to
  → (additional SLA passes) → T4 direct
    → (additional SLA passes) → T5 emergency protocol
```

P0 CONSTITUTIONAL_BREACH alerts bypass all chains and go directly to T5 + board immediately.

---

## Alert History and Learning

All alerts are archived with resolution records. Monthly review:
- Which alerts led to correct action (confirmed by decision-archive)?
- Which alerts were false positives (resolved without action as not material)?
- Which signal sources produce highest-quality alerts?
- Which categories have best SLA acknowledgement rates?

Used to tune signal thresholds and routing in `strategic-intelligence-engine.md`.
