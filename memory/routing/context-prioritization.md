---
layer: memory-routing
type: context-prioritization
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
---

# Context Prioritization

The ranking rules that determine which context elements are included, excluded, or compressed when the context budget is constrained. Priority determines what survives when not everything fits.

---

## Priority Tiers

Every context element has a priority from P0 (never drop) to P4 (drop first):

```
P0 — INVIOLABLE (never compressed, never dropped)
  - Active binding constraints from T2+ ADRs that apply to this routing key
  - Human-required gate markers (agent MUST know when to stop for human)
  - Security constraints relevant to this task
  - Constitutional rules that restrict agent behavior
  - Current step specification (what the agent must produce)
  
P1 — CRITICAL (compress before dropping; never drop outright)
  - Consistency anchor (current organizational facts)
  - Active run-context for the workflow instance
  - Required input artifact schemas (what format to read inputs in)
  - Output artifact schema (what format to produce)
  - Governance principles summary
  
P2 — HIGH (compress aggressively; drop only under severe budget pressure)
  - Domain-specific CRITICAL memory entries
  - Recent decisions affecting this domain (last 90 days)
  - Known risks in this domain that are HIGH or CRITICAL
  - Ontology definitions for terms used in this task
  - Relevant wiki pages (first 300 tokens each)
  
P3 — MEDIUM (compress as needed; drop when budget requires)
  - Domain-specific HIGH memory entries
  - Related workflow state (sibling steps that have completed)
  - Pattern entries from memory/patterns/
  - Historical context from prior sprints (distilled capsules only)
  - Graph-recommended supplemental entries
  
P4 — LOW (drop first when budget is tight)
  - Domain-specific NORMAL memory entries
  - Background context about the broader initiative
  - Historical failure modes (unless directly applicable)
  - Extended agent biography/capabilities
  - General organizational context not specific to this task
```

---

## Prioritization Algorithm

Given a set of candidate context elements E and budget B:

```python
def assemble_context(elements, budget):
    # Sort by priority tier, then by relevance score within tier
    sorted_elements = sort(elements, key=lambda e: (e.priority, -e.relevance_score))
    
    package = []
    remaining_budget = budget
    compressed_set = []
    
    for element in sorted_elements:
        element_size = estimate_tokens(element)
        
        if element.priority == P0:
            # P0 elements are always included; budget can be exceeded for P0
            package.append(element)
            remaining_budget -= element_size
            
        elif element_size <= remaining_budget:
            # Fits without compression
            package.append(element)
            remaining_budget -= element_size
            
        elif element.priority <= P2 and element_size > remaining_budget:
            # Must compress; queue for compression
            compressed_set.append(element)
            
        elif element.priority >= P3 and element_size > remaining_budget:
            # Drop low-priority items that don't fit
            log_dropped(element)
            
    # Apply compression to compressed_set
    for element in compressed_set:
        compressed = compress(element)
        if estimate_tokens(compressed) <= remaining_budget:
            package.append(compressed)
            remaining_budget -= estimate_tokens(compressed)
        else:
            log_dropped(element, reason="insufficient budget after compression")
    
    return package
```

---

## Per-Element Priority Defaults

Every element type has a default priority. The routing engine uses these defaults unless a specific override is registered:

| Element Type | Default Priority | Override Condition |
|---|---|---|
| Active ADR binding constraints | P0 | Always P0 |
| Human gate marker | P0 | Always P0 |
| Security restrictions | P0 | Always P0 |
| Consistency anchor | P1 | Never below P1 |
| Run-context | P1 | Never below P1 |
| Step schema (output format) | P1 | Never below P1 |
| Required input artifact | P1 or P2 | P1 if on critical path |
| Governance principles summary | P1 | Never below P1 |
| Critical memory entry | P2 | Raises to P1 if EWC check shows unique content |
| High memory entry | P2 | Default |
| Recent decision (<90 days) | P2 | Default |
| Wiki page (relevant section) | P2 | Drops to P3 if >6 months old |
| Pattern entry | P3 | Raises to P2 if directly applicable |
| Graph recommendation | P3 | Default |
| Normal memory entry | P4 | Default |
| Historical sprint capsule | P4 | Raises to P3 if initiative-specific |

---

## Task-Specific Priority Overrides

Certain routing keys trigger priority overrides for specific element types:

| Routing Key | Override | Reason |
|---|---|---|
| security-design | security knowledge entries: P2→P1 | Security decisions need full context |
| ai-safety-review | AI safety constraints: P0 | Non-negotiable for safety reviews |
| compliance-review | Compliance requirements: P0 | Legal obligation context |
| incident-response | Active incident context: P0 | Incident speed is critical |
| principal-architecture | ADR history: P2→P1 | Architects need full decision context |
| knowledge-management | All memory entries: elevate by 1 tier | Meta-level work needs full context |

---

## Priority Score Adjustment for Recency

Recency adjusts priority scores within a tier (does not change tiers):

```
age_adjustment = max(0, 1 - (age_days / max_relevance_days))
adjusted_relevance = base_relevance × age_adjustment

max_relevance_days by element type:
  - Security constraints: never decay (no recency adjustment)
  - ADR binding constraints: decay over 730 days (ADRs remain valid)
  - Memory entries: decay over 180 days
  - Wiki pages: decay over 90 days
  - Sprint learning capsules: decay over 365 days
```

---

## Conflict Resolution in Priority Assignment

When two different priority rules claim different priorities for the same element:

- If one rule is domain-specific and one is general: domain-specific rule wins
- If both are domain-specific: higher priority wins (never downgrade by conflict)
- If a routing key override and a task-specific override conflict: task-specific wins
- If ambiguous: default to P2 (safer to include than exclude)

---

## Priority Audit Log

All P0 and P1 drops (which should be extremely rare) are logged:

```yaml
# Appended to memory/priority-audit-log.md
priority-drop:
  timestamp: "{ISO-8601}"
  element: "{path or description}"
  assigned-priority: "P0"
  actual-action: "DROPPED"
  reason: "{why budget was so constrained}"
  workaround: "{what the agent was told instead}"
  escalated-to: "{agent or human}"
```

A P0 drop is a system failure event. If a P0 element cannot be included, the dispatch is paused and the orchestrator is notified. The budget is increased for this specific dispatch.
