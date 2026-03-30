/**
 * @agentlog/schema
 *
 * AgentLog — Open standard for AI agent session interchange.
 * https://github.com/braintied/agentlog
 *
 * @license Apache-2.0
 */

// Types
export type {
  AgentLog,
  SessionStatus,
  AgentInfo,
  ProjectContext,
  DeveloperInfo,
  SessionEvent,
  MessageEvent,
  ToolCallEvent,
  FileOperationEvent,
  TerminalCommandEvent,
  SearchEvent,
  ReasoningEvent,
  ErrorEvent,
  SessionMetrics,
  TokenUsage,
  SessionRelationships,
  CommitRef,
  PullRequestRef,
  IssueRef,
  ErrorRef,
  DeploymentRef,
} from './schema.js';

// Constants
export { SPEC_VERSION } from './schema.js';

// Validation
export { AgentLogSchema, validateAgentLog } from './validate.js';
