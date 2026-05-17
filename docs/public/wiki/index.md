# Enterprise AI OS — Organizational Wiki

The living knowledge base for all product, engineering, and operational decisions. Updated continuously by agents and humans.

**Purpose:** Preserve organizational memory · Synthesize knowledge · Enable agent collaboration through artifacts · Maintain cross-project continuity

**Last updated:** 2026-05-14

---

## Navigation

### Architecture
- [`architecture/overview.md`](architecture/overview.md) — System architecture overview
- [`architecture/agent-topology.md`](architecture/agent-topology.md) — Agent network and interaction model
- [`architecture/decisions/`](architecture/decisions/) — All Architecture Decision Records (ADRs)
- [`architecture/data-models/`](architecture/data-models/) — Data model documentation

### Systems
- [`systems/digital-twin-system.md`](systems/digital-twin-system.md) — Enterprise digital twin system: architecture, concepts, key models
- [`systems/simulation-guide.md`](systems/simulation-guide.md) — How to request and interpret simulations
- [`systems/prediction-response-guide.md`](systems/prediction-response-guide.md) — How to read and act on prediction alerts
- [`systems/digital-twin-operations.md`](systems/digital-twin-operations.md) — Twin health monitoring, diagnostics, maintenance

### Strategy & Product
- [`strategy/vision.md`](strategy/vision.md) — Product vision and strategic bets
- [`strategy/roadmap.md`](strategy/roadmap.md) — Current roadmap
- [`strategy/positioning.md`](strategy/positioning.md) — Product positioning
- [`market/competitive.md`](market/competitive.md) — Competitive landscape

### Research
- [`research/`](research/) — User research syntheses and findings

### Design System
- [`design-system/overview.md`](design-system/overview.md) — Design system documentation
- [`design-system/tokens.md`](design-system/tokens.md) — Design tokens reference
- [`design-system/components/`](design-system/components/) — Component specifications

### Processes
- [`processes/feature-development.md`](processes/feature-development.md) — How we develop features
- [`processes/release-process.md`](processes/release-process.md) — How we release
- [`processes/incident-response.md`](processes/incident-response.md) — How we handle incidents
- [`processes/sprint-cycle.md`](processes/sprint-cycle.md) — Sprint cadence

### Runbooks
- [`runbooks/`](runbooks/) — Operational runbooks for all systems

### Incidents
- [`incidents/`](incidents/) — Incident post-mortems

### Decisions
- [`decisions/`](decisions/) — Key product and organizational decisions

### Onboarding
- [`onboarding/new-engineer.md`](onboarding/new-engineer.md) — Engineering onboarding
- [`onboarding/new-pm.md`](onboarding/new-pm.md) — PM onboarding
- [`onboarding/agent-ops.md`](onboarding/agent-ops.md) — AI agent operation guide

---

## Recently Updated

| Page | Updated | By | Summary |
|------|---------|-----|---------|
| `systems/digital-twin-system.md` | 2026-05-14 | ai-native-org | Enterprise digital twin system — full architecture, concepts, models |
| `systems/simulation-guide.md` | 2026-05-14 | ai-native-org | How to request, configure, and interpret simulations |
| `systems/prediction-response-guide.md` | 2026-05-14 | ai-native-org | Prediction alert response playbooks by class |
| `systems/digital-twin-operations.md` | 2026-05-14 | ai-native-org | Twin health monitoring, diagnostics, and operations |
| `architecture/agent-topology.md` | 2026-05-14 | architect-agent | Added digital twin topology, two interaction models, cross-layer communication |
| `architecture/overview.md` | 2026-05-14 | architect-agent | Updated with digital twin layer, continuation architecture, v5.0.0 |
| `wiki/index.md` | 2026-05-14 | orchestrator | Added Systems section for digital twin wiki |

---

## Wiki Standards

### When to Write
- After every significant decision → `decisions/`
- After every incident → `incidents/`
- After architecture decisions → `architecture/decisions/` (as ADR)
- After research completion → `research/`
- When a process changes → `processes/`

### How to Write
- Use a template where one exists (`templates/`)
- Write for a future reader with no current context
- Link to artifacts instead of duplicating content
- Date every page in frontmatter
- Mark outdated pages (`status: outdated`) rather than deleting

### Maintenance Rules
All agents are responsible for wiki freshness:
- Outdated information → update or mark outdated
- Missing page that would help future work → create it
- Duplicate information → consolidate with links

Full maintenance workflow: `workflows/wiki-maintenance.md`
