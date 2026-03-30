/**
 * AgentLog — Runtime Validation (Zod v4 ready)
 *
 * All event schemas are exported individually for Zod v4 compatibility.
 * Use AgentLogSchema for full document validation.
 *
 * @license Apache-2.0
 */

import { z } from 'zod';

// =============================================================================
// SHARED SCHEMAS
// =============================================================================

export const TokenUsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
  cacheReadTokens: z.number().nullable().default(null),
  cacheWriteTokens: z.number().nullable().default(null),
  reasoningTokens: z.number().nullable().default(null),
});

const PropertiesSchema = z.record(z.string(), z.unknown()).default({});

// =============================================================================
// EVENT BASE SCHEMA (v0.2.0 — includes tokenUsage, cost, model, OTel, groupId)
// =============================================================================

export const EventBaseSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  parentId: z.string().nullable().default(null),
  durationMs: z.number().nullable().default(null),
  tokenUsage: TokenUsageSchema.nullable().default(null),
  estimatedCostUsd: z.number().nullable().default(null),
  model: z.string().nullable().default(null),
  traceId: z.string().nullable().default(null),
  spanId: z.string().nullable().default(null),
  groupId: z.string().nullable().default(null),
  properties: PropertiesSchema,
});

// =============================================================================
// ORIGINAL 7 EVENT SCHEMAS (enhanced)
// =============================================================================

export const MessageEventSchema = EventBaseSchema.extend({
  type: z.literal('message'),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

export const ToolCallEventSchema = EventBaseSchema.extend({
  type: z.literal('toolCall'),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
  output: z.string().nullable().default(null),
  status: z.enum(['success', 'error', 'cancelled']),
  summary: z.string().nullable().default(null),
});

export const FileOperationEventSchema = EventBaseSchema.extend({
  type: z.literal('fileOperation'),
  operation: z.enum(['read', 'create', 'edit', 'delete']),
  path: z.string(),
  diff: z.string().nullable().default(null),
  diffFormat: z.enum(['unified', 'json-patch', 'custom']).nullable().default(null),
  beforeHash: z.string().nullable().default(null),
  afterHash: z.string().nullable().default(null),
  linesAdded: z.number().nullable().default(null),
  linesRemoved: z.number().nullable().default(null),
  truncated: z.boolean().nullable().default(null),
});

export const TerminalCommandEventSchema = EventBaseSchema.extend({
  type: z.literal('terminalCommand'),
  command: z.string(),
  cwd: z.string().nullable().default(null),
  stdout: z.string().nullable().default(null),
  stderr: z.string().nullable().default(null),
  exitCode: z.number().nullable().default(null),
  shell: z.string().nullable().default(null),
  truncated: z.boolean().nullable().default(null),
});

export const SearchEventSchema = EventBaseSchema.extend({
  type: z.literal('search'),
  tool: z.string(),
  query: z.string(),
  resultCount: z.number().nullable().default(null),
  topResults: z.array(z.string()).default([]),
});

export const ReasoningEventSchema = EventBaseSchema.extend({
  type: z.literal('reasoning'),
  intent: z.string(),
  reasoningType: z.enum(['planning', 'analysis', 'reflection', 'decision', 'evaluation', 'debugging']).nullable().default(null),
  content: z.string().nullable().default(null),
  alternatives: z.array(z.string()).default([]),
  rationale: z.string(),
  conclusion: z.string().nullable().default(null),
  visible: z.boolean().nullable().default(null),
  reasoningTokens: z.number().nullable().default(null),
});

export const ErrorEventSchema = EventBaseSchema.extend({
  type: z.literal('error'),
  message: z.string(),
  code: z.string().nullable().default(null),
  category: z.enum(['runtime', 'type', 'syntax', 'network', 'permission', 'timeout', 'validation', 'resource', 'unknown']).nullable().default(null),
  recovery: z.enum(['retry', 'skip', 'abort', 'escalate', 'fixed', 'workaround', 'ignored', 'deferred']).nullable().default(null),
  resolved: z.boolean(),
});

// =============================================================================
// 5 NEW EVENT SCHEMAS (v0.2.0)
// =============================================================================

export const HandoffEventSchema = EventBaseSchema.extend({
  type: z.literal('handoff'),
  fromAgent: z.string(),
  toAgent: z.string(),
  reason: z.string().nullable().default(null),
  contextTransferred: z.string().nullable().default(null),
  result: z.string().nullable().default(null),
  status: z.enum(['initiated', 'accepted', 'completed', 'rejected', 'failed']),
});

export const ApprovalEventSchema = EventBaseSchema.extend({
  type: z.literal('approval'),
  action: z.string(),
  approver: z.enum(['user', 'policy', 'system']),
  decision: z.enum(['approved', 'denied', 'modified']),
  constraints: z.string().nullable().default(null),
  toolName: z.string().nullable().default(null),
});

const PlanStepSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'skipped']),
  dependsOn: z.array(z.string()).default([]),
  confidence: z.number().nullable().default(null),
});

