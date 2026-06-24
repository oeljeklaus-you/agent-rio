import { analyzeBudget, type BudgetAnalysis } from '../commands/budget.js';
import { analyzeCompare, type CompareAnalysis, type CompareTaskSummary } from '../commands/compare.js';
import { analyzeAttributionDebug, type AttributionDebugAnalysis } from '../commands/debug.js';
import { analyzeInsights, type InsightAnalysis, type InsightTaskSummary } from '../commands/insights.js';
import { analyzeLeaderboard, type LeaderboardAnalysis, type LeaderboardTaskSummary } from '../commands/leaderboard.js';
import { analyzeRecommend, type RecommendationAnalysis, type RecommendationTaskSummary } from '../commands/recommend.js';
import { summarizeTaskWindow } from '../commands/task.js';
import { analyzeWaste, type WasteAnalysis, type WasteTaskSummary } from '../commands/waste.js';
import { getSessionSummaryForSource, listCompletedTasksInWindow, listProjectCoverage, openDatabase, type TaskRecord } from '../database/db.js';
import { addDays, daysAgoIso, getUtcDayOfMonth, getUtcDaysInMonth, nowIso, startOfMonthIso } from '../utils/time.js';

type EmptyState = {
  title: string;
  body: string;
  nextSteps: string[];
};

type OverviewMetric<T> = {
  previous: T;
  current: T;
  changePct: number | null;
  label?: 'commits/$' | 'LOC/$1';
};

type OverviewPayload = {
  scope: {
    localOnly: boolean;
    taskAttributionSource: 'codex';
    claudeSnapshotsExcluded: boolean;
  };
  dataHealth: {
    latestSessionCaptureAt: string | null;
    codexSessionCount: number;
    claudeSessionCount: number;
    unknownCostSessionCount: number;
    trackedProjectCount: number;
    untrackedProjectCount: number;
    activeProjectCount: number;
    recentCompletedTaskCount: number;
    matchedRecentTaskCount: number;
    unmatchedRecentTaskCount: number;
    unmatchedNoProjectSessionsCount: number;
    unmatchedOutsideWindowCount: number;
    partialCostRecentTaskCount: number;
    notes: string[];
    onboardingSteps: string[];
    sampleUnmatchedTasks: Array<{
      name: string;
      projectName: string;
      endedAt: string | null;
      reason: string;
      projectSessionCount: number;
      windowSessionCount: number;
    }>;
  };
  budget: {
    spentCostUsd: number;
    projectedMonthEndCostUsd: number;
    averageDailyCostUsd: number;
    daysElapsed: number;
    daysInMonth: number;
    statusLine: string;
    hasIncompleteCostCoverage: boolean;
  };
  compare: {
    emptyReason: string | null;
    aiCost: OverviewMetric<number> | null;
    tasks: OverviewMetric<number> | null;
    commits: OverviewMetric<number> | null;
    wasteCost: OverviewMetric<number> | null;
    efficiency: OverviewMetric<number> | null;
    takeaway: string;
    note: string | null;
  };
  insights: {
    completedTaskCount: number;
    costLines: string[];
    wasteLines: string[];
    efficiencyLines: string[];
    emptyReason: string | null;
  };
  waste: {
    items: Array<{
      name: string;
      costUsd: number | null;
      durationLabel: string;
      reason: string;
    }>;
    summaryLines: string[];
    zeroCommitCostUsd: number;
    emptyReason: string | null;
  };
  recommend: {
    items: Array<{
      title: string;
      finding: string;
      action: string;
    }>;
    emptyReason: string | null;
  };
  leaderboard: {
    mostExpensive: Array<{
      name: string;
      costUsd: number | null;
    }>;
    mostEfficient: Array<{
      name: string;
      costUsd: number | null;
      metricLabel: string;
      metricValue: string;
    }>;
    leastEfficient: Array<{
      name: string;
      costUsd: number | null;
      reason: string;
    }>;
    emptyReason: string | null;
  };
  tasks: {
    items: Array<{
      name: string;
      projectName: string;
      status: string;
      endedAt: string | null;
      durationLabel: string;
      hasMatchedAiData: boolean;
      aiCostUsd: number | null;
      tokensLabel: string;
      commits: number;
      filesChanged: number;
      locChanged: number;
      note: string | null;
    }>;
  };
  projects: {
    items: Array<{
      projectName: string;
      projectPath: string;
      codexSessionCount: number;
      completedTaskCount: number;
      activeTaskCount: number;
      aiCostUsd: number | null;
      tokensLabel: string;
      lastSessionAt: string | null;
      note: string | null;
    }>;
  };
  emptyState: EmptyState | null;
  generatedAt: string;
};

