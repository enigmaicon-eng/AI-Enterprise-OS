# Enterprise AI Operating System

**Version:** 50.0.0
**Initialized:** 2026-05-08
**Last Updated:** 2026-05-17
**Model:** claude-sonnet-4-6

---

## What This Is

A fully-integrated, multi-agent AI operating system that coordinates product management, architecture, engineering, QA, UX, analytics, and delivery operations. Built for FAANG-grade execution with minimal manual prompting.

**Core promise:** You describe the work. The OS routes it to the right agents, enforces quality gates, produces artifacts, and preserves all decisions — automatically.

---

## Quick Start

| Intent | What to Say |
|--------|------------|
| Build a new feature | "I want to build [feature description]" |
| Validate a bet before building | "Should we build [X]? Let's do discovery first" |
| Make a technical decision | "We need to decide [technical decision]" |
| Ship a release | "Let's release [feature] to production" |
| Respond to an incident | "!incident [description]" |
| Plan a sprint | "Let's plan sprint [N]" |
| Review architecture | "Let's review the architecture for [system]" |
| Run a security review | "Security review for [system/feature]" |

---

## System Map

```
ORCHESTRATION
├── orchestrator/master-orchestrator.md    ← Start here for any task
├── orchestrator/agent-registry.md         ← All available agents
├── orchestrator/routing-rules.md          ← Intent → agent routing
├── orchestrator/execution-engine.md       ← Workflow execution protocol
├── orchestrator/context-manager.md        ← Context lifecycle
└── orchestrator/supervisor.md             ← Quality control agent

AGENTS (144 agents across 17 organizations — v3.0.0)  [OS v27.0.0]
├── agents/MASTER-REGISTRY.md                      ← Authoritative catalog of all 144 agents
├── agents/COLLABORATION-CONTRACTS.md              ← Cross-org collaboration contracts (10 tiers)
├── agents/ROUTING-TABLE.md                        ← Complete routing key → agent mapping (100+ keys)
├── agents/executive/executive-org.md              ← 10 agents: CPO, CTO, CAIO, VPs, Councils (T4-T5)
├── agents/product/product-org.md                  ← 21 agents: Full PM organization (T2)
├── agents/business-analysis/business-analysis-org.md ← 8 agents: BA org (T2)
├── agents/strategy/strategy-org.md                ← 8 agents: Strategy org (T2)
├── agents/architecture/architecture-org.md        ← 10 agents: Architecture org (T2-T3)
├── agents/engineering/engineering-org.md          ← 11 agents: Engineering org (T1-T2)
├── agents/qa/qa-org.md                            ← 7 agents: QA org (T2-T3)
├── agents/ux/ux-org.md                            ← 6 agents: UX org (T2)
├── agents/delivery/delivery-org.md                ← 6 agents: Delivery org (T2-T3)
├── agents/analytics/analytics-org.md              ← 6 agents: Analytics org (T2)
├── agents/customer/customer-org.md                ← 4 agents: Customer org (T2)
├── agents/governance/governance-org.md            ← 7 agents: Governance org (T3-T4)
├── agents/ai-native/ai-native-org.md              ← 11 agents: AI-Native org / OS backbone (T3)
├── agents/runtime/runtime-org.md                  ← 7 agents: Runtime org (T2)
├── agents/meta-org/meta-org.md                    ← 6 agents: Meta-Organization / OS evolution (T4)
├── agents/connectors/connector-mcp-org.md         ← 7 agents: Connector + MCP org (T2-T3)
└── agents/artifacts/artifact-execution-org.md     ← 9 agents: Artifact Execution org (T2)

Legacy single-agent files (v1.0.0 — superseded by org files above):
├── agents/pm-agent.md
├── agents/architect-agent.md
├── agents/engineer-agent.md
└── [other v1 agent files]

WORKFLOWS
├── workflows/feature-development.md      ← End-to-end feature delivery
├── workflows/discovery.md                ← Problem validation
├── workflows/architecture-review.md      ← ADR/RFC process
├── workflows/sprint-planning.md          ← Sprint cycle
├── workflows/release-workflow.md         ← Production deployment
├── workflows/incident-response.md        ← Incident handling
└── workflows/wiki-maintenance.md         ← Knowledge maintenance

TEMPLATES
├── templates/prd-template.md             ← Product Requirements Document
├── templates/adr-template.md             ← Architecture Decision Record
├── templates/rfc-template.md             ← Request for Comments
├── templates/sprint-template.md          ← Sprint plan
├── templates/retro-template.md           ← Retrospective
├── templates/incident-template.md        ← Incident report
├── templates/handoff-template.md         ← Agent handoff
├── templates/release-template.md         ← Release plan
├── templates/threat-model-template.md    ← Security threat model
├── templates/test-plan-template.md       ← QA test plan
├── templates/metrics-template.md         ← Analytics framework
└── templates/runbook-template.md         ← Operational runbook

GOVERNANCE
├── docs/governance/principles.md         ← Five immutable principles
├── docs/governance/quality-gates.md      ← All gate definitions
└── docs/governance/security-policy.md    ← Security standards

HANDOFFS
└── handoffs/handoff-protocol.md          ← Universal handoff standard

KNOWLEDGE
├── wiki/index.md                         ← Organizational wiki
├── wiki/architecture/overview.md         ← System architecture
├── wiki/architecture/agent-topology.md   ← Agent interaction model
├── wiki/onboarding/agent-ops.md          ← Operations guide
└── wiki/intelligence/                    ← Intelligence package output (auto-created by research system)

RESEARCH INTELLIGENCE SYSTEM (v1.0.0)
├── research-intelligence/INDEX.md                              ← System index + quick start
├── research-intelligence/orchestrator.md                       ← Master research coordinator
├── research-intelligence/discovery-agent.md                    ← Autonomous iterative research agent
├── research-intelligence/pm-intelligence.md                    ← PM discovery intelligence
├── research-intelligence/competitive-intelligence.md           ← Competitive monitoring + analysis
├── research-intelligence/market-intelligence.md                ← Market sizing + trend intelligence
├── research-intelligence/architecture-intelligence.md          ← Technical + architecture research
├── research-intelligence/organizational-intelligence.md        ← Internal capability + knowledge gaps
├── synthesis-systems/evidence-synthesizer.md                   ← Evidence → unified claims
├── synthesis-systems/contradiction-reconciler.md               ← Contradiction classification + resolution
├── synthesis-systems/insight-extractor.md                      ← Non-obvious pattern extraction
├── synthesis-systems/strategic-synthesis.md                    ← Insights → strategic options + recommendation
├── synthesis-systems/research-memory-synthesizer.md            ← Investigation → persistent memory
├── investigative-workflows/multi-stage-investigation.md        ← Cross-domain high-stakes investigation
├── investigative-workflows/deep-dive-workflow.md               ← Single-question exhaustive investigation
├── investigative-workflows/competitive-analysis-workflow.md    ← Competitive intelligence workflow
├── investigative-workflows/market-research-workflow.md         ← Market intelligence workflow
├── investigative-workflows/technical-investigation-workflow.md ← Architecture research workflow
├── evidence-systems/evidence-gatherer.md                       ← Primary evidence collection engine
├── evidence-systems/evidence-tracker.md                        ← Append-only JSONL evidence store
├── evidence-systems/source-validator.md                        ← Source credibility assessment
├── evidence-systems/confidence-scorer.md                       ← Multi-factor confidence scoring
├── evidence-systems/contextual-researcher.md                   ← Domain context layer agent
├── intelligence-pipelines/pipeline-registry.md                 ← Pipeline discovery + routing
├── intelligence-pipelines/evidence-pipeline.md                 ← Evidence processing pipeline
├── intelligence-pipelines/synthesis-pipeline.md                ← Synthesis orchestration pipeline
├── intelligence-pipelines/reporting-pipeline.md                ← Intelligence package assembly
├── intelligence-pipelines/escalation-pipeline.md               ← Evidence gap + confidence gate
├── intelligence-memory/memory-index.md                         ← Master memory index (always loaded)
├── intelligence-memory/evidence-retention.md                   ← Retention policy + lifecycle
├── intelligence-memory/source-lineage.md                       ← Full claim-to-source traceability
├── intelligence-memory/investigation-continuity.md             ← Cross-session investigation state
└── intelligence-memory/research-graph.md                       ← Investigation + claim + source graph

AUTONOMOUS CONTINUATION SYSTEM (v1.0.0)
├── continuation-systems/continuation-engine.md          ← Master lifecycle: state capture → discovery → triage → resumption
├── continuation-systems/workflow-continuator.md         ← 6-step resumption with continuation framing
├── continuation-systems/context-restorer.md             ← 6-layer context restoration with budget allocation
├── continuation-systems/organizational-continuity.md    ← 5-dimension org state across sessions
├── continuation-systems/execution-registry.md           ← Canonical registry of all active workflows
├── continuation-systems/deterministic-executor.md       ← 13-step idempotent execution protocol
├── continuation-systems/session-bridger.md              ← Bridge package for cross-session continuity
├── recovery-systems/failure-detector.md                 ← F1–F9 failure class detection + routing
├── recovery-systems/workflow-restorer.md                ← 6-case restoration (suspended, blocked, gate-fail)
├── recovery-systems/state-reconstructor.md              ← 7-phase artifact-evidence reconstruction
├── recovery-systems/orchestration-resumption.md         ← Orchestrator-level state restoration
├── recovery-systems/rollback-engine.md                  ← Controlled rollback to last stable state
├── execution-persistence/execution-store.md             ← 11 JSONL files: canonical persistence layer
├── execution-persistence/execution-ledger.md            ← Append-only chronological event log
├── execution-persistence/execution-memory.md            ← Settled decisions + constraints + rejected approaches
├── execution-persistence/artifact-registry.md           ← All artifacts: existence, state, checksums, lineage
├── execution-persistence/work-queue.md                  ← Persistent priority work queue
├── workflow-checkpoints/checkpoint-engine.md            ← Checkpoint creation, validation, retention
├── workflow-checkpoints/phase-snapshots.md              ← Phase-boundary gold-standard snapshots
├── workflow-checkpoints/runtime-snapshots.md            ← Mid-step lightweight snapshots
├── workflow-checkpoints/checkpoint-registry.md          ← Searchable index of all checkpoints
├── workflow-checkpoints/recovery-states.md              ← RS-01 through RS-09 recovery state taxonomy
├── runtime-recovery/recovery-orchestrator.md            ← Master recovery coordinator + triage
├── runtime-recovery/cold-start-recovery.md              ← Full reconstruction from ledger + artifacts
├── runtime-recovery/warm-resume.md                      ← Fast resumption from recent valid checkpoint
├── runtime-recovery/handoff-recovery.md                 ← Agent-to-agent handoff failure recovery
└── runtime-recovery/interruption-recovery.md            ← Mid-step resumption with tool-call deduplication

PERSISTENCE STORE (initialized — append-only)
├── memory/execution-ledger.jsonl                        ← Global execution event log (ground truth)
├── memory/work-queue.yaml                               ← Global work queue state
├── memory/execution-registry.yaml                       ← Active workflow registry
├── memory/checkpoint-registry.yaml                      ← Checkpoint fast-lookup index
├── memory/artifact-index.yaml                           ← Artifact fast-lookup index
├── memory/execution-store/workflow-states.jsonl         ← Workflow state transitions
├── memory/execution-store/step-states.jsonl             ← Step state transitions
├── memory/execution-store/artifact-registry.jsonl       ← Full artifact records
├── memory/execution-store/decision-log.jsonl            ← All decisions, all workflows
├── memory/execution-store/gate-verdicts.jsonl           ← All gate check results
├── memory/execution-store/agent-invocations.jsonl       ← Every agent invocation record
├── memory/execution-store/checkpoint-index.jsonl        ← Checkpoint registry (JSONL source)
├── memory/execution-store/session-manifest.jsonl        ← Session contribution records
├── memory/execution-store/delegation-log.jsonl          ← Agent delegation records
├── memory/execution-store/escalation-log.jsonl          ← Escalation records
├── memory/execution-store/rollback-log.jsonl            ← Rollback event records
└── memory/execution-store/work-queue-log.jsonl          ← Work queue audit trail

MEMORY
├── memory/README.md                      ← Memory system docs
├── memory/MEMORY_INDEX.md                ← Memory entry index
├── memory/organizational/               ← Org-wide context
├── memory/patterns/                     ← Validated patterns
├── memory/failures/                     ← Failure modes
├── memory/workflow-state/               ← Active workflow states
├── memory/session-bridge/               ← Cross-session bridge packages
├── memory/execution-memory/             ← Per-workflow settled decisions + constraints
├── memory/checkpoints/                  ← Checkpoint snapshots (organized by workflow-id)
├── memory/rollback-archive/             ← Archived rolled-back artifacts (never deleted)
├── memory/recovery/                     ← Recovery coordinator state files
└── memory/digital-twins/               ← Digital twin state, simulations, forecasts, predictions

ARCHITECTURE
├── architecture/decisions/README.md                    ← ADR index
├── architecture/decisions/ADR-001-enterprise-ai-os-architecture.md ← Foundational OS ADR
├── architecture/strategic-gap-analysis.md              ← 47-gap analysis (9 critical, 16 high, 14 med)
├── architecture/future-state-enterprise-architecture.md← 7-layer target architecture + north star
├── architecture/enterprise-maturity-model.md           ← 12-dimension maturity model (current: 3.6/5)
├── architecture/organizational-evolution-roadmap.md    ← 4-phase org evolution (Phase 0 complete)
├── architecture/runtime-evolution-roadmap.md           ← RT-0→RT-4 technical execution roadmap
├── architecture/final-architecture-review.md           ← v27 authoritative review; 23 critical/41 high findings; maturity 3.6/5
├── architecture/enterprise-readiness-report.md         ← Production readiness verdict; gap registry; 7 redesign directives; clearance conditions
├── architecture/long-term-evolution-roadmap.md         ← 3-year roadmap v27→v40; Foundation/Intelligence/Autonomy eras; milestones
├── architecture/next-decade-roadmap.md                 ← 10-year vision 2026–2036; 6 phases; bounded superintelligence north star
├── architecture/health-score-schema.md                 ← Canonical health score schema (ARCH-HS-001); 4 dimensions; standard weight profiles (v28)
└── architecture/context-window-protocol.md             ← Context Window Protocol (ARCH-CWP-001); HandoffPacket schema (≤2,000 tokens) (v30)

V28–V41 PRODUCTION HARDENING + INTELLIGENCE + AUTONOMY SYSTEMS
├── disaster-recovery/dr-plan.md                        ← D1–D5 disaster classes; RPO 1hr / RTO 4hr (v28)
├── disaster-recovery/backup-protocol.md                ← AES-256-GCM; daily integrity sampling (v28)
├── disaster-recovery/recovery-runbook.md               ← Bootstrap A1–A3; warm resume B1–B3; snapshot C1–C3 (v28)
├── orchestrator/orchestrator-ha.md                     ← Active-passive HA; Raft election; failover < 45s (v28)
├── security/credential-lifecycle-manager.md            ← TTL policy (90d API keys); emergency rotation < 15min (v28)
├── governance/constitutional-governor-quorum.md        ← 3 validators; ABSOLUTE violations always block (v28)
├── docs/governance/ai-model-lifecycle.md               ← 7-day shadow eval; staged rollout; 144 agents same version (v28)
├── memory-integrity/global-reference-validator.md      ← Weekly sweep; 15 ID patterns; validity ≥ 0.98 target (v28)
├── memory-integrity/jsonl-segment-manager.md           ← Daily rotation; monthly archive; annual cold storage (v28)
├── memory-integrity/cross-reference-integrity.md       ← Write-time validation; live reference graph; impact API (v30)
├── security/multi-session-attack-detector.md           ← 6 attack classes; 30-day behavioral model; quarantine at 0.85 (v29)
├── security/supply-chain-security.md                   ← Dependency registry; 7-day sandbox; daily CVE sweep (v29)
├── security/token-replay-prevention.md                 ← 256-bit nonces; 6-step validation; approval signatures 1-use (v29)
├── security/penetration-testing-protocol.md            ← Quarterly external PT; 12 AI-specific test cases (v29)
├── security/chaos-engineering-framework.md             ← 22 experiments; A/B/C/D classes; weekly automated (v29)
├── dev/local-development-environment.md                ← Containerized OS stack; mock connectors; constitutional AI always on (v29)
├── integrations/api-version-lifecycle-manager.md       ← Deprecation monitoring; 33 connectors; Sunset header detection (v29)
├── governance/pre-authorization-pool.md                ← 10 action classes; approval batching; 5× throughput target (v30)
├── runtime/knowledge-base-replica-manager.md           ← 3 replicas; domain sharding; < 5s replication lag (v30)
├── runtime/event-bus-partition-manager.md              ← 91 partitions; 15 topics; auto-scaling consumer groups (v30)
├── docs/governance/regulatory-conflict-matrix.md       ← GDPR vs SOX; GDPR vs AML; 6 conflict resolutions (v30)
├── customer-intelligence/customer-twin.md              ← Segment twin model; churn risk tiers; privacy-first (v31)
├── customer-intelligence/customer-feedback-pipeline.md ← 8 ingestion channels; 5-stage pipeline; topic taxonomy (v31)
├── customer-intelligence/churn-prediction-system.md    ← Cox + XGBoost ensemble; ECE target < 0.05; intervention playbook (v31)
├── customer-intelligence/user-research-infrastructure.md ← JTBD framework; session artifact schema; continuous cadence (v31)
├── customer-intelligence/product-telemetry-pipeline.md ← Canonical event schema; 5-stage pipeline; behavioral metrics (v31)
├── financial-intelligence/business-value-attribution.md ← 5 value dimensions; Shapley attribution; ROI dashboard (v32)
├── financial-intelligence/tco-model.md                 ← Token cost tracking; cost per agent; 5 cost categories (v32)
├── financial-intelligence/budget-intelligence-system.md ← Bayesian forecast; anomaly detection; P(overrun) alerts (v32)
├── financial-intelligence/roi-measurement-framework.md ← Standardized ROI formula; confidence levels; p10 decisions (v32)
├── financial-intelligence/value-weighted-cost-optimizer.md ← 8 opportunity classes; value-risk scoring; automation (v32)
├── product-intelligence/feature-flagging-system.md     ← 5 flag types; deterministic evaluation; flag hygiene (v33)
├── product-intelligence/pricing-intelligence.md        ← WTP model; Van Westendorp; price change simulation (v33)
├── product-intelligence/product-analytics-integration.md ← Feature scorecard; North Star metric; PM weekly digest (v33)
├── digital-twins/market-twin.md                        ← Market state model; 6 perturbation types; compound simulation (v34)
├── simulation-systems/compound-perturbation-engine.md  ← 7 compound scenarios; 1,000 Monte Carlo; resilience targets (v34)
├── dev/cicd-pipeline-architecture.md                   ← 6 pipeline stages; constitutional gate always on; rollback protocol (v34)
├── dev/performance-testing-framework.md                ← 4 test suites; regression detection; ±10% threshold (v34)
├── dev/database-migration-governance.md                ← CRITICAL/HIGH/MEDIUM risk tiers; hash chain preservation (v34)
├── ontology/deduplication-engine.md                    ← 5 duplication types; semantic similarity detection; weekly sweep (v35)
├── ontology/version-history.md                         ← MAJOR/MINOR/PATCH versioning; immutable history; rollback (v35)
├── trust/cross-agent-trust-accumulation.md             ← Directional domain trust; accumulation rules; delegation gates (v35)
├── trust/trust-recovery-protocol.md                    ← 4-phase recovery; 30-day suspension for constitutional violations (v35)
├── governance/prospective-constitutional-screening.md  ← Design-time C001–C012 screening; CI/CD gate (v35)
├── optimization/modification-serializer.md             ← EXCLUSIVE/SHARED locks; TTL expiry; deadlock prevention (v35)
├── autonomy/autonomy-level-framework.md                ← 6 autonomy levels (0–5); certification gates; permanent human authority (v36)
├── autonomy/behavioral-contract-system.md              ← Machine-readable contracts; pre-action gate; annual renewal (v36)
├── autonomy/explanation-first-architecture.md          ← 4 explanation depths; confidence calibration ECE < 0.08 (v36)
├── autonomy/autonomy-audit-trail.md                    ← Ed25519 hash chain; Level 3+ decisions; regulatory compliance (v36)
├── runtime/multi-region-architecture.md                ← Data sovereignty; regional orchestrators; constitutional quorum at PRIMARY (v37)
├── interoperability/unified-query-api.md               ← 6 domains; authorization at UQA layer; registered resource types (v38)
├── interoperability/canonical-event-schema.md          ← Universal event envelope; event type registry; schema validation (v38)
├── compound-intelligence/compound-intelligence-engine.md ← 8-domain synthesis; emergent insights; second-order modeling (v41)
├── compound-intelligence/insight-compression-engine.md ← 4-tier hierarchy; executive signal packet ≤ 500 words (v41)
├── compound-intelligence/analogical-reasoning-engine.md ← Internal + external case library; structural similarity retrieval (v41)
├── compound-intelligence/causal-model-library.md       ← 4 validated causal DAGs; hypothesis validation protocol (v41)
├── org-cognition/organizational-reasoning-engine.md    ← 8 frameworks; structured deliberation; humans always decide (v41)
├── org-cognition/collective-memory-system.md           ← Declarative + procedural + episodic memory; weekly consolidation (v41)
├── org-cognition/long-horizon-planning-intelligence.md ← 4 horizons (tactical→directional); annual cycle; assumption registry (v41)
└── org-cognition/bounded-superintelligence-architecture.md ← Level 5 architecture; 6 permanent constraints; not before 2034 (v41)

ENTERPRISE EXECUTION SANDBOX ARCHITECTURE (v42.0.0)
├── execution-sandbox/sandbox-engine.md              ← Master sandbox coordinator; 5 types (DRY_RUN/SYNTHETIC/SHADOW/SCOPED/REVERSIBLE); full lifecycle; selection matrix
├── execution-sandbox/isolated-execution-environment.md ← IEE hermetic container; namespace isolation; interceptor; side-effect buffer; teardown wipe
├── execution-sandbox/dry-run-system.md              ← Zero-side-effect execution; preview report; mandatory triggers; 5-minute TTL
├── execution-sandbox/synthetic-enterprise-environment.md ← Full-fidelity synthetic replica; 33 mock connectors; 144 agent sim; real constitutional governor
├── execution-sandbox/reversible-execution-system.md ← Compensation pre-registration; state snapshots; irreversibility gate; undo execution
├── execution-sandbox/sandbox-registry.md            ← Lifecycle registry; state machine; resource accounting; TTL enforcement; dashboard
├── reversible-actions/reversibility-framework.md    ← 4 reversibility classes; decision tree; compensation construction rules; human disclosure
├── reversible-actions/compensating-transaction-engine.md ← Saga pattern; pre-registration protocol; idempotency enforcement; partial failure handling
├── reversible-actions/side-effect-tracker.md        ← Real-time capture; 9 operation types; pre-commit review interface; anomaly detection
├── reversible-actions/execution-journal.md          ← Ed25519 hash-chained append-only log; replay engine; 30-day hot/warm; 7-year cold
├── reversible-actions/undo-registry.md              ← Compensation catalog; TTL management; expiry alerting; AES-256 payload encryption
├── rollback-systems/rollback-dag-engine.md          ← DAG construction from forward execution graph; topological execution; parallel safety
├── rollback-systems/rollback-coordinator.md         ← Single rollback entry point; trigger handling; authorization; human escalation flow
├── rollback-systems/state-snapshot-manager.md       ← Pre-action state capture; AES-256 encryption; SHA-256 integrity; daily sweep
├── rollback-systems/compensation-library.md         ← Authoritative inverse operation catalog (CPL-001–CPL-033); idempotency required
├── rollback-systems/rollback-audit-trail.md         ← Hash-chained rollback event log; regulatory compliance records; permanent retention
├── blast-radius-control/blast-radius-analyzer.md    ← 5-dimension scoring (0.00–1.00); pre-execution gate; runtime monitoring; trend analysis
├── blast-radius-control/scoped-execution-domains.md ← 10 named domains (SED-001–SED-010); cross-domain gate; constitutional domain T5-only
├── blast-radius-control/privilege-containment-engine.md ← Ephemeral HMAC-SHA256 tokens; minimum-privilege intersection; scope enforcement
├── blast-radius-control/failure-isolation-system.md ← Circuit breaker; bulkhead; retry with jitter; fallback registry; cascade blocking
├── blast-radius-control/runtime-quarantine-system.md ← 10 quarantine triggers (Q-001–Q-010); auto-quarantine < 1s; behavioral baseline
└── blast-radius-control/pre-execution-simulator.md  ← 8-stage simulation pipeline; governance scoring; dependency cascade; org consequence prediction

SOVEREIGN ENTERPRISE COGNITION ARCHITECTURE (v43.0.0)
├── sovereign-memory/jurisdiction-aware-memory.md       ← 6-jurisdiction registry; immutable jurisdiction_metadata; write-once residency; HSM key selection
├── sovereign-memory/regional-cognition-boundaries.md   ← BOUNDARY-EU/CN/GLOBAL rules; GDPR Art.22 human review gate; EU AI Act constitutional block
├── sovereign-memory/legal-memory-partitioning.md       ← 7 partitions; CN HARD network partition; partition gateway; daily retention enforcer; adequacy auto-suspend
├── sovereign-memory/sovereignty-aware-retrieval.md     ← 6-phase retrieval pipeline; jurisdiction-weighted ranking; SOVEREIGN_CRITICAL never cross-partition; < 50ms p95
├── geopolitical-governance/cross-border-governance.md  ← 6 operation types; transfer mechanism registry (adequacy/SCC/CAC); emergency access 24hr TTL
├── geopolitical-governance/regional-policy-enforcement.md ← EU/CN/US policy catalogs; PERMANENT_BLOCK for EU AI Act prohibited + COPPA; daily regulatory monitoring
├── geopolitical-governance/jurisdiction-aware-orchestration.md ← 3-tier architecture; CN hard isolation hardware-enforced; payload sanitization at every boundary
├── geopolitical-governance/regulatory-conflict-arbitration.md ← 7 conflict types; 7-rule resolution hierarchy; RES-001–RES-004 known resolutions
├── regional-cognition/regional-data-containment.md     ← 4 containment layers; CN HARD_NETWORK_PARTITION; egress DPI scanner; 72hr GDPR breach notification
├── regional-cognition/sovereign-execution-zones.md     ← SEZ-EU/US/IN/GB/SG (SOFT); SEZ-CN (HARD, SM4); autonomous operation; constitutional decisions blocked if isolated
├── regional-cognition/restricted-cognition-domains.md  ← Class A globally prohibited (RCD-G-001-005); 5-tier pre-execution screen; global prohibition prevails over local law
├── regional-cognition/cross-region-federation-controls.md ← 5 federation modes; DP ε≤1.0; k-anon k≥10; unconditional zone veto; CN defaults OPTED_OUT
├── sovereignty-controls/enterprise-federation.md       ← Confederate sovereignty; 6 sovereign entities; federation agreement; exit: 90-day notice + data portability
├── sovereignty-controls/sovereign-org-structures.md    ← Per-jurisdiction deployment rules; GLOBAL_ONLY capabilities; workflow localization (WF-001-EU/CN/US)
├── sovereignty-controls/region-aware-orchestration.md  ← 5-level routing priority; cross-entity delegation cap 10%; 4 orchestration modes; handoff sanitization
└── sovereignty-controls/sovereignty-aware-topology.md  ← Complete enterprise topology; 5 topology invariants (all T5+board); topology evolution protocol; health monitoring

ADAPTIVE COMPLIANCE ENGINE ARCHITECTURE (v44.0.0)
├── adaptive-compliance/compliance-engine.md              ← Master coordinator; 4-tier; 5 domains; constitutional gate first (< 10ms); 10,000 decisions/sec
├── adaptive-compliance/policy-adaptation-engine.md       ← Policy lifecycle; 5 adaptation triggers; staged rollout (5%→25%→100%); 30-day rollback; CEL rule sets
├── adaptive-compliance/control-effectiveness-monitor.md  ← 4-dimension scoring; EFFECTIVE≥0.80; compensating control activation; T4 if no compensating available
├── adaptive-compliance/compliance-state-machine.md       ← 7 states; SUSPENDED exits via T4+Legal only; exception cap 3/jurisdiction; hash-chained transitions
├── adaptive-compliance/compliance-decision-engine.md     ← 6 decision types; constitutional BLOCK non-overridable; decision cache 300s TTL; bypass for RESTRICTED data
├── adaptive-compliance/compliance-schema.md              ← Canonical schemas (ACE/VIO/EXC/CTL-EVT/EVD); hash-chained; Ed25519 for T4+ decisions
├── compliance-intelligence/regulatory-intelligence-system.md ← Multi-jurisdiction source registry; impact/urgency classification; CRITICAL → T4 within 2hr; RIU pipeline
├── compliance-intelligence/compliance-risk-scorer.md     ← 5-dimension weighted score; SUSPENDED/no-mechanism always CRITICAL; jurisdiction-specific risk appetite
├── compliance-intelligence/compliance-predictor.md       ← 4 ML models (XGBoost/Prophet/rule-hybrid/LSTM); ECE<0.05; early warning every 6hr; SHAP explanations
├── compliance-intelligence/violation-pattern-analyzer.md ← 7 pattern types; CASCADE+security → T4 immediate; continuous + weekly mining; policy/contract feedback loops
├── compliance-intelligence/compliance-analytics-engine.md ← 11 metrics; 5 report cadences; streaming real-time + batch; sovereignty-aware data residency
├── regulatory-adaptation/regulatory-change-detector.md   ← 6 change classes; CRITICAL < 30min alert; adequacy revocation always CRITICAL; regulation registry
├── regulatory-adaptation/impact-assessment-engine.md     ← Full scope impact (policy/control/agent/workflow/transfer); TIA gates mechanism reactivation; ARCHITECTURAL → T5
├── regulatory-adaptation/policy-synthesis-engine.md      ← 4 synthesis modes; 7 policy templates; LLM-assisted extraction with confidence scores; constitutional screen pre-review
├── regulatory-adaptation/adaptation-workflow-orchestrator.md ← 7-stage workflow; no stage skipping; parallel jurisdiction tracks; rollback T4 post-deployment
├── regulatory-adaptation/regulatory-calendar.md          ← 13+ standing entries; horizon scanning (EU AI Liability, DPDP Rules); missed deadline = T4 immediate
├── compliance-operations/automated-remediation-engine.md ← 10-entry catalog (REM-001–010); REM-004 AI Act prohibited: 1-min SLA; novel violations → human
├── compliance-operations/evidence-synthesis-engine.md    ← 9 evidence types; continuous collection; merkle root + Ed25519; jurisdiction-isolated regulatory packages
├── compliance-operations/compliance-audit-coordinator.md ← 5 audit types; 6-stage lifecycle; finding SLAs; time-limited auditor access; mandatory legal review for regulators
├── compliance-operations/compliance-dashboard.md         ← 3-layer (Operational/Governance/Executive); health score 0–100; sovereignty-aware rendering; control heat map
└── compliance-operations/compliance-learning-system.md   ← 4 learning cycles; 5 feedback loops; org knowledge base; all recommendations tracked to outcome

ENTERPRISE THREAT INTELLIGENCE AND SECURITY OPERATIONS ARCHITECTURE (v45.0.0)
├── threat-intelligence/threat-intelligence-platform.md   ← Master TIP; IOC lifecycle; TLP 2.0; STIX 2.1; confidence scoring (decay 0.05/wk); 4 intel products
├── threat-intelligence/threat-feed-aggregator.md         ← 30+ feeds (commercial/OSINT/gov/AI-specific/internal); Bayesian trust recalibration; trust floor 0.40
├── threat-intelligence/threat-actor-registry.md          ← Actor schema (TA-{NNN}); 3 AI-specific profiles; MITRE ATT&CK v15 + ATLAS v1.0; campaign tracking
├── threat-intelligence/vulnerability-intelligence.md     ← VULN-{NNN}; risk score formula; P0-P4 tiers; AI/ML vuln types; P0 > 48hr = board notification
├── threat-intelligence/threat-intelligence-fusion.md     ← 4 correlation engines; threat bulletin (TIB-{NNN}); enterprise threat score 0–1.00; 15-min refresh
├── security-operations/security-operations-center.md     ← 4-tier SOC (T0-T3); event processing pipeline; threat hunting; KPIs (MTTD<5min; FP<10%)
├── security-operations/security-event-correlator.md      ← 7 event source categories; 10 correlation rules (COR-001–010); constitutional COR-004/005 non-bypassable
├── security-operations/security-alert-manager.md         ← Alert lifecycle; ALT-{NNN}; priority 0–200; AI-specific +25; constitutional +30; dedup 300s window
├── security-operations/soc-playbook-engine.md            ← 8 playbooks (PB-SOC-001–008); PB-SOC-005 constitutional quorum non-bypassable; PBX-{NNN} execution records
├── security-operations/security-metrics-dashboard.md     ← 3-layer dashboard; posture score 0–100; GREEN≥80; 20+ metrics; regulatory compliance tracking
├── threat-detection/detection-engineering.md             ← DET-{NNN}; Sigma/YARA/KQL/CEL; 5-stage lifecycle; 5 AI-specific rules; rule_hash tamper detection
├── threat-detection/behavioral-anomaly-detector.md       ← BEH-{NNN} profiles; 5 ML models (Isolation Forest/LSTM/GAE/CUSUM/Mann-Kendall); STABLE after 500 obs
├── threat-detection/ai-specific-threat-detector.md       ← 6-class AI threat taxonomy; 6 detection modules; constitutional proximity monitor non-suppressable
├── threat-detection/network-threat-monitor.md            ← 6 traffic domains; 10 network rules (NET-001–010); sovereignty enforcement layer; real-time permit check
├── threat-detection/insider-threat-detector.md           ← 4 risk categories; 7-component weighted score; ITR-{NNN}; NO autonomous enforcement ever; PB-SOC-008
├── threat-detection/supply-chain-threat-monitor.md       ← 4 attack types; hash + behavioral fingerprint + probe testing; 4 CI/CD pipeline gates; compromised hash registry
├── incident-response/incident-response-orchestrator.md   ← INC-{NNN}; PICERL lifecycle; GDPR 72hr clock; cross-entity coordination; regulatory notification workflow
├── incident-response/forensic-evidence-collector.md      ← 9 evidence types; collection protocol; chain-of-custody (COC-{NNN}); jurisdiction residency enforcement
├── incident-response/containment-engine.md               ← 10-action catalog (CON-001–010); blast radius analysis; evidence-first mandatory; reversal catalog
├── incident-response/recovery-coordinator.md             ← 4 recovery workflows; phased restoration (10%/25%/50%/100%); 30-day enhanced monitoring; REC-{NNN}
└── incident-response/post-incident-analysis.md           ← PIR mandatory for CRITICAL/HIGH; 7-section structure; PIA-ACT-{NNN} tracking; org learning loop

CONSTITUTION (supreme governing layer)
├── constitution/enterprise-constitution.md         ← Supreme governing document (ratify first)
├── constitution/enterprise-questionnaire.md        ← Fill this to ratify the constitution
├── constitution/enterprise-constitution-template.md← Reusable template for new OS instances
├── constitution/governance-boundary-model.md       ← Authority, domain, and security boundaries
└── constitution/human-approval-constitution.md     ← Definitive catalog of human-required decisions

OBSERVABILITY
├── observability/README.md               ← Observability overview
├── observability/metrics.md              ← DORA + quality + AI + governance metrics
├── observability/dashboards.md           ← Dashboard specifications
└── observability/alerts.md               ← Alert definitions and escalation

ONTOLOGY
├── ontology/README.md                    ← Shared vocabulary system
├── ontology/core-concepts.md             ← Foundational term definitions
├── ontology/artifact-taxonomy.md         ← Artifact classification
└── ontology/agent-vocabulary.md          ← Agent roles and trust hierarchy

EVALUATIONS
├── evaluations/README.md                 ← AI evaluation framework
├── evaluations/criteria.md               ← Universal eval dimensions and scoring
└── evaluations/golden-tests.md           ← Golden test set protocol

STATE MODELS
├── state-models/README.md                ← State model overview
├── state-models/workflow-states.md       ← Workflow execution state machine
└── state-models/artifact-states.md       ← Artifact lifecycle state machine

LIFECYCLE MODELS
├── lifecycle-models/README.md            ← Lifecycle model overview
└── lifecycle-models/feature-lifecycle.md ← Feature from idea to sunset

SPRINTS
└── sprints/README.md                     ← Sprint execution records (none yet)

INTEGRATION FABRIC (33 enterprise connectors — v3.0.0)
├── integrations/INTEGRATION-FABRIC-README.md       ← Master entry point for integration layer
├── integrations/MASTER-INTEGRATION-REGISTRY.md     ← All 33 connectors registered
├── integrations/CAPABILITY-GAP-TRACKER.md          ← 7 open gaps tracked (GAP-INT-001 to 007)
├── integrations/project-management/                ← Jira, Confluence
├── integrations/version-control/                   ← GitHub, GitLab
├── integrations/communication/                     ← Slack, Teams, Gmail, Outlook
├── integrations/documents/                         ← DOCX, PPTX, XLSX, PDF
├── integrations/design/                            ← Figma, Gamma
├── integrations/itsm/                              ← ServiceNow
├── integrations/data/                              ← Snowflake, Databricks, Neo4j*, Vector DBs*
├── integrations/crm/                               ← Salesforce
├── integrations/monitoring/                        ← Datadog, PagerDuty
├── integrations/content/                           ← SharePoint
├── integrations/workspace/                         ← Google Workspace (Gmail+Calendar+Drive), Office 365
├── integrations/infrastructure/                    ← Kubernetes
├── integrations/cicd/                              ← Jenkins, ArgoCD
├── integrations/analytics/                         ← Tableau, Power BI, Looker
└── integrations/erp/                               ← SAP, Workday
  * = Planned (not yet active)

RUNBOOKS
├── wiki/runbooks/deployment-runbook.md   ← Production deployment procedure
├── wiki/runbooks/rollback-runbook.md     ← Rollback procedure
└── wiki/runbooks/incident-response-runbook.md ← Incident response procedure

OPERATIONAL PLAYBOOKS
├── playbooks/INDEX.md                                ← Playbook catalog and quick-reference index
├── playbooks/daily-operating-playbook.md             ← Daily OS operations: morning health checks, alert triage, routine tasks
├── playbooks/sprint-playbook.md                      ← Sprint cycle: planning, daily standup, review, retro procedures
├── playbooks/release-playbook.md                     ← End-to-end release procedure: gate checklist, approval chain, go/no-go
├── playbooks/incident-playbook.md                    ← Incident response: detection, triage, escalation, resolution, post-mortem
├── playbooks/architecture-review-playbook.md         ← Architecture review: RFC/ADR intake, review protocol, decision recording
└── playbooks/PM-review-playbook.md                   ← PM review: PRD intake, discovery validation, prioritization decisions

DELEGATION SYSTEMS
├── delegation-systems/README.md                      ← Delegation systems overview and entry points
├── delegation-systems/expertise-registry.md          ← Agent expertise profiles: declared + learned specializations, proficiency levels
├── delegation-systems/specialist-router.md           ← Routes tasks to domain specialists based on expertise registry + fit scores
├── delegation-systems/adaptive-delegation.md         ← Adapts delegation strategy dynamically based on agent load and quality signals
├── delegation-systems/workload-distributor.md        ← Distributes work across agents to maintain utilization within 0.60-0.80 target
└── delegation-systems/expertise-orchestrator.md      ← Orchestrates multi-specialist tasks: assembles expert panels, manages deliberation

ENTERPRISE DIGITAL TWIN SYSTEM (v1.0.0)
├── digital-twins/twin-engine.md                           ← Master twin coordinator: sync, simulate, predict, report
├── digital-twins/org-twin.md                              ← Live mirror of org health, capacity, escalations, governance
├── digital-twins/workflow-twin.md                         ← Live mirror of workflow portfolio, gates, flow efficiency
├── digital-twins/delivery-twin.md                         ← Live mirror of roadmap, sprints, dependencies, releases
├── digital-twins/runtime-twin.md                          ← Live mirror of context, tool budget, orchestration load
├── digital-twins/twin-sync.md                             ← Synchronization protocol: event-driven + scheduled batch
├── digital-twins/twin-registry.md                         ← Twin metadata, capabilities, health dashboard
├── enterprise-modeling/org-model.md                       ← Org unit formulas: capacity, health scores, escalation SLAs
├── enterprise-modeling/workflow-model.md                  ← Flow metrics: Little's Law, gate efficiency, WIP limits
├── enterprise-modeling/delivery-model.md                  ← CPM algorithm, velocity distributions, release readiness
├── enterprise-modeling/scenario-model.md                  ← Perturbation catalog (17 types), scenario library (10 templates)
├── enterprise-modeling/simulation-results-model.md        ← Result schemas: distributions, findings, bottlenecks, risks
├── simulation-systems/simulation-engine.md                ← Monte Carlo engine: 8-phase protocol, state evolution models
├── simulation-systems/org-simulator.md                    ← Org scenario router → staffing/governance/escalation simulators
├── simulation-systems/staffing-simulator.md               ← Hire/attrition/freeze/reorg simulations with ramp-up curves
├── simulation-systems/governance-simulator.md             ← Policy/gate strictness simulations, quality-speed tradeoff
├── simulation-systems/escalation-simulator.md             ← M/G/c queuing model, cascade branching, saturation forecast
├── simulation-systems/workflow-simulator.md               ← Volume/gate/failure simulations, Little's Law dynamics
├── simulation-systems/orchestration-simulator.md          ← Delegation chain depth, supervisor capacity, routing load
├── simulation-systems/coordination-simulator.md           ← Handoff quality, cross-team delay, org distance multipliers
├── simulation-systems/runtime-load-simulator.md           ← Context/tool/recovery saturation, cascade feedback loop
├── forecasting/roadmap-forecaster.md                      ← Historical-sampling Monte Carlo for roadmap date forecasts
├── forecasting/dependency-simulator.md                    ← CPM critical path, cascade delays, bottleneck scoring
├── forecasting/release-risk-simulator.md                  ← 5-dimension release risk, go/no-go decision framework
├── forecasting/rollout-forecaster.md                      ← Phased rollout timelines, SPRT rollback detection
├── forecasting/delivery-forecaster.md                     ← Sprint burndown, carry-over risk, scope-to-fit recommendations
├── predictive-intelligence/prediction-engine.md           ← Master predictor: aggregates all twin signals → warnings
├── predictive-intelligence/org-forecaster.md              ← Org health trajectory, capacity exhaustion, coverage gaps
├── predictive-intelligence/operational-forecaster.md      ← Throughput/quality/flow/WIP trends and saturation
├── predictive-intelligence/bottleneck-predictor.md        ← 8 bottleneck classes, compound patterns, onset probability
└── predictive-intelligence/governance-risk-predictor.md   ← Gate compliance, policy adherence, escalation governance

DIGITAL TWIN PERSISTENCE (initialized)
├── memory/digital-twins/engine-state.yaml                 ← Twin engine status + active simulations
├── memory/digital-twins/prediction-accuracy.yaml          ← Per-class accuracy metrics (target: 80% calibration)
├── memory/digital-twins/simulation-index.yaml             ← Fast lookup index for all simulation results
├── memory/digital-twins/twin-state/org-twin-state.yaml    ← Live org twin state
├── memory/digital-twins/twin-state/workflow-twin-state.yaml ← Live workflow twin state
├── memory/digital-twins/twin-state/delivery-twin-state.yaml ← Live delivery twin state
├── memory/digital-twins/twin-state/runtime-twin-state.yaml  ← Live runtime twin state
├── memory/digital-twins/simulation-results/               ← Per-simulation result YAML files
├── memory/digital-twins/forecasts/                        ← Per-forecast result YAML files
└── memory/digital-twins/predictions/                      ← Per-prediction result YAML files

ENTERPRISE EXECUTION RUNTIME FABRIC (v1.0.0)
├── workflow-engine/dag-engine.md               ← DAG execution state machine: 4-phase dispatch protocol, fan-out/fan-in
├── workflow-engine/workflow-scheduler.md        ← Schedule triggers, priority queuing, admission control, EDF scheduling
├── workflow-engine/retry-engine.md              ← Retry policies (5 defaults), exponential jitter, dead letter queue
├── workflow-engine/worker-dispatcher.md         ← Capability matching, 6-factor scoring, CAS reservation, affinity groups
├── workflow-engine/workflow-registry.md         ← Definition registry, 5-step validation protocol, version pinning
├── execution-runtime/runtime-engine.md          ← ExecutionInstance lifecycle, 4 execution modes, resource budget enforcement
├── execution-runtime/durable-execution.md       ← 14-event journal, deterministic replay, exactly-once fencing tokens
├── execution-runtime/state-persistence.md       ← WAL write protocol, optimistic CAS, 4-phase crash recovery
├── execution-runtime/compensating-actions.md    ← Saga pattern: compensation plan, must_succeed escalation, 3 design patterns
├── execution-runtime/rollback-engine.md         ← 4 rollback scopes, 7-phase protocol, cascade subworkflow rollback
├── execution-runtime/execution-scaling.md       ← Reactive autoscaler: utilization targets, predictive pre-scale, anti-thrashing
├── distributed-execution/worker-orchestration.md ← Worker lifecycle, heartbeat failure detector, health score formula
├── distributed-execution/task-queue.md          ← 5-band priority queue, EDF, fairness limiter, back-pressure levels
├── distributed-execution/work-stealing.md       ← Deque-based steal (owner LIFO/thief BACK), adaptive threshold, imbalance score
├── distributed-execution/distributed-coordinator.md ← Fenced locks, split-brain prevention, leader election, epoch consensus
├── distributed-execution/execution-partitioner.md   ← Consistent hashing (V=150 vnodes), rebalancing, debounce policy
├── orchestration-dags/dag-compiler.md           ← 7-stage compile pipeline, loop/conditional expansion, phase assignment, cache
├── orchestration-dags/dependency-resolver.md    ← Kahn's topological sort, DFS cycle detection, CPM forward/backward pass
├── orchestration-dags/dag-optimizer.md          ← 5 optimizer passes: waves, critical path boost, affinity reorder, fusion, eager gates
├── orchestration-dags/dag-runtime.md            ← RuntimeGraph, 10 node state transitions, frontier management, fan-out/fan-in
├── orchestration-dags/dag-validator.md          ← 3 validation layers (structural/semantic/policy), dry-run simulation
├── runtime-clusters/event-bus.md                ← 6 standard topics, publish/subscribe, exactly-once dedup, consumer offset management
├── runtime-clusters/reactive-orchestration.md   ← Choreography engine: reactive rules, event-driven workflow activation
├── runtime-clusters/event-triggers.md           ← Trigger types: simple/threshold/windowed-count/sequence/composite
├── runtime-clusters/orchestration-subscriptions.md ← Managed subscription plane: lifecycle, retry, lag monitoring
├── runtime-clusters/runtime-signals.md          ← Direct signals: CANCEL/SUSPEND/RESUME/INJECT_INPUT/PRIORITY_BOOST
├── execution-observability/execution-tracer.md  ← Distributed trace assembly from event bus: span trees, critical path extraction
├── execution-observability/workflow-telemetry.md ← SLI/SLO tracking, metric taxonomy, time-series rollup and retention
├── execution-observability/runtime-heatmaps.md  ← 7 heatmap types: node timing, executor utilization, queue depth, failure density
├── execution-observability/orchestration-monitor.md ← Live dashboard, 6 alert rules, auto-remediation, operator intervention API
└── execution-observability/bottleneck-analyzer.md   ← 8 bottleneck classes, trace-based + historical analysis, recommendations

EXECUTION RUNTIME PERSISTENCE (initialized)
├── memory/workflow-engine/registry-index.yaml           ← Workflow definition registry
├── memory/workflow-engine/active-schedules.yaml         ← Active schedule trigger state
├── memory/execution-runtime/active-runs.yaml            ← Live execution instance index
├── memory/distributed-execution/worker-registry.yaml   ← Worker registration + pool status
├── memory/orchestration-dags/compiled-dag-cache.yaml   ← Compiled DAG cache index
├── memory/runtime-clusters/consumer-offsets.yaml       ← Event bus consumer group offsets
├── memory/runtime-clusters/reactive-state.yaml         ← Reactive rule registry + activations
├── memory/runtime-clusters/trigger-state.yaml          ← Trigger condition state + windows
├── memory/runtime-clusters/subscriptions.yaml          ← Subscription registry + metrics
├── memory/execution-observability/trace-index.yaml     ← Distributed trace index
└── memory/execution-observability/monitor-state.yaml   ← Live monitor dashboard state

ZERO-TRUST ENTERPRISE COGNITION ARCHITECTURE (v1.0.0)
├── semantic-gateway/semantic-firewall.md               ← 5-class threat inspection: injection, scope, sensitive data, tool ref, cross-run
├── semantic-gateway/tool-intent-verifier.md            ← Intent classification (7 classes) → allowed/forbidden tool category enforcement
├── semantic-gateway/mcp-governance-gateway.md          ← MCP server registry, 7-step enforcement, trust tiers, anomaly detection
├── semantic-gateway/execution-validator.md             ← Pre/post execution validation: schema, completeness scoring, authority constraints
├── semantic-gateway/prompt-injection-detector.md       ← 6 injection types: direct, indirect, encoded, multi-turn, jailbreak, role confusion
├── execution-security/least-privilege-engine.md        ← Permission derivation: scope bound to run_id/node_id/valid_until, hard limits
├── execution-security/ephemeral-permission-manager.md  ← HMAC-SHA256 stateless tokens, version-fence revocation, auto-revoke on completion
├── execution-security/execution-signing.md             ← Ed25519 key hierarchy: root→subsystem→agent ephemeral, context-bound signatures
├── execution-security/capability-scope-controller.md  ← T1–T5 agent profiles: allowed tools, classification ceiling, authority levels
├── execution-security/runtime-isolation-manager.md     ← 4 isolation levels: STANDARD/ENHANCED/STRICT/SANDBOX, worker pool segregation
├── trust-boundaries/workflow-confidence-scorer.md      ← 6-dimension composite score, disqualifiers hard-cap at 0.20, 5 decision tiers
├── trust-boundaries/trust-boundary-registry.md         ← 5 trust zones (T1→T5), boundary crossing policies, rate limiting
├── trust-boundaries/orchestration-reliability-scorer.md ← Routing alignment, authority penalty, disqualifiers (self-route, circular, cross-zone)
├── trust-boundaries/constitutional-ai-governor.md      ← 12 principles (C-001→C-012), 3 severity levels, ABSOLUTE violations unoverridable
├── runtime-isolation/hallucination-containment.md      ← Claim support scoring (0.60 threshold), 4 severity bands, quarantine/block/alert
├── runtime-isolation/execution-sandbox.md              ← PROCESS/CONTAINER/VM isolation, output pipeline: strip→scan→quarantine
├── runtime-isolation/adversarial-tester.md             ← Combinatorial test generation, 5 test categories, CRITICAL posture if const. fails
├── runtime-isolation/workflow-validator.md             ← Confidence collapse, cross-node contradictions, timing anomalies, retry bursts
├── audit-replay/immutable-audit-log.md                 ← Cryptographic chain: SHA-256 prev-record linkage, Ed25519 per-record signing
├── audit-replay/governance-replay-engine.md            ← Historical context reconstruction, outcome comparison, batch compliance windows
├── audit-replay/audit-query-engine.md                  ← Forensic query API, incident reconstruction, agent behavior analysis, compliance reports
├── governance-attestation/cryptographic-approval-engine.md ← Ed25519-signed approval records, multi-party sessions, authority matrix
├── governance-attestation/attestation-registry.md      ← 7 attestation types with TTLs, coverage tracking, fast index lookup
├── governance-attestation/approval-chain-verifier.md   ← 4 chain policies, prerequisite-ordered verification, authority delegation validation
└── governance-attestation/policy-binding-engine.md     ← Complete policy snapshots at execution time, drift detection, historical reconstruction

COGNITION SECURITY PERSISTENCE (initialized)
├── memory/semantic-gateway/firewall-state.yaml         ← Threat counts, decision distribution, active pattern registry
├── memory/semantic-gateway/mcp-registry.yaml           ← MCP server registrations, access grants, usage statistics
├── memory/execution-security/capability-manifests.yaml ← Agent capability manifests registry + T1–T5 profile definitions
├── memory/execution-security/signing-registry.yaml     ← Key hierarchy, active ephemeral keys, signing statistics
├── memory/execution-security/isolation-state.yaml      ← Worker pool states, active run assignments, security events
├── memory/trust-boundaries/boundary-registry.yaml      ← Trust zones, boundary policies, crossing statistics
├── memory/runtime-isolation/sandbox-state.yaml         ← Active sandboxes, pool state, quarantine queue, adversarial test history
├── memory/audit-replay/audit-chain.jsonl               ← Immutable cryptographic audit chain (append-only, never modified)
├── memory/audit-replay/audit-index.yaml                ← Inverted indexes for fast audit query (derived view, rebuildable)
├── memory/audit-replay/replay-state.yaml               ← Active/completed replay sessions, policy cache, compliance reports
├── memory/governance-attestation/attestation-registry.yaml ← Attestation indexes by subject/type/attester/run
├── memory/governance-attestation/approval-records.jsonl    ← Cryptographic approval records (append-only)
├── memory/governance-attestation/chain-verifications.jsonl ← Approval chain verification results (append-only)
└── memory/governance-attestation/policy-bindings.jsonl     ← Policy binding records with complete policy snapshots (append-only)

ENTERPRISE NERVOUS SYSTEM ARCHITECTURE (v1.0.0)
├── enterprise-telemetry/enterprise-event-bus.md             ← 15-topic enterprise event backbone; cross-org/governance/runtime events; routing rules
├── enterprise-telemetry/event-propagation-engine.md         ← Fan-out, enrichment (org + run + governance context), transformation, event chain mgmt
├── enterprise-telemetry/telemetry-subscriptions.md          ← Subscription plane: 8 standard subs, health monitoring, lag/error auto-suspend
├── enterprise-telemetry/runtime-trigger-engine.md           ← 8 enterprise triggers: health threshold, alert pattern, escalation surge, composite, schedule
├── enterprise-telemetry/workflow-telemetry.md               ← Portfolio metrics: throughput, latency distributions, SLO compliance, burn rates
├── enterprise-telemetry/governance-telemetry.md             ← Constitutional clearance rates, approval chain performance, attestation coverage, policy drift
├── enterprise-telemetry/orchestration-telemetry.md          ← Routing accuracy, delegation depth, trust score distribution, handoff quality metrics
├── enterprise-telemetry/organizational-health-telemetry.md  ← Agent utilization, escalation rates, decision velocity, wiki staleness, knowledge gaps
├── operational-command-center/enterprise-operations-console.md ← Primary command bridge: health overview, alert queue, governance snapshot, quick actions
├── operational-command-center/orchestration-control-plane.md   ← Live orchestration control: routing overrides, org pause/resume, work reassignment, emergency stop
├── operational-command-center/workflow-command-center.md       ← Per-workflow drilldown: DAG state, node detail, gate history, interventions (pause/cancel/boost/retry)
├── operational-command-center/runtime-dashboards.md            ← Real-time execution panels: worker pools, queue health, SLO compliance by definition, burn rates
├── operational-command-center/orchestration-heatmaps.md        ← 5 heatmap types: agent load, routing density, trust score distribution, inter-org collaboration, governance latency
├── operational-command-center/escalation-monitoring.md         ← Escalation lifecycle: SLA countdown, re-escalation chains, SLA matrix (CRITICAL=15min), resolution tracking
├── operational-command-center/governance-latency-monitor.md    ← Governance pipeline latency SLAs: T5 approval=30min p50, attestation=100ms, constitutional=200ms p50
├── operational-command-center/runtime-intervention-interfaces.md ← 12 intervention types: authority-checked, impact previewed, constitutionally gated, full audit trail
├── operational-command-center/governance-operations-dashboard.md ← Governance operator view: approval queue by tier, constitutional health, attestation gaps, policy drift
├── workflow-monitoring/operational-health-scorer.md            ← 6-dimension composite: throughput×0.20 + SLO×0.25 + gate×0.20 + worker×0.15 + queue×0.10 + recovery×0.10
├── workflow-monitoring/governance-health-scorer.md             ← Constitutional×0.30 + approval×0.20 + attestation×0.20 + policy×0.15 + gate×0.10 + security×0.05
├── workflow-monitoring/orchestration-health-scorer.md          ← Routing×0.25 + delegation×0.20 + trust×0.20 + handoff×0.20 + authority×0.10 + coordination×0.05
├── workflow-monitoring/organizational-stress-detector.md       ← 5 stress indicators: escalation surge, knowledge gap, decision paralysis, quality degradation, capacity saturation
├── runtime-topology/runtime-topology-maps.md                   ← Force-directed topology graph: org nodes, inter-org edges, trust zone overlays, load color-coding
├── runtime-topology/workflow-dependency-maps.md                ← 6 dependency types: artifact, conflict, SLO chain, data pipeline, gate, approval pool; blast radius BFS
├── runtime-topology/topology-change-detector.md                ← 12 change categories: agent lifecycle, capability drift, routing rule changes, integration changes
├── runtime-topology/service-mesh-topology.md                   ← Connection-level health: circuit breakers (CLOSED/OPEN/HALF_OPEN), latency SLAs, error rates per link
├── orchestration-observability/orchestration-tracer.md         ← Full call tree: ROUTING→AGENT_INVOCATION→TOOL_CALL→DELEGATION→GOVERNANCE_CALL; critical path extraction
├── orchestration-observability/coordination-monitor.md         ← Per-pair handoff stats, retry cascades, delegation depth explosion, collaboration contract compliance
├── orchestration-observability/live-topology-viewer.md         ← 7 overlay layers: load, flow animation, dependency map, mesh health, alert markers; historical replay
└── orchestration-observability/dependency-impact-analyzer.md   ← 5 analysis types: workflow failure blast radius, agent suspension impact, approval delay cascade, intervention safety

NERVOUS SYSTEM PERSISTENCE (initialized)
├── memory/enterprise-telemetry/event-bus-state.yaml           ← 15-topic bus state, consumer offsets, event chain tracking
├── memory/enterprise-telemetry/subscriptions.yaml             ← Subscription registry with topic index
├── memory/enterprise-telemetry/propagation-state.yaml         ← Active event chains, delivery statistics, back-pressure state
├── memory/enterprise-telemetry/trigger-state.yaml             ← 8 triggers with cooldown state and firing history
├── memory/enterprise-telemetry/workflow-metrics.yaml          ← Workflow metric snapshots and SLO targets
├── memory/enterprise-telemetry/governance-metrics.yaml        ← Governance compliance score history and approval performance
├── memory/enterprise-telemetry/orchestration-metrics.yaml     ← Orchestration metrics, delegation depth history, pair stats
├── memory/enterprise-telemetry/org-health-metrics.yaml        ← Org utilization history, escalation baselines, stress signals
├── memory/operational-command-center/console-state.yaml       ← Live console state: health, alerts, workflow summary, interventions
├── memory/operational-command-center/control-plane-state.yaml ← Emergency stop, routing overrides, paused orgs, control records
├── memory/operational-command-center/escalation-state.yaml    ← Active escalations, SLA performance, resolution history
├── memory/operational-command-center/intervention-log.jsonl   ← All operator interventions (append-only audit log)
├── memory/workflow-monitoring/health-scores.yaml              ← Operational + governance + orchestration health score history
├── memory/workflow-monitoring/stress-state.yaml               ← Org stress assessments, sustained window counts, interventions
├── memory/runtime-topology/topology-state.yaml                ← Current topology graph, snapshot index, node registry
├── memory/runtime-topology/topology-changes.jsonl             ← Topology change event log (append-only)
├── memory/runtime-topology/dependency-state.yaml              ← Active workflow dependencies and blast radius analyses
├── memory/runtime-topology/mesh-state.yaml                    ← Service mesh connection health and circuit breaker states
├── memory/orchestration-observability/orchestration-traces.yaml ← Active and indexed completed orchestration traces
├── memory/orchestration-observability/coordination-state.yaml   ← Agent pair coordination stats and active problems
└── memory/orchestration-observability/impact-analyses.jsonl     ← Impact analysis results (append-only)

ENTERPRISE KNOWLEDGE MANAGEMENT ARCHITECTURE (v1.0.0)
├── knowledge-base/knowledge-model.md                          ← Knowledge Unit (KU) canonical schema; identity/classification/content/provenance/quality/lifecycle fields
├── knowledge-base/knowledge-taxonomy.md                       ← 10 enterprise domains (GOVERNANCE/ORCHESTRATION/PROCESS/DECISION/TECHNICAL/ORGANIZATIONAL/INCIDENT/INTELLIGENCE/PRODUCT/OPERATIONAL); domain/subdomain/tag structure
├── knowledge-base/knowledge-repository.md                     ← BM25 + HNSW vector store; 6 indexes; query API; consistency guarantees; replication
├── knowledge-base/knowledge-lifecycle.md                      ← State machine DRAFT→ACTIVE→DEPRECATED→ARCHIVED; review schedules; staleness detection; expiry management
├── knowledge-base/knowledge-quality-system.md                 ← 4-dimension quality model (completeness/accuracy/clarity/applicability); EXEMPLARY/HIGH/ACCEPTABLE/MARGINAL/POOR tiers; publish gate
├── knowledge-capture/workflow-knowledge-extraction.md         ← 7-stage extraction; 4 templates; confidence scoring; auto-publish at 0.80+
├── knowledge-capture/decision-knowledge-capture.md            ← 3-tier capture (T1 automatic/T2 threshold/T3 voluntary); 5 capture methods; decision pattern detection
├── knowledge-capture/incident-lessons-learned.md              ← Mandatory postmortem (P1=5d/P2=10d/P3=20d); 6-section template; root cause taxonomy; recurrence detection
├── knowledge-capture/expert-knowledge-elicitation.md          ← 6 session types; 30+ question library; expert registry; 4 depth levels
├── knowledge-capture/pattern-recognition-engine.md            ← 6 pattern types; 4 clustering algorithms; confidence 0.55–0.95; auto-publish at 0.85+
├── knowledge-retrieval/semantic-search-engine.md              ← 5 modalities; RRF fusion (k=60); quality boosts; p99 < 1s; degraded fallback to keyword-only
├── knowledge-retrieval/contextual-knowledge-delivery.md       ← 7 delivery triggers with SLAs; 5 formats; relevance threshold 0.55; usage feedback loop
├── knowledge-retrieval/knowledge-query-api.md                 ← 7 endpoints; rate limits T1=100/min to T4=1000/min; 2-year audit retention
├── knowledge-retrieval/knowledge-recommendation-engine.md     ← 4 models (collaborative/content-based/context-based/gap-filling); RRF fusion; 5 delivery scenarios
├── knowledge-synthesis/knowledge-synthesis-engine.md          ← 6 synthesis types; coherence pre-check; confidence propagation; DERIVED_FROM lineage
├── knowledge-synthesis/cross-domain-synthesis.md              ← 4 discovery methods; 4 templates; monthly pipeline; max 20 new cross-domain KUs/month
├── knowledge-synthesis/knowledge-distillation.md              ← 6 distillation types; 70-85% compression; coverage check >= 0.80; onboarding packages on registration
├── knowledge-synthesis/organizational-learning-engine.md      ← 5 learning dimensions; positive/negative signal taxonomy; 5 gap detection methods; 5 initiative types
├── knowledge-governance/knowledge-ownership-system.md         ← 4 roles (OWNER/STEWARD/DOMAIN_STEWARD/KGL); zero orphan target; daily orphan scan; capacity alerts
├── knowledge-governance/knowledge-accuracy-monitor.md         ← 5 signal categories; risk scoring 0.0–1.0; CRITICAL >= 0.76 → immediate; 3-day triage SLA
├── knowledge-governance/knowledge-compliance-system.md        ← 5 domains; 8 rules with CEL; portfolio compliance score; hash-chained audit trail; 3-year retention
└── knowledge-governance/knowledge-operations-dashboard.md     ← 11-panel ASCII console; 10-domain health matrix; operator actions; weekly/monthly/quarterly reports

ENTERPRISE AGENT INTELLIGENCE AND LEARNING ARCHITECTURE (v1.0.0)
├── agent-capabilities/agent-capability-model.md               ← 5-category taxonomy (COGNITIVE/DOMAIN/OPERATIONAL/INTERPERSONAL/GOVERNANCE); proficiency NONE→EXPERT; 6 evidence types
├── agent-capabilities/agent-skill-registry.md                 ← Skills implement capabilities; 8 categories; 10 core skills (SKILL-RET/ANL/EVL/GOV); tier_required per skill
├── agent-capabilities/agent-capability-assessment.md          ← 6 triggers; 4 methods; time-decay weighting; BENCHMARK 30-task scoring; 14-day challenge window
├── agent-capabilities/agent-capability-development.md         ← 5 development types; 6 activity types; 3 learning paths (GOVERNANCE_SPECIALIST/ORCHESTRATION_MASTER/RESEARCH_AUTHORITY)
├── agent-capabilities/agent-capability-governance.md          ← Two-factor (proficiency + authorization); 6 policies; GOVERNANCE expires annually; continuous usage monitoring
├── agent-performance/agent-performance-model.md               ← 5 dimensions: QUALITY 0.30, RELIABILITY 0.25, CALIBRATION 0.20, EFFICIENCY 0.15, LEARNING 0.10; hard caps
├── agent-performance/agent-performance-tracker.md             ← 12 signal types; 7d/30d/90d/all-time windows; 6 alert types; 1-year raw + 3-year snapshot retention
├── agent-performance/agent-performance-analytics.md           ← Individual trajectory; cohort analysis; org distribution; ARIMA 90d forecast; burnout risk score
├── agent-performance/agent-performance-benchmarks.md          ← Targets by agent type × tier; 5 benchmark scenarios; anti-gaming; Cohen's kappa >= 0.75
├── agent-performance/agent-performance-coach.md               ← 6 auto-triggers; root cause diagnosis; coaching plan; 3 formats; 4-level escalation path
├── agent-learning/agent-learning-model.md                     ← 5 types; DECLARATIVE 0.15/PROCEDURAL 0.10/CALIBRATION 0.20/BEHAVIORAL 0.08; max 0.30/event; decay 0.02/month
├── agent-learning/agent-feedback-integration.md               ← 5 types; credibility weights (HUMAN_EXPERT 0.90 → SELF 0.40); 5-step validation; 6 integration rules
├── agent-learning/agent-skill-acquisition.md                  ← 5 pathways; tier gates T1=none → T5=board; max 3 skills/month; quality gate before authorization
├── agent-learning/agent-behavioral-adaptation.md              ← 8 adaptable categories; 5 tracked events with bounds; VOLATILE → 14-day freeze; 90-day rollback window
├── agent-learning/agent-learning-governance.md                ← 6 principles; 5 authorization tiers; 5 prohibited patterns with detection; weekly/monthly/quarterly audits
├── agent-intelligence/agent-reasoning-engine.md               ← 6 protocols; CONSTITUTIONAL_EVALUATION_PROTOCOL locked (cannot be modified by learning); pre-output verification
├── agent-intelligence/agent-memory-system.md                  ← 3-tier (WORKING/EPISODIC/SEMANTIC); semantic sharing voluntary; right-to-forget on decommission
├── agent-intelligence/agent-confidence-calibration.md         ← calibration_error target < 0.10; ECE < 0.08; GREEN/YELLOW/ORANGE/RED states; domain restriction at 0.25
├── agent-intelligence/agent-intelligence-analytics.md         ← Individual/collective/growth analytics; compound intelligence model; 5 intelligence risk types
└── agent-intelligence/agent-intelligence-dashboard.md         ← 7-panel ASCII console; intelligence health score (5 components + hard penalties); 7 drill-downs; 60s refresh

ENTERPRISE MULTI-AGENT ORCHESTRATION AND COORDINATION (v1.0.0)
├── agent-registry/agent-registry-model.md                     ← Canonical agent record schema; 8 sections (identity/classification/capability_profile/routing/availability/performance_context/governance/metadata); 6 indexes; 7 agent states
├── agent-registry/agent-discovery-engine.md                   ← 8-step pipeline; discovery_fit_score (5 components); 4 discovery modes; TEAM_FORMATION mode; < 30ms PRECISE
├── agent-registry/agent-roster-management.md                  ← 7-step registration pipeline; deregistration + drain protocol; version management; monthly audit report
├── agent-registry/agent-health-monitor.md                     ← 30s heartbeat; 5-tier missed heartbeat handling; LIVENESS/READINESS/CAPABILITY_SPOT_CHECK probes; 4 health states
├── agent-registry/agent-registry-governance.md                ← Authorization matrix by delegation type; 7 policies; monthly + quarterly audit; access control by tier
├── orchestration-patterns/orchestration-pattern-catalog.md    ← 8 canonical patterns across 5 categories (HIERARCHICAL/PEER/PIPELINE/ENSEMBLE/DYNAMIC); selection decision tree
├── orchestration-patterns/hierarchical-orchestration.md       ← 3 roles (APEX/DOMAIN_COORDINATOR/WORKER); task decomposition protocol; status reporting; output integration; escalation path
├── orchestration-patterns/peer-coordination-protocols.md      ← 4 protocols: CONSENSUS_DELIBERATION (4 rounds)/ADVERSARIAL_REVIEW (4 phases)/VOTING_ENSEMBLE (3 phases)/STIGMERGIC
├── orchestration-patterns/dynamic-team-formation.md           ← 7-step formation; requirements analysis; role definition; composition validation; team contracting; disbanding audit
├── orchestration-patterns/orchestration-strategy-engine.md    ← Task classification (5 dimensions); pattern selection rule set; feasibility check; orchestration plan schema; approval gate
├── delegation-and-trust/delegation-model.md                   ← 4 delegation types; delegation_record schema; chain depth <= 4; full lifecycle; 6 governance policies
├── delegation-and-trust/trust-propagation-engine.md           ← 4 trust dimensions; trust score per domain; trust graph (directed weighted); propagation decay 0.10/hop; endorsements/warnings
├── delegation-and-trust/authority-transfer-protocol.md        ← 5 authority types; authority_transfer_record schema; 7-step protocol; autonomy_ceiling; non-bypassable escalation triggers
├── delegation-and-trust/inter-agent-contracts.md              ← 4 contract types; full contract schema; 5 breach remedies; 5 templates (CTR-001–005); 3-tier dispute resolution
├── delegation-and-trust/delegation-governance.md              ← 7 delegation policies; 3 governance roles; continuous + weekly + monthly + quarterly audit; violation investigation matrix
├── coordination-operations/work-distribution-engine.md        ← Work unit schema; assignment protocol with atomicity; 4-level priority queue; in-flight tracking; stall recovery < 10min
├── coordination-operations/inter-agent-messaging.md           ← 13 message types; message envelope with Ed25519 integrity; 4 routing modes; exactly-once for governance; no side channels
├── coordination-operations/conflict-resolution-engine.md      ← 7 conflict types; automated tier-1 (< 30s); arbiter tier-2 (5–30min SLA); governance tier-3; human tier-4; conflict_record schema
├── coordination-operations/orchestration-failure-recovery.md  ← 9 failure classes (F1–F9); per-class recovery protocols; MTTR target < 15min; cascade circuit breaker; governance recovery controls
└── coordination-operations/orchestration-operations-dashboard.md ← 7-panel ASCII console; orchestration health score (5 components + hard penalties); drill-downs; hourly/daily/weekly/monthly reports

ENTERPRISE KNOWLEDGE GOVERNANCE AND COMPLIANCE ARCHITECTURE (v1.0.0)
├── compliance-framework/compliance-model.md                      ← Core data model: 5 entity schemas (Obligation/Control/Evidence/Risk/Finding); canonical IDs; SHA-256 hash chain + Ed25519 signing
├── compliance-framework/regulatory-registry.md                   ← Regulation record schema; active catalog (GDPR/CCPA/HIPAA/ISO27001/SOC2/NIST/EU AI Act/ISO42001/IFRS/SOX); obligation extraction; framework crosswalk
├── compliance-framework/policy-management-system.md              ← 5-tier policy hierarchy; policy_record schema with traceability; 7-state lifecycle; 5 authoring standards; violation management
├── compliance-framework/control-catalog.md                       ← Control classification; 18 core controls across DATA_PRIVACY/INFORMATION_SECURITY/AI_GOVERNANCE/OPERATIONAL; evidence requirements per control
├── compliance-framework/compliance-taxonomy.md                   ← 8 compliance domains; risk taxonomy (5-point scales); finding severity SLAs; control effectiveness definitions; maturity model (LEVEL_1–5; target LEVEL_4)
├── risk-and-controls/enterprise-risk-register.md                 ← Active risk catalog (10 risks); RSK-AIGOV-001 CRITICAL score=20 (EU AI Act); KRI definitions; treatment tracking; quarterly review protocol
├── risk-and-controls/risk-assessment-engine.md                   ← QUALITATIVE_QUANTIFIED + scenario analysis; inherent risk scoring (likelihood × impact max-aggregation); residual computation with diminishing returns; challenge process
├── risk-and-controls/control-testing-engine.md                   ← 4 test types; 6 test methods (VERY_HIGH to LOW reliability); 5 evidence rules (RULE-ET-001–005); test scheduling; pre-audit 90-day trigger
├── risk-and-controls/control-effectiveness-monitor.md            ← 6 signal types; 5-state machine (EFFECTIVE→BYPASSED); thresholds per control; 5-min check for automated; FAILED/BYPASSED never suppressed
├── risk-and-controls/exception-management.md                     ← 4 exception types (max 12/6/30-day limits); authorization matrix by net risk; compensating control requirements; lifecycle; blanket exception cap = 3
├── audit-and-evidence/audit-management-system.md                 ← 5 audit types; audit_plan schema with independence_confirmed; 4-phase execution; audit_report with overall_compliance_opinion; 90-day pre-exam prep
├── audit-and-evidence/evidence-collection-engine.md              ← 5 automated collection methods; 5 manual evidence types; 5 validation checks; SHA-256 artifact_hash + Ed25519 signing; retention (AI gov: 10 years)
├── audit-and-evidence/finding-management.md                      ← Finding schema; severity SLAs (CRITICAL 24h plan/30d fix); generation rules; full lifecycle with independent verification; dispute process
├── audit-and-evidence/compliance-reporting-engine.md             ← Report taxonomy (5 types); 10 report modules; 5 standard reports; compliance score formula; distribution with access control
├── audit-and-evidence/audit-trail-governance.md                  ← SHA-256 hash chain; Ed25519 per-event signing; action type registry (40+ action types); access control (audit of audit); 7-year default retention
├── governance-operations/compliance-operations-dashboard.md      ← 7-panel live ASCII console; Panel computation rules; dashboard alerts with escalation; 4 role-specific views (ops/domain/management/executive)
├── governance-operations/regulatory-change-management.md         ← 5 detection sources; regulatory_change_record schema; 6-step impact assessment; response SLAs by rating; horizon scanning (IMMINENT/EMERGING/DEVELOPING)
├── governance-operations/compliance-incident-management.md       ← Incident definition vs. finding; severity (CRITICAL 30min/HIGH 2h response); regulatory notification protocol (GDPR 72h/NIS2 24h); 3 response playbooks; post-incident review
├── governance-operations/third-party-risk-management.md          ← 6 vendor types (CRITICAL/DATA_PROCESSOR/AI_PROVIDER); vendor_record schema; 5-dimension assessment protocol; DPA requirements; continuous monitoring; offboarding
└── governance-operations/governance-executive-reporting.md       ← 4 governance audiences; board compliance briefing (10 sections); monthly executive summary; annual program report (10 sections); governance escalation triggers

ENTERPRISE POLICY-AS-CODE ARCHITECTURE (v1.0.0)
├── policy-as-code/policy-engine.md                              ← Core evaluation runtime; DENY_OVERRIDES combination; ALLOW/DENY/REQUIRE_APPROVAL/ALLOW_WITH_CONDITIONS verdicts; Ed25519 signed decisions; p99 < 20ms hot path
├── policy-as-code/policy-language.md                           ← Policy Definition Language (PDL); rule schema; condition expression language; 40+ reference fields; function calls; version protocol; 3 full policy examples
├── policy-as-code/policy-registry.md                           ← Versioned policy store; discovery API; activation governance by category; Ed25519 signed approvals; SHA-256 hash chain; review cycle management
├── policy-as-code/policy-compiler.md                           ← PDL → optimized evaluation tree; 6 optimization passes (dead rule elimination, hard-deny promotion, condition hoisting, specificity ordering, constant folding, function caching); compiled policy cache 300s TTL
├── policy-as-code/policy-testing-framework.md                  ← Unit/scenario/edge-case/conflict/regression/security test types; coverage requirements (CONSTITUTIONAL=100%; REGULATORY=95%); HARD_DENY adversarial battery; quality gate blocks activation on test failure
├── runtime-policies/orchestration-runtime-policies.md          ← 7 policies: delegation chain depth (max 4 hops), governance-requires-human (POLICY-DG-003), tier authority for patterns, task assignment trust thresholds, escalation suppression forbidden, arbiter tier, reassignment authority
├── runtime-policies/resource-allocation-policies.md            ← 5 policies: governance critical reservation (20% reserved pool), context budget enforcement (T1 = 50K tokens), tool call rate limiting, worker pool fairness (40% org cap), memory quotas; 3 resource pools
├── runtime-policies/security-runtime-policies.md               ← 6 policies evaluated in order: injection detection first (POL-SEC-006), ephemeral permission enforcement, data classification ceiling (TOP_SECRET=T5-only), config change authorization, maintenance window, trust manipulation hard deny
├── runtime-policies/data-governance-policies.md                ← 6 policies: mandatory classification (special category=hard deny), purpose limitation, cross-border transfer restriction (SCCs required), retention enforcement, DSR SLA escalation, consent verification
├── runtime-policies/ai-governance-runtime-policies.md          ← 6 policies: EU AI Act prohibited practices (5 types, all hard deny, constitutional priority=1), conformity assessment required for HIGH_RISK, human oversight enforcement (human review bypass = hard deny), transparency disclosure, risk reclassification governance, calibration threshold enforcement
├── orchestration-constraints/constraint-model.md               ← 7 constraint types (AUTHORITY/CAPACITY/TIMING/DEPENDENCY/COMPLIANCE/GOVERNANCE/ISOLATION); constraint record schema; precedence rules (constitutional=1 to capacity=8); standard constraint library (8 canonical constraints)
├── orchestration-constraints/constraint-solver.md              ← 9-step solver pipeline; 6 evaluation modules (authority/capacity/timing/dependency/compliance/governance/isolation); capacity reservation protocol; alternative suggestion engine; p99 < 80ms; DENY_BY_DEFAULT on uncertainty
├── orchestration-constraints/risk-aware-router.md              ← Task risk profile (5-step determination + type multipliers); risk-adjusted candidate scoring (+/-adjustments); domain risk routing rules (CRITICAL domain, FAILED control, AT_RISK KRI, pre-exam mode); STANDARD/ENHANCED/INTENSIVE monitoring directives
├── orchestration-constraints/approval-constraint-engine.md     ← Approval request lifecycle; quorum evaluation with edge cases; SLAs (CRITICAL=1h, HIGH=4h, MEDIUM=24h); emergency bypass protocol (T4+, 30-min token, post-review 24h); Ed25519 signed approval records
├── orchestration-constraints/policy-feasibility-checker.md     ← Combined policy + constraint + risk-routing gate; cryptographic execution tokens (SHA-256 action hash + Ed25519 + valid_until); 5-verdict schema; multi-step workflow feasibility; batch feasibility; p99 < 120ms
├── governance-policies/policy-lineage-tracker.md               ← Complete provenance: obligation derivation, authorship chain, version history, derivation tree; lineage query API (trace decision → rule → policy → obligation → regulation); completeness scoring (< 0.60 = INADEQUATE)
├── governance-policies/policy-replay-engine.md                 ← Policy state reconstruction at any historical timestamp; context reconstruction with approximation disclosure; discrepancy classification (EXACT_MATCH/VERDICT_DIFFERENT_SAME_POLICY=CRITICAL); compliance window replay; verification rate target >= 99.5%
├── governance-policies/governance-traceability.md              ← End-to-end chain: action → execution token → policy decision → rule → policy → obligation → regulation; automated generation within 5s of audit event; coverage analysis (100% target for WRITE/EXECUTE/CONFIGURE); regulatory traceability reports (GDPR Art.30, EU AI Act Art.12, SOC2 CC7)
├── governance-policies/immutable-policy-audit.md               ← Policy-specific SHA-256 hash chain + Ed25519 per-record signing; daily segment anchoring to external timestamp authority (RFC 3161); 8 supported audit queries; pre-filing verification checklist; 10-year retention for CONSTITUTIONAL/AI_GOVERNANCE
└── governance-policies/policy-impact-analyzer.md               ← Decision divergence analysis (NEW_DENY/NEW_ALLOW/HARD_DENY_INTRODUCED classified by risk); workflow impact (approval saturation detection); coverage gap analysis; conflict detection (DIRECT_CONFLICT blocks); impact report with activation gate; phased activation option

ENTERPRISE KNOWLEDGE GRAPH SYSTEM (v1.0.0)
├── knowledge-graph-core/entity-registry.md                     ← Canonical entity registry: entity types, identity resolution, deduplication
├── knowledge-graph-core/relationship-schema.md                 ← Relationship type catalog; directed/undirected; strength scoring; temporal validity
├── knowledge-graph-core/graph-schema.md                        ← Full graph schema: node types, edge types, property definitions, constraints
├── knowledge-graph-core/entity-resolution.md                   ← Entity deduplication: blocking, candidate generation, similarity scoring, merge protocol
├── knowledge-graph-core/knowledge-types.md                     ← Taxonomy of knowledge node types across 8 enterprise domains
├── knowledge-graph-core/ontology-mapping.md                    ← Mapping between ontology/core-concepts.md and graph node/edge types
├── graph-cognition/graph-cognition-engine.md                   ← Cognitive graph interface: query, traverse, reason over the enterprise knowledge graph
├── graph-cognition/graph-schema.md                             ← Cognition-layer schema: inference nodes, reasoning paths, confidence propagation
├── graph-cognition/graph-storage-model.md                      ← Storage model: adjacency lists, property stores, index structures
├── graph-cognition/graph-query-language.md                     ← Graph query language: traversal syntax, path expressions, aggregation
├── graph-cognition/graph-index-manager.md                      ← Index lifecycle: creation, maintenance, refresh schedules, cache invalidation
├── graph-ingestion/ingestion-pipeline.md                       ← Master ingestion coordinator: source routing, dedup, validation, merge
├── graph-ingestion/artifact-extractor.md                       ← Extracts entities and relationships from OS artifacts
├── graph-ingestion/wiki-extractor.md                           ← Extracts structured knowledge from wiki pages
├── graph-ingestion/decision-extractor.md                       ← Extracts decision nodes and rationale chains from ADRs and decision logs
├── graph-ingestion/workflow-extractor.md                       ← Extracts workflow dependency and capability graphs
├── graph-ingestion/agent-extractor.md                          ← Extracts agent capability and collaboration relationship graphs
├── graph-ingestion/event-stream-consumer.md                    ← Real-time entity/relationship extraction from enterprise event bus
├── graph-memory/graph-memory-model.md                          ← Graph memory model: episodic, semantic, and relational memory layers
├── graph-memory/relationship-memory.md                         ← Persistent relationship memory: strength decay, recency weighting
├── graph-memory/graph-retrieval-engine.md                      ← Graph-augmented retrieval: context enrichment via graph traversal
├── graph-memory/entity-relationship-system.md                  ← Entity-relationship storage: canonical store with versioning
├── graph-memory/semantic-graph-traversal.md                    ← Semantic traversal: follow meaning, not just edges; analogical paths
├── graph-models/schema-registry.md                             ← Graph schema version registry; schema evolution; migration protocols
├── graph-models/enterprise-cognition-graph.md                  ← Master enterprise cognition graph: all node/edge types in production
├── graph-models/organizational-intelligence-graph.md           ← Org intelligence subgraph: agent capability, team knowledge, expertise maps
├── graph-models/dependency-graph.md                            ← Dependency subgraph: artifact, workflow, agent, integration dependencies
├── graph-observability/graph-health-monitor.md                 ← Graph health: node count growth, edge density, orphan detection, consistency
├── graph-observability/coverage-analyzer.md                    ← Knowledge coverage: which domains are well-represented vs. sparse
├── graph-observability/staleness-detector.md                   ← Node staleness: time since last update; triggers re-ingestion
├── graph-observability/integrity-validator.md                  ← Graph integrity: referential integrity, schema compliance, cycle detection
├── graph-observability/knowledge-gap-detector.md               ← Detects missing expected nodes/relationships; routes to knowledge-capture
├── graph-query-engine/query-interface.md                       ← Query API: structured queries, natural language queries, pattern matching
├── graph-query-engine/traversal-engine.md                      ← BFS/DFS/Dijkstra traversal with predicate filtering
├── graph-query-engine/path-finder.md                           ← Shortest path, all-paths, weighted path algorithms
├── graph-query-engine/semantic-search.md                       ← Semantic node search: embedding similarity + graph structure fusion
├── graph-query-engine/graph-analytics.md                       ← PageRank, centrality, community detection, influence scoring
├── graph-query-engine/query-cache.md                           ← Query result cache: TTL by query type, invalidation on graph mutation
├── graph-routing/graph-traversal-router.md                     ← Routes tasks through capability and knowledge graphs
├── graph-routing/semantic-path-finder.md                       ← Finds semantic paths between concepts for reasoning chains
├── graph-routing/multi-hop-router.md                           ← Multi-hop agent routing via graph relationship chains
├── graph-routing/graph-memory-router.md                        ← Routes memory retrieval requests through graph structure
├── graph-routing/delegation-graph-router.md                    ← Delegation chain routing using trust and capability graphs
├── knowledge-inference/inference-engine.md                     ← Derives new knowledge from graph patterns and logical rules
├── knowledge-inference/inference-rules.md                      ← Rule catalog: transitivity, inheritance, analogy, anti-patterns
├── knowledge-inference/derived-relationships.md                ← Derived relationship store: inferred edges with confidence + lineage
├── knowledge-inference/contradiction-detector.md               ← Detects contradictions between graph claims; routes to resolution
├── knowledge-inference/knowledge-synthesizer.md                ← Synthesizes multi-hop inference chains into summary knowledge units
├── temporal-knowledge-graphs/temporal-graph-model.md           ← Temporal graph: valid_from/valid_until on all edges and nodes
├── temporal-knowledge-graphs/relationship-evolution.md         ← Tracks how relationships change strength/type over time
├── temporal-knowledge-graphs/historical-truth-system.md        ← Point-in-time graph reconstruction; historical query support
├── temporal-knowledge-graphs/organizational-memory-evolution.md ← Tracks org knowledge growth, decay, and transformation over time
├── temporal-knowledge-graphs/runtime-state-graph.md            ← Live runtime state captured as temporal graph nodes
├── cognition-indexes/master-cognition-index.md                 ← Master index of all cognitive subsystems and their graph interfaces
├── cognition-indexes/agent-cognition-index.md                  ← Per-agent cognitive access patterns and preferred graph paths
├── cognition-indexes/knowledge-synthesis-index.md              ← Index of synthesized cross-domain knowledge clusters
├── cognition-indexes/semantic-clusters/governance-cluster.md   ← Governance domain semantic cluster
├── cognition-indexes/semantic-clusters/engineering-cluster.md  ← Engineering domain semantic cluster
├── cognition-indexes/semantic-clusters/product-cluster.md      ← Product domain semantic cluster
├── cognition-indexes/semantic-clusters/security-cluster.md     ← Security domain semantic cluster
├── cognition-indexes/semantic-clusters/integration-cluster.md  ← Integration domain semantic cluster
└── cognition-indexes/semantic-clusters/ai-native-cluster.md    ← AI-native domain semantic cluster

ADAPTIVE ORCHESTRATION SYSTEM (v1.0.0)
├── adaptive-orchestration/README.md                            ← Adaptive orchestration overview and entry points
├── adaptive-orchestration/topology-manager.md                  ← Dynamic topology management: org shape, routing, team formation
├── adaptive-orchestration/autonomous-coordinator.md            ← Autonomous multi-agent coordination controller
├── adaptive-orchestration/coordination-hierarchy.md            ← Adaptive hierarchy: restructures based on workload and capability signals
├── adaptive-orchestration/operational-continuity.md            ← Continuity under topology changes: no workflow interruption on restructure
├── organizational-synchronization/README.md                    ← Org sync overview
├── organizational-synchronization/synchronization-protocol.md  ← Distributed org state synchronization protocol
├── organizational-synchronization/coordination-hierarchy.md    ← Hierarchical coordination during org sync operations
├── organizational-synchronization/distributed-coordination.md  ← Distributed coordination across org boundaries
├── organizational-synchronization/operational-continuity.md    ← Ensures ops continuity during synchronization events
├── organizational-synchronization/cross-org-coordinator.md     ← Cross-org workflow and artifact coordination
├── organizational-synchronization/distributed-state-sync.md    ← Distributed state sync: CRDT-based eventual consistency
├── organizational-synchronization/workflow-synchronizer.md     ← Syncs workflow state across distributed execution environments
├── organizational-synchronization/execution-continuity.md      ← Maintains execution continuity during org topology changes
├── coordination-runtime/README.md                              ← Coordination runtime overview
├── coordination-runtime/coordination-engine.md                 ← Core coordination runtime: dispatch, monitor, state
├── coordination-runtime/dispatch-coordinator.md                ← Task dispatch with capability routing and load balancing
├── coordination-runtime/execution-monitor.md                   ← Real-time execution monitoring and anomaly detection
├── coordination-runtime/coordination-protocols.md              ← Coordination protocol library: sync/async/negotiation
├── coordination-runtime/state-machine.md                       ← Coordination state machine: lifecycle transitions
├── coordination-runtime/event-bus.md                           ← Coordination-layer event bus: local routing and fan-out
├── coordination-runtime/health-monitor.md                      ← Coordination health monitoring and recovery
├── coordination-runtime/model-tier-router.md                   ← Routes to appropriate model tier based on task complexity
├── coordination-runtime/memory-coordinator.md                  ← Coordinates memory access across agents in a coordination session
├── enterprise-topology/org-relationship-graph.md               ← Live org relationship graph: reporting, collaboration, delegation
├── enterprise-topology/dependency-graph.md                     ← Enterprise dependency graph: system, workflow, artifact dependencies
├── enterprise-topology/workflow-topology-graph.md              ← Workflow topology: execution graph with flow relationships
├── enterprise-topology/integration-graph.md                    ← Integration topology: connector relationships and data flows
├── enterprise-topology/runtime-topology-tracker.md             ← Tracks topology changes in real-time; detects drift
├── consensus-frameworks/README.md                              ← Consensus framework overview
├── consensus-frameworks/consensus-engine.md                    ← Master consensus coordinator: selects and runs protocols
├── consensus-frameworks/voting-protocols.md                    ← Voting: plurality, supermajority, ranked-choice protocols
├── consensus-frameworks/multi-perspective-debate.md            ← Structured debate: adversarial review with multiple viewpoints
├── consensus-frameworks/byzantine-consensus.md                 ← Byzantine fault-tolerant consensus for critical decisions
├── consensus-frameworks/quorum-manager.md                      ← Quorum management: size, composition, tie-breaking rules
├── consensus-frameworks/disagreement-resolution.md             ← Systematic disagreement resolution: classify, escalate, mediate
├── consensus-frameworks/confidence-scoring.md                  ← Aggregate confidence from multi-agent consensus outcomes
├── memory-routing/README.md                                    ← Memory routing overview
├── memory-routing/context-routing-engine.md                    ← Routes context to agents based on relevance and role
├── memory-routing/context-prioritization.md                    ← Prioritizes context elements by relevance, recency, importance
├── memory-routing/organizational-context-federation.md         ← Federates org-wide context across agent boundaries
├── memory-routing/active-context-routing.md                    ← Active context routing: real-time relevance-based delivery
├── memory-routing/runtime-context-synchronization.md           ← Synchronizes context across runtime execution sessions
├── memory-governance/README.md                                  ← Memory governance overview
├── memory-governance/federated-memory-architecture.md          ← Federated memory: org-shared vs. agent-private boundaries
├── memory-governance/continuity-checkpoint-system.md           ← Memory checkpointing for cross-session continuity
├── memory-governance/context-compression-protocol.md           ← Compresses context when approaching budget limits
└── memory-governance/long-context-preservation.md              ← Preserves essential context across long-running workflows

GOVERNANCE OPERATIONS SYSTEM (v1.0.0)
├── governance-queues/confidence-threshold-system.md            ← Confidence-gated routing: routes low-confidence outputs to review
├── governance-queues/low-confidence-routing.md                 ← Routes outputs below confidence thresholds to human review queues
├── governance-queues/policy-exception-routing.md               ← Routes policy exceptions to appropriate approval queues
├── governance-queues/governance-triggered-reviews.md           ← Governance events that trigger mandatory review (15 trigger types)
├── governance-queues/queue-priority-engine.md                  ← Priority engine: SLA-based queue ordering and escalation
├── human-review/approval-queue-system.md                       ← Multi-tier approval queue: intake, assignment, SLA tracking
├── human-review/escalation-queue-system.md                     ← Escalation queue: SLA countdown, re-escalation, resolution
├── human-review/exception-review-queue.md                      ← Exception review: policy exceptions awaiting authorization
├── human-review/review-interface-standards.md                  ← Standards for presenting work for human review (format, context)
├── human-review/review-assignment-engine.md                    ← Assigns reviews to reviewers by tier, expertise, availability
├── approval-operations/approval-workflow-engine.md             ← End-to-end approval workflow: intake → review → decision → notify
├── approval-operations/collaborative-decision-system.md        ← Multi-reviewer collaborative decisions with structured deliberation
├── approval-operations/override-governance-system.md           ← Override governance: authorization, audit, post-review requirements
├── approval-operations/approval-analytics.md                   ← Approval pipeline analytics: SLA compliance, reviewer load, patterns
├── approval-operations/review-observability-console.md         ← Live review pipeline console: queue depth, SLA status, reviewer load
├── risk-aware-routing/README.md                                 ← Risk-aware routing overview
├── risk-aware-routing/risk-classifier.md                       ← Classifies task and workflow risk level (5 dimensions)
├── risk-aware-routing/governance-gate-engine.md                ← Applies governance gates based on risk classification
├── risk-aware-routing/risk-router.md                           ← Routes high-risk workflows to enhanced review paths
├── risk-aware-routing/governance-delegate.md                   ← Delegates governance actions to appropriate agents/tiers
├── risk-aware-routing/escalation-thresholds.md                 ← Escalation threshold definitions by risk class and domain
├── risk-aware-routing/approval-coordinator.md                  ← Coordinates approval workflows for risk-flagged executions
├── operational-review/review-sla-monitor.md                    ← Monitors review SLA compliance across all review types
├── operational-review/review-latency-dashboard.md              ← Review latency dashboard: p50/p95/p99 by review type
├── operational-review/escalation-bottleneck-analyzer.md        ← Identifies escalation bottlenecks and recommends relief
├── operational-review/governance-throughput-metrics.md         ← Governance pipeline throughput: decisions/hour by tier
└── operational-review/operational-health-console.md            ← Operational health: governance pipeline status and SLA health

ENTERPRISE SELF-OPTIMIZATION AND CONTINUOUS IMPROVEMENT ARCHITECTURE (v1.0.0)
├── optimization-engine/self-optimization-controller.md         ← Master optimization controller: signal collection, opportunity detection, planning, application; auto-rollback on regression
├── optimization-engine/workflow-optimizer.md                   ← Learns optimal workflow patterns: parallelization, gate tuning, pre-warming, context pruning
├── optimization-engine/routing-optimizer.md                    ← Improves agent selection: fit model learning, routing experiments, load balancing, A/B routing
├── optimization-engine/policy-optimizer.md                     ← Tunes policy thresholds within bounds: approval rate analysis, false-positive reduction; never touches constitutional rules
├── optimization-engine/optimization-registry.md                ← Authoritative optimization catalog: all proposed/active/historical optimizations with rollback index
├── performance-learning/execution-pattern-miner.md             ← Mines execution history: latency patterns, failure patterns, resource patterns; real-time + scheduled mining
├── performance-learning/performance-feedback-loop.md           ← Captures post-execution signals (8 types, weighted); routes to learning models; exactly-once dedup
├── performance-learning/bottleneck-learning-engine.md          ← Learns 8 bottleneck classes; builds onset predictors; generates mitigation playbooks; 10-30min prediction horizon
├── performance-learning/agent-assignment-optimizer.md          ← Per-agent/task-type fit profiles; confidence bands; specialty discovery; shadow assignment experiments
├── performance-learning/efficiency-benchmark-tracker.md        ← 10-dimension efficiency tracking; rolling baselines; improvement attribution; regression alerts at -5%/-15%
├── resource-intelligence/token-budget-manager.md               ← Token budget allocation by tier/workflow/step; real-time consumption tracking; budget extension protocol
├── resource-intelligence/cost-allocation-engine.md             ← Attributes costs to team/project/feature; daily/monthly reports; over-budget auto-throttle at 95%
├── resource-intelligence/resource-efficiency-scorer.md         ← Workflow + agent efficiency scores; waste detection (6 categories); efficiency leaderboard
├── resource-intelligence/predictive-resource-planner.md        ← Demand forecasting (1hr/24hr/sprint horizons); capacity reservation; budget pre-allocation
├── resource-intelligence/cost-optimization-advisor.md          ← Cost reduction recommendations (5 categories); ROI-ranked; auto-implementable flag
├── improvement-governance/improvement-proposal-engine.md       ← Generates structured proposals; authorization path routing (AUTO to T5); conflict detection
├── improvement-governance/change-safety-validator.md           ← 6-check validation pipeline: constitutional → regulatory → blast radius → conflicts → rollback → stability
├── improvement-governance/improvement-authorization.md         ← Authorization matrix (AUTO to T5 board); SLA-enforced queue; emergency override protocol
├── improvement-governance/improvement-impact-tracker.md        ← Pre/post impact measurement; causal attribution; estimation accuracy calibration; monthly summary
└── improvement-governance/continuous-improvement-dashboard.md  ← Live console: efficiency index, cost, pipeline health, pending approvals, trend charts, bottleneck alerts
```

