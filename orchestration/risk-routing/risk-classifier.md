---
layer: risk-aware-routing
type: risk-classifier
version: 1.0.0
created: 2026-05-10
owner: security-architect-agent
authority: enterprise-architecture-council
---

# Risk Classifier

The task and artifact risk classification system for the Enterprise AI OS. Every task and artifact produced has a risk level that determines routing, authority requirements, and approval gates.

---

## Risk Scoring Model

Risk is assessed along five weighted dimensions. Each dimension is scored 0-20; total composite score is 0-100.

### Dimension 1: Reversibility (Weight: 30%, max 30 points)

| Score | Condition |
|---|---|
| 0 | Fully reversible in <1 minute (e.g., draft document, cached query) |
| 5 | Reversible with effort (e.g., rollback a config change) |
| 10 | Reversible but costly (e.g., database restore required) |
| 20 | Irreversible or nearly so (e.g., delete production data, send external communication) |
| 25 | Irreversible with cascading effects (e.g., revoke credentials, deprecate a public API) |
| 30 | Catastrophically irreversible (e.g., mass data deletion, constitutional change) |

### Dimension 2: Blast Radius (Weight: 25%, max 25 points)

| Score | Condition |
|---|---|
| 0 | Affects only the current workflow instance |
| 5 | Affects one agent or artifact type |
| 10 | Affects one domain |
| 15 | Affects multiple domains or one org |
| 20 | Affects multiple orgs or external stakeholders |
| 25 | Affects entire organization or external customers |

### Dimension 3: Regulatory (Weight: 20%, max 20 points)

| Score | Condition |
|---|---|
| 0 | No regulatory implications |
| 5 | Touches data that may be regulated (ambiguous) |
| 10 | Touches regulated domain (finance, health) but no compliance change |
| 15 | Compliance decision or policy change |
| 20 | Legal obligation at risk (GDPR, SOX, HIPAA direct violation risk) |

### Dimension 4: Security (Weight: 15%, max 15 points)

| Score | Condition |
|---|---|
| 0 | No security implications |
| 5 | Accesses non-sensitive organizational data |
| 8 | Accesses RESTRICTED memory namespace |
| 12 | Modifies security-critical artifacts (auth, access control, secrets) |
| 15 | Creates or modifies permissions, credentials, or security boundaries |

### Dimension 5: Financial (Weight: 10%, max 10 points)

| Score | Condition |
|---|---|
| 0 | No financial implications |
| 2 | May affect internal cost estimates |
| 5 | Direct cost decision (<$10K) |
| 8 | Significant financial commitment ($10K-$100K) |
| 10 | Major financial decision (>$100K or recurring cost) |

---

## Composite Risk Score → Risk Level

```
composite = reversibility + blast_radius + regulatory + security + financial

0-25:   LOW      → Standard routing, no additional gates
26-50:  MEDIUM   → T2 specialist required, peer review gate
51-75:  HIGH     → T3 authority required, human approval gate
76-100: CRITICAL → T4+ required, dual human approval, legal review
```

---

## Task Type Risk Defaults

Frequently-executed task types have pre-computed base risk scores. These are starting points — classifiers may override based on specific task context:

| Task Type | Default Risk Level | Default Score |
|---|---|---|
| Draft PRD section | LOW | 10 |
| Complete PRD for major feature | MEDIUM | 35 |
| Author ADR | HIGH | 55 |
| Security review | HIGH | 60 |
| Archive memory entry | MEDIUM | 30 |
| Archive CRITICAL memory entry | HIGH | 55 |
| Add agent to MASTER-REGISTRY | MEDIUM | 40 |
| Remove agent from MASTER-REGISTRY | HIGH | 60 |
| Update governance principle | CRITICAL | 85 |
| Amend Enterprise Constitution | CRITICAL | 95 |
| External API integration | MEDIUM | 45 |
| Modify auth/security configuration | CRITICAL | 80 |
| Sprint planning | LOW | 15 |
| Incident response | HIGH | 65 |
| Knowledge synthesis (wiki update) | LOW | 12 |
| Cross-BU knowledge federation grant | HIGH | 55 |
| Delete production data | CRITICAL | 90 |
| Send external communication | HIGH | 65 |

---

## Dynamic Risk Escalation

Risk can be upgraded mid-workflow when a step produces a risk-elevating finding:

**Escalation triggers:**
- Any step produces a finding with risk_delta ≥ 20 above current composite score
- Any security finding classified as CRITICAL by security-architect-agent
- Any regulatory finding that implies compliance obligation not previously identified
- Any artifact that references external data subjects (PII trigger)

**Escalation protocol:**
1. Detecting agent emits `risk.escalation.triggered` event with new risk assessment
2. Coordination engine pauses current step (does not abort)
3. Risk-router re-evaluates routing for remaining steps
4. If authority tier must increase: re-route remaining steps to higher-tier agents
5. If human gate now required: pause workflow, notify human operator
6. Workflow resumes with updated routing after escalation resolved

---

## Risk Classification Output Format

```yaml
risk-assessment:
  task-id: "{task-id}"
  assessed-at: "{ISO-8601}"
  assessed-by: "risk-classifier"
  
  dimension-scores:
    reversibility: {0-30}
    blast-radius: {0-25}
    regulatory: {0-20}
    security: {0-15}
    financial: {0-10}
    
  composite-score: {0-100}
  risk-level: "LOW|MEDIUM|HIGH|CRITICAL"
  
  routing-implications:
    minimum-agent-tier: "T1|T2|T3|T4"
    required-human-approval: true|false
    required-legal-review: true|false
    required-security-review: true|false
    consensus-required: true|false
    
  escalation-triggers-watching:
    - "{condition that would trigger risk upgrade}"
    
  classification-notes: "{any ambiguous factors noted}"
```

---

## Risk Override Protocol

When a risk assessment seems incorrect, a T3+ agent may request a re-evaluation:

1. Requesting agent submits override request with specific dimension objections
2. security-architect-agent re-evaluates contested dimensions
3. If any dimension changes, composite score is recalculated
4. Override and rationale logged in decision record
5. If override reduces a CRITICAL to HIGH or below → human notification required (cannot silently downgrade CRITICAL)

**No agent may unilaterally downgrade their own task's risk level.** Risk classification is always performed by a separate agent from the task executor.