import { a as AgentLog } from '../schema-qh62TJ9l.js';

/**
 * Watchtower → AgentLog Exporter
 *
 * Converts watchtower.coding_sessions rows to the AgentLog standard format.
 * Used to export Watchtower session intelligence data in a portable format.
 *
 * @license Apache-2.0
 */

interface WatchtowerSessionRow {
    id: string;
    session_key: string;
    source: string;
    title: string | null;
    ai_summary: string | null;
    category: string | null;
    files_touched: string[] | null;
    tools_used: string[] | null;
    decisions: Array<{
        decision: string;
        reasoning: string;
        context: string;
    }> | null;
    duration_minutes: number | null;
    message_count: number;
    metadata: Record<string, unknown> | null;
    session_started_at: string | null;
    session_ended_at: string | null;
    analyzed_at: string | null;
}
interface WatchtowerCommitRow {
    sha: string;
    message: string | null;
    author: string | null;
    committed_at: string | null;
}
interface ExportOptions {
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
/**
 * Convert a Watchtower coding_sessions row to a AgentLog document.
 */
declare function exportWatchtowerSession(row: WatchtowerSessionRow, options?: ExportOptions): AgentLog;

export { type ExportOptions, type WatchtowerCommitRow, type WatchtowerSessionRow, exportWatchtowerSession };