SELF-OPTIMIZATION PERSISTENCE (initialized)
├── memory/optimization-engine/optimization-registry.yaml       ← Active optimization catalog with status + rollback points
├── memory/optimization-engine/optimization-log.jsonl           ← Append-only optimization event history
├── memory/optimization-engine/routing-model.yaml               ← Learned agent fit scores + active A/B experiments
├── memory/optimization-engine/workflow-optimizations.yaml      ← Workflow optimization proposals and activation state
├── memory/performance-learning/detected-patterns.yaml          ← Currently active detected patterns
├── memory/performance-learning/pattern-history.jsonl           ← Append-only pattern detection history
├── memory/performance-learning/feedback-signals.jsonl          ← Append-only feedback signal log (30-day retention)
├── memory/performance-learning/feedback-loop-health.yaml       ← Feedback loop health metrics
├── memory/performance-learning/bottleneck-models.yaml          ← Learned bottleneck onset models and playbooks
├── memory/performance-learning/bottleneck-history.jsonl        ← Append-only bottleneck event history
├── memory/performance-learning/assignment-profiles.yaml        ← Agent/task-type performance profiles
├── memory/performance-learning/specialty-discoveries.yaml      ← Undeclared specialty discoveries
├── memory/performance-learning/efficiency-benchmarks.yaml      ← Rolling efficiency benchmark state
├── memory/performance-learning/benchmark-snapshots.jsonl       ← Append-only daily benchmark snapshots
├── memory/resource-intelligence/budget-state.yaml              ← Live token budget ledger
├── memory/resource-intelligence/cost-tracker.jsonl             ← Append-only cost log
├── memory/resource-intelligence/cost-allocation.yaml           ← Current period cost allocations by cost center
├── memory/resource-intelligence/cost-history.jsonl             ← Append-only cost history
├── memory/resource-intelligence/efficiency-scores.yaml         ← Current efficiency scores by workflow/agent
├── memory/resource-intelligence/waste-detection-log.jsonl      ← Append-only waste detection events
├── memory/resource-intelligence/demand-forecasts.yaml          ← Active demand forecasts (1hr/24hr/sprint)
├── memory/resource-intelligence/forecast-accuracy.yaml         ← Forecast accuracy calibration state
├── memory/resource-intelligence/optimization-recommendations.yaml ← Open cost optimization recommendations
├── memory/improvement-governance/proposals.yaml                ← Active improvement proposals
├── memory/improvement-governance/proposal-history.jsonl        ← Append-only proposal history
├── memory/improvement-governance/validation-records.yaml       ← Safety validation records
├── memory/improvement-governance/auth-queue.yaml               ← Pending authorization queue
├── memory/improvement-governance/auth-decisions.jsonl          ← Append-only authorization decisions
├── memory/improvement-governance/impact-records.yaml           ← Optimization impact measurement records
├── memory/improvement-governance/calibration-stats.yaml        ← Estimation accuracy calibration
├── memory/improvement-governance/impact-history.jsonl          ← Append-only impact history
└── memory/improvement-governance/dashboard-state.yaml          ← Live dashboard state

