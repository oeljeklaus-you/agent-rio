import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeRecommend, buildRecommendOutput, type RecommendationTaskSummary } from '../commands/recommend.js';

function createRecommendationTask(overrides: Partial<RecommendationTaskSummary> = {}): RecommendationTaskSummary {
  return {
    name: 'Task',
    projectPath: '/workspace/default',
    durationMinutes: 60,
    aiCostUsd: 1,
    totalTokens: 1000,
    hasUnknownCost: false,
    commits: 1,
    filesChanged: 2,
    linesAdded: 20,
    linesRemoved: 10,
    locChanged: 30,
    ...overrides,
  };
}

test('no completed tasks shows onboarding message', () => {
  const output = buildRecommendOutput(analyzeRecommend([]));

  assert.match(output, /Not enough task data\./);
  assert.match(output, /Start and complete a few tasks first\./);
});

test('no matched AI data shows a clear message', () => {
  const output = buildRecommendOutput(
    analyzeRecommend([
      createRecommendationTask({ totalTokens: 0, aiCostUsd: 0 }),
      createRecommendationTask({ totalTokens: 0, aiCostUsd: 0, commits: 0 }),
    ]),
  );

  assert.match(output, /No matched Codex task data found\./);
});

test('break large tasks recommendation is generated', () => {
  const output = buildRecommendOutput(
    analyzeRecommend([
      createRecommendationTask({ durationMinutes: 30, aiCostUsd: 1, commits: 3 }),
      createRecommendationTask({ durationMinutes: 35, aiCostUsd: 1, commits: 2 }),
      createRecommendationTask({ durationMinutes: 40, aiCostUsd: 2, commits: 3 }),
      createRecommendationTask({ durationMinutes: 150, aiCostUsd: 2, commits: 1 }),
      createRecommendationTask({ durationMinutes: 160, aiCostUsd: 2, commits: 1 }),
      createRecommendationTask({ durationMinutes: 180, aiCostUsd: 4, commits: 1 }),
    ]),
  );

  assert.match(output, /1\. Break Large Tasks/);
  assert.match(output, /Consider splitting large tasks into smaller units\./);
});

test('review expensive tasks recommendation is generated', () => {
  const output = buildRecommendOutput(
    analyzeRecommend([
      createRecommendationTask({ aiCostUsd: 10 }),
      createRecommendationTask({ aiCostUsd: 1 }),
      createRecommendationTask({ aiCostUsd: 1 }),
      createRecommendationTask({ aiCostUsd: 1 }),
      createRecommendationTask({ aiCostUsd: 1 }),
    ]),
  );

  assert.match(output, /Review Expensive Tasks/);
  assert.match(output, /Review the most expensive tasks for repeated patterns\./);
});

test('investigate waste recommendation is generated', () => {
  const output = buildRecommendOutput(
    analyzeRecommend([
      createRecommendationTask({ aiCostUsd: 8, commits: 0 }),
      createRecommendationTask({ aiCostUsd: 2, commits: 1 }),
    ]),
  );

  assert.match(output, /Investigate Potential Waste/);
  assert.match(output, /Review whether those tasks were debugging, research, or abandoned work\./);
});

test('review prompting strategy recommendation is generated', () => {
  const output = buildRecommendOutput(
    analyzeRecommend([
      createRecommendationTask({ projectPath: '/workspace/a', totalTokens: 2_000_000, locChanged: 20 }),
      createRecommendationTask({ projectPath: '/workspace/b', totalTokens: 1_800_000, locChanged: 25 }),
      createRecommendationTask({ projectPath: '/workspace/c', totalTokens: 1_600_000, locChanged: 15 }),
    ]),
  );

  assert.match(output, /Review Prompting Strategy/);
  assert.match(output, /3 tasks used high tokens with low output\./);
});

test('project concentration recommendation is generated', () => {
  const output = buildRecommendOutput(
    analyzeRecommend([
      createRecommendationTask({ projectPath: '/workspace/core-app', aiCostUsd: 8 }),
      createRecommendationTask({ projectPath: '/workspace/core-app', aiCostUsd: 4 }),
      createRecommendationTask({ projectPath: '/workspace/side-tool', aiCostUsd: 1 }),
    ]),
  );

  assert.match(output, /Project Concentration Risk/);
  assert.match(output, /core-app consumed 92% of recent AI cost\./);
});

test('max 5 recommendations are shown', () => {
  const output = buildRecommendOutput(
    analyzeRecommend([
      createRecommendationTask({ projectPath: '/workspace/core-app', durationMinutes: 30, aiCostUsd: 10, commits: 4, totalTokens: 2_000_000, locChanged: 15 }),
      createRecommendationTask({ projectPath: '/workspace/core-app', durationMinutes: 35, aiCostUsd: 1, commits: 2, totalTokens: 1_800_000, locChanged: 15 }),
      createRecommendationTask({ projectPath: '/workspace/core-app', durationMinutes: 40, aiCostUsd: 1, commits: 2, totalTokens: 1_600_000, locChanged: 15 }),
      createRecommendationTask({ projectPath: '/workspace/core-app', durationMinutes: 55, aiCostUsd: 4, commits: 0, totalTokens: 220_000, locChanged: 10 }),
      createRecommendationTask({ projectPath: '/workspace/core-app', durationMinutes: 150, aiCostUsd: 2, commits: 1, totalTokens: 200_000, locChanged: 200 }),
      createRecommendationTask({ projectPath: '/workspace/other', durationMinutes: 160, aiCostUsd: 2, commits: 1, totalTokens: 190_000, locChanged: 210 }),
      createRecommendationTask({ projectPath: '/workspace/other', durationMinutes: 180, aiCostUsd: 4, commits: 1, totalTokens: 180_000, locChanged: 220 }),
      createRecommendationTask({ projectPath: '/workspace/other', durationMinutes: 70, aiCostUsd: 1, commits: 1, totalTokens: 170_000, locChanged: 180 }),
    ]),
  );

  const recommendationCount = output.match(/^\d+\./gm)?.length ?? 0;
  assert.equal(recommendationCount, 5);
});

test('at least one recommendation is shown when data exists', () => {
  const output = buildRecommendOutput(
    analyzeRecommend([
      createRecommendationTask({ aiCostUsd: 1.2, commits: 2, locChanged: 100, totalTokens: 150_000 }),
      createRecommendationTask({ aiCostUsd: 1.5, commits: 1, locChanged: 120, totalTokens: 180_000 }),
    ]),
  );

  assert.match(output, /1\./);
});
