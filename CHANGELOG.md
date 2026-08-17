# Changelog

## 0.3.0 — 2026-08-17

Five months after 0.2.1 (2026-03-30). Spec stays **0.2.0**. The package
caught up to Watchtower 5.x.

- `AGENT_SOURCES`: `claude_code`, `grok`, `codex`, `cursor`,
  `opencode`, `gemini`, `kulti_meet`
- `convert/payload`: Watchtower `SessionPayload` (the live webhook)
- `convert/watchtower`: prefers `session_messages` over
  `metadata.raw_content`; maps grok / opencode / kulti_meet
- `convert/grok`: `chat_history.jsonl`
- Tests: `npm test`
- AGENTS.md for implementers

Did not publish to npm from this change. Did not merge Ora
`ActorContext` into this Apache tree.

## 0.2.1 — 2026-03-30

JSON Schema, spec, and examples aligned to 0.2.0.

## 0.2.0 — 2026-03-30

Twelve event types, OTel fields, multi-agent team object.

## 0.1.1 — 2026-03-30

JSON Schema and debugging example.

## 0.1.0 — 2026-03-30

First public release.
