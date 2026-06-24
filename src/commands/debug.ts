import chalk from 'chalk';
import {
  getLatestSessionCaptureAt,
  getSessionSummaryForSource,
  getTaskAttributionDebug,
  listCompletedTasksInWindow,
  listProjectCoverage,
  openDatabase,
  type TaskRecord,
} from '../database/db.js';
import { summarizeTaskWindow } from './task.js';
import { formatInteger } from '../utils/format.js';
import { daysAgoIso, nowIso } from '../utils/time.js';

export type AttributionDebugTaskItem = {
  name: string;
  projectPath: string;
  endedAt: string | null;
  reason: string;
  projectSessionCount: number;
  windowSessionCount: number;
  unknownCostWindowSessionCount: number;
};

export type AttributionDebugAnalysis = {
  noLocalUsage: boolean;
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
  sampleUnmatchedTasks: AttributionDebugTaskItem[];
};

export async function runDebugAttributionCommand(): Promise<void> {
  let db: ReturnType<typeof openDatabase> | null = null;

  try {
    db = openDatabase();
    const analysis = analyzeAttributionDebug(db);
    console.log(buildAttributionDebugOutput(analysis));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown attribution debug failure';
    console.error(chalk.red(`agent-roi debug attribution failed: ${message}`));
    process.exitCode = 1;
  } finally {
    db?.close();
  }
}

export function analyzeAttributionDebug(
  db: ReturnType<typeof openDatabase>,
  currentNow = nowIso(),
): AttributionDebugAnalysis {
  const codexSummary = getSessionSummaryForSource(db, 'codex', 'updated_at', '1970-01-01T00:00:00.000Z', currentNow);
  const claudeSummary = getSessionSummaryForSource(db, 'claude', 'updated_at', '1970-01-01T00:00:00.000Z', currentNow);
  const latestSessionCaptureAt = getLatestSessionCaptureAt(db);
  const projects = listProjectCoverage(db);
  const recentTasks = listCompletedTasksInWindow(db, daysAgoIso(30, currentNow), currentNow);

  let matchedRecentTaskCount = 0;
  let unmatchedRecentTaskCount = 0;
  let unmatchedNoProjectSessionsCount = 0;
  let unmatchedOutsideWindowCount = 0;
  let partialCostRecentTaskCount = 0;

  const sampleUnmatchedTasks: AttributionDebugTaskItem[] = [];

  for (const task of recentTasks) {
    const summary = summarizeTaskWindow(db, task);
    const debug = getTaskAttributionDebug(db, {
      projectPath: task.projectPath,
      startedAt: task.startedAt,
      endedAt: task.endedAt ?? task.startedAt,
    });

    if (summary.totalTokens > 0) {
      matchedRecentTaskCount += 1;
    } else {
      unmatchedRecentTaskCount += 1;
      const reason = buildAttributionReason(debug, task);
      if (debug.projectSessionCount === 0) {
        unmatchedNoProjectSessionsCount += 1;
      } else {
        unmatchedOutsideWindowCount += 1;
      }

      if (sampleUnmatchedTasks.length < 5) {
        sampleUnmatchedTasks.push({
          name: task.name,
          projectPath: task.projectPath,
          endedAt: task.endedAt,
          reason,
          projectSessionCount: debug.projectSessionCount,
          windowSessionCount: debug.windowSessionCount,
          unknownCostWindowSessionCount: debug.unknownCostWindowSessionCount,
        });
      }
    }

    if (summary.hasUnknownCost) {
      partialCostRecentTaskCount += 1;
    }
  }

  const trackedProjectCount = projects.filter((item) => item.completedTaskCount > 0 || item.activeTaskCount > 0).length;
  const untrackedProjectCount = projects.filter((item) => item.completedTaskCount === 0 && item.activeTaskCount === 0).length;
  const activeProjectCount = projects.filter((item) => item.activeTaskCount > 0).length;
  const noLocalUsage = codexSummary.count === 0 && claudeSummary.count === 0;

  return {
    noLocalUsage,
    latestSessionCaptureAt,
    codexSessionCount: codexSummary.count,
    claudeSessionCount: claudeSummary.count,
    unknownCostSessionCount: codexSummary.unknownCount,
    trackedProjectCount,
    untrackedProjectCount,
    activeProjectCount,
    recentCompletedTaskCount: recentTasks.length,
    matchedRecentTaskCount,
    unmatchedRecentTaskCount,
    unmatchedNoProjectSessionsCount,
    unmatchedOutsideWindowCount,
    partialCostRecentTaskCount,
    notes: buildAttributionNotes({
      codexSessionCount: codexSummary.count,
      recentCompletedTaskCount: recentTasks.length,
      untrackedProjectCount,
      unmatchedNoProjectSessionsCount,
      unmatchedOutsideWindowCount,
      partialCostRecentTaskCount,
    }),
    onboardingSteps: buildOnboardingSteps({
      noLocalUsage,
      recentCompletedTaskCount: recentTasks.length,
      unmatchedRecentTaskCount,
      untrackedProjectCount,
    }),
    sampleUnmatchedTasks,
  };
}

