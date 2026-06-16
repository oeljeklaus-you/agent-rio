import chalk from 'chalk';
import path from 'node:path';
import { listCompletedTasksInWindow, openDatabase } from '../database/db.js';
import { formatInteger, formatUsd } from '../utils/format.js';
import { daysAgoIso, nowIso } from '../utils/time.js';
import { summarizeTaskWindow } from './task.js';

type RecommendationTaskSummary = {
  name: string;
  projectPath: string;
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

type RecommendationItem = {
  title: string;
  finding: string;
  action: string;
};

type RecommendationAnalysis = {
  completedTaskCount: number;
  matchedTaskCount: number;
  hasIncompleteCostCoverage: boolean;
  noMatchedAiData: boolean;
  recommendations: RecommendationItem[];
};

const SHORT_TASK_MAX_MINUTES = 45;
const LONG_TASK_MIN_MINUTES = 120;
const HIGH_TOKEN_FALLBACK = 500_000;
const LOW_OUTPUT_FALLBACK = 40;
const MAX_RECOMMENDATIONS = 5;

export async function runRecommendCommand(): Promise<void> {
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
        projectPath: task.projectPath,
        durationMinutes: getDurationMinutes(task.startedAt, task.endedAt),
        aiCostUsd: summary.aiCostUsd,
        totalTokens: summary.totalTokens,
        hasUnknownCost: summary.hasUnknownCost,
        commits: summary.gitMetrics.commitCount,
        filesChanged: summary.gitMetrics.filesChanged,
        linesAdded: summary.gitMetrics.linesAdded,
        linesRemoved: summary.gitMetrics.linesRemoved,
        locChanged,
      } satisfies RecommendationTaskSummary;
    });

    console.log(buildRecommendOutput(analyzeRecommend(summaries)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown recommendation failure';
    console.error(chalk.red(`agent-roi recommend failed: ${message}`));
    process.exitCode = 1;
  } finally {
    db?.close();
  }
}

export function analyzeRecommend(tasks: RecommendationTaskSummary[]): RecommendationAnalysis {
  if (tasks.length === 0) {
    return {
      completedTaskCount: 0,
      matchedTaskCount: 0,
      hasIncompleteCostCoverage: false,
      noMatchedAiData: false,
      recommendations: [],
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
      recommendations: [],
    };
  }

  const knownCostTasks = matchedTasks.filter((task) => task.aiCostUsd !== null && task.aiCostUsd > 0);
  const recommendations: RecommendationItem[] = [];

  const breakLargeTasks = buildBreakLargeTasksRecommendation(knownCostTasks);
  if (breakLargeTasks) {
    recommendations.push(breakLargeTasks);
  }

  const reviewExpensiveTasks = buildReviewExpensiveTasksRecommendation(knownCostTasks);
  if (reviewExpensiveTasks) {
    recommendations.push(reviewExpensiveTasks);
  }

  const investigateWaste = buildInvestigateWasteRecommendation(knownCostTasks);
  if (investigateWaste) {
    recommendations.push(investigateWaste);
  }

  const reviewPromptingStrategy = buildReviewPromptingStrategyRecommendation(matchedTasks);
  if (reviewPromptingStrategy) {
    recommendations.push(reviewPromptingStrategy);
  }

  const projectConcentration = buildProjectConcentrationRecommendation(knownCostTasks);
  if (projectConcentration) {
    recommendations.push(projectConcentration);
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Keep Monitoring Task Shape',
      finding: 'No strong recommendation thresholds were triggered in the last 30 days.',
      action: 'Keep tracking completed tasks and re-run this command after a few more work cycles.',
    });
  }

  return {
    completedTaskCount: tasks.length,
    matchedTaskCount: matchedTasks.length,
    hasIncompleteCostCoverage,
    noMatchedAiData: false,
    recommendations: recommendations.slice(0, MAX_RECOMMENDATIONS),
  };
}

