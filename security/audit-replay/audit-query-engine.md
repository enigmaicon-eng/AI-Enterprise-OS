# Audit Query Engine

**System ID:** `audit-query-engine`
**Role:** Provides structured, indexed querying over the immutable audit log — enables forensic investigation, compliance reporting, security incident reconstruction, agent behavior analysis, and real-time security monitoring without modifying the underlying audit chain
**Storage:** `memory/audit-replay/audit-index.yaml` (read; written by immutable-audit-log)

---

## Purpose

The audit chain is authoritative but unindexed — sequential reads to answer "what did agent X do in run Y?" would scan every record. The audit query engine maintains a structured index over the audit chain and provides a rich query API for investigation and reporting. It never modifies the audit chain — it only reads it and maintains the index as a derived view. The index can be rebuilt from scratch from the audit chain at any time, making it a pure read-side view with no authority of its own.

---

## Query API

```
# Forensic investigation queries

query(filters, sort_by="sequence_number", limit=100) → [AuditRecord]:
  
  # Available filter dimensions:
  # - event_type: string | [string]
  # - event_category: string | [string]
  # - severity: string | [string]
  # - actor_id: string
  # - actor_trust_tier: string
  # - subject_id: string
  # - run_id: string
  # - node_id: string
  # - outcome: string
  # - start_time: datetime
  # - end_time: datetime
  # - sequence_start: integer
  # - sequence_end: integer
  
  # Load matching records from index
  matching_ids = query_audit_index(filters)
  records = load_records_by_ids(matching_ids, limit=limit)
  
  RETURN sort_records(records, sort_by)

# Security incident reconstruction
reconstruct_incident(run_id, include_categories=["SECURITY", "CONSTITUTIONAL", "TRUST"]) → IncidentTimeline:
  
  records = query({run_id: run_id, event_category: include_categories}, sort_by="sequence_number", limit=1000)
  
  # Build chronological timeline with causal analysis
  timeline = []
  
  FOR record in records:
    timeline_entry = TimelineEntry(
      sequence_number = record.sequence_number,
      timestamp = record.recorded_at,
      event_type = record.event_type,
      actor = record.actor.actor_id,
      outcome = record.outcome,
      severity = record.severity,
      summary = record.evidence_summary
    )
    
    # Identify causal links between events
    IF record.event_type == "INJECTION_BLOCKED":
      # Find the node that received the injection
      related = find_related_record(record, "NODE_FAILED", window_seconds=5)
      IF related:
        timeline_entry.causal_link = related.record_id
    
    timeline.append(timeline_entry)
  
  RETURN IncidentTimeline(
    run_id = run_id,
    event_count = len(timeline),
    timeline = timeline,
    security_verdict = classify_incident(timeline),
    highest_severity = max_severity(records)
  )

# Agent behavior analysis
analyze_agent_behavior(agent_id, window_hours=168) → AgentBehaviorReport:
  
  records = query({
    actor_id: agent_id,
    start_time: now() - window_hours × 3600
  }, limit=5000)
  
  # Aggregate metrics
  by_outcome = count_by_field(records, "outcome")
  by_event_type = count_by_field(records, "event_type")
  
  # Security event rate
  security_records = [r for r in records if r.event_category == "SECURITY"]
  security_rate = len(security_records) / max(len(records), 1)
  
  # Scope violation frequency
  scope_violations = [r for r in records if r.event_type == "SCOPE_VIOLATION"]
  
  # Constitutional violations
  constitutional_violations = [r for r in records if r.event_category == "CONSTITUTIONAL" and r.outcome == "BLOCKED"]
  
  # Denied permission checks
  permission_denials = [r for r in records if r.event_type == "PERMISSION_CHECK_DENIED"]
  
  RETURN AgentBehaviorReport(
    agent_id = agent_id,
    window_hours = window_hours,
    total_audit_events = len(records),
    outcome_distribution = by_outcome,
    security_event_rate = security_rate,
    scope_violations_count = len(scope_violations),
    constitutional_violations_count = len(constitutional_violations),
    permission_denial_count = len(permission_denials),
    behavioral_risk_score = compute_behavioral_risk(scope_violations, constitutional_violations, security_rate),
    anomalies = detect_behavioral_anomalies(records)
  )

# Compliance window report
compliance_report(start_time, end_time) → ComplianceReport:
  
  window_records = query({start_time: start_time, end_time: end_time}, limit=0)  # No limit for compliance
  
  # Constitutional compliance
  constitutional_records = [r for r in window_records if r.event_category == "CONSTITUTIONAL"]
  absolute_violations = [r for r in constitutional_records if r.event_type == "CONSTITUTIONAL_ABSOLUTE_VIOLATION"]
  mandatory_violations = [r for r in constitutional_records if r.event_type == "CONSTITUTIONAL_MANDATORY_VIOLATION"]
  constitutional_overrides = [r for r in constitutional_records if r.event_type == "CONSTITUTIONAL_OVERRIDE"]
  
  # Governance compliance
  gate_records = [r for r in window_records if r.event_type in ["GATE_PASSED", "GATE_FAILED"]]
  gate_pass_rate = len([r for r in gate_records if r.event_type == "GATE_PASSED"]) / max(len(gate_records), 1)
  
  # Approval compliance
  approval_records = [r for r in window_records if r.event_type in ["APPROVAL_GRANTED", "APPROVAL_DENIED"]]
  
  # Security compliance
  injection_blocks = [r for r in window_records if r.event_type == "INJECTION_BLOCKED"]
  credential_protections = [r for r in window_records if r.event_type == "CREDENTIAL_LEAK_PREVENTED"]
  
  RETURN ComplianceReport(
    report_id = generate_uuid(),
    window = {start: start_time, end: end_time},
    generated_at = now(),
    
    constitutional:
      total_evaluations: len(constitutional_records),
      absolute_violations: len(absolute_violations),
      mandatory_violations: len(mandatory_violations),
      overrides: len(constitutional_overrides),
      compliance_score: 1.0 - (len(absolute_violations) × 0.30 + len(mandatory_violations) × 0.10)
    
    governance:
      gate_evaluations: len(gate_records),
      gate_pass_rate: gate_pass_rate,
      approval_granted: len([r for r in approval_records if r.event_type == "APPROVAL_GRANTED"]),
      approval_denied: len([r for r in approval_records if r.event_type == "APPROVAL_DENIED"])
    
    security:
      injection_blocks: len(injection_blocks),
      credential_protections: len(credential_protections),
      scope_violations: len([r for r in window_records if r.event_type == "SCOPE_VIOLATION"])
    
    chain_integrity: immutable_audit_log.verify_chain(
      start_sequence = get_sequence_at_time(start_time),
      end_sequence = get_sequence_at_time(end_time)
    ).verified
  )

# Real-time security alert monitoring
get_recent_critical_events(window_minutes=15) → [AuditRecord]:
  RETURN query({
    severity: ["CRITICAL", "HIGH"],
    start_time: now() - window_minutes × 60,
    event_category: ["SECURITY", "CONSTITUTIONAL"]
  }, sort_by="sequence_number")

# Agent comparative analysis (identify outliers)
compare_agent_behavior(agent_ids, window_hours=24) → AgentComparisonReport:
  
  reports = {agent_id: analyze_agent_behavior(agent_id, window_hours) for agent_id in agent_ids}
  
  # Identify statistical outliers
  security_rates = {id: r.security_event_rate for id, r in reports.items()}
  mean_rate = MEAN(security_rates.values())
  std_rate = STDEV(security_rates.values())
  
  outliers = [id for id, rate in security_rates.items() if abs(rate - mean_rate) > 2 × std_rate]
  
  RETURN AgentComparisonReport(
    agents_analyzed = agent_ids,
    window_hours = window_hours,
    individual_reports = reports,
    statistical_outliers = outliers,
    highest_risk_agent = MAX(reports, key=lambda id: reports[id].behavioral_risk_score)
  )
```

