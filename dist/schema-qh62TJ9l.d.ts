/**
 * AgentLog — Core Type Definitions
 *
 * Open standard for AI agent session interchange.
 * Spec version: 0.1.0
 *
 * Captures the full record of what happened during an AI-assisted
 * development session: conversation, tool calls, file operations,
 * terminal commands, reasoning traces, costs, and relationships
 * to the engineering graph.
 *
 * Architecture: CloudEvents (minimal core) + SARIF (property bags)
 * + SPDX 3.0 (modular profiles).
 *
 * @license Apache-2.0
 */
declare const SPEC_VERSION = "0.1.0";
/**
 * The root document representing a single AI coding session.
 */
interface AgentLog {
    /** Spec version — always required. */
    specVersion: typeof SPEC_VERSION;
    /** Unique session identifier (UUID v4 recommended). */
    id: string;
    /** When the session started. ISO 8601. */
    startTime: string;
    /** When the session ended. ISO 8601. Null if still active. */
    endTime: string | null;
    /** Session status. */
    status: SessionStatus;
    /** The AI agent/tool that powered this session. */
    agent: AgentInfo;
    /** The project context for this session. */
    project: ProjectContext | null;
    /** The developer who initiated the session. */
    developer: DeveloperInfo | null;
    /** Ordered timeline of events during the session. */
    events: SessionEvent[];
    /** Aggregate metrics for the session. */
    metrics: SessionMetrics | null;
    /** Links to external engineering entities. */
    relationships: SessionRelationships | null;
    /** Extensible property bag for vendor-specific data. */
    properties: Record<string, unknown>;
}
type SessionStatus = 'active' | 'completed' | 'failed' | 'cancelled';
interface AgentInfo {
    /** Agent name (e.g., "Claude Code", "Cursor", "Aider", "Codex"). */
    name: string;
    /** Agent version (e.g., "1.0.32"). */
    version: string | null;
    /** The AI model used (e.g., "claude-sonnet-4-6", "gpt-4o"). */
    model: string | null;
    /** Model provider (e.g., "anthropic", "openai", "google"). */
    provider: string | null;
    properties: Record<string, unknown>;
}
interface ProjectContext {
    /** Project or repository name. */
    name: string;
    /** Repository URL or identifier. */
    repository: string | null;
    /** Working directory path. */
    workingDirectory: string | null;
    /** Git branch at session start. */
    branch: string | null;
    /** Git commit SHA at session start. */
    commitSha: string | null;
    properties: Record<string, unknown>;
}
interface DeveloperInfo {
    /** Developer identifier (username, email, or opaque ID). */
    id: string;
    /** Display name. */
    name: string | null;
    properties: Record<string, unknown>;
}
/**
 * Discriminated union of all event types in a session timeline.
 */