type UiTaskSummary = {
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
  endedAt: string | null;
};

export function loadOverviewPayload(
  db: ReturnType<typeof openDatabase>,
  options?: {
    now?: string;
    budgetLimitUsd?: number | null;
  },
): OverviewPayload {
  const currentNow = options?.now ?? nowIso();
  const budget = buildBudgetAnalysis(db, currentNow, options?.budgetLimitUsd ?? null);
  const compare = buildCompareAnalysis(db, currentNow);
  const dataHealth = analyzeAttributionDebug(db, currentNow);
  const last30Tasks = buildUiTaskSummaries(db, listCompletedTasksInWindow(db, daysAgoIso(30, currentNow), currentNow));
  const historicalTasks = buildUiTaskSummaries(db, listCompletedTasksInWindow(db, '1970-01-01T00:00:00.000Z', currentNow));
  const insights = analyzeInsights(last30Tasks as InsightTaskSummary[]);
  const waste = analyzeWaste(last30Tasks as WasteTaskSummary[]);
  const recommend = analyzeRecommend(last30Tasks as RecommendationTaskSummary[]);
  const leaderboard = analyzeLeaderboard(last30Tasks as LeaderboardTaskSummary[]);
  const projects = buildProjectCoverageItems(db);

  return buildOverviewPayload({
    budget,
    compare,
    dataHealth,
    insights,
    waste,
    recommend,
    leaderboard,
    tasks: historicalTasks,
    projects,
    generatedAt: currentNow,
  });
}

