import chalk from 'chalk';
import { listCompletedTasksInWindow, openDatabase } from '../database/db.js';
import { formatInteger, formatUsd } from '../utils/format.js';
import { addDays, daysAgoIso, nowIso } from '../utils/time.js';
import { summarizeTaskWindow } from './task.js';

type CompareTaskSummary = {
  name: string;
  aiCostUsd: number | null;
  totalTokens: number;
  hasUnknownCost: boolean;
  commits: number;
  locChanged: number;
};

type ComparePeriodMetrics = {
  completedTaskCount: number;
  matchedTaskCount: number;
  hasIncompleteCostCoverage: boolean;
  totalCostUsd: number;
  totalCommits: number;
  totalLocChanged: number;
  wasteCostUsd: number;
};

type EfficiencyMetric = {
  label: 'commits/$' | 'LOC/$1';
  previousValue: number;
  currentValue: number;
};

type CompareAnalysis = {
  current: ComparePeriodMetrics;
  previous: ComparePeriodMetrics;
  hasIncompleteCostCoverage: boolean;
  noCompletedTasks: boolean;
  currentPeriodEmpty: boolean;
  previousPeriodEmpty: boolean;
  noMatchedAiData: boolean;
  efficiencyMetric: EfficiencyMetric | null;
  takeaway: string;
};

