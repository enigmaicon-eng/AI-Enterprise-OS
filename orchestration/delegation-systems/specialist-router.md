# Specialist Router

**Component:** delegation-systems/specialist-router  
**Role:** Routing key lookup, 100+ intent-to-agent mappings, authority-tier enforcement  
**Source Primitives:** ruflo (3-tier model routing ADR-026), agents/ROUTING-TABLE.md

---

## Overview

The Specialist Router maps workflow intents and routing keys to the correct agent(s) in the 144-agent topology. It is the primary lookup mechanism for all delegation decisions — deterministic before adaptive.

---

## Routing Resolution Algorithm

```python
class SpecialistRouter:
    """Maps routing keys to agents from the ROUTING-TABLE."""
    
    def route(self, intent: str, context: RoutingContext) -> RoutingResult:
        """
        Resolution order:
        1. Exact routing key match
        2. Intent classification → routing key
        3. Capability-based fallback
        4. Escalation to orchestrator if no match
        """
        
        # Step 1: Check routing table for exact key
        routing_key = self._normalize_key(intent)
        if routing_key in self.ROUTING_TABLE:
            agents = self.ROUTING_TABLE[routing_key]
            return RoutingResult(
                agents=agents,
                confidence=1.0,
                source="routing_table_exact"
            )
        
        # Step 2: Intent classification
        classified_key = self._classify_intent(intent)
        if classified_key and classified_key in self.ROUTING_TABLE:
            agents = self.ROUTING_TABLE[classified_key]
            return RoutingResult(
                agents=agents,
                confidence=0.85,
                source="intent_classification"
            )
        
        # Step 3: Capability-based fallback
        capable_agents = self._find_by_capability(intent, context)
        if capable_agents:
            return RoutingResult(
                agents=capable_agents,
                confidence=0.60,
                source="capability_fallback",
                note="No exact routing key match — capability-based selection"
            )
        
        # Step 4: Escalate to orchestrator
        return RoutingResult(
            agents=["master-orchestrator"],
            confidence=0.30,
            source="orchestrator_escalation",
            note="Routing key not found — orchestrator will decompose intent"
        )
```

---

## Core Routing Table (100+ Keys)

Extracted from `agents/ROUTING-TABLE.md`. Key routing mappings:

### Product Domain

```python
PRODUCT_ROUTES = {
    "prd":                      ["pm-lead", "pm-feature"],
    "discovery":                ["pm-discovery", "ux-research"],
    "sprint_planning":          ["pm-lead", "delivery-manager"],
    "user_story":               ["pm-feature"],
    "acceptance_criteria":      ["pm-feature", "qa-general"],
    "product_metrics":          ["analytics-product", "pm-lead"],
    "experiment_design":        ["analytics-experimentation", "pm-lead"],
    "roadmap":                  ["pm-lead", "exec-cpo"],
    "prioritization":           ["pm-lead"],
    "stakeholder_alignment":    ["pm-lead", "delivery-program"],
    "market_analysis":          ["strategy-ci", "pm-discovery"],
    "competitive_analysis":     ["strategy-ci"],
    "persona_definition":       ["ux-research", "pm-discovery"],
}
```

### Architecture Domain

```python
ARCHITECTURE_ROUTES = {
    "adr":                      ["arch-principal"],
    "rfc":                      ["arch-principal", "arch-ea"],
    "system_design":            ["arch-principal", "arch-ea"],
    "api_design":               ["arch-api"],
    "data_architecture":        ["arch-ea"],
    "security_architecture":    ["arch-security"],
    "runtime_architecture":     ["arch-runtime"],
    "ai_architecture":          ["arch-ai", "arch-principal"],
    "scalability_review":       ["arch-principal", "arch-runtime"],
    "migration_planning":       ["arch-ea", "arch-principal"],
    "tech_debt_assessment":     ["arch-principal", "eng-distinguished"],
}
```

### Engineering Domain

```python
ENGINEERING_ROUTES = {
    "implement":                ["eng-backend"],
    "backend":                  ["eng-backend"],
    "frontend":                 ["eng-frontend"],
    "ai_dev":                   ["eng-ai"],
    "cicd":                     ["eng-devops"],
    "infrastructure":           ["eng-devops"],
    "code_review":              ["eng-distinguished"],
    "performance_optimization": ["eng-distinguished", "qa-performance"],
    "security_fix":             ["eng-backend", "qa-security"],
    "database":                 ["eng-backend", "arch-ea"],
}
```

