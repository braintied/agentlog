# AgentLog

**Open standard for AI agent session interchange.**

AgentLog defines a portable JSON format for recording what happens during AI agent sessions — human-to-agent coding, agent-to-agent orchestration, and team-managed agent workflows. It captures conversation, tool calls, file operations, terminal commands, reasoning traces, costs, and relationships to commits, PRs, and issues.

[![npm](https://img.shields.io/npm/v/@braintied/agentlog)](https://www.npmjs.com/package/@braintied/agentlog)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![GitHub](https://img.shields.io/github/stars/braintied/agentlog)](https://github.com/braintied/agentlog)

## Why

Every AI coding tool produces session logs in its own proprietary format. There's no way to:

- Search across sessions from different tools (Claude Code, Cursor, Codex, Aider)
- Track what agent teams are doing across your projects
- Measure AI coding impact across your engineering org
- Feed session data into observability platforms (Langfuse, Grafana)
- Build intelligence layers that understand *how* code was written

AgentLog fills this gap. One format, every tool, every workflow.

## Who It's For

| Workflow | What AgentLog Records |
|----------|----------------------|
| **Developer + AI agent** | Claude Code sessions, Cursor chats, Codex runs — what you built, what files changed, what decisions were made |
| **Agent + Agent** | Multi-agent orchestration — which agent delegated to which, what each sub-agent did, how results flowed back |
| **Teams managing agents** | Fleet-wide visibility — which agents ran, on which projects, at what cost, with what outcomes |

## Install

```bash
npm install @braintied/agentlog
```

## Quick Start

```typescript
import type { AgentLog } from '@braintied/agentlog';
import { validateAgentLog, SPEC_VERSION } from '@braintied/agentlog';

// Validate a session document
const result = validateAgentLog(jsonData);
if (result.success) {
  const session: AgentLog = result.data;
  console.log(`${session.events.length} events across ${session.metrics?.durationMinutes} minutes`);
}
```

### Convert from Claude Code

```typescript
import { convertClaudeCodeSession } from '@braintied/agentlog/convert/claude-code';

const session = await convertClaudeCodeSession('~/.claude/projects/myproject/session-uuid');
```

### Export from Watchtower

```typescript
import { exportWatchtowerSession } from '@braintied/agentlog/convert/watchtower';

const agentLog = exportWatchtowerSession(dbRow, { projectName: 'my-app' });
```

## Schema Overview

An AgentLog document has three layers:

### Layer 1 — Session Envelope (required)

Every document starts with the basics: who, when, where.

```json
{
  "specVersion": "0.1.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "startTime": "2026-03-30T10:00:00Z",
  "endTime": "2026-03-30T10:45:00Z",
  "status": "completed",
  "agent": {
    "name": "Claude Code",
    "model": "claude-sonnet-4-6",
    "provider": "anthropic"
  },
  "project": {
    "name": "my-app",
    "repository": "acme/my-app",
    "branch": "main"
  },
  "developer": {
    "id": "dev-1",
    "name": "Jane Developer"
  }
}
```

### Layer 2 — Event Timeline

Seven event types capture everything that happened, in order:

| Event | What it records | Example |
|-------|----------------|---------|
| `message` | User prompts and AI responses | `"Fix the auth middleware"` |
| `toolCall` | Tool invocations with input/output | `Agent("debug auth", prompt="...")` |
| `fileOperation` | File read/create/edit/delete with diffs | `Edit src/middleware.ts: +4 -1` |
| `terminalCommand` | Shell commands with stdout/stderr/exit code | `npm run typecheck -> exit 0` |
| `search` | Code search, web search, semantic search | `Grep "token.*expired"` |
| `reasoning` | AI reasoning traces — intent, alternatives, rationale | `"Chose JWT refresh over re-auth because..."` |
| `error` | Errors encountered and how they were resolved | `TypeError: token is undefined -> fixed` |

Events support **nesting via `parentId`** — tool calls within an agent turn, sub-agent sessions within a parent session.

### Layer 3 — Relationships

Links sessions to the engineering graph:

- **Commits** — code created during the session
- **Pull requests** — PRs opened or updated
- **Issues** — issues referenced or resolved
- **Errors** — errors tracked in Sentry, Datadog, etc.
- **Deployments** — deploys triggered
- **Parent/child sessions** — session continuity and agent delegation chains

## Multi-Agent Support

AgentLog handles agent-to-agent workflows natively:

```json
{
  "type": "toolCall",
  "name": "Agent",
  "input": {
    "description": "Fix failing tests",
    "subagent_type": "sisyphus-junior",
    "prompt": "Run the test suite and fix any failures..."
  },
  "status": "success",
  "summary": "Sub-agent fixed 3 failing tests in auth module"
}
```

The `parentSession` and `childSessions` fields in relationships link orchestrator sessions to their delegated sub-sessions, creating a full execution tree.

## Metrics & Cost Tracking

Every session can include aggregate metrics:

```json
{
  "metrics": {
    "messageCount": 12,
    "toolCallCount": 24,
    "filesTouchedCount": 5,
    "durationMinutes": 45,
    "tokenUsage": {
      "inputTokens": 125000,
      "outputTokens": 8500,
      "cacheReadTokens": 98000,
      "cacheWriteTokens": null
    },
    "estimatedCostUsd": 0.42,
    "filesTouched": ["src/auth.ts", "src/middleware.ts"],
    "toolsUsed": ["Edit", "Bash", "Grep", "Agent"]
  }
}
```

## Extensibility

Every object in the schema has a `properties` bag for vendor-specific data:

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

This follows the SARIF property bag pattern — no namespace pollution, vendors can add custom data without schema changes.

## Complements Agent Trace

[Agent Trace](https://agent-trace.dev/) tracks *attribution* — which lines of code AI wrote. AgentLog tracks *activity* — what happened during the session. They're complementary:

- An AgentLog document can reference Agent Trace data in its relationships
- Agent Trace `conversation.url` fields can point to AgentLog documents
- Together they answer both "what did AI write?" and "how did it get there?"

## Design Principles

| Principle | Inspiration | Implementation |
|-----------|------------|----------------|
| Minimal required fields | CloudEvents | 5 required fields in the envelope — everything else optional |
| Property bags everywhere | SARIF | Every object accepts vendor-specific `properties` |
| Spec version on every document | CloudEvents | `specVersion` field enables forward compatibility |
| Discriminated event union | OTel GenAI | `type` field on each event for clean parsing |
| Modular profiles | SPDX 3.0 | Core, Engineering Graph, and Observability profiles (planned) |

## Converters

| Tool | Status | Import |
|------|--------|--------|
| Claude Code | Available | `@braintied/agentlog/convert/claude-code` |
| Watchtower | Available | `@braintied/agentlog/convert/watchtower` |
| Aider | Planned | — |
| OpenAI Codex | Planned | — |
| Cursor | Planned | — |

Want to add a converter? See [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

- [ ] JSON Schema files (`.schema.json`) exported alongside TypeScript types
- [ ] GitHub Actions CI for schema validation and type checking
- [ ] Aider and Codex converters
- [ ] Prose specification document (`spec/agentlog-spec.md`)
- [ ] More example sessions (debugging, multi-agent, refactoring)
- [ ] Documentation site
- [ ] OTel export bridge (AgentLog events -> OTel spans with `gen_ai.*` attributes)

## License

Apache-2.0 — spec and code. The explicit patent grant (Section 3) protects implementers of the format.

## Status

**v0.1.0** — initial release. Schema, validation, converters for Claude Code and Watchtower. Seeking early adopters and feedback.

Built by [Braintied](https://braintied.com). Created as part of the [Watchtower](https://github.com/braintied) project intelligence platform.
