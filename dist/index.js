import {
  SPEC_VERSION
} from "./chunk-7Z5MJWOM.js";

// src/validate.ts
import { z } from "zod";
var TokenUsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
  cacheReadTokens: z.number().nullable(),
  cacheWriteTokens: z.number().nullable()
});
var PropertiesSchema = z.record(z.string(), z.unknown()).default({});
var EventBaseSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  parentId: z.string().nullable().default(null),
  durationMs: z.number().nullable().default(null),
  properties: PropertiesSchema
});
var MessageEventSchema = EventBaseSchema.extend({
  type: z.literal("message"),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  tokenUsage: TokenUsageSchema.nullable().default(null)
});
var ToolCallEventSchema = EventBaseSchema.extend({
  type: z.literal("toolCall"),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
  output: z.string().nullable().default(null),
  status: z.enum(["success", "error", "cancelled"]),
  summary: z.string().nullable().default(null)
});
var FileOperationEventSchema = EventBaseSchema.extend({
  type: z.literal("fileOperation"),
  operation: z.enum(["read", "create", "edit", "delete"]),
  path: z.string(),
  diff: z.string().nullable().default(null),
  beforeHash: z.string().nullable().default(null),
  afterHash: z.string().nullable().default(null),
  linesAdded: z.number().nullable().default(null),
  linesRemoved: z.number().nullable().default(null)
});
var TerminalCommandEventSchema = EventBaseSchema.extend({
  type: z.literal("terminalCommand"),
  command: z.string(),
  cwd: z.string().nullable().default(null),
  stdout: z.string().nullable().default(null),
  stderr: z.string().nullable().default(null),
  exitCode: z.number().nullable().default(null)
});
var SearchEventSchema = EventBaseSchema.extend({
  type: z.literal("search"),
  tool: z.string(),
  query: z.string(),
  resultCount: z.number().nullable().default(null),
  topResults: z.array(z.string()).default([])
});
var ReasoningEventSchema = EventBaseSchema.extend({
  type: z.literal("reasoning"),
  intent: z.string(),
  alternatives: z.array(z.string()).default([]),
  rationale: z.string()
});
var ErrorEventSchema = EventBaseSchema.extend({
  type: z.literal("error"),
  message: z.string(),
  code: z.string().nullable().default(null),
  recovery: z.enum(["retry", "skip", "abort", "escalate", "fixed"]).nullable().default(null),
  resolved: z.boolean()
});
var SessionEventSchema = z.discriminatedUnion("type", [
  MessageEventSchema,
  ToolCallEventSchema,
  FileOperationEventSchema,
  TerminalCommandEventSchema,
  SearchEventSchema,
  ReasoningEventSchema,
  ErrorEventSchema
]);
var CommitRefSchema = z.object({
  sha: z.string(),
  message: z.string().nullable().default(null),
  repository: z.string().nullable().default(null),
  timestamp: z.string().nullable().default(null)
});
var PullRequestRefSchema = z.object({
  number: z.number(),
  title: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  repository: z.string().nullable().default(null),
  status: z.string().nullable().default(null)
});
var IssueRefSchema = z.object({
  id: z.string(),
  title: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  tracker: z.string().nullable().default(null),
  status: z.string().nullable().default(null)
});
var ErrorRefSchema = z.object({
  id: z.string(),
  source: z.string(),
  url: z.string().nullable().default(null),
  title: z.string().nullable().default(null)
});
var DeploymentRefSchema = z.object({
  id: z.string(),
  environment: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  status: z.string().nullable().default(null)
});
var SessionRelationshipsSchema = z.object({
  commits: z.array(CommitRefSchema).default([]),
  pullRequests: z.array(PullRequestRefSchema).default([]),
  issues: z.array(IssueRefSchema).default([]),
  errors: z.array(ErrorRefSchema).default([]),
  deployments: z.array(DeploymentRefSchema).default([]),
  parentSession: z.string().nullable().default(null),
  childSessions: z.array(z.string()).default([]),
  properties: PropertiesSchema
});
var AgentInfoSchema = z.object({
  name: z.string(),
  version: z.string().nullable().default(null),
  model: z.string().nullable().default(null),
  provider: z.string().nullable().default(null),
  properties: PropertiesSchema
});
var ProjectContextSchema = z.object({
  name: z.string(),
  repository: z.string().nullable().default(null),
  workingDirectory: z.string().nullable().default(null),
  branch: z.string().nullable().default(null),
  commitSha: z.string().nullable().default(null),
  properties: PropertiesSchema
});
var DeveloperInfoSchema = z.object({
  id: z.string(),
  name: z.string().nullable().default(null),
  properties: PropertiesSchema
});
var SessionMetricsSchema = z.object({
  messageCount: z.number(),
  toolCallCount: z.number(),
  filesTouchedCount: z.number(),
  durationMinutes: z.number().nullable().default(null),
  tokenUsage: TokenUsageSchema.nullable().default(null),
  estimatedCostUsd: z.number().nullable().default(null),
  filesTouched: z.array(z.string()).default([]),
  toolsUsed: z.array(z.string()).default([]),
  properties: PropertiesSchema
});
var AgentLogSchema = z.object({
  specVersion: z.literal(SPEC_VERSION),
  id: z.string(),
  startTime: z.string(),
  endTime: z.string().nullable(),
  status: z.enum(["active", "completed", "failed", "cancelled"]),
  agent: AgentInfoSchema,
  project: ProjectContextSchema.nullable().default(null),
  developer: DeveloperInfoSchema.nullable().default(null),
  events: z.array(SessionEventSchema).default([]),
  metrics: SessionMetricsSchema.nullable().default(null),
  relationships: SessionRelationshipsSchema.nullable().default(null),
  properties: PropertiesSchema
});
function validateAgentLog(input) {
  return AgentLogSchema.safeParse(input);
}
export {
  AgentLogSchema,
  SPEC_VERSION,
  validateAgentLog
};
/**
 * @braintied/agentlog
 *
 * AgentLog — Open standard for AI agent session interchange.
 * https://github.com/braintied/agentlog
 *
 * @license Apache-2.0
 */