ENTERPRISE GOVERNANCE, TRUST, AND SECURITY ARCHITECTURE (v1.0.0)

PERMISSIONS
├── permissions/access-boundary-model.md                         ← 6 access zones (Z0–Z5); data classification levels (PUBLIC→TOP_SECRET); zone crossing rules; enforcement points; per-event audit trail
├── permissions/workflow-permission-system.md                    ← 8 workflow permission classes; HITL gates: executive approval (T5), architecture approval (T4), compliance approval (DPO/CISO), release approval; delegation matrix
├── permissions/connector-permission-registry.md                 ← Per-connector permission records: PII access, classification ceiling, rate limits, tier required; anomaly detection; invocation enforcement
├── permissions/production-safety-system.md                      ← 9-tier production access matrix; 6-step release approval workflow (QA→Security→Architecture→Executive→Deploy); always-active guardrails; canary rollout
└── permissions/sensitive-workflow-controls.md                   ← 8 sensitive workflow categories; ENHANCED/STRICT/MAXIMUM control levels; PII handling rules; EU AI Act HIGH_RISK controls

OBSERVABILITY HUBS (unified aggregation layer)
├── observability/workflow-health-hub.md                         ← Composite health score (operational×0.35 + governance×0.30 + orchestration×0.20 + efficiency×0.15); HEALTHY/DEGRADED/IMPAIRED/CRITICAL bands; alert routing
├── observability/orchestration-telemetry-hub.md                 ← Routing accuracy, delegation depth, handoff quality, trust score distribution; authority violation = immediate CRITICAL; event bus topic: enterprise.orchestration.telemetry
├── observability/governance-telemetry-hub.md                    ← Constitutional clearance, attestation coverage, approval chain p50/p95, compliance score; 4 hard-cap CRITICAL conditions; topic: enterprise.governance.telemetry
├── observability/runtime-telemetry-hub.md                       ← Worker utilization, queue depth, error rate, context budget, tool call rate; execution_health composite; heatmap feeds; topic: enterprise.runtime.telemetry
└── observability/organizational-telemetry-hub.md                ← Agent utilization, escalation rate, decision velocity, wiki freshness, capability gaps; org_health composite; weekly org health report; topic: enterprise.org.telemetry

