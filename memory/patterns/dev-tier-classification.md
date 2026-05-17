---
type: pattern
domain: engineering
importance: high
created: 2026-05-08
project: organizational
expires: never
---

# Pattern: Development Tier Classification

## The Pattern

All engineering work is classified into tiers before starting. From `claude-dev-workflow`:

| Tier | Scope | Process Required |
|------|-------|-----------------|
| XS | Bug fixes, typos, config changes, copy | Fix → test → PR |
| M | Features, refactors, API changes | Plan → implement → test → review → PR |
| L | Architecture changes, security changes, data migrations | RFC/ADR → plan → implement → security review → staged rollout |

**Security levels:**
- S1: Local only (no shared systems)
- S2: Pre-production (staging, dev)
- S3: Production (requires staged rollout + monitoring)

**When to apply:** Before any engineering work begins.

## Why This Pattern Exists

XS work getting treated as L creates unnecessary overhead. L work getting treated as XS bypasses important safeguards (security review, ADR, staged rollout) and creates production risk.

## How to Apply

Before writing any code:
1. Classify the tier (XS/M/L)
2. If L: confirm ADR or RFC exists; confirm security review is planned
3. If S3: confirm staged rollout plan and rollback plan exist
4. Mismatch? Escalate to architect-agent for reclassification
