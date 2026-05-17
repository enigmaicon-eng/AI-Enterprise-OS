# Security Policy

Enterprise security standards for all systems built and operated within the Enterprise AI OS.

---

## Classification

All data handled by this system must be classified:

| Class | Examples | Controls Required |
|-------|----------|------------------|
| **Public** | Marketing content, public docs | None specific |
| **Internal** | Internal docs, metrics, non-sensitive ops data | Access control |
| **Confidential** | User emails, names, business data | Encryption + access control |
| **Restricted** | Passwords, API keys, payment data, PII | Encryption + strict access + audit log |

---

## Encryption Standards

- **At rest:** AES-256 for Restricted and Confidential data
- **In transit:** TLS 1.2 minimum, TLS 1.3 preferred; no HTTP for any non-public data
- **Secrets:** All secrets in a secrets manager (never in code, env files committed to VCS, or logs)
- **Prohibited:** MD5, SHA-1 (for security), DES, RC4, any key length < 128-bit

---

## Authentication & Authorization

### Authentication
- Passwords: bcrypt, scrypt, or Argon2 with appropriate work factors
- Sessions: secure HttpOnly cookies or short-lived JWTs (< 1 hour for sensitive operations)
- MFA: Required for administrative access and privileged operations
- API keys: Scoped to minimum permissions; rotated on breach; never in URLs

### Authorization
- Principle of least privilege: every principal gets minimum necessary permissions
- Authorization enforced server-side on every request (not just on login)
- ABAC or RBAC (not ad-hoc permission checks scattered in code)
- Resource ownership verified before any mutation

---

## Development Security Standards

### Input Validation
- Validate all inputs at system boundaries (HTTP, message queues, file uploads)
- Use parameterized queries for all database operations
- Encode output context-appropriately (HTML, JS, SQL, shell)
- File uploads: validate type (by content, not extension), enforce size limits, store outside web root

### Dependency Management
- Lock file committed for all package managers
- Dependency audit in CI/CD pipeline (block on critical/high CVEs)
- No abandoned packages with security history
- Supply chain: verify package integrity where possible

### Code Security
- No secrets in code (use secrets manager)
- No SQL string concatenation
- No eval() or equivalent dynamic code execution (or explicit justification)
- Input sanitization at ALL API boundaries

---

## Operational Security

### Logging
- All authentication events logged (success and failure)
- All privileged actions logged with user identity
- No PII or credentials in logs
- Logs immutable and retained per compliance requirements

### Monitoring
- Alert on: repeated auth failures, unusual access patterns, privilege escalation
- Security events ship to SIEM or equivalent
- Dependency vulnerability scan weekly (not just at release)

### Incident Response
- See `workflows/incident-response.md`
- Security breaches: security-agent leads; regulatory notification assessed within 2 hours
- Credential exposure: rotate immediately, then investigate

---

## Compliance Considerations

The security-agent is responsible for identifying applicable compliance requirements per project:

| Regulation | Trigger | Key Requirements |
|-----------|---------|-----------------|
| GDPR | EU user data | Data subject rights, DPA, 72h breach notification |
| SOC 2 | B2B/enterprise customers | Availability, security, confidentiality controls |
| PCI DSS | Payment card data | Strict card data handling; annual assessment |
| HIPAA | US healthcare data | PHI protection; BAA required |

---

## Security Review SLAs

| Review Type | SLA |
|-------------|-----|
| Critical vulnerability remediation | 24 hours |
| High vulnerability remediation | 7 days |
| Architecture threat model | Within same sprint as design |
| Pre-release security review | 1-2 days |
| Dependency audit | Blocking CVEs: same day |
