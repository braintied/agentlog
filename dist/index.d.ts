export { A as AgentInfo, a as AgentLog, C as CommitRef, D as DeploymentRef, b as DeveloperInfo, E as ErrorEvent, c as ErrorRef, F as FileOperationEvent, I as IssueRef, M as MessageEvent, P as ProjectContext, d as PullRequestRef, R as ReasoningEvent, S as SPEC_VERSION, e as SearchEvent, f as SessionEvent, g as SessionMetrics, h as SessionRelationships, i as SessionStatus, T as TerminalCommandEvent, j as TokenUsage, k as ToolCallEvent } from './schema-qh62TJ9l.js';
import { z } from 'zod';

/**
 * AgentLog — Runtime Validation
 *
 * Zod schemas for validating AgentLog documents at runtime.
 * Use these when ingesting sessions from external sources.
 */

declare const AgentLogSchema: z.ZodObject<{
    specVersion: z.ZodLiteral<"0.1.0">;
    id: z.ZodString;
    startTime: z.ZodString;
    endTime: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        active: "active";
        completed: "completed";
        failed: "failed";
        cancelled: "cancelled";
    }>;
    agent: z.ZodObject<{
        name: z.ZodString;
        version: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        model: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        provider: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>;
    project: z.ZodDefault<z.ZodNullable<z.ZodObject<{
        name: z.ZodString;
        repository: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        workingDirectory: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        branch: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        commitSha: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>>;
    developer: z.ZodDefault<z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>>;
    events: z.ZodDefault<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        id: z.ZodString;
        timestamp: z.ZodString;
        parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        durationMs: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        type: z.ZodLiteral<"message">;
        role: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
            system: "system";
        }>;
        content: z.ZodString;
        tokenUsage: z.ZodDefault<z.ZodNullable<z.ZodObject<{
            inputTokens: z.ZodNumber;
            outputTokens: z.ZodNumber;
            cacheReadTokens: z.ZodNullable<z.ZodNumber>;
            cacheWriteTokens: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>>>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        timestamp: z.ZodString;
        parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        durationMs: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        type: z.ZodLiteral<"toolCall">;
        name: z.ZodString;
        input: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        output: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        status: z.ZodEnum<{
            cancelled: "cancelled";
            success: "success";
            error: "error";
        }>;
        summary: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        timestamp: z.ZodString;
        parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        durationMs: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        type: z.ZodLiteral<"fileOperation">;
        operation: z.ZodEnum<{
            read: "read";
            create: "create";
            edit: "edit";
            delete: "delete";
        }>;
        path: z.ZodString;
        diff: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        beforeHash: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        afterHash: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        linesAdded: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        linesRemoved: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        timestamp: z.ZodString;
        parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        durationMs: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        type: z.ZodLiteral<"terminalCommand">;
        command: z.ZodString;
        cwd: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        stdout: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        stderr: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        exitCode: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        timestamp: z.ZodString;
        parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        durationMs: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        type: z.ZodLiteral<"search">;
        tool: z.ZodString;
        query: z.ZodString;
        resultCount: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        topResults: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        timestamp: z.ZodString;
        parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        durationMs: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        type: z.ZodLiteral<"reasoning">;
        intent: z.ZodString;
        alternatives: z.ZodDefault<z.ZodArray<z.ZodString>>;
        rationale: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        timestamp: z.ZodString;
        parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        durationMs: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        type: z.ZodLiteral<"error">;
        message: z.ZodString;
        code: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        recovery: z.ZodDefault<z.ZodNullable<z.ZodEnum<{
            retry: "retry";
            skip: "skip";
            abort: "abort";
            escalate: "escalate";
            fixed: "fixed";
        }>>>;
        resolved: z.ZodBoolean;
    }, z.core.$strip>], "type">>>;
    metrics: z.ZodDefault<z.ZodNullable<z.ZodObject<{
        messageCount: z.ZodNumber;
        toolCallCount: z.ZodNumber;
        filesTouchedCount: z.ZodNumber;
        durationMinutes: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        tokenUsage: z.ZodDefault<z.ZodNullable<z.ZodObject<{
            inputTokens: z.ZodNumber;
            outputTokens: z.ZodNumber;
            cacheReadTokens: z.ZodNullable<z.ZodNumber>;
            cacheWriteTokens: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>>>;
        estimatedCostUsd: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
        filesTouched: z.ZodDefault<z.ZodArray<z.ZodString>>;
        toolsUsed: z.ZodDefault<z.ZodArray<z.ZodString>>;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>>;
    relationships: z.ZodDefault<z.ZodNullable<z.ZodObject<{
        commits: z.ZodDefault<z.ZodArray<z.ZodObject<{
            sha: z.ZodString;
            message: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            repository: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            timestamp: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>>>;
        pullRequests: z.ZodDefault<z.ZodArray<z.ZodObject<{
            number: z.ZodNumber;
            title: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            url: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            repository: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            status: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>>>;
        issues: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            url: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            tracker: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            status: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>>>;
        errors: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            source: z.ZodString;
            url: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            title: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>>>;
        deployments: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            environment: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            url: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            status: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>>>;
        parentSession: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        childSessions: z.ZodDefault<z.ZodArray<z.ZodString>>;
        properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>>;
    properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
/**
 * Validate a CodingSession document.
 * Returns { success: true, data } or { success: false, error }.
 */
declare function validateAgentLog(input: unknown): z.ZodSafeParseResult<{
    specVersion: "0.1.0";
    id: string;
    startTime: string;
    endTime: string | null;
    status: "active" | "completed" | "failed" | "cancelled";
    agent: {
        name: string;
        version: string | null;
        model: string | null;
        provider: string | null;
        properties: Record<string, unknown>;
    };
    project: {
        name: string;
        repository: string | null;
        workingDirectory: string | null;
        branch: string | null;
        commitSha: string | null;
        properties: Record<string, unknown>;
    } | null;
    developer: {
        id: string;
        name: string | null;
        properties: Record<string, unknown>;
    } | null;
    events: ({
        id: string;
        timestamp: string;
        parentId: string | null;
        durationMs: number | null;
        properties: Record<string, unknown>;
        type: "message";
        role: "user" | "assistant" | "system";
        content: string;
        tokenUsage: {
            inputTokens: number;
            outputTokens: number;
            cacheReadTokens: number | null;
            cacheWriteTokens: number | null;
        } | null;
    } | {
        id: string;
        timestamp: string;
        parentId: string | null;
        durationMs: number | null;
        properties: Record<string, unknown>;
        type: "toolCall";
        name: string;
        input: Record<string, unknown>;
        output: string | null;
        status: "cancelled" | "success" | "error";
        summary: string | null;
    } | {
        id: string;
        timestamp: string;
        parentId: string | null;
        durationMs: number | null;
        properties: Record<string, unknown>;
        type: "fileOperation";
        operation: "read" | "create" | "edit" | "delete";
        path: string;
        diff: string | null;
        beforeHash: string | null;
        afterHash: string | null;
        linesAdded: number | null;
        linesRemoved: number | null;
    } | {
        id: string;
        timestamp: string;
        parentId: string | null;
        durationMs: number | null;
        properties: Record<string, unknown>;
        type: "terminalCommand";
        command: string;
        cwd: string | null;
        stdout: string | null;
        stderr: string | null;
        exitCode: number | null;
    } | {
        id: string;
        timestamp: string;
        parentId: string | null;
        durationMs: number | null;
        properties: Record<string, unknown>;
        type: "search";
        tool: string;
        query: string;
        resultCount: number | null;
        topResults: string[];
    } | {
        id: string;
        timestamp: string;
        parentId: string | null;
        durationMs: number | null;
        properties: Record<string, unknown>;
        type: "reasoning";
        intent: string;
        alternatives: string[];
        rationale: string;
    } | {
        id: string;
        timestamp: string;
        parentId: string | null;
        durationMs: number | null;
        properties: Record<string, unknown>;
        type: "error";
        message: string;
        code: string | null;
        recovery: "retry" | "skip" | "abort" | "escalate" | "fixed" | null;
        resolved: boolean;
    })[];
    metrics: {
        messageCount: number;
        toolCallCount: number;
        filesTouchedCount: number;
        durationMinutes: number | null;
        tokenUsage: {
            inputTokens: number;
            outputTokens: number;
            cacheReadTokens: number | null;
            cacheWriteTokens: number | null;
        } | null;
        estimatedCostUsd: number | null;
        filesTouched: string[];
        toolsUsed: string[];
        properties: Record<string, unknown>;
    } | null;
    relationships: {
        commits: {
            sha: string;
            message: string | null;
            repository: string | null;
            timestamp: string | null;
        }[];
        pullRequests: {
            number: number;
            title: string | null;
            url: string | null;
            repository: string | null;
            status: string | null;
        }[];
        issues: {
            id: string;
            title: string | null;
            url: string | null;
            tracker: string | null;
            status: string | null;
        }[];
        errors: {
            id: string;
            source: string;
            url: string | null;
            title: string | null;
        }[];
        deployments: {
            id: string;
            environment: string | null;
            url: string | null;
            status: string | null;
        }[];
        parentSession: string | null;
        childSessions: string[];
        properties: Record<string, unknown>;
    } | null;
    properties: Record<string, unknown>;
}>;

export { AgentLogSchema, validateAgentLog };