export function buildRecommendOutput(analysis: RecommendationAnalysis): string {
  const lines = [chalk.bold('Recommendations (Last 30 Days)'), ''];

  if (analysis.completedTaskCount === 0) {
    lines.push('Not enough task data.');
    lines.push('');
    lines.push('Start and complete a few tasks first.');
    return lines.join('\n');
  }

  if (analysis.noMatchedAiData) {
    lines.push('No matched Codex task data found.');
    return lines.join('\n');
  }

  for (const [index, recommendation] of analysis.recommendations.entries()) {
    lines.push(`${index + 1}. ${recommendation.title}`);
    lines.push('');
    lines.push(recommendation.finding);
    lines.push('');
    lines.push(recommendation.action);

    if (index < analysis.recommendations.length - 1) {
      lines.push('');
    }
  }

  return lines.join('\n');
}

function buildBreakLargeTasksRecommendation(tasks: RecommendationTaskSummary[]): RecommendationItem | null {
  const shortTasks = tasks.filter((task) => task.durationMinutes > 0 && task.durationMinutes < SHORT_TASK_MAX_MINUTES);
  const longTasks = tasks.filter((task) => task.durationMinutes >= LONG_TASK_MIN_MINUTES);

  if (shortTasks.length === 0 || longTasks.length === 0) {
    return null;
  }

  const shortCost = sum(shortTasks.map((task) => task.aiCostUsd ?? 0));
  const longCost = sum(longTasks.map((task) => task.aiCostUsd ?? 0));
  const shortCommits = sum(shortTasks.map((task) => task.commits));
  const longCommits = sum(longTasks.map((task) => task.commits));
  const shortLoc = sum(shortTasks.map((task) => task.locChanged));
  const longLoc = sum(longTasks.map((task) => task.locChanged));

  if (shortCost <= 0 || longCost <= 0) {
    return null;
  }

  if (shortCommits > 0 && longCommits > 0) {
    const shortEfficiency = shortCommits / shortCost;
    const longEfficiency = longCommits / longCost;

    if (shortEfficiency > longEfficiency * 1.5) {
      const ratio = shortEfficiency / longEfficiency;
      return {
        title: 'Break Large Tasks',
        finding: `Tasks under 45m produced ${formatOneDecimal(ratio)}x more commits per dollar than tasks over 2h.`,
        action: 'Consider splitting large tasks into smaller units.',
      };
    }
  }

  if (shortLoc > 0 && longLoc > 0) {
    const shortEfficiency = shortLoc / shortCost;
    const longEfficiency = longLoc / longCost;

    if (shortEfficiency > longEfficiency * 1.5) {
      const ratio = shortEfficiency / longEfficiency;
      return {
        title: 'Break Large Tasks',
        finding: `Tasks under 45m produced ${formatOneDecimal(ratio)}x more changed lines per dollar than tasks over 2h.`,
        action: 'Consider splitting large tasks into smaller units.',
      };
    }
  }

  return null;
}

function buildReviewExpensiveTasksRecommendation(tasks: RecommendationTaskSummary[]): RecommendationItem | null {
  if (tasks.length === 0) {
    return null;
  }

  const sorted = [...tasks].sort((left, right) => (right.aiCostUsd ?? 0) - (left.aiCostUsd ?? 0));
  const totalCost = sum(sorted.map((task) => task.aiCostUsd ?? 0));

  if (totalCost <= 0) {
    return null;
  }

  const topCount = Math.max(1, Math.ceil(sorted.length * 0.2));
  const topCost = sum(sorted.slice(0, topCount).map((task) => task.aiCostUsd ?? 0));
  const taskShare = Math.round((topCount / sorted.length) * 100);
  const costShare = Math.round((topCost / totalCost) * 100);

  if (costShare > 50) {
    return {
      title: 'Review Expensive Tasks',
      finding: `${taskShare}% of tasks consumed ${costShare}% of AI cost.`,
      action: 'Review the most expensive tasks for repeated patterns.',
    };
  }

  return null;
}

