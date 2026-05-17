---
layer: cognition-indexes
type: semantic-cluster
cluster: security
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-engineer-agent
last-reviewed: 2026-05-10
permission-tier: RESTRICTED
---

# Security Semantic Cluster

Entries conceptually related to security architecture, access control, threat modeling, compliance security requirements, and security governance.

**Retrieval trigger:** Any routing key containing: security-design, compliance-review, ai-safety-review, security-sensitive.

**Permission note:** Many entries in this cluster are RESTRICTED or higher. Access follows the federation permission model in `memory-routing/organizational-context-federation.md`.

---

## Cluster Members

### Security Policy (OPEN)
- `docs/governance/principles.md` — Security access control policy section [CRITICAL]
- `docs/governance/security-policy.md` — Full security policy [CRITICAL]
- `memory-routing/organizational-context-federation.md` — Security namespace as RESTRICTED [HIGH]

### Security Domain Memory (RESTRICTED)
- `memory/domains/security/` — OWASP constraints, security decisions, threat models [CRITICAL]
- `memory/domains/security/owasp-requirements.md` — OWASP requirements by feature type [CRITICAL]
- `memory/domains/security/security-decisions.md` — Prior security architecture decisions [HIGH]
- `memory/domains/security/threat-models.md` — Known threat models [HIGH]

### Security Architecture (OPEN for T2+)
- `integrations/MASTER-INTEGRATION-REGISTRY.md` — Auth matrix, security patterns per integration [HIGH]
- `architecture/strategic-gap-analysis.md` — Security-related capability gaps [HIGH]
- `integrations/CAPABILITY-GAP-TRACKER.md` — GAP-INT-007 (Vault secrets — HIGH priority) [HIGH]

### Compliance Security (CONFIDENTIAL for finance/legal intersection)
- `memory/domains/legal/` — Regulatory security requirements (CLASSIFIED) [HIGH]

### Context Prioritization
- `memory-routing/context-prioritization.md` — Security constraints = P0, ai-safety-review P0 override [HIGH]

---

## Co-Retrieval Rules

| If retrieving... | Also retrieve... |
|---|---|
| Security domain memory | OWASP requirements, security policy |
| Auth matrix | Integration registry, security decisions |
| Threat model | OWASP requirements, security domain memory |
| AI safety review | AI safety constraints (P0 override), constitution |
| Compliance security | Legal domain memory (if accessible) |

---

## Agents with Security as Primary Domain

- `security-architect-agent` (T2) — RESTRICTED access
- `compliance-governance-agent` (T2) — CONFIDENTIAL access
- `enterprise-constitution-guardian-agent` (T5) — CLASSIFIED access

---

## Security Context Priority Overrides

Per `memory-routing/context-prioritization.md`:
- `routing-key: security-design` → security knowledge entries: P2→P1
- `routing-key: ai-safety-review` → AI safety constraints: P0
- `routing-key: compliance-review` → Compliance requirements: P0

These overrides apply automatically when the security cluster is the primary retrieval cluster.