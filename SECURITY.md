# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in the AgentLog specification, schema, or SDK, please report it responsibly:

**Email**: security@braintied.com

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

We will respond within 48 hours and work with you on a fix before public disclosure.

## Scope

This policy covers:
- The `@braintied/agentlog` npm package
- The JSON Schema (`schemas/agentlog.schema.json`)
- The Zod validation schemas
- The converter implementations

## Security Considerations in the Spec

AgentLog documents may contain sensitive data. Producers SHOULD:

1. **Redact secrets** — Strip API keys, tokens, and credentials before creating AgentLog documents
2. **Handle PII** — Developer information may contain personally identifiable information
3. **Truncate diffs** — File diffs may contain sensitive source code
4. **Scope storage** — Store AgentLog documents with appropriate access controls

See [Section 7 of the specification](spec/agentlog-spec.md#7-security-considerations) for details.
