# Attribution

Agent ROI uses time-window-based task attribution.

That means it tries to answer:

`What AI activity happened during this task window in this project?`

It does not try to answer:

`What was the exact semantic intent of every prompt or diff?`

## Core Rule

A session is counted toward a task only when all of the following are true:

- `project_path` matches the task project
- the session timestamp falls inside the task time window
- the session is a Codex session

Claude latest snapshots are not counted in task historical attribution.

## Why This Model Exists

This model is intentionally narrow so the tool stays:

- local-first
- deterministic
- easy to explain
- easy to audit

It avoids:

- cloud state
- prompt classification
- hidden attribution heuristics

## Included Data

- Codex sessions matched by project path and task time window
- Git activity matched to the same repository and time window

## Excluded Data

- Claude latest snapshots
- AI activity outside the task time window
- sessions from a different project path
- Claude historical attribution

## What Commands Reuse This Model

The following commands reuse the same attribution foundation:

- `agent-roi task report`
- `agent-roi watch`
- `agent-roi insights`
- `agent-roi waste`
- `agent-roi recommend`
- `agent-roi leaderboard`
- `agent-roi compare`

Shared attribution rules:

- Codex task attribution only
- Claude snapshots excluded

Commands with a 30 day default window:

- Last 30 Days
- completed tasks only

These commands use that window:

- `agent-roi insights`
- `agent-roi waste`
- `agent-roi recommend`
- `agent-roi leaderboard`

`agent-roi compare` uses a different default window:

- Current Period: Last 7 Days
- Previous Period: Previous 7 Days
- completed tasks only

`agent-roi watch` does not change attribution rules.

It only automates task start / stop based on the current Git branch.

## Current Task Metrics

Task summaries and reports currently expose:

- Duration
- AI Cost
- Cost Per Hour
- Tokens
- Tokens Per Hour
- Commits
- Commits Per Hour
- Files Changed
- Files Changed Per Hour
- Cost Per Commit
- Cost Per 1000 LOC

If duration is zero, invalid, or too short to calculate reliably, per-hour metrics are shown as `N/A`.

## FAQ

### Why does a task show no cost?

Common reasons:

- no matched Codex session was found in that time window
- the matched session used a model with no local price entry
- the task started and stopped outside the session timestamps you expected

If the model has no price entry, Agent ROI marks it as `unknown_model` instead of guessing.

### Why does a task show no commit?

Task attribution and Git activity are related, but they are not the same event stream.

Possible reasons:

- work happened but was not committed yet
- changes were squashed or committed outside the task window
- the task involved review, debugging, or exploration with no final commit

### Why is Claude not counted?

Because the current product only supports Claude latest snapshot import, not reliable historical Claude task attribution.

### Why is cost different from billing?

Because Codex cost is estimated from a local pricing table.

Agent ROI is designed for ROI analysis, not invoice reconciliation.
