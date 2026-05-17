---
type: threat-model
system: <system name>
created: <YYYY-MM-DD>
author: security-agent
architecture-ref: <architecture/<slug>.md>
status: draft | reviewed | approved
---

# Threat Model: <System Name>

## System Overview

`<Brief description of what the system does and the data it handles>`

### Trust Boundaries

```
[External User] → [Load Balancer] → [App Server] → [Database]
                                  → [Cache]
                                  → [External API]
```

_Label each boundary and what crosses it._

---

## Assets

| Asset | Classification | Location | Owner |
|-------|---------------|----------|-------|
| User credentials | Confidential | Auth service | Auth team |
| PII (name, email) | Sensitive | User DB | Platform |
| Payment data | Restricted | Payment service | Payments |
| Session tokens | Confidential | Redis cache | Auth team |

---

## STRIDE Analysis

### Spoofing

| Threat | Target | Mitigation | Status |
|--------|--------|-----------|--------|
| User impersonation | Auth endpoint | JWT + MFA | Mitigated |
| Service impersonation | Service mesh | mTLS | Required |

### Tampering

| Threat | Target | Mitigation | Status |
|--------|--------|-----------|--------|
| Request body tampering | API requests | HTTPS + request signing | Mitigated |
| Database tampering | User records | Audit logs + checksums | Partially mitigated |

### Repudiation

| Threat | Target | Mitigation | Status |
|--------|--------|-----------|--------|
| Action denial | User mutations | Immutable audit log | Required |

### Information Disclosure

| Threat | Target | Mitigation | Status |
|--------|--------|-----------|--------|
| PII in logs | Logging pipeline | Log scrubbing | Required |
| Error messages expose internals | API errors | Generic error responses | Required |

### Denial of Service

| Threat | Target | Mitigation | Status |
|--------|--------|-----------|--------|
| Rate limiting bypass | Public APIs | Rate limit per user + IP | Required |
| Large payload attacks | Upload endpoints | Max size enforcement | Required |

### Elevation of Privilege

| Threat | Target | Mitigation | Status |
|--------|--------|-----------|--------|
| IDOR | Resource access | Server-side authorization check | Required |
| JWT algorithm confusion | Auth | Algorithm pinning | Mitigated |

---

## Risk Summary

| Risk | Severity | Likelihood | Priority | Mitigation |
|------|---------|-----------|----------|-----------|
| | Critical/High/Med/Low | H/M/L | P1/P2/P3 | |

---

## Required Security Controls

Controls that MUST be implemented before production:

- [ ] `<control 1>`
- [ ] `<control 2>`

---

## Residual Risks

Risks accepted with justification:

| Risk | Justification | Review Date |
|------|-------------|-------------|
| | | |

---

## Sign-Off

- Security Agent: `approved | conditional | blocked`
- Conditions: `<list if conditional>`
