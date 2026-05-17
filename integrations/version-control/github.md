---
integration: GitHub
category: version-control
status: active
mcp-available: yes
connector-agent: mcp-integration-agent
source-of-truth: code, pull-requests, CI-results, releases
data-classification: INTERNAL (private repos) / PUBLIC (open repos)
created: 2026-05-09
---

# GitHub Integration

> GitHub is the source of truth for all code, pull requests, CI/CD pipeline results, and software releases. The OS reads CI/CD status, PR reviews, and code metrics from GitHub and writes back release notes, issue references, and documentation updates. Deep integration with the delivery and engineering workflow pipelines.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| PR status (open/merged/closed) | Webhook: pull_request event | delivery-manager-agent | Real-time |
| CI/CD pipeline result (pass/fail) | Webhook: check_run, workflow_run | qa-agent, devops-engineer-agent | Real-time |
| Code review comments | Webhook: pull_request_review | distinguished-engineer-agent | Real-time |
| Security alerts (Dependabot, GHAS) | Webhook: security_advisory | security-engineer-agent | Real-time |
| Release published | Webhook: release published | release-governance-agent | Real-time |
| Branch created/deleted | Webhook: create/delete | workflow-runtime-agent | Real-time |
| Repository metrics (LOC, test coverage) | Scheduled API pull | product-analytics-agent | Weekly |
| Dependabot PRs | Webhook: pull_request (Dependabot) | security-engineer-agent | Real-time |
| CODEOWNERS violations | PR webhook + CODEOWNERS check | distinguished-engineer-agent | Per PR |

---

## 2. Publishing Workflows

| OS Artifact | GitHub Destination | Publishing Agent | Trigger |
|-------------|-------------------|-----------------|---------|
| Release notes | GitHub Release body | release-governance-agent | G7 approval |
| PR description (from PRD) | Pull request body | backend/frontend-engineer-agent | PR creation |
| Architecture decision summary | README or wiki | technical-documentation-agent | ADR ratified |
| Runbook updates | wiki/ or docs/ in repo | knowledge-systems-agent | Runbook updated |
| Security fix PR | Pull request | security-engineer-agent | Vulnerability found |
| Changelog | CHANGELOG.md | release-governance-agent | Release cut |
| API documentation | docs/api/ directory | technical-documentation-agent | API spec updated |
| Deployment tag | Git tag | devops-engineer-agent | G7 + rollout authorized |
| Issue reference comments | PR/Issue comment | Any engineering agent | Cross-reference needed |

---

## 3. Sync Systems

| Sync Type | Direction | Trigger | SLA |
|-----------|-----------|---------|-----|
| PR status → OS workflow | GitHub → OS | PR event webhook | Real-time |
| OS sprint → GitHub milestone | OS → GitHub | Sprint start | Sprint start |
| OS issue → GitHub issue | OS → GitHub | Workflow creates GitHub issue | On creation |
| Release tag → OS release record | GitHub → OS | Release webhook | Real-time |
| CI result → OS QA gate | GitHub → OS | CI webhook | Real-time |

**Source of truth:** GitHub owns code and CI state. OS derives engineering workflow state from GitHub events.

---

## 4. Permissions

```yaml
github_permissions:
  auth_method: GitHub App (preferred over PAT for granular permissions)
  github_app_permissions:
    contents: read/write        # Code, releases, tags
    pull_requests: read/write   # PR creation, comments
    issues: read/write          # Issue management
    checks: read                # CI status
    security_events: read       # Security alerts
    actions: read               # Workflow run status
    metadata: read              # Repository info
  installation_scope: Organization-level
  secret_path: vault://integrations/github/app-credentials
  rotation: GitHub App key rotation every 90 days
```

**Agent authorization:**
| Agent | GitHub Permission | Operations |
|-------|-----------------|------------|
| devops-engineer-agent | Write (contents + actions) | Tags, releases, workflow triggers |
| security-engineer-agent | Write (security_events, contents) | Security PRs, advisory dismissal |
| technical-documentation-agent | Write (contents) | Docs, README updates |
| All engineering agents | Write (pull_requests, issues) | PR/issue management in assigned repos |
| All other agents | Read only | Status, metrics |

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Create PR | None (engineering agent autonomous) |
| Merge PR | CODEOWNERS + qa-agent G4 (code review protocol) |
| Delete branch | None (automated cleanup) |
| Create release | release-governance-agent G7 + H-001 |
| Force push to protected branch | Human operator (H-024) |
| Repository settings change | Human operator (H-003) |
| Public repository creation | Human operator (H-009) |
| Archive/delete repository | Human operator (H-024) |

