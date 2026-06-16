# Watch

`agent-roi watch` is a foreground watch mode for automatic task creation and stopping.

It exists to reduce manual use of:

- `agent-roi task start`
- `agent-roi task stop`

## What It Does

The command polls the current Git branch every 15 seconds.

It then maps branch state to task state:

- start a task from the current branch name
- reuse an existing active task if the branch name already matches
- stop the old task and start a new one when the branch changes
- stop the current task on `Ctrl+C`

## What It Is Not

`agent-roi watch` is:

- not a daemon
- not a background service
- not a system hook
- not cloud sync

It also does not:

- listen to prompts
- intercept Claude prompts
- read Claude or Codex conversation content
- upload data

It is local-only.

## Default Behavior

- foreground process
- 15 second polling interval
- branch name becomes task name
- `Ctrl+C` safely stops the current task

## Requirements

- must run inside a Git repository
- requires a branch
- Detached HEAD is not supported

If run outside a Git repository, it exits with:

`Not a Git repository.`

If run in Detached HEAD, it exits with:

`Detached HEAD detected.`

`Watch mode requires a branch.`

## Example Output

```text
Watching...

Project:
agent-roi

Branch:
feature_add_tariff

Task Started:
feature_add_tariff

Press Ctrl+C to stop.
```

On branch change:

```text
---

Branch changed

feature_add_tariff
↓
bugfix_login

Task Completed:
feature_add_tariff

Task Started:
bugfix_login
```

## Related Commands

- `agent-roi task`
  Manually start or stop tasks when branch-driven watch mode is not enough.
- `agent-roi report`
  Review repository-level ROI after tasks are captured.
- `agent-roi compare`
  Compare recent completed task trends after watch has collected more task history.
