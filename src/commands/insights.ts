import chalk from 'chalk';
import { listCompletedTasksInWindow, openDatabase, type TaskRecord } from '../database/db.js';
import { formatInteger, formatUsd } from '../utils/format.js';
import { daysAgoIso, nowIso } from '../utils/time.js';
import { summarizeTaskWindow } from './task.js';

type InsightTaskSummary = {
  name: string;
  durationMinutes: number;
  aiCostUsd: number | null;
  totalTokens: number;
  hasUnknownCost: boolean;
  commits: number;
  linesAdded: number;
  linesRemoved: number;
  locChanged: number;
};

type InsightAnalysis = {
  completedTaskCount: number;
  matchedTaskCount: number;
  hasIncompleteCostCoverage: boolean;
  costLines: string[];
  wasteLines: string[];
  efficiencyLines: string[];
  noMatchedAiData: boolean;
};

type DurationBucket = {
  label: string;
  minMinutes: number;
  maxMinutes: number | null;
};

const SHORT_TASK_MAX_MINUTES = 45;
const LONG_TASK_MIN_MINUTES = 120;
const MIN_HIGH_TOKEN_THRESHOLD = 100_000;
const MIN_LOW_OUTPUT_THRESHOLD = 20;
const DURATION_BUCKETS: DurationBucket[] = [
  { label: '< 30m', minMinutes: 0, maxMinutes: 30 },
  { label: '30m-60m', minMinutes: 30, maxMinutes: 60 },
  { label: '1h-2h', minMinutes: 60, maxMinutes: 120 },
  { label: '2h-4h', minMinutes: 120, maxMinutes: 240 },
  { label: '4h+', minMinutes: 240, maxMinutes: null },
];

