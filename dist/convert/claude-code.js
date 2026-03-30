import {
  SPEC_VERSION
} from "../chunk-7Z5MJWOM.js";

// src/convert/claude-code.ts
import { randomUUID } from "crypto";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
async function convertClaudeCodeSession(sessionDir, options) {
  const maxContent = options?.maxContentLength !== void 0 ? options.maxContentLength : 500;
  const maxOutput = options?.maxOutputLength !== void 0 ? options.maxOutputLength : 200;
  const entries = await readJsonlFiles(sessionDir);
  if (entries.length === 0) {
    throw new Error(`No JSONL data found in ${sessionDir}`);
  }
  entries.sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    return ta - tb;
  });
  const firstEntry = entries[0];
  const lastEntry = entries[entries.length - 1];
  const startTime = firstEntry.timestamp;
  const endTime = lastEntry.timestamp;
  const model = extractModel(entries);
  const cwd = firstEntry.cwd !== void 0 ? firstEntry.cwd : null;
  const events = [];
  const filesTouched = /* @__PURE__ */ new Set();
  const toolsUsed = /* @__PURE__ */ new Set();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let eventIndex = 0;
  for (const entry of entries) {
    if (entry.type === "user") {
      const content = typeof entry.message.content === "string" ? entry.message.content : "";
      const msgEvent = {
        type: "message",
        id: `evt-${eventIndex++}`,
        timestamp: entry.timestamp,
        parentId: null,
        durationMs: null,
        role: "user",
        content,
        tokenUsage: null,
        properties: {}
      };
      events.push(msgEvent);
    }
    if (entry.type === "assistant") {
      const contentBlocks = Array.isArray(entry.message.content) ? entry.message.content : [];
      const textParts = [];
      for (const block of contentBlocks) {
        if (block.type === "text") {
          textParts.push(block.text);
        }
      }
      if (textParts.length > 0) {
        const usage = entry.message.usage;
        const inputTokens = usage?.input_tokens !== void 0 ? usage.input_tokens : 0;
        const outputTokens = usage?.output_tokens !== void 0 ? usage.output_tokens : 0;
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;
        const msgEvent = {
          type: "message",
          id: `evt-${eventIndex++}`,
          timestamp: entry.timestamp,
          parentId: null,
          durationMs: null,
          role: "assistant",
          content: textParts.join("\n"),
          tokenUsage: {
            inputTokens,
            outputTokens,
            cacheReadTokens: usage?.cache_read_input_tokens !== void 0 ? usage.cache_read_input_tokens : null,
            cacheWriteTokens: usage?.cache_creation_input_tokens !== void 0 ? usage.cache_creation_input_tokens : null
          },
          properties: {
            model: entry.message.model !== void 0 ? entry.message.model : null
          }
        };
        events.push(msgEvent);
      }
      const parentEventId = `evt-${eventIndex - 1}`;
      for (const block of contentBlocks) {
        if (block.type !== "tool_use") continue;
        const toolBlock = block;
        toolsUsed.add(toolBlock.name);
        const toolEvent = convertToolCall(
          toolBlock,
          entry.timestamp,
          `evt-${eventIndex++}`,
          parentEventId,
          filesTouched,
          maxContent,
          maxOutput
        );
        if (toolEvent !== null) {
          events.push(toolEvent);
        }
      }
    }
  }
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const durationMinutes = Math.round((endMs - startMs) / 6e4);
  const projectName = options?.projectName !== void 0 ? options.projectName : cwd !== null ? cwd.split("/").pop() : "unknown";
  const session = {
    specVersion: SPEC_VERSION,
    id: randomUUID(),
    startTime,
    endTime,
    status: "completed",
    agent: {
      name: "Claude Code",
      version: null,
      model,
      provider: "anthropic",
      properties: {}
    },
    project: {
      name: projectName !== void 0 ? projectName : "unknown",
      repository: options?.repository !== void 0 ? options.repository : null,
      workingDirectory: cwd,
      branch: null,
      commitSha: null,
      properties: {}
    },
    developer: options?.developerId !== void 0 ? {
      id: options.developerId,
      name: options?.developerName !== void 0 ? options.developerName : null,
      properties: {}
    } : null,
    events,
    metrics: {
      messageCount: events.filter((e) => e.type === "message").length,
      toolCallCount: events.filter((e) => e.type !== "message").length,
      filesTouchedCount: filesTouched.size,
      durationMinutes,
      tokenUsage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cacheReadTokens: null,
        cacheWriteTokens: null
      },
      estimatedCostUsd: null,
      filesTouched: Array.from(filesTouched),
      toolsUsed: Array.from(toolsUsed),
      properties: {}
    },
    relationships: null,
    properties: {
      converter: "claude-code",
      converterVersion: SPEC_VERSION,
      sourceDir: sessionDir
    }
  };
  return session;
}
async function readJsonlFiles(sessionDir) {
  const entries = [];
  const subagentsDir = join(sessionDir, "subagents");
  try {
    const files = await readdir(subagentsDir);
    for (const file of files) {
      if (!file.endsWith(".jsonl")) continue;
      const content = await readFile(join(subagentsDir, file), "utf-8");
      const cleaned = content.replace(/^\uFEFF/, "");
      for (const line of cleaned.split("\n")) {
        if (line.trim().length === 0) continue;
        try {
          entries.push(JSON.parse(line));
        } catch {
        }
      }
    }
  } catch {
  }
  try {
    const files = await readdir(sessionDir);
    for (const file of files) {
      if (!file.endsWith(".jsonl")) continue;
      const content = await readFile(join(sessionDir, file), "utf-8");
      const cleaned = content.replace(/^\uFEFF/, "");
      for (const line of cleaned.split("\n")) {
        if (line.trim().length === 0) continue;
        try {
          entries.push(JSON.parse(line));
        } catch {
        }
      }
    }
  } catch {
  }
  return entries;
}
function extractModel(entries) {
  for (const entry of entries) {
    if (entry.type === "assistant" && entry.message.model !== void 0) {
      return entry.message.model;
    }
  }
  return null;
}
function convertToolCall(block, timestamp, eventId, parentId, filesTouched, maxContent, maxOutput) {
  const input = block.input;
  const name = block.name;
  if (name === "Edit" || name === "Write" || name === "Read") {
    const filePath = typeof input.file_path === "string" ? input.file_path : null;
    if (filePath !== null) filesTouched.add(filePath);
    const operation = name === "Edit" ? "edit" : name === "Write" ? "create" : "read";
    let diff = null;
    if (name === "Edit") {
      const oldStr = typeof input.old_string === "string" ? input.old_string.slice(0, maxContent) : "";
      const newStr = typeof input.new_string === "string" ? input.new_string.slice(0, maxContent) : "";
      diff = `--- old
+++ new
-${oldStr}
+${newStr}`;
    }
    const fileEvent = {
      type: "fileOperation",
      id: eventId,
      timestamp,
      parentId,
      durationMs: null,
      operation,
      path: filePath !== null ? filePath : "unknown",
      diff,
      beforeHash: null,
      afterHash: null,
      linesAdded: null,
      linesRemoved: null,
      properties: {}
    };
    return fileEvent;
  }
  if (name === "Bash") {
    const command = typeof input.command === "string" ? input.command.slice(0, maxContent) : "";
    const termEvent = {
      type: "terminalCommand",
      id: eventId,
      timestamp,
      parentId,
      durationMs: null,
      command,
      cwd: typeof input.cwd === "string" ? input.cwd : null,
      stdout: null,
      stderr: null,
      exitCode: null,
      properties: {}
    };
    return termEvent;
  }
  if (name === "Grep" || name === "Glob" || name === "WebSearch") {
    const query = name === "Grep" ? typeof input.pattern === "string" ? input.pattern : "" : name === "Glob" ? typeof input.pattern === "string" ? input.pattern : "" : typeof input.query === "string" ? input.query : "";
    const searchEvent = {
      type: "search",
      id: eventId,
      timestamp,
      parentId,
      durationMs: null,
      tool: name,
      query,
      resultCount: null,
      topResults: [],
      properties: {}
    };
    return searchEvent;
  }
  const truncatedInput = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === "string") {
      truncatedInput[k] = v.slice(0, maxContent);
    } else {
      truncatedInput[k] = v;
    }
  }
  const toolEvent = {
    type: "toolCall",
    id: eventId,
    timestamp,
    parentId,
    durationMs: null,
    name,
    input: truncatedInput,
    output: null,
    status: "success",
    summary: null,
    properties: {}
  };
  return toolEvent;
}
export {
  convertClaudeCodeSession
};
/**
 * Claude Code JSONL → AgentLog Converter
 *
 * Reads Claude Code session JSONL files (from ~/.claude/projects/)
 * and converts them to the AgentLog standard format.
 *
 * @license Apache-2.0
 */