export function buildAttributionDebugOutput(analysis: AttributionDebugAnalysis): string {
  const lines = [chalk.bold('Attribution Debug'), 'Last 30 Days', ''];

  if (analysis.noLocalUsage) {
    lines.push('No local AI usage found.');
    lines.push('');
    lines.push('Next Steps');
    for (const step of analysis.onboardingSteps) {
      lines.push(`- ${step}`);
    }
    return lines.join('\n');
  }

  lines.push('Coverage');
  lines.push(`- Codex sessions scanned: ${formatInteger(analysis.codexSessionCount)}`);
  lines.push(`- Claude snapshots scanned: ${formatInteger(analysis.claudeSessionCount)}`);
  lines.push(`- Latest capture: ${analysis.latestSessionCaptureAt ?? 'N/A'}`);
  lines.push(`- Tracked projects: ${formatInteger(analysis.trackedProjectCount)}`);
  lines.push(`- Projects with usage but no tasks: ${formatInteger(analysis.untrackedProjectCount)}`);
  lines.push('');
  lines.push('Recent Tasks');
  lines.push(`- Completed tasks: ${formatInteger(analysis.recentCompletedTaskCount)}`);
  lines.push(`- Matched tasks: ${formatInteger(analysis.matchedRecentTaskCount)}`);
  lines.push(`- Unmatched tasks: ${formatInteger(analysis.unmatchedRecentTaskCount)}`);
  lines.push(`- No project-path sessions: ${formatInteger(analysis.unmatchedNoProjectSessionsCount)}`);
  lines.push(`- Project sessions outside task window: ${formatInteger(analysis.unmatchedOutsideWindowCount)}`);
  lines.push(`- Partial cost coverage: ${formatInteger(analysis.partialCostRecentTaskCount)}`);
  lines.push(`- Unknown-model session count: ${formatInteger(analysis.unknownCostSessionCount)}`);

  if (analysis.notes.length > 0) {
    lines.push('');
    lines.push('Notes');
    for (const note of analysis.notes) {
      lines.push(`- ${note}`);
    }
  }

  if (analysis.sampleUnmatchedTasks.length > 0) {
    lines.push('');
    lines.push('Recent Unmatched Tasks');
    analysis.sampleUnmatchedTasks.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.name}`);
      lines.push(`   Project: ${item.projectPath}`);
      lines.push(`   Reason: ${item.reason}`);
      lines.push(`   Project Sessions: ${formatInteger(item.projectSessionCount)}`);
      lines.push(`   Window Sessions: ${formatInteger(item.windowSessionCount)}`);
    });
  }

  if (analysis.onboardingSteps.length > 0) {
    lines.push('');
    lines.push('Next Steps');
    for (const step of analysis.onboardingSteps) {
      lines.push(`- ${step}`);
    }
  }

  return lines.join('\n');
}

function buildAttributionReason(
  debug: ReturnType<typeof getTaskAttributionDebug>,
  task: Pick<TaskRecord, 'projectPath'>,
): string {
  if (debug.windowSessionCount > 0 && debug.unknownCostWindowSessionCount > 0) {
    return 'Matched Codex sessions found, but some session cost is unknown.';
  }

  if (debug.windowSessionCount > 0) {
    return 'Matched Codex sessions found in this task window.';
  }

  if (debug.projectSessionCount === 0) {
    return `No Codex sessions found for project path ${task.projectPath}.`;
  }

  return 'This project has Codex sessions, but none landed inside the task time window.';
}

function buildAttributionNotes(input: {
  codexSessionCount: number;
  recentCompletedTaskCount: number;
  untrackedProjectCount: number;
  unmatchedNoProjectSessionsCount: number;
  unmatchedOutsideWindowCount: number;
  partialCostRecentTaskCount: number;
}): string[] {
  const notes: string[] = [];
  if (input.codexSessionCount === 0) {
    notes.push('No Codex sessions have been scanned yet.');
  }
  if (input.recentCompletedTaskCount === 0) {
    notes.push('No completed tasks exist in the last 30 days, so higher-level task insights stay thin.');
  }
  if (input.untrackedProjectCount > 0) {
    notes.push(`${input.untrackedProjectCount} scanned project${input.untrackedProjectCount === 1 ? '' : 's'} still have usage without tracked tasks.`);
  }
  if (input.unmatchedNoProjectSessionsCount > 0) {
    notes.push(`${input.unmatchedNoProjectSessionsCount} recent task${input.unmatchedNoProjectSessionsCount === 1 ? '' : 's'} have no Codex sessions for the same project path.`);
  }
  if (input.unmatchedOutsideWindowCount > 0) {
    notes.push(`${input.unmatchedOutsideWindowCount} recent task${input.unmatchedOutsideWindowCount === 1 ? '' : 's'} have project sessions, but none inside the task window.`);
  }
  if (input.partialCostRecentTaskCount > 0) {
    notes.push(`${input.partialCostRecentTaskCount} recent task${input.partialCostRecentTaskCount === 1 ? '' : 's'} include unknown-model cost coverage.`);
  }
  return notes;
}

function buildOnboardingSteps(input: {
  noLocalUsage: boolean;
  recentCompletedTaskCount: number;
  unmatchedRecentTaskCount: number;
  untrackedProjectCount: number;
}): string[] {
  const steps: string[] = [];
  if (input.noLocalUsage) {
    steps.push('Run agent-roi scan to import local Codex and Claude usage first.');
    steps.push('Then run agent-roi ui --open or agent-roi debug attribution again.');
    return steps;
  }

  if (input.recentCompletedTaskCount === 0) {
    steps.push('Run agent-roi watch in an active Git repository to capture tasks automatically.');
    steps.push('Or use agent-roi task start / stop around focused work.');
  }

  if (input.untrackedProjectCount > 0) {
    steps.push('Start watch mode inside projects that already show usage but still have no tracked tasks.');
  }

  if (input.unmatchedRecentTaskCount > 0) {
    steps.push('Check whether the task project path matches the path recorded in scanned Codex sessions.');
    steps.push('Check whether the task start / stop window overlaps the session timestamps you expected.');
  }

  return steps;
}