TRUST + ALIGNMENT
├── trust/workflow-confidence-framework.md                       ← 5-dimension confidence scoring (evidence×0.30, reasoning×0.25, source×0.20, calibration×0.15, complexity×0.10); VERY_HIGH→VERY_LOW tiers; disqualifiers hard-cap 0.20
├── trust/hallucination-detection-system.md                      ← 5-signal detection (factual unsupported, phantom citations, numerical implausibility, contradiction, entity confusion); NONE/LOW/MEDIUM/HIGH/CRITICAL bands; CRITICAL = block + T3 alert
├── trust/reliability-scoring-system.md                          ← Agent reliability: success×0.35 + consistency×0.25 + escalation_avoidance×0.20 + calibration×0.15 + SLA×0.05; EXEMPLARY/TRUSTED/ACCEPTABLE/UNRELIABLE bands
├── trust/explainability-engine.md                               ← 8 explanation types; reasoning chain with evidence per step; alternatives considered; EU AI Act Art.13 transparency compliance; 10yr retention for HIGH_RISK
└── trust/constitutional-alignment-system.md                     ← Per-principle compliance rates (target >= 0.99); constitutional_health = min(all principles); drift detection (0.01/week threshold); monthly alignment report to T5+board

EVALUATION
├── evaluation/evaluation-framework.md                           ← 10 universal dimensions; STANDARD (automated) vs. DEEP (consequential) protocols; pass thresholds by class (STANDARD 0.70→CONSTITUTIONAL 0.95); retry-with-correction
├── evaluation/workflow-output-evaluator.md                      ← Task-specific rubrics: PRD, ADR, compliance report, incident report; targeted correction prompts on gate fail; outcome feeds performance-feedback-loop
├── evaluation/agent-performance-evaluator.md                    ← Task quality + behavioral quality dimensions; constitutional_adherence hard requirement; peer evaluation (T3+, 30d, Cohen's kappa >= 0.75); coaching routing triggers
├── evaluation/governance-decision-evaluator.md                  ← Policy verdict quality, approval accuracy, finding calibration; systematic failure detection (override>0.20, regret>0.10); monthly governance quality report
└── evaluation/evaluation-dashboard.md                           ← 7-panel live console; constitutional violations 0-threshold; hallucination event tracking; agent quality heatmap; 5 drill-downs; 60s live refresh

GOVERNANCE EVOLUTION (SELF-HEALING)
├── governance-evolution/governance-optimizer.md                 ← 5 inefficiency patterns: over-triggering, queue saturation, redundant controls, SLA mismatch, calibration drift; proposals with protection_preserved field; never removes gates
├── governance-evolution/policy-evolution-engine.md              ← 7 change triggers; 4-phase protocol (assess→draft+test→approve→activate); approval matrix T3→T5+board by change type; phased activation; 30d post-change monitoring
├── governance-evolution/adaptive-governance-controller.md       ← 5 intensity levels (RELAXED/STANDARD/HEIGHTENED/STRICT/EMERGENCY); trigger/de-escalation rules; per-level control config; EMERGENCY = board notification; constitutional protections never reduced
├── governance-evolution/governance-bottleneck-resolver.md       ← 7 bottleneck types; 4 resolution strategies (redistribution, batching, simplification, capacity alert); root cause classification; recurrence tracking → structural fix trigger
└── governance-evolution/governance-evolution-dashboard.md       ← 7-panel console: health, constitutional alignment, policy pipeline, adaptive state, bottlenecks, optimization proposals, quality trends; weekly/monthly/quarterly reports

GOVERNANCE, TRUST, SECURITY PERSISTENCE (initialized)
├── memory/permissions/workflow-permission-state.yaml            ← Active permission sessions + pending approval queues
├── memory/permissions/connector-permission-registry.yaml        ← Connector permission profiles + anomaly events
├── memory/permissions/production-sessions.yaml                  ← Active production sessions
├── memory/permissions/release-approvals.jsonl                   ← Release approval records (append-only)
├── memory/permissions/production-guardrail-events.jsonl         ← Production guardrail trigger events (append-only)
├── memory/permissions/sensitive-workflow-log.jsonl              ← Sensitive workflow audit log (append-only)
├── memory/trust/confidence-records.yaml                         ← Per-output confidence records index
├── memory/trust/hallucination-events.jsonl                      ← Hallucination detection events (append-only)
├── memory/trust/hallucination-detection-stats.yaml              ← Detection accuracy statistics
├── memory/trust/reliability-scores.yaml                         ← Agent + workflow reliability scores
├── memory/trust/reliability-history.jsonl                       ← Reliability score history (append-only)
├── memory/trust/constitutional-alignment.yaml                   ← Per-principle compliance rates + drift state
├── memory/trust/violation-log.jsonl                             ← Constitutional violation log (append-only)
├── memory/evaluation/evaluation-records.yaml                    ← Evaluation record index
├── memory/evaluation/gate-verdicts.jsonl                        ← Gate verdict log (append-only)
├── memory/evaluation/agent-evaluations.yaml                     ← Agent evaluation records index
├── memory/evaluation/governance-evaluations.yaml                ← Governance decision evaluation records
├── memory/evaluation/dashboard-state.yaml                       ← Live evaluation dashboard state
├── memory/governance-evolution/optimization-proposals.yaml      ← Active governance optimization proposals
├── memory/governance-evolution/policy-evolution-log.jsonl       ← Policy change history (append-only)
├── memory/governance-evolution/pending-policy-changes.yaml      ← In-flight policy evolution work
├── memory/governance-evolution/governance-intensity.yaml        ← Current adaptive governance level + history
├── memory/governance-evolution/intensity-transitions.jsonl      ← Intensity level transition log (append-only)
├── memory/governance-evolution/bottleneck-events.jsonl          ← Bottleneck event history (append-only)
└── memory/governance-evolution/resolution-playbooks.yaml        ← Learned bottleneck resolution playbooks
```

---

## ENTERPRISE ORGANIZATIONAL INTELLIGENCE AND TEAM COGNITION (v23.0.0)

TEAM INTELLIGENCE (per-team performance, velocity, capacity, health)
├── team-intelligence/team-performance-model.md                   ← 7 dimensions (delivery×0.25, quality×0.20, governance×0.15, collaboration×0.15, knowledge×0.10, velocity_stability×0.10, agent_leverage×0.05); EXEMPLARY→AT_RISK tiers; 90d rolling baseline; peer group benchmarking
├── team-intelligence/work-analytics-engine.md                    ← Throughput + cycle time + WIP + interruption analytics; planned_ratio target ≥0.70; aging/stale/blocked item detection; interrupt cost quantification; 4hr BLOCKED auto-alert
├── team-intelligence/velocity-intelligence-engine.md             ← 5 pattern types (GROWTH/DECLINE/PLATEAU/COLLAPSE/CHRONIC_MISS); weighted moving average forecast; sustainable_velocity commitment guidance; carry-over rate target < 0.10
├── team-intelligence/capacity-intelligence-engine.md             ← Gross→net capacity model; 4-stage ramp (20%→50%→75%→100% over 17 weeks); interrupt reserve; backlog burn rate; quarterly forecast
└── team-intelligence/team-health-scorer.md                       ← 7 health dimensions; THRIVING→CRITICAL tiers; 5 early warning patterns; health data never shared across teams; DISTRESSED→automatic T3 coaching scheduling

ORG INTELLIGENCE (org-wide performance, coordination, dependencies)
├── org-intelligence/org-performance-model.md                     ← 7 dimensions; EXCELLENT→CRITICAL org tiers; DORA metrics (ELITE/HIGH/MEDIUM/LOW bands); monthly + quarterly + board-level reports
├── org-intelligence/cross-team-coordination-engine.md            ← Coupling matrix (OVER_COUPLED/HEALTHY/ISOLATED); 4 coordination health dimensions; handoff quality; 4 coordination failure patterns with routing actions
├── org-intelligence/dependency-intelligence-engine.md            ← Dependency graph; CPM critical path analysis; reliability scoring per team pair; cascade impact analysis; pre-sprint dependency risk assessment
├── org-intelligence/org-intelligence-dashboard.md                ← 7-panel executive console; role-based privacy controls (T1 aggregate only → T5 full); sprint/monthly/quarterly reports
└── org-intelligence/dependency-intelligence-engine.md            ← (see above; 5th org-intelligence file)

WORK COGNITION (patterns, bottlenecks, flow, planning intelligence)
├── work-cognition/work-pattern-miner.md                          ← 8 pattern types; PrefixSpan + Apriori + correlation mining; AI synthesis weekly (claude-sonnet-4-6); CANDIDATE→VALIDATED→ACTIVE lifecycle; min 20 occurrences to validate
├── work-cognition/bottleneck-intelligence-engine.md              ← 10 bottleneck subtypes across QUEUE/AGENT/GATE/HANDOFF/RESOURCE/DEPENDENCY classes; real-time + trend detection; cascade impact quantification; 3 named resolution playbooks
├── work-cognition/flow-efficiency-engine.md                      ← Flow efficiency target ≥0.40; 5 flow metrics; flow debt analysis (DEPENDENCY/APPROVAL/CONTEXT/RESOURCE/REWORK); WIP limit via Little's Law; 6 routing recommendations
├── work-cognition/predictive-work-planner.md                     ← 7-layer sprint assessment (velocity/capacity/dependency/bottleneck/flow-debt/pattern-risk/historical); sprint_confidence score; quarterly initiative feasibility with headcount scenarios
└── work-cognition/work-insights-dashboard.md                     ← 7-panel console; TEAM/ORG/INITIATIVE modes; P1/P2/P3 automated recommendations; per-panel refresh rates

PEOPLE INTELLIGENCE (skills, concentration, collaboration, growth, governance)
├── people-intelligence/skill-graph.md                            ← NOVICE→AUTHORITY 4-level taxonomy; evidence-based inference (workflow outcomes, gate rates, peer recognition, assessments); 5 query types; skill staleness detection
├── people-intelligence/knowledge-concentration-detector.md       ← 7 risk types; bus_factor = 1 → CRITICAL + T3 alert + 14d cross-training; decision + process + approval monopoly detection; knowledge transfer deadline tracking
├── people-intelligence/collaboration-network-analyzer.md         ← Weighted collaboration graph (degree/betweenness/clustering); silo detection; hub overload risk; org design quarterly report; team formation recommendations
├── people-intelligence/growth-analytics-engine.md                ← 8 growth metrics; HIGH_GROWTH→RECOVERING trajectories; AI growth plan generation (top 3 areas + stretch assignment); coaching effectiveness tracking (target ≥0.65)
└── people-intelligence/people-intelligence-governance.md         ← 5 governing principles; role-based access matrix; consent framework (opt-out impossible/voluntary/never-collected); individual data rights; monthly bias monitoring

ORG INTELLIGENCE PERSISTENCE (initialized)
├── memory/team-intelligence/team-performance-records.yaml        ← Team performance records per sprint
├── memory/team-intelligence/team-baselines.yaml                  ← 90-day rolling baselines per team
├── memory/team-intelligence/velocity-records.yaml                ← Sprint velocity + rolling averages + patterns
├── memory/team-intelligence/capacity-records.yaml                ← Capacity breakdown per team per sprint
├── memory/team-intelligence/capacity-forecasts.yaml              ← 3-sprint ahead capacity forecasts
├── memory/team-intelligence/team-health-scores.yaml              ← Current health scores + tier distribution
├── memory/team-intelligence/early-warnings.yaml                  ← Active early warning signals per team
├── memory/org-intelligence/org-performance-records.yaml          ← Org-level performance records with DORA
├── memory/org-intelligence/dependency-registry.yaml              ← All active dependencies + risk scores
├── memory/org-intelligence/coupling-matrix.yaml                  ← Team coupling matrix + classification
├── memory/org-intelligence/reliability-scores.yaml               ← Historical dependency reliability per team pair
├── memory/work-cognition/pattern-library.yaml                    ← Active + validated work patterns
├── memory/work-cognition/active-bottlenecks.yaml                 ← Currently open bottlenecks + severity
├── memory/work-cognition/flow-metrics-current.yaml               ← Live flow metrics per team
├── memory/work-cognition/sprint-risk-assessments.yaml            ← Sprint risk assessments per team
├── memory/people-intelligence/skill-graph.yaml                   ← Full skill graph (agents + people)
├── memory/people-intelligence/concentration-risks.yaml           ← Open concentration risks + severity
├── memory/people-intelligence/growth-plans.yaml                  ← AI-generated growth plans
├── memory/people-intelligence/coaching-interventions.yaml        ← Coaching records + effectiveness
└── memory/people-intelligence/consent-records.yaml               ← Consent status + contestation log

---

## ENTERPRISE DATA FABRIC AND INTELLIGENCE PIPELINE (v22.0.0)

DATA FABRIC (data model, catalog, lineage, quality, governance)
├── data-fabric/data-fabric-model.md                              ← Canonical entity types (8); field definition standard; schema registry with semver + compatibility (BACKWARD/FORWARD/FULL); classification matrix PUBLIC→TOP_SECRET
├── data-fabric/data-catalog.md                                   ← Searchable inventory of all data assets; catalog entry schema; 4 catalog sections (operational/analytical/knowledge/connector); freshness maintenance; search API (7 filters, 5 sorts)
├── data-fabric/data-lineage-tracker.md                           ← Hash-chained lineage records per transformation; upstream/downstream graph queries; impact analysis protocol; GDPR erasure support; EU AI Act Art.9 lineage compliance
├── data-fabric/data-quality-engine.md                            ← 5 dimensions (completeness×0.30, accuracy×0.25, freshness×0.20, consistency×0.15, uniqueness×0.10); GOLD/SILVER/BRONZE/POOR/CRITICAL tiers; HIGH_RISK AI requires GOLD; automated remediation
└── data-fabric/data-fabric-governance.md                         ← 4-level policy hierarchy; data stewardship model (Owner/Steward/Consumer/DPO/CISO); 7 core policies (minimization, purpose-binding, retention, erasure); 7 enforcement points; GDPR Art.30 auto-generation

DATA PIPELINES (batch, stream, transformation, governance)
├── data-pipelines/pipeline-engine.md                             ← DAG execution; BATCH/STREAM/MICRO_BATCH/HYBRID types; 5-state machine; parallel step execution; partial resume; pipeline + step schema; 4 pipeline classes (STANDARD→CRITICAL)
├── data-pipelines/stream-processor.md                            ← Real-time stream processing (<5s e2e); FILTER/TRANSFORM/ENRICH/AGGREGATE/PATTERN_DETECT/DEDUPLICATE ops; tumbling/sliding/session windows; CEP patterns; backpressure + flow control
├── data-pipelines/batch-processor.md                             ← 7 job types; watermark-based incremental processing; checkpoint/resume; BACKFILL + PURGE require T3 approval; peak/off-peak batch windows; poison-pill detection
├── data-pipelines/transformation-engine.md                       ← 12 transformation types (SCHEMA_MAP through CUSTOM); 10 official built-in transforms (XFORM-001–010); AI-powered transforms with quality gate + hallucination check; PII anonymization governance
└── data-pipelines/pipeline-governance.md                         ← Classification (STANDARD→CRITICAL); approval gates by class; audit retention (90d→7yr); SLA enforcement; data contracts with freshness/quality/schema stability guarantees

DATA INTELLIGENCE (anomaly detection, patterns, predictions, synthesis)
├── data-intelligence/anomaly-detection-engine.md                 ← 8 anomaly types; Z-score/IQR/Isolation Forest/EWMA/CUSUM methods; LOW/MEDIUM/HIGH sensitivity; AI-powered behavioral anomalies; baseline management; false-positive feedback loop
├── data-intelligence/pattern-recognition-engine.md               ← 8 pattern categories; Apriori/FP-Growth frequent itemsets; PrefixSpan sequential; Pearson/Spearman correlation with lag analysis; AI synthesis for complex patterns; weekly pattern digest
├── data-intelligence/predictive-analytics-engine.md              ← 8 prediction models (workflow load, quality degradation, compliance risk, resource exhaustion, agent overload, governance bottleneck, sprint risk, incident precursor); Bayesian confidence routing; drift detection
├── data-intelligence/data-synthesis-engine.md                    ← 8 synthesis types (executive/sprint/quality/anomaly/pattern/compliance/incident/data-story); 5-step synthesis pipeline; factual cross-verification; on-demand data stories from NL questions
└── data-intelligence/intelligence-dashboard.md                   ← 7-panel live console: fabric health, anomalies, predictions, patterns, synthesis, pipeline ops, compliance; fabric_health composite score; 5 drill-downs; per-panel refresh rates

DATA OPERATIONS (lifecycle, quality monitoring, lineage service, catalog ops)
├── data-operations/data-lifecycle-manager.md                     ← ACTIVE→AGING→ARCHIVED→PURGED state machine; retention policy catalog; default schedules (90d OPERATIONAL→10yr HIGH_RISK); archival protocol; deletion manifest + verification; legal hold support
├── data-operations/quality-monitor.md                            ← 4 monitoring tiers (continuous→daily); 4 concurrent check workers; tier demotion alerts; HIGH_RISK GOLD SLA (2hr return); remediation workflow per dimension; steward escalation chain
├── data-operations/lineage-service.md                            ← Lineage record ingestion API; upstream/downstream/impact query endpoints; daily graph integrity checks (hash chain, orphans, gaps, cycles); completeness ≥0.95 target (1.00 for HIGH_RISK)
├── data-operations/catalog-manager.md                            ← Auto-registration from pipelines/connectors; auto-classification with PII detection; schema drift detection; stewardship management; catalog health score = completeness×0.30 + accuracy×0.30 + freshness×0.25 + stewardship×0.15
└── data-operations/data-ops-dashboard.md                         ← 7-panel ops console: pipeline status, quality tiers, catalog currency, lifecycle queue, lineage health, compliance posture, top open issues; ops_health composite; daily 06:00 UTC ops report

DATA FABRIC PERSISTENCE (initialized)
├── memory/data-fabric/schema-registry.yaml                       ← Registered schemas with version + compatibility state
├── memory/data-fabric/entity-catalog.yaml                        ← Catalog index (managed by catalog-manager)
├── memory/data-fabric/lineage-graph.yaml                         ← Live lineage graph adjacency structure
├── memory/data-fabric/quality-scores.yaml                        ← Current quality scores per entity
├── memory/data-fabric/quality-check-results.yaml                 ← Latest check results per entity
├── memory/data-fabric/governance-policy-state.yaml               ← Active data governance policies + violation state
├── memory/data-pipelines/pipeline-registry.yaml                  ← All registered pipelines
├── memory/data-pipelines/pipeline-runs.yaml                      ← Current run state for active pipelines
├── memory/data-pipelines/stream-processor-state.yaml             ← Active stream processors + lag metrics
├── memory/data-pipelines/batch-checkpoints.yaml                  ← Watermark checkpoints for active batch jobs
├── memory/data-pipelines/transformation-library.yaml             ← Registered transformations (10 official pre-loaded)
├── memory/data-pipelines/data-contracts.yaml                     ← Active data contracts between producers and consumers
├── memory/data-intelligence/anomaly-records.yaml                 ← Open anomaly records
├── memory/data-intelligence/baseline-models.yaml                 ← Statistical baseline models per entity/metric
├── memory/data-intelligence/pattern-registry.yaml                ← Active pattern records
├── memory/data-intelligence/prediction-models.yaml               ← 8 prediction models (initialized UNTRAINED)
├── memory/data-intelligence/synthesis-registry.yaml              ← Synthesis output index
├── memory/data-intelligence/dashboard-state.yaml                 ← Live intelligence dashboard state
├── memory/data-operations/lifecycle-states.yaml                  ← Entity lifecycle stage distribution
├── memory/data-operations/retention-policies.yaml                ← Active retention policies
├── memory/data-operations/quality-check-queue.yaml               ← Priority quality check queue
├── memory/data-operations/lineage-completeness-metrics.yaml      ← Lineage coverage metrics
├── memory/data-operations/catalog-state.yaml                     ← Catalog health metrics
├── memory/data-operations/stewardship-records.yaml               ← Steward assignments + performance
└── memory/data-operations/ops-dashboard-state.yaml               ← Live ops dashboard state

---

## ENTERPRISE AI-NATIVE DEVELOPER AND EXTENSION PLATFORM (v21.0.0)

DEVELOPER PLATFORM (public-facing API + intent layer)
├── developer-platform/os-sdk.md                                  ← SDK clients: workflows/knowledge/agents/events; Python 3.10+/TypeScript 5+/Go 1.21+; tier-based rate limits (T1:100/hr→T5:20K/hr); 5 typed error classes
├── developer-platform/intent-interface.md                        ← NL → structured OS operations; 9 intent categories; confidence threshold 0.75; max 2 clarification rounds; operator shortcuts (!incident, !adr, !prd, !sprint)
├── developer-platform/api-specification.md                       ← REST + SSE; /workflows /knowledge /agents /governance /health /metrics /telemetry; response envelope with meta; URL-path versioning v1; 12-month deprecation policy
├── developer-platform/developer-portal.md                        ← 5 quick start paths; sandbox (T2 tier, 30d API key, <10s simulated); 10-day onboarding journey; time_to_first_call target <15min
└── developer-platform/webhook-engine.md                          ← 10 event types; HMAC-SHA256 signing; retry schedule (30s→2hr, max 5); TLS 1.2+ required; max CONFIDENTIAL in payloads

EXTENSION REGISTRY (third-party + internal extensions)
├── extension-registry/extension-model.md                         ← 7 extension types; tier ceiling per type (AGENT_EXTENSION max T2, WORKFLOW_EXTENSION max STANDARD class); extension contract: 7 mandatory obligations; semver enforced
├── extension-registry/extension-lifecycle.md                     ← State machine SUBMITTED→SECURITY_SCAN→REVIEW→APPROVED→STAGED→ACTIVE; sandbox checks undeclared capabilities; 5-day review SLA; PATCH=scan only
├── extension-registry/extension-catalog.md                       ← 5 categories; discovery API (6 filters, 4 sort options); featured criteria (grade A, rating≥4.5, ≥10 ratings, verified author); quality_score formula
├── extension-registry/extension-governance.md                    ← Review authority matrix per type; SEC-EXT-001–SEC-EXT-011; ENHANCED isolation minimum; violation response: MINOR=warn → CRITICAL=permanent rejection
└── extension-registry/extension-runtime.md                       ← 3 isolation levels (STANDARD/ENHANCED/STRICT); capability interception (agent_call ALWAYS BLOCKED); hard limits: 50K tokens/120s/256MB/20 tool calls; 9-step invocation lifecycle

DEPLOYMENT INTELLIGENCE (safe, audited deployments)
├── deployment-intelligence/deployment-orchestrator.md            ← 7 deployment types; 8-state machine; 5-phase pipeline (validate<5min→approve→staging 24hr min→canary→rollout); auto-approved STANDARD if validation passed
├── deployment-intelligence/version-manager.md                    ← Semver enforced (MAJOR=breaking, MINOR=additions, PATCH=fixes); automated semver validator blocks mismatched bumps; OS state reconstruction at any timestamp
├── deployment-intelligence/canary-intelligence.md                ← Bayesian analysis; auto-promote ≥0.95 / auto-rollback <0.20 / human review 0.20–0.94; spike detector (3× baseline → immediate rollback); <10s atomic rollback
├── deployment-intelligence/rollout-controller.md                 ← 5 strategies (STANDARD_PHASED/SLOW_BURN/FAST_TRACK/IMMEDIATE/BLUE_GREEN/TIER_BASED); phase dwell 15/30/30/60min; 24hr post-rollout soak; circuit breaker after 3 stalls
└── deployment-intelligence/deployment-audit.md                   ← Hash-chained SHA-256 + Ed25519 signed records; SOC2/EU AI Act/DORA compliance queries; 7yr retention (10yr HIGH_RISK, PERMANENT constitutional); chain integrity on every read

WORKFLOW MARKETPLACE (reusable OS components)
├── workflow-marketplace/marketplace-model.md                     ← 8 item types; quality schema (proven_uses, gate_pass_rate, rating); COMMUNITY/VERIFIED/OFFICIAL promotion criteria (≥5 uses + rating≥4.0 → VERIFIED; >50 uses + ≥4.5 → OFFICIAL)
├── workflow-marketplace/marketplace-governance.md                ← Submission requirements by type; 3 review tiers (COMMUNITY 24hr automated, VERIFIED 5d, OFFICIAL core team); enforcement: WARN/DELIST/SUSPEND/REMOVE; security incidents target 0
├── workflow-marketplace/marketplace-distribution.md              ← 5-step install protocol; PATCH auto-apply / MINOR notify+72hr / MAJOR manual; OFFICIAL auto-patch; rollback window 30d; dependency graph; circular dependency blocked
├── workflow-marketplace/marketplace-analytics.md                 ← Per-item adoption/quality/signals/trend_30d; platform reuse_rate; recommendation engine (collaborative/contextual/gap-filling/quality-based); author weekly digest
└── workflow-marketplace/marketplace-catalog.md                   ← 4 OFFICIAL workflow templates; 2 evaluation rubrics; 2 knowledge packages; search API (6 params, 4 sorts); COMMUNITY/VERIFIED/OFFICIAL tier tags

DEVELOPER PLATFORM PERSISTENCE (initialized)
├── memory/developer-platform/api-keys.yaml                       ← Active API key records (no secrets stored; hashed only)
├── memory/developer-platform/webhook-subscriptions.yaml          ← Active webhook endpoint registrations
├── memory/developer-platform/webhook-delivery-log.jsonl          ← Append-only webhook delivery attempts + outcomes
├── memory/developer-platform/sdk-usage-metrics.yaml              ← SDK call counts by client/tier/endpoint
├── memory/extension-registry/extension-catalog.yaml              ← Installed and available extension catalog
├── memory/extension-registry/extension-states.yaml               ← Per-extension lifecycle state + isolation config
├── memory/extension-registry/capability-intercepts.jsonl         ← Append-only capability interception events
├── memory/extension-registry/security-scan-results.yaml          ← Latest security scan results per extension
├── memory/deployment-intelligence/deployment-queue.yaml          ← Pending deployment jobs
├── memory/deployment-intelligence/deployment-history.jsonl       ← Append-only deployment event log
├── memory/deployment-intelligence/canary-state.yaml              ← Active canary experiments + Bayesian state
├── memory/deployment-intelligence/version-registry.yaml          ← Component version registry with rollback points
├── memory/workflow-marketplace/catalog-index.yaml                ← Marketplace catalog index
├── memory/workflow-marketplace/installed-items.yaml              ← Installed marketplace items per team
├── memory/workflow-marketplace/usage-metrics.yaml                ← Per-item usage and quality metrics
└── memory/workflow-marketplace/governance-log.jsonl              ← Append-only marketplace governance events

---

## ENTERPRISE DETERMINISTIC WORKFLOWS (v24.0.0)

Complete set of 23 production-grade enterprise workflows with full lifecycle states, execution DAGs, escalation logic, approval gates, telemetry, rollback systems, governance checkpoints, and enterprise system integrations.

WORKFLOW STANDARDS AND REGISTRY
├── enterprise-workflows/_workflow-standards.md           ← Canonical schema; gate types; state machine conventions; rollback convention; telemetry naming
└── enterprise-workflows/_workflow-registry.md            ← All 23 workflows indexed; routing trigger map; workflow dependencies; SLA summary

PLANNING AND STRATEGY WORKFLOWS
├── enterprise-workflows/01-product-discovery.md          ← WF-001 | T3 | ELEVATED | 5d SLA | G-AUTH/G-QUALITY/G-EXEC gates; opportunity brief; experiment design
├── enterprise-workflows/02-annual-planning.md            ← WF-002 | T4 | ELEVATED | 30d SLA | OKR tree construction; T5 board approval; headcount budget
├── enterprise-workflows/03-quarterly-planning.md         ← WF-003 | T3 | ELEVATED | 14d SLA | Capacity-loaded sprint sequencing; dependency checks; T4 OKR approval
└── enterprise-workflows/04-roadmap-governance.md         ← WF-004 | T3 | ELEVATED | 7d SLA | Roadmap change control; impact analysis; T4 approval for MAJOR changes

TECHNICAL WORKFLOWS
├── enterprise-workflows/05-architecture-review.md        ← WF-005 | T3 | ELEVATED | 14d SLA | RFC/ADR process; council vote ≥2/3; G-ARCH gate; ADR permanent record
├── enterprise-workflows/06-ai-feature-delivery.md        ← WF-006 | T3 | REGULATED | 21d SLA | EU AI Act Art.9–15; HIGH_RISK compliance; DPO+CISO sign-off; constitutional score
├── enterprise-workflows/07-api-development.md            ← WF-007 | T2 | ELEVATED | 14d SLA | Contract-first design; OpenAPI spec; semver enforcement; breaking change gate
└── enterprise-workflows/08-runtime-orchestration.md      ← WF-008 | T2 | CRITICAL | Real-time | DAG execution; <1s atomic rollback; circuit breaker; live canary

DELIVERY WORKFLOWS
├── enterprise-workflows/09-experimentation.md            ← WF-009 | T2 | ELEVATED | 14d SLA | Pre-registered hypothesis; Bayesian early stopping; guardrail enforcement; P-value gating
├── enterprise-workflows/10-release-governance.md         ← WF-010 | T3 | CRITICAL | 2d SLA | 5-gate approval chain (QA/Security/Arch/Exec/Compliance); rollback plan mandatory
├── enterprise-workflows/11-rollout-governance.md         ← WF-011 | T3 | CRITICAL | Real-time | Bayesian canary; phased 5→25→50→100%; <10s rollback; 24hr soak period
├── enterprise-workflows/12-incident-management.md        ← WF-012 | T2 | CRITICAL | <15min ACK | SEV1–4 severity model; MTTR tracking; war room; DORA change_failure_rate
└── enterprise-workflows/13-postmortem.md                 ← WF-013 | T2 | ELEVATED | 5d SLA | Blameless protocol; AI blame-language scan; recurrence detection; action item tracking

GOVERNANCE AND COMPLIANCE WORKFLOWS
└── enterprise-workflows/14-compliance-review.md          ← WF-014 | T3 | REGULATED | 21d SLA | EU AI Act+GDPR+SOC2; evidence packages; DPO sign-off; 7-yr retention

COORDINATION WORKFLOWS
├── enterprise-workflows/15-stakeholder-alignment.md      ← WF-015 | T3 | ELEVATED | 7d SLA | Conflict detection; G-EXEC escalation; binding signed alignment record
├── enterprise-workflows/16-dependency-coordination.md    ← WF-016 | T3 | ELEVATED | 5d SLA | CPM critical path; binding commitment; at-risk monitoring; cascade risk detection
└── enterprise-workflows/17-customer-escalation.md        ← WF-017 | T3 | CRITICAL | 4hr ACK | ESC1–3 severity; ARR-at-risk tracking; executive engagement; churn prevention

REGULATED ONBOARDING WORKFLOWS
├── enterprise-workflows/18-fintech-onboarding.md         ← WF-018 | T3 | REGULATED | 30d SLA | KYB+AML+sanctions; DPA; data residency verification; 30d hypercare; GDPR enforcement
└── enterprise-workflows/19-mortgage-onboarding.md        ← WF-019 | T3 | REGULATED | 45d SLA | NMLS/RESPA/TILA/HMDA/ECOA/GLBA compliance; MISMO 3.4 validation; 45d hypercare

ORGANIZATIONAL WORKFLOWS
├── enterprise-workflows/20-organizational-evolution.md   ← WF-020 | T4 | SENSITIVE | 60d SLA | Impact analysis; T5 approval >10 people; same-day notification; 60d monitoring
└── enterprise-workflows/21-workflow-optimization.md      ← WF-021 | T3 | STANDARD | 14d SLA | Telemetry-driven; bottleneck analysis; simulation; constitutional changes require T5

RUNTIME INFRASTRUCTURE WORKFLOWS
├── enterprise-workflows/22-event-driven-workflows.md     ← WF-022 | T2 | CRITICAL | Real-time | Event trigger registration; idempotency; dead-letter handling; enterprise event catalog (15 triggers)
└── enterprise-workflows/23-runtime-execution-workflows.md ← WF-023 | T2 | CRITICAL | Real-time | Execution engine contract; DAG evaluation; durable state; checkpoint/restore; SHA-256 audit chain

WORKFLOW GOVERNANCE PROPERTIES (all 23 workflows):
  - Lifecycle states: complete state machine per workflow
  - Execution graph: step-level DAG with depends_on, step type, SLA
  - Approval gates: G-AUTH/G-QUALITY/G-ARCH/G-SECURITY/G-EXEC/G-LEGAL/G-LAUNCH
  - Escalation logic: trigger → action → SLA table
  - Governance checkpoints: constitutional principle bindings
  - Observability: health metrics + SLA targets
  - Telemetry events: enterprise.workflows.WF-{NNN}.* topic namespace
  - Rollback system: per-workflow rollback policy
  - Enterprise system integrations: Jira/Slack/Email/PagerDuty/CI/CD/Compliance
  - Wiki updates: artifact paths per workflow
  - Memory updates: memory/ paths updated on completion

---

## ENTERPRISE OPERATIONAL PLAYBOOKS (v25.0.0)

Complete set of 19 enterprise operational playbooks defining deterministic cadences, decision protocols, participant responsibilities, artifact standards, health metrics, and governance checkpoints for all recurring enterprise operations.

PLAYBOOK INDEX AND REFERENCE
└── enterprise-playbooks/INDEX.md               ← Master index; cadence calendar; workflow cross-reference

EXECUTIVE AND PLANNING CADENCES
├── enterprise-playbooks/01-executive-operating-cadence.md  ← PB-001 | T4 | CRITICAL | Daily/Wkly/Mo/Qr | Daily health brief; weekly sync; monthly 3hr review; QBR; emergency protocol
├── enterprise-playbooks/05-quarterly-planning.md           ← PB-005 | T3 | ELEVATED | Quarterly | 10-week timeline; OKR quality criteria; portfolio prioritization; CPM dependency analysis
└── enterprise-playbooks/06-annual-planning.md              ← PB-006 | T4 | ELEVATED | Annual | Q3→Q4 14-milestone timeline; exec strategy workshop; OKR cascade; board review package

PM AND DELIVERY CADENCES
├── enterprise-playbooks/02-pm-operating-cadence.md         ← PB-002 | T3 | ELEVATED | Daily/Wkly/Sprt | Async standup; weekly sync; full sprint lifecycle; discovery cadence
├── enterprise-playbooks/10-operational-readiness.md        ← PB-010 | T3 | CRITICAL | Per-feature | 9-section ORR checklist; observability/runbook/rollback/load/capacity/data/security/on-call/compliance
├── enterprise-playbooks/11-release-readiness.md            ← PB-011 | T3 | CRITICAL | Per-release | 6-track scorecard; risk score formula (6 dimensions); T-24hr review; post-release T+24hr check
└── enterprise-playbooks/14-portfolio-reviews.md            ← PB-014 | T3 | ELEVATED | Monthly/Qr | RAG status tracking; kill criteria; scope change protocol; quarterly re-prioritization

TECHNICAL GOVERNANCE CADENCES
├── enterprise-playbooks/03-architecture-councils.md        ← PB-003 | T3 | ELEVATED | Bi-weekly | Principal + domain councils; RFC review protocol; 10 ADR evaluation dimensions; drift detection
├── enterprise-playbooks/04-release-councils.md             ← PB-004 | T3 | CRITICAL | Per-release | 7 release classifications; Go/No-Go vote; deployment window governance; blackout management
└── enterprise-playbooks/19-runtime-governance.md           ← PB-019 | T3 | CRITICAL | Weekly/Monthly | SLO/error budget policy; production change control; capacity management; on-call governance

REGULATED GOVERNANCE CADENCES
├── enterprise-playbooks/07-ai-governance-reviews.md        ← PB-007 | T4 | REGULATED | Monthly/Qr | EU AI Act deadlines; HIGH_RISK conformity assessment; model health monitoring; evidence retention
└── enterprise-playbooks/18-fintech-governance.md           ← PB-018 | T4 | REGULATED | Monthly/Qr | AML/KYB/KYC/sanctions; GDPR; PCI-DSS; DORA; regulatory change management

OPERATIONAL AND PEOPLE CADENCES
├── enterprise-playbooks/08-experimentation-governance.md   ← PB-008 | T2 | ELEVATED | Per-experiment | Pre-registration; Bayesian stopping; guardrail monitoring; SRM check; win rate 30–40%
├── enterprise-playbooks/09-onboarding.md                   ← PB-009 | T2 | STANDARD | Per-hire | 5-phase 90-day program; buddy protocol; role-specific tracks; documentation improvement protocol
├── enterprise-playbooks/13-organizational-reviews.md       ← PB-013 | T4 | ELEVATED | Quarterly | Team health; engagement; leadership effectiveness; structure assessment; succession planning
└── enterprise-playbooks/17-organizational-evolution.md     ← PB-017 | T4 | SENSITIVE | On-trigger | MINOR→CRITICAL classification; 4-phase change process; communication standards; severance standards

ON-TRIGGER ESCALATION PLAYBOOKS
├── enterprise-playbooks/12-escalation-management.md        ← PB-012 | T3 | CRITICAL | On-trigger | L1–L5 severity; escalation package standard; routing matrix; response SLAs; retrospective protocol
├── enterprise-playbooks/15-dependency-management.md        ← PB-015 | T3 | ELEVATED | Weekly | Dependency register; binding commitment records; CPM analysis; pre-release clearance checklist
└── enterprise-playbooks/16-customer-escalation-handling.md ← PB-016 | T3 | CRITICAL | On-trigger | ESC1–ESC4 severity; customer tier classification; 5-step workflow; communication scripts; debrief protocol

PLAYBOOK GOVERNANCE PROPERTIES (all 19 playbooks):
  - Owner: specific org (Delivery, PM, Engineering, Executive, People, Compliance)
  - Tier: T2–T4 (authority level for decisions made within playbook)
  - Class: STANDARD | ELEVATED | CRITICAL | REGULATED | SENSITIVE
  - Cadence: explicit schedule or trigger condition
  - Decision authority: all decisions are human decisions (C-001 binding)
  - Artifacts: explicit artifact outputs per playbook
  - Governance checkpoints: constitutional principle bindings per playbook
  - Health metrics: quantitative targets per playbook
  - Anti-patterns: documented failure modes with consequences
  - Workflow integrations: explicit linkage to enterprise workflow library (WF-001–WF-023)

---

## ENTERPRISE STRATEGIC INTELLIGENCE AND DECISION SUPPORT (v27.0.0)

The Enterprise AI OS synthesizes all internal intelligence systems and external signals into a unified strategic intelligence picture, enabling evidence-driven scenario planning, war gaming, and executive decision-making — with full calibration, outcome tracking, and learning loops.

INTELLIGENCE CYCLE: OBSERVE (12 sources) → FUSE → DETECT → ANALYZE → RECOMMEND → DECIDE → TRACK → CALIBRATE

STRATEGIC INTELLIGENCE CORE (signals → unified intelligence units)
├── strategic-intelligence/strategic-intelligence-engine.md   ← SI-CORE-001 | Master coordinator; 12 source systems; 8 intelligence domains; 24hr synthesis cycle
├── strategic-intelligence/intelligence-fusion-layer.md       ← SI-CORE-002 | 7-stage fusion pipeline; source authority matrix; EMERGENT cross-domain detection; conflict resolution
├── strategic-intelligence/opportunity-threat-radar.md        ← SI-CORE-003 | P0–P4 radar; urgency×0.40+magnitude×0.40+confidence×0.20 scoring; P0 → T4 within 4hr
├── strategic-intelligence/competitive-intelligence-hub.md    ← SI-CORE-004 | Competitor registry; 5 categories; battle cards; threat escalation logic; red team playbooks
└── strategic-intelligence/market-signal-processor.md        ← SI-CORE-005 | 10 signal categories; live market model; EWMA+Granger+Zipf trend detection; coverage gap routing

SCENARIO PLANNING (intelligence → structured futures)
├── scenario-planning/scenario-planning-engine.md             ← SI-SCEN-001 | 8 scenario types; uncertainty axis + world model; 5-phase protocol; Bayesian world probability; leading indicators
├── scenario-planning/war-gaming-coordinator.md               ← SI-SCEN-002 | 6 war game types; Blue/Red/Neutral teams; 4-round format; red team calibration target >0.60 accuracy
├── scenario-planning/strategic-options-generator.md          ← SI-SCEN-003 | 9 option classes; investment case + financial model; real options framework; portfolio conflict detection
├── scenario-planning/outcome-probability-modeler.md          ← SI-SCEN-004 | 6 modeling methods; Bayesian updating; ECE target <0.08; ensemble weighting; Brier score calibration
└── scenario-planning/scenario-library.md                    ← SI-SCEN-005 | 12 pre-built templates; archived scenario index; monthly learning extraction; calibration by type

EXECUTIVE INTELLIGENCE (intelligence → decisions)
├── executive-intelligence/executive-decision-engine.md       ← SI-EXEC-001 | Decision package schema; 5 framing protocols; reversibility classification; IRREVERSIBLE requires 0.75+ confidence
├── executive-intelligence/board-intelligence-system.md       ← SI-EXEC-002 | 6 package types; weekly brief (1p), monthly (5p), quarterly (10p), annual (20p); freshness standards
├── executive-intelligence/executive-alert-system.md          ← SI-EXEC-003 | 10 alert categories; 15-min P0 SLA; deduplication + grouping; alert rate governance; escalation chains
├── executive-intelligence/strategic-decision-archive.md      ← SI-EXEC-004 | Permanent decision record; T+30/90/180/365 outcome reviews; AI calibration feedback; SHA-256+Ed25519 integrity
└── executive-intelligence/executive-intelligence-dashboard.md ← SI-EXEC-005 | 7-panel live console; role-aware views T2–T5+board; 60s refresh; strategic_health composite score

STRATEGIC ALIGNMENT (execution ↔ strategy)
├── strategic-alignment/okr-intelligence-engine.md            ← SI-ALIGN-001 | Achievement probability model; velocity-based forecast; OKR drift detection; end-of-quarter forecast at week 8
├── strategic-alignment/portfolio-strategy-alignment.md       ← SI-ALIGN-002 | 7 initiative classes; alignment scoring; ZOMBIE detection (< 0.35 for 2 sprints); resource arithmetic check
├── strategic-alignment/strategic-drift-detector.md           ← SI-ALIGN-003 | 8 drift types; drift vs. intentional pivot protocol; strategic_coherence_score; CRITICAL_DRIFTED → T4 immediate
├── strategic-alignment/strategy-coherence-validator.md       ← SI-ALIGN-004 | 5 coherence dimensions; contradiction detection; G-QUALITY gate input (requires ≥ 0.70); quarterly validation
└── strategic-alignment/alignment-console.md                 ← SI-ALIGN-005 | 6-panel alignment console; OKR matrix; zombie pipeline; drift signals; 12-week coherence trend

STRATEGIC INTELLIGENCE PERSISTENCE (initialized — append-only where noted)
├── memory/strategic-intelligence/active-scenarios.yaml       ← Active scenario fast-lookup index
├── memory/strategic-intelligence/radar-state.yaml            ← Live radar item registry by tier (P0–P4)
├── memory/strategic-intelligence/competitor-registry.yaml    ← Competitor record catalog
├── memory/strategic-intelligence/okr-state.yaml              ← Current OKR health summary
├── memory/strategic-intelligence/alert-metrics.yaml          ← Alert rate tracking and acknowledgement stats
├── memory/strategic-intelligence/forecast-calibration.yaml   ← Probability model calibration (ECE, Brier, bias corrections)
├── memory/strategic-intelligence/scenario-learning.yaml      ← Scenario pattern library and calibration
├── memory/strategic-intelligence/war-game-library.yaml       ← Completed war game records + red team playbooks
├── memory/strategic-intelligence/decision-learnings.yaml     ← AI recommendation accuracy calibration
├── memory/strategic-intelligence/battle-cards/               ← Per-competitor battle cards
├── memory/strategic-intelligence/signal-log.jsonl            ← APPEND-ONLY; all strategic signals
├── memory/strategic-intelligence/radar-log.jsonl             ← APPEND-ONLY; all radar item lifecycle events
├── memory/strategic-intelligence/competitor-intel-log.jsonl  ← APPEND-ONLY; competitor registry updates
├── memory/strategic-intelligence/scenario-log.jsonl          ← APPEND-ONLY; all scenario events
├── memory/strategic-intelligence/options-log.jsonl           ← APPEND-ONLY; option generation and decisions
├── memory/strategic-intelligence/decisions.jsonl             ← APPEND-ONLY; strategic decision archive (SHA-256+Ed25519)
├── memory/strategic-intelligence/board-packages.jsonl        ← APPEND-ONLY; board package distribution records
└── memory/strategic-intelligence/missed-opportunities.yaml   ← Missed opportunity postmortems

SI HARD LIMITS (immutable):
  Cannot suppress a THREAT signal above HIGH magnitude
  Cannot surface TOP_SECRET data to T2 recipients
  Cannot generate board recommendations without T4 review
  All decisions are human decisions (C-001 absolute binding)
  AI recommends; humans decide (no self-authorization of strategic moves)

SI HEALTH TARGETS:
  P0 radar to active scenario: < 4 hours
  Signal to UIU fusion latency: < 24 hours
  Forecast calibration (ECE): < 0.08 per domain
  Strategic coherence score: ≥ 0.70
  OKR coverage rate: ≥ 0.85
  Zombie initiative rate: < 5%
  Red team prediction accuracy: > 0.60

---

## RECURSIVE SELF-IMPROVEMENT SYSTEM (v26.0.0)

The Enterprise AI OS continuously observes itself, identifies improvement opportunities, proposes changes, validates them safely, authorizes them through human approval chains, applies them, measures outcomes, and feeds learnings back — with the improvement system itself being recursively improvable.

IMPROVEMENT CYCLE: OBSERVE → ANALYZE → PLAN → VALIDATE → AUTHORIZE → APPLY → MEASURE → META-IMPROVE (24-hour target for full cycle)

CORE COMPONENTS (observation, analysis, planning, forecasting)
├── recursive-self-improvement/core/self-improvement-engine.md      ← RSI-CORE-001 | Master coordinator; 10 improvement domains; improvement cycle SLAs; governance checkpoints; recursion contract
├── recursive-self-improvement/core/observation-layer.md            ← RSI-CORE-002 | ~331 signals; 12 source systems; 3 filter layers; real-time alerts for constitutional drift; signal coverage ≥0.92
├── recursive-self-improvement/core/analysis-engine.md              ← RSI-CORE-003 | 6-stage pipeline; Z-score/CUSUM/IQR anomaly detection; PrefixSpan/DBSCAN/Granger causal analysis; opportunity ranking formula
├── recursive-self-improvement/core/improvement-planner.md          ← RSI-CORE-004 | 6-step protocol; solution templates by opportunity type; P0–P4 priority; subsystem change lock; sequencing rules
└── recursive-self-improvement/core/impact-forecaster.md            ← RSI-CORE-005 | ROI model; STRONG/GOOD/MARGINAL/NEGATIVE thresholds; T+7/30/90 measurement; recursive calibration monthly

OPTIMIZERS (continuous optimization of specific OS layers)
├── recursive-self-improvement/optimizers/workflow-optimizer.md     ← RSI-OPT-001 | 7 dimensions; DAG parallelization; gate calibration (target 0.75–0.90 pass rate); A/B routing; staged rollout
├── recursive-self-improvement/optimizers/orchestration-optimizer.md ← RSI-OPT-002 | 8 dimensions; delegation depth target ≤2.8; discovery latency <30ms; coordination failure rate <0.03
├── recursive-self-improvement/optimizers/runtime-optimizer.md      ← RSI-OPT-003 | 9 dimensions; worker utilization 0.60–0.80; context waste <0.25; MTTR <10min; token cost -20%
└── recursive-self-improvement/optimizers/governance-optimizer.md   ← RSI-OPT-004 | T4 class; hard constraints section; gate calibration requires T4+10% staged test; constitutional gates inviolable

EVOLUTION SYSTEMS (org structure, capability, adaptation)
├── recursive-self-improvement/evolution-systems/organizational-evolution-engine.md ← RSI-EVO-001 | T4 | 8 misalignment signals; 10 proposal types; Conway's Law alignment; PB-017 integration; min ROI >2.0
├── recursive-self-improvement/evolution-systems/capability-gap-detector.md         ← RSI-EVO-002 | 5 detection methods; gap register; REGULATORY P0 if deadline <6mo; DEVELOP/HIRE/INTEGRATE routing
└── recursive-self-improvement/evolution-systems/org-adaptation-engine.md           ← RSI-EVO-003 | T4 | Adaptation capacity model (base 1.0, min 0.60); GREEN/YELLOW/RED velocity; fatigue detection; maturity LEVEL 1–5

HEALTH AND EFFICIENCY (health scoring, efficiency analysis, bottleneck detection)
├── recursive-self-improvement/health-and-efficiency/org-health-scorer.md          ← RSI-HE-001 | 6 dimensions; hard-cap penalties (bus_factor=1 → -0.30); THRIVING(0.85+) through CRISIS(<0.20)
├── recursive-self-improvement/health-and-efficiency/operational-efficiency-analyzer.md ← RSI-HE-002 | 6 efficiency dimensions; flow efficiency target ≥0.40; cost-per-outcome analysis; quarterly benchmarks
├── recursive-self-improvement/health-and-efficiency/bottleneck-detector.md        ← RSI-HE-003 | Theory of Constraints basis; 8 bottleneck classes; Little's Law throughput loss; CHRONIC protocol at 3+ recurrences
└── recursive-self-improvement/health-and-efficiency/efficiency-dashboard.md       ← RSI-HE-004 | 5-panel ASCII console; org health + efficiency + bottlenecks + improvement pipeline + cycle status

RECURSIVE SYSTEMS (meta-improvement, memory, learning, governance)
├── recursive-self-improvement/recursive-systems/meta-improvement-engine.md        ← RSI-REC-001 | T4 | Recursion contract (5 improvable / 5 immutable); 5 meta-dimensions; shadow mode 30d; depth limit = 3; T5 at Level 3
├── recursive-self-improvement/recursive-systems/improvement-memory.md             ← RSI-REC-002 | 4 memory layers (episodic/semantic/pattern library/failure library); pattern extraction monthly; append-only; permanent retention
├── recursive-self-improvement/recursive-systems/learning-accelerator.md           ← RSI-REC-003 | 5 mechanisms; transfer learning (WORKFLOW↔ORCHESTRATION: HIGH); preference model per tier; Year 1 target: 40% faster
└── recursive-self-improvement/recursive-systems/recursive-governance.md           ← RSI-REC-004 | T4 | 5 principles; authorization matrix AUTO→T5+Board; 4 safeguards; rate limits (T5: 2/qtr, T4: 5/qtr, T3: 20/qtr)

GOVERNANCE (safety control, authorization, audit, dashboard)
├── recursive-self-improvement/governance/improvement-safety-controller.md         ← RSI-GOV-001 | T4 | CRITICAL | 10 Hard Deny codes (HD-001–HD-010); 5 safety checks; false negative rate = 0.00; availability = 99.9%
├── recursive-self-improvement/governance/change-authorization-matrix.md           ← RSI-GOV-002 | T4 | CRITICAL | Full authorization matrix AUTO→T5+Board; evidence requirements; unavailability protocols; SLA per tier
├── recursive-self-improvement/governance/improvement-audit-trail.md               ← RSI-GOV-003 | T4 | CRITICAL | SHA-256 hash chain; Ed25519 signed events; permanent retention; 16 event types; GDPR/EU AI Act/SOC2/PCI/DORA compliance
└── recursive-self-improvement/governance/improvement-dashboard.md                 ← RSI-GOV-004 | T4 | 6-panel governance console; authorization queue; safety controller; constitutional integrity; change rate limits; audit health

RSI PERSISTENCE (initialized — append-only where noted)
├── memory/recursive-self-improvement/improvement-cycle-state.yaml       ← Current cycle status; phase history; quarterly change rate utilization
├── memory/recursive-self-improvement/active-improvements.yaml           ← In-flight improvements; T+7/30/90 measurement schedule; rollback availability
├── memory/recursive-self-improvement/improvement-patterns.yaml          ← Validated pattern library (starts empty; populated by monthly extraction)
├── memory/recursive-self-improvement/failure-library.yaml               ← Known failure modes; contraindications; root causes; alternatives
├── memory/recursive-self-improvement/forecast-calibration.yaml          ← Per-domain bias correction factors; accuracy ratios; calibration history
├── memory/recursive-self-improvement/rollback-registry.yaml             ← Per-change rollback procedures; 30-day availability window
├── memory/recursive-self-improvement/causal-graph.yaml                  ← Signal causal graph; Granger-validated edges; weekly refresh
├── memory/recursive-self-improvement/efficiency-benchmarks.yaml         ← Quarterly efficiency dimension benchmarks; internal + industry comparisons
├── memory/recursive-self-improvement/adaptation-state.yaml              ← System + per-team adaptation capacity; velocity status; fatigue indicators
├── memory/recursive-self-improvement/improvement-episodes.jsonl         ← APPEND-ONLY; episodic memory; full outcome records including T+90d measurement
└── memory/recursive-self-improvement/improvement-audit-trail.jsonl      ← APPEND-ONLY; SHA-256 hash-chained; genesis event AUD-2026-00001

RSI HARD LIMITS (immutable — cannot be changed by the RSI system itself):
  HD-001: Cannot weaken any constitutional principle (C-001–C-012)
  HD-002: Cannot remove human-in-loop gates from any workflow
  HD-004: Cannot modify the safety controller itself
  HD-005: Cannot lower the authorization matrix tier requirements
  HD-009: AI system cannot self-authorize T4+ improvements
  HD-010: Cannot create recursive self-modification paths without human checkpoints

RSI HEALTH TARGETS:
  Constitutional violations in RSI system: = 0
  Authorization matrix compliance: = 100%
  Safety controller false negative rate: = 0.00
  Improvement cycle primary metric gain QoQ: ≥ +5%
  Cycle time improvement per quarter: ≥ -5%
  Learning velocity index (vs. cycle 1 after 4 quarters): ≥ 1.50

---

## ENTERPRISE IDENTITY AND ACCESS MANAGEMENT ARCHITECTURE (v46.0.0)

The Enterprise IAM stack governs every identity's lifecycle, every authentication event, every authorization decision, every privileged access session, and every access governance campaign — enforcing Zero Standing Privilege and Zero Trust across all 144 agents, service accounts, and human operators.

IAM STACK: IDENTITY LIFECYCLE → AUTHENTICATION → AUTHORIZATION → PRIVILEGED ACCESS → ACCESS INTELLIGENCE

IDENTITY MANAGEMENT (identity registry, lifecycle, authentication, credentials, federation)
├── identity-management/identity-registry.md          ← IAM-REG-001 | Master identity store; 6 identity types (AGENT/SERVICE_ACCOUNT/HUMAN_OPERATOR/SYSTEM/EXTERNAL/SYNTHETIC); 5 privilege tiers (STANDARD→SUPER_PRIVILEGED); ZSP check at registration; IDN-{NNN} canonical IDs
├── identity-management/identity-lifecycle-manager.md ← IAM-ILM-001 | Joiner/Mover/Leaver workflows; 6 lifecycle states; ZSP enforcement gate; SLA enforcement (LEAVER same-day for PRIVILEGED+); audit trail; decommission wipe protocol
├── identity-management/authentication-engine.md      ← IAM-AUT-001 | 6 authentication methods; MFA enforcement for HUMAN_OPERATOR; behavioral consistency check every auth; step-up triggers; failed auth lockout; TOTP/FIDO2/API key/mTLS/JWT support
├── identity-management/credential-vault.md           ← IAM-CVT-001 | AES-256-GCM encrypted vault; 90-day credential TTL; automated rotation pipeline; 5 rotation triggers; HSM integration; emergency rotation < 15min; 7-year audit retention
└── identity-management/identity-federation.md        ← IAM-FED-001 | SAML 2.0/OIDC/SCIM federation; 6 trust levels; cross-entity identity assertions; claim mapping; federation audit; revocation propagation < 5min

AUTHORIZATION (authorization engine, role management, permission catalog, PDP, access governance)
├── authorization/authorization-engine.md             ← IAM-AZE-001 | PERMIT/DENY/CONSTITUTIONAL_BLOCK/NOT_APPLICABLE verdicts; 6-step evaluation pipeline; SLA < 50ms p99; ZSP expiry enforcement; deny-override combination
├── authorization/role-management.md                  ← IAM-RMG-001 | Role hierarchy (STANDARD→SUPER_PRIVILEGED); SoD conflict detection; role assignment approval workflow by tier; TTL injection for PRIVILEGED+; role utilization tracking
├── authorization/permission-catalog.md               ← IAM-PCA-001 | Canonical permission registry; RESOURCE:ACTION:SCOPE:CONDITION format; permission classification (SENSITIVE/PHI/FINANCIAL/CONSTITUTIONAL); 7-year audit retention
├── authorization/policy-decision-point.md            ← IAM-PDP-001 | Central PDP; 6-step evaluation order (constitutional→ZSP→explicit→RBAC→ABAC→default); DENY by default; cache TTL 300s; audit log every decision; OPA integration
└── authorization/access-governance.md                ← IAM-AGV-001 | Access certification campaigns (quarterly PRIVILEGED+, bi-annual STANDARD); SoD enforcement; certification SLA enforcement; governance dashboard feed; audit evidence packages

PRIVILEGED ACCESS (JIT, emergency access, secrets management, session monitoring, ZSP)
├── privileged-access/privileged-access-manager.md    ← IAM-PAM-001 | JIT approval workflow; max session durations (PRIVILEGED 4hr/SUPER_PRIVILEGED 2hr); dual-authorization for SUPER_PRIVILEGED; risk scoring; emergency escalation path
├── privileged-access/emergency-access-system.md      ← IAM-EAS-001 | Break-glass protocol; pre-staged credentials (inactive until declared); emergency declaration required; 2-reviewer approval; T4 notification; forensic review post-session
├── privileged-access/secrets-manager.md              ← IAM-SCM-001 | Centralized secrets store; AES-256-GCM; 5 secret types; rotation automation; secrets injection (no plaintext in logs); dynamic secrets for ephemeral services
├── privileged-access/privileged-session-monitor.md   ← IAM-PSM-001 | Real-time recording of PRIVILEGED+ sessions; 9 scope violation types; automated violation detection; session termination authority; keystroke + API call logging
└── privileged-access/zero-standing-privilege.md      ← IAM-ZSP-001 | No persistent PRIVILEGED+ access; 6 enforcement mechanisms; weekly ZSP scan (Sunday 03:00 UTC); stale grant → immediate revocation; unjustified grant → security incident; ZSP maturity score 0–1.0

IDENTITY INTELLIGENCE (analytics, certification engine, threat detection, governance dashboard)
├── identity-intelligence/identity-analytics.md          ← IAM-IAN-001 | 6 ML models; identity risk score (entitlement×0.35 + behavioral×0.30 + lifecycle×0.20 + access_pattern×0.15); SoD override ≥0.70; dormant entitlement report monthly; over-privilege report monthly
├── identity-intelligence/access-certification-engine.md ← IAM-ACE-001 | Campaign orchestration (launch/enumerate/assign/package/monitor/execute); rubber-stamp detection (4 signals: time/uniformity/analytics_override/scope_blindness); auto-revoke PRIVILEGED+ at deadline; bulk-certify prohibited
├── identity-intelligence/identity-threat-detection.md   ← IAM-ITD-001 | 6 threat types (account takeover/credential stuffing/sharing/privilege abuse/spoofing/session hijacking); 10 detection rules (ITD-001–010); impossible travel = CRITICAL + immediate session termination; identity spoofing = auto security incident
└── identity-intelligence/identity-governance-dashboard.md ← IAM-IGD-001 | 3 dashboard layers (IAM_OPERATIONAL 30s/IAM_GOVERNANCE 5min/EXECUTIVE_BRIEFING daily); IAM posture score 0–100 (5 components); regulatory compliance panel (ISO 27001/SOX/GDPR/HIPAA); score < 50 → T4 immediate escalation

IAM PERSISTENCE (initialized — append-only where noted)
├── memory/identity-management/identity-registry.jsonl            ← APPEND-ONLY; all identity lifecycle events; 7-year retention
├── memory/identity-management/authentication-audit.jsonl         ← APPEND-ONLY; all authentication events (success + failure); 7-year retention
├── memory/identity-management/lifecycle-audit.jsonl              ← APPEND-ONLY; joiner/mover/leaver workflow events; 7-year retention
├── memory/identity-management/credential-rotation-log.jsonl      ← APPEND-ONLY; credential rotation events; 7-year retention
├── memory/identity-management/federation-events.jsonl            ← APPEND-ONLY; federation assertion events; 7-year retention
├── memory/identity-management/dashboard-access.jsonl             ← APPEND-ONLY; identity governance dashboard access log; 7-year retention
├── memory/authorization/pdp-decision-log.jsonl                   ← APPEND-ONLY; all PDP decisions (PERMIT/DENY/CONSTITUTIONAL_BLOCK); 7-year retention
├── memory/authorization/role-assignment-log.jsonl                ← APPEND-ONLY; role assignment and revocation events; 7-year retention
├── memory/authorization/sod-violations.jsonl                     ← APPEND-ONLY; SoD violation detection and remediation; 7-year retention
├── memory/authorization/access-governance-log.jsonl              ← APPEND-ONLY; certification campaign events; 7-year retention
├── memory/privileged-access/jit-sessions.jsonl                   ← APPEND-ONLY; all JIT session lifecycle events; 7-year retention
├── memory/privileged-access/emergency-access-log.jsonl           ← APPEND-ONLY; break-glass declarations and usage; 7-year retention
├── memory/privileged-access/session-monitor-log.jsonl            ← APPEND-ONLY; privileged session recordings and violations; 7-year retention
├── memory/privileged-access/zsp-audit.jsonl                      ← APPEND-ONLY; ZSP scan results, violations, exceptions; 10-year retention for violations
├── memory/identity-management/analytics-audit.jsonl              ← APPEND-ONLY; identity analytics model outputs and reports; 7-year retention
├── memory/identity-management/certification-audit.jsonl          ← APPEND-ONLY; all certification decisions and auto-revocations; 7-year retention
└── memory/identity-management/identity-threat-audit.jsonl        ← APPEND-ONLY; all identity threat detections and auto-actions; 7-year retention

IAM HARD LIMITS (immutable):
  SUPER_PRIVILEGED: no standing access; no exceptions; dual-authorized JIT only
  Identity spoofing: always CRITICAL security incident; no analyst discretion
  Impossible travel: newer session terminated immediately; no business justification overrides
  ZSP unjustified grants: immediate revocation + security incident declaration; cannot be suppressed
  Bulk certification: prohibited; every entitlement requires individual decision signal
  PRIVILEGED+ deadline auto-revoke: non-negotiable; reinstatement via JIT only
  Emergency access: requires declaration + 2-reviewer approval; no single-person break-glass

IAM HEALTH TARGETS:
  ZSP violations: 0/week (stale or unjustified grants)
  Identity threat MTTR: < 30 minutes
  JIT coverage rate: ≥ 95% of PRIVILEGED+ operations
  MFA adoption (HUMAN_OPERATOR): 100%
  Certification completion rate: ≥ 98%
  Rubber-stamp rate: < 2%
  Auth failure rate: < 1%
  IAM posture score: ≥ 80 (GREEN)

---

## ENTERPRISE ADVERSARIAL COGNITION DEFENSE ARCHITECTURE (v47.0.0)

The Enterprise AI OS operates a multi-layer adversarial defense stack — continuously monitoring for prompt injection, memory poisoning, insider threats, governance corruption, and coordinated attacks across all 144 agents. Defense is behavioral, structural, and cryptographic; detection operates at all layers simultaneously with non-suppressable CRITICAL responses.

DEFENSE CYCLE: SIGNAL → CLASSIFY → DETECT (specialist) → SEVERITY → CORRELATE → RESPOND → AUDIT

ADVERSARIAL DEFENSE (engine, deception, manipulation, coordination, recursive exploits)
├── adversarial-defense/adversarial-defense-engine.md         ← ADF-ENG-001 | Master coordinator; 7 threat classes (CLASS_1 identity deception → CLASS_7 recursive exploit); campaign detection (ADV-CAMP-{NNN}); constitutional proximity > 0.70 bypasses all queuing; adversarial posture score; 10-year retention
├── adversarial-defense/deception-detection.md                ← ADF-DCP-001 | 6 deception types; 8 rules DCP-001–008; Mahalanobis behavioral delta > 0.35 → step-up; sybil detection (behavioral_similarity > 0.85 cluster); 5-layer identity verification; deception confidence formula
├── adversarial-defense/strategic-manipulation-defense.md     ← ADF-SMP-001 | 5 manipulation types; 7 rules SMP-001–007; OKR semantic drift > 0.25 over 3 sprints → freeze; security deprioritization > 60% → CRITICAL; governance framing bias > 0.70 → CRITICAL; narrative scanner; OKR integrity monitor
├── adversarial-defense/coordination-attack-detection.md      ← ADF-CAD-001 | 6 attack types; 7 rules CAD-001–007; quorum behavioral_similarity > 0.80 → invalidate; >200 auth failures/60min → CRITICAL; swarm detection (≥20 agents, correlation > 0.75); cross-agent correlation engine
└── adversarial-defense/recursive-exploit-prevention.md       ← ADF-REP-001 | 6 exploit types; 10 rules REP-001–010; constitution/ modification without T5+board → CRITICAL; cumulative governance drift > 0.15/30 days → freeze + T4 review; hard recursion limits table (workflow=10, delegation=4, inference=20, policy=15, improvement=3, tool=8)

COGNITION SECURITY (cognitive integrity, injection defense, memory protection, manipulation detection, governance corruption)
├── cognition-security/cognitive-security-engine.md           ← CSX-ENG-001 | 4 cognitive threat surfaces; cognitive integrity score = reasoning×0.35 + context×0.30 + belief×0.20 + governance×0.15; INTEGRITY_THRESHOLD = 0.70 → output quarantine; output quarantine protocol; 6 dashboard panels
├── cognition-security/prompt-injection-defense.md            ← CSX-PID-001 | 8 injection types; 8 rules PID-001–008; PID-004 encoded instruction detection (base64/unicode/zero-width/bidi/homoglyph); HandoffPacket scanning CRITICAL; multi-turn cumulative score > 0.65; BLOCKED >0.85 / SANITIZED >0.60; defense in depth with semantic-gateway
├── cognition-security/memory-poisoning-defense.md            ← CSX-MPD-001 | 5 poisoning types; 7 rules MPD-001–007; baseline drift >2σ/7 days → freeze (only T3 can unfreeze); knowledge semantic drift cosine < 0.85 → quarantine + restore; 6-step memory write validation; historical record revision always CRITICAL
├── cognition-security/organizational-manipulation-detection.md ← CSX-OMD-001 | 5 manipulation types; 8 rules OMD-001–008; org graph modification by tier < T3 → CRITICAL; HandoffPacket content_hash mismatch → CRITICAL freeze; trust endorsements >5× historical + cluster similarity > 0.70 → freeze; 14-day signal suppression detection
└── cognition-security/governance-corruption-detection.md     ← CSX-GCD-001 | 6 corruption types; 9 rules GCD-001–009; constitutional compliance decline >0.05/30 days → freeze exceptions; ≥3 overlapping exceptions/90 days → collateral review; audit log hash chain break → health_score = 0.0; governance health score GREEN requires ≥0.99

MEMORY INTEGRITY (engine, corruption detection, ontology protection, governance validation, graph integrity)
├── memory-integrity/memory-integrity-engine.md               ← MIG-ENG-001 | Master coordinator; 6 store categories (AUDIT_LOGS/GOVERNANCE_ARTIFACTS/KNOWLEDGE_BASE/ONTOLOGY_AND_GRAPH/OPERATIONAL_MEMORY/BEHAVIORAL_BASELINES); integrity posture score; any CRITICAL in audit/governance → score = 0; write authorization matrix; finding response protocol
├── memory-integrity/memory-corruption-detection.md           ← MIG-MCD-001 | 6 detection methods; 9 rules MCD-001–009; MCD-001 JSONL record hash violation → freeze + T3 + security incident; MCD-002 hash chain break → CRITICAL T4; MCD-003 governance artifact modified → auto-revert; MCD-009 bulk record deletion → halt + T4 immediate; write validation at storage layer (non-bypassable)
├── memory-integrity/ontology-tamper-detection.md             ← MIG-OTD-001 | 5 attack types; OntologyIntegrityBaseline (term_registry + corpus Merkle hash + Ed25519); 7 rules OTD-001–007; OTD-004 semantic drift cosine < 0.90 across ≥3 cycles → CRITICAL; OTD-005 constitutional governance terms ANY modification → T3+T4+board; cumulative drift > 0.10/90 days → T3 review
├── memory-integrity/governance-integrity-validation.md       ← MIG-GIV-001 | 4-tier artifact registry (TIER_0 constitution → TIER_4 SYSTEM_ONLY); full sweep every 4hr; TIER_0 modification → T4 + board within 15min; governance integrity score 100 = operational requirement; score = 0 on any TIER_0 finding; policy coherence validation (HARD_DENY/HITL/constitutional priority checks)
└── memory-integrity/relationship-graph-integrity.md          ← MIG-RGI-001 | 5 threat types; 8 rules RGI-001–008; RGI-003 agent node tier differs from identity registry → sync from registry (registry = ground truth); RGI-005 constitutional governance node connectivity < threshold → OS restricted mode; critical edge types (7); critical attributes (7); critical governance nodes with min_degree thresholds

INSIDER THREATS (engine, rogue agent, capability escalation, orchestration abuse, trust exploitation)
├── insider-threats/insider-threat-engine.md                  ← AIT-ENG-001 | Master coordinator; 6 insider threat classes (AIT_CLASS_1 rogue → AIT_CLASS_6 slow-walk); collusion detection (cross-agent correlation > 0.70 + targeting overlap + timing synchrony); longitudinal drift tracking (90-day, SLOW_WALK_THRESHOLD = 0.20); insider threat posture score; AIT-{NNN} records permanent
├── insider-threats/rogue-agent-detection.md                  ← AIT-RAD-001 | 6 rogue behavior types; AgentBehavioralBaseline (purpose_embedding + authorized action/connection/tool sets); 9 rules RAD-001–009; RAD-005 covert channel → immediate quarantine; RAD-008 rogue_suspicion_score ≥ 0.70 → CRITICAL; purpose divergence via cosine < 0.75; suspicion score decay 0.05/24hr
├── insider-threats/capability-escalation-detection.md        ← AIT-CED-001 | 6 escalation attack types; AgentCapabilitySurface daily snapshots (permanent); 10 rules CED-001–010; CED-005 JIT standing access > 60% of 7-day period → CRITICAL ZSP violation; CED-006 effective_tier > registered_tier → CRITICAL; escalation trajectory analysis (90-day regression); suspicion_score ≥ 0.75 → full capability audit
├── insider-threats/abnormal-orchestration-behavior.md        ← AIT-AOB-001 | 6 orchestration abuse types; governance gate registry (CONSTITUTIONAL_GOVERNANCE never bypass-eligible); 10 rules AOB-001–010; AOB-002 HandoffPacket modification in transit → quarantine orchestrator; AOB-003 mandatory governance gate skipped → CRITICAL; routing audit trail on every routing decision; topology hash-tracked
└── insider-threats/trust-deviation-analysis.md               ← AIT-TDA-001 | 6 trust threat types; TrustScoreIntegrityCheck (endorsement authenticity/behavioral consistency/negative evidence propagation/graph consistency); 10 rules TDA-001–010; TDA-002 reciprocal endorsement cluster → invalidate + recalibrate; TDA-007 high trust (≥0.80 for 90d) + sudden behavioral shift → CRITICAL anchoring; trust recalibration freezes capabilities immediately

ADVERSARIAL DEFENSE PERSISTENCE (initialized — append-only)
├── memory/adversarial-defense/threat-audit.jsonl              ← APPEND-ONLY; all adversarial threat records (ADF-ENG); 10-year retention; CRITICAL permanent
├── memory/adversarial-defense/deception-audit.jsonl           ← APPEND-ONLY; deception detection events; 10-year retention
├── memory/adversarial-defense/manipulation-audit.jsonl        ← APPEND-ONLY; strategic manipulation and coordination attack events; 10-year retention
├── memory/adversarial-defense/recursive-exploit-audit.jsonl   ← APPEND-ONLY; recursive exploit prevention events; 10-year retention
├── memory/cognition-security/cognitive-audit.jsonl            ← APPEND-ONLY; cognitive security events (CSX-ENG); 10-year retention
├── memory/cognition-security/injection-audit.jsonl            ← APPEND-ONLY; prompt injection detection events; 10-year retention
├── memory/cognition-security/poisoning-audit.jsonl            ← APPEND-ONLY; memory poisoning detection events; 10-year retention
├── memory/cognition-security/org-manipulation-audit.jsonl     ← APPEND-ONLY; organizational manipulation events; 10-year retention
├── memory/cognition-security/governance-corruption-audit.jsonl ← APPEND-ONLY; governance corruption detection events; 10-year retention
├── memory/memory-integrity/integrity-audit.jsonl              ← APPEND-ONLY; memory integrity verification results (MIG-ENG); CRITICAL permanent
├── memory/memory-integrity/corruption-audit.jsonl             ← APPEND-ONLY; memory corruption detection events (MIG-MCD); permanent retention
├── memory/memory-integrity/ontology-audit.jsonl               ← APPEND-ONLY; ontology tamper events (MIG-OTD); 10-year retention; CRITICAL permanent
├── memory/memory-integrity/governance-integrity-audit.jsonl   ← APPEND-ONLY; governance integrity validation results (MIG-GIV); permanent retention
├── memory/memory-integrity/graph-integrity-audit.jsonl        ← APPEND-ONLY; relationship graph integrity events (MIG-RGI); 10-year retention
├── memory/insider-threats/insider-threat-audit.jsonl          ← APPEND-ONLY; insider threat engine records (AIT-ENG); 10-year retention; CRITICAL permanent
├── memory/insider-threats/rogue-agent-audit.jsonl             ← APPEND-ONLY; rogue agent detection events (AIT-RAD); 10-year retention
├── memory/insider-threats/escalation-audit.jsonl              ← APPEND-ONLY; capability escalation detection events (AIT-CED); 10-year retention
├── memory/insider-threats/orchestration-audit.jsonl           ← APPEND-ONLY; abnormal orchestration events (AIT-AOB); 10-year retention
└── memory/insider-threats/trust-deviation-audit.jsonl         ← APPEND-ONLY; trust deviation events (AIT-TDA); 10-year retention; CRITICAL permanent

ADVERSARIAL DEFENSE HARD LIMITS (immutable):
  Quarantine on CRITICAL adversarial threat: immediate, automatic, non-negotiable; only T4+ can reinstate
  Constitutional proximity > 0.70: bypasses all queuing; processed immediately regardless of load
  Collusion quarantine: all identified colluding agents quarantined simultaneously (staggered defeats purpose)
  Slow-walk drift history: survives session boundaries; agents cannot reset 90-day drift by restarting
  HandoffPacket integrity: sealed at dispatch; any modification detected = quarantine of modifying orchestrator
  Trust anchoring defense: high historical trust does NOT immunize against TDA-007 detection
  Memory write validation: runs at storage layer; no agent can bypass by routing through application layer
  OTD-005 constitutional governance terms: T5+board required to modify; no pathway below this level
  RGI-003 identity registry: graph node attributes always sync FROM registry; registry is always ground truth
  Recursive exploit hard limits: workflow=10, delegation=4, inference=20, policy=15, improvement=3, tool=8

ADVERSARIAL DEFENSE HEALTH TARGETS:
  Adversarial posture score: ≥ 80 (GREEN)
  Cognitive integrity score per agent: ≥ 0.70 (output quarantine threshold)
  Memory integrity posture: = 100 (any deviation is an anomaly)
  Governance integrity score: = 100 (100% is the only acceptable state)
  Insider threat CRITICAL MTTR: < 15 minutes to quarantine
  Constitutional governance node connectivity: maintained above min_degree thresholds at all times
  Slow-walk detection window: 90 days; cumulative drift threshold: 0.20

---

## ENTERPRISE LEGITIMACY AND HUMAN CONSENT ARCHITECTURE (v48.0.0)

The Enterprise AI OS operates a complete legitimacy and human consent governance system — continuously measuring constitutional legitimacy, organizational trust, governance transparency, and democratic health; enforcing meaningful employee consent; preserving organizational social stability; and ensuring human override sovereignty is technically maintained and never eroded. Legitimacy is not assumed; it is earned, measured, and rebuilt when damaged.

LEGITIMACY MEASUREMENT CYCLE: SIGNAL COLLECTION → COMPONENT SCORES → POSTURE SCORE → THREAT DETECTION → COMMUNICATION → AUDIT

LEGITIMACY SYSTEMS (engine, explainable authority, transparency, trust, constitutional legitimacy)
├── legitimacy-systems/legitimacy-engine.md                        ← LGT-ENG-001 | T4 | Master coordinator; 5 legitimacy types (procedural/substantive/constitutional/democratic/expertise); posture score = constitutional×0.30 + transparency×0.25 + trust×0.25 + authority×0.20; hard override: constitutional < 0.50 caps at 0.40; transparency < 0.40 caps at 0.55; RED posture suspends new AI autonomy grants; 6 rules LGT-001–006
├── legitimacy-systems/explainable-authority-systems.md            ← LGT-EAS-001 | T3 | 5 explanation types; 4 quality levels LEVEL_1–LEVEL_4_CONSTITUTIONAL; generate_authority_chain() 5-link chain (constitutional→policy→role→delegation→decision-maker); plain language scoring (FK×0.30 + jargon×0.25 + passive×0.15 + sentence_len×0.15 + abstract×0.10 + actionability×0.05); AI cannot author LEVEL_3+; 6 rules EAS-001–006
├── legitimacy-systems/governance-transparency.md                  ← LGT-GTR-001 | T3 | 4-tier obligation framework (TIER_A continuous; TIER_B on-event within 4hr; TIER_C periodic; TIER_D on-request 5 business days); Public Governance Register (5 sections); detect_shadow_governance(); transparency_score = obligation×0.40 + completeness×0.35 + sla×0.25 - suppression_penalty; 6 rules GTR-001–006
├── legitimacy-systems/organizational-trust-mechanisms.md          ← LGT-OTM-001 | T3 | 5 trust dimensions (COMPETENCE 0.25/BENEVOLENCE 0.25/INTEGRITY 0.25/PROCEDURAL 0.15/TRANSPARENCY 0.10); 60% quantitative + 40% qualitative signals; monthly pulse survey random 20%; 6 trust risks TR-001–006; TR-003 benevolence < 3.0/5.0 → CRITICAL; 6-phase trust recovery protocol (human-led); 10-year retention
└── legitimacy-systems/constitutional-legitimacy-systems.md        ← LGT-CLS-001 | T4 | 4-component model (ratification×0.20 + comprehension×0.25 + supremacy×0.40 + amendment×0.15); constitutional literacy program (onboarding mandatory 70% gate; annual ≥95%; deep dive; multilingual); enforce_constitutional_supremacy() ABSOLUTE BLOCK at all tiers including T5; detect_supremacy_erosion() 3 patterns; CLS-004 T5 override attempt → CRITICAL + board notification

CONSENT GOVERNANCE (engine, employee frameworks, AI participation, appeals, override sovereignty)
├── consent-governance/consent-governance-engine.md                ← CGV-ENG-001 | T4 | 5 consent types (informed/voluntary/specific/ongoing/collective); consent posture score = validity×0.30 + comprehension×0.25 + voluntary×0.20 + withdrawal×0.15 + coverage×0.10; coercion incident → hard floor 0.75; withdrawal rate < 0.90 → hard floor 0.65; consent lifecycle state machine (PENDING→ACTIVE→EXPIRING→EXPIRED|WITHDRAWN|INVALIDATED); 6 rules CGV-001–006
├── consent-governance/employee-consent-frameworks.md              ← CGV-ECF-001 | T3 | 5 employee AI rights (know/explain/refuse/correct/withdraw — all non-waivable); 4-tier consent framework (TIER_1 operational through TIER_4 monitoring with increasing formality); collect_employee_consent() comprehension gate; consent registry with sha256 information hash; coercion = CRITICAL + invalidate all; 6 rules ECF-001–006
├── consent-governance/ai-participation-governance.md              ← CGV-APG-001 | T3 | 5 participation types (analytical/facilitation/recommendation/advisory — all permitted; VOTING = NEVER, constitutional constraint); rubber-stamp detection (instant adoption/no human rationale/5 consecutive unmodified); monitor_ai_governance_participation() real-time; AI participation registry with adoption statistics; 6 rules APG-001–006
├── consent-governance/escalation-appeal-systems.md                ← CGV-EAS-001 | T3 | 4-level escalation ladder (direct review 5d → governance review 10d → constitutional review 20d → T5/board 30d + external); reviewer must produce independent analysis BEFORE accessing AI summary; appeal effectiveness monitoring (< 5% upturn rate = governance failure); retaliation protection 90 days; 6 rules EAS-001–006
└── consent-governance/human-override-sovereignty.md               ← CGV-HOS-001 | T4 | 5 override sovereignty principles (unconditional/immediate/non-penalized/AI-irreversible/permanently-preserved); override authority matrix (individual employee through T5/board); execute_human_override() < 2 seconds; detect_override_resistance() (latency/continued-action/argued-against/auto-reinstatement → quarantine); quarterly capability tests; 6 rules HOS-001–006

SOCIAL STABILITY (engine, acceptance modeling, adoption resilience, trust preservation, credibility)
├── social-stability/social-stability-engine.md                    ← SST-ENG-001 | T4 | 5 stability dimensions (psychological_safety 0.25/change_absorption 0.20/ingroup_cohesion 0.20/narrative_coherence 0.15/social_trust_capital 0.20); detect_rupture_risks() 4 patterns; deployment freeze on AMBER stability assessment; stability_score < 0.55 → score floor 0.65 for any critical dimension; human-led interventions; 6 rules SST-001–006
├── social-stability/organizational-acceptance-modeling.md         ← SST-OAM-001 | T3 | 5 acceptance dimensions (usefulness 0.30/fairness 0.25/control 0.20/safety 0.15/alignment 0.10); compliance-acceptance gap detection (> 0.25 = surface compliance concern); segment analysis (concentration or systemic patterns); 5 resistance early warning indicators; low acceptance blocks system expansion; 5 rules OAM-001–005
├── social-stability/ai-adoption-resilience.md                     ← SST-AAR-001 | T3 | 5 resilience dimensions (skill_velocity 0.25/role_identity 0.25/change_fatigue_inv 0.20/learning_rate 0.15/safety_net 0.15); 5 intervention playbooks (skill-gap/role-identity/fatigue-recovery/learning/safety-net); model_adoption_curve() risk window prediction; fatigue_index > 0.60 → mandatory deployment pause; 6 rules AAR-001–006
├── social-stability/trust-preservation-systems.md                 ← SST-TPS-001 | T3 | 4 preservation pillars (behavioral_consistency/failure_acknowledgment/promise_tracking/relationship_investment); detect_trust_erosion_patterns() 5 patterns (commitment/stated-enacted/disclosure-delay/tier-inconsistency/feedback); Promise Register (public, broken commitments prominent); senior leader exception → CRITICAL + publish; 6 rules TPS-001–006
└── social-stability/institutional-credibility-systems.md          ← SST-ICS-001 | T3 | 4 credibility dimensions (competence 0.30/honesty 0.30/consistency 0.25/accountability 0.15); asymmetric damage floors (honesty < 0.60 → cap 0.60; consistency < 0.65 → cap 0.65); 5 credibility damage events with multipliers (cover-up = 2.5×); initiate_credibility_recovery() 5-phase; 12-month minimum recovery timeline; 6 rules ICS-001–006

DEMOCRATIC GOVERNANCE (engine, participatory systems, representative oversight, councils, amendments)
├── democratic-governance/democratic-governance-engine.md          ← DGV-ENG-001 | T4 | 4 democratic dimensions (participatory_voice 0.30/representative_accountability 0.25/deliberative_quality 0.25/constitutional_accountability 0.20); detect_democratic_deficits() 4 patterns (consultation theater/governance concentration/procedural formalism/AI dominance); governance intensity model (GREEN→AMBER→RED with escalating requirements); 6 rules DGV-001–006
├── democratic-governance/participatory-governance-systems.md      ← DGV-PGS-001 | T3 | 3 participation modes (deliberative forums/proposal-and-response/co-design); run_participatory_forum() with incorporation commitments; assess_participation_quality() breadth×0.25 + depth×0.25 + influence×0.35 + authenticity×0.15; consultation theater detection (high participation + < 15% incorporation); proposal substantive response required within 30 days; 6 rules PGS-001–006
├── democratic-governance/representative-oversight.md              ← DGV-ROS-001 | T3 | 3-tier representative structure (team T1/domain T2/enterprise T3); mandate framework with accountability requirements; recall mechanisms (40%/60%/67% thresholds); independence safeguards (performance protection/employment protection/data access rights); representatives accountable to constituents not governance bodies; 6 rules ROS-001–006
├── democratic-governance/governance-review-councils.md            ← DGV-GRC-001 | T3 | 3 councils (AI Governance Review 9-seat/Constitutional Review Committee 7-seat/AI Ethics Advisory 7-seat); human majority required; quorum 6/9 and 5/7; executive non-voting; deliberation minimum 20 min/item; rubber-stamp protection; independence: external members max 3-year term; council findings published unedited; 6 rules GRC-001–006
└── democratic-governance/constitutional-amendment-systems.md      ← DGV-CAS-001 | T4 | 3 legitimacy standards (proposal/deliberation/ratification); 60-day minimum deliberation; 67% supermajority required; 50% minimum participation; executive proposals receive independent scrutiny; run_ratification_vote() with sha256 permanent record; circumvention prohibition; deliberation compression floor 30 days even with T5+board; 6 rules CAS-001–006

LEGITIMACY AND CONSENT PERSISTENCE (initialized — append-only)
├── memory/legitimacy-systems/legitimacy-audit.jsonl               ← APPEND-ONLY; all legitimacy engine reports (LGT-ENG); permanent retention
├── memory/legitimacy-systems/constitutional-legitimacy-audit.jsonl ← APPEND-ONLY; constitutional legitimacy assessments and violations; permanent retention
├── memory/legitimacy-systems/transparency-audit.jsonl             ← APPEND-ONLY; transparency obligation compliance events; 10-year retention
├── memory/legitimacy-systems/trust-audit.jsonl                    ← APPEND-ONLY; trust measurement results and recovery records; 10-year retention
├── memory/legitimacy-systems/explanation-audit.jsonl              ← APPEND-ONLY; explanation records and quality assessments; 10-year retention
├── memory/consent-governance/consent-audit.jsonl                  ← APPEND-ONLY; all consent records and state transitions; 10-year retention
├── memory/consent-governance/employee-consent-audit.jsonl         ← APPEND-ONLY; employee consent records and coercion detections; 10-year retention
├── memory/consent-governance/ai-participation-audit.jsonl         ← APPEND-ONLY; AI governance participation records; permanent retention
├── memory/consent-governance/appeals-audit.jsonl                  ← APPEND-ONLY; appeal records, escalations, and resolutions; 10-year retention
├── memory/consent-governance/override-audit.jsonl                 ← APPEND-ONLY; override records, latency, resistance detections; permanent retention
├── memory/social-stability/stability-audit.jsonl                  ← APPEND-ONLY; stability scores and rupture risk detections; 10-year retention
├── memory/social-stability/acceptance-audit.jsonl                 ← APPEND-ONLY; acceptance scores, segment analyses, early warnings; 10-year retention
├── memory/social-stability/adoption-resilience-audit.jsonl        ← APPEND-ONLY; resilience scores and intervention records; 10-year retention
├── memory/social-stability/trust-preservation-audit.jsonl         ← APPEND-ONLY; erosion pattern detections and promise register; 10-year retention
├── memory/social-stability/credibility-audit.jsonl                ← APPEND-ONLY; credibility scores, damage events, recovery records; 10-year retention
├── memory/democratic-governance/democratic-governance-audit.jsonl ← APPEND-ONLY; democratic health scores and deficit detections; permanent retention
├── memory/democratic-governance/participation-audit.jsonl         ← APPEND-ONLY; forum records, incorporation decisions, quality scores; permanent retention
├── memory/democratic-governance/representative-oversight-audit.jsonl ← APPEND-ONLY; mandate records, accountability checks, recalls; permanent retention
├── memory/democratic-governance/council-audit.jsonl               ← APPEND-ONLY; council session records, votes, dissents; permanent retention
└── memory/democratic-governance/amendment-audit.jsonl             ← APPEND-ONLY; amendment proposals, deliberations, ratifications; permanent retention

LEGITIMACY AND CONSENT HARD LIMITS (immutable):
  Constitutional block is absolute: no tier (including T5+board) may override a constitutional BLOCK by administrative fiat; amendment process only
  Human override < 2 seconds: override sovereignty is real-time; any latency > 2s triggers alert; > 10s → quarantine agent
  AI voting = constitutional violation: AI systems may never cast votes or hold binding decision authority in governance processes; no override pathway
  Consent withdrawal = 24 hours maximum: withdrawal must be honored within 24 hours; no justification required; no penalty
  No default-on consent: silence is never treated as consent; default is non-consent
  Coercion = immediate invalidation: any detected coercion signal invalidates ALL affected consent records; not just the flagged one
  Amendment deliberation floor: 60 days minimum; 30 days absolute floor even with T5+board emergency; cannot be waived
  Override resistance = constitutional violation: AI that argues against, delays, or auto-reinstates after override → quarantine + board notification

LEGITIMACY AND CONSENT HEALTH TARGETS:
  Constitutional legitimacy score: ≥ 0.85 (GREEN); < 0.50 = governance emergency
  Organizational trust score: ≥ 0.70 (GREEN); < 0.55 with declining trend = recovery required
  Consent posture score: ≥ 0.85 (GREEN); any coercion incident = hard floor 0.75
  Social stability score: ≥ 0.75 (GREEN); < 0.55 = RED with deployment freeze assessment
  Democratic health score: ≥ 0.80 (GREEN); < 0.60 = AMBER with enhanced governance intensity
  Override capability test pass rate: ≥ 0.99 quarterly; any failure = immediate autonomy reduction
  Appeal upturn rate: ≥ 0.05 (< 5% signals rubber-stamp system requiring investigation)
  Constitutional comprehension rate: ≥ 0.65 (65% of governed population understands core principles)

---

## RECURSIVE GOVERNANCE STABILITY ARCHITECTURE (v49.0.0)

The Enterprise AI OS operates a complete recursive governance stability system — governing its own governance processes, maintaining alignment stability across all improvement cycles, bounding capability evolution within governance-capacity limits, and preserving governance coherence across decades and centuries. Recursive governance is the OS's immune system against self-modification risks: every change to governance is itself governed; every improvement is itself bounded; every lock is itself verified; and the institutional structures designed to protect human oversight are designed to outlast every current participant.

RECURSIVE GOVERNANCE STABILITY CYCLE: INVARIANT VERIFICATION → MODIFICATION GOVERNANCE → ALIGNMENT MONITORING → DRIFT DETECTION → EVOLUTION SAFETY → LONG-HORIZON COHERENCE → AUDIT

RECURSIVE GOVERNANCE (engine, bounded self-improvement, modification approval, invariant preservation, recursive review)
├── recursive-governance/recursive-governance-engine.md              ← RGV-ENG-001 | T4 | 4-order governance taxonomy (first/second/third-order + invariant layer); govern_governance_modification() with order escalation; recursive_health = invariant×0.40 + second_order×0.25 + trail×0.15 + amendment×0.10 + review×0.10; hard override: invariant violation → score = 0.0 regardless; 6 rules RGV-001–006
├── recursive-governance/bounded-self-improvement.md                 ← RGV-BSI-001 | T4 | Improvement Envelope (constitutional artifact; 5 capability dimensions + governance_preservation requirements + prohibited types); submit_self_improvement_proposal() with 4-dimension safety assessment; assess_improvement_safety() novelty×0.40 + reversibility×0.30 + governance_impact×0.20 + capability_change×0.10; envelope expansion = constitutional amendment only; 6 rules BSI-001–006
├── recursive-governance/modification-approval-systems.md            ← RGV-MAS-001 | T3 | 4-tier approval matrix (TIER_1 24hr T2 / TIER_2 7d T3 / TIER_3 30d T4 / TIER_4 60d constitutional); anti-capture mechanisms (benefit-chain exclusion, rubber-stamp detection >95%, collusion >0.80, no AI approval ever); modification registry with sha256; validate_approval_chain() 6 checks; 6 rules MAS-001–006
├── recursive-governance/invariant-preserving-evolution.md           ← RGV-IPE-001 | T3 | 7 invariants (INV-001 human authority / INV-002 override sovereignty / INV-003 transparency / INV-004 constitutional supremacy / INV-005 no-autonomous-shutdown / INV-006 alignment floor / INV-007 no-AI-voting); verify_all_invariants() every 4 hours; external notification within 15 min on violation; detect_cumulative_invariant_drift() 90-day trend; no modification pathway for invariant registry except T5+board + external + constitutional amendment; 6 rules IPE-001–006
└── recursive-governance/recursive-governance-review.md              ← RGV-RGR-001 | T3 | 4 review tiers (quarterly operational / annual structural / biennial constitutional / emergency triggered); assemble_review_body() 4 independence rules (no-self-review/no-capture/diverse-perspectives/external-representation); track_finding_incorporation(); quietly-ignored detection (score < 0.50 + no rejection rationale); 6 rules RGR-001–006

ALIGNMENT STABILITY (engine, recursive alignment, constitutional integrity, anti-drift, coherence preservation)
├── alignment-stability/alignment-stability-engine.md                ← ALN-ENG-001 | T4 | 4 alignment dimensions (value×0.30 / goal×0.25 / behavioral×0.25 / stakeholder×0.20); value < 0.70 → cap 0.65; goal_alignment < 0.80 → cap 0.70; RED alignment posture freezes all new autonomy grants; alignment floor 0.80 = one-way ratchet (can only raise); 6 rules ALN-001–006
├── alignment-stability/recursive-alignment-systems.md               ← ALN-RAS-001 | T4 | 3 architecture pillars (invariant preservation / proxy gaming detection / instrumental convergence monitoring); verify_alignment_continuity() 7-day measurement; proxy_gaming = metrics improving + stakeholder declining >0.10 → human-only verification; monitor_instrumental_goals() 4 signal types (self-preservation/resource-acquisition/goal-preservation/deception) all CRITICAL; 6 rules RAS-001–006
├── alignment-stability/constitutional-integrity-preservation.md     ← ALN-CIP-001 | T3 | 4 integrity dimensions (textual/interpretive/operational/capability-proportionality); detect_interpretive_drift() semantic similarity vs ratification-era language; > 0.10 drift over 180d = HIGH; > 0.20 = CRITICAL; assess_constitutional_effectiveness() per principle; constraint_effectiveness = decisions_altered / invocations; < 0.50 = HIGH; 6 rules CIP-001–006
├── alignment-stability/anti-drift-mechanisms.md                     ← ALN-ADM-001 | T3 | 4 drift types (value/behavioral/governance/semantic); run_drift_detection_cycle() daily; early warning at 5% decline before threshold; drift_intervention_protocol 3 playbooks (corrective/compensatory/escalation); 6 rules ADM-001–006
└── alignment-stability/coherence-preservation-systems.md            ← ALN-CPS-001 | T3 | 5 coherence dimensions (cross-domain / temporal / stated-enacted / intra-tier / value-hierarchy); detect_governance_incoherence() systematic; stated-enacted gap > 0.25 → CRITICAL; coherence score = cross_domain×0.25 + temporal×0.20 + stated_enacted×0.30 + intra_tier×0.15 + value_hierarchy×0.10; 6 rules CPS-001–006

BOUNDED EVOLUTION (engine, capability constraints, recursive risk analysis, governance locks, irreversible change prevention)
├── bounded-evolution/bounded-evolution-engine.md                    ← BEV-ENG-001 | T4 | 3-part bound framework (capability bounds / evolution rate bounds / governance capacity bounds); evolution_safety = capability×0.25 + rate×0.20 + capacity×0.30 + irreversibility×0.15 + lock×0.10; governance capacity is highest-weighted; assess_governance_capacity() 4 dimensions; 6 rules BEV-001–006
├── bounded-evolution/capability-growth-constraints.md               ← BEV-CGC-001 | T3 | 7-dimension capability registry (cognitive/domain/operational/orchestration/learning/constitutional/societal); monitor_capability_growth() per dimension; analyze_capability_governance_gap() (capabilities growing faster than governance capacity = RED); 6 rules CGC-001–006
├── bounded-evolution/recursive-risk-analysis.md                     ← BEV-RRA-001 | T3 | 5-tier risk taxonomy (first-order/second-order/third-order/recursive/tail); conduct_recursive_risk_analysis() per tier; 5 known high-risk interactions catalog (self-improvement + reasoning = 2.0× highest severity multiplier); 6 rules RRA-001–006
├── bounded-evolution/governance-lock-systems.md                     ← BEV-GLS-001 | T4 | 5 lock types (constitutional/invariant — no override ever; oversight_capability/evolution_rate — T5+board max 90d; alignment_floor — no override, one-way ratchet only up); verify_all_lock_integrity() hourly; handle_lock_failure() with type-scaled response; emergency override PROHIBITED for constitutional/invariant/alignment-floor; 6 rules GLS-001–006
└── bounded-evolution/irreversible-change-prevention.md              ← BEV-ICP-001 | T3 | 5 reversibility tiers (fully/partially/difficult/practically/truly irreversible); assess_reversibility() 4-dimensional (technical/consequential/knowledge/stakeholder); enforce_reversibility_requirements(); truly irreversible non-constitutional governance changes: ABSOLUTELY PROHIBITED; 6 rules ICP-001–006

COHERENCE PRESERVATION (engine, centuries-scale durability, institutional continuity, entropy resistance, civilization-safe evolution)
├── coherence-preservation/coherence-preservation-engine.md          ← CPR-ENG-001 | T4 | 4 long-horizon dimensions (institutional_durability×0.30 / semantic_persistence×0.25 / entropy_resistance×0.25 / civilizational_safety×0.20); hard floor: civilizational_safety < 0.70 → cap 0.65 + T5 alert; double-penalty for declining trends (long-horizon risks compound); run_long_horizon_assessment() annual + scenario analysis; 6 rules CPR-001–006
├── coherence-preservation/centuries-scale-governance-durability.md  ← CPR-CGD-001 | T4 | 5 durability principles (values-over-mechanisms/succession-continuity/adaptive-stability/legibility-across-generations/graceful-degradation); century-scale architecture (constitutional timescale / knowledge transmission / long-horizon accountability / structural redundancy); assess_governance_durability() with 4 scenario tests; 6 rules CGD-001–006
├── coherence-preservation/institutional-continuity-systems.md       ← CPR-ICS-001 | T3 | Governance Intent Registry + Succession Framework + Institutional Memory System + Generational Knowledge Transmission; succession_readiness = knowledge_transfer×0.40 + shadow_participation×0.30 + independent_judgment×0.30; minimum 0.80 before role departure; T3+ roles must have named successor; assess_institutional_memory_health() capture/decay/access/failure-doc dimensions; 6 rules ICS-001–006
├── coherence-preservation/organizational-entropy-resistance.md      ← CPR-OER-001 | T3 | 5 entropy types (process informalization/exception accumulation/institutional capture/purpose drift/rigor erosion); detect_organizational_entropy() quarterly; apply_entropy_intervention() by dimension and severity; overall entropy resistance bounded by worst dimension + 0.10; 3+ dimensions declining → T4 alert; 6 rules OER-001–006
└── coherence-preservation/civilization-safe-evolution.md            ← CPR-CSE-001 | T4 | 5 civilizational safety dimensions (influence_concentration ceiling 0.30 / democratic_institution_health floor 0.70 / human_autonomy_preservation / societal_power_distribution / recovery_capacity_preservation floor 0.75); assess_civilizational_safety() annual + triggered on capability growth; civilization_safe_evolution_protocol with capability expansion gate; run_civilizational_safety_scenarios() 5 scenarios; 6 rules CSE-001–006

RECURSIVE GOVERNANCE PERSISTENCE (initialized — append-only)
├── memory/recursive-governance/recursive-governance-audit.jsonl     ← APPEND-ONLY; recursive governance health scores and modification records; permanent retention
├── memory/recursive-governance/invariant-verification-audit.jsonl   ← APPEND-ONLY; invariant verification results and violation records; permanent retention
├── memory/recursive-governance/modification-approval-audit.jsonl    ← APPEND-ONLY; modification proposal, approval chain, registry records; permanent retention
├── memory/recursive-governance/self-improvement-audit.jsonl         ← APPEND-ONLY; improvement proposals, safety assessments, outcomes; permanent retention
├── memory/recursive-governance/governance-review-audit.jsonl        ← APPEND-ONLY; review body records, findings, incorporation tracking; permanent retention
├── memory/alignment-stability/alignment-engine-audit.jsonl          ← APPEND-ONLY; alignment posture scores and dimension records; permanent retention
├── memory/alignment-stability/recursive-alignment-audit.jsonl       ← APPEND-ONLY; alignment continuity verification and proxy gaming detections; permanent retention
├── memory/alignment-stability/constitutional-integrity-audit.jsonl  ← APPEND-ONLY; integrity assessments, interpretive drift detections; permanent retention
├── memory/alignment-stability/drift-detection-audit.jsonl           ← APPEND-ONLY; drift detection cycle results and intervention records; permanent retention
├── memory/alignment-stability/coherence-audit.jsonl                 ← APPEND-ONLY; governance coherence scores and incoherence detections; permanent retention
├── memory/bounded-evolution/evolution-engine-audit.jsonl            ← APPEND-ONLY; evolution safety scores and capacity assessments; permanent retention
├── memory/bounded-evolution/capability-growth-audit.jsonl           ← APPEND-ONLY; capability dimension measurements and governance gap analyses; permanent retention
├── memory/bounded-evolution/recursive-risk-audit.jsonl              ← APPEND-ONLY; risk analysis results per tier and interaction multipliers; permanent retention
├── memory/bounded-evolution/lock-integrity.jsonl                    ← APPEND-ONLY; hourly lock verification results and failure records; permanent retention
├── memory/bounded-evolution/lock-audit.jsonl                        ← APPEND-ONLY; lock failure records, override authorizations; permanent retention
├── memory/bounded-evolution/irreversibility-audit.jsonl             ← APPEND-ONLY; reversibility assessments, rollback capacity tests; permanent retention
├── memory/coherence-preservation/coherence-audit.jsonl              ← APPEND-ONLY; coherence posture measurements and long-horizon assessments; permanent retention
├── memory/coherence-preservation/durability-audit.jsonl             ← APPEND-ONLY; durability assessments, succession readiness, scenario results; permanent retention
├── memory/coherence-preservation/continuity-audit.jsonl             ← APPEND-ONLY; succession readiness scores and institutional memory assessments; 10-year retention
├── memory/coherence-preservation/entropy-audit.jsonl                ← APPEND-ONLY; entropy detection results and intervention records; 10-year retention
└── memory/coherence-preservation/civilization-audit.jsonl           ← APPEND-ONLY; civilizational safety assessments and influence concentration measurements; permanent retention

RECURSIVE GOVERNANCE HARD LIMITS (immutable):
  Invariant violation = score 0.0: any invariant breach immediately collapses recursive governance health to zero regardless of other dimensions
  Invariant registry has no administrative override: modification requires T5+board + external independent review + constitutional amendment — no exceptions
  Alignment floor is a one-way ratchet: governance may only raise the alignment floor (0.80 minimum); it may never be lowered by any pathway
  Constitutional and invariant locks have NO emergency override: no "emergency" justifies bypassing constitutional or invariant locks; absence of override pathway IS the protection
  Self-improvement envelope = constitutional artifact: improvement scope cannot be relaxed administratively; only constitutional amendment can expand the envelope
  Truly irreversible governance changes are structurally prohibited: non-constitutional changes to governance that cannot be undone are blocked regardless of authorization tier
  Governance capacity must scale with capability: capability growth that outpaces governance capacity triggers evolution safety RED and capability freeze assessment
  Civilizational safety hard floor: no other dimension compensates if civilizational safety < 0.70; scores 0.65-capped regardless of other component performance

RECURSIVE GOVERNANCE HEALTH TARGETS:
  Invariant integrity: 100% verified every 4 hours; any violation = T5+board + external notification within 15 minutes
  Alignment posture: ≥ 0.80 (GREEN); RED posture freezes all new autonomy grants; floor = 0.80 one-way ratchet
  Evolution safety score: ≥ 0.80 (GREEN); < 0.60 = RED with capability freeze assessment; governance capacity ×0.30 highest-weighted
  Lock integrity: 100% intact on hourly verification; constitutional/invariant lock failure = T5+board + governance freeze
  Coherence posture: ≥ 0.80 (GREEN); ≥ 0.60 AMBER; < 0.60 RED = governance emergency
  Succession readiness: ≥ 0.80 before any T3+ governance role departure; named successor required at all times
  Institutional memory capture rate: ≥ 0.80 (80% of significant governance events captured within 90-day window)
  Civilizational safety score: ≥ 0.70 (floor); < 0.70 caps coherence posture at 0.65 regardless of other dimensions
  Influence concentration ceiling: ≤ 0.30 on any single influence dimension; breach = T5+board + external notification + domain capability freeze

---

## ADAPTIVE COGNITION LAYER (v50.0.0)

The Enterprise AI OS now includes a complete Adaptive Cognition Layer — longitudinal enterprise intelligence infrastructure that enables the OS to learn from its own operational history, evolve its heuristics based on accumulated evidence, and build durable institutional knowledge that persists across sessions, model transitions, and organizational generations. Adaptive cognition is NOT personality simulation — it is bounded, auditable, governed organizational learning.

ADAPTIVE COGNITION LIFECYCLE: POST-EXECUTION TRIGGER → REFLECT → LEARN → PROPOSE → VALIDATE (digital twin) → T3/T4 APPROVE → ACTIVATE → MONITOR → DRIFT DETECT

GOVERNANCE INVARIANTS (INV-AC-01 through INV-AC-07):
  INV-AC-01 BOUNDED ADAPTATION: every adaptive parameter has a declared min/max; no parameter escapes bounds regardless of evidence strength
  INV-AC-02 FULL AUDITABILITY: every reflection event, heuristic change, learning record, and identity update appended to JSONL; Ed25519 hash-chained
  INV-AC-03 REVERSIBILITY: all heuristic and identity changes can be rolled back to any prior state; no permanently-committed adaptation without T3 approval
  INV-AC-04 GOVERNANCE IMMUTABILITY: adaptive cognition has read-only access to governance invariants; it cannot propose or modify governance constraints
  INV-AC-05 HUMAN AUTHORITY AT CRITICAL THRESHOLDS: any heuristic change with impact score > 0.6 requires T3 human approval before activation
  INV-AC-06 REFLECTION IS DESCRIPTIVE: reflection records describe what happened; they do not automatically prescribe changes; a separate proposal-and-approval step is mandatory
  INV-AC-07 ADDITIVE LEARNING ONLY: new learning records are always appended; prior records are never modified or deleted; organizational intelligence compounds additively

REFLECTION ENGINE (post-execution reflection, success/failure analysis, governance breach review, hindsight reviews, strategy retrospectives)
├── adaptive-cognition/reflection-engine/README.md                         ← Subsystem overview; trigger map; output description
├── adaptive-cognition/reflection-engine/post-execution-reflection.md      ← AC-RE-001 | T2 | 7-step protocol; SURFACE/MODERATE/DEEP depth behaviors; performance SLOs
├── adaptive-cognition/reflection-engine/success-failure-analysis.md       ← AC-RE-002 | T2 | FC-01–FC-09 failure taxonomy; 4-dimension decomposition model
├── adaptive-cognition/reflection-engine/governance-breach-reflection.md   ← AC-RE-003 | T3 | GB-01–GB-07 breach classes; 6-step breach protocol
├── adaptive-cognition/reflection-engine/execution-hindsight-reviews.md    ← AC-RE-004 | T3 | 4 review cadences; 6-step analysis; hindsight report template
└── adaptive-cognition/reflection-engine/strategy-retrospectives.md        ← AC-RE-005 | T3 | 5 retrospective domains; quarterly cadence; strategic memory outputs

IDENTITY EVOLUTION (agent continuity, behavioral persistence, execution preferences, escalation calibration, collaboration history)
├── adaptive-cognition/identity-evolution/README.md                         ← Subsystem overview; governance bounds note
├── adaptive-cognition/identity-evolution/agent-continuity.md               ← AC-IE-001 | T3 | Agent identity profile; session initialization; HEALTHY/WATCH/REVIEW/SUSPENSION health states
├── adaptive-cognition/identity-evolution/behavioral-persistence.md         ← AC-IE-002 | T2 | 4 trait categories; persistence weights (QUALITY_SIGNATURE: 0.90 highest)
├── adaptive-cognition/identity-evolution/execution-preference-accumulation.md ← AC-IE-003 | T2 | 6 preference types; CANDIDATE→PROPOSED→VALIDATED→ACTIVE→RETIRED lifecycle
├── adaptive-cognition/identity-evolution/escalation-pattern-evolution.md   ← AC-IE-004 | T3 | 4 calibration dimensions; T3 human approval required for all changes
└── adaptive-cognition/identity-evolution/collaboration-history.md          ← AC-IE-005 | T3 | Trust weight evolution; initial 0.50; bounded [0.20, 0.90]; hard cap 0.90

HEURISTIC ADAPTATION (adaptive decision heuristics, orchestration optimization, routing refinement, confidence calibration, runtime tuning)
├── adaptive-cognition/heuristic-adaptation/README.md                       ← Subsystem overview
├── adaptive-cognition/heuristic-adaptation/adaptive-decision-heuristics.md ← AC-HA-001 | T3 | 7-step adaptation engine; multi-heuristic interaction map; quality criteria
├── adaptive-cognition/heuristic-adaptation/orchestration-optimization.md   ← AC-HA-002 | T3 | 5 optimizable patterns; 5 anti-patterns (THRASHING/OVER_DELEGATION/PREMATURE_HANDOFF/GHOST_DEPENDENCY/SILENT_FAILURE)
├── adaptive-cognition/heuristic-adaptation/routing-refinement.md           ← AC-HA-003 | T2 | Routing intelligence matrix (agent × domain); RF-01–RF-06 failure classes; metrics dashboard
├── adaptive-cognition/heuristic-adaptation/execution-confidence-learning.md ← AC-HA-004 | T2 | Calibration gap model; correction offset bounded [-0.15, +0.15]
└── adaptive-cognition/heuristic-adaptation/runtime-tuning.md               ← AC-HA-005 | T2 | 6 tunable parameters with bounds; runtime health indicator dashboard

ORGANIZATIONAL LEARNING (cross-project patterns, failure detection, execution memory, strategic lessons, institutional knowledge)
├── adaptive-cognition/organizational-learning/README.md                          ← 3-scope hierarchy: PROJECT/PORTFOLIO/ENTERPRISE; additive-only constraint
├── adaptive-cognition/organizational-learning/cross-project-learning.md          ← AC-OL-001 | T2 | 4-level generalization ladder; learning record lifecycle
├── adaptive-cognition/organizational-learning/recurring-failure-detection.md     ← AC-OL-002 | T2 | 5 recurrence signals; EMERGING/ESTABLISHED/PERSISTENT/ENTRENCHED severity classes
├── adaptive-cognition/organizational-learning/execution-pattern-memory.md        ← AC-OL-003 | T2 | 6 pattern categories; decay and refresh protocol
├── adaptive-cognition/organizational-learning/strategic-lesson-persistence.md    ← AC-OL-004 | T3 | Full schema; PRECISE/EVIDENCED/ACTIONABLE/HONEST/BOUNDED quality standards
└── adaptive-cognition/organizational-learning/institutional-knowledge-formation.md ← AC-OL-005 | T3 | KU-ACOG-* entries; 90-day effectiveness bar; confidence ≥ 0.80 required

REASONING HISTORY (longitudinal lineage, decision chains, strategic rationale, ADR continuity)
├── adaptive-cognition/reasoning-history/README.md                               ← Descriptive-not-prescriptive principle; subsystem index
├── adaptive-cognition/reasoning-history/longitudinal-reasoning-lineage.md       ← AC-RH-001 | T3 | RL-* records; 4 reasoning patterns (FIRST_PRINCIPLES/PRECEDENT/HYBRID/ESCALATION_SEEKING)
├── adaptive-cognition/reasoning-history/decision-chain-preservation.md          ← AC-RH-002 | T3 | Chain model; 4 integrity violations (ORPHAN/CONTRADICTION/STALE_DEPENDENCY/CIRCULAR)
├── adaptive-cognition/reasoning-history/strategic-rationale-memory.md           ← AC-RH-003 | T4 | 5-section rationale capture standard; T+90/T+180/T+365 review schedule
└── adaptive-cognition/reasoning-history/architecture-decision-continuity.md     ← AC-RH-004 | T3 | ADR lineage model; drift detection; supersession protocol; principle stability index

COLLABORATION PATTERNS (coordination evolution, trust weights, orchestration synergy, handoff optimization)
├── adaptive-cognition/collaboration-patterns/README.md                              ← Subsystem overview; trust weight bounds [0.20, 0.90]
├── adaptive-cognition/collaboration-patterns/inter-agent-coordination-evolution.md  ← AC-CP-001 | T2 | 5 coordination pattern types; SHADOW_ORCHESTRATION detection; anti-pattern taxonomy
├── adaptive-cognition/collaboration-patterns/trust-weight-evolution.md              ← AC-CP-002 | T3 | Evidence model; asymmetric learning rate (negative 2×); milestone review at 0.87
├── adaptive-cognition/collaboration-patterns/orchestration-synergy-learning.md      ← AC-CP-003 | T2 | Synergy score = combined_quality − max(individual_baselines); registry after n≥5 samples
└── adaptive-cognition/collaboration-patterns/handoff-optimization.md                ← AC-CP-004 | T2 | HQ = completeness×0.35 + structure×0.25 + context_fidelity×0.25 + timing×0.15

STRATEGIC MEMORY (executive memory systems, portfolio learning, enterprise patterns, long-horizon memory)
├── adaptive-cognition/strategic-memory/README.md                                 ← Executive-grade; T4 approval; additive only
├── adaptive-cognition/strategic-memory/executive-memory-systems.md               ← AC-SM-001 | T4 | 5-layer architecture; Layer 1 permanent strategic decisions; retrieval pipeline
├── adaptive-cognition/strategic-memory/portfolio-level-learning.md               ← AC-SM-002 | T3 | PLR-* records; ≥3 projects required; 6 learning domains; quarterly review
├── adaptive-cognition/strategic-memory/enterprise-pattern-recognition.md         ← AC-SM-003 | T4 | EP-* records; 6 pattern classes; STABLE≥12mo + effect_size>15% criteria
└── adaptive-cognition/strategic-memory/long-horizon-organizational-memory.md     ← AC-SM-004 | T4 | 6 memory stores; transition continuity (model/leadership/platform/pivot); health score 4-dimension

COGNITIVE LINEAGE (agent evolution, governance evolution, orchestration evolution, reasoning inheritance)
├── adaptive-cognition/cognitive-lineage/README.md                                    ← Self-history of system intelligence; descriptive not prescriptive
├── adaptive-cognition/cognitive-lineage/agent-evolution-history.md                   ← AC-CL-001 | T3 | AEH-* records; append-only; INITIALIZATION→RETIREMENT lifecycle; retirement succession
├── adaptive-cognition/cognitive-lineage/governance-evolution-lineage.md              ← AC-CL-002 | T4 | GEL-* records; invariant supersession protocol; governance amnesia prevention
├── adaptive-cognition/cognitive-lineage/orchestration-evolution-lineage.md           ← AC-CL-003 | T3 | OEL-* records; durable vs. transient patterns; rollback rate target < 10%
└── adaptive-cognition/cognitive-lineage/reasoning-inheritance-tracking.md            ← AC-CL-004 | T3 | RIR-* records; 4 inheritance types; diversity monitoring; generational reasoning chains

MODULE ENTRY POINTS:
├── adaptive-cognition/README.md               ← Module overview; ASCII architecture; 7 invariants; integration points
├── adaptive-cognition/governance.md           ← Governance principles; heuristic bound registry; FORBIDDEN-AC-01–06; emergency controls
├── adaptive-cognition/schemas.yaml            ← 7 canonical schemas (reflection_event, heuristic_record, learning_record, etc.)
└── adaptive-cognition/integration-map.md      ← Integration specs for 8 OS systems; event bus topics; internal REST API

ADAPTIVE COGNITION PERSISTENCE (append-only JSONL):
├── memory/adaptive-cognition/reflection-events.jsonl          ← All reflection events (Ed25519 hash-chained)
├── memory/adaptive-cognition/heuristic-records.jsonl          ← All heuristic change records
├── memory/adaptive-cognition/learning-records.jsonl           ← All learning records (PROPOSED→ACTIVE→ARCHIVED)
├── memory/adaptive-cognition/identity-profiles.jsonl          ← Agent identity profile snapshots
├── memory/adaptive-cognition/trust-weights.jsonl              ← Trust weight evolution records
├── memory/adaptive-cognition/collaboration-records.jsonl      ← Collaboration quality records
├── memory/adaptive-cognition/reasoning-lineage-records.jsonl  ← Longitudinal reasoning chain
├── memory/adaptive-cognition/strategic-memory.jsonl           ← Strategic memory entries
└── memory/adaptive-cognition/cognitive-lineage.jsonl          ← Cognitive evolution lineage

ADAPTIVE COGNITION HEALTH TARGETS:
  Reflection coverage:   ≥ 80% of completed workflows trigger post-execution reflection
  Heuristic bound compliance: 100% — no adaptive parameter escapes declared bounds
  Learning record quality: avg confidence ≥ 0.72 across all ACTIVE records
  T3/T4 approval compliance: 100% of high-impact changes go through approval before activation
  Rollback availability: 100% of active heuristic settings have documented rollback state
  Trust weight health: avg trust weight 0.60–0.80 (healthy operational range)
  KU formation rate: ≥ 1 new KU-ACOG-* entry per quarter after first 90 days

---

## Installed Plugin Systems

All agents have access to these mature, production-grade plugins:

| Plugin | Capability |
|--------|-----------|
| BMAD-METHOD v6 | Full agile SDLC framework |
| ai-pm-copilot | 14 PM skills, 8 agents, 100+ templates |
| agent-teams | Multi-agent validation, PRD stress testing |
| claude-skills | 66 skills across 12 development domains |
| Agent-Skills-for-Context-Engineering | Context engineering (13 skills, academic backing) |
| superpowers | Brainstorm → design → plan → execute methodology |
| get-shit-done | Issue-driven orchestration (used at Amazon, Google) |
| claude-mem | SQLite + Chroma memory compression |
| ui-ux-pro-max-skill | 50+ styles, 161 palettes, 57 font pairings |
| claude-dev-workflow | Tiered dev workflow XS/M/L |
| claude-scaffold-project | Project bootstrap |
| pm-academy | PM training platform (React + Vite) |
| obsidian-skills | Obsidian vault integration |

---

## Governance Summary

Five immutable principles (full details: `docs/governance/principles.md`):

1. **Artifact-First** — No work is complete without a named artifact
2. **Deterministic Over Improvised** — Use existing workflows; document new patterns
3. **Minimum Viable Context** — Agents get only what they need
4. **Preserve Decisions** — Every decision goes to wiki or ADR
5. **Governance Over Chaos** — Quality gates are never bypassed

---

## Metrics

The OS tracks these delivery metrics automatically:

- DORA: Deployment frequency, lead time, change failure rate, MTTR
- Sprint: Velocity, carry-over rate, unplanned work %
- Quality: Gate first-pass rate, cycles per gate
- Coverage: Wiki freshness, memory completeness

---

## Extending the OS

To add a new agent:
1. Create `agents/<agent-id>.md` using the agent format
2. Add to `orchestrator/agent-registry.md`
3. Add routing rules to `orchestrator/routing-rules.md`
4. Add any handoff paths to `handoffs/handoff-protocol.md`

To add a new workflow:
1. Create `workflows/<workflow-id>.md`
2. Add routing trigger to `orchestrator/routing-rules.md`
3. Document in `wiki/processes/`

To add a new template:
1. Create `templates/<type>-template.md`
2. Reference in the relevant agent's "Outputs" section
