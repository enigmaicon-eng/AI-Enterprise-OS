# Sensitive Workflow Controls

## Role
Defines enhanced controls applied to workflows that handle sensitive data categories or high-consequence operations. These controls layer on top of standard workflow permissions and cannot be relaxed by runtime optimization.

## Sensitive Workflow Categories

```
CATEGORY                    TRIGGER CONDITION                           CONTROL_LEVEL
──────────────────────────────────────────────────────────────────────────────────────
PII_PROCESSING              workflow handles personal data               ENHANCED
FINANCIAL_DECISION          workflow produces budget/spend decisions      ENHANCED
HEALTH_DATA                 workflow touches health/medical information   STRICT
LEGAL_PRIVILEGED            workflow involves legal counsel materials     STRICT
SECURITY_SENSITIVE          workflow touches credentials/keys/certs       STRICT
PERSONNEL_DECISION          workflow affects hiring/firing/compensation   ENHANCED
EU_AI_ACT_HIGH_RISK         workflow classified as EU AI Act high-risk    STRICT
CONSTITUTIONAL_SCOPE        workflow may affect OS constitutional layer   MAXIMUM
```

## Control Levels

### ENHANCED Controls
```
- context_stripping: remove PII before passing to T1/T2 agents
- output_review_required: output reviewed by T3+ before delivery
- retention_policy_enforced: data purged per classification schedule
- cross_agent_sharing: prohibited without explicit re-authorization
- logging: all steps logged with data classification tags
```

### STRICT Controls
```
All ENHANCED controls, plus:
- isolated_execution: run in ENHANCED isolation mode (runtime-isolation-manager)
- human_review_on_output: T3+ human reviews every output before action taken
- no_caching: output must not be cached in shared memory layers
- single_agent_scope: data stays within one agent session — no handoffs
- immediate_purge_on_completion: working memory purged at session end
```

### MAXIMUM Controls
```
All STRICT controls, plus:
- t5_oversight_required: T5 agent present for duration of workflow
- air_gapped_execution: no external connector access during workflow
- dual_approval_outputs: two independent T4+ agents must approve any output that takes action
- full_audit_recording: every token produced recorded to immutable audit log
- board_notification: board-level notification of workflow initiation
```

## Sensitive Data Handling Rules

### PII-Specific Rules
```
MINIMIZE: collect only fields necessary for task
PSEUDONYMIZE: replace identifiers before analysis if identity not required
RIGHT_TO_ERASURE: honor deletion requests within 30 days (GDPR Art.17)
PURPOSE_LIMITATION: PII collected for purpose A cannot be used for purpose B
CONSENT_VERIFICATION: verify consent status before any PII processing begins
```

### Credential and Key Handling
```
NEVER: pass credentials in workflow context (use ephemeral-permission-manager tokens)
NEVER: log credential values anywhere
NEVER: include credentials in handoff artifacts
ROTATION: trigger rotation if credential exposed beyond intended scope
```

## Sensitive Workflow Audit
All sensitive workflow executions appear in:
- `compliance-framework/compliance-model.md` evidence chain
- `audit-and-evidence/audit-trail-governance.md` immutable log
- Weekly sensitive workflow review report → CISO + DPO

## Persistence
`memory/permissions/sensitive-workflow-log.jsonl`
