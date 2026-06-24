import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { URL } from 'node:url';
import { completeTask, createTask, initializeDatabase, upsertSessionRecords } from '../database/db.js';
import { createUiServer } from '../ui/server.js';
import { buildOverviewPayload, loadOverviewPayload, type OverviewPayload } from '../ui/view-models.js';
import type { BudgetAnalysis } from '../commands/budget.js';
import type { CompareAnalysis } from '../commands/compare.js';
import type { AttributionDebugAnalysis } from '../commands/debug.js';
import type { InsightAnalysis } from '../commands/insights.js';
import type { LeaderboardAnalysis } from '../commands/leaderboard.js';
import type { RecommendationAnalysis } from '../commands/recommend.js';
import type { WasteAnalysis } from '../commands/waste.js';

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

function createAnalyses(): {
  budget: BudgetAnalysis;
  compare: CompareAnalysis;
  dataHealth: AttributionDebugAnalysis;
  insights: InsightAnalysis;
  waste: WasteAnalysis;
  recommend: RecommendationAnalysis;
  leaderboard: LeaderboardAnalysis;
} {
  return {
    budget: {
      sessionCount: 10,
      totalTokens: 1_000_000,
      spentCostUsd: 12.41,
      hasIncompleteCostCoverage: false,
      noData: false,
      daysElapsed: 10,
      daysInMonth: 30,
      averageDailyCostUsd: 1.241,
      projectedMonthEndCostUsd: 37.23,
      budgetLimitUsd: 30,
      statusLine: 'Projected over budget by $7.23 on a $30.00 monthly budget.',
    },
    compare: {
      current: {
        completedTaskCount: 10,
        matchedTaskCount: 10,
        hasIncompleteCostCoverage: false,
        totalCostUsd: 9.32,
        totalCommits: 9,
        totalLocChanged: 200,
        wasteCostUsd: 1.1,
      },
      previous: {
        completedTaskCount: 8,
        matchedTaskCount: 8,
        hasIncompleteCostCoverage: false,
        totalCostUsd: 12.41,
        totalCommits: 6,
        totalLocChanged: 120,
        wasteCostUsd: 4.2,
      },
      hasIncompleteCostCoverage: false,
      noCompletedTasks: false,
      currentPeriodEmpty: false,
      previousPeriodEmpty: false,
      noMatchedAiData: false,
      efficiencyMetric: {
        label: 'commits/$',
        previousValue: 2.1,
        currentValue: 3.4,
      },
      takeaway: 'You spent less and produced more Git output.',
    },
    dataHealth: {
      noLocalUsage: false,
      latestSessionCaptureAt: '2026-06-19T10:00:00.000Z',
      codexSessionCount: 12,
      claudeSessionCount: 1,
      unknownCostSessionCount: 0,
      trackedProjectCount: 1,
      untrackedProjectCount: 1,
      activeProjectCount: 0,
      recentCompletedTaskCount: 6,
      matchedRecentTaskCount: 4,
      unmatchedRecentTaskCount: 2,
      unmatchedNoProjectSessionsCount: 1,
      unmatchedOutsideWindowCount: 1,
      partialCostRecentTaskCount: 0,
      notes: ['1 scanned project still has usage without tracked tasks.'],
      onboardingSteps: ['Run agent-roi watch in active repos.'],
      sampleUnmatchedTasks: [
        {
          name: 'Task B',
          projectPath: '/workspace/app',
          endedAt: '2026-06-19T08:00:00.000Z',
          reason: 'This project has Codex sessions, but none landed inside the task time window.',
          projectSessionCount: 3,
          windowSessionCount: 0,
          unknownCostWindowSessionCount: 0,
        },
      ],
    },
    insights: {
      completedTaskCount: 18,
      matchedTaskCount: 18,
      hasIncompleteCostCoverage: false,
      costLines: ['Top 33% of tasks consumed 66% of AI cost.'],
      wasteLines: ['1 task consumed $8.32 with zero commits.'],
      efficiencyLines: ['Tasks under 45m produced 10.4x more commits per dollar than tasks over 2h.'],
      noMatchedAiData: false,
    },
    waste: {
      completedTaskCount: 18,
      matchedTaskCount: 18,
      hasIncompleteCostCoverage: false,
      noMatchedAiData: false,
      items: [
        {
          name: 'Refactor CSS',
          durationMinutes: 92,
          aiCostUsd: 5.42,
          totalTokens: 2_400_000,
          hasUnknownCost: false,
          commits: 0,
          filesChanged: 1,
          linesAdded: 30,
          linesRemoved: 10,
          locChanged: 40,
          reason: 'AI cost with no commits',
        },
      ],
      zeroCommitCount: 2,
      zeroCommitCostUsd: 8.63,
      highTokenLowOutputCount: 1,
    },
    recommend: {
      completedTaskCount: 18,
      matchedTaskCount: 18,
      hasIncompleteCostCoverage: false,
      noMatchedAiData: false,
      recommendations: [
        {
          title: 'Break Large Tasks',
          finding: 'Tasks under 45m produced 2.1x more commits per dollar than tasks over 2h.',
          action: 'Consider splitting large tasks into smaller units.',
        },
      ],
    },
    leaderboard: {
      completedTaskCount: 18,
      matchedTaskCount: 18,
      hasIncompleteCostCoverage: false,
      noMatchedAiData: false,
      mostExpensive: [
        {
          name: 'Refactor auth flow',
          durationMinutes: 120,
          aiCostUsd: 8.32,
          totalTokens: 2_000_000,
          hasUnknownCost: false,
          commits: 0,
          filesChanged: 1,
          linesAdded: 10,
          linesRemoved: 10,
          locChanged: 20,
        },
      ],
      mostEfficient: [
        {
          name: 'Fix purchase button',
          durationMinutes: 30,
          aiCostUsd: 0.42,
          totalTokens: 100_000,
          hasUnknownCost: false,
          commits: 2,
          filesChanged: 4,
          linesAdded: 50,
          linesRemoved: 20,
          locChanged: 70,
          metricLabel: 'LOC Per Dollar',
          metricValue: '167 LOC/$1',
          sortValue: 167,
        },
      ],
      leastEfficient: [
        {
          name: 'Refactor CSS',
          durationMinutes: 92,
          aiCostUsd: 5.42,
          totalTokens: 2_400_000,
          hasUnknownCost: false,
          commits: 0,
          filesChanged: 1,
          linesAdded: 30,
          linesRemoved: 10,
          locChanged: 40,
          reason: 'high cost with low output',
          sortValue: 999,
        },
      ],
    },
  };
}

