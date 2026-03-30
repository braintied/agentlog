/**
 * Claude Code JSONL → AgentLog Converter
 *
 * Reads Claude Code session JSONL files (from ~/.claude/projects/)
 * and converts them to the AgentLog standard format.
 *
 * @license Apache-2.0
 */

import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  AgentLog,
  SessionEvent,
  MessageEvent,
  ToolCallEvent,
  FileOperationEvent,
  TerminalCommandEvent,
  SearchEvent,
} from '../schema.js';
import { SPEC_VERSION } from '../schema.js';

/** Default values for new EventBase fields (v0.2.0). */
const BASE_DEFAULTS = {
  tokenUsage: null,
  estimatedCostUsd: null,
  model: null,
  traceId: null,
  spanId: null,
  groupId: null,
} as const;

// =============================================================================
// JSONL TYPES (Claude Code internal format)
// =============================================================================

interface ClaudeToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface ClaudeTextBlock {
  type: 'text';
  text: string;
}

interface ClaudeThinkingBlock {
  type: 'thinking';
  thinking: string;
}

type ClaudeContentBlock = ClaudeToolUseBlock | ClaudeTextBlock | ClaudeThinkingBlock;

interface ClaudeJsonlEntry {
  type: 'user' | 'assistant';
  message: {
    role?: string;
    model?: string;
    content: string | ClaudeContentBlock[];
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
  };
  timestamp: string;
  cwd?: string;
  sessionId?: string;
}

// =============================================================================
// CONVERTER OPTIONS
// =============================================================================

export interface ConvertOptions {
  /** Project name (defaults to directory basename). */
  projectName?: string;

  /** Repository identifier (e.g., "owner/repo"). */
  repository?: string;

  /** Developer identifier. */
  developerId?: string;

  /** Developer display name. */
  developerName?: string;

  /** Maximum content length per event (default: 500 chars). */
  maxContentLength?: number;

  /** Maximum stdout/stderr length (default: 200 chars). */
  maxOutputLength?: number;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Convert a Claude Code session directory to a AgentLog document.
 *
 * @param sessionDir - Path to the session directory (contains subagents/*.jsonl)
 * @param options - Conversion options
 */
export async function convertClaudeCodeSession(
  sessionDir: string,
  options?: ConvertOptions,
): Promise<AgentLog> {
  const maxContent = options?.maxContentLength !== undefined ? options.maxContentLength : 500;
  const maxOutput = options?.maxOutputLength !== undefined ? options.maxOutputLength : 200;

  // Read all JSONL files
  const entries = await readJsonlFiles(sessionDir);

  if (entries.length === 0) {
    throw new Error(`No JSONL data found in ${sessionDir}`);
  }

  // Sort by timestamp
  entries.sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    return ta - tb;
  });

  // Extract session metadata
  const firstEntry = entries[0];
  const lastEntry = entries[entries.length - 1];
  const startTime = firstEntry.timestamp;
  const endTime = lastEntry.timestamp;
  const model = extractModel(entries);
  const cwd = firstEntry.cwd !== undefined ? firstEntry.cwd : null;

  // Convert entries to events
  const events: SessionEvent[] = [];
  const filesTouched = new Set<string>();
  const toolsUsed = new Set<string>();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let eventIndex = 0;