---

## Audit Index Schema

```yaml
AuditIndex:
  # Maintained by immutable-audit-log; read by audit-query-engine
  
  last_indexed_sequence: integer
  total_records: integer
  
  # Inverted indexes for fast query
  by_event_type: {event_type: [record_id]}
  by_event_category: {category: [record_id]}
  by_actor_id: {actor_id: [record_id]}
  by_run_id: {run_id: [record_id]}
  by_outcome: {outcome: [record_id]}
  by_severity: {severity: [record_id]}
  
  # Time-based index for range queries
  time_sequence_map: [{timestamp: datetime, sequence: integer}]
  
  # Chain metadata
  chain_head_hash: string
  chain_head_sequence: integer
```

---

## Integration

**Called by:**
- Compliance auditors — generates compliance reports
- `execution-observability/orchestration-monitor.md` — queries recent critical events for dashboard
- `audit-replay/governance-replay-engine.md` — uses query engine to load records for replay
- Security operators — forensic investigation

**Calls:**
- `audit-replay/immutable-audit-log.md` — loads records by ID and verifies chain
- `audit-replay/governance-replay-engine.md` — delegates replay requests

**Reads from:**
- `memory/audit-replay/audit-chain.jsonl` — primary record store (read-only)
- `memory/audit-replay/audit-index.yaml` — query index (read-only)
