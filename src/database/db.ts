import Database from 'better-sqlite3';
import { PRICE_MODEL_SEEDS } from '../pricing/models.js';
import { ensureDirectory, getDataDir, getDatabasePath } from '../utils/paths.js';
import { nowIso } from '../utils/time.js';
import {
  CREATE_ACTIVE_TASK_INDEX_SQL,
  CREATE_GIT_METRICS_TABLE_SQL,
  CREATE_PRICE_MODELS_TABLE_SQL,
  CREATE_SESSIONS_TABLE_SQL,
  CREATE_TASKS_TABLE_SQL,
} from './schema.js';

export type SessionRecord = {
  source: 'codex' | 'claude';
  sessionId: string;
  projectPath: string;
  model: string | null;
  startedAt: string | null;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  totalTokens: number;
  costUsd: number | null;
  costSource: string;
  rawPath: string;
};

export type GitMetricRecord = {
  projectPath: string;
  fromDate: string;
  toDate: string;
  commitCount: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
};

export type PriceModelRow = {
  provider: string;
  model: string;
  inputPricePer1M: number;
  cachedInputPricePer1M: number;
  outputPricePer1M: number;
  reasoningOutputPricePer1M: number | null;
  effectiveFrom: string;
};

export type TaskStatus = 'active' | 'completed';

