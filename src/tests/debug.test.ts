import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { analyzeAttributionDebug, buildAttributionDebugOutput } from '../commands/debug.js';
import { completeTask, createTask, initializeDatabase, upsertSessionRecords } from '../database/db.js';

function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  initializeDatabase(db);
  return db;
}

function createSession(overrides: Partial<Parameters<typeof upsertSessionRecords>[1][number]> = {}) {
  return {
    source: 'codex' as const,
    sessionId: 'session-1',
    projectPath: '/workspace/app',
    model: 'gpt-5',
    startedAt: '2026-06-18T01:10:00.000Z',
    inputTokens: 1000,
    cachedInputTokens: 0,
    outputTokens: 1000,
    reasoningOutputTokens: 0,
    totalTokens: 2000,
    costUsd: 1.25,
    costSource: 'estimated',
    rawPath: '/tmp/session-1.jsonl',
    ...overrides,
  };
}

test('attribution debug shows onboarding when no local usage exists', () => {
  const db = createTestDb();
  const analysis = analyzeAttributionDebug(db as never, '2026-06-24T10:00:00.000Z');
  const output = buildAttributionDebugOutput(analysis);

  assert.equal(analysis.noLocalUsage, true);
  assert.match(output, /No local AI usage found\./);
  assert.match(output, /Run agent-roi scan/);
  db.close();
});

test('attribution debug distinguishes project-path miss vs time-window miss', () => {
  const db = createTestDb();

  const taskWithoutProjectSessions = createTask(db as never, {
    name: 'No Project Match',
    projectPath: '/workspace/unknown',
    startedAt: '2026-06-18T00:00:00.000Z',
  });
  completeTask(db as never, taskWithoutProjectSessions.id, '2026-06-18T01:00:00.000Z');

  const taskOutsideWindow = createTask(db as never, {
    name: 'Outside Window',
    projectPath: '/workspace/app',
    startedAt: '2026-06-20T00:00:00.000Z',
  });
  completeTask(db as never, taskOutsideWindow.id, '2026-06-20T01:00:00.000Z');

  upsertSessionRecords(db as never, [createSession()]);

  const analysis = analyzeAttributionDebug(db as never, '2026-06-24T10:00:00.000Z');
  const noProjectMatch = analysis.sampleUnmatchedTasks.find((item) => item.name === 'No Project Match');
  const outsideWindow = analysis.sampleUnmatchedTasks.find((item) => item.name === 'Outside Window');

  assert.equal(analysis.unmatchedRecentTaskCount, 2);
  assert.equal(analysis.unmatchedNoProjectSessionsCount, 1);
  assert.equal(analysis.unmatchedOutsideWindowCount, 1);
  assert.match(noProjectMatch?.reason ?? '', /No Codex sessions found/);
  assert.match(outsideWindow?.reason ?? '', /none landed inside the task time window/);
  db.close();
});