export function buildOverviewPayload(input: {
  budget: BudgetAnalysis;
  compare: CompareAnalysis;
  dataHealth: AttributionDebugAnalysis;
  insights: InsightAnalysis;
  waste: WasteAnalysis;
  recommend: RecommendationAnalysis;
  leaderboard: LeaderboardAnalysis;
  tasks: UiTaskSummary[];
  projects: Array<{
    projectPath: string;
    codexSessionCount: number;
    completedTaskCount: number;
    activeTaskCount: number;
    aiCostUsd: number | null;
    totalTokens: number;
    lastSessionAt: string | null;
    note: string | null;
  }>;
  generatedAt: string;
}): OverviewPayload {
  return {
    scope: {
      localOnly: true,
      taskAttributionSource: 'codex',
      claudeSnapshotsExcluded: true,
    },
    dataHealth: {
      latestSessionCaptureAt: input.dataHealth.latestSessionCaptureAt,
      codexSessionCount: input.dataHealth.codexSessionCount,
      claudeSessionCount: input.dataHealth.claudeSessionCount,
      unknownCostSessionCount: input.dataHealth.unknownCostSessionCount,
      trackedProjectCount: input.dataHealth.trackedProjectCount,
      untrackedProjectCount: input.dataHealth.untrackedProjectCount,
      activeProjectCount: input.dataHealth.activeProjectCount,
      recentCompletedTaskCount: input.dataHealth.recentCompletedTaskCount,
      matchedRecentTaskCount: input.dataHealth.matchedRecentTaskCount,
      unmatchedRecentTaskCount: input.dataHealth.unmatchedRecentTaskCount,
      unmatchedNoProjectSessionsCount: input.dataHealth.unmatchedNoProjectSessionsCount,
      unmatchedOutsideWindowCount: input.dataHealth.unmatchedOutsideWindowCount,
      partialCostRecentTaskCount: input.dataHealth.partialCostRecentTaskCount,
      notes: input.dataHealth.notes,
      onboardingSteps: input.dataHealth.onboardingSteps,
      sampleUnmatchedTasks: input.dataHealth.sampleUnmatchedTasks.map((item) => ({
        name: item.name,
        projectName: formatProjectName(item.projectPath),
        endedAt: item.endedAt,
        reason: item.reason,
        projectSessionCount: item.projectSessionCount,
        windowSessionCount: item.windowSessionCount,
      })),
    },
    budget: {
      spentCostUsd: input.budget.spentCostUsd,
      projectedMonthEndCostUsd: input.budget.projectedMonthEndCostUsd,
      averageDailyCostUsd: input.budget.averageDailyCostUsd,
      daysElapsed: input.budget.daysElapsed,
      daysInMonth: input.budget.daysInMonth,
      statusLine: input.budget.statusLine,
      hasIncompleteCostCoverage: input.budget.hasIncompleteCostCoverage,
    },
    compare: {
      emptyReason: getCompareEmptyReason(input.compare),
      aiCost: canShowCompareMetric(input.compare)
        ? buildMetric(input.compare.previous.totalCostUsd, input.compare.current.totalCostUsd)
        : null,
      tasks: canShowCompareMetric(input.compare)
        ? buildMetric(input.compare.previous.completedTaskCount, input.compare.current.completedTaskCount)
        : null,
      commits: canShowCompareMetric(input.compare)
        ? buildMetric(input.compare.previous.totalCommits, input.compare.current.totalCommits)
        : null,
      wasteCost: canShowCompareMetric(input.compare)
        ? buildMetric(input.compare.previous.wasteCostUsd, input.compare.current.wasteCostUsd)
        : null,
      efficiency: input.compare.efficiencyMetric
        ? buildMetric(
            input.compare.efficiencyMetric.previousValue,
            input.compare.efficiencyMetric.currentValue,
            input.compare.efficiencyMetric.label,
          )
        : null,
      takeaway: input.compare.takeaway,
      note: input.compare.hasIncompleteCostCoverage ? 'Some cost-based comparison excluded incomplete cost coverage.' : null,
    },
    insights: {
      completedTaskCount: input.insights.completedTaskCount,
      costLines: input.insights.costLines,
      wasteLines: input.insights.wasteLines,
      efficiencyLines: input.insights.efficiencyLines,
      emptyReason: getInsightsEmptyReason(input.insights),
    },
    waste: {
      items: input.waste.items.slice(0, 10).map((item) => ({
        name: item.name,
        costUsd: item.aiCostUsd,
        durationLabel: formatDurationMinutes(item.durationMinutes),
        reason: item.reason,
      })),
      summaryLines: buildWasteSummaryLines(input.waste),
      zeroCommitCostUsd: input.waste.zeroCommitCostUsd,
      emptyReason: getWasteEmptyReason(input.waste),
    },
    recommend: {
      items: input.recommend.recommendations.slice(0, 5),
      emptyReason: getRecommendEmptyReason(input.recommend),
    },
    leaderboard: {
      mostExpensive: input.leaderboard.mostExpensive.slice(0, 5).map((item) => ({
        name: item.name,
        costUsd: item.aiCostUsd,
      })),
      mostEfficient: input.leaderboard.mostEfficient.slice(0, 5).map((item) => ({
        name: item.name,
        costUsd: item.aiCostUsd,
        metricLabel: item.metricLabel,
        metricValue: item.metricValue,
      })),
      leastEfficient: input.leaderboard.leastEfficient.slice(0, 5).map((item) => ({
        name: item.name,
        costUsd: item.aiCostUsd,
        reason: item.reason,
      })),
      emptyReason: getLeaderboardEmptyReason(input.leaderboard),
    },
    tasks: {
      items: input.tasks.slice(0, 50).map((task) => ({
        name: task.name,
        projectName: formatProjectName(task.projectPath),
        status: 'completed',
        endedAt: task.endedAt,
        durationLabel: formatDurationMinutes(task.durationMinutes),
        hasMatchedAiData: task.totalTokens > 0,
        aiCostUsd: task.totalTokens > 0 ? task.aiCostUsd : null,
        tokensLabel: task.totalTokens > 0 ? formatCompactTokens(task.totalTokens) : 'N/A',
        commits: task.commits,
        filesChanged: task.filesChanged,
        locChanged: task.locChanged,
        note: buildTaskNote(task),
      })),
    },
    projects: {
      items: input.projects.slice(0, 50).map((project) => ({
        projectName: formatProjectName(project.projectPath),
        projectPath: project.projectPath,
        codexSessionCount: project.codexSessionCount,
        completedTaskCount: project.completedTaskCount,
        activeTaskCount: project.activeTaskCount,
        aiCostUsd: project.aiCostUsd,
        tokensLabel: formatCompactTokens(project.totalTokens),
        lastSessionAt: project.lastSessionAt,
        note: project.note,
      })),
    },
    emptyState: resolveEmptyState(input),
    generatedAt: input.generatedAt,
  };
}

