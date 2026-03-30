/**
 * AgentLog — Core Type Definitions
 *
 * Open standard for AI agent session interchange.
 * Spec version: 0.2.0
 *
 * v0.2.0 changes from v0.1.0:
 *   - 5 new event types: handoff, approval, plan, checkpoint, contextLoad
 *   - Per-event tokenUsage, estimatedCostUsd, model on EventBase
 *   - Expanded status enum: paused, timeout, interrupted, queued
 *   - OTel correlation: traceId, spanId on EventBase
 *   - groupId on events for atomic multi-file operations
 *   - Structured reasoning: reasoningType, conclusion, visible, tokensUsed
 *   - New relationships: reviews, testRuns, branches
 *   - Session-level classification and redaction metadata
 *   - Team/orchestration object for multi-agent sessions
 *   - NDJSON streaming format defined
 *
 * @license Apache-2.0
 */

// =============================================================================
// SPEC VERSION
// =============================================================================

export const SPEC_VERSION = '0.2.0';

// =============================================================================
// SESSION ENVELOPE (Layer 1 — Required)
// =============================================================================

/**
 * The root document representing a single AI agent session.
 */
export interface AgentLog {
  /** Spec version (semver). */
  specVersion: string;

  /** Unique session identifier. UUID v7 or ULID recommended for sortability. */
  id: string;

  /** ISO 8601 start time. */
  startTime: string;

  /** ISO 8601 end time. Null if still active. */
  endTime: string | null;

  /** Session status. */
  status: SessionStatus;

  /** The AI agent/tool that powered this session. */
  agent: AgentInfo;

  /** Project context. */
  project: ProjectContext | null;

  /** Developer who initiated the session. */
  developer: DeveloperInfo | null;

  /** Team/orchestration context for multi-agent sessions. */
  team: TeamInfo | null;

  /** Ordered timeline of events. */
  events: SessionEvent[];

  /** Aggregate metrics. */
  metrics: SessionMetrics | null;

  /** Links to engineering entities. */
  relationships: SessionRelationships | null;

  /** Data classification level. */
  classification: Classification | null;

  /** Redaction metadata. */
  redactions: RedactionRecord[] | null;

  /** Document format profile. */
  profile: 'full' | 'summary' | null;

  /** Extensible property bag. */
  properties: Record<string, unknown>;
}

export type SessionStatus =
  | 'active'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'timeout'
  | 'interrupted'
  | 'queued';

export type Classification = 'public' | 'internal' | 'confidential' | 'restricted';

// =============================================================================
// REDACTION
// =============================================================================

/**
 * Standard redaction format: [REDACTED:<category>]
 * Categories: api_key, password, pii, email, file_content, proprietary_code, custom
 */
export type RedactionCategory =
  | 'api_key'
  | 'password'
  | 'pii'
  | 'email'
  | 'file_content'
  | 'proprietary_code'
  | 'custom';

export interface RedactionRecord {
  /** What was redacted. */
  category: RedactionCategory;

  /** How many instances were redacted. */
  count: number;

  /** Which tool performed the redaction. */
  redactedBy: string | null;
}

// =============================================================================
// AGENT INFO
// =============================================================================

export interface AgentInfo {
  /** Agent name (e.g., "Claude Code", "Cursor", "Aider", "Codex"). */
  name: string;

  /** Agent version. */
  version: string | null;

  /** Default AI model used. */
  model: string | null;

  /** Model provider (e.g., "anthropic", "openai", "google"). */
  provider: string | null;

  properties: Record<string, unknown>;
}

// =============================================================================
// TEAM / ORCHESTRATION
// =============================================================================

export interface TeamInfo {
  /** Team or orchestration name. */
  name: string;

  /** Agents participating in this session. */
  agents: AgentRef[];

  /** Orchestration pattern. */
  processType: 'sequential' | 'parallel' | 'hierarchical' | 'graph' | null;

  properties: Record<string, unknown>;
}

export interface AgentRef {
  /** Agent identifier within this session. */
  id: string;

  /** Agent name. */
  name: string;

  /** Agent role (e.g., "orchestrator", "coder", "reviewer"). */
  role: string | null;

  /** Model used by this agent. */
  model: string | null;
}

// =============================================================================
// PROJECT CONTEXT
// =============================================================================

export interface ProjectContext {
  name: string;
  repository: string | null;
  workingDirectory: string | null;
  branch: string | null;
  commitSha: string | null;
  properties: Record<string, unknown>;
}

// =============================================================================
// DEVELOPER INFO
// =============================================================================

export interface DeveloperInfo {
  id: string;
  name: string | null;
  properties: Record<string, unknown>;
}

// =============================================================================
// SESSION EVENTS (Layer 2 — Activity Timeline)
// =============================================================================

/**
 * Discriminated union of all 12 event types.
 */
