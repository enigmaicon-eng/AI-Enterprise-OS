# Local Development Environment
**ID:** DEV-LOCAL-001 | **Tier:** T2 | **Class:** STANDARD
**Owner:** Engineering Org | **Updated:** 2026-05-16

---

## Purpose

Provides a containerized, reproducible local environment that mirrors the production Enterprise AI OS. Developers can run the full OS stack locally — including agents, workflows, event bus, governance, and security systems — without touching production data or incurring production costs. Enables rapid iteration with full system fidelity.

---

## Stack Architecture

```
local-dev/
  docker-compose.yml          ← full OS stack definition
  .env.local                  ← local overrides (never committed)
  .env.example                ← template (committed, no secrets)
  
  services:
    orchestrator              ← master orchestrator (single instance, no HA)
    event-bus                 ← 4 partitions (vs. 16 in prod)
    agent-runtime             ← runs any agent by name
    governance-quorum         ← all 3 validators (same process, isolated threads)
    semantic-firewall         ← full production rules, local model
    nonce-registry            ← in-memory, no checkpoint
    memory-store              ← SQLite-backed (vs. JSONL in prod)
    digital-twin-sim          ← single twin, synthetic data
    
  dev-tools:
    workflow-debugger         ← step-through workflow execution
    agent-inspector           ← observe agent reasoning traces
    event-bus-monitor         ← live event stream viewer
    governance-trace          ← trace constitutional decisions
    chaos-injector            ← inject failures locally (no T4 needed)
```

---

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env.local
# Edit .env.local: set ANTHROPIC_API_KEY and LOCAL_MODE=true

# 2. Start the stack
docker compose up -d

# 3. Verify health
docker compose exec orchestrator health-check

# 4. Run a workflow
docker compose exec orchestrator run-workflow WF-001 --debug

# 5. Inspect agent reasoning
docker compose exec agent-inspector watch --agent=agent-pm-001

# 6. Stop
docker compose down
```

---

## Local vs. Production Differences

| Component | Production | Local Dev | Notes |
|-----------|-----------|-----------|-------|
| Orchestrator | Active-passive HA | Single instance | No failover in local |
| Event bus | 16 partitions | 4 partitions | Sufficient for dev throughput |
| JSONL storage | Segmented files + rotation | SQLite | Same API; different backend |
| Hash chains | Ed25519 signed | HMAC-SHA256 local key | Not for audit use |
| Governance quorum | 3 separate processes | 3 threads in 1 process | Logic identical |
| Connector auth | Real OAuth tokens | Mock connector responses | See mock-connectors/ |
| AI model | claude-sonnet-4-6 | claude-haiku-4-5 (cheaper) | Override in .env.local |
| Constitutional AI | Full 12 principles | Full 12 principles | Never reduced locally |
| Security scanning | Real-time | On-demand only | Run: make security-scan |

**Constitutional AI is never weakened in local dev.** The same 12 principles apply. This ensures developers test against production governance constraints.

---

## Mock Connectors

All 33 production connectors have local mock implementations:

```
mock-connectors/
  jira-mock.yaml          ← returns synthetic Jira issues/projects
  github-mock.yaml        ← returns synthetic PRs, issues, commits
  slack-mock.yaml         ← logs messages to local file (no real Slack)
  salesforce-mock.yaml    ← synthetic CRM data
  ...                     ← all 33 connectors mocked
  
Mock connector configuration:
  - Deterministic responses keyed by request pattern
  - Configurable latency (default: 50ms, simulate: 2000ms for slow tests)
  - Configurable failure rate (default: 0, simulate: 0.10 for chaos tests)
  - All mock data is synthetic — no PII, no real customer data
```

---

## Development Workflow

### Implementing a New Agent

```
1. Define agent in agents/ directory (copy template from templates/agent-template.md)
2. Register in agents/MASTER-REGISTRY.md (local: no approval needed; production: T3)
3. Start agent in local runtime:
   docker compose exec agent-runtime start-agent --file=agents/my-agent.md
4. Test with workflow runner:
   docker compose exec orchestrator run-workflow WF-001 --agent-override=my-agent
5. Inspect with agent-inspector:
   docker compose exec agent-inspector trace --agent=my-agent --last=10
```

### Testing a Workflow Change

```
1. Edit workflow YAML in workflows/ or enterprise-workflows/
2. Validate schema:
   make validate-workflow WF=WF-005
3. Run in debug mode (step-through):
   docker compose exec workflow-debugger step WF-005
4. Run full execution:
   docker compose exec orchestrator run-workflow WF-005 --mode=test
5. Check governance decisions:
   docker compose exec governance-trace show --workflow=WF-005 --last-run
```

### Injecting Local Chaos

```
# Kill the orchestrator and watch failover (no T4 needed locally)
docker compose exec chaos-injector kill orchestrator --duration=60s

# Partition event bus topic
docker compose exec chaos-injector partition event-bus --topic=workflow.completed

# Simulate agent clock drift
docker compose exec chaos-injector drift-clock --agent=agent-pm-001 --seconds=90

# Corrupt a JSONL segment
docker compose exec chaos-injector corrupt-segment --file=execution-ledger
```

---

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...           # your personal dev key (never prod key)
LOCAL_MODE=true                         # enables mock connectors, SQLite backend

# Optional overrides
LOCAL_MODEL=claude-haiku-4-5           # cheaper model for dev (default)
DISABLE_RATE_LIMIT=false               # never disable in AI security testing
LOG_LEVEL=DEBUG                        # INFO in prod
MOCK_CONNECTOR_LATENCY_MS=50           # simulate connector latency
CHAOS_FAILURE_RATE=0.0                 # set to 0.1 for resilience testing
GOVERNANCE_TRACE=true                  # verbose governance decision logging
```

---

## CI Integration

The local dev stack mirrors the CI environment used in automated pipelines:

```yaml
# .github/workflows equivalent — runs on every PR
ci_checks:
  - schema_validation: validate all YAML/JSONL schemas
  - workflow_validation: all workflows DAG-valid, no cycles
  - constitutional_check: all agent definitions comply with 12 principles
  - security_scan: static analysis on all new dependencies
  - chaos_subset: run CHAOS-A-001, CHAOS-B-001, CHAOS-D-001 (< 5 minutes)
  - integration_test: WF-001, WF-005, WF-010 full execution with mocks
```

---

## Governance

**Data:** Never use production data locally; synthetic data only
**Secrets:** .env.local is gitignored; never commit API keys
**Model costs:** Dev model (haiku) costs ~10× less than prod (sonnet)
**Constitutional AI:** Always enforced; cannot be disabled locally
**Documentation:** Keep mock-connectors/ in sync with integrations/ as connectors are added
