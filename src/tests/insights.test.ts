import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeInsights, buildInsightsOutput, type InsightTaskSummary } from '../commands/insights.js';

function createTaskSummary(overrides: Partial<InsightTaskSummary> = {}): InsightTaskSummary {
  return {
    name: 'Task',
    durationMinutes: 60,
    aiCostUsd: 1,
    totalTokens: 1000,
    hasUnknownCost: false,
    commits: 1,
    linesAdded: 20,
    linesRemoved: 10,
    locChanged: 30,
    ...overrides,
  };
}

test('no completed tasks prints friendly guidance', () => {
  const output = buildInsightsOutput(analyzeInsights([]));

  assert.match(output, /No completed tasks found\./);
  assert.match(output, /Start and stop a few tasks first\./);
});

test('no matched AI data is handled cleanly', () => {
  const output = buildInsightsOutput(
    analyzeInsights([
      createTaskSummary({ totalTokens: 0, aiCostUsd: 0, commits: 0, locChanged: 0 }),
      createTaskSummary({ totalTokens: 0, aiCostUsd: 0, commits: 2, locChanged: 100 }),
    ]),
  );

  assert.match(output, /No matched Codex task data in this window/);
  assert.doesNotMatch(output, /\nCost\n/);
});

test('cost concentration is shown for concentrated spend', () => {
  const output = buildInsightsOutput(
    analyzeInsights([
      createTaskSummary({ name: 'A', aiCostUsd: 10 }),
      createTaskSummary({ name: 'B', aiCostUsd: 1 }),
      createTaskSummary({ name: 'C', aiCostUsd: 1 }),
      createTaskSummary({ name: 'D', aiCostUsd: 1 }),
      createTaskSummary({ name: 'E', aiCostUsd: 1 }),
    ]),
  );

  assert.match(output, /Top 20% of tasks consumed 71% of AI cost\./);
});

test('most expensive task is shown', () => {
  const output = buildInsightsOutput(
    analyzeInsights([
      createTaskSummary({ name: 'Cheap task', aiCostUsd: 1 }),
      createTaskSummary({ name: 'Expensive task', aiCostUsd: 8.32, durationMinutes: 134 }),
    ]),
  );

  assert.match(output, /Most expensive task: "Expensive task" - \$8\.32 in 2h 14m\./);
});

test('zero commit tasks are highlighted', () => {
  const output = buildInsightsOutput(
    analyzeInsights([
      createTaskSummary({ aiCostUsd: 4, commits: 0 }),
      createTaskSummary({ aiCostUsd: 8.41, commits: 0 }),
      createTaskSummary({ aiCostUsd: 1, commits: 1 }),
    ]),
  );

  assert.match(output, /2 tasks consumed \$12\.41 with zero commits\./);
});

test('high-token low-output tasks are highlighted', () => {
  const output = buildInsightsOutput(
    analyzeInsights([
      createTaskSummary({ name: 'A', totalTokens: 2_200_000, locChanged: 10, linesAdded: 10, linesRemoved: 0 }),
      createTaskSummary({ name: 'B', totalTokens: 1_900_000, locChanged: 20, linesAdded: 20, linesRemoved: 0 }),
      createTaskSummary({ name: 'C', totalTokens: 200_000, locChanged: 200, linesAdded: 200, linesRemoved: 0 }),
      createTaskSummary({ name: 'D', totalTokens: 180_000, locChanged: 250, linesAdded: 250, linesRemoved: 0 }),
    ]),
  );

  assert.match(output, /2 tasks used 1\.9M\+ tokens each but changed 20 lines or fewer\./);
});

test('short vs long efficiency comparison uses commits per dollar when available', () => {
  const output = buildInsightsOutput(
    analyzeInsights([
      createTaskSummary({ durationMinutes: 30, aiCostUsd: 1, commits: 3 }),
      createTaskSummary({ durationMinutes: 35, aiCostUsd: 1, commits: 2 }),
      createTaskSummary({ durationMinutes: 40, aiCostUsd: 2, commits: 3 }),
      createTaskSummary({ durationMinutes: 150, aiCostUsd: 2, commits: 1 }),
      createTaskSummary({ durationMinutes: 160, aiCostUsd: 2, commits: 1 }),
      createTaskSummary({ durationMinutes: 180, aiCostUsd: 4, commits: 1 }),
    ]),
  );

  assert.match(output, /Tasks under 45m produced 5\.3x more commits per dollar than tasks over 2h\./);
});

test('best duration bucket is selected from sufficient samples', () => {
  const output = buildInsightsOutput(
    analyzeInsights([
      createTaskSummary({ durationMinutes: 35, aiCostUsd: 1, commits: 2 }),
      createTaskSummary({ durationMinutes: 40, aiCostUsd: 1, commits: 2 }),
      createTaskSummary({ durationMinutes: 50, aiCostUsd: 1, commits: 2 }),
      createTaskSummary({ durationMinutes: 80, aiCostUsd: 2, commits: 1 }),
      createTaskSummary({ durationMinutes: 90, aiCostUsd: 2, commits: 1 }),
      createTaskSummary({ durationMinutes: 100, aiCostUsd: 2, commits: 1 }),
    ]),
  );

  assert.match(output, /Best duration bucket: 30m-60m\./);
});

test('insufficient samples hide efficiency insights', () => {
  const output = buildInsightsOutput(
    analyzeInsights([
      createTaskSummary({ durationMinutes: 30 }),
      createTaskSummary({ durationMinutes: 150 }),
      createTaskSummary({ durationMinutes: 160 }),
    ]),
  );

  assert.doesNotMatch(output, /\nEfficiency\n/);
});

test('incomplete cost coverage is disclosed and excluded from cost-based insights', () => {
  const output = buildInsightsOutput(
    analyzeInsights([
      createTaskSummary({ name: 'Known', aiCostUsd: 2, hasUnknownCost: false }),
      createTaskSummary({ name: 'Partial', aiCostUsd: 1, hasUnknownCost: true }),
      createTaskSummary({ name: 'Known 2', aiCostUsd: 3, hasUnknownCost: false }),
    ]),
  );

  assert.match(output, /Some cost-based insights excluded incomplete cost coverage/);
  assert.doesNotMatch(output, /Most expensive task: "Partial"/);
});
