import { a as AgentLog } from '../schema-qh62TJ9l.js';

/**
 * Claude Code JSONL → AgentLog Converter
 *
 * Reads Claude Code session JSONL files (from ~/.claude/projects/)
 * and converts them to the AgentLog standard format.
 *
 * @license Apache-2.0
 */

interface ConvertOptions {
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
/**
 * Convert a Claude Code session directory to a AgentLog document.
 *
 * @param sessionDir - Path to the session directory (contains subagents/*.jsonl)
 * @param options - Conversion options
 */
declare function convertClaudeCodeSession(sessionDir: string, options?: ConvertOptions): Promise<AgentLog>;

export { type ConvertOptions, convertClaudeCodeSession };