  for (const entry of entries) {
    if (entry.type === 'user') {
      const content = typeof entry.message.content === 'string'
        ? entry.message.content
        : '';

      const msgEvent: MessageEvent = {
        type: 'message',
        id: `evt-${eventIndex++}`,
        timestamp: entry.timestamp,
        parentId: null,
        durationMs: null,
        ...BASE_DEFAULTS,
        role: 'user',
        content,
        properties: {},
      };
      events.push(msgEvent);
    }

    if (entry.type === 'assistant') {
      const contentBlocks = Array.isArray(entry.message.content)
        ? entry.message.content
        : [];

      // Extract text content
      const textParts: string[] = [];
      for (const block of contentBlocks) {
        if (block.type === 'text') {
          textParts.push(block.text);
        }
      }

      if (textParts.length > 0) {
        const usage = entry.message.usage;
        const inputTokens = usage?.input_tokens !== undefined ? usage.input_tokens : 0;
        const outputTokens = usage?.output_tokens !== undefined ? usage.output_tokens : 0;
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;

        const msgEvent: MessageEvent = {
          type: 'message',
          id: `evt-${eventIndex++}`,
          timestamp: entry.timestamp,
          parentId: null,
          durationMs: null,
          ...BASE_DEFAULTS,
          tokenUsage: {
            inputTokens,
            outputTokens,
            cacheReadTokens: usage?.cache_read_input_tokens !== undefined ? usage.cache_read_input_tokens : null,
            cacheWriteTokens: usage?.cache_creation_input_tokens !== undefined ? usage.cache_creation_input_tokens : null,
            reasoningTokens: null,
          },
          model: entry.message.model !== undefined ? entry.message.model : null,
          role: 'assistant',
          content: textParts.join('\n'),
          properties: {},
        };
        events.push(msgEvent);
      }

      // Extract tool calls
      const parentEventId = `evt-${eventIndex - 1}`;
      for (const block of contentBlocks) {
        if (block.type !== 'tool_use') continue;

        const toolBlock = block as ClaudeToolUseBlock;
        toolsUsed.add(toolBlock.name);

        // Convert to appropriate event type based on tool name
        const toolEvent = convertToolCall(
          toolBlock,
          entry.timestamp,
          `evt-${eventIndex++}`,
          parentEventId,
          filesTouched,
          maxContent,
          maxOutput,
        );
        if (toolEvent !== null) {
          events.push(toolEvent);
        }
      }
    }
  }

  // Calculate duration
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const durationMinutes = Math.round((endMs - startMs) / 60000);

  // Build project name from cwd
  const projectName = options?.projectName !== undefined
    ? options.projectName
    : (cwd !== null ? cwd.split('/').pop() : 'unknown');

  const session: AgentLog = {
    specVersion: SPEC_VERSION,
    id: randomUUID(),
    startTime,
    endTime,
    status: 'completed',
    agent: {
      name: 'Claude Code',
      version: null,
      model,
      provider: 'anthropic',
      properties: {},
    },
    project: {
      name: projectName !== undefined ? projectName : 'unknown',
      repository: options?.repository !== undefined ? options.repository : null,
      workingDirectory: cwd,
      branch: null,
      commitSha: null,
      properties: {},
    },
    developer: options?.developerId !== undefined ? {
      id: options.developerId,
      name: options?.developerName !== undefined ? options.developerName : null,
      properties: {},
    } : null,
    events,
    metrics: {
      messageCount: events.filter((e) => e.type === 'message').length,
      toolCallCount: events.filter((e) => e.type !== 'message').length,
      filesTouchedCount: filesTouched.size,
      durationMinutes,
      tokenUsage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cacheReadTokens: null,
        cacheWriteTokens: null,
        reasoningTokens: null,
      },
      estimatedCostUsd: null,
      filesTouched: Array.from(filesTouched),
      toolsUsed: Array.from(toolsUsed),
      modelsUsed: model !== null ? [model] : [],
      properties: {},
    },
    relationships: null,
    classification: null,
    redactions: null,
    profile: null,
    team: null,
    properties: {
      converter: 'claude-code',
      converterVersion: SPEC_VERSION,
      sourceDir: sessionDir,
    },
  };

  return session;
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

async function readJsonlFiles(sessionDir: string): Promise<ClaudeJsonlEntry[]> {
  const entries: ClaudeJsonlEntry[] = [];

  // Read from subagents/
  const subagentsDir = join(sessionDir, 'subagents');
  try {
    const files = await readdir(subagentsDir);
    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;
      const content = await readFile(join(subagentsDir, file), 'utf-8');
      const cleaned = content.replace(/^\uFEFF/, '');
      for (const line of cleaned.split('\n')) {
        if (line.trim().length === 0) continue;
        try {
          entries.push(JSON.parse(line) as ClaudeJsonlEntry);
        } catch {
          // Skip unparseable lines
        }
      }
    }
  } catch {
    // No subagents dir
  }

  // Also read top-level JSONL
  try {
    const files = await readdir(sessionDir);
    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;
      const content = await readFile(join(sessionDir, file), 'utf-8');
      const cleaned = content.replace(/^\uFEFF/, '');
      for (const line of cleaned.split('\n')) {
        if (line.trim().length === 0) continue;
        try {
          entries.push(JSON.parse(line) as ClaudeJsonlEntry);
        } catch {
          // Skip
        }
      }
    }
  } catch {
    // Skip
  }

  return entries;
}

