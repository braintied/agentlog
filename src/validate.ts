/**
 * AgentLog — Runtime Validation
 *
 * Zod schemas for validating AgentLog documents at runtime.
 * Use these when ingesting sessions from external sources.
 */

import { z } from 'zod';
import { SPEC_VERSION } from './schema.js';

// =============================================================================
// SHARED SCHEMAS
// =============================================================================

const TokenUsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
  cacheReadTokens: z.number().nullable(),
  cacheWriteTokens: z.number().nullable(),
});

const PropertiesSchema = z.record(z.string(), z.unknown()).default({});

// =============================================================================
// EVENT SCHEMAS
// =============================================================================

const EventBaseSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  parentId: z.string().nullable().default(null),
  durationMs: z.number().nullable().default(null),
  properties: PropertiesSchema,
});

const MessageEventSchema = EventBaseSchema.extend({
  type: z.literal('message'),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  tokenUsage: TokenUsageSchema.nullable().default(null),
});

const ToolCallEventSchema = EventBaseSchema.extend({
  type: z.literal('toolCall'),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
  output: z.string().nullable().default(null),
  status: z.enum(['success', 'error', 'cancelled']),
  summary: z.string().nullable().default(null),
});

const FileOperationEventSchema = EventBaseSchema.extend({
  type: z.literal('fileOperation'),
  operation: z.enum(['read', 'create', 'edit', 'delete']),
  path: z.string(),
  diff: z.string().nullable().default(null),
  beforeHash: z.string().nullable().default(null),
  afterHash: z.string().nullable().default(null),
  linesAdded: z.number().nullable().default(null),
  linesRemoved: z.number().nullable().default(null),
});

const TerminalCommandEventSchema = EventBaseSchema.extend({
  type: z.literal('terminalCommand'),
  command: z.string(),
  cwd: z.string().nullable().default(null),
  stdout: z.string().nullable().default(null),
  stderr: z.string().nullable().default(null),
  exitCode: z.number().nullable().default(null),
});

const SearchEventSchema = EventBaseSchema.extend({
  type: z.literal('search'),
  tool: z.string(),
  query: z.string(),
  resultCount: z.number().nullable().default(null),
  topResults: z.array(z.string()).default([]),
});

const ReasoningEventSchema = EventBaseSchema.extend({
  type: z.literal('reasoning'),
  intent: z.string(),
  alternatives: z.array(z.string()).default([]),
  rationale: z.string(),
});

const ErrorEventSchema = EventBaseSchema.extend({
  type: z.literal('error'),
  message: z.string(),
  code: z.string().nullable().default(null),
  recovery: z.enum(['retry', 'skip', 'abort', 'escalate', 'fixed']).nullable().default(null),
  resolved: z.boolean(),
});

const SessionEventSchema = z.discriminatedUnion('type', [
  MessageEventSchema,
  ToolCallEventSchema,
  FileOperationEventSchema,
  TerminalCommandEventSchema,
  SearchEventSchema,
  ReasoningEventSchema,
  ErrorEventSchema,
]);

// =============================================================================
// RELATIONSHIP SCHEMAS
// =============================================================================

const CommitRefSchema = z.object({
  sha: z.string(),
  message: z.string().nullable().default(null),
  repository: z.string().nullable().default(null),
  timestamp: z.string().nullable().default(null),
});

const PullRequestRefSchema = z.object({
  number: z.number(),
  title: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  repository: z.string().nullable().default(null),
  status: z.string().nullable().default(null),
});

const IssueRefSchema = z.object({
  id: z.string(),
  title: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  tracker: z.string().nullable().default(null),
  status: z.string().nullable().default(null),
});

const ErrorRefSchema = z.object({
  id: z.string(),
  source: z.string(),
  url: z.string().nullable().default(null),
  title: z.string().nullable().default(null),
});

const DeploymentRefSchema = z.object({
  id: z.string(),
  environment: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  status: z.string().nullable().default(null),
});

const SessionRelationshipsSchema = z.object({
  commits: z.array(CommitRefSchema).default([]),
  pullRequests: z.array(PullRequestRefSchema).default([]),
  issues: z.array(IssueRefSchema).default([]),
  errors: z.array(ErrorRefSchema).default([]),
  deployments: z.array(DeploymentRefSchema).default([]),
  parentSession: z.string().nullable().default(null),
  childSessions: z.array(z.string()).default([]),
  properties: PropertiesSchema,
});

// =============================================================================
// SESSION SCHEMA
// =============================================================================

const AgentInfoSchema = z.object({
  name: z.string(),
  version: z.string().nullable().default(null),
  model: z.string().nullable().default(null),
  provider: z.string().nullable().default(null),
  properties: PropertiesSchema,
});

const ProjectContextSchema = z.object({
  name: z.string(),
  repository: z.string().nullable().default(null),
  workingDirectory: z.string().nullable().default(null),
  branch: z.string().nullable().default(null),
  commitSha: z.string().nullable().default(null),
  properties: PropertiesSchema,
});

const DeveloperInfoSchema = z.object({
  id: z.string(),
  name: z.string().nullable().default(null),
  properties: PropertiesSchema,
});

const SessionMetricsSchema = z.object({
  messageCount: z.number(),
  toolCallCount: z.number(),
  filesTouchedCount: z.number(),
  durationMinutes: z.number().nullable().default(null),
  tokenUsage: TokenUsageSchema.nullable().default(null),
  estimatedCostUsd: z.number().nullable().default(null),
  filesTouched: z.array(z.string()).default([]),
  toolsUsed: z.array(z.string()).default([]),
  properties: PropertiesSchema,
});

export const AgentLogSchema = z.object({
  specVersion: z.literal(SPEC_VERSION),
  id: z.string(),
  startTime: z.string(),
  endTime: z.string().nullable(),
  status: z.enum(['active', 'completed', 'failed', 'cancelled']),
  agent: AgentInfoSchema,
  project: ProjectContextSchema.nullable().default(null),
  developer: DeveloperInfoSchema.nullable().default(null),
  events: z.array(SessionEventSchema).default([]),
  metrics: SessionMetricsSchema.nullable().default(null),
  relationships: SessionRelationshipsSchema.nullable().default(null),
  properties: PropertiesSchema,
});

/**
 * Validate a CodingSession document.
 * Returns { success: true, data } or { success: false, error }.
 */
export function validateAgentLog(input: unknown) {
  return AgentLogSchema.safeParse(input);
}
