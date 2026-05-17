# Execution Continuity

**Component:** organizational-synchronization/execution-continuity  
**Role:** Session recovery, context reconstruction, past-context injection across resets  
**Source Primitives:** TradingAgents (past_context injection, Propagator), ruflo (session-restore hook, memory bridge)

---

## Overview

The Enterprise AI OS operates across multiple sessions, context windows, and potential interruptions. Execution Continuity ensures that when a session ends or a context limit is hit, the next session can reconstruct full workflow state and continue without losing decisions, artifacts, or organizational context.

This component directly implements the past-context injection pattern from TradingAgents, which enables the Portfolio Manager to incorporate prior decisions about the same stock ticker without re-running full analysis. In the OS, this becomes: the next agent can incorporate prior decisions about the same feature/entity without re-running the full workflow.

---

## Past-Context Injection (from TradingAgents)

The core continuity mechanism. At the start of any new session, inject accumulated past context for the entity being worked on:

```python
class PastContextInjector:
    """
    Adapted from TradingAgents: same-entity decisions + cross-entity patterns.
    TradingAgents uses: same-ticker decisions + cross-ticker lessons.
    Enterprise adaptation: same-feature decisions + cross-feature patterns.
    """
    
    def inject(self, entity: str, workflow_intent: str) -> str:
        """
        Build past_context string for new session.
        Called by Propagator.create_initial_state() at session start.
        """
        
        # 1. Same-entity past decisions
        same_entity = self._load_entity_decisions(entity)
        
        # 2. Cross-entity validated patterns (cross-ticker lessons equivalent)
        cross_entity = self._load_cross_entity_patterns(workflow_intent)
        
        # 3. Active governance constraints (always injected)
        constraints = self._load_active_constraints()
        
        # 4. Last session handoff (if exists)
        last_handoff = self._load_last_handoff(entity)
        
        if not same_entity and not cross_entity and not last_handoff:
            return ""   # no past context for this entity
        
        parts = []
        
        if last_handoff:
            parts.append(f"## Last Session State:\n{last_handoff}")
        
        if same_entity:
            parts.append(f"## Prior Decisions for '{entity}':\n{same_entity}")
        
        if cross_entity:
            parts.append(f"## Validated Patterns from Similar Work:\n{cross_entity}")
        
        if constraints:
            parts.append(f"## Active Governance Constraints:\n{constraints}")
        
        return "\n\n".join(parts)
    
    def _load_entity_decisions(self, entity: str) -> str:
        """Load all decisions tagged to this entity from decision log."""
        decisions = self.memory.query_decisions(entity_tag=entity)
        if not decisions:
            return ""
        return "\n".join(
            f"- [{d.date}] {d.signal.upper()}: {d.summary}" for d in decisions[-10:]
        )
    
    def _load_cross_entity_patterns(self, intent: str) -> str:
        """Load validated coordination patterns for this workflow type."""
        patterns = self.memory.search_patterns(intent, top_k=3)
        if not patterns:
            return ""
        return "\n".join(f"- {p.summary}" for p in patterns)
    
    def _load_active_constraints(self) -> str:
        """Load currently active governance constraints."""
        return self.memory.read("organizational/governance-constraints.md", max_tokens=500)
    
    def _load_last_handoff(self, entity: str) -> str:
        """Load the most recent session handoff for this entity."""
        handoffs = self.memory.query_handoffs(entity_tag=entity)
        if not handoffs:
            return ""
        last = handoffs[-1]
        return f"Session ended: {last.session_end}\nLast state: {last.workflow_state_summary}\nOpen items: {last.open_items}"
```

---

## Session Recovery Protocol

When a session is interrupted (context limit, process restart, agent failure):

