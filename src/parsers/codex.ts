import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { getPriceModel, type SessionRecord } from '../database/db.js';
import { estimateCost } from '../pricing/estimate.js';
import { getCodexHome, getCodexSessionDir, listFilesRecursive, normalizeProjectPath } from '../utils/paths.js';

const sessionMetaSchema = z.object({
  timestamp: z.string(),
  type: z.literal('session_meta'),
  payload: z.object({
    id: z.string(),
    timestamp: z.string().optional(),
    cwd: z.string().optional(),
    cli_version: z.string().optional(),
    model_provider: z.string().optional(),
  }),
});

const tokenCountSchema = z.object({
  timestamp: z.string(),
  type: z.literal('event_msg'),
  payload: z.object({
    type: z.literal('token_count'),
    info: z.object({
      total_token_usage: z.object({
        input_tokens: z.number().int(),
        cached_input_tokens: z.number().int().optional().default(0),
        output_tokens: z.number().int(),
        reasoning_output_tokens: z.number().int().optional().default(0),
        total_tokens: z.number().int(),
      }),
    }),
  }),
});

type CodexThreadLookup = {
  model: string | null;
  cwd: string | null;
  createdAt: string | null;
};

export function parseCodexSessions(db: Database.Database): SessionRecord[] {
  const sessionFiles = listFilesRecursive(getCodexSessionDir(), (filePath) => filePath.endsWith('.jsonl'));
  const threadLookup = loadCodexThreadLookup();
  const records: SessionRecord[] = [];

  for (const filePath of sessionFiles) {
    const record = parseCodexSessionFile(db, filePath, threadLookup);
    if (record) {
      records.push(record);
    }
  }

  return records;
}

export function parseCodexSessionFile(
  db: Database.Database,
  filePath: string,
  threadLookup: Map<string, CodexThreadLookup>,
): SessionRecord | null {
  const content = fs.readFileSync(filePath, 'utf8');
  return parseCodexSessionContent(db, filePath, content, threadLookup);
}

export function parseCodexSessionContent(
  db: Database.Database,
  filePath: string,
  content: string,
  threadLookup: Map<string, CodexThreadLookup>,
): SessionRecord | null {
  const lines = content.split(/\r?\n/).filter(Boolean);

  let sessionId: string | null = null;
  let projectPath: string | null = null;
  let startedAt: string | null = null;
  let model: string | null = null;
  let usage:
    | {
        inputTokens: number;
        cachedInputTokens: number;
        outputTokens: number;
        reasoningOutputTokens: number;
        totalTokens: number;
      }
    | null = null;

  for (const line of lines) {
    const parsed = safeJsonParse(line);
    if (!parsed || typeof parsed !== 'object' || parsed === null || !('type' in parsed)) {
      continue;
    }

    const sessionMetaResult = sessionMetaSchema.safeParse(parsed);
    if (sessionMetaResult.success) {
      sessionId = sessionMetaResult.data.payload.id;
      projectPath = sessionMetaResult.data.payload.cwd ?? projectPath;
      startedAt = sessionMetaResult.data.payload.timestamp ?? sessionMetaResult.data.timestamp;
      continue;
    }

    const tokenCountResult = tokenCountSchema.safeParse(parsed);
    if (tokenCountResult.success) {
      usage = {
        inputTokens: tokenCountResult.data.payload.info.total_token_usage.input_tokens,
        cachedInputTokens: tokenCountResult.data.payload.info.total_token_usage.cached_input_tokens,
        outputTokens: tokenCountResult.data.payload.info.total_token_usage.output_tokens,
        reasoningOutputTokens: tokenCountResult.data.payload.info.total_token_usage.reasoning_output_tokens,
        totalTokens: tokenCountResult.data.payload.info.total_token_usage.total_tokens,
      };
    }
  }

  if (!sessionId) {
    const basename = path.basename(filePath, '.jsonl');
    sessionId = basename.replace(/^rollout-[^-]+-/, '');
  }

  const lookup = threadLookup.get(sessionId);
  projectPath = projectPath ?? lookup?.cwd ?? null;
  model = lookup?.model ?? null;
  startedAt = startedAt ?? lookup?.createdAt ?? null;

  if (!projectPath || !usage) {
    return null;
  }

  const normalizedProjectPath = normalizeProjectPath(projectPath);
  const priceModel = model ? getPriceModel(db, 'openai', model) : null;
  const estimate = estimateCost(priceModel, usage);

  return {
    source: 'codex',
    sessionId,
    projectPath: normalizedProjectPath,
    model,
    startedAt,
    inputTokens: usage.inputTokens,
    cachedInputTokens: usage.cachedInputTokens,
    outputTokens: usage.outputTokens,
    reasoningOutputTokens: usage.reasoningOutputTokens,
    totalTokens: usage.totalTokens,
    costUsd: estimate.costUsd,
    costSource: estimate.costSource,
    rawPath: filePath,
  };
}

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

export function loadCodexThreadLookup(): Map<string, CodexThreadLookup> {
  const map = new Map<string, CodexThreadLookup>();
  const candidatePaths = [
    path.join(getCodexHome(), 'state_5.sqlite'),
    path.join(getCodexHome(), 'sqlite', 'state_5.sqlite'),
  ];

  for (const candidatePath of candidatePaths) {
    if (!fs.existsSync(candidatePath)) {
      continue;
    }

    try {
      const db = new Database(candidatePath, { readonly: true, fileMustExist: true });
      const hasThreadsTable = db
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'threads'`)
        .get() as { name: string } | undefined;

      if (!hasThreadsTable) {
        db.close();
        continue;
      }

      const rows = db
        .prepare(
          `
          SELECT
            id,
            cwd,
            model,
            created_at_ms
          FROM threads
        `,
        )
        .all() as Array<{ id: string; cwd: string | null; model: string | null; created_at_ms: number | null }>;

      for (const row of rows) {
        map.set(row.id, {
          model: row.model,
          cwd: row.cwd ? normalizeProjectPath(row.cwd) : null,
          createdAt: row.created_at_ms ? new Date(row.created_at_ms).toISOString() : null,
        });
      }

      db.close();
    } catch {
      // Ignore local metadata DB failures and fall back to JSONL-only parsing.
    }
  }

  return map;
}
