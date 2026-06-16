import chalk from 'chalk';
import { listCompletedTasksInWindow, openDatabase } from '../database/db.js';
import { formatInteger, formatUsd } from '../utils/format.js';
import { daysAgoIso, nowIso } from '../utils/time.js';
import { summarizeTaskWindow } from './task.js';

type WasteReason =
  | 'AI cost with no Git output'
  | 'AI cost with no commits'
  | 'High token usage with low code output'
  | 'Long running task with low output';

type WasteTaskSummary = {
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

type WasteItem = WasteTaskSummary & {
  reason: WasteReason;
};

type WasteAnalysis = {
  completedTaskCount: number;
  matchedTaskCount: number;
  hasIncompleteCostCoverage: boolean;
  noMatchedAiData: boolean;
  items: WasteItem[];
  zeroCommitCount: number;
  zeroCommitCostUsd: number;
  highTokenLowOutputCount: number;
};

const MAX_WASTE_ITEMS = 10;
const HIGH_TOKEN_FALLBACK = 500_000;
const LOW_OUTPUT_FALLBACK = 40;
const LONG_RUNNING_MINUTES = 120;

export async function runWasteCommand(): Promise<void> {
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
      } satisfies WasteTaskSummary;
    });

    console.log(buildWasteOutput(analyzeWaste(summaries)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown waste failure';
    console.error(chalk.red(`agent-roi waste failed: ${message}`));
    process.exitCode = 1;
  } finally {
    db?.close();
  }
}

export function analyzeWaste(tasks: WasteTaskSummary[]): WasteAnalysis {
  if (tasks.length === 0) {
    return {
      completedTaskCount: 0,
      matchedTaskCount: 0,
      hasIncompleteCostCoverage: false,
      noMatchedAiData: false,
      items: [],
      zeroCommitCount: 0,
      zeroCommitCostUsd: 0,
      highTokenLowOutputCount: 0,
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
      items: [],
      zeroCommitCount: 0,
      zeroCommitCostUsd: 0,
      highTokenLowOutputCount: 0,
    };
  }

  const knownCostTasks = matchedTasks.filter((task) => task.aiCostUsd !== null && task.aiCostUsd > 0);
  const zeroCommitTasks = knownCostTasks.filter((task) => task.commits === 0);
  const highTokenLowOutputTasks = getHighTokenLowOutputTasks(matchedTasks);

  const items = dedupeWasteItems([
    ...knownCostTasks
      .filter((task) => task.commits === 0 && task.filesChanged === 0)
      .map((task) => ({ ...task, reason: 'AI cost with no Git output' as const })),
    ...knownCostTasks
      .filter((task) => task.commits === 0)
      .map((task) => ({ ...task, reason: 'AI cost with no commits' as const })),
    ...highTokenLowOutputTasks.map((task) => ({ ...task, reason: 'High token usage with low code output' as const })),
    ...matchedTasks
      .filter((task) => task.durationMinutes >= LONG_RUNNING_MINUTES && (task.commits === 0 || task.locChanged < 50))
      .map((task) => ({ ...task, reason: 'Long running task with low output' as const })),
  ])
    .sort(compareWasteItems)
    .slice(0, MAX_WASTE_ITEMS);

  return {
    completedTaskCount: tasks.length,
    matchedTaskCount: matchedTasks.length,
    hasIncompleteCostCoverage,
    noMatchedAiData: false,
    items,
    zeroCommitCount: zeroCommitTasks.length,
    zeroCommitCostUsd: sum(zeroCommitTasks.map((task) => task.aiCostUsd ?? 0)),
    highTokenLowOutputCount: highTokenLowOutputTasks.length,
  };
}

export function buildWasteOutput(analysis: WasteAnalysis): string {
  const lines = [chalk.bold('Waste Report (Last 30 Days)'), ''];

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
    lines.push('- Some tasks have incomplete cost coverage');
  }

  lines.push('');
  lines.push('Potential Waste');

  if (analysis.items.length === 0) {
    lines.push('');
    lines.push('No obvious waste patterns found.');
    return lines.join('\n');
  }

  for (const [index, item] of analysis.items.entries()) {
    lines.push('');
    lines.push(`${index + 1}. ${item.name}`);
    lines.push(`   Cost: ${formatUsd(item.aiCostUsd)}`);
    lines.push(`   Duration: ${formatDurationMinutes(item.durationMinutes)}`);
    lines.push(`   Tokens: ${formatCompactTokens(item.totalTokens)}`);
    lines.push(`   Commits: ${formatInteger(item.commits)}`);
    lines.push(`   Files Changed: ${formatInteger(item.filesChanged)}`);
    lines.push(`   Reason: ${item.reason}`);
  }

  const summaryLines = buildSummaryLines(analysis);
  if (summaryLines.length > 0) {
    lines.push('');
    lines.push('Waste Summary');
    for (const line of summaryLines) {
      lines.push(`- ${line}`);
    }
  }

  return lines.join('\n');
}

function buildSummaryLines(analysis: WasteAnalysis): string[] {
  const lines: string[] = [];

  if (analysis.zeroCommitCount > 0) {
    lines.push(`${formatCount(analysis.zeroCommitCount, 'task')} consumed ${formatUsd(analysis.zeroCommitCostUsd)} with zero commits.`);
  }

  if (analysis.highTokenLowOutputCount > 0) {
    lines.push(`${formatCount(analysis.highTokenLowOutputCount, 'task')} used high tokens with low output.`);
  }

  return lines;
}

function getHighTokenLowOutputTasks(tasks: WasteTaskSummary[]): WasteTaskSummary[] {
  if (tasks.length < 4) {
    return tasks.filter((task) => task.totalTokens > HIGH_TOKEN_FALLBACK && task.locChanged < LOW_OUTPUT_FALLBACK);
  }

  const tokenThreshold = percentile(tasks.map((task) => task.totalTokens), 0.75);
  const locThreshold = percentile(tasks.map((task) => task.locChanged), 0.25);

  return tasks.filter((task) => task.totalTokens >= tokenThreshold && task.locChanged <= locThreshold);
}

function dedupeWasteItems(items: WasteItem[]): WasteItem[] {
  const priorities: Record<WasteReason, number> = {
    'AI cost with no Git output': 4,
    'AI cost with no commits': 3,
    'High token usage with low code output': 2,
    'Long running task with low output': 1,
  };

  const map = new Map<string, WasteItem>();

  for (const item of items) {
    const existing = map.get(item.name);
    if (!existing || priorities[item.reason] > priorities[existing.reason]) {
      map.set(item.name, item);
    }
  }

  return [...map.values()];
}

function compareWasteItems(left: WasteItem, right: WasteItem): number {
  const leftCost = left.aiCostUsd ?? 0;
  const rightCost = right.aiCostUsd ?? 0;

  if (rightCost !== leftCost) {
    return rightCost - leftCost;
  }

  return right.totalTokens - left.totalTokens;
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

function percentile(values: number[], quantile: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1));
  return sorted[index] ?? 0;
}

function formatCount(value: number, noun: string): string {
  return `${formatInteger(value)} ${noun}${value === 1 ? '' : 's'}`;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function trimTrailingZeros(value: string): string {
  return value.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

export type { WasteAnalysis, WasteItem, WasteTaskSummary };