export type SessionEvent =
  | MessageEvent
  | ToolCallEvent
  | FileOperationEvent
  | TerminalCommandEvent
  | SearchEvent
  | ReasoningEvent
  | ErrorEvent
  | HandoffEvent
  | ApprovalEvent
  | PlanEvent
  | CheckpointEvent
  | ContextLoadEvent;

// =============================================================================
// EVENT BASE (shared by all events)
// =============================================================================

/**
 * Base fields present on every event.
 *
 * v0.2.0 additions: tokenUsage, estimatedCostUsd, model, traceId, spanId, groupId
 */
export interface EventBase {
  /** Unique event ID within this session. */
  id: string;

  /** ISO 8601 timestamp. */
  timestamp: string;

  /** Parent event ID for nesting. */
  parentId: string | null;

  /** Duration in milliseconds. */
  durationMs: number | null;

  /** Token usage for this specific event. */
  tokenUsage: TokenUsage | null;

  /** Cost in USD for this specific event. */
  estimatedCostUsd: number | null;

  /** Model used for this event (when different from session default). */
  model: string | null;

  /** OTel trace ID for correlation (128-bit hex). */
  traceId: string | null;

  /** OTel span ID for correlation (64-bit hex). */
  spanId: string | null;

  /** Group ID linking related events (e.g., atomic multi-file edit). */
  groupId: string | null;

  /** Extensible property bag. */
  properties: Record<string, unknown>;
}

// =============================================================================
// ORIGINAL 7 EVENT TYPES (enhanced)
// =============================================================================

export interface MessageEvent extends EventBase {
  type: 'message';
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolCallEvent extends EventBase {
  type: 'toolCall';
  name: string;
  input: Record<string, unknown>;
  output: string | null;
  status: 'success' | 'error' | 'cancelled';
  summary: string | null;
}

export interface FileOperationEvent extends EventBase {
  type: 'fileOperation';
  operation: 'read' | 'create' | 'edit' | 'delete';
  path: string;
  diff: string | null;
  diffFormat: 'unified' | 'json-patch' | 'custom' | null;
  beforeHash: string | null;
  afterHash: string | null;
  linesAdded: number | null;
  linesRemoved: number | null;
  truncated: boolean | null;
}

export interface TerminalCommandEvent extends EventBase {
  type: 'terminalCommand';
  command: string;
  cwd: string | null;
  stdout: string | null;
  stderr: string | null;
  exitCode: number | null;
  shell: string | null;
  truncated: boolean | null;
}

export interface SearchEvent extends EventBase {
  type: 'search';
  tool: string;
  query: string;
  resultCount: number | null;
  topResults: string[];
}

export interface ReasoningEvent extends EventBase {
  type: 'reasoning';
  /** What the agent was trying to accomplish. */
  intent: string;
  /** Type of reasoning. */
  reasoningType: ReasoningType | null;
  /** The chain-of-thought content. */
  content: string | null;
  /** Alternatives considered. */
  alternatives: string[];
  /** Why this approach was chosen. */
  rationale: string;
  /** The conclusion reached. */
  conclusion: string | null;
  /** Whether reasoning was visible to the user. */
  visible: boolean | null;
  /** Reasoning-specific tokens (separate from input/output). */
  reasoningTokens: number | null;
}

export type ReasoningType =
  | 'planning'
  | 'analysis'
  | 'reflection'
  | 'decision'
  | 'evaluation'
  | 'debugging';

export interface ErrorEvent extends EventBase {
  type: 'error';
  message: string;
  code: string | null;
  category: ErrorCategory | null;
  recovery: ErrorRecovery | null;
  resolved: boolean;
}

export type ErrorCategory =
  | 'runtime'
  | 'type'
  | 'syntax'
  | 'network'
  | 'permission'
  | 'timeout'
  | 'validation'
  | 'resource'
  | 'unknown';

export type ErrorRecovery =
  | 'retry'
  | 'skip'
  | 'abort'
  | 'escalate'
  | 'fixed'
  | 'workaround'
  | 'ignored'
  | 'deferred';

// =============================================================================
// 5 NEW EVENT TYPES (v0.2.0)
// =============================================================================

// ── Handoff Event ─────────────────────────────────────────────────────

/** Agent-to-agent delegation. */
export interface HandoffEvent extends EventBase {
  type: 'handoff';
  /** Agent initiating the handoff. */
  fromAgent: string;
  /** Agent receiving the handoff. */
  toAgent: string;
  /** Why the handoff is happening. */
  reason: string | null;
  /** Context transferred to the target agent. */
  contextTransferred: string | null;
  /** Result received from the target agent. */
  result: string | null;
  /** Handoff status. */
  status: 'initiated' | 'accepted' | 'completed' | 'rejected' | 'failed';
}

// ── Approval Event ────────────────────────────────────────────────────

/** Human-in-the-loop permission decision. */
export interface ApprovalEvent extends EventBase {
  type: 'approval';
  /** What action required approval. */
  action: string;
  /** Who made the decision (user, policy, system). */
  approver: 'user' | 'policy' | 'system';
  /** The decision. */
  decision: 'approved' | 'denied' | 'modified';
  /** Constraints applied to the approval. */
  constraints: string | null;
  /** The tool/action that was approved or denied. */
  toolName: string | null;
}

// ── Plan Event ────────────────────────────────────────────────────────

/** Structured plan or task decomposition. */
export interface PlanEvent extends EventBase {
  type: 'plan';
  /** Plan title. */
  title: string;
  /** Plan steps. */
  steps: PlanStep[];
  /** Overall plan status. */
  status: 'draft' | 'active' | 'completed' | 'abandoned';
}

export interface PlanStep {
  /** Step identifier. */
  id: string;
  /** Step description. */
  description: string;
  /** Step status. */
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  /** IDs of steps that must complete before this one. */
  dependsOn: string[];
  /** Confidence score (0-1). */
  confidence: number | null;
}

// ── Checkpoint Event ──────────────────────────────────────────────────

/** State snapshot for rollback/recovery. */
export interface CheckpointEvent extends EventBase {
  type: 'checkpoint';
  /** What kind of checkpoint. */
  checkpointType: 'git_commit' | 'snapshot' | 'memory_flush' | 'auto_save' | 'custom';
  /** Human-readable label. */
  label: string | null;
  /** Reference to the checkpoint data. */
  reference: string | null;
  /** Whether this checkpoint can be restored. */
  restorable: boolean;
}

// ── Context Load Event ────────────────────────────────────────────────

/** Agent loading context from external sources. */
export interface ContextLoadEvent extends EventBase {
  type: 'contextLoad';
  /** Source of the context. */
  source: 'file' | 'memory' | 'rag' | 'web' | 'database' | 'api' | 'codebase' | 'custom';
  /** What was loaded (query, path, URL). */
  query: string | null;
  /** Number of items/chunks loaded. */
  itemCount: number | null;
  /** Total tokens of context loaded. */
  tokenCount: number | null;
  /** Why context was loaded. */
  reason: string | null;
}

// =============================================================================
// METRICS
// =============================================================================

export interface SessionMetrics {
  messageCount: number;
  toolCallCount: number;
  filesTouchedCount: number;
  durationMinutes: number | null;
  tokenUsage: TokenUsage | null;
  estimatedCostUsd: number | null;
  filesTouched: string[];
  toolsUsed: string[];
  /** Models used during the session (when multiple). */
  modelsUsed: string[];
  properties: Record<string, unknown>;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number | null;
  cacheWriteTokens: number | null;
  /** Reasoning/thinking tokens (separate from input/output). */
  reasoningTokens: number | null;
}

// =============================================================================
// RELATIONSHIPS (Layer 3 — Engineering Graph)
// =============================================================================

export interface SessionRelationships {
  commits: CommitRef[];
  pullRequests: PullRequestRef[];
  issues: IssueRef[];
  errors: ErrorRef[];
  deployments: DeploymentRef[];

