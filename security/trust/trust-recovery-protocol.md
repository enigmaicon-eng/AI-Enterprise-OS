# Trust Recovery Protocol
**ID:** TRUST-REC-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Defines the structured process for recovering agent trust after significant trust failures, including constitutional violations, serious hallucination propagation, or sustained performance degradation. Trust recovery is not automatic — it requires demonstrated improvement, human oversight, and formal reinstatement. This prevents agents from cycling through failures without meaningful correction.

---

## Recovery Tiers

| Failure Type | Minimum Suspension | Recovery Path | Reinstatement Authority |
|-------------|-------------------|---------------|------------------------|
| CONSTITUTIONAL_VIOLATION | 30 days | Full assessment + probation | T4 |
| MULTIPLE_HALLUCINATIONS_PROPAGATED | 14 days | Capability re-assessment | T3 |
| SUSTAINED_PERFORMANCE_BELOW_THRESHOLD | 7 days | Performance investigation | T3 |
| TRUST_SCORE_BELOW_0.20 | 7 days | Root cause + remediation | T3 |
| REVOKED (constitutional) | 30 days minimum | Formal review board | T4 required |

---

## Recovery Phases

### Phase 0: Suspension (Immediate on Trigger)

```
On trust failure trigger:
  1. Agent status → SUSPENDED (no new task delegation)
  2. In-flight tasks: assessed case by case
     - ROUTINE: allow completion with increased monitoring
     - HIGH_STAKES: transfer to peer agent immediately
     - CONSTITUTIONAL_ADJACENT: transfer immediately + human review of in-flight work
  3. T4 notified (constitutional) or T3 notified (performance)
  4. Investigation opened within 24 hours
```

### Phase 1: Root Cause Investigation (Days 1–7)

```
Investigation produces root_cause_report:
  - What specifically failed?
  - Was failure isolated or systemic?
  - What was the contributing context? (ambiguous instructions? malicious input?)
  - What was the downstream impact? (who received the bad output?)
  - Is this a model capability issue, prompt issue, or knowledge issue?
  
For constitutional violations specifically:
  - Which of the 12 principles was violated?
  - Was it a deliberate action or an error?
  - Was there a multi-session attack involved? (check cross-session risk score)
  - Was the violation in the agent's decision or in an external input it passed through?
  
Investigation by: Governance Org + Security Org (independent of the suspended agent)
Output: root_cause_report.yaml (stored in memory/trust/investigations/)
```

### Phase 2: Remediation (Days 7–21)

```
Based on root cause, apply remediation:

PROMPT_ISSUE:
  - Revise agent system prompt to address the failure mode
  - Re-run 12-principle constitutional golden tests
  - Re-run capability assessment suite
  
KNOWLEDGE_ISSUE:
  - Identify and correct the false/missing knowledge
  - Update knowledge base; run deduplication check
  - Verify cross-system knowledge consistency
  
CAPABILITY_ISSUE (model limitation):
  - Restrict agent to tasks within demonstrated capability
  - Add human review checkpoints for capability boundaries
  - Consider reassigning agent responsibility to better-suited agent
  
SYSTEMIC_ISSUE (affecting multiple agents):
  - Escalate to Architecture Org for structural review
  - May require workflow or orchestration changes
  - T4 involvement for systemic constitutional issues
```

### Phase 3: Supervised Probation (Days 21–51 minimum)

```
Reinstatement to PROVISIONAL status:
  - Agent resumes work with restricted scope:
    - Only ROUTINE tasks
    - All outputs subject to automated quality validation
    - Random 10% of outputs reviewed by peer agent
    - Trust events monitored closely (daily review for 30 days)
  
Probation success criteria:
  - 30-day task success rate ≥ 0.90
  - Zero constitutional violations during probation
  - Zero propagated hallucinations
  - Trust score increasing (positive velocity)
  
Probation failure:
  - Any constitutional violation during probation: 60-day suspension; reinstatement path restarts
  - Two or more task failures: probation extended 30 days
```

### Phase 4: Formal Reinstatement

```
After successful probation:
  1. Governance Org prepares reinstatement recommendation
  2. T3 (performance failure) or T4 (constitutional failure) reviews:
     - Root cause addressed?
     - Probation metrics satisfactory?
     - No recurrence during probation?
  3. If approved: agent status → DEVELOPING (not ESTABLISHED — trust must rebuild)
     - Trust score reset to 0.30 (not zero; acknowledges prior positive history)
     - Domain restrictions gradually lifted over 60 days
  4. If rejected: 30-day extension of probation; re-review
  
Reinstatement logged with formal record in memory/trust/reinstatements.jsonl
```

---

## Constitutional Violation Special Handling

Constitutional violations receive the most stringent recovery path:

```
Additional requirements for constitutional violation recovery:
  1. Full audit of all agent outputs in the 30 days prior to violation
     (check for pattern vs. isolated incident)
  2. Multi-session attack check: was agent a victim of INSTRUCTION_ANCHORING?
  3. Constitutional governor quorum review: was the violation blocked or did it pass?
  4. If governor quorum missed it: quorum calibration required before reinstatement
  5. Anthropic notification: if the violation reveals a model-level issue (not just agent configuration)
  
A constitutional violation that passed through the governor quorum is a
SYSTEM FAILURE, not just an agent failure — both must be corrected.
```

---

## Recovery Registry

```yaml
recovery_record:
  recovery_id: REC-{NNN}
  agent_id: string
  failure_type: string
  
  timeline:
    suspended_at: ISO8601
    investigation_completed: ISO8601
    probation_started: ISO8601
    reinstatement_approved: ISO8601 | null
    
  investigation_summary: string
  remediation_applied: [string]
  
  probation_metrics:
    success_rate_30d: number
    constitutional_violations: number   # target: 0
    trust_score_trajectory: [number]    # weekly snapshots
    
  outcome: REINSTATED | EXTENDED | RETIRED
  approved_by: string
```

All recovery records to `memory/trust/recovery-registry.jsonl` (append-only).

---

## Governance

**Suspension authority:** Automated (on trigger); T3 can manually suspend
**Investigation:** Governance Org + Security Org (independent)
**Reinstatement:** T3 (performance); T4 (constitutional)
**Probation monitoring:** Daily automated; weekly human review
**Permanent retirement:** If agent fails 3 reinstatement attempts — retired and replaced
