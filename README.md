# AgentLog

**Open standard for AI agent session interchange.**

AgentLog defines a portable JSON format for recording what happens during AI-assisted development sessions — conversation, tool calls, file operations, terminal commands, reasoning traces, costs, and relationships to commits, PRs, and issues.

## Why

Every AI coding tool (Claude Code, Cursor, Codex, Aider) produces session logs in its own proprietary format. There's no way to:

- Search across sessions from different tools
- Measure AI coding impact across your engineering org
- Feed session data into observability platforms (Langfuse, Grafana)
- Build intelligence layers that understand *how* code was written, not just *what* was written

AgentLog fills this gap. One format, every tool, portable everywhere.

## Install

```bash
npm install @agentlog/schema
```

## Usage

```typescript
import type { AgentLog } from '@agentlog/schema';
import { validateAgentLog, SPEC_VERSION } from '@agentlog/schema';

// Validate a session document
const result = validateAgentLog(jsonData);
if (result.success) {
  const session: AgentLog = result.data;
  console.log(`${session.events.length} events in session`);
}
```

### Convert from Claude Code

```typescript
import { convertClaudeCodeSession } from '@agentlog/schema/convert/claude-code';

const session = await convertClaudeCodeSession('~/.claude/projects/myproject/session-uuid');
```

### Export from Watchtower

```typescript
import { exportWatchtowerSession } from '@agentlog/schema/convert/watchtower';

const agentLog = exportWatchtowerSession(dbRow, { projectName: 'my-app' });
```

## Schema Overview

An AgentLog document has three layers:

### Layer 1 — Session Envelope (required)

```json
{
  "specVersion": "0.1.0",
  "id": "uuid",
  "startTime": "2026-03-30T10:00:00Z",
  "endTime": "2026-03-30T10:45:00Z",
  "status": "completed",
  "agent": { "name": "Claude Code", "model": "claude-sonnet-4-6", "provider": "anthropic" },
  "project": { "name": "my-app", "repository": "owner/repo", "branch": "main" }
}
```

### Layer 2 — Event Timeline

Seven event types capture everything that happened:

| Event | What it records |
|-------|----------------|
| `message` | User prompts and AI responses with token usage |
| `toolCall` | Tool invocations with input/output |
| `fileOperation` | File read/create/edit/delete with diffs |
| `terminalCommand` | Shell commands with stdout/stderr/exit code |
| `search` | Code search, web search, semantic search queries |
| `reasoning` | AI reasoning traces — intent, alternatives, rationale |
| `error` | Errors encountered and how they were resolved |

### Layer 3 — Relationships

Links sessions to the engineering graph:

- **Commits** created during the session
- **Pull requests** opened or updated
- **Issues** referenced or resolved
- **Errors** tracked in Sentry, Datadog, etc.
- **Deployments** triggered
- **Parent/child sessions** for continuations

## Complements Agent Trace

[Agent Trace](https://agent-trace.dev/) tracks *attribution* — which lines of code AI wrote. AgentLog tracks *activity* — what happened during the session. They're complementary: an AgentLog can reference Agent Trace data, and Agent Trace conversation URLs can point to AgentLog documents.

## Design Principles

- **Minimal required fields** — following CloudEvents (5-7 required, everything else optional)
- **Property bags everywhere** — following SARIF for vendor-specific extensibility
- **JSON Schema as normative artifact** — following CycloneDX for machine-readable validation
- **Spec version on every document** — following CloudEvents for forward compatibility

## License

Apache-2.0 — spec and code. The explicit patent grant protects implementers.

## Status

v0.1.0 — initial release. Converters for Claude Code and Watchtower. Seeking early adopters and feedback.