function createProjects() {
  return [
    {
      projectPath: '/workspace/app',
      codexSessionCount: 3,
      completedTaskCount: 1,
      activeTaskCount: 0,
      aiCostUsd: 4.5,
      totalTokens: 1_250_000,
      lastSessionAt: '2026-06-19T09:00:00.000Z',
      note: null,
    },
    {
      projectPath: '/workspace/other-project',
      codexSessionCount: 2,
      completedTaskCount: 0,
      activeTaskCount: 0,
      aiCostUsd: 2.25,
      totalTokens: 800_000,
      lastSessionAt: '2026-06-18T09:00:00.000Z',
      note: 'AI usage found, but no tracked tasks yet',
    },
  ];
}

test('overview payload shows no local usage empty state', () => {
  const payload = loadOverviewPayload(createTestDb() as ReturnType<typeof import('../database/db.js').openDatabase>, {
    now: '2026-06-19T10:00:00.000Z',
  });

  assert.equal(payload.emptyState?.title, 'No local AI usage found.');
  assert.equal(payload.emptyState?.nextSteps[0], 'Run agent-roi scan');
});

test('overview payload shows no completed tasks empty state', () => {
  const db = createTestDb();
  upsertSessionRecords(db, [createSession()]);

  const payload = loadOverviewPayload(db as ReturnType<typeof import('../database/db.js').openDatabase>, {
    now: '2026-06-19T10:00:00.000Z',
  });

  assert.equal(payload.emptyState?.title, 'No completed tasks yet.');
  assert.match(payload.emptyState?.nextSteps.join(' ') ?? '', /watch/);
  db.close();
});

