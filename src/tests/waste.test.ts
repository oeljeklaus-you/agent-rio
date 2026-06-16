import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeWaste, buildWasteOutput, type WasteTaskSummary } from '../commands/waste.js';

function createWasteTask(overrides: Partial<WasteTaskSummary> = {}): WasteTaskSummary {
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
  const output = buildWasteOutput(analyzeWaste([]));

  assert.match(output, /No completed tasks found\./);
  assert.match(output, /Start and stop a few tasks first\./);
});

test('no matched AI data is handled cleanly', () => {
  const output = buildWasteOutput(
    analyzeWaste([
      createWasteTask({ totalTokens: 0, aiCostUsd: 0 }),
      createWasteTask({ totalTokens: 0, aiCostUsd: 0, commits: 0, filesChanged: 0 }),
    ]),
  );

  assert.match(output, /No matched Codex task data in this window/);
  assert.doesNotMatch(output, /Potential Waste\n\n1\./);
});

test('detects zero git output', () => {
  const output = buildWasteOutput(
    analyzeWaste([
      createWasteTask({
        name: 'Debug Telepresence',
        aiCostUsd: 3.21,
        durationMinutes: 47,
        totalTokens: 1_200_000,
        commits: 0,
        filesChanged: 0,
        locChanged: 0,
        linesAdded: 0,
        linesRemoved: 0,
      }),
    ]),
  );

  assert.match(output, /1\. Debug Telepresence/);
  assert.match(output, /Reason: AI cost with no Git output/);
});

test('detects zero commit waste', () => {
  const output = buildWasteOutput(
    analyzeWaste([
      createWasteTask({
        name: 'Refactor CSS',
        aiCostUsd: 5.42,
        totalTokens: 900_000,
        commits: 0,
        filesChanged: 1,
        locChanged: 45,
      }),
    ]),
  );

  assert.match(output, /Reason: AI cost with no commits/);
  assert.match(output, /1 task consumed \$5\.42 with zero commits\./);
});

test('detects high token low output', () => {
  const output = buildWasteOutput(
    analyzeWaste([
      createWasteTask({ name: 'A', totalTokens: 2_400_000, locChanged: 20, filesChanged: 1, commits: 1 }),
      createWasteTask({ name: 'B', totalTokens: 1_200_000, locChanged: 25, filesChanged: 1, commits: 1 }),
      createWasteTask({ name: 'C', totalTokens: 200_000, locChanged: 200, filesChanged: 4, commits: 2 }),
      createWasteTask({ name: 'D', totalTokens: 180_000, locChanged: 220, filesChanged: 5, commits: 2 }),
    ]),
  );

  assert.match(output, /Reason: High token usage with low code output/);
  assert.match(output, /1 task used high tokens with low output\./);
});

test('detects long running low output', () => {
  const output = buildWasteOutput(
    analyzeWaste([
      createWasteTask({
        name: 'Long Investigation',
        durationMinutes: 150,
        totalTokens: 300_000,
        commits: 1,
        filesChanged: 1,
        locChanged: 30,
      }),
    ]),
  );

  assert.match(output, /Reason: Long running task with low output/);
});

test('no waste found prints a clean message', () => {
  const output = buildWasteOutput(
    analyzeWaste([
      createWasteTask({ aiCostUsd: 1.5, totalTokens: 150_000, commits: 2, filesChanged: 3, locChanged: 140 }),
      createWasteTask({ aiCostUsd: 2, totalTokens: 180_000, commits: 2, filesChanged: 4, locChanged: 180 }),
    ]),
  );

  assert.match(output, /No obvious waste patterns found\./);
});

test('limits output to 10 items', () => {
  const output = buildWasteOutput(
    analyzeWaste(
      Array.from({ length: 12 }, (_, index) =>
        createWasteTask({
          name: `Task ${index + 1}`,
          aiCostUsd: 20 - index,
          totalTokens: 1_000_000 + index,
          commits: 0,
          filesChanged: 0,
          locChanged: 0,
          linesAdded: 0,
          linesRemoved: 0,
        }),
      ),
    ),
  );

  assert.match(output, /10\. Task 10/);
  assert.doesNotMatch(output, /11\. Task 11/);
});

test('unknown cost does not crash', () => {
  const output = buildWasteOutput(
    analyzeWaste([
      createWasteTask({ name: 'Unknown cost task', aiCostUsd: null, hasUnknownCost: true, commits: 0, filesChanged: 0, locChanged: 0 }),
      createWasteTask({ name: 'Known cost task', aiCostUsd: 2, commits: 0, filesChanged: 0, locChanged: 0, totalTokens: 600_000 }),
    ]),
  );

  assert.match(output, /Some tasks have incomplete cost coverage/);
  assert.match(output, /Known cost task/);
});