---

## 6. Runtime Integration

```yaml
runtime:
  mcp_server: github-mcp-server
  tools_available:
    - github_create_pull_request
    - github_get_pull_request
    - github_merge_pull_request
    - github_create_issue
    - github_update_issue
    - github_create_release
    - github_get_workflow_run
    - github_search_code
    - github_get_file_contents
    - github_create_or_update_file
    - github_list_commits
  rate_limit:
    authenticated: 5000 requests/hr
    github_app: 15000 requests/hr (preferred)
  circuit_breaker: 5 failures/60s → open 120s
  webhook_endpoint: POST /integrations/github/webhook
  webhook_validation: HMAC-SHA256 signature verification
```

---

## 7. Failure Handling

| Failure | Response | Recovery |
|---------|----------|---------|
| Webhook delivery failure | GitHub retries for 7 days; OS also polls for missed events | Hourly poll for PR/CI state |
| API rate limit | Queue requests; resume after rate window | 429 handler with retry-after header |
| Merge conflict | Alert originating engineer; block PR merge | Engineer resolves manually |
| CI failure (blocks PR) | Alert qa-agent + engineering agent | Fix and re-push |
| Security alert (critical CVE) | Alert security-engineer-agent immediately | Immediate patch PR |
| GitHub outage | Delivery pipeline paused; alert vp-engineering-agent | Resume when status.github.com shows OK |

---

## 8. Observability

```yaml
metrics:
  - github_webhook_success_rate       # target: > 99%
  - github_api_latency_p95            # target: < 1s
  - github_ci_pass_rate               # target: > 95% (engineering quality indicator)
  - github_pr_cycle_time              # target: < 2 days
  - github_security_alert_open_time   # target: Critical < 24h

alerts:
  - ci_pass_rate < 85% for 2 consecutive runs → HIGH → qa-agent + vp-engineering-agent
  - critical_security_alert opened → CRITICAL → security-engineer-agent (within 15 min)
  - webhook failure rate > 5% → HIGH → enterprise-systems-agent
  - github_outage detected → CRITICAL → incident-manager-agent
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Time Limit |
|-----------|----------------|-----------|
| Merged PR | Revert PR (new PR reverting changes) | Any time |
| Published release | Delete release + retag | Before downstream deployment |
| Repository file update | Git revert commit | Any time |
| Deployment tag | Delete tag (if not yet deployed) | Pre-deployment only |
| After deployment | Follow `wiki/runbooks/rollback-runbook.md` | Per SLO |

**Git immutability:** Commits cannot be deleted from protected branches without H-024. Rollback via revert commits only on main/production branches.

---

## 10. Audience Adaptation

| Audience | GitHub Artifact | Adaptation |
|----------|----------------|------------|
| Engineers | PR descriptions, code review comments | Full technical detail, test requirements |
| PMs | Release notes | Feature list, user impact, not technical implementation |
| Executives | Release summary | KPIs shipped, business value, no technical detail |
| Security | Security advisory | CVE details, affected versions, patch instructions |
| Customers | Public release notes (if open source) | User-facing features only, no internal implementation |

release-governance-agent adapts release notes via audience-transformation-agent before publishing per-audience versions.

---

## 11. Governance

```yaml
governance:
  data_classification:
    private_repos: INTERNAL (proprietary code)
    public_repos: PUBLIC
  code_scanning: GHAS enabled (CodeQL, secret scanning, Dependabot)
  branch_protection:
    main: requires PR, 1 review, CI pass, CODEOWNERS
    release/*: requires PR, 2 reviews, security scan, H-001
  secret_scanning: enabled (blocks push of detected secrets)
  repository_policy:
    - All repositories registered in MASTER-INTEGRATION-REGISTRY
    - No shadow repos (unauthorized forks blocked)
    - Internal repositories use GitHub private visibility
  compliance:
    - SOC 2: GitHub access logs via Audit Log API
    - ISO 27001: Code access controls reviewed quarterly
```

---

## 12. Auditability

```yaml
audit:
  github_audit_log_api: GET /orgs/{org}/audit-log  # Available for GitHub Enterprise
  os_audit_additions:
    - Every GitHub API write call by OS agents
    - Every webhook event processed + outcome
    - Every security alert action taken
    - Every PR merged by OS agents (not human-initiated)
  log_path: memory/events/github-audit.jsonl
  retention: 1 year
  github_native_audit: GitHub Audit Log (organization-level) archived quarterly
```

---
