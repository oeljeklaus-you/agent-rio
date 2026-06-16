import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCompare, buildCompareOutput, type CompareTaskSummary } from '../commands/compare.js';

function createTaskSummary(overrides: Partial<CompareTaskSummary> = {}): CompareTaskSummary {
  return {
    name: 'Task',
    aiCostUsd: 1,
    totalTokens: 1000,
    hasUnknownCost: false,
    commits: 1,
    locChanged: 30,
    ...overrides,
  };
}

test('no completed tasks prints friendly guidance', () => {
  const output = buildCompareOutput(analyzeCompare([], []));

  assert.match(output, /Not enough data to compare yet\./);
});

test('current period no data is handled cleanly', () => {
  const output = buildCompareOutput(
    analyzeCompare(
      [createTaskSummary({ aiCostUsd: 4, commits: 2 })],
      [],
    ),
  );

  assert.match(output, /Current period has no completed tasks\./);
  assert.match(output, /Not enough data to compare yet\./);
});

test('previous period no data is handled cleanly', () => {
  const output = buildCompareOutput(
    analyzeCompare(
      [],
      [createTaskSummary({ aiCostUsd: 4, commits: 2 })],
    ),
  );

  assert.match(output, /Previous period has no completed tasks\./);
  assert.match(output, /Not enough data to compare yet\./);
});

test('cost decreased and commits increased', () => {
  const output = buildCompareOutput(
    analyzeCompare(
      [
        createTaskSummary({ aiCostUsd: 8, commits: 2, locChanged: 80 }),
        createTaskSummary({ aiCostUsd: 4.41, commits: 4, locChanged: 120 }),
      ],
      [
        createTaskSummary({ aiCostUsd: 5, commits: 4, locChanged: 160 }),
        createTaskSummary({ aiCostUsd: 4.32, commits: 5, locChanged: 200 }),
      ],
    ),
  );

  assert.match(output, /AI Cost: \$12\.41 → \$9\.32 \(-25%\)/);
  assert.match(output, /Commits: 6 → 9 \(\+50%\)/);
  assert.match(output, /You spent less and produced more Git output\./);
});

test('cost increased and commits decreased', () => {
  const output = buildCompareOutput(
    analyzeCompare(
      [
        createTaskSummary({ aiCostUsd: 4, commits: 5 }),
        createTaskSummary({ aiCostUsd: 3, commits: 4 }),
      ],
      [
        createTaskSummary({ aiCostUsd: 6, commits: 2 }),
        createTaskSummary({ aiCostUsd: 5, commits: 1 }),
      ],
    ),
  );

  assert.match(output, /AI Cost: \$7\.00 → \$11\.00 \(\+57%\)/);
  assert.match(output, /Commits: 9 → 3 \(-67%\)/);
  assert.match(output, /You spent more but produced less Git output\./);
});

test('waste cost decreased', () => {
  const output = buildCompareOutput(
    analyzeCompare(
      [
        createTaskSummary({ aiCostUsd: 4.2, commits: 0 }),
        createTaskSummary({ aiCostUsd: 2, commits: 2 }),
      ],
      [
        createTaskSummary({ aiCostUsd: 1.1, commits: 0 }),
        createTaskSummary({ aiCostUsd: 4, commits: 3 }),
      ],
    ),
  );

  assert.match(output, /Waste Cost: \$4\.20 → \$1\.10 \(-74%\)/);
});

test('efficiency comparison prefers commits per dollar when available', () => {
  const output = buildCompareOutput(
    analyzeCompare(
      [
        createTaskSummary({ aiCostUsd: 10, commits: 21, locChanged: 300 }),
      ],
      [
        createTaskSummary({ aiCostUsd: 10, commits: 34, locChanged: 400 }),
      ],
    ),
  );

  assert.match(output, /Efficiency: 2\.1 commits\/\$ → 3\.4 commits\/\$ \(\+62%\)/);
});

test('zero cost handling does not crash', () => {
  const output = buildCompareOutput(
    analyzeCompare(
      [
        createTaskSummary({ aiCostUsd: 0, commits: 1, locChanged: 30 }),
      ],
      [
        createTaskSummary({ aiCostUsd: 0, commits: 2, locChanged: 60 }),
      ],
    ),
  );

  assert.match(output, /AI Cost: \$0\.00 → \$0\.00 \(N\/A\)/);
  assert.doesNotMatch(output, /agent-roi compare failed/);
});

test('unknown cost does not crash', () => {
  const output = buildCompareOutput(
    analyzeCompare(
      [
        createTaskSummary({ aiCostUsd: 3, hasUnknownCost: true, commits: 1 }),
      ],
      [
        createTaskSummary({ aiCostUsd: 2, hasUnknownCost: false, commits: 2 }),
      ],
    ),
  );

  assert.match(output, /Some cost-based comparison excluded incomplete cost coverage/);
});

test('takeaway generation can combine multiple positive signals', () => {
  const output = buildCompareOutput(
    analyzeCompare(
      [
        createTaskSummary({ aiCostUsd: 8, commits: 1 }),
        createTaskSummary({ aiCostUsd: 4, commits: 0 }),
      ],
      [
        createTaskSummary({ aiCostUsd: 5, commits: 2 }),
        createTaskSummary({ aiCostUsd: 3, commits: 2 }),
        createTaskSummary({ aiCostUsd: 1, commits: 1 }),
      ],
    ),
  );

  assert.match(output, /You spent less, completed more tasks,/);
  assert.match(output, /reduced potential waste/);
});