function buildBudgetAnalysis(
  db: ReturnType<typeof openDatabase>,
  currentNow: string,
  budgetLimitUsd: number | null,
): BudgetAnalysis {
  const fromIso = startOfMonthIso(currentNow);
  const summary = getSessionSummaryForSource(db, 'codex', 'started_at', fromIso, currentNow);

  return analyzeBudget(
    {
      sessionCount: summary.count,
      totalTokens: summary.totalTokens,
      knownCostUsd: summary.costUsd ?? 0,
      hasUnknownCost: summary.unknownCount > 0,
    },
    {
      daysElapsed: getUtcDayOfMonth(currentNow),
      daysInMonth: getUtcDaysInMonth(currentNow),
      budgetLimitUsd,
    },
  );
}

function buildCompareAnalysis(db: ReturnType<typeof openDatabase>, currentNow: string): CompareAnalysis {
  const currentFromIso = daysAgoIso(7, currentNow);
  const previousFromIso = daysAgoIso(14, currentNow);
  const previousToIso = addDays(previousFromIso, 7);

  const currentTasks = buildUiTaskSummaries(db, listCompletedTasksInWindow(db, currentFromIso, currentNow));
  const previousTasks = buildUiTaskSummaries(db, listCompletedTasksInWindow(db, previousFromIso, previousToIso));

  return analyzeCompare(previousTasks as CompareTaskSummary[], currentTasks as CompareTaskSummary[]);
}

function buildUiTaskSummaries(
  db: ReturnType<typeof openDatabase>,
  tasks: TaskRecord[],
): UiTaskSummary[] {
  return tasks.map((task) => {
    const summary = summarizeTaskWindow(db, task);
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
      locChanged: summary.gitMetrics.linesAdded + summary.gitMetrics.linesRemoved,
      endedAt: task.endedAt,
    };
  });
}

function buildProjectCoverageItems(db: ReturnType<typeof openDatabase>): Array<{
  projectPath: string;
  codexSessionCount: number;
  completedTaskCount: number;
  activeTaskCount: number;
  aiCostUsd: number | null;
  totalTokens: number;
  lastSessionAt: string | null;
  note: string | null;
}> {
  return listProjectCoverage(db).map((project) => ({
    projectPath: project.projectPath,
    codexSessionCount: project.codexSessionCount,
    completedTaskCount: project.completedTaskCount,
    activeTaskCount: project.activeTaskCount,
    aiCostUsd: project.costUsd,
    totalTokens: project.totalTokens,
    lastSessionAt: project.lastSessionAt,
    note: buildProjectNote(project.completedTaskCount, project.activeTaskCount, project.unknownCostCount),
  }));
}

function resolveEmptyState(input: {
  budget: BudgetAnalysis;
  insights: InsightAnalysis;
}): EmptyState | null {
  if (input.budget.noData && input.insights.completedTaskCount === 0) {
    return {
      title: 'No local AI usage found.',
      body: 'Run agent-roi scan first, then come back to Tasks, Health, or the dashboard overview.',
      nextSteps: [
        'Run agent-roi scan',
        'Run agent-roi ui --open',
        'Use agent-roi debug attribution if data still looks thin',
      ],
    };
  }

  if (input.insights.completedTaskCount === 0) {
    return {
      title: 'No completed tasks yet.',
      body: 'Use agent-roi watch or agent-roi task to capture work, then revisit Health or Task History.',
      nextSteps: [
        'Run agent-roi watch in an active Git repo',
        'Or use agent-roi task start / stop manually',
        'Refresh the dashboard after completing a task',
      ],
    };
  }

  return null;
}

