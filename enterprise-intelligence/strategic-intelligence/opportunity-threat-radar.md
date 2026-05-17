# Opportunity and Threat Radar
**ID:** SI-CORE-003 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Classifies, ranks, and tracks all strategic opportunities and threats. Maintains the live enterprise radar — a continuously updated catalog of what the organization must respond to, prioritized by urgency, magnitude, and confidence. Routes high-priority items to scenario planning and executive alerts.

---

## Radar Schema

```yaml
radar_item:
  radar_id: RAD-{YYYYMMDD}-{seq}
  uiu_ref: UIU-*                        # source unified intelligence unit
  type: OPPORTUNITY | THREAT
  radar_zone: CORE | ADJACENT | TRANSFORMATIVE | DEFENSIVE
  title: string                          # 60-char max
  description: string                    # 300-char max
  
  # Scoring dimensions
  confidence: 0.00–1.00
  urgency_score: 0.00–1.00              # 1.0 = action required this week
  magnitude_score: 0.00–1.00            # 1.0 = existential / transformative
  readiness_score: 0.00–1.00            # org's ability to respond right now
  
  # Composite priority
  priority_score: urgency×0.40 + magnitude×0.40 + confidence×0.20
  priority_tier: P0 | P1 | P2 | P3 | P4
  
  # Status tracking
  status: NEW | ACKNOWLEDGED | ACTIVE | SCENARIO_IN_PROGRESS | DECISION_PENDING | RESPONDED | CLOSED | MISSED
  first_detected: ISO8601
  acknowledged_at: ISO8601 | null
  response_deadline: ISO8601 | null      # null if LONG_TERM
  assigned_to: agent_id | null
  
  # Outcome tracking (filled post-resolution)
  outcome: CAPITALIZED | MITIGATED | MISSED | NEUTRALIZED | MOOT
  outcome_notes: string | null
  forecast_accuracy: 0.00–1.00 | null
```

---

## Priority Tier Definitions

| Tier | Priority Score | Urgency | SLA | Escalation |
|------|---------------|---------|-----|-----------|
| P0 | ≥ 0.85 | IMMEDIATE | 24 hours | T4 mandatory, T5 notification |
| P1 | 0.70–0.84 | THIS_QUARTER | 72 hours | T3 mandatory |
| P2 | 0.55–0.69 | THIS_QUARTER | 1 week | T3 review |
| P3 | 0.40–0.54 | THIS_YEAR | Monthly review | T2 monitoring |
| P4 | < 0.40 | LONG_TERM | Quarterly review | Watch list |

---

## Radar Zone Definitions

| Zone | Description | Examples |
|------|-------------|---------|
| CORE | Directly threatens/enhances primary business | Core product competitor enters market |
| ADJACENT | Affects complementary capabilities | Platform partner pivot changes integration landscape |
| TRANSFORMATIVE | Could redefine the industry/OS | New AI model paradigm requires OS architecture update |
| DEFENSIVE | Requires protection of existing position | Regulatory change mandating new compliance controls |

---

## Classification Rules

### Opportunity Detection
Signals classified as OPPORTUNITY when:
- Market expansion signal with confidence > 0.60 and timing < 18 months
- Competitive weakness signal in core domain
- Technology advancement enabling new capability with magnitude ≥ MEDIUM
- Regulatory change creating competitive moat opportunity
- Talent availability in critical skill gap domain

### Threat Detection
Signals classified as THREAT when:
- Competitor move targeting core product market
- Regulatory deadline within 12 months with no plan on file
- Technical debt risk score > 0.75 in critical subsystem
- Key talent concentration (bus_factor = 1) in critical area
- Customer health score degrading trend > 3 sprints
- OKR miss probability > 0.65 in current quarter

---

## Routing Logic

```
P0 threat or opportunity:
  → immediate alert to executive-intelligence/executive-alert-system.md
  → scenario-planning/scenario-planning-engine.md (EXPEDITED mode)
  → T4 assignment within 4 hours

P1:
  → next executive package inclusion (guaranteed)
  → scenario-planning/war-gaming-coordinator.md (STANDARD mode)
  → T3 assignment within 24 hours

P2:
  → weekly executive package
  → scenario-planning/scenario-library.md check (existing scenario covers?)
  → T3 watch assignment

P3/P4:
  → monthly watch list review
  → auto-monitor via strategic-drift-detector.md
```

---

## Missed Opportunity Protocol

When a radar item with outcome = MISSED is closed:
1. Automatic postmortem written to `memory/strategic-intelligence/missed-opportunities.yaml`
2. Route to `recursive-self-improvement/core/analysis-engine.md` for pattern detection
3. Update signal detection thresholds if pattern = systematic miss
4. Escalate to T4 if 3+ misses in same domain in rolling 90 days

**Principle:** The system should learn from every missed opportunity. The cost of missed intelligence is greater than the cost of false positives.

---

## Live Radar Dashboard (ASCII)

```
┌─────────────────────────────────────────────────────────────────┐
│  STRATEGIC RADAR  [LIVE]           2026-05-16 06:00 UTC          │
├─────────────────────────────────────────────────────────────────┤
│  P0 ITEMS: 1 | P1: 4 | P2: 11 | P3: 23 | P4: 47               │
├───────────────────────────────────────────────────────────────── │
│  !! P0 THREAT  [CORE]    Competitor patent filing in core domain  │
│                          Confidence:0.82 | Urgency:0.91           │
│                          → Scenario SCP-2026-004 ACTIVE           │
├──────────────────────────────────────────────────────────────── │
│  >> P1 OPP    [ADJACENT] Regulatory sandbox program announced     │
│                          Confidence:0.78 | Magnitude:0.80         │
│                          → War game WG-2026-007 SCHEDULED         │
│  >> P1 THREAT [DEFENSIVE] Key compliance deadline 90 days         │
│                          Confidence:0.95 | Urgency:0.88           │
│                          → WF-014 compliance-review ACTIVATED      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Governance

**Audit:** All radar items logged to `memory/strategic-intelligence/radar-log.jsonl` (append-only)
**Calibration:** Monthly accuracy review against closed item outcomes
**Constitutional binding:** C-001 — all responses to P0/P1 items require human decision
