/**
 * @braintied/agentlog
 *
 * AgentLog — Open standard for AI agent session interchange.
 * https://github.com/braintied/agentlog
 *
 * @license Apache-2.0
 */

// Core types
export type {
  AgentLog,
  SessionStatus,
  Classification,
  AgentInfo,
  TeamInfo,
  AgentRef,
  ProjectContext,
  DeveloperInfo,
  RedactionCategory,
  RedactionRecord,

  // Events
  SessionEvent,
  EventBase,
  MessageEvent,
  ToolCallEvent,
  FileOperationEvent,
  TerminalCommandEvent,
  SearchEvent,
  ReasoningEvent,
  ReasoningType,
  ErrorEvent,
  ErrorCategory,
  ErrorRecovery,
  HandoffEvent,
  ApprovalEvent,
  PlanEvent,
  PlanStep,
  CheckpointEvent,
  ContextLoadEvent,

  // Metrics
  SessionMetrics,
  TokenUsage,

  // Relationships
  SessionRelationships,
  CommitRef,
  PullRequestRef,
  IssueRef,
  ErrorRef,
  DeploymentRef,
  ReviewRef,
  TestRunRef,
  BranchRef,
} from './schema.js';

// Constants
export { SPEC_VERSION } from './schema.js';

// Validation — individual schemas exported for Zod v4 compatibility
export {
  AgentLogSchema,
  validateAgentLog,
  // Individual event schemas (Zod v4 prep — use these for custom unions)
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
  SessionEventSchema,
  EventBaseSchema,
  TokenUsageSchema,
} from './validate.js';
