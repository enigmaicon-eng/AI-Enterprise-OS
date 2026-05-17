# Production Safety System

## Role
Defines the multi-layered safety controls governing all production interactions. Enforces release approval workflows, production access gates, deployment safety checks, and real-time production guardrails that can never be bypassed by automated systems.

## Production Access Tiers

```
ACCESS_TYPE                 TIER_REQUIRED   HUMAN_APPROVAL   ROLLBACK_REQUIRED
──────────────────────────────────────────────────────────────────────────────────────
Read production metrics     T1              None             N/A
Read production logs        T2              None             N/A
Production config read      T2              None             N/A
Production config change    T3              T4 real-time     Yes (auto-snapshot before)
Production deployment       T3              T4 + T5          Yes (rollback plan attached)
Production data migration   T4              T5 + DPO         Yes (reversibility confirmed)
Emergency production fix    T3              T4 async (30min) Yes (post-action review 4hr)
Production DB schema change T4              T5 + Architect   Yes + tested rollback script
Constitutional OS change    T5              Board            N/A (irreversible; board minutes)
```

## Release Approval Workflow

```
STEP 1: RELEASE CANDIDATE DECLARED
  - workflow: workflows/release-workflow.md
  - artifact: release-plan + test-results + security-scan

STEP 2: QA GATE
  - required: QA Lead sign-off (T3)
  - criteria: all tests pass, coverage >= threshold, no CRITICAL findings

STEP 3: SECURITY GATE
  - required: CISO or Security Lead sign-off (T4)
  - criteria: threat model reviewed, no HIGH/CRITICAL vulnerabilities open

STEP 4: ARCHITECTURE GATE
  - required: Lead Architect (T4) — only if API or schema changed
  - criteria: ADR exists, breaking changes documented

STEP 5: EXECUTIVE GO/NO-GO
  - required: CTO or CPO (T5) synchronous decision
  - SLA: must complete within 2hr of gate-5 opening
  - artifact: signed release approval record

STEP 6: PRODUCTION DEPLOYMENT
  - only after all prior gates: PASSED
  - automated rollback trigger armed before deploy begins
  - canary traffic at 5% for 15min before full rollout
```

## Production Guardrails (Always Active)

```
GUARDRAIL                           TRIGGER                         RESPONSE
──────────────────────────────────────────────────────────────────────────────
Error rate spike                   > 5× baseline for 2min          Auto-rollback
Latency spike                      p95 > 3× baseline for 5min      Alert + optional rollback
Data anomaly                       unexpected write pattern         Freeze + T4 alert
Unauthorized production access     access without approved session  Immediate block + CRITICAL alert
Deployment without signed approval release without step 5 record   Block at deployment gate
Automated constitutional change    any automated edit to Z5 content Hard block, always
```

## Production Session Management
```
PRODUCTION_SESSION:
  session_id: string
  approved_by: T4+ agent
  purpose: string
  valid_until: ISO8601      # max 4hr, can be extended with re-approval
  allowed_actions: [string]
  monitored_by: T4 agent (real-time)
  auto_expire: true
```

## Post-Incident Production Access Review
Any production incident triggered by a deployment:
- 24hr post-incident review mandatory
- Release approval chain audited for gaps
- If human gate bypassed: automatic governance investigation

## Persistence
`memory/permissions/production-sessions.yaml`
`memory/permissions/release-approvals.jsonl`
`memory/permissions/production-guardrail-events.jsonl`