export const PlanEventSchema = EventBaseSchema.extend({
  type: z.literal('plan'),
  title: z.string(),
  steps: z.array(PlanStepSchema).default([]),
  status: z.enum(['draft', 'active', 'completed', 'abandoned']),
});

export const CheckpointEventSchema = EventBaseSchema.extend({
  type: z.literal('checkpoint'),
  checkpointType: z.enum(['git_commit', 'snapshot', 'memory_flush', 'auto_save', 'custom']),
  label: z.string().nullable().default(null),
  reference: z.string().nullable().default(null),
  restorable: z.boolean(),
});

export const ContextLoadEventSchema = EventBaseSchema.extend({
  type: z.literal('contextLoad'),
  source: z.enum(['file', 'memory', 'rag', 'web', 'database', 'api', 'codebase', 'custom']),
  query: z.string().nullable().default(null),
  itemCount: z.number().nullable().default(null),
  tokenCount: z.number().nullable().default(null),
  reason: z.string().nullable().default(null),
});

// =============================================================================
// SESSION EVENT UNION
// =============================================================================

export const SessionEventSchema = z.discriminatedUnion('type', [
  MessageEventSchema,
  ToolCallEventSchema,
  FileOperationEventSchema,
  TerminalCommandEventSchema,
  SearchEventSchema,
  ReasoningEventSchema,
  ErrorEventSchema,
  HandoffEventSchema,
  ApprovalEventSchema,
  PlanEventSchema,
  CheckpointEventSchema,
  ContextLoadEventSchema,
]);

// =============================================================================
// RELATIONSHIP SCHEMAS
// =============================================================================

const CommitRefSchema = z.object({ sha: z.string(), message: z.string().nullable().default(null), repository: z.string().nullable().default(null), timestamp: z.string().nullable().default(null) });
const PullRequestRefSchema = z.object({ number: z.number(), title: z.string().nullable().default(null), url: z.string().nullable().default(null), repository: z.string().nullable().default(null), status: z.string().nullable().default(null) });
const IssueRefSchema = z.object({ id: z.string(), title: z.string().nullable().default(null), url: z.string().nullable().default(null), tracker: z.string().nullable().default(null), status: z.string().nullable().default(null) });
const ErrorRefSchema = z.object({ id: z.string(), source: z.string(), url: z.string().nullable().default(null), title: z.string().nullable().default(null) });
const DeploymentRefSchema = z.object({ id: z.string(), environment: z.string().nullable().default(null), url: z.string().nullable().default(null), status: z.string().nullable().default(null) });
const ReviewRefSchema = z.object({ pullRequestNumber: z.number().nullable().default(null), status: z.enum(['approved', 'changes_requested', 'commented', 'dismissed']).nullable().default(null), commentCount: z.number().nullable().default(null), url: z.string().nullable().default(null) });
const TestRunRefSchema = z.object({ framework: z.string().nullable().default(null), passed: z.number(), failed: z.number(), skipped: z.number().nullable().default(null), coverage: z.number().nullable().default(null), durationMs: z.number().nullable().default(null), failures: z.array(z.string()).default([]) });
const BranchRefSchema = z.object({ name: z.string(), action: z.enum(['created', 'switched', 'merged', 'deleted', 'rebased']), baseBranch: z.string().nullable().default(null) });