export async function runCompareCommand(): Promise<void> {
  let db: ReturnType<typeof openDatabase> | null = null;

  try {
    db = openDatabase();
    const currentToIso = nowIso();
    const currentFromIso = daysAgoIso(7);
    const previousFromIso = daysAgoIso(14);
    const previousToIso = addDays(previousFromIso, 7);

    const currentTasks = listCompletedTasksInWindow(db, currentFromIso, currentToIso);
    const previousTasks = listCompletedTasksInWindow(db, previousFromIso, previousToIso);

    const currentSummaries = currentTasks.map((task) => {
      const summary = summarizeTaskWindow(db!, task);
      return {
        name: task.name,
        aiCostUsd: summary.aiCostUsd,
        totalTokens: summary.totalTokens,
        hasUnknownCost: summary.hasUnknownCost,
        commits: summary.gitMetrics.commitCount,
        locChanged: summary.gitMetrics.linesAdded + summary.gitMetrics.linesRemoved,
      } satisfies CompareTaskSummary;
    });

    const previousSummaries = previousTasks.map((task) => {
      const summary = summarizeTaskWindow(db!, task);
      return {
        name: task.name,
        aiCostUsd: summary.aiCostUsd,
        totalTokens: summary.totalTokens,
        hasUnknownCost: summary.hasUnknownCost,
        commits: summary.gitMetrics.commitCount,
        locChanged: summary.gitMetrics.linesAdded + summary.gitMetrics.linesRemoved,
      } satisfies CompareTaskSummary;
    });

    console.log(buildCompareOutput(analyzeCompare(previousSummaries, currentSummaries)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown compare failure';
    console.error(chalk.red(`agent-roi compare failed: ${message}`));
    process.exitCode = 1;
  } finally {
    db?.close();
  }
}

export function analyzeCompare(previousTasks: CompareTaskSummary[], currentTasks: CompareTaskSummary[]): CompareAnalysis {
  const previous = analyzePeriod(previousTasks);
  const current = analyzePeriod(currentTasks);
  const noCompletedTasks = previous.completedTaskCount === 0 && current.completedTaskCount === 0;
  const currentPeriodEmpty = current.completedTaskCount === 0;
  const previousPeriodEmpty = previous.completedTaskCount === 0;
  const noMatchedAiData = previous.matchedTaskCount === 0 && current.matchedTaskCount === 0;
  const efficiencyMetric = noCompletedTasks || currentPeriodEmpty || previousPeriodEmpty || noMatchedAiData
    ? null
    : buildEfficiencyMetric(previous, current);

  return {
    current,
    previous,
    hasIncompleteCostCoverage: previous.hasIncompleteCostCoverage || current.hasIncompleteCostCoverage,
    noCompletedTasks,
    currentPeriodEmpty,
    previousPeriodEmpty,
    noMatchedAiData,
    efficiencyMetric,
    takeaway: buildTakeaway(previous, current, efficiencyMetric),
  };
}

export function buildCompareOutput(analysis: CompareAnalysis): string {
  const lines = [chalk.bold('Compare'), '', 'Current Period:', 'Last 7 Days', '', 'Previous Period:', 'Previous 7 Days', ''];

  if (analysis.noCompletedTasks) {
    lines.push('Not enough data to compare yet.');
    return lines.join('\n');
  }

  if (analysis.currentPeriodEmpty) {
    lines.push('Current period has no completed tasks.');
    lines.push('Not enough data to compare yet.');
    return lines.join('\n');
  }

  if (analysis.previousPeriodEmpty) {
    lines.push('Previous period has no completed tasks.');
    lines.push('Not enough data to compare yet.');
    return lines.join('\n');
  }

  if (analysis.noMatchedAiData) {
    lines.push('No matched Codex task data found.');
    return lines.join('\n');
  }

  lines.push('Summary');
  lines.push(`- AI Cost: ${formatUsd(analysis.previous.totalCostUsd)} → ${formatUsd(analysis.current.totalCostUsd)} (${formatChangePercent(analysis.previous.totalCostUsd, analysis.current.totalCostUsd)})`);
  lines.push(`- Tasks: ${formatInteger(analysis.previous.completedTaskCount)} → ${formatInteger(analysis.current.completedTaskCount)} (${formatChangePercent(analysis.previous.completedTaskCount, analysis.current.completedTaskCount)})`);
  lines.push(`- Commits: ${formatInteger(analysis.previous.totalCommits)} → ${formatInteger(analysis.current.totalCommits)} (${formatChangePercent(analysis.previous.totalCommits, analysis.current.totalCommits)})`);
  lines.push(`- Waste Cost: ${formatUsd(analysis.previous.wasteCostUsd)} → ${formatUsd(analysis.current.wasteCostUsd)} (${formatChangePercent(analysis.previous.wasteCostUsd, analysis.current.wasteCostUsd)})`);

  if (analysis.efficiencyMetric) {
    lines.push(
      `- Efficiency: ${formatEfficiencyValue(analysis.efficiencyMetric.label, analysis.efficiencyMetric.previousValue)} → ${formatEfficiencyValue(analysis.efficiencyMetric.label, analysis.efficiencyMetric.currentValue)} (${formatChangePercent(analysis.efficiencyMetric.previousValue, analysis.efficiencyMetric.currentValue)})`,
    );
  }

  if (analysis.hasIncompleteCostCoverage) {
    lines.push('- Some cost-based comparison excluded incomplete cost coverage');
  }

  lines.push('');
  lines.push('Takeaway:');
  lines.push(analysis.takeaway);

  return lines.join('\n');
}

function analyzePeriod(tasks: CompareTaskSummary[]): ComparePeriodMetrics {
  const matchedTasks = tasks.filter((task) => task.totalTokens > 0);
  const knownCostTasks = matchedTasks.filter((task) => task.aiCostUsd !== null && !task.hasUnknownCost);

  return {
    completedTaskCount: tasks.length,
    matchedTaskCount: matchedTasks.length,
    hasIncompleteCostCoverage: tasks.some((task) => task.hasUnknownCost),
    totalCostUsd: sum(knownCostTasks.map((task) => task.aiCostUsd ?? 0)),
    totalCommits: sum(matchedTasks.map((task) => task.commits)),
    totalLocChanged: sum(matchedTasks.map((task) => task.locChanged)),
    wasteCostUsd: sum(knownCostTasks.filter((task) => task.commits === 0).map((task) => task.aiCostUsd ?? 0)),
  };
}

function buildEfficiencyMetric(previous: ComparePeriodMetrics, current: ComparePeriodMetrics): EfficiencyMetric | null {
  if (previous.totalCostUsd <= 0 || current.totalCostUsd <= 0) {
    return buildLocEfficiencyMetric(previous, current);
  }

  const totalCommits = previous.totalCommits + current.totalCommits;
  if (previous.totalCommits > 0 && current.totalCommits > 0 && totalCommits >= 3) {
    return {
      label: 'commits/$',
      previousValue: previous.totalCommits / previous.totalCostUsd,
      currentValue: current.totalCommits / current.totalCostUsd,
    };
  }

  return buildLocEfficiencyMetric(previous, current);
}

function buildLocEfficiencyMetric(previous: ComparePeriodMetrics, current: ComparePeriodMetrics): EfficiencyMetric | null {
  if (previous.totalCostUsd <= 0 || current.totalCostUsd <= 0) {
    return null;
  }

  return {
    label: 'LOC/$1',
    previousValue: previous.totalLocChanged / previous.totalCostUsd,
    currentValue: current.totalLocChanged / current.totalCostUsd,
  };
}

function buildTakeaway(
  previous: ComparePeriodMetrics,
  current: ComparePeriodMetrics,
  efficiencyMetric: EfficiencyMetric | null,
): string {
  if (previous.completedTaskCount === 0 || current.completedTaskCount === 0) {
    return 'Not enough data to compare yet.';
  }

  const positives: string[] = [];
  if (current.totalCostUsd < previous.totalCostUsd) {
    positives.push('spent less');
  }
  if (current.completedTaskCount > previous.completedTaskCount) {
    positives.push('completed more tasks');
  }
  if (current.wasteCostUsd < previous.wasteCostUsd) {
    positives.push('reduced potential waste');
  }
  if (efficiencyMetric && current.totalCostUsd > 0 && current.totalCommits >= previous.totalCommits && currentEfficiencyImproved(efficiencyMetric)) {
    positives.push('improved efficiency');
  }

  if (positives.length >= 3) {
    return `You ${joinClauses(positives)}.`;
  }

  if (current.totalCostUsd < previous.totalCostUsd && current.totalCommits > previous.totalCommits) {
    return 'You spent less and produced more Git output.';
  }

  if (current.totalCostUsd > previous.totalCostUsd && current.totalCommits < previous.totalCommits) {
    return 'You spent more but produced less Git output.';
  }

  if (positives.length >= 2) {
    return `You ${joinClauses(positives)}.`;
  }

  if (current.wasteCostUsd < previous.wasteCostUsd) {
    return 'Potential waste decreased.';
  }

  if (efficiencyMetric && currentEfficiencyImproved(efficiencyMetric)) {
    return 'Efficiency improved in the current period.';
  }

  if (efficiencyMetric && currentEfficiencyDeclined(efficiencyMetric)) {
    return 'Efficiency weakened in the current period.';
  }

  return 'Trend signal is mixed.';
}

function currentEfficiencyImproved(metric: EfficiencyMetric): boolean {
  return metric.currentValue > metric.previousValue;
}

function currentEfficiencyDeclined(metric: EfficiencyMetric): boolean {
  return metric.currentValue < metric.previousValue;
}

function formatChangePercent(previousValue: number, currentValue: number): string {
  if (!Number.isFinite(previousValue) || !Number.isFinite(currentValue) || previousValue === 0) {
    return 'N/A';
  }

  const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  const rounded = Math.round(change);

  if (rounded > 0) {
    return `+${rounded}%`;
  }

  return `${rounded}%`;
}

function formatEfficiencyValue(label: EfficiencyMetric['label'], value: number): string {
  if (!Number.isFinite(value)) {
    return 'N/A';
  }

  if (label === 'commits/$') {
    return `${formatDecimal(value)} commits/$`;
  }

  return `${formatInteger(Math.round(value))} LOC/$1`;
}

function formatDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

function joinClauses(parts: string[]): string {
  if (parts.length === 1) {
    return parts[0] ?? '';
  }

  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }

  const initial = parts.slice(0, -1).join(', ');
  const last = parts[parts.length - 1];
  return `${initial}, and ${last}`;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export type { CompareAnalysis, ComparePeriodMetrics, CompareTaskSummary, EfficiencyMetric };
