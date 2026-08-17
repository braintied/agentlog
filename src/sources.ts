/**
 * Source ids AgentLog understands in 0.3.0.
 *
 * These match Watchtower 5.x `coding_sessions.source` / session_key
 * (`source:<uuid>`). A missing id is not remapped to another vendor.
 *
 * @license Apache-2.0
 */

export const AGENT_SOURCES = [
  'claude_code',
  'grok',
  'codex',
  'cursor',
  'opencode',
  'gemini',
  'kulti_meet',
] as const;

export type AgentSource = (typeof AGENT_SOURCES)[number];

export interface AgentSourceInfo {
  id: AgentSource;
  name: string;
  provider: string;
}

const SOURCE_INFO: Record<AgentSource, AgentSourceInfo> = {
  claude_code: { id: 'claude_code', name: 'Claude Code', provider: 'anthropic' },
  grok: { id: 'grok', name: 'Grok', provider: 'xai' },
  codex: { id: 'codex', name: 'OpenAI Codex', provider: 'openai' },
  cursor: { id: 'cursor', name: 'Cursor', provider: 'cursor' },
  opencode: { id: 'opencode', name: 'OpenCode', provider: 'opencode' },
  gemini: { id: 'gemini', name: 'Gemini CLI', provider: 'google' },
  kulti_meet: { id: 'kulti_meet', name: 'Kulti Meet', provider: 'braintied' },
};

export function isAgentSource(value: string): value is AgentSource {
  return (AGENT_SOURCES as readonly string[]).includes(value);
}

export function sourceFromSessionKey(sessionKey: string): string {
  const colon = sessionKey.indexOf(':');
  if (colon <= 0) return sessionKey;
  return sessionKey.slice(0, colon);
}

export function describeSource(source: string): AgentSourceInfo {
  if (isAgentSource(source)) return SOURCE_INFO[source];
  return { id: source as AgentSource, name: source, provider: 'unknown' };
}
