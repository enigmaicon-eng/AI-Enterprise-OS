# Executive Intelligence Dashboard
**ID:** SI-EXEC-005 | **Tier:** T4 | **Class:** ELEVATED
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Real-time, role-aware executive intelligence console. Aggregates the full strategic intelligence picture into a single command view for T3–T5+ leaders. Provides drill-down from summary to underlying evidence, with direct action paths for all surfaced items.

---

## Dashboard Layout (ASCII)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  EXECUTIVE INTELLIGENCE DASHBOARD              2026-05-16 09:00 UTC  [LIVE]  ║
║  Role: T4 | Context: STRATEGIC | Refresh: 60s                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ PANEL 1: STRATEGIC HEALTH                                                     ║
║  Overall:  ████████░░  0.78  HEALTHY                                          ║
║  Market:   ████████░░  0.80  FAVORABLE     Execution: █████████░  0.85        ║
║  Competitive: ██████░░  0.65  WATCH        Governance: █████████░  0.90       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ PANEL 2: ACTIVE RADAR (P0–P1)                                                 ║
║  !! P0 THREAT  [CORE]       Patent filing in core domain                      ║
║                              Confidence:0.82 | Decision needed by: 2026-05-18 ║
║                              → War game WG-2026-004 IN PROGRESS               ║
║  >> P1 OPP    [ADJACENT]    Regulatory sandbox opens new market               ║
║                              Confidence:0.78 | Window: 18 months              ║
║                              → Scenario SCP-2026-009 ACTIVE                   ║
║  >> P1 THREAT [DEFENSIVE]   Compliance deadline 87 days                       ║
║                              Confidence:0.95 | WF-014 activated               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ PANEL 3: DECISIONS AWAITING ACTION                                            ║
║  DP-2026-042   Should we respond to competitive patent?     Deadline: Today   ║
║                IRREVERSIBLE | Confidence: 0.71 | Authority: T4               ║
║  DP-2026-039   Regulatory sandbox participation decision     Deadline: +7d    ║
║                REVERSIBLE_EXPENSIVE | Confidence: 0.78 | Authority: T4       ║
║  DP-2026-037   Q3 headcount reallocation                    Deadline: +14d   ║
║                REVERSIBLE | Confidence: 0.85 | Authority: T4                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ PANEL 4: SCENARIO PULSE                                                       ║
║  SCP-2026-004  Patent threat response      Leading: WLD-B (67%) ↑ from 45%   ║
║  SCP-2026-009  Regulatory sandbox          Leading: WLD-A (72%)  STABLE       ║
║  SCP-2026-012  Q4 headcount plan           Leading: WLD-C (51%)  ↓ from 60%   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ PANEL 5: INTELLIGENCE HIGHLIGHTS (LAST 7 DAYS)                               ║
║  UIU-0514-007  OPPORTUNITY  [MARKET]   Competitor weakening in SMB segment    ║
║                Confidence: 0.74 | Impact: HIGH | → OPT-2026-018 GENERATED    ║
║  UIU-0512-003  THREAT       [TALENT]   Competitor hiring our ML engineers     ║
║                Confidence: 0.68 | Impact: MEDIUM | → P1 radar                ║
║  UIU-0511-011  EMERGING     [TECH]     New AI model changes platform dynamics ║
║                Confidence: 0.63 | Impact: HIGH | → SCP-2026-013 PENDING       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ PANEL 6: EXECUTION TELEMETRY                                                  ║
║  DORA:  Deployment Freq: 4.2/wk  LT: 3.1d  CFR: 2.1%  MTTR: 42min          ║
║  Sprint Velocity: 87% (↑ from 82%)  Carry-over: 8% (target <10%)            ║
║  Gate pass rate: 94%   Constitutional compliance: 100%                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ PANEL 7: ALERTS QUEUE                                                         ║
║  3 P2 alerts pending acknowledgment  |  2 P3 alerts (grouped)                 ║
║  Last P0 alert: 2026-05-14 (acknowledged in 8 min)                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ QUICK ACTIONS:                                                                 ║
║  [1] Review DP-2026-042   [2] Briefing: patent threat   [3] War game summary  ║
║  [4] OKR alignment check  [5] Board package status      [6] Full radar view   ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Panel Definitions

| Panel | Content | Refresh | Data Sources |
|-------|---------|---------|-------------|
| 1: Strategic Health | Composite health score by dimension | 15 min | All intelligence systems |
| 2: Active Radar | P0/P1 radar items with status | 5 min | opportunity-threat-radar.md |
| 3: Decisions Queue | Pending decisions with deadlines | Real-time | executive-decision-engine.md |
| 4: Scenario Pulse | Active scenarios with world probability | 15 min | scenario-planning-engine.md |
| 5: Intelligence Highlights | Top UIUs from last 7 days | 24 hr | intelligence-fusion-layer.md |
| 6: Execution Telemetry | DORA + quality metrics | 5 min | Digital twins + telemetry hubs |
| 7: Alert Queue | Unacknowledged alerts | Real-time | executive-alert-system.md |

---

## Role-Based Views

| Role | Visible Panels | Data Depth | Alert Types |
|------|---------------|------------|------------|
| T2 (Domain) | 6 only (domain-filtered) | Aggregate | P3 domain-relevant only |
| T3 (Senior) | 1, 2 (filtered), 4, 5, 6, 7 | Domain detail | P2+ |
| T4 (Director) | All panels | Full | P1+ |
| T5 (Executive) | All + board track | Full + board | P0+ immediate |
| Board | Board package view | High-level | Strategic only |

---

## Strategic Health Score

```
strategic_health = (
  market_health × 0.20 +
  competitive_health × 0.20 +
  execution_health × 0.25 +
  governance_health × 0.20 +
  org_health × 0.15
)

Thresholds:
  0.85+  THRIVING     — no required action
  0.70–0.84  HEALTHY  — routine monitoring
  0.55–0.69  WATCH    — enhanced attention; T3 weekly review
  0.40–0.54  DEGRADED — T4 intervention plan required
  < 0.40     CRITICAL — T5 emergency protocol
```

Hard-cap penalties:
- Any P0 THREAT with no active scenario: -0.15
- Any CONSTITUTIONAL_BREACH: -0.30 (caps score at 0.70 maximum)
- Approval SLA breach CRITICAL: -0.10

---

## Governance

**Access:** T3 minimum; T4 for action paths
**Data classification:** Dashboard state = CONFIDENTIAL
**Audit:** All viewed items and action path activations logged
