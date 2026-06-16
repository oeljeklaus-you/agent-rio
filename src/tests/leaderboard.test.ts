import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeLeaderboard, buildLeaderboardOutput, type LeaderboardTaskSummary } from '../commands/leaderboard.js';

function createLeaderboardTask(overrides: Partial<LeaderboardTaskSummary> = {}): LeaderboardTaskSummary {
  return {
    name: 'Task',
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

test('no completed tasks prints friendly guidance', () => {
  const output = buildLeaderboardOutput(analyzeLeaderboard([]));

  assert.match(output, /No completed tasks found\./);
  assert.match(output, /Start and stop a few tasks first\./);
});

test('no matched AI data is handled cleanly', () => {
  const output = buildLeaderboardOutput(
    analyzeLeaderboard([
      createLeaderboardTask({ totalTokens: 0, aiCostUsd: 0 }),
      createLeaderboardTask({ totalTokens: 0, aiCostUsd: 0, commits: 0, filesChanged: 0 }),
    ]),
  );

  assert.match(output, /No matched Codex task data in this window/);
  assert.doesNotMatch(output, /\nMost Expensive Tasks\n/);
});

test('most expensive ranking is sorted by cost desc', () => {
  const output = buildLeaderboardOutput(
    analyzeLeaderboard([
      createLeaderboardTask({ name: 'Debug Telepresence', aiCostUsd: 3.21, totalTokens: 1_200_000, durationMinutes: 47 }),
      createLeaderboardTask({ name: 'Refactor auth flow', aiCostUsd: 8.32, totalTokens: 2_100_000, durationMinutes: 134 }),
      createLeaderboardTask({ name: 'Fix purchase button', aiCostUsd: 0.42, totalTokens: 200_000, durationMinutes: 20 }),
    ]),
  );

  assert.match(output, /1\. Refactor auth flow/);
  assert.match(output, /2\. Debug Telepresence/);
});

test('most efficient ranking prefers commits per dollar', () => {
  const output = buildLeaderboardOutput(
    analyzeLeaderboard([
      createLeaderboardTask({ name: 'Fix purchase button', aiCostUsd: 0.42, commits: 2, filesChanged: 4, locChanged: 80 }),
      createLeaderboardTask({ name: 'Ship API', aiCostUsd: 1.2, commits: 2, filesChanged: 3, locChanged: 120 }),
      createLeaderboardTask({ name: 'Clean config', aiCostUsd: 0.8, commits: 1, filesChanged: 2, locChanged: 40 }),
    ]),
  );

  assert.match(output, /Most Efficient Tasks/);
  assert.match(output, /1\. Fix purchase button/);
  assert.match(output, /Cost Per Commit: \$0\.21/);
});

test('least efficient ranking shows low output reasons', () => {
  const output = buildLeaderboardOutput(
    analyzeLeaderboard([
      createLeaderboardTask({ name: 'Refactor CSS', aiCostUsd: 5.42, commits: 0, filesChanged: 1, locChanged: 20, totalTokens: 2_400_000 }),
      createLeaderboardTask({ name: 'Debug Telepresence', aiCostUsd: 3.21, commits: 0, filesChanged: 0, locChanged: 0, totalTokens: 1_200_000 }),
    ]),
  );

  assert.match(output, /Least Efficient Tasks/);
  assert.match(output, /1\. Refactor CSS/);
  assert.match(output, /Reason: high cost with low output/);
});

test('hides empty sections', () => {
  const output = buildLeaderboardOutput(
    analyzeLeaderboard([
      createLeaderboardTask({ name: 'Useful task', aiCostUsd: 1.2, commits: 2, filesChanged: 3, locChanged: 100 }),
      createLeaderboardTask({ name: 'Another useful task', aiCostUsd: 1.5, commits: 1, filesChanged: 4, locChanged: 140 }),
    ]),
  );

  assert.doesNotMatch(output, /\nLeast Efficient Tasks\n/);
});

test('limits each section to 5 items', () => {
  const output = buildLeaderboardOutput(
    analyzeLeaderboard(
      Array.from({ length: 7 }, (_, index) =>
        createLeaderboardTask({
          name: `Task ${index + 1}`,
          aiCostUsd: 20 - index,
          commits: index % 2 === 0 ? 0 : 2,
          filesChanged: index % 2 === 0 ? 1 : 3,
          locChanged: index % 2 === 0 ? 10 : 100,
          totalTokens: 500_000 + index,
        }),
      ),
    ),
  );

  assert.match(output, /5\. Task 5/);
  assert.doesNotMatch(output, /6\. Task 6[\s\S]*6\. Task 6/);
});

test('unknown cost does not crash', () => {
  const output = buildLeaderboardOutput(
    analyzeLeaderboard([
      createLeaderboardTask({ name: 'Unknown cost task', aiCostUsd: null, hasUnknownCost: true, commits: 0, filesChanged: 0, locChanged: 0 }),
      createLeaderboardTask({ name: 'Known cost task', aiCostUsd: 2, commits: 1, filesChanged: 2, locChanged: 60, totalTokens: 600_000 }),
    ]),
  );

  assert.match(output, /Some rankings excluded incomplete cost coverage/);
  assert.match(output, /Known cost task/);
});