  /** v0.2.0: Code review references. */
  reviews: ReviewRef[];

  /** v0.2.0: Test run references. */
  testRuns: TestRunRef[];

  /** v0.2.0: Branch operations. */
  branches: BranchRef[];

  parentSession: string | null;
  childSessions: string[];

  /** v0.2.0: Group ID linking related sessions (e.g., multi-turn conversation). */
  groupId: string | null;

  properties: Record<string, unknown>;
}

export interface CommitRef {
  sha: string;
  message: string | null;
  repository: string | null;
  timestamp: string | null;
}

export interface PullRequestRef {
  number: number;
  title: string | null;
  url: string | null;
  repository: string | null;
  status: string | null;
}

export interface IssueRef {
  id: string;
  title: string | null;
  url: string | null;
  tracker: string | null;
  status: string | null;
}

export interface ErrorRef {
  id: string;
  source: string;
  url: string | null;
  title: string | null;
}

export interface DeploymentRef {
  id: string;
  environment: string | null;
  url: string | null;
  status: string | null;
}

// v0.2.0 new relationship types

export interface ReviewRef {
  /** PR number this review belongs to. */
  pullRequestNumber: number | null;
  /** Review status. */
  status: 'approved' | 'changes_requested' | 'commented' | 'dismissed' | null;
  /** Number of review comments. */
  commentCount: number | null;
  url: string | null;
}

export interface TestRunRef {
  /** Test framework (jest, pytest, etc.). */
  framework: string | null;
  passed: number;
  failed: number;
  skipped: number | null;
  /** Coverage percentage. */
  coverage: number | null;
  /** Duration in milliseconds. */
  durationMs: number | null;
  /** Specific failures. */
  failures: string[];
}

export interface BranchRef {
  name: string;
  action: 'created' | 'switched' | 'merged' | 'deleted' | 'rebased';
  baseBranch: string | null;
}
