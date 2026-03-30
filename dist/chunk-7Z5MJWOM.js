// src/schema.ts
var SPEC_VERSION = "0.1.0";

export {
  SPEC_VERSION
};
/**
 * AgentLog — Core Type Definitions
 *
 * Open standard for AI agent session interchange.
 * Spec version: 0.1.0
 *
 * Captures the full record of what happened during an AI-assisted
 * development session: conversation, tool calls, file operations,
 * terminal commands, reasoning traces, costs, and relationships
 * to the engineering graph.
 *
 * Architecture: CloudEvents (minimal core) + SARIF (property bags)
 * + SPDX 3.0 (modular profiles).
 *
 * @license Apache-2.0
 */