function canShowCompareMetric(analysis: CompareAnalysis): boolean {
  return !(analysis.noCompletedTasks || analysis.currentPeriodEmpty || analysis.previousPeriodEmpty);
}

function getCompareEmptyReason(analysis: CompareAnalysis): string | null {
  if (analysis.noMatchedAiData) return 'No matched Codex task data found.';
  if (!canShowCompareMetric(analysis)) return 'Not enough data to compare yet.';
  return null;
}

function getInsightsEmptyReason(analysis: InsightAnalysis): string | null {
  if (analysis.completedTaskCount === 0) return 'No completed tasks found.';
  if (analysis.noMatchedAiData) return 'No matched Codex task data in this window.';
  return null;
}

function getWasteEmptyReason(analysis: WasteAnalysis): string | null {
  if (analysis.completedTaskCount === 0) return 'No completed tasks found.';
  if (analysis.noMatchedAiData) return 'No matched Codex task data in this window.';
  if (analysis.items.length === 0) return 'No obvious waste patterns found.';
  return null;
}

function getRecommendEmptyReason(analysis: RecommendationAnalysis): string | null {
  if (analysis.completedTaskCount === 0) return 'Not enough task data.';
  if (analysis.noMatchedAiData) return 'No matched Codex task data found.';
  return null;
}

function getLeaderboardEmptyReason(analysis: LeaderboardAnalysis): string | null {
  if (analysis.completedTaskCount === 0) return 'No completed tasks found.';
  if (analysis.noMatchedAiData) return 'No matched Codex task data found.';
  return null;
}

function buildWasteSummaryLines(analysis: WasteAnalysis): string[] {
  const lines: string[] = [];
  if (analysis.zeroCommitCount > 0) {
    lines.push(`${analysis.zeroCommitCount} task${analysis.zeroCommitCount === 1 ? '' : 's'} consumed ${formatUsd(analysis.zeroCommitCostUsd)} with zero commits.`);
  }
  if (analysis.highTokenLowOutputCount > 0) {
    lines.push(`${analysis.highTokenLowOutputCount} task${analysis.highTokenLowOutputCount === 1 ? '' : 's'} used high tokens with low output.`);
  }
  return lines;
}

function buildMetric<T extends number>(previous: T, current: T, label?: 'commits/$' | 'LOC/$1'): OverviewMetric<T> {
  return {
    previous,
    current,
    changePct: calculateChangePercent(previous, current),
    ...(label ? { label } : {}),
  };
}

function calculateChangePercent(previous: number, current: number): number | null {
  if (!Number.isFinite(previous) || !Number.isFinite(current) || previous === 0) {
    return null;
  }
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

function getDurationMinutes(startedAt: string, endedAt: string | null): number {
  const diffMs = new Date(endedAt ?? startedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return 0;
  return Math.round(diffMs / 60000);
}

function formatDurationMinutes(durationMinutes: number): string {
  if (durationMinutes < 60) return `${durationMinutes}m`;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function formatCompactTokens(value: number): string {
  if (value >= 1_000_000) return `${trimTrailingZeros((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${trimTrailingZeros((value / 1_000).toFixed(1))}k`;
  return String(value);
}

function buildTaskNote(task: UiTaskSummary): string | null {
  if (task.totalTokens === 0) return 'No matched Codex task data';
  if (task.hasUnknownCost) return 'Partial cost coverage';
  return null;
}

function buildProjectNote(completedTaskCount: number, activeTaskCount: number, unknownCostCount: number): string | null {
  if (completedTaskCount === 0 && activeTaskCount === 0) return 'AI usage found, but no tracked tasks yet';
  if (unknownCostCount > 0) return 'Partial cost coverage';
  return null;
}

function formatProjectName(projectPath: string): string {
  const parts = projectPath.split(/[\\/]/);
  return parts[parts.length - 1] ?? projectPath;
}

function trimTrailingZeros(value: string): string {
  return value.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export type { EmptyState, OverviewPayload, UiTaskSummary };
