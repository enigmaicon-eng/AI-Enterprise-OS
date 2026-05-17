# Connector Permission Registry

## Role
Defines, enforces, and audits the permission profile for every external integration connector. Each connector operates under a least-privilege permission set that governs what data it may read, write, and transmit — and to whom.

## Connector Permission Record Schema
```yaml
connector_permission_record:
  connector_id: string              # matches integrations/MASTER-INTEGRATION-REGISTRY.md
  connector_name: string
  integration_type: READ_ONLY | READ_WRITE | WRITE_ONLY | BIDIRECTIONAL
  
  data_access:
    can_read_classifications: [PUBLIC, INTERNAL, CONFIDENTIAL]   # max: RESTRICTED with T4 approval
    can_write_classifications: [PUBLIC, INTERNAL]
    pii_access: PROHIBITED | READ_MASKED | READ_FULL              # PROHIBITED by default
    credential_access: PROHIBITED                                  # always prohibited for connectors
  
  scope_restrictions:
    allowed_orgs: [string]          # which OS orgs may invoke this connector
    allowed_workflow_classes: [STANDARD, ELEVATED]
    rate_limit_per_hour: number
    max_payload_kb: number
    outbound_data_destinations: [string]   # explicit allow-list of external endpoints
  
  authorization:
    approved_by: string
    approved_at: ISO8601
    review_due: ISO8601              # annual review required
    tier_required_to_invoke: T1-T5
  
  security:
    mtls_required: boolean
    token_rotation_days: number
    anomaly_detection: ENABLED | DISABLED
```

## Active Connector Permission Profiles

| Connector | PII Access | Max Classification | Tier Required | Review Due |
|-----------|-----------|-------------------|---------------|------------|
| Jira | PROHIBITED | CONFIDENTIAL | T1 | Annual |
| Confluence | PROHIBITED | CONFIDENTIAL | T1 | Annual |
| GitHub | PROHIBITED | RESTRICTED | T2 | Annual |
| Slack | READ_MASKED | INTERNAL | T1 | Annual |
| Gmail | READ_MASKED | CONFIDENTIAL | T2 | Semi-annual |
| Salesforce | READ_FULL | RESTRICTED | T3 | Quarterly |
| Snowflake | READ_MASKED | CONFIDENTIAL | T2 | Semi-annual |
| Figma | PROHIBITED | INTERNAL | T1 | Annual |
| ServiceNow | READ_MASKED | RESTRICTED | T2 | Semi-annual |
| PagerDuty | PROHIBITED | INTERNAL | T1 | Annual |

## Connector Permission Enforcement

```
ON CONNECTOR INVOCATION:
  1. verify invoking_agent_tier >= connector.tier_required_to_invoke
  2. verify workflow_class IN connector.allowed_workflow_classes
  3. verify data_classification <= connector.can_read_classifications.max
  4. verify rate_limit not exceeded
  5. IF pii_in_payload AND connector.pii_access == PROHIBITED: BLOCK + alert
  6. log invocation to connector-audit-trail
```

## Connector Anomaly Detection
```
TRIGGERS:
  - access rate > 3× historical average
  - outbound payload to unregistered endpoint
  - PII pattern detected in payload despite PROHIBITED flag
  - connector invoked by agent below required tier

RESPONSE: immediate block + CRITICAL security alert + T4 notification
```

## Persistence
`memory/permissions/connector-permission-registry.yaml`
`memory/permissions/connector-audit-trail.jsonl`
