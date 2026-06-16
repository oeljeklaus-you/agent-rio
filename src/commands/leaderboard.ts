import chalk from 'chalk';
import { listCompletedTasksInWindow, openDatabase } from '../database/db.js';
import { formatInteger, formatUsd } from '../utils/format.js';
import { daysAgoIso, nowIso } from '../utils/time.js';
import { summarizeTaskWindow } from './task.js';

type LeaderboardTaskSummary = {
  name: string;
  durationMinutes: number;
  aiCostUsd: number | null;
  totalTokens: number;
  hasUnknownCost: boolean;
  commits: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  locChanged: number;
};

type EfficientItem = LeaderboardTaskSummary & {
  metricLabel: 'Cost Per Commit' | 'LOC Per Dollar';
  metricValue: string;
  sortValue: number;
};

type LeastEfficientItem = LeaderboardTaskSummary & {
  reason: string;
  sortValue: number;
};

type LeaderboardAnalysis = {
  completedTaskCount: number;
  matchedTaskCount: number;
  hasIncompleteCostCoverage: boolean;
  noMatchedAiData: boolean;
  mostExpensive: LeaderboardTaskSummary[];
  mostEfficient: EfficientItem[];
  leastEfficient: LeastEfficientItem[];
};

const MAX_ITEMS_PER_SECTION = 5;

