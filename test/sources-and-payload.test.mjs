import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  AGENT_SOURCES,
  describeSource,
  isAgentSource,
  sourceFromSessionKey,
  validateAgentLog,
} from '../dist/index.js';
import { exportFromPayload } from '../dist/convert/payload.js';
import { exportWatchtowerSession } from '../dist/convert/watchtower.js';
import { convertGrokHistory } from '../dist/convert/grok.js';

test('Watchtower 5.x sources are named, not guessed', () => {
  for (const id of ['claude_code', 'grok', 'codex', 'cursor', 'opencode', 'gemini', 'kulti_meet']) {
    assert.equal(isAgentSource(id), true, id);
  }
  assert.equal(AGENT_SOURCES.includes('grok'), true);
  assert.equal(describeSource('grok').name, 'Grok');
  assert.equal(describeSource('kulti_meet').provider, 'braintied');
  assert.equal(sourceFromSessionKey('grok:abc'), 'grok');
  assert.equal(isAgentSource('chatgpt'), false);
});

test('exportFromPayload produces a valid AgentLog from a Watchtower wire payload', () => {
  const doc = exportFromPayload({
    session_key: 'grok:sess-1',
    source: 'grok',
    project_slug: 'stack',
    message_count: 2,
    tools_used: ['read_file'],
    session_started_at: '2026-08-17T17:00:00Z',
    session_ended_at: '2026-08-17T17:10:00Z',
    messages: [
      { role: 'user', content: 'upgrade agentlog', timestamp: '2026-08-17T17:00:00Z' },
      { role: 'assistant', content: 'on it', timestamp: '2026-08-17T17:01:00Z' },
    ],
  });
  const result = validateAgentLog(doc);
  assert.equal(result.success, true, result.success === false ? String(result.error) : '');
  assert.equal(doc.specVersion, '0.2.0');
  assert.equal(doc.id, 'sess-1');
  assert.equal(doc.agent.name, 'Grok');
  assert.equal(doc.agent.properties.source, 'grok');
  assert.equal(doc.events.length, 2);
  assert.equal(doc.properties.sessionKey, 'grok:sess-1');
});

test('watchtower exporter prefers session_messages over raw_content', () => {
  const doc = exportWatchtowerSession({
    id: 'row-1',
    session_key: 'claude:old',
    source: 'claude_code',
    title: 't',
    ai_summary: null,
    category: null,
    files_touched: [],
    tools_used: ['Bash'],
    decisions: null,
    duration_minutes: 4,
    message_count: 1,
    metadata: { raw_content: '[user] stale transcript' },
    session_started_at: '2026-08-17T17:00:00Z',
    session_ended_at: '2026-08-17T17:04:00Z',
    analyzed_at: null,
  }, {
    messages: [
      { role: 'user', content: 'live row', created_at: '2026-08-17T17:00:10Z' },
    ],
  });
  assert.equal(doc.events.length, 1);
  assert.equal(doc.events[0].type, 'message');
  if (doc.events[0].type === 'message') {
    assert.equal(doc.events[0].content, 'live row');
    assert.notEqual(doc.events[0].content, 'stale transcript');
  }
  assert.equal(doc.agent.name, 'Claude Code');
  assert.equal(validateAgentLog(doc).success, true);
});

test('watchtower maps grok and kulti_meet', () => {
  const grok = exportWatchtowerSession({
    id: 'g',
    session_key: 'grok:1',
    source: 'grok',
    title: null,
    ai_summary: null,
    category: null,
    files_touched: null,
    tools_used: null,
    decisions: null,
    duration_minutes: null,
    message_count: 0,
    metadata: null,
    session_started_at: '2026-08-17T17:00:00Z',
    session_ended_at: null,
    analyzed_at: null,
  });
  assert.equal(grok.agent.name, 'Grok');
  assert.equal(grok.agent.provider, 'xai');

  const kulti = exportWatchtowerSession({
    id: 'k',
    session_key: 'kulti_meet:room',
    source: 'kulti_meet',
    title: null,
    ai_summary: null,
    category: null,
    files_touched: null,
    tools_used: null,
    decisions: null,
    duration_minutes: null,
    message_count: 0,
    metadata: null,
    session_started_at: '2026-08-17T17:00:00Z',
    session_ended_at: null,
    analyzed_at: null,
  });
  assert.equal(kulti.agent.name, 'Kulti Meet');
});

test('convertGrokHistory reads user_query and skips system reminders', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'agentlog-grok-'));
  const path = join(dir, 'chat_history.jsonl');
  writeFileSync(path, [
    JSON.stringify({ type: 'user', timestamp: '2026-08-17T17:00:00Z', content: '<user_info>x</user_info>' }),
    JSON.stringify({ type: 'user', timestamp: '2026-08-17T17:00:01Z', content: '<user_query>fix the hook</user_query>' }),
    JSON.stringify({ type: 'assistant', timestamp: '2026-08-17T17:00:02Z', content: 'fixed' }),
    JSON.stringify({ type: 'reasoning', timestamp: '2026-08-17T17:00:02Z', content: 'noise' }),
  ].join('\n'));
  const doc = await convertGrokHistory(path, { sessionId: 'abc' });
  assert.equal(doc.agent.name, 'Grok');
  assert.equal(doc.id, 'abc');
  assert.equal(doc.events.length, 2);
  if (doc.events[0].type === 'message') {
    assert.equal(doc.events[0].content, 'fix the hook');
  }
  assert.equal(validateAgentLog(doc).success, true);
});