export async function runInsightsCommand(): Promise<void> {
  let db: ReturnType<typeof openDatabase> | null = null;

  try {
    db = openDatabase();
    const toIso = nowIso();
    const fromIso = daysAgoIso(30);
    const tasks = listCompletedTasksInWindow(db, fromIso, toIso);

    const summaries = tasks.map((task) => {
      const summary = summarizeTaskWindow(db!, task);
      const durationMinutes = getDurationMinutes(task.startedAt, task.endedAt);
      const locChanged = summary.gitMetrics.linesAdded + summary.gitMetrics.linesRemoved;

      return {
        name: task.name,
        durationMinutes,
        aiCostUsd: summary.aiCostUsd,
        totalTokens: summary.totalTokens,
        hasUnknownCost: summary.hasUnknownCost,
        commits: summary.gitMetrics.commitCount,
        linesAdded: summary.gitMetrics.linesAdded,
        linesRemoved: summary.gitMetrics.linesRemoved,
        locChanged,
      } satisfies InsightTaskSummary;
    });

    console.log(buildInsightsOutput(analyzeInsights(summaries)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown insights failure';
    console.error(chalk.red(`agent-roi insights failed: ${message}`));
    process.exitCode = 1;
  } finally {
    db?.close();
  }
}

export function analyzeInsights(tasks: InsightTaskSummary[]): InsightAnalysis {
  if (tasks.length === 0) {
    return {
      completedTaskCount: 0,
      matchedTaskCount: 0,
      hasIncompleteCostCoverage: false,
      costLines: [],
      wasteLines: [],
      efficiencyLines: [],
      noMatchedAiData: false,
    };
  }

  const matchedTasks = tasks.filter((task) => task.totalTokens > 0);
  const hasIncompleteCostCoverage = tasks.some((task) => task.hasUnknownCost);

  if (matchedTasks.length === 0) {
    return {
      completedTaskCount: tasks.length,
      matchedTaskCount: 0,
      hasIncompleteCostCoverage,
      costLines: [],
      wasteLines: [],
      efficiencyLines: [],
      noMatchedAiData: true,
    };
  }

  const knownCostTasks = matchedTasks.filter((task) => task.aiCostUsd !== null && task.aiCostUsd > 0 && !task.hasUnknownCost);

  return {
    completedTaskCount: tasks.length,
    matchedTaskCount: matchedTasks.length,
    hasIncompleteCostCoverage,
    costLines: buildCostLines(knownCostTasks),
    wasteLines: buildWasteLines(matchedTasks, knownCostTasks),
    efficiencyLines: buildEfficiencyLines(knownCostTasks),
    noMatchedAiData: false,
  };
}

export function buildInsightsOutput(analysis: InsightAnalysis): string {
  const lines = [chalk.bold('Insights (Last 30 Days)'), ''];

  if (analysis.completedTaskCount === 0) {
    lines.push('No completed tasks found.');
    lines.push('Start and stop a few tasks first.');
    return lines.join('\n');
  }

  lines.push('Scope');
  lines.push(`- ${formatInteger(analysis.completedTaskCount)} completed tasks`);

  if (analysis.noMatchedAiData) {
    lines.push('- No matched Codex task data in this window');
    lines.push('- Claude snapshots excluded');
    return lines.join('\n');
  }

  lines.push('- Claude snapshots excluded');

  if (analysis.hasIncompleteCostCoverage) {
    lines.push('- Some cost-based insights excluded incomplete cost coverage');
  }

  appendInsightSection(lines, 'Cost', analysis.costLines);
  appendInsightSection(lines, 'Waste', analysis.wasteLines);
  appendInsightSection(lines, 'Efficiency', analysis.efficiencyLines);

  return lines.join('\n');
}

function appendInsightSection(lines: string[], title: string, sectionLines: string[]): void {
  if (sectionLines.length === 0) {
    return;
  }

  lines.push('');
  lines.push(title);

  for (const line of sectionLines.slice(0, 2)) {
    lines.push(`- ${line}`);
  }
}

function buildCostLines(tasks: InsightTaskSummary[]): string[] {
  const lines: string[] = [];

  if (tasks.length >= 5) {
    const totalCost = sum(tasks.map((task) => task.aiCostUsd ?? 0));

    if (totalCost > 0) {
      const sorted = [...tasks].sort((a, b) => (b.aiCostUsd ?? 0) - (a.aiCostUsd ?? 0));
      let runningCost = 0;
      let topCount = 0;

      for (const task of sorted) {
        runningCost += task.aiCostUsd ?? 0;
        topCount += 1;

        if (runningCost / totalCost >= 0.6) {
          const taskShare = Math.round((topCount / sorted.length) * 100);
          const costShare = Math.round((runningCost / totalCost) * 100);
          lines.push(`Top ${taskShare}% of tasks consumed ${costShare}% of AI cost.`);
          break;
        }
      }
    }
  }

  if (tasks.length > 0) {
    const mostExpensiveTask = [...tasks].sort((a, b) => (b.aiCostUsd ?? 0) - (a.aiCostUsd ?? 0))[0];

    if (mostExpensiveTask && (mostExpensiveTask.aiCostUsd ?? 0) > 0) {
      lines.push(
        `Most expensive task: "${mostExpensiveTask.name}" - ${formatUsd(mostExpensiveTask.aiCostUsd)} in ${formatDurationMinutes(mostExpensiveTask.durationMinutes)}.`,
      );
    }
  }

  return lines;
}

function buildWasteLines(matchedTasks: InsightTaskSummary[], knownCostTasks: InsightTaskSummary[]): string[] {
  const lines: string[] = [];
  const zeroCommitTasks = knownCostTasks.filter((task) => (task.aiCostUsd ?? 0) > 0 && task.commits === 0);

  if (zeroCommitTasks.length > 0) {
    lines.push(
      `${formatCount(zeroCommitTasks.length, 'task')} consumed ${formatUsd(sum(zeroCommitTasks.map((task) => task.aiCostUsd ?? 0)))} with zero commits.`,
    );
  }

  const tokenTasks = matchedTasks.filter((task) => task.totalTokens > 0);
  if (tokenTasks.length === 0) {
    return lines;
  }

  const tokenThreshold = percentile(
    tokenTasks.map((task) => task.totalTokens),
    0.75,
  );
  const locValues = tokenTasks.map((task) => task.locChanged);
  const locThreshold = tokenTasks.length >= 4 ? Math.max(MIN_LOW_OUTPUT_THRESHOLD, Math.round(percentile(locValues, 0.25))) : 40;
  const flaggedTasks = tokenTasks.filter((task) => task.totalTokens >= tokenThreshold && task.locChanged <= locThreshold);

  if (tokenThreshold >= MIN_HIGH_TOKEN_THRESHOLD && flaggedTasks.length > 0 && flaggedTasks.length < tokenTasks.length) {
    lines.push(
      `${formatCount(flaggedTasks.length, 'task')} used ${formatCompactTokens(tokenThreshold)}+ tokens each but changed ${formatInteger(locThreshold)} lines or fewer.`,
    );
  }

  return lines;
}

function buildEfficiencyLines(tasks: InsightTaskSummary[]): string[] {
  const lines: string[] = [];
  const shortTasks = tasks.filter((task) => task.durationMinutes > 0 && task.durationMinutes < SHORT_TASK_MAX_MINUTES);
  const longTasks = tasks.filter((task) => task.durationMinutes >= LONG_TASK_MIN_MINUTES);

  if (shortTasks.length >= 3 && longTasks.length >= 3) {
    const comparison = buildEfficiencyComparison(shortTasks, longTasks);
    if (comparison) {
      lines.push(comparison);
    }
  }

  const bucketLine = buildBestBucketLine(tasks);
  if (bucketLine) {
    lines.push(bucketLine);
  }

  return lines;
}

function buildEfficiencyComparison(shortTasks: InsightTaskSummary[], longTasks: InsightTaskSummary[]): string | null {
  const shortCommitEfficiency = sum(shortTasks.map((task) => task.commits));
  const longCommitEfficiency = sum(longTasks.map((task) => task.commits));
  const shortLocEfficiency = sum(shortTasks.map((task) => task.locChanged));
  const longLocEfficiency = sum(longTasks.map((task) => task.locChanged));
  const shortCost = sum(shortTasks.map((task) => task.aiCostUsd ?? 0));
  const longCost = sum(longTasks.map((task) => task.aiCostUsd ?? 0));

  if (shortCost <= 0 || longCost <= 0) {
    return null;
  }

  if (shortCommitEfficiency > 0 && longCommitEfficiency > 0) {
    const ratio = (shortCommitEfficiency / shortCost) / (longCommitEfficiency / longCost);
    return `Tasks under 45m produced ${formatOneDecimal(ratio)}x more commits per dollar than tasks over 2h.`;
  }

  if (shortLocEfficiency > 0 && longLocEfficiency > 0) {
    const ratio = (shortLocEfficiency / shortCost) / (longLocEfficiency / longCost);
    return `Tasks under 45m produced ${formatOneDecimal(ratio)}x more changed lines per dollar than tasks over 2h.`;
  }

  return null;
}

function buildBestBucketLine(tasks: InsightTaskSummary[]): string | null {
  const bucketStats = DURATION_BUCKETS.map((bucket) => {
    const bucketTasks = tasks.filter((task) => matchesBucket(task.durationMinutes, bucket));
    return {
      ...bucket,
      tasks: bucketTasks,
      cost: sum(bucketTasks.map((task) => task.aiCostUsd ?? 0)),
      commits: sum(bucketTasks.map((task) => task.commits)),
      locChanged: sum(bucketTasks.map((task) => task.locChanged)),
    };
  }).filter((bucket) => bucket.tasks.length >= 3 && bucket.cost > 0);

  const commitBuckets = bucketStats.filter((bucket) => bucket.commits > 0);
  if (commitBuckets.length >= 2) {
    const bestBucket = [...commitBuckets].sort((a, b) => b.commits / b.cost - a.commits / a.cost)[0];
    return `Best duration bucket: ${bestBucket.label}.`;
  }

  const locBuckets = bucketStats.filter((bucket) => bucket.locChanged > 0);
  if (locBuckets.length >= 2) {
    const bestBucket = [...locBuckets].sort((a, b) => b.locChanged / b.cost - a.locChanged / a.cost)[0];
    return `Best duration bucket: ${bestBucket.label}.`;
  }

  return null;
}

function matchesBucket(durationMinutes: number, bucket: DurationBucket): boolean {
  if (durationMinutes < bucket.minMinutes) {
    return false;
  }

  if (bucket.maxMinutes === null) {
    return true;
  }

  return durationMinutes < bucket.maxMinutes;
}

function getDurationMinutes(startedAt: string, endedAt: string | null): number {
  const diffMs = new Date(endedAt ?? startedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return 0;
  }

  return Math.round(diffMs / 60000);
}

function formatDurationMinutes(durationMinutes: number): string {
  if (durationMinutes < 60) {
    return `${durationMinutes}m`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function percentile(values: number[], quantile: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1));
  return sorted[index] ?? 0;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function formatCompactTokens(value: number): string {
  if (value >= 1_000_000) {
    return `${trimTrailingZeros((value / 1_000_000).toFixed(1))}M`;
  }

  if (value >= 1_000) {
    return `${trimTrailingZeros((value / 1_000).toFixed(1))}k`;
  }

  return formatInteger(Math.round(value));
}

function trimTrailingZeros(value: string): string {
  return value.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function formatOneDecimal(value: number): string {
  return trimTrailingZeros(value.toFixed(1));
}

function formatCount(value: number, noun: string): string {
  return `${formatInteger(value)} ${noun}${value === 1 ? '' : 's'}`;
}

export type { InsightTaskSummary, InsightAnalysis, TaskRecord };
