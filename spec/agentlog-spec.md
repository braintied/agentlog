# AgentLog Specification

**Version**: 0.1.0
**Status**: Draft
**Date**: 2026-03-30
**License**: Apache-2.0

## 1. Introduction

### 1.1 Purpose

AgentLog defines a portable JSON document format for recording AI agent sessions. A session is a bounded interaction between a developer (or another agent) and an AI agent, during which code is written, files are modified, commands are executed, and decisions are made.

### 1.2 Scope

This specification covers:
- The structure of an AgentLog document
- Required and optional fields
- Event types and their semantics
- Relationship entities linking sessions to the engineering graph
- Extensibility mechanisms

This specification does NOT cover:
- Live communication protocols (see MCP, A2A)
- Code attribution (see Agent Trace)
- Observability telemetry format (see OpenTelemetry GenAI)

### 1.3 Conformance

An AgentLog document is conformant if it:
1. Is valid JSON
2. Contains all required fields as specified in Section 2
3. Uses `specVersion` value `"0.1.0"`
4. Contains only recognized event types in the `events` array (Section 3)

Producers SHOULD include as many optional fields as available. Consumers MUST tolerate missing optional fields.

### 1.4 Terminology

- **Session**: A bounded interaction between a developer and an AI agent
- **Event**: A discrete action or occurrence within a session
- **Producer**: Software that creates AgentLog documents
- **Consumer**: Software that reads and processes AgentLog documents
- **Property bag**: An extensible `properties` object on every entity

## 2. Session Envelope

The root object of an AgentLog document.

### 2.1 Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `specVersion` | string | MUST be `"0.1.0"` |
| `id` | string | Unique session identifier. UUID v4 RECOMMENDED. |
| `startTime` | string | ISO 8601 datetime when the session started |
| `status` | string | One of: `active`, `completed`, `failed`, `cancelled` |
| `agent` | object | Agent information (Section 2.3) |
| `events` | array | Ordered array of session events (Section 3) |

### 2.2 Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `endTime` | string or null | ISO 8601 datetime when the session ended |
| `project` | object or null | Project context (Section 2.4) |
| `developer` | object or null | Developer information (Section 2.5) |
| `metrics` | object or null | Aggregate session metrics (Section 4) |
| `relationships` | object or null | Engineering graph links (Section 5) |
| `properties` | object | Extensible property bag. Default: `{}` |

### 2.3 Agent Information

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Agent name (e.g., "Claude Code", "Cursor") |
| `version` | string or null | No | Agent version |
| `model` | string or null | No | AI model identifier |
| `provider` | string or null | No | Model provider (e.g., "anthropic", "openai") |
| `properties` | object | No | Property bag |

### 2.4 Project Context

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Project name |
| `repository` | string or null | No | Repository identifier (e.g., "owner/repo") |
| `workingDirectory` | string or null | No | Filesystem path |
| `branch` | string or null | No | Git branch at session start |
| `commitSha` | string or null | No | Git commit SHA at session start |
| `properties` | object | No | Property bag |

### 2.5 Developer Information

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Developer identifier |
| `name` | string or null | No | Display name |
| `properties` | object | No | Property bag |

## 3. Event Types

Events are ordered chronologically in the `events` array. Each event has a `type` discriminator field and shares a common base.

### 3.1 Event Base Fields

All events include:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Event type discriminator |
| `id` | string | Yes | Unique event ID within the session |
| `timestamp` | string | Yes | ISO 8601 datetime |
| `parentId` | string or null | No | Parent event ID for nesting |
| `durationMs` | integer or null | No | Duration in milliseconds |
| `properties` | object | No | Property bag |

### 3.2 `message`

A conversational message between the developer and the agent.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | Yes | One of: `user`, `assistant`, `system` |
| `content` | string | Yes | Message text content |
| `tokenUsage` | object or null | No | Token usage for this message (Section 4.1) |

### 3.3 `toolCall`

An invocation of a tool by the agent.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Tool name (e.g., "Edit", "Bash", "Agent") |
| `input` | object | Yes | Tool input parameters (values MAY be truncated) |
| `output` | string or null | No | Tool output/result (MAY be truncated) |
| `status` | string | Yes | One of: `success`, `error`, `cancelled` |
| `summary` | string or null | No | Human-readable summary |

### 3.4 `fileOperation`

A file system operation performed during the session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `operation` | string | Yes | One of: `read`, `create`, `edit`, `delete` |
| `path` | string | Yes | File path (relative to project root RECOMMENDED) |
| `diff` | string or null | No | Unified diff for edits |
| `beforeHash` | string or null | No | Content hash before operation |
| `afterHash` | string or null | No | Content hash after operation |
| `linesAdded` | integer or null | No | Lines added |
| `linesRemoved` | integer or null | No | Lines removed |

### 3.5 `terminalCommand`