function buildInvestigateWasteRecommendation(tasks: RecommendationTaskSummary[]): RecommendationItem | null {
  if (tasks.length === 0) {
    return null;
  }

  const totalCost = sum(tasks.map((task) => task.aiCostUsd ?? 0));
  const zeroCommitTasks = tasks.filter((task) => task.commits === 0);
  const zeroCommitCost = sum(zeroCommitTasks.map((task) => task.aiCostUsd ?? 0));

  if (totalCost <= 0 || zeroCommitCost <= totalCost * 0.1 || zeroCommitTasks.length === 0) {
    return null;
  }

  return {
    title: 'Investigate Potential Waste',
    finding: `${formatCount(zeroCommitTasks.length, 'task')} consumed ${formatUsd(zeroCommitCost)} with zero commits.`,
    action: 'Review whether those tasks were debugging, research, or abandoned work.',
  };
}

function buildReviewPromptingStrategyRecommendation(tasks: RecommendationTaskSummary[]): RecommendationItem | null {
  const flaggedTasks = getHighTokenLowOutputTasks(tasks);

  if (flaggedTasks.length >= 3) {
    return {
      title: 'Review Prompting Strategy',
      finding: `${formatCount(flaggedTasks.length, 'task')} used high tokens with low output.`,
      action: 'Review prompts, task framing, and iteration style for those tasks.',
    };
  }

  return null;
}

function buildProjectConcentrationRecommendation(tasks: RecommendationTaskSummary[]): RecommendationItem | null {
  if (tasks.length === 0) {
    return null;
  }

  const totalCost = sum(tasks.map((task) => task.aiCostUsd ?? 0));
  if (totalCost <= 0) {
    return null;
  }

  const projectCosts = new Map<string, number>();

  for (const task of tasks) {
    projectCosts.set(task.projectPath, (projectCosts.get(task.projectPath) ?? 0) + (task.aiCostUsd ?? 0));
  }

  const rankedProjects = [...projectCosts.entries()].sort((left, right) => right[1] - left[1]);
  const topProject = rankedProjects[0];

  if (!topProject) {
    return null;
  }

  const [projectPath, projectCost] = topProject;
  const projectShare = Math.round((projectCost / totalCost) * 100);

  if (projectShare > 70) {
    return {
      title: 'Project Concentration Risk',
      finding: `${formatProjectName(projectPath)} consumed ${projectShare}% of recent AI cost.`,
      action: 'Review whether that project deserves the concentration or needs tighter task scope.',
    };
  }

  return null;
}

function getHighTokenLowOutputTasks(tasks: RecommendationTaskSummary[]): RecommendationTaskSummary[] {
  if (tasks.length < 4) {
    return tasks.filter((task) => task.totalTokens > HIGH_TOKEN_FALLBACK && task.locChanged < LOW_OUTPUT_FALLBACK);
  }

  const tokenThreshold = percentile(tasks.map((task) => task.totalTokens), 0.75);
  const locThreshold = percentile(tasks.map((task) => task.locChanged), 0.25);

  return tasks.filter((task) => task.totalTokens >= tokenThreshold && task.locChanged <= locThreshold);
}

function getDurationMinutes(startedAt: string, endedAt: string | null): number {
  const diffMs = new Date(endedAt ?? startedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return 0;
  }

  return Math.round(diffMs / 60000);
}

function percentile(values: number[], quantile: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1));
  return sorted[index] ?? 0;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function formatCount(value: number, noun: string): string {
  return `${formatInteger(value)} ${noun}${value === 1 ? '' : 's'}`;
}

function formatOneDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

function formatProjectName(projectPath: string): string {
  return path.basename(projectPath) || projectPath;
}

export type { RecommendationAnalysis, RecommendationItem, RecommendationTaskSummary };
