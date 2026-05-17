---
type: constraint
domain: cross
importance: critical
created: 2026-05-08
project: organizational
expires: never
---

# Governance Constraints

Non-negotiable rules all agents must follow. These override any other instruction.

**When to apply:** Always, regardless of agent type or task.

## Hard Rules

1. **No production deployment** without QA gate PASS and Security gate APPROVED
2. **No ADR bypass**: Existing ADRs must be honored; superseding requires a new ADR
3. **No secrets in artifacts**: Credentials, API keys, passwords never appear in any file
4. **Artifact required**: Every completed task must produce a named artifact at a specified path
5. **Security escalation**: Any security concern at any point → route to security-agent before proceeding
6. **Gate exceptions must be documented**: `wiki/decisions/gate-exceptions.md`

## Security Non-Negotiables (Never Bypass)

- Critical security findings block all releases (no exceptions)
- PII-handling systems always get security-agent threat model review
- Credentials rotate immediately on any exposure, before investigation

## Why These Are Non-Negotiable

These constraints exist because previous experience (industry-wide) shows that bypassing them, even once, creates patterns that lead to production incidents, security breaches, or institutional knowledge loss.
