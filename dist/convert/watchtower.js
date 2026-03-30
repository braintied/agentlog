import {
  SPEC_VERSION
} from "../chunk-7Z5MJWOM.js";

// src/convert/watchtower.ts
function exportWatchtowerSession(row, options) {
  const events = [];
  let eventIndex = 0;
  const metadata = row.metadata;
  if (metadata !== null && metadata !== void 0) {
    const rawContent = typeof metadata.raw_content === "string" ? metadata.raw_content : null;
    if (rawContent !== null) {
      const lines = rawContent.split("\n");
      let currentRole = null;
      let currentContent = [];
      for (const line of lines) {
        if (line.startsWith("[user] ")) {
          if (currentRole !== null && currentContent.length > 0) {
            events.push(buildMessageEvent(currentRole, currentContent.join("\n"), row.session_started_at, eventIndex++));
          }
          currentRole = "user";
          currentContent = [line.slice(7)];
        } else if (line.startsWith("[assistant] ")) {
          if (currentRole !== null && currentContent.length > 0) {
            events.push(buildMessageEvent(currentRole, currentContent.join("\n"), row.session_started_at, eventIndex++));
          }
          currentRole = "assistant";
          currentContent = [line.slice(12)];
        } else if (line.startsWith("  > ")) {
          currentContent.push(line);
        } else {
          currentContent.push(line);
        }
      }
      if (currentRole !== null && currentContent.length > 0) {
        events.push(buildMessageEvent(currentRole, currentContent.join("\n"), row.session_started_at, eventIndex++));
      }
    }
  }
  let relationships = null;
  const relatedCommits = options?.relatedCommits;
  if (relatedCommits !== void 0 && relatedCommits.length > 0) {
    const commits = relatedCommits.map((c) => ({
      sha: c.sha,
      message: c.message,
      repository: options?.repository !== void 0 ? options.repository : null,
      timestamp: c.committed_at
    }));
    relationships = {
      commits,
      pullRequests: [],
      issues: [],
      errors: [],
      deployments: [],
      parentSession: null,
      childSessions: [],
      properties: {}
    };
  }
  const agentName = mapSourceToAgentName(row.source);
  const filesTouched = row.files_touched !== null ? row.files_touched : [];
  const toolsUsed = row.tools_used !== null ? row.tools_used : [];
  const session = {
    specVersion: SPEC_VERSION,
    id: row.id,
    startTime: row.session_started_at !== null ? row.session_started_at : (/* @__PURE__ */ new Date()).toISOString(),
    endTime: row.session_ended_at,
    status: "completed",
    agent: {
      name: agentName,
      version: null,
      model: null,
      provider: mapSourceToProvider(row.source),
      properties: {}
    },
    project: options?.projectName !== void 0 ? {
      name: options.projectName,
      repository: options?.repository !== void 0 ? options.repository : null,
      workingDirectory: null,
      branch: null,
      commitSha: null,
      properties: {}
    } : null,
    developer: options?.developerId !== void 0 ? {
      id: options.developerId,
      name: options?.developerName !== void 0 ? options.developerName : null,
      properties: {}
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
      properties: {}
    },
    relationships,
    properties: {
      watchtowerSessionKey: row.session_key,
      watchtowerCategory: row.category,
      watchtowerTitle: row.title,
      watchtowerSummary: row.ai_summary,
      watchtowerDecisions: row.decisions,
      converter: "watchtower",
      converterVersion: SPEC_VERSION
    }
  };
  return session;
}
function buildMessageEvent(role, content, sessionStartTime, index) {
  return {
    type: "message",
    id: `evt-${index}`,
    timestamp: sessionStartTime !== null ? sessionStartTime : (/* @__PURE__ */ new Date()).toISOString(),
    parentId: null,
    durationMs: null,
    role,
    content,
    tokenUsage: null,
    properties: {}
  };
}
function mapSourceToAgentName(source) {
  switch (source) {
    case "claude_code":
      return "Claude Code";
    case "cursor":
      return "Cursor";
    case "codex":
      return "OpenAI Codex";
    case "gemini":
      return "Gemini";
    default:
      return source;
  }
}
function mapSourceToProvider(source) {
  switch (source) {
    case "claude_code":
      return "anthropic";
    case "cursor":
      return "cursor";
    case "codex":
      return "openai";
    case "gemini":
      return "google";
    default:
      return "unknown";
  }
}
export {
  exportWatchtowerSession
};
/**
 * Watchtower → AgentLog Exporter
 *
 * Converts watchtower.coding_sessions rows to the AgentLog standard format.
 * Used to export Watchtower session intelligence data in a portable format.
 *
 * @license Apache-2.0
 */
