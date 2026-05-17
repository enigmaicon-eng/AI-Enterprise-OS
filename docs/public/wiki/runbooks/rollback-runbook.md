---
type: runbook
status: active
version: 1.0.0
created: 2026-05-09
owner: delivery-agent
updated: 2026-05-09
---

# Rollback Runbook

**Purpose:** Step-by-step instructions for rolling back a production deployment.
**When to use:** When a deployment causes a production incident, quality degradation, or unacceptable error rates.
**Time-sensitive:** Rollback decisions and execution should take < 15 minutes from trigger.

> **Note:** Specific rollback commands depend on the tech stack (Q-001) and cloud provider (Q-003). Update with actual commands when infrastructure is defined.

---

## Rollback Triggers

Initiate rollback immediately when ANY of the following are true:

| Trigger | Threshold |
|---------|---------|
| Error rate increase | > 2× baseline within 30 minutes of deployment |
| P99 latency increase | > 2× baseline |
| CRITICAL alert triggered | Any CRITICAL alert from `observability/alerts.md` |
| Security incident | Any confirmed security incident post-deployment |
| AI quality degradation | ALERT-001 fires with > 20% degradation |
| P0 incident opened | Automatically triggers rollback consideration |
| Data integrity issue | Any confirmed data corruption or data loss |

**The rollback decision is NON-negotiable for P0 incidents.** Delivery-agent does not wait for human approval if the above thresholds are met — rollback first, discuss after.

---

## Rollback Decision Authority

| Decision | Authority |
|---------|---------|
| Initiate rollback | delivery-agent (immediate); any agent for P0 |
| Pause rollback (continue instead) | Human operator only, with documented rationale |
| Cancel rollback | Human operator only |

---

## Rollback Procedure

### Step 1: Trigger (< 1 minute)
- [ ] Confirm rollback trigger condition is met (log the trigger)
- [ ] Notify human operator: "Initiating rollback of <release> — trigger: <reason>"
- [ ] Open incident in `incidents/INC-NNN-<slug>.md` (use `templates/incident-template.md`)

### Step 2: Freeze traffic (< 2 minutes)
- [ ] Disable feature flag (return to 0% if staged rollout was in progress)
- [ ] If feature flag not applicable: route to previous version

### Step 3: Restore previous version (< 10 minutes)
- [ ] Deploy the last known-good release artifact
  - Last good release: check `wiki/releases/` for prior release record
- [ ] Verify health check returns OK on previous version
- [ ] Confirm error rate returning to baseline

### Step 4: Verify stability (15 minutes observation)
- [ ] Monitor error rate: should return to pre-deployment baseline
- [ ] Monitor P99 latency: should return to baseline
- [ ] Monitor for any new alerts
- [ ] Confirm no data integrity issues remain

### Step 5: Post-rollback actions
- [ ] Update incident record with rollback outcome
- [ ] Update release artifact status to ROLLED_BACK
- [ ] Notify all relevant agents: rollback complete
- [ ] Preserve all deployment logs and error traces for root cause analysis
- [ ] Schedule root cause analysis (within 24h for P0/P1, within 1 sprint for P2/P3)

---

## After Rollback: Root Cause Analysis

Rollback is the immediate fix. Root cause analysis is mandatory before re-attempting the release.

**Required before re-release:**
1. Identify the root cause (engineer-agent + qa-agent)
2. Verify the fix addresses the root cause (not just the symptom)
3. Update test plan to cover the failure case
4. Re-run full QA cycle (G5) for the fix
5. Security review if the issue was security-related (G6)
6. Human operator re-approval for production re-deployment

**Re-release is NOT permitted until root cause is documented and fix is verified.**

---

## Known Good Release Tracking

The `wiki/releases/` directory maintains a list of all releases with their status. The most recent release with status STABLE is the last known-good target for rollback.

Format:
```
wiki/releases/
├── 2026-05-09-v1.0.0-auth.md     ← status: STABLE
└── 2026-05-09-v1.1.0-auth.md     ← status: ROLLED_BACK
```