const SessionRelationshipsSchema = z.object({
  commits: z.array(CommitRefSchema).default([]),
  pullRequests: z.array(PullRequestRefSchema).default([]),
  issues: z.array(IssueRefSchema).default([]),
  errors: z.array(ErrorRefSchema).default([]),
  deployments: z.array(DeploymentRefSchema).default([]),
  reviews: z.array(ReviewRefSchema).default([]),
  testRuns: z.array(TestRunRefSchema).default([]),
  branches: z.array(BranchRefSchema).default([]),
  parentSession: z.string().nullable().default(null),
  childSessions: z.array(z.string()).default([]),
  groupId: z.string().nullable().default(null),
  properties: PropertiesSchema,
});

// =============================================================================
// SESSION SCHEMA
// =============================================================================

const AgentInfoSchema = z.object({ name: z.string(), version: z.string().nullable().default(null), model: z.string().nullable().default(null), provider: z.string().nullable().default(null), properties: PropertiesSchema });
const AgentRefSchema = z.object({ id: z.string(), name: z.string(), role: z.string().nullable().default(null), model: z.string().nullable().default(null) });
const TeamInfoSchema = z.object({ name: z.string(), agents: z.array(AgentRefSchema).default([]), processType: z.enum(['sequential', 'parallel', 'hierarchical', 'graph']).nullable().default(null), properties: PropertiesSchema });
const ProjectContextSchema = z.object({ name: z.string(), repository: z.string().nullable().default(null), workingDirectory: z.string().nullable().default(null), branch: z.string().nullable().default(null), commitSha: z.string().nullable().default(null), properties: PropertiesSchema });
const DeveloperInfoSchema = z.object({ id: z.string(), name: z.string().nullable().default(null), properties: PropertiesSchema });
const RedactionRecordSchema = z.object({ category: z.enum(['api_key', 'password', 'pii', 'email', 'file_content', 'proprietary_code', 'custom']), count: z.number(), redactedBy: z.string().nullable().default(null) });
const SessionMetricsSchema = z.object({ messageCount: z.number(), toolCallCount: z.number(), filesTouchedCount: z.number(), durationMinutes: z.number().nullable().default(null), tokenUsage: TokenUsageSchema.nullable().default(null), estimatedCostUsd: z.number().nullable().default(null), filesTouched: z.array(z.string()).default([]), toolsUsed: z.array(z.string()).default([]), modelsUsed: z.array(z.string()).default([]), properties: PropertiesSchema });

export const AgentLogSchema = z.object({
  specVersion: z.string(),
  id: z.string(),
  startTime: z.string(),
  endTime: z.string().nullable().default(null),
  status: z.enum(['active', 'completed', 'failed', 'cancelled', 'paused', 'timeout', 'interrupted', 'queued']),
  agent: AgentInfoSchema,
  project: ProjectContextSchema.nullable().default(null),
  developer: DeveloperInfoSchema.nullable().default(null),
  team: TeamInfoSchema.nullable().default(null),
  events: z.array(SessionEventSchema).default([]),
  metrics: SessionMetricsSchema.nullable().default(null),
  relationships: SessionRelationshipsSchema.nullable().default(null),
  classification: z.enum(['public', 'internal', 'confidential', 'restricted']).nullable().default(null),
  redactions: z.array(RedactionRecordSchema).nullable().default(null),
  profile: z.enum(['full', 'summary']).nullable().default(null),
  properties: PropertiesSchema,
});

/** Validate an AgentLog document. */
export function validateAgentLog(input: unknown) {
  return AgentLogSchema.safeParse(input);
}
