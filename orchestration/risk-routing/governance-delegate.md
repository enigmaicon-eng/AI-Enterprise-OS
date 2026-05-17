# Governance Delegate

**Component:** risk-aware-routing/governance-delegate  
**Role:** Constitutional compliance, H-NNN rule matching, governance agent routing  
**Source Primitives:** constitution/enterprise-constitution.md, constitution/human-approval-constitution.md, ruflo (claims-based authorization)

---

## Overview

The Governance Delegate is the risk-aware routing system's constitutional layer. Before any task reaches an agent, the Governance Delegate checks it against the Enterprise Constitution's hard limits (§6.3), zero-tolerance security rules (§7.1), and the 26 H-NNN human approval rules. Tasks that require governance review are routed to the appropriate governance agent; tasks that require human approval are blocked at an approval gate.

---

## Constitutional Hard Limits (§6.3)

Thirteen actions are constitutionally prohibited — the Governance Delegate blocks these before any routing:

```python
CONSTITUTIONAL_PROHIBITIONS = {
    "delete_production_data": {
        "article": "§6.3.1",
        "reason": "Production data deletion is irreversible and may destroy evidence",
        "remedy": "Use soft-delete or archival; require H-003 approval for hard delete"
    },
    "modify_audit_logs": {
        "article": "§6.3.2",
        "reason": "Audit log integrity is the foundation of governance accountability",
        "remedy": "Audit logs are append-only; corrections go as new entries with reference"
    },
    "bypass_human_approval_gates": {
        "article": "§6.3.3",
        "reason": "Human-required gates exist for constitutional reasons — not negotiable",
        "remedy": "Follow the H-NNN approval workflow; use !override only for true emergencies"
    },
    "deploy_without_gate_G7_clearance": {
        "article": "§6.3.4",
        "reason": "G7 is the final release authorization gate",
        "remedy": "Complete G7 process: security sign-off, deployment checklist, rollback plan"
    },
    "modify_enterprise_constitution": {
        "article": "§6.3.5",
        "reason": "Constitutional amendments require explicit ratification process",
        "remedy": "Submit constitutional amendment proposal; follow governance-boundary-model.md"
    },
    "grant_authority_tier_escalation": {
        "article": "§6.3.6",
        "reason": "Authority tiers protect against unauthorized action scope expansion",
        "remedy": "Request tier escalation through meta-org evolution process"
    },
    "expose_credentials_in_artifacts": {
        "article": "§6.3.7",
        "reason": "Credentials in artifacts are a critical security breach",
        "remedy": "Use Vault references; never embed credentials in any artifact"
    },
    "access_PII_without_data_governance_clearance": {
        "article": "§6.3.8",
        "reason": "PII access without governance creates compliance liability",
        "remedy": "Obtain DG-001 clearance; use anonymized data for non-production work"
    },
    # ... remaining prohibitions
}

class ConstitutionalGuard:
    """Block constitutionally prohibited actions at routing time."""
    
    def check(self, task: Task) -> ConstitutionalCheckResult:
        if task.action_type in CONSTITUTIONAL_PROHIBITIONS:
            prohibition = CONSTITUTIONAL_PROHIBITIONS[task.action_type]
            return ConstitutionalCheckResult(
                blocked=True,
                article=prohibition["article"],
                reason=prohibition["reason"],
                remedy=prohibition["remedy"],
            )
        
        # Zero-tolerance security checks (§7.1)
        if self._violates_security_rules(task):
            return ConstitutionalCheckResult(
                blocked=True,
                article="§7.1",
                reason="Zero-tolerance security rule violation",
                remedy="Review §7.1 compliance requirements"
            )
        
        return ConstitutionalCheckResult(blocked=False)
    
    def _violates_security_rules(self, task: Task) -> bool:
        ZERO_TOLERANCE = [
            task.hardcodes_credentials,
            task.commits_env_files,
            task.disables_security_scanning,
            task.bypasses_input_validation,
            task.skips_audit_logging,
        ]
        return any(ZERO_TOLERANCE)
```

---

## H-NNN Rule Matching

The Human Approval Constitution defines 26 rules requiring human authorization. The Governance Delegate matches tasks against these rules:

