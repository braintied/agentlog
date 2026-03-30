<p align="center">
  <br />
  <strong>AgentLog</strong>
  <br />
  <em>Open standard for AI agent session interchange</em>
  <br />
  <br />
  <a href="https://www.npmjs.com/package/@braintied/agentlog"><img src="https://img.shields.io/npm/v/@braintied/agentlog?color=blue&label=npm" alt="npm"></a>
  <a href="https://github.com/braintied/agentlog/actions"><img src="https://github.com/braintied/agentlog/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="License"></a>
  <a href="spec/agentlog-spec.md"><img src="https://img.shields.io/badge/spec-v0.2.0-green" alt="Spec"></a>
  <a href="schemas/agentlog.schema.json"><img src="https://img.shields.io/badge/JSON_Schema-Draft_2020--12-orange" alt="JSON Schema"></a>
</p>

---

AgentLog defines a portable JSON format for recording what happens during AI agent sessions. One format for every tool, every workflow, every platform.

```json
{
  "specVersion": "0.2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "agent": { "name": "Claude Code", "model": "claude-sonnet-4-6" },
  "events": [
    { "type": "message", "role": "user", "content": "Fix the auth bug" },
    { "type": "fileOperation", "operation": "edit", "path": "src/auth.ts", "linesAdded": 4 },
    { "type": "terminalCommand", "command": "npm test", "exitCode": 0 }
  ]
}
```

## The Problem

Every AI coding tool (Claude Code, Cursor, Codex, Aider) produces session logs in its own proprietary format. There's no way to:

- **Search** across sessions from different tools
- **Measure** AI coding impact across your engineering org
- **Feed** session data into observability platforms
- **Understand** how code was written, not just what was written

## The Solution

AgentLog is a single, vendor-neutral format that captures the complete record: conversation, tool calls, file operations with diffs, terminal commands, reasoning traces, costs, and relationships to commits, PRs, and issues.

## Specification

| Document | Version | Status |
|----------|---------|--------|
| [Core Specification](spec/agentlog-spec.md) | 0.2.0 | Draft |
| [JSON Schema](schemas/agentlog.schema.json) | Draft 2020-12 | Draft |
| [TypeScript Types](src/schema.ts) | 0.2.0 | Draft |

## Install

```bash
npm install @braintied/agentlog
```

## Usage

### Validate a session document

```typescript
import { validateAgentLog, SPEC_VERSION } from '@braintied/agentlog';

const result = validateAgentLog(sessionData);
if (result.success) {
  console.log(`Valid AgentLog v${SPEC_VERSION}`);
}
```

### Convert from Claude Code

```typescript
import { convertClaudeCodeSession } from '@braintied/agentlog/convert/claude-code';

const session = await convertClaudeCodeSession('~/.claude/projects/myproject/session-uuid');
console.log(session.events.length, 'events captured');
```

### Export from Watchtower

```typescript
import { exportWatchtowerSession } from '@braintied/agentlog/convert/watchtower';

const agentLog = exportWatchtowerSession(dbRow, { projectName: 'my-app' });
```

## Schema

An AgentLog document has three layers:

### Layer 1 — Session Envelope

The required context: who, when, where, what tool.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `specVersion` | string | Yes | Always `"0.2.0"` |
| `id` | string | Yes | Session UUID |
| `startTime` | string | Yes | ISO 8601 start time |
| `endTime` | string/null | No | ISO 8601 end time |
| `status` | enum | Yes | `active`, `completed`, `failed`, `cancelled` |
| `agent` | object | Yes | Agent name, model, provider |
| `project` | object | No | Repo, branch, working directory |
| `developer` | object | No | Who ran the session |

### Layer 2 — Event Timeline

Seven event types capture everything that happened:

| Type | What it captures | Key fields |
|------|-----------------|------------|
| **`message`** | Conversation turns | `role`, `content`, `tokenUsage` |
| **`toolCall`** | Tool invocations | `name`, `input`, `output`, `status` |
| **`fileOperation`** | File changes | `operation`, `path`, `diff`, `linesAdded` |
| **`terminalCommand`** | Shell commands | `command`, `stdout`, `exitCode` |
| **`search`** | Code/web search | `tool`, `query`, `resultCount` |
| **`reasoning`** | AI decision-making | `intent`, `alternatives`, `rationale` |
| **`error`** | Errors + recovery | `message`, `code`, `recovery`, `resolved` |

All events share: `id`, `timestamp`, `parentId` (for nesting), `durationMs`, `properties` (extensibility).

### Layer 3 — Relationships

Links to the engineering graph: `commits`, `pullRequests`, `issues`, `errors`, `deployments`, `parentSession`, `childSessions`.

## Extensibility

Every object has a `properties` bag for vendor-specific data ([SARIF pattern](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html)):

```json
{
  "agent": {
    "name": "Claude Code",
    "properties": {
      "claude-code:thinkingBudget": 32000,
      "claude-code:permissionMode": "auto"
    }
  }
}
```

## Who It's For

| Workflow | What AgentLog Records |
|----------|----------------------|
| **Developer + AI** | Claude Code sessions, Cursor chats — what you built and why |
| **Agent + Agent** | Multi-agent orchestration — delegation chains, sub-agent results |
| **Teams** | Fleet visibility — which agents ran, on what, at what cost |

## SDKs & Converters

| Language | Package | Status |
|----------|---------|--------|
| TypeScript/Node | [`@braintied/agentlog`](https://www.npmjs.com/package/@braintied/agentlog) | Available |
| Python | — | Planned |
| Go | — | Planned |

| Converter | Status |
|-----------|--------|
| Claude Code JSONL | Available |
| Watchtower DB | Available |
| Aider | Planned |
| OpenAI Codex | Planned |
| Cursor | Planned |

## Examples

| Example | Events | Demonstrates |
|---------|--------|-------------|
| [minimal-session.json](examples/minimal-session.json) | 6 | Basic edit + test flow |
| [debugging-session.json](examples/debugging-session.json) | 8 | Error investigation with Sentry link |
| [multi-agent-session.json](examples/multi-agent-session.json) | 5 | Parallel sub-agent orchestration |

## Complements Agent Trace

[Agent Trace](https://agent-trace.dev/) tracks *attribution* — which lines AI wrote.
AgentLog tracks *activity* — what happened during the session.

Together: "what did AI write?" + "how did it get there?"

## Design Influences

| Pattern | Source |
|---------|--------|
| Minimal required fields | [CloudEvents](https://cloudevents.io/) |
| Property bags | [SARIF](https://sarifweb.azurewebsites.net/) |
| JSON Schema as normative | [CycloneDX](https://cyclonedx.org/) |
| Discriminated event union | [OTel GenAI](https://opentelemetry.io/) |
| Profile modularity | [SPDX 3.0](https://spdx.dev/) |

## Community

- [GitHub Issues](https://github.com/braintied/agentlog/issues) — bugs, feature requests, spec proposals
- [Contributing Guide](CONTRIBUTING.md) — how to add converters, propose spec changes
- [Security Policy](SECURITY.md) — reporting vulnerabilities

## License

[Apache-2.0](LICENSE) — spec and code. The explicit patent grant (Section 3) protects implementers.

---

<p align="center">
  <sub>Built by <a href="https://braintied.com">Braintied</a> · Reference implementation: <a href="https://github.com/braintied/watchtower">Watchtower</a></sub>
</p>