export type TaskRecord = {
  id: number;
  name: string;
  projectPath: string;
  startedAt: string;
  endedAt: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export function openDatabase(): Database.Database {
  ensureDirectory(getDataDir());

  const db = new Database(getDatabasePath());
  db.pragma('journal_mode = WAL');
  initializeDatabase(db);
  return db;
}

export function initializeDatabase(db: Database.Database): void {
  migrate(db);
  seedPriceModels(db);
}

function migrate(db: Database.Database): void {
  db.exec(CREATE_SESSIONS_TABLE_SQL);
  db.exec(CREATE_GIT_METRICS_TABLE_SQL);
  db.exec(CREATE_PRICE_MODELS_TABLE_SQL);
  db.exec(CREATE_TASKS_TABLE_SQL);
  db.exec(CREATE_ACTIVE_TASK_INDEX_SQL);
}

export function seedPriceModels(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT INTO price_models (
      provider,
      model,
      input_price_per_1m,
      cached_input_price_per_1m,
      output_price_per_1m,
      reasoning_output_price_per_1m,
      effective_from
    ) VALUES (
      @provider,
      @model,
      @inputPricePer1M,
      @cachedInputPricePer1M,
      @outputPricePer1M,
      @reasoningOutputPricePer1M,
      @effectiveFrom
    )
    ON CONFLICT(provider, model, effective_from) DO UPDATE SET
      input_price_per_1m = excluded.input_price_per_1m,
      cached_input_price_per_1m = excluded.cached_input_price_per_1m,
      output_price_per_1m = excluded.output_price_per_1m,
      reasoning_output_price_per_1m = excluded.reasoning_output_price_per_1m
  `);

  for (const model of PRICE_MODEL_SEEDS) {
    insert.run(model);
  }
}

export function upsertSessionRecords(db: Database.Database, records: SessionRecord[]): number {
  const stmt = db.prepare(`
    INSERT INTO sessions (
      source,
      session_id,
      project_path,
      model,
      started_at,
      input_tokens,
      cached_input_tokens,
      output_tokens,
      reasoning_output_tokens,
      total_tokens,
      cost_usd,
      cost_source,
      raw_path,
      created_at,
      updated_at
    ) VALUES (
      @source,
      @sessionId,
      @projectPath,
      @model,
      @startedAt,
      @inputTokens,
      @cachedInputTokens,
      @outputTokens,
      @reasoningOutputTokens,
      @totalTokens,
      @costUsd,
      @costSource,
      @rawPath,
      @createdAt,
      @updatedAt
    )
    ON CONFLICT(source, session_id, raw_path) DO UPDATE SET
      project_path = excluded.project_path,
      model = excluded.model,
      started_at = excluded.started_at,
      input_tokens = excluded.input_tokens,
      cached_input_tokens = excluded.cached_input_tokens,
      output_tokens = excluded.output_tokens,
      reasoning_output_tokens = excluded.reasoning_output_tokens,
      total_tokens = excluded.total_tokens,
      cost_usd = excluded.cost_usd,
      cost_source = excluded.cost_source,
      updated_at = excluded.updated_at
  `);

  const now = nowIso();
  const tx = db.transaction((rows: SessionRecord[]) => {
    for (const row of rows) {
      stmt.run({
        ...row,
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  tx(records);
  return records.length;
}

export function upsertGitMetric(db: Database.Database, record: GitMetricRecord): void {
  db.prepare(`
    INSERT INTO git_metrics (
      project_path,
      from_date,
      to_date,
      commit_count,
      files_changed,
      lines_added,
      lines_removed,
      captured_at
    ) VALUES (
      @projectPath,
      @fromDate,
      @toDate,
      @commitCount,
      @filesChanged,
      @linesAdded,
      @linesRemoved,
      @capturedAt
    )
    ON CONFLICT(project_path, from_date, to_date) DO UPDATE SET
      commit_count = excluded.commit_count,
      files_changed = excluded.files_changed,
      lines_added = excluded.lines_added,
      lines_removed = excluded.lines_removed,
      captured_at = excluded.captured_at
  `).run({
    ...record,
    capturedAt: nowIso(),
  });
}

export function getPriceModel(db: Database.Database, provider: string, model: string): PriceModelRow | null {
  const row = db
    .prepare(
      `
      SELECT
        provider,
        model,
        input_price_per_1m AS inputPricePer1M,
        cached_input_price_per_1m AS cachedInputPricePer1M,
        output_price_per_1m AS outputPricePer1M,
        reasoning_output_price_per_1m AS reasoningOutputPricePer1M,
        effective_from AS effectiveFrom
      FROM price_models
      WHERE provider = ? AND model = ?
      ORDER BY effective_from DESC
      LIMIT 1
    `,
    )
    .get(provider, model) as PriceModelRow | undefined;

  return row ?? null;
}

export type TodaySummaryRow = {
  count: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number | null;
};

export type SessionSummaryRow = {
  count: number;
  totalTokens: number;
  costUsd: number | null;
  unknownCount: number;
};

export function getTodaySummaryForSource(
  db: Database.Database,
  source: 'codex' | 'claude',
  fieldName: 'started_at' | 'created_at' | 'updated_at',
  fromIso: string,
  toIso: string,
): TodaySummaryRow {
  const row = db
    .prepare(
      `
      SELECT
        COUNT(*) AS count,
        COALESCE(SUM(input_tokens), 0) AS inputTokens,
        COALESCE(SUM(cached_input_tokens), 0) AS cachedInputTokens,
        COALESCE(SUM(output_tokens), 0) AS outputTokens,
        COALESCE(SUM(total_tokens), 0) AS totalTokens,
        SUM(cost_usd) AS costUsd
      FROM sessions
      WHERE source = ? AND ${fieldName} >= ? AND ${fieldName} < ?
    `,
    )
    .get(source, fromIso, toIso) as TodaySummaryRow | undefined;

  return (
    row ?? {
      count: 0,
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      costUsd: 0,
    }
  );
}

export function getSessionSummaryForSource(
  db: Database.Database,
  source: 'codex' | 'claude',
  fieldName: 'started_at' | 'created_at' | 'updated_at',
  fromIso: string,
  toIso: string,
): SessionSummaryRow {
  const row = db
    .prepare(
      `
      SELECT
        COUNT(*) AS count,
        COALESCE(SUM(total_tokens), 0) AS totalTokens,
        SUM(cost_usd) AS costUsd,
        SUM(CASE WHEN cost_source = 'unknown_model' THEN 1 ELSE 0 END) AS unknownCount
      FROM sessions
      WHERE source = ? AND ${fieldName} >= ? AND ${fieldName} < ?
    `,
    )
    .get(source, fromIso, toIso) as SessionSummaryRow | undefined;

  return (
    row ?? {
      count: 0,
      totalTokens: 0,
      costUsd: 0,
      unknownCount: 0,
    }
  );
}

export type ProjectAiSummary = {
  costUsd: number | null;
  totalTokens: number;
  codexCount: number;
  claudeCount: number;
  hasUnknownCost: boolean;
};

export function getProjectAiSummary(
  db: Database.Database,
  projectPath: string,
  fromIso: string,
  toIso: string,
  options?: {
    includeClaudeSnapshots?: boolean;
  },
): ProjectAiSummary {
  const codex = db
    .prepare(
      `
      SELECT
        COUNT(*) AS count,
        COALESCE(SUM(total_tokens), 0) AS totalTokens,
        SUM(cost_usd) AS costUsd,
        SUM(CASE WHEN cost_source = 'unknown_model' THEN 1 ELSE 0 END) AS unknownCount
      FROM sessions
      WHERE source = 'codex' AND project_path = ? AND started_at >= ? AND started_at < ?
    `,
    )
    .get(projectPath, fromIso, toIso) as
    | { count: number; totalTokens: number; costUsd: number | null; unknownCount: number }
    | undefined;

  const includeClaudeSnapshots = options?.includeClaudeSnapshots ?? true;
  const claude = includeClaudeSnapshots
    ? ((db
        .prepare(
          `
          SELECT
            COUNT(*) AS count,
            COALESCE(SUM(total_tokens), 0) AS totalTokens,
            SUM(cost_usd) AS costUsd
          FROM sessions
          WHERE source = 'claude' AND project_path = ? AND updated_at >= ? AND updated_at < ?
        `,
        )
        .get(projectPath, fromIso, toIso) as { count: number; totalTokens: number; costUsd: number | null } | undefined) ??
      null)
    : null;

  const codexCost = codex?.costUsd ?? 0;
  const claudeCost = claude?.costUsd ?? 0;

  return {
    costUsd: (codexCost ?? 0) + (claudeCost ?? 0),
    totalTokens: (codex?.totalTokens ?? 0) + (claude?.totalTokens ?? 0),
    codexCount: codex?.count ?? 0,
    claudeCount: claude?.count ?? 0,
    hasUnknownCost: (codex?.unknownCount ?? 0) > 0,
  };
}

export function getActiveTaskForProject(db: Database.Database, projectPath: string): TaskRecord | null {
  const row = db
    .prepare(
      `
      SELECT
        id,
        name,
        project_path AS projectPath,
        started_at AS startedAt,
        ended_at AS endedAt,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM tasks
      WHERE project_path = ? AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `,
    )
    .get(projectPath) as TaskRecord | undefined;

  return row ?? null;
}

export function createTask(
  db: Database.Database,
  input: {
    name: string;
    projectPath: string;
    startedAt?: string;
  },
): TaskRecord {
  const timestamp = input.startedAt ?? nowIso();
  const info = db
    .prepare(
      `
      INSERT INTO tasks (
        name,
        project_path,
        started_at,
        ended_at,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, NULL, 'active', ?, ?)
    `,
    )
    .run(input.name, input.projectPath, timestamp, timestamp, timestamp);

  return getTaskById(db, Number(info.lastInsertRowid));
}

export function completeTask(db: Database.Database, taskId: number, endedAt = nowIso()): TaskRecord {
  db.prepare(
    `
    UPDATE tasks
    SET ended_at = ?,
        status = 'completed',
        updated_at = ?
    WHERE id = ?
  `,
  ).run(endedAt, endedAt, taskId);

  return getTaskById(db, taskId);
}

export function listRecentTasks(db: Database.Database, limit = 10): TaskRecord[] {
  return db
    .prepare(
      `
      SELECT
        id,
        name,
        project_path AS projectPath,
        started_at AS startedAt,
        ended_at AS endedAt,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM tasks
      ORDER BY started_at DESC
      LIMIT ?
    `,
    )
    .all(limit) as TaskRecord[];
}

export function listCompletedTasksInWindow(
  db: Database.Database,
  fromIso: string,
  toIso: string,
): TaskRecord[] {
  return db
    .prepare(
      `
      SELECT
        id,
        name,
        project_path AS projectPath,
        started_at AS startedAt,
        ended_at AS endedAt,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM tasks
      WHERE status = 'completed' AND ended_at IS NOT NULL AND ended_at >= ? AND ended_at < ?
      ORDER BY ended_at DESC
    `,
    )
    .all(fromIso, toIso) as TaskRecord[];
}

function getTaskById(db: Database.Database, taskId: number): TaskRecord {
  const row = db
    .prepare(
      `
      SELECT
        id,
        name,
        project_path AS projectPath,
        started_at AS startedAt,
        ended_at AS endedAt,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM tasks
      WHERE id = ?
      LIMIT 1
    `,
    )
    .get(taskId) as TaskRecord | undefined;

  if (!row) {
    throw new Error(`Task not found: ${taskId}`);
  }

  return row;
}