test('overview payload keeps budget visible when task data is unmatched', () => {
  const db = createTestDb();
  const task = createTask(db, {
    name: 'Unmatched Task',
    projectPath: '/workspace/app',
    startedAt: '2026-06-18T01:00:00.000Z',
  });
  completeTask(db, task.id, '2026-06-18T02:00:00.000Z');
  upsertSessionRecords(db, [createSession({ startedAt: '2026-06-10T01:10:00.000Z' })]);
  upsertSessionRecords(db, [createSession({ sessionId: 'session-2', projectPath: '/workspace/other-project', rawPath: '/tmp/session-2.jsonl' })]);

  const payload = loadOverviewPayload(db as ReturnType<typeof import('../database/db.js').openDatabase>, {
    now: '2026-06-19T10:00:00.000Z',
  });

  assert.equal(payload.emptyState, null);
  assert.equal(payload.compare.emptyReason, 'No matched Codex task data found.');
  assert.equal(payload.tasks.items[0]?.hasMatchedAiData, false);
  assert.equal(payload.tasks.items[0]?.aiCostUsd, null);
  assert.equal(payload.tasks.items[0]?.tokensLabel, 'N/A');
  assert.equal(payload.dataHealth.unmatchedRecentTaskCount, 1);
  assert.equal(payload.dataHealth.unmatchedOutsideWindowCount, 1);
  assert.equal(payload.projects.items.length, 2);
  assert.equal(payload.projects.items.some((item) => item.projectName === 'other-project'), true);
  assert.equal(
    payload.projects.items.find((item) => item.projectName === 'other-project')?.note,
    'AI usage found, but no tracked tasks yet',
  );
  db.close();
});

test('overview payload returns stable shape for populated analyses', () => {
  const payload = buildOverviewPayload({
    ...createAnalyses(),
    tasks: [
      {
        name: 'Task A',
        projectPath: '/workspace/app',
        durationMinutes: 45,
        aiCostUsd: 1.25,
        totalTokens: 2000,
        hasUnknownCost: false,
        commits: 2,
        filesChanged: 3,
        linesAdded: 20,
        linesRemoved: 10,
        locChanged: 30,
        endedAt: '2026-06-19T10:00:00.000Z',
      },
    ],
    projects: createProjects(),
    generatedAt: '2026-06-19T10:00:00.000Z',
  });

  assert.equal(payload.scope.localOnly, true);
  assert.equal(payload.compare.aiCost?.current, 9.32);
  assert.equal(payload.waste.items[0]?.name, 'Refactor CSS');
  assert.equal(payload.recommend.items[0]?.title, 'Break Large Tasks');
  assert.equal(payload.leaderboard.mostExpensive[0]?.name, 'Refactor auth flow');
  assert.equal(payload.tasks.items[0]?.hasMatchedAiData, true);
  assert.equal(payload.leaderboard.leastEfficient[0]?.name, 'Refactor CSS');
  assert.equal(payload.tasks.items[0]?.name, 'Task A');
  assert.equal(payload.projects.items[0]?.projectName, 'app');
  assert.equal(payload.projects.items[1]?.note, 'AI usage found, but no tracked tasks yet');
});

test('ui server serves index and overview api', async () => {
  const payload = buildOverviewPayload({
    ...createAnalyses(),
    tasks: [],
    projects: createProjects(),
    generatedAt: '2026-06-19T10:00:00.000Z',
  });

  const server = createUiServer(() => payload);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const htmlResponse = await fetch(new URL('/', baseUrl));
  const html = await htmlResponse.text();
  assert.match(html, /Agent ROI/);
  assert.match(html, /top-nav/);

  const scriptResponse = await fetch(new URL('/app.js', baseUrl));
  const script = await scriptResponse.text();
  assert.match(script, /Projects/);

  const apiResponse = await fetch(new URL('/api/overview', baseUrl));
  const json = await apiResponse.json() as OverviewPayload;
  assert.equal(json.compare.takeaway, 'You spent less and produced more Git output.');
  assert.equal(Array.isArray(json.tasks.items), true);
  assert.equal(Array.isArray(json.projects.items), true);

  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});