```python
class SessionRecoveryProtocol:
    """
    Reconstruct workflow state from persisted coordination state.
    Adapted from ruflo session-restore hook and memory bridge.
    """
    
    def recover(self, workflow_id: str) -> RecoveryResult:
        """Attempt to recover an interrupted workflow."""
        
        # Step 1: Load last checkpointed coordination state
        saved_state = self.memory.load(f"swarm${workflow_id}$state")
        if not saved_state:
            return RecoveryResult(success=False, reason="No saved state found")
        
        # Step 2: Reconstruct vector clock
        saved_clock = self.memory.load(f"swarm${workflow_id}$vector_clock")
        
        # Step 3: Reload debate/risk states if in progress
        debate_state = self.memory.load(f"swarm${workflow_id}$debate")
        risk_state   = self.memory.load(f"swarm${workflow_id}$risk")
        
        # Step 4: Reload gates
        gates_crdt = self.memory.load(f"swarm${workflow_id}$gates")
        
        # Step 5: Rebuild coordination state
        recovered_state = {
            **saved_state,
            "vector_clock": saved_clock or {},
            "debate_state": debate_state or init_debate_state(),
            "risk_state":   risk_state   or init_risk_state(),
            "gates_passed": gates_crdt.elements_list() if gates_crdt else [],
        }
        
        # Step 6: Inject fresh past context (may have new decisions since save)
        recovered_state["past_context"] = self.past_context_injector.inject(
            entity=saved_state["entity_of_interest"],
            workflow_intent=saved_state["workflow_intent"],
        )
        
        # Step 7: Identify resumption point
        last_agent  = saved_state.get("current_agent")
        last_status = saved_state.get("workflow_status")
        
        return RecoveryResult(
            success=True,
            recovered_state=recovered_state,
            resume_from_agent=last_agent,
            resume_from_status=last_status,
            recovery_notes=f"Recovered workflow {workflow_id} from {last_status} status"
        )
```

---

## Session Handoff Generation

At the end of every major session, generate a handoff package for continuity:

```python
class SessionHandoffGenerator:
    """
    Generate structured handoff for session continuity.
    From CLAUDE.md SESSION CONTINUITY RULES.
    """
    
    def generate(self, session_id: str, active_workflows: list[str]) -> SessionHandoff:
        handoff = SessionHandoff(
            session_id=session_id,
            session_end=now_iso(),
            
            # Completed work
            completed_artifacts=self._list_completed_artifacts(session_id),
            decisions_made=self._list_decisions(session_id),
            gates_passed=self._list_gate_results(session_id),
            
            # Open work
            open_workflows=self._snapshot_open_workflows(active_workflows),
            open_questions=self.memory.read("memory/open-questions.md"),
            
            # State for reconstruction
            vector_clocks={wf: self.memory.load(f"swarm${wf}$vector_clock")
                         for wf in active_workflows},
            
            # Continuation instructions
            next_actions=self._identify_next_actions(active_workflows),
            orchestration_state=self._capture_orchestration_state(),
            governance_state=self._capture_governance_state(),
        )
        
        # Persist handoff
        self.memory.write(
            f"handoffs/session-{session_id}/session-handoff.md",
            handoff.to_markdown()
        )
        
        # Update past context for all active entities
        for workflow_id in active_workflows:
            entity = self.memory.load(f"swarm${workflow_id}$state", "entity_of_interest")
            if entity:
                self.past_context_injector.update(
                    entity_id=entity,
                    new_decision=handoff.decisions_summary,
                    outcome=handoff.session_outcome,
                )
        
        return handoff
```

---

## Context Reconstruction at Session Start

```python
class SessionInitializer:
    """
    Initialize new session with full continuity context.
    Adapted from ruflo session-start hook and memory-bridge.
    """
    
    def initialize(self, session_id: str) -> SessionContext:
        """
        Build complete context for new session.
        Equivalent to ruflo's auto-import on session start.
        """
        
        # 1. Load all active workflow states
        active_workflows = self._find_active_workflows()
        
        # 2. Load last session handoff
        last_handoff = self._load_last_handoff()
        
        # 3. Load memory indexes
        memory_index = self.memory.read("memory/MEMORY_INDEX.md")
        open_questions = self.memory.read("memory/open-questions.md")
        known_risks = self.memory.read("memory/known-risks.md")
        
        # 4. Load governance constraints (always)
        governance = self.memory.read("organizational/governance-constraints.md")
        
        # 5. Import memories from prior sessions (ruflo memory bridge equivalent)
        prior_memories = self._import_prior_session_memories()
        
        return SessionContext(
            session_id=session_id,
            active_workflows=active_workflows,
            last_handoff_summary=last_handoff.summary if last_handoff else "No prior handoff",
            open_questions=open_questions,
            known_risks=known_risks,
            governance_constraints=governance,
            prior_decisions=prior_memories,
            initialized_at=now_iso(),
        )
    
    def _find_active_workflows(self) -> list[str]:
        """Find workflows that were in-flight at last session end."""
        return [
            key.split("$")[1]
            for key in self.memory.keys_matching("swarm$*$state")
            if self.memory.load(key, "workflow_status") not in ["COMPLETE", "HALTED", "PARTIAL_COMPLETE"]
        ]
```
