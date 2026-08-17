/**
 * Watchtower SessionPayload → AgentLog
 *
 * This is the live interchange. Watchtower 5.x hooks and disk adapters
 * already emit this shape. AgentLog does not re-implement capture.
 *
 * @license Apache-2.0
 */

import type { AgentLog, MessageEvent, SessionEvent, SessionMetrics } from '../schema.js';
import { SPEC_VERSION } from '../schema.js';
import { describeSource, sourceFromSessionKey } from '../sources.js';

const BASE_DEFAULTS = {
  tokenUsage: null,
  estimatedCostUsd: null,
  model: null,
  traceId: null,
  spanId: null,
  groupId: null,
} as const;

export interface CapturedMessage {
  role: string;
  content: string;
  timestamp: string;
}

/**
 * Wire Watchtower posts to `/webhooks/session` (5.0+).
 */
export interface SessionPayload {
  session_key: string;
  source: string;
  project_slug?: string;
  messages: CapturedMessage[];
  tools_used?: string[];
  message_count: number;
  session_started_at?: string;
  session_ended_at?: string;
  metadata?: Record<string, unknown>;
}

export interface PayloadConvertOptions {
  projectName?: string;
  repository?: string;
  workingDirectory?: string;
  developerId?: string;
  developerName?: string;
}

export function exportFromPayload(
  payload: SessionPayload,
  options: PayloadConvertOptions = {},
): AgentLog {
  const source = payload.source !== '' ? payload.source : sourceFromSessionKey(payload.session_key);
  const info = describeSource(source);
  const events: SessionEvent[] = payload.messages.map((message, index) => messageEvent(message, index));
  const startTime = payload.session_started_at !== undefined
    ? payload.session_started_at
    : firstTimestamp(payload.messages);
  const endTime = payload.session_ended_at !== undefined ? payload.session_ended_at : null;
  const toolsUsed = payload.tools_used !== undefined ? payload.tools_used : [];

  const metrics: SessionMetrics = {
    messageCount: payload.message_count,
    toolCallCount: toolsUsed.length,
    filesTouchedCount: 0,
    durationMinutes: null,
    tokenUsage: null,
    estimatedCostUsd: null,
    filesTouched: [],
    toolsUsed,
    modelsUsed: [],
    properties: {},
  };

  const projectName = options.projectName !== undefined
    ? options.projectName
    : payload.project_slug;

  return {
    specVersion: SPEC_VERSION,
    id: idFromSessionKey(payload.session_key),
    startTime,
    endTime,
    status: endTime !== null ? 'completed' : 'active',
    agent: {
      name: info.name,
      version: null,
      model: null,
      provider: info.provider,
      properties: { source },
    },
    project: projectName !== undefined
      ? {
          name: projectName,
          repository: options.repository !== undefined ? options.repository : null,
          workingDirectory: options.workingDirectory !== undefined ? options.workingDirectory : null,
          branch: null,
          commitSha: null,
          properties: {},
        }
      : null,
    developer: options.developerId !== undefined
      ? {
          id: options.developerId,
          name: options.developerName !== undefined ? options.developerName : null,
          properties: {},
        }
      : null,
    team: null,
    events,
    metrics,
    relationships: null,
    classification: null,
    redactions: null,
    profile: null,
    properties: {
      sessionKey: payload.session_key,
      source,
      converter: 'payload',
      converterVersion: '0.3.0',
      ...(payload.metadata !== undefined ? { payloadMetadata: payload.metadata } : {}),
    },
  };
}

function messageEvent(message: CapturedMessage, index: number): MessageEvent {
  const role = message.role === 'assistant' || message.role === 'system' ? message.role : 'user';
  return {
    type: 'message',
    id: `evt-${index}`,
    timestamp: message.timestamp,
    parentId: null,
    durationMs: null,
    ...BASE_DEFAULTS,
    role,
    content: message.content,
    properties: {},
  };
}

function firstTimestamp(messages: CapturedMessage[]): string {
  if (messages.length > 0) return messages[0].timestamp;
  return new Date(0).toISOString();
}

function idFromSessionKey(sessionKey: string): string {
  const colon = sessionKey.indexOf(':');
  if (colon >= 0 && colon < sessionKey.length - 1) return sessionKey.slice(colon + 1);
  return sessionKey;
}
