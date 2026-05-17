# Global Reference Validator
**ID:** MEM-INT-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org | **Updated:** 2026-05-16

---

## Purpose

Validates cross-system referential integrity across all Enterprise AI OS state files. Detects dangling references (IDs that point to non-existent records), broken links between systems, and orphaned state. Runs as a weekly automated sweep and on-demand for specific systems.

---

## Reference Taxonomy

The OS uses structured IDs across all systems. The validator knows the authoritative source for each:

| ID Pattern | Authoritative Source | Location |
|-----------|---------------------|---------|
| `WF-{NNN}` | Workflow registry | memory/workflow-engine/registry-index.yaml |
| `OKR-*` | OKR state | memory/strategic-intelligence/okr-state.yaml |
| `SCP-*` | Active scenarios | memory/strategic-intelligence/active-scenarios.yaml |
| `RAD-*` | Radar state | memory/strategic-intelligence/radar-state.yaml |
| `DP-*` | Decision packages | memory/strategic-intelligence/decisions.jsonl |
| `OPT-*` | Strategic options | memory/strategic-intelligence/options-log.jsonl |
| `UIU-*` | Intelligence fusion | event bus (transient) |
| `COMP-*` | Competitor registry | memory/strategic-intelligence/competitor-registry.yaml |
| `ADR-*` | Architecture decisions | architecture/decisions/ |
| `WG-*` | War games | memory/strategic-intelligence/war-game-library.yaml |
| `CRED-*` | Credential registry | memory/security/credential-registry.yaml |
| `CONN-*` | Connector registry | integrations/MASTER-INTEGRATION-REGISTRY.md |
| `agent_id` | Agent registry | agents/MASTER-REGISTRY.md |
| `KU-*` | Knowledge units | knowledge-base/ |
| `RSK-*` | Risk register | risk-and-controls/enterprise-risk-register.md |

---

## Validation Sweep Protocol

### Weekly Automated Sweep (Sunday 04:00 UTC)

```
Step 1: Collect all reference IDs
  - Scan all *.yaml and *.jsonl files in memory/
  - Extract all strings matching known ID patterns via regex
  - Build reference inventory: {file_path, line_num, id_pattern, id_value}

Step 2: Resolve each reference
  - For each reference, query the authoritative source
  - Mark as VALID (exists), BROKEN (not found), or UNKNOWN (pattern unrecognized)
  
Step 3: Classify broken references
  For each BROKEN reference:
    - Severity: CRITICAL (active workflow or governance), HIGH (intelligence), MEDIUM (archived)
    - Context: what is the referencing record? what decision does it affect?

Step 4: Quarantine
  - Records with > 30% broken references → flag as DEGRADED_INTEGRITY
  - Records with ANY CRITICAL broken reference → immediate T3 alert
  
Step 5: Report
  - Summary to memory/memory-integrity/reference-validation-report.yaml
  - Critical issues to executive-alert-system.md alert queue
  - Full report to T3+ weekly digest
```

---

## Validation Report Schema

```yaml
validation_report:
  sweep_id: SWEEP-{YYYYMMDD}
  started_at: ISO8601
  completed_at: ISO8601
  duration_seconds: number
  
  scope:
    files_scanned: number
    references_found: number
    unique_ids_checked: number
    
  results:
    VALID: number
    BROKEN: number
    UNKNOWN: number
    validity_rate: 0.00–1.00          # target: > 0.98
    
  broken_references:
    CRITICAL: [list of {file, line, id, severity, context}]
    HIGH: [list]
    MEDIUM: [list]
    
  quarantined_records:
    files: [list of {path, broken_pct, integrity_status}]
    
  trend:
    previous_validity_rate: 0.00–1.00
    delta: number                      # positive = improving
    
  health:
    band: HEALTHY | WATCH | DEGRADED | CRITICAL
    # HEALTHY: validity > 0.98; WATCH: 0.95–0.98; DEGRADED: 0.90–0.95; CRITICAL: < 0.90
```

---

## On-Demand Validation

Available for any subsystem that wants to validate before a critical operation:

```
validate_before_write(file_path, new_content) → {valid: bool, broken: [list]}
validate_subsystem(system_name) → validation_report
validate_id(id_value) → {exists: bool, authoritative_source: str, record: object}
```

Governance gates (WF-010 release governance, WF-006 AI feature delivery) automatically invoke `validate_subsystem` for affected memory areas before promoting to production.

---

## Health Targets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Overall validity rate | ≥ 0.98 | < 0.95 (T3 alert) |
| Zero CRITICAL broken references | 100% | Any CRITICAL → T3 immediate |
| Sweep completion | Weekly (Sunday) | Missed sweep → T3 alert |
| Quarantine rate | < 0.5% of files | > 1% → T4 review |
