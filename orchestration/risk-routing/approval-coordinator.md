# Approval Coordinator

**Component:** risk-aware-routing/approval-coordinator  
**Role:** Human approval workflow, blocking gates, notification, timeout handling  
**Source Primitives:** constitution/human-approval-constitution.md, ruflo (hooks, session management)

---

## Overview

The Approval Coordinator manages the lifecycle of human approval requests. When a task matches an H-NNN rule, the coordinator blocks workflow execution, assembles the approval request, notifies the appropriate human, tracks the response, and resumes the workflow once approved or escalates further if approval is denied or times out.

---

## Approval Lifecycle

```
APPROVAL LIFECYCLE
──────────────────────────────────────────────────────────
1. TRIGGER     ← H-NNN rule matched by Governance Delegate
      ↓
2. ASSEMBLE    ← Build approval package with full context
      ↓
3. BLOCK       ← Pause all dependent downstream work
      ↓
4. NOTIFY      ← Deliver to human approver(s)
      ↓
5. AWAIT       ← Poll for response (non-blocking to other workflows)
      ↓
6a. APPROVED  → Unblock workflow, resume with approval record
6b. DENIED    → Halt workflow, notify agents, record denial
6c. TIMEOUT   → Escalate to backup approver, re-notify
      ↓
7. RECORD      ← Append to decision log, audit trail
```

---

## Approval Request Assembly

```python
class ApprovalRequestAssembler:
    """Build complete approval context for human reviewer."""
    
    def assemble(self, task: Task, risk: RiskAssessment, 
                 h_rules: list[str]) -> ApprovalRequest:
        return ApprovalRequest(
            request_id=f"APR-{task.id}-{now_iso()}",
            h_rules_triggered=h_rules,
            
            # What is being requested
            action_summary=task.description,
            action_type=task.action_type,
            entity=task.entity,
            
            # Why it needs approval
            h_rule_descriptions=[self.h_rules[r]["description"] for r in h_rules],
            risk_assessment=risk,
            
            # Context for informed decision
            relevant_artifacts=[
                f"artifacts/{task.entity}/latest-prd.md",
                f"architecture/decisions/ADR-*.md",  # relevant ADRs
                f"memory/known-risks.md",
            ],
            past_context=self.memory.build_past_context(task.entity, task.action_type),
            
            # Decision options
            options=[
                ApprovalOption(id="approve", label="Approve", effect="Resume workflow"),
                ApprovalOption(id="approve_with_conditions", label="Approve with conditions",
                               requires_text=True, effect="Resume with stated constraints"),
                ApprovalOption(id="deny", label="Deny", requires_text=True,
                               effect="Halt workflow, notify all agents"),
                ApprovalOption(id="defer", label="Defer 24h", effect="Re-notify in 24 hours"),
            ],
            
            # Timing
            requested_at=now_iso(),
            sla_hours=self._sla_from_risk(risk.level),
            
            # Approver(s)
            primary_approver=self._select_approver(h_rules),
            backup_approver=self._select_backup_approver(h_rules),
        )
    
    def _select_approver(self, h_rules: list[str]) -> str:
        """Select primary human approver based on H-NNN rule category."""
        rule_approver_map = {
            "H-001": "engineering-lead",      # production deployment
            "H-002": "engineering-lead",      # rollback
            "H-003": "data-owner",            # data deletion
            "H-004": "infra-lead",            # infrastructure
            "H-005": "finance-approver",      # financial
            "H-006": "legal-approver",        # contracts
            "H-007": "constitutional-council", # constitutional
        }
        # Take the most restrictive approver if multiple rules triggered
        approvers = [rule_approver_map.get(r, "executive") for r in h_rules]
        return approvers[0]   # simplification: return first required approver
    
    def _sla_from_risk(self, risk_level: str) -> int:
        return {"critical": 1, "high": 4, "medium": 8, "low": 24}.get(risk_level, 8)
```

---

## Workflow Blocking

