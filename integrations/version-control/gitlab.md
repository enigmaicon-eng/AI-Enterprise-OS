---
integration: GitLab
category: version-control
status: active
mcp-available: partial
connector-agent: connector-builder-agent
source-of-truth: code, CI/CD pipelines, container registry
data-classification: INTERNAL
created: 2026-05-09
---

# GitLab Integration

> GitLab serves as the primary CI/CD platform (GitLab CI/CD pipelines) and optionally as the code repository. Integration mirrors GitHub patterns with GitLab-specific additions: pipeline management, container registry, GitLab Environments, and ArgoCD GitOps integration via GitLab.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Pipeline status (pass/fail/running) | Webhook: pipeline events | devops-engineer-agent | Real-time |
| MR (Merge Request) status | Webhook: merge_request events | delivery-manager-agent | Real-time |
| Container image pushed | Webhook: registry push event | runtime-engineer-agent | Real-time |
| Security scan results (SAST/DAST) | Pipeline artifact download | security-engineer-agent | Per pipeline |
| Deployment environment status | Webhook: deployment events | rollout-governance-agent | Real-time |
| GitLab Issues | Webhook: issue events | delivery-manager-agent | Real-time |
| Code coverage report | Pipeline artifact | qa-agent | Per pipeline |

---

## 2. Publishing Workflows

| OS Artifact | GitLab Destination | Publishing Agent | Trigger |
|-------------|-------------------|-----------------|---------|
| Pipeline trigger | Pipeline API trigger | devops-engineer-agent | Code push/release |
| MR description (from PRD) | Merge request description | engineering agents | MR creation |
| Release | GitLab Release + tag | release-governance-agent | G7 approval |
| Environment variables | GitLab CI/CD Variables | devops-engineer-agent | Config change (H-003) |
| CI/CD pipeline config (.gitlab-ci.yml) | Repository file | devops-engineer-agent | Pipeline update |
| Container image | GitLab Container Registry | runtime-engineer-agent | Build complete |
| Docs | GitLab Pages | technical-documentation-agent | Docs updated |

---

## 3. Sync Systems

| Sync | Direction | Source of Truth | Resolution |
|------|-----------|----------------|-----------|
| Pipeline state | GitLab → OS | GitLab | GitLab wins |
| MR status | GitLab → OS | GitLab | GitLab wins |
| Environment state | GitLab → OS | GitLab | GitLab wins |
| Sprint milestone | OS → GitLab | OS | OS wins |

---

## 4. Permissions

```yaml
gitlab_permissions:
  auth_method: OAuth 2.0 (3-legged) + Group Access Token for automation
  scopes:
    - api              # Full API access for automation agent
    - read_user        # User info
    - read_registry    # Container registry read
    - write_registry   # Container push (runtime-engineer-agent only)
  group_access_token_roles:
    ci_automation: Developer (pipeline triggers, MR operations)
    release_management: Maintainer (tags, releases, environments)
    readonly_agents: Reporter (read-only access)
  secret_path: vault://integrations/gitlab/oauth-credentials
  rotation: 90 days
```

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Trigger pipeline | None (devops-engineer-agent autonomous) |
| Merge MR to main | qa-agent G4 + code review (same as GitHub) |
| Create release | release-governance-agent G7 + H-001 |
| Modify environment variables | Human operator (H-003) |
| Protected branch settings | Human operator (H-003) |
| Delete pipeline artifacts | human-approval-governance-agent (H-021) |

---

## 6. Runtime Integration

```yaml
runtime:
  connector_type: Custom REST API connector (MCP wrapper via connector-builder-agent)
  # No native GitLab MCP server as of 2026-05-09 — custom MCP tool wrappers used
  tools_available:
    - gitlab_trigger_pipeline
    - gitlab_get_pipeline_status
    - gitlab_create_merge_request
    - gitlab_get_merge_request
    - gitlab_accept_merge_request
    - gitlab_create_release
    - gitlab_get_environments
    - gitlab_download_artifact
  rate_limit: 2000 requests/hr (GitLab SaaS)
  webhook_endpoint: POST /integrations/gitlab/webhook
  webhook_validation: X-Gitlab-Token header validation
```

---

## 7. Failure Handling

Same patterns as GitHub integration with GitLab-specific additions:
- Pipeline failure → alert devops-engineer-agent + qa-agent; block G7 gate
- Container registry push failure → retry x3; alert runtime-engineer-agent
- GitLab CI runner outage → escalate to devops-engineer-agent; trigger fallback to Jenkins if configured

---

## 8. Observability

```yaml
metrics:
  - gitlab_pipeline_success_rate    # target: > 95%
  - gitlab_pipeline_duration_p95    # baseline by pipeline type
  - gitlab_mr_cycle_time            # target: < 2 days
  - gitlab_registry_push_success    # target: > 99%

alerts:
  - pipeline_failure_streak > 3 → HIGH → devops-engineer-agent
  - pipeline_success_rate < 85% → HIGH → qa-agent + vp-engineering-agent
```

---

## 9. Rollback Systems

| Operation | Rollback |
|-----------|---------|
| Deployed container image | Re-deploy previous image tag via ArgoCD |
| Pipeline variable change | Restore from OS config snapshot (H-003 pre-approval required for change) |
| MR merged | Revert MR (new MR reverting) |
| Release tag | Delete tag if not yet deployed |

---

## 10-12. (Same audience adaptation, governance, and auditability as GitHub integration with GitLab-specific audit log via Admin API)

---
