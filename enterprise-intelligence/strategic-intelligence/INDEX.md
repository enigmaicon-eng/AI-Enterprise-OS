# Strategic Intelligence System — Index
**System:** Enterprise Strategic Intelligence and Decision Support (v27.0.0)
**Updated:** 2026-05-16

---

## Entry Points

| Intent | Start Here |
|--------|-----------|
| Understand strategic situation | `strategic-intelligence-engine.md` |
| Check competitive landscape | `competitive-intelligence-hub.md` |
| View latest market signals | `market-signal-processor.md` |
| See opportunity/threat radar | `opportunity-threat-radar.md` |
| Run a scenario | `scenario-planning/scenario-planning-engine.md` |
| Run a war game | `scenario-planning/war-gaming-coordinator.md` |
| Generate strategic options | `scenario-planning/strategic-options-generator.md` |
| Package a decision for executives | `executive-intelligence/executive-decision-engine.md` |
| Check OKR health | `strategic-alignment/okr-intelligence-engine.md` |
| Check portfolio alignment | `strategic-alignment/portfolio-strategy-alignment.md` |
| View executive dashboard | `executive-intelligence/executive-intelligence-dashboard.md` |
| View alignment console | `strategic-alignment/alignment-console.md` |

---

## System Map

```
STRATEGIC INTELLIGENCE CORE
├── strategic-intelligence/strategic-intelligence-engine.md   ← SI-CORE-001 | Master coordinator
├── strategic-intelligence/intelligence-fusion-layer.md       ← SI-CORE-002 | Cross-source synthesis
├── strategic-intelligence/opportunity-threat-radar.md        ← SI-CORE-003 | P0–P4 radar
├── strategic-intelligence/competitive-intelligence-hub.md    ← SI-CORE-004 | Competitor registry
└── strategic-intelligence/market-signal-processor.md        ← SI-CORE-005 | Market signal normalization

SCENARIO PLANNING
├── scenario-planning/scenario-planning-engine.md             ← SI-SCEN-001 | Scenario creation + tracking
├── scenario-planning/war-gaming-coordinator.md               ← SI-SCEN-002 | Adversarial simulation
├── scenario-planning/strategic-options-generator.md          ← SI-SCEN-003 | Options with investment cases
├── scenario-planning/outcome-probability-modeler.md          ← SI-SCEN-004 | Bayesian probability forecasting
└── scenario-planning/scenario-library.md                    ← SI-SCEN-005 | Curated template library

EXECUTIVE INTELLIGENCE
├── executive-intelligence/executive-decision-engine.md       ← SI-EXEC-001 | Decision packaging
├── executive-intelligence/board-intelligence-system.md       ← SI-EXEC-002 | Board-ready packages
├── executive-intelligence/executive-alert-system.md          ← SI-EXEC-003 | Real-time strategic alerts
├── executive-intelligence/strategic-decision-archive.md      ← SI-EXEC-004 | Immutable decision record
└── executive-intelligence/executive-intelligence-dashboard.md ← SI-EXEC-005 | Executive command view

STRATEGIC ALIGNMENT
├── strategic-alignment/okr-intelligence-engine.md            ← SI-ALIGN-001 | OKR probability + drift
├── strategic-alignment/portfolio-strategy-alignment.md       ← SI-ALIGN-002 | Initiative alignment scoring
├── strategic-alignment/strategic-drift-detector.md           ← SI-ALIGN-003 | Drift detection + taxonomy
├── strategic-alignment/strategy-coherence-validator.md       ← SI-ALIGN-004 | Internal consistency checks
└── strategic-alignment/alignment-console.md                 ← SI-ALIGN-005 | Alignment operations console
```

---

## Key Metrics

| Metric | Target | Source |
|--------|--------|--------|
| P0 radar to scenario: time | < 4 hours | scenario-planning-engine.md |
| Signal to UIU: fusion latency | < 24 hours | intelligence-fusion-layer.md |
| Decision package SLA: T4_URGENT | < 72 hours | executive-decision-engine.md |
| Forecast calibration ECE | < 0.08 | outcome-probability-modeler.md |
| Strategic coherence score | ≥ 0.70 | strategy-coherence-validator.md |
| OKR coverage rate | ≥ 0.85 | okr-intelligence-engine.md |
| Zombie initiative rate | < 5% | portfolio-strategy-alignment.md |
| Missed opportunity rate | < 10% | opportunity-threat-radar.md |