export async function runLeaderboardCommand(): Promise<void> {
  let db: ReturnType<typeof openDatabase> | null = null;

  try {
    db = openDatabase();
    const toIso = nowIso();
    const fromIso = daysAgoIso(30);
    const tasks = listCompletedTasksInWindow(db, fromIso, toIso);

    const summaries = tasks.map((task) => {
      const summary = summarizeTaskWindow(db!, task);
      const locChanged = summary.gitMetrics.linesAdded + summary.gitMetrics.linesRemoved;

      return {
        name: task.name,
        durationMinutes: getDurationMinutes(task.startedAt, task.endedAt),
        aiCostUsd: summary.aiCostUsd,
        totalTokens: summary.totalTokens,
        hasUnknownCost: summary.hasUnknownCost,
        commits: summary.gitMetrics.commitCount,
        filesChanged: summary.gitMetrics.filesChanged,
        linesAdded: summary.gitMetrics.linesAdded,
        linesRemoved: summary.gitMetrics.linesRemoved,
        locChanged,
      } satisfies LeaderboardTaskSummary;
    });

    console.log(buildLeaderboardOutput(analyzeLeaderboard(summaries)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown leaderboard failure';
    console.error(chalk.red(`agent-roi leaderboard failed: ${message}`));
    process.exitCode = 1;
  } finally {
    db?.close();
  }
}

export function analyzeLeaderboard(tasks: LeaderboardTaskSummary[]): LeaderboardAnalysis {
  if (tasks.length === 0) {
    return {
      completedTaskCount: 0,
      matchedTaskCount: 0,
      hasIncompleteCostCoverage: false,
      noMatchedAiData: false,
      mostExpensive: [],
      mostEfficient: [],
      leastEfficient: [],
    };
  }

  const matchedTasks = tasks.filter((task) => task.totalTokens > 0);
  const hasIncompleteCostCoverage = tasks.some((task) => task.hasUnknownCost);

  if (matchedTasks.length === 0) {
    return {
      completedTaskCount: tasks.length,
      matchedTaskCount: 0,
      hasIncompleteCostCoverage,
      noMatchedAiData: true,
      mostExpensive: [],
      mostEfficient: [],
      leastEfficient: [],
    };
  }

  const knownCostTasks = matchedTasks.filter((task) => task.aiCostUsd !== null && task.aiCostUsd > 0);

  return {
    completedTaskCount: tasks.length,
    matchedTaskCount: matchedTasks.length,
    hasIncompleteCostCoverage,
    noMatchedAiData: false,
    mostExpensive: buildMostExpensive(knownCostTasks),
    mostEfficient: buildMostEfficient(knownCostTasks),
    leastEfficient: buildLeastEfficient(knownCostTasks),
  };
}

export function buildLeaderboardOutput(analysis: LeaderboardAnalysis): string {
  const lines = [chalk.bold('Leaderboard (Last 30 Days)'), ''];

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
    lines.push('- Some rankings excluded incomplete cost coverage');
  }

  appendMostExpensive(lines, analysis.mostExpensive);
  appendMostEfficient(lines, analysis.mostEfficient);
  appendLeastEfficient(lines, analysis.leastEfficient);

  return lines.join('\n');
}

function appendMostExpensive(lines: string[], items: LeaderboardTaskSummary[]): void {
  if (items.length === 0) {
    return;
  }

  lines.push('');
  lines.push('Most Expensive Tasks');

  for (const [index, item] of items.entries()) {
    lines.push('');
    lines.push(`${index + 1}. ${item.name}`);
    lines.push(`   Cost: ${formatUsd(item.aiCostUsd)}`);
    lines.push(`   Duration: ${formatDurationMinutes(item.durationMinutes)}`);
    lines.push(`   Tokens: ${formatCompactTokens(item.totalTokens)}`);
  }
}

function appendMostEfficient(lines: string[], items: EfficientItem[]): void {
  if (items.length === 0) {
    return;
  }

  lines.push('');
  lines.push('Most Efficient Tasks');

  for (const [index, item] of items.entries()) {
    lines.push('');
    lines.push(`${index + 1}. ${item.name}`);
    lines.push(`   Cost: ${formatUsd(item.aiCostUsd)}`);
    lines.push(`   Commits: ${formatInteger(item.commits)}`);
    lines.push(`   Files Changed: ${formatInteger(item.filesChanged)}`);
    lines.push(`   ${item.metricLabel}: ${item.metricValue}`);
  }
}

function appendLeastEfficient(lines: string[], items: LeastEfficientItem[]): void {
  if (items.length === 0) {
    return;
  }

  lines.push('');
  lines.push('Least Efficient Tasks');

  for (const [index, item] of items.entries()) {
    lines.push('');
    lines.push(`${index + 1}. ${item.name}`);
    lines.push(`   Cost: ${formatUsd(item.aiCostUsd)}`);
    lines.push(`   Commits: ${formatInteger(item.commits)}`);
    lines.push(`   Files Changed: ${formatInteger(item.filesChanged)}`);
    lines.push(`   Reason: ${item.reason}`);
  }
}

function buildMostExpensive(tasks: LeaderboardTaskSummary[]): LeaderboardTaskSummary[] {
  return [...tasks]
    .sort((left, right) => (right.aiCostUsd ?? 0) - (left.aiCostUsd ?? 0))
    .slice(0, MAX_ITEMS_PER_SECTION);
}

function buildMostEfficient(tasks: LeaderboardTaskSummary[]): EfficientItem[] {
  const eligibleTasks = tasks.filter((task) => (task.commits > 0 || task.locChanged > 0) && (task.aiCostUsd ?? 0) > 0);
  if (eligibleTasks.length === 0) {
    return [];
  }

  const commitPositiveTasks = eligibleTasks.filter((task) => task.commits > 0);
  const useLocMetric = commitPositiveTasks.length < 3;

  const items = eligibleTasks
    .map((task) => {
      const cost = task.aiCostUsd ?? 0;

      if (!useLocMetric && task.commits > 0) {
        return {
          ...task,
          metricLabel: 'Cost Per Commit' as const,
          metricValue: formatUsd(cost / task.commits),
          sortValue: task.commits / cost,
        };
      }

      return {
        ...task,
        metricLabel: 'LOC Per Dollar' as const,
        metricValue: formatLocPerDollar(task.locChanged, cost),
        sortValue: task.locChanged / cost,
      };
    })
    .filter((item) => item.sortValue > 0)
    .sort((left, right) => {
      if (right.sortValue !== left.sortValue) {
        return right.sortValue - left.sortValue;
      }

      return (left.aiCostUsd ?? 0) - (right.aiCostUsd ?? 0);
    });

  return items.slice(0, MAX_ITEMS_PER_SECTION);
}

function buildLeastEfficient(tasks: LeaderboardTaskSummary[]): LeastEfficientItem[] {
  const items = tasks
    .filter((task) => (task.aiCostUsd ?? 0) > 0)
    .map((task) => {
      const reason = getLeastEfficientReason(task);
      const outputPenalty = task.commits === 0 ? 3 : task.filesChanged <= 1 ? 2 : task.locChanged < 50 ? 1 : 0;
      const sortValue = ((task.aiCostUsd ?? 0) * 100) + outputPenalty;

      return {
        ...task,
        reason,
        sortValue,
      };
    })
    .filter((item) => item.commits === 0 || item.filesChanged <= 1 || item.locChanged < 50)
    .sort((left, right) => {
      const leftPriority = left.commits === 0 || left.filesChanged <= 1 ? 1 : 0;
      const rightPriority = right.commits === 0 || right.filesChanged <= 1 ? 1 : 0;

      if (rightPriority !== leftPriority) {
        return rightPriority - leftPriority;
      }

      if ((right.aiCostUsd ?? 0) !== (left.aiCostUsd ?? 0)) {
        return (right.aiCostUsd ?? 0) - (left.aiCostUsd ?? 0);
      }

      return left.locChanged - right.locChanged;
    });

  return items.slice(0, MAX_ITEMS_PER_SECTION);
}

function getLeastEfficientReason(task: LeaderboardTaskSummary): string {
  if (task.commits === 0 && task.filesChanged <= 1) {
    return 'high cost with low output';
  }

  if (task.commits === 0) {
    return 'high cost with no commits';
  }

  if (task.filesChanged <= 1) {
    return 'high cost with minimal file output';
  }

  return 'high cost with low output';
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

function formatCompactTokens(value: number): string {
  if (value >= 1_000_000) {
    return `${trimTrailingZeros((value / 1_000_000).toFixed(1))}M`;
  }

  if (value >= 1_000) {
    return `${trimTrailingZeros((value / 1_000).toFixed(1))}k`;
  }

  return formatInteger(value);
}

function formatLocPerDollar(locChanged: number, cost: number): string {
  return `${formatInteger(Math.round(locChanged / cost))} LOC/$1`;
}

function trimTrailingZeros(value: string): string {
  return value.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

export type { EfficientItem, LeaderboardAnalysis, LeaderboardTaskSummary, LeastEfficientItem };
