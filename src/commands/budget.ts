import chalk from 'chalk';
import { getSessionSummaryForSource, openDatabase } from '../database/db.js';
import { formatInteger, formatUsd } from '../utils/format.js';
import { getUtcDayOfMonth, getUtcDaysInMonth, nowIso, startOfMonthIso } from '../utils/time.js';

type BudgetWindowSummary = {
  sessionCount: number;
  totalTokens: number;
  knownCostUsd: number;
  hasUnknownCost: boolean;
};

type BudgetAnalysis = {
  sessionCount: number;
  totalTokens: number;
  spentCostUsd: number;
  hasIncompleteCostCoverage: boolean;
  noData: boolean;
  daysElapsed: number;
  daysInMonth: number;
  averageDailyCostUsd: number;
  projectedMonthEndCostUsd: number;
  budgetLimitUsd: number | null;
  statusLine: string;
};

type BudgetOptions = {
  budget?: number;
};

export async function runBudgetCommand(options: BudgetOptions = {}): Promise<void> {
  let db: ReturnType<typeof openDatabase> | null = null;

  try {
    db = openDatabase();
    const now = nowIso();
    const fromIso = startOfMonthIso(now);
    const summary = getSessionSummaryForSource(db, 'codex', 'started_at', fromIso, now);

    console.log(
      buildBudgetOutput(
        analyzeBudget(
          {
            sessionCount: summary.count,
            totalTokens: summary.totalTokens,
            knownCostUsd: summary.costUsd ?? 0,
            hasUnknownCost: summary.unknownCount > 0,
          },
          {
            daysElapsed: getUtcDayOfMonth(now),
            daysInMonth: getUtcDaysInMonth(now),
            budgetLimitUsd: normalizeBudgetOption(options.budget),
          },
        ),
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown budget failure';
    console.error(chalk.red(`agent-roi budget failed: ${message}`));
    process.exitCode = 1;
  } finally {
    db?.close();
  }
}

export function analyzeBudget(
  summary: BudgetWindowSummary,
  input: {
    daysElapsed: number;
    daysInMonth: number;
    budgetLimitUsd: number | null;
  },
): BudgetAnalysis {
  const daysElapsed = Math.max(1, input.daysElapsed);
  const daysInMonth = Math.max(daysElapsed, input.daysInMonth);
  const noData = summary.sessionCount === 0;
  const spentCostUsd = summary.knownCostUsd;
  const averageDailyCostUsd = noData ? 0 : spentCostUsd / daysElapsed;
  const projectedMonthEndCostUsd = noData ? 0 : averageDailyCostUsd * daysInMonth;

  return {
    sessionCount: summary.sessionCount,
    totalTokens: summary.totalTokens,
    spentCostUsd,
    hasIncompleteCostCoverage: summary.hasUnknownCost,
    noData,
    daysElapsed,
    daysInMonth,
    averageDailyCostUsd,
    projectedMonthEndCostUsd,
    budgetLimitUsd: input.budgetLimitUsd,
    statusLine: buildStatusLine(projectedMonthEndCostUsd, input.budgetLimitUsd),
  };
}

export function buildBudgetOutput(analysis: BudgetAnalysis): string {
  const lines = [chalk.bold('Budget (This Month)'), '', 'Scope', '- Codex only', '- Claude snapshots excluded'];

  if (analysis.noData) {
    lines.push('');
    lines.push('No matched Codex spend found this month.');
    return lines.join('\n');
  }

  lines.push('');
  lines.push('Spend');
  lines.push(`- ${formatUsd(analysis.spentCostUsd)} spent this month`);
  lines.push(`- ${formatInteger(analysis.sessionCount)} Codex sessions`);
  lines.push(`- ${formatCompactTokens(analysis.totalTokens)} tokens`);

  lines.push('');
  lines.push('Projection');
  lines.push(`- ${formatUsd(analysis.projectedMonthEndCostUsd)} projected month-end spend`);
  lines.push(`- ${formatUsd(analysis.averageDailyCostUsd)}/day over ${formatInteger(analysis.daysElapsed)} of ${formatInteger(analysis.daysInMonth)} days`);

  if (analysis.hasIncompleteCostCoverage) {
    lines.push('- Some spend has incomplete cost coverage');
  }

  lines.push('');
  lines.push('Status');
  lines.push(`- ${analysis.statusLine}`);

  return lines.join('\n');
}

function buildStatusLine(projectedMonthEndCostUsd: number, budgetLimitUsd: number | null): string {
  if (budgetLimitUsd === null) {
    return 'No monthly budget set. Re-run with --budget <usd>.';
  }

  if (projectedMonthEndCostUsd > budgetLimitUsd) {
    return `Projected over budget by ${formatUsd(projectedMonthEndCostUsd - budgetLimitUsd)} on a ${formatUsd(budgetLimitUsd)} monthly budget.`;
  }

  return `On track for a ${formatUsd(budgetLimitUsd)} monthly budget.`;
}

function normalizeBudgetOption(value: number | undefined): number | null {
  if (value === undefined || value === null || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function formatCompactTokens(value: number): string {
  if (value >= 1_000_000) {
    return `${trimTrailingZeros((value / 1_000_000).toFixed(1))}M`;
  }

  if (value >= 1_000) {
    return `${trimTrailingZeros((value / 1_000).toFixed(1))}k`;
  }

  return formatInteger(value);
}

function trimTrailingZeros(value: string): string {
  return value.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

export type { BudgetAnalysis, BudgetOptions, BudgetWindowSummary };
