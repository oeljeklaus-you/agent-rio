import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeBudget, buildBudgetOutput, type BudgetWindowSummary } from '../commands/budget.js';

function createBudgetSummary(overrides: Partial<BudgetWindowSummary> = {}): BudgetWindowSummary {
  return {
    sessionCount: 12,
    totalTokens: 1_200_000,
    knownCostUsd: 12.41,
    hasUnknownCost: false,
    ...overrides,
  };
}

test('no codex data prints a clear message', () => {
  const output = buildBudgetOutput(
    analyzeBudget(createBudgetSummary({ sessionCount: 0, totalTokens: 0, knownCostUsd: 0 }), {
      daysElapsed: 10,
      daysInMonth: 30,
      budgetLimitUsd: null,
    }),
  );

  assert.match(output, /No matched Codex spend found this month\./);
});

test('projection is calculated from month-to-date spend', () => {
  const output = buildBudgetOutput(
    analyzeBudget(createBudgetSummary({ knownCostUsd: 12.41 }), {
      daysElapsed: 10,
      daysInMonth: 30,
      budgetLimitUsd: null,
    }),
  );

  assert.match(output, /\$12\.41 spent this month/);
  assert.match(output, /\$37\.23 projected month-end spend/);
  assert.match(output, /\$1\.24\/day over 10 of 30 days/);
});

test('no monthly budget configured shows a hint', () => {
  const output = buildBudgetOutput(
    analyzeBudget(createBudgetSummary(), {
      daysElapsed: 10,
      daysInMonth: 30,
      budgetLimitUsd: null,
    }),
  );

  assert.match(output, /No monthly budget set\. Re-run with --budget <usd>\./);
});

test('under budget status is shown', () => {
  const output = buildBudgetOutput(
    analyzeBudget(createBudgetSummary({ knownCostUsd: 12.41 }), {
      daysElapsed: 10,
      daysInMonth: 30,
      budgetLimitUsd: 40,
    }),
  );

  assert.match(output, /On track for a \$40\.00 monthly budget\./);
});

test('over budget status is shown', () => {
  const output = buildBudgetOutput(
    analyzeBudget(createBudgetSummary({ knownCostUsd: 12.41 }), {
      daysElapsed: 10,
      daysInMonth: 30,
      budgetLimitUsd: 30,
    }),
  );

  assert.match(output, /Projected over budget by \$7\.23 on a \$30\.00 monthly budget\./);
});

test('zero cost does not crash', () => {
  const output = buildBudgetOutput(
    analyzeBudget(createBudgetSummary({ knownCostUsd: 0 }), {
      daysElapsed: 10,
      daysInMonth: 30,
      budgetLimitUsd: 25,
    }),
  );

  assert.match(output, /\$0\.00 spent this month/);
  assert.match(output, /\$0\.00 projected month-end spend/);
});

test('incomplete cost coverage is disclosed', () => {
  const output = buildBudgetOutput(
    analyzeBudget(createBudgetSummary({ hasUnknownCost: true }), {
      daysElapsed: 10,
      daysInMonth: 30,
      budgetLimitUsd: 40,
    }),
  );

  assert.match(output, /Some spend has incomplete cost coverage/);
});