function extractModel(entries: ClaudeJsonlEntry[]): string | null {
  for (const entry of entries) {
    if (entry.type === 'assistant' && entry.message.model !== undefined) {
      return entry.message.model;
    }
  }
  return null;
}

function convertToolCall(
  block: ClaudeToolUseBlock,
  timestamp: string,
  eventId: string,
  parentId: string,
  filesTouched: Set<string>,
  maxContent: number,
  maxOutput: number,
): SessionEvent | null {
  const input = block.input;
  const name = block.name;

  // File operations
  if (name === 'Edit' || name === 'Write' || name === 'Read') {
    const filePath = typeof input.file_path === 'string' ? input.file_path : null;
    if (filePath !== null) filesTouched.add(filePath);

    const operation = name === 'Edit' ? 'edit' : (name === 'Write' ? 'create' : 'read');
    let diff: string | null = null;

    if (name === 'Edit') {
      const oldStr = typeof input.old_string === 'string' ? input.old_string.slice(0, maxContent) : '';
      const newStr = typeof input.new_string === 'string' ? input.new_string.slice(0, maxContent) : '';
      diff = `--- old\n+++ new\n-${oldStr}\n+${newStr}`;
    }

    const fileEvent: FileOperationEvent = {
      type: 'fileOperation',
      id: eventId,
      timestamp,
      parentId,
      durationMs: null,
      ...BASE_DEFAULTS,
      operation,
      path: filePath !== null ? filePath : 'unknown',
      diff,
      diffFormat: diff !== null ? 'unified' : null,
      beforeHash: null,
      afterHash: null,
      linesAdded: null,
      linesRemoved: null,
      truncated: null,
      properties: {},
    };
    return fileEvent;
  }

  // Terminal commands
  if (name === 'Bash') {
    const command = typeof input.command === 'string' ? input.command.slice(0, maxContent) : '';
    const termEvent: TerminalCommandEvent = {
      type: 'terminalCommand',
      id: eventId,
      timestamp,
      parentId,
      durationMs: null,
      ...BASE_DEFAULTS,
      command,
      cwd: typeof input.cwd === 'string' ? input.cwd : null,
      stdout: null,
      stderr: null,
      exitCode: null,
      shell: null,
      truncated: null,
      properties: {},
    };
    return termEvent;
  }

  // Search operations
  if (name === 'Grep' || name === 'Glob' || name === 'WebSearch') {
    const query = name === 'Grep'
      ? (typeof input.pattern === 'string' ? input.pattern : '')
      : name === 'Glob'
        ? (typeof input.pattern === 'string' ? input.pattern : '')
        : (typeof input.query === 'string' ? input.query : '');

    const searchEvent: SearchEvent = {
      type: 'search',
      id: eventId,
      timestamp,
      parentId,
      durationMs: null,
      ...BASE_DEFAULTS,
      tool: name,
      query,
      resultCount: null,
      topResults: [],
      properties: {},
    };
    return searchEvent;
  }

  // Generic tool call for everything else (Agent, WebFetch, etc.)
  const truncatedInput: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === 'string') {
      truncatedInput[k] = v.slice(0, maxContent);
    } else {
      truncatedInput[k] = v;
    }
  }

  const toolEvent: ToolCallEvent = {
    type: 'toolCall',
    id: eventId,
    timestamp,
    parentId,
    durationMs: null,
    ...BASE_DEFAULTS,
    name,
    input: truncatedInput,
    output: null,
    status: 'success',
    summary: null,
    properties: {},
  };
  return toolEvent;
}
