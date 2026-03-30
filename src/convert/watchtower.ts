/**
 * Watchtower → AgentLog Exporter
 *
 * Converts watchtower.coding_sessions rows to the AgentLog standard format.
 * Used to export Watchtower session intelligence data in a portable format.
 *
 * @license Apache-2.0
 */

import type {
  AgentLog,
  SessionEvent,
  MessageEvent,
  SessionRelationships,
  CommitRef,
} from '../schema.js';
import { SPEC_VERSION } from '../schema.js';

// =============================================================================
// WATCHTOWER ROW TYPES
// =============================================================================

export interface WatchtowerSessionRow {
  id: string;
  session_key: string;
  source: string;
  title: string | null;
  ai_summary: string | null;
  category: string | null;
  files_touched: string[] | null;
  tools_used: string[] | null;
  decisions: Array<{ decision: string; reasoning: string; context: string }> | null;
  duration_minutes: number | null;
  message_count: number;
  metadata: Record<string, unknown> | null;
  session_started_at: string | null;
  session_ended_at: string | null;
  analyzed_at: string | null;
}

export interface WatchtowerCommitRow {
  sha: string;
  message: string | null;
  author: string | null;
  committed_at: string | null;
}

export interface ExportOptions {
  /** Project name. */
  projectName?: string;

  /** Repository identifier. */
  repository?: string;

  /** Related commits from watchtower.commits. */
  relatedCommits?: WatchtowerCommitRow[];

  /** Developer identifier. */
  developerId?: string;

  /** Developer display name. */
  developerName?: string;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Convert a Watchtower coding_sessions row to a AgentLog document.
 */
export function exportWatchtowerSession(
  row: WatchtowerSessionRow,
  options?: ExportOptions,
): AgentLog {
  const events: SessionEvent[] = [];
  let eventIndex = 0;

  // Reconstruct events from raw_content in metadata
  const metadata = row.metadata;
  if (metadata !== null && metadata !== undefined) {
    const rawContent = typeof metadata.raw_content === 'string' ? metadata.raw_content : null;

    if (rawContent !== null) {
      // Parse raw_content lines back into message events
      const lines = rawContent.split('\n');
      let currentRole: 'user' | 'assistant' | null = null;
      let currentContent: string[] = [];

      for (const line of lines) {
        if (line.startsWith('[user] ')) {
          // Flush previous
          if (currentRole !== null && currentContent.length > 0) {
            events.push(buildMessageEvent(currentRole, currentContent.join('\n'), row.session_started_at, eventIndex++));
          }
          currentRole = 'user';
          currentContent = [line.slice(7)];
        } else if (line.startsWith('[assistant] ')) {
          if (currentRole !== null && currentContent.length > 0) {
            events.push(buildMessageEvent(currentRole, currentContent.join('\n'), row.session_started_at, eventIndex++));
          }
          currentRole = 'assistant';
          currentContent = [line.slice(12)];
        } else if (line.startsWith('  > ')) {
          // Tool call summary — keep as part of current message
          currentContent.push(line);
        } else {
          currentContent.push(line);
        }
      }

      // Flush last
      if (currentRole !== null && currentContent.length > 0) {
        events.push(buildMessageEvent(currentRole, currentContent.join('\n'), row.session_started_at, eventIndex++));
      }
    }
  }

  // Build relationships from related commits
  let relationships: SessionRelationships | null = null;
  const relatedCommits = options?.relatedCommits;
  if (relatedCommits !== undefined && relatedCommits.length > 0) {
    const commits: CommitRef[] = relatedCommits.map((c) => ({
      sha: c.sha,
      message: c.message,
      repository: options?.repository !== undefined ? options.repository : null,
      timestamp: c.committed_at,
    }));

    relationships = {
      commits,
      pullRequests: [],
      issues: [],
      errors: [],
      deployments: [],
      parentSession: null,
      childSessions: [],
      properties: {},
    };
  }

  // Map watchtower source to agent name
  const agentName = mapSourceToAgentName(row.source);

  const filesTouched = row.files_touched !== null ? row.files_touched : [];
  const toolsUsed = row.tools_used !== null ? row.tools_used : [];

  const session: AgentLog = {
    specVersion: SPEC_VERSION,
    id: row.id,
    startTime: row.session_started_at !== null ? row.session_started_at : new Date().toISOString(),
    endTime: row.session_ended_at,
    status: 'completed',
    agent: {
      name: agentName,
      version: null,
      model: null,
      provider: mapSourceToProvider(row.source),
      properties: {},
    },
    project: options?.projectName !== undefined ? {
      name: options.projectName,
      repository: options?.repository !== undefined ? options.repository : null,
      workingDirectory: null,
      branch: null,
      commitSha: null,
      properties: {},
    } : null,
    developer: options?.developerId !== undefined ? {
      id: options.developerId,
      name: options?.developerName !== undefined ? options.developerName : null,
      properties: {},
    } : null,
    events,
    metrics: {
      messageCount: row.message_count,
      toolCallCount: toolsUsed.length,
      filesTouchedCount: filesTouched.length,
      durationMinutes: row.duration_minutes,
      tokenUsage: null,
      estimatedCostUsd: null,
      filesTouched,
      toolsUsed,
      properties: {},
    },
    relationships,
    properties: {
      watchtowerSessionKey: row.session_key,
      watchtowerCategory: row.category,
      watchtowerTitle: row.title,
      watchtowerSummary: row.ai_summary,
      watchtowerDecisions: row.decisions,
      converter: 'watchtower',
      converterVersion: SPEC_VERSION,
    },
  };

  return session;
}

// =============================================================================
// HELPERS
// =============================================================================

function buildMessageEvent(
  role: 'user' | 'assistant',
  content: string,
  sessionStartTime: string | null,
  index: number,
): MessageEvent {
  return {
    type: 'message',
    id: `evt-${index}`,
    timestamp: sessionStartTime !== null ? sessionStartTime : new Date().toISOString(),
    parentId: null,
    durationMs: null,
    role,
    content,
    tokenUsage: null,
    properties: {},
  };
}

function mapSourceToAgentName(source: string): string {
  switch (source) {
    case 'claude_code': return 'Claude Code';
    case 'cursor': return 'Cursor';
    case 'codex': return 'OpenAI Codex';
    case 'gemini': return 'Gemini';
    default: return source;
  }
}

function mapSourceToProvider(source: string): string {
  switch (source) {
    case 'claude_code': return 'anthropic';
    case 'cursor': return 'cursor';
    case 'codex': return 'openai';
    case 'gemini': return 'google';
    default: return 'unknown';
  }
}