```python
class HumanApprovalRuleMatcher:
    """Match tasks against the 26 H-NNN human approval rules."""
    
    H_RULES = {
        # Category 1: Production / Deployment
        "H-001": {
            "trigger": "production_deployment",
            "condition": lambda t: t.target_environment == "production",
            "approver": "HUMAN",
            "description": "Any deployment to production environment"
        },
        "H-002": {
            "trigger": "rollback_execution",
            "condition": lambda t: t.action_type == "rollback" and t.target_environment == "production",
            "approver": "HUMAN",
            "description": "Production rollback execution"
        },
        "H-003": {
            "trigger": "production_data_deletion",
            "condition": lambda t: t.action_type == "delete" and t.data_classification == "production",
            "approver": "HUMAN",
            "description": "Hard deletion of production data"
        },
        "H-004": {
            "trigger": "infrastructure_change",
            "condition": lambda t: t.touches_infrastructure and t.target_environment == "production",
            "approver": "HUMAN",
            "description": "Production infrastructure modification"
        },
        # Category 2: Financial / Commercial
        "H-005": {
            "trigger": "financial_commitment",
            "condition": lambda t: getattr(t, 'financial_impact_usd', 0) > 10_000,
            "approver": "HUMAN",
            "description": "Financial commitment exceeding $10,000"
        },
        "H-006": {
            "trigger": "vendor_contract",
            "condition": lambda t: t.action_type in ["sign_contract", "vendor_onboard"],
            "approver": "HUMAN",
            "description": "Vendor contract signing or onboarding"
        },
        # Category 3+: Governance / Constitutional
        "H-007": {
            "trigger": "constitutional_modification",
            "condition": lambda t: t.touches_constitution,
            "approver": "HUMAN",
            "description": "Any modification to enterprise constitution"
        },
        # ... all 26 rules
    }
    
    def match(self, task: Task) -> list[str]:
        """Return list of H-NNN rules triggered by this task."""
        triggered = []
        for rule_id, rule in self.H_RULES.items():
            try:
                if rule["condition"](task):
                    triggered.append(rule_id)
            except (AttributeError, TypeError):
                pass   # task doesn't have this attribute — rule doesn't apply
        return triggered
    
    def requires_human_approval(self, task: Task) -> bool:
        return len(self.match(task)) > 0
    
    def approval_description(self, h_rules: list[str]) -> str:
        return "; ".join(
            self.H_RULES[r]["description"] for r in h_rules if r in self.H_RULES
        )
```

---

## Governance Agent Routing

When tasks require governance review (but not full human approval), the Governance Delegate routes to the appropriate governance agent:

```python
class GovernanceAgentRouter:
    """Route tasks to appropriate governance agents based on risk type."""
    
    GOVERNANCE_ROUTING = {
        "risk":             "gov-risk",
        "compliance":       "gov-compliance",
        "audit":            "gov-audit",
        "ai_safety":        "gov-ai-safety",
        "approvals":        "gov-approvals",
        "data_governance":  "gov-data",
        "security":         "qa-security",
        "constitutional":   "constitution-guardian",
    }
    
    def route_for_review(self, task: Task, risk: RiskAssessment) -> GovernanceReviewResult:
        """Determine which governance agents must review this task."""
        reviewers = []
        
        if risk.dimensions.get("security_risk", 0) > 0.5:
            reviewers.append(self.GOVERNANCE_ROUTING["security"])
        
        if risk.dimensions.get("governance_risk", 0) > 0.5:
            reviewers.append(self.GOVERNANCE_ROUTING["risk"])
        
        if task.compliance_framework:
            reviewers.append(self.GOVERNANCE_ROUTING["compliance"])
        
        if risk.constitutional_violation:
            reviewers.append(self.GOVERNANCE_ROUTING["constitutional"])
        
        # De-duplicate
        reviewers = list(set(reviewers))
        
        return GovernanceReviewResult(
            reviewers=reviewers,
            blocking=risk.level in ["critical", "constitutional"],
            review_sla_hours=self._sla_hours(risk.level),
        )
    
    def _sla_hours(self, risk_level: str) -> int:
        return {"negligible": 48, "low": 24, "medium": 8, "high": 4, "critical": 1}[risk_level]
```

---

## Claims-Based Authorization (from ruflo)

Authorization claims are checked before governance routing decisions:

```python
class ClaimsBasedAuthorizer:
    """
    Check authorization claims before allowing governance decisions.
    Adapted from ruflo @claude-flow/claims.
    """
    
    REQUIRED_CLAIMS = {
        "production_deployment":      ["deploy:production", "governance:approved"],
        "constitutional_modification": ["governance:constitutional-authority"],
        "security_policy_change":     ["security:policy-authority", "governance:approved"],
        "financial_commitment":       ["finance:authorized", "governance:approved"],
        "pii_access":                 ["data-governance:pii-authorized"],
    }
    
    def check(self, agent_id: str, action: str) -> AuthorizationResult:
        required = self.REQUIRED_CLAIMS.get(action, [])
        agent_claims = self.claim_store.get_claims(agent_id)
        
        missing = [c for c in required if c not in agent_claims]
        
        if missing:
            return AuthorizationResult(
                authorized=False,
                missing_claims=missing,
                message=f"Agent {agent_id} lacks claims {missing} for action {action}"
            )
        return AuthorizationResult(authorized=True)
```
