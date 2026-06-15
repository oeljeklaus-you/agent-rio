import { execFileSync } from 'node:child_process';
import { normalizeProjectPath } from '../utils/paths.js';

export type GitMetrics = {
  projectPath: string;
  projectName: string;
  commitCount: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
};

export class GitRepositoryNotFoundError extends Error {
  constructor() {
    super('Current directory is not inside a Git repository.');
    this.name = 'GitRepositoryNotFoundError';
  }
}

export function getGitMetricsForCurrentRepo(fromDate: Date): GitMetrics {
  const repoRoot = getGitRepoRoot();
  return getGitMetricsForRepoWindow(repoRoot, fromDate, new Date());
}

export function getGitRepoRoot(cwd = process.cwd()): string {
  return execGit(['rev-parse', '--show-toplevel'], cwd).trim();
}

export function tryGetGitRepoRoot(cwd = process.cwd()): string | null {
  try {
    return getGitRepoRoot(cwd);
  } catch (error) {
    if (error instanceof GitRepositoryNotFoundError) {
      return null;
    }

    throw error;
  }
}

export function getGitMetricsForRepoWindow(repoRoot: string, fromDate: Date, toDate: Date): GitMetrics {
  const prettySince = formatGitDateTime(fromDate);
  const prettyUntil = formatGitDateTime(toDate);
  const logOutput = execGit(
    ['log', `--since=${prettySince}`, `--until=${prettyUntil}`, '--numstat', '--format=commit:%H'],
    repoRoot,
  );

  return parseGitLogOutput(logOutput, repoRoot);
}

export function parseGitLogOutput(logOutput: string, repoRoot: string): GitMetrics {
  const normalizedRepoRoot = normalizeProjectPath(repoRoot);
  const projectName = repoRoot.split(/[\\/]/).pop() ?? repoRoot;

  const uniqueFiles = new Set<string>();
  let commitCount = 0;
  let linesAdded = 0;
  let linesRemoved = 0;

  for (const rawLine of logOutput.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith('commit:')) {
      commitCount += 1;
      continue;
    }

    const parts = line.split('\t');
    if (parts.length < 3) {
      continue;
    }

    const [addedRaw, removedRaw, filePath] = parts;
    uniqueFiles.add(filePath);

    const added = Number.parseInt(addedRaw, 10);
    const removed = Number.parseInt(removedRaw, 10);

    if (!Number.isNaN(added)) {
      linesAdded += added;
    }

    if (!Number.isNaN(removed)) {
      linesRemoved += removed;
    }
  }

  return {
    projectPath: normalizedRepoRoot,
    projectName,
    commitCount,
    filesChanged: uniqueFiles.size,
    linesAdded,
    linesRemoved,
  };
}

function execGit(args: string[], cwd = process.cwd()): string {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const stderr = error instanceof Error && 'stderr' in error ? String(error.stderr ?? '') : '';
    if (stderr.includes('not a git repository')) {
      throw new GitRepositoryNotFoundError();
    }

    throw error;
  }
}

function formatGitDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