### Governance Domain

```python
GOVERNANCE_ROUTES = {
    "risk_assessment":          ["gov-risk"],
    "compliance":               ["gov-compliance"],
    "approval_required":        ["gov-approvals"],
    "audit":                    ["gov-audit"],
    "ai_safety_review":         ["gov-ai-safety"],
    "constitutional_check":     ["constitution-guardian"],
    "human_approval":           ["gov-approvals", "HUMAN"],    # always escalates to human
    "security_review":          ["qa-security", "arch-security"],
}
```

### Cross-Org Routing

```python
CROSS_ORG_ROUTES = {
    "feature_development":      ["pm-lead", "arch-principal", "eng-distinguished"],
    "incident_response":        ["delivery-incident", "eng-devops", "gov-risk"],
    "release":                  ["delivery-release", "qa-general", "delivery-rollout"],
    "architecture_review":      ["arch-principal", "arch-security", "eng-distinguished"],
    "sprint_retrospective":     ["delivery-manager", "pm-lead"],
    "security_incident":        ["qa-security", "gov-risk", "delivery-incident", "HUMAN"],
    "compliance_review":        ["gov-compliance", "gov-risk", "exec-cto"],
}
```

---

## Intent Classification

For intents that don't exactly match routing keys:

```python
class IntentClassifier:
    """Map natural language intents to routing keys."""
    
    CLASSIFICATION_PATTERNS = [
        # Product signals
        (r"(build|create|implement) feature", "feature_development"),
        (r"product requirements|PRD|requirements doc", "prd"),
        (r"sprint|iteration|backlog", "sprint_planning"),
        (r"user research|discovery|validate", "discovery"),
        
        # Architecture signals
        (r"architecture decision|ADR|design decision", "adr"),
        (r"RFC|request for comment|design proposal", "rfc"),
        (r"system design|architecture review", "system_design"),
        (r"API (design|contract|spec)", "api_design"),
        
        # Risk/Governance signals
        (r"risk|compliance|legal|audit", "risk_assessment"),
        (r"approve|approval|sign-?off", "approval_required"),
        (r"incident|outage|alert|!incident", "incident_response"),
        (r"release|deploy|ship", "release"),
        
        # Security signals
        (r"security (review|audit|scan|vuln)", "security_review"),
        (r"threat model|pentest", "security_architecture"),
    ]
    
    def classify(self, intent: str) -> str | None:
        intent_lower = intent.lower()
        for pattern, routing_key in self.CLASSIFICATION_PATTERNS:
            if re.search(pattern, intent_lower):
                return routing_key
        return None
```

---

## Authority Tier Enforcement

The specialist router enforces the routing authority cascade. A delegation that would send a T5 decision to a T1 agent is blocked:

```python
AUTHORITY_TIERS = {
    "constitutional":  5,
    "strategic":       4,
    "architectural":   3,
    "domain":          2,
    "execution":       1,
}

AGENT_TIERS = {
    "exec-cpo":           5,
    "exec-cto":           5,
    "constitution-guard": 5,
    "arch-principal":     3,
    "gov-risk":           4,
    "pm-lead":            2,
    "eng-backend":        1,
    # ... full table from MASTER-REGISTRY
}

def enforce_authority_tier(routing_key: str, candidate_agents: list[str]) -> list[str]:
    """Remove agents whose tier is insufficient for this routing key."""
    required_tier = ROUTING_KEY_MINIMUM_TIER.get(routing_key, 1)
    return [a for a in candidate_agents if AGENT_TIERS.get(a, 1) >= required_tier]
```

---

## Multi-Agent Routing

Some routing keys dispatch to multiple agents simultaneously (fan-out):

```python
PARALLEL_ROUTES = {
    "architecture_review": {
        "mode": "fan_out",
        "agents": ["arch-principal", "arch-security", "eng-distinguished"],
        "collect_at": "arch-principal",
        "requires_consensus": False,
    },
    "security_incident": {
        "mode": "fan_out",
        "agents": ["qa-security", "gov-risk", "delivery-incident"],
        "collect_at": "master-orchestrator",
        "requires_consensus": False,
        "human_escalation": True,
    },
    "high_stakes_decision": {
        "mode": "debate",
        "agents": ["pm-lead", "arch-principal", "gov-risk"],
        "judge": "exec-cpo",
        "max_rounds": 2,
    },
}
```
