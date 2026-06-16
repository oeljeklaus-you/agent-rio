import Database from 'better-sqlite3';
import test from 'node:test';
import assert from 'node:assert/strict';
import { getActiveTaskForProject, initializeDatabase, listRecentTasks } from '../database/db.js';
import { startWatchSession, observeBranch, stopWatchSession } from '../commands/watch.js';
import { DetachedHeadError, GitRepositoryNotFoundError } from '../git/metrics.js';

function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  initializeDatabase(db);
  return db;
}

test('non git repository error can be handled by command layer', () => {
  const error = new GitRepositoryNotFoundError();
  assert.equal(error.message, 'Current directory is not inside a Git repository.');
});

test('start watch with branch creates task', () => {
  const db = createTestDb();
  const result = startWatchSession(db, {
    branch: 'feature_add_tariff',
    projectPath: '/workspace/agent-roi',
    startedAt: '2026-06-16T01:00:00.000Z',
  });

  assert.equal(result.state.branch, 'feature_add_tariff');
  assert.equal(result.state.activeTaskName, 'feature_add_tariff');
  assert.match(result.output, /Watching\.\.\./);
  assert.match(result.output, /Task Started:/);
  assert.ok(getActiveTaskForProject(db, '/workspace/agent-roi'));

  db.close();
});

test('branch change creates new task', () => {
  const db = createTestDb();
  const started = startWatchSession(db, {
    branch: 'feature_add_tariff',
    projectPath: '/workspace/agent-roi',
    startedAt: '2026-06-16T01:00:00.000Z',
  });

  const changed = observeBranch(db, started.state, 'bugfix_login', '2026-06-16T01:15:00.000Z');

  assert.equal(changed.state.branch, 'bugfix_login');
  assert.equal(changed.state.activeTaskName, 'bugfix_login');
  assert.match(changed.output, /Branch changed/);
  assert.match(changed.output, /Task Completed:/);
  assert.match(changed.output, /Task Started:/);
  assert.equal(listRecentTasks(db, 10).length, 2);
  assert.equal(getActiveTaskForProject(db, '/workspace/agent-roi')?.name, 'bugfix_login');

  db.close();
});

test('branch unchanged does nothing', () => {
  const db = createTestDb();
  const started = startWatchSession(db, {
    branch: 'feature_add_tariff',
    projectPath: '/workspace/agent-roi',
    startedAt: '2026-06-16T01:00:00.000Z',
  });

  const unchanged = observeBranch(db, started.state, 'feature_add_tariff', '2026-06-16T01:15:00.000Z');

  assert.equal(unchanged.state.branch, 'feature_add_tariff');
  assert.equal(unchanged.output, '');
  assert.equal(listRecentTasks(db, 10).length, 1);

  db.close();
});

test('ctrl+c stops active task', () => {
  const db = createTestDb();
  const started = startWatchSession(db, {
    branch: 'feature_add_tariff',
    projectPath: '/workspace/agent-roi',
    startedAt: '2026-06-16T01:00:00.000Z',
  });

  const output = stopWatchSession(db, started.state, '2026-06-16T01:30:00.000Z');

  assert.match(output, /Task Completed:/);
  assert.equal(getActiveTaskForProject(db, '/workspace/agent-roi'), null);

  db.close();
});

test('detached head error can be handled by command layer', () => {
  const error = new DetachedHeadError();
  assert.equal(error.message, 'Detached HEAD detected.');
});

test('existing active task reused', () => {
  const db = createTestDb();
  startWatchSession(db, {
    branch: 'feature_add_tariff',
    projectPath: '/workspace/agent-roi',
    startedAt: '2026-06-16T01:00:00.000Z',
  });

  const reused = startWatchSession(db, {
    branch: 'feature_add_tariff',
    projectPath: '/workspace/agent-roi',
    startedAt: '2026-06-16T01:05:00.000Z',
  });

  assert.match(reused.output, /Active Task:/);
  assert.equal(listRecentTasks(db, 10).length, 1);

  db.close();
});