```python
class WorkflowBlocker:
    """Pause dependent work pending approval."""
    
    def block(self, workflow_id: str, approval_request_id: str):
        """
        Mark workflow as AWAITING_APPROVAL.
        Downstream agents should not proceed until unblocked.
        """
        self.state_machine.transition(
            workflow_id=workflow_id,
            to_state="AWAITING_APPROVAL",
            metadata={
                "approval_request_id": approval_request_id,
                "blocked_at": now_iso(),
            }
        )
        
        # Notify all active agents in this workflow to pause
        active_agents = self.workflow_graph.active_agents(workflow_id)
        for agent_id in active_agents:
            self.event_bus.publish("workflow.blocked", {
                "workflow_id": workflow_id,
                "reason": "awaiting_human_approval",
                "approval_request_id": approval_request_id,
            })
        
        # Write to memory so agents re-checking find the block
        self.memory.write(
            f"swarm${workflow_id}$state",
            {"status": "AWAITING_APPROVAL", "approval_id": approval_request_id}
        )
    
    def unblock(self, workflow_id: str, approval_outcome: ApprovalOutcome):
        if approval_outcome.decision == "approved":
            self.state_machine.transition(workflow_id, to_state="EXECUTING")
            self.memory.write(f"swarm${workflow_id}$approval", {
                "decision": "approved",
                "approver": approval_outcome.approver,
                "conditions": approval_outcome.conditions,
                "approved_at": now_iso(),
            })
        elif approval_outcome.decision == "denied":
            self.state_machine.transition(workflow_id, to_state="HALTED")
        elif approval_outcome.decision == "approved_with_conditions":
            self.state_machine.transition(workflow_id, to_state="EXECUTING")
            self.constraint_injector.inject(workflow_id, approval_outcome.conditions)
```

---

## Notification System

```python
class ApprovalNotifier:
    """Deliver approval requests to human approvers via available channels."""
    
    CHANNELS = ["email", "slack", "teams", "jira"]  # from integration fabric
    
    def notify(self, approval_request: ApprovalRequest):
        message = self._format_message(approval_request)
        
        # Try channels in priority order until delivery confirmed
        for channel in self.CHANNELS:
            if self._deliver(channel, approval_request.primary_approver, message):
                self.delivery_log.record(approval_request.request_id, channel)
                break
        
        # Schedule reminder
        self.scheduler.schedule_reminder(
            approval_request_id=approval_request.request_id,
            remind_at=now() + hours(1),
            escalate_at=now() + hours(approval_request.sla_hours),
        )
    
    def _format_message(self, req: ApprovalRequest) -> str:
        return f"""
APPROVAL REQUIRED — Enterprise AI OS

Request ID: {req.request_id}
Entity: {req.entity}
Action: {req.action_summary}

WHY YOUR APPROVAL IS NEEDED:
{chr(10).join(f'• {desc}' for desc in req.h_rule_descriptions)}

RISK LEVEL: {req.risk_assessment.level.upper()}

Please respond at your earliest convenience. SLA: {req.sla_hours} hours.

OPTIONS:
{chr(10).join(f'• {opt.id}: {opt.label} — {opt.effect}' for opt in req.options)}
"""
```

---

## Timeout Handling

```python
class ApprovalTimeoutHandler:
    """Handle approval requests that exceed their SLA."""
    
    def on_timeout(self, approval_request: ApprovalRequest):
        """Escalate to backup approver after primary SLA expires."""
        
        # First timeout: re-notify primary + notify backup
        if not approval_request.first_reminder_sent:
            self.notifier.notify_reminder(approval_request.primary_approver, approval_request)
            self.notifier.notify(
                ApprovalRequest(**{**approval_request.__dict__,
                                 "primary_approver": approval_request.backup_approver})
            )
            return
        
        # Second timeout: escalate to executive
        if not approval_request.executive_escalated:
            executive = self._find_executive(approval_request.h_rules_triggered)
            self.notifier.notify_urgent(executive, approval_request)
            approval_request.executive_escalated = True
            return
        
        # Final timeout: auto-deny for safety
        self.auto_deny(approval_request, reason="Approval timeout exceeded — auto-denied for safety")
    
    def auto_deny(self, req: ApprovalRequest, reason: str):
        """Auto-deny timed-out approvals to prevent perpetual blocking."""
        outcome = ApprovalOutcome(
            request_id=req.request_id,
            decision="denied",
            approver="system-auto-deny",
            reason=reason,
            decided_at=now_iso(),
        )
        self.blocker.unblock(req.workflow_id, outcome)
        self.audit.record(outcome)
        self.event_bus.publish("agent.escalation", {
            "from": "approval-coordinator",
            "to": "master-orchestrator",
            "reason": reason,
        })
```

---

## Approval Record

Every approval decision is recorded for audit:

```python
@dataclass
class ApprovalRecord:
    request_id: str
    workflow_id: str
    h_rules_triggered: list[str]
    action_summary: str
    decision: str               # approved / denied / approved_with_conditions
    approver: str
    conditions: list[str]       # if approved_with_conditions
    decision_rationale: str
    requested_at: str
    decided_at: str
    response_time_hours: float

# Persisted to:
# - memory/decisions.md (master decision index)
# - audit trail (append-only log, cannot be modified per §6.3.2)
# - artifacts/approvals/{request_id}.md
```