type SessionEvent = MessageEvent | ToolCallEvent | FileOperationEvent | TerminalCommandEvent | SearchEvent | ReasoningEvent | ErrorEvent;
/** Base fields shared by all events. */
interface EventBase {
    /** Unique event ID within this session. */
    id: string;
    /** ISO 8601 timestamp. */
    timestamp: string;
    /** Parent event ID for nesting (e.g., tool call within an agent turn). */
    parentId: string | null;
    /** Duration in milliseconds (if applicable). */
    durationMs: number | null;
    /** Extensible property bag. */
    properties: Record<string, unknown>;
}
interface MessageEvent extends EventBase {
    type: 'message';
    /** Who sent the message. */
    role: 'user' | 'assistant' | 'system';
    /** Message text content. */
    content: string;
    /** Token usage for this message (if known). */
    tokenUsage: TokenUsage | null;
}
interface ToolCallEvent extends EventBase {
    type: 'toolCall';
    /** Tool name (e.g., "Edit", "Bash", "Grep", "WebSearch"). */
    name: string;
    /** Tool input parameters. Values truncated for large content. */
    input: Record<string, unknown>;
    /** Tool output/result. Truncated for large content. */
    output: string | null;
    /** Whether the tool call succeeded. */
    status: 'success' | 'error' | 'cancelled';
    /** Human-readable summary of what this tool call did. */
    summary: string | null;
}
interface FileOperationEvent extends EventBase {
    type: 'fileOperation';
    /** What was done to the file. */
    operation: 'read' | 'create' | 'edit' | 'delete';
    /** File path (relative to project root when possible). */
    path: string;
    /** Unified diff for edits. Null for reads/deletes. */
    diff: string | null;
    /** Content hash before the operation. */
    beforeHash: string | null;
    /** Content hash after the operation. */
    afterHash: string | null;
    /** Number of lines added. */
    linesAdded: number | null;
    /** Number of lines removed. */
    linesRemoved: number | null;
}
interface TerminalCommandEvent extends EventBase {
    type: 'terminalCommand';
    /** The command that was executed. */
    command: string;
    /** Working directory when the command ran. */
    cwd: string | null;
    /** Standard output (truncated). */
    stdout: string | null;
    /** Standard error (truncated). */
    stderr: string | null;
    /** Process exit code. */
    exitCode: number | null;
}
interface SearchEvent extends EventBase {
    type: 'search';
    /** Search tool (e.g., "Grep", "Glob", "WebSearch", "semanticSearch"). */
    tool: string;
    /** The search query or pattern. */
    query: string;
    /** Number of results found. */
    resultCount: number | null;
    /** Top result summaries (file paths, URLs, etc.). */
    topResults: string[];
}
interface ReasoningEvent extends EventBase {
    type: 'reasoning';
    /** What the agent was trying to accomplish. */
    intent: string;
    /** Alternatives considered. */
    alternatives: string[];
    /** Why this approach was chosen. */
    rationale: string;
}
interface ErrorEvent extends EventBase {
    type: 'error';
    /** Error message. */
    message: string;
    /** Error code or type. */
    code: string | null;
    /** How the error was handled. */
    recovery: 'retry' | 'skip' | 'abort' | 'escalate' | 'fixed' | null;
    /** Whether the error was ultimately resolved. */
    resolved: boolean;
}
interface SessionMetrics {
    /** Total messages exchanged. */
    messageCount: number;
    /** Total tool calls made. */
    toolCallCount: number;
    /** Total files touched (unique). */
    filesTouchedCount: number;
    /** Session duration in minutes. */
    durationMinutes: number | null;
    /** Token usage totals. */
    tokenUsage: TokenUsage | null;
    /** Estimated cost in USD. */
    estimatedCostUsd: number | null;
    /** Files touched (unique paths). */
    filesTouched: string[];
    /** Tools used (unique names). */
    toolsUsed: string[];
    properties: Record<string, unknown>;
}
interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number | null;
    cacheWriteTokens: number | null;
}
interface SessionRelationships {
    /** Commits created during or as a result of this session. */
    commits: CommitRef[];
    /** Pull requests created or updated. */
    pullRequests: PullRequestRef[];
    /** Issues referenced or addressed. */
    issues: IssueRef[];
    /** Errors tracked in external systems (Sentry, etc.). */
    errors: ErrorRef[];
    /** Deployments triggered. */
    deployments: DeploymentRef[];
    /** Parent session (if this is a continuation). */
    parentSession: string | null;
    /** Child sessions (follow-ups). */
    childSessions: string[];
    properties: Record<string, unknown>;
}
interface CommitRef {
    sha: string;
    message: string | null;
    repository: string | null;
    timestamp: string | null;
}
interface PullRequestRef {
    number: number;
    title: string | null;
    url: string | null;
    repository: string | null;
    status: string | null;
}
interface IssueRef {
    id: string;
    title: string | null;
    url: string | null;
    tracker: string | null;
    status: string | null;
}
interface ErrorRef {
    id: string;
    source: string;
    url: string | null;
    title: string | null;
}
interface DeploymentRef {
    id: string;
    environment: string | null;
    url: string | null;
    status: string | null;
}

export { type AgentInfo as A, type CommitRef as C, type DeploymentRef as D, type ErrorEvent as E, type FileOperationEvent as F, type IssueRef as I, type MessageEvent as M, type ProjectContext as P, type ReasoningEvent as R, SPEC_VERSION as S, type TerminalCommandEvent as T, type AgentLog as a, type DeveloperInfo as b, type ErrorRef as c, type PullRequestRef as d, type SearchEvent as e, type SessionEvent as f, type SessionMetrics as g, type SessionRelationships as h, type SessionStatus as i, type TokenUsage as j, type ToolCallEvent as k };
