import chalk from 'chalk';
import {
  completeTask,
  createTask,
  getActiveTaskForProject,
  openDatabase,
  upsertGitMetric,
  type TaskRecord,
} from '../database/db.js';
import { DetachedHeadError, getCurrentGitBranch, GitRepositoryNotFoundError } from '../git/metrics.js';
import { summarizeTaskWindow, resolveTaskProjectPath } from './task.js';
import { nowIso } from '../utils/time.js';

const WATCH_INTERVAL_MS = 15_000;

type WatchState = {
  projectName: string;
  projectPath: string;
  branch: string;
  activeTaskName: string;
};

type WatchTransition = {
  state: WatchState;
  output: string;
};

export async function runWatchCommand(): Promise<void> {
  let db: ReturnType<typeof openDatabase> | null = null;
  let state: WatchState | null = null;
  let interval: NodeJS.Timeout | null = null;
  let shuttingDown = false;

  try {
    const cwd = process.cwd();
    const branch = getCurrentGitBranch(cwd);
    const projectPath = resolveTaskProjectPath(cwd);

    db = openDatabase();
    const initial = startWatchSession(db, {
      branch,
      projectPath,
    });
    state = initial.state;
    console.log(initial.output);

    const shutdown = (): void => {
      if (shuttingDown) {
        return;
      }

      shuttingDown = true;

      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      if (db && state) {
        const stopOutput = stopWatchSession(db, state);
        if (stopOutput) {
          console.log(stopOutput);
        }
      }

      db?.close();
      process.off('SIGINT', shutdown);
      process.exit(0);
    };

    process.on('SIGINT', shutdown);

    interval = setInterval(() => {
      if (!db || !state) {
        return;
      }

      try {
        const nextBranch = getCurrentGitBranch(cwd);
        const next = observeBranch(db, state, nextBranch);
        state = next.state;

        if (next.output) {
          console.log(next.output);
        }
      } catch (error) {
        if (error instanceof GitRepositoryNotFoundError) {
          console.log('Not a Git repository.');
          shutdown();
          return;
        }

        if (error instanceof DetachedHeadError) {
          console.log('Detached HEAD detected.');
          console.log('Watch mode requires a branch.');
          shutdown();
          return;
        }

        throw error;
      }
    }, WATCH_INTERVAL_MS);
  } catch (error) {
    if (error instanceof GitRepositoryNotFoundError) {
      console.log('Not a Git repository.');
      return;
    }

    if (error instanceof DetachedHeadError) {
      console.log('Detached HEAD detected.');
      console.log('Watch mode requires a branch.');
      return;
    }

    const message = error instanceof Error ? error.message : 'Unknown watch failure';
    console.error(chalk.red(`agent-roi watch failed: ${message}`));
    process.exitCode = 1;
  }
}

export function startWatchSession(
  db: ReturnType<typeof openDatabase>,
  input: {
    branch: string;
    projectPath: string;
    startedAt?: string;
  },
): WatchTransition {
  const projectName = getProjectName(input.projectPath);
  const activeTask = getActiveTaskForProject(db, input.projectPath);
  const lines = ['Watching...', '', `Project:`, projectName, '', `Branch:`, input.branch];

  if (activeTask?.name === input.branch) {
    const state = {
      projectName,
      projectPath: input.projectPath,
      branch: input.branch,
      activeTaskName: activeTask.name,
    } satisfies WatchState;

    lines.push('', 'Active Task:', activeTask.name, '', 'Press Ctrl+C to stop.');
    return {
      state,
      output: lines.join('\n'),
    };
  }

  if (activeTask) {
    completeTrackedTask(db, activeTask, input.startedAt ?? nowIso());
    lines.push('', 'Task Completed:', activeTask.name);
  }

  const task = createTask(db, {
    name: input.branch,
    projectPath: input.projectPath,
    startedAt: input.startedAt,
  });

  const state = {
    projectName,
    projectPath: input.projectPath,
    branch: input.branch,
    activeTaskName: task.name,
  } satisfies WatchState;

  lines.push('', 'Task Started:', task.name, '', 'Press Ctrl+C to stop.');

  return {
    state,
    output: lines.join('\n'),
  };
}

export function observeBranch(
  db: ReturnType<typeof openDatabase>,
  state: WatchState,
  nextBranch: string,
  observedAt = nowIso(),
): WatchTransition {
  if (nextBranch === state.branch) {
    return {
      state,
      output: '',
    };
  }

  const activeTask = getActiveTaskForProject(db, state.projectPath);
  const lines = ['---', '', 'Branch changed', '', state.branch, '↓', nextBranch];

  if (activeTask) {
    completeTrackedTask(db, activeTask, observedAt);
    lines.push('', 'Task Completed:', activeTask.name);
  }

  const task = createTask(db, {
    name: nextBranch,
    projectPath: state.projectPath,
    startedAt: observedAt,
  });

  const nextState = {
    ...state,
    branch: nextBranch,
    activeTaskName: task.name,
  } satisfies WatchState;

  lines.push('', 'Task Started:', task.name);

  return {
    state: nextState,
    output: lines.join('\n'),
  };
}

export function stopWatchSession(
  db: ReturnType<typeof openDatabase>,
  state: WatchState,
  endedAt = nowIso(),
): string {
  const activeTask = getActiveTaskForProject(db, state.projectPath);

  if (!activeTask) {
    return '';
  }

  completeTrackedTask(db, activeTask, endedAt);

  return ['Task Completed:', activeTask.name].join('\n');
}

function completeTrackedTask(
  db: ReturnType<typeof openDatabase>,
  activeTask: TaskRecord,
  endedAt: string,
): TaskRecord {
  const completedTask = completeTask(db, activeTask.id, endedAt);
  const summary = summarizeTaskWindow(db, completedTask);

  if (summary.gitMetrics.projectPath === completedTask.projectPath) {
    upsertGitMetric(db, {
      projectPath: completedTask.projectPath,
      fromDate: completedTask.startedAt,
      toDate: completedTask.endedAt ?? endedAt,
      commitCount: summary.gitMetrics.commitCount,
      filesChanged: summary.gitMetrics.filesChanged,
      linesAdded: summary.gitMetrics.linesAdded,
      linesRemoved: summary.gitMetrics.linesRemoved,
    });
  }

  return completedTask;
}

function getProjectName(projectPath: string): string {
  return projectPath.split(/[\\/]/).pop() ?? projectPath;
}

export type { WatchState, WatchTransition };