A shell command executed during the session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string | Yes | The command that was executed |
| `cwd` | string or null | No | Working directory |
| `stdout` | string or null | No | Standard output (MAY be truncated) |
| `stderr` | string or null | No | Standard error (MAY be truncated) |
| `exitCode` | integer or null | No | Process exit code |

### 3.6 `search`

A search or retrieval operation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tool` | string | Yes | Search tool name (e.g., "Grep", "WebSearch") |
| `query` | string | Yes | Search query or pattern |
| `resultCount` | integer or null | No | Number of results |
| `topResults` | array of strings | No | Top result summaries |

### 3.7 `reasoning`

An AI reasoning trace capturing the agent's decision-making process.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `intent` | string | Yes | What the agent was trying to accomplish |
| `alternatives` | array of strings | No | Alternatives considered |
| `rationale` | string | Yes | Why this approach was chosen |

### 3.8 `error`

An error encountered during the session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Error message |
| `code` | string or null | No | Error code or type |
| `recovery` | string or null | No | One of: `retry`, `skip`, `abort`, `escalate`, `fixed` |
| `resolved` | boolean | Yes | Whether the error was resolved |

## 4. Metrics

Aggregate metrics for the entire session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messageCount` | integer | Yes | Total messages exchanged |
| `toolCallCount` | integer | Yes | Total tool calls made |
| `filesTouchedCount` | integer | Yes | Unique files touched |
| `durationMinutes` | integer or null | No | Session duration |
| `tokenUsage` | object or null | No | Total token usage (Section 4.1) |
| `estimatedCostUsd` | number or null | No | Estimated cost in USD |
| `filesTouched` | array of strings | No | Unique file paths |
| `toolsUsed` | array of strings | No | Unique tool names |
| `properties` | object | No | Property bag |

### 4.1 Token Usage

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `inputTokens` | integer | Yes | Input/prompt tokens |
| `outputTokens` | integer | Yes | Output/completion tokens |
| `cacheReadTokens` | integer or null | No | Tokens read from cache |
| `cacheWriteTokens` | integer or null | No | Tokens written to cache |

## 5. Relationships

Links the session to external engineering entities.

| Field | Type | Description |
|-------|------|-------------|
| `commits` | array | Commits created during the session |
| `pullRequests` | array | PRs opened or updated |
| `issues` | array | Issues referenced or resolved |
| `errors` | array | Errors in external tracking systems |
| `deployments` | array | Deployments triggered |
| `parentSession` | string or null | Parent session ID (for continuations) |
| `childSessions` | array of strings | Child session IDs (for delegations) |
| `properties` | object | Property bag |

### 5.1 Commit Reference

Required: `sha`. Optional: `message`, `repository`, `timestamp`.

### 5.2 Pull Request Reference

Required: `number`. Optional: `title`, `url`, `repository`, `status`.

### 5.3 Issue Reference

Required: `id`. Optional: `title`, `url`, `tracker`, `status`.

### 5.4 Error Reference

Required: `id`, `source`. Optional: `url`, `title`.

### 5.5 Deployment Reference

Required: `id`. Optional: `environment`, `url`, `status`.

## 6. Extensibility

### 6.1 Property Bags

Every object in the schema includes a `properties` field of type `object` with `additionalProperties: true`. Producers MAY include arbitrary key-value pairs. Consumers MUST NOT reject documents containing unknown properties.

### 6.2 Vendor Namespacing

Vendors SHOULD prefix custom property keys with their tool name to avoid collisions:

```json
{
  "properties": {
    "claude-code:thinkingBudget": 32000,
    "cursor:composerMode": true
  }
}
```

### 6.3 Unknown Event Types

Consumers SHOULD tolerate unknown event types by treating them as opaque objects with the standard event base fields.

## 7. Security Considerations

### 7.1 Secret Redaction

Producers SHOULD redact secrets (API keys, tokens, passwords) from event content before creating AgentLog documents. The format itself does not define a redaction mechanism.

### 7.2 PII

Developer information (Section 2.5) MAY contain personally identifiable information. Consumers SHOULD handle this data according to applicable privacy regulations.

### 7.3 File Content

File diffs in `fileOperation` events MAY contain sensitive source code. Producers MAY omit or truncate diffs based on their security requirements.

## 8. MIME Type

The RECOMMENDED MIME type for AgentLog documents is `application/agentlog+json`.

The RECOMMENDED file extension is `.agentlog.json`.

## Appendix A: Relationship to Other Standards

| Standard | Relationship |
|----------|-------------|
| Agent Trace | Complementary. Agent Trace covers attribution; AgentLog covers activity. |
| OpenTelemetry GenAI | Complementary. AgentLog events can map to OTel spans. |
| MCP | Independent. MCP is a live protocol; AgentLog is a document format. |
| CloudEvents | Inspired by. Minimal required fields, `specVersion` pattern. |
| SARIF | Inspired by. Property bag extensibility pattern. |
| SPDX 3.0 | Inspired by. Profile-based modularity (planned). |
