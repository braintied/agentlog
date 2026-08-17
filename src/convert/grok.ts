/**
 * Grok `chat_history.jsonl` → AgentLog.
 *
 * Path: ~/.grok/sessions/<cwdEnc>/<sessionId>/chat_history.jsonl
 * Capture still belongs to Watchtower. This converter is for a file
 * you already have.
 *
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { basename, dirname } from 'node:path';
import type { AgentLog } from '../schema.js';
import { exportFromPayload, type CapturedMessage, type PayloadConvertOptions } from './payload.js';

export interface GrokConvertOptions extends PayloadConvertOptions {
  sessionId?: string;
}

export async function convertGrokHistory(
  historyPath: string,
  options: GrokConvertOptions = {},
): Promise<AgentLog> {
  const text = await readFile(historyPath, 'utf8');
  const messages: CapturedMessage[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    let entry: Record<string, unknown>;
    try {
      entry = JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      continue;
    }
    const kind = typeof entry.type === 'string' ? entry.type : '';
    if (kind === 'system' || kind === 'reasoning' || kind === 'tool_result') continue;
    let role = '';
    let content = '';
    if (kind === 'user') {
      const raw = extractText(entry.content).trim();
      if (raw.includes('<user_info>') && !raw.includes('<user_query>')) continue;
      if (raw.startsWith('<system-reminder>') && !raw.includes('<user_query>')) continue;
      const query = raw.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/);
      content = query !== null && query[1].trim() !== '' ? query[1].trim() : raw;
      role = 'user';
    } else if (kind === 'assistant') {
      role = 'assistant';
      content = extractText(entry.content).trim();
    } else {
      continue;
    }
    if (content === '') continue;
    const timestamp = typeof entry.timestamp === 'string'
      ? entry.timestamp
      : new Date(0).toISOString();
    messages.push({ role, content, timestamp });
  }

  const sessionDir = dirname(historyPath);
  const sessionId = options.sessionId !== undefined ? options.sessionId : basename(sessionDir);
  return exportFromPayload({
    session_key: `grok:${sessionId}`,
    source: 'grok',
    messages,
    message_count: messages.length,
    session_started_at: messages.length > 0 ? messages[0].timestamp : undefined,
    session_ended_at: messages.length > 0 ? messages[messages.length - 1].timestamp : undefined,
  }, options);
}

function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part !== null && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string') {
        return (part as { text: string }).text;
      }
      return '';
    })
    .filter((part) => part !== '')
    .join('\n');
}
