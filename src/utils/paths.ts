import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

export function expandHome(inputPath: string): string {
  if (inputPath === '~') {
    return os.homedir();
  }

  if (inputPath.startsWith('~/')) {
    return path.join(os.homedir(), inputPath.slice(2));
  }

  return inputPath;
}

export function normalizeProjectPath(inputPath: string): string {
  if (/^[a-zA-Z]:[\\/]/.test(inputPath)) {
    const normalizedWindowsPath = path.win32.normalize(inputPath);
    return normalizedWindowsPath.toLowerCase();
  }

  const resolved = path.resolve(expandHome(inputPath));
  const normalized = path.normalize(resolved);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

export function ensureDirectory(targetDir: string): void {
  fs.mkdirSync(targetDir, { recursive: true });
}

export function getProjectRootDir(): string {
  const currentFilePath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFilePath), '..', '..');
}

export function getDataDir(): string {
  return path.join(getProjectRootDir(), 'data');
}

export function getDatabasePath(): string {
  return path.join(getDataDir(), 'agent-roi.db');
}

export function getCodexHome(): string {
  return path.join(os.homedir(), '.codex');
}

export function getClaudeHome(): string {
  return path.join(os.homedir(), '.claude');
}

export function getCodexSessionDir(): string {
  return path.join(getCodexHome(), 'sessions');
}

export function getCodexSessionIndexPath(): string {
  return path.join(getCodexHome(), 'session_index.jsonl');
}

export function getClaudeSessionsDir(): string {
  return path.join(getClaudeHome(), 'sessions');
}

export function getClaudeSnapshotPath(): string {
  return path.join(os.homedir(), '.claude.json');
}

export function listFilesRecursive(rootDir: string, fileFilter?: (filePath: string) => boolean): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath, fileFilter));
      continue;
    }

    if (!fileFilter || fileFilter(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}
